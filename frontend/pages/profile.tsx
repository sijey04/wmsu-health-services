import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../components/Layout';
import { UserIcon, DocumentTextIcon, ClipboardDocumentListIcon, CalendarIcon, PhoneIcon, MapPinIcon, HeartIcon } from '@heroicons/react/24/outline';

interface User {
  id: number;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  grade_level?: string;
  user_type: string;
  is_email_verified: boolean;
  patient_profile?: number;
}

interface PatientProfile {
  id: number;
  student_id: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  suffix?: string;
  photo?: string;
  gender: string;
  date_of_birth?: string;
  age?: number;
  department?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  blood_type?: string;
  religion?: string;
  nationality?: string;
  civil_status?: string;
  emergency_contact_surname?: string;
  emergency_contact_first_name?: string;
  emergency_contact_middle_name?: string;
  emergency_contact_number?: string;
  emergency_contact_relationship?: string;
  emergency_contact_address?: string;
  created_at: string;
  updated_at: string;
}

interface MedicalDocument {
  id: number;
  patient: number;
  chest_xray?: string;
  cbc?: string;
  blood_typing?: string;
  urinalysis?: string;
  drug_test?: string;
  hepa_b?: string;
  medical_certificate?: string;
  status: string;
  submitted_for_review: boolean;
  reviewed_by?: number;
  reviewed_at?: string;
  rejection_reason?: string;
  certificate_issued_at?: string;
  is_complete: boolean;
  completion_percentage: number;
}

