#!/usr/bin/env python
"""
Test script for Academic School Year semester functionality
"""
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import AcademicSchoolYear
from api.serializers import AcademicSchoolYearSerializer
from datetime import date

def test_academic_year_semesters():
    """Test the academic year semester functionality"""
    print("Testing Academic School Year with Semester Support")
    print("=" * 50)
    
    # Create a test academic year with semester dates
    test_year = AcademicSchoolYear(
        academic_year="2025-2026",
        first_sem_start=date(2025, 8, 15),
        first_sem_end=date(2025, 12, 20),
        second_sem_start=date(2026, 1, 15),
        second_sem_end=date(2026, 5, 15),
        summer_start=date(2026, 6, 1),
        summer_end=date(2026, 7, 31),
        is_current=True,
        status='active'
    )
    
    # Test semester methods
    print(f"Academic Year: {test_year.academic_year}")
    print(f"Current Semester: {test_year.get_current_semester()}")
    print(f"Current Semester Display: {test_year.get_semester_display()}")
    print()
    
    # Test semester date retrieval
    for semester in ['1st_semester', '2nd_semester', 'summer']:
        start, end = test_year.get_semester_dates(semester)
        print(f"{semester}: {start} to {end}")
    
    print()
    
    # Test serializer
    serializer = AcademicSchoolYearSerializer(test_year)
    print("Serializer fields:")
    for field, value in serializer.data.items():
        print(f"  {field}: {value}")
    
    print("\nTest completed successfully!")

if __name__ == "__main__":
    test_academic_year_semesters()
