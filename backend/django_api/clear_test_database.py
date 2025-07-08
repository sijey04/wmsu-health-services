#!/usr/bin/env python3
"""
Script to clear the database for testing purposes
"""

import os
import sys
import django
from django.conf import settings

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import (
    CustomUser, Patient, Appointment, MedicalRecord, 
    StaffDetails, DentalFormData, MedicalFormData, MedicalDocument
)

def clear_database():
    """Clear database tables (except superuser accounts)"""
    
    print("⚠️  WARNING: This will delete all data from the database!")
    print("This will keep superuser accounts but remove all other data.")
    
    # Ask for confirmation
    response = input("Are you sure you want to proceed? (type 'YES' to confirm): ")
    if response != 'YES':
        print("❌ Operation cancelled.")
        return
    
    try:
        print("🗑️  Clearing database...")
        
        # Clear appointment-related data
        print("- Clearing appointments...")
        Appointment.objects.all().delete()
        
        # Clear medical records
        print("- Clearing medical records...")
        MedicalRecord.objects.all().delete()
        
        # Clear form data
        print("- Clearing form data...")
        DentalFormData.objects.all().delete()
        MedicalFormData.objects.all().delete()
        
        # Clear medical documents
        print("- Clearing medical documents...")
        MedicalDocument.objects.all().delete()
        
        # Clear patients
        print("- Clearing patients...")
        Patient.objects.all().delete()
        
        # Clear staff details
        print("- Clearing staff details...")
        StaffDetails.objects.all().delete()
        
        # Clear non-superuser accounts
        print("- Clearing non-superuser accounts...")
        CustomUser.objects.filter(is_superuser=False).delete()
        
        print("✅ Database cleared successfully!")
        print("💡 You can now create fresh test data.")
        
    except Exception as e:
        print(f"❌ Error clearing database: {str(e)}")

if __name__ == "__main__":
    clear_database()
