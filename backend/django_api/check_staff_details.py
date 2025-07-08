#!/usr/bin/env python3
import os
import sys
import django

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import CustomUser, StaffDetails

# Check staff details for test user
user = CustomUser.objects.get(email='test@example.com')
print(f'User ID: {user.id}')
print(f'User is_staff: {user.is_staff}')
print(f'User type: {user.user_type}')

staff_details = StaffDetails.objects.filter(user=user)
print(f'Staff details count: {staff_details.count()}')

if staff_details.exists():
    staff = staff_details.first()
    print(f'Staff details: {staff}')
    print(f'Full name: {staff.full_name}')
    print(f'Position: {staff.position}')
else:
    print('No staff details found')
    
    # Try to create them now
    try:
        staff_details = StaffDetails.objects.create(
            user=user,
            full_name='Test User',
            position='Doctor',
            license_number='12345',
            ptr_number='PTR123',
            phone_number='123-456-7890',
            assigned_campuses='a,b'
        )
        print(f'Created staff details: {staff_details}')
    except Exception as e:
        print(f'Error creating staff details: {e}')
