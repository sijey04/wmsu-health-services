#!/usr/bin/env python
"""
Check dentist schedule data
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

from api.models import DentistSchedule

print("Checking dentist schedules...")
schedules = DentistSchedule.objects.all()
print(f"Found {schedules.count()} dentist schedules")

for schedule in schedules:
    print(f"  - {schedule.dentist_name}")
    print(f"    Campus: {schedule.campus}")
    print(f"    Available Days: {schedule.available_days}")
    print(f"    Time Slots: {schedule.time_slots}")
    print(f"    Is Active: {schedule.is_active}")
    print()
