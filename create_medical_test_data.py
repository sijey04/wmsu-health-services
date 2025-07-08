#!/usr/bin/env python
"""
Create test data for medical form testing
"""
import os
import sys
import django

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend', 'django_api'))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from django.contrib.auth import get_user_model
from api.models import Patient, StaffDetails, Appointment, AcademicSchoolYear
from datetime import datetime, timedelta

User = get_user_model()

def create_test_data():
    print("Creating test data for medical form testing...")
    
    # Create academic year if it doesn't exist
    academic_year, created = AcademicSchoolYear.objects.get_or_create(
        academic_year="2024-2025",
        defaults={
            'start_date': datetime(2024, 8, 1).date(),
            'end_date': datetime(2025, 7, 31).date(),
            'is_current': True
        }
    )
    if created:
        print(f"✅ Created academic year: {academic_year.academic_year}")
    else:
        print(f"📝 Academic year already exists: {academic_year.academic_year}")
    
    # Create test staff user with medical license
    staff_user, created = User.objects.get_or_create(
        username='test_doctor',
        defaults={
            'first_name': 'Dr. John',
            'last_name': 'Smith',
            'email': 'doctor@test.com',
            'user_type': 'staff',
            'is_staff': True
        }
    )
    if created:
        staff_user.set_password('testpass123')
        staff_user.save()
        print(f"✅ Created staff user: {staff_user.username}")
    else:
        print(f"📝 Staff user already exists: {staff_user.username}")
    
    # Create staff details with license number
    staff_details, created = StaffDetails.objects.get_or_create(
        user=staff_user,
        defaults={
            'license_number': 'MD12345',
            'full_name': 'Dr. John Smith',
            'position': 'General Physician',
            'ptr_number': 'PTR98765',
            'campus_assigned': 'a',
            'phone_number': '09123456789'
        }
    )
    if created:
        print(f"✅ Created staff details with license: {staff_details.license_number}")
    else:
        print(f"📝 Staff details already exist with license: {staff_details.license_number}")
    
    # Create test patient users
    for i in range(1, 4):
        patient_user, created = User.objects.get_or_create(
            username=f'test_patient_{i}',
            defaults={
                'first_name': f'Student{i}',
                'last_name': f'Test{i}',
                'email': f'student{i}@test.com',
                'user_type': 'patient'
            }
        )
        if created:
            patient_user.set_password('testpass123')
            patient_user.save()
            print(f"✅ Created patient user: {patient_user.username}")
        else:
            print(f"📝 Patient user already exists: {patient_user.username}")
        
        # Create patient profile
        patient, created = Patient.objects.get_or_create(
            user=patient_user,
            school_year=academic_year,
            defaults={
                'student_id': f'2024-{1000 + i}',
                'name': f'Test{i}, Student{i}',
                'first_name': f'Student{i}',
                'middle_name': 'Middle',
                'age': 20 + i,
                'gender': 'Male' if i % 2 == 1 else 'Female',
                'department': 'Computer Science',
                'contact_number': f'09123456{i:03d}',
                'blood_type': ['A+', 'B+', 'O+'][i-1],
                'address': f'{i} Test Street, Test City',
                'emergency_contact_first_name': 'Emergency',
                'emergency_contact_surname': f'Contact{i}',
                'emergency_contact_number': f'09876543{i:03d}',
                'comorbid_illnesses': [f'Test condition {i}'] if i == 2 else [],
                'maintenance_medications': [f'Test medication {i}'] if i == 3 else [],
                'past_medical_history': [f'Past history {i}'],
                'family_medical_history': [f'Family history {i}'],
            }
        )
        if created:
            print(f"✅ Created patient: {patient.name} (ID: {patient.id})")
        else:
            print(f"📝 Patient already exists: {patient.name} (ID: {patient.id})")
        
        # Create test appointment
        appointment, created = Appointment.objects.get_or_create(
            patient=patient,
            appointment_date=datetime.now().date(),
            appointment_time=datetime.now().time(),
            defaults={
                'purpose': 'Medical Consultation',
                'status': 'scheduled',
                'notes': f'Test appointment for {patient.name}',
                'type': 'medical',
                'campus': 'a',
                'school_year': academic_year
            }
        )
        if created:
            print(f"✅ Created appointment: ID {appointment.id} for {patient.name}")
        else:
            print(f"📝 Appointment already exists: ID {appointment.id} for {patient.name}")
    
    print("\n🎉 Test data creation completed!")
    print("\nAvailable test data:")
    print("- Staff user: test_doctor (password: testpass123)")
    print("- License number: MD12345")
    print("- Patient users: test_patient_1, test_patient_2, test_patient_3")
    print("- Patient IDs and appointments created")
    
    # Display created patients for reference
    print("\n📋 Patient Reference:")
    patients = Patient.objects.all()
    for patient in patients:
        appointments = Appointment.objects.filter(patient=patient)
        appointment_info = f", Appointments: {[a.id for a in appointments]}" if appointments.exists() else ""
        print(f"   • {patient.name} (ID: {patient.id}, Student ID: {patient.student_id}{appointment_info})")

if __name__ == '__main__':
    create_test_data()
