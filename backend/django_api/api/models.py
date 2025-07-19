from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings
from django.utils import timezone
import uuid
from datetime import datetime, timedelta


class CustomUser(AbstractUser):
    USER_TYPE_CHOICES = [
        ('student', 'Student'),
        ('staff', 'Staff'),
        ('admin', 'Admin'),
    ]
    email = models.EmailField(unique=True)
    grade_level = models.CharField(max_length=50, blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    email_verification_token = models.UUIDField(default=uuid.uuid4, editable=False)
    email_verification_sent_at = models.DateTimeField(null=True, blank=True)
    user_type = models.CharField(max_length=10, choices=USER_TYPE_CHOICES, default='student')
    middle_name = models.CharField(max_length=150, blank=True, null=True)
    
    # User blocking/restriction functionality
    is_blocked = models.BooleanField(default=False, help_text='Block user from booking consultations')
    blocked_at = models.DateTimeField(null=True, blank=True, help_text='When the user was blocked')
    blocked_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='blocked_users', help_text='Admin who blocked this user')
    block_reason = models.TextField(blank=True, null=True, help_text='Reason for blocking the user')
    
    # Additional fields that match production database
    education_level = models.CharField(max_length=20, blank=True, null=True)
    education_year = models.IntegerField(blank=True, null=True)
    education_program = models.CharField(max_length=200, blank=True, null=True)
    department_college = models.CharField(max_length=200, blank=True, null=True)
    employee_position = models.CharField(max_length=200, blank=True, null=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    def __str__(self):
        return self.email
    
    def send_verification_email(self):
        """Send email verification link to user"""
        subject = 'Verify Your Email - WMSU Health Services'
        
        # Create verification URL (corrected to frontend port 3000)
        verification_url = f"http://localhost:3000/verify-email?token={self.email_verification_token}"
        
        # HTML message
        html_message = render_to_string('email_verification.html', {
            'user': self,
            'verification_url': verification_url,
        })
        
        # Plain text message
        plain_message = strip_tags(html_message)
        
        try:
            # Send email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[self.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            # Update sent timestamp
            self.email_verification_sent_at = timezone.now()
            self.save(update_fields=['email_verification_sent_at'])
            
        except Exception as e:
            # In production, you might want to log this error
            raise e
    
    def verify_email(self, token):
        """Verify email with token"""
        if str(self.email_verification_token) == str(token):
            self.is_email_verified = True
            self.save(update_fields=['is_email_verified'])
            return True
        return False
    
    def get_current_patient_profile(self):
        """Get the patient profile for the current active school year and semester"""
        try:
            current_school_year = AcademicSchoolYear.objects.get(is_current=True)
            current_semester = current_school_year.get_current_semester()
            if current_semester:
                return self.patient_profiles.filter(
                    school_year=current_school_year,
                    semester=current_semester
                ).first()
            else:
                # If no current semester, get the most recent profile for current year
                return self.patient_profiles.filter(school_year=current_school_year).first()
        except AcademicSchoolYear.DoesNotExist:
            return None
    
    def get_or_create_patient_profile(self, school_year=None, semester=None):
        """Get or create a patient profile for the specified school year and semester"""
        if school_year is None:
            try:
                school_year = AcademicSchoolYear.objects.get(is_current=True)
            except AcademicSchoolYear.DoesNotExist:
                return None, False
        
        if semester is None and school_year:
            semester = school_year.get_current_semester()
        
        profile, created = self.patient_profiles.get_or_create(
            school_year=school_year,
            semester=semester,
            defaults={
                'name': f"{self.last_name}, {self.first_name}" if self.first_name and self.last_name else self.username,
                'first_name': self.first_name or '',
                'middle_name': self.middle_name or '',
                'email': self.email,
                'student_id': f"TEMP-{self.id}",
            }
        )
        return profile, created
    
    def block_user(self, blocked_by, reason=""):
        """Block user from booking consultations"""
        from django.utils import timezone
        self.is_blocked = True
        self.blocked_at = timezone.now()
        self.blocked_by = blocked_by
        self.block_reason = reason
        self.save(update_fields=['is_blocked', 'blocked_at', 'blocked_by', 'block_reason'])
    
    def unblock_user(self):
        """Unblock user to allow booking consultations"""
        self.is_blocked = False
        self.blocked_at = None
        self.blocked_by = None
        self.block_reason = ""
        self.save(update_fields=['is_blocked', 'blocked_at', 'blocked_by', 'block_reason'])
    
    def can_book_consultation(self):
        """Check if user can book consultations"""
        return not self.is_blocked and self.is_email_verified


class Patient(models.Model):
    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]
    CIVIL_STATUS_CHOICES = [
        ('single', 'Single'),
        ('married', 'Married'),
        ('widowed', 'Widowed'),
        ('separated', 'Separated'),
        ('other', 'Other'),
    ]
    NATIONALITY_CHOICES = [
        ('Filipino', 'Filipino'),
        ('Foreigner', 'Foreigner'),
        ('Other', 'Other'),
    ]
    RELIGION_CHOICES = [
        ('Roman Catholic', 'Roman Catholic'),
        ('Seventh-day Adventist', 'Seventh-day Adventist'),
        ('Islam', 'Islam'),
        ('Protestant', 'Protestant'),
        ('Iglesia ni Cristo', 'Iglesia ni Cristo'),
        ('Other', 'Other'),
    ]
    BLOOD_TYPE_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'), ('O+', 'O+'), ('O-', 'O-'),
    ]
    COVID_VAX_CHOICES = [
        ('fully_vaccinated', 'Fully vaccinated'),
        ('partially_vaccinated', 'Partially vaccinated'),
        ('unvaccinated', 'Unvaccinated'),
        ('boosted', 'Boosted'),
        ('lapsed', 'Lapsed'),
    ]
    SEMESTER_CHOICES = [
        ('1st_semester', 'First Semester'),
        ('2nd_semester', 'Second Semester'),
        ('summer', 'Summer Semester'),
    ]
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='patient_profiles', null=True, blank=True)
    student_id = models.CharField(max_length=20)
    name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    suffix = models.CharField(max_length=20, blank=True, null=True)
    photo = models.ImageField(upload_to='patient_photos/', blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='Other')
    date_of_birth = models.DateField(null=True, blank=True)
    age = models.IntegerField(blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)  # Keep for backward compatibility
    city_municipality = models.CharField(max_length=100, blank=True, null=True)
    barangay = models.CharField(max_length=100, blank=True, null=True)
    street = models.CharField(max_length=200, blank=True, null=True)
    blood_type = models.CharField(max_length=5, choices=BLOOD_TYPE_CHOICES, blank=True, null=True)
    religion = models.CharField(max_length=50, choices=RELIGION_CHOICES, blank=True, null=True)
    nationality = models.CharField(max_length=50, choices=NATIONALITY_CHOICES, blank=True, null=True)
    civil_status = models.CharField(max_length=20, choices=CIVIL_STATUS_CHOICES, blank=True, null=True)
    
    # Emergency Contact
    emergency_contact_surname = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_first_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_middle_name = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_number = models.CharField(max_length=20, blank=True, null=True)
    emergency_contact_relationship = models.CharField(max_length=50, blank=True, null=True)
    emergency_contact_address = models.TextField(blank=True, null=True)  # Keep for backward compatibility
    emergency_contact_barangay = models.CharField(max_length=100, blank=True, null=True)
    emergency_contact_street = models.CharField(max_length=200, blank=True, null=True)
    
    # Health History
    comorbid_illnesses = models.JSONField(blank=True, null=True, help_text='List of comorbid illnesses')
    maintenance_medications = models.JSONField(blank=True, null=True, help_text='List of maintenance medications')
    vaccination_history = models.JSONField(blank=True, null=True, help_text='Vaccination history for all vaccines')
    
    # Past Medical & Surgical History
    past_medical_history = models.JSONField(blank=True, null=True, help_text='List of past medical/surgical history')
    hospital_admission_or_surgery = models.BooleanField(default=False)
    hospital_admission_details = models.TextField(blank=True, null=True, help_text='Details of hospital admission or surgery when answer is Yes')
    
    # Family Medical History
    family_medical_history = models.JSONField(blank=True, null=True, help_text='List of family medical history')
    
    # School Year Reference
    school_year = models.ForeignKey('AcademicSchoolYear', on_delete=models.SET_NULL, null=True, blank=True, related_name='patients')
    semester = models.CharField(max_length=20, choices=SEMESTER_CHOICES, blank=True, null=True, help_text='Semester period for this patient profile')
    
    allergies = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Additional fields that match production database
    surname = models.CharField(max_length=100, blank=True, null=True)
    sex = models.CharField(max_length=10, blank=True, null=True)
    course = models.CharField(max_length=200, blank=True, null=True)
    year_level = models.CharField(max_length=50, blank=True, null=True)
    
    # User type specific fields
    user_type = models.CharField(max_length=50, blank=True, null=True, help_text='User type from signup (Employee, College, etc.)')
    employee_id = models.CharField(max_length=50, blank=True, null=True, help_text='Employee ID for Employee user type')
    position_type = models.CharField(max_length=50, blank=True, null=True, help_text='Teaching or Non-Teaching for Employee user type')
    strand = models.CharField(max_length=100, blank=True, null=True, help_text='Strand for Senior High School user type')
    
    birthday = models.DateField(blank=True, null=True)
    city_address = models.TextField(blank=True, null=True)
    provincial_address = models.TextField(blank=True, null=True)
    emergency_contact_name = models.CharField(max_length=200, blank=True, null=True)
    emergency_contact_city_address = models.TextField(blank=True, null=True)
    covid19_vaccination_status = models.CharField(max_length=50, blank=True, null=True)
    menstruation_age_began = models.IntegerField(blank=True, null=True)
    menstruation_regular = models.BooleanField(default=False)
    menstruation_irregular = models.BooleanField(default=False)
    number_of_pregnancies = models.IntegerField(blank=True, null=True)
    number_of_live_children = models.IntegerField(blank=True, null=True)
    menstrual_symptoms = models.TextField(blank=True, null=True)
    past_conditions_this_year = models.TextField(blank=True, null=True)
    hospital_admissions = models.TextField(blank=True, null=True)
    uhs_template_compliant = models.BooleanField(default=False)
    record_completion_status = models.CharField(max_length=20, default='incomplete')
    staff_notes = models.TextField(blank=True, null=True)
    semester_id = models.IntegerField(blank=True, null=True)
    
    class Meta:
        unique_together = ['user', 'school_year', 'semester']
        indexes = [
            models.Index(fields=['user', 'school_year', 'semester']),
        ]
    
    def __str__(self):
        semester_display = f" ({self.get_semester_display()})" if self.semester else ""
        return f"{self.name} ({self.student_id}) - {self.school_year}{semester_display}"
    
    def save(self, *args, **kwargs):
        """
        Override save method to auto-fill fields from associated CustomUser
        """
        if self.user:
            # Auto-fill email if not provided
            if not self.email:
                self.email = self.user.email
            
            # Auto-fill name if not provided (format: "Last, First")
            if not self.name and self.user.first_name and self.user.last_name:
                self.name = f"{self.user.last_name}, {self.user.first_name}"
            
            # Auto-fill first_name if not provided
            if not self.first_name:
                self.first_name = self.user.first_name
            
            # Auto-fill middle_name if not provided
            if not self.middle_name:
                self.middle_name = self.user.middle_name
            
            # Auto-fill student_id if not provided (temporary ID based on user ID)
            if not self.student_id:
                self.student_id = f"TEMP-{self.user.id}"
        
        # Auto-assign current school year if not set
        if not self.school_year:
            try:
                current_year = AcademicSchoolYear.get_current_school_year()
                if current_year:
                    self.school_year = current_year
            except:
                pass
        
        # Auto-determine semester if not explicitly set
        if not self.semester and self.school_year:
            self.semester = self.school_year.get_current_semester()
        
        super().save(*args, **kwargs)
    
    def get_current_medical_record(self):
        """Get the most recent medical record for the patient"""
        return self.medical_records.order_by('-record_date').first()
    
    def get_current_dental_form(self):
        """Get the most recent dental form data for the patient"""
        return self.dental_forms.order_by('-created_at').first()
    
    def get_age(self):
        """Calculate age based on date of birth"""
        if self.date_of_birth:
            return (timezone.now().date() - self.date_of_birth).days // 365
        return None
    
    def get_semester_display(self):
        """Get human-readable semester name"""
        if self.semester == '1st_semester':
            return 'First Semester'
        elif self.semester == '2nd_semester':
            return 'Second Semester'
        elif self.semester == 'summer':
            return 'Summer Semester'
        else:
            return 'Unassigned'
    
    def is_current_semester_patient(self):
        """Check if this patient profile is for the current semester"""
        if not self.school_year or not self.semester:
            return False
        
        current_year = AcademicSchoolYear.get_current_school_year()
        if not current_year or current_year != self.school_year:
            return False
        
        current_semester = current_year.get_current_semester()
        return current_semester == self.semester


