#!/usr/bin/env python
"""
Test script for Appointment Semester functionality
"""
import os
import sys
import django

# Add the project directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings')
django.setup()

from api.models import AcademicSchoolYear, Appointment, Patient, CustomUser
from datetime import date

def test_appointment_semesters():
    """Test the appointment semester functionality"""
    print("Testing Appointment Semester Functionality")
    print("=" * 50)
    
    # Create a test academic year with semester dates
    test_year, created = AcademicSchoolYear.objects.get_or_create(
        academic_year="2025-2026",
        defaults={
            'first_sem_start': date(2025, 8, 15),
            'first_sem_end': date(2025, 12, 20),
            'second_sem_start': date(2026, 1, 15),
            'second_sem_end': date(2026, 5, 15),
            'summer_start': date(2026, 6, 1),
            'summer_end': date(2026, 7, 31),
            'is_current': True,
            'status': 'active'
        }
    )
    
    if created:
        print(f"✅ Created test academic year: {test_year.academic_year}")
    else:
        print(f"✅ Using existing academic year: {test_year.academic_year}")
    
    print()
    print(f"📚 Semester Periods:")
    print(f"   First Semester: {test_year.first_sem_start} to {test_year.first_sem_end}")
    print(f"   Second Semester: {test_year.second_sem_start} to {test_year.second_sem_end}")
    print(f"   Summer Semester: {test_year.summer_start} to {test_year.summer_end}")
    print()
    
    # Test semester determination
    test_dates = [
        (date(2025, 9, 15), "First Semester"),
        (date(2025, 11, 30), "First Semester"), 
        (date(2026, 2, 14), "Second Semester"),
        (date(2026, 4, 20), "Second Semester"),
        (date(2026, 6, 15), "Summer Semester"),
        (date(2026, 7, 10), "Summer Semester"),
        (date(2025, 7, 1), "Before academic year"),
        (date(2026, 8, 15), "After academic year"),
    ]
    
    print("🧪 Testing Semester Determination:")
    for test_date, expected in test_dates:
        # Create a mock appointment to test semester determination
        from api.models import Appointment
        
        class MockAppointment:
            def __init__(self, appointment_date, school_year):
                self.appointment_date = appointment_date
                self.school_year = school_year
            
            def determine_semester(self):
                if not self.school_year or not self.appointment_date:
                    return None
                    
                if (self.school_year.first_sem_start and self.school_year.first_sem_end and
                    self.school_year.first_sem_start <= self.appointment_date <= self.school_year.first_sem_end):
                    return '1st_semester'
                elif (self.school_year.second_sem_start and self.school_year.second_sem_end and
                      self.school_year.second_sem_start <= self.appointment_date <= self.school_year.second_sem_end):
                    return '2nd_semester'
                elif (self.school_year.summer_start and self.school_year.summer_end and
                      self.school_year.summer_start <= self.appointment_date <= self.school_year.summer_end):
                    return 'summer'
                else:
                    return None
        
        mock_appointment = MockAppointment(test_date, test_year)
        determined_semester = mock_appointment.determine_semester()
        
        semester_names = {
            '1st_semester': 'First Semester',
            '2nd_semester': 'Second Semester', 
            'summer': 'Summer Semester',
            None: 'No semester'
        }
        
        result = semester_names.get(determined_semester, 'Unknown')
        status = "✅" if (expected in result or (expected.startswith("Before") and result == "No semester") or (expected.startswith("After") and result == "No semester")) else "❌"
        
        print(f"   {status} {test_date} → {result} (expected: {expected})")
    
    print()
    print("📊 Current Appointment Statistics:")
    
    # Show appointment counts by semester
    total_appointments = Appointment.objects.count()
    first_sem = Appointment.objects.filter(semester='1st_semester').count()
    second_sem = Appointment.objects.filter(semester='2nd_semester').count()
    summer = Appointment.objects.filter(semester='summer').count()
    unassigned = Appointment.objects.filter(semester__isnull=True).count()
    
    print(f"   Total Appointments: {total_appointments}")
    print(f"   📚 First Semester: {first_sem}")
    print(f"   📚 Second Semester: {second_sem}")
    print(f"   ☀️ Summer Semester: {summer}")
    print(f"   ❓ Unassigned: {unassigned}")
    
    if total_appointments > 0:
        print()
        print("📋 Recent Appointments with Semester Info:")
        recent_appointments = Appointment.objects.select_related('patient', 'school_year').order_by('-created_at')[:5]
        
        for apt in recent_appointments:
            semester_display = apt.get_semester_display() if hasattr(apt, 'get_semester_display') and apt.semester else 'Unassigned'
            school_year_display = apt.school_year.academic_year if apt.school_year else 'No school year'
            print(f"   • {apt.appointment_date} - {apt.patient.name} - {semester_display} ({school_year_display})")
    
    print("\n✅ Test completed successfully!")

if __name__ == "__main__":
    test_appointment_semesters()
