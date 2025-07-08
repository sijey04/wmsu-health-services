#!/usr/bin/env python
"""
Django migration script to handle the transition from Academic Semester to Academic School Year
and consolidate database to wmsu_health_db
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

def setup_django():
    """Setup Django environment"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
    django.setup()

def create_migrations():
    """Create Django migrations for the model changes"""
    print("Creating Django migrations...")
    
    # Create migrations for the new AcademicSchoolYear model
    execute_from_command_line(['manage.py', 'makemigrations', 'api', '--name', 'create_academic_school_year'])
    
    print("Migrations created successfully!")

def apply_migrations():
    """Apply the migrations to the database"""
    print("Applying migrations to database...")
    
    # Apply migrations
    execute_from_command_line(['manage.py', 'migrate'])
    
    print("Migrations applied successfully!")

def populate_initial_data():
    """Populate initial academic school year data"""
    print("Populating initial academic school year data...")
    
    from api.models import AcademicSchoolYear
    
    # Create initial school years if they don't exist
    school_years = [
        {
            'academic_year': '2025-2026',
            'start_date': '2025-06-15',
            'end_date': '2026-03-15',
            'is_current': True,
            'status': 'active'
        },
        {
            'academic_year': '2026-2027',
            'start_date': '2026-06-15',
            'end_date': '2027-03-15',
            'is_current': False,
            'status': 'upcoming'
        }
    ]
    
    for year_data in school_years:
        year, created = AcademicSchoolYear.objects.get_or_create(
            academic_year=year_data['academic_year'],
            defaults=year_data
        )
        if created:
            print(f"Created school year: {year.academic_year}")
        else:
            print(f"School year already exists: {year.academic_year}")
    
    print("Initial data populated successfully!")

def main():
    """Main function to run the migration process"""
    print("=== Django Model Migration Script ===")
    print("Transitioning from Academic Semester to Academic School Year")
    print("=" * 50)
    
    try:
        # Setup Django
        setup_django()
        
        # Create migrations
        create_migrations()
        
        # Apply migrations
        apply_migrations()
        
        # Populate initial data
        populate_initial_data()
        
        print("\n" + "=" * 50)
        print("Django migration completed successfully!")
        print("=" * 50)
        
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main()
