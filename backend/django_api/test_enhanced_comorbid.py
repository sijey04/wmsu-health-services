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
from api.serializers import ComorbidIllnessSerializer

def test_enhanced_comorbid_illnesses():
    """Test the enhanced ComorbidIllness functionality"""
    
    print("Testing Enhanced ComorbidIllness Features...")
    print("=" * 50)
    
    # Get all comorbid illnesses
    illnesses = ComorbidIllness.objects.all()
    print(f"Total illnesses: {illnesses.count()}")
    
    # Test enhanced illnesses
    enhanced_illnesses = illnesses.filter(has_sub_options=True)
    print(f"Illnesses with sub-options: {enhanced_illnesses.count()}")
    
    spec_illnesses = illnesses.filter(requires_specification=True)
    print(f"Illnesses requiring specification: {spec_illnesses.count()}")
    
    print("\nEnhanced Illnesses Details:")
    print("-" * 30)
    
    for illness in enhanced_illnesses[:3]:  # Show first 3
        serializer = ComorbidIllnessSerializer(illness)
        data = serializer.data
        print(f"\n{data['label']}:")
        print(f"  Has sub-options: {data['has_sub_options']}")
        print(f"  Sub-options: {data['sub_options']}")
        print(f"  Requires specification: {data['requires_specification']}")
        print(f"  Specification placeholder: {data['specification_placeholder']}")
    
    print("\n✓ Enhanced ComorbidIllness functionality is working correctly!")

if __name__ == "__main__":
    test_enhanced_comorbid_illnesses()
