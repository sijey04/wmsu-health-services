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
  dentist_name: string;
  campus: string;
  available_days: string[];
  time_slots: string[];
  is_active: boolean;
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

function getCampusHours(campus: string, day: number): string[] | null {
  // Only Campus A has dental services
  if (campus !== 'A') return null;
  if (day === 0) return null; // Sunday closed
  return ['08:00', '17:00']; // Default hours
}

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
  const [campus, setCampus] = useState('A'); // Fixed to Campus A only
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [concern, setConcern] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dentistSchedule, setDentistSchedule] = useState<DentistSchedule | null>(null);
  const [currentSchoolYear, setCurrentSchoolYear] = useState<any>(null);
  const [currentSemester, setCurrentSemester] = useState<string>('');
  const [patientId, setPatientId] = useState<number | null>(null);

  // Load initial data
  useEffect(() => {
    loadDentistSchedule();
    loadCurrentSchoolYear();
    loadPatientProfile();
  }, []);

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

  const loadDentistSchedule = async (): Promise<void> => {
    try {
      const response = await djangoApiClient.get('/admin-controls/dentist_schedules/');
      const schedules = response.data || [];
      
      // Find the dentist schedule for Campus A
      const campusADentist = schedules.find((schedule: any) => 
        schedule.campus === 'a' && schedule.is_active
      );
      
      if (campusADentist) {
        setDentistSchedule(campusADentist);
      }
    } catch (error) {
      console.error('Error loading dentist schedule:', error);
      // Set default schedule if API fails
      const defaultSchedule: DentistSchedule = {
        dentist_name: 'Dr. Maria Santos',
        campus: 'a',
        available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        time_slots: ['08:00-09:00', '09:00-10:00', '10:00-11:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'],
        is_active: true
      };
      setDentistSchedule(defaultSchedule);
    }
  };

  // Check if dentist is available on selected date
  function isDentistAvailable(dateStr: string): boolean {
    if (!dentistSchedule || !dateStr) return false;
    
    const selectedDate = new Date(dateStr);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    return dentistSchedule.available_days.includes(dayName);
  }

  // Get available time slots for selected date
  function getAvailableTimeSlots(dateStr: string): string[] {
    if (!isDentistAvailable(dateStr) || !dentistSchedule) return [];
    
    const today = new Date();
    const selectedDate = new Date(dateStr);
    const isToday = dateStr === today.toISOString().slice(0, 10);
    
    return dentistSchedule.time_slots.filter(slot => {
      if (!isToday) return true;
      
      // For same day appointments, filter out past time slots
      const [startTime] = slot.split('-');
      const [hours, minutes] = startTime.split(':').map(Number);
      const slotTime = new Date(today);
      slotTime.setHours(hours, minutes, 0, 0);
      
      return slotTime > today;
    });
  }

  function getDayOfWeek(dateStr: string): number | null {
    if (!dateStr) return null;
    return new Date(dateStr).getDay();
  }

  function isCampusOpen(campus: string, dateStr: string): boolean {
    // Only Campus A has dental services
    if (campus !== 'A') return false;
    
    // Check if dentist is available on this day
    return isDentistAvailable(dateStr);
  }

  function isTimeValid(time: string, dateStr: string): boolean {
    if (!time || !dentistSchedule) return false;
    
    // Check if the selected time is within available time slots
    const availableSlots = getAvailableTimeSlots(dateStr);
    const isTimeInSlot = availableSlots.some(slot => {
      const [startTime, endTime] = slot.split('-');
      return time >= startTime && time < endTime;
    });
    
    if (!isTimeInSlot) return false;
    
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
    
    // Check if dentist is available on this day
    if (!isDentistAvailable(dateStr)) return true;
    
    return false;
  }

  function isTimeInputDisabled(): boolean {
    if (!isCampusOpen(campus, date) || !date || isDateDisabled(date)) return true;
    
    // Check if there are available time slots
    const slots = getAvailableTimeSlots(date);
    if (slots.length === 0) return true;
    
    return false;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate appointment data
    if (!isCampusOpen(campus, date)) {
      setError('Dental services are not available on the selected day.');
      return;
    }
    if (!isTimeValid(time, date)) {
      setError('Please select a valid time slot from the dentist\'s available schedule.');
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

  const day = getDayOfWeek(date);
  const campusOpen = isCampusOpen(campus, date);
  const currentTimeSlots = getAvailableTimeSlots(date);

  // For date input min/max
  const todayStr = new Date().toISOString().slice(0, 10);
  const maxDate = addDays(new Date(), 61).toISOString().slice(0, 10);

  return (
    <Layout onLoginClick={handleLoginClick} onSignupClick={handleSignupClick}>
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
                
                {dentistSchedule && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>Dentist:</strong> {dentistSchedule.dentist_name}
                    </div>
                    <div className="text-sm text-blue-600">
                      Available: {dentistSchedule.available_days.join(', ')}
                    </div>
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
                      {date && !isCampusOpen(campus, date) && (
                        <p className="text-red-500 text-sm mt-1">
                          Dental services are not available on this day. Please select a weekday.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time *
                      </label>
                      {currentTimeSlots.length > 0 ? (
                        <select
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                          disabled={isTimeInputDisabled()}
                          required
                        >
                          <option value="">Select a time slot</option>
                          {currentTimeSlots.map(slot => (
                            <option key={slot} value={slot.split('-')[0]}>
                              {slot}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="time"
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                          disabled={isTimeInputDisabled()}
                          required
                        />
                      )}
                      {isTimeInputDisabled() && (
                        <p className="text-gray-500 text-sm mt-1">
                          Please select a valid date first to see available time slots.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Concern/Purpose *
                      </label>
                      <textarea
                        value={concern}
                        onChange={(e) => setConcern(e.target.value)}
                        placeholder="Please describe your dental concern or the purpose of your visit"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                        rows={4}
                        required
                      />
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
    </Layout>
  );
}
