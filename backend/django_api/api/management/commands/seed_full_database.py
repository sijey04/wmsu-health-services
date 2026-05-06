from datetime import date, time, timedelta

from django.core.management import BaseCommand, call_command
from django.db import transaction
from django.utils import timezone

from api.models import (
    AcademicSchoolYear,
    Announcement,
    Appointment,
    CampusSchedule,
    ComorbidIllness,
    ContentManagement,
    Course,
    CustomUser,
    DentalFormData,
    DentalInformationRecord,
    DentalMedicineSupply,
    DentalWaiver,
    DentistSchedule,
    FamilyMedicalHistoryItem,
    Inventory,
    MedicalDocument,
    MedicalFormData,
    MedicalRecord,
    Notification,
    PastMedicalHistoryItem,
    Patient,
    StaffDetails,
    SystemConfiguration,
    UserTypeInformation,
    Vaccination,
    Waiver,
)


SEED_USERS = [
    {
        "label": "Admin",
        "email": "admin@wmsu.test",
        "password": "WmsuAdmin123!",
        "user_type": "admin",
        "is_staff": True,
        "is_superuser": True,
        "first_name": "System",
        "last_name": "Admin",
    },
    {
        "label": "Staff",
        "email": "staff@wmsu.test",
        "password": "WmsuStaff123!",
        "user_type": "staff",
        "is_staff": True,
        "is_superuser": False,
        "first_name": "Clinic",
        "last_name": "Staff",
    },
    {
        "label": "Student",
        "email": "student@wmsu.test",
        "password": "WmsuStudent123!",
        "user_type": "student",
        "is_staff": False,
        "is_superuser": False,
        "first_name": "Sample",
        "last_name": "Student",
    },
]


