#!/usr/bin/env python
"""
Script to create sample academic school year data for testing semester functionality
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

def create_sample_academic_years():
    """Create sample academic school years for testing"""
    
    # Academic Year 2024-2025 (Current)
    academic_year_2024_2025, created = AcademicSchoolYear.objects.get_or_create(
        academic_year='2024-2025',
        defaults={
            'start_date': date(2024, 8, 1),
            'end_date': date(2025, 7, 31),
            'is_current': True,
            'status': 'active',
            'first_sem_start': date(2024, 8, 15),
            'first_sem_end': date(2024, 12, 20),
            'second_sem_start': date(2025, 1, 15),
            'second_sem_end': date(2025, 5, 31),
            'summer_start': date(2025, 6, 1),
            'summer_end': date(2025, 7, 31),
        }
    )
    
    if created:
        print(f"Created current academic year: {academic_year_2024_2025.academic_year}")
    else:
        print(f"Academic year already exists: {academic_year_2024_2025.academic_year}")
    
    # Academic Year 2025-2026 (Upcoming)
    academic_year_2025_2026, created = AcademicSchoolYear.objects.get_or_create(
        academic_year='2025-2026',
        defaults={
            'start_date': date(2025, 8, 1),
            'end_date': date(2026, 7, 31),
            'is_current': False,
            'status': 'upcoming',
            'first_sem_start': date(2025, 8, 15),
            'first_sem_end': date(2025, 12, 20),
            'second_sem_start': date(2026, 1, 15),
            'second_sem_end': date(2026, 5, 31),
            'summer_start': date(2026, 6, 1),
            'summer_end': date(2026, 7, 31),
        }
    )
    
    if created:
        print(f"Created upcoming academic year: {academic_year_2025_2026.academic_year}")
    else:
        print(f"Academic year already exists: {academic_year_2025_2026.academic_year}")
    
    # Academic Year 2023-2024 (Completed)
    academic_year_2023_2024, created = AcademicSchoolYear.objects.get_or_create(
        academic_year='2023-2024',
        defaults={
            'start_date': date(2023, 8, 1),
            'end_date': date(2024, 7, 31),
            'is_current': False,
            'status': 'completed',
            'first_sem_start': date(2023, 8, 15),
            'first_sem_end': date(2023, 12, 20),
            'second_sem_start': date(2024, 1, 15),
            'second_sem_end': date(2024, 5, 31),
            'summer_start': date(2024, 6, 1),
            'summer_end': date(2024, 7, 31),
        }
    )
    
    if created:
        print(f"Created completed academic year: {academic_year_2023_2024.academic_year}")
    else:
        print(f"Academic year already exists: {academic_year_2023_2024.academic_year}")
    
    print("\nSample academic years created successfully!")
    print("Available academic years:")
    for year in AcademicSchoolYear.objects.all().order_by('-academic_year'):
        current_status = " (CURRENT)" if year.is_current else ""
        current_semester = year.get_current_semester() or "No current semester"
        print(f"  - {year.academic_year} [{year.status}]{current_status} - Current semester: {current_semester}")

if __name__ == '__main__':
    create_sample_academic_years()
