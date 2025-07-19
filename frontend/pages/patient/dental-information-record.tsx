import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import FeedbackModal from '../../components/feedbackmodal';
import { djangoApiClient } from '../../utils/api';

const steps = [
  { id: 1, title: 'Personal Information' },
  { id: 2, title: 'Dental History' },
  { id: 3, title: 'Medical History' },
  { id: 4, title: 'Review & Submit' }
];

// Education Level Constants
const EDUCATION_LEVELS = {
  preschool: 'Preschool',
  elementary: 'Elementary',
  high_school: 'High School',
  senior_high: 'Senior High School',
  college: 'College'
} as const;

const YEAR_OPTIONS = {
  preschool: [
    { value: 'K1', label: 'Kindergarten 1 (K1)' },
    { value: 'K2', label: 'Kindergarten 2 (K2)' }
  ],
  elementary: [
    { value: '1', label: 'Grade 1' },
    { value: '2', label: 'Grade 2' },
    { value: '3', label: 'Grade 3' },
    { value: '4', label: 'Grade 4' },
    { value: '5', label: 'Grade 5' },
    { value: '6', label: 'Grade 6' }
  ],
  high_school: [
    { value: '7', label: 'Grade 7' },
    { value: '8', label: 'Grade 8' },
    { value: '9', label: 'Grade 9' },
    { value: '10', label: 'Grade 10' }
  ],
  senior_high: [
    { value: '11', label: 'Grade 11' },
    { value: '12', label: 'Grade 12' }
  ],
  college: [
    { value: '1st', label: '1st Year' },
    { value: '2nd', label: '2nd Year' },
    { value: '3rd', label: '3rd Year' },
    { value: '4th', label: '4th Year' },
    { value: '5th', label: '5th Year' }
  ]
};

const COLLEGE_COURSES = [
  'BS Information Technology',
  'BS Computer Science',
  'BS Engineering',
  'BS Nursing',
  'BS Education',
  'BS Business Administration',
  'BS Accountancy',
  'BS Psychology',
  'AB Political Science',
  'AB English',
  'AB History',
  'BS Biology',
  'BS Chemistry',
  'BS Physics',
  'BS Mathematics',
  'Other'
];

