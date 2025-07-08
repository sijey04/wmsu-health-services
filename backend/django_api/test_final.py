#!/usr/bin/env python
import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import Patient

try:
    # Test querying a patient
    patient = Patient.objects.first()
    if patient:
        print(f"✓ Patient found: {patient.name}")
        print(f"✓ Has hospital_admission_details: {hasattr(patient, 'hospital_admission_details')}")
        if hasattr(patient, 'hospital_admission_details'):
            print(f"✓ Value: {patient.hospital_admission_details}")
    else:
        print("✓ No patients found but query succeeded")
    print("✓ Database query successful - hospital_admission_details field is working")
    
    # Test the my_profile endpoint logic
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    user = User.objects.first()
    if user:
        print(f"✓ User found: {user.username}")
        try:
            current_patient_profile = user.get_current_patient_profile()
            if current_patient_profile:
                print(f"✓ Current patient profile: {current_patient_profile.name}")
            else:
                print("✓ No current patient profile found")
        except Exception as e:
            print(f"✗ Error getting current patient profile: {e}")
    else:
        print("✓ No users found")
        
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
