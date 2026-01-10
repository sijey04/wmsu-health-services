import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import withAdminAccess from '../../components/withAdminAccess';
import { CheckCircleIcon, DocumentTextIcon, EyeIcon, PrinterIcon, UserCircleIcon, XMarkIcon as XIcon, CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { appointmentsAPI, patientsAPI, djangoApiClient } from '../../utils/api';
import useDebounce from '../../hooks/useDebounce';
import PatientProfileModal from '../../components/PatientProfileModal';
import AppointmentDetailsModal from '../../components/AppointmentDetailsModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import FeedbackModal from '../../components/feedbackmodal';
import { useRouter } from 'next/router';

function AdminDentalConsultations() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dentalAppointments');

  // State for Dental Appointments
  const [dentalAppointments, setDentalAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentsError, setAppointmentsError] = useState(null);
  const [sortAppointmentsBy, setSortAppointmentsBy] = useState('none');
  const [searchAppointmentsTerm, setSearchAppointmentsTerm] = useState('');
  const debouncedSearchAppointmentsTerm = useDebounce(searchAppointmentsTerm, 500);

  // State for History
  const [dentalHistory, setDentalHistory] = useState([]);
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
  
  // Semester filtering state (academic_year + semester_type)
  const [semesters, setSemesters] = useState([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('all');
  const [currentSemester, setCurrentSemester] = useState<any>(null);
  const [loadingSemesters, setLoadingSemesters] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Enhanced filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

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

  // Filter and paginate appointments
  const filteredAppointments = useMemo(() => {
    let filtered = dentalAppointments;
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        const daysDiff = Math.floor((aptDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dateFilter === 'today') return daysDiff === 0;
        if (dateFilter === 'week') return daysDiff >= 0 && daysDiff <= 7;
        if (dateFilter === 'month') return daysDiff >= 0 && daysDiff <= 30;
        return true;
      });
    }
    
    return filtered;
  }, [dentalAppointments, statusFilter, dateFilter]);
  
  const paginatedAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAppointments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAppointments, currentPage, itemsPerPage]);
  
  // Filter and paginate today's appointments
  const filteredTodaysAppointments = useMemo(() => {
    let filtered = todaysAppointments;
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(apt => apt.status === statusFilter);
    }
    
    return filtered;
  }, [todaysAppointments, statusFilter]);
  
  const paginatedTodaysAppointments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTodaysAppointments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTodaysAppointments, currentPage, itemsPerPage]);
  
  // Filter and paginate history
  const filteredHistory = useMemo(() => {
    let filtered = dentalHistory;
    
    return filtered;
  }, [dentalHistory]);
  
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHistory, currentPage, itemsPerPage]);
  
  // Calculate total pages
  const totalPages = useMemo(() => {
    let totalItems = 0;
    if (activeTab === 'dentalAppointments') totalItems = filteredAppointments.length;
    else if (activeTab === 'todaysAppointments') totalItems = filteredTodaysAppointments.length;
    else if (activeTab === 'history') totalItems = filteredHistory.length;
    
    return Math.ceil(totalItems / itemsPerPage);
  }, [activeTab, filteredAppointments.length, filteredTodaysAppointments.length, filteredHistory.length, itemsPerPage]);
  
  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const clearFilters = () => {
    setSearchAppointmentsTerm('');
    setSearchHistoryTerm('');
    setSearchTodaysTerm('');
    setStatusFilter('all');
    setDateFilter('all');
    setCurrentPage(1);
  };
  
  // Reset page when switching tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const fetchDentalAppointments = (searchTerm = '', sort = 'none', semester = 'all') => {
    setLoadingAppointments(true);
    setAppointmentsError(null);
    const params = {
      type: 'dental',
      status: 'pending,confirmed,scheduled,completed', // Include completed appointments
      ordering: sort === 'none' ? '-appointment_date' : sort,
      search: searchTerm,
    };
    
    // Add semester filter using semester record ID
    if (semester !== 'all') {
      params['school_year'] = semester;
    }
    
    appointmentsAPI.getAll(params)
      .then(res => {
        setDentalAppointments(res.data);
      })
      .catch(error => {
        console.error('Dental appointments error:', error);
        setAppointmentsError(error.message || 'Failed to fetch appointments');
      })
      .finally(() => setLoadingAppointments(false));
  };

  const fetchDentalHistory = (searchTerm = '', filter = 'all', semester = 'all') => {
    setLoadingHistory(true);
    setHistoryError(null);
    const params = {
      type: 'dental',
      status: filter === 'all' ? 'completed,cancelled' : `${filter},cancelled`,
      search: searchTerm,
    };
    
    // Add semester filter using semester record ID
    if (semester !== 'all') {
      params['school_year'] = semester;
    }
    
    appointmentsAPI.getAll(params)
      .then(res => setDentalHistory(res.data))
      .catch(error => setHistoryError(error.message || 'Failed to fetch history'))
      .finally(() => setLoadingHistory(false));
  };

  const fetchTodaysAppointments = (searchTerm = '', filter = 'today', semester = 'all') => {
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
      type: 'dental',
      status: 'confirmed',
      appointment_date_after: startDate?.toISOString().split('T')[0],
      appointment_date_before: endDate?.toISOString().split('T')[0],
      search: searchTerm,
    };
    
    // Add semester filter using semester record ID
    if (semester !== 'all') {
      params['school_year'] = semester;
    }
    
    appointmentsAPI.getAll(params)
      .then(res => setTodaysAppointments(res.data))
      .catch(error => setTodaysAppointmentsError(error.message || 'Failed to fetch today\'s appointments'))
      .finally(() => setLoadingTodaysAppointments(false));
  };

  const fetchSemesters = async () => {
    setLoadingSemesters(true);
    try {
      // Fetch all semester records
      const response = await djangoApiClient.get('/academic-school-years/', {
        params: { ordering: '-academic_year,-semester_type' }
      });
      const semestersData = response.data || [];
      setSemesters(semestersData);
      
      // Extract unique academic years
      const academicYearsList: string[] = [];
      semestersData.forEach((sem: any) => {
        if (sem.academic_year && !academicYearsList.includes(sem.academic_year)) {
          academicYearsList.push(sem.academic_year);
        }
      });
      setAcademicYears(academicYearsList);
      
      // Set current semester
      const currentSemesterData = semestersData.find((sem: any) => sem.is_current);
      if (currentSemesterData) {
        setCurrentSemester(currentSemesterData);
        setSelectedSemester(currentSemesterData.id.toString());
      }
    } catch (error) {
      console.error('Failed to fetch semesters:', error);
    } finally {
      setLoadingSemesters(false);
    }
  };

  // Handle semester change
  const handleSemesterChange = (semesterId: string) => {
    setSelectedSemester(semesterId);
    setSelectedAcademicYear('all'); // Reset academic year filter when selecting specific semester
    
    // Refresh data based on the active tab
    if (activeTab === 'dentalAppointments') {
      fetchDentalAppointments(debouncedSearchAppointmentsTerm, sortAppointmentsBy, semesterId);
    } else if (activeTab === 'history') {
      fetchDentalHistory(debouncedSearchHistoryTerm, filterHistoryBy, semesterId);
    } else if (activeTab === 'todaysAppointments') {
      fetchTodaysAppointments(debouncedSearchTodaysTerm, timeFilter, semesterId);
    }
  };
  
  // Handle academic year change
  const handleAcademicYearChange = (academicYear: string) => {
    setSelectedAcademicYear(academicYear);
    if (academicYear !== 'all') {
      setSelectedSemester('all'); // Reset semester filter when selecting academic year
    }
  };

  const handleApproveAppointment = async (appointmentId: number) => {
    try {
      await appointmentsAPI.update(appointmentId, { status: 'confirmed' });
      setFeedbackModal({ open: true, message: 'Appointment approved successfully!' });
      fetchDentalAppointments(debouncedSearchAppointmentsTerm, sortAppointmentsBy, selectedSemester);
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
      fetchDentalAppointments(debouncedSearchAppointmentsTerm, sortAppointmentsBy, selectedSemester);
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
      fetchDentalAppointments(debouncedSearchAppointmentsTerm, sortAppointmentsBy, selectedSemester);
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

  // Handler for downloading form data as PDF
  const handleDownloadFormData = async (appointment: any) => {
    try {
      const response = await appointmentsAPI.downloadFormData(appointment.id);
      
      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${appointment.form_type}_form_${appointment.patient_name}_${appointment.appointment_date}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Failed to download form data:', error);
      setFeedbackModal({ 
        open: true, 
        message: `Failed to download PDF: ${error.response?.data?.detail || 'Please check the console for more details.'}` 
      });
    }
  };

  // Handler for viewing form data as PDF inline
  const handleViewFormData = async (appointment: any) => {
    try {
      const response = await appointmentsAPI.viewFormData(appointment.id);
      
      // Create a blob from the response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);
      
      // Open the PDF in a new tab
      window.open(url, '_blank');
      
      // Clean up after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error: any) {
      console.error('Failed to view form data:', error);
      setFeedbackModal({ 
        open: true, 
        message: `Failed to view PDF: ${error.response?.data?.detail || 'Please check the console for more details.'}` 
      });
    }
  };

  const handleViewPatientProfile = async (patientId: number) => {
    try {
      const response = await patientsAPI.getById(patientId);
      const patient = response.data;
      
      // Fetch all patient profiles for this user
      let allPatientProfiles: any[] = [];
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

  const handleOpenDentalForm = (appointmentId: number) => {
    router.push(`/dental-form?appointmentId=${appointmentId}`);
  };

  useEffect(() => {
    if (activeTab === 'dentalAppointments') {
      fetchDentalAppointments(debouncedSearchAppointmentsTerm, sortAppointmentsBy, selectedSemester);
    }
  }, [activeTab, sortAppointmentsBy, debouncedSearchAppointmentsTerm, selectedSemester]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchDentalHistory(debouncedSearchHistoryTerm, filterHistoryBy, selectedSemester);
    }
  }, [activeTab, filterHistoryBy, debouncedSearchHistoryTerm, selectedSemester]);

  useEffect(() => {
    if (activeTab === 'todaysAppointments') {
      fetchTodaysAppointments(debouncedSearchTodaysTerm, timeFilter, selectedSemester);
    }
  }, [activeTab, debouncedSearchTodaysTerm, timeFilter, selectedSemester]);

  useEffect(() => {
    fetchSemesters();
  }, []);

  const renderTable = (data: any[], loading: boolean, error: string | null, isHistory = false) => {
    if (loading) return <div className="text-center p-4 sm:p-6 text-sm">Loading...</div>;
    if (error) return <div className="text-center p-4 sm:p-6 text-sm text-red-500">{error}</div>;
    if (data.length === 0) return <div className="text-center p-4 sm:p-6 text-sm">No records found.</div>;
    
    return (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-[#800000]">
          <tr>
            <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Patient Name</th>
            <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Purpose</th>
            <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider">{isHistory ? 'Date' : 'Appointment Time'}</th>
            <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
            {!isHistory && <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Profile</th>}
            {isHistory && <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Reason</th>}
            <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((record: any) => (
            <tr key={record.id} className="hover:bg-gray-50 transition-colors duration-200">
              <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{record.patient_name}</td>
              <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{record.purpose}</td>
              <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{isHistory ? new Date(record.appointment_date).toLocaleString() : record.appointment_time}</td>
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
                 <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                    <button 
                      title="View Profile" 
                      className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
                      onClick={() => handleViewPatientProfile(record.patient)}
                    >
                      <UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                  </td>
              )}
              {isHistory && <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">{record.reason || record.purpose}</td>}
              <td className="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap flex items-center space-x-1 sm:space-x-2">
                {isHistory ? (
                  <>
                    <button 
                      title="View Details" 
                      className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
                      onClick={() => handleViewAppointmentDetails(record)}
                    >
                      <EyeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
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
                      className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
                    >
                      <EyeIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                    </button>
                    
                    {/* Show examination form button only for non-completed appointments */}
                    {record.status !== 'completed' && record.status !== 'cancelled' && (
                      <button 
                        title="Examination Form" 
                        onClick={() => handleOpenDentalForm(record.id)}
                        className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
                      >
                        <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                    )}
                    
                    {/* Show view results button for completed appointments with form data */}
                    {record.status === 'completed' && record.has_form_data && (
                      <>
                        <button 
                          title="View Results" 
                          className="p-1.5 sm:p-2 rounded-full text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                          onClick={() => handleViewFormData(record)}
                        >
                          <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                        <button 
                          title="Download PDF" 
                          className="p-1.5 sm:p-2 rounded-full text-green-400 hover:bg-green-100 hover:text-green-600 transition-colors duration-200"
                          onClick={() => handleDownloadFormData(record)}
                        >
                          <PrinterIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                        </button>
                      </>
                    )}
                    
                    {/* Show approve button only for pending appointments */}
                    {record.status === 'pending' && (
                      <button 
                        title="Approve Appointment" 
                        onClick={() => openConfirmationModal('approve', record.id)} 
                        className="p-1.5 sm:p-2 rounded-full text-green-400 hover:bg-green-100 hover:text-green-600 transition-colors duration-200"
                      >
                        <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                    )}
                    
                    {/* Show reschedule button only for non-completed and non-cancelled appointments */}
                    {record.status !== 'completed' && record.status !== 'cancelled' && (
                      <button 
                        title="Reschedule Appointment" 
                        onClick={() => handleOpenRescheduleModal(record)}
                        className="p-1.5 sm:p-2 rounded-full text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-colors duration-200"
                      >
                        <CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </button>
                    )}
                    
                    {/* Show cancel button only for non-completed and non-cancelled appointments */}
                    {record.status !== 'completed' && record.status !== 'cancelled' && (
                      <button 
                        title="Cancel Appointment" 
                        onClick={() => openConfirmationModal('cancel', record.id)}
                        className="p-1.5 sm:p-2 rounded-full text-red-400 hover:bg-red-100 hover:text-red-600 transition-colors duration-200"
                      >
                        <XIcon className="h-5 w-5 sm:h-6 sm:w-6" />
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
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dental Consultations</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage dental appointments and view consultation history</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex flex-col sm:flex-row justify-between border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                className={`py-2 px-3 sm:py-3 sm:px-6 text-sm sm:text-lg font-medium transition-all duration-200 focus:outline-none whitespace-nowrap ${
                  activeTab === 'dentalAppointments'
                    ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('dentalAppointments')}
              >
                <span className="hidden sm:inline">Dental Appointments</span>
                <span className="sm:hidden">Appointments</span>
              </button>
              <button
                className={`py-2 px-3 sm:py-3 sm:px-6 text-sm sm:text-lg font-medium transition-all duration-200 focus:outline-none whitespace-nowrap ${
                  activeTab === 'todaysAppointments'
                    ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('todaysAppointments')}
              >
                <span className="hidden sm:inline">Today&apos;s Appointments</span>
                <span className="sm:hidden">Today</span>
              </button>
              <button
                className={`py-2 px-3 sm:py-3 sm:px-6 text-sm sm:text-lg font-medium transition-all duration-200 focus:outline-none whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('history')}
              >
                History
              </button>
            </div>
            
            {/* Semester Filters */}
            <div className="py-2 px-3 sm:py-3 sm:px-6 w-full sm:w-auto flex flex-col sm:flex-row gap-2">
              {/* Academic Year Filter */}
              <select
                value={selectedAcademicYear}
                onChange={(e) => handleAcademicYearChange(e.target.value)}
                className="w-full sm:w-48 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
                disabled={loadingSemesters}
              >
                <option value="all">All Academic Years</option>
                {academicYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              
              {/* Semester Filter */}
              <select
                value={selectedSemester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="w-full sm:w-64 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
                disabled={loadingSemesters}
              >
                <option value="all">All Semesters</option>
                {semesters
                  .filter(semester => selectedAcademicYear === 'all' || semester.academic_year === selectedAcademicYear)
                  .map((semester: any) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.academic_year} - {semester.semester_type}
                      {semester.is_current && ' (Current)'}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          <div className="p-3 sm:p-6">
            {activeTab === 'dentalAppointments' && (
              <div>
                {/* Filters Section */}
                <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="space-y-3 sm:space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by patient name..."
                        value={searchAppointmentsTerm}
                        onChange={(e) => setSearchAppointmentsTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
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

                    {/* Filter Row */}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-medium text-gray-700">Filters:</span>
                      
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                      </select>
                      
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none flex-1 sm:flex-none"
                      >
                        <option value="all">All Dates</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                      </select>
                      
                      <select
                        value={sortAppointmentsBy}
                        onChange={(e) => setSortAppointmentsBy(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none flex-1 sm:flex-none"
                      >
                        <option value="none">Sort by Date (Recent)</option>
                        <option value="name">Sort by Name</option>
                        <option value="time">Sort by Time</option>
                      </select>
                      
                      {(searchAppointmentsTerm || statusFilter !== 'all' || dateFilter !== 'all' || sortAppointmentsBy !== 'none') && (
                        <button
                          onClick={clearFilters}
                          className="text-xs sm:text-sm text-red-600 hover:text-red-800 underline w-full sm:w-auto text-center sm:text-left mt-2 sm:mt-0"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>

                    {/* Results Summary */}
                    <div className="text-sm text-gray-600">
                      Showing {paginatedAppointments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredAppointments.length)} of {filteredAppointments.length} appointments
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                  {renderTable(paginatedAppointments, loadingAppointments, appointmentsError)}
                </div>
                
                {/* Pagination */}
                {filteredAppointments.length > 0 && (
                  <div className="bg-gray-50 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between border-t border-gray-200 mt-3 sm:mt-4">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredAppointments.length)}</span> of{' '}
                            <span className="font-medium">{filteredAppointments.length}</span> results
                          </p>
                        </div>
                        <div>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
                          >
                            <option value={5}>5 per page</option>
                            <option value={10}>10 per page</option>
                            <option value={25}>25 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                              currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                              return (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              );
                            })
                            .map((page, index, array) => {
                              if (index > 0 && page - array[index - 1] > 1) {
                                return (
                                  <span key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    ...
                                  </span>
                                );
                              }
                              return (
                                <button
                                  key={page}
                                  onClick={() => handlePageChange(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === page
                                      ? 'z-10 bg-[#800000] border-[#800000] text-white'
                                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                              currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'todaysAppointments' && (
              <div>
                {/* Filters Section */}
                <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search by patient name..."
                        value={searchTodaysTerm}
                        onChange={(e) => setSearchTodaysTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
                      />
                      <svg
                        className="absolute left-2 sm:left-3 top-2 sm:top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
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

                    {/* Filter Row */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm font-medium text-gray-700 w-full sm:w-auto">Filters:</span>
                      
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none flex-1 sm:flex-none"
                      >
                        <option value="all">All Status</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="completed">Completed</option>
                      </select>
                      
                      <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none flex-1 sm:flex-none"
                      >
                        <option value="today">Today</option>
                        <option value="this_week">This Week</option>
                        <option value="this_month">This Month</option>
                      </select>
                      
                      {(searchTodaysTerm || statusFilter !== 'all') && (
                        <button
                          onClick={clearFilters}
                          className="text-xs sm:text-sm text-red-600 hover:text-red-800 underline w-full sm:w-auto text-center sm:text-left mt-2 sm:mt-0"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>

                    {/* Results Summary */}
                    <div className="text-xs sm:text-sm text-gray-600">
                      Showing {paginatedTodaysAppointments.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredTodaysAppointments.length)} of {filteredTodaysAppointments.length} appointments
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                  {renderTable(paginatedTodaysAppointments, loadingTodaysAppointments, todaysAppointmentsError)}
                </div>
                
                {/* Pagination */}
                {filteredTodaysAppointments.length > 0 && (
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredTodaysAppointments.length)}</span> of{' '}
                            <span className="font-medium">{filteredTodaysAppointments.length}</span> results
                          </p>
                        </div>
                        <div>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
                          >
                            <option value={5}>5 per page</option>
                            <option value={10}>10 per page</option>
                            <option value={25}>25 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                              currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                              return (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              );
                            })
                            .map((page, index, array) => {
                              if (index > 0 && page - array[index - 1] > 1) {
                                return (
                                  <span key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    ...
                                  </span>
                                );
                              }
                              return (
                                <button
                                  key={page}
                                  onClick={() => handlePageChange(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === page
                                      ? 'z-10 bg-[#800000] border-[#800000] text-white'
                                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                              currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {/* Filters Section */}
                <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="space-y-4">
                    {/* Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search history..."
                        value={searchHistoryTerm}
                        onChange={(e) => setSearchHistoryTerm(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
                      />
                      <svg
                        className="absolute left-2 sm:left-3 top-2 sm:top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
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

                    {/* Filter Row */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm font-medium text-gray-700 w-full sm:w-auto">Filters:</span>
                      
                      <select
                        value={filterHistoryBy}
                        onChange={(e) => setFilterHistoryBy(e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none flex-1 sm:flex-none"
                      >
                        <option value="all">All Records</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      
                      {(searchHistoryTerm || filterHistoryBy !== 'all') && (
                        <button
                          onClick={clearFilters}
                          className="text-xs sm:text-sm text-red-600 hover:text-red-800 underline w-full sm:w-auto text-center sm:text-left mt-2 sm:mt-0"
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>

                    {/* Results Summary */}
                    <div className="text-xs sm:text-sm text-gray-600">
                      Showing {paginatedHistory.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} records
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                  {renderTable(paginatedHistory, loadingHistory, historyError, true)}
                </div>
                
                {/* Pagination */}
                {filteredHistory.length > 0 && (
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredHistory.length)}</span> of{' '}
                            <span className="font-medium">{filteredHistory.length}</span> results
                          </p>
                        </div>
                        <div>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
                          >
                            <option value={5}>5 per page</option>
                            <option value={10}>10 per page</option>
                            <option value={25}>25 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                              currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                              return (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              );
                            })
                            .map((page, index, array) => {
                              if (index > 0 && page - array[index - 1] > 1) {
                                return (
                                  <span key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    ...
                                  </span>
                                );
                              }
                              return (
                                <button
                                  key={page}
                                  onClick={() => handlePageChange(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === page
                                      ? 'z-10 bg-[#800000] border-[#800000] text-white'
                                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                              currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
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
  const { useState, useEffect } = require('react');
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

export default withAdminAccess(AdminDentalConsultations);