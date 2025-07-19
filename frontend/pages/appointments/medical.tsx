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
  if (day === 0) return null; // Sunday closed
  if (day === 6) return campus === 'A' ? ['08:00', '17:00'] : null; // Sat: only A open
  return ['08:00', '17:00']; // M-F all open
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
  const [campus, setCampus] = useState('A');
  const [date, setDate] = useState('');
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

  // Check for existing appointments and load current school year on component mount
  useEffect(() => {
    checkExistingAppointments();
    loadCurrentSchoolYear();
  }, []);

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
    const day = getDayOfWeek(dateStr);
    if (day === null) return true;
    if (day === 0) return false; // Sunday
    if (day === 6) return campus === 'A'; // Saturday: only A open
    return true; // M-F all open
  }

  function isTimeValid(time, dateStr) {
    if (!time) return false;
    const [h, m] = time.split(':').map(Number);
    if (h < 8 || h > 17 || (h === 17 && m > 0)) return false;
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
    // Beyond 3 months (changed from 2 months)
    const max = addDays(new Date(), 90); // 3 months
    if (d > max) return true;
    const day = d.getDay();
    if (day === 0) return true;
    if (day === 6 && campus !== 'A') return true;
    return false;
  }

  function isTimeInputDisabled() {
    if (!campusOpen || !hours || !date || isDateDisabled(date)) return true;
    // If today, only allow if before 11:00 AM
    const today = new Date();
    if (date === today.toISOString().slice(0, 10)) {
      if (today.getHours() >= 11) return true;
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
    
    if (!isCampusOpen(campus, date)) {
      setError('Selected campus is closed on this day.');
      return;
    }
    if (!isTimeValid(time, date)) {
      setError('Please select a valid time between 08:00 and 17:00 that is not in the past.');
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
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Campus</label>
                  <select value={campus} onChange={e => setCampus(e.target.value)} className="block w-full border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]">
                    <option value="A">Campus A</option>
                    <option value="B">Campus B</option>
                    <option value="C">Campus C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required min={todayStr} max={maxDate} className={`block w-full border-gray-300 rounded-lg py-2 px-3 ${isDateDisabled(date) ? 'bg-gray-200 text-gray-400' : ''}`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input type="time" value={time} onChange={e => setTime(e.target.value)} required min="08:00" max="17:00" className={`block w-full border-gray-300 rounded-lg py-2 px-3 ${isTimeInputDisabled() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}`} disabled={isTimeInputDisabled()} />
                  <div className="mt-1 text-center text-xs text-gray-500">
                    {hours ? formatTimeRange(hours[0], hours[1]) : 'Closed'}
                  </div>
                  {date === new Date().toISOString().slice(0, 10) && new Date().getHours() >= 11 && (
                    <div className="text-red-600 text-xs font-semibold mt-1 text-center">Same-day appointments end at 11:00 AM.</div>
                  )}
                </div>
                {!campusOpen && date && (
                  <div className="text-red-600 text-sm font-semibold text-center py-2 bg-red-50 rounded-lg">This campus is closed on the selected day.</div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
                  <textarea value={reason} onChange={e => setReason(e.target.value)} required rows={3} className="block w-full border-gray-300 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]" disabled={!campusOpen || !hours || isDateDisabled(date)} />
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
                  disabled={bookingBlocked || loading || !campusOpen || !hours || isDateDisabled(date) || !isTimeValid(time, date)}
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