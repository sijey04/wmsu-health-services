#!/usr/bin/env python
import os
import django
import sys

# Add the project root to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import MedicalDocument, Patient
from api.serializers import MedicalDocumentSerializer
import json

def test_medical_document_serializer():
    print("Testing MedicalDocument API serialization...")
    
    # Get a sample medical document
    try:
        medical_doc = MedicalDocument.objects.select_related('patient').first()
        if not medical_doc:
            print("No medical documents found in database")
            return
        
        print(f"Found medical document ID: {medical_doc.id}")
        print(f"Patient ID: {medical_doc.patient.id if medical_doc.patient else 'None'}")
        
        # Serialize the document
        serializer = MedicalDocumentSerializer(medical_doc)
        data = serializer.data
        
        print("\nSerialized data:")
        print(json.dumps(data, indent=2, default=str))
        
        # Check specifically for patient fields
        print("\nPatient-related fields in response:")
        patient_fields = [key for key in data.keys() if 'patient' in key.lower() or key in [
            'first_name', 'last_name', 'email', 'phone_number', 'date_of_birth',
            'gender', 'address', 'emergency_contact_name', 'emergency_contact_phone',
            'emergency_contact_relationship', 'medical_history', 'allergies', 'medications'
        ]]
        
        for field in patient_fields:
            print(f"  {field}: {data.get(field, 'NOT FOUND')}")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_medical_document_serializer()
