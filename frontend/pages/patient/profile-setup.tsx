import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { patientProfileAPI, djangoApiClient } from '../../utils/api';
import FeedbackModal from '../../components/feedbackmodal';

const steps = [
  { id: 1, title: 'Personal Information' },
  { id: 2, title: 'Health History' },
  { id: 3, title: 'Family History' },
  { id: 4, title: 'Review & Submit' }
];

export default function PatientProfileSetupPage() {
  const router = useRouter();
  const { option } = router.query;
  const [currentStep, setCurrentStep] = useState(1);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const [currentSchoolYear, setCurrentSchoolYear] = useState<any>(null);
  const [currentSemester, setCurrentSemester] = useState<string>('');
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [autoFilledFromYear, setAutoFilledFromYear] = useState<string>('');
  const [autoFilledFromSemester, setAutoFilledFromSemester] = useState<string>('');

  // Medical lists state
  const [comorbidIllnesses, setComorbidIllnesses] = useState<any[]>([]);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [pastMedicalHistories, setPastMedicalHistories] = useState<any[]>([]);
  const [familyMedicalHistories, setFamilyMedicalHistories] = useState<any[]>([]);
  const [medicalListsLoading, setMedicalListsLoading] = useState(false);

  const progress = (currentStep / steps.length) * 100;

  const requiredFieldsByStep = {
    1: [
      'name', 'first_name', 'date_of_birth', 'age', 'gender', 'blood_type', 'religion', 'nationality', 'civil_status', 'email', 'contact_number', 'city_municipality', 'barangay', 'street',
      'emergency_contact_surname', 'emergency_contact_first_name', 'emergency_contact_middle_name', 'emergency_contact_number', 'emergency_contact_relationship', 'emergency_contact_barangay', 'emergency_contact_street',
    ],
    2: [
      // No required fields for health history step - optional information
    ],
    3: [
      'hospital_admission_or_surgery'
    ]
  };

  // Define fetchProfile function outside useEffect so it can be called from multiple places
  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query parameters for semester-specific profile
      const params: any = {};
      if (currentSchoolYear?.id) {
        params.school_year = currentSchoolYear.id;
      }
      if (currentSemester) {
        params.semester = currentSemester;
      }
      
      const res = await patientProfileAPI.get(params);
      let profileData = res.data;
      // Get user info from localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        // If profile fields are empty, use user info
        if (!profileData.name && user.last_name) profileData.name = user.last_name;
        if (!profileData.first_name && user.first_name) profileData.first_name = user.first_name;
        if (!profileData.middle_name && user.middle_name) profileData.middle_name = user.middle_name;
        if (!profileData.suffix && user.suffix) profileData.suffix = user.suffix;
        if (!profileData.email && user.email) profileData.email = user.email;
        if (!profileData.nationality) profileData.nationality = 'Filipino';
        
        // Handle backward compatibility for address field
        if (profileData.address && !profileData.city_municipality && !profileData.barangay && !profileData.street) {
          // Try to parse the old address format
          const addressParts = profileData.address.split(',').map(part => part.trim());
          if (addressParts.length >= 3) {
            profileData.street = addressParts[0];
            profileData.barangay = addressParts[1];
            profileData.city_municipality = addressParts[2];
          } else if (addressParts.length === 2) {
            profileData.barangay = addressParts[0];
            profileData.city_municipality = addressParts[1];
          } else if (addressParts.length === 1) {
            profileData.city_municipality = addressParts[0];
          }
        }
        
        // Handle backward compatibility for emergency contact address field
        if (profileData.emergency_contact_address && !profileData.emergency_contact_barangay && !profileData.emergency_contact_street) {
          // Try to parse the old emergency contact address format
          let emergencyAddress = profileData.emergency_contact_address.trim();
          
          // Remove "Zamboanga City" from the end if present
          if (emergencyAddress.toLowerCase().endsWith(', zamboanga city')) {
            emergencyAddress = emergencyAddress.slice(0, -15).trim();
          } else if (emergencyAddress.toLowerCase().endsWith('zamboanga city')) {
            emergencyAddress = emergencyAddress.slice(0, -13).trim();
          }
          
          const emergencyAddressParts = emergencyAddress.split(',').map(part => part.trim());
          if (emergencyAddressParts.length >= 2) {
            profileData.emergency_contact_street = emergencyAddressParts[0];
            profileData.emergency_contact_barangay = emergencyAddressParts[1];
          } else if (emergencyAddressParts.length === 1 && emergencyAddressParts[0]) {
            profileData.emergency_contact_barangay = emergencyAddressParts[0];
          }
        }
        
        // Set default address components if still empty
        if (!profileData.city_municipality) profileData.city_municipality = 'Zamboanga City';
        if (!profileData.barangay) profileData.barangay = '';
        if (!profileData.street) profileData.street = '';
      }
      setProfile(profileData);
      
      // Debug photo loading
      if (process.env.NODE_ENV === 'development') {
        console.log('Profile loaded with photo:', {
          photo: profileData.photo,
          photoType: typeof profileData.photo,
          photoLength: profileData.photo?.length
        });
      }
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        // No profile exists for current school year/semester - use autofill data from backend
        try {
          // Build autofill query parameters
          const autofillParams: any = {};
          if (currentSchoolYear?.id) {
            autofillParams.school_year = currentSchoolYear.id;
          }
          if (currentSemester) {
            autofillParams.semester = currentSemester;
          }
          
          // Get autofill data which includes previous semester/year data
          const autofillResponse = await patientProfileAPI.autofillData(autofillParams);
          const autofillData = autofillResponse.data;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Autofill data received:', autofillData);
          }
          
          // Use autofill data as the profile
          let defaultProfile: any = {
            name: autofillData.name || '',
            first_name: autofillData.first_name || '',
            middle_name: autofillData.middle_name || '',
            suffix: autofillData.suffix || '',
            email: autofillData.email || '',
            nationality: autofillData.nationality || 'Filipino',
            city_municipality: autofillData.city_municipality || 'Zamboanga City',
            barangay: autofillData.barangay || '',
            street: autofillData.street || '',
            emergency_contact_barangay: autofillData.emergency_contact_barangay || '',
            emergency_contact_street: autofillData.emergency_contact_street || '',
          };
          
          // Add all other fields from autofill data
          Object.keys(autofillData).forEach(key => {
            if (autofillData[key] !== undefined && autofillData[key] !== null && 
                !['has_existing_profile', 'current_school_year', 'current_school_year_name', 
                  'has_previous_data', 'autofilled_from_year', 'profile_completion_status'].includes(key)) {
              defaultProfile[key] = autofillData[key];
            }
          });
          
          // Mark as auto-filled if we have previous data
          if (autofillData.has_previous_data && autofillData.autofilled_from_year) {
            setIsAutoFilled(true);
            setAutoFilledFromYear(autofillData.autofilled_from_year);
            
            // Set autofilled semester if available
            if (autofillData.autofilled_from_semester) {
              setAutoFilledFromSemester(autofillData.autofilled_from_semester);
            }
            
            console.log('Auto-filled profile from:', autofillData.autofilled_from_year, autofillData.autofilled_from_semester);
          }
          
          setProfile(defaultProfile);
        } catch (autofillErr: any) {
          console.error('Failed to get autofill data:', autofillErr);
          // Fallback to basic user info
          const userStr = localStorage.getItem('user');
          let defaultProfile: any = {
            name: '',
            first_name: '',
            middle_name: '',
            suffix: '',
            email: '',
            nationality: 'Filipino',
            city_municipality: 'Zamboanga City',
            barangay: '',
            street: '',
            emergency_contact_barangay: '',
            emergency_contact_street: '',
          };
          
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.last_name) defaultProfile.name = user.last_name;
            if (user.first_name) defaultProfile.first_name = user.first_name;
            if (user.middle_name) defaultProfile.middle_name = user.middle_name;
            if (user.suffix) defaultProfile.suffix = user.suffix;
            if (user.email) defaultProfile.email = user.email;
          }
          
          setProfile(defaultProfile);
        }
      } else {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: number) => {
    const required = requiredFieldsByStep[step] || [];
    const errors: any = {};
    
    // For debugging - remove in production
    if (process.env.NODE_ENV === 'development') {
      console.log(`=== VALIDATION START ===`);
      console.log(`Validating step ${step}, current step: ${currentStep}`);
      console.log(`Required fields for step ${step}:`, required);
      console.log('Current profile data:', profile);
    }
    
    // Only validate fields for the current step
    required.forEach(field => {
      const value = profile?.[field];
      if (process.env.NODE_ENV === 'development') {
        console.log(`Checking field '${field}':`, value, typeof value);
      }
      
      // Special handling for boolean fields: only undefined/null is considered missing
      if (typeof value === 'boolean') {
        if (value === undefined || value === null) {
          errors[field] = 'This field is required.';
          if (process.env.NODE_ENV === 'development') {
            console.log(`Field '${field}' is missing (boolean)`);
          }
        }
      } else if (!value || (Array.isArray(value) && value.length === 0)) {
        errors[field] = 'This field is required.';
        if (process.env.NODE_ENV === 'development') {
          console.log(`Field '${field}' is missing (empty/null)`);
        }
      } else {
        // Format validation for specific fields
        if (field === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            errors[field] = 'Please enter a valid email address.';
            if (process.env.NODE_ENV === 'development') {
              console.log(`Field '${field}' has invalid format`);
            }
          }
        }
        if (field === 'contact_number' && value) {
          const phoneRegex = /^09\d{9}$/;
          if (!phoneRegex.test(value)) {
            errors[field] = 'Phone number must be 11 digits and start with 09.';
            if (process.env.NODE_ENV === 'development') {
              console.log(`Field '${field}' has invalid format`);
            }
          }
        }
        if (field === 'date_of_birth' && value) {
          const birthDate = new Date(value);
          const today = new Date();
          if (birthDate > today) {
            errors[field] = 'Birthday cannot be in the future.';
            if (process.env.NODE_ENV === 'development') {
              console.log(`Field '${field}' has invalid date`);
            }
          }
        }
      }
    });

    // STEP-SPECIFIC VALIDATIONS
    
    // Step 1: Additional validation for photo (smart logic)
    if (step === 1) {
      // Photo is required for new profiles or profiles without existing photos
      const hasExistingPhoto = profile?.photo && 
                              typeof profile.photo === 'string' && 
                              profile.photo.length > 0 && 
                              profile.photo !== 'null' && 
                              profile.photo !== 'undefined';
      const hasNewPhoto = photoFile || photoPreview;
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Photo validation:', {
          hasExistingPhoto,
          hasNewPhoto,
          profilePhoto: profile?.photo,
          profilePhotoType: typeof profile?.photo,
          photoFile: !!photoFile,
          photoPreview: !!photoPreview
        });
      }
      
      if (!hasExistingPhoto && !hasNewPhoto) {
        errors.photo = 'Please upload a profile photo.';
        if (process.env.NODE_ENV === 'development') {
          console.log('Photo is required for new profile');
        }
      }
    }

    // CONDITIONAL VALIDATION - Only run for relevant steps and when conditions are actually met
    
    // Step 2: Comorbid illnesses conditional validation
    if (step === 2) {
      if (process.env.NODE_ENV === 'development') {
        console.log('=== STEP 2 VALIDATION ===');
        console.log('Comorbid illnesses:', profile?.comorbid_illnesses);
      }
      
      // Food allergies validation - only if "Food Allergies" is selected
      if (Array.isArray(profile?.comorbid_illnesses) && profile.comorbid_illnesses.includes('Food Allergies')) {
        if (!profile?.food_allergy_specify || profile.food_allergy_specify.trim() === '') {
          errors.food_allergy_specify = 'Please specify the food allergies.';
          if (process.env.NODE_ENV === 'development') {
            console.log('Food allergies requires specification');
          }
        }
      }

      // Other comorbid illness validation - validate if field has content but is incomplete
      if (profile?.other_comorbid_specify !== undefined && profile.other_comorbid_specify !== null && profile.other_comorbid_specify.trim() === '') {
        // If the field exists but is empty, don't require it to be filled
        // This allows users to clear the field without validation errors
      }
    }

    // Step 3: Medical history conditional validation
    if (step === 3) {
      if (process.env.NODE_ENV === 'development') {
        console.log('=== STEP 3 VALIDATION ===');
        console.log('Past medical history:', profile?.past_medical_history);
        console.log('Family medical history:', profile?.family_medical_history);
      }
      
      // Past medical history "Other" validation - only if other condition text is provided
      if (profile?.past_medical_history_other && profile.past_medical_history_other.trim() === '') {
        errors.past_medical_history_other = 'Please specify the other medical condition.';
        if (process.env.NODE_ENV === 'development') {
          console.log('Past medical history "Other" requires specification');
        }
      }

      // Family medical history "Other" validation - only if other condition text is provided
      if (profile?.family_medical_history_other && profile.family_medical_history_other.trim() === '') {
        errors.family_medical_history_other = 'Please specify the other family medical condition.';
        if (process.env.NODE_ENV === 'development') {
          console.log('Family medical history "Other" requires specification');
        }
      }

      // Family medical history "Allergies" validation - only if allergies text is provided
      if (profile?.family_medical_history_allergies && profile.family_medical_history_allergies.trim() === '') {
        errors.family_medical_history_allergies = 'Please specify the allergies.';
        if (process.env.NODE_ENV === 'development') {
          console.log('Family medical history allergies requires specification');
        }
      }

      // Hospital admission/surgery details validation - only if "Yes" is selected
      if (profile?.hospital_admission_or_surgery === true) {
        if (!profile?.hospital_admission_details || profile.hospital_admission_details.trim() === '') {
          errors.hospital_admission_details = 'Please provide details about the hospital admission or surgery.';
          if (process.env.NODE_ENV === 'development') {
            console.log('Hospital admission/surgery details required');
          }
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('=== VALIDATION END ===');
      console.log('Final validation errors:', errors);
      console.log('Error count:', Object.keys(errors).length);
    }
    
    // IMPORTANT: Only set errors for fields that are actually part of the current step
    // This ensures that errors from other steps don't leak through
    const stepSpecificErrors: any = {};
    const currentStepFields = requiredFieldsByStep[step] || [];
    
    // Include required field errors for current step
    currentStepFields.forEach(field => {
      if (errors[field]) {
        stepSpecificErrors[field] = errors[field];
      }
    });
    
    // Include conditional validation errors based on the step
    if (step === 1) {
      if (errors.photo) stepSpecificErrors.photo = errors.photo;
    } else if (step === 2) {
      if (errors.food_allergy_specify) stepSpecificErrors.food_allergy_specify = errors.food_allergy_specify;
      if (errors.other_comorbid_specify) stepSpecificErrors.other_comorbid_specify = errors.other_comorbid_specify;
    } else if (step === 3) {
      if (errors.past_medical_history_other) stepSpecificErrors.past_medical_history_other = errors.past_medical_history_other;
      if (errors.family_medical_history_other) stepSpecificErrors.family_medical_history_other = errors.family_medical_history_other;
      if (errors.family_medical_history_allergies) stepSpecificErrors.family_medical_history_allergies = errors.family_medical_history_allergies;
      if (errors.hospital_admission_details) stepSpecificErrors.hospital_admission_details = errors.hospital_admission_details;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Step-specific errors only:', stepSpecificErrors);
    }
    
    setFieldErrors(stepSpecificErrors);
    return Object.keys(stepSpecificErrors).length === 0;
  };

  useEffect(() => {
    async function loadCurrentSchoolYear() {
      try {
        const response = await djangoApiClient.get('/academic-school-years/current/');
        if (response.data) {
          setCurrentSchoolYear(response.data);
          console.log('Loaded current school year:', response.data);
          
          // Determine current semester
          const schoolYear = response.data;
          let currentSem = '';
          
          if (schoolYear.first_sem_start && schoolYear.first_sem_end && 
              schoolYear.second_sem_start && schoolYear.second_sem_end &&
              schoolYear.summer_start && schoolYear.summer_end) {
            
            const today = new Date();
            const firstSemStart = new Date(schoolYear.first_sem_start);
            const firstSemEnd = new Date(schoolYear.first_sem_end);
            const secondSemStart = new Date(schoolYear.second_sem_start);
            const secondSemEnd = new Date(schoolYear.second_sem_end);
            const summerStart = new Date(schoolYear.summer_start);
            const summerEnd = new Date(schoolYear.summer_end);
            
            if (today >= firstSemStart && today <= firstSemEnd) {
              currentSem = '1st_semester';
            } else if (today >= secondSemStart && today <= secondSemEnd) {
              currentSem = '2nd_semester';
            } else if (today >= summerStart && today <= summerEnd) {
              currentSem = 'summer';
            } else {
              // Default to first semester if we're outside all periods
              currentSem = '1st_semester';
            }
          } else {
            // Default to first semester if semester dates aren't configured
            currentSem = '1st_semester';
          }
          
          setCurrentSemester(currentSem);
          console.log('Current semester determined as:', currentSem);
        }
      } catch (error) {
        console.error('Error loading current school year:', error);
        // Continue without school year if API fails
        setCurrentSemester('1st_semester'); // Default semester
      }
    }

    // Load medical lists from API
    const loadMedicalLists = async () => {
      setMedicalListsLoading(true);
      try {
        // Load comorbid illnesses
        try {
          const comorbidResponse = await djangoApiClient.get('/user-management/comorbid_illnesses/');
          if (comorbidResponse.data) {
            setComorbidIllnesses(comorbidResponse.data.filter(illness => illness.is_enabled));
          }
        } catch (error) {
          console.log('Comorbid Illnesses API not available, using fallback data');
          setComorbidIllnesses([
            { id: 1, label: 'Bronchial Asthma ("Hika")', is_enabled: true },
            { id: 2, label: 'Food Allergies', is_enabled: true },
            { id: 3, label: 'Allergic Rhinitis', is_enabled: true },
            { id: 4, label: 'Hyperthyroidism', is_enabled: true },
            { id: 5, label: 'Hypothyroidism/Goiter', is_enabled: true },
            { id: 6, label: 'Anemia', is_enabled: true }
          ]);
        }

        // Load vaccinations
        try {
          const vaccinationResponse = await djangoApiClient.get('/user-management/vaccinations/');
          if (vaccinationResponse.data) {
            setVaccinations(vaccinationResponse.data.filter(vaccination => vaccination.is_enabled));
          }
        } catch (error) {
          console.log('Vaccinations API not available, using fallback data');
          setVaccinations([
            { id: 1, name: 'COVID-19', is_enabled: true },
            { id: 2, name: 'Influenza (Flu)', is_enabled: true },
            { id: 3, name: 'Hepatitis B', is_enabled: true },
            { id: 4, name: 'Measles, Mumps, Rubella (MMR)', is_enabled: true },
            { id: 5, name: 'Tetanus', is_enabled: true }
          ]);
        }

        // Load past medical histories
        try {
          const pastMedicalResponse = await djangoApiClient.get('/user-management/past_medical_histories/');
          if (pastMedicalResponse.data) {
            setPastMedicalHistories(pastMedicalResponse.data.filter(history => history.is_enabled));
          }
        } catch (error) {
          console.log('Past Medical Histories API not available, using fallback data');
          setPastMedicalHistories([
            { id: 1, name: 'Varicella (Chicken Pox)', is_enabled: true },
            { id: 2, name: 'Measles', is_enabled: true },
            { id: 3, name: 'Dengue', is_enabled: true },
            { id: 4, name: 'Tuberculosis', is_enabled: true },
            { id: 5, name: 'Urinary Tract Infection', is_enabled: true },
            { id: 6, name: 'Injury', is_enabled: true }
          ]);
        }

        // Load family medical histories
        try {
          const familyMedicalResponse = await djangoApiClient.get('/user-management/family_medical_histories/');
          if (familyMedicalResponse.data) {
            setFamilyMedicalHistories(familyMedicalResponse.data.filter(history => history.is_enabled));
          }
        } catch (error) {
          console.log('Family Medical Histories API not available, using fallback data');
          setFamilyMedicalHistories([
            { id: 1, name: 'Hypertension (Elevated Blood Pressure)', is_enabled: true },
            { id: 2, name: 'Diabetes Mellitus (Elevated Blood Sugar)', is_enabled: true },
            { id: 3, name: 'Heart Disease', is_enabled: true },
            { id: 4, name: 'Cancer', is_enabled: true },
            { id: 5, name: 'Asthma', is_enabled: true },
            { id: 6, name: 'Tuberculosis', is_enabled: true }
          ]);
        }

        console.log('Medical lists loaded successfully');
      } catch (error) {
        console.error('Error loading medical lists:', error);
      } finally {
        setMedicalListsLoading(false);
      }
    };

    loadCurrentSchoolYear();
    loadMedicalLists();
  }, []);

  // Fetch profile after school year and semester are loaded
  useEffect(() => {
    if (currentSchoolYear && currentSemester) {
      fetchProfile();
    }
  }, [currentSchoolYear, currentSemester]);

  const handleProfileChange = (field: string, value: any) => {
    if (field === 'date_of_birth') {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setProfile((prev: any) => ({ ...prev, date_of_birth: value, age: age > 0 ? age : '' }));
      return;
    }
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleProfileSave = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      // Prepare the form data
      const formData = new FormData();
      for (const key in profile) {
        if (profile[key] !== undefined && profile[key] !== null) {
          if (key === 'photo' && profile[key] instanceof File) {
            formData.append('photo', profile[key]);
          } else if (typeof profile[key] === 'object' && !(profile[key] instanceof File)) {
            formData.append(key, JSON.stringify(profile[key]));
          } else if (key !== 'photo') {
            formData.append(key, profile[key]);
          }
        }
      }
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      // Add school year and semester if available
      if (currentSchoolYear?.id) {
        formData.append('school_year', currentSchoolYear.id.toString());
      }
      if (currentSemester) {
        formData.append('semester', currentSemester);
      }

      // Check if we need to create a new profile version or update existing one
      let shouldCreateNew = false;
      
      if (currentSchoolYear?.id && profile?.school_year && currentSemester && profile?.semester) {
        // If the current profile has a different school year OR semester, create new profile
        shouldCreateNew = profile.school_year !== currentSchoolYear.id || profile.semester !== currentSemester;
      } else if ((currentSchoolYear?.id && !profile?.school_year) || (currentSemester && !profile?.semester)) {
        // If current profile has no school year or semester but we have active ones, create new profile
        shouldCreateNew = true;
      }

      const getSemesterDisplayName = (sem: string) => {
        switch (sem) {
          case '1st_semester': return 'First Semester';
          case '2nd_semester': return 'Second Semester';  
          case 'summer': return 'Summer Semester';
          default: return sem;
        }
      };

      if (shouldCreateNew) {
        // Create a new profile version for the current school year and semester
        // Remove the id to force creation of a new record
        formData.delete('id');
        await patientProfileAPI.create(formData);
        const semesterDisplay = getSemesterDisplayName(currentSemester);
        setFeedbackMessage(`Profile saved for ${semesterDisplay}, ${currentSchoolYear.academic_year}!`);
        setAutoFilledFromYear(currentSchoolYear.academic_year);
        setAutoFilledFromSemester(semesterDisplay);
        setIsAutoFilled(true);
      } else {
        // Update the existing profile
        await patientProfileAPI.update(formData);
        const semesterDisplay = getSemesterDisplayName(currentSemester);
        setFeedbackMessage(`Profile updated for ${semesterDisplay}, ${currentSchoolYear.academic_year}!`);
      }
      
      setSuccess(true);
      setFeedbackOpen(true);
    } catch (err: any) {
      let msg = 'Failed to update profile.';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          msg = err.response.data;
        } else if (typeof err.response.data === 'object') {
          msg = Object.values(err.response.data).flat().join(' ');
        }
      }
      setError(msg);
      setFeedbackMessage(msg);
      setFeedbackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
      handleProfileChange('photo', file);
    } else {
      setPhotoFile(null);
      setPhotoPreview(null);
      handleProfileChange('photo', null);
    }
  };

  const handleCheckboxArrayChange = (field: string, value: string, checked: boolean) => {
    setProfile((prev: any) => {
      const arr = Array.isArray(prev[field]) ? [...prev[field]] : [];
      if (checked) {
        if (!arr.includes(value)) arr.push(value);
      } else {
        const idx = arr.indexOf(value);
        if (idx > -1) arr.splice(idx, 1);
      }
      return { ...prev, [field]: arr };
    });
  };

  const handleMedicationChange = (idx: number, key: string, value: string) => {
    setProfile((prev: any) => {
      const meds = Array.isArray(prev.maintenance_medications) ? [...prev.maintenance_medications] : [{}];
      meds[idx] = { ...meds[idx], [key]: value };
      return { ...prev, maintenance_medications: meds };
    });
  };

  const handleAddMedication = () => {
    setProfile((prev: any) => {
      const meds = Array.isArray(prev.maintenance_medications) ? [...prev.maintenance_medications] : [];
      meds.push({ drug: '', dose: '', unit: 'mg', frequency: '' });
      return { ...prev, maintenance_medications: meds };
    });
  };

  const handleRemoveMedication = (idx: number) => {
    setProfile((prev: any) => {
      const meds = Array.isArray(prev.maintenance_medications) ? [...prev.maintenance_medications] : [];
      meds.splice(idx, 1);
      return { ...prev, maintenance_medications: meds };
    });
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Title - Mobile optimized */}
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">Personal Information</h2>
              
              {/* School Year Info */}
              {currentSchoolYear && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-700 font-medium">
                    <strong>School Year:</strong> {currentSchoolYear.academic_year}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {profile?.school_year && profile.school_year !== currentSchoolYear.id 
                      ? `Your profile will be saved as a new version for ${currentSchoolYear.academic_year}`
                      : 'Your profile will be saved for this school year'
                    }
                  </div>
                </div>
              )}

              {/* Auto-fill Info */}
              {isAutoFilled && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-sm text-gray-700 font-medium">
                    <strong>📋 Auto-filled Information</strong>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Your profile has been pre-filled with information from {autoFilledFromYear}. Please review and update as needed.
                  </div>
                </div>
              )}
            </div>

            {/* Photo Upload - Enhanced mobile design */}
            <div className="flex flex-col items-center justify-center mb-8">
              <label className="block text-base sm:text-lg font-medium text-gray-700 mb-4 text-center">
                Profile Photo {!profile?.photo && <span className="text-red-500">*</span>}
              </label>
              <label htmlFor="photo-upload" className="cursor-pointer group">
                <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 flex items-center justify-center border-2 border-dashed border-gray-400 rounded-lg bg-gray-50 hover:bg-gray-100 group-active:bg-gray-200 transition-all duration-200">
                  {photoPreview ? (
                    <div className="relative w-full h-full">
                      <img src={photoPreview} alt="Preview" className="object-cover w-full h-full rounded-md" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 rounded-md flex items-center justify-center">
                        <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Tap to change
                        </span>
                      </div>
                    </div>
                  ) : (profile?.photo && typeof profile.photo === 'string' && profile.photo.length > 0 && profile.photo !== 'null' && profile.photo !== 'undefined') ? (
                    <div className="relative w-full h-full">
                      <img src={profile.photo} alt="Current Photo" className="object-cover w-full h-full rounded-md" />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 rounded-md flex items-center justify-center">
                        <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Tap to change
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-2xl sm:text-3xl lg:text-4xl text-gray-400 font-light block">+</span>
                      <span className="text-xs sm:text-sm text-gray-500 mt-1">Upload Photo</span>
                    </div>
                  )}
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </label>
              {fieldErrors.photo && (
                <div className="text-red-500 text-xs mt-2 text-center max-w-xs">
                  {fieldErrors.photo}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2 text-center max-w-xs">
                Supported formats: JPG, PNG, GIF (max 5MB)
              </p>
            </div>

            {/* Personal Info Form - Mobile-first responsive */}
            <div className="space-y-8">
              {/* Name Section */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm mr-3">1</span>
                  Full Name
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Surname *</label>
                    <input
                      type="text"
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.name || ''}
                      onChange={e => handleProfileChange('name', e.target.value)}
                      placeholder="Enter surname"
                    />
                    {fieldErrors.name && <div className="text-red-500 text-xs mt-1">{fieldErrors.name}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.first_name ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.first_name || ''}
                      onChange={e => handleProfileChange('first_name', e.target.value)}
                      placeholder="Enter first name"
                    />
                    {fieldErrors.first_name && <div className="text-red-500 text-xs mt-1">{fieldErrors.first_name}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                    <input
                      type="text"
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.middle_name ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.middle_name || ''}
                      onChange={e => handleProfileChange('middle_name', e.target.value)}
                      placeholder="Enter middle name"
                    />
                    {fieldErrors.middle_name && <div className="text-red-500 text-xs mt-1">{fieldErrors.middle_name}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Suffix</label>
                    <input
                      type="text"
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.suffix ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.suffix || ''}
                      onChange={e => handleProfileChange('suffix', e.target.value)}
                      placeholder="Jr., Sr., III"
                    />
                    {fieldErrors.suffix && <div className="text-red-500 text-xs mt-1">{fieldErrors.suffix}</div>}
                  </div>
                </div>
              </div>

              {/* Basic Info Section */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm mr-3">2</span>
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Birthday *</label>
                    <input
                      type="date"
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.date_of_birth ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.date_of_birth || ''}
                      onChange={e => handleProfileChange('date_of_birth', e.target.value)}
                    />
                    {fieldErrors.date_of_birth && <div className="text-red-500 text-xs mt-1">{fieldErrors.date_of_birth}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <input
                      type="number"
                      className={`w-full border rounded-md shadow-sm py-3 px-4 bg-gray-50 ${fieldErrors.age ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.age || ''}
                      readOnly
                      placeholder="Auto-calculated"
                    />
                    {fieldErrors.age && <div className="text-red-500 text-xs mt-1">{fieldErrors.age}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sex *</label>
                    <select
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.gender ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.gender || ''}
                      onChange={e => handleProfileChange('gender', e.target.value)}
                    >
                      <option value="">Select sex</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    {fieldErrors.gender && <div className="text-red-500 text-xs mt-1">{fieldErrors.gender}</div>}
                  </div>
                </div>
              </div>

              {/* Additional Info Section */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm mr-3">3</span>
                  Additional Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type *</label>
                    <select
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.blood_type ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.blood_type || ''}
                      onChange={e => handleProfileChange('blood_type', e.target.value)}
                    >
                      <option value="">Select blood type</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                    {fieldErrors.blood_type && <div className="text-red-500 text-xs mt-1">{fieldErrors.blood_type}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Religion *</label>
                    <select
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.religion ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.religion || ''}
                      onChange={e => handleProfileChange('religion', e.target.value)}
                    >
                      <option value="">Select religion</option>
                      <option value="Roman Catholic">Roman Catholic</option>
                      <option value="Seventh-day Adventist">Seventh-day Adventist</option>
                      <option value="Islam">Islam</option>
                      <option value="Protestant">Protestant</option>
                      <option value="Iglesia ni Cristo">Iglesia ni Cristo</option>
                      <option value="Other">Other</option>
                    </select>
                    {fieldErrors.religion && <div className="text-red-500 text-xs mt-1">{fieldErrors.religion}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nationality *</label>
                    <select
                      className="w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors border-gray-300"
                      value={profile?.nationality || ''}
                      onChange={e => handleProfileChange('nationality', e.target.value)}
                    >
                      <option value="">Select nationality</option>
                      <option value="Filipino">Filipino</option>
                      <option value="Foreigner">Foreigner</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Civil Status *</label>
                    <select
                      className="w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors border-gray-300"
                      value={profile?.civil_status || ''}
                      onChange={e => handleProfileChange('civil_status', e.target.value)}
                    >
                      <option value="">Select civil status</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="widowed">Widowed</option>
                      <option value="separated">Separated</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Info Section */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm mr-3">4</span>
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <input
                      type="email"
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.email || ''}
                      onChange={e => handleProfileChange('email', e.target.value)}
                      placeholder="Enter email address"
                    />
                    {fieldErrors.email && <div className="text-red-500 text-xs mt-1">{fieldErrors.email}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="text"
                      maxLength={11}
                      pattern="^09\\d{9}$"
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.contact_number ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.contact_number || ''}
                      onChange={e => handleProfileChange('contact_number', e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="09XXXXXXXXX"
                    />
                    {fieldErrors.contact_number && <div className="text-red-500 text-xs mt-1">{fieldErrors.contact_number}</div>}
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-sm mr-3">5</span>
                  Address Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City/Municipality *</label>
                    <input
                      type="text"
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.city_municipality ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.city_municipality || ''}
                      onChange={e => handleProfileChange('city_municipality', e.target.value)}
                      placeholder="e.g., Zamboanga City"
                    />
                    {fieldErrors.city_municipality && <div className="text-red-500 text-xs mt-1">{fieldErrors.city_municipality}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Barangay *</label>
                    <input
                      type="text"
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.barangay ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.barangay || ''}
                      onChange={e => handleProfileChange('barangay', e.target.value)}
                      placeholder="e.g., Barangay Tugbungan"
                    />
                    {fieldErrors.barangay && <div className="text-red-500 text-xs mt-1">{fieldErrors.barangay}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street *</label>
                    <input
                      type="text"
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.street ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.street || ''}
                      onChange={e => handleProfileChange('street', e.target.value)}
                      placeholder="e.g., 123 Main Street"
                    />
                    {fieldErrors.street && <div className="text-red-500 text-xs mt-1">{fieldErrors.street}</div>}
                  </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center text-sm mr-3">!</span>
                  Emergency Contact (within Zamboanga City)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Surname *</label>
                    <input 
                      type="text" 
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.emergency_contact_surname ? 'border-red-500' : 'border-gray-300'}`} 
                      value={profile?.emergency_contact_surname || ''} 
                      onChange={e => handleProfileChange('emergency_contact_surname', e.target.value)}
                      placeholder="Contact's surname"
                    />
                    {fieldErrors.emergency_contact_surname && <div className="text-red-500 text-xs mt-1">{fieldErrors.emergency_contact_surname}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input 
                      type="text" 
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.emergency_contact_first_name ? 'border-red-500' : 'border-gray-300'}`} 
                      value={profile?.emergency_contact_first_name || ''} 
                      onChange={e => handleProfileChange('emergency_contact_first_name', e.target.value)}
                      placeholder="Contact's first name"
                    />
                    {fieldErrors.emergency_contact_first_name && <div className="text-red-500 text-xs mt-1">{fieldErrors.emergency_contact_first_name}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Middle Name</label>
                    <input 
                      type="text" 
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.emergency_contact_middle_name ? 'border-red-500' : 'border-gray-300'}`} 
                      value={profile?.emergency_contact_middle_name || ''} 
                      onChange={e => handleProfileChange('emergency_contact_middle_name', e.target.value)}
                      placeholder="Contact's middle name"
                    />
                    {fieldErrors.emergency_contact_middle_name && <div className="text-red-500 text-xs mt-1">{fieldErrors.emergency_contact_middle_name}</div>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <input
                      type="text"
                      maxLength={11}
                      pattern="^09\\d{9}$"
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.emergency_contact_number ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.emergency_contact_number || ''}
                      onChange={e => handleProfileChange('emergency_contact_number', e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="09XXXXXXXXX"
                    />
                    {fieldErrors.emergency_contact_number && <div className="text-red-500 text-xs mt-1">{fieldErrors.emergency_contact_number}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Relationship *</label>
                    <select 
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.emergency_contact_relationship ? 'border-red-500' : 'border-gray-300'}`} 
                      value={profile?.emergency_contact_relationship || ''} 
                      onChange={e => handleProfileChange('emergency_contact_relationship', e.target.value)}
                    >
                      <option value="">Select relationship</option>
                      <option value="Parent">Parent</option>
                      <option value="Child">Child</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Relative">Relative</option>
                      <option value="Friend">Friend</option>
                      <option value="Other">Other</option>
                    </select>
                    {fieldErrors.emergency_contact_relationship && <div className="text-red-500 text-xs mt-1">{fieldErrors.emergency_contact_relationship}</div>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Barangay *</label>
                    <input 
                      type="text" 
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.emergency_contact_barangay ? 'border-red-500' : 'border-gray-300'}`} 
                      value={profile?.emergency_contact_barangay || ''} 
                      onChange={e => handleProfileChange('emergency_contact_barangay', e.target.value)}
                      placeholder="e.g., Barangay Tugbungan"
                    />
                    {fieldErrors.emergency_contact_barangay && <div className="text-red-500 text-xs mt-1">{fieldErrors.emergency_contact_barangay}</div>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street *</label>
                    <input 
                      type="text" 
                      className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.emergency_contact_street ? 'border-red-500' : 'border-gray-300'}`} 
                      value={profile?.emergency_contact_street || ''} 
                      onChange={e => handleProfileChange('emergency_contact_street', e.target.value)}
                      placeholder="e.g., 123 Main Street"
                    />
                    {fieldErrors.emergency_contact_street && <div className="text-red-500 text-xs mt-1">{fieldErrors.emergency_contact_street}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        const freqOptions = [
          'Frequency', 'Once daily', 'Twice daily', 'Thrice daily', 'Every other day', 'Weekly', 'As needed'
        ];
        return (
          <div className="space-y-6">
            {/* Title */}
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Health History</h2>
              <p className="text-sm text-gray-600">Tell us about your current health conditions and medications</p>
            </div>

            {/* Comorbid Illnesses */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <span className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2">1</span>
                Current Health Conditions
              </h3>
              <p className="text-sm text-gray-700 mb-4">Check all conditions that you currently have:</p>
              
              {/* Mobile-first checkbox layout */}
              <div className="space-y-3">
                {comorbidIllnesses.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id={`comorbid-${item.id}`}
                        className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mt-0.5 flex-shrink-0"
                        checked={Array.isArray(profile?.comorbid_illnesses) && profile.comorbid_illnesses.includes(item.label)}
                        onChange={e => handleCheckboxArrayChange('comorbid_illnesses', item.label, e.target.checked)}
                      />
                      <label htmlFor={`comorbid-${item.id}`} className="ml-3 text-sm font-medium text-gray-900 cursor-pointer">{item.label}</label>
                    </div>
                    {/* Food allergy specify */}
                    {item.label === 'Food Allergies' && Array.isArray(profile?.comorbid_illnesses) && profile.comorbid_illnesses.includes('Food Allergies') && (
                      <div className="mt-3 ml-7">
                        <input
                          type="text"
                          placeholder="Specify food allergies (e.g., shellfish, nuts)"
                          className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm ${fieldErrors.food_allergy_specify ? 'border-red-500' : 'border-gray-300'}`}
                          value={profile?.food_allergy_specify || ''}
                          onChange={e => handleProfileChange('food_allergy_specify', e.target.value)}
                        />
                        {fieldErrors.food_allergy_specify && <div className="text-red-500 text-xs mt-1">{fieldErrors.food_allergy_specify}</div>}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Psychiatric Illness Section */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="psychiatric"
                      className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mt-0.5 flex-shrink-0"
                      checked={Array.isArray(profile?.comorbid_illnesses) && profile.comorbid_illnesses.includes('Psychiatric Illness')}
                      onChange={e => handleCheckboxArrayChange('comorbid_illnesses', 'Psychiatric Illness', e.target.checked)}
                    />
                    <label htmlFor="psychiatric" className="ml-3 text-sm font-bold text-gray-900 cursor-pointer">Psychiatric Illness</label>
                  </div>
                  
                  {/* Psychiatric sub-options */}
                  {Array.isArray(profile?.comorbid_illnesses) && profile.comorbid_illnesses.includes('Psychiatric Illness') && (
                    <div className="mt-3 ml-7 space-y-2">
                      {['Major Depressive Disorder', 'Bipolar Disorder', 'Generalized Anxiety Disorder', 'Panic Disorder', 'Posttraumatic Stress Disorder', 'Schizophrenia'].map(psychItem => (
                        <div key={psychItem} className="flex items-start">
                          <input
                            type="checkbox"
                            id={`psych-${psychItem}`}
                            className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mt-0.5 flex-shrink-0"
                            checked={Array.isArray(profile?.psychiatric_illnesses) && profile.psychiatric_illnesses.includes(psychItem)}
                            onChange={e => handleCheckboxArrayChange('psychiatric_illnesses', psychItem, e.target.checked)}
                          />
                          <label htmlFor={`psych-${psychItem}`} className="ml-2 text-sm text-gray-700 cursor-pointer">{psychItem}</label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Other Condition */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id="othercomorbid"
                      className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mt-0.5 flex-shrink-0"
                      checked={!!(profile?.other_comorbid_specify && profile.other_comorbid_specify.trim() !== '')}
                      onChange={e => {
                        if (!e.target.checked) {
                          // When unchecked, remove the other condition from both fields
                          handleProfileChange('other_comorbid_specify', '');
                          // Also remove it from comorbid_illnesses array if it exists
                          if (profile?.other_comorbid_specify && profile.other_comorbid_specify.trim() !== '') {
                            const currentIllnesses = Array.isArray(profile?.comorbid_illnesses) ? [...profile.comorbid_illnesses] : [];
                            const updatedIllnesses = currentIllnesses.filter(illness => illness !== profile.other_comorbid_specify.trim());
                            handleProfileChange('comorbid_illnesses', updatedIllnesses);
                          }
                        }
                      }}
                    />
                    <label htmlFor="othercomorbid" className="ml-3 text-sm font-bold text-gray-900 cursor-pointer">Other Condition</label>
                  </div>
                  <div className="mt-3 ml-7">
                    <input
                      type="text"
                      placeholder="Specify other health condition"
                      className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm ${fieldErrors.other_comorbid_specify ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.other_comorbid_specify || ''}
                      onChange={e => {
                        const newValue = e.target.value;
                        const currentIllnesses = Array.isArray(profile?.comorbid_illnesses) ? [...profile.comorbid_illnesses] : [];
                        
                        // Remove the previous "other" value from comorbid_illnesses if it exists
                        if (profile?.other_comorbid_specify && profile.other_comorbid_specify.trim() !== '') {
                          const filteredIllnesses = currentIllnesses.filter(illness => illness !== profile.other_comorbid_specify.trim());
                          handleProfileChange('comorbid_illnesses', filteredIllnesses);
                        }
                        
                        // Update the other_comorbid_specify field
                        handleProfileChange('other_comorbid_specify', newValue);
                        
                        // Add the new value to comorbid_illnesses if it's not empty
                        if (newValue && newValue.trim() !== '') {
                          const updatedIllnesses = Array.isArray(profile?.comorbid_illnesses) ? [...profile.comorbid_illnesses] : [];
                          // Remove any previous "other" value and add the new one
                          const finalIllnesses = updatedIllnesses.filter(illness => 
                            !profile?.other_comorbid_specify || illness !== profile.other_comorbid_specify.trim()
                          );
                          finalIllnesses.push(newValue.trim());
                          handleProfileChange('comorbid_illnesses', finalIllnesses);
                        }
                      }}
                    />
                    {fieldErrors.other_comorbid_specify && <div className="text-red-500 text-xs mt-1">{fieldErrors.other_comorbid_specify}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Maintenance Medications */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <span className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2">2</span>
                Current Medications
              </h3>
              <p className="text-sm text-gray-700 mb-4">List any medications you take regularly:</p>
              
              {/* Mobile-optimized medication table */}
              <div className="space-y-4">
                {(profile?.maintenance_medications || [{}]).map((med: any, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-800">Medication #{idx + 1}</span>
                      {(profile?.maintenance_medications || []).length > 1 && (
                        <button
                          className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                          onClick={() => handleRemoveMedication(idx)}
                          type="button"
                        >×</button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Drug Name</label>
                        <select
                          className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                          value={med.drug || ''}
                          onChange={e => handleMedicationChange(idx, 'drug', e.target.value)}
                        >
                          <option value="">Select a drug</option>
                          {['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Metformin', 'Atorvastatin', 'Losartan', 'Omeprazole', 'Simvastatin', 'Aspirin', 'Levothyroxine', 'Other'].map(drugName => (
                            <option key={drugName} value={drugName}>{drugName}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Dose</label>
                          <input
                            type="text"
                            placeholder="e.g., 500"
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                            value={med.dose || ''}
                            onChange={e => handleMedicationChange(idx, 'dose', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                          <select
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                            value={med.unit || 'mg'}
                            onChange={e => handleMedicationChange(idx, 'unit', e.target.value)}
                          >
                            <option>mg</option>
                            <option>mcg</option>
                            <option>g</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                          <select
                            className="w-full border border-gray-300 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                            value={med.frequency || ''}
                            onChange={e => handleMedicationChange(idx, 'frequency', e.target.value)}
                          >
                            {freqOptions.map(f => <option key={f} value={f}>{f}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <button
                  className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  onClick={handleAddMedication}
                  type="button"
                >+ Add Medication</button>
              </div>
            </div>

            {/* Vaccination History */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <span className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2">3</span>
                Vaccination Status
              </h3>
              <p className="text-sm text-gray-700 mb-4">Please indicate your vaccination status for each vaccine:</p>
              
              <div className="space-y-4">
                {vaccinations.map(vaccine => (
                  <div key={vaccine.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <label className="text-sm font-medium text-gray-900 mb-3 sm:mb-0">{vaccine.name}</label>
                      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`vaccine-${vaccine.id}`}
                            value="fully_vaccinated"
                            className="h-4 w-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                            checked={profile?.vaccination_history?.[vaccine.name] === 'fully_vaccinated'}
                            onChange={() => {
                              const newHistory = { ...(profile?.vaccination_history || {}) };
                              newHistory[vaccine.name] = 'fully_vaccinated';
                              handleProfileChange('vaccination_history', newHistory);
                            }}
                          />
                          <span className="text-xs text-gray-700 font-medium">Fully Vaccinated</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`vaccine-${vaccine.id}`}
                            value="partially_vaccinated"
                            className="h-4 w-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                            checked={profile?.vaccination_history?.[vaccine.name] === 'partially_vaccinated'}
                            onChange={() => {
                              const newHistory = { ...(profile?.vaccination_history || {}) };
                              newHistory[vaccine.name] = 'partially_vaccinated';
                              handleProfileChange('vaccination_history', newHistory);
                            }}
                          />
                          <span className="text-xs text-gray-700 font-medium">Partial</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`vaccine-${vaccine.id}`}
                            value="unvaccinated"
                            className="h-4 w-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                            checked={profile?.vaccination_history?.[vaccine.name] === 'unvaccinated'}
                            onChange={() => {
                              const newHistory = { ...(profile?.vaccination_history || {}) };
                              newHistory[vaccine.name] = 'unvaccinated';
                              handleProfileChange('vaccination_history', newHistory);
                            }}
                          />
                          <span className="text-xs text-gray-700 font-medium">None</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`vaccine-${vaccine.id}`}
                            value="boosted"
                            className="h-4 w-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                            checked={profile?.vaccination_history?.[vaccine.name] === 'boosted'}
                            onChange={() => {
                              const newHistory = { ...(profile?.vaccination_history || {}) };
                              newHistory[vaccine.name] = 'boosted';
                              handleProfileChange('vaccination_history', newHistory);
                            }}
                          />
                          <span className="text-xs text-gray-700 font-medium">Boosted</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name={`vaccine-${vaccine.id}`}
                            value="lapsed"
                            className="h-4 w-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                            checked={profile?.vaccination_history?.[vaccine.name] === 'lapsed' || !profile?.vaccination_history?.[vaccine.name]}
                            onChange={() => {
                              const newHistory = { ...(profile?.vaccination_history || {}) };
                              newHistory[vaccine.name] = 'lapsed';
                              handleProfileChange('vaccination_history', newHistory);
                            }}
                          />
                          <span className="text-xs text-gray-600 font-medium">Lapsed</span>
                        </label>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            {/* Title */}
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Medical & Family History</h2>
              <p className="text-sm text-gray-600">Tell us about your past medical conditions and family health history</p>
            </div>

            {/* Past Medical & Surgical History */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <span className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2">1</span>
                Past Medical & Surgical History
              </h3>
              <p className="text-sm text-gray-700 mb-4">Check any conditions you have had in the past:</p>
              
              <div className="space-y-3">
                {pastMedicalHistories.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-start">
                      <input 
                        type="checkbox" 
                        id={`past-${item.id}`} 
                        className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mt-0.5 flex-shrink-0" 
                        checked={Array.isArray(profile?.past_medical_history) && profile.past_medical_history.includes(item.name)} 
                        onChange={e => handleCheckboxArrayChange('past_medical_history', item.name, e.target.checked)}
                      />
                      <label htmlFor={`past-${item.id}`} className="ml-3 text-sm font-medium text-gray-900 cursor-pointer">{item.name}</label>
                    </div>
                  </div>
                ))}
                
                {/* Other option */}
                {/* Other Past Medical Condition */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      id="other-past" 
                      className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mt-0.5 flex-shrink-0" 
                      checked={!!(profile?.past_medical_history_other && profile.past_medical_history_other.trim() !== '')}
                      onChange={e => {
                        if (!e.target.checked) {
                          // When unchecked, remove the other condition from both fields
                          handleProfileChange('past_medical_history_other', '');
                          // Also remove it from past_medical_history array if it exists
                          if (profile?.past_medical_history_other && profile.past_medical_history_other.trim() !== '') {
                            const currentHistory = Array.isArray(profile?.past_medical_history) ? [...profile.past_medical_history] : [];
                            const updatedHistory = currentHistory.filter(condition => condition !== profile.past_medical_history_other.trim());
                            handleProfileChange('past_medical_history', updatedHistory);
                          }
                        }
                      }}
                    />
                    <label htmlFor="other-past" className="ml-3 text-sm font-bold text-gray-900 cursor-pointer">Other Medical Condition</label>
                  </div>
                  <div className="mt-3 ml-7">
                    <input 
                      type="text" 
                      placeholder="Specify the medical condition" 
                      className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm ${fieldErrors.past_medical_history_other ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.past_medical_history_other || ''} 
                      onChange={e => {
                        const newValue = e.target.value;
                        const currentHistory = Array.isArray(profile?.past_medical_history) ? [...profile.past_medical_history] : [];
                        
                        // Remove the previous "other" value from past_medical_history if it exists
                        if (profile?.past_medical_history_other && profile.past_medical_history_other.trim() !== '') {
                          const filteredHistory = currentHistory.filter(condition => condition !== profile.past_medical_history_other.trim());
                          handleProfileChange('past_medical_history', filteredHistory);
                        }
                        
                        // Update the past_medical_history_other field
                        handleProfileChange('past_medical_history_other', newValue);
                        
                        // Add the new value to past_medical_history if it's not empty
                        if (newValue && newValue.trim() !== '') {
                          const updatedHistory = Array.isArray(profile?.past_medical_history) ? [...profile.past_medical_history] : [];
                          // Remove any previous "other" value and add the new one
                          const finalHistory = updatedHistory.filter(condition => 
                            !profile?.past_medical_history_other || condition !== profile.past_medical_history_other.trim()
                          );
                          finalHistory.push(newValue.trim());
                          handleProfileChange('past_medical_history', finalHistory);
                        }
                      }} 
                    />
                    {fieldErrors.past_medical_history_other && <div className="text-red-500 text-xs mt-1">{fieldErrors.past_medical_history_other}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* Hospital Admission / Surgery */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <span className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2">2</span>
                Hospital Admission / Surgery
              </h3>
              <p className="text-sm text-gray-700 mb-4">Have you ever been admitted to the hospital and/or undergone surgery?</p>
              
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className={`flex flex-col sm:flex-row gap-4 ${fieldErrors.hospital_admission_or_surgery ? 'border border-red-500 rounded-lg p-3' : ''}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="hospital-admit"
                      value="false"
                      className="h-4 w-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                      checked={profile?.hospital_admission_or_surgery === false}
                      onChange={() => handleProfileChange('hospital_admission_or_surgery', false)}
                    />
                    <span className="text-sm font-medium text-gray-900">No, I have never been hospitalized or had surgery</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="hospital-admit"
                      value="true"
                      className="h-4 w-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                      checked={profile?.hospital_admission_or_surgery === true}
                      onChange={() => handleProfileChange('hospital_admission_or_surgery', true)}
                    />
                    <span className="text-sm font-medium text-gray-900">Yes, I have been hospitalized and/or had surgery</span>
                  </label>
                </div>
                {fieldErrors.hospital_admission_or_surgery && <div className="text-red-500 text-xs mt-2">{fieldErrors.hospital_admission_or_surgery}</div>}
                
                {/* Conditional input for surgery/admission details */}
                {profile?.hospital_admission_or_surgery === true && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Please specify the reason for admission and/or type of surgery: <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm ${fieldErrors.hospital_admission_details ? 'border-red-500' : 'border-gray-300'}`}
                      rows={3}
                      value={profile?.hospital_admission_details || ''}
                      onChange={e => handleProfileChange('hospital_admission_details', e.target.value)}
                      placeholder="Please describe the reason for hospital admission and/or type of surgery performed..."
                    />
                    {fieldErrors.hospital_admission_details && <div className="text-red-500 text-xs mt-1">{fieldErrors.hospital_admission_details}</div>}
                  </div>
                )}
              </div>
            </div>

            {/* Family Medical History */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <span className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2">3</span>
                Family Medical History
              </h3>
              <p className="text-sm text-gray-700 mb-4">Check the known health conditions of your immediate family members (parents, siblings, grandparents):</p>
              
              <div className="space-y-3">
                {familyMedicalHistories.map(item => (
                  <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200">
                    <div className="flex items-start">
                      <input 
                        type="checkbox" 
                        id={`fam-${item.id}`} 
                        className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mt-0.5 flex-shrink-0" 
                        checked={Array.isArray(profile?.family_medical_history) && profile.family_medical_history.includes(item.name)} 
                        onChange={e => handleCheckboxArrayChange('family_medical_history', item.name, e.target.checked)}
                      />
                      <label htmlFor={`fam-${item.id}`} className="ml-3 text-sm font-medium text-gray-900 cursor-pointer">{item.name}</label>
                    </div>
                  </div>
                ))}
                
                {/* Allergies - Specify */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      id="fam-allergies" 
                      className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mt-0.5 flex-shrink-0" 
                      checked={!!(profile?.family_medical_history_allergies && profile.family_medical_history_allergies.trim())} 
                      onChange={e => {
                        if (!e.target.checked) {
                          // When unchecked, remove the allergies from both fields
                          handleProfileChange('family_medical_history_allergies', '');
                          // Also remove it from family_medical_history array if it exists
                          if (profile?.family_medical_history_allergies && profile.family_medical_history_allergies.trim() !== '') {
                            const currentHistory = Array.isArray(profile?.family_medical_history) ? [...profile.family_medical_history] : [];
                            const updatedHistory = currentHistory.filter(condition => condition !== profile.family_medical_history_allergies.trim());
                            handleProfileChange('family_medical_history', updatedHistory);
                          }
                        }
                      }}
                    />
                    <label htmlFor="fam-allergies" className="ml-3 text-sm font-bold text-gray-900 cursor-pointer">Allergies (Specify)</label>
                  </div>
                  <div className="mt-3 ml-7">
                    <input 
                      type="text" 
                      placeholder="Specify family allergies (e.g., drug allergies, food allergies)" 
                      className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm ${fieldErrors.family_medical_history_allergies ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.family_medical_history_allergies || ''} 
                      onChange={e => {
                        const newValue = e.target.value;
                        const currentHistory = Array.isArray(profile?.family_medical_history) ? [...profile.family_medical_history] : [];
                        
                        // Remove the previous allergies value from family_medical_history if it exists
                        if (profile?.family_medical_history_allergies && profile.family_medical_history_allergies.trim() !== '') {
                          const filteredHistory = currentHistory.filter(condition => condition !== profile.family_medical_history_allergies.trim());
                          handleProfileChange('family_medical_history', filteredHistory);
                        }
                        
                        // Update the family_medical_history_allergies field
                        handleProfileChange('family_medical_history_allergies', newValue);
                        
                        // Add the new value to family_medical_history if it's not empty
                        if (newValue && newValue.trim() !== '') {
                          const updatedHistory = Array.isArray(profile?.family_medical_history) ? [...profile.family_medical_history] : [];
                          // Remove any previous allergies value and add the new one
                          const finalHistory = updatedHistory.filter(condition => 
                            !profile?.family_medical_history_allergies || condition !== profile.family_medical_history_allergies.trim()
                          );
                          finalHistory.push(newValue.trim());
                          handleProfileChange('family_medical_history', finalHistory);
                        }
                      }} 
                    />
                    {fieldErrors.family_medical_history_allergies && <div className="text-red-500 text-xs mt-1">{fieldErrors.family_medical_history_allergies}</div>}
                  </div>
                </div>
                
                {/* Other Family Condition */}
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      id="fam-other" 
                      className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mt-0.5 flex-shrink-0" 
                      checked={!!(profile?.family_medical_history_other && profile.family_medical_history_other.trim())} 
                      onChange={e => {
                        if (!e.target.checked) {
                          // When unchecked, remove the other condition from both fields
                          handleProfileChange('family_medical_history_other', '');
                          // Also remove it from family_medical_history array if it exists
                          if (profile?.family_medical_history_other && profile.family_medical_history_other.trim() !== '') {
                            const currentHistory = Array.isArray(profile?.family_medical_history) ? [...profile.family_medical_history] : [];
                            const updatedHistory = currentHistory.filter(condition => condition !== profile.family_medical_history_other.trim());
                            handleProfileChange('family_medical_history', updatedHistory);
                          }
                        }
                      }}
                    />
                    <label htmlFor="fam-other" className="ml-3 text-sm font-bold text-gray-900 cursor-pointer">Other Family Medical Condition</label>
                  </div>
                  <div className="mt-3 ml-7">
                    <input 
                      type="text" 
                      placeholder="Specify other family medical condition" 
                      className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm ${fieldErrors.family_medical_history_other ? 'border-red-500' : 'border-gray-300'}`}
                      value={profile?.family_medical_history_other || ''} 
                      onChange={e => {
                        const newValue = e.target.value;
                        const currentHistory = Array.isArray(profile?.family_medical_history) ? [...profile.family_medical_history] : [];
                        
                        // Remove the previous "other" value from family_medical_history if it exists
                        if (profile?.family_medical_history_other && profile.family_medical_history_other.trim() !== '') {
                          const filteredHistory = currentHistory.filter(condition => condition !== profile.family_medical_history_other.trim());
                          handleProfileChange('family_medical_history', filteredHistory);
                        }
                        
                        // Update the family_medical_history_other field
                        handleProfileChange('family_medical_history_other', newValue);
                        
                        // Add the new value to family_medical_history if it's not empty
                        if (newValue && newValue.trim() !== '') {
                          const updatedHistory = Array.isArray(profile?.family_medical_history) ? [...profile.family_medical_history] : [];
                          // Remove any previous "other" value and add the new one
                          const finalHistory = updatedHistory.filter(condition => 
                            !profile?.family_medical_history_other || condition !== profile.family_medical_history_other.trim()
                          );
                          finalHistory.push(newValue.trim());
                          handleProfileChange('family_medical_history', finalHistory);
                        }
                      }} 
                    />
                    {fieldErrors.family_medical_history_other && <div className="text-red-500 text-xs mt-1">{fieldErrors.family_medical_history_other}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            {/* Title */}
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Review & Submit</h2>
              <p className="text-sm text-gray-600">Please review all information before submitting</p>
            </div>

            {/* Personal Information Summary */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2 font-bold">1</span>
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs">Full Name</p>
                  <p className="text-gray-900 font-semibold">{profile?.name} {profile?.first_name} {profile?.middle_name} {profile?.suffix}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs">Date of Birth</p>
                  <p className="text-gray-900 font-semibold">{profile?.date_of_birth || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs">Age</p>
                  <p className="text-gray-900 font-semibold">{profile?.age || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs">Gender</p>
                  <p className="text-gray-900 font-semibold">{profile?.gender || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs">Blood Type</p>
                  <p className="text-gray-900 font-semibold">{profile?.blood_type || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs">Phone Number</p>
                  <p className="text-gray-900 font-semibold">{profile?.contact_number || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 sm:col-span-2">
                  <p className="font-medium text-gray-600 text-xs">Email</p>
                  <p className="text-gray-900 font-semibold">{profile?.email || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 sm:col-span-2 lg:col-span-3">
                  <p className="font-medium text-gray-600 text-xs">Address</p>
                  <p className="text-gray-900 font-semibold">{profile?.street}, {profile?.barangay}, {profile?.city_municipality}</p>
                </div>
              </div>
            </div>

            {/* Emergency Contact Summary */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2 font-bold">2</span>
                Emergency Contact
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs">Full Name</p>
                  <p className="text-gray-900 font-semibold">{profile?.emergency_contact_surname} {profile?.emergency_contact_first_name} {profile?.emergency_contact_middle_name}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs">Phone Number</p>
                  <p className="text-gray-900 font-semibold">{profile?.emergency_contact_number || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs">Relationship</p>
                  <p className="text-gray-900 font-semibold">{profile?.emergency_contact_relationship || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs">Address</p>
                  <p className="text-gray-900 font-semibold">{profile?.emergency_contact_street}, {profile?.emergency_contact_barangay}</p>
                </div>
              </div>
            </div>

            {/* Health History Summary */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2 font-bold">3</span>
                Health History
              </h3>
              
              <div className="space-y-4 text-sm">
                {/* Current Health Conditions */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs mb-2">Current Health Conditions</p>
                  <p className="text-gray-900 font-semibold">
                    {Array.isArray(profile?.comorbid_illnesses) && profile.comorbid_illnesses.length > 0 
                      ? profile.comorbid_illnesses.join(', ') 
                      : 'None specified'}
                  </p>
                  {profile?.food_allergy_specify && (
                    <p className="text-gray-700 mt-1 text-xs">Food Allergies: {profile.food_allergy_specify}</p>
                  )}
                  {profile?.other_comorbid_specify && (
                    <p className="text-gray-700 mt-1 text-xs">Other: {profile.other_comorbid_specify}</p>
                  )}
                </div>

                {/* Medications */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs mb-2">Maintenance Medications</p>
                  <p className="text-gray-900 font-semibold">
                    {Array.isArray(profile?.maintenance_medications) && profile.maintenance_medications.length > 0
                      ? profile.maintenance_medications.map(med => `${med.drug} ${med.dose}${med.unit} - ${med.frequency}`).join(', ')
                      : 'None specified'}
                  </p>
                </div>

                {/* Vaccination Status */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs mb-2">Vaccination Status</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {profile?.vaccination_history && Object.entries(profile.vaccination_history).map(([vaccine, status]) => (
                      <div key={vaccine} className="flex justify-between">
                        <span className="text-gray-700">{vaccine}:</span>
                        <span className="font-semibold text-gray-900">
                          {status?.toString().charAt(0).toUpperCase() + status?.toString().slice(1) || 'Lapsed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Medical & Family History Summary */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2 font-bold">4</span>
                Medical & Family History
              </h3>
              
              <div className="space-y-4 text-sm">
                {/* Past Medical History */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs mb-2">Past Medical History</p>
                  <p className="text-gray-900 font-semibold">
                    {Array.isArray(profile?.past_medical_history) && profile.past_medical_history.length > 0 
                      ? profile.past_medical_history.join(', ') 
                      : 'None specified'}
                  </p>
                  {profile?.past_medical_history_other && (
                    <p className="text-gray-700 mt-1 text-xs">Other: {profile.past_medical_history_other}</p>
                  )}
                </div>

                {/* Hospital Admission/Surgery */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs mb-2">Hospital Admission/Surgery</p>
                  <p className="text-gray-900 font-semibold">
                    {profile?.hospital_admission_or_surgery === true ? 'Yes' : 'No'}
                  </p>
                  {profile?.hospital_admission_details && (
                    <p className="text-gray-700 mt-1 text-xs">{profile.hospital_admission_details}</p>
                  )}
                </div>

                {/* Family Medical History */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs mb-2">Family Medical History</p>
                  <p className="text-gray-900 font-semibold">
                    {Array.isArray(profile?.family_medical_history) && profile.family_medical_history.length > 0 
                      ? profile.family_medical_history.join(', ') 
                      : 'None specified'}
                  </p>
                  {profile?.family_medical_history_other && (
                    <p className="text-gray-700 mt-1 text-xs">Other: {profile.family_medical_history_other}</p>
                  )}
                  {profile?.family_medical_history_allergies && (
                    <p className="text-gray-700 mt-1 text-xs">Allergies: {profile.family_medical_history_allergies}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Action Notice */}
            <div className="bg-gradient-to-r from-gray-100 to-gray-200 p-4 sm:p-6 rounded-xl border border-gray-300">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-[#800000] rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-700 text-center text-sm sm:text-base">
                Please review all the information you've provided above. Once you submit, you'll be able to proceed with your <span className="font-semibold text-[#800000]">{option}</span>.
              </p>
              <p className="text-gray-500 text-center text-xs mt-2">
                You can go back to any previous step to make changes before submitting.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleNext = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== HANDLE NEXT CLICKED ===');
      console.log('Current step:', currentStep);
      console.log('About to validate step:', currentStep);
    }
    
    if (!validateStep(currentStep)) {
      // Get specific error messages for missing fields
      const errorMessages = Object.entries(fieldErrors)
        .filter(([_, message]) => message)
        .map(([field, message]) => {
          // Create user-friendly field names
          const fieldNames: { [key: string]: string } = {
            'name': 'Surname',
            'first_name': 'First Name',
            'middle_name': 'Middle Name',
            'date_of_birth': 'Birthday',
            'age': 'Age',
            'gender': 'Sex',
            'blood_type': 'Blood Type',
            'religion': 'Religion',
            'nationality': 'Nationality',
            'civil_status': 'Civil Status',
            'email': 'Email Address',
            'contact_number': 'Contact Number',
            'city_municipality': 'City/Municipality',
            'barangay': 'Barangay',
            'street': 'Street',
            'photo': 'Profile Photo',
            'emergency_contact_surname': 'Emergency Contact Surname',
            'emergency_contact_first_name': 'Emergency Contact First Name',
            'emergency_contact_middle_name': 'Emergency Contact Middle Name',
            'emergency_contact_number': 'Emergency Contact Number',
            'emergency_contact_relationship': 'Emergency Contact Relationship',
            'emergency_contact_barangay': 'Emergency Contact Barangay',
            'emergency_contact_street': 'Emergency Contact Street',
            'hospital_admission_or_surgery': 'Hospital Admission/Surgery',
            'hospital_admission_details': 'Hospital Admission/Surgery Details',
            'past_medical_history_other': 'Past Medical History (Other)',
            'food_allergy_specify': 'Food Allergies Specification',
            'other_comorbid_specify': 'Other Comorbid Illness Specification',
            'family_medical_history_other': 'Family Medical History (Other)',
            'family_medical_history_allergies': 'Family Medical History Allergies'
          };
          
          const friendlyName = fieldNames[field] || field;
          return `• ${friendlyName}: ${message}`;
        });
      
      const errorMessage = errorMessages.length > 0 
        ? `Please fix the following issues:\n\n${errorMessages.join('\n')}`
        : 'Please fill in all required fields before proceeding.';
      
      setFeedbackMessage(errorMessage);
      setFeedbackOpen(true);
      return;
    }
    if (currentStep < steps.length) {
      // Clear any previous errors when moving to next step
      setFieldErrors({});
      setCurrentStep(currentStep + 1);
    } else {
      await handleProfileSave();
      setTimeout(() => {
        if (option === 'Request Medical Certificate') {
          router.push('/patient/upload-documents');
        } else if (option === 'Book Dental Consultation') {
          router.push({
            pathname: '/patient/dental-information-record',
            query: { ...router.query, option: 'Book Dental Consultation' }
          });
        } else if (option === 'Book Medical Consultation') {
          router.push('/appointments/medical');
        } else {
          // Redirect back to the first step instead of dashboard
          setCurrentStep(1);
          setFeedbackMessage('Profile saved successfully! You can now update it or proceed with other actions.');
          setFeedbackOpen(true);
        }
      }, 2000);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      // Clear any errors when going back
      setFieldErrors({});
      setCurrentStep(currentStep - 1);
    }
  };

  // Dummy handlers for Layout (no login/signup in this flow)
  const handleLoginClick = () => {};
  const handleSignupClick = () => {};

  return (
    <Layout onLoginClick={handleLoginClick} onSignupClick={handleSignupClick}>
      <FeedbackModal open={feedbackOpen} message={feedbackMessage} onClose={() => setFeedbackOpen(false)} />
      {/* Plain white background */}
      <div className="fixed inset-0 w-full h-full bg-white -z-10" />
      <div className="min-h-screen py-2 sm:py-4 px-3 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Mobile-first Header */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <div className="flex items-center bg-white rounded-full px-3 sm:px-4 py-2 shadow-lg">
                  <span className="inline-block w-8 h-8 sm:w-10 sm:h-10 bg-[#800000] text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-xl mr-2 sm:mr-3">{currentStep}</span>
                  <span className="text-base sm:text-lg lg:text-2xl font-bold text-[#800000]">{steps[currentStep-1].title}</span>
                </div>
              </div>
              
              {/* Mobile Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3 sm:mb-4">
                <div
                  className="bg-[#800000] h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              
              {/* Step indicators - responsive visibility */}
              <div className="hidden sm:flex justify-between text-xs sm:text-sm font-semibold">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`px-2 py-1 rounded-lg transition-colors ${
                      currentStep >= step.id ? 'text-[#800000] bg-[#800000] bg-opacity-10' : 'text-gray-400'
                    }`}
                  >
                    {step.title}
                  </div>
                ))}
              </div>
              
              {/* Mobile-only current step indicator */}
              <div className="sm:hidden">
                <span className="text-sm text-gray-600">
                  Step {currentStep} of {steps.length}
                </span>
              </div>
              
              {/* School Year and Semester Information */}
              {currentSchoolYear && currentSemester && (
                <div className="mt-4 mb-2">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mx-auto max-w-md">
                    <div className="text-center">
                      <p className="text-sm font-semibold text-blue-800">
                        {currentSchoolYear.academic_year} • {
                          currentSemester === '1st_semester' ? 'First Semester' :
                          currentSemester === '2nd_semester' ? 'Second Semester' :
                          currentSemester === 'summer' ? 'Summer Semester' : currentSemester
                        }
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Profile will be saved for this academic period
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Auto-fill notification */}
              {isAutoFilled && autoFilledFromYear && autoFilledFromSemester && (
                <div className="mt-2 mb-2">
                  <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 mx-auto max-w-md">
                    <div className="text-center">
                      <p className="text-xs text-green-700">
                        ✓ Profile data auto-filled from {autoFilledFromSemester}, {autoFilledFromYear}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Main Card - Enhanced responsive design */}
            <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-md sm:shadow-lg lg:shadow-2xl border border-gray-200 animate-fade-in-up">
              {/* Content */}
              <div className="p-3 sm:p-4 lg:p-8">
                {renderStepContent()}
              </div>
              
              {/* Navigation Buttons - Enhanced mobile design */}
              <div className="p-3 sm:p-4 lg:p-6 border-t border-gray-200 bg-gray-50 sm:bg-transparent rounded-b-lg sm:rounded-b-xl lg:rounded-b-2xl">
                <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4">
                  <button
                    onClick={handleBack}
                    className={`w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-3 rounded-lg font-semibold transition-all duration-200 text-center text-sm sm:text-base ${
                      currentStep === 1
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800 active:scale-95'
                    }`}
                    disabled={currentStep === 1}
                  >
                    ← Back
                  </button>
                  <button
                    onClick={handleNext}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-3 bg-[#800000] text-white rounded-lg font-semibold hover:bg-[#a83232] active:bg-[#600000] active:scale-95 transition-all duration-200 shadow-md text-center text-sm sm:text-base"
                  >
                    {currentStep === steps.length ? 'Submit Profile' : 'Next →'}
                  </button>
                </div>
              </div>
            </div>
            
            {/* Mobile helper text */}
            <div className="text-center mt-4 sm:hidden">
              <p className="text-xs text-gray-500">
                Tap fields to focus • Use keyboard navigation • Required fields marked with *
              </p>
            </div>
          </div>
        </div>
      <style jsx>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.39, 0.575, 0.565, 1) both;
        }
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Enhanced mobile input styling */
        @media (max-width: 640px) {
          input[type="text"],
          input[type="email"],
          input[type="tel"],
          input[type="date"],
          input[type="number"],
          select,
          textarea {
            min-height: 48px;
            font-size: 16px;
            padding: 12px 16px;
          }
          
          button {
            min-height: 48px;
            font-size: 16px;
          }
          
          .form-section {
            padding: 16px;
          }
        }
        
        /* Improved focus states for better accessibility */
        input:focus,
        select:focus,
        textarea:focus {
          outline: 2px solid #800000;
          outline-offset: 2px;
        }
        
        /* Enhanced button animations */
        button {
          transform: translateY(0);
          transition: all 0.2s ease;
        }
        
        button:active {
          transform: translateY(1px);
        }
        
        /* Smooth transitions for all interactive elements */
        .transition-enhanced {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
    </Layout>
  );
}