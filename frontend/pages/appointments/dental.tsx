import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { appointmentsAPI, djangoApiClient, dentalWaiversAPI, waiversAPI } from '../../utils/api';

/**
 * DENTAL APPOINTMENT FLOW:
 * 
 * The correct sequential flow for dental appointments is:
 * 1. General Health Waiver (/patient/waiver)
 * 2. Dental Informed Consent (/patient/dental-waiver) 
 * 3. Patient Profile Setup (/patient/profile-setup)
 * 4. Dental Information Record (/patient/dental-information-record)
 * 5. Dental Appointment Booking (/appointments/dental)
 * 
 * Each step redirects to the next step in the sequence when completed,
 * passing the query parameter 'option=Book Dental Consultation' to
 * maintain the flow context throughout the process.
 * 
 * If a user tries to book a dental appointment without completing
 * the prerequisites, they will be redirected to the next required step.
 */

// Type definitions
interface DentistSchedule {
  id: number;
  user: number;
  first_name: string;
  last_name: string;
  position: string;
  campus: string;
  blocked_dates: string[];
  daily_appointment_limit: number;
}

interface Requirements {
  hasAuth: boolean;
  hasWaiver: boolean;
  hasDentalWaiver: boolean;
  hasProfile: boolean;
  hasDentalRecord: boolean;
  patientId: number | null;
  schoolYear: any;
  semester: string | null;
  nextStep: string | null;
  isComplete: boolean;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatTimeRange(open: string, close: string): string {
  return `Open: ${open} - ${close}`;
}

// Note: Campus hours are now determined by dentist schedule
// This function is kept for compatibility but should use dentistSchedule data

// Sequential Requirements Checker
class RequirementsChecker {
  static async checkAllRequirements(): Promise<Requirements> {
    const requirements: Requirements = {
      hasAuth: false,
      hasWaiver: false,
      hasDentalWaiver: false,
      hasProfile: false,
      hasDentalRecord: false,
      patientId: null,
      schoolYear: null,
      semester: null,
      nextStep: null,
      isComplete: false
    };

    try {
      // Step 1: Check authentication
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      console.log('Auth token check:', token ? 'Token found' : 'No token found');
      
      if (!token) {
        console.log('No authentication token found');
        requirements.nextStep = 'login';
        return requirements;
      }
      requirements.hasAuth = true;

      // Step 2: Check general waiver
      try {
        console.log('Checking general waiver status...');
        const waiverResponse = await waiversAPI.checkStatus();
        console.log('Waiver response:', waiverResponse.data);
        requirements.hasWaiver = waiverResponse.data.exists || false;
      } catch (error: any) {
        console.log('Waiver check failed - assuming not signed:', error);
        
        // If it's a 404, it might mean the endpoint doesn't exist or user has no waiver
        if (error.response?.status === 404) {
          console.log('Waiver endpoint returned 404 - assuming no waiver exists');
          requirements.hasWaiver = false;
        } else if (error.response?.status === 401) {
          console.log('Authentication error - redirecting to login');
          requirements.nextStep = 'login';
          return requirements;
        } else {
          console.log('Other waiver check error:', error.message);
          requirements.hasWaiver = false;
        }
      }

      if (!requirements.hasWaiver) {
        requirements.nextStep = 'waiver';
        return requirements;
      }

      // Step 3: Check dental waiver
      try {
        console.log('Checking dental waiver status...');
        const dentalWaiverResponse = await dentalWaiversAPI.checkStatus();
        console.log('Dental waiver response:', dentalWaiverResponse.data);
        requirements.hasDentalWaiver = dentalWaiverResponse.data.has_signed || false;
        console.log('Dental waiver has_signed:', requirements.hasDentalWaiver);
      } catch (error: any) {
        console.log('Dental waiver check failed - assuming not signed:', error);
        console.log('Error response:', error.response);
        
        // If it's a 404, it might mean the endpoint doesn't exist or user has no dental waiver
        if (error.response?.status === 404) {
          console.log('Dental waiver endpoint returned 404 - assuming no dental waiver exists');
          requirements.hasDentalWaiver = false;
        } else if (error.response?.status === 401) {
          console.log('Authentication error - redirecting to login');
          requirements.nextStep = 'login';
          return requirements;
        } else {
          console.log('Other dental waiver check error:', error.message);
          requirements.hasDentalWaiver = false;
        }
      }

      if (!requirements.hasDentalWaiver) {
        requirements.nextStep = 'dental-waiver';
        return requirements;
      }

      // Step 4: Check patient profile and get patient ID
      try {
        const profileResponse = await djangoApiClient.get('/patients/my_profile/');
        if (profileResponse.data?.id) {
          requirements.hasProfile = true;
          requirements.patientId = profileResponse.data.id;
        }
      } catch (error) {
        if (error.response?.status === 404) {
          requirements.hasProfile = false;
        } else {
          console.log('Profile check failed:', error);
          requirements.hasProfile = false;
        }
      }

      if (!requirements.hasProfile) {
        requirements.nextStep = 'profile-setup';
        return requirements;
      }

      // Step 5: Get current school year and semester
      try {
        const schoolYearResponse = await djangoApiClient.get('/academic-school-years/current/');
        if (schoolYearResponse.data) {
          requirements.schoolYear = schoolYearResponse.data;
          requirements.semester = '1st_semester'; // Default
        }
      } catch (error) {
        console.log('School year check failed:', error);
        requirements.semester = '1st_semester'; // Default
      }

      // Step 6: Check dental information record
      try {
        const params: any = {};
        if (requirements.schoolYear?.id) {
          params.school_year = requirements.schoolYear.id;
        }
        if (requirements.semester) {
          params.semester = requirements.semester;
        }

        const dentalRecordResponse = await djangoApiClient.get('/dental-information-records/check_status/', { params });
        requirements.hasDentalRecord = dentalRecordResponse.data.has_completed || false;
      } catch (error) {
        console.log('Dental record check failed - assuming not completed:', error);
        requirements.hasDentalRecord = false;
      }

      if (!requirements.hasDentalRecord) {
        requirements.nextStep = 'dental-information-record';
        return requirements;
      }

      // All requirements met
      requirements.isComplete = true;
      requirements.nextStep = 'appointment';
      return requirements;

    } catch (error) {
      console.error('Requirements check failed:', error);
      requirements.nextStep = 'login';
      return requirements;
    }
  }
}

export default function DentalAppointmentPage() {
  const router = useRouter();
  const [invalidAccess, setInvalidAccess] = useState(false);
  const [campus, setCampus] = useState('A'); // Fixed to Campus A only
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [concern, setConcern] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dentistStaff, setDentistStaff] = useState<DentistSchedule[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<DentistSchedule | null>(null);
  const [availableStaff, setAvailableStaff] = useState<DentistSchedule[]>([]);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<any>(null);
  const [currentSemester, setCurrentSemester] = useState<string>('');
  const [patientId, setPatientId] = useState<number | null>(null);

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

  // Load initial data
  useEffect(() => {
    loadDentistStaff();
    loadCurrentSchoolYear();
    loadPatientProfile();
  }, []);

  // Check available staff when date changes
  useEffect(() => {
    if (date && dentistStaff.length > 0) {
      checkAvailableStaff();
    }
  }, [date, dentistStaff]);

  const checkRequirements = async () => {
    // Removed - this is the final step, no requirements checking needed
  };

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

  const loadPatientProfile = async () => {
    try {
      const profileResponse = await djangoApiClient.get('/patients/my_profile/');
      if (profileResponse.data?.id) {
        setPatientId(profileResponse.data.id);
      }
    } catch (error) {
      console.error('Error loading patient profile:', error);
    }
  };

  const loadDentistStaff = async (): Promise<void> => {
    try {
      const response = await djangoApiClient.get('/staff-details/');
      const allStaff = response.data || [];
      
      // Filter for dentist positions at Campus A
      const dentists = allStaff.filter((staff: any) => 
        ['Dentist', 'Dental Staff'].includes(staff.position) && 
        staff.campus?.toLowerCase() === 'a'
      );
      
      setDentistStaff(dentists);
      
      if (dentists.length === 0) {
        setError('No dentists available for Campus A. Please contact the administrator.');
      }
    } catch (error) {
      console.error('Error loading dentist staff:', error);
      setError('Failed to load dentist information. Please try again later.');
    }
  };

  const checkAvailableStaff = async (): Promise<void> => {
    if (!date || dentistStaff.length === 0) {
      setAvailableStaff([]);
      return;
    }

    try {
      // Get all dental appointments for the selected date
      const appointmentsResponse = await djangoApiClient.get('/appointments/', {
        params: {
          appointment_date: date,
          type: 'dental'
        }
      });

      const dayAppointments = appointmentsResponse.data || [];

      // Filter available staff based on blocked dates and appointment limits
      const available = dentistStaff.filter((staff) => {
        // Check if date is blocked
        const blockedDates = staff.blocked_dates || [];
        if (blockedDates.includes(date)) {
          return false;
        }

        // Check appointment limit
        const staffAppointments = dayAppointments.filter((appt: any) => 
          appt.assigned_staff === staff.id && 
          ['pending', 'confirmed'].includes(appt.status)
        );

        const limit = staff.daily_appointment_limit || 10;
        return staffAppointments.length < limit;
      });

      setAvailableStaff(available);
      
      // Auto-select first available staff
      if (available.length > 0 && !selectedStaff) {
        setSelectedStaff(available[0]);
      } else if (available.length === 0) {
        setSelectedStaff(null);
        setError('No dentists available on this date. Please select another date.');
      } else if (selectedStaff && !available.find(s => s.id === selectedStaff.id)) {
        // If previously selected staff is no longer available, select first available
        setSelectedStaff(available[0]);
      }
    } catch (error) {
      console.error('Error checking available staff:', error);
    }
  };

  // Check if any dentist is available on selected date
  function isDentistAvailable(dateStr: string): boolean {
    if (!dateStr || availableStaff.length === 0) return false;
    return true;
  }

  function getDayOfWeek(dateStr: string): number | null {
    if (!dateStr) return null;
    return new Date(dateStr).getDay();
  }

  function isCampusOpen(campus: string, dateStr: string): boolean {
    // Only Campus A has dental services
    if (campus !== 'A') return false;
    
    // Check if any dentist is available on this day
    return availableStaff.length > 0;
  }

  function isTimeValid(time: string, dateStr: string): boolean {
    if (!time) return false;
    
    // If today, time must be in the future
    const today = new Date();
    const selected = new Date(dateStr + 'T' + time);
    if (dateStr === today.toISOString().slice(0, 10)) {
      if (selected <= today) return false;
    }
    return true;
  }

  function isDateDisabled(dateStr: string): boolean {
    const today = new Date();
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const d = new Date(dateStr);
    if (d < todayMidnight) return true;
    // Beyond 2 months
    const max = addDays(new Date(), 61); // 2 months + 1 day
    if (d > max) return true;
    
    return false;
  }

  function isTimeInputDisabled(): boolean {
    if (!date || isDateDisabled(date) || availableStaff.length === 0) return true;
    return false;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate staff availability
    if (availableStaff.length === 0) {
      setError('No dentists are available on the selected date. Please choose another date.');
      return;
    }

    // Auto-select first available dentist if none selected
    const assignedDentist = selectedStaff || availableStaff[0];
    if (!assignedDentist) {
      setError('No dentists available. Please try another date.');
      return;
    }
    
    // Validate appointment data
    if (!isTimeValid(time, date)) {
      setError('Please select a valid time.');
      return;
    }

    if (!patientId) {
      setError('Patient profile not found. Please ensure you have completed your profile setup.');
      return;
    }
    
    try {
      setLoading(true);
      const appointmentData: any = {
        patient: patientId,
        appointment_date: date,
        appointment_time: time,
        purpose: concern,
        type: 'dental',
        status: 'pending',
        campus: 'a', // Always Campus A for dental
        concern,
        assigned_staff: assignedDentist.id, // Assign the first available dentist
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

  const redirectToNextStep = (step: string) => {
    // Removed - no longer needed as this is the final step
  };

  const renderRequirementsStatus = () => {
    // Removed - no longer showing requirements since this is the final step
    return null;
  };

  // Dummy handlers for Layout
  const handleLoginClick = () => {};
  const handleSignupClick = () => {};

  // For date input min/max
  const todayStr = new Date().toISOString().slice(0, 10);
  const maxDate = addDays(new Date(), 61).toISOString().slice(0, 10);

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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-2xl">
            {submitted ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 className="text-xl font-bold text-green-600">Appointment Submitted!</h3>
                <p className="mt-2 text-sm text-gray-600 text-center">
                  Your dental appointment has been submitted successfully.<br />
                  We will process your request soon.
                </p>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-[#800000] mb-6 text-center">Book Dental Consultation</h1>
                
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
                
                {dentistStaff.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Available Dentists:</strong> {dentistStaff.length}
                    </div>
                    {date && availableStaff.length > 0 && (
                      <div className="text-sm text-green-600">
                        {availableStaff.length} dentist{availableStaff.length !== 1 ? 's' : ''} available on selected date
                      </div>
                    )}
                    {date && availableStaff.length === 0 && dentistStaff.length > 0 && (
                      <div className="text-sm text-red-600">
                        No dentists available on selected date (blocked or limit reached)
                      </div>
                    )}
                  </div>
                )}
                
                {/* Requirements Status */}
                {renderRequirementsStatus()}
                
                {/* Appointment Form */}
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Campus
                      </label>
                      <select
                        value={campus}
                        onChange={(e) => setCampus(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                        disabled={true}
                      >
                        <option value="A">Campus A (Main Campus - Dental Services Available)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date *
                      </label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        min={todayStr}
                        max={maxDate}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                        required
                      />
                      {date && availableStaff.length === 0 && dentistStaff.length > 0 && (
                        <p className="text-red-500 text-sm mt-1">
                          No dentists available on this date. All dentists are blocked or have reached their appointment limit.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time *
                      </label>
                      <input
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                        disabled={isTimeInputDisabled()}
                        required
                      />
                      {isTimeInputDisabled() && (
                        <p className="text-gray-500 text-sm mt-1">
                          Please select a valid date first.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Concern/Purpose *
                      </label>
                      <select
                        value={concern}
                        onChange={(e) => setConcern(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                        required
                      >
                        <option value="">Select the purpose of your visit</option>
                        <option value="Teeth Extraction">Teeth Extraction</option>
                        <option value="Consultation">Consultation</option>
                      </select>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-[#800000] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#600000] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {loading ? 'Submitting...' : 'Submit Appointment Request'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
