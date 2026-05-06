#!/usr/bin/env python
import os
import sys
import uuid
import django

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from django.utils import timezone
from api.models import Appointment, DentalFormData, Patient, CustomUser, AcademicSchoolYear


def ensure_patient():
    patient = Patient.objects.order_by('id').first()
    if patient:
        return patient, False

    suffix = uuid.uuid4().hex[:8]
    email = f"seed.patient.{suffix}@example.com"
    username = f"seed.patient.{suffix}"

    user = CustomUser(
        username=username,
        email=email,
        user_type='student',
        is_email_verified=True,
        is_active=True,
        first_name='Seed',
        last_name='Patient'
    )
    user.set_password('password123')
    user.save()

    student_id = f"SEED-{suffix.upper()}"
    patient = Patient.objects.create(
        user=user,
        student_id=student_id,
        name=f"{user.last_name}, {user.first_name}",
        first_name=user.first_name,
        middle_name=user.middle_name,
        gender='Male',
        age=20
    )

    return patient, True


def ensure_doctor():
    doctor = CustomUser.objects.filter(user_type='doctor').first()
    if doctor:
        return doctor
    return CustomUser.objects.filter(is_staff=True).first()


def main():
    patient, created_patient = ensure_patient()
    doctor = ensure_doctor()
    now = timezone.now()
    school_year = AcademicSchoolYear.get_current_school_year()

    appointment = Appointment.objects.create(
        patient=patient,
        doctor=doctor,
        appointment_date=now.date(),
        appointment_time=now.time().replace(second=0, microsecond=0),
        purpose='Dental consultation (seeded)',
        status='completed',
        type='dental',
        concern='Seeded dental appointment with supply usage',
        campus='a',
        school_year=school_year,
        semester=school_year.get_current_semester() if school_year else None,
        notes='Seeded for inventory usage report'
    )

    used_medicines = [
        {'name': 'Cotton rolls', 'quantity': 4, 'unit': 'pcs', 'cost': 0},
        {'name': 'Local anesthetic', 'quantity': 1, 'unit': 'vial', 'cost': 0},
        {'name': 'Gloves', 'quantity': 2, 'unit': 'pair', 'cost': 0}
    ]

    dental_form = DentalFormData.objects.create(
        patient=patient,
        appointment=appointment,
        date=now.date(),
        used_medicines=used_medicines,
        oral_hygiene='Fair',
        recommended_treatments='Seeded entry for supply usage report',
        consultation_template_compliant=True,
        total_consultations=1
    )

    print(f"Created appointment ID: {appointment.id}")
    print(f"Created dental form ID: {dental_form.id}")
    print(f"Patient: {patient.id} - {patient.name}")
    if created_patient:
        print("Created a new patient for this seed record.")


if __name__ == '__main__':
    main()
