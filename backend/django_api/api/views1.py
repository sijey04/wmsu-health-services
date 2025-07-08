from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from django.shortcuts import get_object_or_404
from django.utils import timezone
from .models import MedicalFormData, Appointment, Patient, AcademicSchoolYear, StaffDetails
from .serializers import MedicalFormDataSerializer, PatientSerializer, PatientProfileUpdateSerializer


class MedicalFormDataViewSet(viewsets.ModelViewSet):
    """ViewSet for managing medical form data"""
    queryset = MedicalFormData.objects.all()
    serializer_class = MedicalFormDataSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = MedicalFormData.objects.all()
        
        # If user is a patient, only show their own forms
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            patient_profiles = user.patient_profiles.all()
            queryset = queryset.filter(patient__in=patient_profiles)
        
        return queryset.select_related('patient', 'appointment').order_by('-created_at')

    def perform_create(self, serializer):
        """Set patient and appointment when creating medical form"""
        user = self.request.user
        
        # If user is staff, they can create forms for any patient
        if user.is_staff or user.user_type in ['staff', 'admin']:
            serializer.save()
            return
        
        # If user is a patient, they can only create forms for themselves
        patient = serializer.validated_data.get('patient')
        if patient and patient.user == user:
            serializer.save()
        else:
            # Get current patient profile if not specified
            current_patient_profile = user.get_current_patient_profile()
            if current_patient_profile:
                serializer.save(patient=current_patient_profile)
            else:
                raise PermissionDenied("No patient profile found")

    @action(detail=False, methods=['get'])
    def get_patient_data(self, request):
        """Get patient data for medical form initialization"""
        appointment_id = request.query_params.get('appointment_id')
        patient_id = request.query_params.get('patient_id')
        
        if not appointment_id and not patient_id:
            return Response({'error': 'appointment_id or patient_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if appointment_id:
                appointment = Appointment.objects.get(id=appointment_id)
                patient = appointment.patient
            else:
                patient = Patient.objects.get(id=patient_id)
                appointment = None
            
            # Get current user info for staff fields
            user = request.user
            current_date = timezone.now().date()
            
            # Calculate suggested follow-up date (1 week from examination)
            from datetime import timedelta
            suggested_followup_date = current_date + timedelta(days=7)
            
            # Get examiner details from staff details if available
            examiner_license = ''
            examiner_name = ''
            
            if hasattr(user, 'staff_details') and user.staff_details:
                examiner_license = user.staff_details.license_number or ''
                examiner_name = user.staff_details.full_name or ''
            
            # Fallback to user model if staff details not available
            if not examiner_name:
                examiner_name = f"{user.first_name} {user.last_name}".strip() if user.first_name or user.last_name else user.username
            
            # Extract surname from name field (assuming format "Surname, First Name")
            surname = ''
            first_name = ''
            middle_name = ''
            
            if patient.name:
                if ',' in patient.name:
                    name_parts = patient.name.split(',')
                    surname = name_parts[0].strip()
                    if len(name_parts) > 1:
                        remaining_name = name_parts[1].strip()
                        name_parts_remaining = remaining_name.split()
                        if name_parts_remaining:
                            first_name = name_parts_remaining[0]
                        if len(name_parts_remaining) > 1:
                            middle_name = ' '.join(name_parts_remaining[1:])
                else:
                    # If no comma, try to split by spaces
                    name_parts = patient.name.split()
                    if name_parts:
                        surname = name_parts[-1]  # Last part as surname
                        if len(name_parts) > 1:
                            first_name = name_parts[0]
                        if len(name_parts) > 2:
                            middle_name = ' '.join(name_parts[1:-1])
            
            # Use individual name fields if available
            if patient.first_name:
                first_name = patient.first_name
            if patient.middle_name:
                middle_name = patient.middle_name
            
            data = {
                'patient_id': patient.id,
                'file_no': patient.student_id or '',
                'surname': surname,
                'first_name': first_name,
                'middle_name': middle_name,
                'age': patient.age or '',
                'sex': patient.gender or 'Male',
                'department': patient.department or '',
                'contact': patient.contact_number or '',
                'examined_by': examiner_name,
                'examiner_name': examiner_name,
                'license_number': examiner_license,
                'examiner_license': examiner_license,
                'date': current_date.strftime('%Y-%m-%d'),
                'follow_up_date': suggested_followup_date.strftime('%Y-%m-%d'),
                'suggested_followup_date': suggested_followup_date.strftime('%Y-%m-%d'),
                'follow_up_instructions': 'Return for follow-up consultation as needed.',
                'suggested_followup_instructions': 'Return for follow-up consultation as needed.',
                # Additional patient data that might be useful for medical forms
                'blood_type': patient.blood_type or '',
                'address': getattr(patient, 'address', '') or '',
                'email': patient.email or patient.user.email if patient.user else '',
                'emergency_contact_name': f"{getattr(patient, 'emergency_contact_first_name', '') or ''} {getattr(patient, 'emergency_contact_surname', '') or ''}".strip(),
                'emergency_contact_number': getattr(patient, 'emergency_contact_number', '') or '',
                'comorbid_illnesses': patient.comorbid_illnesses or [],
                'maintenance_medications': patient.maintenance_medications or [],
                'past_medical_history': patient.past_medical_history or [],
                'family_medical_history': patient.family_medical_history or [],
            }
            
            return Response(data)
        except (Appointment.DoesNotExist, Patient.DoesNotExist):
            return Response({'error': 'Appointment or Patient not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def by_appointment(self, request):
        """Get medical form by appointment ID"""
        appointment_id = request.query_params.get('appointment_id')
        
        if not appointment_id:
            return Response({'error': 'appointment_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            medical_form = MedicalFormData.objects.get(appointment_id=appointment_id)
            serializer = self.get_serializer(medical_form)
            return Response(serializer.data)
        except MedicalFormData.DoesNotExist:
            return Response({'error': 'Medical form not found for this appointment'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def submit_and_complete(self, request):
        """Submit medical form and complete appointment"""
        try:
            # Create the medical form
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                medical_form = serializer.save()
                
                # Update appointment status to completed if appointment ID is provided
                appointment_id = request.data.get('appointment')
                if appointment_id:
                    try:
                        appointment = Appointment.objects.get(id=appointment_id)
                        appointment.status = 'completed'
                        appointment.save()
                    except Appointment.DoesNotExist:
                        pass  # Don't fail if appointment doesn't exist
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PatientViewSet(viewsets.ModelViewSet):
    """ViewSet for managing patient profiles"""
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = Patient.objects.all()
        
        # If user is a patient, only show their own profiles
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            queryset = queryset.filter(user=user)
        
        # Filter by school year if specified
        school_year_param = self.request.query_params.get('school_year')
        if school_year_param:
            try:
                queryset = queryset.filter(school_year_id=int(school_year_param))
            except (ValueError, TypeError):
                pass
        
        return queryset.select_related('user', 'school_year').order_by('-created_at')

    def perform_create(self, serializer):
        """Set user when creating patient profile"""
        user = self.request.user
        
        # If user is staff, they can create profiles for any user
        if user.is_staff or user.user_type in ['staff', 'admin']:
            serializer.save()
            return
        
        # If user is a patient, they can only create profiles for themselves
        serializer.save(user=user)

    def perform_update(self, serializer):
        """Update patient profile with proper permissions"""
        user = self.request.user
        instance = self.get_object()
        
        # Staff can update any profile
        if user.is_staff or user.user_type in ['staff', 'admin']:
            serializer.save()
            return
        
        # Patients can only update their own profiles
        if instance.user == user:
            serializer.save()
        else:
            raise PermissionDenied("You can only update your own profile")

    def perform_destroy(self, instance):
        """Delete patient profile with proper permissions"""
        user = self.request.user
        
        # Staff can delete any profile
        if user.is_staff or user.user_type in ['staff', 'admin']:
            instance.delete()
            return
        
        # Patients can only delete their own profiles
        if instance.user == user:
            instance.delete()
        else:
            raise PermissionDenied("You can only delete your own profile")

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get current user's patient profile for the current school year"""
        user = request.user
        
        try:
            # Get current school year
            current_school_year = AcademicSchoolYear.objects.get(is_current=True)
            
            # Get or create patient profile for current school year
            patient_profile, created = user.get_or_create_patient_profile(current_school_year)
            
            serializer = self.get_serializer(patient_profile)
            return Response(serializer.data)
        except AcademicSchoolYear.DoesNotExist:
            return Response({'error': 'No current school year found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def my_profiles(self, request):
        """Get all patient profiles for the current user across all school years"""
        user = request.user
        
        profiles = Patient.objects.filter(user=user).select_related('school_year').order_by('-school_year__is_current', '-created_at')
        serializer = self.get_serializer(profiles, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_my_profile(self, request):
        """Create or update patient profile for current user"""
        user = request.user
        
        try:
            # Get current school year
            current_school_year = AcademicSchoolYear.objects.get(is_current=True)
            
            # Check if profile already exists for current school year
            existing_profile = Patient.objects.filter(
                user=user, 
                school_year=current_school_year
            ).first()
            
            if existing_profile:
                # Update existing profile
                serializer = PatientProfileUpdateSerializer(existing_profile, data=request.data, partial=True)
            else:
                # Create new profile
                data = request.data.copy()
                data['school_year'] = current_school_year.id
                serializer = PatientProfileUpdateSerializer(data=data)
            
            if serializer.is_valid():
                patient_profile = serializer.save(user=user)
                response_serializer = self.get_serializer(patient_profile)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED if not existing_profile else status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except AcademicSchoolYear.DoesNotExist:
            return Response({'error': 'No current school year found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def all_profiles(self, request, pk=None):
        """Get all profiles for a specific patient across all school years"""
        patient = self.get_object()
        
        # Only allow staff or the patient themselves to view all profiles
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin'] or patient.user == request.user):
            raise PermissionDenied("You can only view your own profiles")
        
        all_profiles = Patient.objects.filter(user=patient.user).select_related('school_year').order_by('-school_year__is_current', '-created_at')
        serializer = self.get_serializer(all_profiles, many=True)
        return Response(serializer.data)