export default function DentalInformationRecordPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<any>({});
  const [currentSchoolYear, setCurrentSchoolYear] = useState<any>(null);
  const [currentSemester, setCurrentSemester] = useState<string>('');
  const [isAutoFilled, setIsAutoFilled] = useState(false);
  const [autoFilledFromYear, setAutoFilledFromYear] = useState<string>('');
  const [redirecting, setRedirecting] = useState(false);

  const [formData, setFormData] = useState({
    // Personal Information
    patient_name: '',
    age: '',
    sex: '',  // Changed from gender to sex
    education_level: '',
    year_level: '',
    course: '',
    date: '',
    
    // Dental History
    name_of_previous_dentist: '',
    last_dental_visit: '',
    date_of_last_cleaning: '',
    
    // Medical History - Yes/No Questions
    oral_hygiene_instructions: null,
    gums_bleed_brushing: null,
    teeth_sensitive_hot_cold: null,
    feel_pain_teeth: null,
    difficult_extractions_past: null,
    orthodontic_treatment: null,
    prolonged_bleeding_extractions: null,
    frequent_headaches: null,
    clench_grind_teeth: null,
    allergic_to_following: null,
    
    // Specific allergic items
    allergic_penicillin: false,
    allergic_amoxicillin: false,
    allergic_local_anesthetic: false,
    allergic_sulfa_drugs: false,
    allergic_latex: false,
    allergic_others: '',
    
    // Women Only
    is_woman: false,
    menstruation_today: null,
    pregnant: null,
    taking_birth_control: null,
    
    // Additional Medical Questions
    smoke: null,
    under_medical_treatment: null,
    medical_treatment_condition: '',
    hospitalized: null,
    hospitalization_when_why: '',
    taking_prescription_medication: null,
    prescription_medication_details: '',
    
    // Medical Conditions Checkboxes
    high_blood_pressure: false,
    low_blood_pressure: false,
    epilepsy_convulsions: false,
    aids_hiv_positive: false,
    sexually_transmitted_disease: false,
    stomach_trouble_ulcers: false,
    fainting_seizure: false,
    rapid_weight_loss: false,
    radiation_therapy: false,
    joint_replacement_implant: false,
    heart_surgery: false,
    heart_attack: false,
    thyroid_problem: false,
    heart_disease: false,
    heart_murmur: false,
    hepatitis_liver_disease: false,
    rheumatic_fever: false,
    hay_fever_allergies: false,
    respiratory_problems: false,
    hepatitis_jaundice: false,
    tuberculosis: false,
    swollen_ankles: false,
    kidney_disease: false,
    diabetes: false,
    chest_pain: false,
    stroke: false,
    cancer_tumors: false,
    anemia: false,
    angina: false,
    asthma: false,
    emphysema: false,
    blood_diseases: false,
    head_injuries: false,
    arthritis_rheumatism: false,
    other_conditions: '',
    
    // Signature fields
    patient_signature: '',
    signature_date: ''
  });

  const progress = (currentStep / steps.length) * 100;

  // Autofill data from patient profile
  const loadAutofillData = async () => {
    try {
      const params = new URLSearchParams();
      if (currentSchoolYear?.id) {
        params.append('school_year', currentSchoolYear.id.toString());
      }
      if (currentSemester) {
        params.append('semester', currentSemester);
      }

      const response = await djangoApiClient.get(`/patients/autofill_data/?${params.toString()}`);
      const autofillData = response.data;

      if (autofillData) {
        // Auto-fill only basic information from patient table (name, age, sex)
        const updatedFormData = { ...formData };
        
        // Basic information from Patient model
        if (autofillData.patient_name) {
          updatedFormData.patient_name = autofillData.patient_name;
        }
        
        if (autofillData.age) {
          updatedFormData.age = autofillData.age.toString();
        } else if (autofillData.date_of_birth) {
          // Calculate age from date of birth if age is not directly available
          const birthDate = new Date(autofillData.date_of_birth);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          updatedFormData.age = age.toString();
        }
        
        if (autofillData.sex) {
          updatedFormData.sex = autofillData.sex;
        }
        
        setFormData(updatedFormData);
        
        if (autofillData.has_previous_data || autofillData.has_existing_profile) {
          setIsAutoFilled(true);
          setAutoFilledFromYear(autofillData.autofilled_from_year || 'patient profile');
        }
        
        console.log('Auto-filled dental form data (basic info only):', {
          patient_name: updatedFormData.patient_name,
          age: updatedFormData.age,
          sex: updatedFormData.sex
        });
      }
    } catch (error) {
      console.log('No autofill data available or error loading:', error);
      // Continue without autofill - this is not a critical error
    }
  };

  useEffect(() => {
    // Check if dental information record already exists for current semester
    const checkExistingRecord = async () => {
      setLoading(true);
      
      try {
        const response = await djangoApiClient.get('/dental-information-records/current_record/');
        
        if (response.data && response.data.id) {
          console.log('Existing dental information record found:', response.data);
          setRedirecting(true);
          
          // Redirect to dental appointment booking
          setTimeout(() => {
            router.push({
              pathname: '/appointments/dental',
              query: { ...router.query, option: 'Book Dental Consultation' }
            });
          }, 1000);
          return;
        }
      } catch (error) {
        console.log('No existing dental information record found, showing form');
        // Continue to show the form if no record exists (404 is expected)
      }
      
      setLoading(false);
    };
    
    checkExistingRecord();
    
    // Initialize with current date
    const today = new Date().toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, date: today, signature_date: today }));

    // Get user info from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const fullName = `${user.last_name || ''}, ${user.first_name || ''} ${user.middle_name || ''}`.trim();
        setFormData(prev => ({
          ...prev,
          patient_name: fullName,
          patient_signature: fullName
        }));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Load current school year
    loadCurrentSchoolYear();
  }, [router]);

  // Load autofill data after school year and semester are available
  useEffect(() => {
    if (currentSchoolYear && currentSemester) {
      loadAutofillData();
    }
  }, [currentSchoolYear, currentSemester]);

  const loadCurrentSchoolYear = async () => {
    try {
      const response = await djangoApiClient.get('/academic-school-years/current/');
      if (response.data) {
        setCurrentSchoolYear(response.data);
        setCurrentSemester('1st_semester'); // Default semester
      }
    } catch (error) {
      console.error('Error loading current school year:', error);
      setCurrentSemester('1st_semester'); // Default semester
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear field errors when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (step: number) => {
    const errors: any = {};
    
    if (step === 1) {
      if (!formData.patient_name.trim()) errors.patient_name = 'Patient name is required';
      if (!formData.age) errors.age = 'Age is required';
      if (!formData.sex) errors.sex = 'Sex is required';
      if (!formData.education_level) errors.education_level = 'Education level is required';
      if (!formData.year_level) errors.year_level = 'Year level is required';
      if (formData.education_level === 'college' && !formData.course) {
        errors.course = 'Course is required for college students';
      }
      if (!formData.date) errors.date = 'Date is required';
    }
    
    if (step === 2) {
      // Dental history validation - optional fields but validate format
      if (formData.last_dental_visit && formData.last_dental_visit.trim() === '') {
        errors.last_dental_visit = 'Please specify when your last dental visit was';
      }
    }
    
    if (step === 3) {
      // Medical history validation
      const yesNoFields = [
        'oral_hygiene_instructions', 'gums_bleed_brushing', 'teeth_sensitive_hot_cold',
        'feel_pain_teeth', 'difficult_extractions_past', 'orthodontic_treatment',
        'prolonged_bleeding_extractions', 'frequent_headaches', 'clench_grind_teeth',
        'allergic_to_following', 'smoke', 'under_medical_treatment', 'hospitalized',
        'taking_prescription_medication'
      ];
      
      // Add women-only questions if applicable
      if (formData.is_woman) {
        yesNoFields.push('menstruation_today', 'pregnant', 'taking_birth_control');
      }
      
      for (const field of yesNoFields) {
        if (formData[field] === null) {
          const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          errors[field] = `Please answer: ${fieldName}`;
        }
      }
      
      // Conditional validations
      if (formData.under_medical_treatment === true && !formData.medical_treatment_condition.trim()) {
        errors.medical_treatment_condition = 'Please specify the medical condition being treated';
      }
      
      if (formData.hospitalized === true && !formData.hospitalization_when_why.trim()) {
        errors.hospitalization_when_why = 'Please specify when and why you were hospitalized';
      }
      
      if (formData.taking_prescription_medication === true && !formData.prescription_medication_details.trim()) {
        errors.prescription_medication_details = 'Please specify the prescription medication';
      }
      
      if (formData.allergic_to_following === true) {
        const hasAnyAllergy = formData.allergic_penicillin || formData.allergic_amoxicillin ||
          formData.allergic_local_anesthetic || formData.allergic_sulfa_drugs ||
          formData.allergic_latex || formData.allergic_others.trim();
        
        if (!hasAnyAllergy) {
          errors.allergic_items = 'Please specify what you are allergic to';
        }
      }
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      const errorMessages = Object.entries(fieldErrors)
        .filter(([_, message]) => message)
        .map(([field, message]) => `• ${message}`)
        .join('\n');
      
      setFeedbackMessage(`Please fix the following issues:\n\n${errorMessages}`);
      setFeedbackOpen(true);
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setFieldErrors({});
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        // Combine education fields into legacy year_section for backwards compatibility
        year_section: formData.education_level === 'college' && formData.course
          ? `${formData.year_level} Year ${formData.course}`
          : `${YEAR_OPTIONS[formData.education_level as keyof typeof YEAR_OPTIONS]?.find(opt => opt.value === formData.year_level)?.label || formData.year_level}`,
        school_year: currentSchoolYear?.id,
        semester: currentSemester
      };
      
      // Submit to dental information record API
      await djangoApiClient.post('/dental-information-records/create_current/', submissionData);
      
      setSuccess(true);
      setFeedbackMessage('Dental Information Record submitted successfully! You can now proceed with your dental appointment.');
      setFeedbackOpen(true);
      
      // Redirect to dental appointment booking after success
      setTimeout(() => {
        router.push({
          pathname: '/appointments/dental',
          query: { ...router.query, option: 'Book Dental Consultation' }
        });
      }, 3000);
      
    } catch (err: any) {
      let msg = 'Failed to submit dental information record.';
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
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Personal Information</h2>
              <p className="text-sm text-gray-600">Please provide your basic information</p>
            </div>

            {/* Auto-fill Info Banner */}
            {isAutoFilled && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-700 font-medium">
                  📋 Auto-filled Information
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Basic information (name, age, sex) has been pre-filled from your {autoFilledFromYear}. Please review and update as needed.
                </div>
              </div>
            )}

            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name of Patient: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.patient_name}
                    onChange={(e) => handleInputChange('patient_name', e.target.value)}
                    className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.patient_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Last Name, First Name Middle Name"
                  />
                  {fieldErrors.patient_name && <div className="text-red-500 text-xs mt-1">{fieldErrors.patient_name}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.age ? 'border-red-500' : 'border-gray-300'
                    }`}
                    min="1"
                    max="150"
                  />
                  {fieldErrors.age && <div className="text-red-500 text-xs mt-1">{fieldErrors.age}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sex: <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.sex}
                    onChange={(e) => {
                      handleInputChange('sex', e.target.value);
                      handleInputChange('is_woman', e.target.value === 'Female');
                    }}
                    className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.sex ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Sex</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  {fieldErrors.sex && <div className="text-red-500 text-xs mt-1">{fieldErrors.sex}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Education Level: <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.education_level}
                    onChange={(e) => {
                      handleInputChange('education_level', e.target.value);
                      // Reset dependent fields when education level changes
                      handleInputChange('year_level', '');
                      handleInputChange('course', '');
                    }}
                    className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.education_level ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Education Level</option>
                    {Object.entries(EDUCATION_LEVELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  {fieldErrors.education_level && <div className="text-red-500 text-xs mt-1">{fieldErrors.education_level}</div>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year Level: <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.year_level}
                    onChange={(e) => handleInputChange('year_level', e.target.value)}
                    disabled={!formData.education_level}
                    className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.year_level ? 'border-red-500' : 'border-gray-300'
                    } ${!formData.education_level ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  >
                    <option value="">
                      {formData.education_level ? 'Select Year Level' : 'Select Education Level First'}
                    </option>
                    {formData.education_level && YEAR_OPTIONS[formData.education_level as keyof typeof YEAR_OPTIONS]?.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  {fieldErrors.year_level && <div className="text-red-500 text-xs mt-1">{fieldErrors.year_level}</div>}
                </div>

                {formData.education_level === 'college' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course: <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.course}
                      onChange={(e) => handleInputChange('course', e.target.value)}
                      className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        fieldErrors.course ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Course</option>
                      {COLLEGE_COURSES.map(course => (
                        <option key={course} value={course}>{course}</option>
                      ))}
                    </select>
                    {fieldErrors.course && <div className="text-red-500 text-xs mt-1">{fieldErrors.course}</div>}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      fieldErrors.date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {fieldErrors.date && <div className="text-red-500 text-xs mt-1">{fieldErrors.date}</div>}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Dental History</h2>
              <p className="text-sm text-gray-600">Tell us about your previous dental experiences</p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name of Previous Dentist:
                  </label>
                  <input
                    type="text"
                    value={formData.name_of_previous_dentist}
                    onChange={(e) => handleInputChange('name_of_previous_dentist', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter dentist's name (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Dental Visit:
                  </label>
                  <input
                    type="text"
                    value={formData.last_dental_visit}
                    onChange={(e) => handleInputChange('last_dental_visit', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 6 months ago, Last year, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Last Cleaning:
                  </label>
                  <input
                    type="text"
                    value={formData.date_of_last_cleaning}
                    onChange={(e) => handleInputChange('date_of_last_cleaning', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., 3 months ago, Never, etc."
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Medical History</h2>
              <p className="text-sm text-gray-600">Please answer all questions to help us provide better care</p>
            </div>

            {/* Medical History Questions */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Medical History Questions</h3>
              
              <div className="space-y-4">
                {[
                  { key: 'oral_hygiene_instructions', label: 'Have you ever received oral hygiene instructions?' },
                  { key: 'gums_bleed_brushing', label: 'Do your gums bleed while brushing or flossing?' },
                  { key: 'teeth_sensitive_hot_cold', label: 'Are your teeth sensitive to hot or cold liquids/foods?' },
                  { key: 'feel_pain_teeth', label: 'Do you feel pain in any of your teeth?' },
                  { key: 'difficult_extractions_past', label: 'Have you ever had any difficult extractions in the past?' },
                  { key: 'orthodontic_treatment', label: 'Have you ever had orthodontic treatment?' },
                  { key: 'prolonged_bleeding_extractions', label: 'Have you ever had any prolonged bleeding following extractions?' },
                  { key: 'frequent_headaches', label: 'Do you have frequent headaches?' },
                  { key: 'clench_grind_teeth', label: 'Do you clench or grind your teeth?' },
                  { key: 'smoke', label: 'Do you smoke?' },
                  { key: 'under_medical_treatment', label: 'Are you under medical treatment now?' },
                  { key: 'hospitalized', label: 'Have you ever been hospitalized?' },
                  { key: 'taking_prescription_medication', label: 'Are you taking any prescription/non-prescription medication?' }
                ].map((question) => (
                  <div key={question.key} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        {question.label} <span className="text-red-500">*</span>
                      </label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={question.key}
                            value="true"
                            checked={formData[question.key] === true}
                            onChange={() => handleInputChange(question.key, true)}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-900">Yes</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={question.key}
                            value="false"
                            checked={formData[question.key] === false}
                            onChange={() => handleInputChange(question.key, false)}
                            className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-900">No</span>
                        </label>
                      </div>
                      {fieldErrors[question.key] && (
                        <div className="text-red-500 text-xs">{fieldErrors[question.key]}</div>
                      )}
                    </div>

                    {/* Conditional follow-up questions */}
                    {question.key === 'under_medical_treatment' && formData.under_medical_treatment === true && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={formData.medical_treatment_condition}
                          onChange={(e) => handleInputChange('medical_treatment_condition', e.target.value)}
                          className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            fieldErrors.medical_treatment_condition ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="If so, what is the condition being treated?"
                        />
                        {fieldErrors.medical_treatment_condition && (
                          <div className="text-red-500 text-xs mt-1">{fieldErrors.medical_treatment_condition}</div>
                        )}
                      </div>
                    )}

                    {question.key === 'hospitalized' && formData.hospitalized === true && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={formData.hospitalization_when_why}
                          onChange={(e) => handleInputChange('hospitalization_when_why', e.target.value)}
                          className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            fieldErrors.hospitalization_when_why ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="If so, when and why?"
                        />
                        {fieldErrors.hospitalization_when_why && (
                          <div className="text-red-500 text-xs mt-1">{fieldErrors.hospitalization_when_why}</div>
                        )}
                      </div>
                    )}

                    {question.key === 'taking_prescription_medication' && formData.taking_prescription_medication === true && (
                      <div className="mt-3">
                        <input
                          type="text"
                          value={formData.prescription_medication_details}
                          onChange={(e) => handleInputChange('prescription_medication_details', e.target.value)}
                          className={`w-full border rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                            fieldErrors.prescription_medication_details ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="If so, please specify"
                        />
                        {fieldErrors.prescription_medication_details && (
                          <div className="text-red-500 text-xs mt-1">{fieldErrors.prescription_medication_details}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Allergies Section */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Allergies</h3>
              
              <div className="border border-gray-200 rounded-lg p-4 mb-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Are you allergic to any of the following? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="allergic_to_following"
                        value="true"
                        checked={formData.allergic_to_following === true}
                        onChange={() => handleInputChange('allergic_to_following', true)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Yes</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="allergic_to_following"
                        value="false"
                        checked={formData.allergic_to_following === false}
                        onChange={() => handleInputChange('allergic_to_following', false)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">No</span>
                    </label>
                  </div>
                  {fieldErrors.allergic_to_following && (
                    <div className="text-red-500 text-xs">{fieldErrors.allergic_to_following}</div>
                  )}
                </div>

                {formData.allergic_to_following === true && (
                  <div className="mt-4 space-y-2">
                    {[
                      { key: 'allergic_penicillin', label: 'Penicillin /Amoxicillin /Antibiotics' },
                      { key: 'allergic_local_anesthetic', label: 'Local Anesthetic (Lidocaine)' },
                      { key: 'allergic_sulfa_drugs', label: 'Sulfa Drugs' },
                      { key: 'allergic_latex', label: 'Latex (ex. Gloves)' }
                    ].map((item) => (
                      <label key={item.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData[item.key]}
                          onChange={(e) => handleInputChange(item.key, e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{item.label}</span>
                      </label>
                    ))}
                    <div className="mt-2">
                      <input
                        type="text"
                        value={formData.allergic_others}
                        onChange={(e) => handleInputChange('allergic_others', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Others: (specify)"
                      />
                    </div>
                    {fieldErrors.allergic_items && (
                      <div className="text-red-500 text-xs">{fieldErrors.allergic_items}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Women Only Section */}
            {formData.is_woman && (
              <div className="bg-pink-50 p-4 sm:p-6 rounded-xl border border-pink-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">For Women Only:</h3>
                
                <div className="space-y-4">
                  {[
                    { key: 'menstruation_today', label: 'Do you have menstruation today?' },
                    { key: 'pregnant', label: 'Are you Pregnant?' },
                    { key: 'taking_birth_control', label: 'Are you taking birth control pills' }
                  ].map((question) => (
                    <div key={question.key} className="border border-pink-200 rounded-lg p-4 bg-white">
                      <div className="flex flex-col space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                          {question.label} <span className="text-red-500">*</span>
                        </label>
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={question.key}
                              value="true"
                              checked={formData[question.key] === true}
                              onChange={() => handleInputChange(question.key, true)}
                              className="h-4 w-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                            />
                            <span className="ml-2 text-sm text-gray-900">Yes</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={question.key}
                              value="false"
                              checked={formData[question.key] === false}
                              onChange={() => handleInputChange(question.key, false)}
                              className="h-4 w-4 text-pink-600 border-gray-300 focus:ring-pink-500"
                            />
                            <span className="ml-2 text-sm text-gray-900">No</span>
                          </label>
                        </div>
                        {fieldErrors[question.key] && (
                          <div className="text-red-500 text-xs">{fieldErrors[question.key]}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medical Conditions Checkboxes */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Do you have, or have you had, any of the following? <br />
                <span className="text-sm font-normal text-gray-600">Check which apply</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { key: 'high_blood_pressure', label: 'High Blood Pressure' },
                  { key: 'low_blood_pressure', label: 'Low Blood Pressure' },
                  { key: 'epilepsy_convulsions', label: 'Epilepsy/ Convulsions' },
                  { key: 'aids_hiv_positive', label: 'AIDS or HIV Positive' },
                  { key: 'sexually_transmitted_disease', label: 'Sexually Transmitted Disease' },
                  { key: 'stomach_trouble_ulcers', label: 'Stomach Trouble/ Ulcers' },
                  { key: 'fainting_seizure', label: 'Fainting Seizure' },
                  { key: 'rapid_weight_loss', label: 'Rapid Weight Loss' },
                  { key: 'radiation_therapy', label: 'Radiation Therapy' },
                  { key: 'joint_replacement_implant', label: 'Joint Replacement/ Implant' },
                  { key: 'heart_surgery', label: 'Heart Surgery' },
                  { key: 'heart_attack', label: 'Heart Attack' },
                  { key: 'thyroid_problem', label: 'Thyroid Problem' },
                  { key: 'heart_disease', label: 'Heart Disease' },
                  { key: 'heart_murmur', label: 'Heart Murmur' },
                  { key: 'hepatitis_liver_disease', label: 'Hepatitis/ Liver Disease' },
                  { key: 'rheumatic_fever', label: 'Rheumatic Fever' },
                  { key: 'hay_fever_allergies', label: 'Hay Fever/ Allergies' },
                  { key: 'respiratory_problems', label: 'Respiratory Problems' },
                  { key: 'hepatitis_jaundice', label: 'Hepatitis/ Jaundice' },
                  { key: 'tuberculosis', label: 'Tuberculosis' },
                  { key: 'swollen_ankles', label: 'Swollen ankles' },
                  { key: 'kidney_disease', label: 'Kidney disease' },
                  { key: 'diabetes', label: 'Diabetes' },
                  { key: 'chest_pain', label: 'Chest Pain' },
                  { key: 'stroke', label: 'Stroke' },
                  { key: 'cancer_tumors', label: 'Cancer/ Tumors' },
                  { key: 'anemia', label: 'Anemia' },
                  { key: 'angina', label: 'Angina' },
                  { key: 'asthma', label: 'Asthma' },
                  { key: 'emphysema', label: 'Emphysema' },
                  { key: 'blood_diseases', label: 'Blood Diseases' },
                  { key: 'head_injuries', label: 'Head Injuries' },
                  { key: 'arthritis_rheumatism', label: 'Arthritis/ Rheumatism' }
                ].map((condition) => (
                  <label key={condition.key} className="flex items-center p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData[condition.key]}
                      onChange={(e) => handleInputChange(condition.key, e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{condition.label}</span>
                  </label>
                ))}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Others:
                </label>
                <input
                  type="text"
                  value={formData.other_conditions}
                  onChange={(e) => handleInputChange('other_conditions', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Specify other conditions (if any)"
                />
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Important:</strong> To the best of my knowledge, the questions on this form have been accurately answered. I understand that providing incorrect information can be dangerous to my health. It is my responsibility to inform the dental office of any changes in medical and dental status.
              </p>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">Review & Submit</h2>
              <p className="text-sm text-gray-600">Please review all information before submitting</p>
            </div>

            {/* Personal Information Summary */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2 font-bold">1</span>
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-600 text-xs">Patient Name</p>
                  <p className="text-gray-900 font-semibold">{formData.patient_name}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-600 text-xs">Age/Sex</p>
                  <p className="text-gray-900 font-semibold">{formData.age} / {formData.sex}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-600 text-xs">Education</p>
                  <p className="text-gray-900 font-semibold">
                    {EDUCATION_LEVELS[formData.education_level as keyof typeof EDUCATION_LEVELS] || 'Not specified'} - {' '}
                    {YEAR_OPTIONS[formData.education_level as keyof typeof YEAR_OPTIONS]?.find(opt => opt.value === formData.year_level)?.label || formData.year_level}
                    {formData.education_level === 'college' && formData.course && (
                      <><br /><span className="text-sm text-gray-600">{formData.course}</span></>
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-600 text-xs">Date</p>
                  <p className="text-gray-900 font-semibold">{formData.date}</p>
                </div>
              </div>
            </div>

            {/* Dental History Summary */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2 font-bold">2</span>
                Dental History
              </h3>
              
              <div className="grid grid-cols-1 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-600 text-xs">Previous Dentist</p>
                  <p className="text-gray-900 font-semibold">{formData.name_of_previous_dentist || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-600 text-xs">Last Dental Visit</p>
                  <p className="text-gray-900 font-semibold">{formData.last_dental_visit || 'Not specified'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-600 text-xs">Last Cleaning</p>
                  <p className="text-gray-900 font-semibold">{formData.date_of_last_cleaning || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* Medical History Summary */}
            <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200">
              <h3 className="text-lg font-bold mb-4 flex items-center text-gray-800">
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mr-2 font-bold">3</span>
                Medical History Summary
              </h3>
              
              <div className="text-sm space-y-2">
                <p><strong>Allergic to medications:</strong> {formData.allergic_to_following ? 'Yes' : 'No'}</p>
                <p><strong>Under medical treatment:</strong> {formData.under_medical_treatment ? 'Yes' : 'No'}</p>
                <p><strong>Taking medications:</strong> {formData.taking_prescription_medication ? 'Yes' : 'No'}</p>
                <p><strong>Smoke:</strong> {formData.smoke ? 'Yes' : 'No'}</p>
                
                {formData.is_woman && (
                  <div className="mt-4 p-3 bg-pink-50 rounded-lg">
                    <p className="font-medium text-pink-800">Women-specific responses:</p>
                    <p><strong>Pregnant:</strong> {formData.pregnant ? 'Yes' : 'No'}</p>
                    <p><strong>Taking birth control:</strong> {formData.taking_birth_control ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Final Notice */}
            <div className="bg-gradient-to-r from-blue-100 to-blue-200 p-4 sm:p-6 rounded-xl border border-blue-300">
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-blue-700 text-center text-sm sm:text-base">
                Please review all the information you've provided above. Once you submit, you'll be able to proceed with your dental appointment booking.
              </p>
              <p className="text-blue-600 text-center text-xs mt-2">
                You can go back to any previous step to make changes before submitting.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Dummy handlers for Layout
  const handleLoginClick = () => {};
  const handleSignupClick = () => {};

  if (loading || redirecting) {
    return (
      <Layout onLoginClick={handleLoginClick} onSignupClick={handleSignupClick}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {redirecting ? 'Dental record found! Redirecting to appointment booking...' : 'Loading...'}
            </p>
            {redirecting && (
              <p className="mt-2 text-sm text-gray-500">
                You already have a dental information record for this semester.
              </p>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLoginClick={handleLoginClick} onSignupClick={handleSignupClick}>
      <FeedbackModal open={feedbackOpen} message={feedbackMessage} onClose={() => setFeedbackOpen(false)} />
      
      {/* Background */}
      <div className="fixed inset-0 w-full h-full bg-gray-50 -z-10" />
      
      <div className="min-h-screen py-4 px-3 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center bg-white rounded-full px-4 py-2 shadow-lg">
                <span className="inline-block w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl mr-3">{currentStep}</span>
                <span className="text-lg lg:text-2xl font-bold text-blue-600">{steps[currentStep-1].title}</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            {/* Step indicators */}
            <div className="hidden sm:flex justify-between text-xs sm:text-sm font-semibold">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    currentStep >= step.id ? 'text-blue-600 bg-blue-100' : 'text-gray-400'
                  }`}
                >
                  {step.title}
                </div>
              ))}
            </div>
            
            {/* Mobile step indicator */}
            <div className="sm:hidden">
              <span className="text-sm text-gray-600">
                Step {currentStep} of {steps.length}
              </span>
            </div>
            
            {/* Page Title */}
            <div className="mt-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                Dental Patient Information Record
              </h1>
              <p className="text-gray-600 mt-2">
                Please complete this form before your dental appointment
              </p>
            </div>
            
            {/* School Year Info */}
            {currentSchoolYear && currentSemester && (
              <div className="mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mx-auto max-w-md">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-blue-800">
                      {currentSchoolYear.academic_year} • {
                        currentSemester === '1st_semester' ? 'First Semester' :
                        currentSemester === '2nd_semester' ? 'Second Semester' :
                        currentSemester === 'summer' ? 'Summer Semester' : currentSemester
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Main Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            {/* Content */}
            <div className="p-4 lg:p-8">
              {renderStepContent()}
            </div>
            
            {/* Navigation Buttons */}
            <div className="p-4 lg:p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <div className="flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={handleBack}
                  className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition-all duration-200 text-center ${
                    currentStep === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800'
                  }`}
                  disabled={currentStep === 1}
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-md text-center disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : currentStep === steps.length ? 'Submit Record' : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
