#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to Python path
project_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_dir)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import ComorbidIllness, Vaccination, PastMedicalHistoryItem, FamilyMedicalHistoryItem

def populate_medical_lists():
    print("Starting medical lists population...")
    
    # Create Comorbid Illnesses
    print("\n--- Creating Comorbid Illnesses ---")
    comorbid_data = [
        'Bronchial Asthma ("Hika")',
        'Food Allergies', 
        'Allergic Rhinitis',
        'Hyperthyroidism',
        'Hypothyroidism/Goiter',
        'Anemia',
        'Diabetes',
        'Hypertension',
        'Heart Disease',
        'Kidney Disease'
    ]

    for illness in comorbid_data:
        obj, created = ComorbidIllness.objects.get_or_create(
            label=illness, 
            defaults={'is_enabled': True}
        )
        if created:
            print(f'✓ Created comorbid illness: {illness}')
        else:
            print(f'  Already exists: {illness}')

    # Create Vaccinations
    print("\n--- Creating Vaccinations ---")
    vaccination_data = [
        'COVID-19',
        'Influenza', 
        'Hepatitis B',
        'Tetanus',
        'Measles',
        'MMR (Measles, Mumps, Rubella)',
        'Polio',
        'DPT (Diphtheria, Pertussis, Tetanus)'
    ]

    for vaccination in vaccination_data:
        obj, created = Vaccination.objects.get_or_create(
            name=vaccination, 
            defaults={'is_enabled': True}
        )
        if created:
            print(f'✓ Created vaccination: {vaccination}')
        else:
            print(f'  Already exists: {vaccination}')

    # Create Past Medical History Items
    print("\n--- Creating Past Medical History Items ---")
    past_medical_data = [
        'Surgery',
        'Hospitalization',
        'Allergies', 
        'Chronic Illness',
        'Injuries',
        'Appendicitis',
        'Cholecystitis',
        'Measles',
        'Typhoid Fever',
        'Amoebiasis'
    ]

    for item in past_medical_data:
        obj, created = PastMedicalHistoryItem.objects.get_or_create(
            name=item, 
            defaults={'is_enabled': True}
        )
        if created:
            print(f'✓ Created past medical history: {item}')
        else:
            print(f'  Already exists: {item}')

    # Create Family Medical History Items
    print("\n--- Creating Family Medical History Items ---")
    family_medical_data = [
        'Diabetes',
        'Heart Disease',
        'Cancer',
        'Hypertension', 
        'Mental Health Conditions',
        'Hypertension (Elevated Blood Pressure)',
        'Coronary Artery Disease',
        'Congestive Heart Failure',
        'Diabetes Mellitus (Elevated Blood Sugar)',
        'Chronic Kidney Disease (With/Without Hemodialysis)',
        'Mental Illness (Depression, Schizophrenia, etc.)',
        'Liver Disease (Hepatitis, Cirrhosis)',
        'Arthritis/Gout',
        'Blood Disorder (Anemia, Hemophilia, etc.)',
        'Cancer (Any Type)',
        'Stroke (Cerebrovascular Disease)',
        'Asthma',
        'Tuberculosis'
    ]

    for item in family_medical_data:
        obj, created = FamilyMedicalHistoryItem.objects.get_or_create(
            name=item, 
            defaults={'is_enabled': True}
        )
        if created:
            print(f'✓ Created family medical history: {item}')
        else:
            print(f'  Already exists: {item}')

    print("\n🎉 Medical lists population completed successfully!")
    
    # Print summary
    print(f"\nSummary:")
    print(f"- Comorbid Illnesses: {ComorbidIllness.objects.count()}")
    print(f"- Vaccinations: {Vaccination.objects.count()}")
    print(f"- Past Medical History: {PastMedicalHistoryItem.objects.count()}")
    print(f"- Family Medical History: {FamilyMedicalHistoryItem.objects.count()}")

if __name__ == '__main__':
    populate_medical_lists()
