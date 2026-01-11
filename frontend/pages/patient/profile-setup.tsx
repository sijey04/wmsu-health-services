import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { patientProfileAPI, djangoApiClient } from '../../utils/api';
import FeedbackModal from '../../components/feedbackmodal';
import ProfileSaveConfirmationModal from '../../components/ProfileSaveConfirmationModal';
import axios from 'axios';

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
  const [photoUploading, setPhotoUploading] = useState(false);
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

  // Admin controls state
  const [profileRequirements, setProfileRequirements] = useState<any[]>([]);
  const [userTypeInformations, setUserTypeInformations] = useState<any[]>([]);
  const [currentUserTypeConfig, setCurrentUserTypeConfig] = useState<any>(null);
  const [availableFields, setAvailableFields] = useState<any>({
    personal: [],
    health: [],
    emergency: [],
    family: []
  });
  const [requiredFieldsByStep, setRequiredFieldsByStep] = useState<any>({
    1: [
      'name', 'first_name', 'date_of_birth', 'age', 'gender', 'blood_type', 'religion', 'nationality', 'civil_status', 'email', 'contact_number', 'city_municipality', 'barangay', 'street',
      'emergency_contact_surname', 'emergency_contact_first_name', 'emergency_contact_number', 'emergency_contact_relationship', 'emergency_contact_barangay', 'emergency_contact_street',
    ],
    2: [
      // No required fields for health history step - optional information
    ],
    3: [
      'hospital_admission_or_surgery'
    ]
  });

  // Edit mode and versioning state
  const [isEditMode, setIsEditMode] = useState(false);
  const [originalProfile, setOriginalProfile] = useState<any>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false); // Track if this is a newly created profile
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [pendingSaveData, setPendingSaveData] = useState<FormData | null>(null);

  const progress = (currentStep / steps.length) * 100;

  // Helper function to check if a field should be shown based on admin configuration
  const isFieldEnabled = (category: string, fieldName: string) => {
    // First check UserTypeInformation configuration
    if (currentUserTypeConfig && currentUserTypeConfig.required_fields) {
      const isInUserTypeConfig = currentUserTypeConfig.required_fields.includes(fieldName) ||
                                currentUserTypeConfig.required_fields.includes(fieldName.toLowerCase()) ||
                                currentUserTypeConfig.required_fields.some((field: string) => 
                                  field.toLowerCase().replace(/\s+/g, '_') === fieldName.toLowerCase()
                                );
      if (isInUserTypeConfig) return true;
    }
    
    // Fallback to legacy availableFields configuration
    if (!availableFields[category] || availableFields[category].length === 0) {
      return true; // Show all fields by default if no configuration is loaded
    }
    
    return availableFields[category].some((field: any) => 
      field.field_name.toLowerCase().replace(/\s+/g, '_') === fieldName.toLowerCase()
    );
  };

  // Helper function to check if a field is required based on admin configuration
  const isFieldRequired = (category: string, fieldName: string) => {
    // First check UserTypeInformation configuration
    if (currentUserTypeConfig && currentUserTypeConfig.required_fields) {
      const isRequiredInUserType = currentUserTypeConfig.required_fields.includes(fieldName) ||
                                  currentUserTypeConfig.required_fields.includes(fieldName.toLowerCase()) ||
                                  currentUserTypeConfig.required_fields.some((field: string) => 
                                    field.toLowerCase().replace(/\s+/g, '_') === fieldName.toLowerCase()
                                  );
      if (isRequiredInUserType) return true;
    }
    
    // Fallback to step-based requirements and legacy configuration
    if (!availableFields[category] || availableFields[category].length === 0) {
      return requiredFieldsByStep[currentStep]?.includes(fieldName) || false;
    }
    
    const configField = availableFields[category].find((field: any) => 
      field.field_name.toLowerCase().replace(/\s+/g, '_') === fieldName.toLowerCase()
    );
    
    return configField ? configField.is_required : false;
  };

  // Helper function to get field description from admin configuration
  const getFieldDescription = (category: string, fieldName: string) => {
    // The current model doesn't have custom_fields, so return null for now
    // This can be extended when custom fields functionality is added
    
    // Fallback to legacy availableFields configuration
    if (!availableFields[category] || availableFields[category].length === 0) {
      return null;
    }
    
    const configField = availableFields[category].find((field: any) => 
      field.field_name.toLowerCase().replace(/\s+/g, '_') === fieldName.toLowerCase()
    );
    
    return configField ? configField.description : null;
  };

  // Get available options for user type specific fields
  const getUserTypeOptions = (optionType: 'courses' | 'departments' | 'year_levels' | 'strands' | 'position_types') => {
    if (!currentUserTypeConfig) return [];
    
    switch (optionType) {
      case 'courses':
        return currentUserTypeConfig.available_courses || [];
      case 'departments':
        return currentUserTypeConfig.available_departments || [];
      case 'year_levels':
        return currentUserTypeConfig.year_levels || [];
      case 'strands':
        return currentUserTypeConfig.available_strands || [];
      case 'position_types':
        return currentUserTypeConfig.position_types || [];
      default:
        return [];
    }
  };

  // Check if user type allows specific services
  const isServiceAllowed = (serviceType: 'medical' | 'dental' | 'certificate') => {
    // Since the current model doesn't have allowed_services field, allow all services by default
    return true;
  };

  // Show notification about admin-controlled fields
  const showAdminControlledNotification = () => {
    const hasUserTypeConfig = currentUserTypeConfig && currentUserTypeConfig.required_fields && currentUserTypeConfig.required_fields.length > 0;
    const hasConfiguredFields = Object.values(availableFields).some(category => 
      Array.isArray(category) && category.length > 0
    );
    
    if (hasUserTypeConfig || hasConfiguredFields) {
      return (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Profile Configuration Active
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                {hasUserTypeConfig && (
                  <p className="mb-2">
                    <strong>User Type:</strong> {currentUserTypeConfig.name}
                    {currentUserTypeConfig.description && (
                      <span className="ml-2 text-blue-600">- {currentUserTypeConfig.description}</span>
                    )}
                  </p>
                )}
                {hasUserTypeConfig && (
                  <p className="mb-2">
                    <strong>Required Fields:</strong> {currentUserTypeConfig.required_fields.length} fields configured
                  </p>
                )}
                <p className="text-xs text-blue-600">
                  Form fields and requirements are controlled by system administrators to ensure proper data collection for your user type.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Define fetchProfile function outside useEffect so it can be called from multiple places
  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      // Build query parameters for semester-specific profile
      // currentSchoolYear now contains the complete semester record (academic_year + semester_type)
      const params: any = {};
      if (currentSchoolYear?.id) {
        // Use the semester record ID which already ties to academic_year + semester_type
        params.school_year = currentSchoolYear.id;
        // Also send semester parameter to ensure backend uses the versioning-aware query
        params.semester = currentSemester;
        console.log('Fetching profile for semester record ID:', currentSchoolYear.id);
        console.log('Academic Year:', currentSchoolYear.academic_year);
        console.log('Semester Type:', currentSchoolYear.semester_type);
        console.log('Semester Code:', currentSemester);
      }
      
      const res = await patientProfileAPI.get(params);
      let profileData = res.data;
      
      // Add cache-busting timestamp to photo URL to prevent browser caching issues
      if (profileData.photo && typeof profileData.photo === 'string' && profileData.photo.length > 0) {
        // Append timestamp to force browser to fetch new image
        const separator = profileData.photo.includes('?') ? '&' : '?';
        profileData.photo = `${profileData.photo}${separator}t=${Date.now()}`;
      }
      
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
        
        // Add user type information
        if (!profileData.user_type && user.grade_level) profileData.user_type = user.grade_level;
        
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
      
      // Process enhanced ComorbidIllness details if available
      if (profileData.comorbid_illness_details && typeof profileData.comorbid_illness_details === 'object') {
        if (process.env.NODE_ENV === 'development') {
          console.log('Processing enhanced ComorbidIllness details:', profileData.comorbid_illness_details);
        }
        
        // Map the enhanced details to the dynamic field structure
        Object.keys(profileData.comorbid_illness_details).forEach(illnessKey => {
          const details = profileData.comorbid_illness_details[illnessKey];
          
          // Set sub-options if available
          if (details.sub_options && Array.isArray(details.sub_options)) {
            profileData[`comorbid_${illnessKey}_sub`] = details.sub_options;
          }
          
          // Set specification if available
          if (details.specification && typeof details.specification === 'string') {
            profileData[`comorbid_${illnessKey}_spec`] = details.specification;
          }
        });
      }
      
      // Store original profile for change tracking
      setOriginalProfile(JSON.parse(JSON.stringify(profileData)));
      setProfile(profileData);
      setIsEditMode(false);
      setHasUnsavedChanges(false);
      setIsNewProfile(false);
      
      // Debug enhanced comorbid illness fields
      if (process.env.NODE_ENV === 'development') {
        console.log('=== PROFILE LOADED DEBUG ===');
        console.log('Full profile data:', profileData);
        console.log('Comorbid illnesses:', profileData.comorbid_illnesses);
        console.log('Custom drug names:', profileData.custom_drug_names);
        console.log('Custom nationalities:', profileData.custom_nationalities);
        console.log('Custom comorbid illnesses:', profileData.custom_comorbid_illnesses);
        console.log('Custom menstrual symptoms:', profileData.custom_menstrual_symptoms);
        
        // Check for enhanced comorbid illness fields
        Object.keys(profileData).forEach(key => {
          if (key.startsWith('comorbid_') && (key.includes('_sub') || key.includes('_spec'))) {
            console.log(`Enhanced field ${key}:`, profileData[key]);
          }
        });
      }
      
      // Store original profile for change detection
      setOriginalProfile(JSON.parse(JSON.stringify(profileData)));
      
      // Check if profile exists (not a new one)
      if (profileData.id) {
        setIsEditMode(false); // Start in view mode for existing profiles
        setIsNewProfile(false); // This is an existing profile
      } else {
        setIsEditMode(true); // Start in edit mode for new profiles
        setIsNewProfile(true); // This is a new profile
      }
      
      // Debug photo loading
      if (process.env.NODE_ENV === 'development') {
        console.log('Profile loaded with photo:', {
          photo: profileData.photo,
          photoType: typeof profileData.photo,
          photoLength: profileData.photo?.length,
          version: profileData.version,
          id: profileData.id
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
            nationality_specify: autofillData.nationality_specify || '',
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
          
          // Process enhanced ComorbidIllness details if available
          if (autofillData.comorbid_illness_details && typeof autofillData.comorbid_illness_details === 'object') {
            if (process.env.NODE_ENV === 'development') {
              console.log('Processing enhanced ComorbidIllness details:', autofillData.comorbid_illness_details);
            }
            
            // Map the enhanced details to the dynamic field structure
            Object.keys(autofillData.comorbid_illness_details).forEach(illnessKey => {
              const details = autofillData.comorbid_illness_details[illnessKey];
              if (details && typeof details === 'object') {
                // Process sub-options
                if (details.sub_options && Array.isArray(details.sub_options)) {
                  const subFieldName = `comorbid_${illnessKey}_sub`;
                  defaultProfile[subFieldName] = details.sub_options;
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`Autofilled ${subFieldName}:`, details.sub_options);
                  }
                }
                
                // Process specifications
                if (details.specification && typeof details.specification === 'string') {
                  const specFieldName = `comorbid_${illnessKey}_spec`;
                  defaultProfile[specFieldName] = details.specification;
                  if (process.env.NODE_ENV === 'development') {
                    console.log(`Autofilled ${specFieldName}:`, details.specification);
                  }
                }
              }
            });
          }
          
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
          
          // Store as original profile for new autofilled profiles
          setOriginalProfile(JSON.parse(JSON.stringify(defaultProfile)));
          setProfile(defaultProfile);
          
          // Debug enhanced comorbid illness fields in autofill
          if (process.env.NODE_ENV === 'development') {
            console.log('=== AUTOFILL DEBUG ===');
            console.log('Autofill data received:', autofillData);
            console.log('Default profile created:', defaultProfile);
            console.log('Comorbid illnesses in autofill:', defaultProfile.comorbid_illnesses);
            
            // Check for enhanced comorbid illness fields
            Object.keys(defaultProfile).forEach(key => {
              if (key.startsWith('comorbid_') && (key.includes('_sub') || key.includes('_spec'))) {
                console.log(`Enhanced autofill field ${key}:`, defaultProfile[key]);
              }
            });
          }
          
          // Store original profile for change detection
          setOriginalProfile(JSON.parse(JSON.stringify(defaultProfile)));
          setIsEditMode(true); // Start in edit mode for new profiles
          setIsNewProfile(true); // This is a new profile
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
            if (user.grade_level) defaultProfile.user_type = user.grade_level;
          }
          
          // Store as original profile for fallback profiles too
          setOriginalProfile(JSON.parse(JSON.stringify(defaultProfile)));
          setProfile(defaultProfile);
          
          // Store original profile for change detection
          setIsEditMode(true); // Start in edit mode for new profiles
          setIsNewProfile(true); // This is a new profile
        }
      } else {
        console.error('Error fetching profile:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch profile');
      }
    } finally {
      setLoading(false);
    }
  };

  // Input sanitization functions
  const sanitizeInput = (value: string, type: 'text' | 'email' | 'phone' | 'number' | 'name' = 'text'): string => {
    if (!value) return value;
    
    let sanitized = value.toString().trim();
    
    switch (type) {
      case 'name':
        // Remove numbers and special characters except hyphens, apostrophes, periods
        sanitized = sanitized.replace(/[^a-zA-Z\s\-'\.]/g, '');
        // Capitalize first letter of each word
        sanitized = sanitized.replace(/\b\w/g, l => l.toUpperCase());
        break;
      case 'email':
        // Convert to lowercase and remove invalid characters
        sanitized = sanitized.toLowerCase().replace(/[^a-z0-9@._-]/g, '');
        break;
      case 'phone':
        // Remove all non-numeric characters
        sanitized = sanitized.replace(/[^0-9]/g, '');
        // Ensure it starts with 09 and is 11 digits
        if (sanitized.length === 11 && sanitized.startsWith('09')) {
          return sanitized;
        }
        break;
      case 'number':
        // Remove non-numeric characters except decimal point
        sanitized = sanitized.replace(/[^0-9.]/g, '');
        break;
      case 'text':
      default:
        // Remove dangerous characters but keep basic punctuation
        sanitized = sanitized.replace(/[<>\"'&]/g, '');
        break;
    }
    
    return sanitized;
  };

  // Enhanced validation function
  const validateField = (field: string, value: any): string | null => {
    if (!value && typeof value !== 'boolean') return null;
    
    const stringValue = value?.toString().trim();
    
    switch (field) {
      case 'name':
      case 'first_name':
      case 'middle_name':
      case 'emergency_contact_surname':
      case 'emergency_contact_first_name':
      case 'emergency_contact_middle_name':
        if (stringValue && stringValue.length < 2) {
          return 'Name must be at least 2 characters long.';
        }
        if (stringValue && !/^[a-zA-Z\s\-'\.]+$/.test(stringValue)) {
          return 'Name can only contain letters, spaces, hyphens, apostrophes, and periods.';
        }
        break;
        
      case 'email':
        if (stringValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stringValue)) {
          return 'Please enter a valid email address.';
        }
        break;
        
      case 'contact_number':
      case 'emergency_contact_number':
        if (stringValue && !/^09\d{9}$/.test(stringValue)) {
          return 'Phone number must be 11 digits and start with 09.';
        }
        break;
        
      case 'date_of_birth':
        if (stringValue) {
          const birthDate = new Date(stringValue);
          const today = new Date();
          const minDate = new Date();
          minDate.setFullYear(today.getFullYear() - 120); // Max age 120
          
          if (birthDate > today) {
            return 'Birthday cannot be in the future.';
          }
          if (birthDate < minDate) {
            return 'Please enter a valid birth date.';
          }
          
          // Check if person is at least 3 years old for kindergarten and above
          const age = today.getFullYear() - birthDate.getFullYear();
          if (age < 3) {
            return 'Person must be at least 3 years old.';
          }
        }
        break;
        
      case 'age':
        if (stringValue) {
          const ageNum = parseInt(stringValue);
          if (isNaN(ageNum) || ageNum < 3 || ageNum > 120) {
            return 'Age must be between 3 and 120 years.';
          }
        }
        break;
        
      case 'employee_id':
        if (stringValue && (stringValue.length < 3 || stringValue.length > 20)) {
          return 'Employee ID must be between 3 and 20 characters.';
        }
        if (stringValue && !/^[a-zA-Z0-9\-_]+$/.test(stringValue)) {
          return 'Employee ID can only contain letters, numbers, hyphens, and underscores.';
        }
        break;
        
      case 'city_municipality':
      case 'barangay':
      case 'street':
      case 'emergency_contact_barangay':
      case 'emergency_contact_street':
        if (stringValue && stringValue.length < 2) {
          return 'Address field must be at least 2 characters long.';
        }
        if (stringValue && !/^[a-zA-Z0-9\s\-'.,#\/]+$/.test(stringValue)) {
          return 'Address can only contain letters, numbers, spaces, and common punctuation.';
        }
        break;
        
      default:
        // Generic text validation
        if (stringValue && stringValue.length > 500) {
          return 'Text is too long (maximum 500 characters).';
        }
        break;
    }
    
    return null;
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
      console.log('Profile keys:', Object.keys(profile || {}));
    }
    
    // Only validate fields for the current step
    required.forEach(field => {
      const value = profile?.[field];
      if (process.env.NODE_ENV === 'development') {
        console.log(`Checking field '${field}':`, value, typeof value, 'exists in profile:', field in (profile || {}));
      }
      
      // Check if field is required and missing
      if (typeof value === 'boolean') {
        if (value === undefined || value === null) {
          errors[field] = 'This field is required.';
        }
      } else if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
        errors[field] = 'This field is required.';
      } else {
        // Apply field-specific validation
        const validationError = validateField(field, value);
        if (validationError) {
          errors[field] = validationError;
        }
      }
    });

    // Additional validation for ALL fields (not just required ones) to catch format errors
    if (profile) {
      Object.keys(profile).forEach(field => {
        if (profile[field] && !errors[field]) {
          const validationError = validateField(field, profile[field]);
          if (validationError) {
            errors[field] = validationError;
          }
        }
      });
    }

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

      // Conditional validation based on user type
      if (profile?.user_type === 'Employee') {
        if (!profile?.employee_id || profile.employee_id.trim() === '') {
          errors.employee_id = 'Employee ID is required.';
        }
        if (!profile?.department || profile.department.trim() === '') {
          errors.department = 'Department is required.';
        }
        if (!profile?.position_type || profile.position_type.trim() === '') {
          errors.position_type = 'Position type is required.';
        }
      }

      // Nationality specification validation
      if (profile?.nationality === 'Foreigner') {
        if (!profile?.nationality_specify || profile.nationality_specify.trim() === '') {
          errors.nationality_specify = 'Please specify your nationality.';
        }
      }

      if (profile?.user_type === 'College' || profile?.user_type === 'Incoming Freshman') {
        if (!profile?.course || profile.course.trim() === '') {
          errors.course = 'Course is required.';
        }
        if (profile?.user_type === 'College') {
          // Only require year level for College, not Incoming Freshman (auto-set to 1st year)
          if (!profile?.year_level || profile.year_level.trim() === '') {
            errors.year_level = 'Year level is required.';
          }
        }
      }

      if (profile?.user_type === 'High School' || profile?.user_type === 'Senior High School') {
        if (!profile?.year_level || profile.year_level.trim() === '') {
          errors.year_level = 'Year level is required.';
        }
        if (profile?.user_type === 'Senior High School') {
          if (!profile?.strand || profile.strand.trim() === '') {
            errors.strand = 'Strand is required.';
          }
        }
      }

      if (profile?.user_type === 'Elementary' || profile?.user_type === 'Kindergarten') {
        if (!profile?.year_level || profile.year_level.trim() === '') {
          errors.year_level = 'Year level is required.';
        }
      }
    }

    // CONDITIONAL VALIDATION - Only run for relevant steps and when conditions are actually met
    
    // Step 2: Comorbid illnesses conditional validation
    if (step === 2) {
      if (process.env.NODE_ENV === 'development') {
        console.log('=== STEP 2 VALIDATION ===');
        console.log('Comorbid illnesses:', profile?.comorbid_illnesses);
        console.log('Available comorbid illness options:', comorbidIllnesses);
      }
      
      // Enhanced ComorbidIllness validation - check each selected illness for sub-options requirements
      if (Array.isArray(profile?.comorbid_illnesses) && Array.isArray(comorbidIllnesses)) {
        profile.comorbid_illnesses.forEach(selectedIllness => {
          const illnessConfig = comorbidIllnesses.find(illness => illness.label === selectedIllness);
          
          if (illnessConfig) {
            // Check if sub-options are required and at least one is selected
            if (illnessConfig.has_sub_options && Array.isArray(illnessConfig.sub_options) && illnessConfig.sub_options.length > 0) {
              const subFieldName = `comorbid_${selectedIllness.toLowerCase().replace(/\s+/g, '_')}_sub`;
              const selectedSubOptions = profile?.[subFieldName];
              
              if (!selectedSubOptions || !Array.isArray(selectedSubOptions) || selectedSubOptions.length === 0) {
                errors[subFieldName] = `Please select at least one option for ${selectedIllness}.`;
                if (process.env.NODE_ENV === 'development') {
                  console.log(`${selectedIllness} has sub-options but none selected`);
                }
              }
            }
          }
        });
      }
      
      // Backward compatibility: Food allergies validation - only if "Food Allergies" is selected and NOT using dynamic specification
      const foodAllergiesConfig = comorbidIllnesses.find(illness => illness.label === 'Food Allergies');
      if (Array.isArray(profile?.comorbid_illnesses) && profile.comorbid_illnesses.includes('Food Allergies')) {
        // If Food Allergies doesn't have dynamic specification enabled, use legacy validation
        if (!foodAllergiesConfig?.requires_specification) {
          if (!profile?.food_allergy_specify || profile.food_allergy_specify.trim() === '') {
            errors.food_allergy_specify = 'Please specify the food allergies.';
            if (process.env.NODE_ENV === 'development') {
              console.log('Food allergies requires specification (legacy)');
            }
          }
        }
      }

      // Other comorbid illness validation - validate if field has content but is incomplete
      if (profile?.other_comorbid_specify !== undefined && profile.other_comorbid_specify !== null && profile.other_comorbid_specify.trim() === '') {
        // If the field exists but is empty, don't require it to be filled
        // This allows users to clear the field without validation errors
      }

      // Medication validation
      if (profile?.maintenance_medications && Array.isArray(profile.maintenance_medications)) {
        profile.maintenance_medications.forEach((med: any, idx: number) => {
          if (med.drug || med.custom_drug || med.dose || med.unit || med.frequency || med.duration || med.custom_duration || med.custom_frequency) {
            // If any field is filled, validate all required fields
            // Drug name validation - check both regular drug and custom drug
            if (med.drug_type === 'Others' || med.drug === 'Others') {
              if (!med.custom_drug || med.custom_drug.trim() === '') {
                errors[`medication_${idx}_custom_drug`] = `Medication #${idx + 1}: Please specify the drug name.`;
              } else if (med.custom_drug.trim().length < 2) {
                errors[`medication_${idx}_custom_drug`] = `Medication #${idx + 1}: Drug name is too short.`;
              }
            } else {
              if (!med.drug || med.drug.trim() === '') {
                errors[`medication_${idx}_drug`] = `Medication #${idx + 1}: Drug name is required.`;
              }
            }
            if (!med.dose || med.dose.trim() === '') {
              errors[`medication_${idx}_dose`] = `Medication #${idx + 1}: Dose is required.`;
            } else if (!/^\d+(\.\d+)?$/.test(med.dose.toString())) {
              errors[`medication_${idx}_dose`] = `Medication #${idx + 1}: Dose must be a valid number.`;
            }
            if (!med.unit || med.unit.trim() === '') {
              errors[`medication_${idx}_unit`] = `Medication #${idx + 1}: Unit is required.`;
            }
            
            // Frequency validation - check both regular frequency and custom frequency
            if (med.frequency_type === 'specify') {
              if (!med.custom_frequency || med.custom_frequency.trim() === '') {
                errors[`medication_${idx}_custom_frequency`] = `Medication #${idx + 1}: Please specify the frequency.`;
              } else if (med.custom_frequency.trim().length < 3) {
                errors[`medication_${idx}_custom_frequency`] = `Medication #${idx + 1}: Frequency specification is too short.`;
              }
            } else {
              if (!med.frequency || med.frequency.trim() === '' || med.frequency === 'Frequency') {
                errors[`medication_${idx}_frequency`] = `Medication #${idx + 1}: Frequency is required.`;
              }
            }
            
            // Duration validation - check both regular duration and custom duration
            if (med.duration_type === 'specify') {
              if (!med.custom_duration || med.custom_duration.trim() === '') {
                errors[`medication_${idx}_custom_duration`] = `Medication #${idx + 1}: Please specify the duration.`;
              } else if (med.custom_duration.trim().length < 3) {
                errors[`medication_${idx}_custom_duration`] = `Medication #${idx + 1}: Duration specification is too short.`;
              }
            } else {
              if (!med.duration || med.duration.trim() === '') {
                errors[`medication_${idx}_duration`] = `Medication #${idx + 1}: Duration is required.`;
              }
            }
          }
        });
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
        if (!profile?.hospital_admission_year || profile.hospital_admission_year.trim() === '') {
          errors.hospital_admission_year = 'Please provide the year when the hospital admission or surgery occurred.';
          if (process.env.NODE_ENV === 'development') {
            console.log('Hospital admission/surgery year required');
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
      // User type conditional fields
      if (errors.employee_id) stepSpecificErrors.employee_id = errors.employee_id;
      if (errors.department) stepSpecificErrors.department = errors.department;
      if (errors.position_type) stepSpecificErrors.position_type = errors.position_type;
      if (errors.course) stepSpecificErrors.course = errors.course;
      if (errors.year_level) stepSpecificErrors.year_level = errors.year_level;
      if (errors.strand) stepSpecificErrors.strand = errors.strand;
      // Nationality specification
      if (errors.nationality_specify) stepSpecificErrors.nationality_specify = errors.nationality_specify;
    } else if (step === 2) {
      if (errors.food_allergy_specify) stepSpecificErrors.food_allergy_specify = errors.food_allergy_specify;
      if (errors.other_comorbid_specify) stepSpecificErrors.other_comorbid_specify = errors.other_comorbid_specify;
      
      // Include all comorbid illness specification and sub-option errors
      Object.keys(errors).forEach(errorKey => {
        if (errorKey.startsWith('comorbid_') && (errorKey.includes('_spec') || errorKey.includes('_sub'))) {
          stepSpecificErrors[errorKey] = errors[errorKey];
        }
      });
      
      // Include all medication validation errors for step 2
      Object.keys(errors).forEach(errorKey => {
        if (errorKey.startsWith('medication_')) {
          stepSpecificErrors[errorKey] = errors[errorKey];
        }
      });
    } else if (step === 3) {
      if (errors.past_medical_history_other) stepSpecificErrors.past_medical_history_other = errors.past_medical_history_other;
      if (errors.family_medical_history_other) stepSpecificErrors.family_medical_history_other = errors.family_medical_history_other;
      if (errors.family_medical_history_allergies) stepSpecificErrors.family_medical_history_allergies = errors.family_medical_history_allergies;
      if (errors.hospital_admission_details) stepSpecificErrors.hospital_admission_details = errors.hospital_admission_details;
      if (errors.hospital_admission_year) stepSpecificErrors.hospital_admission_year = errors.hospital_admission_year;
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
        // Fetch the current semester record (which is now a complete AcademicSchoolYear record with semester_type)
        const response = await djangoApiClient.get('/academic-school-years/current/');
        if (response.data) {
          setCurrentSchoolYear(response.data);
          console.log('Loaded current semester record:', response.data);
          console.log('Academic Year:', response.data.academic_year);
          console.log('Semester Type:', response.data.semester_type);
          console.log('Semester ID:', response.data.id);
          
          // Store semester type for display purposes
          // Map semester_type to internal format for compatibility
          let semesterCode = '';
          switch (response.data.semester_type) {
            case '1st':
              semesterCode = '1st_semester';
              break;
            case '2nd':
              semesterCode = '2nd_semester';
              break;
            case 'Summer':
              semesterCode = 'summer';
              break;
            case 'Full Year':
              semesterCode = 'full_year';
              break;
            default:
              semesterCode = '1st_semester';
          }
          
          setCurrentSemester(semesterCode);
          console.log('Current semester code:', semesterCode);
        }
      } catch (error) {
        console.error('Error loading current semester:', error);
        // Continue without school year if API fails
        setCurrentSemester('1st_semester'); // Default semester
      }
    }

    // Load UserTypeInformation configurations
    const loadUserTypeInformations = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api'}/admin-controls/user-type-information/`, 
          { 
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          }
        );
        
        setUserTypeInformations(response.data);
        
        // Set current user type configuration based on user's type
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const userTypeConfig = response.data.find((uti: any) => 
            uti.name === user.user_type || 
            uti.name.toLowerCase() === user.user_type?.toLowerCase()
          );
          if (userTypeConfig && userTypeConfig.enabled) {
            setCurrentUserTypeConfig(userTypeConfig);
            
            // Update required fields based on user type configuration
            if (userTypeConfig.required_fields && userTypeConfig.required_fields.length > 0) {
              setRequiredFieldsByStep(prev => ({
                ...prev,
                1: Array.from(new Set([...prev[1], ...userTypeConfig.required_fields])) // Merge with existing requirements
              }));
            }
            
            if (process.env.NODE_ENV === 'development') {
              console.log('UserTypeInformation config loaded for user type:', user.user_type);
              console.log('Configuration:', userTypeConfig);
              console.log('Required fields:', userTypeConfig.required_fields);
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch user type information:', err);
        // Use fallback demo data for development
        if (process.env.NODE_ENV === 'development') {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            const demoConfig = {
              id: 1,
              user_type: user.user_type || 'College',
              display_name: `${user.user_type || 'College'} Students`,
              description: 'Demo configuration for development',
              required_fields: ['name', 'first_name', 'date_of_birth', 'email', 'contact_number'],
              available_courses: ['Computer Science', 'Engineering', 'Business', 'Education'],
              available_departments: ['CCS', 'Engineering', 'Business', 'Education'],
              available_year_levels: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
              is_active: true,
              requires_approval: false,
              allowed_services: ['medical', 'dental', 'certificate'],
              custom_fields: {},
            };
            setCurrentUserTypeConfig(demoConfig);
            setUserTypeInformations([demoConfig]);
          }
        }
      }
    };

    // Load medical lists from API
    const loadMedicalLists = async () => {
      setMedicalListsLoading(true);
      try {
        // Load profile requirements from admin controls
        try {
          const configResponse = await djangoApiClient.get('/admin-controls/profile_requirements/get_form_configuration/');
          if (configResponse.data) {
            setAvailableFields(configResponse.data);
            
            // NOTE: Personal information fields are NOT controlled by admin configuration
            // Only medical fields (comorbid illnesses, vaccinations, etc.) are admin-controlled
            // Keep the hardcoded required fields for personal information
            
            // No need to update requiredFieldsByStep - keep the default configuration
            // The admin controls only affect the medical data options, not form field requirements
          }
        } catch (error) {
          console.log('Profile Requirements API not available, using default configuration');
          // Keep default field configuration if API fails
        }

        // Load comorbid illnesses
        try {
          const comorbidResponse = await djangoApiClient.get('/user-management/comorbid_illnesses/');
          if (comorbidResponse.data) {
            console.log('Raw comorbid illnesses from API:', comorbidResponse.data);
            const enabledIllnesses = comorbidResponse.data.filter(illness => illness.is_enabled);
            console.log('Filtered enabled comorbid illnesses:', enabledIllnesses);
            setComorbidIllnesses(enabledIllnesses);
          }
        } catch (error) {
          console.log('Comorbid Illnesses API not available, using fallback data');
          setComorbidIllnesses([
            { 
              id: 1, 
              label: 'Bronchial Asthma ("Hika")', 
              is_enabled: true,
              has_sub_options: false,
              sub_options: [],
              requires_specification: false,
              specification_placeholder: ''
            },
            { 
              id: 2, 
              label: 'Food Allergies', 
              is_enabled: true,
              has_sub_options: true,
              sub_options: ['Shellfish', 'Nuts', 'Dairy', 'Eggs', 'Wheat/Gluten', 'Soy', 'Fish', 'Other'],
              requires_specification: true,
              specification_placeholder: 'Specify severity of reactions or other details'
            },
            { 
              id: 3, 
              label: 'Allergic Rhinitis', 
              is_enabled: true,
              has_sub_options: false,
              sub_options: [],
              requires_specification: false,
              specification_placeholder: ''
            },
            { 
              id: 4, 
              label: 'Hyperthyroidism', 
              is_enabled: true,
              has_sub_options: false,
              sub_options: [],
              requires_specification: false,
              specification_placeholder: ''
            },
            { 
              id: 5, 
              label: 'Hypothyroidism/Goiter', 
              is_enabled: true,
              has_sub_options: false,
              sub_options: [],
              requires_specification: false,
              specification_placeholder: ''
            },
            { 
              id: 6, 
              label: 'Anemia', 
              is_enabled: true,
              has_sub_options: false,
              sub_options: [],
              requires_specification: false,
              specification_placeholder: ''
            }
          ]);
        }

        // Load vaccinations
        try {
          const vaccinationResponse = await djangoApiClient.get('/user-management/vaccinations/');
          if (vaccinationResponse.data) {
            console.log('Raw vaccinations from API:', vaccinationResponse.data);
            const enabledVaccinations = vaccinationResponse.data.filter(vaccination => vaccination.is_enabled);
            console.log('Filtered enabled vaccinations:', enabledVaccinations);
            setVaccinations(enabledVaccinations);
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
            console.log('Raw past medical histories from API:', pastMedicalResponse.data);
            const enabledHistories = pastMedicalResponse.data.filter(history => history.is_enabled);
            console.log('Filtered enabled past medical histories:', enabledHistories);
            setPastMedicalHistories(enabledHistories);
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
            console.log('Raw family medical histories from API:', familyMedicalResponse.data);
            const enabledFamilyHistories = familyMedicalResponse.data.filter(history => history.is_enabled);
            console.log('Filtered enabled family medical histories:', enabledFamilyHistories);
            setFamilyMedicalHistories(enabledFamilyHistories);
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
    loadUserTypeInformations();
    loadMedicalLists();
  }, []);

  // Fetch profile after school year and semester are loaded
  useEffect(() => {
    if (currentSchoolYear && currentSemester) {
      fetchProfile();
    }
  }, [currentSchoolYear, currentSemester]);

  const handleProfileChange = (field: string, value: any) => {
    // Handle special date of birth case
    if (field === 'date_of_birth') {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      // Real-time validation for date of birth
      const validationError = validateField('date_of_birth', value);
      if (validationError) {
        setFieldErrors(prevErrors => ({
          ...prevErrors,
          date_of_birth: validationError
        }));
      } else if (fieldErrors.date_of_birth) {
        setFieldErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors.date_of_birth;
          return newErrors;
        });
      }
      
      setProfile((prev: any) => {
        const newProfile = { ...prev, date_of_birth: value, age: age > 0 ? age : '' };
        
        // Check for changes
        if (originalProfile) {
          const hasChanges = JSON.stringify(newProfile) !== JSON.stringify(originalProfile);
          setHasUnsavedChanges(hasChanges);
        }
        
        return newProfile;
      });
      return;
    }
    
    // Handle user type change - auto-populate year level for Incoming Freshman
    if (field === 'user_type' && value === 'Incoming Freshman') {
      setProfile((prev: any) => {
        const newProfile = { ...prev, user_type: value, year_level: '1st Year' };
        
        // Check for changes
        if (originalProfile) {
          const hasChanges = JSON.stringify(newProfile) !== JSON.stringify(originalProfile);
          setHasUnsavedChanges(hasChanges);
        }
        
        return newProfile;
      });
      return;
    }
    
    // Handle nationality change - clear nationality_specify if not Foreigner
    if (field === 'nationality' && value !== 'Foreigner') {
      setProfile((prev: any) => {
        const newProfile = { ...prev, nationality: value, nationality_specify: '' };
        
        // Clear nationality_specify error if it exists
        if (fieldErrors.nationality_specify) {
          setFieldErrors(prevErrors => {
            const newErrors = { ...prevErrors };
            delete newErrors.nationality_specify;
            return newErrors;
          });
        }
        
        // Check for changes
        if (originalProfile) {
          const hasChanges = JSON.stringify(newProfile) !== JSON.stringify(originalProfile);
          setHasUnsavedChanges(hasChanges);
        }
        
        return newProfile;
      });
      return;
    }
    
    // Apply input sanitization based on field type
    let sanitizedValue = value;
    if (typeof value === 'string') {
      switch (field) {
        case 'name':
        case 'first_name':
        case 'middle_name':
        case 'emergency_contact_surname':
        case 'emergency_contact_first_name':
        case 'emergency_contact_middle_name':
          sanitizedValue = sanitizeInput(value, 'name');
          break;
        case 'email':
          sanitizedValue = sanitizeInput(value, 'email');
          break;
        case 'contact_number':
        case 'emergency_contact_number':
          sanitizedValue = sanitizeInput(value, 'phone');
          break;
        case 'employee_id':
          // Allow alphanumeric, hyphens, and underscores
          sanitizedValue = value.replace(/[^a-zA-Z0-9\-_]/g, '');
          break;
        case 'city_municipality':
        case 'barangay':
        case 'street':
        case 'emergency_contact_barangay':
        case 'emergency_contact_street':
          // Allow letters, numbers, spaces, and common punctuation for addresses
          sanitizedValue = value.replace(/[^a-zA-Z0-9\s\-'.,#\/]/g, '');
          break;
        default:
          sanitizedValue = sanitizeInput(value, 'text');
          break;
      }
    }
    
    setProfile((prev: any) => {
      const newProfile = { ...prev, [field]: sanitizedValue };
      
      // Real-time validation feedback - clear error for this field if it's now valid
      const validationError = validateField(field, sanitizedValue);
      if (!validationError && fieldErrors[field]) {
        setFieldErrors(prevErrors => {
          const newErrors = { ...prevErrors };
          delete newErrors[field];
          return newErrors;
        });
      } else if (validationError) {
        // Set error immediately for better UX
        setFieldErrors(prevErrors => ({
          ...prevErrors,
          [field]: validationError
        }));
      }
      
      // Check for changes
      if (originalProfile) {
        const hasChanges = JSON.stringify(newProfile) !== JSON.stringify(originalProfile);
        setHasUnsavedChanges(hasChanges);
      }
      
      return newProfile;
    });
  };

  const handleProfileSave = async (): Promise<boolean> => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      // Collect enhanced ComorbidIllness details
      const comorbidIllnessDetails: any = {};
      
      // Process all comorbid illness related fields
      Object.keys(profile).forEach(key => {
        if (key.startsWith('comorbid_') && (key.includes('_sub') || key.includes('_spec'))) {
          // Extract the illness name from the field name
          let illnessKey = '';
          if (key.includes('_sub')) {
            illnessKey = key.replace('comorbid_', '').replace('_sub', '');
          } else if (key.includes('_spec')) {
            illnessKey = key.replace('comorbid_', '').replace('_spec', '');
          }
          
          if (illnessKey && profile[key]) {
            if (!comorbidIllnessDetails[illnessKey]) {
              comorbidIllnessDetails[illnessKey] = {};
            }
            
            if (key.includes('_sub') && Array.isArray(profile[key]) && profile[key].length > 0) {
              comorbidIllnessDetails[illnessKey].sub_options = profile[key];
            } else if (key.includes('_spec') && typeof profile[key] === 'string' && profile[key].trim()) {
              comorbidIllnessDetails[illnessKey].specification = profile[key].trim();
            }
          }
        }
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Collected ComorbidIllness details for save:', comorbidIllnessDetails);
      }
      
      // Collect unique custom drug names from maintenance_medications
      const customDrugNames: string[] = Array.isArray(profile?.custom_drug_names) ? [...profile.custom_drug_names] : [];
      if (Array.isArray(profile?.maintenance_medications)) {
        profile.maintenance_medications.forEach((med: any) => {
          if ((med.drug_type === 'Others' || med.drug === 'Others') && med.custom_drug && med.custom_drug.trim()) {
            const trimmedDrug = med.custom_drug.trim();
            // Only add if it's not already in the list (case-insensitive check)
            if (!customDrugNames.some(drug => drug.toLowerCase() === trimmedDrug.toLowerCase())) {
              customDrugNames.push(trimmedDrug);
            }
          }
        });
      }
      
      // Collect unique custom nationalities
      const customNationalities: string[] = Array.isArray(profile?.custom_nationalities) ? [...profile.custom_nationalities] : [];
      if (profile?.nationality === 'Foreigner' && profile?.nationality_specify && profile.nationality_specify.trim()) {
        const trimmedNationality = profile.nationality_specify.trim();
        if (!customNationalities.some(nat => nat.toLowerCase() === trimmedNationality.toLowerCase())) {
          customNationalities.push(trimmedNationality);
        }
      }
      
      // Collect custom comorbid illness specifications tied to specific illnesses
      const customComorbidSpecifications: any = profile?.custom_comorbid_specifications ? { ...profile.custom_comorbid_specifications } : {};
      
      // Add specifications from comorbid illnesses that have requires_specification enabled
      if (Array.isArray(comorbidIllnesses)) {
        comorbidIllnesses.forEach(illness => {
          if (illness.requires_specification && Array.isArray(profile?.comorbid_illnesses) && profile.comorbid_illnesses.includes(illness.label)) {
            const illnessKey = illness.label.toLowerCase().replace(/\s+/g, '_');
            const fieldName = `comorbid_${illnessKey}_spec`;
            const specValue = profile?.[fieldName];
            
            if (specValue && typeof specValue === 'string' && specValue.trim()) {
              const trimmedSpec = specValue.trim();
              
              // Initialize array for this illness if it doesn't exist
              if (!customComorbidSpecifications[illnessKey]) {
                customComorbidSpecifications[illnessKey] = [];
              }
              
              // Add specification if not already in the list (case-insensitive check)
              if (!customComorbidSpecifications[illnessKey].some((item: string) => item.toLowerCase() === trimmedSpec.toLowerCase())) {
                customComorbidSpecifications[illnessKey].push(trimmedSpec);
              }
            }
          }
        });
      }
      
      // Collect unique custom comorbid illnesses (for "Other Condition" backward compatibility)
      const customComorbidIllnesses: string[] = Array.isArray(profile?.custom_comorbid_illnesses) ? [...profile.custom_comorbid_illnesses] : [];
      
      // Add "Other Condition" specification
      if (profile?.other_comorbid_specify && profile.other_comorbid_specify.trim()) {
        const trimmedIllness = profile.other_comorbid_specify.trim();
        if (!customComorbidIllnesses.some(illness => illness.toLowerCase() === trimmedIllness.toLowerCase())) {
          customComorbidIllnesses.push(trimmedIllness);
        }
      }
      
      // Collect unique custom menstrual symptoms
      const customMenstrualSymptoms: string[] = Array.isArray(profile?.custom_menstrual_symptoms) ? [...profile.custom_menstrual_symptoms] : [];
      if (Array.isArray(profile?.menstrual_symptoms) && profile.menstrual_symptoms.includes('Other') && profile?.menstrual_symptoms_other && profile.menstrual_symptoms_other.trim()) {
        const trimmedSymptom = profile.menstrual_symptoms_other.trim();
        if (!customMenstrualSymptoms.some(symptom => symptom.toLowerCase() === trimmedSymptom.toLowerCase())) {
          customMenstrualSymptoms.push(trimmedSymptom);
        }
      }
      
      // Add the enhanced details to the profile
      const enhancedProfile = {
        ...profile,
        comorbid_illness_details: Object.keys(comorbidIllnessDetails).length > 0 ? comorbidIllnessDetails : null,
        custom_drug_names: customDrugNames.length > 0 ? customDrugNames : null,
        custom_nationalities: customNationalities.length > 0 ? customNationalities : null,
        custom_comorbid_illnesses: customComorbidIllnesses.length > 0 ? customComorbidIllnesses : null,
        custom_comorbid_specifications: Object.keys(customComorbidSpecifications).length > 0 ? customComorbidSpecifications : null,
        custom_menstrual_symptoms: customMenstrualSymptoms.length > 0 ? customMenstrualSymptoms : null
      };
      
      // Debug log to see what's being saved
      if (process.env.NODE_ENV === 'development') {
        console.log('=== SAVING PROFILE WITH CUSTOM DATA ===');
        console.log('Custom drug names:', customDrugNames);
        console.log('Custom nationalities:', customNationalities);
        console.log('Custom comorbid illnesses (Other):', customComorbidIllnesses);
        console.log('Custom comorbid specifications:', customComorbidSpecifications);
        console.log('Custom menstrual symptoms:', customMenstrualSymptoms);
      }
      
      // Update local profile state immediately with custom arrays
      setProfile({
        ...profile,
        custom_drug_names: customDrugNames.length > 0 ? customDrugNames : profile?.custom_drug_names || [],
        custom_nationalities: customNationalities.length > 0 ? customNationalities : profile?.custom_nationalities || [],
        custom_comorbid_illnesses: customComorbidIllnesses.length > 0 ? customComorbidIllnesses : profile?.custom_comorbid_illnesses || [],
        custom_comorbid_specifications: Object.keys(customComorbidSpecifications).length > 0 ? customComorbidSpecifications : profile?.custom_comorbid_specifications || {},
        custom_menstrual_symptoms: customMenstrualSymptoms.length > 0 ? customMenstrualSymptoms : profile?.custom_menstrual_symptoms || []
      });
      
      // Prepare the form data
      const formData = new FormData();
      for (const key in enhancedProfile) {
        if (enhancedProfile[key] !== undefined && enhancedProfile[key] !== null) {
          if (key === 'photo' && enhancedProfile[key] instanceof File) {
            formData.append('photo', enhancedProfile[key]);
          } else if (typeof enhancedProfile[key] === 'object' && !(enhancedProfile[key] instanceof File)) {
            formData.append(key, JSON.stringify(enhancedProfile[key]));
          } else if (key !== 'photo') {
            formData.append(key, enhancedProfile[key]);
          }
        }
      }
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      // Add school year (semester record) - this already includes academic_year + semester_type
      if (currentSchoolYear?.id) {
        formData.append('school_year', currentSchoolYear.id.toString());
        console.log('Saving profile for semester record ID:', currentSchoolYear.id);
        console.log('Academic Year:', currentSchoolYear.academic_year, 'Semester:', currentSchoolYear.semester_type);
      } else {
        console.warn('No current semester record available - profile will be created without semester association');
      }

      // Versioning Logic:
      // - If no existing profile (no ID), create new profile without asking
      // - If editing ANY existing profile (with ID), ask user whether to edit or create new version
      
      if (!profile?.id) {
        // No ID means it's a completely new profile - create it directly
        await performSave(formData, true, currentSchoolYear, currentSemester);
      } else {
        // This is an existing profile (with ID) being edited - ALWAYS ask user for their preference
        // This gives users full control over whether to update current record or create new version
        setPendingSaveData(formData);
        setShowSaveConfirmation(true);
        setLoading(false); // Stop loading while waiting for user decision
        return true; // Return true to indicate waiting for user confirmation
      }

      // Function execution happens in performSave or after user confirmation
      return false; // Return false to indicate save completed
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
      return false; // Return false on error
    } finally {
      setLoading(false);
    }
  };

  // Helper function to execute the actual save operation
  const performSave = async (formData: FormData, createNewVersion: boolean, schoolYear: any, semester: string) => {
    try {
      const getSemesterDisplayName = (sem: string) => {
        switch (sem) {
          case '1st_semester': return 'First Semester';
          case '2nd_semester': return 'Second Semester';  
          case 'summer': return 'Summer Semester';
          default: return sem;
        }
      };

      if (createNewVersion) {
        // Create a new profile version
        // Remove the id to force creation of a new record
        formData.delete('id');
        
        // Add version metadata if updating from existing profile
        if (profile?.id && !isNewProfile) {
          const currentVersion = profile.version || 1;
          formData.append('version', (currentVersion + 1).toString());
          formData.append('previous_version_id', profile.id.toString());
        }
        
        const response = await patientProfileAPI.create(formData);
        const semesterDisplay = getSemesterDisplayName(semester);
        
        if (profile?.id && !isNewProfile) {
          // Editing an existing profile - new version created
          setFeedbackMessage(`Profile changes saved as new version for ${semesterDisplay}, ${schoolYear.academic_year}!`);
        } else {
          // Creating first profile
          setFeedbackMessage(`Profile created for ${semesterDisplay}, ${schoolYear.academic_year}!`);
        }
        
        setAutoFilledFromYear(schoolYear.academic_year);
        setAutoFilledFromSemester(semesterDisplay);
        setIsAutoFilled(true);
        
        // Reset change tracking
        setHasUnsavedChanges(false);
        setIsEditMode(false);
        setIsNewProfile(false); // After saving, it's no longer a new profile
      } else {
        // Update the existing profile (only for profiles created in this session or user chose "Edit")
        await patientProfileAPI.update(formData);
        const semesterDisplay = getSemesterDisplayName(semester);
        setFeedbackMessage(`Profile updated for ${semesterDisplay}, ${schoolYear.academic_year}!`);
        
        // Reset change tracking
        setHasUnsavedChanges(false);
        setIsEditMode(false);
        setIsNewProfile(false); // After updating, it's no longer a new profile
      }
      
      // Refresh the profile data
      await fetchProfile();
      
      setSuccess(true);
      setFeedbackOpen(true);
    } catch (err: any) {
      let msg = 'Failed to save profile.';
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
      throw err; // Re-throw to be caught by the outer try-catch
    }
  };

  // Handle user's decision from the confirmation modal
  const handleSaveConfirmation = async (createNewVersion: boolean) => {
    setShowSaveConfirmation(false);
    setLoading(true);
    
    try {
      if (pendingSaveData && currentSchoolYear && currentSemester) {
        await performSave(pendingSaveData, createNewVersion, currentSchoolYear, currentSemester);
        
        // After save, trigger redirect if we're on the final step
        if (currentStep === steps.length) {
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
      }
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setLoading(false);
      setPendingSaveData(null);
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

  // Independent photo upload function - allows photo upload anytime
  const handleIndependentPhotoUpload = async (file: File) => {
    if (!profile?.id) {
      // If no profile exists yet, just store the photo for later
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
      handleProfileChange('photo', file);
      return;
    }

    setPhotoUploading(true);
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Include all existing profile data to avoid validation errors
      for (const key in profile) {
        if (profile[key] !== null && profile[key] !== undefined && key !== 'photo') {
          if (Array.isArray(profile[key])) {
            formData.append(key, JSON.stringify(profile[key]));
          } else if (typeof profile[key] === 'object') {
            formData.append(key, JSON.stringify(profile[key]));
          } else {
            formData.append(key, profile[key].toString());
          }
        }
      }
      
      // Add the new photo file
      formData.append('photo', file);
      
      // Add required fields for the update
      if (profile?.id) {
        formData.append('id', profile.id.toString());
      }
      if (currentSchoolYear?.id) {
        formData.append('school_year', currentSchoolYear.id.toString());
      }
      if (currentSemester) {
        formData.append('semester', currentSemester);
      }

      // Update the profile with the new photo
      await patientProfileAPI.update(formData);
      
      setFeedbackMessage('Profile photo updated successfully!');
      setFeedbackOpen(true);
      
      // Clear any photo-related validation errors
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.photo;
        return newErrors;
      });
      
      // Clear the preview and file BEFORE refreshing to ensure clean state
      setPhotoFile(null);
      setPhotoPreview(null);
      
      // Refresh the profile data
      await fetchProfile();
      
    } catch (err: any) {
      let msg = 'Failed to update profile photo.';
      if (err.response && err.response.data) {
        if (typeof err.response.data === 'string') {
          msg = err.response.data;
        } else if (typeof err.response.data === 'object') {
          const errors = Object.values(err.response.data).flat();
          msg = errors.length > 0 ? errors.join(', ') : msg;
        }
      }
      setError(msg);
      setFeedbackMessage(msg);
      setFeedbackOpen(true);
    } finally {
      setPhotoUploading(false);
      setLoading(false);
    }
  };

  const handlePhotoChangeIndependent = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFeedbackMessage('File size must be less than 5MB');
        setFeedbackOpen(true);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setFeedbackMessage('Please select a valid image file');
        setFeedbackOpen(true);
        return;
      }

      // Clear any photo-related validation errors immediately when a valid photo is selected
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.photo;
        return newErrors;
      });

      // Don't set preview - we'll show the uploaded photo directly from server
      // This prevents showing stale preview data after upload completes
      
      // Upload immediately if profile exists, otherwise store for later
      handleIndependentPhotoUpload(file);
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
      
      const newProfile = { ...prev, [field]: arr };
      
      // Check for changes
      if (originalProfile) {
        const hasChanges = JSON.stringify(newProfile) !== JSON.stringify(originalProfile);
        setHasUnsavedChanges(hasChanges);
      }
      
      return newProfile;
    });
  };

  // Function to enable edit mode
  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleMedicationChange = (idx: number, key: string, value: string) => {
    // Sanitize medication input based on field type
    let sanitizedValue = value;
    switch (key) {
      case 'dose':
        // Only allow numbers and decimal point for dose
        sanitizedValue = value.replace(/[^0-9.]/g, '');
        // Ensure only one decimal point
        const decimalParts = sanitizedValue.split('.');
        if (decimalParts.length > 2) {
          sanitizedValue = decimalParts[0] + '.' + decimalParts.slice(1).join('');
        }
        break;
      case 'drug':
      case 'custom_drug':
        // Allow letters, numbers, spaces, and basic punctuation for drug names
        sanitizedValue = value.replace(/[^a-zA-Z0-9\s\-.,()]/g, '');
        break;
      default:
        sanitizedValue = value;
        break;
    }

    setProfile((prev: any) => {
      const meds = Array.isArray(prev.maintenance_medications) ? [...prev.maintenance_medications] : [{}];
      meds[idx] = { ...meds[idx], [key]: sanitizedValue };
      
      const newProfile = { ...prev, maintenance_medications: meds };
      
      // Real-time validation for medication fields
      const med = meds[idx];
      const fieldKey = `medication_${idx}_${key}`;
      
      // Clear previous errors for this medication field
      setFieldErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[fieldKey];
        return newErrors;
      });
      
      // Validate the specific field if it has a value
      if (sanitizedValue) {
        let validationError = null;
        
        switch (key) {
          case 'drug':
            if (!sanitizedValue.trim()) {
              validationError = `Medication #${idx + 1}: Drug name is required.`;
            }
            break;
          case 'custom_drug':
            if (!sanitizedValue.trim()) {
              validationError = `Medication #${idx + 1}: Please specify the drug name.`;
            } else if (sanitizedValue.trim().length < 2) {
              validationError = `Medication #${idx + 1}: Drug name is too short.`;
            }
            break;
          case 'dose':
            if (!sanitizedValue.trim()) {
              validationError = `Medication #${idx + 1}: Dose is required.`;
            } else if (!/^\d+(\.\d+)?$/.test(sanitizedValue.toString())) {
              validationError = `Medication #${idx + 1}: Dose must be a valid number.`;
            }
            break;
          case 'unit':
            if (!sanitizedValue.trim()) {
              validationError = `Medication #${idx + 1}: Unit is required.`;
            }
            break;
          case 'frequency':
            if (!sanitizedValue.trim() || sanitizedValue === 'Frequency') {
              validationError = `Medication #${idx + 1}: Frequency is required.`;
            }
            break;
          case 'duration':
            if (!sanitizedValue.trim()) {
              validationError = `Medication #${idx + 1}: Duration is required.`;
            }
            break;
          case 'custom_duration':
            if (!sanitizedValue.trim()) {
              validationError = `Medication #${idx + 1}: Please specify the duration.`;
            } else if (sanitizedValue.trim().length < 3) {
              validationError = `Medication #${idx + 1}: Duration specification is too short.`;
            }
            break;
        }
        
        if (validationError) {
          setFieldErrors(prevErrors => ({
            ...prevErrors,
            [fieldKey]: validationError
          }));
        }
      }
      
      // Check for changes (medications can be changed independently)
      if (originalProfile) {
        const hasChanges = JSON.stringify(newProfile) !== JSON.stringify(originalProfile);
        setHasUnsavedChanges(hasChanges);
      }
      
      return newProfile;
    });
  };

  const handleAddMedication = () => {
    setProfile((prev: any) => {
      const meds = Array.isArray(prev.maintenance_medications) ? [...prev.maintenance_medications] : [];
      meds.push({ drug: '', dose: '', unit: '', frequency: '', frequency_type: '', custom_frequency: '', duration: '', duration_type: '', custom_duration: '' });
      
      const newProfile = { ...prev, maintenance_medications: meds };
      
      // Check for changes (medications can be changed independently)
      if (originalProfile) {
        const hasChanges = JSON.stringify(newProfile) !== JSON.stringify(originalProfile);
        setHasUnsavedChanges(hasChanges);
      }
      
      return newProfile;
    });
  };

  const handleRemoveMedication = (idx: number) => {
    setProfile((prev: any) => {
      const meds = Array.isArray(prev.maintenance_medications) ? [...prev.maintenance_medications] : [];
      meds.splice(idx, 1);
      
      const newProfile = { ...prev, maintenance_medications: meds };
      
      // Clear all validation errors for this medication
      setFieldErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        Object.keys(newErrors).forEach(key => {
          if (key.startsWith(`medication_${idx}_`)) {
            delete newErrors[key];
          }
        });
        
        // Update medication indices for remaining medications
        const updatedErrors = {};
        Object.keys(newErrors).forEach(key => {
          if (key.startsWith('medication_')) {
            const parts = key.split('_');
            const medIndex = parseInt(parts[1]);
            if (medIndex > idx) {
              // Shift down the index
              const newKey = `medication_${medIndex - 1}_${parts.slice(2).join('_')}`;
              updatedErrors[newKey] = newErrors[key];
            } else if (medIndex < idx) {
              // Keep the same index
              updatedErrors[key] = newErrors[key];
            }
          } else {
            // Non-medication errors remain unchanged
            updatedErrors[key] = newErrors[key];
          }
        });
        
        return updatedErrors;
      });
      
      // Check for changes (medications can be changed independently)
      if (originalProfile) {
        const hasChanges = JSON.stringify(newProfile) !== JSON.stringify(originalProfile);
        setHasUnsavedChanges(hasChanges);
      }
      
      return newProfile;
    });
  };

  // Edit mode functions
  const handleEditModeToggle = () => {
    if (isEditMode && hasUnsavedChanges) {
      // Confirm before discarding changes
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        setProfile(JSON.parse(JSON.stringify(originalProfile)));
        setHasUnsavedChanges(false);
        setIsEditMode(false);
      }
    } else {
      setIsEditMode(!isEditMode);
    }
  };

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        setProfile(JSON.parse(JSON.stringify(originalProfile)));
        setHasUnsavedChanges(false);
        setIsEditMode(false);
      }
    } else {
      setIsEditMode(false);
    }
  };

  const handleSaveChanges = async () => {
    // Validate current step before saving
    if (!validateStep(currentStep)) {
      return;
    }
    await handleProfileSave();
  };

  // Save medications independently without requiring full edit mode
  const handleSaveMedications = async () => {
    if (!hasUnsavedChanges) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      
      // Only send medication data
      if (profile?.maintenance_medications) {
        formData.append('maintenance_medications', JSON.stringify(profile.maintenance_medications));
      }
      
      // Add required fields for the update
      if (profile?.id) {
        formData.append('id', profile.id.toString());
      }
      if (currentSchoolYear?.id) {
        formData.append('school_year', currentSchoolYear.id.toString());
      }
      if (currentSemester) {
        formData.append('semester', currentSemester);
      }

      // Determine if we need to create new version or update
      if (!isNewProfile && profile?.id) {
        // Existing profile - create new version for medication changes
        const currentVersion = profile.version || 1;
        formData.append('version', (currentVersion + 1).toString());
        formData.append('previous_version_id', profile.id.toString());
        
        // Include all existing profile data to create complete new version
        for (const key in profile) {
          if (profile[key] !== undefined && profile[key] !== null && key !== 'maintenance_medications' && key !== 'id') {
            if (typeof profile[key] === 'object' && !(profile[key] instanceof File)) {
              formData.append(key, JSON.stringify(profile[key]));
            } else if (key !== 'photo') {
              formData.append(key, profile[key]);
            }
          }
        }
        
        formData.delete('id'); // Remove ID to force creation of new record
        await patientProfileAPI.create(formData);
        setFeedbackMessage('Medications updated - new profile version created!');
        setIsNewProfile(false);
      } else {
        // New profile - just update
        await patientProfileAPI.update(formData);
        setFeedbackMessage('Medications updated successfully!');
      }
      
      // Refresh the profile data
      await fetchProfile();
      
      setSuccess(true);
      setFeedbackOpen(true);
    } catch (err: any) {
      let msg = 'Failed to update medications.';
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

            {/* Admin Configuration Notification */}
            {showAdminControlledNotification()}

            {/* Photo Upload - Enhanced mobile design - Always enabled */}
            <div className="flex flex-col items-center justify-center mb-8">
              <label className="block text-base sm:text-lg font-medium text-gray-700 mb-4 text-center">
                Profile Photo {!profile?.photo && <span className="text-red-500">*</span>}
              </label>
              <label htmlFor="photo-upload" className="cursor-pointer group">
                <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-40 lg:h-40 flex items-center justify-center border-2 border-dashed rounded-lg transition-all duration-200 border-gray-400 bg-gray-50 hover:bg-gray-100 group-active:bg-gray-200">
                  {photoUploading ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000]"></div>
                      <span className="text-xs text-gray-600 mt-2">Uploading...</span>
                    </div>
                  ) : photoPreview ? (
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
                      <img src={profile.photo} alt="Current Photo" className="object-cover w-full h-full rounded-md" key={profile.photo} />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-200 rounded-md flex items-center justify-center">
                        <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          Tap to change
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <span className="text-2xl sm:text-3xl lg:text-4xl font-light block text-gray-400">+</span>
                      <span className="text-xs sm:text-sm mt-1 text-gray-500">
                        Upload Photo
                      </span>
                    </div>
                  )}
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={isEditMode ? handlePhotoChange : handlePhotoChangeIndependent}
                />
              </label>
              {fieldErrors.photo && (
                <div className="text-red-500 text-xs mt-2 text-center max-w-xs">
                  {fieldErrors.photo}
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2 text-center max-w-xs">
                Supported formats: JPG, PNG, GIF (max 5MB)
                {!isEditMode && (
                  <span className="block text-blue-600 mt-1">
                    📷 You can change your photo anytime!
                  </span>
                )}
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

              {/* User Type Section */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="font-medium text-gray-900 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm mr-3">U</span>
                  User Type Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">User Type</label>
                    <input
                      type="text"
                      className="w-full border rounded-md shadow-sm py-3 px-4 bg-gray-50 border-gray-300"
                      value={profile?.user_type || ''}
                      readOnly
                      placeholder="User type from signup"
                    />
                  </div>
                  
                  {/* Employee Fields */}
                  {profile?.user_type === 'Employee' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID *</label>
                        <input
                          type="text"
                          className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.employee_id ? 'border-red-500' : 'border-gray-300'}`}
                          value={profile?.employee_id || ''}
                          onChange={e => handleProfileChange('employee_id', e.target.value)}
                          placeholder="Enter employee ID"
                        />
                        {fieldErrors.employee_id && <div className="text-red-500 text-xs mt-1">{fieldErrors.employee_id}</div>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                        <select
                          className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.department ? 'border-red-500' : 'border-gray-300'}`}
                          value={profile?.department || ''}
                          onChange={e => handleProfileChange('department', e.target.value)}
                        >
                          <option value="">Select department</option>
                          {getUserTypeOptions('departments').length > 0 ? (
                            getUserTypeOptions('departments').map((dept: string) => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))
                          ) : (
                            // Fallback options if no UserTypeInformation configuration
                            <>
                              <option value="Academic Affairs">Academic Affairs</option>
                              <option value="Administration">Administration</option>
                              <option value="Admissions">Admissions</option>
                              <option value="Business Administration">Business Administration</option>
                              <option value="Computer Science">Computer Science</option>
                              <option value="Education">Education</option>
                              <option value="Engineering">Engineering</option>
                              <option value="Finance">Finance</option>
                              <option value="Health Sciences">Health Sciences</option>
                              <option value="Human Resources">Human Resources</option>
                              <option value="Information Technology">Information Technology</option>
                              <option value="Liberal Arts">Liberal Arts</option>
                              <option value="Library Services">Library Services</option>
                              <option value="Maintenance">Maintenance</option>
                              <option value="Medical Services">Medical Services</option>
                              <option value="Nursing">Nursing</option>
                              <option value="Physical Education">Physical Education</option>
                              <option value="Psychology">Psychology</option>
                              <option value="Registrar">Registrar</option>
                              <option value="Research">Research</option>
                              <option value="Science">Science</option>
                              <option value="Security">Security</option>
                              <option value="Social Sciences">Social Sciences</option>
                              <option value="Student Affairs">Student Affairs</option>
                              <option value="Other">Other</option>
                            </>
                          )}
                        </select>
                        {fieldErrors.department && <div className="text-red-500 text-xs mt-1">{fieldErrors.department}</div>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Position Type *</label>
                        <select
                          className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.position_type ? 'border-red-500' : 'border-gray-300'}`}
                          value={profile?.position_type || ''}
                          onChange={e => handleProfileChange('position_type', e.target.value)}
                        >
                          <option value="">Select position type</option>
                          {getUserTypeOptions('position_types').length > 0 ? (
                            getUserTypeOptions('position_types').map((posType: string) => (
                              <option key={posType} value={posType}>{posType}</option>
                            ))
                          ) : (
                            // Fallback options if no UserTypeInformation configuration
                            <>
                              <option value="Teaching">Teaching</option>
                              <option value="Non-Teaching">Non-Teaching</option>
                            </>
                          )}
                        </select>
                        {fieldErrors.position_type && <div className="text-red-500 text-xs mt-1">{fieldErrors.position_type}</div>}
                      </div>
                    </>
                  )}
                  
                  {/* College and Incoming Freshman Fields */}
                  {(profile?.user_type === 'College' || profile?.user_type === 'Incoming Freshman') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Course *</label>
                        <select
                          className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.course ? 'border-red-500' : 'border-gray-300'}`}
                          value={profile?.course || ''}
                          onChange={e => handleProfileChange('course', e.target.value)}
                        >
                          <option value="">Select course</option>
                          {getUserTypeOptions('courses').length > 0 ? (
                            getUserTypeOptions('courses').map((course: string) => (
                              <option key={course} value={course}>{course}</option>
                            ))
                          ) : (
                            // Fallback options if no UserTypeInformation configuration
                            <>
                              <option value="BS Business Administration">BS Business Administration</option>
                              <option value="BS Computer Science">BS Computer Science</option>
                              <option value="BS Education">BS Education</option>
                              <option value="BS Engineering">BS Engineering</option>
                              <option value="BS Information Technology">BS Information Technology</option>
                              <option value="BS Nursing">BS Nursing</option>
                              <option value="BS Psychology">BS Psychology</option>
                              <option value="BA Communication">BA Communication</option>
                              <option value="BA Political Science">BA Political Science</option>
                              <option value="BA Sociology">BA Sociology</option>
                            </>
                          )}
                        </select>
                        {fieldErrors.course && <div className="text-red-500 text-xs mt-1">{fieldErrors.course}</div>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Year Level *
                          {profile?.user_type === 'Incoming Freshman' && (
                            <span className="ml-2 text-xs text-gray-500">(Auto-set to 1st Year)</span>
                          )}
                        </label>
                        <select
                          className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.year_level ? 'border-red-500' : 'border-gray-300'} ${profile?.user_type === 'Incoming Freshman' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          value={profile?.year_level || ''}
                          onChange={e => handleProfileChange('year_level', e.target.value)}
                          disabled={profile?.user_type === 'Incoming Freshman'}
                        >
                          <option value="">Select year level</option>
                          {getUserTypeOptions('year_levels').length > 0 ? (
                            getUserTypeOptions('year_levels').map((level: string) => (
                              <option key={level} value={level}>{level}</option>
                            ))
                          ) : (
                            // Fallback options if no UserTypeInformation configuration
                            <>
                              <option value="1st Year">1st Year</option>
                              <option value="2nd Year">2nd Year</option>
                              <option value="3rd Year">3rd Year</option>
                              <option value="4th Year">4th Year</option>
                              <option value="5th Year">5th Year</option>
                            </>
                          )}
                        </select>
                        {fieldErrors.year_level && <div className="text-red-500 text-xs mt-1">{fieldErrors.year_level}</div>}
                      </div>
                    </>
                  )}
                  
                  {/* High School and Senior High School Fields */}
                  {(profile?.user_type === 'High School' || profile?.user_type === 'Senior High School') && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Year Level *</label>
                        <select
                          className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.year_level ? 'border-red-500' : 'border-gray-300'}`}
                          value={profile?.year_level || ''}
                          onChange={e => handleProfileChange('year_level', e.target.value)}
                        >
                          <option value="">Select year level</option>
                          {getUserTypeOptions('year_levels').length > 0 ? (
                            getUserTypeOptions('year_levels').map((level: string) => (
                              <option key={level} value={level}>{level}</option>
                            ))
                          ) : (
                            // Fallback options based on user type if no UserTypeInformation configuration
                            <>
                              {profile?.user_type === 'High School' && (
                                <>
                                  <option value="Grade 7">Grade 7</option>
                                  <option value="Grade 8">Grade 8</option>
                                  <option value="Grade 9">Grade 9</option>
                                  <option value="Grade 10">Grade 10</option>
                                </>
                              )}
                              {profile?.user_type === 'Senior High School' && (
                                <>
                                  <option value="Grade 11">Grade 11</option>
                                  <option value="Grade 12">Grade 12</option>
                                </>
                              )}
                            </>
                          )}
                        </select>
                        {fieldErrors.year_level && <div className="text-red-500 text-xs mt-1">{fieldErrors.year_level}</div>}
                      </div>
                      {profile?.user_type === 'Senior High School' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Strand *</label>
                          <select
                            className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.strand ? 'border-red-500' : 'border-gray-300'}`}
                            value={profile?.strand || ''}
                            onChange={e => handleProfileChange('strand', e.target.value)}
                          >
                            <option value="">Select strand</option>
                            {getUserTypeOptions('strands').length > 0 ? (
                              getUserTypeOptions('strands').map((strand: string) => (
                                <option key={strand} value={strand}>{strand}</option>
                              ))
                            ) : (
                              // Fallback options if no UserTypeInformation configuration
                              <>
                                <option value="ABM">ABM (Accountancy, Business and Management)</option>
                                <option value="HUMSS">HUMSS (Humanities and Social Sciences)</option>
                                <option value="STEM">STEM (Science, Technology, Engineering and Mathematics)</option>
                                <option value="GAS">GAS (General Academic Strand)</option>
                                <option value="TVL">TVL (Technical-Vocational-Livelihood)</option>
                                <option value="Arts and Design">Arts and Design</option>
                                <option value="Sports">Sports</option>
                              </>
                            )}
                          </select>
                          {fieldErrors.strand && <div className="text-red-500 text-xs mt-1">{fieldErrors.strand}</div>}
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Elementary and Kindergarten Fields */}
                  {(profile?.user_type === 'Elementary' || profile?.user_type === 'Kindergarten') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year Level *</label>
                      <select
                        className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.year_level ? 'border-red-500' : 'border-gray-300'}`}
                        value={profile?.year_level || ''}
                        onChange={e => handleProfileChange('year_level', e.target.value)}
                      >
                        <option value="">Select year level</option>
                        {getUserTypeOptions('year_levels').length > 0 ? (
                          getUserTypeOptions('year_levels').map((level: string) => (
                            <option key={level} value={level}>{level}</option>
                          ))
                        ) : (
                          // Fallback options based on user type if no UserTypeInformation configuration
                          <>
                            {profile?.user_type === 'Kindergarten' && (
                              <option value="Kindergarten">Kindergarten</option>
                            )}
                            {profile?.user_type === 'Elementary' && (
                              <>
                                <option value="Grade 1">Grade 1</option>
                                <option value="Grade 2">Grade 2</option>
                                <option value="Grade 3">Grade 3</option>
                                <option value="Grade 4">Grade 4</option>
                                <option value="Grade 5">Grade 5</option>
                                <option value="Grade 6">Grade 6</option>
                              </>
                            )}
                          </>
                        )}
                      </select>
                      {fieldErrors.year_level && <div className="text-red-500 text-xs mt-1">{fieldErrors.year_level}</div>}
                    </div>
                  )}
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
                  
                  {/* Show nationality specification field when Foreigner is selected */}
                  {profile?.nationality === 'Foreigner' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specify Nationality *
                      </label>
                      <input
                        type="text"
                        className={`w-full border rounded-md shadow-sm py-3 px-4 focus:outline-none focus:ring-1 focus:ring-gray-500 focus:border-gray-500 transition-colors ${fieldErrors.nationality_specify ? 'border-red-500' : 'border-gray-300'}`}
                        value={profile?.nationality_specify || ''}
                        onChange={e => handleProfileChange('nationality_specify', e.target.value)}
                        placeholder="e.g., American, Japanese, Korean, etc."
                      />
                      {fieldErrors.nationality_specify && (
                        <div className="text-red-500 text-xs mt-1">{fieldErrors.nationality_specify}</div>
                      )}
                      
                      {/* Show previously specified nationalities as checkboxes */}
                      {profile?.custom_nationalities && Array.isArray(profile.custom_nationalities) && profile.custom_nationalities.length > 0 && (
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-700 mb-2">Or select from your previously specified nationalities:</label>
                          <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                            {profile.custom_nationalities.map((customNat: string, natIdx: number) => {
                              const currentValue = String(profile?.nationality_specify || '').trim().toLowerCase();
                              const checkboxValue = String(customNat || '').trim().toLowerCase();
                              const isChecked = currentValue === checkboxValue && currentValue !== '';
                              
                              if (process.env.NODE_ENV === 'development' && natIdx === 0) {
                                console.log('Nationality checkbox debug:', {
                                  currentValue,
                                  checkboxValue,
                                  isChecked,
                                  rawCurrent: profile?.nationality_specify,
                                  rawCheckbox: customNat
                                });
                              }
                              
                              return (
                                <label key={natIdx} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                  <input
                                    type="checkbox"
                                    className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                                    checked={isChecked}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        handleProfileChange('nationality_specify', customNat);
                                      } else {
                                        handleProfileChange('nationality_specify', '');
                                      }
                                    }}
                                  />
                                  <span className="text-sm text-gray-700">{customNat}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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

            {/* Admin Configuration Notification */}
            {showAdminControlledNotification()}

            {/* Loading State for Medical Lists */}
            {medicalListsLoading && (
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                  <span className="ml-3 text-gray-600">Loading health conditions and options...</span>
                </div>
              </div>
            )}

            {/* Comorbid Illnesses */}
            {!medicalListsLoading && (
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <span className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2">1</span>
                Current Health Conditions
                {comorbidIllnesses.length > 0 && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {comorbidIllnesses.length} options available
                  </span>
                )}
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
                    
                    {/* Dynamic sub-options */}
                    {item.has_sub_options && Array.isArray(item.sub_options) && Array.isArray(profile?.comorbid_illnesses) && profile.comorbid_illnesses.includes(item.label) && (
                      <div className="mt-3 ml-7 space-y-2">
                        {item.sub_options.map(subOption => (
                          <div key={subOption} className="flex items-start">
                            <input
                              type="checkbox"
                              id={`comorbid-${item.id}-sub-${subOption}`}
                              className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mt-0.5 flex-shrink-0"
                              checked={Array.isArray(profile?.[`comorbid_${item.label.toLowerCase().replace(/\s+/g, '_')}_sub`]) && 
                                       profile[`comorbid_${item.label.toLowerCase().replace(/\s+/g, '_')}_sub`].includes(subOption)}
                              onChange={e => {
                                const fieldName = `comorbid_${item.label.toLowerCase().replace(/\s+/g, '_')}_sub`;
                                handleCheckboxArrayChange(fieldName, subOption, e.target.checked);
                              }}
                            />
                            <label htmlFor={`comorbid-${item.id}-sub-${subOption}`} className="ml-2 text-sm text-gray-700 cursor-pointer">{subOption}</label>
                          </div>
                        ))}
                        {fieldErrors[`comorbid_${item.label.toLowerCase().replace(/\s+/g, '_')}_sub`] && 
                         <div className="text-red-500 text-xs mt-1">{fieldErrors[`comorbid_${item.label.toLowerCase().replace(/\s+/g, '_')}_sub`]}</div>}
                      </div>
                    )}
                    
                    {/* Dynamic text specification */}
                    {item.requires_specification && Array.isArray(profile?.comorbid_illnesses) && profile.comorbid_illnesses.includes(item.label) && (
                      <div className="mt-3 ml-7">
                        <input
                          type="text"
                          placeholder={item.specification_placeholder || `Specify ${item.label.toLowerCase()}`}
                          className="w-full border rounded-lg shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 border-gray-300"
                          value={profile?.[`comorbid_${item.label.toLowerCase().replace(/\s+/g, '_')}_spec`] || ''}
                          onChange={e => {
                            const fieldName = `comorbid_${item.label.toLowerCase().replace(/\s+/g, '_')}_spec`;
                            handleProfileChange(fieldName, e.target.value);
                          }}
                        />
                        {fieldErrors[`comorbid_${item.label.toLowerCase().replace(/\s+/g, '_')}_spec`] && 
                         <div className="text-red-500 text-xs mt-1">{fieldErrors[`comorbid_${item.label.toLowerCase().replace(/\s+/g, '_')}_spec`]}</div>}
                        
                        {/* Show previously specified values as checkboxes - only for THIS illness */}
                        {(() => {
                          const illnessKey = item.label.toLowerCase().replace(/\s+/g, '_');
                          const illnessSpecs = profile?.custom_comorbid_specifications?.[illnessKey];
                          
                          if (illnessSpecs && Array.isArray(illnessSpecs) && illnessSpecs.length > 0) {
                            return (
                              <div className="mt-3">
                                <label className="block text-xs font-medium text-gray-700 mb-2">Or select from your previously specified {item.label.toLowerCase()}:</label>
                                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                  {illnessSpecs.map((customSpec: string, specIdx: number) => {
                                    const fieldName = `comorbid_${illnessKey}_spec`;
                                    const currentValue = String(profile?.[fieldName] || '').trim().toLowerCase();
                                    const checkboxValue = String(customSpec || '').trim().toLowerCase();
                                    const isChecked = currentValue === checkboxValue && currentValue !== '';
                                    
                                    if (process.env.NODE_ENV === 'development' && specIdx === 0) {
                                      console.log(`${item.label} specification checkbox debug:`, {
                                        illnessKey,
                                        fieldName,
                                        currentValue,
                                        checkboxValue,
                                        isChecked,
                                        rawCurrent: profile?.[fieldName],
                                        rawCheckbox: customSpec,
                                        allSpecs: illnessSpecs
                                      });
                                    }
                                    
                                    return (
                                      <label key={specIdx} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                        <input
                                          type="checkbox"
                                          className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                                          checked={isChecked}
                                          onChange={e => {
                                            if (e.target.checked) {
                                              handleProfileChange(fieldName, customSpec);
                                            } else {
                                              handleProfileChange(fieldName, '');
                                            }
                                          }}
                                        />
                                        <span className="text-sm text-gray-700">{customSpec}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    )}
                    
                    {/* Backward compatibility for Food Allergies */}
                    {item.label === 'Food Allergies' && Array.isArray(profile?.comorbid_illnesses) && profile.comorbid_illnesses.includes('Food Allergies') && !item.requires_specification && (
                      <div className="mt-3 ml-7">
                        <input
                          type="text"
                          placeholder="Specify food allergies (e.g., shellfish, nuts)"
                          className="w-full border rounded-lg shadow-sm py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 border-gray-300"
                          value={profile?.food_allergy_specify || ''}
                          onChange={e => handleProfileChange('food_allergy_specify', e.target.value)}
                        />
                        {fieldErrors.food_allergy_specify && <div className="text-red-500 text-xs mt-1">{fieldErrors.food_allergy_specify}</div>}
                      </div>
                    )}
                  </div>
                ))}
                
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
                    
                    {/* Show previously specified comorbid illnesses as checkboxes */}
                    {profile?.custom_comorbid_illnesses && Array.isArray(profile.custom_comorbid_illnesses) && profile.custom_comorbid_illnesses.length > 0 && (
                      <div className="mt-3">
                        <label className="block text-xs font-medium text-gray-700 mb-2">Or select from your previously specified conditions:</label>
                        <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                          {profile.custom_comorbid_illnesses.map((customIllness: string, illIdx: number) => {
                            const currentValue = String(profile?.other_comorbid_specify || '').trim().toLowerCase();
                            const checkboxValue = String(customIllness || '').trim().toLowerCase();
                            const isChecked = currentValue === checkboxValue && currentValue !== '';
                            
                            if (process.env.NODE_ENV === 'development' && illIdx === 0) {
                              console.log('Comorbid illness checkbox debug:', {
                                currentValue,
                                checkboxValue,
                                isChecked,
                                rawCurrent: profile?.other_comorbid_specify,
                                rawCheckbox: customIllness
                              });
                            }
                            
                            return (
                              <label key={illIdx} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                <input
                                  type="checkbox"
                                  className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                                  checked={isChecked}
                                  onChange={e => {
                                    const currentIllnesses = Array.isArray(profile?.comorbid_illnesses) ? [...profile.comorbid_illnesses] : [];
                                    
                                    if (e.target.checked) {
                                      // Remove previous other_comorbid_specify from array
                                      if (profile?.other_comorbid_specify && profile.other_comorbid_specify.trim() !== '') {
                                        const filteredIllnesses = currentIllnesses.filter(illness => illness !== profile.other_comorbid_specify.trim());
                                        handleProfileChange('comorbid_illnesses', filteredIllnesses);
                                      }
                                      // Set new value
                                      handleProfileChange('other_comorbid_specify', customIllness);
                                      // Add new value to array
                                      const updatedIllnesses = currentIllnesses.filter(illness => illness !== profile?.other_comorbid_specify?.trim());
                                      updatedIllnesses.push(customIllness.trim());
                                      handleProfileChange('comorbid_illnesses', updatedIllnesses);
                                    } else {
                                      // Clear the field
                                      handleProfileChange('other_comorbid_specify', '');
                                      // Remove from array
                                      const filteredIllnesses = currentIllnesses.filter(illness => illness !== customIllness.trim());
                                      handleProfileChange('comorbid_illnesses', filteredIllnesses);
                                    }
                                  }}
                                />
                                <span className="text-sm text-gray-700">{customIllness}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Maintenance Medications */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <span className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2">2</span>
                Current Medications
              </h3>
              <p className="text-sm text-gray-700 mb-4">List any medications you take regularly:</p>
              
              {/* Mobile-optimized medication table */}
              <div className="space-y-4">
                {(!profile?.maintenance_medications || profile.maintenance_medications.length === 0) && !isEditMode ? (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-sm text-gray-500">No current medications recorded</p>
                  </div>
                ) : (
                  (profile?.maintenance_medications && profile.maintenance_medications.length > 0 
                    ? profile.maintenance_medications 
                    : isEditMode ? [{}] : []
                  ).map((med: any, idx: number) => (
                  <div key={idx} className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-800">Medication #{idx + 1}</span>
                      <button
                        className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                        onClick={() => handleRemoveMedication(idx)}
                        type="button"
                        title="Remove medication"
                      >×</button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Drug Name *</label>
                        <select
                          className={`w-full border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${fieldErrors[`medication_${idx}_drug`] ? 'border-red-500' : 'border-gray-300'}`}
                          value={med.drug_type || med.drug || ''}
                          onChange={e => {
                            const value = e.target.value;
                            const meds = [...(profile?.maintenance_medications || [])];
                            meds[idx] = { ...meds[idx], drug_type: value, drug: value };
                            if (value !== 'Others') {
                              meds[idx].custom_drug = '';
                            }
                            handleProfileChange('maintenance_medications', meds);
                          }}
                        >
                          <option value="">Select a drug</option>
                          {['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Metformin', 'Atorvastatin', 'Losartan', 'Omeprazole', 'Simvastatin', 'Aspirin', 'Levothyroxine', 'Others'].map(drugName => (
                            <option key={drugName} value={drugName}>{drugName}</option>
                          ))}
                        </select>
                        {fieldErrors[`medication_${idx}_drug`] && (
                          <div className="text-red-500 text-xs mt-1">{fieldErrors[`medication_${idx}_drug`]}</div>
                        )}
                      </div>
                      
                      {(med.drug_type === 'Others' || med.drug === 'Others') && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Specify Drug Name *</label>
                          <input
                            type="text"
                            placeholder="Enter drug name"
                            className={`w-full border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${fieldErrors[`medication_${idx}_custom_drug`] ? 'border-red-500' : 'border-gray-300'}`}
                            value={med.custom_drug || ''}
                            onChange={e => handleMedicationChange(idx, 'custom_drug', e.target.value)}
                          />
                          {fieldErrors[`medication_${idx}_custom_drug`] && (
                            <div className="text-red-500 text-xs mt-1">{fieldErrors[`medication_${idx}_custom_drug`]}</div>
                          )}
                          
                          {/* Show previously specified custom drugs as checkboxes */}
                          {profile?.custom_drug_names && Array.isArray(profile.custom_drug_names) && profile.custom_drug_names.length > 0 && (
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-gray-700 mb-2">Or select from your previously specified drugs:</label>
                              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                {profile.custom_drug_names.map((customDrug: string, drugIdx: number) => {
                                  const currentValue = String(med.custom_drug || '').trim().toLowerCase();
                                  const checkboxValue = String(customDrug || '').trim().toLowerCase();
                                  const isChecked = currentValue === checkboxValue && currentValue !== '';
                                  
                                  if (process.env.NODE_ENV === 'development' && drugIdx === 0 && idx === 0) {
                                    console.log('Drug checkbox debug:', {
                                      currentValue,
                                      checkboxValue,
                                      isChecked,
                                      rawCurrent: med.custom_drug,
                                      rawCheckbox: customDrug
                                    });
                                  }
                                  
                                  return (
                                    <label key={drugIdx} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                      <input
                                        type="checkbox"
                                        className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                                        checked={isChecked}
                                        onChange={e => {
                                          if (e.target.checked) {
                                            handleMedicationChange(idx, 'custom_drug', customDrug);
                                          } else {
                                            handleMedicationChange(idx, 'custom_drug', '');
                                          }
                                        }}
                                      />
                                      <span className="text-sm text-gray-700">{customDrug}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Dose *</label>
                          <input
                            type="text"
                            placeholder="e.g., 500"
                            className={`w-full border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${fieldErrors[`medication_${idx}_dose`] ? 'border-red-500' : 'border-gray-300'}`}
                            value={med.dose || ''}
                            onChange={e => handleMedicationChange(idx, 'dose', e.target.value)}
                          />
                          {fieldErrors[`medication_${idx}_dose`] && (
                            <div className="text-red-500 text-xs mt-1">{fieldErrors[`medication_${idx}_dose`]}</div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Unit *</label>
                          <select
                            className={`w-full border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${fieldErrors[`medication_${idx}_unit`] ? 'border-red-500' : 'border-gray-300'}`}
                            value={med.unit || ''}
                            onChange={e => handleMedicationChange(idx, 'unit', e.target.value)}
                          >
                            <option value="">Select</option>
                            <option value="mg">mg</option>
                            <option value="mcg">mcg</option>
                            <option value="g">g</option>
                          </select>
                          {fieldErrors[`medication_${idx}_unit`] && (
                            <div className="text-red-500 text-xs mt-1">{fieldErrors[`medication_${idx}_unit`]}</div>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Frequency *</label>
                          <select
                            className={`w-full border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${fieldErrors[`medication_${idx}_frequency`] ? 'border-red-500' : 'border-gray-300'}`}
                            value={med.frequency_type || med.frequency || ''}
                            onChange={e => {
                              if (e.target.value === 'specify') {
                                handleMedicationChange(idx, 'frequency_type', 'specify');
                                handleMedicationChange(idx, 'frequency', '');
                                handleMedicationChange(idx, 'custom_frequency', '');
                              } else {
                                handleMedicationChange(idx, 'frequency_type', '');
                                handleMedicationChange(idx, 'frequency', e.target.value);
                                handleMedicationChange(idx, 'custom_frequency', '');
                              }
                            }}
                          >
                            {freqOptions.map(f => <option key={f} value={f}>{f}</option>)}
                            <option value="specify">Specify frequency</option>
                          </select>
                          {fieldErrors[`medication_${idx}_frequency`] && (
                            <div className="text-red-500 text-xs mt-1">{fieldErrors[`medication_${idx}_frequency`]}</div>
                          )}
                          
                          {/* Custom frequency input when "Specify" is selected */}
                          {med.frequency_type === 'specify' && (
                            <div className="mt-2">
                              <input
                                type="text"
                                placeholder="e.g., Every 4 hours, 3 times per week"
                                className={`w-full border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${fieldErrors[`medication_${idx}_custom_frequency`] ? 'border-red-500' : 'border-gray-300'}`}
                                value={med.custom_frequency || ''}
                                onChange={e => {
                                  const value = e.target.value;
                                  handleMedicationChange(idx, 'custom_frequency', value);
                                  // Also set the frequency field to the custom value for storage
                                  if (value.trim()) {
                                    handleMedicationChange(idx, 'frequency', value.trim());
                                  }
                                }}
                              />
                              {fieldErrors[`medication_${idx}_custom_frequency`] && (
                                <div className="text-red-500 text-xs mt-1">{fieldErrors[`medication_${idx}_custom_frequency`]}</div>
                              )}
                            </div>
                          )}
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Duration *</label>
                          <select
                            className={`w-full border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${fieldErrors[`medication_${idx}_duration`] ? 'border-red-500' : 'border-gray-300'}`}
                            value={med.duration_type || med.duration || ''}
                            onChange={e => {
                              if (e.target.value === 'specify') {
                                handleMedicationChange(idx, 'duration_type', 'specify');
                                handleMedicationChange(idx, 'duration', '');
                                handleMedicationChange(idx, 'custom_duration', '');
                              } else {
                                handleMedicationChange(idx, 'duration_type', '');
                                handleMedicationChange(idx, 'duration', e.target.value);
                                handleMedicationChange(idx, 'custom_duration', '');
                              }
                            }}
                          >
                            <option value="">Select duration</option>
                            <option value="1 week">1 week</option>
                            <option value="2 weeks">2 weeks</option>
                            <option value="3 weeks">3 weeks</option>
                            <option value="1 month">1 month</option>
                            <option value="2 months">2 months</option>
                            <option value="3 months">3 months</option>
                            <option value="6 months">6 months</option>
                            <option value="1 year">1 year</option>
                            <option value="2+ years">2+ years</option>
                            <option value="Ongoing">Ongoing</option>
                            <option value="specify">Specify duration</option>
                          </select>
                          {fieldErrors[`medication_${idx}_duration`] && (
                            <div className="text-red-500 text-xs mt-1">{fieldErrors[`medication_${idx}_duration`]}</div>
                          )}
                          
                          {/* Custom duration input when "Specify" is selected */}
                          {med.duration_type === 'specify' && (
                            <div className="mt-2">
                              <input
                                type="text"
                                placeholder="e.g., 5 days, 10 weeks, 8 months"
                                className={`w-full border rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 ${fieldErrors[`medication_${idx}_custom_duration`] ? 'border-red-500' : 'border-gray-300'}`}
                                value={med.custom_duration || ''}
                                onChange={e => {
                                  const value = e.target.value;
                                  handleMedicationChange(idx, 'custom_duration', value);
                                  // Also set the duration field to the custom value for storage
                                  if (value.trim()) {
                                    handleMedicationChange(idx, 'duration', value.trim());
                                  }
                                }}
                              />
                              {fieldErrors[`medication_${idx}_custom_duration`] && (
                                <div className="text-red-500 text-xs mt-1">{fieldErrors[`medication_${idx}_custom_duration`]}</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  ))
                )}
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                    onClick={handleAddMedication}
                    type="button"
                  >+ Add Medication</button>
                  
                  {/* Save Medications Button - shows when there are unsaved medication changes and medications exist */}
                  {hasUnsavedChanges && Array.isArray(profile?.maintenance_medications) && profile.maintenance_medications.length > 0 && (
                    <button
                      className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                      onClick={handleSaveMedications}
                      type="button"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Medications'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Vaccination History */}
            {!medicalListsLoading && (
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <span className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2">3</span>
                Vaccination Status
                {vaccinations.length > 0 && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {vaccinations.length} vaccines available
                  </span>
                )}
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
            )}
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

            {/* Admin Configuration Notification */}
            {showAdminControlledNotification()}

            {/* Loading State for Medical Lists */}
            {medicalListsLoading && (
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                  <span className="ml-3 text-gray-600">Loading medical history options...</span>
                </div>
              </div>
            )}

            {/* Past Medical & Surgical History */}
            {!medicalListsLoading && (
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <span className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2">1</span>
                Past Medical & Surgical History
                {pastMedicalHistories.length > 0 && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {pastMedicalHistories.length} conditions available
                  </span>
                )}
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
                    
                    {/* Sub-options for this condition */}
                    {item.has_sub_options && Array.isArray(item.sub_options) && item.sub_options.length > 0 && (
                      Array.isArray(profile?.past_medical_history) && profile.past_medical_history.includes(item.name)
                    ) && (
                      <div className="ml-7 mt-3 space-y-2 pl-4 border-l-2 border-gray-200">
                        <p className="text-xs text-gray-600 font-medium">Select specific conditions:</p>
                        {item.sub_options.map((subOption: string, index: number) => (
                          <div key={index} className="flex items-start">
                            <input
                              type="checkbox"
                              id={`past-${item.id}-sub-${index}`}
                              className="h-3 w-3 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mt-0.5 flex-shrink-0"
                              checked={Array.isArray(profile?.[`past_medical_history_${item.name.toLowerCase().replace(/\s+/g, '_')}_sub`]) && 
                                profile[`past_medical_history_${item.name.toLowerCase().replace(/\s+/g, '_')}_sub`].includes(subOption)}
                              onChange={e => handleCheckboxArrayChange(`past_medical_history_${item.name.toLowerCase().replace(/\s+/g, '_')}_sub`, subOption, e.target.checked)}
                            />
                            <label htmlFor={`past-${item.id}-sub-${index}`} className="ml-2 text-xs text-gray-700 cursor-pointer">
                              {subOption}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Specification text field for this condition */}
                    {item.requires_specification && (
                      Array.isArray(profile?.past_medical_history) && profile.past_medical_history.includes(item.name)
                    ) && (
                      <div className="ml-7 mt-3">
                        <input
                          type="text"
                          placeholder={item.specification_placeholder || 'Please specify...'}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                          value={profile?.[`past_medical_history_${item.name.toLowerCase().replace(/\s+/g, '_')}_spec`] || ''}
                          onChange={e => handleProfileChange(`past_medical_history_${item.name.toLowerCase().replace(/\s+/g, '_')}_spec`, e.target.value)}
                        />
                      </div>
                    )}
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
            )}

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
                  <div className="mt-4 space-y-4">
                    <div>
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        What year did this happen? <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm ${fieldErrors.hospital_admission_year ? 'border-red-500' : 'border-gray-300'}`}
                        value={profile?.hospital_admission_year || ''}
                        onChange={e => handleProfileChange('hospital_admission_year', e.target.value)}
                        placeholder="e.g., 2023, 2020-2021, etc."
                      />
                      {fieldErrors.hospital_admission_year && <div className="text-red-500 text-xs mt-1">{fieldErrors.hospital_admission_year}</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Menstrual & Obstetric History (for females only) */}
            {profile?.gender === 'Female' && (
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                  <span className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2">3</span>
                  Menstrual & Obstetric History
                  <span className="ml-2 text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                    For females only
                  </span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Age when menstruation began */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age when menstruation began:
                    </label>
                    <input
                      type="number"
                      min="8"
                      max="20"
                      className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                      value={profile?.menstruation_age_began || ''}
                      onChange={e => handleProfileChange('menstruation_age_began', parseInt(e.target.value) || null)}
                      placeholder="Age"
                    />
                  </div>

                  {/* Menstrual regularity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Menstrual pattern:
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="menstrual-pattern"
                          className="h-4 w-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                          checked={profile?.menstruation_regular === true}
                          onChange={() => {
                            handleProfileChange('menstruation_regular', true);
                            handleProfileChange('menstruation_irregular', false);
                          }}
                        />
                        <span className="ml-2 text-sm text-gray-900">Regular (monthly)</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="menstrual-pattern"
                          className="h-4 w-4 text-gray-600 border-gray-300 focus:ring-gray-500"
                          checked={profile?.menstruation_irregular === true}
                          onChange={() => {
                            handleProfileChange('menstruation_regular', false);
                            handleProfileChange('menstruation_irregular', true);
                          }}
                        />
                        <span className="ml-2 text-sm text-gray-900">Irregular</span>
                      </label>
                    </div>
                  </div>

                  {/* Number of pregnancies */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of pregnancies:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                      value={profile?.number_of_pregnancies || ''}
                      onChange={e => handleProfileChange('number_of_pregnancies', parseInt(e.target.value) || null)}
                      placeholder="Number"
                    />
                  </div>

                  {/* Number of live children */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of live children:
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                      value={profile?.number_of_live_children || ''}
                      onChange={e => handleProfileChange('number_of_live_children', parseInt(e.target.value) || null)}
                      placeholder="Number"
                    />
                  </div>

                  {/* Menstrual symptoms */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Menstrual Symptoms:
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        'Dysmenorrhea (cramps)',
                        'Migraine',
                        'Loss of consciousness',
                        'Other'
                      ].map(symptom => (
                        <label key={symptom} className="flex items-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-gray-600 border-gray-300 rounded focus:ring-gray-500"
                            checked={Array.isArray(profile?.menstrual_symptoms) && profile.menstrual_symptoms.includes(symptom)}
                            onChange={e => {
                              const symptoms = Array.isArray(profile?.menstrual_symptoms) ? [...profile.menstrual_symptoms] : [];
                              if (e.target.checked) {
                                if (!symptoms.includes(symptom)) symptoms.push(symptom);
                              } else {
                                const index = symptoms.indexOf(symptom);
                                if (index > -1) symptoms.splice(index, 1);
                              }
                              handleProfileChange('menstrual_symptoms', symptoms);
                            }}
                          />
                          <span className="ml-2 text-sm text-gray-900">{symptom}</span>
                        </label>
                      ))}
                    </div>
                    
                    {/* Other symptoms specification */}
                    {Array.isArray(profile?.menstrual_symptoms) && profile.menstrual_symptoms.includes('Other') && (
                      <div className="mt-3">
                        <input
                          type="text"
                          className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                          placeholder="Please specify other menstrual symptoms..."
                          value={profile?.menstrual_symptoms_other || ''}
                          onChange={e => handleProfileChange('menstrual_symptoms_other', e.target.value)}
                        />
                        
                        {/* Show previously specified menstrual symptoms as checkboxes */}
                        {profile?.custom_menstrual_symptoms && Array.isArray(profile.custom_menstrual_symptoms) && profile.custom_menstrual_symptoms.length > 0 && (
                          <div className="mt-3">
                            <label className="block text-xs font-medium text-gray-700 mb-2">Or select from your previously specified symptoms:</label>
                            <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                              {profile.custom_menstrual_symptoms.map((customSymptom: string, sympIdx: number) => {
                                const currentValue = String(profile?.menstrual_symptoms_other || '').trim().toLowerCase();
                                const checkboxValue = String(customSymptom || '').trim().toLowerCase();
                                const isChecked = currentValue === checkboxValue && currentValue !== '';
                                
                                if (process.env.NODE_ENV === 'development' && sympIdx === 0) {
                                  console.log('Menstrual symptom checkbox debug:', {
                                    currentValue,
                                    checkboxValue,
                                    isChecked,
                                    rawCurrent: profile?.menstrual_symptoms_other,
                                    rawCheckbox: customSymptom
                                  });
                                }
                                
                                return (
                                  <label key={sympIdx} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                    <input
                                      type="checkbox"
                                      className="rounded border-gray-300 text-gray-600 focus:ring-gray-500"
                                      checked={isChecked}
                                      onChange={e => {
                                        if (e.target.checked) {
                                          handleProfileChange('menstrual_symptoms_other', customSymptom);
                                        } else {
                                          handleProfileChange('menstrual_symptoms_other', '');
                                        }
                                      }}
                                    />
                                    <span className="text-sm text-gray-700">{customSymptom}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading State for Family Medical History */}
            {medicalListsLoading && (
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
                  <span className="ml-3 text-gray-600">Loading family medical history options...</span>
                </div>
              </div>
            )}

            {/* Family Medical History */}
            {!medicalListsLoading && (
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center">
                <span className="w-5 h-5 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2">4</span>
                Family Medical History
                {familyMedicalHistories.length > 0 && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {familyMedicalHistories.length} conditions available
                  </span>
                )}
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
                    
                    {/* Sub-options for this condition */}
                    {item.has_sub_options && Array.isArray(item.sub_options) && item.sub_options.length > 0 && (
                      Array.isArray(profile?.family_medical_history) && profile.family_medical_history.includes(item.name)
                    ) && (
                      <div className="ml-7 mt-3 space-y-2 pl-4 border-l-2 border-gray-200">
                        <p className="text-xs text-gray-600 font-medium">Select specific conditions:</p>
                        {item.sub_options.map((subOption: string, index: number) => (
                          <div key={index} className="flex items-start">
                            <input
                              type="checkbox"
                              id={`fam-${item.id}-sub-${index}`}
                              className="h-3 w-3 text-gray-600 border-gray-300 rounded focus:ring-gray-500 mt-0.5 flex-shrink-0"
                              checked={Array.isArray(profile?.[`family_medical_history_${item.name.toLowerCase().replace(/\s+/g, '_')}_sub`]) && 
                                profile[`family_medical_history_${item.name.toLowerCase().replace(/\s+/g, '_')}_sub`].includes(subOption)}
                              onChange={e => handleCheckboxArrayChange(`family_medical_history_${item.name.toLowerCase().replace(/\s+/g, '_')}_sub`, subOption, e.target.checked)}
                            />
                            <label htmlFor={`fam-${item.id}-sub-${index}`} className="ml-2 text-xs text-gray-700 cursor-pointer">
                              {subOption}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Specification text field for this condition */}
                    {item.requires_specification && (
                      Array.isArray(profile?.family_medical_history) && profile.family_medical_history.includes(item.name)
                    ) && (
                      <div className="ml-7 mt-3">
                        <input
                          type="text"
                          placeholder={item.specification_placeholder || 'Please specify...'}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                          value={profile?.[`family_medical_history_${item.name.toLowerCase().replace(/\s+/g, '_')}_spec`] || ''}
                          onChange={e => handleProfileChange(`family_medical_history_${item.name.toLowerCase().replace(/\s+/g, '_')}_spec`, e.target.value)}
                        />
                      </div>
                    )}
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
            )}
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

            {/* User Type Information Summary */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2 font-bold">2</span>
                User Type Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs">User Type</p>
                  <p className="text-gray-900 font-semibold">{profile?.user_type || 'Not specified'}</p>
                </div>
                
                {profile?.user_type === 'Employee' && (
                  <>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-600 text-xs">Employee ID</p>
                      <p className="text-gray-900 font-semibold">{profile?.employee_id || 'Not specified'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-600 text-xs">Position Type</p>
                      <p className="text-gray-900 font-semibold">{profile?.position_type || 'Not specified'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-600 text-xs">Department</p>
                      <p className="text-gray-900 font-semibold">{profile?.department || 'Not specified'}</p>
                    </div>
                  </>
                )}
                
                {profile?.user_type === 'College' && (
                  <>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-600 text-xs">Course</p>
                      <p className="text-gray-900 font-semibold">{profile?.course || 'Not specified'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-600 text-xs">Year Level</p>
                      <p className="text-gray-900 font-semibold">{profile?.year_level || 'Not specified'}</p>
                    </div>
                  </>
                )}
                
                {profile?.user_type === 'Senior High School' && (
                  <>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-600 text-xs">Strand</p>
                      <p className="text-gray-900 font-semibold">{profile?.strand || 'Not specified'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="font-medium text-gray-600 text-xs">Year Level</p>
                      <p className="text-gray-900 font-semibold">{profile?.year_level || 'Not specified'}</p>
                    </div>
                  </>
                )}
                
                {(profile?.user_type === 'High School' || profile?.user_type === 'Elementary' || profile?.user_type === 'Kindergarten') && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-600 text-xs">Year Level</p>
                    <p className="text-gray-900 font-semibold">{profile?.year_level || 'Not specified'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact Summary */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2 font-bold">3</span>
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
                <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2 font-bold">4</span>
                Health History
              </h3>
              
              <div className="space-y-4 text-sm">
                {/* Current Health Conditions */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs mb-2">Current Health Conditions</p>
                  <div className="text-gray-900 font-semibold">
                    {Array.isArray(profile?.comorbid_illnesses) && profile.comorbid_illnesses.length > 0 ? (
                      <div className="space-y-2">
                        {profile.comorbid_illnesses.map((condition: string, index: number) => {
                          const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
                          const subOptions = profile?.[`comorbid_${conditionKey}_sub`];
                          const specification = profile?.[`comorbid_${conditionKey}_spec`];
                          
                          return (
                            <div key={index} className="text-sm">
                              <span className="font-semibold">{condition}</span>
                              {Array.isArray(subOptions) && subOptions.length > 0 && (
                                <div className="ml-4 mt-1">
                                  <span className="text-xs text-gray-600">Selected: </span>
                                  <span className="text-xs text-gray-800">{subOptions.join(', ')}</span>
                                </div>
                              )}
                              {specification && specification.trim() && (
                                <div className="ml-4 mt-1">
                                  <span className="text-xs text-gray-600">Details: </span>
                                  <span className="text-xs text-gray-800">{specification}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span>None specified</span>
                    )}
                  </div>
                  {/* Backward compatibility for existing fields */}
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
                      ? profile.maintenance_medications.map(med => `${med.drug} ${med.dose}${med.unit} - ${med.frequency} (${med.duration || 'Duration not specified'})`).join(', ')
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
                <span className="w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs mr-2 font-bold">5</span>
                Medical & Family History
              </h3>
              
              <div className="space-y-4 text-sm">
                {/* Past Medical History */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs mb-2">Past Medical History</p>
                  <div className="text-gray-900 font-semibold">
                    {Array.isArray(profile?.past_medical_history) && profile.past_medical_history.length > 0 ? (
                      <div className="space-y-2">
                        {profile.past_medical_history.map((condition: string, index: number) => {
                          const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
                          const subOptions = profile?.[`past_medical_history_${conditionKey}_sub`];
                          const specification = profile?.[`past_medical_history_${conditionKey}_spec`];
                          
                          return (
                            <div key={index} className="text-sm">
                              <span className="font-semibold">{condition}</span>
                              {Array.isArray(subOptions) && subOptions.length > 0 && (
                                <div className="ml-4 mt-1">
                                  <span className="text-xs text-gray-600">Selected: </span>
                                  <span className="text-xs text-gray-800">{subOptions.join(', ')}</span>
                                </div>
                              )}
                              {specification && specification.trim() && (
                                <div className="ml-4 mt-1">
                                  <span className="text-xs text-gray-600">Details: </span>
                                  <span className="text-xs text-gray-800">{specification}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span>None specified</span>
                    )}
                  </div>
                  {profile?.past_medical_history_other && (
                    <div className="text-gray-700 mt-2 text-xs">
                      <span className="font-medium">Other: </span>
                      <span>{profile.past_medical_history_other}</span>
                    </div>
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
                  {profile?.hospital_admission_year && (
                    <p className="text-gray-700 mt-1 text-xs"><strong>Year:</strong> {profile.hospital_admission_year}</p>
                  )}
                </div>

                {/* Menstrual & Obstetric History (for females only) */}
                {profile?.gender === 'Female' && (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <p className="font-medium text-gray-600 text-xs mb-2">Menstrual & Obstetric History</p>
                    <div className="space-y-2 text-sm">
                      {profile?.menstruation_age_began && (
                        <div>
                          <span className="font-medium text-gray-700">Age when menstruation began:</span>
                          <span className="ml-2 text-gray-900">{profile.menstruation_age_began} years old</span>
                        </div>
                      )}
                      
                      {(profile?.menstruation_regular || profile?.menstruation_irregular) && (
                        <div>
                          <span className="font-medium text-gray-700">Menstrual pattern:</span>
                          <span className="ml-2 text-gray-900">
                            {profile?.menstruation_regular ? 'Regular (monthly)' : 'Irregular'}
                          </span>
                        </div>
                      )}
                      
                      {profile?.number_of_pregnancies !== undefined && profile?.number_of_pregnancies !== null && (
                        <div>
                          <span className="font-medium text-gray-700">Number of pregnancies:</span>
                          <span className="ml-2 text-gray-900">{profile.number_of_pregnancies}</span>
                        </div>
                      )}
                      
                      {profile?.number_of_live_children !== undefined && profile?.number_of_live_children !== null && (
                        <div>
                          <span className="font-medium text-gray-700">Number of live children:</span>
                          <span className="ml-2 text-gray-900">{profile.number_of_live_children}</span>
                        </div>
                      )}
                      
                      {Array.isArray(profile?.menstrual_symptoms) && profile.menstrual_symptoms.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Menstrual symptoms:</span>
                          <span className="ml-2 text-gray-900">{profile.menstrual_symptoms.join(', ')}</span>
                          {profile?.menstrual_symptoms_other && (
                            <span className="ml-1 text-gray-900">- {profile.menstrual_symptoms_other}</span>
                          )}
                        </div>
                      )}
                      
                      {!profile?.menstruation_age_began && !profile?.menstruation_regular && !profile?.menstruation_irregular && 
                       profile?.number_of_pregnancies === undefined && profile?.number_of_live_children === undefined && 
                       (!Array.isArray(profile?.menstrual_symptoms) || profile.menstrual_symptoms.length === 0) && (
                        <p className="text-gray-500 text-xs">No menstrual or obstetric history provided</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Family Medical History */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="font-medium text-gray-600 text-xs mb-2">Family Medical History</p>
                  <div className="text-gray-900 font-semibold">
                    {Array.isArray(profile?.family_medical_history) && profile.family_medical_history.length > 0 ? (
                      <div className="space-y-2">
                        {profile.family_medical_history.map((condition: string, index: number) => {
                          const conditionKey = condition.toLowerCase().replace(/\s+/g, '_');
                          const subOptions = profile?.[`family_medical_history_${conditionKey}_sub`];
                          const specification = profile?.[`family_medical_history_${conditionKey}_spec`];
                          
                          return (
                            <div key={index} className="text-sm">
                              <span className="font-semibold">{condition}</span>
                              {Array.isArray(subOptions) && subOptions.length > 0 && (
                                <div className="ml-4 mt-1">
                                  <span className="text-xs text-gray-600">Selected: </span>
                                  <span className="text-xs text-gray-800">{subOptions.join(', ')}</span>
                                </div>
                              )}
                              {specification && specification.trim() && (
                                <div className="ml-4 mt-1">
                                  <span className="text-xs text-gray-600">Details: </span>
                                  <span className="text-xs text-gray-800">{specification}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span>None specified</span>
                    )}
                  </div>
                  {profile?.family_medical_history_other && (
                    <div className="text-gray-700 mt-2 text-xs">
                      <span className="font-medium">Other: </span>
                      <span>{profile.family_medical_history_other}</span>
                    </div>
                  )}
                  {profile?.family_medical_history_allergies && (
                    <div className="text-gray-700 mt-2 text-xs">
                      <span className="font-medium">Allergies: </span>
                      <span>{profile.family_medical_history_allergies}</span>
                    </div>
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
                Please review all the information you&apos;ve provided above. Once you submit, you&apos;ll be able to proceed with your <span className="font-semibold text-[#800000]">{option}</span>.
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
      console.log('Is edit mode:', isEditMode);
      console.log('Has unsaved changes:', hasUnsavedChanges);
      console.log('About to validate step:', currentStep);
    }
    
    // ALWAYS validate current step before proceeding (regardless of edit mode)
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
            'nationality_specify': 'Nationality Specification',
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
            'employee_id': 'Employee ID',
            'department': 'Department',
            'position_type': 'Position Type',
            'course': 'Course',
            'year_level': 'Year Level',
            'strand': 'Strand',
            'hospital_admission_or_surgery': 'Hospital Admission/Surgery',
            'hospital_admission_details': 'Hospital Admission/Surgery Details',
            'hospital_admission_year': 'Hospital Admission/Surgery Year',
            'past_medical_history_other': 'Past Medical History (Other)',
            'food_allergy_specify': 'Food Allergies Specification',
            'other_comorbid_specify': 'Other Comorbid Illness Specification',
            'family_medical_history_other': 'Family Medical History (Other)',
            'family_medical_history_allergies': 'Family Medical History Allergies',
            'menstrual_symptoms_other': 'Menstrual Symptoms (Other)'
          };
          
          // Handle medication field names
          let friendlyName = fieldNames[field];
          if (!friendlyName && field.startsWith('medication_')) {
            const parts = field.split('_');
            if (parts.length >= 3) {
              const medIndex = parseInt(parts[1]) + 1;
              const fieldType = parts.slice(2).join('_');
              const medFieldNames: { [key: string]: string } = {
                'drug': 'Drug Name',
                'dose': 'Dose',
                'unit': 'Unit',
                'frequency': 'Frequency',
                'duration': 'Duration',
                'custom_duration': 'Custom Duration'
              };
              friendlyName = `Medication #${medIndex} ${medFieldNames[fieldType] || fieldType}`;
            }
          }
          
          if (!friendlyName) friendlyName = field;
          return `• ${friendlyName}: ${message}`;
        });
      
      const errorMessage = errorMessages.length > 0 
        ? `Please fix the following issues before proceeding:\n\n${errorMessages.join('\n')}\n\nAll required fields must be completed to continue.`
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
      // Final submission - save if in edit mode or if there are changes
      if (isEditMode || hasUnsavedChanges) {
        const waitingForConfirmation = await handleProfileSave();
        
        // If waiting for user confirmation, don't redirect yet
        // The redirect will happen in handleSaveConfirmation after user makes their choice
        if (waitingForConfirmation) {
          return; // Wait for user's decision via modal
        }
      }
      
      // Only redirect if save is complete (not waiting for confirmation)
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
      <ProfileSaveConfirmationModal 
        open={showSaveConfirmation}
        onClose={() => {
          setShowSaveConfirmation(false);
          setPendingSaveData(null);
          setLoading(false);
        }}
        onConfirm={handleSaveConfirmation}
        loading={loading}
      />
      {/* Plain white background */}
      <div className="fixed inset-0 w-full h-full bg-white -z-10" />
      <div className="min-h-screen py-2 sm:py-4 px-3 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Mobile-first Header */}
            <div className="text-center mb-4 sm:mb-6">
              {/* Edit Mode and Changes Indicator */}
              {profile?.id && (
                <div className="flex flex-col sm:flex-row items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                    <span className="text-sm text-gray-600">
                      Profile v{profile?.version || 1} • {currentSchoolYear?.academic_year} • {currentSemester?.replace('_', ' ')}
                    </span>
                    {hasUnsavedChanges && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Unsaved Changes
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {!isEditMode && !hasUnsavedChanges && (
                      <button
                        onClick={handleEditClick}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000]"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}
                    {isEditMode && (
                      <button
                        onClick={handleCancelEdit}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-center mb-3 sm:mb-4">
                <div className="flex items-center bg-white rounded-full px-3 sm:px-4 py-2 shadow-lg">
                  <span className="w-8 h-8 sm:w-10 sm:h-10 bg-[#800000] text-white rounded-full flex items-center justify-center font-bold text-lg sm:text-xl mr-2 sm:mr-3">{currentStep}</span>
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

              {/* Edit Mode Controls */}
              {profile?.id && (
                <div className="mt-4 mb-2">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                    {/* Edit Mode Status */}
                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                      isEditMode 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {isEditMode ? '✏️ Edit Mode' : '👁️ View Mode'}
                    </div>

                    {/* Profile Type Indicator */}
                    {isNewProfile && (
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        🆕 New Profile
                      </div>
                    )}

                    {/* Unsaved Changes Indicator */}
                    {hasUnsavedChanges && (
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        📝 Unsaved Changes
                      </div>
                    )}

                    {/* Edit/Cancel Button */}
                    <button
                      onClick={handleEditModeToggle}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isEditMode
                          ? 'bg-gray-500 text-white hover:bg-gray-600'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isEditMode ? 'Cancel Edit' : 'Edit Profile'}
                    </button>

                    {/* Save Changes Button - only show in edit mode */}
                    {isEditMode && hasUnsavedChanges && (
                      <button
                        onClick={handleSaveChanges}
                        disabled={loading}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    )}
                  </div>
                  
                  {/* Helpful text about medications */}
                  <div className="text-center mt-2">
                    <p className="text-xs text-gray-500">
                      💊 Medications can be added/removed anytime • Other fields require edit mode
                    </p>
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
                  
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    {/* Save Changes Button - only show in edit mode with unsaved changes */}
                    {isEditMode && hasUnsavedChanges && (
                      <button
                        onClick={handleSaveChanges}
                        disabled={loading}
                        className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-center text-sm sm:text-base"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    )}
                    
                    {/* Next/Submit Button */}
                    <button
                      onClick={handleNext}
                      className={`w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-md text-center text-sm sm:text-base ${
                        (!isEditMode && profile?.id) 
                          ? 'bg-gray-500 text-white hover:bg-gray-600 active:bg-gray-700 active:scale-95'
                          : 'bg-[#800000] text-white hover:bg-[#a83232] active:bg-[#600000] active:scale-95'
                      }`}
                    >
                      {currentStep === steps.length 
                        ? (isEditMode || hasUnsavedChanges ? 'Submit Profile' : 'Continue') 
                        : 'Next →'
                      }
                    </button>
                  </div>
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