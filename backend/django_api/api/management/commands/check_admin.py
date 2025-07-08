from django.core.management.base import BaseCommand
from api.models import CustomUser

class Command(BaseCommand):
    help = 'Check admin user properties'

    def handle(self, *args, **options):
        print("=== ADMIN USER DEBUG ===")
        
        try:
            admin_user = CustomUser.objects.get(email='admin@wmsu.edu.ph')
            print(f"Found admin user: {admin_user.email}")
            print(f"  is_staff: {admin_user.is_staff}")
            print(f"  user_type: {admin_user.user_type}")
            print(f"  is_superuser: {admin_user.is_superuser}")
            print(f"  has patient_profile: {hasattr(admin_user, 'patient_profile')}")
            
            # Test the condition from AppointmentViewSet
            condition_result = admin_user.is_staff or admin_user.user_type in ['staff', 'admin']
            print(f"  Staff condition result: {condition_result}")
            
            if condition_result:
                print("  ✓ Admin user should see all appointments")
            else:
                print("  ✗ Admin user will not see appointments")
                
        except CustomUser.DoesNotExist:
            print("Admin user not found!")
            
        # List all staff users
        staff_users = CustomUser.objects.filter(is_staff=True)
        print(f"\nAll staff users ({staff_users.count()}):")
        for user in staff_users:
            print(f"  {user.email} - is_staff: {user.is_staff}, user_type: {user.user_type}")