class Command(BaseCommand):
    help = "Seed baseline configuration and sample data for the whole database"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset-users",
            action="store_true",
            help="Reset seed users (passwords and profile fields).",
        )

    def handle(self, *args, **options):
        reset_users = options["reset_users"]

        self.stdout.write(self.style.SUCCESS("Seeding WMSU Health Services data..."))

        with transaction.atomic():
            school_year = self._ensure_current_school_year()

            self._run_management_seeders()
            self._ensure_system_configuration()
            self._ensure_content_management()
            self._ensure_campus_schedules()
            self._ensure_dentist_schedules()
            self._ensure_health_history_items()
            self._ensure_dental_supplies()
            self._ensure_inventory()

            admin_user, staff_user, student_user = self._ensure_seed_users(reset_users)
            patient = self._ensure_patient_profile(student_user, school_year)

            self._ensure_staff_details(staff_user)
            self._ensure_appointments_and_records(patient, staff_user, school_year)
            self._ensure_medical_documents(patient, school_year)
            self._ensure_dental_information_record(patient, school_year)
            self._ensure_waivers(student_user, patient, school_year)
            self._ensure_announcements(admin_user)
            self._ensure_notifications(admin_user)
            self._ensure_extra_sample_data(staff_user, school_year)

        self._print_credentials()
        self.stdout.write(self.style.SUCCESS("Seeding completed."))

    def _run_management_seeders(self):
        seeders = [
            "populate_profile_requirements",
            "populate_document_requirements",
            "populate_courses",
            "populate_user_type_info",
        ]
        for name in seeders:
            try:
                if name == "populate_user_type_info":
                    call_command(name, "--update", verbosity=0)
                else:
                    call_command(name, verbosity=0)
                self.stdout.write(self.style.SUCCESS(f"* Ran {name}"))
            except Exception as exc:
                self.stdout.write(self.style.WARNING(f"Skipped {name}: {exc}"))

    def _ensure_current_school_year(self):
        today = timezone.now().date()
        start_year = today.year if today.month >= 8 else today.year - 1
        academic_year = f"{start_year}-{start_year + 1}"

        first_sem_start = date(start_year, 8, 15)
        first_sem_end = date(start_year, 12, 20)
        second_sem_start = date(start_year + 1, 1, 15)
        second_sem_end = date(start_year + 1, 5, 31)
        summer_start = date(start_year + 1, 6, 1)
        summer_end = date(start_year + 1, 7, 31)

        school_year, created = AcademicSchoolYear.objects.get_or_create(
            academic_year=academic_year,
            semester_type="1st",
            defaults={
                "start_date": first_sem_start,
                "end_date": first_sem_end,
                "first_sem_start": first_sem_start,
                "first_sem_end": first_sem_end,
                "second_sem_start": second_sem_start,
                "second_sem_end": second_sem_end,
                "summer_start": summer_start,
                "summer_end": summer_end,
                "status": "active",
                "is_current": True,
            },
        )

        if not school_year.is_current:
            school_year.is_current = True
            school_year.status = "active"
            school_year.first_sem_start = school_year.first_sem_start or first_sem_start
            school_year.first_sem_end = school_year.first_sem_end or first_sem_end
            school_year.second_sem_start = school_year.second_sem_start or second_sem_start
            school_year.second_sem_end = school_year.second_sem_end or second_sem_end
            school_year.summer_start = school_year.summer_start or summer_start
            school_year.summer_end = school_year.summer_end or summer_end
            school_year.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"Academic year: {school_year.academic_year} ({'created' if created else 'existing'})"
            )
        )
        return school_year

    def _ensure_system_configuration(self):
        SystemConfiguration.get_config()
        self.stdout.write(self.style.SUCCESS("* System configuration ready"))

    def _ensure_content_management(self):
        ContentManagement.get_content()
        self.stdout.write(self.style.SUCCESS("* Content management ready"))

    def _ensure_campus_schedules(self):
        campus_data = [
            {
                "campus": "a",
                "open_time": time(8, 0),
                "close_time": time(17, 0),
                "operating_days": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                ],
                "is_active": True,
            },
            {
                "campus": "b",
                "open_time": time(8, 0),
                "close_time": time(17, 0),
                "operating_days": [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                ],
                "is_active": True,
            },
        ]

        for item in campus_data:
            CampusSchedule.objects.get_or_create(
                campus=item["campus"],
                defaults=item,
            )
        self.stdout.write(self.style.SUCCESS("* Campus schedules ready"))

    def _ensure_dentist_schedules(self):
        dentist_data = [
            {
                "dentist_name": "Dr. Santos",
                "campus": "a",
                "available_days": ["Monday", "Wednesday", "Friday"],
                "time_slots": ["09:00-11:00", "13:00-15:00"],
                "is_active": True,
            },
            {
                "dentist_name": "Dr. Cruz",
                "campus": "b",
                "available_days": ["Tuesday", "Thursday"],
                "time_slots": ["10:00-12:00", "14:00-16:00"],
                "is_active": True,
            },
        ]

        for item in dentist_data:
            DentistSchedule.objects.get_or_create(
                dentist_name=item["dentist_name"],
                campus=item["campus"],
                defaults=item,
            )
        self.stdout.write(self.style.SUCCESS("* Dentist schedules ready"))

    def _ensure_health_history_items(self):
        # Comorbid Illnesses
        illnesses = [
            {"label": "Hypertension", "display_order": 1},
            {"label": "Diabetes Mellitus", "display_order": 2},
            {"label": "Bronchial Asthma", "display_order": 3},
            {"label": "Heart Disease", "display_order": 4},
            {"label": "Kidney Disease", "display_order": 5},
            {"label": "Food Allergies", "display_order": 6, "requires_specification": True, "specification_placeholder": "List food allergies"},
            {"label": "Drug Allergies", "display_order": 7, "requires_specification": True, "specification_placeholder": "List drug allergies"},
        ]
        for item in illnesses:
            ComorbidIllness.objects.get_or_create(label=item["label"], defaults=item)

        # Vaccinations
        vaccines = [
            {"name": "COVID-19", "display_order": 1},
            {"name": "Hepatitis B", "display_order": 2},
            {"name": "Influenza", "display_order": 3},
            {"name": "Tetanus", "display_order": 4},
            {"name": "HPV", "display_order": 5},
        ]
        for item in vaccines:
            Vaccination.objects.get_or_create(name=item["name"], defaults=item)

        # Past Medical History
        pmh = [
            {"name": "Hospitalization", "display_order": 1, "requires_specification": True, "specification_placeholder": "When and why?"},
            {"name": "Surgery", "display_order": 2, "requires_specification": True, "specification_placeholder": "What procedure?"},
            {"name": "Accidents/Injuries", "display_order": 3},
            {"name": "Blood Transfusion", "display_order": 4},
        ]
        for item in pmh:
            PastMedicalHistoryItem.objects.get_or_create(name=item["name"], defaults=item)

        # Family Medical History
        fmh = [
            {"name": "Hypertension", "display_order": 1},
            {"name": "Diabetes", "display_order": 2},
            {"name": "Cancer", "display_order": 3, "requires_specification": True, "specification_placeholder": "What type?"},
            {"name": "Heart Disease", "display_order": 4},
            {"name": "Mental Illness", "display_order": 5},
        ]
        for item in fmh:
            FamilyMedicalHistoryItem.objects.get_or_create(name=item["name"], defaults=item)

        self.stdout.write(self.style.SUCCESS("* Health history configuration items ready"))

    def _ensure_dental_supplies(self):
        supplies = [
            {"name": "Cotton rolls", "type": "dental_supply", "unit": "pcs"},
            {"name": "Dental gloves", "type": "equipment", "unit": "box"},
            {"name": "Lidocaine HCl 2%", "type": "anesthetic", "unit": "cartridge"},
            {"name": "Ibuprofen 400mg", "type": "medicine", "unit": "tablet"},
        ]

        for item in supplies:
            DentalMedicineSupply.objects.get_or_create(
                name=item["name"],
                type=item["type"],
                defaults={
                    "description": "Seeded item",
                    "unit": item["unit"],
                    "is_active": True,
                },
            )
        self.stdout.write(self.style.SUCCESS("* Dental medicines and supplies ready"))

    def _ensure_inventory(self):
        items = [
            {"item_name": "Surgical mask", "item_type": "equipment", "quantity": 120},
            {"item_name": "Alcohol 70%", "item_type": "supply", "quantity": 40},
            {"item_name": "Thermometer", "item_type": "equipment", "quantity": 10},
        ]

        for item in items:
            Inventory.objects.get_or_create(
                item_name=item["item_name"],
                defaults=item,
            )
        self.stdout.write(self.style.SUCCESS("* Inventory ready"))

    def _ensure_seed_users(self, reset_users):
        users = []
        for entry in SEED_USERS:
            user, created = CustomUser.objects.get_or_create(
                email=entry["email"],
                defaults={
                    "username": entry["email"],
                    "first_name": entry["first_name"],
                    "last_name": entry["last_name"],
                    "user_type": entry["user_type"],
                    "is_staff": entry["is_staff"],
                    "is_superuser": entry["is_superuser"],
                    "is_active": True,
                    "is_email_verified": True,
                },
            )

            if created or reset_users:
                user.username = entry["email"]
                user.first_name = entry["first_name"]
                user.last_name = entry["last_name"]
                user.user_type = entry["user_type"]
                user.is_staff = entry["is_staff"]
                user.is_superuser = entry["is_superuser"]
                user.is_active = True
                user.is_email_verified = True
                user.set_password(entry["password"])
                user.save()

            users.append(user)
            status = "created" if created else "existing"
            self.stdout.write(self.style.SUCCESS(f"* {entry['label']} user {status}: {entry['email']}"))

        return users[0], users[1], users[2]

    def _ensure_staff_details(self, staff_user):
        StaffDetails.objects.get_or_create(
            user=staff_user,
            defaults={
                "full_name": f"{staff_user.first_name} {staff_user.last_name}",
                "position": "Clinic Staff",
                "license_number": "MD-0001",
                "campus_assigned": "a",
                "assigned_campuses": "a,b",
                "available_days": ["Monday", "Wednesday", "Friday"],
                "time_slots": ["09:00-11:00", "13:00-15:00"],
            },
        )
        self.stdout.write(self.style.SUCCESS("* Staff details ready"))

    def _ensure_patient_profile(self, student_user, school_year):
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
                "gender": "Female",
                "date_of_birth": date(2004, 5, 15),
                "age": 21,
                "email": student_user.email,
                "contact_number": "09123456789",
                "address": "WMSU Campus, Zamboanga City",
                "city_municipality": "Zamboanga City",
                "barangay": "Baliwasan",
                "street": "Normal Road",
                "blood_type": "O+",
                "religion": "Roman Catholic",
                "nationality": "Filipino",
                "civil_status": "single",
                "user_type": "College",
                "course": "BS Computer Science",
                "year_level": "3rd Year",
                "record_completion_status": "completed",
                "emergency_contact_name": "Emergency Contact",
                "emergency_contact_number": "09987654321",
                "emergency_contact_relationship": "Parent",
                "comorbid_illnesses": ["None"],
                "maintenance_medications": ["None"],
                "vaccination_history": {"COVID-19": "Fully Vaccinated"},
                "past_medical_history": ["None"],
                "family_medical_history": ["None"],
            },
        )

        status = "created" if created else "existing"
        self.stdout.write(self.style.SUCCESS(f"* Patient profile {status}: {patient.student_id}"))
        return patient

    def _ensure_appointments_and_records(self, patient, staff_user, school_year):
        today = timezone.now().date()
        medical_date = today - timedelta(days=3)
        dental_date = today - timedelta(days=1)

        medical_appt, _ = Appointment.objects.get_or_create(
            patient=patient,
            appointment_date=medical_date,
            appointment_time=time(9, 0),
            type="medical",
            defaults={
                "doctor": staff_user,
                "purpose": "Seeded medical consultation",
                "status": "completed",
                "campus": "a",
                "school_year": school_year,
                "notes": "Seeded appointment",
            },
        )

        dental_appt, _ = Appointment.objects.get_or_create(
            patient=patient,
            appointment_date=dental_date,
            appointment_time=time(14, 0),
            type="dental",
            defaults={
                "doctor": staff_user,
                "purpose": "Seeded dental consultation",
                "status": "completed",
                "campus": "a",
                "school_year": school_year,
                "concern": "Routine cleaning",
                "notes": "Seeded appointment",
            },
        )

        MedicalFormData.objects.get_or_create(
            patient=patient,
            appointment=medical_appt,
            defaults={
                "academic_year": school_year,
                "date": medical_date,
                "chief_complaint": "Headache",
                "diagnosis": "Tension headache",
                "treatment_plan": "Rest and hydration",
                "examined_by": "Seeded Clinician",
            },
        )

        DentalFormData.objects.get_or_create(
            patient=patient,
            appointment=dental_appt,
            defaults={
                "academic_year": school_year,
                "date": dental_date,
                "oral_hygiene": "Fair",
                "decayed_teeth": "1",
                "missing_teeth": "0",
                "filled_teeth": "0",
                "recommended_treatments": "Cleaning",
                "used_medicines": [
                    {"name": "Cotton rolls", "quantity": 2, "unit": "pcs", "cost": 0},
                    {"name": "Dental gloves", "quantity": 1, "unit": "box", "cost": 0},
                ],
                "consultation_template_compliant": True,
                "total_consultations": 1,
            },
        )

        MedicalRecord.objects.get_or_create(
            patient=patient,
            doctor=staff_user,
            diagnosis="Common cold",
            treatment="Rest and fluids",
            defaults={
                "prescription": "Paracetamol 500mg",
                "notes": "Seeded medical record",
                "school_year": school_year,
            },
        )

        self.stdout.write(self.style.SUCCESS("* Appointments, forms, and records ready"))

    def _ensure_medical_documents(self, patient, school_year):
        MedicalDocument.objects.get_or_create(
            patient=patient,
            academic_year=school_year,
            defaults={
                "status": "pending",
                "submitted_for_review": True,
            },
        )
        self.stdout.write(self.style.SUCCESS("* Medical documents ready"))

    def _ensure_dental_information_record(self, patient, school_year):
        semester = school_year.get_current_semester() or "1st_semester"
        DentalInformationRecord.objects.get_or_create(
            patient=patient,
            school_year=school_year,
            semester=semester,
            defaults={
                "patient_name": patient.name,
                "age": patient.age,
                "sex": patient.gender,
                "education_level": "college",
                "year_level": patient.year_level,
                "course": patient.course,
                "date": timezone.now().date(),
                "signature_date": timezone.now().date(),
                "patient_signature": "seeded-signature",
            },
        )
        self.stdout.write(self.style.SUCCESS("* Dental information record ready"))

    def _ensure_waivers(self, student_user, patient, school_year):
        Waiver.objects.get_or_create(
            user=student_user,
            defaults={
                "full_name": f"{student_user.first_name} {student_user.last_name}",
                "date_signed": timezone.now().date(),
                "signature": "seeded-signature",
            },
        )

        semester = school_year.get_current_semester() or "1st_semester"
        DentalWaiver.objects.get_or_create(
            user=student_user,
            semester=semester,
            defaults={
                "patient": patient,
                "patient_name": patient.name,
                "patient_signature": "seeded-signature",
                "date_signed": timezone.now().date(),
            },
        )
        self.stdout.write(self.style.SUCCESS("* Waivers ready"))

    def _ensure_announcements(self, admin_user):
        Announcement.objects.get_or_create(
            title="Welcome to WMSU Health Services",
            defaults={
                "message": "This is a seeded announcement for testing.",
                "priority": "medium",
                "icon": "📢",
                "created_by": admin_user,
                "is_active": True,
                "show_on_login": True,
                "target_all_users": True,
            },
        )
        self.stdout.write(self.style.SUCCESS("* Announcements ready"))

    def _ensure_notifications(self, admin_user):
        Notification.objects.get_or_create(
            user=admin_user,
            message="Seeded notification for testing the bell dropdown.",
            defaults={
                "type": "system",
                "link": "/admin",
            },
        )
        self.stdout.write(self.style.SUCCESS("* Notifications ready"))

    def _ensure_extra_sample_data(self, staff_user, school_year):
        # Create more sample students to make the list look populated
        extra_students = [
            {"email": "jane.doe@wmsu.test", "first": "Jane", "last": "Doe", "id": "2021-00123"},
            {"email": "john.smith@wmsu.test", "first": "John", "last": "Smith", "id": "2022-04567"},
            {"email": "bob.jones@wmsu.test", "first": "Bob", "last": "Jones", "id": "2023-08910"},
        ]

        for entry in extra_students:
            user, _ = CustomUser.objects.get_or_create(
                email=entry["email"],
                defaults={
                    "username": entry["email"],
                    "first_name": entry["first"],
                    "last_name": entry["last"],
                    "user_type": "student",
                    "is_active": True,
                    "is_email_verified": True,
                },
            )
            user.set_password("WmsuStudent123!")
            user.save()

            patient, _ = Patient.objects.get_or_create(
                user=user,
                school_year=school_year,
                semester=school_year.get_current_semester() or "1st_semester",
                defaults={
                    "student_id": entry["id"],
                    "name": f"{entry['last']}, {entry['first']}",
                    "gender": "Male" if entry["first"] == "John" or entry["first"] == "Bob" else "Female",
                    "age": 20,
                    "email": entry["email"],
                    "contact_number": "09" + "".join([str(timezone.now().microsecond % 10) for _ in range(9)]),
                    "record_completion_status": "completed",
                    "user_type": "College",
                    "course": "BS Information Technology",
                    "year_level": "2nd Year",
                },
            )

            # Add a pending appointment for each
            Appointment.objects.get_or_create(
                patient=patient,
                appointment_date=timezone.now().date() + timedelta(days=2),
                appointment_time=time(10, 0),
                type="medical",
                defaults={
                    "doctor": staff_user,
                    "purpose": "General Checkup",
                    "status": "pending",
                    "campus": "a",
                    "school_year": school_year,
                },
            )

        self.stdout.write(self.style.SUCCESS("* Extra sample students and appointments ready"))

    def _print_credentials(self):
        self.stdout.write("\nSeed user credentials:")
        for entry in SEED_USERS:
            self.stdout.write(f"  {entry['label']}: {entry['email']} / {entry['password']}")
