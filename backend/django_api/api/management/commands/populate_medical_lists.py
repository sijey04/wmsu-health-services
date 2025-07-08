from django.core.management.base import BaseCommand
from api.models import ComorbidIllness, Vaccination, PastMedicalHistoryItem, FamilyMedicalHistoryItem


class Command(BaseCommand):
    help = 'Populate medical lists with default data'

    def handle(self, *args, **options):
        self.stdout.write('Populating medical lists with default data...')
        
        # Comorbid Illnesses
        comorbid_illnesses = [
            'Hypertension',
            'Diabetes Mellitus',
            'Asthma',
            'Heart Disease',
            'Epilepsy',
            'Kidney Disease',
            'Liver Disease',
            'Thyroid Disease',
            'Depression',
            'Anxiety Disorder',
            'Bipolar Disorder',
            'Schizophrenia',
            'Other Mental Health Condition'
        ]
        
        for index, illness in enumerate(comorbid_illnesses):
            ComorbidIllness.objects.get_or_create(
                label=illness,
                defaults={
                    'is_enabled': True,
                    'display_order': index
                }
            )
        
        # Vaccinations
        vaccinations = [
            'COVID-19',
            'Influenza (Flu)',
            'Hepatitis B',
            'Hepatitis A',
            'Tetanus',
            'Measles, Mumps, Rubella (MMR)',
            'Polio',
            'Pneumococcal',
            'Meningococcal',
            'Human Papillomavirus (HPV)',
            'Varicella (Chickenpox)',
            'Tuberculosis (BCG)',
            'Japanese Encephalitis',
            'Rabies',
            'Typhoid'
        ]
        
        for index, vaccination in enumerate(vaccinations):
            Vaccination.objects.get_or_create(
                name=vaccination,
                defaults={
                    'is_enabled': True,
                    'display_order': index
                }
            )
        
        # Past Medical History
        past_medical_histories = [
            'Asthma',
            'Allergic Rhinitis',
            'Skin Allergies',
            'Food Allergies',
            'Drug Allergies',
            'Hypertension',
            'Diabetes',
            'Heart Disease',
            'Kidney Disease',
            'Liver Disease',
            'Thyroid Disorders',
            'Epilepsy/Seizures',
            'Mental Health Conditions',
            'Cancer',
            'Stroke',
            'Tuberculosis',
            'Hepatitis',
            'Pneumonia',
            'Surgeries',
            'Hospitalizations',
            'Blood Transfusions',
            'Chronic Pain',
            'Autoimmune Disorders',
            'Gastrointestinal Disorders',
            'Respiratory Conditions'
        ]
        
        for index, history in enumerate(past_medical_histories):
            PastMedicalHistoryItem.objects.get_or_create(
                name=history,
                defaults={
                    'is_enabled': True,
                    'display_order': index
                }
            )
        
        # Family Medical History
        family_medical_histories = [
            'Diabetes',
            'Hypertension',
            'Heart Disease',
            'Stroke',
            'Cancer',
            'Asthma',
            'Allergies',
            'Kidney Disease',
            'Liver Disease',
            'Thyroid Disorders',
            'Epilepsy',
            'Mental Health Conditions',
            'Autoimmune Disorders',
            'Blood Disorders',
            'Genetic Disorders',
            'Obesity',
            'Osteoporosis',
            'Arthritis',
            'High Cholesterol',
            'Glaucoma',
            'Alzheimer\'s Disease',
            'Parkinson\'s Disease',
            'Huntington\'s Disease',
            'Sickle Cell Disease',
            'Thalassemia'
        ]
        
        for index, history in enumerate(family_medical_histories):
            FamilyMedicalHistoryItem.objects.get_or_create(
                name=history,
                defaults={
                    'is_enabled': True,
                    'display_order': index
                }
            )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully populated medical lists:\n'
                f'- {len(comorbid_illnesses)} comorbid illnesses\n'
                f'- {len(vaccinations)} vaccinations\n'
                f'- {len(past_medical_histories)} past medical history items\n'
                f'- {len(family_medical_histories)} family medical history items'
            )
        )
