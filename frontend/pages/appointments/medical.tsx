import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { appointmentsAPI, djangoApiClient } from '../../utils/api';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatTimeRange(open, close) {
  return `Open: ${open} - ${close}`;
}

// Helper function to get patient ID from localStorage
async function getPatientId() {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    console.error('No user data found in localStorage');
    return null;
  }
  
  try {
    const user = JSON.parse(userStr);
    console.log('User data from localStorage:', user);
    
    // Try multiple ways to get patient ID based on backend structure
    if (user.patient_profile) {
      console.log('Using patient_profile:', user.patient_profile);
      return user.patient_profile;
    }
    
    if (user.patient?.id) {
      console.log('Using patient.id:', user.patient.id);
      return user.patient.id;
    }
    
    // If no patient_profile field exists, try to get current patient profile from backend
    if (user.id) {
      console.log('No patient_profile found, trying to fetch from backend...');
      try {
        // Try the patient profile endpoint
        const response = await djangoApiClient.get('/patients/my_profile/');
        console.log('Backend response:', response.data);
        
        if (response.data?.id) {
          console.log('Got patient ID from backend:', response.data.id);
          return response.data.id;
        }
        
        // If no ID in response, try the patients list endpoint
        const listResponse = await djangoApiClient.get(`/patients/?user=${user.id}`);
        console.log('Patient list response:', listResponse.data);
        
        if (listResponse.data?.results && listResponse.data.results.length > 0) {
          const userProfile = listResponse.data.results[0];
          console.log('Got patient ID from list:', userProfile.id);
          return userProfile.id;
        }
        
        if (Array.isArray(listResponse.data) && listResponse.data.length > 0) {
          const userProfile = listResponse.data[0];
          console.log('Got patient ID from array:', userProfile.id);
          return userProfile.id;
        }
        
      } catch (error) {
        console.error('Failed to fetch patient profile:', error);
        
        // If profile doesn't exist, the user needs to create one first
        if (error.response?.status === 404) {
          console.error('Patient profile not found - user needs to create profile first');
          throw new Error('No patient profile found. Please create your profile first by going to the profile setup page.');
        }
        
        // For other errors, just log and continue
        console.error('Error fetching patient profile:', error);
        throw error;
      }
    }
    
    console.error('No valid patient ID found');
    return null;
  } catch (error) {
    console.error('Error getting patient ID:', error);
    throw error;
  }
}

