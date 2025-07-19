from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, F
from django.utils import timezone
from datetime import date, timedelta
from .models import AcademicSchoolYear, Patient, Appointment, MedicalDocument, DentalFormData, CustomUser
from .serializers import AcademicSchoolYearSerializer, PatientSerializer


class AcademicSemesterViewSet(viewsets.ModelViewSet):
    """ViewSet for Academic Semester management"""
    queryset = AcademicSchoolYear.objects.all()
    serializer_class = AcademicSchoolYearSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status if provided
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by academic year if provided
        academic_year = self.request.query_params.get('academic_year')
        if academic_year:
            queryset = queryset.filter(academic_year=academic_year)
        
        return queryset.order_by('-academic_year')
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get the current active semester"""
        try:
            current_year = AcademicSchoolYear.objects.get(is_current=True)
            serializer = self.get_serializer(current_year)
            return Response(serializer.data)
        except AcademicSchoolYear.DoesNotExist:
            return Response(
                {'error': 'No current academic year found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get all active semesters"""
        active = self.get_queryset().filter(status='active').order_by('-academic_year')
        serializer = self.get_serializer(active, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming semesters"""
        upcoming = self.get_queryset().filter(status='upcoming').order_by('start_date')
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def patients(self, request, pk=None):
        """Get all patients in a specific academic year and semester"""
        school_year = self.get_object()
        
        # Get semester parameter
        semester = request.query_params.get('semester')
        
        # Filter patients by school year and optionally by semester
        patients_queryset = Patient.objects.filter(school_year=school_year)
        
        if semester:
            patients_queryset = patients_queryset.filter(semester=semester)
        
        # Additional filters
        search = request.query_params.get('search')
        if search:
            patients_queryset = patients_queryset.filter(
                Q(name__icontains=search) |
                Q(student_id__icontains=search) |
                Q(email__icontains=search)
            )
        
        serializer = PatientSerializer(patients_queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get statistics for a specific academic year"""
        school_year = self.get_object()
        
        # Get semester parameter
        semester = request.query_params.get('semester')
        
        # Base queryset for patients
        patients_base = Patient.objects.filter(school_year=school_year)
        if semester:
            patients_base = patients_base.filter(semester=semester)
        
        # Base queryset for appointments
        appointments_base = Appointment.objects.filter(school_year=school_year)
        if semester:
            appointments_base = appointments_base.filter(semester=semester)
        
        # Calculate statistics
        stats = {
            'total_patients': patients_base.count(),
            'patients_by_semester': {
                '1st_semester': patients_base.filter(semester='1st_semester').count(),
                '2nd_semester': patients_base.filter(semester='2nd_semester').count(),
                'summer': patients_base.filter(semester='summer').count(),
            },
            'total_appointments': appointments_base.count(),
            'appointments_by_status': {
                'pending': appointments_base.filter(status='pending').count(),
                'confirmed': appointments_base.filter(status='confirmed').count(),
                'completed': appointments_base.filter(status='completed').count(),
                'cancelled': appointments_base.filter(status='cancelled').count(),
            },
            'appointments_by_type': {
                'medical': appointments_base.filter(type='medical').count(),
                'dental': appointments_base.filter(type='dental').count(),
            },
            'appointments_by_semester': {
                '1st_semester': appointments_base.filter(semester='1st_semester').count(),
                '2nd_semester': appointments_base.filter(semester='2nd_semester').count(),
                'summer': appointments_base.filter(semester='summer').count(),
            }
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a school year (make it current)"""
        school_year = self.get_object()
        
        # Deactivate all other school years
        AcademicSchoolYear.objects.filter(is_current=True).update(is_current=False)
        
        # Activate this school year
        school_year.is_current = True
        school_year.status = 'active'
        school_year.save()
        
        serializer = self.get_serializer(school_year)
        return Response(serializer.data)


class StudentSemesterProfileViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Student Semester Profile management (using Patient model)"""
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by school year if provided
        school_year_id = self.request.query_params.get('school_year')
        if school_year_id:
            queryset = queryset.filter(school_year_id=school_year_id)
        
        # Filter by semester if provided
        semester = self.request.query_params.get('semester')
        if semester:
            queryset = queryset.filter(semester=semester)
        
        # Filter by user if provided (for current user's profiles)
        user_id = self.request.query_params.get('user')
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(student_id__icontains=search) |
                Q(email__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def current_user_profiles(self, request):
        """Get current user's semester profiles"""
        if not request.user.is_authenticated:
            return Response(
                {'error': 'Authentication required'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        profiles = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(profiles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_semester(self, request):
        """Get profiles grouped by semester"""
        school_year_id = request.query_params.get('school_year')
        if not school_year_id:
            return Response(
                {'error': 'school_year parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            school_year = AcademicSchoolYear.objects.get(id=school_year_id)
        except AcademicSchoolYear.DoesNotExist:
            return Response(
                {'error': 'School year not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Group profiles by semester
        profiles_by_semester = {
            '1st_semester': self.get_queryset().filter(
                school_year=school_year, 
                semester='1st_semester'
            ),
            '2nd_semester': self.get_queryset().filter(
                school_year=school_year, 
                semester='2nd_semester'
            ),
            'summer': self.get_queryset().filter(
                school_year=school_year, 
                semester='summer'
            ),
        }
        
        # Serialize each group
        result = {}
        for semester_code, profiles in profiles_by_semester.items():
            serializer = self.get_serializer(profiles, many=True)
            result[semester_code] = {
                'count': profiles.count(),
                'profiles': serializer.data
            }
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def export_data(self, request):
        """Export semester profile data for reporting"""
        school_year_id = request.query_params.get('school_year')
        semester = request.query_params.get('semester')
        
        queryset = self.get_queryset()
        
        if school_year_id:
            queryset = queryset.filter(school_year_id=school_year_id)
        
        if semester:
            queryset = queryset.filter(semester=semester)
        
        # Prepare export data
        export_data = []
        for patient in queryset:
            export_data.append({
                'student_id': patient.student_id,
                'name': patient.name,
                'email': patient.email,
                'semester': patient.get_semester_display(),
                'school_year': patient.school_year.academic_year if patient.school_year else 'N/A',
                'gender': patient.gender,
                'department': patient.department,
                'contact_number': patient.contact_number,
                'created_at': patient.created_at.isoformat(),
            })
        
        return Response(export_data)


# Additional helper functions for semester management
def get_current_semester_info():
    """Helper function to get current semester information"""
    try:
        current_year = AcademicSchoolYear.objects.get(is_current=True)
        current_semester = current_year.get_current_semester()
        
        return {
            'school_year': current_year,
            'semester': current_semester,
            'semester_display': current_year.get_semester_display()
        }
    except AcademicSchoolYear.DoesNotExist:
        return None


def get_semester_patient_stats(school_year_id, semester=None):
    """Helper function to get patient statistics for a semester"""
    try:
        school_year = AcademicSchoolYear.objects.get(id=school_year_id)
        
        patients_queryset = Patient.objects.filter(school_year=school_year)
        if semester:
            patients_queryset = patients_queryset.filter(semester=semester)
        
        return {
            'total_patients': patients_queryset.count(),
            'by_gender': {
                'male': patients_queryset.filter(gender='Male').count(),
                'female': patients_queryset.filter(gender='Female').count(),
                'other': patients_queryset.filter(gender='Other').count(),
            },
            'recent_registrations': patients_queryset.filter(
                created_at__gte=timezone.now() - timedelta(days=30)
            ).count(),
        }
    except AcademicSchoolYear.DoesNotExist:
        return None
