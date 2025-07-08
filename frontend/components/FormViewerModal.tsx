import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { medicalFormAPI, dentalFormAPI } from '../utils/api';

interface FormViewerModalProps {
  open: boolean;
  appointmentId: number | null;
  appointmentType: 'medical' | 'dental';
  patientName: string;
  onClose: () => void;
}

interface FormData {
  id?: number;
  // Common fields
  file_no?: string;
  surname?: string;
  first_name?: string;
  middle_name?: string;
  age?: number;
  sex?: string;
  
  // Medical form specific fields
  blood_pressure?: string;
  temperature?: string;
  pulse_rate?: string;
  respiratory_rate?: string;
  weight?: string;
  height?: string;
  chief_complaint?: string;
  present_illness?: string;
  past_medical_history?: string;
  family_history?: string;
  allergies?: string;
  medications?: string;
  diagnosis?: string;
  treatment_plan?: string;
  recommendations?: string;
  examined_by?: string;
  date?: string;
  
  // Dental form specific fields
  chief_concern?: string;
  history_of_present_illness?: string;
  oral_hygiene_habits?: string;
  fluoride_exposure?: string;
  medical_history?: string;
  extraoral_examination?: string;
  intraoral_examination?: string;
  occlusion?: string;
  periodontal_screening?: string;
  oral_pathology?: string;
  diagnosis_dental?: string;
  treatment_plan_dental?: string;
  dentist_name?: string;
  dentist_license?: string;
  
  created_at?: string;
  updated_at?: string;
}

const FormViewerModal: React.FC<FormViewerModalProps> = ({
  open,
  appointmentId,
  appointmentType,
  patientName,
  onClose
}) => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && appointmentId) {
      fetchFormData();
    }
  }, [open, appointmentId, appointmentType]);

  const fetchFormData = async () => {
    setLoading(true);
    setError('');
    setFormData(null);

    try {
      let response;
      if (appointmentType === 'medical') {
        response = await medicalFormAPI.checkFormExists(appointmentId!);
      } else {
        response = await dentalFormAPI.checkFormExists(appointmentId!);
      }

      if (response.data && response.data.length > 0) {
        setFormData(response.data[0]);
      } else {
        setError('No form data found for this appointment.');
      }
    } catch (err: any) {
      setError('Failed to fetch form data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const renderMedicalForm = () => {
    if (!formData) return null;

    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">File No.</label>
              <p className="text-sm text-gray-900">{formData.file_no || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="text-sm text-gray-900">
                {`${formData.first_name || ''} ${formData.middle_name || ''} ${formData.surname || ''}`.trim() || 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Age/Sex</label>
              <p className="text-sm text-gray-900">{formData.age || 'N/A'} / {formData.sex || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Vital Signs</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Blood Pressure</label>
              <p className="text-sm text-gray-900">{formData.blood_pressure || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Temperature</label>
              <p className="text-sm text-gray-900">{formData.temperature || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Pulse Rate</label>
              <p className="text-sm text-gray-900">{formData.pulse_rate || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Respiratory Rate</label>
              <p className="text-sm text-gray-900">{formData.respiratory_rate || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Weight</label>
              <p className="text-sm text-gray-900">{formData.weight || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Height</label>
              <p className="text-sm text-gray-900">{formData.height || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Chief Complaint & History */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chief Complaint</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.chief_complaint || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">History of Present Illness</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.present_illness || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Past Medical History</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.past_medical_history || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Family History</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.family_history || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.allergies || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.medications || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Diagnosis & Treatment */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.diagnosis || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Plan</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.treatment_plan || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recommendations</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.recommendations || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Examiner Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Examiner Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Examined By</label>
              <p className="text-sm text-gray-900">{formData.examined_by || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Examination</label>
              <p className="text-sm text-gray-900">
                {formData.date ? new Date(formData.date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDentalForm = () => {
    if (!formData) return null;

    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">File No.</label>
              <p className="text-sm text-gray-900">{formData.file_no || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <p className="text-sm text-gray-900">
                {`${formData.first_name || ''} ${formData.middle_name || ''} ${formData.surname || ''}`.trim() || 'N/A'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Age/Sex</label>
              <p className="text-sm text-gray-900">{formData.age || 'N/A'} / {formData.sex || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Chief Concern & History */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Chief Concern</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.chief_concern || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">History of Present Illness</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.history_of_present_illness || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Medical History</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.medical_history || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Oral Hygiene Habits</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.oral_hygiene_habits || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fluoride Exposure</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.fluoride_exposure || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Examination Findings */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Extraoral Examination</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.extraoral_examination || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Intraoral Examination</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.intraoral_examination || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Occlusion</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.occlusion || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Periodontal Screening</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.periodontal_screening || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Oral Pathology</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.oral_pathology || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Diagnosis & Treatment */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.diagnosis_dental || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Plan</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.treatment_plan_dental || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Dentist Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Dentist Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Dentist Name</label>
              <p className="text-sm text-gray-900">{formData.dentist_name || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">License Number</label>
              <p className="text-sm text-gray-900">{formData.dentist_license || 'N/A'}</p>
            </div>
          </div>
        </div>
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
        <div className="bg-[#800000] text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {appointmentType === 'medical' ? 'Medical' : 'Dental'} Form Data - {patientName}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-160px)] overflow-y-auto p-6">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="text-lg text-gray-600">Loading form data...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!loading && !error && formData && (
            <>
              {appointmentType === 'medical' ? renderMedicalForm() : renderDentalForm()}
            </>
          )}

          {!loading && !error && !formData && (
            <div className="text-center py-8">
              <p className="text-gray-500">No form data found for this appointment.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {formData && formData.created_at && (
              <>Form submitted: {new Date(formData.created_at).toLocaleDateString()}</>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormViewerModal;
