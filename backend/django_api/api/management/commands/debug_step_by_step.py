from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from api.models import CustomUser, Appointment
from django.http import QueryDict

class Command(BaseCommand):
    help = 'Step-by-step debug of AppointmentViewSet logic'

    def handle(self, *args, **options):
        print("=== STEP-BY-STEP APPOINTMENTVIEWSET DEBUG ===")
        
        # Get admin user
        admin_user = CustomUser.objects.get(email='admin@wmsu.edu.ph')
        print(f"Admin user: {admin_user.email}")
        
        # Simulate the get_queryset logic step by step
        user = admin_user
        print(f"\n1. User check:")
        print(f"   is_staff: {user.is_staff}")
        print(f"   user_type: {user.user_type}")
        
        # Initial queryset
        print(f"\n2. Initial queryset:")
        if user.is_staff or user.user_type in ['staff', 'admin']:
            queryset = Appointment.objects.select_related('patient', 'doctor').all()
            print(f"   Staff user - queryset count: {queryset.count()}")
        elif hasattr(user, 'patient_profile'):
            queryset = Appointment.objects.filter(patient=user.patient_profile).select_related('patient', 'doctor')
            print(f"   Patient user - queryset count: {queryset.count()}")
        else:
            queryset = Appointment.objects.none()
            print(f"   No profile - queryset count: {queryset.count()}")
        
        # Simulate empty query params (no filters)
        query_params = QueryDict('')
        
        print(f"\n3. Filter checks (no query params):")
        
        # Filter by type
        appointment_type = query_params.get('type')
        print(f"   appointment_type: {appointment_type}")
        if appointment_type:
            queryset = queryset.filter(type=appointment_type)
            print(f"   After type filter: {queryset.count()}")
        
        # Filter by status
        status_param = query_params.get('status')
        print(f"   status_param: {status_param}")
        if status_param and status_param.lower() != 'all':
            if ',' in status_param:
                statuses = status_param.split(',')
                queryset = queryset.filter(status__in=statuses)
            else:
                queryset = queryset.filter(status=status_param)
            print(f"   After status filter: {queryset.count()}")
        
        # Filter by patient ID
        patient_id = query_params.get('patient_id')
        print(f"   patient_id: {patient_id}")
        if user.is_staff or user.user_type in ['staff', 'admin'] and patient_id:
            queryset = queryset.filter(patient_id=patient_id)
            print(f"   After patient_id filter: {queryset.count()}")
        
        # Filter by doctor ID
        doctor_id = query_params.get('doctor_id')
        print(f"   doctor_id: {doctor_id}")
        if doctor_id:
            queryset = queryset.filter(doctor_id=doctor_id)
            print(f"   After doctor_id filter: {queryset.count()}")
        
        # Filter by date
        date = query_params.get('date')
        print(f"   date: {date}")
        if date:
            queryset = queryset.filter(appointment_date=date)
            print(f"   After date filter: {queryset.count()}")
        
        # Search by patient name
        search_query = query_params.get('search')
        print(f"   search_query: {search_query}")
        if (user.is_staff or user.user_type in ['staff', 'admin']) and search_query:
            queryset = queryset.filter(patient__name__icontains=search_query)
            print(f"   After search filter: {queryset.count()}")
        
        print(f"\n4. Before ordering: {queryset.count()}")
        
        # Ordering
        ordering = query_params.get('ordering')
        print(f"   ordering: {ordering}")
        order_by_fields = ['-appointment_date', '-appointment_time']  # Default
        
        if ordering == 'name':
            order_by_fields = ['patient__name']
        elif ordering == 'time':
            order_by_fields = ['appointment_date', 'appointment_time']
            
        print(f"   order_by_fields: {order_by_fields}")
        
        final_queryset = queryset.order_by(*order_by_fields)
        print(f"\n5. FINAL RESULT: {final_queryset.count()}")
        
        # List the appointments if any
        if final_queryset.count() > 0:
            print(f"\nAppointments:")
            for appointment in final_queryset:
                print(f"   {appointment.id}: {appointment.patient.name} - {appointment.type}")
        else:
            print("\nNo appointments in final queryset")
            
        # Double-check raw query
        print(f"\n6. Raw database check:")
        raw_count = Appointment.objects.count()
        print(f"   Raw appointment count: {raw_count}")
