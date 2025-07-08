#!/usr/bin/env python
"""
Fix duplicate patient profiles created during signup and profile setup.

This script will:
1. Find users with multiple patient profiles (one from signup with school_year=None, one from profile setup)
2. Merge the data from both profiles, keeping the more complete one
3. Delete the duplicate profile
4. Ensure the remaining profile has the current school year

Run this script from the Django project root:
python fix_duplicate_patient_profiles.py
"""

import os
import sys
import django

# Add the Django project directory to the path
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_dir)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import CustomUser, Patient, AcademicSchoolYear
from django.db import transaction


def fix_duplicate_patient_profiles():
    """Fix duplicate patient profiles for each user"""
    print("Starting duplicate patient profile fix...")
    
    # Get current school year
    try:
        current_school_year = AcademicSchoolYear.objects.get(is_current=True)
        print(f"Current school year: {current_school_year}")
    except AcademicSchoolYear.DoesNotExist:
        print("No current school year found. Exiting.")
        return

    users_fixed = 0
    profiles_merged = 0
    
    # Find users with multiple patient profiles
    for user in CustomUser.objects.filter(user_type='student'):
        patient_profiles = list(user.patient_profiles.all())
        
        if len(patient_profiles) > 1:
            print(f"\nUser {user.email} has {len(patient_profiles)} patient profiles")
            
            # Separate profiles by school year
            signup_profile = None  # profile with school_year=None
            current_year_profile = None  # profile with current school year
            other_profiles = []  # other profiles
            
            for profile in patient_profiles:
                if profile.school_year is None:
                    signup_profile = profile
                elif profile.school_year == current_school_year:
                    current_year_profile = profile
                else:
                    other_profiles.append(profile)
            
            # If we have both a signup profile and current year profile, merge them
            if signup_profile and current_year_profile:
                print(f"  Found signup profile (ID: {signup_profile.id}) and current year profile (ID: {current_year_profile.id})")
                
                with transaction.atomic():
                    # Merge data from signup profile to current year profile if fields are empty
                    merge_profiles(signup_profile, current_year_profile)
                    
                    # Delete the signup profile
                    signup_profile.delete()
                    print(f"  Merged and deleted signup profile {signup_profile.id}")
                    
                profiles_merged += 1
                users_fixed += 1
                
            # If we only have a signup profile, assign it the current school year
            elif signup_profile and not current_year_profile:
                print(f"  Found only signup profile (ID: {signup_profile.id}), assigning current school year")
                
                with transaction.atomic():
                    signup_profile.school_year = current_school_year
                    signup_profile.save()
                    print(f"  Updated signup profile {signup_profile.id} with current school year")
                
                users_fixed += 1
    
    print(f"\nFix completed!")
    print(f"Users fixed: {users_fixed}")
    print(f"Profiles merged: {profiles_merged}")


def merge_profiles(source_profile, target_profile):
    """Merge non-empty fields from source profile to target profile"""
    fields_to_merge = [
        'student_id', 'name', 'first_name', 'middle_name', 'suffix', 'photo',
        'gender', 'date_of_birth', 'age', 'department', 'contact_number', 'email',
        'address', 'city_municipality', 'barangay', 'street', 'blood_type', 'religion',
        'nationality', 'civil_status', 'emergency_contact_surname', 'emergency_contact_first_name',
        'emergency_contact_middle_name', 'emergency_contact_number', 'emergency_contact_relationship',
        'emergency_contact_address', 'emergency_contact_barangay', 'emergency_contact_street',
        'comorbid_illnesses', 'maintenance_medications', 'vaccination_history',
        'past_medical_history', 'hospital_admission_or_surgery', 'hospital_admission_details',
        'family_medical_history', 'allergies'
    ]
    
    updated_fields = []
    
    for field in fields_to_merge:
        source_value = getattr(source_profile, field)
        target_value = getattr(target_profile, field)
        
        # Special handling for photo field
        if field == 'photo':
            if source_value and not target_value:
                setattr(target_profile, field, source_value)
                updated_fields.append(field)
                print(f"    Copied profile picture from source profile")
            elif target_value and not source_value:
                # Target already has a photo, keep it
                print(f"    Target profile already has a photo, keeping target photo")
            elif source_value and target_value:
                # Both have photos, keep the target (more recent) one
                print(f"    Both profiles have photos, keeping target photo")
        # If target field is empty and source has a value, copy it
        elif source_value and not target_value:
            setattr(target_profile, field, source_value)
            updated_fields.append(field)
        # For arrays/lists, merge them if both have values
        elif isinstance(source_value, list) and isinstance(target_value, list):
            if source_value and target_value:
                # Merge lists, removing duplicates
                merged_list = list(set(source_value + target_value))
                setattr(target_profile, field, merged_list)
                updated_fields.append(field)
            elif source_value and not target_value:
                setattr(target_profile, field, source_value)
                updated_fields.append(field)
    
    if updated_fields:
        target_profile.save()
        print(f"    Merged fields: {', '.join(updated_fields)}")
    else:
        print(f"    No fields needed merging")


if __name__ == '__main__':
    fix_duplicate_patient_profiles()
