import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import withAdminAccess from '../../components/withAdminAccess';
import { appointmentsAPI, patientsAPI, djangoApiClient } from '../../utils/api';
import { EyeIcon, DocumentTextIcon, XMarkIcon as XIcon, PrinterIcon, UserCircleIcon, CheckCircleIcon, CalendarIcon } from '@heroicons/react/24/outline';
import PatientProfileModal from '../../components/PatientProfileModal';
import AppointmentDetailsModal from '../../components/AppointmentDetailsModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import FeedbackModal from '../../components/feedbackmodal';
import useDebounce from '../../hooks/useDebounce';
import { useRouter } from 'next/router';

function AdminMedicalConsultations() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('medicalAppointments');

  // State for Medical Appointments
  const [medicalAppointments, setMedicalAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [sortAppointmentsBy, setSortAppointmentsBy] = useState('none');
  const [searchAppointmentsTerm, setSearchAppointmentsTerm] = useState('');
  const debouncedSearchAppointmentsTerm = useDebounce(searchAppointmentsTerm, 500);

  // State for History
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [filterHistoryBy, setFilterHistoryBy] = useState('all');
  const [searchHistoryTerm, setSearchHistoryTerm] = useState('');
  const debouncedSearchHistoryTerm = useDebounce(searchHistoryTerm, 500);
  
  // State for Today's Appointments
  const [todaysAppointments, setTodaysAppointments] = useState([]);
  const [loadingTodaysAppointments, setLoadingTodaysAppointments] = useState(true);
  const [todaysAppointmentsError, setTodaysAppointmentsError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('today');
  const [searchTodaysTerm, setSearchTodaysTerm] = useState('');
  const debouncedSearchTodaysTerm = useDebounce(searchTodaysTerm, 500);
  
  // Modal states
  const [patientProfileModal, setPatientProfileModal] = useState({ open: false, patient: null, allPatientProfiles: [] });
  const [appointmentDetailsModal, setAppointmentDetailsModal] = useState({ open: false, appointment: null });
  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: (reason?: string) => {},
    showReasonInput: false,
    isDestructive: false,
  });
  const [rescheduleModal, setRescheduleModal] = useState({
    open: false,
    appointment: null,
  });
  const [feedbackModal, setFeedbackModal] = useState({ open: false, message: '' });

  // Add school year filtering state
  const [schoolYears, setSchoolYears] = useState([]);
  const [selectedSchoolYear, setSelectedSchoolYear] = useState('');
  const [loadingSchoolYears, setLoadingSchoolYears] = useState(false);

  const fetchMedicalAppointments = (searchTerm = '', sort = 'none', schoolYear = '') => {
    setLoadingAppointments(true);
    setAppointmentsError(null);
    const params = {
        type: 'medical',
        status: 'pending,confirmed,scheduled,completed', // Include completed appointments
        ordering: sort === 'none' ? '-appointment_date' : sort,
        search: searchTerm,
        school_year: schoolYear,
    };
    appointmentsAPI.getAll(params)
        .then(res => {
          setMedicalAppointments(res.data);
        })
        .catch(error => {
          console.error('Medical appointments error:', error);
          setAppointmentsError(error.message || 'Failed to fetch appointments');
        })
        .finally(() => setLoadingAppointments(false));
  };

  const fetchMedicalHistory = (searchTerm = '', filter = 'all', schoolYear = '') => {
    setLoadingHistory(true);
    setHistoryError(null);
    const params = {
        type: 'medical',
        status: filter === 'all' ? 'completed,cancelled' : `${filter},cancelled`,
        search: searchTerm,
        school_year: schoolYear,
    };
    appointmentsAPI.getAll(params)
        .then(res => setMedicalHistory(res.data))
        .catch(error => setHistoryError(error.message || 'Failed to fetch history'))
        .finally(() => setLoadingHistory(false));
  };

  const fetchTodaysAppointments = (searchTerm = '', filter = 'today', schoolYear = '') => {
    setLoadingTodaysAppointments(true);
    setTodaysAppointmentsError(null);
    
    const today = new Date();
    let startDate, endDate;
    
    if (filter === 'today') {
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    } else if (filter === 'this_week') {
      const dayOfWeek = today.getDay();
      const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
      startDate = new Date(today.setDate(diff));
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
    } else if (filter === 'this_month') {
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    }

    const params = {
      type: 'medical',
      status: 'confirmed',
      appointment_date_after: startDate?.toISOString().split('T')[0],
      appointment_date_before: endDate?.toISOString().split('T')[0],
      search: searchTerm,
      school_year: schoolYear,
    };
    
    appointmentsAPI.getAll(params)
      .then(res => setTodaysAppointments(res.data))
      .catch(error => setTodaysAppointmentsError(error.message || 'Failed to fetch today\'s appointments'))
      .finally(() => setLoadingTodaysAppointments(false));
  };

  const fetchSchoolYears = async () => {
    setLoadingSchoolYears(true);
    try {
      const response = await djangoApiClient.get('/academic-school-years/');
      setSchoolYears(response.data);
      // If there's a current school year, select it by default
      const currentSchoolYear = response.data.find(sy => sy.is_current);
      if (currentSchoolYear) {
        setSelectedSchoolYear(currentSchoolYear.id.toString());
      }
    } catch (error) {
      console.error('Failed to fetch school years:', error);
    } finally {
      setLoadingSchoolYears(false);
    }
  };

  const handleApproveAppointment = async (appointmentId: number) => {
    try {
      await appointmentsAPI.update(appointmentId, { status: 'confirmed' });
      setFeedbackModal({ open: true, message: 'Appointment approved successfully!' });
      fetchMedicalAppointments(debouncedSearchAppointmentsTerm, sortAppointmentsBy, selectedSchoolYear);
    } catch (error: any) {
      console.error("Failed to approve appointment:", error.response?.data || error);
      setFeedbackModal({ open: true, message: `Failed to approve appointment: ${error.response?.data?.detail || 'Please check the console for more details.'}` });
    }
  };

  const handleCancelAppointment = async (appointmentId: number, reason: string) => {
    if (!reason) {
        setFeedbackModal({ open: true, message: 'A reason is required to cancel an appointment.' });
        return;
    }
    try {
        await appointmentsAPI.update(appointmentId, { status: 'cancelled', rejection_reason: reason });
        setFeedbackModal({ open: true, message: 'Appointment cancelled successfully.' });
        fetchMedicalAppointments(debouncedSearchAppointmentsTerm, sortAppointmentsBy, selectedSchoolYear);
    } catch (error: any) {
        console.error("Failed to cancel appointment:", error.response?.data || error);
        setFeedbackModal({ open: true, message: `Failed to cancel appointment: ${error.response?.data?.detail || 'Please check the console for more details.'}` });
    }
  };

  const handleRescheduleAppointment = async (appointmentId: number, newDate: string, newTime: string, reason: string) => {
    if (!reason) {
      setFeedbackModal({ open: true, message: 'A reason is required to reschedule an appointment.' });
      return;
    }
    try {
      await appointmentsAPI.reschedule(appointmentId, { 
        appointment_date: newDate, 
        appointment_time: newTime,
        reschedule_reason: reason
      });
      setFeedbackModal({ open: true, message: 'Appointment rescheduled successfully.' });
      fetchMedicalAppointments(debouncedSearchAppointmentsTerm, sortAppointmentsBy, selectedSchoolYear);
      setRescheduleModal({ open: false, appointment: null });
    } catch (error: any) {
      console.error("Failed to reschedule appointment:", error.response?.data || error);
      setFeedbackModal({ open: true, message: `Failed to reschedule appointment: ${error.response?.data?.error || error.response?.data?.detail || 'Please check the console for more details.'}` });
    }
  };

  const openConfirmationModal = (type: 'approve' | 'cancel', appointmentId: number) => {
    if (type === 'approve') {
        setConfirmationModal({
            open: true,
            title: 'Approve Appointment',
            message: 'Are you sure you want to approve this appointment? The patient will be notified.',
            onConfirm: () => handleApproveAppointment(appointmentId),
            showReasonInput: false,
            isDestructive: false,
        });
    } else { // type === 'cancel'
        setConfirmationModal({
            open: true,
            title: 'Cancel Appointment',
            message: 'Are you sure you want to cancel this appointment? Please provide a reason below.',
            onConfirm: (reason) => handleCancelAppointment(appointmentId, reason || ''),
            showReasonInput: true,
            isDestructive: true,
        });
    }
  };

  const handleOpenRescheduleModal = (appointment: any) => {
    setRescheduleModal({ open: true, appointment });
  };

  const handleViewPatientProfile = async (patientId: number) => {
    try {
      const response = await patientsAPI.getById(patientId);
      const patient = response.data;
      
      // Fetch all patient profiles for this user
      let allPatientProfiles = [];
      if (patient.user) {
        try {
          const allProfilesResponse = await patientsAPI.getByUserId(patient.user);
          allPatientProfiles = allProfilesResponse.data;
        } catch (error) {
          console.error("Failed to fetch all patient profiles:", error);
          allPatientProfiles = [patient]; // Fallback to single profile
        }
      } else {
        allPatientProfiles = [patient]; // If no user linked, just use the current profile
      }
      
      setPatientProfileModal({ open: true, patient, allPatientProfiles });
    } catch (error) {
      console.error("Failed to fetch patient profile:", error);
    }
  };

  const handleViewAppointmentDetails = (appointment: any) => {
    setAppointmentDetailsModal({ open: true, appointment });
  };

  const handleOpenMedicalForm = (appointmentId: number) => {
    router.push(`/medical-form?appointmentId=${appointmentId}`);
  };

  // Handle form data download
  const handleDownloadFormData = async (appointment: any) => {
    try {
      const response = await appointmentsAPI.downloadFormData(appointment.id);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `medical_form_${appointment.patient_name || 'patient'}_${appointment.appointment_date}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err: any) {
      console.error('Failed to download form data:', err);
      setFeedbackModal({ open: true, message: 'Failed to download form data. Please try again.' });
    }
  };

  // Handle form data view
  const handleViewFormData = async (appointment: any) => {
    try {
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
      console.error('Failed to view form data:', err);
      setFeedbackModal({ open: true, message: 'Failed to view form data. Please try again.' });
    }
  };

  // Handle school year change from SchoolYearSelector component
  const handleSchoolYearChange = (schoolYearId: string) => {
    setSelectedSchoolYear(schoolYearId);
    
    // Refresh data based on the active tab
    if (activeTab === 'medicalAppointments') {
      fetchMedicalAppointments(debouncedSearchAppointmentsTerm, sortAppointmentsBy, schoolYearId);
    } else if (activeTab === 'history') {
      fetchMedicalHistory(debouncedSearchHistoryTerm, filterHistoryBy, schoolYearId);
    } else if (activeTab === 'todaysAppointments') {
      fetchTodaysAppointments(debouncedSearchTodaysTerm, timeFilter, schoolYearId);
    }
  };

  useEffect(() => {
    if (activeTab === 'medicalAppointments') {
      fetchMedicalAppointments(debouncedSearchAppointmentsTerm, sortAppointmentsBy, selectedSchoolYear);
    }
  }, [activeTab, debouncedSearchAppointmentsTerm, sortAppointmentsBy, selectedSchoolYear]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchMedicalHistory(debouncedSearchHistoryTerm, filterHistoryBy, selectedSchoolYear);
    }
  }, [activeTab, debouncedSearchHistoryTerm, filterHistoryBy, selectedSchoolYear]);

  useEffect(() => {
    if (activeTab === 'todaysAppointments') {
      fetchTodaysAppointments(debouncedSearchTodaysTerm, timeFilter, selectedSchoolYear);
    }
  }, [activeTab, debouncedSearchTodaysTerm, timeFilter, selectedSchoolYear]);

  useEffect(() => {
    // Load school years when component mounts only
    fetchSchoolYears();
  }, []); // Empty dependency array ensures this runs only once

  const renderTable = (data: any[], loading: boolean, error: string | null, isHistory = false) => {
    if (loading) return <div className="text-center p-6">Loading...</div>;
    if (error) return <div className="text-center p-6 text-red-500">{error}</div>;
    if (data.length === 0) return <div className="text-center p-6">No records found.</div>;
    
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-[#800000]">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Patient Name</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Purpose</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">{isHistory ? 'Date' : 'Appointment Time'}</th>
            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
            {!isHistory && <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Profile</th>}
            {isHistory && <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Reason</th>}
            <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((record: any) => (
            <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-200">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.patient_name}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.purpose}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{isHistory ? new Date(record.appointment_date).toLocaleString() : record.appointment_time}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    record.status === 'completed' ? 'bg-green-100 text-green-800' :
                    record.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    record.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }`}>
                  {record.status}
                </span>
              </td>
              {!isHistory && (
                 <td className="px-6 py-4 whitespace-nowrap">
                    <button 
                      title="View Profile" 
                      onClick={() => handleViewPatientProfile(record.patient)}
                      className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
                    >
                      <UserCircleIcon className="h-6 w-6" />
                    </button>
                  </td>
              )}
              {isHistory && <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.reason || record.purpose}</td>}
              <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-2">
                {isHistory ? (
                  <>
                    <button 
                      title="View Details" 
                      onClick={() => handleViewAppointmentDetails(record)}
                      className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
                    >
                      <EyeIcon className="h-6 w-6" />
                    </button>
                    {/* Show view results button for completed appointments with form data */}
                    {record.status === 'completed' && record.has_form_data && (
                      <>
                        <button 
                          title="View Results" 
                          className="p-2 rounded-full text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                          onClick={() => handleViewFormData(record)}
                        >
                          <DocumentTextIcon className="h-6 w-6" />
                        </button>
                        <button 
                          title="Download PDF" 
                          className="p-2 rounded-full text-green-400 hover:bg-green-100 hover:text-green-600 transition-colors duration-200"
                          onClick={() => handleDownloadFormData(record)}
                        >
                          <PrinterIcon className="h-6 w-6" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <button 
                      title="View Appointment" 
                      onClick={() => handleViewAppointmentDetails(record)}
                      className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
                    >
                      <EyeIcon className="h-6 w-6" />
                    </button>
                    
                    {/* Show examination form button only for non-completed appointments */}
                    {record.status !== 'completed' && record.status !== 'cancelled' && (
                      <button 
                        title="Examination Form" 
                        onClick={() => handleOpenMedicalForm(record.id)}
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
                      >
                        <DocumentTextIcon className="h-6 w-6" />
                      </button>
                    )}
                    
                    {/* Show view results button for completed appointments with form data */}
                    {record.status === 'completed' && record.has_form_data && (
                      <>
                        <button 
                          title="View Results" 
                          className="p-2 rounded-full text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                          onClick={() => handleViewFormData(record)}
                        >
                          <DocumentTextIcon className="h-6 w-6" />
                        </button>
                        <button 
                          title="Download PDF" 
                          className="p-2 rounded-full text-green-400 hover:bg-green-100 hover:text-green-600 transition-colors duration-200"
                          onClick={() => handleDownloadFormData(record)}
                        >
                          <PrinterIcon className="h-6 w-6" />
                        </button>
                      </>
                    )}
                    
                    {/* Show approve button only for pending appointments */}
                    {record.status === 'pending' && (
                      <button 
                        title="Approve Appointment" 
                        onClick={() => openConfirmationModal('approve', record.id)} 
                        className="p-2 rounded-full text-green-400 hover:bg-green-100 hover:text-green-600 transition-colors duration-200"
                      >
                        <CheckCircleIcon className="h-6 w-6" />
                      </button>
                    )}
                    
                    {/* Show reschedule button only for non-completed and non-cancelled appointments */}
                    {record.status !== 'completed' && record.status !== 'cancelled' && (
                      <button 
                        title="Reschedule Appointment" 
                        onClick={() => handleOpenRescheduleModal(record)}
                        className="p-2 rounded-full text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                      >
                        <CalendarIcon className="h-6 w-6" />
                      </button>
                    )}
                    
                    {/* Show cancel button only for non-completed and non-cancelled appointments */}
                    {record.status !== 'completed' && record.status !== 'cancelled' && (
                      <button 
                        title="Cancel Appointment" 
                        onClick={() => openConfirmationModal('cancel', record.id)}
                        className="p-2 rounded-full text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                      >
                        <XIcon className="h-6 w-6" />
                      </button>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Medical Consultations</h1>
          <p className="text-gray-600">Manage medical appointments and view consultation history</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex justify-between border-b border-gray-200">
            <div className="flex">
              <button
                className={`py-3 px-6 text-lg font-medium transition-all duration-200 focus:outline-none ${
                  activeTab === 'medicalAppointments'
                    ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('medicalAppointments')}
              >
                Medical Appointments
              </button>
              <button
                className={`py-3 px-6 text-lg font-medium transition-all duration-200 focus:outline-none ${
                  activeTab === 'todaysAppointments'
                    ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('todaysAppointments')}
              >
                Today's Appointments
              </button>
              <button
                className={`py-3 px-6 text-lg font-medium transition-all duration-200 focus:outline-none ${
                  activeTab === 'history'
                    ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('history')}
              >
                History
              </button>
            </div>
            
            {/* School Year Selector */}
            <div className="py-3 px-6">
              <select
                value={selectedSchoolYear}
                onChange={(e) => handleSchoolYearChange(e.target.value)}
                className="w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
                disabled={loadingSchoolYears}
              >
                <option value="">All School Years</option>
                {schoolYears.map((schoolYear: any) => (
                  <option key={schoolYear.id} value={schoolYear.id}>
                    {schoolYear.academic_year} {schoolYear.is_current && '(Current)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'medicalAppointments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label htmlFor="sort-by" className="text-gray-700 font-medium">Sort By:</label>
                      <select 
                        id="sort-by" 
                        value={sortAppointmentsBy}
                        onChange={(e) => setSortAppointmentsBy(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                      >
                        <option value="none">None</option>
                        <option value="name">Name</option>
                        <option value="time">Time</option>
                      </select>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by patient name"
                      value={searchAppointmentsTerm}
                      onChange={(e) => setSearchAppointmentsTerm(e.target.value)}
                      className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-80 focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  {renderTable(medicalAppointments, loadingAppointments, appointmentsError)}
                </div>
                <div className="mt-4 flex justify-end">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Pagination controls can be added here */}
                  </nav>
                </div>
              </div>
            )}

            {activeTab === 'todaysAppointments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label htmlFor="time-filter" className="text-gray-700 font-medium">Time Filter:</label>
                      <select 
                        id="time-filter" 
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                      >
                        <option value="today">Today</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                      </select>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by patient name"
                      value={searchTodaysTerm}
                      onChange={(e) => setSearchTodaysTerm(e.target.value)}
                      className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-80 focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  {renderTable(todaysAppointments, loadingTodaysAppointments, todaysAppointmentsError)}
                </div>
                <div className="mt-4 flex justify-end">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    {/* Pagination controls can be added here */}
                  </nav>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label htmlFor="filter-by" className="text-gray-700 font-medium">Filter By:</label>
                      <select 
                        id="filter-by" 
                        value={filterHistoryBy}
                        onChange={(e) => setFilterHistoryBy(e.target.value)}
                        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                      >
                        <option value="all">All</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search history..."
                      value={searchHistoryTerm}
                      onChange={(e) => setSearchHistoryTerm(e.target.value)}
                      className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-80 focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                   {renderTable(medicalHistory, loadingHistory, historyError, true)}
                </div>
                <div className="mt-4 flex justify-end">
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                     {/* Pagination controls can be added here */}
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <PatientProfileModal
        open={patientProfileModal.open}
        patient={patientProfileModal.patient}
        allPatientProfiles={patientProfileModal.allPatientProfiles}
        onClose={() => setPatientProfileModal({ open: false, patient: null, allPatientProfiles: [] })}
      />
      
      <AppointmentDetailsModal
        open={appointmentDetailsModal.open}
        appointment={appointmentDetailsModal.appointment}
        onClose={() => setAppointmentDetailsModal({ open: false, appointment: null })}
      />
      <ConfirmationModal
        {...confirmationModal}
        onClose={() => setConfirmationModal({ ...confirmationModal, open: false })}
      />
      <FeedbackModal
        open={feedbackModal.open}
        message={feedbackModal.message}
        onClose={() => setFeedbackModal({ open: false, message: '' })}
      />
      
      {/* Reschedule Modal */}
      {rescheduleModal.open && (
        <RescheduleModal
          open={rescheduleModal.open}
          appointment={rescheduleModal.appointment}
          onClose={() => setRescheduleModal({ open: false, appointment: null })}
          onReschedule={handleRescheduleAppointment}
        />
      )}
    </AdminLayout>
  );
}

// Reschedule Modal Component
function RescheduleModal({ open, appointment, onClose, onReschedule }) {
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (appointment) {
      setNewDate(appointment.appointment_date);
      setNewTime(appointment.appointment_time);
      setReason('');
    }
  }, [appointment]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newDate || !newTime || !reason) {
      alert('Please fill in all fields');
      return;
    }
    setLoading(true);
    await onReschedule(appointment.id, newDate, newTime, reason);
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Reschedule Appointment</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient: {appointment?.patient_name}
            </label>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Date: {appointment?.appointment_date}
            </label>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Time: {appointment?.appointment_time}
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Date *
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#800000]"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Time *
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#800000]"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Rescheduling *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#800000]"
              rows={3}
              placeholder="Please provide a reason for rescheduling..."
              required
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#800000] text-white rounded-md hover:bg-[#600000] disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Rescheduling...' : 'Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default withAdminAccess(AdminMedicalConsultations);