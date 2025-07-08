#!/usr/bin/env python
"""
Script to populate admin controls with sample data
"""
import os
import sys
import django

# Add the parent directory to the path so we can import Django modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import (
    ProfileRequirement, DocumentRequirement, CampusSchedule, DentistSchedule,
    ComorbidIllness, Vaccination, PastMedicalHistoryItem, FamilyMedicalHistoryItem
)

def populate_profile_requirements():
    """Create sample profile requirements"""
    requirements = [
        {
            'field_name': 'first_name',
            'display_name': 'First Name',
            'description': 'Patient first name',
            'category': 'personal',
            'is_required': True,
            'is_active': True
        },
        {
            'field_name': 'last_name',
            'display_name': 'Last Name',
            'description': 'Patient last name',
            'category': 'personal',
            'is_required': True,
            'is_active': True
        },
        {
            'field_name': 'date_of_birth',
            'display_name': 'Date of Birth',
            'description': 'Patient date of birth',
            'category': 'personal',
            'is_required': True,
            'is_active': True
        },
        {
            'field_name': 'contact_number',
            'display_name': 'Contact Number',
            'description': 'Patient contact number',
            'category': 'personal',
            'is_required': True,
            'is_active': True
        },
        {
            'field_name': 'emergency_contact',
            'display_name': 'Emergency Contact',
            'description': 'Emergency contact information',
            'category': 'emergency',
            'is_required': True,
            'is_active': True
        },
        {
            'field_name': 'blood_type',
            'display_name': 'Blood Type',
            'description': 'Patient blood type',
            'category': 'health',
            'is_required': False,
            'is_active': True
        }
    ]
    
    for req_data in requirements:
        ProfileRequirement.objects.get_or_create(
            field_name=req_data['field_name'],
            defaults=req_data
        )
    
    print(f"Created {len(requirements)} profile requirements")

def populate_document_requirements():
    """Create sample document requirements"""
    requirements = [
        {
            'field_name': 'chest_xray',
            'display_name': 'Chest X-ray',
            'description': 'Chest X-ray report',
            'is_required': True,
            'validity_period_months': 12,
            'specific_courses': [],
            'is_active': True
        },
        {
            'field_name': 'cbc',
            'display_name': 'Complete Blood Count',
            'description': 'CBC laboratory result',
            'is_required': True,
            'validity_period_months': 6,
            'specific_courses': [],
            'is_active': True
        },
        {
            'field_name': 'urinalysis',
            'display_name': 'Urinalysis',
            'description': 'Urinalysis laboratory result',
            'is_required': True,
            'validity_period_months': 6,
            'specific_courses': [],
            'is_active': True
        },
        {
            'field_name': 'medical_certificate',
            'display_name': 'Medical Certificate',
            'description': 'Medical certificate from licensed physician',
            'is_required': True,
            'validity_period_months': 12,
            'specific_courses': [],
            'is_active': True
        }
    ]
    
    for req_data in requirements:
        DocumentRequirement.objects.get_or_create(
            field_name=req_data['field_name'],
            defaults=req_data
        )
    
    print(f"Created {len(requirements)} document requirements")

def populate_campus_schedules():
    """Create sample campus schedules"""
    schedules = [
        {
            'campus': 'a',
            'open_time': '08:00',
            'close_time': '17:00',
            'operating_days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            'is_active': True
        },
        {
            'campus': 'b',
            'open_time': '08:00',
            'close_time': '17:00',
            'operating_days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            'is_active': True
        },
        {
            'campus': 'c',
            'open_time': '08:00',
            'close_time': '17:00',
            'operating_days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
            'is_active': True
        }
    ]
    
    for schedule_data in schedules:
        CampusSchedule.objects.get_or_create(
            campus=schedule_data['campus'],
            defaults=schedule_data
        )
    
    print(f"Created {len(schedules)} campus schedules")

def populate_dentist_schedules():
    """Create sample dentist schedules"""
    schedules = [
        {
            'dentist_name': 'Dr. Smith',
            'campus': 'a',
            'available_days': ['Monday', 'Wednesday', 'Friday'],
            'time_slots': ['08:00-09:00', '09:00-10:00', '10:00-11:00', '14:00-15:00'],
            'is_active': True
        },
        {
            'dentist_name': 'Dr. Johnson',
            'campus': 'b',
            'available_days': ['Tuesday', 'Thursday'],
            'time_slots': ['08:00-09:00', '09:00-10:00', '10:00-11:00', '14:00-15:00'],
            'is_active': True
        }
    ]
    
    for schedule_data in schedules:
        DentistSchedule.objects.get_or_create(
            dentist_name=schedule_data['dentist_name'],
            campus=schedule_data['campus'],
            defaults=schedule_data
        )
    
    print(f"Created {len(schedules)} dentist schedules")

def populate_medical_lists():
    """Create sample medical lists"""
    
    # Comorbid illnesses
    illnesses = [
        'Hypertension', 'Diabetes', 'Heart Disease', 'Asthma', 'Kidney Disease',
        'Liver Disease', 'Cancer', 'Thyroid Disease', 'Arthritis', 'COPD'
    ]
    
    for illness in illnesses:
        ComorbidIllness.objects.get_or_create(
            label=illness,
            defaults={'is_enabled': True, 'display_order': 0}
        )
    
    # Vaccinations
    vaccines = [
        'COVID-19', 'Influenza', 'Hepatitis B', 'Tetanus', 'MMR',
        'Pneumococcal', 'HPV', 'Meningococcal', 'Varicella', 'Tdap'
    ]
    
    for vaccine in vaccines:
        Vaccination.objects.get_or_create(
            name=vaccine,
            defaults={'is_enabled': True, 'display_order': 0}
        )
    
    # Past medical history
    past_histories = [
        'Surgery', 'Hospitalization', 'Allergic Reaction', 'Blood Transfusion',
        'Fracture', 'Serious Injury', 'Pregnancy', 'Mental Health Treatment'
    ]
    
    for history in past_histories:
        PastMedicalHistoryItem.objects.get_or_create(
            name=history,
            defaults={'is_enabled': True, 'display_order': 0}
        )
    
    # Family medical history
    family_histories = [
        'Heart Disease', 'Diabetes', 'Cancer', 'Stroke', 'High Blood Pressure',
        'Kidney Disease', 'Mental Illness', 'Genetic Disorders'
    ]
    
    for history in family_histories:
        FamilyMedicalHistoryItem.objects.get_or_create(
            name=history,
            defaults={'is_enabled': True, 'display_order': 0}
        )
    
    print(f"Created medical lists: {len(illnesses)} illnesses, {len(vaccines)} vaccines, "
          f"{len(past_histories)} past histories, {len(family_histories)} family histories")

def main():
    print("Populating admin controls with sample data...")
    
    populate_profile_requirements()
    populate_document_requirements()
    populate_campus_schedules()
    populate_dentist_schedules()
    populate_medical_lists()
    
    print("Sample data population complete!")

if __name__ == '__main__':
    main()