class MedicalRecord(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_records')
    record_date = models.DateTimeField(auto_now_add=True)
    doctor = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='medical_records')
    diagnosis = models.TextField()
    treatment = models.TextField()
    prescription = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    school_year = models.ForeignKey('AcademicSchoolYear', on_delete=models.SET_NULL, null=True, blank=True, related_name='medical_records')
    
    def __str__(self):
        return f"Record for {self.patient.name} on {self.record_date.strftime('%Y-%m-%d')}"


class Appointment(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
        ('completed', 'Completed'),
        ('scheduled', 'Scheduled'),
    ]
    TYPE_CHOICES = [
        ('medical', 'Medical'),
        ('dental', 'Dental'),
    ]
    CAMPUS_CHOICES = [
        ('a', 'Campus A'),
        ('b', 'Campus B'),
        ('c', 'Campus C'),
    ]
    SEMESTER_CHOICES = [
        ('1st_semester', 'First Semester'),
        ('2nd_semester', 'Second Semester'),
        ('summer', 'Summer Semester'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='appointments')
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    purpose = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    type = models.CharField(max_length=10, choices=TYPE_CHOICES, default='medical')
    concern = models.TextField(blank=True, null=True)  # for dental
    campus = models.CharField(max_length=20, choices=CAMPUS_CHOICES, default='a')
    school_year = models.ForeignKey('AcademicSchoolYear', on_delete=models.SET_NULL, null=True, blank=True, related_name='appointments')
    semester = models.CharField(max_length=20, choices=SEMESTER_CHOICES, blank=True, null=True, help_text='Semester period for this appointment')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Reschedule tracking fields
    is_rescheduled = models.BooleanField(default=False, help_text='Whether this appointment has been rescheduled')
    rescheduled_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='rescheduled_appointments', help_text='User who rescheduled this appointment')
    rescheduled_at = models.DateTimeField(null=True, blank=True, help_text='When the appointment was rescheduled')
    original_date = models.DateField(null=True, blank=True, help_text='Original appointment date before reschedule')
    original_time = models.TimeField(null=True, blank=True, help_text='Original appointment time before reschedule')
    reschedule_reason = models.TextField(blank=True, null=True, help_text='Reason for rescheduling')
    
    def __str__(self):
        semester_display = f" ({self.get_semester_display()})" if self.semester else ""
        return f"{self.patient.name}'s appointment on {self.appointment_date} at {self.appointment_time}{semester_display}"
    
    def determine_semester(self):
        """
        Automatically determine which semester this appointment falls into
        based on the appointment date and school year
        """
        if not self.school_year or not self.appointment_date:
            return None
            
        # Check which semester period the appointment date falls into
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
    
    def get_semester_display(self):
        """Get human-readable semester name"""
        if self.semester == '1st_semester':
            return 'First Semester'
        elif self.semester == '2nd_semester':
            return 'Second Semester'
        elif self.semester == 'summer':
            return 'Summer Semester'
        else:
            return 'Unassigned'
    
    def save(self, *args, **kwargs):
        """Override save to automatically set semester and school year"""
        # Auto-assign current school year if not set
        if not self.school_year:
            try:
                current_year = AcademicSchoolYear.get_current_school_year()
                if current_year:
                    self.school_year = current_year
            except:
                pass
        
        # Auto-determine semester if not explicitly set
        if not self.semester and self.school_year and self.appointment_date:
            self.semester = self.determine_semester()
        
        super().save(*args, **kwargs)
    
    def reschedule_appointment(self, new_date, new_time, rescheduled_by, reason=""):
        """
        Reschedule this appointment and track the change
        """
        from django.utils import timezone
        
        # Store original date/time if not already stored
        if not self.is_rescheduled:
            self.original_date = self.appointment_date
            self.original_time = self.appointment_time
        
        # Update appointment details
        self.appointment_date = new_date
        self.appointment_time = new_time
        self.is_rescheduled = True
        self.rescheduled_by = rescheduled_by
        self.rescheduled_at = timezone.now()
        self.reschedule_reason = reason
        
        # Update notes to include reschedule information
        reschedule_note = f"Appointment rescheduled by {rescheduled_by.get_full_name()} on {timezone.now().strftime('%Y-%m-%d %H:%M')}"
        if self.original_date and self.original_time:
            reschedule_note += f" from {self.original_date} at {self.original_time}"
        if reason:
            reschedule_note += f". Reason: {reason}"
        
        if self.notes:
            self.notes += f"\n{reschedule_note}"
        else:
            self.notes = reschedule_note
        
        self.save()
        
    def was_rescheduled_by_admin(self):
        """
        Check if this appointment was rescheduled by admin/staff
        """
        if not self.is_rescheduled or not self.rescheduled_by:
            return False
        
        # Check if rescheduled by admin or staff
        return (self.rescheduled_by.is_staff or 
                self.rescheduled_by.user_type in ['staff', 'admin'])
    
    def was_rescheduled_by_patient(self):
        """
        Check if this appointment was rescheduled by the patient
        """
        if not self.is_rescheduled or not self.rescheduled_by:
            return False
        
        # Check if rescheduled by the patient themselves
        return self.rescheduled_by == self.patient.user


