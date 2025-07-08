import React, { useState, useEffect } from 'react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { djangoApiClient } from '../utils/api';

interface Patient {
  id?: number;
  user?: number;
  student_id: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  suffix?: string;
  photo?: string;
  gender: string;
  date_of_birth?: string;
  age?: number;
  department?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  city_municipality?: string;
  barangay?: string;
  street?: string;
  blood_type?: string;
  religion?: string;
  nationality?: string;
  civil_status?: string;
  emergency_contact_surname?: string;
  emergency_contact_first_name?: string;
  emergency_contact_middle_name?: string;
  emergency_contact_number?: string;
  emergency_contact_relationship?: string;
  emergency_contact_address?: string;
  emergency_contact_barangay?: string;
  emergency_contact_street?: string;
  comorbid_illnesses?: (string | object)[] | null;
  maintenance_medications?: (string | { drug?: string; name?: string; dose?: string; dosage?: string; frequency?: string })[] | null;
  vaccination_history?: { [key: string]: string } | null;
  past_medical_history?: (string | object)[] | null;
  hospital_admission_or_surgery?: boolean;
  family_medical_history?: (string | object)[] | null;
  allergies?: string;
  created_at?: string;
  updated_at?: string;
}

interface PatientProfileEditorProps {
  open: boolean;
  patient: Patient | null;
  onClose: () => void;
  onSave: (patient: Patient) => void;
  onDelete?: (patientId: number) => void;
  mode: 'view' | 'edit' | 'create';
  isAdmin?: boolean;
}

