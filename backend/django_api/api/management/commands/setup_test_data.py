from django.core.management.base import BaseCommand
from api.models import CustomUser, StaffDetails, Patient, MedicalDocument


class Command(BaseCommand):
    help = 'Create default staff details and test data'

    def handle(self, *args, **options):
        # Create or get admin user
        admin_user, created = CustomUser.objects.get_or_create(
            email='admin@wmsu.edu.ph',
            defaults={
                'username': 'admin',
                'first_name': 'Felicitas Asuncion',
                'middle_name': 'C.',
                'last_name': 'Elago',
                'user_type': 'admin',
                'is_staff': True,
                'is_email_verified': True,
            }
        )
        
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {admin_user.email}'))
        else:
            self.stdout.write(f'Admin user already exists: {admin_user.email}')
        
        # Create or get staff details
        staff_details, created = StaffDetails.objects.get_or_create(
            user=admin_user,
            defaults={
                'full_name': 'FELICITAS ASUNCION C. ELAGO, M.D.',
                'position': 'MEDICAL OFFICER III',
                'license_number': '0160267',
                'ptr_number': '2795114',
                'campus_assigned': 'main',
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created staff details for: {staff_details.full_name}'))
        else:
            self.stdout.write(f'Staff details already exist for: {staff_details.full_name}')

        # Create test patient if not exists
        test_patient, created = Patient.objects.get_or_create(
            student_id='2021-12345',
            defaults={
                'name': 'Test Student',
                'first_name': 'Test',
                'middle_name': 'S.',
                'gender': 'Male',
                'department': 'Computer Science',
                'age': 21,
                'email': 'test@student.wmsu.edu.ph'
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created test patient: {test_patient.name}'))
        else:
            self.stdout.write(f'Test patient already exists: {test_patient.name}')

        # Create test medical document if not exists
        test_doc, created = MedicalDocument.objects.get_or_create(
            patient=test_patient,
            defaults={
                'status': 'issued',
                'reviewed_by': admin_user,
                'certificate_issued_at': '2025-06-23T10:00:00Z'
            }
        )
        
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created test medical document for: {test_patient.name}'))
        else:
            self.stdout.write(f'Test medical document already exists for: {test_patient.name}')

        self.stdout.write(self.style.SUCCESS('Setup completed successfully!'))