class Inventory(models.Model):
    item_name = models.CharField(max_length=100)
    item_type = models.CharField(max_length=50)
    quantity = models.IntegerField(default=0)
    description = models.TextField(blank=True, null=True)
    expiry_date = models.DateField(null=True, blank=True)
    last_restocked_date = models.DateField(null=True, blank=True)
    last_restocked_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='inventory_updates')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.item_name} ({self.quantity})"


class Waiver(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='waivers')
    full_name = models.CharField(max_length=100)
    date_signed = models.DateField()
    signature = models.TextField(help_text='Base64-encoded signature image')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user'], name='unique_waiver_per_user')
        ]

    def __str__(self):
        return f"Waiver for {self.full_name} on {self.date_signed}"


class DentalWaiver(models.Model):
    """Informed Consent to Care waiver specifically for dental appointments"""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='dental_waivers')
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='dental_waivers', null=True, blank=True)
    patient_name = models.CharField(max_length=100, help_text='Full name of patient')
    guardian_name = models.CharField(max_length=100, blank=True, null=True, help_text='Name of parent/guardian if patient is minor')
    patient_signature = models.TextField(help_text='Base64-encoded patient signature image')
    guardian_signature = models.TextField(blank=True, null=True, help_text='Base64-encoded parent/guardian signature image')
    date_signed = models.DateField()
    # Temporarily disabled school_year foreign key due to constraint issues
    # school_year = models.ForeignKey('AcademicSchoolYear', on_delete=models.SET_NULL, null=True, blank=True, related_name='dental_waivers')
    semester = models.CharField(max_length=20, choices=Patient.SEMESTER_CHOICES, blank=True, null=True, help_text='Semester period for this dental waiver')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user', 'semester'], name='unique_dental_waiver_per_user_semester')
        ]

    def __str__(self):
        semester_display = f" ({self.get_semester_display()})" if self.semester else ""
        return f"Dental Waiver for {self.patient_name}{semester_display}"
    
    def get_semester_display(self):
        """Get human-readable semester name"""
        if self.semester == '1st_semester':
            return 'First Semester'
        elif self.semester == '2nd_semester':
            return 'Second Semester'
        elif self.semester == 'summer':
            return 'Summer Semester'
        else:
            return 'Unassigned'
    
    def save(self, *args, **kwargs):
        """Override save to auto-assign semester"""
        # Auto-assign current school year if not set - temporarily disabled
        # if not self.school_year:
        #     try:
        #         current_year = AcademicSchoolYear.get_current_school_year()
        #         if current_year:
        #             self.school_year = current_year
        #     except:
        #         pass
        
        # Auto-determine semester if not explicitly set - temporarily disabled
        # if not self.semester and self.school_year:
        #     self.semester = self.school_year.get_current_semester()
        
        # Auto-populate patient field from user's current patient profile
        if not self.patient and self.user:
            current_profile = self.user.get_current_patient_profile()
            if current_profile:
                self.patient = current_profile
        
        super().save(*args, **kwargs)


