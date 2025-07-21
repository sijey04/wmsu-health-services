from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from .models import (
    CustomUser, Patient, MedicalRecord, Appointment, Inventory, Waiver, DentalWaiver,
    MedicalDocument, DentalFormData, MedicalFormData, StaffDetails,
    SystemConfiguration, ProfileRequirement, DocumentRequirement, 
    CampusSchedule, DentistSchedule, AcademicSchoolYear,
    ComorbidIllness, Vaccination, PastMedicalHistoryItem, FamilyMedicalHistoryItem,
    DentalInformationRecord, DentalMedicineSupply
)


class UserSerializer(serializers.ModelSerializer):
    patient_profile = serializers.PrimaryKeyRelatedField(read_only=True)
    blocked_by_name = serializers.CharField(source='blocked_by.get_full_name', read_only=True)
    can_book_consultation = serializers.ReadOnlyField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'middle_name', 'last_name', 'is_staff',
            'grade_level', 'is_email_verified', 'user_type', 'patient_profile',
            'is_blocked', 'blocked_at', 'blocked_by', 'blocked_by_name', 'block_reason',
            'can_book_consultation'
        ]
        extra_kwargs = {'password': {'write_only': True}}


class SignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    user_type = serializers.ChoiceField(choices=[('student', 'Student'), ('staff', 'Staff'), ('admin', 'Admin')], default='student')
    
    class Meta:
        model = CustomUser
        fields = ['email', 'username', 'password', 'confirm_password', 'first_name', 'middle_name', 'last_name', 'grade_level', 'user_type']

    
    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        middle_name = validated_data.pop('middle_name', None)
        
        # Set is_staff for staff/admin users
        if validated_data.get('user_type') in ['staff', 'admin']:
            validated_data['is_staff'] = True

        user = CustomUser.objects.create_user(**validated_data)
        if middle_name is not None:
            user.middle_name = middle_name
        
        # Send verification email instead of auto-verifying
        user.send_verification_email()
        user.save()
        
        # Automatically create a Patient profile for students
        if user.user_type == 'student':
            # Try to get current school year
            try:
                from .models import AcademicSchoolYear
                current_school_year = AcademicSchoolYear.objects.get(is_current=True)
            except AcademicSchoolYear.DoesNotExist:
                current_school_year = None
            
            Patient.objects.create(
                user=user,
                student_id=f"TEMP-{user.id}",  # Temporary unique student_id
                name=f"{user.last_name}, {user.first_name}",
                gender='Other',  # Placeholder, to be updated later
                age=0,           # Placeholder, to be updated later
                department=user.grade_level or '',   # Use grade_level
                contact_number='', # Placeholder
                school_year=current_school_year,  # Assign current school year if available
            )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(username=email, password=password)
            if not user:
                raise serializers.ValidationError('Invalid email or password')
            if not user.is_email_verified:
                raise serializers.ValidationError('Please verify your email before logging in')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include email and password')
        
        return attrs


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField()


class PatientSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_first_name = serializers.CharField(source='user.first_name', read_only=True)
    user_middle_name = serializers.CharField(source='user.middle_name', read_only=True)
    user_last_name = serializers.CharField(source='user.last_name', read_only=True)
    
    class Meta:
        model = Patient
        fields = [
            'id', 'user', 'student_id', 'name', 'first_name', 'middle_name', 'suffix',
            'photo', 'gender', 'date_of_birth', 'age', 'department', 'contact_number',
            'email', 'address', 'city_municipality', 'barangay', 'street', 'blood_type', 'religion', 
            'nationality', 'civil_status', 'emergency_contact_surname', 
            'emergency_contact_first_name', 'emergency_contact_middle_name',
            'emergency_contact_number', 'emergency_contact_relationship',
            'emergency_contact_address', 'emergency_contact_barangay', 'emergency_contact_street', 
            'comorbid_illnesses', 'maintenance_medications', 'vaccination_history', 'past_medical_history', 
            'hospital_admission_or_surgery', 'hospital_admission_details', 'hospital_admission_year',
            'family_medical_history', 'allergies', 'created_at', 'updated_at', 'user_email', 'user_name', 'user_first_name', 
            'user_middle_name', 'user_last_name', 'school_year',
            # Menstrual & Obstetric History
            'menstruation_age_began', 'menstruation_regular', 'menstruation_irregular', 
            'number_of_pregnancies', 'number_of_live_children', 'menstrual_symptoms',
            # User type fields
            'user_type', 'employee_id', 'position_type', 'course', 'year_level', 'strand'
        ]


class MedicalRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    
    class Meta:
        model = MedicalRecord
        fields = '__all__'


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)
    rescheduled_by_name = serializers.CharField(source='rescheduled_by.get_full_name', read_only=True)
    was_rescheduled_by_admin = serializers.ReadOnlyField()
    was_rescheduled_by_patient = serializers.ReadOnlyField()
    has_form_data = serializers.SerializerMethodField()
    form_type = serializers.SerializerMethodField()
    has_medical_certificate = serializers.SerializerMethodField()
    medical_certificate_url = serializers.SerializerMethodField()
    semester_display = serializers.CharField(source='get_semester_display', read_only=True)
    school_year_display = serializers.CharField(source='school_year.academic_year', read_only=True)
    
    class Meta:
        model = Appointment
        fields = '__all__'
    
    def get_has_form_data(self, obj):
        """Check if appointment has associated form data"""
        if obj.type == 'dental':
            return obj.dental_form_data.exists()
        elif obj.type == 'medical':
            return obj.medical_form_data.exists()
        return False
    
    def get_form_type(self, obj):
        """Get the form type for the appointment"""
        if obj.type == 'dental' and obj.dental_form_data.exists():
            return 'dental'
        elif obj.type == 'medical' and obj.medical_form_data.exists():
            return 'medical'
        return None
    
    def get_has_medical_certificate(self, obj):
        """Check if appointment has an associated medical certificate"""
        if obj.patient:
            # Check if patient has an issued medical certificate for the same academic year
            from .models import MedicalDocument
            try:
                # First, try to find by exact academic year match
                medical_doc = None
                if obj.school_year:
                    medical_doc = MedicalDocument.objects.filter(
                        patient=obj.patient,
                        status='issued',
                        academic_year=obj.school_year
                    ).first()
                
                # If no exact match and school_year is not set, try to find any issued certificate for this patient
                if not medical_doc:
                    medical_doc = MedicalDocument.objects.filter(
                        patient=obj.patient,
                        status='issued'
                    ).first()
                
                return medical_doc is not None and bool(medical_doc.medical_certificate)
            except Exception as e:
                # Log the error for debugging
                print(f"Error checking medical certificate for appointment {obj.id}: {e}")
                return False
        return False
    
    def get_medical_certificate_url(self, obj):
        """Get the URL for the medical certificate if available"""
        if obj.patient:
            # Check if patient has an issued medical certificate for the same academic year
            from .models import MedicalDocument
            try:
                # First, try to find by exact academic year match
                medical_doc = None
                if obj.school_year:
                    medical_doc = MedicalDocument.objects.filter(
                        patient=obj.patient,
                        status='issued',
                        academic_year=obj.school_year
                    ).first()
                
                # If no exact match and school_year is not set, try to find any issued certificate for this patient
                if not medical_doc:
                    medical_doc = MedicalDocument.objects.filter(
                        patient=obj.patient,
                        status='issued'
                    ).first()
                
                if medical_doc and medical_doc.medical_certificate:
                    return medical_doc.medical_certificate.url
            except Exception as e:
                # Log the error for debugging
                print(f"Error getting medical certificate URL for appointment {obj.id}: {e}")
                pass
        return None


class InventorySerializer(serializers.ModelSerializer):
    last_restocked_by_name = serializers.CharField(source='last_restocked_by.get_full_name', read_only=True)
    
    class Meta:
        model = Inventory
        fields = '__all__'


class WaiverSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    class Meta:
        model = Waiver
        fields = '__all__'

    def validate(self, attrs):
        user = self.context['request'].user
        if Waiver.objects.filter(user=user).exists():
            raise serializers.ValidationError('You have already signed a waiver.')
        return attrs


class DentalWaiverSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = DentalWaiver
        fields = '__all__'

    def validate(self, attrs):
        user = self.context['request'].user
        if DentalWaiver.objects.filter(user=user).exists():
            raise serializers.ValidationError('You have already signed a dental informed consent waiver.')
        return attrs


class PatientProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = [
            'id', 'student_id', 'name', 'first_name', 'middle_name', 'suffix', 'photo',
            'gender', 'date_of_birth', 'age', 'department', 'contact_number', 'email',
            'address', 'city_municipality', 'barangay', 'street', 'blood_type', 'religion', 'nationality', 'civil_status',
            # Emergency contact
            'emergency_contact_surname', 'emergency_contact_first_name', 'emergency_contact_middle_name',
            'emergency_contact_number', 'emergency_contact_relationship', 'emergency_contact_address', 'emergency_contact_barangay', 'emergency_contact_street',
            # Health history
            'comorbid_illnesses', 'maintenance_medications', 'vaccination_history',
            # Past medical/surgical history
            'past_medical_history', 'hospital_admission_or_surgery', 'hospital_admission_details', 'hospital_admission_year',
            # Menstrual & Obstetric History (for females)
            'menstruation_age_began', 'menstruation_regular', 'menstruation_irregular', 
            'number_of_pregnancies', 'number_of_live_children', 'menstrual_symptoms',
            # Family medical history
            'family_medical_history', 'allergies',
            # School year
            'school_year',
            # User type fields
            'user_type', 'employee_id', 'position_type', 'course', 'year_level', 'strand'
        ]

    def validate(self, attrs):
        """Validate required fields and "Other" specifications"""
        # Hospital admission details validation
        if attrs.get('hospital_admission_or_surgery') is True:
            if not attrs.get('hospital_admission_details'):
                raise serializers.ValidationError({
                    'hospital_admission_details': 'Please provide details when hospital admission or surgery is "Yes".'
                })
            if not attrs.get('hospital_admission_year'):
                raise serializers.ValidationError({
                    'hospital_admission_year': 'Please provide the year when hospital admission or surgery occurred.'
                })
        
        return attrs

    def validate_comorbid_illnesses(self, value):
        """Validate comorbid illnesses and handle 'Other' specifications"""
        if not isinstance(value, list):
            return value
        
        # Check if list contains objects with 'other' specifications
        validated_illnesses = []
        for illness in value:
            if isinstance(illness, dict):
                # Handle object format: {"name": "Other", "specify": "custom illness"}
                if illness.get('name') == 'Other' and not illness.get('specify'):
                    raise serializers.ValidationError("Please specify the other comorbid illness.")
                validated_illnesses.append(illness)
            else:
                # Handle string format
                validated_illnesses.append(illness)
        
        return validated_illnesses

    def validate_past_medical_history(self, value):
        """Validate past medical history and handle 'Other' specifications"""
        if not isinstance(value, list):
            return value
        
        validated_history = []
        for item in value:
            if isinstance(item, dict):
                # Handle object format: {"name": "Other", "specify": "custom history"}
                if item.get('name') == 'Other' and not item.get('specify'):
                    raise serializers.ValidationError("Please specify the other past medical history.")
                validated_history.append(item)
            else:
                # Handle string format
                validated_history.append(item)
        
        return validated_history

    def validate_family_medical_history(self, value):
        """Validate family medical history and handle 'Other' specifications"""
        if not isinstance(value, list):
            return value
        
        validated_history = []
        for item in value:
            if isinstance(item, dict):
                # Handle object format: {"name": "Other", "specify": "custom history"}
                # or {"name": "Allergies - Specify", "specify": "specific allergies"}
                if item.get('name') in ['Other', 'Allergies - Specify'] and not item.get('specify'):
                    field_name = "other family medical history" if item.get('name') == 'Other' else "family allergies"
                    raise serializers.ValidationError(f"Please specify the {field_name}.")
                validated_history.append(item)
            else:
                # Handle string format
                validated_history.append(item)
        
        return validated_history

    def validate_religion(self, value):
        """Validate religion field and handle 'Other' specification"""
        if isinstance(value, dict):
            if value.get('name') == 'Other' and not value.get('specify'):
                raise serializers.ValidationError("Please specify the religion when 'Other' is selected.")
        elif value == 'Other':
            raise serializers.ValidationError("Please specify the religion when 'Other' is selected.")
        return value

    def validate_nationality(self, value):
        """Validate nationality field and handle 'Other' specification"""
        if isinstance(value, dict):
            if value.get('name') == 'Other' and not value.get('specify'):
                raise serializers.ValidationError("Please specify the nationality when 'Other' is selected.")
        elif value == 'Other':
            raise serializers.ValidationError("Please specify the nationality when 'Other' is selected.")
        return value

    def validate_civil_status(self, value):
        """Validate civil status field and handle 'Other' specification"""
        if isinstance(value, dict):
            if value.get('name') == 'other' and not value.get('specify'):
                raise serializers.ValidationError("Please specify the civil status when 'Other' is selected.")
        elif value == 'other':
            raise serializers.ValidationError("Please specify the civil status when 'Other' is selected.")
        return value

    def save(self, **kwargs):
        # Automatically combine address fields for backward compatibility
        instance = super().save(**kwargs)
        
        # If the new address fields are provided, combine them into the address field
        if instance.city_municipality or instance.barangay or instance.street:
            address_parts = []
            if instance.street:
                address_parts.append(instance.street)
            if instance.barangay:
                address_parts.append(instance.barangay)
            if instance.city_municipality:
                address_parts.append(instance.city_municipality)
            
            combined_address = ', '.join(filter(None, address_parts))
            if combined_address and combined_address != instance.address:
                instance.address = combined_address
                instance.save(update_fields=['address'])
        
        # Combine emergency contact address fields
        if instance.emergency_contact_barangay or instance.emergency_contact_street:
            emergency_address_parts = []
            if instance.emergency_contact_street:
                emergency_address_parts.append(instance.emergency_contact_street)
            if instance.emergency_contact_barangay:
                emergency_address_parts.append(instance.emergency_contact_barangay)
            # Always append "Zamboanga City" for emergency contacts
            emergency_address_parts.append("Zamboanga City")
            
            combined_emergency_address = ', '.join(filter(None, emergency_address_parts))
            if combined_emergency_address and combined_emergency_address != instance.emergency_contact_address:
                instance.emergency_contact_address = combined_emergency_address
                instance.save(update_fields=['emergency_contact_address'])
        
        return instance


