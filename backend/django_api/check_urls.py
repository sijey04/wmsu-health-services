#!/usr/bin/env python
"""
Check available URLs
"""
import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from django.urls import reverse
from rest_framework.routers import DefaultRouter
from api.views import ProfileRequirementViewSet, DocumentRequirementViewSet, CampusScheduleViewSet, DentistScheduleViewSet

# Create a router and register the ViewSets
router = DefaultRouter()
router.register(r'admin-controls/profile_requirements', ProfileRequirementViewSet, basename='admin-controls-profile-requirements')
router.register(r'admin-controls/document_requirements', DocumentRequirementViewSet, basename='admin-controls-document-requirements')
router.register(r'admin-controls/campus_schedules', CampusScheduleViewSet, basename='admin-controls-campus-schedules')
router.register(r'admin-controls/dentist_schedules', DentistScheduleViewSet, basename='admin-controls-dentist-schedules')

# Print all the URLs
print("Available URLs:")
for pattern in router.urls:
    print(f"  {pattern.pattern}")

print("\nSpecific actions:")
# Check if the custom actions are available
for viewset_class in [ProfileRequirementViewSet, DocumentRequirementViewSet, CampusScheduleViewSet, DentistScheduleViewSet]:
    print(f"\n{viewset_class.__name__}:")
    for action_name in dir(viewset_class):
        if hasattr(getattr(viewset_class, action_name), 'detail'):
            action = getattr(viewset_class, action_name)
            print(f"  - {action_name}: {action.detail}")
