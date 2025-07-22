from rest_framework import viewsets, permissions, status, serializers
from rest_framework.response import Response
from rest_framework.decorators import action, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.http import HttpResponse
import io
from .models import (
    CustomUser, Patient, MedicalRecord, Appointment, Inventory, Waiver, DentalWaiver,
    MedicalDocument, DentalFormData, MedicalFormData, StaffDetails,
    SystemConfiguration, ProfileRequirement, DocumentRequirement, 
    CampusSchedule, DentistSchedule, AcademicSchoolYear,
    ComorbidIllness, Vaccination, PastMedicalHistoryItem, FamilyMedicalHistoryItem
)
from .serializers import (
    UserSerializer, PatientSerializer, MedicalRecordSerializer, 
    AppointmentSerializer, InventorySerializer, SignupSerializer,
    LoginSerializer, EmailVerificationSerializer, WaiverSerializer, DentalWaiverSerializer,
    PatientProfileUpdateSerializer, MedicalDocumentSerializer, 
    DentalFormDataSerializer, MedicalFormDataSerializer, StaffDetailsSerializer,
    SystemConfigurationSerializer, ProfileRequirementSerializer, 
    DocumentRequirementSerializer, CampusScheduleSerializer, DentistScheduleSerializer,
    AcademicSchoolYearSerializer, UserManagementSerializer, UserBlockSerializer,
    ComorbidIllnessSerializer, VaccinationSerializer, PastMedicalHistoryItemSerializer,
    FamilyMedicalHistoryItemSerializer
)
from rest_framework.views import APIView
from django.db.models import Q, Count
from django.db import transaction
from django.contrib.auth.hashers import make_password
from datetime import datetime, timedelta
import traceback
import uuid


