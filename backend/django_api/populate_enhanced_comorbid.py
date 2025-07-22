#!/usr/bin/env python
import os
import sys
import django

# Add the project root to the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import ComorbidIllness

def populate_enhanced_comorbid_illnesses():
    """Populate ComorbidIllness with enhanced sub-options and specifications"""
    
    illnesses_data = [
        {
            'label': 'Diabetes',
            'description': 'Blood sugar regulation disorder',
            'has_sub_options': True,
            'sub_options': ['Type 1 Diabetes', 'Type 2 Diabetes', 'Gestational Diabetes'],
            'requires_specification': True,
            'specification_placeholder': 'Specify blood sugar levels, medications, or management details'
        },
        {
            'label': 'Hypertension',
            'description': 'High blood pressure',
            'has_sub_options': False,
            'sub_options': [],
            'requires_specification': True,
            'specification_placeholder': 'Specify blood pressure readings or medications'
        },
        {
            'label': 'Psychiatric Illness',
            'description': 'Mental health conditions',
            'has_sub_options': True,
            'sub_options': [
                'Major Depressive Disorder',
                'Bipolar Disorder',
                'Generalized Anxiety Disorder',
                'Panic Disorder',
                'Posttraumatic Stress Disorder',
                'Schizophrenia',
                'Other'
            ],
            'requires_specification': True,
            'specification_placeholder': 'Specify medications, therapy, or additional details'
        },
        {
            'label': 'Heart Disease',
            'description': 'Cardiovascular conditions',
            'has_sub_options': True,
            'sub_options': [
                'Coronary Artery Disease',
                'Heart Failure',
                'Arrhythmia',
                'Valvular Heart Disease',
                'Congenital Heart Disease'
            ],
            'requires_specification': False,
            'specification_placeholder': ''
        },
        {
            'label': 'Food Allergies',
            'description': 'Allergic reactions to specific foods',
            'has_sub_options': True,
            'sub_options': [
                'Shellfish',
                'Nuts',
                'Dairy',
                'Eggs',
                'Wheat/Gluten',
                'Soy',
                'Fish',
                'Other'
            ],
            'requires_specification': True,
            'specification_placeholder': 'Specify severity of reactions or other details'
        },
        {
            'label': 'Respiratory Conditions',
            'description': 'Breathing and lung-related conditions',
            'has_sub_options': True,
            'sub_options': [
                'Asthma',
                'COPD',
                'Sleep Apnea',
                'Chronic Bronchitis',
                'Emphysema'
            ],
            'requires_specification': True,
            'specification_placeholder': 'Specify medications, triggers, or severity'
        }
    ]
    
    print("Populating enhanced ComorbidIllness data...")
    
    for illness_data in illnesses_data:
        illness, created = ComorbidIllness.objects.get_or_create(
            label=illness_data['label'],
            defaults={
                'description': illness_data['description'],
                'has_sub_options': illness_data['has_sub_options'],
                'sub_options': illness_data['sub_options'],
                'requires_specification': illness_data['requires_specification'],
                'specification_placeholder': illness_data['specification_placeholder'],
                'is_enabled': True,
                'display_order': 0
            }
        )
        
        if created:
            print(f"✓ Created: {illness.label}")
        else:
            # Update existing with new fields
            illness.has_sub_options = illness_data['has_sub_options']
            illness.sub_options = illness_data['sub_options']
            illness.requires_specification = illness_data['requires_specification']
            illness.specification_placeholder = illness_data['specification_placeholder']
            illness.save()
            print(f"✓ Updated: {illness.label}")
    
    print(f"\nCompleted! Total ComorbidIllness items: {ComorbidIllness.objects.count()}")

if __name__ == "__main__":
    populate_enhanced_comorbid_illnesses()
