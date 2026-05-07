import React, { useState, useEffect } from 'react';
import DentalChartDisplay from './DentalChartDisplay';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { medicalFormAPI, dentalFormAPI } from '../utils/api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { generateSingleFormPDF } from '../utils/reportExport';

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
  
  // Comprehensive dental fields from DentalFormData model
  has_toothbrush?: string;
  dentition?: string;
  periodontal?: string;
  malocclusion_severity?: string;
  decayed_teeth?: string;
  missing_teeth?: string;
  filled_teeth?: string;
  oral_hygiene?: string;
  recommended_treatments?: string;
  prevention_advice?: string;
  next_appointment?: string;
  treatment_priority?: string;
  remarks?: string;
  examiner_position?: string;
  examiner_license?: string;
  examiner_ptr?: string;
  examiner_phone?: string;
  permanent_teeth_status?: any;
  temporary_teeth_status?: any;
  used_medicines?: any;
  
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

  const handleExportPDF = async () => {
    if (!formData) return;
    
    let teethChartImage = undefined;
    if (appointmentType === 'dental') {
      const chartElement = document.getElementById('dental-chart-to-export');
      if (chartElement) {
        try {
          // Wait a bit to ensure it's rendered
          const canvas = await html2canvas(chartElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false
          });
          teethChartImage = canvas.toDataURL('image/png');
        } catch (err) {
          console.error('Failed to capture dental chart:', err);
        }
      }
    }
    
    generateSingleFormPDF(formData, appointmentType, patientName, teethChartImage);
  };

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
            <div>
              <label className="block text-sm font-medium text-gray-700">Has Toothbrush</label>
              <p className="text-sm text-gray-900">{formData.has_toothbrush || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Dental Assessment */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Dental Assessment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Dentition</label>
              <p className="text-sm text-gray-900">{formData.dentition || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Periodontal</label>
              <p className="text-sm text-gray-900">{formData.periodontal || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Occlusion</label>
              <p className="text-sm text-gray-900">{formData.occlusion || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Malocclusion Severity</label>
              <p className="text-sm text-gray-900">{formData.malocclusion_severity || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Teeth Layout Visualization */}
        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm" id="dental-chart-to-export">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Teeth Layout Visualization</h3>
          <DentalChartDisplay 
            permanentTeethStatus={formData.permanent_teeth_status}
            temporaryTeethStatus={formData.temporary_teeth_status}
          />
        </div>

        {/* Dental Findings */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Dental Findings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Decayed Teeth</label>
              <p className="text-sm text-gray-900">{formData.decayed_teeth || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Missing Teeth</label>
              <p className="text-sm text-gray-900">{formData.missing_teeth || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Filled Teeth</label>
              <p className="text-sm text-gray-900">{formData.filled_teeth || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Oral Hygiene</label>
              <p className="text-sm text-gray-900">{formData.oral_hygiene || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Teeth Status - User-Friendly Display */}
        {(formData.permanent_teeth_status || formData.temporary_teeth_status) && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Teeth Status</h3>
            <div className="space-y-4">
              {formData.permanent_teeth_status && Object.keys(formData.permanent_teeth_status).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Permanent Teeth</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(formData.permanent_teeth_status).map(([toothNum, data]: [string, any]) => (
                      <div key={toothNum} className="bg-white p-3 border border-gray-300 rounded-md">
                        <div className="font-semibold text-sm text-gray-900">Tooth {toothNum}</div>
                        {data.treatment && (
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Treatment:</span> {data.treatment}
                          </div>
                        )}
                        {data.status && (
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Status:</span> {data.status}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {formData.temporary_teeth_status && Object.keys(formData.temporary_teeth_status).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Temporary Teeth</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(formData.temporary_teeth_status).map(([toothNum, data]: [string, any]) => (
                      <div key={toothNum} className="bg-white p-3 border border-gray-300 rounded-md">
                        <div className="font-semibold text-sm text-gray-900">Tooth {toothNum}</div>
                        {data.treatment && (
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Treatment:</span> {data.treatment}
                          </div>
                        )}
                        {data.status && (
                          <div className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Status:</span> {data.status}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Medicine Used Section */}
        {formData.used_medicines && (
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Medicine Used</h3>
            <div className="space-y-3">
              {Array.isArray(formData.used_medicines) && formData.used_medicines.length > 0 ? (
                formData.used_medicines.map((medicine: any, index: number) => (
                  <div key={index} className="bg-white p-3 border border-gray-300 rounded-md">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div>
                        <span className="font-medium text-sm text-gray-700">Medicine:</span>
                        <p className="text-sm text-gray-900">{medicine.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-700">Quantity:</span>
                        <p className="text-sm text-gray-900">{medicine.quantity || medicine.quantity_used || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-700">Unit:</span>
                        <p className="text-sm text-gray-900">{medicine.unit || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-sm text-gray-700">Notes:</span>
                        <p className="text-sm text-gray-900">{medicine.notes || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-white p-3 border border-gray-300 rounded-md">
                  <p className="text-sm text-gray-600">No medicines recorded</p>
                </div>
              )}
            </div>
          </div>
        )}

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

        {/* Treatment and Recommendations */}
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recommended Treatments</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.recommended_treatments || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Prevention Advice</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.prevention_advice || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Priority</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.treatment_priority || 'N/A'}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Next Appointment</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.next_appointment || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Additional Remarks */}
        {formData.remarks && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Remarks</label>
            <div className="bg-white p-3 border border-gray-300 rounded-md">
              <p className="text-sm text-gray-900">{formData.remarks}</p>
            </div>
          </div>
        )}

        {/* Comprehensive Examiner Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Examiner Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Examined By</label>
              <p className="text-sm text-gray-900">{formData.examined_by || formData.dentist_name || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Examination</label>
              <p className="text-sm text-gray-900">
                {formData.date ? new Date(formData.date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            {formData.examiner_position && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Position</label>
                <p className="text-sm text-gray-900">{formData.examiner_position}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">License Number</label>
              <p className="text-sm text-gray-900">{formData.examiner_license || formData.dentist_license || 'N/A'}</p>
            </div>
            {formData.examiner_ptr && (
              <div>
                <label className="block text-sm font-medium text-gray-700">PTR Number</label>
                <p className="text-sm text-gray-900">{formData.examiner_ptr}</p>
              </div>
            )}
            {formData.examiner_phone && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                <p className="text-sm text-gray-900">{formData.examiner_phone}</p>
              </div>
            )}
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

        {/* Print Header (Only visible when printing) */}
        <div className="hidden print-only-header mb-8 border-b-2 border-black pb-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <img src="/WMSU-Logo.jpg" alt="WMSU Logo" className="w-16 h-16 object-contain" />
              <div className="text-left">
                <h1 className="text-lg font-bold text-[#800000] leading-tight">WESTERN MINDANAO STATE UNIVERSITY</h1>
                <p className="text-sm text-gray-700 font-medium leading-tight">UNIVERSITY HEALTH SERVICES CENTER</p>
                <p className="text-xs text-gray-500">Zamboanga City, Philippines</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-[10px] text-gray-500 italic">&quot;Excellence in Health Service&quot;</p>
                <p className="text-xs text-[#800000] font-bold">{appointmentType.toUpperCase()} CONSULTATION</p>
              </div>
              <img src="/WMSU-HealthLogo.png" alt="Health Logo" className="w-14 h-14 object-contain" />
            </div>
          </div>
          
          <div className="mt-6 flex justify-between items-end border-t border-gray-100 pt-4">
            <div className="text-left">
              <p className="text-sm font-bold uppercase">Patient: <span className="font-normal">{patientName}</span></p>
            </div>
            <div className="text-right text-[10px] text-gray-500">
              <p>Printed: {new Date().toLocaleString()}</p>
              {formData && formData.created_at && (
                <p>Record: {new Date(formData.created_at).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-160px)] overflow-y-auto p-6 print-content">
          {loading && (
            <div className="flex justify-center items-center py-8 no-print">
              <div className="text-lg text-gray-600">Loading form data...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 no-print">
              {error}
            </div>
          )}

          {!loading && !error && formData && (
            <div className="printable-data">
              {appointmentType === 'medical' ? renderMedicalForm() : renderDentalForm()}
            </div>
          )}

          {!loading && !error && !formData && (
            <div className="text-center py-8 no-print">
              <p className="text-gray-500">No form data found for this appointment.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center no-print">
          <div className="text-sm text-gray-500">
            {formData && formData.created_at && (
              <>Form submitted: {new Date(formData.created_at).toLocaleDateString()}</>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors font-medium shadow-sm flex items-center"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export PDF
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-only-header {
              display: block !important;
            }
            body {
              padding: 0 !important;
              background: white !important;
              color: black !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .fixed.inset-0 {
              position: relative !important;
              display: block !important;
              z-index: auto !important;
              background: none !important;
              backdrop-filter: none !important;
            }
            .max-w-4xl {
              max-width: 100% !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
            }
            .max-h-\[90vh\] {
              max-height: none !important;
              overflow: visible !important;
            }
            .print-content {
              max-height: none !important;
              overflow: visible !important;
              padding: 0 !important;
            }
            .bg-gray-50 {
              background-color: transparent !important;
              border-bottom: 1px solid #eee !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
            .bg-white {
              background-color: transparent !important;
            }
            .shadow-lg, .shadow-2xl, .shadow-sm {
              box-shadow: none !important;
            }
            .rounded-lg, .rounded-xl, .rounded-md {
              border-radius: 0 !important;
            }
            h2.text-2xl {
              display: none !important; /* Hide the modal header title */
            }
            .bg-\[\#800000\] {
              display: none !important; /* Hide the colored modal header */
            }
            .border {
              border: 1px solid #eee !important;
            }
            .grid {
              display: grid !important;
            }
            /* Force dental chart to be visible and correctly sized */
            svg {
              max-width: 400px !important;
              margin: 0 auto !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default FormViewerModal;
