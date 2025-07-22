#!/usr/bin/env python3
"""
Populate UserTypeInformation database with configurations for all user types
used in the profile setup form.

This script creates comprehensive UserTypeInformation configurations for:
- Employee
- College
- Incoming Freshman
- High School
- Senior High School
- Elementary
- Kindergarten

Each configuration includes:
- Available options for courses, departments, year levels, strands, position types
- Required fields for each user type
- Allowed services (medical, dental, certificate)
- Custom field configurations
"""

import os
import sys
import django
import json
from django.core.management.base import BaseCommand

# Add the django_api directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import UserTypeInformation


def populate_user_type_information():
    """Populate the UserTypeInformation table with configurations for all user types."""
    
    print("🔄 Starting UserTypeInformation population...")
    
    # Define all available options
    all_departments = [
        "Academic Affairs", "Administration", "Admissions", "Business Administration",
        "Computer Science", "Education", "Engineering", "Finance", "Health Sciences",
        "Human Resources", "Information Technology", "Liberal Arts", "Library Services",
        "Maintenance", "Medical Services", "Nursing", "Physical Education", "Psychology",
        "Registrar", "Research", "Science", "Security", "Social Sciences", "Student Affairs", "Other"
    ]
    
    all_courses = [
        "BS Business Administration", "BS Computer Science", "BS Education", "BS Engineering",
        "BS Information Technology", "BS Nursing", "BS Psychology", "BA Communication",
        "BA Political Science", "BA Sociology"
    ]
    
    college_year_levels = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]
    high_school_year_levels = ["Grade 7", "Grade 8", "Grade 9", "Grade 10"]
    senior_high_year_levels = ["Grade 11", "Grade 12"]
    elementary_year_levels = ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"]
    kindergarten_year_levels = ["Kindergarten"]
    
    all_strands = [
        "ABM", "HUMSS", "STEM", "GAS", "TVL", "Arts and Design", "Sports"
    ]
    
    position_types = ["Teaching", "Non-Teaching"]
    
    # Common required fields for all user types
    base_required_fields = [
        "name", "first_name", "date_of_birth", "age", "gender", "blood_type", 
        "religion", "nationality", "civil_status", "email", "contact_number",
        "city_municipality", "barangay", "street", "emergency_contact_surname",
        "emergency_contact_first_name", "emergency_contact_number", 
        "emergency_contact_relationship", "emergency_contact_barangay", 
        "emergency_contact_street"
    ]
    
    # All services available by default
    all_services = ["medical", "dental", "certificate"]
    
    # User type configurations
    user_type_configs = [
        {
            "user_type": "Employee",
            "display_name": "Employee",
            "description": "University employees including teaching and non-teaching staff",
            "is_active": True,
            "required_fields": base_required_fields + ["employee_id", "department", "position_type"],
            "allowed_services": all_services,
            "available_departments": all_departments,
            "available_position_types": position_types,
            "available_courses": [],
            "available_year_levels": [],
            "available_strands": [],
            "custom_fields": {
                "employee_id": {
                    "type": "text",
                    "description": "Employee identification number",
                    "required": True,
                    "validation": "alphanumeric"
                },
                "department": {
                    "type": "select",
                    "description": "Department where the employee works",
                    "required": True,
                    "options": all_departments
                },
                "position_type": {
                    "type": "select",
                    "description": "Type of position (Teaching or Non-Teaching)",
                    "required": True,
                    "options": position_types
                }
            }
        },
        {
            "user_type": "College",
            "display_name": "College Student",
            "description": "Undergraduate college students",
            "is_active": True,
            "required_fields": base_required_fields + ["course", "year_level"],
            "allowed_services": all_services,
            "available_departments": [],
            "available_position_types": [],
            "available_courses": all_courses,
            "available_year_levels": college_year_levels,
            "available_strands": [],
            "custom_fields": {
                "course": {
                    "type": "select",
                    "description": "Academic course/program",
                    "required": True,
                    "options": all_courses
                },
                "year_level": {
                    "type": "select",
                    "description": "Current year level in college",
                    "required": True,
                    "options": college_year_levels
                }
            }
        },
        {
            "user_type": "Incoming Freshman",
            "display_name": "Incoming Freshman",
            "description": "New college students entering their first year",
            "is_active": True,
            "required_fields": base_required_fields + ["course", "year_level"],
            "allowed_services": all_services,
            "available_departments": [],
            "available_position_types": [],
            "available_courses": all_courses,
            "available_year_levels": ["1st Year"],  # Only 1st year for incoming freshmen
            "available_strands": [],
            "custom_fields": {
                "course": {
                    "type": "select",
                    "description": "Chosen academic course/program",
                    "required": True,
                    "options": all_courses
                },
                "year_level": {
                    "type": "select",
                    "description": "Year level (1st Year for incoming freshmen)",
                    "required": True,
                    "options": ["1st Year"]
                }
            }
        },
        {
            "user_type": "High School",
            "display_name": "High School Student",
            "description": "Junior high school students (Grades 7-10)",
            "is_active": True,
            "required_fields": base_required_fields + ["year_level"],
            "allowed_services": all_services,
            "available_departments": [],
            "available_position_types": [],
            "available_courses": [],
            "available_year_levels": high_school_year_levels,
            "available_strands": [],
            "custom_fields": {
                "year_level": {
                    "type": "select",
                    "description": "Current grade level",
                    "required": True,
                    "options": high_school_year_levels
                }
            }
        },
        {
            "user_type": "Senior High School",
            "display_name": "Senior High School Student",
            "description": "Senior high school students (Grades 11-12)",
            "is_active": True,
            "required_fields": base_required_fields + ["year_level", "strand"],
            "allowed_services": all_services,
            "available_departments": [],
            "available_position_types": [],
            "available_courses": [],
            "available_year_levels": senior_high_year_levels,
            "available_strands": all_strands,
            "custom_fields": {
                "year_level": {
                    "type": "select",
                    "description": "Current grade level",
                    "required": True,
                    "options": senior_high_year_levels
                },
                "strand": {
                    "type": "select",
                    "description": "Academic strand",
                    "required": True,
                    "options": all_strands
                }
            }
        },
        {
            "user_type": "Elementary",
            "display_name": "Elementary Student",
            "description": "Elementary school students (Grades 1-6)",
            "is_active": True,
            "required_fields": base_required_fields + ["year_level"],
            "allowed_services": all_services,
            "available_departments": [],
            "available_position_types": [],
            "available_courses": [],
            "available_year_levels": elementary_year_levels,
            "available_strands": [],
            "custom_fields": {
                "year_level": {
                    "type": "select",
                    "description": "Current grade level",
                    "required": True,
                    "options": elementary_year_levels
                }
            }
        },
        {
            "user_type": "Kindergarten",
            "display_name": "Kindergarten Student",
            "description": "Kindergarten students",
            "is_active": True,
            "required_fields": base_required_fields + ["year_level"],
            "allowed_services": all_services,
            "available_departments": [],
            "available_position_types": [],
            "available_courses": [],
            "available_year_levels": kindergarten_year_levels,
            "available_strands": [],
            "custom_fields": {
                "year_level": {
                    "type": "select",
                    "description": "Kindergarten level",
                    "required": True,
                    "options": kindergarten_year_levels
                }
            }
        }
    ]
    
    # Clear existing UserTypeInformation entries
    print("🗑️  Clearing existing UserTypeInformation entries...")
    UserTypeInformation.objects.all().delete()
    
    # Create new entries
    created_count = 0
    for config in user_type_configs:
        try:
            # Convert lists to JSON strings for database storage
            user_type_info = UserTypeInformation(
                user_type=config["user_type"],
                display_name=config["display_name"],
                description=config["description"],
                is_active=config["is_active"],
                required_fields=config["required_fields"],
                allowed_services=config["allowed_services"],
                available_courses=config["available_courses"],
                available_departments=config["available_departments"],
                available_year_levels=config["available_year_levels"],
                available_strands=config["available_strands"],
                available_position_types=config["available_position_types"],
                custom_fields=config["custom_fields"]
            )
            user_type_info.save()
            created_count += 1
            
            print(f"✅ Created UserTypeInformation for: {config['user_type']}")
            print(f"   - Display Name: {config['display_name']}")
            print(f"   - Required Fields: {len(config['required_fields'])} fields")
            print(f"   - Available Services: {', '.join(config['allowed_services'])}")
            
            if config['available_courses']:
                print(f"   - Available Courses: {len(config['available_courses'])} courses")
            if config['available_departments']:
                print(f"   - Available Departments: {len(config['available_departments'])} departments")
            if config['available_year_levels']:
                print(f"   - Available Year Levels: {', '.join(config['available_year_levels'])}")
            if config['available_strands']:
                print(f"   - Available Strands: {', '.join(config['available_strands'])}")
            if config['available_position_types']:
                print(f"   - Available Position Types: {', '.join(config['available_position_types'])}")
            
            print()
            
        except Exception as e:
            print(f"❌ Error creating UserTypeInformation for {config['user_type']}: {str(e)}")
    
    print(f"🎉 Successfully created {created_count} UserTypeInformation configurations!")
    print(f"📊 Total configurations in database: {UserTypeInformation.objects.count()}")
    
    # Verify the created entries
    print("\n📋 Verification - UserTypeInformation entries:")
    for uti in UserTypeInformation.objects.all().order_by('user_type'):
        print(f"   - {uti.user_type} ({uti.display_name}) - Active: {uti.is_active}")
    
    print("\n✨ UserTypeInformation population completed successfully!")


if __name__ == "__main__":
    populate_user_type_information()
