#!/usr/bin/env python
"""
Test script to check appointments data in the database.
"""

import os
import django
import sys

# Add the Django project to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import Appointment, Patient

def check_appointments():
    """Check appointments data in the database."""
    print("Checking appointments data...")
    
    total_appointments = Appointment.objects.count()
    print(f"Total appointments: {total_appointments}")
    
    medical_appointments = Appointment.objects.filter(type='medical')
    dental_appointments = Appointment.objects.filter(type='dental')
    
    print(f"Medical appointments: {medical_appointments.count()}")
    print(f"Dental appointments: {dental_appointments.count()}")
    
    # Check status distribution
    for status in ['pending', 'confirmed', 'scheduled', 'completed', 'cancelled']:
        count = Appointment.objects.filter(status=status).count()
        print(f"  {status.title()} appointments: {count}")
    
    # Show sample appointments
    if medical_appointments.exists():
        medical = medical_appointments.first()
        print(f"\nSample medical appointment:")
        print(f"  Patient: {medical.patient.name if medical.patient else 'N/A'}")
        print(f"  Purpose: {medical.purpose}")
        print(f"  Date: {medical.appointment_date}")
        print(f"  Time: {medical.appointment_time}")
        print(f"  Status: {medical.status}")
    
    if dental_appointments.exists():
        dental = dental_appointments.first()
        print(f"\nSample dental appointment:")
        print(f"  Patient: {dental.patient.name if dental.patient else 'N/A'}")
        print(f"  Purpose: {dental.purpose}")
        print(f"  Date: {dental.appointment_date}")
        print(f"  Time: {dental.appointment_time}")
        print(f"  Status: {dental.status}")
    
    print(f"\nTotal patients: {Patient.objects.count()}")

if __name__ == '__main__':
    check_appointments()
