#!/usr/bin/env python
"""
Simple test to check database status
"""
import os
import sys
import django

# Add the Django project directory to the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import MedicalDocument, AcademicSchoolYear

print("Database Status:")
print("================")

try:
    md_count = MedicalDocument.objects.count()
    print(f"MedicalDocument count: {md_count}")
    
    academic_year_count = AcademicSchoolYear.objects.count()
    print(f"AcademicSchoolYear count: {academic_year_count}")
    
    # Check if we have a sample medical document
    if md_count > 0:
        sample_md = MedicalDocument.objects.first()
        print(f"Sample MedicalDocument: {sample_md}")
        print(f"  - Patient: {sample_md.patient}")
        print(f"  - Academic Year: {sample_md.academic_year}")
        print(f"  - Status: {sample_md.status}")
    
    # Check if we have academic years
    if academic_year_count > 0:
        for ay in AcademicSchoolYear.objects.all():
            print(f"Academic Year: {ay.year} (Active: {ay.is_active}, Current: {ay.is_current})")
    
    print("\nDatabase test completed successfully!")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
