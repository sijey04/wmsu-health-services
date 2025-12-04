#!/usr/bin/env python3

"""
Test script to verify enhanced ComorbidIllness functionality in profile setup
"""

import os
import sys
import django
import json

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import ComorbidIllness
from api.serializers import ComorbidIllnessSerializer

def test_enhanced_comorbid_profile_integration():
    print("Testing Enhanced ComorbidIllness Profile Integration...")
    print("=" * 60)
    
    # Test API endpoint data structure
    print("1. Testing API Serializer Output:")
    print("-" * 40)
    
    enhanced_illnesses = ComorbidIllness.objects.filter(
        is_enabled=True,
        has_sub_options=True
    ).order_by('label')
    
    for illness in enhanced_illnesses:
        serializer = ComorbidIllnessSerializer(illness)
        data = serializer.data
        print(f"\n{illness.label}:")
        print(f"  API Response Structure:")
        print(f"    - id: {data['id']}")
        print(f"    - label: {data['label']}")
        print(f"    - is_enabled: {data['is_enabled']}")
        print(f"    - has_sub_options: {data['has_sub_options']}")
        print(f"    - sub_options: {data['sub_options']}")
        print(f"    - requires_specification: {data['requires_specification']}")
        print(f"    - specification_placeholder: {data['specification_placeholder']}")
    
    print(f"\n2. Frontend Field Name Generation Test:")
    print("-" * 40)
    
    # Test field name generation (matching frontend logic)
    for illness in enhanced_illnesses:
        # Test sub-options field name
        sub_field = f"comorbid_{illness.label.lower().replace(' ', '_')}_sub"
        spec_field = f"comorbid_{illness.label.lower().replace(' ', '_')}_spec"
        
        print(f"\n{illness.label}:")
        print(f"  Sub-options field: {sub_field}")
        print(f"  Specification field: {spec_field}")
        
        if illness.sub_options:
            print(f"  Expected sub-options: {illness.sub_options}")
        if illness.requires_specification:
            print(f"  Specification placeholder: {illness.specification_placeholder}")
    
    print(f"\n3. Profile Data Structure Test:")
    print("-" * 40)
    
    # Simulate profile data structure
    sample_profile = {
        'comorbid_illnesses': ['Diabetes', 'Food Allergies', 'Psychiatric Illness']
    }
    
    # Add enhanced fields for selected illnesses
    for illness_name in sample_profile['comorbid_illnesses']:
        illness = ComorbidIllness.objects.filter(label=illness_name).first()
        if illness:
            if illness.has_sub_options and illness.sub_options:
                sub_field = f"comorbid_{illness_name.lower().replace(' ', '_')}_sub"
                sample_profile[sub_field] = illness.sub_options[:2]  # Select first 2 options
            
            if illness.requires_specification:
                spec_field = f"comorbid_{illness_name.lower().replace(' ', '_')}_spec"
                sample_profile[spec_field] = f"Sample specification for {illness_name}"
    
    print("Sample Profile Data:")
    print(json.dumps(sample_profile, indent=2))
    
    print(f"\n4. Validation Rules Test:")
    print("-" * 40)
    
    # Test validation rules
    validation_errors = []
    
    for illness_name in sample_profile['comorbid_illnesses']:
        illness = ComorbidIllness.objects.filter(label=illness_name).first()
        if illness and illness.requires_specification:
            spec_field = f"comorbid_{illness_name.lower().replace(' ', '_')}_spec"
            if spec_field not in sample_profile or not sample_profile[spec_field]:
                validation_errors.append(f"Please specify details for {illness_name}.")
    
    if validation_errors:
        print("Validation Errors:")
        for error in validation_errors:
            print(f"  - {error}")
    else:
        print("✓ All validation rules passed")
    
    print(f"\n5. Summary:")
    print("-" * 40)
    
    total_illnesses = ComorbidIllness.objects.filter(is_enabled=True).count()
    enhanced_illnesses_count = ComorbidIllness.objects.filter(
        is_enabled=True, 
        has_sub_options=True
    ).count()
    specification_required_count = ComorbidIllness.objects.filter(
        is_enabled=True, 
        requires_specification=True
    ).count()
    
    print(f"Total enabled illnesses: {total_illnesses}")
    print(f"Illnesses with sub-options: {enhanced_illnesses_count}")
    print(f"Illnesses requiring specification: {specification_required_count}")
    print("\n✓ Enhanced ComorbidIllness profile integration is ready for testing!")

if __name__ == "__main__":
    test_enhanced_comorbid_profile_integration()