class MedicalDocument(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('for_consultation', 'For Consultation'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
        ('issued', 'Certificate Issued'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_documents')
    academic_year = models.ForeignKey('AcademicSchoolYear', on_delete=models.CASCADE, related_name='medical_documents', null=True, blank=True)
    chest_xray = models.FileField(upload_to='medical_documents/chest_xray/', blank=True, null=True)
    cbc = models.FileField(upload_to='medical_documents/cbc/', blank=True, null=True)
    blood_typing = models.FileField(upload_to='medical_documents/blood_typing/', blank=True, null=True)
    urinalysis = models.FileField(upload_to='medical_documents/urinalysis/', blank=True, null=True)
    drug_test = models.FileField(upload_to='medical_documents/drug_test/', blank=True, null=True)
    hepa_b = models.FileField(upload_to='medical_documents/hepa_b/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    submitted_for_review = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_documents')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Consultation advice fields
    consultation_reason = models.TextField(blank=True, null=True, help_text='Reason for consultation advice')
    advised_for_consultation_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='consultation_advised_documents', help_text='Staff who advised for consultation')
    advised_for_consultation_at = models.DateTimeField(null=True, blank=True, help_text='When consultation was advised')
    
    medical_certificate = models.FileField(upload_to='medical_certificates/', blank=True, null=True)
    certificate_issued_at = models.DateTimeField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['patient', 'academic_year'], name='unique_medical_document_per_patient_year')
        ]
    
    def __str__(self):
        return f"Medical Documents for {self.patient.name} ({self.patient.student_id})"
    
    @property
    def is_complete(self):
        """Check if all required documents are uploaded"""
        required_docs = ['chest_xray', 'cbc', 'blood_typing', 'urinalysis', 'drug_test']
        return all(getattr(self, doc) for doc in required_docs)
    
    @property
    def completion_percentage(self):
        """Calculate completion percentage"""
        required_docs = ['chest_xray', 'cbc', 'blood_typing', 'urinalysis', 'drug_test']
        completed = sum(1 for doc in required_docs if getattr(self, doc))
        return int((completed / len(required_docs)) * 100)


class StaffDetails(models.Model):
    CAMPUS_CHOICES = [
        ('a', 'Campus A'),
        ('b', 'Campus B'),
        ('c', 'Campus C'),
    ]
    
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='staff_details')
    signature = models.ImageField(upload_to='staff_signatures/', blank=True, null=True)
    full_name = models.CharField(max_length=200)
    position = models.CharField(max_length=100)
    license_number = models.CharField(max_length=50, blank=True, null=True)
    ptr_number = models.CharField(max_length=50, blank=True, null=True)
    campus_assigned = models.CharField(max_length=20, choices=CAMPUS_CHOICES, default='a')  # Keep for backward compatibility
    assigned_campuses = models.CharField(max_length=10, default='a', help_text='Comma-separated campus codes (a,b,c)')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['user'], name='unique_staff_details_per_user')
        ]
    
    def get_assigned_campuses_list(self):
        """Return list of assigned campus codes"""
        if self.assigned_campuses:
            return [campus.strip() for campus in self.assigned_campuses.split(',') if campus.strip()]
        return [self.campus_assigned] if self.campus_assigned else ['a']
    
    def get_assigned_campuses_display(self):
        """Return display names of assigned campuses"""
        campus_map = dict(self.CAMPUS_CHOICES)
        campuses = self.get_assigned_campuses_list()
        return [campus_map.get(campus, campus) for campus in campuses]
    
    def set_assigned_campuses(self, campus_list):
        """Set assigned campuses from a list"""
        if isinstance(campus_list, list):
            self.assigned_campuses = ','.join(campus_list)
        else:
            self.assigned_campuses = str(campus_list)
    
    def __str__(self):
        campuses = ', '.join(self.get_assigned_campuses_display())
        return f"{self.full_name} - {self.position} ({campuses})"


