from django.core.management.base import BaseCommand
from api.models import (
    ProfileRequirement, DocumentRequirement, CampusSchedule, 
    DentistSchedule, ComorbidIllness, Vaccination, 
    PastMedicalHistoryItem, FamilyMedicalHistoryItem
)


class Command(BaseCommand):
    help = 'Populate admin controls with default data'

    def handle(self, *args, **options):
        self.stdout.write('Populating admin controls...')
        
        # Create default profile requirements
        profile_requirements = [
            {
                'field_name': 'name',
                'display_name': 'Full Name',
                'description': 'Patient\'s full name',
                'category': 'personal',
                'is_required': True,
                'is_active': True
            },
            {
                'field_name': 'date_of_birth',
                'display_name': 'Date of Birth',
                'description': 'Patient\'s date of birth',
                'category': 'personal',
                'is_required': True,
                'is_active': True
            },
            {
                'field_name': 'gender',
                'display_name': 'Gender',
                'description': 'Patient\'s gender',
                'category': 'personal',
                'is_required': True,
                'is_active': True
            },
            {
                'field_name': 'contact_number',
                'display_name': 'Contact Number',
                'description': 'Patient\'s contact number',
                'category': 'personal',
                'is_required': True,
                'is_active': True
            },
            {
                'field_name': 'emergency_contact_name',
                'display_name': 'Emergency Contact Name',
                'description': 'Emergency contact person\'s name',
                'category': 'emergency',
                'is_required': True,
                'is_active': True
            },
            {
                'field_name': 'emergency_contact_number',
                'display_name': 'Emergency Contact Number',
                'description': 'Emergency contact person\'s phone number',
                'category': 'emergency',
                'is_required': True,
                'is_active': True
            },
            {
                'field_name': 'blood_type',
                'display_name': 'Blood Type',
                'description': 'Patient\'s blood type',
                'category': 'health',
                'is_required': False,
                'is_active': True
            },
            {
                'field_name': 'allergies',
                'display_name': 'Allergies',
                'description': 'Patient\'s known allergies',
                'category': 'health',
                'is_required': False,
                'is_active': True
            }
        ]
        
        for req_data in profile_requirements:
            ProfileRequirement.objects.get_or_create(
                field_name=req_data['field_name'],
                defaults=req_data
            )
        
        # Create default document requirements
        document_requirements = [
            {
                'field_name': 'chest_xray',
                'display_name': 'Chest X-Ray',
                'description': 'Chest X-Ray result',
                'is_required': True,
                'validity_period_months': 12,
                'specific_courses': []
            },
            {
                'field_name': 'cbc',
                'display_name': 'Complete Blood Count',
                'description': 'CBC laboratory result',
                'is_required': True,
                'validity_period_months': 6,
                'specific_courses': []
            },
            {
                'field_name': 'urinalysis',
                'display_name': 'Urinalysis',
                'description': 'Urinalysis laboratory result',
                'is_required': True,
                'validity_period_months': 6,
                'specific_courses': []
            },
            {
                'field_name': 'drug_test',
                'display_name': 'Drug Test',
                'description': 'Drug test result',
                'is_required': False,
                'validity_period_months': 12,
                'specific_courses': ['Nursing', 'Medical Technology']
            }
        ]
        
        for doc_data in document_requirements:
            DocumentRequirement.objects.get_or_create(
                field_name=doc_data['field_name'],
                defaults=doc_data
            )
        
        # Create default campus schedules
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
            CampusSchedule.objects.get_or_create(
                campus=schedule_data['campus'],
                defaults=schedule_data
            )
        
        # Create default comorbid illnesses
        comorbid_illnesses = [
            'Hypertension',
            'Diabetes',
            'Asthma',
            'Heart Disease',
            'Kidney Disease',
            'Liver Disease',
            'Cancer',
            'Epilepsy',
            'Thyroid Disease',
            'Mental Health Conditions'
        ]
        
        for illness in comorbid_illnesses:
            ComorbidIllness.objects.get_or_create(
                label=illness,
                defaults={'label': illness, 'is_enabled': True}
            )
        
        # Create default vaccinations
        vaccinations = [
            'COVID-19',
            'Influenza',
            'Hepatitis B',
            'Tetanus',
            'Measles',
            'Mumps',
            'Rubella',
            'Polio',
            'Tuberculosis (BCG)',
            'Pneumococcal'
        ]
        
        for vaccination in vaccinations:
            Vaccination.objects.get_or_create(
                name=vaccination,
                defaults={'name': vaccination, 'is_enabled': True}
            )
        
        # Create default past medical history items
        past_medical_items = [
            'Hospitalization',
            'Surgery',
            'Allergic Reactions',
            'Serious Illness',
            'Chronic Conditions',
            'Mental Health Treatment',
            'Substance Abuse Treatment',
            'Blood Transfusion',
            'Organ Transplant',
            'Major Injury'
        ]
        
        for item in past_medical_items:
            PastMedicalHistoryItem.objects.get_or_create(
                name=item,
                defaults={'name': item, 'is_enabled': True}
            )
        
        # Create default family medical history items
        family_medical_items = [
            'Heart Disease',
            'Stroke',
            'Diabetes',
            'High Blood Pressure',
            'Cancer',
            'Mental Health Conditions',
            'Kidney Disease',
            'Liver Disease',
            'Autoimmune Diseases',
            'Genetic Disorders'
        ]
        
        for item in family_medical_items:
            FamilyMedicalHistoryItem.objects.get_or_create(
                name=item,
                defaults={'name': item, 'is_enabled': True}
            )
        
        self.stdout.write(
            self.style.SUCCESS('Successfully populated admin controls with default data')
        )