class MedicalDocumentSerializer(serializers.ModelSerializer):
    chest_xray = serializers.FileField(use_url=True, required=False, allow_null=True)
    cbc = serializers.FileField(use_url=True, required=False, allow_null=True)
    blood_typing = serializers.FileField(use_url=True, required=False, allow_null=True)
    urinalysis = serializers.FileField(use_url=True, required=False, allow_null=True)
    drug_test = serializers.FileField(use_url=True, required=False, allow_null=True)
    hepa_b = serializers.FileField(use_url=True, required=False, allow_null=True)
    medical_certificate = serializers.FileField(use_url=True, required=False, allow_null=True)
    
    # Make patient field not required for creation (it will be set automatically in perform_create)
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.all(), required=False, allow_null=True)
    
    # Add computed properties
    is_complete = serializers.ReadOnlyField()
    completion_percentage = serializers.ReadOnlyField()
    
    # Add basic patient fields
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_display = serializers.CharField(source='patient.name', read_only=True)
    patient_student_id = serializers.CharField(source='patient.student_id', read_only=True)
    patient_department = serializers.CharField(source='patient.department', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.get_full_name', read_only=True)
    
    # Consultation advice fields
    consultation_reason = serializers.CharField(read_only=True)
    advised_for_consultation_by_name = serializers.CharField(source='advised_for_consultation_by.get_full_name', read_only=True)
    advised_for_consultation_at = serializers.DateTimeField(read_only=True)
    
    # Add comprehensive patient information from Patient table
    first_name = serializers.CharField(source='patient.first_name', read_only=True)
    middle_name = serializers.CharField(source='patient.middle_name', read_only=True)
    last_name = serializers.SerializerMethodField()
    name = serializers.CharField(source='patient.name', read_only=True)
    student_id = serializers.CharField(source='patient.student_id', read_only=True)
    email = serializers.CharField(source='patient.email', read_only=True)
    contact_number = serializers.CharField(source='patient.contact_number', read_only=True)
    phone = serializers.CharField(source='patient.contact_number', read_only=True)  # alias
    gender = serializers.CharField(source='patient.gender', read_only=True)
    photo = serializers.FileField(source='patient.photo', read_only=True, use_url=True)
    date_of_birth = serializers.DateField(source='patient.date_of_birth', read_only=True)
    age = serializers.IntegerField(source='patient.age', read_only=True)
    department = serializers.CharField(source='patient.department', read_only=True)
    address = serializers.SerializerMethodField()  # Concatenated address
    blood_type = serializers.CharField(source='patient.blood_type', read_only=True)
    religion = serializers.CharField(source='patient.religion', read_only=True)
    nationality = serializers.CharField(source='patient.nationality', read_only=True)
    civil_status = serializers.CharField(source='patient.civil_status', read_only=True)
    
    # Emergency contact information
    emergency_contact_first_name = serializers.CharField(source='patient.emergency_contact_first_name', read_only=True)
    emergency_contact_middle_name = serializers.CharField(source='patient.emergency_contact_middle_name', read_only=True)
    emergency_contact_surname = serializers.CharField(source='patient.emergency_contact_surname', read_only=True)
    emergency_contact_name = serializers.SerializerMethodField()
    emergency_contact_number = serializers.CharField(source='patient.emergency_contact_number', read_only=True)
    emergency_contact_phone = serializers.CharField(source='patient.emergency_contact_number', read_only=True)  # alias
    emergency_contact_relationship = serializers.CharField(source='patient.emergency_contact_relationship', read_only=True)
    emergency_contact_address = serializers.SerializerMethodField()  # Concatenated emergency contact address
    
    # Medical history information
    allergies = serializers.CharField(source='patient.allergies', read_only=True)
    medications = serializers.JSONField(source='patient.maintenance_medications', read_only=True)
    medical_conditions = serializers.JSONField(source='patient.comorbid_illnesses', read_only=True)
    past_medical_history = serializers.JSONField(source='patient.past_medical_history', read_only=True)
    family_medical_history = serializers.JSONField(source='patient.family_medical_history', read_only=True)
    vaccination_history = serializers.JSONField(source='patient.vaccination_history', read_only=True)
    hospital_admission_or_surgery = serializers.BooleanField(source='patient.hospital_admission_or_surgery', read_only=True)
    hospital_admission_details = serializers.CharField(source='patient.hospital_admission_details', read_only=True)
    
    def get_last_name(self, obj):
        if obj.patient and obj.patient.user:
            return obj.patient.user.last_name
        return obj.patient.name.split()[-1] if obj.patient and obj.patient.name else None
    
    def get_emergency_contact_name(self, obj):
        if obj.patient:
            parts = []
            if obj.patient.emergency_contact_first_name:
                parts.append(obj.patient.emergency_contact_first_name)
            if obj.patient.emergency_contact_middle_name:
                parts.append(obj.patient.emergency_contact_middle_name)
            if obj.patient.emergency_contact_surname:
                parts.append(obj.patient.emergency_contact_surname)
            return ' '.join(parts) if parts else None
        return None
    
    def get_address(self, obj):
        """Concatenate patient address fields"""
        if obj.patient:
            parts = []
            if obj.patient.street:
                parts.append(obj.patient.street)
            if obj.patient.barangay:
                parts.append(obj.patient.barangay)
            if obj.patient.city_municipality:
                parts.append(obj.patient.city_municipality)
            return ', '.join(parts) if parts else obj.patient.address
        return None
    
    def get_emergency_contact_address(self, obj):
        """Concatenate emergency contact address fields"""
        if obj.patient:
            parts = []
            if obj.patient.emergency_contact_street:
                parts.append(obj.patient.emergency_contact_street)
            if obj.patient.emergency_contact_barangay:
                parts.append(obj.patient.emergency_contact_barangay)
            return ', '.join(parts) if parts else obj.patient.emergency_contact_address
        return None
    
    class Meta:
        model = MedicalDocument
        # Use explicit fields instead of '__all__' to avoid issues with missing academic_year column
        fields = [
            'id', 'patient', 'chest_xray', 'cbc', 'blood_typing', 'urinalysis', 
            'drug_test', 'hepa_b', 'status', 'submitted_for_review', 'reviewed_by', 
            'reviewed_at', 'rejection_reason', 'medical_certificate', 'certificate_issued_at',
            'uploaded_at', 'updated_at', 'is_complete', 'completion_percentage',
            'patient_name', 'patient_display', 'patient_student_id', 'patient_department', 'reviewed_by_name',
            # Consultation advice fields
            'consultation_reason', 'advised_for_consultation_by_name', 'advised_for_consultation_at',
            # Patient information fields
            'first_name', 'middle_name', 'last_name', 'name', 'student_id', 'email', 
            'contact_number', 'phone', 'gender', 'photo', 'date_of_birth', 'age', 'department', 
            'address', 'blood_type', 'religion', 'nationality', 'civil_status',
            # Emergency contact fields
            'emergency_contact_first_name', 'emergency_contact_middle_name', 'emergency_contact_surname',
            'emergency_contact_name', 'emergency_contact_number', 'emergency_contact_phone',
            'emergency_contact_relationship', 'emergency_contact_address',
            # Medical history fields
            'allergies', 'medications', 'medical_conditions', 'past_medical_history', 
            'family_medical_history', 'vaccination_history', 'hospital_admission_or_surgery', 
            'hospital_admission_details'
        ]
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add computed properties to serialized data
        data['is_complete'] = instance.is_complete
        data['completion_percentage'] = instance.completion_percentage
        return data


class DentalFormDataSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_student_id = serializers.CharField(source='patient.student_id', read_only=True)
    patient_department = serializers.CharField(source='patient.department', read_only=True)
    patient_age = serializers.IntegerField(source='patient.age', read_only=True)
    patient_gender = serializers.CharField(source='patient.gender', read_only=True)
    appointment_id = serializers.IntegerField(source='appointment.id', read_only=True)
    appointment_date = serializers.DateField(source='appointment.appointment_date', read_only=True)
    appointment_time = serializers.TimeField(source='appointment.appointment_time', read_only=True)
    appointment_status = serializers.CharField(source='appointment.status', read_only=True)
    academic_year_display = serializers.CharField(source='academic_year.academic_year', read_only=True)
    
    class Meta:
        model = DentalFormData
        fields = '__all__'
    
    def validate_date(self, value):
        """Validate and parse date field"""
        if isinstance(value, str):
            from datetime import datetime
            try:
                # Try common date formats
                return datetime.strptime(value, '%Y-%m-%d').date()
            except ValueError:
                try:
                    return datetime.strptime(value, '%m/%d/%Y').date()
                except ValueError:
                    raise serializers.ValidationError("Invalid date format. Use YYYY-MM-DD or MM/DD/YYYY")
        return value
    
    def to_representation(self, instance):
        """Custom serialization to handle date fields properly"""
        data = super().to_representation(instance)
        
        # Convert date field to string format to avoid timezone issues
        if data.get('date') and hasattr(instance, 'date') and instance.date:
            data['date'] = instance.date.strftime('%Y-%m-%d')
        
        return data
    
    def create(self, validated_data):
        # Auto-set date if not provided
        if not validated_data.get('date'):
            from django.utils import timezone
            validated_data['date'] = timezone.now().date()
        
        # Auto-fill patient information if not provided
        patient = validated_data.get('patient')
        if patient:
            # Get surname from patient.name
            surname = ''
            first_name_from_name = ''
            if patient.name and ',' in patient.name:
                parts = patient.name.split(',', 1)
                surname = parts[0].strip()
                first_name_from_name = parts[1].strip()
            elif patient.name:
                # Fallback if name is not "Last, First"
                name_parts = patient.name.split(' ')
                if len(name_parts) > 1:
                    surname = name_parts[-1]
                    first_name_from_name = ' '.join(name_parts[:-1])
                else:
                    surname = patient.name

            if not validated_data.get('surname'):
                validated_data['surname'] = surname
            if not validated_data.get('first_name'):
                validated_data['first_name'] = patient.first_name or first_name_from_name
            if not validated_data.get('middle_name'):
                validated_data['middle_name'] = patient.middle_name or ''
            if not validated_data.get('age'):
                validated_data['age'] = patient.age
            if not validated_data.get('sex'):
                # Map patient gender to dental form sex field, handling 'Other' case
                if patient.gender == 'Other':
                    validated_data['sex'] = 'Male'  # Default fallback
                else:
                    validated_data['sex'] = patient.gender or 'Male'
        
        # Create the dental form data
        dental_form = super().create(validated_data)
        
        # The appointment completion is handled in the model's save method
        return dental_form
    
    def update(self, instance, validated_data):
        # Update the dental form data
        dental_form = super().update(instance, validated_data)
        
        # The appointment completion is handled in the model's save method
        return dental_form


class StaffDetailsSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    signature = serializers.ImageField(use_url=True, required=False, allow_null=True)
    
    class Meta:
        model = StaffDetails
        fields = '__all__'


class MedicalFormDataSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.name', read_only=True)
    patient_student_id = serializers.CharField(source='patient.student_id', read_only=True)
    patient_department = serializers.CharField(source='patient.department', read_only=True)
    patient_age = serializers.IntegerField(source='patient.age', read_only=True)
    patient_gender = serializers.CharField(source='patient.gender', read_only=True)
    academic_year_display = serializers.CharField(source='academic_year.academic_year', read_only=True)
    
    class Meta:
        model = MedicalFormData
        fields = '__all__'
    
    def create(self, validated_data):
        patient = validated_data.get('patient')
        if patient:
            # Auto-fill patient information if not provided
            surname = patient.name.split(',')[0].strip() if patient.name and ',' in patient.name else ''
            first_name_from_name = patient.name.split(',')[1].strip() if patient.name and ',' in patient.name else ''
            
            # Handle cases where name might not be in "Last, First" format
            if patient.name and ',' in patient.name:
                parts = patient.name.split(',', 1)
                surname = parts[0].strip()
                first_name_from_name = parts[1].strip()
            elif patient.name:
                # Fallback if name is not "Last, First"
                name_parts = patient.name.split(' ')
                if len(name_parts) > 1:
                    surname = name_parts[-1]
                    first_name_from_name = ' '.join(name_parts[:-1])
                else:
                    surname = patient.name

            if not validated_data.get('surname'):
                validated_data['surname'] = surname
            if not validated_data.get('first_name'):
                validated_data['first_name'] = patient.first_name or first_name_from_name
            if not validated_data.get('middle_name'):
                validated_data['middle_name'] = patient.middle_name or ''
            if not validated_data.get('age'):
                validated_data['age'] = patient.age
            if not validated_data.get('sex'):
                # Map patient gender to medical form sex field, handling 'Other' case
                if patient.gender == 'Other':
                    validated_data['sex'] = 'Male'  # Default fallback
                else:
                    validated_data['sex'] = patient.gender or 'Male'
        
        return super().create(validated_data)


class SystemConfigurationSerializer(serializers.ModelSerializer):
    """Serializer for system-wide configuration"""
    class Meta:
        model = SystemConfiguration
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class ProfileRequirementSerializer(serializers.ModelSerializer):
    """Serializer for profile requirements"""
    class Meta:
        model = ProfileRequirement
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class DocumentRequirementSerializer(serializers.ModelSerializer):
    """Serializer for document requirements"""
    class Meta:
        model = DocumentRequirement
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class CampusScheduleSerializer(serializers.ModelSerializer):
    """Serializer for campus schedules"""
    class Meta:
        model = CampusSchedule
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class DentistScheduleSerializer(serializers.ModelSerializer):
    """Serializer for dentist schedules"""
    class Meta:
        model = DentistSchedule
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class AcademicSchoolYearSerializer(serializers.ModelSerializer):
    """Serializer for Academic School Year"""
    current_semester = serializers.SerializerMethodField()
    current_semester_display = serializers.SerializerMethodField()
    
    class Meta:
        model = AcademicSchoolYear
        fields = [
            'id', 'academic_year', 'start_date', 'end_date', 
            'first_sem_start', 'first_sem_end',
            'second_sem_start', 'second_sem_end', 
            'summer_start', 'summer_end',
            'is_current', 'status', 'current_semester', 'current_semester_display',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'start_date', 'end_date']
    
    def get_current_semester(self, obj):
        """Get the current semester code"""
        return obj.get_current_semester()
    
    def get_current_semester_display(self, obj):
        """Get the current semester display name"""
        return obj.get_semester_display()
    
    def validate(self, data):
        """Validate school year data including semester dates"""
        # Validate semester dates if provided
        if data.get('first_sem_start') and data.get('first_sem_end'):
            if data['first_sem_start'] >= data['first_sem_end']:
                raise serializers.ValidationError("First semester start date must be before end date")
        
        if data.get('second_sem_start') and data.get('second_sem_end'):
            if data['second_sem_start'] >= data['second_sem_end']:
                raise serializers.ValidationError("Second semester start date must be before end date")
        
        if data.get('summer_start') and data.get('summer_end'):
            if data['summer_start'] >= data['summer_end']:
                raise serializers.ValidationError("Summer semester start date must be before end date")
        
        # Validate semester sequence
        first_sem_end = data.get('first_sem_end')
        second_sem_start = data.get('second_sem_start')
        second_sem_end = data.get('second_sem_end')
        summer_start = data.get('summer_start')
        
        if first_sem_end and second_sem_start:
            if first_sem_end >= second_sem_start:
                raise serializers.ValidationError("First semester must end before second semester starts")
        
        if second_sem_end and summer_start:
            if second_sem_end >= summer_start:
                raise serializers.ValidationError("Second semester must end before summer semester starts")
        
        return data


class UserManagementSerializer(serializers.ModelSerializer):
    """Serializer for user management admin operations"""
    blocked_by_name = serializers.CharField(source='blocked_by.get_full_name', read_only=True)
    can_book_consultation = serializers.ReadOnlyField()
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'middle_name', 'last_name', 
            'full_name', 'is_staff', 'is_active', 'date_joined', 'last_login',
            'grade_level', 'is_email_verified', 'user_type',
            'is_blocked', 'blocked_at', 'blocked_by', 'blocked_by_name', 'block_reason',
            'can_book_consultation'
        ]
        read_only_fields = ['blocked_at', 'blocked_by', 'blocked_by_name', 'date_joined', 'last_login']
    
    def get_full_name(self, obj):
        if obj.middle_name:
            return f"{obj.first_name} {obj.middle_name} {obj.last_name}".strip()
        return f"{obj.first_name} {obj.last_name}".strip()


