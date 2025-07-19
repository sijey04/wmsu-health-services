#!/usr/bin/env python
"""
Script to update academic school year data
"""
import os
import sys
import django
from datetime import date

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import AcademicSchoolYear

def update_academic_years():
    """Update academic school years for proper testing"""
    
    # First, unset all current years
    AcademicSchoolYear.objects.filter(is_current=True).update(is_current=False)
    
    # Get or update 2024-2025 to be the current year
    try:
        current_year = AcademicSchoolYear.objects.get(academic_year='2024-2025')
        current_year.is_current = True
        current_year.status = 'active'
        current_year.first_sem_start = date(2024, 8, 15)
        current_year.first_sem_end = date(2024, 12, 20)
        current_year.second_sem_start = date(2025, 1, 15)
        current_year.second_sem_end = date(2025, 5, 31)
        current_year.summer_start = date(2025, 6, 1)
        current_year.summer_end = date(2025, 7, 31)
        current_year.save()
        print(f"Updated {current_year.academic_year} to be the current year")
        print(f"Current semester: {current_year.get_current_semester()}")
    except AcademicSchoolYear.DoesNotExist:
        print("2024-2025 academic year not found")
    
    # Show all academic years
    print("\nAll academic years:")
    for year in AcademicSchoolYear.objects.all().order_by('-academic_year'):
        current_status = " (CURRENT)" if year.is_current else ""
        print(f"  - {year.academic_year} [{year.status}]{current_status}")

if __name__ == '__main__':
    update_academic_years()
