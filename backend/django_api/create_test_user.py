#!/usr/bin/env python3
import os
import sys
import django
from django.conf import settings

# Add the Django project to the Python path
sys.path.append('/path/to/your/django/project')

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import CustomUser, StaffDetails
from rest_framework.authtoken.models import Token
from rest_framework_simplejwt.tokens import RefreshToken

# Create a test user
def create_test_user():
    try:
        # Create test user
        email = 'test@example.com'
        password = 'testpass123'
        
        user, created = CustomUser.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': 'Test',
                'last_name': 'User',
                'is_staff': True,
                'user_type': 'staff'
            }
        )
        
        if created:
            user.set_password(password)
            user.save()
            print(f"Created test user: {email}")
        else:
            print(f"Test user already exists: {email}")
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        print(f"Access Token: {access_token}")
        print(f"Refresh Token: {refresh}")
        
        # Create staff details if not exists
        staff_details, created = StaffDetails.objects.get_or_create(
            user=user,
            defaults={
                'full_name': 'Test User',
                'position': 'Doctor',
                'license_number': '12345',
                'ptr_number': 'PTR123',
                'phone_number': '123-456-7890',
                'assigned_campuses': 'a,b'
            }
        )
        
        if created:
            print("Created staff details for test user")
        else:
            print("Staff details already exist for test user")
            
        return user, access_token
        
    except Exception as e:
        print(f"Error creating test user: {e}")
        return None, None

if __name__ == "__main__":
    user, token = create_test_user()
    if user and token:
        print("\n=== Test User Created Successfully ===")
        print(f"Email: {user.email}")
        print(f"Is Staff: {user.is_staff}")
        print(f"User Type: {user.user_type}")
        print(f"Access Token: {token}")
        print("\nYou can now use this token to test the API endpoints")
    else:
        print("Failed to create test user")
