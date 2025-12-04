from django.core.management.base import BaseCommand
from api.models import ProfileRequirement, DocumentRequirement, CampusSchedule, DentistSchedule


class Command(BaseCommand):
    help = 'Initialize default admin control settings'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Initializing admin control settings...'))

        # Profile Requirements
        profile_requirements = [
            {
                'field_name': 'name',
                'display_name': 'Last Name',
                'description': 'Patient surname/family name',
                'category': 'personal',
                'is_required': True
            },
            {
                'field_name': 'first_name',
                'display_name': 'First Name',
                'description': 'Patient first name',
                'category': 'personal',
                'is_required': True
            },
            {
                'field_name': 'middle_name',
                'display_name': 'Middle Name',
                'description': 'Patient middle name',
                'category': 'personal',
                'is_required': False
            },
            {
                'field_name': 'date_of_birth',
                'display_name': 'Date of Birth',
                'description': 'Patient birthdate',
                'category': 'personal',
                'is_required': True
            },
            {
                'field_name': 'gender',
                'display_name': 'Gender',
                'description': 'Patient gender',
                'category': 'personal',
                'is_required': True
            },
            {
                'field_name': 'blood_type',
                'display_name': 'Blood Type',
                'description': 'Patient blood type',
                'category': 'health',
                'is_required': True
            },
            {
                'field_name': 'city_municipality',
                'display_name': 'City/Municipality',
                'description': 'City or municipality',
                'category': 'personal',
                'is_required': True
            },
            {
                'field_name': 'barangay',
                'display_name': 'Barangay',
                'description': 'Barangay/district',
                'category': 'personal',
                'is_required': True
            },
            {
                'field_name': 'street',
                'display_name': 'Street',
                'description': 'Street address',
                'category': 'personal',
                'is_required': True
            },
            {
                'field_name': 'covid_vaccination_status',
                'display_name': 'COVID Vaccination Status',
                'description': 'COVID-19 vaccination status',
                'category': 'health',
                'is_required': True
            },
            {
                'field_name': 'hospital_admission_or_surgery',
                'display_name': 'Hospital Admission/Surgery History',
                'description': 'History of hospital admissions or surgeries',
                'category': 'health',
                'is_required': True
            },
            {
                'field_name': 'emergency_contact_first_name',
                'display_name': 'Emergency Contact First Name',
                'description': 'Emergency contact first name',
                'category': 'emergency',
                'is_required': True
            },
            {
                'field_name': 'emergency_contact_last_name',
                'display_name': 'Emergency Contact Last Name',
                'description': 'Emergency contact last name',
                'category': 'emergency',
                'is_required': True
            },
            {
                'field_name': 'emergency_contact_phone',
                'display_name': 'Emergency Contact Phone',
                'description': 'Emergency contact phone number',
                'category': 'emergency',
                'is_required': True
            }
        ]

        for req_data in profile_requirements:
            requirement, created = ProfileRequirement.objects.get_or_create(
                field_name=req_data['field_name'],
                defaults=req_data
            )
            if created:
                self.stdout.write(f'Created profile requirement: {requirement.display_name}')

        # Document Requirements
        document_requirements = [
            {
                'field_name': 'chest_xray',
                'display_name': 'Chest X-Ray',
                'description': 'Recent chest X-ray results',
                'is_required': True,
                'validity_period_months': 6,
                'specific_courses': []
            },
            {
                'field_name': 'cbc',
                'display_name': 'Complete Blood Count (CBC)',
                'description': 'Complete blood count laboratory results',
                'is_required': True,
                'validity_period_months': 6,
                'specific_courses': []
            },
            {
                'field_name': 'blood_typing',
                'display_name': 'Blood Typing',
                'description': 'Blood type and Rh factor test results',
                'is_required': True,
                'validity_period_months': 12,
                'specific_courses': []
            },
            {
                'field_name': 'urinalysis',
                'display_name': 'Urinalysis',
                'description': 'Complete urinalysis test results',
                'is_required': True,
                'validity_period_months': 6,
                'specific_courses': []
            },
            {
                'field_name': 'drug_test',
                'display_name': 'Drug Test',
                'description': 'Drug screening test results',
                'is_required': True,
                'validity_period_months': 12,
                'specific_courses': []
            },
            {
                'field_name': 'hepa_b',
                'display_name': 'Hepatitis B Test',
                'description': 'Hepatitis B surface antigen test results',
                'is_required': False,
                'validity_period_months': 12,
                'specific_courses': ['College of Medicine', 'College of Nursing', 'College of Home Economics', 'College of Criminal Justice Education', 'BS Food Technology', 'BS Biology']
            }
        ]

        for doc_data in document_requirements:
            requirement, created = DocumentRequirement.objects.get_or_create(
                field_name=doc_data['field_name'],
                defaults=doc_data
            )
            if created:
                self.stdout.write(f'Created document requirement: {requirement.display_name}')

        # Campus Schedules
        campus_schedules = [
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

        for schedule_data in campus_schedules:
            schedule, created = CampusSchedule.objects.get_or_create(
                campus=schedule_data['campus'],
                defaults=schedule_data
            )
            if created:
                self.stdout.write(f'Created campus schedule: {schedule.get_campus_display()}')

        # Dentist Schedules - Only one dentist on Campus A
        dentist_schedules = [
            {
                'dentist_name': 'Dr. Maria Santos',
                'campus': 'a',
                'available_days': ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                'time_slots': ['08:00-09:00', '09:00-10:00', '10:00-11:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'],
                'is_active': True
            }
        ]

        for dentist_data in dentist_schedules:
            schedule, created = DentistSchedule.objects.get_or_create(
                dentist_name=dentist_data['dentist_name'],
                campus=dentist_data['campus'],
                defaults=dentist_data
            )
            if created:
                self.stdout.write(f'Created dentist schedule: {schedule.dentist_name} - {schedule.get_campus_display()}')

        self.stdout.write(self.style.SUCCESS('Admin control settings initialized successfully!'))
