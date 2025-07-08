#!/usr/bin/env python
import os
import sys
import django

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')

try:
    django.setup()
    print("Django setup successful")
    
    # Test the specific import
    from api.views import StaffManagementViewSet
    print("Successfully imported StaffManagementViewSet")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
