from django.core.management.base import BaseCommand
from django.db import transaction
from api.models import (
    CustomUser, Patient, Appointment, MedicalRecord, Inventory, 
    MedicalDocument, DentalFormData, MedicalFormData, 
    StaffDetails, Waiver, SystemConfiguration, AcademicSchoolYear,
    # These will be preserved
    CampusSchedule, ComorbidIllness, DentistSchedule, 
    DocumentRequirement, FamilyMedicalHistoryItem, 
    PastMedicalHistoryItem, ProfileRequirement, Vaccination
)

class Command(BaseCommand):
    help = 'Clear test records from database while preserving configuration data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm the deletion without prompting',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(self.style.WARNING("WARNING: This will clear all test records from the database!"))
            self.stdout.write("The following data will be DELETED:")
            self.stdout.write("- All user accounts (except superusers)")
            self.stdout.write("- All patient profiles")
            self.stdout.write("- All appointments")
            self.stdout.write("- All medical records")
            self.stdout.write("- All medical documents")
            self.stdout.write("- All form data")
            self.stdout.write("- All inventory items")
            self.stdout.write("- All staff details")
            self.stdout.write("- All waivers")
            self.stdout.write("- All academic school years")
            self.stdout.write("- All system configurations")
            self.stdout.write("\nThe following configuration data will be PRESERVED:")
            self.stdout.write("- Campus Schedules")
            self.stdout.write("- Comorbid Illnesses")
            self.stdout.write("- Dentist Schedules")
            self.stdout.write("- Document Requirements")
            self.stdout.write("- Family Medical History Items")
            self.stdout.write("- Past Medical History Items")
            self.stdout.write("- Profile Requirements")
            self.stdout.write("- Vaccinations")
            self.stdout.write("- Superuser accounts")
            
            confirm = input("\nAre you sure you want to proceed? (type 'yes' to confirm): ")
            if confirm.lower() != 'yes':
                self.stdout.write(self.style.ERROR("Database cleanup cancelled."))
                return

        self.stdout.write("Starting database cleanup...")
        
        try:
            with transaction.atomic():
                # Clear user-related data (but preserve superuser accounts)
                self.stdout.write("Clearing staff details...")
                StaffDetails.objects.all().delete()
                
                self.stdout.write("Clearing waivers...")
                Waiver.objects.all().delete()
                
                self.stdout.write("Clearing form data...")
                DentalFormData.objects.all().delete()
                MedicalFormData.objects.all().delete()
                
                self.stdout.write("Clearing medical documents...")
                MedicalDocument.objects.all().delete()
                
                self.stdout.write("Clearing appointments...")
                Appointment.objects.all().delete()
                
                self.stdout.write("Clearing medical records...")
                MedicalRecord.objects.all().delete()
                
                self.stdout.write("Clearing inventory...")
                Inventory.objects.all().delete()
                
                self.stdout.write("Clearing patient profiles...")
                Patient.objects.all().delete()
                
                self.stdout.write("Clearing academic school years...")
                AcademicSchoolYear.objects.all().delete()
                
                self.stdout.write("Clearing system configurations...")
                SystemConfiguration.objects.all().delete()
                
                # Clear non-superuser accounts
                self.stdout.write("Clearing non-superuser accounts...")
                regular_users = CustomUser.objects.filter(is_superuser=False)
                user_count = regular_users.count()
                regular_users.delete()
                
                self.stdout.write(f"Cleared {user_count} regular user accounts")
                
                # Show what's preserved
                self.stdout.write("\nPreserved configuration data:")
                self.stdout.write(f"- Campus Schedules: {CampusSchedule.objects.count()}")
                self.stdout.write(f"- Comorbid Illnesses: {ComorbidIllness.objects.count()}")
                self.stdout.write(f"- Dentist Schedules: {DentistSchedule.objects.count()}")
                self.stdout.write(f"- Document Requirements: {DocumentRequirement.objects.count()}")
                self.stdout.write(f"- Family Medical History Items: {FamilyMedicalHistoryItem.objects.count()}")
                self.stdout.write(f"- Past Medical History Items: {PastMedicalHistoryItem.objects.count()}")
                self.stdout.write(f"- Profile Requirements: {ProfileRequirement.objects.count()}")
                self.stdout.write(f"- Vaccinations: {Vaccination.objects.count()}")
                
                superuser_count = CustomUser.objects.filter(is_superuser=True).count()
                self.stdout.write(f"- Superuser accounts: {superuser_count}")
                
                self.stdout.write(self.style.SUCCESS("\nDatabase cleanup completed successfully!"))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error during database cleanup: {str(e)}"))
            raise
