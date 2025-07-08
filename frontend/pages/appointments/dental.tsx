import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { appointmentsAPI, djangoApiClient } from '../../utils/api';

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatTimeRange(open, close) {
  return `Open: ${open} - ${close}`;
}

function getCampusHours(campus, day) {
  // Only Campus A has dental services
  if (campus !== 'A') return null;
  if (day === 0) return null; // Sunday closed
  // Check against dentist schedule loaded from backend
  return ['08:00', '17:00']; // Default hours, will be updated by dentist schedule
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

export default function DentalAppointmentPage() {
  const router = useRouter();
  const [campus, setCampus] = useState('A'); // Fixed to Campus A only
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [concern, setConcern] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [existingAppointments, setExistingAppointments] = useState([]);
  const [bookingBlocked, setBookingBlocked] = useState(false);
  const [blockingReason, setBlockingReason] = useState('');
  const [dentistSchedule, setDentistSchedule] = useState(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [currentSchoolYear, setCurrentSchoolYear] = useState(null);
  const [needsProfile, setNeedsProfile] = useState(false);

  // Load dentist schedule and current school year from admin controls
  useEffect(() => {
    loadDentistSchedule();
    loadCurrentSchoolYear();
  }, []);

  const loadDentistSchedule = async () => {
    try {
      const response = await djangoApiClient.get('/admin-controls/dentist_schedules/');
      const schedules = response.data || [];
      
      // Find the dentist schedule for Campus A
      const campusADentist = schedules.find(schedule => 
        schedule.campus === 'a' && schedule.is_active
      );
      
      if (campusADentist) {
        setDentistSchedule(campusADentist);
      }
    } catch (error) {
      console.error('Error loading dentist schedule:', error);
      // Set default schedule if API fails
      setDentistSchedule({
        dentist_name: 'Dr. Maria Santos',
        campus: 'a',
        available_days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        time_slots: ['08:00-09:00', '09:00-10:00', '10:00-11:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'],
        is_active: true
      });
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

  // Check if dentist is available on selected date
  function isDentistAvailable(dateStr) {
    if (!dentistSchedule || !dateStr) return false;
    
    const selectedDate = new Date(dateStr);
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    return dentistSchedule.available_days.includes(dayName);
  }

  // Get available time slots for selected date
  function getAvailableTimeSlots(dateStr) {
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

  function getDayOfWeek(dateStr) {
    if (!dateStr) return null;
    return new Date(dateStr).getDay();
  }

  function isCampusOpen(campus, dateStr) {
    // Only Campus A has dental services
    if (campus !== 'A') return false;
    
    // Check if dentist is available on this day
    return isDentistAvailable(dateStr);
  }

  function isTimeValid(time, dateStr) {
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

  function isDateDisabled(dateStr) {
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

  function isTimeInputDisabled() {
    if (!campusOpen || !date || isDateDisabled(date)) return true;
    
    // Check if there are available time slots
    const slots = getAvailableTimeSlots(date);
    if (slots.length === 0) return true;
    
    return false;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!isCampusOpen(campus, date)) {
      setError('Dental services are not available on the selected day.');
      return;
    }
    if (!isTimeValid(time, date)) {
      setError('Please select a valid time slot from the dentist\'s available schedule.');
      return;
    }
    // Get patient ID from localStorage
    let patientId;
    try {
      patientId = await getPatientId();
    } catch (error) {
      console.error('Error in getPatientId:', error);
      if (error.message && error.message.includes('Please create your profile first')) {
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
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 w-full max-w-md">
          {submitted ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <h3 className="text-xl font-bold text-green-600">Appointment Submitted!</h3>
              <p className="mt-2 text-sm text-gray-600 text-center">Your dental appointment has been submitted successfully.<br />We will process your request soon.</p>
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                  <select 
                    value={campus} 
                    onChange={e => setCampus(e.target.value)} 
                    className="block w-full border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000] bg-gray-100"
                    disabled
                  >
                    <option value="A">Campus A (Dental Services Only)</option>
                  </select>
                  <div className="mt-1 text-xs text-gray-500">
                    Dental services are only available at Campus A
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    required 
                    min={todayStr} 
                    max={maxDate} 
                    className={`block w-full border-gray-300 rounded-lg py-2 px-3 ${isDateDisabled(date) ? 'bg-gray-200 text-gray-400' : ''}`} 
                  />
                  {date && !isDentistAvailable(date) && (
                    <div className="mt-1 text-xs text-red-600">
                      Dentist is not available on this day
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                  {date && currentTimeSlots.length > 0 ? (
                    <select
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      required
                      className="block w-full border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
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
                      onChange={e => setTime(e.target.value)} 
                      required 
                      className="block w-full border-gray-300 rounded-lg py-2 px-3 bg-gray-200 text-gray-400 cursor-not-allowed" 
                      disabled 
                    />
                  )}
                  <div className="mt-1 text-center text-xs text-gray-500">
                    {date && currentTimeSlots.length > 0 
                      ? `${currentTimeSlots.length} slots available` 
                      : date 
                        ? 'No slots available' 
                        : 'Select a date first'
                    }
                  </div>
                </div>
                {!campusOpen && date && (
                  <div className="text-red-600 text-sm font-semibold text-center py-2 bg-red-50 rounded-lg">
                    Dental services are not available on the selected day.
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dental Concern</label>
                  <textarea 
                    value={concern} 
                    onChange={e => setConcern(e.target.value)} 
                    required 
                    rows={3} 
                    className="block w-full border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]" 
                    disabled={!campusOpen || isDateDisabled(date)} 
                  />
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
                  disabled={loading || !campusOpen || isDateDisabled(date) || !isTimeValid(time, date)}
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}