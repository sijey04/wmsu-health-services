"""
Clear test data from database while preserving users and essential configuration.
This script removes:
- All Patient profiles
- All Appointments
- All Medical Records
- All Medical Form Data
- All Dental Form Data
- All Dental Waivers
- All Waivers
- All Medical Documents
- All Dental Information Records
- All School Years
- All Staff Details
- All Inventory items

This script preserves:
- All Users (CustomUser)
- System Configuration
- Profile Requirements
- Document Requirements
- Comorbid Illnesses
- Vaccinations
- Past Medical History Items
- Family Medical History Items
"""

import os
import sys
import django

# Add the project root to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from django.db import transaction
from api.models import (
    Patient, Appointment, MedicalRecord, MedicalFormData, 
    DentalFormData, DentalWaiver, Waiver, MedicalDocument,
    DentalInformationRecord, AcademicSchoolYear, StaffDetails,
    Inventory, CustomUser
)

def clear_test_data():
    """Clear all test data while preserving users and configuration"""
    
    print("=" * 60)
    print("CLEARING TEST DATA FROM DATABASE")
    print("=" * 60)
    
    with transaction.atomic():
        # Count before deletion
        print("\n📊 Current Data Count:")
        print(f"  - Users: {CustomUser.objects.count()}")
        print(f"  - Patients: {Patient.objects.count()}")
        print(f"  - Appointments: {Appointment.objects.count()}")
        print(f"  - Medical Records: {MedicalRecord.objects.count()}")
        print(f"  - Medical Forms: {MedicalFormData.objects.count()}")
        print(f"  - Dental Forms: {DentalFormData.objects.count()}")
        print(f"  - Dental Waivers: {DentalWaiver.objects.count()}")
        print(f"  - Medical Waivers: {Waiver.objects.count()}")
        print(f"  - Medical Documents: {MedicalDocument.objects.count()}")
        print(f"  - Dental Information Records: {DentalInformationRecord.objects.count()}")
        print(f"  - School Years: {AcademicSchoolYear.objects.count()}")
        print(f"  - Staff Details: {StaffDetails.objects.count()}")
        print(f"  - Inventory Items: {Inventory.objects.count()}")
        
        # Delete in proper order (respecting foreign key constraints)
        print("\n🗑️  Deleting test data...")
        
        # 1. Delete Medical Documents (references appointments and patients)
        deleted_docs = MedicalDocument.objects.all().delete()
        print(f"  ✓ Deleted {deleted_docs[0]} Medical Documents")
        
        # 2. Delete Form Data (references appointments and patients)
        deleted_medical_forms = MedicalFormData.objects.all().delete()
        print(f"  ✓ Deleted {deleted_medical_forms[0]} Medical Forms")
        
        deleted_dental_forms = DentalFormData.objects.all().delete()
        print(f"  ✓ Deleted {deleted_dental_forms[0]} Dental Forms")
        
        deleted_dental_info = DentalInformationRecord.objects.all().delete()
        print(f"  ✓ Deleted {deleted_dental_info[0]} Dental Information Records")
        
        # 3. Delete Waivers (references patients)
        deleted_waivers = Waiver.objects.all().delete()
        print(f"  ✓ Deleted {deleted_waivers[0]} Medical Waivers")
        
        deleted_dental_waivers = DentalWaiver.objects.all().delete()
        print(f"  ✓ Deleted {deleted_dental_waivers[0]} Dental Waivers")
        
        # 4. Delete Appointments (references patients)
        deleted_appointments = Appointment.objects.all().delete()
        print(f"  ✓ Deleted {deleted_appointments[0]} Appointments")
        
        # 5. Delete Medical Records (references patients)
        deleted_records = MedicalRecord.objects.all().delete()
        print(f"  ✓ Deleted {deleted_records[0]} Medical Records")
        
        # 6. Delete Patients (references users and school years)
        deleted_patients = Patient.objects.all().delete()
        print(f"  ✓ Deleted {deleted_patients[0]} Patient Profiles")
        
        # 7. Delete School Years (no dependencies)
        deleted_school_years = AcademicSchoolYear.objects.all().delete()
        print(f"  ✓ Deleted {deleted_school_years[0]} School Years")
        
        # 8. Delete Staff Details (references users)
        deleted_staff = StaffDetails.objects.all().delete()
        print(f"  ✓ Deleted {deleted_staff[0]} Staff Details")
        
        # 9. Delete Inventory Items
        deleted_inventory = Inventory.objects.all().delete()
        print(f"  ✓ Deleted {deleted_inventory[0]} Inventory Items")
        
        print("\n✅ Test data cleared successfully!")
        print("\n📊 Preserved Data:")
        print(f"  - Users: {CustomUser.objects.count()}")
        print(f"  - System Configuration: Preserved")
        print(f"  - Profile Requirements: Preserved")
        print(f"  - Document Requirements: Preserved")
        print(f"  - Comorbid Illnesses: Preserved")
        print(f"  - Vaccinations: Preserved")
        print(f"  - Medical History Items: Preserved")
        
        print("\n" + "=" * 60)
        print("Database is now ready for fresh testing!")
        print("=" * 60)

if __name__ == '__main__':
    try:
        response = input("\n⚠️  WARNING: This will delete all test data (patients, appointments, school years, etc.)\n   but preserve users and configuration.\n\n   Are you sure you want to continue? (yes/no): ")
        
        if response.lower() in ['yes', 'y']:
            clear_test_data()
        else:
            print("\n❌ Operation cancelled.")
    except KeyboardInterrupt:
        print("\n\n❌ Operation cancelled by user.")
    except Exception as e:
        print(f"\n\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
