#!/usr/bin/env python3
import os
import sys
import django
from datetime import date, time, timedelta
from django.utils import timezone

# Add the project root to the Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.append(project_root)

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from api.models import CustomUser, Patient, Appointment, AcademicSchoolYear

def seed_pending_dental():
    print("Seeding sample dental pending appointment...")
    
    # 1. Ensure current school year
    try:
        school_year = AcademicSchoolYear.objects.get(is_current=True)
    except AcademicSchoolYear.DoesNotExist:
        school_year = AcademicSchoolYear.objects.create(
            academic_year="2024-2025",
            start_date=date(2024, 8, 1),
            end_date=date(2025, 7, 31),
            is_current=True,
            status="active"
        )
    
    # 2. Find the seed student user
    try:
        student_user = CustomUser.objects.get(email="student@wmsu.test")
    except CustomUser.DoesNotExist:
        print("Error: Seed student user not found. Please run seed_full_database first.")
        return

    # 3. Ensure patient profile
    semester = school_year.get_current_semester() or "1st_semester"
    patient, created = Patient.objects.get_or_create(
        user=student_user,
        school_year=school_year,
        semester=semester,
        defaults={
            "student_id": f"STU-{student_user.id:04d}",
            "name": f"{student_user.last_name}, {student_user.first_name}",
            "first_name": student_user.first_name,
            "surname": student_user.last_name,
            "email": student_user.email,
            "record_completion_status": "completed",
        }
    )
    
    if created:
        print(f"Created patient profile for {student_user.email}")
    else:
        print(f"Using existing patient profile for {student_user.email}")

    # 4. Create pending dental appointment
    # Set it for tomorrow
    appt_date = timezone.now().date() + timedelta(days=1)
    
    appointment, appt_created = Appointment.objects.get_or_create(
        patient=patient,
        appointment_date=appt_date,
        type="dental",
        status="pending",
        defaults={
            "appointment_time": time(10, 0),
            "purpose": "Dental Checkup (Sample)",
            "campus": "a",
            "school_year": school_year,
            "semester": semester,
            "concern": "Checking for cavities",
        }
    )
    
    if appt_created:
        print(f"Created pending DENTAL appointment for {appt_date} at 10:00 AM")
    else:
        print(f"A pending dental appointment already exists for this patient on {appointment.appointment_date}")

    print("\nSeeding completed successfully!")

if __name__ == "__main__":
    seed_pending_dental()
