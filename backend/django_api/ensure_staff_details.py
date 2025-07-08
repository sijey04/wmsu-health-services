#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import CustomUser, StaffDetails

def check_and_create_staff_details():
    print("Checking staff details...")
    
    # Check if there are any staff users without staff details
    staff_users = CustomUser.objects.filter(user_type__in=['staff', 'admin'])
    print(f'Total staff users: {staff_users.count()}')

    for user in staff_users:
        try:
            staff_details = StaffDetails.objects.get(user=user)
            print(f'✓ {user.email} has staff details: {staff_details.full_name}')
        except StaffDetails.DoesNotExist:
            print(f'✗ {user.email} missing staff details')
            # Create basic staff details
            full_name = f'{user.first_name} {user.last_name}'.strip() or user.username
            staff_details = StaffDetails.objects.create(
                user=user,
                full_name=full_name,
                position='Healthcare Staff',
                license_number='LIC-' + str(user.id).zfill(5),
                ptr_number='PTR-' + str(user.id).zfill(5),
                campus_assigned='a',
                phone_number='+63912345' + str(user.id).zfill(4)
            )
            print(f'  → Created staff details for {user.email}: {full_name}')

if __name__ == "__main__":
    check_and_create_staff_details()
