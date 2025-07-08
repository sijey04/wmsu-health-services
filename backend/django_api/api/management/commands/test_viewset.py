from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import CustomUser, Appointment
from api.views import AppointmentViewSet
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser

class Command(BaseCommand):
    help = 'Test AppointmentViewSet get_queryset directly'

    def handle(self, *args, **options):
        print("=== TESTING APPOINTMENTVIEWSET GET_QUERYSET ===")
        
        # Get admin user
        admin_user = CustomUser.objects.get(email='admin@wmsu.edu.ph')
        print(f"Admin user: {admin_user.email}, is_staff: {admin_user.is_staff}, user_type: {admin_user.user_type}")
          # Create a mock request
        factory = RequestFactory()
        request = factory.get('/api/appointments/')
        request.user = admin_user
        
        # Add query_params attribute (DRF adds this)
        from django.http import QueryDict
        request.query_params = QueryDict('')
        
        # Create viewset instance and test get_queryset
        viewset = AppointmentViewSet()
        viewset.request = request
        
        print(f"\nTesting get_queryset method...")
        
        # Test the conditions manually
        user = request.user
        print(f"user.is_staff: {user.is_staff}")
        print(f"user.user_type: {user.user_type}")
        print(f"user.user_type in ['staff', 'admin']: {user.user_type in ['staff', 'admin']}")
        print(f"Condition result: {user.is_staff or user.user_type in ['staff', 'admin']}")
        
        # Call get_queryset
        queryset = viewset.get_queryset()
        print(f"Queryset count: {queryset.count()}")
          # Test different query params
        print(f"\n--- Testing with type filter ---")
        request_medical = factory.get('/api/appointments/?type=medical')
        request_medical.user = admin_user
        request_medical.query_params = QueryDict('type=medical')
        viewset.request = request_medical
        
        medical_queryset = viewset.get_queryset()
        print(f"Medical queryset count: {medical_queryset.count()}")
        
        # Test all appointments in DB
        print(f"\n--- Database verification ---")
        all_appointments = Appointment.objects.all()
        print(f"Total appointments in DB: {all_appointments.count()}")
        
        for appointment in all_appointments:
            print(f"  {appointment.id}: {appointment.patient.name} - {appointment.type} - {appointment.status}")
