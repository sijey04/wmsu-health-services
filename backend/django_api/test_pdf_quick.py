#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import Patient, MedicalDocument, User
from api.pdf_utils import generate_medical_certificate_pdf, save_medical_certificate_pdf
from django.utils import timezone
import tempfile

def test_pdf_generation():
    try:
        # Create or get a test patient
        user = User.objects.first()
        if not user:
            print("No users found in database")
            return
        
        patient, created = Patient.objects.get_or_create(
            user=user,
            defaults={
                'name': 'Magno, Rezier, Rezier',
                'department': 'Incoming Freshman',
                'contact_number': '09123456789',
                'address': 'Test Address',
                'emergency_contact_name': 'Emergency Contact',
                'emergency_contact_number': '09123456789',
                'emergency_contact_relationship': 'Parent'
            }
        )
        
        # Create or get a test medical document
        medical_doc, created = MedicalDocument.objects.get_or_create(
            patient=patient,
            defaults={
                'status': 'issued',
                'certificate_issued_at': timezone.now(),
                'reviewed_by': user
            }
        )
        
        print(f"Testing PDF generation for patient: {patient.name}")
        
        # Generate PDF
        pdf_buffer = generate_medical_certificate_pdf(medical_doc)
        print(f"PDF generated successfully. Size: {len(pdf_buffer.getvalue())} bytes")
        
        # Save to temp file for testing
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            temp_file.write(pdf_buffer.getvalue())
            print(f"PDF saved to: {temp_file.name}")
        
        return True
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    test_pdf_generation()