class UserBlockSerializer(serializers.Serializer):
    """Serializer for blocking/unblocking users"""
    user_id = serializers.IntegerField()
    action = serializers.ChoiceField(choices=[('block', 'Block'), ('unblock', 'Unblock')])
    reason = serializers.CharField(required=False, allow_blank=True, max_length=500)
    
    def validate_user_id(self, value):
        try:
            user = CustomUser.objects.get(id=value)
            if user.user_type == 'admin':
                raise serializers.ValidationError("Cannot block admin users")
            return value
        except CustomUser.DoesNotExist:
            raise serializers.ValidationError("User not found")


class ComorbidIllnessSerializer(serializers.ModelSerializer):
    """Serializer for comorbid illnesses configuration"""
    class Meta:
        model = ComorbidIllness
        fields = ['id', 'label', 'description', 'is_enabled', 'display_order', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class VaccinationSerializer(serializers.ModelSerializer):
    """Serializer for vaccination types configuration"""
    class Meta:
        model = Vaccination
        fields = ['id', 'name', 'description', 'is_enabled', 'display_order', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class PastMedicalHistoryItemSerializer(serializers.ModelSerializer):
    """Serializer for past medical history items configuration"""
    class Meta:
        model = PastMedicalHistoryItem
        fields = ['id', 'name', 'description', 'is_enabled', 'display_order', 
                 'has_sub_options', 'sub_options', 'requires_specification', 
                 'specification_placeholder', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class FamilyMedicalHistoryItemSerializer(serializers.ModelSerializer):
    """Serializer for family medical history items configuration"""
    class Meta:
        model = FamilyMedicalHistoryItem
        fields = ['id', 'name', 'description', 'is_enabled', 'display_order',
                 'has_sub_options', 'sub_options', 'requires_specification', 
                 'specification_placeholder', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class DentalInformationRecordSerializer(serializers.ModelSerializer):
    """Serializer for dental patient information records"""
    school_year_display = serializers.CharField(source='school_year.academic_year', read_only=True)
    semester_display = serializers.CharField(source='get_semester_display', read_only=True)
    
    class Meta:
        model = DentalInformationRecord
        fields = [
            'id', 'patient', 'school_year', 'school_year_display', 'semester', 'semester_display',
            'patient_name', 'age', 'sex', 'year_section', 'date',
            'name_of_previous_dentist', 'last_dental_visit', 'date_of_last_cleaning',
            'oral_hygiene_instructions', 'gums_bleed_brushing', 'teeth_sensitive_hot_cold',
            'feel_pain_teeth', 'difficult_extractions_past', 'orthodontic_treatment',
            'prolonged_bleeding_extractions', 'frequent_headaches', 'clench_grind_teeth',
            'allergic_to_following', 'allergic_penicillin', 'allergic_amoxicillin',
            'allergic_local_anesthetic', 'allergic_sulfa_drugs', 'allergic_latex', 'allergic_others',
            'is_woman', 'menstruation_today', 'pregnant', 'taking_birth_control',
            'smoke', 'under_medical_treatment', 'medical_treatment_condition',
            'hospitalized', 'hospitalization_when_why', 'taking_prescription_medication',
            'prescription_medication_details',
            'high_blood_pressure', 'low_blood_pressure', 'epilepsy_convulsions',
            'aids_hiv_positive', 'sexually_transmitted_disease', 'stomach_trouble_ulcers',
            'fainting_seizure', 'rapid_weight_loss', 'radiation_therapy',
            'joint_replacement_implant', 'heart_surgery', 'heart_attack',
            'thyroid_problem', 'heart_disease', 'heart_murmur',
            'hepatitis_liver_disease', 'rheumatic_fever', 'hay_fever_allergies',
            'respiratory_problems', 'hepatitis_jaundice', 'tuberculosis',
            'swollen_ankles', 'kidney_disease', 'diabetes', 'chest_pain',
            'stroke', 'cancer_tumors', 'anemia', 'angina', 'asthma',
            'emphysema', 'blood_diseases', 'head_injuries', 'arthritis_rheumatism',
            'other_conditions', 'patient_signature', 'signature_date',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def create(self, validated_data):
        # Automatically set patient from the request user
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # Get or create patient profile for current user
            user = request.user
            patient = user.get_current_patient_profile()
            if patient:
                validated_data['patient'] = patient
            else:
                # If no patient profile exists, we need to handle this
                raise serializers.ValidationError({
                    'patient': 'No patient profile found. Please create your profile first.'
                })
        
        return super().create(validated_data)
