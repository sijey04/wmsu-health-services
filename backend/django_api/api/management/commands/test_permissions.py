from django.core.management.base import BaseCommand
from api.models import CustomUser, Appointment

class Command(BaseCommand):
    help = 'Test staff user permissions and appointments'

    def handle(self, *args, **options):
        print("Testing staff user permissions...")
        
        # Get staff users
        staff_users = CustomUser.objects.filter(is_staff=True)
        print(f"Staff users count: {staff_users.count()}")
        
        for user in staff_users:
            print(f"  Staff user: {user.email}, user_type: {user.user_type}, is_staff: {user.is_staff}")
        
        # Check appointments 
        appointments = Appointment.objects.all()
        print(f"Total appointments in database: {appointments.count()}")
        
        for appointment in appointments:
            print(f"  Appointment: {appointment.patient.name} - {appointment.type} - {appointment.status}")
        
        # Test the queryset logic from AppointmentViewSet for staff user
        if staff_users.exists():
            staff_user = staff_users.first()
            print(f"\nTesting queryset for staff user: {staff_user.email}")
            
            # Simulate the queryset from AppointmentViewSet
            if staff_user.is_staff or staff_user.user_type in ['staff', 'admin']:
                queryset = Appointment.objects.select_related('patient', 'doctor').all()
                print(f"  Staff can see {queryset.count()} appointments")
                
                # Test with type filter
                medical_queryset = queryset.filter(type='medical')
                dental_queryset = queryset.filter(type='dental')
                print(f"  Medical appointments: {medical_queryset.count()}")
                print(f"  Dental appointments: {dental_queryset.count()}")
