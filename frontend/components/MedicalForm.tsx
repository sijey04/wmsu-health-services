import React, { useState, useEffect } from 'react';
import { appointmentsAPI, patientsAPI, medicalFormAPI } from '../utils/api';
import FeedbackModal from './feedbackmodal';

interface MedicalFormProps {
  appointmentId?: string;
  patientId?: string;
}

const MedicalForm: React.FC<MedicalFormProps> = ({ appointmentId, patientId: patientIdProp }) => {
  const [formData, setFormData] = useState({
    // Patient Information
    fileNo: '',
    surname: '',
    firstName: '',
    middleName: '',
    age: '',
    sex: 'Male',
    department: '',
    contact: '',
    
    // Vital Signs
    bloodPressure: '',
    temperature: '',
    pulseRate: '',
    respiratoryRate: '',
    weight: '',
    height: '',
    bmi: '',
    
    // Chief Complaint
    chiefComplaint: '',
    historyOfPresentIllness: '',
    
    // Past Medical History
    pastMedicalHistory: '',
    allergies: '',
    medications: '',
    surgicalHistory: '',
    
    // Family History
    familyHistory: '',
    
    // Social History
    smoking: 'No',
    alcohol: 'No',
    drugs: 'No',
      // Physical Examination
    generalAppearance: '',
    headAndNeck: '',
    cardiovascular: '',
    respiratory: '',
    gastrointestinal: '',
    genitourinary: '',
    neurological: '',
    musculoskeletal: '',
    integumentary: '',
    
    // Assessment and Plan
    assessment: '',
    diagnosis: '',
    treatment: '',
    prescriptions: '',
    recommendations: '',
    
    // Follow-up
    followUpDate: '',
    followUpInstructions: '',
    
    // Examination Details
    examinedBy: '',
    examinerLicense: '',
    dateOfExamination: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState(patientIdProp || '');
  const [feedbackModal, setFeedbackModal] = useState({ open: false, message: '' });

  const formatListValue = (value: any) => {
    if (Array.isArray(value)) {
      return value.filter(Boolean).join(', ');
    }
    return value || '';
  };
  // Calculate BMI when height and weight change
  useEffect(() => {
    const weight = parseFloat(formData.weight);
    const heightInMeters = parseFloat(formData.height) / 100;
    
    if (weight > 0 && heightInMeters > 0) {
      const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
      setFormData(prev => ({ ...prev, bmi }));
    }
  }, [formData.weight, formData.height]);

  // Fetch appointment or patient data on mount
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!appointmentId && !patientIdProp) return;

      setLoading(true);
      try {
        let appointmentData: any = null;
        let autoFillData: any = null;
        let patientData: any = null;

        if (appointmentId) {
          const [appointmentResult, autoFillResult] = await Promise.allSettled([
            appointmentsAPI.getById(appointmentId),
            medicalFormAPI.getData(appointmentId),
          ]);

          if (appointmentResult.status === 'fulfilled') {
            appointmentData = appointmentResult.value.data;
          }

          if (autoFillResult.status === 'fulfilled') {
            autoFillData = autoFillResult.value.data;
          }
        } else if (patientIdProp) {
          const [autoFillResult] = await Promise.allSettled([
            medicalFormAPI.getDataByPatientId(patientIdProp),
          ]);

          if (autoFillResult.status === 'fulfilled') {
            autoFillData = autoFillResult.value.data;
          }
        }

        const resolvedPatientId =
          patientIdProp ||
          autoFillData?.patient_id?.toString() ||
          appointmentData?.patient?.toString() ||
          appointmentData?.patient_id?.toString() ||
          '';

        const shouldFetchPatient = Boolean(resolvedPatientId && !autoFillData);
        if (shouldFetchPatient) {
          try {
            const patientResponse = await patientsAPI.getById(resolvedPatientId);
            patientData = patientResponse.data;
          } catch (patientError) {
            console.warn('Patient profile lookup failed, using appointment autofill data.', patientError);
          }
        }

        if (!appointmentData && !autoFillData && !patientData) {
          setFeedbackModal({
            open: true,
            message: 'Failed to load patient information. Please fill the form manually.'
          });
          return;
        }

        setFormData(prevData => ({
          ...prevData,
          fileNo: autoFillData?.file_no || autoFillData?.student_id || patientData?.student_id || prevData.fileNo,
          surname: autoFillData?.surname || patientData?.surname || patientData?.last_name || patientData?.name?.split(' ').pop() || prevData.surname,
          firstName: autoFillData?.first_name || patientData?.first_name || patientData?.name?.split(' ')[0] || prevData.firstName,
          middleName: autoFillData?.middle_name || patientData?.middle_name || prevData.middleName,
          age: (autoFillData?.age ?? patientData?.age)?.toString() || prevData.age,
          sex: autoFillData?.sex || patientData?.sex || patientData?.gender || prevData.sex || 'Male',
          department: autoFillData?.department || patientData?.department || prevData.department,
          contact: autoFillData?.contact || autoFillData?.contact_number || patientData?.contact_number || patientData?.contact || prevData.contact,
          allergies: formatListValue(autoFillData?.allergies ?? patientData?.allergies) || prevData.allergies,
          pastMedicalHistory: formatListValue(autoFillData?.past_medical_history ?? patientData?.past_medical_history) || prevData.pastMedicalHistory,
          familyHistory: formatListValue(autoFillData?.family_medical_history ?? patientData?.family_medical_history) || prevData.familyHistory,
          medications: formatListValue(autoFillData?.maintenance_medications ?? patientData?.maintenance_medications) || prevData.medications,
          examinedBy: autoFillData?.examined_by || prevData.examinedBy,
          examinerLicense: autoFillData?.examiner_license || autoFillData?.license_number || prevData.examinerLicense,
          dateOfExamination: autoFillData?.date || prevData.dateOfExamination,
          followUpDate: autoFillData?.follow_up_date || prevData.followUpDate,
          chiefComplaint: autoFillData?.chief_complaint || prevData.chiefComplaint || appointmentData?.purpose || appointmentData?.concern || '',
          historyOfPresentIllness: autoFillData?.present_illness || prevData.historyOfPresentIllness || appointmentData?.notes || '',
          // New auto-filled fields
          bloodPressure: autoFillData?.blood_pressure || prevData.bloodPressure,
          temperature: autoFillData?.temperature || prevData.temperature,
          pulseRate: autoFillData?.pulse_rate || prevData.pulseRate,
          respiratoryRate: autoFillData?.respiratory_rate || prevData.respiratoryRate,
          weight: autoFillData?.weight || prevData.weight,
          height: autoFillData?.height || prevData.height,
          generalAppearance: autoFillData?.general_appearance || prevData.generalAppearance,
          headAndNeck: autoFillData?.heent || prevData.headAndNeck,
          cardiovascular: autoFillData?.cardiovascular || prevData.cardiovascular,
          respiratory: autoFillData?.respiratory || prevData.respiratory,
          gastrointestinal: autoFillData?.gastrointestinal || prevData.gastrointestinal,
          genitourinary: autoFillData?.genitourinary || prevData.genitourinary,
          neurological: autoFillData?.neurological || prevData.neurological,
          musculoskeletal: autoFillData?.musculoskeletal || prevData.musculoskeletal,
          integumentary: autoFillData?.integumentary || prevData.integumentary,
          diagnosis: autoFillData?.diagnosis || prevData.diagnosis,
          treatment: autoFillData?.treatment_plan || prevData.treatment,
          recommendations: autoFillData?.recommendations || prevData.recommendations,
          followUpInstructions: autoFillData?.follow_up || autoFillData?.follow_up_instructions || prevData.followUpInstructions,
        }));

        if (resolvedPatientId) {
          setPatientId(resolvedPatientId.toString());
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
        setFeedbackModal({
          open: true,
          message: 'Failed to load patient information. Please fill the form manually.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [appointmentId, patientIdProp]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!patientId) {
      setFeedbackModal({ open: true, message: 'Patient information is required.' });
      return;
    }

    try {
      setLoading(true);
        // Prepare the medical examination data
      const medicalExamData = {
        patient: parseInt(patientId),
        appointment: appointmentId ? parseInt(appointmentId) : null,
        file_no: formData.fileNo,
        surname: formData.surname,
        first_name: formData.firstName,
        middle_name: formData.middleName,
        age: formData.age ? parseInt(formData.age) : null,
        sex: formData.sex,
        blood_pressure: formData.bloodPressure,
        temperature: formData.temperature,
        pulse_rate: formData.pulseRate,
        respiratory_rate: formData.respiratoryRate,
        weight: formData.weight,
        height: formData.height,
        chief_complaint: formData.chiefComplaint,
        present_illness: formData.historyOfPresentIllness,
        past_medical_history: formData.pastMedicalHistory,
        family_history: formData.familyHistory,
        allergies: formData.allergies,
        medications: formData.medications,        general_appearance: formData.generalAppearance,
        heent: formData.headAndNeck,
        cardiovascular: formData.cardiovascular,
        respiratory: formData.respiratory,
        gastrointestinal: formData.gastrointestinal,
        genitourinary: formData.genitourinary || '',
        neurological: formData.neurological,
        musculoskeletal: formData.musculoskeletal,
        integumentary: formData.integumentary,
        diagnosis: formData.diagnosis,
        treatment_plan: formData.treatment,
        recommendations: formData.recommendations,
        follow_up: formData.followUpInstructions || '',
        examined_by: formData.examinedBy,
        examiner_license: formData.examinerLicense || '',
        date: formData.dateOfExamination,
      };

      // Use the medical form API
      const response = await medicalFormAPI.create(medicalExamData);

      setFeedbackModal({ 
        open: true, 
        message: 'Medical examination form submitted successfully!' 
      });
      
      // Update appointment status if appointment ID is provided
      if (appointmentId) {
        await appointmentsAPI.update(appointmentId, { status: 'completed' });
      }

    } catch (error) {
      console.error('Error submitting medical form:', error);
      setFeedbackModal({ 
        open: true, 
        message: 'Failed to submit medical examination form. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <FeedbackModal open={feedbackModal.open} message={feedbackModal.message} onClose={() => setFeedbackModal({ ...feedbackModal, open: false })} />
      
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
              <p className="text-xs text-[#800000] font-bold">MEDICAL CONSULTATION RECORD</p>
            </div>
            <img src="/WMSU-HealthLogo.png" alt="Health Logo" className="w-14 h-14 object-contain" />
          </div>
        </div>
        
        <div className="mt-6 flex justify-between items-end border-t border-gray-100 pt-4">
          <div className="text-left">
            <p className="text-sm font-bold uppercase">Patient: <span className="font-normal">{formData.firstName} {formData.middleName} {formData.surname}</span></p>
          </div>
          <div className="text-right text-[10px] text-gray-500">
            <p>Printed: {new Date().toLocaleString()}</p>
            <p>Examination: {formData.dateOfExamination || new Date().toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Patient Information Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-[#800000] mb-4 border-b border-gray-200 pb-2">
            Patient Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">File No.</label>
              <input
                type="text"
                name="fileNo"
                value={formData.fileNo}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Student ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Surname</label>
              <input
                type="text"
                name="surname"
                value={formData.surname}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                min="0"
                max="120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Auto-filled from patient profile"
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Examination</label>
              <input
                type="date"
                name="dateOfExamination"
                value={formData.dateOfExamination}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                required
              />
            </div>
          </div>
        </div>

        {/* Vital Signs Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-[#800000] mb-4 border-b border-gray-200 pb-2">
            Vital Signs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Pressure</label>
              <input
                type="text"
                name="bloodPressure"
                value={formData.bloodPressure}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="120/80 mmHg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
              <input
                type="text"
                name="temperature"
                value={formData.temperature}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="36.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pulse Rate (bpm)</label>
              <input
                type="number"
                name="pulseRate"
                value={formData.pulseRate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="72"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory Rate</label>
              <input
                type="number"
                name="respiratoryRate"
                value={formData.respiratoryRate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="16"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="70"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="170"
                step="0.1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">BMI</label>
              <div className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                {formData.bmi ? (
                  <span className={getBMICategory(parseFloat(formData.bmi)).color}>
                    {formData.bmi} ({getBMICategory(parseFloat(formData.bmi)).category})
                  </span>
                ) : (
                  <span className="text-gray-400">Calculated automatically</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chief Complaint and History */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-[#800000] mb-4 border-b border-gray-200 pb-2">
            Chief Complaint & History
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Chief Complaint</label>
              <textarea
                name="chiefComplaint"
                value={formData.chiefComplaint}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Patient's main concern or reason for visit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">History of Present Illness</label>
              <textarea
                name="historyOfPresentIllness"
                value={formData.historyOfPresentIllness}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Detailed description of the current illness"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Past Medical History</label>
                <textarea
                  name="pastMedicalHistory"
                  value={formData.pastMedicalHistory}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                  placeholder="Previous illnesses, surgeries, hospitalizations"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                  placeholder="Drug allergies, food allergies, environmental allergies"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
                <textarea
                  name="medications"
                  value={formData.medications}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                  placeholder="Current medications and dosages"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Family History</label>
                <textarea
                  name="familyHistory"
                  value={formData.familyHistory}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                  placeholder="Family medical history"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Social History */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-[#800000] mb-4 border-b border-gray-200 pb-2">
            Social History
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Smoking</label>
              <select
                name="smoking"
                value={formData.smoking}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Former">Former smoker</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alcohol</label>
              <select
                name="alcohol"
                value={formData.alcohol}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="Occasional">Occasional</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recreational Drugs</label>
              <select
                name="drugs"
                value={formData.drugs}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        {/* Physical Examination */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-[#800000] mb-4 border-b border-gray-200 pb-2">
            Physical Examination
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">General Appearance</label>
              <textarea
                name="generalAppearance"
                value={formData.generalAppearance}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Alert, oriented, no acute distress"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Head and Neck</label>
              <textarea
                name="headAndNeck"
                value={formData.headAndNeck}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Normocephalic, atraumatic"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cardiovascular</label>
              <textarea
                name="cardiovascular"
                value={formData.cardiovascular}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Regular rate and rhythm, no murmurs"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Respiratory</label>
              <textarea
                name="respiratory"
                value={formData.respiratory}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Clear to auscultation bilaterally"
              />
            </div>            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gastrointestinal</label>
              <textarea
                name="gastrointestinal"
                value={formData.gastrointestinal}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Soft, non-tender, non-distended"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Genitourinary</label>
              <textarea
                name="genitourinary"
                value={formData.genitourinary}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Normal external genitalia"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Neurological</label>
              <textarea
                name="neurological"
                value={formData.neurological}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Alert and oriented x3, no focal deficits"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Musculoskeletal</label>
              <textarea
                name="musculoskeletal"
                value={formData.musculoskeletal}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Full range of motion, no deformities"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skin/Integumentary</label>
              <textarea
                name="integumentary"
                value={formData.integumentary}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Warm, dry, intact"
              />
            </div>
          </div>
        </div>

        {/* Assessment and Plan */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-[#800000] mb-4 border-b border-gray-200 pb-2">
            Assessment and Plan
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assessment/Impression</label>
              <textarea
                name="assessment"
                value={formData.assessment}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Clinical assessment and impression"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
              <textarea
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Primary and secondary diagnoses"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Plan</label>
              <textarea
                name="treatment"
                value={formData.treatment}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Treatment plan and interventions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prescriptions</label>
              <textarea
                name="prescriptions"
                value={formData.prescriptions}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Medications prescribed with dosage and instructions"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
              <textarea
                name="recommendations"
                value={formData.recommendations}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Additional recommendations and lifestyle modifications"
              />
            </div>
          </div>
        </div>

        {/* Follow-up and Examination Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-[#800000] mb-4 border-b border-gray-200 pb-2">
            Follow-up and Examination Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
              />
            </div>            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Examined By</label>
              <input
                type="text"
                name="examinedBy"
                value={formData.examinedBy}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Doctor's name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
              <input
                type="text"
                name="examinerLicense"
                value={formData.examinerLicense}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Medical license number"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Instructions</label>
              <textarea
                name="followUpInstructions"
                value={formData.followUpInstructions}
                onChange={handleInputChange}
                rows={2}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Instructions for follow-up care"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                placeholder="Any additional remarks or notes"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 no-print">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] transition-colors"
          >
            Print Record
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-3 rounded-md text-white font-medium shadow-md transition-all ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-[#800000] hover:bg-[#a00000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000]'
            }`}
          >
            {loading ? 'Submitting...' : 'Submit Form'}
          </button>
        </div>

      </form>

      <FeedbackModal
        open={feedbackModal.open}
        message={feedbackModal.message}
        onClose={() => setFeedbackModal({ open: false, message: '' })}
      />
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
        .max-w-4xl {
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
        }
        .bg-white {
          background-color: transparent !important;
          border: none !important;
          padding: 10px 0 !important;
        }
        .shadow-sm, .shadow-md, .shadow-lg {
          box-shadow: none !important;
        }
        .rounded-lg, .rounded-xl {
          border-radius: 0 !important;
        }
        .border {
          border: 1px solid #eee !important;
        }
        .p-6 {
          padding: 1rem 0 !important;
        }
        .grid {
          display: grid !important;
          gap: 1rem !important;
        }
        input, select, textarea {
          border: none !important;
          border-bottom: 1px solid #eee !important;
          padding: 0.25rem 0 !important;
          background: transparent !important;
          color: black !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
        }
        .text-gray-700, .text-gray-600 {
          color: #333 !important;
        }
        h1, h2, h3, h4 {
          color: black !important;
          margin-top: 20px !important;
          border-bottom: 1px solid #ccc !important;
        }
        h2.text-xl {
          color: black !important;
          border-bottom: 2px solid black !important;
          margin-top: 1.5rem !important;
        }
      }
    `}</style>
    </div>
  );
};

export default MedicalForm;
