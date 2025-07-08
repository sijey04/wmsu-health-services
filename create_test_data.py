#!/usr/bin/env python3
# Simple test data creation script for dashboard

import os
import sys
import django

# Add the Django project to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'django_api'))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import *
from datetime import datetime, timedelta
import random

def create_test_data():
    # Get current academic year
    academic_year = AcademicSchoolYear.objects.filter(is_current=True).first()
    if not academic_year:
        academic_year = AcademicSchoolYear.objects.create(academic_year='2025-2026', is_current=True)

    # Get existing patients
    patients = list(Patient.objects.all())
    if len(patients) < 5:
        print(f"Creating test patients... Current count: {len(patients)}")
        for i in range(5 - len(patients)):
            try:
                user = CustomUser.objects.create_user(
                    email=f'patient{i+len(patients)}@example.com',
                    username=f'patient{i+len(patients)}',
                    password='testpass123',
                    first_name=f'Patient{i+len(patients)}',
                    last_name='Test',
                    user_type='student',
                    is_email_verified=True
                )
                Patient.objects.create(
                    user=user,
                    name=f'Test, Patient{i+len(patients)}',
                    first_name=f'Patient{i+len(patients)}',
                    email=f'patient{i+len(patients)}@example.com',
                    student_id=f'2024-{i+len(patients):04d}',
                    school_year=academic_year,
                    department='Computer Science',
                    year_level='1st Year'
                )
            except Exception as e:
                print(f"Error creating patient {i}: {e}")
        patients = list(Patient.objects.all())

    # Create some test appointments with different statuses
    appointment_count = Appointment.objects.count()
    print(f"Current appointment count: {appointment_count}")
    
    if appointment_count < 15:
        statuses = ['pending', 'confirmed', 'completed', 'cancelled']
        types = ['medical', 'dental']
        
        for i in range(15 - appointment_count):
            try:
                Appointment.objects.create(
                    patient=random.choice(patients),
                    type=random.choice(types),
                    appointment_date=datetime.now().date() + timedelta(days=random.randint(-30, 30)),
                    appointment_time=datetime.now().time(),
                    status=random.choice(statuses),
                    school_year=academic_year
                )
            except Exception as e:
                print(f"Error creating appointment {i}: {e}")

    # Create some medical documents
    doc_count = MedicalDocument.objects.count()
    print(f"Current medical document count: {doc_count}")
    
    if doc_count < 10:
        statuses = ['pending', 'verified', 'issued', 'rejected']
        for i in range(10 - doc_count):
            try:
                MedicalDocument.objects.create(
                    patient=random.choice(patients),
                    status=random.choice(statuses),
                    academic_year=academic_year
                )
            except Exception as e:
                print(f"Error creating medical document {i}: {e}")

    print("Test data creation completed!")
    
    # Print current statistics
    print("\nCurrent Statistics:")
    print(f"Patients: {Patient.objects.count()}")
    print(f"Appointments: {Appointment.objects.count()}")
    print(f"- Medical: {Appointment.objects.filter(type='medical').count()}")
    print(f"- Dental: {Appointment.objects.filter(type='dental').count()}")
    print(f"Medical Documents: {MedicalDocument.objects.count()}")

if __name__ == "__main__":
    create_test_data()
