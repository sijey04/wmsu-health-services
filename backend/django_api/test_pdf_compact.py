#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.pdf_utils import generate_medical_certificate_pdf
from api.models import MedicalDocument, Patient, User
from django.utils import timezone
from datetime import datetime

# Create a mock medical document for testing
try:
    # Try to get an existing user for testing
    user = User.objects.first()
    if not user:
        user = User.objects.create_user(username='testuser', email='test@example.com')
    
    # Try to get an existing patient or create one
    patient = Patient.objects.first()
    if not patient:
        patient = Patient.objects.create(
            user=user,
            name='John Doe',
            department='Computer Science',
            student_id='2023-001',
            email='john@example.com'
        )
    
    # Create a mock medical document
    class MockMedicalDocument:
        def __init__(self):
            self.patient = patient
            self.certificate_issued_at = timezone.now()
            self.reviewed_by = user
            self._issuing_user = user
    
    mock_doc = MockMedicalDocument()
    
    # Generate PDF
    print("Generating medical certificate PDF...")
    pdf_buffer = generate_medical_certificate_pdf(mock_doc)
    
    # Save to file for testing
    output_path = 'test_certificate_compact.pdf'
    with open(output_path, 'wb') as f:
        f.write(pdf_buffer.getvalue())
    
    print(f"PDF generated successfully: {output_path}")
    print(f"PDF size: {len(pdf_buffer.getvalue())} bytes")
    
except Exception as e:
    print(f"Error generating PDF: {e}")
    import traceback
    traceback.print_exc()
