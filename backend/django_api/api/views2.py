from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.db.models import Q, Count
from django.utils import timezone
from datetime import datetime, timedelta, time
from .models import Appointment, Patient, AcademicSchoolYear, CustomUser, DentalMedicineSupply
from .serializers import AppointmentSerializer
import logging

logger = logging.getLogger(__name__)

class AppointmentSchedulingViewSet(viewsets.ModelViewSet):
    """
    Enhanced appointment scheduling with 20 appointments per day limit and 20-minute intervals
    """
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    # Configuration constants
    MAX_APPOINTMENTS_PER_DAY = 20
    APPOINTMENT_DURATION_MINUTES = 20
    WORKING_HOURS_START = time(8, 0)  # 8:00 AM
    WORKING_HOURS_END = time(17, 0)   # 5:00 PM
    LUNCH_BREAK_START = time(12, 0)   # 12:00 PM
    LUNCH_BREAK_END = time(13, 0)     # 1:00 PM
    
    def get_queryset(self):
        """Filter appointments based on user permissions"""
        user = self.request.user
        
        try:
            if user.is_staff or user.user_type in ['staff', 'admin']:
                # Staff can see appointments based on their campus assignment
                queryset = Appointment.objects.select_related('patient', 'doctor').all()
                
                # Filter by staff's assigned campus
                if hasattr(user, 'staff_details') and user.staff_details.campus_assigned:
                    queryset = queryset.filter(campus=user.staff_details.campus_assigned)
                
            elif user.get_current_patient_profile():
                # Patients can only see their own appointments
                current_patient_profile = user.get_current_patient_profile()
                queryset = Appointment.objects.filter(patient=current_patient_profile).select_related('patient', 'doctor')
            else:
                # No profile, try to get or create one
                try:
                    current_school_year = AcademicSchoolYear.objects.get(is_current=True)
                    patient_profile, created = user.patient_profiles.get_or_create(
                        school_year=current_school_year,
                        defaults={
                            'name': f"{user.last_name}, {user.first_name}" if user.first_name and user.last_name else user.username,
                            'first_name': user.first_name or '',
                            'last_name': user.last_name or '',
                            'email': user.email,
                        }
                    )
                    queryset = Appointment.objects.filter(patient=patient_profile).select_related('patient', 'doctor')
                except AcademicSchoolYear.DoesNotExist:
                    queryset = Appointment.objects.none()
                    
        except Exception as e:
            logger.error(f"Error in get_queryset: {str(e)}")
            return Appointment.objects.none()
            
        # Apply filters from query parameters
        date_filter = self.request.query_params.get('date')
        if date_filter:
            queryset = queryset.filter(appointment_date=date_filter)
            
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        type_filter = self.request.query_params.get('type')
        if type_filter:
            queryset = queryset.filter(type=type_filter)
            
        campus_filter = self.request.query_params.get('campus')
        if campus_filter:
            queryset = queryset.filter(campus=campus_filter)
            
        return queryset.order_by('appointment_date', 'appointment_time')

    def perform_create(self, serializer):
        """Create appointment with validation and scheduling logic"""
        user = self.request.user
        
        # Check if user is blocked from booking consultations
        if user.is_blocked:
            raise PermissionDenied(f"Your account has been blocked from booking consultations. Reason: {user.block_reason or 'No reason provided'}")
        
        # Extract appointment data
        appointment_date = serializer.validated_data.get('appointment_date')
        appointment_time = serializer.validated_data.get('appointment_time')
        appointment_type = serializer.validated_data.get('type', 'medical')
        campus = serializer.validated_data.get('campus', 'a')
        
        # Validate appointment scheduling rules
        self._validate_appointment_scheduling(appointment_date, appointment_time, appointment_type, campus)
        
        # Handle staff vs patient creation
        if user.is_staff or user.user_type in ['staff', 'admin']:
            # Staff can create appointments for any patient
            serializer.save()
        else:
            # Patient creating their own appointment
            current_patient_profile = user.get_current_patient_profile()
            if current_patient_profile:
                serializer.save(patient=current_patient_profile)
            else:
                # Create patient profile if it doesn't exist
                try:
                    current_school_year = AcademicSchoolYear.objects.get(is_current=True)
                    patient_profile = Patient.objects.create(
                        user=user,
                        school_year=current_school_year,
                        name=f"{user.last_name}, {user.first_name}" if user.first_name and user.last_name else user.username,
                        first_name=user.first_name or '',
                        last_name=user.last_name or '',
                        email=user.email,
                    )
                    serializer.save(patient=patient_profile)
                except AcademicSchoolYear.DoesNotExist:
                    raise ValidationError("No active school year found. Please contact administration.")

    def _validate_appointment_scheduling(self, appointment_date, appointment_time, appointment_type, campus):
        """Validate appointment scheduling rules"""
        
        # 1. Check if date is in the future (at least next day)
        today = timezone.now().date()
        if appointment_date <= today:
            raise ValidationError("Appointments must be scheduled for future dates (at least tomorrow).")
        
        # 2. Check if date is not too far in the future (max 30 days)
        max_future_date = today + timedelta(days=30)
        if appointment_date > max_future_date:
            raise ValidationError("Appointments cannot be scheduled more than 30 days in advance.")
        
        # 3. Check if it's a weekday (Monday to Friday)
        if appointment_date.weekday() >= 5:  # 5 = Saturday, 6 = Sunday
            raise ValidationError("Appointments can only be scheduled on weekdays (Monday to Friday).")
        
        # 4. Check working hours
        if not (self.WORKING_HOURS_START <= appointment_time <= self.WORKING_HOURS_END):
            raise ValidationError(f"Appointments must be scheduled between {self.WORKING_HOURS_START.strftime('%H:%M')} and {self.WORKING_HOURS_END.strftime('%H:%M')}.")
        
        # 5. Check lunch break
        if self.LUNCH_BREAK_START <= appointment_time < self.LUNCH_BREAK_END:
            raise ValidationError(f"Appointments cannot be scheduled during lunch break ({self.LUNCH_BREAK_START.strftime('%H:%M')} - {self.LUNCH_BREAK_END.strftime('%H:%M')}).")
        
        # 6. Check if time slot is valid (20-minute intervals)
        if not self._is_valid_time_slot(appointment_time):
            raise ValidationError("Appointments must be scheduled in 20-minute intervals starting from 8:00 AM.")
        
        # 7. Check daily appointment limit
        daily_appointments_count = Appointment.objects.filter(
            appointment_date=appointment_date,
            campus=campus,
            status__in=['pending', 'confirmed', 'scheduled']
        ).count()
        
        if daily_appointments_count >= self.MAX_APPOINTMENTS_PER_DAY:
            raise ValidationError(f"Maximum {self.MAX_APPOINTMENTS_PER_DAY} appointments per day has been reached for {appointment_date}.")
        
        # 8. Check if specific time slot is available
        existing_appointment = Appointment.objects.filter(
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            campus=campus,
            status__in=['pending', 'confirmed', 'scheduled']
        ).exists()
        
        if existing_appointment:
            raise ValidationError(f"Time slot {appointment_time.strftime('%H:%M')} is already booked for {appointment_date}.")
    
    def _is_valid_time_slot(self, appointment_time):
        """Check if the time is a valid 20-minute interval slot"""
        # Convert time to minutes since midnight
        time_minutes = appointment_time.hour * 60 + appointment_time.minute
        
        # Working hours in minutes
        start_minutes = self.WORKING_HOURS_START.hour * 60 + self.WORKING_HOURS_START.minute
        end_minutes = self.WORKING_HOURS_END.hour * 60 + self.WORKING_HOURS_END.minute
        lunch_start_minutes = self.LUNCH_BREAK_START.hour * 60 + self.LUNCH_BREAK_START.minute
        lunch_end_minutes = self.LUNCH_BREAK_END.hour * 60 + self.LUNCH_BREAK_END.minute
        
        # Check if time is within working hours and not during lunch
        if not (start_minutes <= time_minutes <= end_minutes):
            return False
        
        if lunch_start_minutes <= time_minutes < lunch_end_minutes:
            return False
        
        # Check if it's a valid 20-minute interval
        # Calculate offset from start of working day
        offset_from_start = time_minutes - start_minutes
        
        # If it's after lunch, subtract lunch break duration
        if time_minutes >= lunch_end_minutes:
            offset_from_start -= (lunch_end_minutes - lunch_start_minutes)
        
        # Check if it's divisible by 20 minutes
        return offset_from_start % self.APPOINTMENT_DURATION_MINUTES == 0

    @action(detail=False, methods=['get'])
    def available_slots(self, request):
        """Get available time slots for a specific date and campus"""
        date_str = request.query_params.get('date')
        campus = request.query_params.get('campus', 'a')
        appointment_type = request.query_params.get('type', 'medical')
        
        if not date_str:
            return Response(
                {'error': 'Date parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            appointment_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all possible time slots
        all_slots = self._generate_time_slots()
        
        # Get booked slots for the date
        booked_slots = set(
            Appointment.objects.filter(
                appointment_date=appointment_date,
                campus=campus,
                status__in=['pending', 'confirmed', 'scheduled']
            ).values_list('appointment_time', flat=True)
        )
        
        # Filter available slots
        available_slots = []
        for slot_time in all_slots:
            if slot_time not in booked_slots:
                # Check if we haven't reached daily limit
                daily_count = len(booked_slots)
                if daily_count < self.MAX_APPOINTMENTS_PER_DAY:
                    available_slots.append({
                        'time': slot_time.strftime('%H:%M'),
                        'display': slot_time.strftime('%I:%M %p')
                    })
        
        return Response({
            'date': date_str,
            'campus': campus,
            'available_slots': available_slots,
            'total_slots': len(all_slots),
            'booked_slots': len(booked_slots),
            'remaining_slots': len(available_slots),
            'daily_limit': self.MAX_APPOINTMENTS_PER_DAY
        })

    def _generate_time_slots(self):
        """Generate all possible 20-minute time slots within working hours"""
        slots = []
        current_time = datetime.combine(datetime.today(), self.WORKING_HOURS_START)
        end_time = datetime.combine(datetime.today(), self.WORKING_HOURS_END)
        lunch_start = datetime.combine(datetime.today(), self.LUNCH_BREAK_START)
        lunch_end = datetime.combine(datetime.today(), self.LUNCH_BREAK_END)
        
        while current_time.time() < end_time.time():
            # Skip lunch break
            if not (lunch_start.time() <= current_time.time() < lunch_end.time()):
                slots.append(current_time.time())
            
            current_time += timedelta(minutes=self.APPOINTMENT_DURATION_MINUTES)
        
        return slots

    @action(detail=False, methods=['get'])
    def daily_schedule(self, request):
        """Get the full daily schedule with booked and available slots"""
        date_str = request.query_params.get('date')
        campus = request.query_params.get('campus', 'a')
        
        if not date_str:
            return Response(
                {'error': 'Date parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            appointment_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get all time slots
        all_slots = self._generate_time_slots()
        
        # Get appointments for the day
        appointments = Appointment.objects.filter(
            appointment_date=appointment_date,
            campus=campus,
            status__in=['pending', 'confirmed', 'scheduled']
        ).select_related('patient').order_by('appointment_time')
        
        # Create schedule
        schedule = []
        appointment_dict = {appt.appointment_time: appt for appt in appointments}
        
        for slot_time in all_slots:
            slot_data = {
                'time': slot_time.strftime('%H:%M'),
                'display_time': slot_time.strftime('%I:%M %p'),
                'is_available': slot_time not in appointment_dict,
            }
            
            if slot_time in appointment_dict:
                appointment = appointment_dict[slot_time]
                slot_data.update({
                    'appointment_id': appointment.id,
                    'patient_name': appointment.patient.name,
                    'type': appointment.type,
                    'status': appointment.status,
                    'purpose': appointment.purpose
                })
            
            schedule.append(slot_data)
        
        return Response({
            'date': date_str,
            'campus': campus,
            'schedule': schedule,
            'total_slots': len(all_slots),
            'booked_slots': len(appointments),
            'available_slots': len(all_slots) - len(appointments),
            'daily_limit': self.MAX_APPOINTMENTS_PER_DAY,
            'working_hours': {
                'start': self.WORKING_HOURS_START.strftime('%H:%M'),
                'end': self.WORKING_HOURS_END.strftime('%H:%M'),
                'lunch_break': f"{self.LUNCH_BREAK_START.strftime('%H:%M')} - {self.LUNCH_BREAK_END.strftime('%H:%M')}"
            }
        })

    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """Reschedule an appointment with validation"""
        appointment = self.get_object()
        user = request.user
        
        # Check permissions
        if not (user.is_staff or user.user_type in ['staff', 'admin'] or 
                appointment.patient.user == user):
            raise PermissionDenied("You don't have permission to reschedule this appointment.")
        
        # Get reschedule data
        new_date = request.data.get('appointment_date')
        new_time = request.data.get('appointment_time')
        reason = request.data.get('reschedule_reason', '')
        
        if not new_date or not new_time:
            return Response(
                {'error': 'Both appointment_date and appointment_time are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Parse date and time
            new_date_obj = datetime.strptime(new_date, '%Y-%m-%d').date()
            new_time_obj = datetime.strptime(new_time, '%H:%M').time()
            
            # Validate the new slot (excluding current appointment)
            temp_appointment_id = appointment.id
            appointment.id = None  # Temporarily remove ID to exclude from validation
            
            try:
                self._validate_appointment_scheduling(
                    new_date_obj, new_time_obj, 
                    appointment.type, appointment.campus
                )
            finally:
                appointment.id = temp_appointment_id  # Restore ID
            
            # Use the model method to reschedule
            appointment.reschedule_appointment(
                new_date=new_date_obj,
                new_time=new_time_obj,
                rescheduled_by=user,
                reason=reason
            )
            
            # If rescheduled by patient, set status to pending for admin approval
            if appointment.patient.user == user:
                appointment.status = 'pending'
                appointment.save()
            
            return Response(
                AppointmentSerializer(appointment).data,
                status=status.HTTP_200_OK
            )
            
        except ValueError as e:
            return Response(
                {'error': f'Invalid date or time format: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to reschedule appointment: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def booking_stats(self, request):
        """Get booking statistics for dashboard"""
        campus = request.query_params.get('campus', 'a')
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        
        # Base queryset
        queryset = Appointment.objects.filter(campus=campus)
        
        # Apply date filters if provided
        if date_from:
            try:
                date_from_obj = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(appointment_date__gte=date_from_obj)
            except ValueError:
                pass
                
        if date_to:
            try:
                date_to_obj = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(appointment_date__lte=date_to_obj)
            except ValueError:
                pass
        
        # Calculate statistics
        total_appointments = queryset.count()
        status_counts = queryset.values('status').annotate(count=Count('status'))
        type_counts = queryset.values('type').annotate(count=Count('type'))
        
        # Daily utilization
        daily_stats = queryset.values('appointment_date').annotate(
            count=Count('id')
        ).order_by('appointment_date')
        
        return Response({
            'campus': campus,
            'total_appointments': total_appointments,
            'daily_limit': self.MAX_APPOINTMENTS_PER_DAY,
            'status_breakdown': {item['status']: item['count'] for item in status_counts},
            'type_breakdown': {item['type']: item['count'] for item in type_counts},
            'daily_utilization': [
                {
                    'date': item['appointment_date'].strftime('%Y-%m-%d'),
                    'appointments': item['count'],
                    'utilization_percentage': round((item['count'] / self.MAX_APPOINTMENTS_PER_DAY) * 100, 2)
                }
                for item in daily_stats
            ],
            'appointment_duration_minutes': self.APPOINTMENT_DURATION_MINUTES,
            'working_hours': {
                'start': self.WORKING_HOURS_START.strftime('%H:%M'),
                'end': self.WORKING_HOURS_END.strftime('%H:%M'),
                'lunch_break': f"{self.LUNCH_BREAK_START.strftime('%H:%M')} - {self.LUNCH_BREAK_END.strftime('%H:%M')}"
            }
        })

class DentalMedicineSupplyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing dental medicines and supplies
    """
    queryset = DentalMedicineSupply.objects.filter(is_active=True)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        # We'll create a simple inline serializer for now
        from rest_framework import serializers
        
        class DentalMedicineSupplySerializer(serializers.ModelSerializer):
            type_display = serializers.CharField(source='get_type_display', read_only=True)
            
            class Meta:
                model = DentalMedicineSupply
                fields = ['id', 'name', 'type', 'type_display', 'description', 'unit', 'is_active']
        
        return DentalMedicineSupplySerializer
    
    def get_queryset(self):
        """Filter based on user permissions"""
        user = self.request.user
        
        # Only staff/admin can manage medicines
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            # Regular users can only view active items
            return DentalMedicineSupply.objects.filter(is_active=True)
        
        # Staff can see all items
        include_inactive = self.request.query_params.get('include_inactive', 'false').lower() == 'true'
        if include_inactive:
            return DentalMedicineSupply.objects.all()
        else:
            return DentalMedicineSupply.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        """Only staff can create new items"""
        user = self.request.user
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can create medicine/supply items.")
        serializer.save()
    
    def perform_update(self, serializer):
        """Only staff can update items"""
        user = self.request.user
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can update medicine/supply items.")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only staff can delete items (soft delete by marking inactive)"""
        user = self.request.user
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can delete medicine/supply items.")
        
        # Soft delete by marking as inactive
        instance.is_active = False
        instance.save()
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get medicines/supplies grouped by type"""
        type_filter = request.query_params.get('type')
        queryset = self.get_queryset()
        
        if type_filter:
            queryset = queryset.filter(type=type_filter)
        
        # Group by type
        results = {}
        for item in queryset:
            if item.type not in results:
                results[item.type] = {
                    'type': item.type,
                    'type_display': item.get_type_display(),
                    'items': []
                }
            results[item.type]['items'].append({
                'id': item.id,
                'name': item.name,
                'description': item.description,
                'unit': item.unit,
                'is_active': item.is_active
            })
        
        return Response({
            'types': list(results.values()),
            'type_choices': DentalMedicineSupply.TYPE_CHOICES
        })
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Create multiple items at once (staff only)"""
        user = self.request.user
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can bulk create items.")
        
        items_data = request.data.get('items', [])
        if not items_data:
            return Response({'error': 'No items provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        created_items = []
        errors = []
        
        for item_data in items_data:
            try:
                serializer = self.get_serializer_class()(data=item_data)
                if serializer.is_valid():
                    item = serializer.save()
                    created_items.append(serializer.data)
                else:
                    errors.append({'data': item_data, 'errors': serializer.errors})
            except Exception as e:
                errors.append({'data': item_data, 'errors': str(e)})
        
        return Response({
            'created_items': created_items,
            'errors': errors,
            'success_count': len(created_items),
            'error_count': len(errors)
        })
    
    @action(detail=False, methods=['post'])
    def populate_samples(self, request):
        """Populate with sample dental medicines and supplies (staff only)"""
        user = self.request.user
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can populate sample data.")
        
        sample_items = [
            # Anesthetics
            {'name': 'Lidocaine 2%', 'type': 'anesthetic', 'description': 'Local anesthetic for dental procedures', 'unit': 'ml'},
            {'name': 'Articaine 4%', 'type': 'anesthetic', 'description': 'Local anesthetic with epinephrine', 'unit': 'ml'},
            {'name': 'Benzocaine gel', 'type': 'anesthetic', 'description': 'Topical anesthetic gel', 'unit': 'g'},
            
            # Antibiotics
            {'name': 'Amoxicillin 500mg', 'type': 'antibiotic', 'description': 'Antibiotic for dental infections', 'unit': 'capsule'},
            {'name': 'Clindamycin 300mg', 'type': 'antibiotic', 'description': 'Alternative antibiotic for penicillin-allergic patients', 'unit': 'capsule'},
            {'name': 'Metronidazole 400mg', 'type': 'antibiotic', 'description': 'Antibiotic for anaerobic infections', 'unit': 'tablet'},
            
            # Pain medications
            {'name': 'Ibuprofen 400mg', 'type': 'medicine', 'description': 'Anti-inflammatory pain reliever', 'unit': 'tablet'},
            {'name': 'Paracetamol 500mg', 'type': 'medicine', 'description': 'Pain reliever and fever reducer', 'unit': 'tablet'},
            {'name': 'Mefenamic acid 250mg', 'type': 'medicine', 'description': 'NSAID for pain relief', 'unit': 'capsule'},
            
            # Dental supplies
            {'name': 'Composite resin', 'type': 'dental_supply', 'description': 'Tooth-colored filling material', 'unit': 'syringe'},
            {'name': 'Dental amalgam', 'type': 'dental_supply', 'description': 'Silver filling material', 'unit': 'capsule'},
            {'name': 'Fluoride varnish', 'type': 'dental_supply', 'description': 'Topical fluoride treatment', 'unit': 'ml'},
            {'name': 'Dental cement', 'type': 'dental_supply', 'description': 'Temporary filling material', 'unit': 'g'},
            
            # Materials
            {'name': 'Cotton rolls', 'type': 'material', 'description': 'Absorbent cotton for isolation', 'unit': 'pcs'},
            {'name': 'Gauze pads', 'type': 'material', 'description': 'Sterile gauze for bleeding control', 'unit': 'pcs'},
            {'name': 'Disposable gloves', 'type': 'material', 'description': 'Latex-free examination gloves', 'unit': 'pair'},
            {'name': 'Dental floss', 'type': 'material', 'description': 'Waxed dental floss', 'unit': 'pack'},
            
            # Equipment/Instruments
            {'name': 'Dental probe', 'type': 'equipment', 'description': 'Periodontal probe for examination', 'unit': 'pcs'},
            {'name': 'Dental mirror', 'type': 'equipment', 'description': 'Mouth mirror for examination', 'unit': 'pcs'},
            {'name': 'Dental scaler', 'type': 'equipment', 'description': 'Hand scaler for cleaning', 'unit': 'pcs'},
        ]
        
        created_count = 0
        existing_count = 0
        
        for item_data in sample_items:
            # Check if item already exists
            if not DentalMedicineSupply.objects.filter(name=item_data['name'], type=item_data['type']).exists():
                DentalMedicineSupply.objects.create(**item_data)
                created_count += 1
            else:
                existing_count += 1
        
        return Response({
            'message': f'Sample data populated successfully. Created {created_count} new items, {existing_count} already existed.',
            'created_count': created_count,
            'existing_count': existing_count,
            'total_samples': len(sample_items)
        })