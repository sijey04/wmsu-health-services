#!/usr/bin/env python
"""
Script to fix duplicate MedicalDocument records that violate the OneToOneField constraint.
This script will identify and remove duplicate MedicalDocument records, keeping only the most recent one.
"""

import os
import django
import sys
from django.db import transaction

# Add the Django project to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import Patient, MedicalDocument
from django.db.models import Count


def fix_duplicate_medical_documents():
    """Find and fix duplicate MedicalDocument records."""
    print("Checking for duplicate MedicalDocument records...")
    
    # Find patients with multiple MedicalDocument records
    patients_with_duplicates = Patient.objects.annotate(
        doc_count=Count('medical_document')
    ).filter(doc_count__gt=1)
    
    if not patients_with_duplicates.exists():
        print("No duplicate MedicalDocument records found.")
        return
    
    print(f"Found {patients_with_duplicates.count()} patients with duplicate MedicalDocument records.")
    
    with transaction.atomic():
        for patient in patients_with_duplicates:
            # Get all MedicalDocument records for this patient
            medical_docs = MedicalDocument.objects.filter(patient=patient).order_by('-updated_at')
            
            if medical_docs.count() > 1:
                # Keep the most recent one (first in the ordered queryset)
                docs_to_keep = medical_docs.first()
                docs_to_delete = medical_docs.exclude(id=docs_to_keep.id)
                
                print(f"Patient {patient.name} ({patient.student_id}) has {medical_docs.count()} MedicalDocument records.")
                print(f"  Keeping: ID {docs_to_keep.id} (updated: {docs_to_keep.updated_at})")
                
                for doc in docs_to_delete:
                    print(f"  Deleting: ID {doc.id} (updated: {doc.updated_at})")
                    doc.delete()
    
    print("Duplicate MedicalDocument records have been cleaned up.")


def check_medical_document_integrity():
    """Check the integrity of MedicalDocument relationships."""
    print("\nChecking MedicalDocument relationship integrity...")
    
    # Check for patients without MedicalDocument records
    patients_without_docs = Patient.objects.filter(medical_document__isnull=True)
    print(f"Patients without MedicalDocument records: {patients_without_docs.count()}")
    
    # Check for orphaned MedicalDocument records
    try:
        orphaned_docs = MedicalDocument.objects.filter(patient__isnull=True)
        print(f"Orphaned MedicalDocument records: {orphaned_docs.count()}")
    except Exception as e:
        print(f"Error checking for orphaned documents: {e}")
    
    # Check for duplicate relationships
    duplicate_check = MedicalDocument.objects.values('patient').annotate(
        count=Count('patient')
    ).filter(count__gt=1)
    
    if duplicate_check.exists():
        print(f"Patients with multiple MedicalDocument records: {duplicate_check.count()}")
        for item in duplicate_check:
            patient = Patient.objects.get(id=item['patient'])
            print(f"  - {patient.name} ({patient.student_id}): {item['count']} records")
    else:
        print("No duplicate MedicalDocument relationships found.")


if __name__ == '__main__':
    print("Medical Document Relationship Fixer")
    print("=" * 40)
    
    # First, check the current state
    check_medical_document_integrity()
    
    # Fix duplicate records
    fix_duplicate_medical_documents()
    
    # Check again after fixing
    print("\nAfter cleanup:")
    check_medical_document_integrity()
    
    print("\nDone!")
