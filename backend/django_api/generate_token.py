#!/usr/bin/env python3
import os
import sys
import django
from django.conf import settings

# Add the Django project to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
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
        
        return user, str(access_token)
        
    except Exception as e:
        print(f"Error creating test user: {e}")
        import traceback
        traceback.print_exc()
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
