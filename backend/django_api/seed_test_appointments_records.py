#!/usr/bin/env python
import os
import sys
import uuid
from datetime import timedelta, time
import django

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'django_api.settings.settings')
django.setup()

from django.utils import timezone
from api.models import (
    AcademicSchoolYear,
    Appointment,
    CustomUser,
    DentalFormData,
    MedicalFormData,
    MedicalRecord,
    Notification,
    Patient
)


def get_or_create_current_school_year():
    school_year = AcademicSchoolYear.get_current_school_year()
    if school_year:
        return school_year, False

    today = timezone.now().date()
    start_year = today.year if today.month >= 8 else today.year - 1
    academic_year = f"{start_year}-{start_year + 1}"

    first_sem_start = timezone.datetime(start_year, 8, 15).date()
    first_sem_end = timezone.datetime(start_year, 12, 20).date()
    second_sem_start = timezone.datetime(start_year + 1, 1, 15).date()
    second_sem_end = timezone.datetime(start_year + 1, 5, 31).date()
    summer_start = timezone.datetime(start_year + 1, 6, 1).date()
    summer_end = timezone.datetime(start_year + 1, 7, 31).date()

    school_year = AcademicSchoolYear.objects.create(
        academic_year=academic_year,
        semester_type='1st',
        start_date=first_sem_start,
        end_date=first_sem_end,
        is_current=True,
        status='active',
        first_sem_start=first_sem_start,
        first_sem_end=first_sem_end,
        second_sem_start=second_sem_start,
        second_sem_end=second_sem_end,
        summer_start=summer_start,
        summer_end=summer_end
    )
    return school_year, True


def get_or_create_staff_user():
    staff = CustomUser.objects.filter(is_staff=True).first()
    if staff:
        return staff, False

    suffix = uuid.uuid4().hex[:8]
    email = f"seed.staff.{suffix}@example.com"

    staff = CustomUser(
        username=email,
        email=email,
        user_type='staff',
        is_staff=True,
        is_active=True,
        is_email_verified=True,
        first_name='Seed',
        last_name='Staff'
    )
    staff.set_password('password123')
    staff.save()
    return staff, True


def get_or_create_patient(school_year):
    patient = Patient.objects.order_by('id').first()
    if patient:
        return patient, False

    suffix = uuid.uuid4().hex[:8]
    email = f"seed.patient.{suffix}@example.com"

    user = CustomUser(
        username=email,
        email=email,
        user_type='student',
        is_email_verified=True,
        is_active=True,
        first_name='Seed',
        last_name='Patient'
    )
    user.set_password('password123')
    user.save()

    patient = Patient.objects.create(
        user=user,
        student_id=f"SEED-{suffix.upper()}",
        name=f"{user.last_name}, {user.first_name}",
        first_name=user.first_name,
        surname=user.last_name,
        gender='Male',
        age=20,
        school_year=school_year,
        semester=school_year.get_current_semester() if school_year else None,
        user_type='College'
    )
    return patient, True


def create_appointment(patient, doctor, school_year, appt_type, status, days_offset, slot_time):
    appointment_date = timezone.now().date() + timedelta(days=days_offset)
    appointment = Appointment.objects.create(
        patient=patient,
        doctor=doctor,
        appointment_date=appointment_date,
        appointment_time=slot_time,
        purpose=f"{appt_type.title()} consultation (seeded)",
        status=status,
        type=appt_type,
        concern='Seeded dental appointment' if appt_type == 'dental' else None,
        campus='a',
        school_year=school_year,
        semester=school_year.get_current_semester() if school_year else None,
        notes='Seeded for testing'
    )
    return appointment


def create_medical_form(patient, appointment, school_year):
    return MedicalFormData.objects.create(
        patient=patient,
        appointment=appointment,
        academic_year=school_year,
        date=appointment.appointment_date,
        chief_complaint='Headache',
        diagnosis='Tension headache',
        treatment_plan='Rest and hydration',
        examined_by='Seeded Clinician'
    )


def create_dental_form(patient, appointment, school_year):
    used_medicines = [
        {'name': 'Cotton rolls', 'quantity': 2, 'unit': 'pcs', 'cost': 0},
        {'name': 'Gloves', 'quantity': 1, 'unit': 'pair', 'cost': 0}
    ]
    return DentalFormData.objects.create(
        patient=patient,
        appointment=appointment,
        academic_year=school_year,
        date=appointment.appointment_date,
        oral_hygiene='Fair',
        decayed_teeth='1',
        missing_teeth='0',
        filled_teeth='0',
        recommended_treatments='Cleaning',
        used_medicines=used_medicines,
        consultation_template_compliant=True,
        total_consultations=1
    )


def create_medical_record(patient, doctor, school_year):
    return MedicalRecord.objects.create(
        patient=patient,
        doctor=doctor,
        diagnosis='Common cold',
        treatment='Rest and fluids',
        prescription='Paracetamol 500mg',
        notes='Seeded medical record',
        school_year=school_year
    )


def create_notification_for_admin(staff_user):
    admin_user = CustomUser.objects.filter(email='admin@wmsu.edu.ph').first()
    if not admin_user:
        admin_user = CustomUser.objects.filter(is_superuser=True).first() or staff_user

    Notification.objects.create(
        user=admin_user,
        message='Seeded notification for testing the bell dropdown.',
        type='system',
        link='/admin'
    )
    return admin_user


def main():
    school_year, created_year = get_or_create_current_school_year()
    staff_user, created_staff = get_or_create_staff_user()
    patient, created_patient = get_or_create_patient(school_year)

    time_slots = [time(9, 0), time(10, 30), time(14, 0), time(15, 30)]

    medical_appt_1 = create_appointment(patient, staff_user, school_year, 'medical', 'completed', -2, time_slots[0])
    medical_appt_2 = create_appointment(patient, staff_user, school_year, 'medical', 'completed', -10, time_slots[1])
    dental_appt_1 = create_appointment(patient, staff_user, school_year, 'dental', 'completed', -1, time_slots[2])
    dental_appt_2 = create_appointment(patient, staff_user, school_year, 'dental', 'completed', -7, time_slots[3])

    medical_form_1 = create_medical_form(patient, medical_appt_1, school_year)
    medical_form_2 = create_medical_form(patient, medical_appt_2, school_year)
    dental_form_1 = create_dental_form(patient, dental_appt_1, school_year)
    dental_form_2 = create_dental_form(patient, dental_appt_2, school_year)

    record_1 = create_medical_record(patient, staff_user, school_year)
    record_2 = create_medical_record(patient, staff_user, school_year)

    admin_user = create_notification_for_admin(staff_user)

    print('Seed results:')
    print(f"  Academic year: {school_year.academic_year} (created={created_year})")
    print(f"  Staff user: {staff_user.email} (created={created_staff})")
    print(f"  Patient: {patient.name} (created={created_patient})")
    print(f"  Medical appointments: {medical_appt_1.id}, {medical_appt_2.id}")
    print(f"  Dental appointments: {dental_appt_1.id}, {dental_appt_2.id}")
    print(f"  Medical forms: {medical_form_1.id}, {medical_form_2.id}")
    print(f"  Dental forms: {dental_form_1.id}, {dental_form_2.id}")
    print(f"  Medical records: {record_1.id}, {record_2.id}")
    print(f"  Notification for: {admin_user.email}")


if __name__ == '__main__':
    main()
