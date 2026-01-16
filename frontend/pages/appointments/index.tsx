import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { appointmentsAPI, medicalDocumentsAPI } from '../../utils/api'; // Assuming you have this in your api utils
import Link from 'next/link';
import PostLoginOptionsModal from '../../components/PostLoginOptionsModal';
import { useRouter } from 'next/router';

// Define the Appointment type based on your backend model
interface Appointment {
  id: number;
  appointment_date: string;
  appointment_time: string;
  doctor_name: string;
  purpose: string;
  status: string;
  type: 'medical' | 'dental';
  notes?: string;
  updated_at?: string;
  created_at?: string;
  rejection_reason?: string;
  concern?: string;
  campus?: string;
  patient_name?: string;
  // New reschedule fields
  is_rescheduled?: boolean;
  rescheduled_by?: number;
  rescheduled_by_name?: string;
  rescheduled_at?: string;
  original_date?: string;
  original_time?: string;
  reschedule_reason?: string;
  was_rescheduled_by_admin?: boolean;
  was_rescheduled_by_patient?: boolean;
  // Form data fields
  has_form_data?: boolean;
  form_type?: 'dental' | 'medical';
  // Medical certificate fields
  has_medical_certificate?: boolean;
  medical_certificate_url?: string;
}

interface User {
  grade_level: string;
  // Add other user properties if needed
}

