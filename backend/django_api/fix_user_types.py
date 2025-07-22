#!/usr/bin/env python
"""
Script to fix user_type field in Patient model
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import Patient
from django.db import transaction

def determine_user_type(patient):
    """Determine the proper standardized user type for a patient"""
    
    if not patient.user:
        return 'College'
    
    # Check grade_level for specific mapping
    if patient.user.grade_level:
        grade_level = patient.user.grade_level.lower().strip()
        
        # Kindergarten
        if 'kindergarten' in grade_level or 'kinder' in grade_level:
            return 'Kindergarten'
        
        # Elementary (Grades 1-6)
        elif any(grade in grade_level for grade in ['grade 1', 'grade 2', 'grade 3', 'grade 4', 'grade 5', 'grade 6']) or 'elementary' in grade_level:
            return 'Elementary'
        
        # High School (Grades 7-10)
        elif any(grade in grade_level for grade in ['grade 7', 'grade 8', 'grade 9', 'grade 10']) or 'high school' in grade_level:
            return 'High School'
        
        # Senior High School (Grades 11-12)
        elif any(grade in grade_level for grade in ['grade 11', 'grade 12']) or 'senior high' in grade_level:
            return 'Senior High School'
        
        # College level terms
        elif any(term in grade_level for term in ['undergraduate', 'bachelor', 'college', '1st year', '2nd year', '3rd year', '4th year']):
            return 'College'
        
        # Graduate level terms - map to College
        elif any(term in grade_level for term in ['postgraduate', 'graduate', 'masters', 'doctoral', 'phd']):
            return 'College'
        
        # Employee/Faculty terms
        elif any(term in grade_level for term in ['faculty', 'staff', 'employee', 'teacher', 'professor']):
            return 'Employee'
        
        # Incoming freshman
        elif any(term in grade_level for term in ['incoming', 'freshman']):
            return 'Incoming Freshman'
    
    # Check employee-related fields
    if (getattr(patient.user, 'employee_position', None) or 
        getattr(patient, 'employee_id', None) or
        getattr(patient, 'position_type', None)):
        return 'Employee'
    
    # Default fallback
    return 'College'

def main():
    print("Starting user type fix...")
    
    # Get all patients
    patients = Patient.objects.select_related('user').all()
    print(f"Found {patients.count()} patients")
    
    updated_count = 0
    
    with transaction.atomic():
        for patient in patients:
            old_user_type = patient.user_type
            new_user_type = determine_user_type(patient)
            
            if old_user_type != new_user_type:
                patient.user_type = new_user_type
                patient.save(update_fields=['user_type'])
                updated_count += 1
                
                if updated_count <= 10:  # Show first 10 updates
                    print(f"Updated: {patient.name} ({patient.user.grade_level if patient.user else 'No user'}) -> {new_user_type}")
    
    print(f"\nCompleted! Updated {updated_count} patient records.")
    
    # Show final distribution
    from django.db.models import Count
    user_type_counts = Patient.objects.values('user_type').annotate(count=Count('id')).order_by('-count')
    
    print("\nFinal User Type Distribution:")
    for item in user_type_counts:
        user_type = item['user_type'] or 'Not Set'
        count = item['count']
        print(f"  {user_type}: {count} patients")

if __name__ == '__main__':
    main()