const PatientProfileEditor: React.FC<PatientProfileEditorProps> = ({ 
  open, 
  patient, 
  onClose, 
  onSave, 
  onDelete, 
  mode, 
  isAdmin = false 
}) => {  const [formData, setFormData] = useState<any>({
    student_id: '',
    name: '',
    gender: 'Other',
    age: 0,
    department: '',
    contact_number: '',
    email: '',
    address: '',
    city_municipality: '',
    barangay: '',
    street: '',
    blood_type: '',
    religion: '',
    nationality: '',
    civil_status: '',
    first_name: '',
    middle_name: '',
    suffix: '',
    date_of_birth: '',
    emergency_contact_surname: '',
    emergency_contact_first_name: '',
    emergency_contact_middle_name: '',
    emergency_contact_number: '',
    emergency_contact_relationship: '',
    emergency_contact_address: '',
    emergency_contact_barangay: '',
    emergency_contact_street: '',
    comorbid_illnesses: [],
    maintenance_medications: [],
    vaccination_history: {},
    past_medical_history: [],
    hospital_admission_or_surgery: false,
    family_medical_history: [],
    allergies: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  useEffect(() => {
    if (patient) {
      setFormData({ ...patient });
    } else if (mode === 'create') {
      // Reset to defaults for creation
      setFormData({
        student_id: '',
        name: '',
        gender: 'Other',
        age: 0,
        department: '',
        contact_number: '',
        email: '',
      });
    }
  }, [patient, mode]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleArrayInputChange = (field: string, value: string) => {
    const items = value.split('\n').filter(item => item.trim() !== '');
    handleInputChange(field, items);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      let response;
      if (mode === 'create') {
        response = await djangoApiClient.post('/patients/', formData);
      } else {
        response = await djangoApiClient.put(`/patients/${patient?.id}/`, formData);
      }
      
      onSave(response.data);
      onClose();
    } catch (error: any) {
      if (error.response?.data) {
        setErrors(error.response.data);
      } else {
        setErrors({ general: 'An error occurred while saving.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!patient?.id || !onDelete) return;
    
    if (window.confirm('Are you sure you want to delete this patient profile?')) {
      try {
        await djangoApiClient.delete(`/patients/${patient.id}/`);
        onDelete(patient.id);
        onClose();
      } catch (error) {
        alert('Error deleting patient profile.');
      }
    }
  };

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const FormField = ({ 
    label, 
    field, 
    type = 'text', 
    options = [], 
    required = false,
    disabled = false 
  }: {
    label: string;
    field: string;
    type?: string;
    options?: string[];
    required?: boolean;
    disabled?: boolean;
  }) => (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'select' ? (
        <select
          value={formData[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          disabled={disabled || mode === 'view'}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        >
          <option value="">Select {label}</option>
          {options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={formData[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          disabled={disabled || mode === 'view'}
          rows={3}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      ) : type === 'checkbox' ? (
        <input
          type="checkbox"
          checked={formData[field] || false}
          onChange={(e) => handleInputChange(field, e.target.checked)}
          disabled={disabled || mode === 'view'}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:bg-gray-100"
        />
      ) : (
        <input
          type={type}
          value={formData[field] || ''}
          onChange={(e) => handleInputChange(field, e.target.value)}
          disabled={disabled || mode === 'view'}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
      )}
      {errors[field] && (
        <p className="text-red-500 text-sm">{errors[field]}</p>
      )}
    </div>
  );
  const ArrayField = ({ label, field }: { label: string; field: string }) => {
    // Convert array data to display format
    const arrayToString = (arr: any[]) => {
      if (!arr || !Array.isArray(arr)) return '';
      return arr.map((item) => {
        if (typeof item === 'string') {
          return item;
        } else if (typeof item === 'object' && item !== null) {
          // Handle object formats - try common property names
          if (field === 'maintenance_medications') {
            return `${item.drug || item.name || 'Unknown'} - ${item.dose || item.dosage || 'N/A'} - ${item.frequency || 'N/A'}`;
          } else {
            return item.name || item.condition || item.illness || item.history || JSON.stringify(item);
          }
        }
        return String(item);
      }).join('\n');
    };

    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700 block">{label}</label>
        <textarea
          value={arrayToString(formData[field]) || ''}
          onChange={(e) => handleArrayInputChange(field, e.target.value)}
          disabled={mode === 'view'}
          rows={3}
          placeholder="Enter each item on a new line"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
        />
        {errors[field] && (
          <p className="text-red-500 text-sm">{errors[field]}</p>
        )}
      </div>
    );
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden m-4">
        {/* Header */}
        <div className="bg-[#800000] text-white p-6 flex items-center justify-between">          <h2 className="text-2xl font-bold">
            {mode === 'create' ? 'Create Patient Profile' : 
             mode === 'edit' ? 'Edit Patient Profile' : 
             'Patient Profile'}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {errors.general && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {errors.general}
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="col-span-full text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
              
              <FormField label="Student ID" field="student_id" required />
              <FormField label="Full Name" field="name" required />
              <FormField label="First Name" field="first_name" />
              <FormField label="Middle Name" field="middle_name" />
              <FormField label="Suffix" field="suffix" />
              <FormField 
                label="Gender" 
                field="gender" 
                type="select" 
                options={['Male', 'Female', 'Other']} 
                required 
              />
              <FormField label="Date of Birth" field="date_of_birth" type="date" />
              <FormField label="Age" field="age" type="number" />
              <FormField label="Department" field="department" />
              <FormField label="Contact Number" field="contact_number" />
              <FormField label="Email" field="email" type="email" />
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="City/Municipality" field="city_municipality" required />
                <FormField label="Barangay" field="barangay" required />
                <FormField label="Street" field="street" required />
              </div>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="col-span-full text-lg font-semibold text-gray-900 border-b pb-2">Personal Details</h3>
              
              <FormField 
                label="Blood Type" 
                field="blood_type" 
                type="select" 
                options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']} 
              />
              <FormField 
                label="Religion" 
                field="religion" 
                type="select" 
                options={['Roman Catholic', 'Seventh-day Adventist', 'Islam', 'Protestant', 'Iglesia ni Cristo', 'Other']} 
              />
              <FormField 
                label="Nationality" 
                field="nationality" 
                type="select" 
                options={['Filipino', 'Foreigner', 'Other']} 
              />
              <FormField 
                label="Civil Status" 
                field="civil_status" 
                type="select" 
                options={['single', 'married', 'widowed', 'separated', 'other']} 
              />
            </div>

            {/* Emergency Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="col-span-full text-lg font-semibold text-gray-900 border-b pb-2">Emergency Contact (within Zamboanga City)</h3>
              
              <FormField label="Surname" field="emergency_contact_surname" />
              <FormField label="First Name" field="emergency_contact_first_name" />
              <FormField label="Middle Name" field="emergency_contact_middle_name" />
              <FormField label="Contact Number" field="emergency_contact_number" />
              <FormField label="Relationship" field="emergency_contact_relationship" />
              <FormField label="Barangay" field="emergency_contact_barangay" required />
              <FormField label="Street" field="emergency_contact_street" required />
            </div>

            {/* Health Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Health Information</h3>
              
              <ArrayField label="Comorbid Illnesses" field="comorbid_illnesses" />
              <ArrayField label="Maintenance Medications" field="maintenance_medications" />
              
              <ArrayField label="Past Medical/Surgical History" field="past_medical_history" />
              
              <FormField 
                label="Hospital Admission or Surgery" 
                field="hospital_admission_or_surgery" 
                type="checkbox" 
              />
              
              <ArrayField label="Family Medical History" field="family_medical_history" />
              <FormField label="Allergies" field="allergies" type="textarea" />
            </div>
          </form>
        </div>

        {/* Footer */}
        {mode !== 'view' && (
          <div className="bg-gray-50 px-6 py-4 flex justify-between">
            <div>
              {mode === 'edit' && isAdmin && onDelete && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-red-700 bg-white hover:bg-red-50 rounded-md"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Profile
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md"
              >
                Cancel
              </button>              <button
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:opacity-50"
              >
                💾 {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientProfileEditor;
