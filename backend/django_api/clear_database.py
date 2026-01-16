#!/usr/bin/env python
"""
Script to clear the database for fresh testing
"""
import os
import sys
import django

# Set up Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import CustomUser, Patient, MedicalRecord, Appointment, MedicalDocument, DentalFormData, AcademicSchoolYear, Waiver, DentalWaiver

def clear_database():
    print("🗑️  Clearing Database for Fresh Testing")
    print("=" * 50)
    
    # Count existing records
    user_count = CustomUser.objects.count()
    patient_count = Patient.objects.count()
    medical_record_count = MedicalRecord.objects.count()
    appointment_count = Appointment.objects.count()
    medical_doc_count = MedicalDocument.objects.count()
    dental_count = DentalFormData.objects.count()
    school_year_count = AcademicSchoolYear.objects.count()
    
    # Count appointments by semester
    first_sem_count = Appointment.objects.filter(semester='1st_semester').count()
    second_sem_count = Appointment.objects.filter(semester='2nd_semester').count()
    summer_count = Appointment.objects.filter(semester='summer').count()
    unassigned_count = Appointment.objects.filter(semester__isnull=True).count()
    
    print(f"📊 Current Database State:")
    print(f"   Users: {user_count}")
    print(f"   Patients: {patient_count}")
    print(f"   Medical Records: {medical_record_count}")
    print(f"   Appointments: {appointment_count}")
    print(f"     📚 First Semester: {first_sem_count}")
    print(f"     📚 Second Semester: {second_sem_count}")
    print(f"     ☀️ Summer Semester: {summer_count}")
    print(f"     ❓ Unassigned: {unassigned_count}")
    print(f"   Medical Documents: {medical_doc_count}")
    print(f"   Dental Forms: {dental_count}")
    print(f"   School Years: {school_year_count}")
    
    if user_count == 0 and patient_count == 0:
        print("✅ Database is already clean!")
        return
    
    # Ask for confirmation
    confirm = input("\n⚠️  Are you sure you want to delete ALL data? (type 'yes' to confirm): ")
    
    if confirm.lower() != 'yes':
        print("❌ Operation cancelled.")
        return
    
    try:
        # Delete in proper order to avoid foreign key constraints
        print("\n🗑️  Deleting records...")
        
        # Delete dependent records first
        dental_deleted = DentalFormData.objects.all().delete()[0]
        medical_doc_deleted = MedicalDocument.objects.all().delete()[0]
        appointment_deleted = Appointment.objects.all().delete()[0]
        medical_record_deleted = MedicalRecord.objects.all().delete()[0]
        
        # Delete patients
        patient_deleted = Patient.objects.all().delete()[0]
        
        # Delete users (keep specific users)
        kept_emails = ['faminianochristianjude@gmail.com', 'admin@wmsu.edu.ph']
        users_to_delete = CustomUser.objects.exclude(email__in=kept_emails)
        user_deleted = users_to_delete.delete()[0]
        
        print(f"✅ Deleted {dental_deleted} dental forms")
        print(f"✅ Deleted {medical_doc_deleted} medical documents")
        print(f"✅ Deleted {appointment_deleted} appointments")
        print(f"✅ Deleted {medical_record_deleted} medical records")
        print(f"✅ Deleted {patient_deleted} patients")
        print(f"✅ Deleted {user_deleted} users (kept {', '.join(kept_emails)})")
        
        # Show remaining users
        remaining_users = CustomUser.objects.filter(email__in=kept_emails)
        print(f"📋 Remaining users:")
        for user in remaining_users:
            print(f"   - {user.email} (ID: {user.id})")
        
        print("\n🎉 Database cleared successfully!")
        print("🔄 You can now test fresh signups.")
        
    except Exception as e:
        print(f"❌ Error clearing database: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    clear_database()