class DentalFormData(models.Model):
    DENTITION_CHOICES = [
        ('Satisfactory', 'Satisfactory'),
        ('Fair', 'Fair'),
        ('Poor', 'Poor'),
    ]
    PERIODONTAL_CHOICES = [
        ('Satisfactory', 'Satisfactory'),
        ('Fair', 'Fair'),
        ('Poor', 'Poor'),
    ]
    OCCLUSION_CHOICES = [
        ('Normal', 'Normal'),
        ('Malocclusion', 'Malocclusion'),
    ]
    MALOCCLUSION_SEVERITY_CHOICES = [
        ('Mild', 'Mild'),
        ('Moderate', 'Moderate'),
        ('Severe', 'Severe'),
    ]
    SEX_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
    ]
    HAS_TOOTHBRUSH_CHOICES = [
        ('Yes', 'Yes'),
        ('No', 'No'),
    ]
    
    # Patient Information (auto-filled from Patient model)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='dental_forms')
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='dental_form_data', null=True, blank=True)
    academic_year = models.ForeignKey('AcademicSchoolYear', on_delete=models.SET_NULL, null=True, blank=True, related_name='dental_forms')
    
    # Form Data
    file_no = models.CharField(max_length=50, blank=True, null=True)
    surname = models.CharField(max_length=100, blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    age = models.IntegerField(blank=True, null=True)
    sex = models.CharField(max_length=10, choices=SEX_CHOICES, default='Male')
    has_toothbrush = models.CharField(max_length=3, choices=HAS_TOOTHBRUSH_CHOICES, default='Yes')
    
    # Dental Assessment
    dentition = models.CharField(max_length=20, choices=DENTITION_CHOICES, blank=True, null=True)
    periodontal = models.CharField(max_length=20, choices=PERIODONTAL_CHOICES, blank=True, null=True)
    occlusion = models.CharField(max_length=20, choices=OCCLUSION_CHOICES, blank=True, null=True)
    malocclusion_severity = models.CharField(max_length=20, choices=MALOCCLUSION_SEVERITY_CHOICES, blank=True, null=True)
    
    # Dental Findings
    decayed_teeth = models.CharField(max_length=100, blank=True, null=True)
    missing_teeth = models.CharField(max_length=100, blank=True, null=True)
    filled_teeth = models.CharField(max_length=100, blank=True, null=True)
    oral_hygiene = models.CharField(max_length=100, blank=True, null=True)
    
    # Treatment and Recommendations
    recommended_treatments = models.TextField(blank=True, null=True)
    prevention_advice = models.TextField(blank=True, null=True)
    next_appointment = models.CharField(max_length=100, blank=True, null=True)
    treatment_priority = models.CharField(max_length=100, blank=True, null=True)
    
    # Additional remarks
    remarks = models.TextField(blank=True, null=True)
    
    # Examiner Information
    examined_by = models.CharField(max_length=100, blank=True, null=True)
    examiner_position = models.CharField(max_length=100, blank=True, null=True)
    examiner_license = models.CharField(max_length=50, blank=True, null=True)
    examiner_ptr = models.CharField(max_length=50, blank=True, null=True)
    examiner_phone = models.CharField(max_length=20, blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    
    # Tooth Status (JSON field to store tooth-specific data)
    permanent_teeth_status = models.JSONField(blank=True, null=True, help_text='Status of permanent teeth')
    temporary_teeth_status = models.JSONField(blank=True, null=True, help_text='Status of temporary teeth')
    
    # Medicine Usage (JSON field to store medicine usage data)
    used_medicines = models.JSONField(blank=True, null=True, help_text='List of medicines used during the appointment')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['patient', 'appointment']
    
    def __str__(self):
        return f"Dental Form for {self.patient.name} - {self.created_at.strftime('%Y-%m-%d')}"
    
    def save(self, *args, **kwargs):
        # Auto-fill patient information from associated Patient record
        if self.patient:
            # Auto-fill surname (last name)
            if not self.surname and self.patient.user and self.patient.user.last_name:
                self.surname = self.patient.user.last_name
            
            # Auto-fill first_name
            if not self.first_name:
                if self.patient.first_name:
                    self.first_name = self.patient.first_name
                elif self.patient.user and self.patient.user.first_name:
                    self.first_name = self.patient.user.first_name
            
            # Auto-fill middle_name
            if not self.middle_name:
                if self.patient.middle_name:
                    self.middle_name = self.patient.middle_name
                elif self.patient.user and self.patient.user.middle_name:
                    self.middle_name = self.patient.user.middle_name
            
            # Auto-fill age
            if not self.age:
                if self.patient.age:
                    self.age = self.patient.age
                elif self.patient.date_of_birth:
                    from django.utils import timezone
                    self.age = (timezone.now().date() - self.patient.date_of_birth).days // 365
            
            # Auto-fill sex/gender
            if not self.sex and self.patient.gender:
                # Map patient gender to dental form sex field, handling 'Other' case
                if self.patient.gender == 'Other':
                    self.sex = 'Male'  # Default fallback
                else:
                    self.sex = self.patient.gender
        
        # Auto-set academic year if not provided
        if not self.academic_year:
            if self.appointment and self.appointment.school_year:
                self.academic_year = self.appointment.school_year
            elif self.patient and self.patient.school_year:
                self.academic_year = self.patient.school_year
            else:
                # Try to get current academic year as fallback
                try:
                    self.academic_year = AcademicSchoolYear.objects.get(is_current=True)
                except AcademicSchoolYear.DoesNotExist:
                    pass
        
        # Auto-generate file number if not provided
        if not self.file_no:
            if self.appointment:
                self.file_no = f"DN-{self.patient.student_id}-{self.appointment.id}"
            else:
                self.file_no = f"DN-{self.patient.student_id}-{self.id}"
        
        # Mark appointment as completed when dental form is saved
        if self.appointment and self.appointment.status != 'completed':
            self.appointment.status = 'completed'
            self.appointment.save()
        
        super().save(*args, **kwargs)


class MedicalFormData(models.Model):
    BLOOD_PRESSURE_CHOICES = [
        ('Normal', 'Normal'),
        ('High', 'High'),
        ('Low', 'Low'),
    ]
    PULSE_RATE_CHOICES = [
        ('Normal', 'Normal'),
        ('Fast', 'Fast'),
        ('Slow', 'Slow'),
    ]
    TEMPERATURE_CHOICES = [
        ('Normal', 'Normal'),
        ('Fever', 'Fever'),
        ('Hypothermia', 'Hypothermia'),
    ]
    
    # Patient Information (auto-filled from Patient model)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_forms')
    appointment = models.ForeignKey(Appointment, on_delete=models.CASCADE, related_name='medical_form_data', null=True, blank=True)
    academic_year = models.ForeignKey('AcademicSchoolYear', on_delete=models.SET_NULL, null=True, blank=True, related_name='medical_forms')
    
    # Patient Basic Info
    file_no = models.CharField(max_length=50, blank=True, null=True)
    surname = models.CharField(max_length=100, blank=True, null=True)
    first_name = models.CharField(max_length=100, blank=True, null=True)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    age = models.IntegerField(blank=True, null=True)
    sex = models.CharField(max_length=10, blank=True, null=True)
    
    # Vital Signs
    blood_pressure = models.CharField(max_length=20, blank=True, null=True)
    pulse_rate = models.CharField(max_length=20, blank=True, null=True)
    temperature = models.CharField(max_length=20, blank=True, null=True)
    respiratory_rate = models.CharField(max_length=20, blank=True, null=True)
    weight = models.CharField(max_length=20, blank=True, null=True)
    height = models.CharField(max_length=20, blank=True, null=True)
    
    # Medical History
    chief_complaint = models.TextField(blank=True, null=True)
    present_illness = models.TextField(blank=True, null=True)
    past_medical_history = models.TextField(blank=True, null=True)
    family_history = models.TextField(blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    medications = models.TextField(blank=True, null=True)
    
    # Physical Examination
    general_appearance = models.TextField(blank=True, null=True)
    heent = models.TextField(blank=True, null=True, help_text='Head, Eyes, Ears, Nose, Throat')
    cardiovascular = models.TextField(blank=True, null=True)
    respiratory = models.TextField(blank=True, null=True)
    gastrointestinal = models.TextField(blank=True, null=True)
    genitourinary = models.TextField(blank=True, null=True)
    neurological = models.TextField(blank=True, null=True)
    musculoskeletal = models.TextField(blank=True, null=True)
    integumentary = models.TextField(blank=True, null=True)
    
    # Assessment and Plan
    diagnosis = models.TextField(blank=True, null=True)
    treatment_plan = models.TextField(blank=True, null=True)
    recommendations = models.TextField(blank=True, null=True)
    follow_up = models.TextField(blank=True, null=True)
    
    # Examiner Information
    examined_by = models.CharField(max_length=100, blank=True, null=True)
    examiner_license = models.CharField(max_length=50, blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['patient', 'appointment']
    
    def __str__(self):
        return f"Medical Form for {self.patient.name} - {self.created_at.strftime('%Y-%m-%d')}"
    
    def save(self, *args, **kwargs):
        # Auto-fill patient information from associated Patient record
        if self.patient:
            # Auto-fill surname (last name)
            if not self.surname and self.patient.user and self.patient.user.last_name:
                self.surname = self.patient.user.last_name
            
            # Auto-fill first_name
            if not self.first_name:
                if self.patient.first_name:
                    self.first_name = self.patient.first_name
                elif self.patient.user and self.patient.user.first_name:
                    self.first_name = self.patient.user.first_name
            
            # Auto-fill middle_name
            if not self.middle_name:
                if self.patient.middle_name:
                    self.middle_name = self.patient.middle_name
                elif self.patient.user and self.patient.user.middle_name:
                    self.middle_name = self.patient.user.middle_name
            
            # Auto-fill age
            if not self.age:
                if self.patient.age:
                    self.age = self.patient.age
                elif self.patient.date_of_birth:
                    from django.utils import timezone
                    self.age = (timezone.now().date() - self.patient.date_of_birth).days // 365
            
            # Auto-fill sex/gender
            if not self.sex and self.patient.gender:
                # Map patient gender to medical form sex field, handling 'Other' case
                if self.patient.gender == 'Other':
                    self.sex = 'Male'  # Default fallback
                else:
                    self.sex = self.patient.gender
        
        # Auto-set academic year if not provided
        if not self.academic_year:
            if self.appointment and self.appointment.school_year:
                self.academic_year = self.appointment.school_year
            elif self.patient and self.patient.school_year:
                self.academic_year = self.patient.school_year
            else:
                # Try to get current academic year as fallback
                try:
                    self.academic_year = AcademicSchoolYear.objects.get(is_current=True)
                except AcademicSchoolYear.DoesNotExist:
                    pass
        
        # Auto-generate file number if not provided
        if not self.file_no:
            if self.appointment:
                self.file_no = f"MD-{self.patient.student_id}-{self.appointment.id}"
            else:
                self.file_no = f"MD-{self.patient.student_id}-{self.id or 'new'}"
        super().save(*args, **kwargs)


class SystemConfiguration(models.Model):
    """Single instance model to store system-wide configuration"""
    profile_requirements = models.JSONField(default=dict, help_text='Profile setup requirements configuration')
    document_requirements = models.JSONField(default=dict, help_text='Medical document requirements configuration')
    campus_schedules = models.JSONField(default=dict, help_text='Campus operating schedules')
    dentist_schedules = models.JSONField(default=dict, help_text='Dentist availability schedules')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        verbose_name = 'System Configuration'
        verbose_name_plural = 'System Configuration'
    
    def __str__(self):
        return f"System Configuration (Updated: {self.updated_at.strftime('%Y-%m-%d %H:%M')})"
    
    @classmethod
    def get_config(cls):
        """Get or create the system configuration"""
        config, created = cls.objects.get_or_create(id=1)
        return config


class ProfileRequirement(models.Model):
    """Individual profile requirements that can be toggled"""
    CATEGORY_CHOICES = [
        ('personal', 'Personal Information'),
        ('health', 'Health Information'),
        ('emergency', 'Emergency Contact'),
        ('family', 'Family History'),
    ]
    
    field_name = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    is_required = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['category', 'display_name']
    
    def __str__(self):
        return f"{self.display_name} ({'Required' if self.is_required else 'Optional'})"


class DocumentRequirement(models.Model):
    """Medical document requirements configuration"""
    field_name = models.CharField(max_length=100, unique=True)
    display_name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_required = models.BooleanField(default=True)
    validity_period_months = models.IntegerField(default=6, help_text='Document validity in months')
    specific_courses = models.JSONField(default=list, help_text='List of courses that require this document')
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['display_name']
    
    def __str__(self):
        return f"{self.display_name} ({'Required' if self.is_required else 'Optional'})"


class CampusSchedule(models.Model):
    """Campus operating hours configuration"""
    CAMPUS_CHOICES = [
        ('a', 'Campus A'),
        ('b', 'Campus B'),
        ('c', 'Campus C'),
    ]
    
    campus = models.CharField(max_length=20, choices=CAMPUS_CHOICES, unique=True)
    open_time = models.TimeField()
    close_time = models.TimeField()
    operating_days = models.JSONField(default=list, help_text='List of operating days')
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['campus']
    
    def __str__(self):
        return f"{self.get_campus_display()} - {self.open_time} to {self.close_time}"


class DentistSchedule(models.Model):
    """Dentist availability schedule configuration"""
    CAMPUS_CHOICES = [
        ('a', 'Campus A'),
        ('b', 'Campus B'),
        ('c', 'Campus C'),
    ]
    
    dentist_name = models.CharField(max_length=200)
    campus = models.CharField(max_length=20, choices=CAMPUS_CHOICES)
    available_days = models.JSONField(default=list, help_text='List of available days')
    time_slots = models.JSONField(default=list, help_text='List of available time slots')
    is_active = models.BooleanField(default=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['campus', 'dentist_name']
        unique_together = ['dentist_name', 'campus']
    
    def __str__(self):
        return f"Dr. {self.dentist_name} - {self.get_campus_display()}"


class AcademicSchoolYear(models.Model):
    """Academic school year model for health services system"""
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('upcoming', 'Upcoming'),
        ('completed', 'Completed'),
    ]
    
    academic_year = models.CharField(max_length=20, help_text='e.g., "2025-2026"')
    start_date = models.DateField()
    end_date = models.DateField()
    is_current = models.BooleanField(default=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='upcoming')
    
    # Semester periods
    first_sem_start = models.DateField(help_text='First semester start date', null=True, blank=True)
    first_sem_end = models.DateField(help_text='First semester end date', null=True, blank=True)
    second_sem_start = models.DateField(help_text='Second semester start date', null=True, blank=True)
    second_sem_end = models.DateField(help_text='Second semester end date', null=True, blank=True)
    summer_start = models.DateField(help_text='Summer semester start date', null=True, blank=True)
    summer_end = models.DateField(help_text='Summer semester end date', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'api_academicschoolyear'  # Updated table name
        ordering = ['-academic_year']
    
    def __str__(self):
        return f"{self.academic_year}"
    
    def save(self, *args, **kwargs):
        """Ensure only one current academic school year and validate semester dates"""
        # Validate semester dates if they are provided
        if self.first_sem_start and self.first_sem_end:
            if self.first_sem_start >= self.first_sem_end:
                raise ValueError("First semester start date must be before end date")
        
        if self.second_sem_start and self.second_sem_end:
            if self.second_sem_start >= self.second_sem_end:
                raise ValueError("Second semester start date must be before end date")
        
        if self.summer_start and self.summer_end:
            if self.summer_start >= self.summer_end:
                raise ValueError("Summer semester start date must be before end date")
        
        # Ensure semester periods don't overlap (if all dates are provided)
        if (self.first_sem_end and self.second_sem_start and 
            self.first_sem_end >= self.second_sem_start):
            raise ValueError("First semester must end before second semester starts")
        
        if (self.second_sem_end and self.summer_start and 
            self.second_sem_end >= self.summer_start):
            raise ValueError("Second semester must end before summer semester starts")
        
        # Update overall start and end dates based on semesters (if semester dates are provided)
        if self.first_sem_start:
            self.start_date = self.first_sem_start
        if self.summer_end:
            self.end_date = self.summer_end
        
        if self.is_current:
            # Set all other academic school years to not current
            AcademicSchoolYear.objects.filter(is_current=True).exclude(pk=self.pk).update(is_current=False)
        super().save(*args, **kwargs)

    def get_current_semester(self):
        """Get the current semester based on today's date"""
        from django.utils import timezone
        today = timezone.now().date()
        
        # Check if semester dates are configured
        if not all([self.first_sem_start, self.first_sem_end, 
                   self.second_sem_start, self.second_sem_end,
                   self.summer_start, self.summer_end]):
            return None
        
        if self.first_sem_start <= today <= self.first_sem_end:
            return '1st_semester'
        elif self.second_sem_start <= today <= self.second_sem_end:
            return '2nd_semester'
        elif self.summer_start <= today <= self.summer_end:
            return 'summer'
        else:
            return None
    
    def get_semester_display(self):
        """Get human-readable current semester"""
        semester = self.get_current_semester()
        if semester == '1st_semester':
            return 'First Semester'
        elif semester == '2nd_semester':
            return 'Second Semester'
        elif semester == 'summer':
            return 'Summer Semester'
        else:
            return 'Not in session' if semester is None else 'Semester dates not configured'
    
    def get_semester_dates(self, semester):
        """Get start and end dates for a specific semester"""
        if semester == '1st_semester':
            return self.first_sem_start, self.first_sem_end
        elif semester == '2nd_semester':
            return self.second_sem_start, self.second_sem_end
        elif semester == 'summer':
            return self.summer_start, self.summer_end
        else:
            return None, None

    @classmethod
    def get_current_school_year(cls):
        """Get the current active school year"""
        try:
            return cls.objects.get(is_current=True)
        except cls.DoesNotExist:
            # Try to find the most recent active school year
            school_year = cls.objects.filter(status='active').first()
            if school_year:
                school_year.is_current = True
                school_year.save()
                return school_year
            return None


class ComorbidIllness(models.Model):
    """Configurable comorbid illnesses for patient profiles"""
    label = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    is_enabled = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['display_order', 'label']
    
    def __str__(self):
        return self.label


class Vaccination(models.Model):
    """Configurable vaccination types for patient profiles"""
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    is_enabled = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['display_order', 'name']
    
    def __str__(self):
        return self.name


class PastMedicalHistoryItem(models.Model):
    """Configurable past medical history items for patient profiles"""
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    is_enabled = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['display_order', 'name']
    
    def __str__(self):
        return self.name


class FamilyMedicalHistoryItem(models.Model):
    """Configurable family medical history items for patient profiles"""
    name = models.CharField(max_length=200, unique=True)
    description = models.TextField(blank=True)
    is_enabled = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['display_order', 'name']
    
    def __str__(self):
        return self.name


class DentalInformationRecord(models.Model):
    """Model to store dental patient information records"""
    # Patient relation
    patient = models.ForeignKey(
        'Patient', 
        on_delete=models.CASCADE, 
        related_name='dental_information_records'
    )
    
    # School year and semester tracking
    school_year = models.ForeignKey(
        'AcademicSchoolYear', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    semester = models.CharField(
        max_length=20,
        choices=[
            ('1st_semester', 'First Semester'),
            ('2nd_semester', 'Second Semester'),
            ('summer', 'Summer'),
        ],
        default='1st_semester'
    )
    
    # Personal Information
    patient_name = models.CharField(max_length=255)
    age = models.IntegerField()
    sex = models.CharField(max_length=20)  # Changed from gender to sex
    
    # Education Information
    education_level = models.CharField(
        max_length=50,
        choices=[
            ('preschool', 'Preschool'),
            ('elementary', 'Elementary'),
            ('high_school', 'High School'),
            ('senior_high', 'Senior High School'),
            ('college', 'College'),
        ],
        blank=True,
        null=True
    )
    year_level = models.CharField(max_length=50, blank=True, null=True)
    course = models.CharField(max_length=200, blank=True, null=True)
    
    # Legacy field for backwards compatibility
    year_section = models.CharField(max_length=100, blank=True, null=True)
    
    date = models.DateField()
    
    # Dental History
    name_of_previous_dentist = models.CharField(max_length=255, blank=True, null=True)
    last_dental_visit = models.CharField(max_length=255, blank=True, null=True)
    date_of_last_cleaning = models.CharField(max_length=255, blank=True, null=True)
    
    # Medical History - Yes/No Questions
    oral_hygiene_instructions = models.BooleanField(null=True, blank=True)
    gums_bleed_brushing = models.BooleanField(null=True, blank=True)
    teeth_sensitive_hot_cold = models.BooleanField(null=True, blank=True)
    feel_pain_teeth = models.BooleanField(null=True, blank=True)
    difficult_extractions_past = models.BooleanField(null=True, blank=True)
    orthodontic_treatment = models.BooleanField(null=True, blank=True)
    prolonged_bleeding_extractions = models.BooleanField(null=True, blank=True)
    frequent_headaches = models.BooleanField(null=True, blank=True)
    clench_grind_teeth = models.BooleanField(null=True, blank=True)
    allergic_to_following = models.BooleanField(null=True, blank=True)
    
    # Specific allergic items
    allergic_penicillin = models.BooleanField(default=False)
    allergic_amoxicillin = models.BooleanField(default=False)
    allergic_local_anesthetic = models.BooleanField(default=False)
    allergic_sulfa_drugs = models.BooleanField(default=False)
    allergic_latex = models.BooleanField(default=False)
    allergic_others = models.CharField(max_length=255, blank=True, null=True)
    
    # Women Only
    is_woman = models.BooleanField(default=False)
    menstruation_today = models.BooleanField(null=True, blank=True)
    pregnant = models.BooleanField(null=True, blank=True)
    taking_birth_control = models.BooleanField(null=True, blank=True)
    
    # Additional Medical Questions
    smoke = models.BooleanField(null=True, blank=True)
    under_medical_treatment = models.BooleanField(null=True, blank=True)
    medical_treatment_condition = models.CharField(max_length=255, blank=True, null=True)
    hospitalized = models.BooleanField(null=True, blank=True)
    hospitalization_when_why = models.CharField(max_length=255, blank=True, null=True)
    taking_prescription_medication = models.BooleanField(null=True, blank=True)
    prescription_medication_details = models.CharField(max_length=255, blank=True, null=True)
    
    # Medical Conditions Checkboxes
    high_blood_pressure = models.BooleanField(default=False)
    low_blood_pressure = models.BooleanField(default=False)
    epilepsy_convulsions = models.BooleanField(default=False)
    aids_hiv_positive = models.BooleanField(default=False)
    sexually_transmitted_disease = models.BooleanField(default=False)
    stomach_trouble_ulcers = models.BooleanField(default=False)
    fainting_seizure = models.BooleanField(default=False)
    rapid_weight_loss = models.BooleanField(default=False)
    radiation_therapy = models.BooleanField(default=False)
    joint_replacement_implant = models.BooleanField(default=False)
    heart_surgery = models.BooleanField(default=False)
    heart_attack = models.BooleanField(default=False)
    thyroid_problem = models.BooleanField(default=False)
    heart_disease = models.BooleanField(default=False)
    heart_murmur = models.BooleanField(default=False)
    hepatitis_liver_disease = models.BooleanField(default=False)
    rheumatic_fever = models.BooleanField(default=False)
    hay_fever_allergies = models.BooleanField(default=False)
    respiratory_problems = models.BooleanField(default=False)
    hepatitis_jaundice = models.BooleanField(default=False)
    tuberculosis = models.BooleanField(default=False)
    swollen_ankles = models.BooleanField(default=False)
    kidney_disease = models.BooleanField(default=False)
    diabetes = models.BooleanField(default=False)
    chest_pain = models.BooleanField(default=False)
    stroke = models.BooleanField(default=False)
    cancer_tumors = models.BooleanField(default=False)
    anemia = models.BooleanField(default=False)
    angina = models.BooleanField(default=False)
    asthma = models.BooleanField(default=False)
    emphysema = models.BooleanField(default=False)
    blood_diseases = models.BooleanField(default=False)
    head_injuries = models.BooleanField(default=False)
    arthritis_rheumatism = models.BooleanField(default=False)
    other_conditions = models.CharField(max_length=255, blank=True, null=True)
    
    # Signature fields
    patient_signature = models.CharField(max_length=255, blank=True, null=True)
    signature_date = models.DateField()
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['patient', 'school_year', 'semester']
    
    def __str__(self):
        semester_display = dict(self._meta.get_field('semester').choices).get(self.semester, self.semester)
        return f"{self.patient_name} - {self.school_year.academic_year if self.school_year else 'No Year'} {semester_display}"


class DentalMedicineSupply(models.Model):
    """Model for dental medicines and supplies that can be used in dental forms"""
    
    TYPE_CHOICES = [
        ('medicine', 'Medicine'),
        ('anesthetic', 'Anesthetic'),
        ('antibiotic', 'Antibiotic'),
        ('dental_supply', 'Dental Supply'),
        ('equipment', 'Equipment'),
        ('material', 'Material'),
    ]
    
    name = models.CharField(max_length=100, help_text='Name of the medicine or supply')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='medicine')
    description = models.TextField(blank=True, null=True, help_text='Description or notes about the item')
    unit = models.CharField(max_length=20, default='pcs', help_text='Unit of measurement (e.g., mg, ml, pcs)')
    is_active = models.BooleanField(default=True, help_text='Whether this item is available for use')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['type', 'name']
        verbose_name = 'Dental Medicine/Supply'
        verbose_name_plural = 'Dental Medicines/Supplies'
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
