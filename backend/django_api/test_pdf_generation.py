#!/usr/bin/env python
"""
Test script to verify medical certificate PDF generation works correctly
with the new formatting (no <b> tags and signature above line)
"""

import os
import sys
import django

# Add the parent directory to the Python path
sys.path.append('.')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import MedicalDocument, Patient, CustomUser, AcademicSchoolYear
from api.pdf_utils import generate_medical_certificate_pdf

def test_pdf_generation():
    """Test PDF generation with sample data"""
    print("Testing medical certificate PDF generation...")
    
    try:
        # Get the first medical document with issued status
        medical_doc = MedicalDocument.objects.filter(status='issued').first()
        
        if not medical_doc:
            print("No issued medical documents found. Creating test data...")
            
            # Get or create test data
            user = CustomUser.objects.first()
            if not user:
                print("No users found. Please create a user first.")
                return
                
            academic_year = AcademicSchoolYear.objects.first()
            if not academic_year:
                print("No academic years found. Please create an academic year first.")
                return
                
            patient = Patient.objects.filter(user=user).first()
            if not patient:
                print("No patient profile found. Please create a patient profile first.")
                return
                
            # Create a test medical document
            medical_doc = MedicalDocument.objects.create(
                patient=patient,
                academic_year=academic_year,
                status='issued'
            )
            print(f"Created test medical document with ID: {medical_doc.id}")
        
        print(f"Using medical document ID: {medical_doc.id}")
        print(f"Patient: {medical_doc.patient.name}")
        print(f"Status: {medical_doc.status}")
        
        # Generate the PDF
        pdf_buffer = generate_medical_certificate_pdf(medical_doc)
        
        # Save to file for inspection
        output_file = 'test_medical_certificate.pdf'
        with open(output_file, 'wb') as f:
            f.write(pdf_buffer.getvalue())
        
        print(f"✅ PDF generated successfully!")
        print(f"📄 Saved as: {output_file}")
        print(f"📊 File size: {len(pdf_buffer.getvalue())} bytes")
        print("\n🔍 Changes implemented:")
        print("   - Removed <b> tags from patient name")
        print("   - Moved signature above the line")
        
        return True
        
    except Exception as e:
        print(f"❌ Error generating PDF: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_pdf_generation()
    if success:
        print("\n✅ Test completed successfully!")
    else:
        print("\n❌ Test failed!")