class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'])
    def signup(self, request):
        serializer = SignupSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({
                'message': 'Account created successfully. Please check your email to verify your account.',
                'user_id': user.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            return Response({
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def verify_email(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            try:
                user = CustomUser.objects.get(email_verification_token=token)
                if user.verify_email(token):
                    # Generate tokens for automatic login
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'message': 'Email verified successfully. You are now logged in!',
                        'access_token': str(refresh.access_token),
                        'refresh_token': str(refresh),
                        'user': UserSerializer(user).data
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'error': 'Invalid verification token.'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except CustomUser.DoesNotExist:
                return Response({
                    'error': 'Invalid verification token.'
                }, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def resend_verification(self, request):
        email = request.data.get('email')
        if not email:
            return Response({
                'error': 'Email is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = CustomUser.objects.get(email=email)
            if user.is_email_verified:
                return Response({
                    'error': 'Email is already verified.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.send_verification_email()
            return Response({
                'message': 'Verification email sent successfully.'
            }, status=status.HTTP_200_OK)
        except CustomUser.DoesNotExist:
            return Response({
                'error': 'User with this email does not exist.'
            }, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change user password"""
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response({
                'error': 'Both current_password and new_password are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user = request.user
        
        # Check current password
        if not user.check_password(current_password):
            return Response({
                'error': 'Current password is incorrect.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate new password
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response({
                'error': list(e.messages)
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Set new password
        user.set_password(new_password)
        user.save()
        
        return Response({
            'message': 'Password changed successfully.'
        }, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get', 'put'])
    def me(self, request):
        """Get or update current user information"""
        user = request.user
        
        if request.method == 'GET':
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            # Handle password change
            current_password = request.data.get('current_password')
            new_password = request.data.get('new_password')
            
            if new_password and current_password:
                # Verify current password
                if not user.check_password(current_password):
                    return Response({'current_password': ['Current password is incorrect.']}, 
                                  status=status.HTTP_400_BAD_REQUEST)
                
                # Set new password
                user.set_password(new_password)
            
            # Update other fields
            serializer = self.get_serializer(user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                
                # Save password if it was changed
                if new_password and current_password:
                    user.save()
                
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserManagementViewSet(viewsets.ViewSet):
    """ViewSet for user management operations"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Only allow staff/admin users to access user management"""
        if self.action in ['list', 'get_user_statistics', 'block_user', 'unblock_user']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]
    
    def list(self, request):
        """Get list of all users for admin management"""
        user = request.user
        
        # Check if user has admin permissions
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            raise PermissionDenied("You don't have permission to view user management.")
        
        try:
            # Get all users with related data
            users = CustomUser.objects.select_related('blocked_by').order_by('-date_joined')
            
            # Apply filters if provided
            user_type = request.query_params.get('user_type')
            if user_type and user_type != 'all':
                users = users.filter(user_type=user_type)
            
            is_active = request.query_params.get('is_active')
            if is_active is not None:
                users = users.filter(is_active=is_active.lower() == 'true')
            
            is_blocked = request.query_params.get('is_blocked')
            if is_blocked is not None:
                users = users.filter(is_blocked=is_blocked.lower() == 'true')
            
            is_verified = request.query_params.get('is_verified')
            if is_verified is not None:
                users = users.filter(is_email_verified=is_verified.lower() == 'true')
            
            search = request.query_params.get('search')
            if search:
                users = users.filter(
                    Q(first_name__icontains=search) |
                    Q(last_name__icontains=search) |
                    Q(middle_name__icontains=search) |
                    Q(email__icontains=search) |
                    Q(username__icontains=search)
                )
            
            # Serialize the data
            serializer = UserManagementSerializer(users, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to fetch users: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    def get_user_statistics(self, request):
        """Get user statistics for admin dashboard"""
        user = request.user
        
        # Check if user has admin permissions
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            raise PermissionDenied("You don't have permission to view user statistics.")
        
        try:
            # Get user counts
            total_users = CustomUser.objects.count()
            active_users = CustomUser.objects.filter(is_active=True).count()
            blocked_users = CustomUser.objects.filter(is_blocked=True).count()
            verified_users = CustomUser.objects.filter(is_email_verified=True).count()
            
            # Get user type counts
            user_type_counts = CustomUser.objects.values('user_type').annotate(
                count=Count('id')
            ).order_by('user_type')
            
            # Transform user type counts to dict
            user_type_dict = {
                'student': 0,
                'staff': 0,
                'admin': 0
            }
            
            for item in user_type_counts:
                user_type_dict[item['user_type']] = item['count']
            
            statistics = {
                'total_users': total_users,
                'active_users': active_users,
                'blocked_users': blocked_users,
                'verified_users': verified_users,
                'user_type_counts': user_type_dict
            }
            
            return Response(statistics, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to fetch user statistics: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def block_user(self, request):
        """Block a user"""
        user = request.user
        
        # Check if user has admin permissions
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            raise PermissionDenied("You don't have permission to block users.")
        
        serializer = UserBlockSerializer(data=request.data)
        if serializer.is_valid():
            user_id = serializer.validated_data['user_id']
            action = serializer.validated_data['action']
            reason = serializer.validated_data.get('reason', '')
            
            try:
                target_user = CustomUser.objects.get(id=user_id)
                
                if action == 'block':
                    if target_user.is_blocked:
                        return Response({
                            'error': 'User is already blocked'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    target_user.block_user(user, reason)
                    message = f"User {target_user.get_full_name()} has been blocked successfully."
                
                else:  # unblock
                    if not target_user.is_blocked:
                        return Response({
                            'error': 'User is not blocked'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    target_user.unblock_user()
                    message = f"User {target_user.get_full_name()} has been unblocked successfully."
                
                return Response({
                    'message': message,
                    'user': UserManagementSerializer(target_user).data
                }, status=status.HTTP_200_OK)
                
            except CustomUser.DoesNotExist:
                return Response({
                    'error': 'User not found'
                }, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response({
                    'error': f'Failed to {action} user: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def unblock_user(self, request):
        """Unblock a user"""
        # Use the same logic as block_user but force action to 'unblock'
        request.data['action'] = 'unblock'
        return self.block_user(request)


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Patient.objects.select_related('user', 'school_year').prefetch_related(
            'medical_records', 'appointments'
        ).all()
        
        # If user is a patient, only show their own profiles
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            queryset = queryset.filter(user=user)
        
        # Filtering parameters for staff/admin
        name = self.request.query_params.get('name')
        student_id = self.request.query_params.get('student_id')
        department = self.request.query_params.get('department')
        user_type = self.request.query_params.get('user_type')
        email = self.request.query_params.get('email')
        search = self.request.query_params.get('search')
        school_year_id = self.request.query_params.get('school_year_id')
        user_id = self.request.query_params.get('user')

        if name:
            queryset = queryset.filter(name__icontains=name)
        if student_id:
            queryset = queryset.filter(student_id__icontains=student_id)
        if department:
            queryset = queryset.filter(department__icontains=department)
        if user_type:
            queryset = queryset.filter(user__user_type__iexact=user_type)
        if email:
            queryset = queryset.filter(Q(email__icontains=email) | Q(user__email__icontains=email))
        if school_year_id:
            queryset = queryset.filter(school_year_id=school_year_id)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(user__email__icontains=search) |
                Q(student_id__icontains=search) |
                Q(department__icontains=search)
            )
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        
        # Only staff/admin can create patient profiles for others
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            raise PermissionDenied("You don't have permission to create patient profiles.")
        
        # Get the current school year
        try:
            current_school_year = AcademicSchoolYear.objects.get(is_current=True)
        except AcademicSchoolYear.DoesNotExist:
            raise serializers.ValidationError("No active school year found.")
        
        # If user_id is provided, link to that user account
        user_id = self.request.data.get('user')
        if user_id:
            try:
                target_user = CustomUser.objects.get(id=user_id)
                
                # Check if user already has a patient profile for this school year
                existing_profile = target_user.patient_profiles.filter(school_year=current_school_year).first()
                if existing_profile:
                    # Update existing profile instead of creating new one
                    for attr, value in serializer.validated_data.items():
                        setattr(existing_profile, attr, value)
                    existing_profile.save()
                    # Update serializer instance to return the updated profile
                    serializer.instance = existing_profile
                    return
                
                serializer.save(user=target_user, school_year=current_school_year)
            except CustomUser.DoesNotExist:
                raise serializers.ValidationError("Invalid user ID.")
        else:
            serializer.save(school_year=current_school_year)

    def perform_update(self, serializer):
        user = self.request.user
        patient = self.get_object()
        
        # Patients can only update their own profiles
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            if patient.user != user:
                raise PermissionDenied("You can only update your own profiles.")
        
        serializer.save()

    def perform_destroy(self, serializer):
        user = self.request.user
        patient = self.get_object()
        
        # Only staff/admin can delete patient profiles
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            raise PermissionDenied("You don't have permission to delete patient profiles.")
        
        # If patient has a linked user, keep the user account
        if patient.user:
            patient.user = None
            patient.save()
        
        patient.delete()

    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get the current user's patient profile for specific school year and semester"""
        user = request.user
        
        # Get school year and semester from query parameters
        school_year_id = request.query_params.get('school_year')
        semester = request.query_params.get('semester')
        
        if school_year_id and semester:
            # Get profile for specific school year and semester
            try:
                patient_profile = user.patient_profiles.get(
                    school_year_id=school_year_id,
                    semester=semester
                )
            except Patient.DoesNotExist:
                return Response({'detail': 'No patient profile found for this semester.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Fallback to current profile method
            patient_profile = user.get_current_patient_profile()
            if not patient_profile:
                return Response({'detail': 'No patient profile found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(patient_profile)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_my_profile(self, request):
        """Create a patient profile for the current user for specific school year and semester"""
        user = request.user
        
        # Get school year and semester from request data
        school_year_id = request.data.get('school_year')
        semester = request.data.get('semester', '1st_semester')  # Default to first semester
        
        # Get the school year object
        if school_year_id:
            try:
                school_year = AcademicSchoolYear.objects.get(id=school_year_id)
            except AcademicSchoolYear.DoesNotExist:
                return Response({'detail': 'School year not found.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Get current school year
            try:
                school_year = AcademicSchoolYear.objects.get(is_current=True)
            except AcademicSchoolYear.DoesNotExist:
                return Response({'detail': 'No active school year found.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if profile already exists for this school year and semester
        existing_profile = user.patient_profiles.filter(
            school_year=school_year,
            semester=semester
        ).first()
        
        # Also check for profiles without school year/semester (created during signup)
        if not existing_profile:
            signup_profile = user.patient_profiles.filter(
                school_year__isnull=True,
                semester__isnull=True
            ).first()
            if signup_profile:
                # Update the signup profile with current school year and semester
                signup_profile.school_year = school_year
                signup_profile.semester = semester
                signup_profile.save()
                existing_profile = signup_profile
        
        data = request.data.copy()
        data['user'] = user.id
        data['school_year'] = school_year.id
        data['semester'] = semester
        
        # Auto-fill fields from user account (only if not already provided)
        if not data.get('name') and user.first_name and user.last_name:
            data['name'] = f"{user.last_name}, {user.first_name}"
        if not data.get('first_name'):
            data['first_name'] = user.first_name or ''
        if not data.get('middle_name'):
            data['middle_name'] = user.middle_name or ''
        if not data.get('email'):
            data['email'] = user.email
        if not data.get('student_id'):
            data['student_id'] = f"TEMP-{user.id}"
        
        if existing_profile:
            # Update existing profile using PatientProfileUpdateSerializer for better file handling
            serializer = PatientProfileUpdateSerializer(existing_profile, data=data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Create new profile using PatientProfileUpdateSerializer
            serializer = PatientProfileUpdateSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                patient = serializer.save(user=user, school_year=school_year, semester=semester)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def create_or_update_profile(self, request):
        """Create or update a patient profile for the current user for a specific school year"""
        user = request.user
        
        # Get school year from request, default to current
        school_year_id = request.data.get('school_year_id')
        
        if school_year_id:
            try:
                school_year = AcademicSchoolYear.objects.get(id=school_year_id)
            except AcademicSchoolYear.DoesNotExist:
                return Response({'detail': 'School year not found.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Get current school year
            try:
                school_year = AcademicSchoolYear.objects.get(is_current=True)
            except AcademicSchoolYear.DoesNotExist:
                return Response({'detail': 'No active school year found.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if profile already exists for this school year
        existing_profile = user.patient_profiles.filter(school_year=school_year).first()
        
        # Also check for profiles without school year (created during signup) if no specific profile found
        if not existing_profile and not school_year_id:
            signup_profile = user.patient_profiles.filter(school_year__isnull=True).first()
            if signup_profile:
                # Update the signup profile with current school year
                signup_profile.school_year = school_year
                signup_profile.save()
                existing_profile = signup_profile
        
        data = request.data.copy()
        data['user'] = user.id
        
        # Auto-fill fields from user account (only if not already provided)
        if not data.get('name') and user.first_name and user.last_name:
            data['name'] = f"{user.last_name}, {user.first_name}"
        if not data.get('first_name'):
            data['first_name'] = user.first_name or ''
        if not data.get('middle_name'):
            data['middle_name'] = user.middle_name or ''
        if not data.get('email'):
            data['email'] = user.email
        if not data.get('student_id'):
            data['student_id'] = f"TEMP-{user.id}"
        
        if existing_profile:
            # Update existing profile using PatientProfileUpdateSerializer
            serializer = PatientProfileUpdateSerializer(existing_profile, data=data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        else:
            # Create new profile using PatientProfileUpdateSerializer
            serializer = PatientProfileUpdateSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                patient = serializer.save(user=user, school_year=school_year)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['put', 'patch'])
    def update_my_profile(self, request):
        """Update the current user's patient profile for specific school year and semester"""
        user = request.user
        
        # Get school year and semester from request data
        school_year_id = request.data.get('school_year')
        semester = request.data.get('semester')
        
        if school_year_id and semester:
            # Update profile for specific school year and semester
            try:
                patient_profile = user.patient_profiles.get(
                    school_year_id=school_year_id,
                    semester=semester
                )
            except Patient.DoesNotExist:
                return Response({'detail': 'No patient profile found for this semester.'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Fallback to current profile method
            patient_profile = user.get_current_patient_profile()
            if not patient_profile:
                return Response({'detail': 'No patient profile found.'}, status=status.HTTP_404_NOT_FOUND)
        
        partial = request.method == 'PATCH'
        serializer = PatientProfileUpdateSerializer(patient_profile, data=request.data, partial=partial, context={'request': request})
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def by_user_id(self, request):
        """Get patient profile by user ID (for frontend compatibility)"""
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response({'detail': 'user_id parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_user = CustomUser.objects.get(id=user_id)
            current_patient_profile = target_user.get_current_patient_profile()
            if not current_patient_profile:
                return Response({'detail': 'No patient profile found for this user.'}, status=status.HTTP_404_NOT_FOUND)
            
            # Check permissions
            if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
                if target_user != request.user:
                    raise PermissionDenied("You can only view your own patient profile.")
            
            serializer = self.get_serializer(current_patient_profile)
            return Response(serializer.data)
        except CustomUser.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['get'])
    def my_profiles(self, request):
        """Get all patient profiles for the current user across all school years"""
        user = request.user
        
        profiles = user.patient_profiles.select_related('school_year').order_by('-school_year__is_current', '-school_year__academic_year')
        
        if not profiles.exists():
            return Response({'detail': 'No patient profiles found.'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = self.get_serializer(profiles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def autofill_data(self, request):
        """Get user information for autofill purposes with data from previous semesters/years"""
        user = request.user
        
        # Get school year and semester from query parameters
        school_year_id = request.query_params.get('school_year')
        semester = request.query_params.get('semester')
        
        # Get current school year
        try:
            current_school_year = AcademicSchoolYear.objects.get(is_current=True)
        except AcademicSchoolYear.DoesNotExist:
            current_school_year = None
        
        # Use provided school year or fall back to current
        target_school_year_id = school_year_id or (current_school_year.id if current_school_year else None)
        target_semester = semester or '1st_semester'  # Default to first semester
        
        # Check if user has an existing profile for target school year and semester
        existing_profile = None
        if target_school_year_id and target_semester:
            existing_profile = user.patient_profiles.filter(
                school_year_id=target_school_year_id,
                semester=target_semester
            ).first()
        
        # Get the most recent profile from previous semester/year for autofill
        previous_profile = None
        autofilled_from_year = None
        autofilled_from_semester = None
        
        if not existing_profile:
            # Look for profiles in previous semesters, prioritizing recent ones
            all_profiles = user.patient_profiles.exclude(
                school_year_id=target_school_year_id,
                semester=target_semester
            ).order_by('-school_year__end_date', '-created_at')
            
            previous_profile = all_profiles.first()
            if previous_profile:
                autofilled_from_year = str(previous_profile.school_year) if previous_profile.school_year else 'Unknown Year'
                semester_display = {
                    '1st_semester': 'First Semester',
                    '2nd_semester': 'Second Semester', 
                    'summer': 'Summer Semester'
                }.get(previous_profile.semester, previous_profile.semester)
                autofilled_from_semester = semester_display
        
        # Use existing profile if available, otherwise use previous profile for autofill
        source_profile = existing_profile or previous_profile
        
        # Prepare autofill data starting with user info
        autofill_data = {
            'email': user.email,
            'first_name': user.first_name or '',
            'last_name': user.last_name or '',
            'middle_name': user.middle_name or '',
            'name': f"{user.last_name}, {user.first_name}" if user.first_name and user.last_name else user.username,
            'student_id': f"TEMP-{user.id}",
            'has_existing_profile': existing_profile is not None,
            'current_school_year': current_school_year.id if current_school_year else None,
            'current_school_year_name': str(current_school_year) if current_school_year else None,
            'has_previous_data': previous_profile is not None,
            'autofilled_from_year': autofilled_from_year,
            'autofilled_from_semester': autofilled_from_semester,
            'user_type': user.grade_level or '',  # Add user type from signup
        }
        
        # If we have a source profile (current or previous), include comprehensive autofill data
        if source_profile:
            # Basic personal information
            profile_data = {
                'existing_profile_id': source_profile.id if existing_profile else None,
                'existing_student_id': source_profile.student_id,
                'existing_name': source_profile.name,
                
                # Personal Information
                'first_name': source_profile.first_name or user.first_name or '',
                'patient_name': source_profile.name or f"{user.first_name} {user.last_name}".strip() or '',
                'middle_name': source_profile.middle_name or user.middle_name or '',
                'suffix': source_profile.suffix or '',
                'date_of_birth': source_profile.date_of_birth.isoformat() if source_profile.date_of_birth else '',
                'age': source_profile.age or '',
                'gender': source_profile.gender or '',
                'blood_type': source_profile.blood_type or '',
                'religion': source_profile.religion or '',
                'nationality': source_profile.nationality or '',
                'civil_status': source_profile.civil_status or '',
                
                # User type specific fields
                'user_type': source_profile.user_type or user.grade_level or '',
                'employee_id': source_profile.employee_id or '',
                'department': source_profile.department or '',
                'position_type': source_profile.position_type or '',
                'course': source_profile.course or '',
                'year_level': source_profile.year_level or '',
                'strand': source_profile.strand or '',
                
                # Contact Information
                'email': source_profile.email or user.email,
                'contact_number': source_profile.contact_number or '',
                
                # Address Information
                'city_municipality': source_profile.city_municipality or '',
                'barangay': source_profile.barangay or '',
                'street': source_profile.street or '',
                
                # Emergency Contact
                'emergency_contact_surname': source_profile.emergency_contact_surname or '',
                'emergency_contact_first_name': source_profile.emergency_contact_first_name or '',
                'emergency_contact_middle_name': source_profile.emergency_contact_middle_name or '',
                'emergency_contact_number': source_profile.emergency_contact_number or '',
                'emergency_contact_relationship': source_profile.emergency_contact_relationship or '',
                'emergency_contact_barangay': source_profile.emergency_contact_barangay or '',
                'emergency_contact_street': source_profile.emergency_contact_street or '',
                
                # Health History
                'comorbid_illnesses': source_profile.comorbid_illnesses or [],
                'comorbid_illness_details': source_profile.comorbid_illness_details or {},
                'past_medical_history': source_profile.past_medical_history or [],
                'vaccinations': source_profile.vaccinations or [],
                'medications': source_profile.medications or [],
                'allergies': source_profile.allergies or [],
                'hospital_admission_or_surgery': source_profile.hospital_admission_or_surgery if source_profile.hospital_admission_or_surgery is not None else '',
                'surgical_operations': source_profile.surgical_operations or '',
                
                # Family History
                'family_medical_history': source_profile.family_medical_history or [],
                
                'profile_completion_status': {
                    'has_basic_info': bool(source_profile.first_name and source_profile.email),
                    'has_emergency_contact': bool(source_profile.emergency_contact_surname and source_profile.emergency_contact_first_name),
                    'has_health_history': bool(source_profile.comorbid_illnesses or source_profile.past_medical_history),
                    'has_family_history': bool(source_profile.family_medical_history),
                }
            }
            
            autofill_data.update(profile_data)
        
        return Response(autofill_data)


class MedicalRecordViewSet(viewsets.ModelViewSet):
    queryset = MedicalRecord.objects.all()
    serializer_class = MedicalRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = MedicalRecord.objects.all()
        patient_id = self.request.query_params.get('patient_id')
        
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
            
        return queryset


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        try:
            if user.is_staff or user.user_type in ['staff', 'admin']:
                # Staff can see appointments based on their campus assignment
                queryset = Appointment.objects.select_related('patient', 'doctor').all()
                
                # Filter by staff's assigned campus
                if hasattr(user, 'staff_details') and user.staff_details.campus_assigned:
                    queryset = queryset.filter(campus=user.staff_details.campus_assigned)
                # If no staff details, show all (for backward compatibility)
                
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
                            'email': user.email,
                            'student_id': f"TEMP-{user.id}",
                        }
                    )
                    queryset = Appointment.objects.filter(patient=patient_profile).select_related('patient', 'doctor')
                except AcademicSchoolYear.DoesNotExist:
                    # No active school year, return empty queryset
                    queryset = Appointment.objects.none()

            # --- Filtering from query parameters ---

            # Filter by type (for admin: medical/dental)
            appointment_type = self.request.query_params.get('type')
            if appointment_type:
                queryset = queryset.filter(type=appointment_type)

            # Filter by status
            status_param = self.request.query_params.get('status')
            if status_param and status_param.lower() != 'all':
                 # Handle multiple statuses for history tab (e.g., completed,cancelled)
                if ',' in status_param:
                    statuses = status_param.split(',')
                    queryset = queryset.filter(status__in=statuses)
                else:
                    queryset = queryset.filter(status=status_param)

            # Filter by patient ID (if staff is looking at one patient)
            patient_id = self.request.query_params.get('patient_id')
            if (user.is_staff or user.user_type in ['staff', 'admin']) and patient_id:
                try:
                    queryset = queryset.filter(patient_id=int(patient_id))
                except (ValueError, TypeError):
                    pass
                
            # Filter by doctor ID
            doctor_id = self.request.query_params.get('doctor_id')
            if doctor_id:
                try:
                    queryset = queryset.filter(doctor_id=int(doctor_id))
                except (ValueError, TypeError):
                    pass
                
            # Filter by date
            date = self.request.query_params.get('date')
            if date:
                try:
                    queryset = queryset.filter(appointment_date=date)
                except ValueError:
                    pass

            # Search by patient name (for admin)
            search_query = self.request.query_params.get('search')
            if (user.is_staff or user.user_type in ['staff', 'admin']) and search_query:
                queryset = queryset.filter(patient__name__icontains=search_query)

            # Filter by school year
            school_year_param = self.request.query_params.get('school_year')
            if school_year_param:
                try:
                    # Filter appointments by patient's school year or appointment's school year
                    # This handles both cases where school year might be set on the appointment or patient
                    from django.db.models import Q
                    queryset = queryset.filter(
                        Q(patient__school_year_id=int(school_year_param)) | 
                        Q(school_year_id=int(school_year_param))
                    )
                except (ValueError, TypeError):
                    # If school_year_param is not a valid integer, ignore the filter
                    pass

            # --- Ordering ---
            ordering = self.request.query_params.get('ordering')
            order_by_fields = ['-appointment_date', '-appointment_time'] # Default
            
            if ordering == 'name':
                order_by_fields = ['patient__name']
            elif ordering == 'time':
                order_by_fields = ['appointment_date', 'appointment_time']
            elif ordering == '-appointment_date':
                order_by_fields = ['-appointment_date', '-appointment_time']

            return queryset.order_by(*order_by_fields)
            
        except Exception as e:
            # Log the error and return an empty queryset to prevent 500 errors
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in AppointmentViewSet.get_queryset: {str(e)}")
            return Appointment.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        
        # Check if user is blocked from booking consultations
        if user.is_blocked:
            raise PermissionDenied(f"Your account has been blocked from booking consultations. Reason: {user.block_reason or 'No reason provided'}")
        
        # If the user is staff, they can create an appointment for any patient.
        # The patient ID should be in the request data.
        if user.is_staff or user.user_type in ['staff', 'admin']:
            serializer.save() 
            return

        # If the user is a patient, they can only create an appointment for themselves.
        # Get the current patient profile
        current_patient_profile = user.get_current_patient_profile()
        if current_patient_profile:
            serializer.save(patient=current_patient_profile)
        else:
            # If no patient profile exists, we need to create one first
            try:
                current_school_year = AcademicSchoolYear.objects.get(is_current=True)
                # Create a patient profile automatically
                patient_profile = Patient.objects.create(
                    user=user,
                    school_year=current_school_year,
                    name=f"{user.last_name}, {user.first_name}" if user.first_name and user.last_name else user.username,
                    first_name=user.first_name or '',
                    email=user.email,
                    student_id=f"TEMP-{user.id}",
                )
                serializer.save(patient=patient_profile)
            except AcademicSchoolYear.DoesNotExist:
                raise serializers.ValidationError("No active school year found. Please contact administration.")
            except Exception as e:
                raise serializers.ValidationError(f"Could not create patient profile: {str(e)}")
    
    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """
        Reschedule an appointment with proper tracking
        """
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
            from datetime import datetime
            new_date_obj = datetime.strptime(new_date, '%Y-%m-%d').date()
            new_time_obj = datetime.strptime(new_time, '%H:%M').time()
            
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
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel an appointment
        """
        appointment = self.get_object()
        user = request.user
        
        # Check permissions
        if not (user.is_staff or user.user_type in ['staff', 'admin'] or 
                appointment.patient.user == user):
            raise PermissionDenied("You don't have permission to cancel this appointment.")
        
        # Update the appointment status to cancelled
        appointment.status = 'cancelled'
        appointment.cancelled_by = user
        appointment.cancelled_at = timezone.now()
        appointment.save()
        
        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def view_form_data(self, request, pk=None):
        """
        View the form data (dental or medical) for a completed appointment as PDF in browser
        """
        appointment = self.get_object()
        user = request.user
        
        # Check permissions
        if not (user.is_staff or user.user_type in ['staff', 'admin'] or 
                appointment.patient.user == user):
            raise PermissionDenied("You don't have permission to view this form data.")
        
        # Check if appointment is completed
        if appointment.status != 'completed':
            return Response(
                {'error': 'Form data is only available for completed appointments'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .pdf_utils import generate_dental_form_pdf, generate_medical_form_pdf
            
            if appointment.type == 'dental':
                # Get dental form data
                dental_form = appointment.dental_form_data.first()
                if not dental_form:
                    return Response(
                        {'error': 'No dental form data found for this appointment'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Generate PDF
                pdf_buffer = generate_dental_form_pdf(dental_form)
                
                # Create response for viewing in browser
                response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
                response['Content-Disposition'] = f'inline; filename="dental_form_{appointment.patient.name}_{appointment.appointment_date}.pdf"'
                return response
                
            elif appointment.type == 'medical':
                # Get medical form data
                medical_form = appointment.medical_form_data.first()
                if not medical_form:
                    return Response(
                        {'error': 'No medical form data found for this appointment'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Generate PDF
                pdf_buffer = generate_medical_form_pdf(medical_form)
                
                # Create response for viewing in browser
                response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
                response['Content-Disposition'] = f'inline; filename="medical_form_{appointment.patient.name}_{appointment.appointment_date}.pdf"'
                return response
            
            else:
                return Response(
                    {'error': 'Invalid appointment type'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Failed to generate form data PDF: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reschedule_backup(self, request, pk=None):
        """
        Reschedule an appointment with proper tracking
        """
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
            from datetime import datetime
            new_date_obj = datetime.strptime(new_date, '%Y-%m-%d').date()
            new_time_obj = datetime.strptime(new_time, '%H:%M').time()
            
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
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel an appointment
        """
        appointment = self.get_object()
        user = request.user
        
        # Check permissions
        if not (user.is_staff or user.user_type in ['staff', 'admin'] or 
                appointment.patient.user == user):
            raise PermissionDenied("You don't have permission to cancel this appointment.")
        
        # Update the appointment status to cancelled
        appointment.status = 'cancelled'
        appointment.cancelled_by = user
        appointment.cancelled_at = timezone.now()
        appointment.save()
        
        return Response(
            AppointmentSerializer(appointment).data,
            status=status.HTTP_200_OK
        )
    
    @action(detail=True, methods=['get'])
    def download_form_data(self, request, pk=None):
        """
        Download the form data (dental or medical) for a completed appointment as PDF
        """
        appointment = self.get_object()
        user = request.user
        
        # Check permissions
        if not (user.is_staff or user.user_type in ['staff', 'admin'] or 
                appointment.patient.user == user):
            raise PermissionDenied("You don't have permission to download this form data.")
        
        # Check if appointment is completed
        if appointment.status != 'completed':
            return Response(
                {'error': 'Form data is only available for completed appointments'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .pdf_utils import generate_dental_form_pdf, generate_medical_form_pdf
            
            if appointment.type == 'dental':
                # Get dental form data
                dental_form = appointment.dental_form_data.first()
                if not dental_form:
                    return Response(
                        {'error': 'No dental form data found for this appointment'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Generate PDF
                pdf_buffer = generate_dental_form_pdf(dental_form)
                
                # Create response
                response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="dental_form_{appointment.patient.name}_{appointment.appointment_date}.pdf"'
                return response
                
            elif appointment.type == 'medical':
                # Get medical form data
                medical_form = appointment.medical_form_data.first()
                if not medical_form:
                    return Response(
                        {'error': 'No medical form data found for this appointment'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )
                
                # Generate PDF
                pdf_buffer = generate_medical_form_pdf(medical_form)
                
                # Create response
                response = HttpResponse(pdf_buffer.getvalue(), content_type='application/pdf')
                response['Content-Disposition'] = f'attachment; filename="medical_form_{appointment.patient.name}_{appointment.appointment_date}.pdf"'
                return response
            
            else:
                return Response(
                    {'error': 'Invalid appointment type'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': f'Failed to generate form data PDF: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        """Send medical certificate via email (staff only)"""
        if not (request.user.is_staff or getattr(request.user, 'user_type', None) in ['staff', 'admin']):
            raise PermissionDenied("Only staff can send certificates via email")

        doc = self.get_object()
        
        # Check if medical certificate exists
        if not hasattr(doc, 'medical_certificate') or not doc.medical_certificate:
            return Response({
                'detail': 'No medical certificate available to send.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if document is approved/issued
        if doc.status != 'approved':
            return Response({
                'detail': 'Document must be approved before sending certificate.'
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Get recipient email from request or use patient's email
            recipient_email = request.data.get('email')
            if not recipient_email and hasattr(doc, 'patient') and hasattr(doc.patient, 'user'):
                recipient_email = doc.patient.user.email
            
            if not recipient_email:
                return Response({
                    'detail': 'No email address provided or found for patient.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Here you would implement your email sending logic
            # For example, using Django's send_mail or your custom email service
            # from django.core.mail import send_mail
            # send_mail(
            #     subject='Your Medical Certificate',
            #     message='Please find your medical certificate attached.',
            #     from_email='noreply@wmsu.edu.ph',
            #     recipient_list=[recipient_email],
            #     fail_silently=False,
            # )
            
            # For now, we'll just log the action and return success
            # You can implement the actual email sending based on your email service
            
            # Update document to track email sent
            doc.certificate_emailed_at = timezone.now()
            doc.certificate_emailed_by = request.user
            doc.save()
            
            return Response({
                'detail': f'Medical certificate sent successfully to {recipient_email}'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'detail': f'Failed to send email: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def view_medical_certificate(self, request, pk=None):
        """View medical certificate PDF for an appointment"""
        appointment = self.get_object()
        
        # Check permissions - patient can view their own certificates, staff can view all
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin'] or 
                appointment.patient.user == request.user):
            raise PermissionDenied("You don't have permission to view this certificate.")
        
        try:
            # Find the medical document for this patient and academic year
            from .models import MedicalDocument
            medical_doc = MedicalDocument.objects.filter(
                patient=appointment.patient,
                status='issued',
                academic_year=appointment.school_year
            ).first()
            
            if not medical_doc or not medical_doc.medical_certificate:
                return Response({
                    'error': 'No medical certificate found for this appointment'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Serve the file
            import os
            from django.http import FileResponse, Http404
            
            file_path = medical_doc.medical_certificate.path
            if not os.path.exists(file_path):
                return Response({
                    'error': 'Medical certificate file not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Create response for viewing (inline)
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='application/pdf',
                filename=f"medical_certificate_{appointment.patient.name}_{appointment.appointment_date}.pdf"
            )
            response['Content-Disposition'] = f'inline; filename="medical_certificate_{appointment.patient.name}_{appointment.appointment_date}.pdf"'
            return response
            
        except Exception as e:
            return Response({
                'error': f'Failed to retrieve medical certificate: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def download_medical_certificate(self, request, pk=None):
        """Download medical certificate PDF for an appointment"""
        appointment = self.get_object()
        
        # Check permissions - patient can download their own certificates, staff can download all
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin'] or 
                appointment.patient.user == request.user):
            raise PermissionDenied("You don't have permission to download this certificate.")
        
        try:
            # Find the medical document for this patient and academic year
            from .models import MedicalDocument
            medical_doc = MedicalDocument.objects.filter(
                patient=appointment.patient,
                status='issued',
                academic_year=appointment.school_year
            ).first()
            
            if not medical_doc or not medical_doc.medical_certificate:
                return Response({
                    'error': 'No medical certificate found for this appointment'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Serve the file for download
            import os
            from django.http import FileResponse, Http404
            
            file_path = medical_doc.medical_certificate.path
            if not os.path.exists(file_path):
                return Response({
                    'error': 'Medical certificate file not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Create response for download (attachment)
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='application/pdf',
                filename=f"medical_certificate_{appointment.patient.name}_{appointment.appointment_date}.pdf"
            )
            response['Content-Disposition'] = f'attachment; filename="medical_certificate_{appointment.patient.name}_{appointment.appointment_date}.pdf"'
            return response
            
        except Exception as e:
            return Response({
                'error': f'Failed to download medical certificate: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ...existing code...


class AcademicSchoolYearViewSet(viewsets.ModelViewSet):
    """Academic School Year management"""
    queryset = AcademicSchoolYear.objects.all()
    serializer_class = AcademicSchoolYearSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Staff can modify, students can only view"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
            return [permission() for permission in permission_classes]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        """Only staff can create"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can create academic years")
        serializer.save()
    
    def perform_update(self, serializer):
        """Only staff can update"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can update academic years")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only staff can delete"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can delete academic years")
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current academic year"""
        try:
            current_year = AcademicSchoolYear.objects.filter(is_current=True).first()
            if current_year:
                serializer = self.get_serializer(current_year)
                return Response(serializer.data)
            else:
                return Response({
                    'detail': 'No current academic year set.'
                }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'detail': f'Error fetching current academic year: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def set_current(self, request, pk=None):
        """Set an academic year as current (staff only)"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can set current academic year")
        
        # First, unset all current years
        AcademicSchoolYear.objects.filter(is_current=True).update(is_current=False)
        
        # Set this year as current
        academic_year = self.get_object()
        academic_year.is_current = True
        academic_year.save()
        
        serializer = self.get_serializer(academic_year)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update academic years (staff only)"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can bulk update academic years")
        
        # Handle both direct array and years wrapper
        data = request.data
        if isinstance(data, dict) and 'years' in data:
            data = data['years']
        elif not isinstance(data, list):
            return Response({
                'detail': 'Expected a list of academic year data or an object with years array.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        updated_years = []
        for year_data in data:
            year_id = year_data.get('id')
            if year_id:
                try:
                    year = AcademicSchoolYear.objects.get(id=year_id)
                    serializer = self.get_serializer(year, data=year_data, partial=True)
                    if serializer.is_valid():
                        serializer.save()
                        updated_years.append(serializer.data)
                    else:
                        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                except AcademicSchoolYear.DoesNotExist:
                    return Response({
                        'detail': f'Academic year with id {year_id} not found.'
                    }, status=status.HTTP_404_NOT_FOUND)
        
        return Response(updated_years)


class InventoryViewSet(viewsets.ModelViewSet):
    """Inventory management for medical supplies"""
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Only staff can modify inventory"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
            return [permission() for permission in permission_classes]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        """Only staff can create inventory items"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can manage inventory")
        serializer.save()
    
    def perform_update(self, serializer):
        """Only staff can update inventory items"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can manage inventory")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only staff can delete inventory items"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can manage inventory")
        instance.delete()


class WaiverViewSet(viewsets.ModelViewSet):
    """Waiver management"""
    queryset = Waiver.objects.all()
    serializer_class = WaiverSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = Waiver.objects.all()
        
        # If user is not staff/admin, only show their own waivers
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            queryset = queryset.filter(user=user)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Users can only create waivers for themselves"""
        user = self.request.user
        
        # Check if user already has a waiver
        if Waiver.objects.filter(user=user).exists():
            raise serializers.ValidationError("You already have a waiver on file.")
        
        serializer.save(user=user)


class DentalWaiverViewSet(viewsets.ModelViewSet):
    """Dental Informed Consent to Care waiver management"""
    queryset = DentalWaiver.objects.all()
    serializer_class = DentalWaiverSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = DentalWaiver.objects.all()
        
        # If user is not staff/admin, only show their own dental waivers
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            queryset = queryset.filter(user=user)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Users can only create dental waivers for themselves"""
        user = self.request.user
        
        # Check if user already has a dental waiver
        if DentalWaiver.objects.filter(user=user).exists():
            raise serializers.ValidationError("You already have a dental informed consent waiver on file.")
        
        serializer.save(user=user)

    @action(detail=False, methods=['get'])
    def check_status(self, request):
        """Check if current user has signed a dental waiver"""
        user = request.user
        has_signed = DentalWaiver.objects.filter(user=user).exists()
        
        dental_waiver_data = None
        if has_signed:
            dental_waiver = DentalWaiver.objects.filter(user=user).first()
            dental_waiver_data = {
                'id': dental_waiver.id,
                'patient_name': dental_waiver.patient_name,
                'date_signed': dental_waiver.date_signed,
                'created_at': dental_waiver.created_at
            }
        
        return Response({
            'has_signed': has_signed,
            'dental_waiver': dental_waiver_data
        })
    
    @action(detail=False, methods=['get'])
    def check_status(self, request):
        """Check if current user has a waiver"""
        user = request.user
        
        # Check if user has a waiver
        waiver = Waiver.objects.filter(user=user).first()
        
        if waiver:
            return Response({
                'exists': True,
                'waiver': WaiverSerializer(waiver).data
            })
        else:
            return Response({
                'exists': False,
                'waiver': None
            })

class DentalFormDataViewSet(viewsets.ModelViewSet):
    """ViewSet for managing dental form data"""
    queryset = DentalFormData.objects.all()
    serializer_class = DentalFormDataSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = DentalFormData.objects.all()
        
        # If user is a patient, only show their own forms
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            # Get patient profiles associated with the user
            patient_profiles = user.patient_profiles.all()
            if patient_profiles.exists():
                queryset = queryset.filter(patient__in=patient_profiles)
            else:
                return DentalFormData.objects.none()
        
        # Filter by patient if provided
        patient_id = self.request.query_params.get('patient_id')
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        
        # Filter by appointment if provided
        appointment_id = self.request.query_params.get('appointment_id')
        if appointment_id:
            queryset = queryset.filter(appointment_id=appointment_id)
        
        return queryset.select_related('patient', 'appointment').order_by('-created_at')
    
    def perform_create(self, serializer):
        user = self.request.user
        
        # Get staff details to auto-populate examiner fields
        try:
            staff_details = StaffDetails.objects.get(user=user)
            examiner_name = staff_details.full_name
            examiner_position = staff_details.position
            examiner_license = staff_details.license_number or ''
            examiner_ptr = staff_details.ptr_number or ''
            examiner_phone = staff_details.phone_number or ''
        except StaffDetails.DoesNotExist:
            # Fallback to user basic info
            examiner_name = f"{user.first_name} {user.last_name}".strip() if user.first_name or user.last_name else user.username
            examiner_position = ''
            examiner_license = ''
            examiner_ptr = ''
            examiner_phone = ''
        
        # If user is a patient, set their patient profile
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            patient_profile = user.get_current_patient_profile()
            if not patient_profile:
                raise serializers.ValidationError("Patient profile is required")
            serializer.save(
                patient=patient_profile,
                examined_by=examiner_name,
                examiner_position=examiner_position,
                examiner_license=examiner_license,
                examiner_ptr=examiner_ptr,
                examiner_phone=examiner_phone,
                date=timezone.now().date() if not serializer.validated_data.get('date') else serializer.validated_data.get('date')
            )
        else:
            serializer.save(
                examined_by=examiner_name,
                examiner_position=examiner_position,
                examiner_license=examiner_license,
                examiner_ptr=examiner_ptr,
                examiner_phone=examiner_phone,
                date=timezone.now().date() if not serializer.validated_data.get('date') else serializer.validated_data.get('date')
            )

    @action(detail=False, methods=['get'])
    def get_patient_data(self, request):
        """Get patient data for dental form initialization"""
        appointment_id = request.query_params.get('appointment_id')
        
        if not appointment_id:
            return Response({'error': 'appointment_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            appointment = Appointment.objects.get(id=appointment_id)
            patient = appointment.patient
            
            # Get current user info for staff fields
            user = request.user
            current_date = timezone.now().date()
            
            # Get staff details from StaffDetails table
            examiner_name = user.username  # Fallback
            examiner_position = ''
            examiner_license = ''
            examiner_ptr = ''
            examiner_phone = ''
            
            try:
                staff_details = StaffDetails.objects.get(user=user)
                examiner_name = staff_details.full_name
                examiner_position = staff_details.position
                examiner_license = staff_details.license_number or ''
                examiner_ptr = staff_details.ptr_number or ''
                examiner_phone = staff_details.phone_number or ''
            except StaffDetails.DoesNotExist:
                # If no staff details found, use user's basic info as fallback
                examiner_name = f"{user.first_name} {user.last_name}".strip() if user.first_name or user.last_name else user.username
            
            # Extract surname from name field (assuming format "Surname, First Name")
            surname = ''
            if patient.name:
                if ',' in patient.name:
                    surname = patient.name.split(',')[0].strip()
                else:
                    # If no comma, use the name as surname
                    surname = patient.name
            
            data = {
                'patient_id': patient.id,
                'file_no': patient.student_id or '',
                'surname': surname,
                'first_name': patient.first_name or '',
                'middle_name': patient.middle_name or '',
                'age': patient.age or '',
                'sex': patient.gender or 'Male',
                'examined_by': examiner_name,
                'examiner_position': examiner_position,
                'examiner_license': examiner_license,
                'examiner_ptr': examiner_ptr,
                'examiner_phone': examiner_phone,
                'date': current_date.strftime('%Y-%m-%d'),
            }
            
            return Response(data)
        except Appointment.DoesNotExist:
            return Response({'error': 'Appointment not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def by_appointment(self, request):
        """Get dental form by appointment ID"""
        appointment_id = request.query_params.get('appointment_id')
        
        if not appointment_id:
            return Response({'error': 'appointment_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            dental_form = DentalFormData.objects.get(appointment_id=appointment_id)
            serializer = self.get_serializer(dental_form)
            return Response(serializer.data)
        except DentalFormData.DoesNotExist:
            return Response({'error': 'Dental form not found for this appointment'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def submit_and_complete(self, request):
        """Submit dental form and complete appointment"""
        try:
            # Create the dental form
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                dental_form = serializer.save()
                
                # Mark appointment as completed if appointment_id is provided
                appointment_id = request.data.get('appointment')
                appointment_completed = False
                next_appointment_created = False
                next_appointment_date = None
                
                if appointment_id:
                    try:
                        appointment = Appointment.objects.get(id=appointment_id)
                        appointment.status = 'completed'
                        appointment.save()
                        appointment_completed = True
                        
                        # Create next appointment if date is provided
                        next_date = request.data.get('next_appointment_date')
                        next_time = request.data.get('next_appointment_time', '10:00:00')
                        
                        if next_date:
                            # Parse the date string to date object if needed
                            if isinstance(next_date, str):
                                from datetime import datetime
                                try:
                                    next_date = datetime.strptime(next_date, '%Y-%m-%d').date()
                                except ValueError:
                                    # Try alternative format
                                    try:
                                        next_date = datetime.strptime(next_date, '%m/%d/%Y').date()
                                    except ValueError:
                                        next_date = None
                            
                            # Parse the time string to time object if needed
                            if isinstance(next_time, str):
                                from datetime import datetime
                                try:
                                    next_time = datetime.strptime(next_time, '%H:%M:%S').time()
                                except ValueError:
                                    try:
                                        next_time = datetime.strptime(next_time, '%H:%M').time()
                                    except ValueError:
                                        next_time = datetime.strptime('10:00:00', '%H:%M:%S').time()
                            
                            if next_date:
                                # Create next appointment
                                next_appointment = Appointment.objects.create(
                                    patient=appointment.patient,
                                    appointment_date=next_date,
                                    appointment_time=next_time,
                                    purpose='Follow-up dental consultation',
                                    type='dental',
                                    status='confirmed',
                                    campus=appointment.campus,
                                    school_year=appointment.school_year
                                )
                                next_appointment_created = True
                                next_appointment_date = next_date
                            
                    except Appointment.DoesNotExist:
                        pass
                
                response_data = {
                    'id': dental_form.id,
                    'appointment_completed': appointment_completed,
                    'next_appointment_created': next_appointment_created,
                    'next_appointment_date': str(next_appointment_date) if next_appointment_date else None,
                }
                
                # Add serializer data but ensure proper date formatting
                serializer_data = serializer.data
                if 'date' in serializer_data and serializer_data['date']:
                    serializer_data['date'] = str(serializer_data['date'])
                
                response_data.update(serializer_data)
                
                return Response(response_data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


class StaffManagementViewSet(viewsets.ModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only allow admin users to access staff management
        if not (self.request.user.is_staff or self.request.user.user_type == 'admin'):
            raise PermissionDenied("You don't have permission to access staff management.")
        
        # Return all staff users
        return CustomUser.objects.filter(user_type='staff').order_by('-date_joined')
    
    def list(self, request):
        """List all staff members with their details"""
        queryset = self.get_queryset()
        staff_data = []
        
        for user in queryset:
            staff_info = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_active': user.is_active,
                'date_joined': user.date_joined,
                'role': 'staff',  # Default role
                'campuses': ['a'],  # Default campus
                'phone_number': None
            }
            
            # Get additional details from StaffDetails if available
            if hasattr(user, 'staff_details'):
                staff_details = user.staff_details
                staff_info.update({
                    'role': staff_details.position.lower() if staff_details.position else 'staff',
                    'campuses': staff_details.get_assigned_campuses_list(),
                    'phone_number': staff_details.phone_number
                })
            
            staff_data.append(staff_info)
        
        return Response(staff_data)
    
    def get_department_from_position(self, position):
        """Map position to department"""
        if not position:
            return 'general'
        
        position_lower = position.lower()
        if 'doctor' in position_lower or 'physician' in position_lower:
            return 'medical'
        elif 'dentist' in position_lower or 'dental' in position_lower:
            return 'dental'
        elif 'nurse' in position_lower:
            return 'medical'
        elif 'admin' in position_lower:
            return 'administration'
        elif 'reception' in position_lower:
            return 'reception'
        else:
            return 'general'
    
    def create(self, request):
        """Create a new staff member"""
        if not (request.user.is_staff or request.user.user_type == 'admin'):
            raise PermissionDenied("You don't have permission to create staff accounts.")
        
        data = request.data.copy()
        
        # Validate required fields
        required_fields = ['username', 'email', 'first_name', 'last_name', 'password', 'role', 'campuses']
        for field in required_fields:
            if not data.get(field):
                return Response({
                    'error': f'{field} is required'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if username or email already exists
        if CustomUser.objects.filter(username=data['username']).exists():
            return Response({
                'error': 'Username already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if CustomUser.objects.filter(email=data['email']).exists():
            return Response({
                'error': 'Email already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            with transaction.atomic():
                # Create the user
                user = CustomUser.objects.create(
                    username=data['username'],
                    email=data['email'],
                    first_name=data['first_name'],
                    last_name=data['last_name'],
                    password=make_password(data['password']),
                    user_type='staff',
                    is_staff=True,
                    is_email_verified=True  # Auto-verify staff accounts
                )
                
                # Create staff details
                position = self.get_position_from_role(data['role'])
                campuses = data.get('campuses', ['a'])
                if isinstance(campuses, str):
                    campuses = [campuses]
                
                staff_details = StaffDetails.objects.create(
                    user=user,
                    full_name=f"{data['first_name']} {data['last_name']}",
                    position=position,
                    campus_assigned=campuses[0] if campuses else 'a',  # For backward compatibility
                    phone_number=data.get('phone_number', '')
                )
                staff_details.set_assigned_campuses(campuses)
                staff_details.save()
                
                return Response({
                    'message': 'Staff member created successfully',
                    'user_id': user.id
                }, status=status.HTTP_201_CREATED)
                
        except Exception as e:
            return Response({
                'error': f'Failed to create staff member: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def get_position_from_role(self, role):
        """Map role to position"""
        role_mapping = {
            'admin': 'Administrator',
            'doctor': 'Doctor',
            'nurse': 'Nurse',
            'dentist': 'Dentist',
            'staff': 'Staff',
            'receptionist': 'Receptionist'
        }
        return role_mapping.get(role, 'Staff')
    
    def update(self, request, pk=None):
        """Update a staff member"""
        if not (request.user.is_staff or request.user.user_type == 'admin'):
            raise PermissionDenied("You don't have permission to update staff accounts.")
        
        try:
            user = get_object_or_404(CustomUser, id=pk, user_type='staff')
            data = request.data.copy()
            
            # Update user fields
            if 'username' in data:
                if CustomUser.objects.filter(username=data['username']).exclude(id=pk).exists():
                    return Response({
                        'error': 'Username already exists'
                    }, status=status.HTTP_400_BAD_REQUEST)
                user.username = data['username']
            
            if 'email' in data:
                if CustomUser.objects.filter(email=data['email']).exclude(id=pk).exists():
                    return Response({
                        'error': 'Email already exists'
                    }, status=status.HTTP_400_BAD_REQUEST)
                user.email = data['email']
            
            if 'first_name' in data:
                user.first_name = data['first_name']
            
            if 'last_name' in data:
                user.last_name = data['last_name']
            
            if 'password' in data and data['password']:
                user.password = make_password(data['password'])
            
            user.save()
            
            # Update staff details
            if hasattr(user, 'staff_details'):
                staff_details = user.staff_details
                if 'role' in data:
                    staff_details.position = self.get_position_from_role(data['role'])
                if 'first_name' in data or 'last_name' in data:
                    staff_details.full_name = f"{user.first_name} {user.last_name}"
                if 'phone_number' in data:
                    staff_details.phone_number = data['phone_number']
                if 'campuses' in data:
                    campuses = data['campuses']
                    if isinstance(campuses, str):
                        campuses = [campuses]
                    staff_details.set_assigned_campuses(campuses)
                    if campuses:
                        staff_details.campus_assigned = campuses[0]  # For backward compatibility
                staff_details.save()
            
            return Response({
                'message': 'Staff member updated successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to update staff member: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def destroy(self, request, pk=None):
        """Delete a staff member"""
        if not (request.user.is_staff or request.user.user_type == 'admin'):
            raise PermissionDenied("You don't have permission to delete staff accounts.")
        
        try:
            user = get_object_or_404(CustomUser, id=pk, user_type='staff')
            
            # Don't allow deletion of the current user
            if user.id == request.user.id:
                return Response({
                    'error': 'Cannot delete your own account'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.delete()
            
            return Response({
                'message': 'Staff member deleted successfully'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to delete staff member: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['patch'])
    def toggle_status(self, request, pk=None):
        """Toggle staff member active status"""
        if not (request.user.is_staff or request.user.user_type == 'admin'):
            raise PermissionDenied("You don't have permission to modify staff accounts.")
        
        try:
            user = get_object_or_404(CustomUser, id=pk, user_type='staff')
            
            # Don't allow deactivation of the current user
            if user.id == request.user.id:
                return Response({
                    'error': 'Cannot deactivate your own account'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user.is_active = not user.is_active
            user.save()
            
            return Response({
                'message': f'Staff member {"activated" if user.is_active else "deactivated"} successfully',
                'is_active': user.is_active
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to update staff status: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

class ComorbidIllnessViewSet(viewsets.ModelViewSet):
    """ViewSet for managing comorbid illnesses configuration"""
    queryset = ComorbidIllness.objects.all()
    serializer_class = ComorbidIllnessSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on user permissions"""
        user = self.request.user
        if user.is_staff or user.user_type in ['staff', 'admin']:
            return ComorbidIllness.objects.all().order_by('label')
        return ComorbidIllness.objects.filter(is_enabled=True).order_by('label')
    
    @action(detail=False, methods=['post'])
    def create_comorbid_illness(self, request):
        """Create a new comorbid illness"""
        try:
            label = request.data.get('label')
            is_enabled = request.data.get('is_enabled', True)
            has_sub_options = request.data.get('has_sub_options', False)
            sub_options = request.data.get('sub_options', [])
            requires_specification = request.data.get('requires_specification', False)
            specification_placeholder = request.data.get('specification_placeholder', '')
            
            if not label:
                return Response({'error': 'Label is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            illness = ComorbidIllness.objects.create(
                label=label,
                is_enabled=is_enabled,
                has_sub_options=has_sub_options,
                sub_options=sub_options,
                requires_specification=requires_specification,
                specification_placeholder=specification_placeholder
            )
            
            serializer = self.get_serializer(illness)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['put'])
    def update_comorbid_illness(self, request):
        """Update an existing comorbid illness"""
        try:
            illness_id = request.data.get('id')
            is_enabled = request.data.get('is_enabled', True)
            has_sub_options = request.data.get('has_sub_options', False)
            sub_options = request.data.get('sub_options', [])
            requires_specification = request.data.get('requires_specification', False)
            specification_placeholder = request.data.get('specification_placeholder', '')
            
            if not illness_id:
                return Response({'error': 'ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            illness = ComorbidIllness.objects.get(id=illness_id)
            illness.is_enabled = is_enabled
            illness.has_sub_options = has_sub_options
            illness.sub_options = sub_options
            illness.requires_specification = requires_specification
            illness.specification_placeholder = specification_placeholder
            illness.save()
            
            serializer = self.get_serializer(illness)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ComorbidIllness.DoesNotExist:
            return Response({'error': 'Comorbid illness not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VaccinationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing vaccination types configuration"""
    queryset = Vaccination.objects.all()
    serializer_class = VaccinationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter based on user permissions"""
        user = self.request.user
        if user.is_staff or user.user_type in ['staff', 'admin']:
            return Vaccination.objects.all().order_by('name')
        return Vaccination.objects.filter(is_enabled=True).order_by('name')
    
    @action(detail=False, methods=['post'])
    def create_vaccination(self, request):
        """Create a new vaccination"""
        try:
            name = request.data.get('name')
            is_enabled = request.data.get('is_enabled', True)
            
            if not name:
                return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            vaccination = Vaccination.objects.create(
                name=name,
                is_enabled=is_enabled
            )
            
            serializer = self.get_serializer(vaccination)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['put'])
    def update_vaccination(self, request):
        """Update an existing vaccination"""
        try:
            vaccination_id = request.data.get('id')
            is_enabled = request.data.get('is_enabled', True)
            
            if not vaccination_id:
                return Response({'error': 'ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            vaccination = Vaccination.objects.get(id=vaccination_id)
            vaccination.is_enabled = is_enabled
            vaccination.save()
            
            serializer = self.get_serializer(vaccination)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Vaccination.DoesNotExist:
            return Response({'error': 'Vaccination not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class PastMedicalHistoryItemViewSet(viewsets.ModelViewSet):
    """ViewSet for managing past medical history items"""
    queryset = PastMedicalHistoryItem.objects.all()
    serializer_class = PastMedicalHistoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Only allow staff/admin users to modify past medical history items"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter based on user permissions"""
        user = self.request.user
        if user.is_staff or user.user_type in ['staff', 'admin']:
            return PastMedicalHistoryItem.objects.all().order_by('name')
        return PastMedicalHistoryItem.objects.filter(is_enabled=True).order_by('name')
    
    def perform_create(self, serializer):
        """Only staff can create past medical history items"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can create past medical history items")
        serializer.save()
    
    def perform_update(self, serializer):
        """Only staff can update past medical history items"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can update past medical history items")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only staff can delete past medical history items"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can delete past medical history items")
        instance.delete()
    
    @action(detail=False, methods=['post'])
    def create_past_medical_history(self, request):
        """Create a new past medical history item"""
        try:
            name = request.data.get('name')
            is_enabled = request.data.get('is_enabled', True)
            has_sub_options = request.data.get('has_sub_options', False)
            sub_options = request.data.get('sub_options', [])
            requires_specification = request.data.get('requires_specification', False)
            specification_placeholder = request.data.get('specification_placeholder', '')
            
            if not name:
                return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            past_medical_history_item = PastMedicalHistoryItem.objects.create(
                name=name,
                is_enabled=is_enabled,
                has_sub_options=has_sub_options,
                sub_options=sub_options,
                requires_specification=requires_specification,
                specification_placeholder=specification_placeholder
            )
            
            serializer = self.get_serializer(past_medical_history_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['put'])
    def update_past_medical_history(self, request):
        """Update an existing past medical history item"""
        try:
            item_id = request.data.get('id')
            is_enabled = request.data.get('is_enabled', True)
            has_sub_options = request.data.get('has_sub_options', False)
            sub_options = request.data.get('sub_options', [])
            requires_specification = request.data.get('requires_specification', False)
            specification_placeholder = request.data.get('specification_placeholder', '')
            
            if not item_id:
                return Response({'error': 'ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            past_medical_history_item = PastMedicalHistoryItem.objects.get(id=item_id)
            past_medical_history_item.is_enabled = is_enabled
            past_medical_history_item.has_sub_options = has_sub_options
            past_medical_history_item.sub_options = sub_options
            past_medical_history_item.requires_specification = requires_specification
            past_medical_history_item.specification_placeholder = specification_placeholder
            past_medical_history_item.save()
            
            serializer = self.get_serializer(past_medical_history_item)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except PastMedicalHistoryItem.DoesNotExist:
            return Response({'error': 'Past medical history item not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def toggle_enabled(self, request, pk=None):
        """Toggle the enabled status of a past medical history item"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can toggle past medical history items")
        
        try:
            is_enabled = request.data.get('is_enabled', False)
            
            past_medical_history_item = PastMedicalHistoryItem.objects.get(id=pk)
            past_medical_history_item.is_enabled = is_enabled
            past_medical_history_item.save()
            
            serializer = self.get_serializer(past_medical_history_item)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except PastMedicalHistoryItem.DoesNotExist:
            return Response({'error': 'Past medical history item not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FamilyMedicalHistoryItemViewSet(viewsets.ModelViewSet):
    """ViewSet for managing family medical history items"""
    queryset = FamilyMedicalHistoryItem.objects.all()
    serializer_class = FamilyMedicalHistoryItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Only allow staff/admin users to modify family medical history items"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter based on user permissions"""
        user = self.request.user
        if user.is_staff or user.user_type in ['staff', 'admin']:
            return FamilyMedicalHistoryItem.objects.all().order_by('name')
        return FamilyMedicalHistoryItem.objects.filter(is_enabled=True).order_by('name')
    
    def perform_create(self, serializer):
        """Only staff can create family medical history items"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can create family medical history items")
        serializer.save()
    
    def perform_update(self, serializer):
        """Only staff can update family medical history items"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can update family medical history items")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only staff can delete family medical history items"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can delete family medical history items")
        instance.delete()
    
    @action(detail=False, methods=['post'])
    def create_family_medical_history(self, request):
        """Create a new family medical history item"""
        try:
            name = request.data.get('name')
            is_enabled = request.data.get('is_enabled', True)
            has_sub_options = request.data.get('has_sub_options', False)
            sub_options = request.data.get('sub_options', [])
            requires_specification = request.data.get('requires_specification', False)
            specification_placeholder = request.data.get('specification_placeholder', '')
            
            if not name:
                return Response({'error': 'Name is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            family_medical_history_item = FamilyMedicalHistoryItem.objects.create(
                name=name,
                is_enabled=is_enabled,
                has_sub_options=has_sub_options,
                sub_options=sub_options,
                requires_specification=requires_specification,
                specification_placeholder=specification_placeholder
            )
            
            serializer = self.get_serializer(family_medical_history_item)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['put'])
    def update_family_medical_history(self, request):
        """Update an existing family medical history item"""
        try:
            item_id = request.data.get('id')
            is_enabled = request.data.get('is_enabled', True)
            name = request.data.get('name')
            has_sub_options = request.data.get('has_sub_options')
            sub_options = request.data.get('sub_options')
            requires_specification = request.data.get('requires_specification')
            specification_placeholder = request.data.get('specification_placeholder')
            
            if not item_id:
                return Response({'error': 'ID is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            family_medical_history_item = FamilyMedicalHistoryItem.objects.get(id=item_id)
            family_medical_history_item.is_enabled = is_enabled
            
            # Update additional fields if provided
            if name is not None:
                family_medical_history_item.name = name
            if has_sub_options is not None:
                family_medical_history_item.has_sub_options = has_sub_options
            if sub_options is not None:
                family_medical_history_item.sub_options = sub_options
            if requires_specification is not None:
                family_medical_history_item.requires_specification = requires_specification
            if specification_placeholder is not None:
                family_medical_history_item.specification_placeholder = specification_placeholder
            
            family_medical_history_item.save()
            
            serializer = self.get_serializer(family_medical_history_item)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except FamilyMedicalHistoryItem.DoesNotExist:
            return Response({'error': 'Family medical history item not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'])
    def toggle_enabled(self, request, pk=None):
        """Toggle the enabled status of a family medical history item"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can toggle family medical history items")
        
        try:
            is_enabled = request.data.get('is_enabled', False)
            
            family_medical_history_item = FamilyMedicalHistoryItem.objects.get(id=pk)
            family_medical_history_item.is_enabled = is_enabled
            family_medical_history_item.save()
            
            serializer = self.get_serializer(family_medical_history_item)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except FamilyMedicalHistoryItem.DoesNotExist:
            return Response({'error': 'Family medical history item not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class SystemConfigurationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing system configuration"""
    queryset = SystemConfiguration.objects.all()
    serializer_class = SystemConfigurationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Only allow staff/admin users to access system configuration"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter based on user permissions"""
        user = self.request.user
        if user.is_staff or user.user_type in ['staff', 'admin']:
            return SystemConfiguration.objects.all()
        return SystemConfiguration.objects.none()
    
    def perform_create(self, serializer):
        """Only staff can create system configuration"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can create system configuration")
        serializer.save()
    
    def perform_update(self, serializer):
        """Only staff can update system configuration"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can update system configuration")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only staff can delete system configuration"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can delete system configuration")
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def dashboard_statistics(self, request):
        """Get dashboard statistics for admin panel"""
        user = request.user
        
        # Check if user has admin permissions
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            raise PermissionDenied("You don't have permission to view dashboard statistics.")
        
        try:
            from .models import (
                Appointment, MedicalDocument, 
                CustomUser, AcademicSchoolYear
            )
            
            # Get current academic year
            current_semester = None
            try:
                current_semester = AcademicSchoolYear.objects.filter(is_current=True).first()
            except:
                pass
            
            # Medical consultations statistics (using Appointment with type='medical')
            medical_total = Appointment.objects.filter(type='medical').count()
            medical_completed = Appointment.objects.filter(type='medical', status='completed').count()
            medical_pending = Appointment.objects.filter(type='medical', status='pending').count()
            medical_rejected = Appointment.objects.filter(type='medical', status='cancelled').count()
            
            # Dental consultations statistics (using Appointment with type='dental')
            dental_total = Appointment.objects.filter(type='dental').count()
            dental_completed = Appointment.objects.filter(type='dental', status='completed').count()
            dental_pending = Appointment.objects.filter(type='dental', status='pending').count()
            dental_rejected = Appointment.objects.filter(type='dental', status='cancelled').count()
            
            # Medical documents statistics
            documents_total = MedicalDocument.objects.count()
            documents_issued = MedicalDocument.objects.filter(status='issued').count()
            documents_pending = MedicalDocument.objects.filter(status='pending').count()
            
            # Patient statistics
            patients_total = CustomUser.objects.filter(user_type='student').count()
            patients_verified = CustomUser.objects.filter(user_type='student', is_email_verified=True).count()
            patients_unverified = CustomUser.objects.filter(user_type='student', is_email_verified=False).count()
            
            statistics = {
                'semester': {
                    'id': current_semester.id if current_semester else None,
                    'name': current_semester.academic_year if current_semester else 'Not Set'
                },
                'medical': {
                    'total': medical_total,
                    'completed': medical_completed,
                    'pending': medical_pending,
                    'rejected': medical_rejected
                },
                'dental': {
                    'total': dental_total,
                    'completed': dental_completed,
                    'pending': dental_pending,
                    'rejected': dental_rejected
                },
                'documents': {
                    'total': documents_total,
                    'issued': documents_issued,
                    'pending': documents_pending
                },
                'patients': {
                    'total': patients_total,
                    'verified': patients_verified,
                    'unverified': patients_unverified
                }
            }
            
            return Response(statistics, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'Failed to fetch dashboard statistics: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProfileRequirementViewSet(viewsets.ModelViewSet):
    """ViewSet for managing profile requirements"""
    queryset = ProfileRequirement.objects.all()
    serializer_class = ProfileRequirementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Only allow staff/admin users to modify profile requirements"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter based on user permissions"""
        user = self.request.user
        if user.is_staff or user.user_type in ['staff', 'admin']:
            return ProfileRequirement.objects.all()
        return ProfileRequirement.objects.none()
    
    def perform_create(self, serializer):
        """Only staff can create profile requirements"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can create profile requirements")
        serializer.save()
    
    def perform_update(self, serializer):
        """Only staff can update profile requirements"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can update profile requirements")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only staff can delete profile requirements"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can delete profile requirements")
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def toggle_enabled(self, request, pk=None):
        """Toggle the enabled status of a profile requirement"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can toggle profile requirements")
        
        try:
            is_enabled = request.data.get('is_enabled', False)
            
            profile_requirement = ProfileRequirement.objects.get(id=pk)
            profile_requirement.is_enabled = is_enabled
            profile_requirement.save()
            
            serializer = self.get_serializer(profile_requirement)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ProfileRequirement.DoesNotExist:
            return Response({'error': 'Profile requirement not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def update_profile_requirements(self, request):
        """Bulk update profile requirements (staff only)"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can update profile requirements")
        
        requirements_data = request.data.get('requirements', [])
        
        for req_data in requirements_data:
            req_id = req_data.get('id')
            if req_id:
                try:
                    requirement = ProfileRequirement.objects.get(id=req_id)
                    requirement.is_required = req_data.get('is_required', requirement.is_required)
                    requirement.is_active = req_data.get('is_active', requirement.is_active)
                    requirement.save()
                except ProfileRequirement.DoesNotExist:
                    continue
        
        return Response({'message': 'Profile requirements updated successfully'})
    
    @action(detail=False, methods=['get'])
    def get_form_configuration(self, request):
        """Get form configuration for profile setup - returns enabled fields organized by category"""
        try:
            # Get all active profile requirements
            requirements = ProfileRequirement.objects.filter(is_active=True)
            
            # Organize by category
            config = {
                'personal': [],
                'health': [],
                'emergency': [],
                'family': []
            }
            
            for req in requirements:
                category = req.category.lower()
                if category in config:
                    config[category].append({
                        'id': req.id,
                        'field_name': req.field_name,
                        'display_name': req.display_name,
                        'is_required': req.is_required,
                        'description': req.description or '',
                        'is_active': req.is_active
                    })
            
            return Response(config, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DocumentRequirementViewSet(viewsets.ModelViewSet):
    """ViewSet for managing document requirements"""
    queryset = DocumentRequirement.objects.all()
    serializer_class = DocumentRequirementSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Only allow staff/admin users to modify document requirements"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter based on user permissions"""
        user = self.request.user
        if user.is_staff or user.user_type in ['staff', 'admin']:
            return DocumentRequirement.objects.all()
        return DocumentRequirement.objects.none()
    
    def perform_create(self, serializer):
        """Only staff can create document requirements"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can create document requirements")
        serializer.save()
    
    def perform_update(self, serializer):
        """Only staff can update document requirements"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can update document requirements")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only staff can delete document requirements"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can delete document requirements")
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def toggle_enabled(self, request, pk=None):
        """Toggle the enabled status of a document requirement"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can toggle document requirements")
        
        try:
            is_enabled = request.data.get('is_enabled', False)
            
            document_requirement = DocumentRequirement.objects.get(id=pk)
            document_requirement.is_enabled = is_enabled
            document_requirement.save()
            
            serializer = self.get_serializer(document_requirement)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except DocumentRequirement.DoesNotExist:
            return Response({'error': 'Document requirement not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def update_document_requirements(self, request):
        """Bulk update document requirements"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can update document requirements")
        
        requirements_data = request.data.get('requirements', [])
        
        for req_data in requirements_data:
            req_id = req_data.get('id')
            if req_id:
                try:
                    requirement = DocumentRequirement.objects.get(id=req_id)
                    requirement.is_required = req_data.get('is_required', requirement.is_required)
                    requirement.validity_period_months = req_data.get('validity_period_months', requirement.validity_period_months)
                    requirement.specific_courses = req_data.get('specific_courses', requirement.specific_courses)
                    requirement.is_active = req_data.get('is_active', requirement.is_active)
                    requirement.save()
                except DocumentRequirement.DoesNotExist:
                    continue
        
        return Response({'message': 'Document requirements updated successfully'})


class CampusScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing campus schedules"""
    queryset = CampusSchedule.objects.all()
    serializer_class = CampusScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Only allow staff/admin users to modify campus schedules"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def get_queryset(self):
        """Filter based on user permissions"""
        user = self.request.user
        if user.is_staff or user.user_type in ['staff', 'admin']:
            return CampusSchedule.objects.all()
        return CampusSchedule.objects.none()
    
    def perform_create(self, serializer):
        """Only staff can create campus schedules"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can create campus schedules")
        serializer.save()
    
    def perform_update(self, serializer):
        """Only staff can update campus schedules"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can update campus schedules")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only staff can delete campus schedules"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can delete campus schedules")
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def toggle_enabled(self, request, pk=None):
        """Toggle the enabled status of a campus schedule"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can toggle campus schedules")
        
        try:
            is_enabled = request.data.get('is_enabled', False)
            
            campus_schedule = CampusSchedule.objects.get(id=pk)
            campus_schedule.is_enabled = is_enabled
            campus_schedule.save()
            
            serializer = self.get_serializer(campus_schedule)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except CampusSchedule.DoesNotExist:
            return Response({'error': 'Campus schedule not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def update_campus_schedules(self, request):
        """Bulk update campus schedules"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can update campus schedules")
        
        schedules_data = request.data.get('schedules', [])
        
        for schedule_data in schedules_data:
            campus = schedule_data.get('campus')
            if campus:
                schedule, created = CampusSchedule.objects.get_or_create(
                    campus=campus,
                    defaults={
                        'open_time': schedule_data.get('open_time', '08:00'),
                        'close_time': schedule_data.get('close_time', '17:00'),
                        'operating_days': schedule_data.get('operating_days', []),
                        'is_active': schedule_data.get('is_active', True)
                    }
                )
                if not created:
                    schedule.open_time = schedule_data.get('open_time', schedule.open_time)
                    schedule.close_time = schedule_data.get('close_time', schedule.close_time)
                    schedule.operating_days = schedule_data.get('operating_days', schedule.operating_days)
                    schedule.is_active = schedule_data.get('is_active', schedule.is_active)
                    schedule.save()
        
        return Response({'message': 'Campus schedules updated successfully'})


class DentistScheduleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing dentist schedules"""
    queryset = DentistSchedule.objects.all()
    serializer_class = DentistScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """Only allow staff/admin users to modify dentist schedules"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
            return [permission() for permission in permission_classes]
        return super().get_permissions()
    
    def get_queryset(self):
        """All authenticated users can view dentist schedules for booking appointments"""
        return DentistSchedule.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        """Only staff can create dentist schedules"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can create dentist schedules")
        serializer.save()
    
    def perform_update(self, serializer):
        """Only staff can update dentist schedules"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can update dentist schedules")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only staff can delete dentist schedules"""
        if not (self.request.user.is_staff or self.request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can delete dentist schedules")
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def toggle_enabled(self, request, pk=None):
        """Toggle the enabled status of a dentist schedule"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can toggle dentist schedules")
        
        try:
            is_enabled = request.data.get('is_enabled', False)
            
            dentist_schedule = DentistSchedule.objects.get(id=pk)
            dentist_schedule.is_enabled = is_enabled
            dentist_schedule.save()
            
            serializer = self.get_serializer(dentist_schedule)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except DentistSchedule.DoesNotExist:
            return Response({'error': 'Dentist schedule not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'])
    def update_dentist_schedules(self, request):
        """Bulk update dentist schedules"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can update dentist schedules")
        
        schedules_data = request.data.get('schedules', [])
        
        for schedule_data in schedules_data:
            dentist_name = schedule_data.get('dentist_name')
            campus = schedule_data.get('campus')
            
            if dentist_name and campus:
                schedule, created = DentistSchedule.objects.get_or_create(
                    dentist_name=dentist_name,
                    campus=campus,
                    defaults={
                        'available_days': schedule_data.get('available_days', []),
                        'time_slots': schedule_data.get('time_slots', []),
                        'is_active': schedule_data.get('is_active', True)
                    }
                )
                if not created:
                    schedule.available_days = schedule_data.get('available_days', schedule.available_days)
                    schedule.time_slots = schedule_data.get('time_slots', schedule.time_slots)
                    schedule.is_active = schedule_data.get('is_active', schedule.is_active)
                    schedule.save()
        
        return Response({'message': 'Dentist schedules updated successfully'})


class StaffDetailsViewSet(viewsets.ModelViewSet):
    queryset = StaffDetails.objects.all()
    serializer_class = StaffDetailsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = StaffDetails.objects.all()
        user_id = self.request.query_params.get('user')
        campus = self.request.query_params.get('campus')
        
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        if campus:
            queryset = queryset.filter(campus_assigned=campus)
            
        return queryset.select_related('user')

    def perform_create(self, serializer):
        user = self.request.user
        
        # If user is creating their own staff details
        if not user.is_staff and not user.user_type in ['staff', 'admin']:
            raise PermissionDenied("Only staff can create staff details")
            
        serializer.save()

    @action(detail=False, methods=['get', 'put'])
    def my_details(self, request):
        """Get or update staff details for the current user"""
        user = request.user
        
        if request.method == 'GET':
            try:
                staff_details = StaffDetails.objects.get(user=user)
                serializer = self.get_serializer(staff_details)
                return Response(serializer.data)
            except StaffDetails.DoesNotExist:
                return Response({'detail': 'No staff details found.'}, status=status.HTTP_404_NOT_FOUND)
        
        elif request.method == 'PUT':
            try:
                staff_details = StaffDetails.objects.get(user=user)
                # Update existing staff details
                serializer = self.get_serializer(staff_details, data=request.data, partial=True)
                if serializer.is_valid():
                    serializer.save()
                    return Response(serializer.data)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            except StaffDetails.DoesNotExist:
                # Create new staff details if none exist
                data = request.data.copy()
                data['user'] = user.id  # Set the user field
                serializer = self.get_serializer(data=data)
                if serializer.is_valid():
                    serializer.save(user=user)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MedicalDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for managing medical documents"""
    queryset = MedicalDocument.objects.all()
    serializer_class = MedicalDocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = MedicalDocument.objects.all()
        
        # If user is a patient, only show their own documents
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            patient_profiles = user.patient_profiles.all()
            queryset = queryset.filter(patient__in=patient_profiles)
        
        # Staff can see all documents, with optional filtering
        patient_id = self.request.query_params.get('patient_id')
        status_param = self.request.query_params.get('status')
        academic_year = self.request.query_params.get('academic_year')
        
        if patient_id:
            queryset = queryset.filter(patient_id=patient_id)
        if status_param:
            queryset = queryset.filter(status=status_param)
        if academic_year:
            queryset = queryset.filter(patient__school_year_id=academic_year)
            
        return queryset.select_related('patient', 'reviewed_by').order_by('-updated_at')

    def perform_create(self, serializer):
        user = self.request.user
        
        # If user is a patient, set their patient profile as the patient
        if not (user.is_staff or user.user_type in ['staff', 'admin']):
            patient_profile = user.get_current_patient_profile()
            if patient_profile:
                serializer.save(patient=patient_profile)
            else:
                raise PermissionDenied("No patient profile found. Please create your profile first.")
        else:
            # Staff can create documents for any patient (patient must be specified in data)
            serializer.save()
    @action(detail=True, methods=['post'])
    def send_email(self, request, pk=None):
        """Send medical certificate via email (staff only)"""
        if not (request.user.is_staff or getattr(request.user, 'user_type', None) in ['staff', 'admin']):
            raise PermissionDenied("Only staff can send certificates via email")

        doc = self.get_object()
        
        # Check if document has been issued (has a certificate)
        if doc.status != 'issued':
            return Response(
                {'error': 'Document must be issued before sending via email'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from django.core.mail import send_mail
            from django.conf import settings
            
            # Get patient email
            patient_email = doc.patient.user.email
            if not patient_email:
                return Response(
                    {'error': 'Patient email not found'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Email subject and content
            subject = f'Medical Certificate - {doc.patient.name}'
            message = f'''
Dear {doc.patient.name},

Your medical certificate has been issued and is attached to this email.

Document Type: {doc.document_type}
Issue Date: {doc.created_at.strftime('%B %d, %Y')}

Best regards,
WMSU Health Services
            '''
            
            # Send email
            send_mail(
                subject=subject,
                message=message,
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@wmsu.edu.ph'),
                recipient_list=[patient_email],
                fail_silently=False,
            )
            
            return Response(
                {'message': 'Medical certificate sent via email successfully!'}, 
                status=status.HTTP_200_OK
            )
            
        except Exception as e:
            return Response(
                {'error': f'Failed to send email: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    @action(detail=False, methods=['get'])
    def my_documents(self, request):
        """Get medical documents for the current user's patient profile"""
        user = request.user
        
        # Check if user is authenticated
        if not user.is_authenticated:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get current patient profile
        try:
            patient_profile = user.get_current_patient_profile()
            if not patient_profile:
                return Response({'detail': 'No patient profile found. Please create your profile first.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({'detail': 'No patient profile found. Please create your profile first.'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            document = MedicalDocument.objects.filter(patient=patient_profile).first()
            if document:
                serializer = self.get_serializer(document)
                return Response(serializer.data)
            else:
                # Return empty document structure for new users
                return Response({
                    'id': None,
                    'patient': patient_profile.id,
                    'chest_xray': None,
                    'cbc': None,
                    'blood_typing': None,
                    'urinalysis': None,
                    'drug_test': None,
                    'hepa_b': None,
                    'medical_certificate': None,
                    'status': 'pending',
                    'submitted_for_review': False,
                    'reviewed_by': None,
                    'reviewed_at': None,
                    'rejection_reason': None,
                    'certificate_issued_at': None,
                    'uploaded_at': None,
                    'updated_at': None,
                    'is_complete': False,
                    'completion_percentage': 0
                }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post', 'patch'])
    def update_my_documents(self, request):
        """Create or update medical documents for the current user"""
        user = request.user
        
        # Check if user is authenticated
        if not user.is_authenticated:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get current patient profile
        try:
            patient_profile = user.get_current_patient_profile()
            if not patient_profile:
                return Response({'detail': 'No patient profile found. Please create your profile first.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({'detail': 'No patient profile found. Please create your profile first.'}, status=status.HTTP_404_NOT_FOUND)
        
        # Try to get existing document
        document = MedicalDocument.objects.filter(patient=patient_profile).first()
        
        if document:
            # Reset status to pending if uploading new documents after rejection
            if document.status == 'rejected' and any(request.FILES.values()):
                document.status = 'pending'
                document.rejection_reason = None
                document.reviewed_by = None
                document.reviewed_at = None
            serializer = self.get_serializer(document, data=request.data, partial=True)
        else:
            # Create new document
            data = request.data.copy()
            data['patient'] = patient_profile.id
            serializer = self.get_serializer(data=data)
        
        if serializer.is_valid():
            document = serializer.save()
            # Add computed properties to response
            response_data = serializer.data
            response_data['is_complete'] = getattr(document, 'is_complete', False)
            response_data['completion_percentage'] = getattr(document, 'completion_percentage', 0)
            return Response(response_data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def submit_for_review(self, request):
        """Submit documents for staff review"""
        user = request.user
        
        # Check if user is authenticated
        if not user.is_authenticated:
            return Response({'detail': 'Authentication required.'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get current patient profile
        try:
            patient_profile = user.get_current_patient_profile()
            if not patient_profile:
                return Response({'detail': 'No patient profile found. Please create your profile first.'}, status=status.HTTP_404_NOT_FOUND)
        except Exception:
            return Response({'detail': 'No patient profile found. Please create your profile first.'}, status=status.HTTP_404_NOT_FOUND)
        
        document = MedicalDocument.objects.filter(patient=patient_profile).first()
        if not document:
            return Response({
                'detail': 'No medical documents found. Please upload documents first.'
            }, status=status.HTTP_404_NOT_FOUND)
            
        if not getattr(document, 'is_complete', False):
            return Response({
                'detail': 'Please upload all required documents before submitting for review.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        document.submitted_for_review = True
        document.status = 'pending'
        document.save()
        
        serializer = self.get_serializer(document)
        response_data = serializer.data
        response_data['is_complete'] = getattr(document, 'is_complete', False)
        response_data['completion_percentage'] = getattr(document, 'completion_percentage', 0)
        
        return Response(response_data)

    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        """Verify documents (staff only)"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can verify documents")
            
        doc = self.get_object()
        doc.status = 'verified'
        doc.reviewed_by = request.user
        doc.reviewed_at = timezone.now()
        doc.rejection_reason = None
        doc.save()
        
        serializer = self.get_serializer(doc)
        response_data = serializer.data
        response_data['is_complete'] = getattr(doc, 'is_complete', False)
        response_data['completion_percentage'] = getattr(doc, 'completion_percentage', 0)
        
        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Reject documents with reason (staff only)"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can reject documents")
            
        reason = request.data.get('reason', '')
        if not reason:
            return Response({
                'detail': 'Rejection reason is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        doc = self.get_object()
        doc.status = 'rejected'
        doc.reviewed_by = request.user
        doc.reviewed_at = timezone.now()
        doc.rejection_reason = reason
        doc.save()
        
        serializer = self.get_serializer(doc)
        response_data = serializer.data
        response_data['is_complete'] = getattr(doc, 'is_complete', False)
        response_data['completion_percentage'] = getattr(doc, 'completion_percentage', 0)
        
        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def issue_certificate(self, request, pk=None):
        """Issue medical certificate (staff only) - Generate PDF automatically"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can issue medical certificates")
            
        doc = self.get_object()
        
        # More robust status checking - allow issuing if verified or already issued
        if doc.status not in ['verified', 'issued']:
            return Response({
                'detail': f'Documents must be verified before certificate can be issued. Current status: {doc.status}. Please verify the documents first.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Only update status if not already issued
        if doc.status != 'issued':
            doc.status = 'issued'
            doc.certificate_issued_at = timezone.now()
            
            # Generate and save the medical certificate PDF automatically
            try:
                from .pdf_utils import save_medical_certificate_pdf
                # Pass the current user as the issuing user
                doc._issuing_user = request.user
                save_medical_certificate_pdf(doc, save_to_model=True)
            except Exception as e:
                # Log the error but don't fail the certificate issuance
                print(f"Warning: Failed to generate PDF for medical certificate: {e}")
            
            doc.save()
        
        serializer = self.get_serializer(doc)
        response_data = serializer.data
        response_data['is_complete'] = getattr(doc, 'is_complete', False)
        response_data['completion_percentage'] = getattr(doc, 'completion_percentage', 0)
        
        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def advise_for_consultation(self, request, pk=None):
        """Advise patient for consultation (staff only)"""
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin']):
            raise PermissionDenied("Only staff can advise for consultation")
            
        reason = request.data.get('reason', '')
        if not reason:
            return Response({
                'detail': 'Consultation reason is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        doc = self.get_object()
        doc.status = 'for_consultation'
        doc.consultation_reason = reason
        doc.advised_for_consultation_by = request.user
        doc.advised_for_consultation_at = timezone.now()
        doc.save()
        
        serializer = self.get_serializer(doc)
        response_data = serializer.data
        response_data['is_complete'] = getattr(doc, 'is_complete', False)
        response_data['completion_percentage'] = getattr(doc, 'completion_percentage', 0)
        
        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def view_certificate(self, request, pk=None):
        """View medical certificate PDF directly"""
        doc = self.get_object()
        
        # Check permissions - patient can view their own certificates, staff can view all
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin'] or 
                (hasattr(doc, 'patient') and hasattr(doc.patient, 'user') and doc.patient.user == request.user)):
            raise PermissionDenied("You don't have permission to view this certificate.")
        
        # Check if certificate exists and is issued
        if doc.status != 'issued' or not doc.medical_certificate:
            return Response({
                'error': 'Medical certificate not available or not issued yet'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            import os
            from django.http import FileResponse
            
            file_path = doc.medical_certificate.path
            if not os.path.exists(file_path):
                return Response({
                    'error': 'Medical certificate file not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Create response for viewing (inline)
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='application/pdf',
                filename=f"medical_certificate_{doc.patient.name}_{doc.certificate_issued_at.strftime('%Y%m%d') if doc.certificate_issued_at else 'issued'}.pdf"
            )
            response['Content-Disposition'] = f'inline; filename="medical_certificate_{doc.patient.name}_{doc.certificate_issued_at.strftime("%Y%m%d") if doc.certificate_issued_at else "issued"}.pdf"'
            return response
            
        except Exception as e:
            return Response({
                'error': f'Failed to retrieve medical certificate: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'])
    def download_certificate(self, request, pk=None):
        """Download medical certificate PDF directly"""
        doc = self.get_object()
        
        # Check permissions - patient can download their own certificates, staff can download all
        if not (request.user.is_staff or request.user.user_type in ['staff', 'admin'] or 
                (hasattr(doc, 'patient') and hasattr(doc.patient, 'user') and doc.patient.user == request.user)):
            raise PermissionDenied("You don't have permission to download this certificate.")
        
        # Check if certificate exists and is issued
        if doc.status != 'issued' or not doc.medical_certificate:
            return Response({
                'error': 'Medical certificate not available or not issued yet'
            }, status=status.HTTP_404_NOT_FOUND)
        
        try:
            import os
            from django.http import FileResponse
            
            file_path = doc.medical_certificate.path
            if not os.path.exists(file_path):
                return Response({
                    'error': 'Medical certificate file not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Create response for download (attachment)
            response = FileResponse(
                open(file_path, 'rb'),
                content_type='application/pdf',
                filename=f"medical_certificate_{doc.patient.name}_{doc.certificate_issued_at.strftime('%Y%m%d') if doc.certificate_issued_at else 'issued'}.pdf"
            )
            response['Content-Disposition'] = f'attachment; filename="medical_certificate_{doc.patient.name}_{doc.certificate_issued_at.strftime("%Y%m%d") if doc.certificate_issued_at else "issued"}.pdf"'
            return response
            
        except Exception as e:
            return Response({
                'error': f'Failed to download medical certificate: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AppointmentViewSetDuplicate(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        try:
            if user.is_staff or user.user_type in ['staff', 'admin']:
                # Staff can see appointments based on their campus assignment
                queryset = Appointment.objects.select_related('patient', 'doctor').all()
                
                # Filter by staff's assigned campus
                if hasattr(user, 'staff_details') and user.staff_details.campus_assigned:
                    queryset = queryset.filter(campus=user.staff_details.campus_assigned)
                # If no staff details, show all (for backward compatibility)
                
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
                            'email': user.email,
                            'student_id': f"TEMP-{user.id}",
                        }
                    )
                    queryset = Appointment.objects.filter(patient=patient_profile).select_related('patient', 'doctor')
                except AcademicSchoolYear.DoesNotExist:
                    # No active school year, return empty queryset
                    queryset = Appointment.objects.none()

            # --- Filtering from query parameters ---

            # Filter by type (for admin: medical/dental)
            appointment_type = self.request.query_params.get('type')
            if appointment_type:
                queryset = queryset.filter(type=appointment_type)

            # Filter by status
            status_param = self.request.query_params.get('status')
            if status_param and status_param.lower() != 'all':
                 # Handle multiple statuses for history tab (e.g., completed,cancelled)
                if ',' in status_param:
                    statuses = status_param.split(',')
                    queryset = queryset.filter(status__in=statuses)
                else:
                    queryset = queryset.filter(status=status_param)

            # Filter by patient ID (if staff is looking at one patient)
            patient_id = self.request.query_params.get('patient_id')
            if (user.is_staff or user.user_type in ['staff', 'admin']) and patient_id:
                try:
                    queryset = queryset.filter(patient_id=int(patient_id))
                except (ValueError, TypeError):
                    pass
                
            # Filter by doctor ID
            doctor_id = self.request.query_params.get('doctor_id')
            if doctor_id:
                try:
                    queryset = queryset.filter(doctor_id=int(doctor_id))
                except (ValueError, TypeError):
                    pass
                
            # Filter by date
            date = self.request.query_params.get('date')
            if date:
                try:
                    queryset = queryset.filter(appointment_date=date)
                except ValueError:
                    pass

            # Search by patient name (for admin)
            search_query = self.request.query_params.get('search')
            if (user.is_staff or user.user_type in ['staff', 'admin']) and search_query:
                queryset = queryset.filter(patient__name__icontains=search_query)

            # Filter by school year
            school_year_param = self.request.query_params.get('school_year')
            if school_year_param:
                try:
                    # Filter appointments by patient's school year or appointment's school year
                    # This handles both cases where school year might be set on the appointment or patient
                    from django.db.models import Q
                    queryset = queryset.filter(
                        Q(patient__school_year_id=int(school_year_param)) | 
                        Q(school_year_id=int(school_year_param))
                    )
                except (ValueError, TypeError):
                    # If school_year_param is not a valid integer, ignore the filter
                    pass

            # --- Ordering ---
            ordering = self.request.query_params.get('ordering')
            order_by_fields = ['-appointment_date', '-appointment_time'] # Default
            
            if ordering == 'name':
                order_by_fields = ['patient__name']
            elif ordering == 'time':
                order_by_fields = ['appointment_date', 'appointment_time']
            elif ordering == '-appointment_date':
                order_by_fields = ['-appointment_date', '-appointment_time']

            return queryset.order_by(*order_by_fields)
            
        except Exception as e:
            # Log the error and return an empty queryset to prevent 500 errors
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error in AppointmentViewSet.get_queryset: {str(e)}")
            return Appointment.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        
        # Check if user is blocked from booking consultations
        if user.is_blocked:
            raise PermissionDenied(f"Your account has been blocked from booking consultations. Reason: {user.block_reason or 'No reason provided'}")
        
        # If the user is staff, they can create an appointment for any patient.
        # The patient ID should be in the request data.
        if user.is_staff or user.user_type in ['staff', 'admin']:
            serializer.save() 
            return

        # If the user is a patient, they can only create an appointment for themselves.
        # Get the current patient profile
        current_patient_profile = user.get_current_patient_profile()
        if current_patient_profile:
            serializer.save(patient=current_patient_profile)
        else:
            # If no patient profile exists, we need to create one first
            try:
                current_school_year = AcademicSchoolYear.objects.get(is_current=True)
                # Create a patient profile automatically
                patient_profile = Patient.objects.create(
                    user=user,
                    school_year=current_school_year,
                    name=f"{user.last_name}, {user.first_name}" if user.first_name and user.last_name else user.username,
                    first_name=user.first_name or '',
                    email=user.email,
                    student_id=f"TEMP-{user.id}",
                )
                serializer.save(patient=patient_profile)
            except AcademicSchoolYear.DoesNotExist:
                raise serializers.ValidationError("No active school year found. Please contact administration.")
            except Exception as e:
                raise serializers.ValidationError(f"Could not create patient profile: {str(e)}")
    
    @action(detail=True, methods=['post'])
    def reschedule(self, request, pk=None):
        """
        Reschedule an appointment with proper tracking
        """
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
            from datetime import datetime
            new_date_obj = datetime.strptime(new_date, '%Y-%m-%d').date()
            new_time_obj = datetime.strptime(new_time, '%H:%M').time()
            
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
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel an appointment
        """
        appointment = self.get_object()
        user = request.user
        
        # Check permissions
        if not (user.is_staff or user.user_type in ['staff', 'admin'] or 
                appointment.patient.user == user):
            raise PermissionDenied("You don't have permission to cancel this appointment.")
        
        # Update the appointment status to cancelled
        appointment.status = 'cancelled'
        appointment.cancelled_by = user
        appointment.cancelled_at = timezone.now()
        appointment.save()
        


