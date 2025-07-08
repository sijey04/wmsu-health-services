#!/usr/bin/env python
"""
Clear test records from database while preserving configuration data
"""
import os
import sys
import django
from django.conf import settings

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from django.db import transaction
from api.models import (
    User, Patient, Appointment, MedicalRecord, Inventory, 
    MedicalDocument, DentalFormData, MedicalFormData, 
    StaffDetails, Waiver, SystemConfiguration, AcademicSchoolYear,
    UserManagement, UserBlock,
    # These will be preserved
    CampusSchedule, ComorbidIllness, DentistSchedule, 
    DocumentRequirement, FamilyMedicalHistoryItem, 
    PastMedicalHistoryItem, ProfileRequirement, Vaccination
)

def clear_test_records():
    """Clear all test records except configuration data"""
    
    print("Starting database cleanup...")
    
    try:
        with transaction.atomic():
            # Clear user-related data (but preserve superuser accounts)
            print("Clearing user blocks...")
            UserBlock.objects.all().delete()
            
            print("Clearing user management records...")
            UserManagement.objects.all().delete()
            
            print("Clearing staff details...")
            StaffDetails.objects.all().delete()
            
            print("Clearing waivers...")
            Waiver.objects.all().delete()
            
            print("Clearing form data...")
            DentalFormData.objects.all().delete()
            MedicalFormData.objects.all().delete()
            
            print("Clearing medical documents...")
            MedicalDocument.objects.all().delete()
            
            print("Clearing appointments...")
            Appointment.objects.all().delete()
            
            print("Clearing medical records...")
            MedicalRecord.objects.all().delete()
            
            print("Clearing inventory...")
            Inventory.objects.all().delete()
            
            print("Clearing patient profiles...")
            Patient.objects.all().delete()
            
            print("Clearing academic school years...")
            AcademicSchoolYear.objects.all().delete()
            
            print("Clearing system configurations...")
            SystemConfiguration.objects.all().delete()
            
            # Clear non-superuser accounts
            print("Clearing non-superuser accounts...")
            regular_users = User.objects.filter(is_superuser=False)
            user_count = regular_users.count()
            regular_users.delete()
            
            print(f"Cleared {user_count} regular user accounts")
            
            # Show what's preserved
            print("\nPreserved configuration data:")
            print(f"- Campus Schedules: {CampusSchedule.objects.count()}")
            print(f"- Comorbid Illnesses: {ComorbidIllness.objects.count()}")
            print(f"- Dentist Schedules: {DentistSchedule.objects.count()}")
            print(f"- Document Requirements: {DocumentRequirement.objects.count()}")
            print(f"- Family Medical History Items: {FamilyMedicalHistoryItem.objects.count()}")
            print(f"- Past Medical History Items: {PastMedicalHistoryItem.objects.count()}")
            print(f"- Profile Requirements: {ProfileRequirement.objects.count()}")
            print(f"- Vaccinations: {Vaccination.objects.count()}")
            
            superuser_count = User.objects.filter(is_superuser=True).count()
            print(f"- Superuser accounts: {superuser_count}")
            
            print("\nDatabase cleanup completed successfully!")
            
    except Exception as e:
        print(f"Error during database cleanup: {str(e)}")
        raise

def confirm_cleanup():
    """Ask for confirmation before clearing database"""
    print("WARNING: This will clear all test records from the database!")
    print("The following data will be DELETED:")
    print("- All user accounts (except superusers)")
    print("- All patient profiles")
    print("- All appointments")
    print("- All medical records")
    print("- All medical documents")
    print("- All form data")
    print("- All inventory items")
    print("- All staff details")
    print("- All waivers")
    print("- All user blocks and management records")
    print("- All academic school years")
    print("- All system configurations")
    print("\nThe following configuration data will be PRESERVED:")
    print("- Campus Schedules")
    print("- Comorbid Illnesses")
    print("- Dentist Schedules")
    print("- Document Requirements")
    print("- Family Medical History Items")
    print("- Past Medical History Items")
    print("- Profile Requirements")
    print("- Vaccinations")
    print("- Superuser accounts")
    
    response = input("\nAre you sure you want to proceed? (type 'yes' to confirm): ")
    return response.lower() == 'yes'

if __name__ == '__main__':
    if confirm_cleanup():
        clear_test_records()
    else:
        print("Database cleanup cancelled.")
