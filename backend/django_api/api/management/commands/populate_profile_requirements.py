from django.core.management.base import BaseCommand
from api.models import ProfileRequirement, ComorbidIllness, Vaccination, PastMedicalHistoryItem, FamilyMedicalHistoryItem

class Command(BaseCommand):
    help = 'Create sample profile requirements and medical lists'

    def handle(self, *args, **options):
        # Profile Requirements data (less relevant now since user only wants medical lists controlled)
        requirements_data = [
            # Personal Information
            {'field_name': 'first_name', 'display_name': 'First Name', 'category': 'personal', 'is_required': True, 'description': 'Student\'s first name'},
            {'field_name': 'middle_name', 'display_name': 'Middle Name', 'category': 'personal', 'is_required': False, 'description': 'Student\'s middle name'},
            {'field_name': 'name', 'display_name': 'Last Name', 'category': 'personal', 'is_required': True, 'description': 'Student\'s last name'},
            {'field_name': 'suffix', 'display_name': 'Suffix', 'category': 'personal', 'is_required': False, 'description': 'Name suffix (Jr., Sr., III, etc.)'},
            {'field_name': 'date_of_birth', 'display_name': 'Date of Birth', 'category': 'personal', 'is_required': True, 'description': 'Student\'s date of birth'},
            {'field_name': 'age', 'display_name': 'Age', 'category': 'personal', 'is_required': True, 'description': 'Student\'s current age'},
            {'field_name': 'gender', 'display_name': 'Gender', 'category': 'personal', 'is_required': True, 'description': 'Student\'s gender'},
            {'field_name': 'blood_type', 'display_name': 'Blood Type', 'category': 'personal', 'is_required': True, 'description': 'Student\'s blood type'},
            {'field_name': 'religion', 'display_name': 'Religion', 'category': 'personal', 'is_required': False, 'description': 'Student\'s religion'},
            {'field_name': 'nationality', 'display_name': 'Nationality', 'category': 'personal', 'is_required': True, 'description': 'Student\'s nationality'},
            {'field_name': 'civil_status', 'display_name': 'Civil Status', 'category': 'personal', 'is_required': True, 'description': 'Student\'s civil status'},
            {'field_name': 'email', 'display_name': 'Email Address', 'category': 'personal', 'is_required': True, 'description': 'Student\'s email address'},
            {'field_name': 'contact_number', 'display_name': 'Contact Number', 'category': 'personal', 'is_required': True, 'description': 'Student\'s phone number'},
            {'field_name': 'street', 'display_name': 'Street Address', 'category': 'personal', 'is_required': True, 'description': 'Street address'},
            {'field_name': 'barangay', 'display_name': 'Barangay', 'category': 'personal', 'is_required': True, 'description': 'Barangay address'},
            {'field_name': 'city_municipality', 'display_name': 'City/Municipality', 'category': 'personal', 'is_required': True, 'description': 'City or municipality'},
        ]
        
        # Medical Lists Data - The main focus for admin controls
        comorbid_illnesses_data = [
            {'label': 'Diabetes', 'description': 'Diabetes mellitus', 'is_enabled': True, 'display_order': 1},
            {'label': 'Hypertension', 'description': 'High blood pressure', 'is_enabled': True, 'display_order': 2},
            {'label': 'Heart Disease', 'description': 'Cardiovascular disease', 'is_enabled': True, 'display_order': 3},
            {'label': 'Asthma', 'description': 'Respiratory condition', 'is_enabled': True, 'display_order': 4},
            {'label': 'Allergies', 'description': 'Various allergic reactions', 'is_enabled': True, 'display_order': 5},
            {'label': 'Cancer', 'description': 'Malignant neoplasms', 'is_enabled': True, 'display_order': 6},
            {'label': 'Kidney Disease', 'description': 'Renal disorders', 'is_enabled': True, 'display_order': 7},
            {'label': 'Liver Disease', 'description': 'Hepatic disorders', 'is_enabled': True, 'display_order': 8},
            {'label': 'Thyroid Disease', 'description': 'Thyroid disorders', 'is_enabled': True, 'display_order': 9},
            {'label': 'Mental Health Disorders', 'description': 'Psychiatric conditions', 'is_enabled': True, 'display_order': 10},
        ]
        
        vaccinations_data = [
            {'name': 'COVID-19', 'description': 'COVID-19 vaccination', 'is_enabled': True, 'display_order': 1},
            {'name': 'Influenza (Flu)', 'description': 'Annual flu vaccine', 'is_enabled': True, 'display_order': 2},
            {'name': 'Hepatitis B', 'description': 'Hepatitis B vaccine', 'is_enabled': True, 'display_order': 3},
            {'name': 'Tetanus', 'description': 'Tetanus vaccine', 'is_enabled': True, 'display_order': 4},
            {'name': 'MMR (Measles, Mumps, Rubella)', 'description': 'MMR combination vaccine', 'is_enabled': True, 'display_order': 5},
            {'name': 'Varicella (Chickenpox)', 'description': 'Chickenpox vaccine', 'is_enabled': True, 'display_order': 6},
            {'name': 'HPV', 'description': 'Human papillomavirus vaccine', 'is_enabled': True, 'display_order': 7},
            {'name': 'Pneumococcal', 'description': 'Pneumonia vaccine', 'is_enabled': True, 'display_order': 8},
        ]
        
        past_medical_data = [
            {'name': 'Surgery', 'description': 'Previous surgical procedures', 'is_enabled': True, 'display_order': 1},
            {'name': 'Hospitalization', 'description': 'Previous hospital admissions', 'is_enabled': True, 'display_order': 2},
            {'name': 'Fractures', 'description': 'Bone fractures', 'is_enabled': True, 'display_order': 3},
            {'name': 'Accidents', 'description': 'Major accidents or injuries', 'is_enabled': True, 'display_order': 4},
            {'name': 'Chronic Medications', 'description': 'Long-term medication use', 'is_enabled': True, 'display_order': 5},
            {'name': 'Blood Transfusion', 'description': 'Previous blood transfusions', 'is_enabled': True, 'display_order': 6},
            {'name': 'Serious Infections', 'description': 'Major infections requiring treatment', 'is_enabled': True, 'display_order': 7},
        ]
        
        family_medical_data = [
            {'name': 'Diabetes', 'description': 'Family history of diabetes', 'is_enabled': True, 'display_order': 1},
            {'name': 'Heart Disease', 'description': 'Family history of cardiovascular disease', 'is_enabled': True, 'display_order': 2},
            {'name': 'Cancer', 'description': 'Family history of cancer', 'is_enabled': True, 'display_order': 3},
            {'name': 'Hypertension', 'description': 'Family history of high blood pressure', 'is_enabled': True, 'display_order': 4},
            {'name': 'Stroke', 'description': 'Family history of stroke', 'is_enabled': True, 'display_order': 5},
            {'name': 'Mental Health Disorders', 'description': 'Family history of mental health conditions', 'is_enabled': True, 'display_order': 6},
            {'name': 'Kidney Disease', 'description': 'Family history of kidney disease', 'is_enabled': True, 'display_order': 7},
            {'name': 'Liver Disease', 'description': 'Family history of liver disease', 'is_enabled': True, 'display_order': 8},
        ]
        
        # Populate Profile Requirements
        req_created = 0
        for req_data in requirements_data:
            requirement, created = ProfileRequirement.objects.get_or_create(
                field_name=req_data['field_name'],
                defaults={
                    'display_name': req_data['display_name'],
                    'category': req_data['category'],
                    'is_required': req_data['is_required'],
                    'description': req_data['description'],
                    'is_active': True
                }
            )
            if created:
                req_created += 1
                self.stdout.write(f"Created profile requirement: {requirement.display_name}")
        
        # Populate Comorbid Illnesses
        comorbid_created = 0
        for illness_data in comorbid_illnesses_data:
            illness, created = ComorbidIllness.objects.get_or_create(
                label=illness_data['label'],
                defaults={
                    'description': illness_data['description'],
                    'is_enabled': illness_data['is_enabled'],
                    'display_order': illness_data['display_order']
                }
            )
            if created:
                comorbid_created += 1
                self.stdout.write(f"Created comorbid illness: {illness.label}")
        
        # Populate Vaccinations
        vaccination_created = 0
        for vaccination_data in vaccinations_data:
            vaccination, created = Vaccination.objects.get_or_create(
                name=vaccination_data['name'],
                defaults={
                    'description': vaccination_data['description'],
                    'is_enabled': vaccination_data['is_enabled'],
                    'display_order': vaccination_data['display_order']
                }
            )
            if created:
                vaccination_created += 1
                self.stdout.write(f"Created vaccination: {vaccination.name}")
        
        # Populate Past Medical History
        past_medical_created = 0
        for history_data in past_medical_data:
            history, created = PastMedicalHistoryItem.objects.get_or_create(
                name=history_data['name'],
                defaults={
                    'description': history_data['description'],
                    'is_enabled': history_data['is_enabled'],
                    'display_order': history_data['display_order']
                }
            )
            if created:
                past_medical_created += 1
                self.stdout.write(f"Created past medical history: {history.name}")
        
        # Populate Family Medical History
        family_medical_created = 0
        for family_data in family_medical_data:
            family_history, created = FamilyMedicalHistoryItem.objects.get_or_create(
                name=family_data['name'],
                defaults={
                    'description': family_data['description'],
                    'is_enabled': family_data['is_enabled'],
                    'display_order': family_data['display_order']
                }
            )
            if created:
                family_medical_created += 1
                self.stdout.write(f"Created family medical history: {family_history.name}")
        
        self.stdout.write(f"\nSummary:")
        self.stdout.write(f"Profile Requirements: {req_created} created")
        self.stdout.write(f"Comorbid Illnesses: {comorbid_created} created")
        self.stdout.write(f"Vaccinations: {vaccination_created} created")
        self.stdout.write(f"Past Medical History: {past_medical_created} created")
        self.stdout.write(f"Family Medical History: {family_medical_created} created")
        self.stdout.write(self.style.SUCCESS('Successfully populated all medical data!'))