interface Appointment {
  id: number;
  patient: number;
  doctor?: number;
  appointment_date: string;
  appointment_time: string;
  purpose: string;
  status: string;
  notes?: string;
  rejection_reason?: string;
  type: string;
  concern?: string;
  campus: string;
  created_at: string;
  updated_at: string;
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [medicalDocument, setMedicalDocument] = useState<MedicalDocument | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Check if user is incoming freshman
  const isIncomingFreshman = () => {
    if (!user) return false;
    const gradeLevel = user.grade_level?.toLowerCase() || '';
    return gradeLevel.includes('grade 12') || 
           gradeLevel.includes('incoming freshman') ||
           gradeLevel.includes('freshman') ||
           gradeLevel === '12';
  };

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/');
        return;
      }

      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (e) {
          console.error('Error parsing user data:', e);
          router.push('/');
          return;
        }
      }
    };

    checkAuth();
  }, [router]);

  // Fetch patient profile
  useEffect(() => {
    const fetchPatientProfile = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/api/patients/my-profile/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPatientProfile(data);
        } else if (response.status === 404) {
          // No profile found - user needs to create one
          setPatientProfile(null);
        }
      } catch (error) {
        console.error('Error fetching patient profile:', error);
        setError('Failed to load profile data');
      }
    };

    if (user) {
      fetchPatientProfile();
    }
  }, [user]);

  // Fetch medical documents for incoming freshmen
  useEffect(() => {
    const fetchMedicalDocuments = async () => {
      if (!user || !isIncomingFreshman()) return;

      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/api/medical-documents/my-documents/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMedicalDocument(data);
        }
      } catch (error) {
        console.error('Error fetching medical documents:', error);
      }
    };

    if (user && isIncomingFreshman()) {
      fetchMedicalDocuments();
    }
  }, [user]);

  // Fetch appointments for consultation results
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/api/appointments/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAppointments(data);
        }
      } catch (error) {
        console.error('Error fetching appointments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleSignupClick = () => {
    router.push('/signup');
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setPasswordChangeLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/auth/change-password/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword,
        }),
      });

      if (response.ok) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setShowPasswordChange(false);
        alert('Password changed successfully!');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'issued':
        return 'bg-green-100 text-green-800';
      case 'verified':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} isLoggedIn={!!user}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#800000]"></div>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: 'personal', name: 'Personal Information', icon: UserIcon },
    { id: 'consultations', name: 'Consultation Results', icon: ClipboardDocumentListIcon },
    ...(isIncomingFreshman() ? [{ id: 'medical', name: 'Medical Certificate', icon: DocumentTextIcon }] : [])
  ];

  return (
    <Layout onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} isLoggedIn={!!user}>
      <Head>
        <title>Profile - WMSU Health Services</title>
      </Head>

      <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          {/* Header */}
          
          {error && (
            <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-md p-3 sm:p-4">
              <div className="flex">
                <div className="ml-2 sm:ml-3">
                  <h3 className="text-xs sm:text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Completion Notice */}
          {patientProfile && (patientProfile.age === 0 || !patientProfile.date_of_birth || !patientProfile.contact_number || patientProfile.gender === 'Other') && (
            <div className="mb-4 sm:mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-3 sm:p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.485 3.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 3.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-2 sm:ml-3">
                  <h3 className="text-xs sm:text-sm font-medium text-yellow-800">Complete Your Profile</h3>
                  <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-yellow-700">
                    Your profile is incomplete. Please update your information to ensure you receive the best health services.
                  </div>
                  <div className="mt-3 sm:mt-4">
                    <button
                      onClick={() => router.push('/patient/profile')}
                      className="text-xs sm:text-sm bg-yellow-100 text-yellow-800 px-2.5 sm:px-3 py-1 rounded-md hover:bg-yellow-200"
                    >
                      Update Profile Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Card */}
          <div className="bg-white shadow rounded-lg mb-4 sm:mb-8">
            <div className="px-4 sm:px-6 py-4 sm:py-8">
              <div className="flex flex-col sm:flex-row items-center sm:space-x-6 space-y-4 sm:space-y-0">
                <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-[#800000] flex items-center justify-center text-white text-xl sm:text-2xl font-bold flex-shrink-0">
                  {patientProfile?.photo ? (
                    <img 
                      src={patientProfile.photo} 
                      alt="Profile" 
                      className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover"
                    />
                  ) : (
                    (user?.first_name?.[0] || user?.email?.[0] || '?').toUpperCase()
                  )}
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {patientProfile?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    {patientProfile?.student_id?.startsWith('TEMP-') 
                      ? 'Student ID not set - Please update your profile' 
                      : patientProfile?.student_id || 'Student ID not set'
                    }
                  </p>
                  <p className="text-sm sm:text-base text-gray-600">{patientProfile?.department || 'Department not set'}</p>
                  {isIncomingFreshman() && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                      Incoming Freshman
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white shadow rounded-lg">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-4 sm:space-x-8 px-3 sm:px-6 overflow-x-auto" aria-label="Tabs">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`${
                        activeTab === tab.id
                          ? 'border-[#800000] text-[#800000]'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1.5 sm:space-x-2`}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-3 sm:p-6">
              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <div className="space-y-6">
                  {/* Account Information Section */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
                        <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                        Account Information
                      </h3>
                      <button
                        onClick={() => setShowPasswordChange(!showPasswordChange)}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-3 py-1.5 sm:py-1 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000]"
                      >
                        Change Password
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <dt className="text-xs sm:text-sm font-medium text-gray-500">Email Address</dt>
                        <dd className="text-sm text-gray-900 mt-1">{user?.email}</dd>
                      </div>
                      <div>
                        <dt className="text-xs sm:text-sm font-medium text-gray-500">User Type</dt>
                        <dd className="text-sm text-gray-900 mt-1 capitalize">{user?.user_type}</dd>
                      </div>
                      <div>
                        <dt className="text-xs sm:text-sm font-medium text-gray-500">First Name</dt>
                        <dd className="text-sm text-gray-900 mt-1">{user?.first_name || 'Not set'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Middle Name</dt>
                        <dd className="text-sm text-gray-900 mt-1">{user?.middle_name || 'Not set'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                        <dd className="text-sm text-gray-900 mt-1">{user?.last_name || 'Not set'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Grade Level</dt>
                        <dd className="text-sm text-gray-900 mt-1">{user?.grade_level || 'Not set'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Email Verification</dt>
                        <dd className="text-sm mt-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user?.is_email_verified 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user?.is_email_verified ? 'Verified' : 'Not Verified'}
                          </span>
                        </dd>
                      </div>
                    </div>

                    {/* Password Change Form */}
                    {showPasswordChange && (
                      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                        <h4 className="text-sm sm:text-md font-medium text-gray-900 mb-3 sm:mb-4">Change Password</h4>
                        <form onSubmit={handlePasswordChange} className="space-y-3 sm:space-y-4">
                          <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                              Current Password
                            </label>
                            <input
                              type="password"
                              id="currentPassword"
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#800000] focus:border-[#800000] sm:text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                              New Password
                            </label>
                            <input
                              type="password"
                              id="newPassword"
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#800000] focus:border-[#800000] sm:text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              id="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#800000] focus:border-[#800000] sm:text-sm"
                              required
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 sm:space-x-3">
                            <button
                              type="submit"
                              disabled={passwordChangeLoading}
                              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-[#800000] hover:bg-[#600000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000] disabled:opacity-50"
                            >
                              {passwordChangeLoading ? 'Updating...' : 'Update Password'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowPasswordChange(false)}
                              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000]"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}                  </div>
                </div>
              )}

              {/* Consultation Results Tab */}
              {activeTab === 'consultations' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Your Appointments & Consultations</h3>
                    <button
                      onClick={() => router.push('/appointments')}
                      className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-[#800000] hover:bg-[#600000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000]"
                    >
                      Book New Appointment
                    </button>
                  </div>

                  {appointments.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <CalendarIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        You haven&apos;t booked any appointments yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {appointments.map((appointment) => (
                        <div key={appointment.id} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 shadow-sm">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h4 className="text-base sm:text-lg font-medium text-gray-900">{appointment.purpose}</h4>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                                  {appointment.status}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                  {appointment.type}
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Date:</span> {formatDate(appointment.appointment_date)}
                                </div>
                                <div>
                                  <span className="font-medium">Time:</span> {formatTime(appointment.appointment_time)}
                                </div>
                                <div>
                                  <span className="font-medium">Campus:</span> {appointment.campus}
                                </div>
                                <div>
                                  <span className="font-medium">Created:</span> {formatDate(appointment.created_at)}
                                </div>
                              </div>
                              {appointment.concern && (
                                <div className="mt-3">
                                  <span className="font-medium text-sm text-gray-600">Concern:</span>
                                  <p className="text-sm text-gray-900 mt-1">{appointment.concern}</p>
                                </div>
                              )}
                              {appointment.notes && (
                                <div className="mt-3">
                                  <span className="font-medium text-sm text-gray-600">Notes:</span>
                                  <p className="text-sm text-gray-900 mt-1">{appointment.notes}</p>
                                </div>
                              )}
                              {appointment.rejection_reason && (
                                <div className="mt-3">
                                  <span className="font-medium text-sm text-red-600">Rejection Reason:</span>
                                  <p className="text-sm text-red-900 mt-1">{appointment.rejection_reason}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Medical Certificate Tab (only for incoming freshmen) */}
              {activeTab === 'medical' && isIncomingFreshman() && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Medical Certificate Request</h3>
                    {(!medicalDocument || medicalDocument.id === null) && (
                      <button
                        onClick={() => router.push('/medical-papers')}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-[#800000] hover:bg-[#600000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000]"
                      >
                        Start Medical Certificate Request
                      </button>
                    )}
                  </div>

                  {!medicalDocument || medicalDocument.id === null ? (
                    <div className="text-center py-8 sm:py-12">
                      <DocumentTextIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No medical certificate request found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        As an incoming freshman, you can request a medical certificate by uploading your medical documents.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Status Overview */}
                      <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                          <h4 className="text-base sm:text-lg font-medium text-gray-900">Certificate Status</h4>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(medicalDocument.status)}`}>
                            {medicalDocument.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Completion</dt>
                            <dd className="text-sm text-gray-900">{medicalDocument.completion_percentage}%</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">Submitted for Review</dt>
                            <dd className="text-sm text-gray-900">{medicalDocument.submitted_for_review ? 'Yes' : 'No'}</dd>
                          </div>
                          {medicalDocument.certificate_issued_at && (
                            <div>
                              <dt className="text-sm font-medium text-gray-500">Issued Date</dt>
                              <dd className="text-sm text-gray-900">{formatDate(medicalDocument.certificate_issued_at)}</dd>
                            </div>
                          )}
                        </div>

                        {medicalDocument.rejection_reason && (
                          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                            <h5 className="text-sm font-medium text-red-800">Rejection Reason</h5>
                            <p className="text-sm text-red-700 mt-1">{medicalDocument.rejection_reason}</p>
                          </div>
                        )}
                      </div>

                      {/* Document Progress */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                        <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Required Documents</h4>
                        <div className="space-y-3">
                          {[
                            { key: 'chest_xray', label: 'Chest X-ray' },
                            { key: 'cbc', label: 'Complete Blood Count (CBC)' },
                            { key: 'blood_typing', label: 'Blood Typing' },
                            { key: 'urinalysis', label: 'Urinalysis' },
                            { key: 'drug_test', label: 'Drug Test' },
                            { key: 'hepa_b', label: 'Hepatitis B Test' }
                          ].map((doc) => (
                            <div key={doc.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                              <span className="text-sm font-medium text-gray-900">{doc.label}</span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                medicalDocument[doc.key as keyof MedicalDocument]
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {medicalDocument[doc.key as keyof MedicalDocument] ? 'Uploaded' : 'Missing'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Medical Certificate Download */}
                      {medicalDocument.medical_certificate && medicalDocument.status === 'issued' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 sm:p-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0">
                            <DocumentTextIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 sm:mr-3" />
                            <div className="flex-1">
                              <h4 className="text-base sm:text-lg font-medium text-green-900">Medical Certificate Ready</h4>
                              <p className="text-xs sm:text-sm text-green-700 mt-1">
                                Your medical certificate has been issued and is ready for download.
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const certificateUrl = medicalDocument.medical_certificate!;
                                // Handle both relative and absolute URLs
                                const downloadUrl = certificateUrl.startsWith('http') 
                                  ? certificateUrl 
                                  : `http://localhost:8000${certificateUrl.startsWith('/') ? '' : '/'}${certificateUrl}`;
                                
                                const link = document.createElement('a');
                                link.href = downloadUrl;
                                link.download = `Medical_Certificate_${patientProfile?.student_id || 'certificate'}.pdf`;
                                link.target = '_blank'; // Open in new tab as fallback
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Download Certificate
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          onClick={() => router.push('/medical-papers')}
                          className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-[#800000] hover:bg-[#600000] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000]"
                        >
                          Manage Documents
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
