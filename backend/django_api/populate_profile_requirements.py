#!/usr/bin/env python
import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import ProfileRequirement

def create_sample_profile_requirements():
    """Create sample profile requirements if they don't exist"""
    
    # Sample requirements organized by category
    requirements_data = [
        # Personal Information
        {'field_name': 'first_name', 'display_name': 'First Name', 'category': 'personal', 'is_required': True, 'description': 'Student\'s first name'},
        {'field_name': 'middle_name', 'display_name': 'Middle Name', 'category': 'personal', 'is_required': False, 'description': 'Student\'s middle name'},
        {'field_name': 'name', 'display_name': 'Last Name', 'category': 'personal', 'is_required': True, 'description': 'Student\'s last name'},
        {'field_name': 'suffix', 'display_name': 'Suffix', 'category': 'personal', 'is_required': False, 'description': 'Name suffix (Jr., Sr., III, etc.)'},
        {'field_name': 'date_of_birth', 'display_name': 'Date of Birth', 'category': 'personal', 'is_required': True, 'description': 'Student\'s date of birth'},
        {'field_name': 'age', 'display_name': 'Age', 'category': 'personal', 'is_required': True, 'description': 'Student\'s current age'},
        {'field_name': 'gender', 'display_name': 'Gender', 'category': 'personal', 'is_required': True, 'description': 'Student\'s gender'},
        {'field_name': 'blood_type', 'display_name': 'Blood Type', 'category': 'personal', 'is_required': True, 'description': 'Student\'s blood type'},
        {'field_name': 'religion', 'display_name': 'Religion', 'category': 'personal', 'is_required': False, 'description': 'Student\'s religion'},
        {'field_name': 'nationality', 'display_name': 'Nationality', 'category': 'personal', 'is_required': True, 'description': 'Student\'s nationality'},
        {'field_name': 'civil_status', 'display_name': 'Civil Status', 'category': 'personal', 'is_required': True, 'description': 'Student\'s civil status'},
        {'field_name': 'email', 'display_name': 'Email Address', 'category': 'personal', 'is_required': True, 'description': 'Student\'s email address'},
        {'field_name': 'contact_number', 'display_name': 'Contact Number', 'category': 'personal', 'is_required': True, 'description': 'Student\'s phone number'},
        {'field_name': 'street', 'display_name': 'Street Address', 'category': 'personal', 'is_required': True, 'description': 'Street address'},
        {'field_name': 'barangay', 'display_name': 'Barangay', 'category': 'personal', 'is_required': True, 'description': 'Barangay address'},
        {'field_name': 'city_municipality', 'display_name': 'City/Municipality', 'category': 'personal', 'is_required': True, 'description': 'City or municipality'},
        
        # Emergency Contact
        {'field_name': 'emergency_contact_first_name', 'display_name': 'Emergency Contact First Name', 'category': 'emergency', 'is_required': True, 'description': 'Emergency contact\'s first name'},
        {'field_name': 'emergency_contact_surname', 'display_name': 'Emergency Contact Last Name', 'category': 'emergency', 'is_required': True, 'description': 'Emergency contact\'s last name'},
        {'field_name': 'emergency_contact_middle_name', 'display_name': 'Emergency Contact Middle Name', 'category': 'emergency', 'is_required': False, 'description': 'Emergency contact\'s middle name'},
        {'field_name': 'emergency_contact_number', 'display_name': 'Emergency Contact Number', 'category': 'emergency', 'is_required': True, 'description': 'Emergency contact\'s phone number'},
        {'field_name': 'emergency_contact_relationship', 'display_name': 'Emergency Contact Relationship', 'category': 'emergency', 'is_required': True, 'description': 'Relationship to emergency contact'},
        {'field_name': 'emergency_contact_street', 'display_name': 'Emergency Contact Street', 'category': 'emergency', 'is_required': False, 'description': 'Emergency contact street address'},
        {'field_name': 'emergency_contact_barangay', 'display_name': 'Emergency Contact Barangay', 'category': 'emergency', 'is_required': False, 'description': 'Emergency contact barangay'},
        
        # Health Information
        {'field_name': 'allergies', 'display_name': 'Allergies', 'category': 'health', 'is_required': False, 'description': 'List of known allergies'},
        {'field_name': 'medications', 'display_name': 'Current Medications', 'category': 'health', 'is_required': False, 'description': 'Current medications being taken'},
        {'field_name': 'comorbid_illnesses', 'display_name': 'Comorbid Illnesses', 'category': 'health', 'is_required': False, 'description': 'Existing medical conditions'},
        {'field_name': 'vaccinations', 'display_name': 'Vaccinations', 'category': 'health', 'is_required': False, 'description': 'Vaccination history'},
        {'field_name': 'past_medical_history', 'display_name': 'Past Medical History', 'category': 'health', 'is_required': False, 'description': 'Previous medical conditions and treatments'},
        
        # Family History
        {'field_name': 'family_medical_history', 'display_name': 'Family Medical History', 'category': 'family', 'is_required': False, 'description': 'Family history of medical conditions'},
        {'field_name': 'hospital_admission_or_surgery', 'display_name': 'Hospital Admission/Surgery', 'category': 'family', 'is_required': True, 'description': 'History of hospital admissions or surgeries'},
    ]
    
    created_count = 0
    updated_count = 0
    
    for req_data in requirements_data:
        requirement, created = ProfileRequirement.objects.get_or_create(
            field_name=req_data['field_name'],
            defaults={
                'display_name': req_data['display_name'],
                'category': req_data['category'],
                'is_required': req_data['is_required'],
                'description': req_data['description'],
                'is_active': True  # Enable all by default
            }
        )
        
        if created:
            created_count += 1
            print(f"Created: {requirement.display_name} ({requirement.category})")
        else:
            # Update existing requirement to make sure it's active
            if not requirement.is_active:
                requirement.is_active = True
                requirement.save()
                updated_count += 1
                print(f"Activated: {requirement.display_name} ({requirement.category})")
    
    print(f"\nSummary:")
    print(f"Created: {created_count} new requirements")
    print(f"Updated: {updated_count} existing requirements")
    print(f"Total active requirements: {ProfileRequirement.objects.filter(is_active=True).count()}")

if __name__ == '__main__':
    print("Populating Profile Requirements...")
    create_sample_profile_requirements()
    print("Done!")
