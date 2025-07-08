from django.core.management.base import BaseCommand
from api.models import (
    CustomUser, Patient, Appointment, MedicalRecord, Inventory, 
    MedicalDocument, DentalFormData, MedicalFormData, 
    StaffDetails, Waiver, SystemConfiguration, AcademicSchoolYear,
    # Configuration data that should be preserved
    CampusSchedule, ComorbidIllness, DentistSchedule, 
    DocumentRequirement, FamilyMedicalHistoryItem, 
    PastMedicalHistoryItem, ProfileRequirement, Vaccination
)

class Command(BaseCommand):
    help = 'Verify database state after cleanup'

    def handle(self, *args, **options):
        self.stdout.write("Database State After Cleanup:")
        self.stdout.write("=" * 50)
        
        # Check cleared data (should be 0 or minimal)
        self.stdout.write("\nCleared Data:")
        self.stdout.write(f"- Regular Users: {CustomUser.objects.filter(is_superuser=False).count()}")
        self.stdout.write(f"- Patient Profiles: {Patient.objects.count()}")
        self.stdout.write(f"- Appointments: {Appointment.objects.count()}")
        self.stdout.write(f"- Medical Records: {MedicalRecord.objects.count()}")
        self.stdout.write(f"- Medical Documents: {MedicalDocument.objects.count()}")
        self.stdout.write(f"- Dental Forms: {DentalFormData.objects.count()}")
        self.stdout.write(f"- Medical Forms: {MedicalFormData.objects.count()}")
        self.stdout.write(f"- Staff Details: {StaffDetails.objects.count()}")
        self.stdout.write(f"- Waivers: {Waiver.objects.count()}")
        self.stdout.write(f"- Inventory Items: {Inventory.objects.count()}")
        self.stdout.write(f"- Academic School Years: {AcademicSchoolYear.objects.count()}")
        self.stdout.write(f"- System Configurations: {SystemConfiguration.objects.count()}")
        
        # Check preserved data (should have values)
        self.stdout.write("\nPreserved Configuration Data:")
        self.stdout.write(f"- Campus Schedules: {CampusSchedule.objects.count()}")
        self.stdout.write(f"- Comorbid Illnesses: {ComorbidIllness.objects.count()}")
        self.stdout.write(f"- Dentist Schedules: {DentistSchedule.objects.count()}")
        self.stdout.write(f"- Document Requirements: {DocumentRequirement.objects.count()}")
        self.stdout.write(f"- Family Medical History Items: {FamilyMedicalHistoryItem.objects.count()}")
        self.stdout.write(f"- Past Medical History Items: {PastMedicalHistoryItem.objects.count()}")
        self.stdout.write(f"- Profile Requirements: {ProfileRequirement.objects.count()}")
        self.stdout.write(f"- Vaccinations: {Vaccination.objects.count()}")
        
        # Check superuser accounts
        superuser_count = CustomUser.objects.filter(is_superuser=True).count()
        self.stdout.write(f"- Superuser Accounts: {superuser_count}")
        
        if superuser_count > 0:
            self.stdout.write("\nSuperuser Accounts:")
            for user in CustomUser.objects.filter(is_superuser=True):
                self.stdout.write(f"  - {user.username} ({user.email})")
        
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write("Database cleanup verification complete!")
        
        # Summary
        total_test_records = (
            CustomUser.objects.filter(is_superuser=False).count() +
            Patient.objects.count() +
            Appointment.objects.count() +
            MedicalRecord.objects.count() +
            MedicalDocument.objects.count() +
            DentalFormData.objects.count() +
            MedicalFormData.objects.count() +
            StaffDetails.objects.count() +
            Waiver.objects.count() +
            Inventory.objects.count() +
            AcademicSchoolYear.objects.count() +
            SystemConfiguration.objects.count()
        )
        
        total_config_records = (
            CampusSchedule.objects.count() +
            ComorbidIllness.objects.count() +
            DentistSchedule.objects.count() +
            DocumentRequirement.objects.count() +
            FamilyMedicalHistoryItem.objects.count() +
            PastMedicalHistoryItem.objects.count() +
            ProfileRequirement.objects.count() +
            Vaccination.objects.count()
        )
        
        self.stdout.write(f"\nSummary:")
        self.stdout.write(f"- Test/User Records Remaining: {total_test_records}")
        self.stdout.write(f"- Configuration Records Preserved: {total_config_records}")
        self.stdout.write(f"- Superuser Accounts: {superuser_count}")
        
        if total_test_records == 0:
            self.stdout.write(self.style.SUCCESS("✓ All test records successfully cleared!"))
        else:
            self.stdout.write(self.style.WARNING(f"⚠ {total_test_records} test records still remain"))
        
        if total_config_records > 0:
            self.stdout.write(self.style.SUCCESS("✓ Configuration data successfully preserved!"))
        else:
            self.stdout.write(self.style.ERROR("✗ Configuration data may have been lost"))
