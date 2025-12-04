#!/usr/bin/env python
"""
Script to populate user_type field in Patient model based on CustomUser data
This ensures proper demographic tracking for the dashboard
"""

import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import Patient, CustomUser
from django.db import transaction

def populate_user_types():
    """Populate user_type field in Patient model"""
    
    # Mapping from CustomUser fields to standardized user types
    education_level_mapping = {
        'college': 'College',
        'high school': 'High School',
        'senior high school': 'Senior High School', 
        'elementary': 'Elementary',
        'employee': 'Employee',
        'staff': 'Employee',
        'admin': 'Employee'
    }
    
    user_type_mapping = {
        'student': 'College',  # Default student type
        'staff': 'Employee',
        'admin': 'Employee'
    }
    
    print("Starting user type population...")
    
    # Get all patients without user_type set
    patients_to_update = Patient.objects.filter(
        models.Q(user_type__isnull=True) | models.Q(user_type='')
    )
    
    updated_count = 0
    
    with transaction.atomic():
        for patient in patients_to_update:
            user_type = None
            
            if patient.user:
                # Try to get from user's education_level first
                if patient.user.education_level:
                    user_type = education_level_mapping.get(
                        patient.user.education_level.lower(), 
                        patient.user.education_level.title()
                    )
                
                # Fall back to user_type mapping
                if not user_type and patient.user.user_type:
                    user_type = user_type_mapping.get(
                        patient.user.user_type.lower(),
                        'College'  # Default fallback
                    )
                
                # Additional logic based on specific fields
                if not user_type:
                    # Check if it's an employee based on employee_id
                    if (patient.user.employee_position or 
                        getattr(patient, 'employee_id', None) or
                        getattr(patient, 'position_type', None)):
                        user_type = 'Employee'
                    
                    # Check if it's senior high based on strand
                    elif (patient.user.grade_level and 
                          any(keyword in patient.user.grade_level.lower() 
                              for keyword in ['senior', 'grade 11', 'grade 12', 'strand'])):
                        user_type = 'Senior High School'
                    
                    # Check if it's high school based on grade level
                    elif (patient.user.grade_level and 
                          any(keyword in patient.user.grade_level.lower() 
                              for keyword in ['grade 7', 'grade 8', 'grade 9', 'grade 10', 'high school'])):
                        user_type = 'High School'
                    
                    # Check if it's elementary
                    elif (patient.user.grade_level and 
                          any(keyword in patient.user.grade_level.lower() 
                              for keyword in ['grade 1', 'grade 2', 'grade 3', 'grade 4', 'grade 5', 'grade 6', 'elementary'])):
                        user_type = 'Elementary'
                    
                    # Default to College for students
                    else:
                        user_type = 'College'
            
            # Set default if still no user_type
            if not user_type:
                user_type = 'College'
            
            # Update the patient record
            patient.user_type = user_type
            patient.save(update_fields=['user_type'])
            updated_count += 1
            
            print(f"Updated patient {patient.name} ({patient.student_id}) -> {user_type}")
    
    print(f"\nCompleted! Updated {updated_count} patient records.")
    
    # Show summary of user types
    print("\nUser Type Distribution:")
    from django.db.models import Count
    user_type_counts = Patient.objects.values('user_type').annotate(count=Count('id')).order_by('-count')
    
    for item in user_type_counts:
        print(f"  {item['user_type']}: {item['count']} patients")

def populate_sample_user_types():
    """Create sample user type data for testing if no real data exists"""
    
    if Patient.objects.count() == 0:
        print("No patients found. Creating sample data...")
        
        # Create sample users and patients for testing
        from django.contrib.auth.hashers import make_password
        
        sample_data = [
            {'user_type': 'College', 'count': 15},
            {'user_type': 'High School', 'count': 10},
            {'user_type': 'Senior High School', 'count': 8},
            {'user_type': 'Elementary', 'count': 5},
            {'user_type': 'Employee', 'count': 3},
        ]
        
        with transaction.atomic():
            for data in sample_data:
                for i in range(data['count']):
                    # Create user
                    user = CustomUser.objects.create(
                        username=f"{data['user_type'].lower().replace(' ', '_')}_{i+1}",
                        email=f"{data['user_type'].lower().replace(' ', '_')}_{i+1}@wmsu.edu.ph",
                        first_name=f"Test{i+1}",
                        last_name=data['user_type'].replace(' ', ''),
                        password=make_password('password123'),
                        user_type='student' if data['user_type'] != 'Employee' else 'staff',
                        education_level=data['user_type'] if data['user_type'] != 'Employee' else None,
                        is_email_verified=True
                    )
                    
                    # Create patient
                    Patient.objects.create(
                        user=user,
                        student_id=f"{data['user_type'][:3].upper()}-{i+1:04d}",
                        name=f"{user.last_name}, {user.first_name}",
                        first_name=user.first_name,
                        user_type=data['user_type'],
                        email=user.email
                    )
        
        print("Sample data created successfully!")

if __name__ == '__main__':
    from django.db import models
    
    try:
        # First try to populate existing records
        populate_user_types()
        
        # If no patients exist, create sample data
        if Patient.objects.count() == 0:
            populate_sample_user_types()
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
