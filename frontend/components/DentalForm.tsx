import React, { useState, useEffect } from 'react';
import { dentalFormAPI, djangoApiClient, patientsAPI, dentalMedicinesAPI } from '../utils/api';
import FeedbackModal from './feedbackmodal';

/**
 * DentalForm Component
 * 
 * Usage:
 * - With appointment ID: <DentalForm appointmentId="123" />
 * - With patient ID: <DentalForm patientId="456" />
 * - Without auto-fill: <DentalForm />
 * 
 * The component will automatically fetch and fill patient information
 * when appointmentId or patientId is provided.
 */

// Calculate tooth positions for perfect centering and even spacing
const calculateToothPositions = (): { [key: number]: { x: number; y: number } } => {
  const positions: { [key: number]: { x: number; y: number } } = {};
  
  // Perfect centering with even distribution
  const totalTeethPerRow = 16;
  const spacingPercentage = 95; // Use 95% of the container width for better margins
  const leftMargin = (100 - spacingPercentage) / 2; // Center the teeth horizontally
  const spacingInterval = spacingPercentage / (totalTeethPerRow - 1); // Even spacing between teeth
  
  // Upper teeth (1-16) - positioned above the image
  for (let i = 1; i <= 16; i++) {
    positions[i] = {
      x: leftMargin + (i - 1) * spacingInterval,
      y: -10 // Above the image with some breathing room
    };
  }
  
  // Lower teeth (17-32) - positioned below the image  
  for (let i = 17; i <= 32; i++) {
    const position = i - 16; // Convert to 1-16 range for positioning
    positions[i] = {
      x: leftMargin + (position - 1) * spacingInterval,
      y: 120 // Below the image with more breathing room
    };
  }
  
  return positions;
};

const TOOTH_POSITIONS = calculateToothPositions();