export default function MedicalAppointmentPage() {
  const router = useRouter();
  const [invalidAccess, setInvalidAccess] = useState(false);
  const [campus, setCampus] = useState('');
  const [date, setDate] = useState('');
  const [availableCampuses, setAvailableCampuses] = useState<string[]>([]);
  const [calendarDate, setCalendarDate] = useState<Dayjs | null>(null);

  // Validate navigation token to prevent direct URL access
  useEffect(() => {
    const validateNavigation = () => {
      const { token } = router.query;
      const storedToken = sessionStorage.getItem('appointment_navigation_token');
      const timestamp = sessionStorage.getItem('navigation_timestamp');
      
      // Check if token exists and matches
      if (!token || !storedToken || token !== storedToken) {
        setInvalidAccess(true);
        setTimeout(() => router.push('/'), 2000);
        return false;
      }
      
      // Check if token is expired (5 minutes)
      if (timestamp) {
        const tokenAge = Date.now() - parseInt(timestamp);
        if (tokenAge > 5 * 60 * 1000) { // 5 minutes
          setInvalidAccess(true);
          sessionStorage.removeItem('appointment_navigation_token');
          sessionStorage.removeItem('appointment_option');
          sessionStorage.removeItem('navigation_timestamp');
          setTimeout(() => router.push('/'), 2000);
          return false;
        }
      }
      
      return true;
    };
    
    if (router.isReady) {
      validateNavigation();
    }
  }, [router.isReady, router.query]);
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [bookingBlocked, setBookingBlocked] = useState(false);
  const [blockingReason, setBlockingReason] = useState('');
  const [currentSchoolYear, setCurrentSchoolYear] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [campusSchedule, setCampusSchedule] = useState(null);
  const [medicalStaff, setMedicalStaff] = useState([]);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [availableStaff, setAvailableStaff] = useState([]);

  // Check for existing appointments and load current school year on component mount
  useEffect(() => {
    checkExistingAppointments();
    loadCurrentSchoolYear();
    loadInitialMedicalStaff();
  }, []);

  // Load campus schedule and medical staff when campus changes
  useEffect(() => {
    if (campus) {
      loadCampusSchedule();
      loadMedicalStaff();
    }
  }, [campus]);

  // Check available staff when date changes
  useEffect(() => {
    if (date && medicalStaff.length > 0) {
      checkAvailableStaff();
    }
  }, [date, medicalStaff]);

  const loadCampusSchedule = async () => {
    try {
      const response = await djangoApiClient.get('/admin-controls/campus_schedules/');
      const schedules = response.data || [];
      
      console.log('Campus schedules loaded:', schedules);
      console.log('Looking for campus:', campus);
      
      // Find the schedule for the selected campus - handle multiple formats
      const selectedSchedule = schedules.find((schedule: any) => {
        const scheduleCampus = schedule.campus?.toString().toUpperCase().trim();
        const selectedCampus = campus.toUpperCase().trim();
        
        // Match: "A" with "A", "Campus A" with "A", "a" with "A", etc.
        return scheduleCampus === selectedCampus || 
               scheduleCampus === `CAMPUS ${selectedCampus}` ||
               scheduleCampus?.endsWith(selectedCampus);
      });
      
      if (selectedSchedule) {
        console.log('Found campus schedule:', selectedSchedule);
        setCampusSchedule(selectedSchedule);
      } else {
        console.warn('No campus schedule found, using default');
        // Set default schedule if not found
        const defaultSchedule = {
          campus: campus,
          open_time: '08:00',
          close_time: '17:00',
          days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          is_active: true
        };
        setCampusSchedule(defaultSchedule);
      }
    } catch (error) {
      console.error('Error loading campus schedule:', error);
      // Set default schedule if API fails
      const defaultSchedule = {
        campus: campus,
        open_time: '08:00',
        close_time: '17:00',
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        is_active: true
      };
      setCampusSchedule(defaultSchedule);
    }
  };

  const checkExistingAppointments = async () => {
    try {
      const patientId = await getPatientId();
      if (!patientId) return;

      // Fetch all user's appointments
      const res = await appointmentsAPI.getAll();
      const userAppointments = res.data || [];
      setExistingAppointments(userAppointments);

      // Check if booking should be blocked
      const blocking = checkBookingRestrictions(userAppointments);
      setBookingBlocked(blocking.blocked);
      setBlockingReason(blocking.reason);
    } catch (err) {
      console.error('Failed to fetch existing appointments:', err);
      // Don't block booking if we can't check existing appointments
    }
  };

  const checkBookingRestrictions = (appointments) => {
    const now = new Date();
    
    // Check for pending or confirmed appointments
    const activeSessions = appointments.filter(appt => 
      appt.status === 'pending' || appt.status === 'confirmed'
    );
    
    if (activeSessions.length > 0) {
      return {
        blocked: true,
        reason: 'You already have a pending or confirmed appointment. Please wait for it to be completed or cancelled before booking another.'
      };
    }
    
    return { blocked: false, reason: '' };
  };

  const loadMedicalStaff = async () => {
    try {
      const response = await djangoApiClient.get('/staff-details/');
      const allStaff = response.data || [];
      
      console.log('Loading medical staff for campus:', campus);
      console.log('All staff data:', allStaff);
      
      // Filter for medical staff (not dentists) assigned to selected campus
      const medicalStaffFiltered = allStaff.filter((staff) => {
        const positions = ['Doctor', 'Nurse', 'Medical Staff', 'Administrator'];
        const hasCorrectPosition = positions.includes(staff.position);
        
        if (!hasCorrectPosition) return false;
        
        // Extract campus letter from various formats
        const extractCampusLetter = (value: string): string => {
          if (!value) return '';
          const str = value.toString().toLowerCase().trim();
          // Extract single letter from formats like "a", "campus a", "Campus A", etc.
          const match = str.match(/[abc]/);
          return match ? match[0] : '';
        };
        
        // Check if assigned to selected campus - handle both fields
        let staffCampuses: string[] = [];
        
        // Check assigned_campuses field (array or string)
        if (staff.assigned_campuses) {
          if (Array.isArray(staff.assigned_campuses)) {
            staffCampuses = staff.assigned_campuses.map(extractCampusLetter).filter(c => c);
          } else {
            staffCampuses = staff.assigned_campuses.toString().split(',').map(extractCampusLetter).filter(c => c);
          }
        }
        
        // Also check single campus field
        if (staff.campus) {
          const campusLetter = extractCampusLetter(staff.campus);
          if (campusLetter && !staffCampuses.includes(campusLetter)) {
            staffCampuses.push(campusLetter);
          }
        }
        
        const selectedCampusLetter = campus.toLowerCase().trim();
        const isAssignedToCampus = staffCampuses.includes(selectedCampusLetter);
        
        console.log('Staff:', staff.first_name, staff.last_name, 'Campuses:', staffCampuses, 'Match:', isAssignedToCampus);
        
        return isAssignedToCampus;
      });
      
      console.log('Filtered medical staff:', medicalStaffFiltered);
      setMedicalStaff(medicalStaffFiltered);
    } catch (error) {
      console.error('Error loading medical staff:', error);
      setMedicalStaff([]);
    }
  };

  const loadInitialMedicalStaff = async () => {
    console.log('=== loadInitialMedicalStaff CALLED ===');
    try {
      const response = await djangoApiClient.get('/staff-details/');
      const allStaff = response.data || [];
      
      console.log('=== Initial staff load - All staff:', allStaff);
      
      // Filter for medical staff (not dentists)
      const positions = ['Doctor', 'Nurse', 'Medical Staff', 'Administrator'];
      const medicalStaffFiltered = allStaff.filter((staff) => 
        positions.includes(staff.position)
      );
      
      console.log('=== Medical staff filtered:', medicalStaffFiltered);
      
      // Helper function to extract campus letter from various formats
      const extractCampusLetter = (value: string): string => {
        if (!value) return '';
        const str = value.toString().toLowerCase().trim();
        // Extract single letter from formats like "a", "campus a", "Campus A", etc.
        const match = str.match(/[abc]/);
        return match ? match[0] : '';
      };
      
      // Extract unique campuses from medical staff
      const campusesSet = new Set<string>();
      medicalStaffFiltered.forEach((staff) => {
        console.log('=== Staff member:', staff.first_name, staff.last_name, {
          position: staff.position,
          campus: staff.campus,
          assigned_campuses: staff.assigned_campuses
        });
        
        // Check assigned_campuses field (array or string)
        if (staff.assigned_campuses) {
          const campusValues = Array.isArray(staff.assigned_campuses) 
            ? staff.assigned_campuses 
            : staff.assigned_campuses.toString().split(',');
          
          campusValues.forEach((c: string) => {
            const letter = extractCampusLetter(c);
            if (letter) {
              campusesSet.add(letter);
            }
          });
        }
        
        // Also check single campus field
        if (staff.campus) {
          const letter = extractCampusLetter(staff.campus);
          if (letter) {
            campusesSet.add(letter);
          }
        }
      });
      
      // Convert to uppercase and sort
      const campusesList = Array.from(campusesSet).map(c => c.toUpperCase()).sort();
      
      console.log('=== Available campuses extracted:', campusesList);
      console.log('=== Setting availableCampuses state to:', campusesList);
      setAvailableCampuses(campusesList);
      
      // Set default campus to first available
      if (campusesList.length > 0 && !campus) {
        console.log('=== Setting default campus to:', campusesList[0]);
        setCampus(campusesList[0]);
      } else {
        console.log('=== NOT setting default campus. campusesList.length:', campusesList.length, 'current campus:', campus);
      }
    } catch (error) {
      console.error('=== Error loading initial medical staff:', error);
      // Fallback to default campuses if API fails
      console.log('=== Using fallback campuses [A, B, C]');
      setAvailableCampuses(['A', 'B', 'C']);
      if (!campus) {
        setCampus('A');
      }
    }
  };

  const checkAvailableStaff = async () => {
    if (!date) {
      setAvailableStaff([]);
      return;
    }

    try {
      // Get all appointments for the selected date
      const appointmentsResponse = await djangoApiClient.get('/appointments/', {
        params: {
          appointment_date: date,
          type: 'medical'
        }
      });
      const dayAppointments = appointmentsResponse.data || [];

      // Filter staff who are available on this date
      const available = medicalStaff.filter((staff) => {
        // Check if date is blocked
        const blockedDates = staff.blocked_dates || [];
        if (blockedDates.includes(date)) {
          return false;
        }

        // Check if staff is available on this day of the week
        const dayName = !dayjs(date).isValid() ? '' : dayjs(date).format('dddd');
        const availableDays = staff.available_days || [];
        if (availableDays.length > 0 && !availableDays.includes(dayName)) {
          return false;
        }

        // Count appointments for this staff on this date
        const staffAppointments = dayAppointments.filter((appt) => 
          appt.assigned_staff === staff.id && 
          ['pending', 'confirmed'].includes(appt.status)
        );

        const appointmentLimit = staff.daily_appointment_limit || 10;
        return staffAppointments.length < appointmentLimit;
      });

      setAvailableStaff(available);
      
      // Auto-select first available staff
      if (available.length > 0 && !selectedStaff) {
        setSelectedStaff(available[0]);
      } else if (available.length === 0) {
        setSelectedStaff(null);
      }
    } catch (error) {
      console.error('Error checking staff availability:', error);
      setAvailableStaff([]);
    }
  };

  const loadCurrentSchoolYear = async () => {
    try {
      const response = await djangoApiClient.get('/academic-school-years/current/');
      if (response.data) {
        setCurrentSchoolYear(response.data);
      }
    } catch (error) {
      console.error('Error loading current school year:', error);
      // Continue without school year if API fails
    }
  };

  function getDayOfWeek(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr).getDay();
  }

  function isCampusOpen(campus, dateStr) {
    if (!campusSchedule) {
      console.log('No campus schedule loaded');
      return false;
    }
    
    const selectedDate = new Date(dateStr);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    console.log('Checking if campus open:', {
      date: dateStr,
      dayName: dayName,
      campusScheduleDays: campusSchedule.days,
      isIncluded: campusSchedule.days.includes(dayName)
    });
    
    return campusSchedule.days.includes(dayName);
  }

  function getCampusHours(campus, day) {
    if (!campusSchedule) return null;
    
    // If no date selected yet, show campus operating hours
    if (!date) {
      return [campusSchedule.open_time, campusSchedule.close_time];
    }
    
    // If date is selected, check if campus is open on that day
    if (!isCampusOpen(campus, date)) return null;
    
    return [campusSchedule.open_time, campusSchedule.close_time];
  }

  function isTimeValid(time, dateStr) {
    if (!time || !campusSchedule) return false;
    
    const [h, m] = time.split(':').map(Number);
    const [openH, openM] = campusSchedule.open_time.split(':').map(Number);
    const [closeH, closeM] = campusSchedule.close_time.split(':').map(Number);
    
    // Check if time is within campus operating hours
    const timeMinutes = h * 60 + m;
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;
    
    if (timeMinutes < openMinutes || timeMinutes >= closeMinutes) return false;
    
    // If today, time must be in the future
    const today = new Date();
    const selected = new Date(dateStr + 'T' + time);
    if (dateStr === today.toISOString().slice(0, 10)) {
      if (selected <= today) return false;
    }
    return true;
  }

  function isDateDisabled(dateVal: Dayjs): boolean {
    const today = dayjs().startOf('day');
    const maxDate = dayjs().add(3, 'month');
    
    // Check if in past or beyond range
    if (dateVal.isBefore(today)) return true;
    if (dateVal.isAfter(maxDate)) return true;
    
    // Check if campus is open on this day using dynamic schedule
    const dayName = dateVal.format('dddd');
    const operatingDays = campusSchedule?.operating_days || campusSchedule?.days || [];
    if (operatingDays.length > 0 && !operatingDays.includes(dayName)) return true;
    
    return false;
  }

  function isTimeInputDisabled() {
    if (!campusSchedule || !date || !calendarDate || isDateDisabled(calendarDate)) return true;
    
    // Check if campus is open on selected date
    if (!isCampusOpen(campus, date)) return true;
    
    // If today, only allow if before closing time
    const today = new Date();
    if (date === today.toISOString().slice(0, 10)) {
      const [closeH] = campusSchedule.close_time.split(':').map(Number);
      if (today.getHours() >= closeH - 1) return true; // Stop booking 1 hour before closing
    }
    return false;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (bookingBlocked) {
      setError(blockingReason);
      return;
    }

    // Check if staff is available
    if (availableStaff.length === 0) {
      setError('No medical staff available on this date. Please try another date.');
      return;
    }

    // Auto-select first available staff if none selected
    const assignedStaff = selectedStaff || availableStaff[0];
    if (!assignedStaff) {
      setError('No medical staff available. Please try another date.');
      return;
    }
    if (!isTimeValid(time, date)) {
      const openTime = campusSchedule?.open_time || '08:00';
      const closeTime = campusSchedule?.close_time || '17:00';
      setError(`Please select a valid time between ${openTime} and ${closeTime} that is not in the past.`);
      return;
    }
    
    // Get patient ID from localStorage
    let patientId;
    try {
      patientId = await getPatientId();
    } catch (err: any) {
      console.error('Error in getPatientId:', err);
      if (err.message && err.message.includes('Please create your profile first')) {
        setNeedsProfile(true);
        setError('You need to create your patient profile before booking appointments.');
      } else {
        setError('Could not determine your patient ID. Please try logging in again or contact support.');
      }
      return;
    }
    
    if (!patientId) {
      // Don't assume they need to create profile, could be other issues
      setError('Could not determine your patient ID. Please try logging in again or contact support if the issue persists.');
      return;
    }
    
    setLoading(true);
    try {
      const appointmentData: any = {
        patient: patientId,
        appointment_date: date,
        appointment_time: time,
        purpose: reason,
        type: 'medical',
        status: 'pending',
        concern: '',
        assigned_staff: assignedStaff.id,
      };

      // Add school year if available
      if (currentSchoolYear?.id) {
        appointmentData.school_year = currentSchoolYear.id;
      }

      await appointmentsAPI.create(appointmentData);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit appointment.');
    } finally {
      setLoading(false);
    }
  };

  // Dummy handlers for Layout
  const handleLoginClick = () => {};
  const handleSignupClick = () => {};

  const day = getDayOfWeek(date);
  const campusOpen = isCampusOpen(campus, date);
  const hours = getCampusHours(campus, day);

  // For date input min/max
  const todayStr = new Date().toISOString().slice(0, 10);
  const maxDate = addDays(new Date(), 90).toISOString().slice(0, 10); // 3 months

  return (
    <Layout onLoginClick={handleLoginClick} onSignupClick={handleSignupClick}>
      {invalidAccess ? (
        <div className="flex flex-col items-center justify-center min-h-screen px-4">
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-8 max-w-md text-center">
            <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-2xl font-bold text-red-800 mb-2">Invalid Access</h2>
            <p className="text-red-700 mb-4">
              You cannot access this page directly. Please go through the proper booking flow.
            </p>
            <p className="text-sm text-gray-600">Redirecting to home page...</p>
          </div>
        </div>
      ) : (
      <div className="min-h-[80vh] flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-md">
          {submitted ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <h3 className="text-xl font-bold text-green-600">Appointment Submitted!</h3>
              <p className="mt-2 text-sm text-gray-600 text-center">Your medical appointment has been submitted successfully.<br />We will process your request soon.</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-[#800000] mb-6 text-center">Book Medical Consultation</h1>
              
              {currentSchoolYear && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-green-800">
                    <strong>School Year:</strong> {currentSchoolYear.academic_year}
                  </div>
                  <div className="text-xs text-green-600">
                    Your appointment will be recorded for this school year
                  </div>
                </div>
              )}

              {/* Booking restrictions warning */}
              {bookingBlocked && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-red-800">Booking Not Available</h3>
                      <p className="text-sm text-red-700 mt-1">{blockingReason}</p>
                    </div>
                  </div>
                </div>
              )}

              {medicalStaff.length > 0 && (!date || isCampusOpen(campus, date)) && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <strong>Available Medical Staff:</strong> {medicalStaff.length}
                  </div>
                  {date && availableStaff.length > 0 && (
                    <div className="text-sm text-green-600">
                      {availableStaff.length} staff member{availableStaff.length !== 1 ? 's' : ''} available on selected date
                    </div>
                  )}
                  {date && availableStaff.length === 0 && medicalStaff.length > 0 && (
                    <div className="text-sm text-red-600">
                      No staff available on selected date (blocked or limit reached)
                    </div>
                  )}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                  <select 
                    value={campus} 
                    onChange={e => setCampus(e.target.value)} 
                    className="block w-full border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                    disabled={availableCampuses.length === 0}
                  >
                    {availableCampuses.length === 0 ? (
                      <option value="">No campuses available</option>
                    ) : (
                      availableCampuses.map((campusLetter) => (
                        <option key={campusLetter} value={campusLetter}>
                          Campus {campusLetter}
                        </option>
                      ))
                    )}
                  </select>
                  {availableCampuses.length === 0 && (
                    <p className="text-sm text-red-600 mt-1">
                      No medical staff available at any campus
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Appointment Date *</label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DateCalendar
                        value={calendarDate}
                        onChange={(newValue: Dayjs | null) => {
                          if (newValue) {
                            setCalendarDate(newValue);
                            setDate(newValue.format('YYYY-MM-DD'));
                          }
                        }}
                        shouldDisableDate={isDateDisabled}
                        minDate={dayjs().startOf('year')}
                        maxDate={dayjs().endOf('year')}
                        slots={{
                          day: (dayProps: any) => {
                            const dateStr = dayProps.day.format('YYYY-MM-DD');
                            const dayName = dayProps.day.format('dddd');
                            
                            // Check if campus is closed on this day
                            const operatingDays = campusSchedule?.operating_days || campusSchedule?.days || [];
                            const isCampusClosed = operatingDays.length > 0 && !operatingDays.includes(dayName);
                            
                            // Highlight currently selected date if it has no staff
                            const isSelected = calendarDate && dayProps.day.isSame(calendarDate, 'day');
                            const hasNoStaff = isSelected && availableStaff.length === 0;

                            return (
                              <div className="relative">
                                <PickersDay 
                                  {...dayProps} 
                                  sx={{
                                    ...(hasNoStaff && {
                                      backgroundColor: '#fee2e2 !important',
                                      color: '#991b1b !important',
                                      border: '1px solid #dc2626 !important',
                                    })
                                  }}
                                />
                                {isCampusClosed && (
                                  <div className="absolute top-1 right-1 w-1 h-1 bg-gray-400 rounded-full"></div>
                                )}
                              </div>
                            );
                          }
                        }}
                        sx={{
                          width: '100%',
                          '& .MuiPickersCalendarHeader-root': {
                            color: '#800000',
                          },
                          '& .MuiDayCalendar-weekDayLabel': {
                            color: '#800000',
                            fontWeight: 'bold',
                          },
                          '& .MuiPickersDay-today': {
                            border: '1px solid #800000 !important',
                          },
                          '& .Mui-selected': {
                            backgroundColor: '#800000 !important',
                            color: 'white !important',
                          },
                          '& .Mui-selected:hover': {
                            backgroundColor: '#600000 !important',
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </div>
                  {date && availableStaff.length === 0 && medicalStaff.length > 0 && (
                    <p className="text-red-500 text-sm mt-1 font-medium">
                      No medical staff available on {dayjs(date).format('MMMM D, YYYY')}. All staff are blocked or have reached their appointment limit.
                    </p>
                  )}
                  {date && (
                    <p className="mt-2 text-sm text-gray-600 flex items-center">
                      <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Selected: <span className="font-bold ml-1">{dayjs(date).format('MMMM D, YYYY')}</span>
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} required min="08:00" max="17:00" className={`block w-full border-gray-300 rounded-lg py-2 px-3 ${isTimeInputDisabled() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}`} disabled={isTimeInputDisabled()} />
                  <div className="mt-1 text-center text-xs text-gray-500">
                    {hours ? formatTimeRange(hours[0], hours[1]) : 'Closed'}
                  </div>
                  {date && !isCampusOpen(campus, date) && (
                    <div className="text-red-600 text-xs font-semibold mt-1 text-center">
                      Campus is closed on this day. Please select a weekday.
                    </div>
                  )}
                  {date === new Date().toISOString().slice(0, 10) && new Date().getHours() >= 11 && (
                    <div className="text-red-600 text-xs font-semibold mt-1 text-center">Same-day appointments end at 11:00 AM.</div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} required rows={3} className="block w-full border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]" disabled={!campusOpen || !hours || !calendarDate || isDateDisabled(calendarDate)} />
                </div>
                {error && (
                  <div className="text-red-600 text-sm font-semibold text-center">
                    {error}
                    {needsProfile && (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => router.push('/patient/profile-setup')}
                          className="text-blue-600 hover:text-blue-800 underline text-sm"
                        >
                          Create Profile Now
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <button 
                  type="submit" 
                  className="w-full py-2.5 bg-[#800000] text-white rounded-lg font-semibold hover:bg-[#a83232] transition-all duration-200 shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed" 
                  disabled={bookingBlocked || loading || !campusOpen || !hours || !calendarDate || isDateDisabled(calendarDate) || !isTimeValid(time, date)}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      )}
    </Layout>
  );
}