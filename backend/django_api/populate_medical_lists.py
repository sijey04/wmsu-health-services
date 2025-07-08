#!/usr/bin/env python
"""
Script to populate medical lists with default data
"""
import os
import django
import sys

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import ComorbidIllness, Vaccination, PastMedicalHistoryItem, FamilyMedicalHistoryItem


def populate_comorbid_illnesses():
    """Populate comorbid illnesses"""
    illnesses = [
        "Diabetes Mellitus",
        "Hypertension",
        "Heart Disease",
        "Asthma",
        "Bronchitis",
        "Tuberculosis",
        "Chronic Kidney Disease",
        "Liver Disease",
        "Obesity",
        "Thyroid Disease",
        "Epilepsy",
        "Stroke",
        "Cancer",
        "Autoimmune Disease",
        "COPD (Chronic Obstructive Pulmonary Disease)",
        "Arthritis",
        "Osteoporosis",
        "Mental Health Disorders",
        "Allergies",
        "None"
    ]
    
    for i, illness in enumerate(illnesses):
        ComorbidIllness.objects.get_or_create(
            label=illness,
            defaults={
                'description': f'Common medical condition: {illness}',
                'is_enabled': True,
                'display_order': i
            }
        )
    
    print(f"Populated {len(illnesses)} comorbid illnesses")


def populate_vaccinations():
    """Populate vaccination types"""
    vaccinations = [
        "BCG (Bacillus Calmette-Guérin)",
        "Hepatitis B",
        "DPT (Diphtheria, Pertussis, Tetanus)",
        "OPV (Oral Polio Vaccine)",
        "IPV (Inactivated Polio Vaccine)",
        "HIB (Haemophilus influenzae type b)",
        "PCV (Pneumococcal Conjugate Vaccine)",
        "MMR (Measles, Mumps, Rubella)",
        "Varicella (Chickenpox)",
        "Hepatitis A",
        "Influenza (Annual)",
        "HPV (Human Papillomavirus)",
        "Meningococcal",
        "Tdap (Tetanus, Diphtheria, Pertussis)",
        "COVID-19",
        "Other"
    ]
    
    for i, vaccination in enumerate(vaccinations):
        Vaccination.objects.get_or_create(
            name=vaccination,
            defaults={
                'description': f'Standard vaccination: {vaccination}',
                'is_enabled': True,
                'display_order': i
            }
        )
    
    print(f"Populated {len(vaccinations)} vaccinations")


def populate_past_medical_history():
    """Populate past medical history items"""
    items = [
        "Allergic Reactions",
        "Asthma",
        "Chickenpox",
        "Dengue Fever",
        "Diabetes",
        "Fractures",
        "Heart Problems",
        "Hepatitis",
        "High Blood Pressure",
        "Hospitalization",
        "Injuries",
        "Kidney Problems",
        "Liver Problems",
        "Malaria",
        "Measles",
        "Operations/Surgery",
        "Pneumonia",
        "Skin Conditions",
        "Typhoid",
        "Tuberculosis",
        "Urinary Tract Infections",
        "Vision Problems",
        "Other Medical Conditions",
        "None"
    ]
    
    for i, item in enumerate(items):
        PastMedicalHistoryItem.objects.get_or_create(
            name=item,
            defaults={
                'description': f'Past medical history: {item}',
                'is_enabled': True,
                'display_order': i
            }
        )
    
    print(f"Populated {len(items)} past medical history items")


def populate_family_medical_history():
    """Populate family medical history items"""
    items = [
        "Allergies",
        "Asthma",
        "Cancer",
        "Diabetes",
        "Heart Disease",
        "High Blood Pressure",
        "Kidney Disease",
        "Liver Disease",
        "Mental Health Disorders",
        "Obesity",
        "Stroke",
        "Thyroid Disease",
        "Tuberculosis",
        "Autoimmune Diseases",
        "Blood Disorders",
        "Bone/Joint Problems",
        "Eye Problems",
        "Hearing Problems",
        "Skin Conditions",
        "Substance Abuse",
        "Other Genetic Conditions",
        "None Known"
    ]
    
    for i, item in enumerate(items):
        FamilyMedicalHistoryItem.objects.get_or_create(
            name=item,
            defaults={
                'description': f'Family medical history: {item}',
                'is_enabled': True,
                'display_order': i
            }
        )
    
    print(f"Populated {len(items)} family medical history items")


if __name__ == '__main__':
    print("Populating medical lists...")
    populate_comorbid_illnesses()
    populate_vaccinations()
    populate_past_medical_history()
    populate_family_medical_history()
    print("Medical lists populated successfully!")
