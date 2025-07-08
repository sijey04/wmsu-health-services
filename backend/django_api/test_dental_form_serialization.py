#!/usr/bin/env python
import os
import sys
import django
from datetime import date

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import DentalFormData, Patient, CustomUser, AcademicSchoolYear
from api.serializers import DentalFormDataSerializer

def test_dental_form_serialization():
    """Test the DentalFormData serialization to ensure no datetime issues"""
    print("Testing DentalFormData serialization...")
    
    try:
        # Create a minimal test data structure
        test_data = {
            'file_no': 'TEST-001',
            'surname': 'Test',
            'first_name': 'User',
            'age': 25,
            'sex': 'Male',
            'date': date.today(),  # This is a date object, not datetime
            'dentition': 'Fair',
            'periodontal': 'Good',
            'occlusion': 'Normal',
        }
        
        # Create serializer without a model instance
        serializer = DentalFormDataSerializer(data=test_data)
        
        # Test validation
        if serializer.is_valid():
            print("✓ Serializer validation passed")
            print(f"✓ Validated data: {serializer.validated_data}")
        else:
            print(f"✗ Serializer validation failed: {serializer.errors}")
            return False
        
        # Test date field specifically
        date_field = serializer.fields['date']
        test_date = date.today()
        
        print(f"✓ Date field type: {type(date_field)}")
        print(f"✓ Test date: {test_date} (type: {type(test_date)})")
        
        # Test to_representation method
        class MockInstance:
            def __init__(self):
                self.date = date.today()
                self.file_no = 'TEST-001'
                self.surname = 'Test'
                self.first_name = 'User'
                self.age = 25
                self.sex = 'Male'
                self.dentition = 'Fair'
                self.periodontal = 'Good'
                self.occlusion = 'Normal'
        
        mock_instance = MockInstance()
        serializer_with_instance = DentalFormDataSerializer(instance=mock_instance)
        
        # Test serialization
        serialized_data = serializer_with_instance.to_representation(mock_instance)
        print(f"✓ Serialized data: {serialized_data}")
        print(f"✓ Serialized date: {serialized_data.get('date')} (type: {type(serialized_data.get('date'))})")
        
        print("\n✓ All tests passed! DentalFormData serialization should work correctly.")
        return True
        
    except Exception as e:
        print(f"✗ Error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_dental_form_serialization()
    sys.exit(0 if success else 1)