const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [medicalCertificates, setMedicalCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [certificatesLoading, setCertificatesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [medicalDocumentStatus, setMedicalDocumentStatus] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true);
        const res = await appointmentsAPI.getAll(); // Uses the secured endpoint
        setAppointments(res.data || []);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch appointments. Please try again later.');
        console.error("Fetch appointments error:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchMedicalCertificates = async () => {
      try {
        setCertificatesLoading(true);
        // Fetch all medical documents for current user to get status
        const response = await medicalDocumentsAPI.getAll();
        
        // Get the most recent medical document for status
        const userDocuments = response.data || [];
        const latestDocument = userDocuments.length > 0 ? userDocuments[0] : null;
        
        if (latestDocument) {
          setMedicalDocumentStatus({
            status: latestDocument.status,
            consultation_reason: latestDocument.consultation_reason,
            certificate_issued_at: latestDocument.certificate_issued_at,
            reviewed_at: latestDocument.reviewed_at,
            advised_for_consultation_at: latestDocument.advised_for_consultation_at,
            rejection_reason: latestDocument.rejection_reason
          });
        }
        
        // Filter certificates that have actual certificate files
        const userCertificates = userDocuments.filter((doc: any) => 
          doc.status === 'issued' && doc.medical_certificate
        );
        setMedicalCertificates(userCertificates);
      } catch (err: any) {
        console.error('Error fetching medical certificates:', err);
        // Don't set error for certificates as it's not critical
      } finally {
        setCertificatesLoading(false);
      }
    };

    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchAppointments();
    fetchMedicalCertificates();
  }, []);



  // Check if appointment can be modified (at least 3 days away)
  const canModifyAppointment = (appointmentDate: string) => {
    const apptDate = new Date(appointmentDate);
    const today = new Date();
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    return apptDate >= threeDaysFromNow;
  };

  // Check if appointment was rescheduled by admin
  const wasRescheduledByAdmin = (appointment: Appointment) => {
    // Use the new backend field if available
    if (appointment.was_rescheduled_by_admin !== undefined) {
      return appointment.was_rescheduled_by_admin;
    }
    
    // Fallback to the old notes-based detection
    if (!appointment.notes) {
      return false;
    }
    
    // Check if notes contain reschedule-related keywords and don't include "Patient requested"
    const notes = appointment.notes.toLowerCase();
    const rescheduleKeywords = ['reschedule', 'rescheduled', 'moved', 'changed'];
    const hasRescheduleKeyword = rescheduleKeywords.some(keyword => notes.includes(keyword));
    const isPatientRequested = notes.includes('patient requested');
    
    return hasRescheduleKeyword && !isPatientRequested;
  };

  // Check if appointment was rescheduled by patient
  const wasRescheduledByPatient = (appointment: Appointment) => {
    // Use the new backend field if available
    if (appointment.was_rescheduled_by_patient !== undefined) {
      return appointment.was_rescheduled_by_patient;
    }
    
    // Fallback to the old notes-based detection
    if (!appointment.notes) {
      return false;
    }
    
    const notes = appointment.notes.toLowerCase();
    return notes.includes('patient requested');
  };

  // Handle cancellation
  const handleCancelAppointment = async () => {
    if (!selectedAppointment || !cancelReason.trim()) {
      setError('Please provide a reason for cancellation.');
      return;
    }

    setActionLoading(true);
    try {
      await appointmentsAPI.update(selectedAppointment.id, {
        status: 'cancelled',
        rejection_reason: cancelReason
      });
      
      // Refresh appointments
      const res = await appointmentsAPI.getAll();
      setAppointments(res.data || []);
      
      setShowCancelModal(false);
      setSelectedAppointment(null);
      setCancelReason('');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to cancel appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle rescheduling
  const handleRescheduleAppointment = async () => {
    if (!selectedAppointment || !newDate || !newTime) {
      setError('Please select both date and time for rescheduling.');
      return;
    }

    // Check if new date is at least 3 days away
    if (!canModifyAppointment(newDate)) {
      setError('New appointment date must be at least 3 days from today.');
      return;
    }

    setActionLoading(true);
    try {
      await appointmentsAPI.reschedule(selectedAppointment.id, {
        appointment_date: newDate,
        appointment_time: newTime,
        reschedule_reason: `Patient requested reschedule from ${formatDate(selectedAppointment.appointment_date)} at ${formatTime(selectedAppointment.appointment_time)} to ${formatDate(newDate)} at ${formatTime(newTime)}`
      });
      
      // Refresh appointments
      const res = await appointmentsAPI.getAll();
      setAppointments(res.data || []);
      
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setNewDate('');
      setNewTime('');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to reschedule appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle form data download
  const handleDownloadFormData = async (appointment: Appointment) => {
    try {
      setActionLoading(true);
      const response = await appointmentsAPI.downloadFormData(appointment.id);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${appointment.form_type}_form_${appointment.patient_name || 'patient'}_${appointment.appointment_date}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to download form data.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle form data view
  const handleViewFormData = async (appointment: Appointment) => {
    try {
      setActionLoading(true);
      const response = await appointmentsAPI.viewFormData(appointment.id);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new tab
      window.open(url, '_blank');
      
      // Cleanup after a delay to allow the PDF to load
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to view form data.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle medical certificate view for standalone certificates
  const handleViewStandaloneCertificate = async (certificate: any) => {
    try {
      setActionLoading(true);
      const response = await medicalDocumentsAPI.viewCertificate(certificate.id);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new tab
      window.open(url, '_blank');
      
      // Cleanup after a delay to allow the PDF to load
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to view medical certificate.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle medical certificate download for standalone certificates
  const handleDownloadStandaloneCertificate = async (certificate: any) => {
    try {
      setActionLoading(true);
      const response = await medicalDocumentsAPI.downloadCertificate(certificate.id);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical_certificate_${certificate.patient_name || 'certificate'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to download medical certificate.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle medical certificate view
  const handleViewMedicalCertificate = async (appointment: Appointment) => {
    try {
      setActionLoading(true);
      const response = await appointmentsAPI.viewMedicalCertificate(appointment.id);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new tab
      window.open(url, '_blank');
      
      // Cleanup after a delay to allow the PDF to load
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
      
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to view medical certificate.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle medical certificate download
  const handleDownloadMedicalCertificate = async (appointment: Appointment) => {
    try {
      setActionLoading(true);
      const response = await appointmentsAPI.downloadMedicalCertificate(appointment.id);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = `medical_certificate_${appointment.patient_name || 'patient'}_${appointment.appointment_date}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to download medical certificate.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open cancel modal
  const openCancelModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
    setCancelReason('');
  };

  // Open reschedule modal
  const openRescheduleModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
    setNewDate('');
    setNewTime('');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Date not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'Time not set';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusChip = (status: string) => {
    const baseClasses = "px-3 py-1 text-sm font-bold rounded-full capitalize";
    switch (status.toLowerCase()) {
      case 'confirmed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'pending':
      case 'scheduled':
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
    }
  };

  return (
    <Layout onLoginClick={() => {}} onSignupClick={() => {}}>
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
          <div className="flex flex-col gap-4 mb-6 sm:mb-8 md:mb-10">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#800000] tracking-tight">My Appointments</h1>
              <p className="mt-1 text-sm sm:text-base text-gray-600">View and manage your upcoming and past appointments.</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#800000] hover:bg-[#a83232] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000] transition-colors duration-200"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Book New Appointment
            </button>
        </div>

        {loading && (
          <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto"></div>
              <p className="mt-4 text-lg text-gray-600">Loading your appointments...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Medical Document Status Section */}
        {!certificatesLoading && medicalDocumentStatus && (
          <div className="mb-6 sm:mb-8">
            <div className={`border rounded-xl p-4 sm:p-6 shadow-lg ${
              medicalDocumentStatus.status === 'issued' ? 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200' :
              medicalDocumentStatus.status === 'for_consultation' ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' :
              medicalDocumentStatus.status === 'verified' ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200' :
              medicalDocumentStatus.status === 'pending' ? 'bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200' :
              medicalDocumentStatus.status === 'rejected' ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200' :
              'bg-gradient-to-r from-gray-50 to-blue-50 border-gray-200'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                <div className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full mr-3 sm:mr-4 flex-shrink-0 ${
                    medicalDocumentStatus.status === 'issued' ? 'bg-green-100' :
                    medicalDocumentStatus.status === 'for_consultation' ? 'bg-yellow-100' :
                    medicalDocumentStatus.status === 'verified' ? 'bg-blue-100' :
                    medicalDocumentStatus.status === 'pending' ? 'bg-gray-100' :
                    medicalDocumentStatus.status === 'rejected' ? 'bg-red-100' :
                    'bg-gray-100'
                  }`}>
                    {medicalDocumentStatus.status === 'issued' && (
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {medicalDocumentStatus.status === 'for_consultation' && (
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    )}
                    {medicalDocumentStatus.status === 'verified' && (
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {medicalDocumentStatus.status === 'pending' && (
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {medicalDocumentStatus.status === 'rejected' && (
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h2 className={`text-lg sm:text-xl md:text-2xl font-bold ${
                      medicalDocumentStatus.status === 'issued' ? 'text-green-800' :
                      medicalDocumentStatus.status === 'for_consultation' ? 'text-yellow-800' :
                      medicalDocumentStatus.status === 'verified' ? 'text-blue-800' :
                      medicalDocumentStatus.status === 'pending' ? 'text-gray-800' :
                      medicalDocumentStatus.status === 'rejected' ? 'text-red-800' :
                      'text-gray-800'
                    }`}>
                      {medicalDocumentStatus.status === 'issued' && 'Congratulations!'}
                      {medicalDocumentStatus.status === 'for_consultation' && '⚠️ Consultation Required'}
                      {medicalDocumentStatus.status === 'verified' && '✅ Documents Verified'}
                      {medicalDocumentStatus.status === 'pending' && '⏳ Under Review'}
                      {medicalDocumentStatus.status === 'rejected' && '❌ Documents Rejected'}
                    </h2>
                    <p className={`text-sm sm:text-base font-medium ${
                      medicalDocumentStatus.status === 'issued' ? 'text-green-700' :
                      medicalDocumentStatus.status === 'for_consultation' ? 'text-yellow-700' :
                      medicalDocumentStatus.status === 'verified' ? 'text-blue-700' :
                      medicalDocumentStatus.status === 'pending' ? 'text-gray-700' :
                      medicalDocumentStatus.status === 'rejected' ? 'text-red-700' :
                      'text-gray-700'
                    }`}>
                      {medicalDocumentStatus.status === 'issued' && 'Your medical certificate has been issued'}
                      {medicalDocumentStatus.status === 'for_consultation' && 'You need to schedule a consultation'}
                      {medicalDocumentStatus.status === 'verified' && 'Your documents are verified and ready for certificate issuance'}
                      {medicalDocumentStatus.status === 'pending' && 'Your medical documents are being reviewed'}
                      {medicalDocumentStatus.status === 'rejected' && 'Your documents need to be resubmitted'}
                    </p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  medicalDocumentStatus.status === 'issued' ? 'bg-green-100 text-green-800' :
                  medicalDocumentStatus.status === 'for_consultation' ? 'bg-yellow-100 text-yellow-800' :
                  medicalDocumentStatus.status === 'verified' ? 'bg-blue-100 text-blue-800' :
                  medicalDocumentStatus.status === 'pending' ? 'bg-gray-100 text-gray-800' :
                  medicalDocumentStatus.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {medicalDocumentStatus.status.charAt(0).toUpperCase() + medicalDocumentStatus.status.slice(1).replace('_', ' ')}
                </span>
              </div>
              
              {/* Show rejection reason if applicable */}
              {medicalDocumentStatus.status === 'rejected' && medicalDocumentStatus.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4">
                  <h4 className="text-sm sm:text-base font-semibold text-red-800 mb-2">Rejection Reason:</h4>
                  <p className="text-sm text-red-700 mb-4">{medicalDocumentStatus.rejection_reason}</p>
                  <button
                    onClick={() => {
                      // Generate navigation token and redirect to document upload
                      const navigationToken = btoa(`${Date.now()}-${Math.random().toString(36)}`);
                      sessionStorage.setItem('appointment_navigation_token', navigationToken);
                      sessionStorage.setItem('appointment_option', 'Request Medical Certificate');
                      sessionStorage.setItem('navigation_timestamp', Date.now().toString());
                      router.push(`/patient/waiver?option=${encodeURIComponent('Request Medical Certificate')}&token=${navigationToken}`);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Re-submit Documents
                  </button>
                </div>
              )}
              
              {/* Show reason for consultation if applicable */}
              {medicalDocumentStatus.status === 'for_consultation' && medicalDocumentStatus.consultation_reason && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4">
                  <h4 className="text-sm sm:text-base font-semibold text-yellow-800 mb-2">Consultation Reason:</h4>
                  <p className="text-sm text-yellow-700 mb-4">{medicalDocumentStatus.consultation_reason}</p>
                  <button
                    onClick={() => {
                      // Generate navigation token for proper flow
                      const navigationToken = btoa(`${Date.now()}-${Math.random().toString(36)}`);
                      sessionStorage.setItem('appointment_navigation_token', navigationToken);
                      sessionStorage.setItem('appointment_option', 'Book Medical Consultation');
                      sessionStorage.setItem('navigation_timestamp', Date.now().toString());
                      
                      // Redirect to waiver page with proper flow
                      router.push(`/patient/waiver?option=${encodeURIComponent('Book Medical Consultation')}&token=${navigationToken}`);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
                  >
                    <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Book Consultation Appointment
                  </button>
                </div>
              )}
              
              {/* Show timeline information */}
              <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100">
                <h4 className="text-sm sm:text-base font-semibold text-gray-800 mb-3">Status Timeline:</h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  {medicalDocumentStatus.certificate_issued_at && (
                    <div className="flex items-center text-green-600">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Certificate issued on {new Date(medicalDocumentStatus.certificate_issued_at).toLocaleDateString()}
                    </div>
                  )}
                  {medicalDocumentStatus.reviewed_at && (
                    <div className="flex items-center text-blue-600">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Documents reviewed on {new Date(medicalDocumentStatus.reviewed_at).toLocaleDateString()}
                    </div>
                  )}
                  {medicalDocumentStatus.advised_for_consultation_at && (
                    <div className="flex items-center text-yellow-600">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Advised for consultation on {new Date(medicalDocumentStatus.advised_for_consultation_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Medical Certificates Section */}
        {!certificatesLoading && medicalCertificates.length > 0 && (
          <div className="mb-6 sm:mb-8">
            <div className="bg-white border border-green-200 rounded-xl p-4 sm:p-6 shadow-lg">
              {medicalCertificates.map((certificate, index) => (
                <div key={certificate.id || index} className="bg-gray-50 rounded-lg p-4 sm:p-6 shadow-md border border-green-100">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                    <div className="flex items-center">
                      <svg className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">Medical Certificate</h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Issued on {certificate.certificate_issued_at ? new Date(certificate.certificate_issued_at).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Ready to Download
                    </span>
                  </div>
                  
                  <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                    Your medical certificate is ready! You can view it online or download it as a PDF file.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button
                      onClick={() => handleViewStandaloneCertificate(certificate)}
                      disabled={actionLoading}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {actionLoading ? 'Loading...' : 'View Certificate'}
                    </button>
                    <button
                      onClick={() => handleDownloadStandaloneCertificate(certificate)}
                      disabled={actionLoading}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="-ml-0.5 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {actionLoading ? 'Downloading...' : 'Download PDF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && !error && appointments.length === 0 && (
            <div className="text-center py-16 px-6 bg-white border-2 border-dashed border-gray-300 rounded-lg">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h2 className="mt-4 text-xl font-semibold text-gray-800">No Appointments Yet</h2>
              <p className="mt-2 text-gray-500">When you book an appointment, it will show up here.</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#800000] hover:bg-[#a83232] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000]"
              >
              Book Your First Appointment
              </button>
          </div>
        )}

        {!loading && !error && appointments.length > 0 && (
            <div className="space-y-4 sm:space-y-6">
                  {appointments.map((appt) => (
                <div key={appt.id} className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                      <div>
                        <p className="text-xs sm:text-sm font-semibold text-[#800000] uppercase tracking-wider">{appt.type} Appointment</p>
                        <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mt-1">{formatDate(appt.appointment_date)}</p>
                        <p className="text-base sm:text-lg text-gray-600">{formatTime(appt.appointment_time)}</p>
                      </div>
                        <span className={getStatusChip(appt.status)}>{appt.status}</span>
                    </div>
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                        <div>
                          <p className="text-gray-500 font-medium">Provider</p>
                          <p className="text-gray-900 font-semibold">{appt.doctor_name || 'To be determined'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Purpose</p>
                          <p className="text-gray-900 font-semibold">{appt.purpose}</p>
                        </div>
                      </div>
                      
                      {/* Show rescheduling note if appointment was rescheduled by admin */}
                      {wasRescheduledByAdmin(appt) && (
                        <div className="mt-4 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-start">
                            <svg className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div className="ml-2 sm:ml-3">
                              <h4 className="text-xs sm:text-sm font-medium text-blue-800">
                                Appointment Rescheduled by Medical Staff
                              </h4>
                              <div className="text-xs sm:text-sm text-blue-700 mt-1">
                                {appt.rescheduled_by_name && (
                                  <p className="mb-1">
                                    <span className="font-medium">Rescheduled by:</span> {appt.rescheduled_by_name}
                                  </p>
                                )}
                                {appt.rescheduled_at && (
                                  <p className="mb-1">
                                    <span className="font-medium">Rescheduled on:</span> {new Date(appt.rescheduled_at).toLocaleDateString()}
                                  </p>
                                )}
                                {appt.original_date && appt.original_time && (
                                  <p className="mb-1">
                                    <span className="font-medium">Original date:</span> {formatDate(appt.original_date)} at {formatTime(appt.original_time)}
                                  </p>
                                )}
                                {appt.reschedule_reason && (
                                  <p className="mb-1">
                                    <span className="font-medium">Reason:</span> {appt.reschedule_reason}
                                  </p>
                                )}
                                {appt.notes && (
                                  <p className="text-xs text-blue-600 mt-2 italic">
                                    {appt.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Show rescheduling note if appointment was rescheduled by patient */}
                      {wasRescheduledByPatient(appt) && (
                        <div className="mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-start">
                            <svg className="flex-shrink-0 h-4 w-4 sm:h-5 sm:w-5 text-green-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="ml-2 sm:ml-3">
                              <h4 className="text-xs sm:text-sm font-medium text-green-800">
                                Appointment Rescheduled by You
                              </h4>
                              <div className="text-xs sm:text-sm text-green-700 mt-1">
                                {appt.rescheduled_at && (
                                  <p className="mb-1">
                                    <span className="font-medium">Rescheduled on:</span> {new Date(appt.rescheduled_at).toLocaleDateString()}
                                  </p>
                                )}
                                {appt.original_date && appt.original_time && (
                                  <p className="mb-1">
                                    <span className="font-medium">Original date:</span> {formatDate(appt.original_date)} at {formatTime(appt.original_time)}
                                  </p>
                                )}
                                <p className="text-xs text-green-600 mt-2 italic">
                                  Your reschedule request is pending approval by medical staff.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Download form data button for completed appointments */}
                      {appt.status === 'completed' && appt.has_form_data && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-sm font-medium text-green-800">
                                {appt.form_type === 'dental' ? 'Dental' : 'Medical'} examination completed
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleViewFormData(appt)}
                              disabled={actionLoading}
                              className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {actionLoading ? 'Loading...' : 'View Results'}
                            </button>
                            <button
                              onClick={() => handleDownloadFormData(appt)}
                              disabled={actionLoading}
                              className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {actionLoading ? 'Downloading...' : 'Download PDF'}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Medical certificate section for medical appointments with issued certificates */}
                      {appt.type === 'medical' && appt.status === 'completed' && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <svg className="h-5 w-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-sm font-medium text-blue-800">
                                Medical Certificate Ready
                              </span>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Available
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 mb-3">
                            Your medical certificate has been issued and is ready for viewing and download.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => handleViewMedicalCertificate(appt)}
                              disabled={actionLoading}
                              className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {actionLoading ? 'Loading...' : 'View PDF'}
                            </button>
                            <button
                              onClick={() => handleDownloadMedicalCertificate(appt)}
                              disabled={actionLoading}
                              className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-indigo-300 text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {actionLoading ? 'Downloading...' : 'Download PDF'}
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Action buttons for appointments that can be modified */}
                      {['confirmed', 'pending', 'scheduled'].includes(appt.status) && canModifyAppointment(appt.appointment_date) && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <button
                              onClick={() => openRescheduleModal(appt)}
                              className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-blue-300 text-sm font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                              <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Reschedule
                            </button>
                            <button
                              onClick={() => openCancelModal(appt)}
                              className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                            >
                              <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel
                            </button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            * Appointments can only be modified up to 3 days before the scheduled date
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
      </div>
      {user && (
        <PostLoginOptionsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          userGradeLevel={user.grade_level || ''}
        />
      )}

      {/* Cancel Appointment Modal */}
      {showCancelModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowCancelModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full mx-4">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Cancel Appointment</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to cancel your {selectedAppointment.type} appointment on {formatDate(selectedAppointment.appointment_date)}?
                      </p>
                      <div className="mt-4">
                        <label htmlFor="cancel-reason" className="block text-sm font-medium text-gray-700">
                          Reason for cancellation *
                        </label>
                        <textarea
                          id="cancel-reason"
                          rows={3}
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#800000] focus:border-[#800000] sm:text-sm"
                          placeholder="Please provide a reason for cancellation..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={actionLoading || !cancelReason.trim()}
                  onClick={handleCancelAppointment}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Cancelling...' : 'Cancel Appointment'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Keep Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Appointment Modal */}
      {showRescheduleModal && selectedAppointment && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowRescheduleModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full mx-4">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Reschedule Appointment</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        Current appointment: {formatDate(selectedAppointment.appointment_date)} at {formatTime(selectedAppointment.appointment_time)}
                      </p>
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="new-date" className="block text-sm font-medium text-gray-700">
                            New Date *
                          </label>
                          <input
                            type="date"
                            id="new-date"
                            value={newDate}
                            min={new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#800000] focus:border-[#800000] sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor="new-time" className="block text-sm font-medium text-gray-700">
                            New Time *
                          </label>
                          <input
                            type="time"
                            id="new-time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#800000] focus:border-[#800000] sm:text-sm"
                          />
                        </div>
                        <p className="text-xs text-gray-500">
                          * Your rescheduled appointment will need to be approved by the medical staff.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  disabled={actionLoading || !newDate || !newTime}
                  onClick={handleRescheduleAppointment}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#800000] text-base font-medium text-white hover:bg-[#a83232] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000] sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading ? 'Rescheduling...' : 'Reschedule'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AppointmentsPage;