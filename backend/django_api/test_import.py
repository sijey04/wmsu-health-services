#!/usr/bin/env python
import os
import sys
import django

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

try:
    from api.views import StaffManagementViewSet
    print("Successfully imported StaffManagementViewSet")
    print(f"StaffManagementViewSet class: {StaffManagementViewSet}")
    print(f"StaffManagementViewSet methods: {dir(StaffManagementViewSet)}")
except ImportError as e:
    print(f"Import error: {e}")
except Exception as e:
    print(f"Other error: {e}")