const DentalChart = ({ onToothClick, permanentTeethStatus, temporaryTeethStatus }) => {
  const getToothStatus = (toothNumber) => {
    return permanentTeethStatus[toothNumber] || temporaryTeethStatus[toothNumber] || {};
  };

  const hasToothData = (toothNumber) => {
    const status = getToothStatus(toothNumber);
    return status.treatment || status.status;
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6 bg-white ">
      <h3 className="text-xl font-bold text-gray-800 mb-4"> </h3>
      <p className="text-sm text-gray-600 mb-6"></p>
      {/* Dental Chart Container */}
      <div className="mb-20 relative inline-block max-w-full overflow-visible" style={{ width: '106%', marginLeft: '-3%' }}>
        <img 
          src="/full set.png" 
          alt="Dental Chart" 
          className="max-w-full h-auto mx-auto"
          style={{ maxHeight: '600px' }}
        />
        {/* Clickable tooth number overlay buttons */}
        {Object.entries(TOOTH_POSITIONS).map(([toothNumber, position]) => {
          const toothNum = parseInt(toothNumber);
          const hasData = hasToothData(toothNum);
          return (
            <button
              key={toothNum}
              type="button"
              onClick={() => onToothClick(toothNum)}
              style={{
                position: 'absolute',
                left: `${position.x}%`,
                top: `${position.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: 2,
                background: hasData ? '#ef4444' : '#3b82f6',
                border: hasData ? '2px solid #b91c1c' : '2px solid #2563eb',
                color: 'white',
                width: 32,
                height: 32,
                borderRadius: '50%',
                fontWeight: 600,
                fontSize: 14,
                boxShadow: hasData ? '0 0 0 2px #fee2e2' : '0 0 0 2px #dbeafe',
                cursor: 'pointer',
                transition: 'background 0.2s, border 0.2s',
              }}
              title={`Tooth ${toothNum}`}
            >
              {toothNum}
            </button>
          );
        })}
      </div>
      {/* Tooth numbers row (for mobile/extra clarity) */}
      {/* Legend at the bottom */}
      <div className="mt-8 flex flex-wrap justify-center gap-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-blue-600" style={{ clipPath: 'polygon(50% 0%, 80% 20%, 100% 50%, 80% 80%, 50% 100%, 20% 80%, 0% 50%, 20% 20%)' }}></div>
          <span className="text-sm font-medium">Available for data entry</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-red-600" style={{ clipPath: 'polygon(50% 0%, 80% 20%, 100% 50%, 80% 80%, 50% 100%, 20% 80%, 0% 50%, 20% 20%)' }}></div>
          <span className="text-sm font-medium">Has treatment/status data</span>
        </div>
      </div>
    </div>
  );
};

// Tooth type definitions based on the image
const getToothType = (toothNumber) => {
  const toothStr = toothNumber.toString();
  const lastDigit = parseInt(toothStr[toothStr.length - 1]);
  
  // For permanent teeth (adult teeth)
  if (toothNumber >= 11) {
    if ([1, 2].includes(lastDigit)) return 'incisor';
    if ([3].includes(lastDigit)) return 'canine';
    if ([4, 5].includes(lastDigit)) return 'premolar';
    if ([6, 7, 8].includes(lastDigit)) return 'molar';
  }
  // For primary teeth (baby teeth)
  else {
    if ([1, 2].includes(lastDigit)) return 'incisor';
    if ([3].includes(lastDigit)) return 'canine';
    if ([4, 5].includes(lastDigit)) return 'molar'; // Primary teeth don't have premolars
  }
  return 'molar';
};

const RadioGroup = ({ title, name, options, value, onChange, disabled = false }) => (
    <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <div className="flex flex-wrap gap-4">
            {options.map(option => (
                <label key={option} className={`flex items-center space-x-2 group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                        type="radio"
                        name={name}
                        value={option}
                        checked={value === option}
                        onChange={onChange}
                        disabled={disabled}
                        className={`h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <span className={`text-sm transition-colors ${disabled ? 'text-gray-400' : 'text-gray-600 group-hover:text-gray-800'}`}>{option}</span>
                </label>
            ))}
        </div>
    </div>
);

const FormSection = ({ title, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-8 pb-3 border-b border-gray-100">{title}</h2>
        <div className="space-y-8">{children}</div>
    </div>
);

const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = false, disabled = false }) => (
    <div className="space-y-2">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 ${
                disabled ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
        />
    </div>
);

const TextAreaField = ({ label, name, value, onChange, placeholder, rows = 4, required = false }) => (
    <div className="space-y-2">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
            name={name}
            id={name}
            rows={rows}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 resize-none"
        />
    </div>
);

const TOOTH_STATUS_OPTIONS = [
  'Extracted',
  'Needs Extraction',
  'Needs Filling',
  'Treated',
];

interface DentalFormProps {
  appointmentId?: string;
  patientId?: string;
}

const DentalForm: React.FC<DentalFormProps> = ({ appointmentId, patientId: patientIdProp }) => {
  const [formData, setFormData] = useState({
    fileNo: '',
    surname: '',
    firstName: '',
    middleName: '',
    age: '',
    sex: 'Male',
    hasToothbrush: 'Yes',
    dentition: '',
    periodontal: '',
    occlusion: '',
    malocclusionSeverity: '',
    decayedTeeth: '',
    missingTeeth: '',
    filledTeeth: '',
    oralHygiene: '',
    recommendedTreatments: '',
    preventionAdvice: '',
    nextAppointment: '',
    treatmentPriority: '',
    remarks: '',
    examinedBy: '',
    examinerPosition: '',
    examinerLicense: '',
    examinerPtr: '',
    examinerPhone: '',
    date: '',
    nextAppointmentDate: '',
    nextAppointmentTime: '10:00',
  });

  const [selectedTooth, setSelectedTooth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState(patientIdProp);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [permanentTeethStatus, setPermanentTeethStatus] = useState({});
  const [temporaryTeethStatus, setTemporaryTeethStatus] = useState({});
  const [toothModal, setToothModal] = useState({ open: false, tooth: null, treatment: '', status: '' });
  
  // Medicine/Inventory tracking states
  const [availableInventory, setAvailableInventory] = useState([]);
  const [usedMedicines, setUsedMedicines] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Load available inventory items
  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await dentalMedicinesAPI.getAll();
      // All items are already filtered for dental use
      console.log('Loaded inventory:', response.data);
      setAvailableInventory(response.data || []);
    } catch (error) {
      console.error('Error loading dental medicines:', error);
    } finally {
      setLoadingInventory(false);
    }
  };

  // Add medicine to used list
  const addUsedMedicine = () => {
    setUsedMedicines([...usedMedicines, { 
      id: '', 
      name: '', 
      quantity: 1, 
      unit: '', 
      notes: '' 
    }]);
  };

  // Remove medicine from used list
  const removeUsedMedicine = (index) => {
    setUsedMedicines(usedMedicines.filter((_, i) => i !== index));
  };

  // Update used medicine data
  const updateUsedMedicine = (index, field, value) => {
    console.log(`Updating medicine at index ${index}, field: ${field}, value:`, value);
    const updated = usedMedicines.map((medicine, i) => 
      i === index ? { ...medicine, [field]: value } : medicine
    );
    console.log('Updated medicines array:', updated);
    console.log('Updated medicine at index:', updated[index]);
    setUsedMedicines(updated);
  };

  useEffect(() => {
    // Load inventory when component mounts
    loadInventory();
  }, []);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!appointmentId && !patientIdProp) return;

      setLoading(true);
      try {
        // Check if dental form already exists for this appointment
        if (appointmentId) {
          try {
            const existingFormResponse = await dentalFormAPI.getByAppointment(appointmentId);
            if (existingFormResponse.data && existingFormResponse.data.id) {
              setFeedbackMessage('A dental form already exists for this appointment. You cannot create another one.');
              setFeedbackOpen(true);
              return;
            }
          } catch (error) {
            // Form doesn't exist, continue with normal flow
            console.log('No existing dental form found, proceeding to create new one');
          }
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
          console.error('No access token found. Please log in.');
          alert('Please log in to access the dental form.');
          window.location.href = '/login';
          return;
        }

        // Try using the dentalFormAPI first
        let response;
        try {
          response = await dentalFormAPI.getData(appointmentId);
        } catch (apiError) {
          console.warn('API call failed, trying direct Django API:', apiError);
          // Fallback to direct Django API call
          response = await djangoApiClient.get(`/dental-forms/get_patient_data/?appointment_id=${appointmentId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        }

        const data = response.data;

        setFormData(prev => ({
          ...prev,
          fileNo: data.file_no || '',
          surname: data.surname || '',
          firstName: data.first_name || '',
          middleName: data.middle_name || '',
          age: data.age ? data.age.toString() : '',
          // Convert gender to sex field, mapping 'Other' to 'Male' as fallback
          sex: data.gender === 'Other' ? 'Male' : (data.gender || 'Male'),
          examinedBy: data.examined_by || '', // Auto-populated from staff details
          examinerPosition: data.examiner_position || '',
          examinerLicense: data.examiner_license || '',
          examinerPtr: data.examiner_ptr || '',
          examinerPhone: data.examiner_phone || '',
          date: data.date || '', // Auto-populated with current date
        }));
        
        if (data.patient_id) {
          setPatientId(data.patient_id);
        }

      } catch (error) {
        console.error('Error fetching initial data for Dental Form:', error);
        if (error.response?.status === 401) {
          console.error('Authentication failed. Please log in again.');
          alert('Authentication failed. Please log in again.');
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          // Redirect to login if authentication fails
          window.location.href = '/login';
        } else if (error.response?.status === 404) {
          console.error('Appointment not found or no patient data available.');
          alert('Appointment not found or no patient data available.');
        } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
          console.error('Network error. Please check your connection.');
          alert('Network error. Please check your connection and try again.');
        } else {
          console.error('Error fetching patient data:', error.message);
          alert('Error fetching patient data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId || patientIdProp) {
      fetchPatientData();
    }
  }, [appointmentId, patientIdProp]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setFeedbackMessage('Please log in to submit the form.');
        setFeedbackOpen(true);
        window.location.href = '/login';
        return;
      }

      // Format date to YYYY-MM-DD
      let formattedDate = formData.date;
      if (formattedDate && formattedDate.includes('/')) {
        // Convert from DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = formattedDate.split('/');
        formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      const dentalFormData = {
        file_no: formData.fileNo,
        surname: formData.surname,
        first_name: formData.firstName,
        middle_name: formData.middleName,
        age: parseInt(formData.age) || 0, // Convert age to integer
        sex: formData.sex,
        has_toothbrush: formData.hasToothbrush,
        dentition: formData.dentition,
        periodontal: formData.periodontal,
        occlusion: formData.occlusion,
        malocclusion_severity: formData.malocclusionSeverity,
        decayed_teeth: formData.decayedTeeth,
        missing_teeth: formData.missingTeeth,
        filled_teeth: formData.filledTeeth,
        oral_hygiene: formData.oralHygiene,
        recommended_treatments: formData.recommendedTreatments,
        prevention_advice: formData.preventionAdvice,
        next_appointment: formData.nextAppointment,
        treatment_priority: formData.treatmentPriority,
        remarks: formData.remarks,
        examined_by: formData.examinedBy,
        date: formattedDate,
        patient: patientId,
        appointment: appointmentId,
        permanent_teeth_status: permanentTeethStatus,
        temporary_teeth_status: temporaryTeethStatus,
        used_medicines: usedMedicines,
        // Add next appointment data if provided
        next_appointment_date: formData.nextAppointmentDate || null,
        next_appointment_time: formData.nextAppointmentTime || '10:00:00',
      };

      // Use the new submit and complete endpoint
      const response = await dentalFormAPI.submitAndComplete(dentalFormData);
      
      if (response.status === 201 || response.status === 200) {
        
        const responseData = response.data;
        let message = 'Dental form saved successfully!';
        
        if (responseData.appointment_completed) {
          message += ' The appointment has been automatically marked as completed.';
        }
        
        if (responseData.next_appointment_created) {
          message += ` Next appointment has been scheduled for ${responseData.next_appointment_date}.`;
        }
        
        setFeedbackMessage(message);
        setFeedbackOpen(true);
        
        // Optionally redirect back to appointments page after successful submission
        setTimeout(() => {
          window.history.back();
        }, 3000); // Increased timeout to allow reading the message
      } else {
        setFeedbackMessage('Error saving dental form. Please try again.');
        setFeedbackOpen(true);
      }
    } catch (error) {
      // Log the actual backend error message
      console.error('Error submitting form:', error, error.response?.data);
      
      let errorMsg = 'Invalid form data. Please check your inputs.';
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data) {
        errorMsg = JSON.stringify(error.response.data);
      }
      
      setFeedbackMessage(`Form submission error: ${errorMsg}`);
      setFeedbackOpen(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleToothClick = (toothNumber) => {
    setSelectedTooth(toothNumber);
    // Determine if it's permanent or temporary based on the numbering system
    const isPermanent = toothNumber >= 11; // Simple logic: teeth 11+ are permanent, 1-10 are temporary
    const toothData = isPermanent ? permanentTeethStatus[toothNumber] : temporaryTeethStatus[toothNumber];
    setToothModal({
      open: true,
      tooth: toothNumber,
      treatment: toothData?.treatment || '',
      status: toothData?.status || '',
    });
  };

  const handleToothModalSave = () => {
    const { tooth, treatment, status } = toothModal;
    const isPermanent = tooth >= 11; // Simple logic: teeth 11+ are permanent, 1-10 are temporary
    if (isPermanent) {
      setPermanentTeethStatus(prev => ({ ...prev, [tooth]: { treatment, status } }));
    } else {
      setTemporaryTeethStatus(prev => ({ ...prev, [tooth]: { treatment, status } }));
    }
    setToothModal({ open: false, tooth: null, treatment: '', status: '' });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <FeedbackModal open={feedbackOpen} message={feedbackMessage} onClose={() => setFeedbackOpen(false)} />
      {toothModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] max-w-[90vw] relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => setToothModal({ open: false, tooth: null, treatment: '', status: '' })}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Tooth {toothModal.tooth}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Treatment</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={toothModal.treatment}
                onChange={e => setToothModal(modal => ({ ...modal, treatment: e.target.value }))}
                placeholder="Enter treatment"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={toothModal.status}
                onChange={e => setToothModal(modal => ({ ...modal, status: e.target.value }))}
              >
                <option value="">Select status</option>
                {TOOTH_STATUS_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg" onClick={handleToothModalSave}>
              Save
            </button>
          </div>
        </div>
      )}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dental Examination Form</h1>
        <p className="text-gray-600">Complete the dental examination details below</p>
        {loading && (
          <div className="mt-4">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading patient data...
            </div>
          </div>
        )}
      </div>
      
      <form className="space-y-8" onSubmit={handleSubmit}>
        <FormSection title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              label="File No." 
              name="fileNo" 
              value={formData.fileNo} 
              onChange={handleInputChange}
              placeholder="Enter file number"
            />
            <div></div> {/* Empty div for spacing */}
                </div>
          
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField 
              label="Surname" 
              name="surname" 
              value={formData.surname} 
              onChange={handleInputChange}
              placeholder="Enter surname"
            />
            <InputField 
              label="First Name" 
              name="firstName" 
              value={formData.firstName} 
              onChange={handleInputChange}
              placeholder="Enter first name"
            />
            <InputField 
              label="Middle Name" 
              name="middleName" 
              value={formData.middleName} 
              onChange={handleInputChange}
              placeholder="Enter middle name"
            />
                </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <InputField 
                label="Age" 
                name="age" 
                type="number"
                value={formData.age} 
                onChange={handleInputChange}
                placeholder="Auto-populated from patient data"
                disabled={true}
              />
              <p className="text-sm text-gray-500">
                Automatically filled from patient data
              </p>
            </div>
            <div className="space-y-2">
              <RadioGroup title="Sex" name="sex" options={['Male', 'Female']} value={formData.sex} onChange={handleInputChange} disabled={true} />
              <p className="text-sm text-gray-500">
                Automatically filled from patient data
              </p>
            </div>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RadioGroup title="Have Own Toothbrush?" name="hasToothbrush" options={['Yes', 'No']} value={formData.hasToothbrush} onChange={handleInputChange} />
            </div>
        </FormSection>

        <FormSection title="Dental Chart - Click on tooth numbers to add treatment and status">
          <div style={{ minHeight: '800px' }}>
            <DentalChart 
              onToothClick={handleToothClick}
              permanentTeethStatus={permanentTeethStatus}
              temporaryTeethStatus={temporaryTeethStatus}
            />
          </div>
        </FormSection>

        <FormSection title="Summary of Status of Oral Health">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <RadioGroup title="Dentition:" name="dentition" options={['Satisfactory', 'Fair', 'Poor']} value={formData.dentition} onChange={handleInputChange} />
                <RadioGroup title="Periodontal:" name="periodontal" options={['Satisfactory', 'Fair', 'Poor']} value={formData.periodontal} onChange={handleInputChange} />
                <RadioGroup title="Occlusion:" name="occlusion" options={['Normal', 'Malocclusion']} value={formData.occlusion} onChange={handleInputChange} />
                <RadioGroup title="Malocclusion Severity:" name="malocclusionSeverity" options={['Mild', 'Moderate', 'Severe']} value={formData.malocclusionSeverity} onChange={handleInputChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-8">
                <InputField 
                  label="Decayed Teeth Count" 
                  name="decayedTeeth" 
                  type="number"
                  value={formData.decayedTeeth || ''} 
                  onChange={handleInputChange}
                  placeholder="Number of decayed teeth"
                />
                <InputField 
                  label="Missing Teeth Count" 
                  name="missingTeeth" 
                  type="number"
                  value={formData.missingTeeth || ''} 
                  onChange={handleInputChange}
                  placeholder="Number of missing teeth"
                />
                <InputField 
                  label="Filled Teeth Count" 
                  name="filledTeeth" 
                  type="number"
                  value={formData.filledTeeth || ''} 
                  onChange={handleInputChange}
                  placeholder="Number of filled teeth"
                />
                <RadioGroup title="Oral Hygiene:" name="oralHygiene" options={['Good', 'Fair', 'Poor']} value={formData.oralHygiene || ''} onChange={handleInputChange} />
            </div>
          
          <TextAreaField 
            label="Remarks" 
            name="remarks" 
            value={formData.remarks} 
            onChange={handleInputChange}
            placeholder="Enter any additional remarks or observations..."
          />
        </FormSection>
        
        <FormSection title="Treatment Recommendations">
          <div className="grid grid-cols-1 gap-6">
            <TextAreaField 
              label="Recommended Treatments" 
              name="recommendedTreatments" 
              value={formData.recommendedTreatments || ''} 
              onChange={handleInputChange}
              placeholder="List recommended treatments and procedures..."
              rows={3}
            />
            <TextAreaField 
              label="Prevention Advice" 
              name="preventionAdvice" 
              value={formData.preventionAdvice || ''} 
              onChange={handleInputChange}
              placeholder="Oral hygiene instructions and prevention advice..."
              rows={3}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <InputField 
                  label="Next Appointment Date (Optional)" 
                  name="nextAppointmentDate" 
                  type="date"
                  value={formData.nextAppointmentDate || ''} 
                  onChange={handleInputChange}
                  placeholder=""
                />
                <p className="text-sm text-gray-500">
                  If specified, a new confirmed appointment will be automatically created
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Next Appointment Time (Optional)
                </label>
                <input
                  type="time"
                  name="nextAppointmentTime"
                  value={formData.nextAppointmentTime || '10:00'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500">
                  Time for the next appointment (defaults to 10:00 AM)
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="Next Appointment (Text Notes)" 
                name="nextAppointment" 
                value={formData.nextAppointment || ''} 
                onChange={handleInputChange}
                placeholder="Additional notes about next appointment..."
              />
              <RadioGroup 
                title="Treatment Priority:" 
                name="treatmentPriority" 
                options={['Urgent', 'High', 'Medium', 'Low']} 
                value={formData.treatmentPriority || ''} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
        </FormSection>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Examiner Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <InputField 
                label="Examined By (Full Name)" 
                name="examinedBy" 
                value={formData.examinedBy} 
                onChange={handleInputChange}
                placeholder="Auto-populated from staff details"
                disabled={true}  // Auto-populated from staff details
              />
              <p className="text-sm text-gray-500">
                Automatically filled from staff details
              </p>
            </div>
            <div className="space-y-2">
              <InputField 
                label="Position" 
                name="examinerPosition" 
                value={formData.examinerPosition} 
                onChange={handleInputChange}
                placeholder="Auto-populated from staff details"
                disabled={true}  // Auto-populated from staff details
              />
              <p className="text-sm text-gray-500">
                Staff position from staff details
              </p>
            </div>
            <div className="space-y-2">
              <InputField 
                label="License Number" 
                name="examinerLicense" 
                value={formData.examinerLicense} 
                onChange={handleInputChange}
                placeholder="Auto-populated from staff details"
                disabled={true}  // Auto-populated from staff details
              />
              <p className="text-sm text-gray-500">
                Professional license number
              </p>
            </div>
            <div className="space-y-2">
              <InputField 
                label="PTR Number" 
                name="examinerPtr" 
                value={formData.examinerPtr} 
                onChange={handleInputChange}
                placeholder="Auto-populated from staff details"
                disabled={true}  // Auto-populated from staff details
              />
              <p className="text-sm text-gray-500">
                Professional Tax Receipt number
              </p>
            </div>
            <div className="space-y-2">
              <InputField 
                label="Phone Number" 
                name="examinerPhone" 
                value={formData.examinerPhone} 
                onChange={handleInputChange}
                placeholder="Auto-populated from staff details"
                disabled={true}  // Auto-populated from staff details
              />
              <p className="text-sm text-gray-500">
                Contact phone number
              </p>
            </div>
            <div className="space-y-2">
              <InputField 
                label="Date" 
                name="date" 
                type="date"
                value={formData.date} 
                onChange={handleInputChange}
                placeholder=""
                disabled={true}  // Auto-populated with current date
              />
              <p className="text-sm text-gray-500">
                Automatically filled with the current date
              </p>
            </div>
          </div>
        </div>

        <FormSection title="Medicines & Supplies Used">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Track medicines and supplies used during this dental appointment for record keeping.
              </p>
              <button
                type="button"
                onClick={addUsedMedicine}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
              >
                + Add Medicine/Supply
              </button>
            </div>

            {loadingInventory && (
              <div className="text-center py-4">
                <svg className="animate-spin h-8 w-8 mx-auto text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-500 mt-2">Loading inventory...</p>
              </div>
            )}

            {usedMedicines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
                </svg>
                <p>No medicines or supplies added yet</p>
                <p className="text-sm">Click &quot;Add Medicine/Supply&quot; to track usage for record keeping</p>
              </div>
            ) : (
              <div className="space-y-4">
                {usedMedicines.map((medicine, index) => (
                  <div key={`${index}-${medicine.id || 'empty'}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Medicine/Supply *
                        </label>
                        <select
                          key={`medicine-select-${index}-${medicine.id || 'empty'}`}
                          value={medicine.id ? medicine.id.toString() : ''}
                          onChange={(e) => {
                            console.log('Selection changed:', e.target.value);
                            console.log('Current medicine before update:', medicine);
                            const selectedItem = availableInventory.find(item => item.id.toString() === e.target.value);
                            console.log('Selected item:', selectedItem);
                            
                            // Update all fields in a single call to avoid batching issues
                            const updated = usedMedicines.map((med, i) => 
                              i === index ? { 
                                ...med, 
                                id: e.target.value,
                                name: selectedItem?.name || '',
                                unit: selectedItem?.unit || ''
                              } : med
                            );
                            console.log('Updated medicines array:', updated);
                            setUsedMedicines(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select medicine/supply...</option>
                          {availableInventory.map(item => (
                            <option key={item.id} value={item.id.toString()}>
                              {item.name} ({item.type_display})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity Used *
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={medicine.quantity}
                          onChange={(e) => updateUsedMedicine(index, 'quantity', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                        {medicine.unit && (
                          <p className="text-xs text-gray-500 mt-1">Unit: {medicine.unit}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={medicine.notes}
                          onChange={(e) => updateUsedMedicine(index, 'notes', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Optional notes"
                        />
                      </div>
                      
                      <div>
                        <button
                          type="button"
                          onClick={() => removeUsedMedicine(index)}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {usedMedicines.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Inventory Impact Summary</h4>
                <div className="space-y-1">
                  {usedMedicines.filter(m => m.id && m.quantity).map((medicine, index) => {
                    const inventoryItem = availableInventory.find(item => item.id === parseInt(medicine.id));
                    const remaining = inventoryItem ? inventoryItem.quantity - medicine.quantity : 0;
                    return (
                      <div key={index} className="text-sm text-blue-700">
                        • {medicine.name}: {medicine.quantity} {medicine.unit} used, {remaining} {medicine.unit} remaining
                        {remaining < 5 && remaining >= 0 && (
                          <span className="ml-2 text-red-600 font-medium">⚠️ Low stock!</span>
                        )}
                        {remaining < 0 && (
                          <span className="ml-2 text-red-600 font-medium">❌ Insufficient stock!</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </FormSection>

        <div className="flex justify-end pt-6">
            <button
                type="submit"
            disabled={loading}
            className={`inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-lg text-white transition-all duration-200 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Submit Form'
            )}
            </button>
        </div>
    </form>
    </div>
  );
};

export default DentalForm;