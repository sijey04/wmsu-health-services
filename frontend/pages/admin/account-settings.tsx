import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import AdminLayout from '../../components/AdminLayout';
import FeedbackModal from '../../components/feedbackmodal';
import { djangoApiClient } from '../../utils/api';
import SignaturePad from 'signature_pad';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import dayjs, { Dayjs } from 'dayjs';

export default function AdminAccountSettings() {
  // User account states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePic, setProfilePic] = useState(null);
  
  // Staff details states
  const [staffDetails, setStaffDetails] = useState({
    full_name: '',
    position: '',
    license_number: '',
    ptr_number: '',
    phone_number: '',
    assigned_campuses: [],
    signature: null,
    available_days: [],
    time_slots: [],
    blocked_dates: [],
    daily_appointment_limit: 10
  });
  const [signatureFile, setSignatureFile] = useState(null);
  const [currentSignature, setCurrentSignature] = useState('');
  
  // Position options - dynamically loaded from backend
  const [positionOptions, setPositionOptions] = useState<string[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(true);
  
  // Signature pad refs
  const sigPad = useRef<any>(null);
  const signaturePadInstance = useRef<any>(null);
  
  // UI states
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [staffDetailsLoading, setStaffDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('account');

  const campusOptions = [
    { value: 'a', label: 'Campus A' },
    { value: 'b', label: 'Campus B' },
    { value: 'c', label: 'Campus C' }
  ];

  useEffect(() => {
    fetchUserData();
    fetchPositionOptions();
  }, []);

  useEffect(() => {
    // Initialize signature pad when staff tab is active
    if (activeTab === 'staff' && sigPad.current && !signaturePadInstance.current) {
      signaturePadInstance.current = new SignaturePad(sigPad.current, {
        penColor: 'black',
        backgroundColor: 'white'
      });
    }
  }, [activeTab]);

  const fetchPositionOptions = async () => {
    setLoadingPositions(true);
    try {
      // Fetch positions from staff roles endpoint
      const response = await djangoApiClient.get('/admin-controls/staff-roles/');
      if (response.data && Array.isArray(response.data)) {
        setPositionOptions(response.data.map((role: any) => role.label || role.name));
      }
    } catch (error) {
      console.warn('Failed to fetch positions from backend, using defaults');
      // Fallback to default positions
      setPositionOptions([
        'Administrator',
        'Medical Staff',
        'Doctor',
        'Nurse',
        'Dentist',
        'Dental Staff',
        'General Staff',
        'Receptionist'
      ]);
    } finally {
      setLoadingPositions(false);
    }
  };

  const fetchUserData = async () => {
    setLoading(true);
    try {
      // Fetch user data
      const userResponse = await djangoApiClient.get('/users/me/');
      const userData = userResponse.data;
      
      // Auto-fill account information
      const fullName = userData.get_full_name || 
                      `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || 
                      userData.username || 
                      'Admin User';
      
      setName(fullName);
      setEmail(userData.email || 'admin@wmsuhealth.com');

      console.log('User data loaded:', {
        id: userData.id,
        email: userData.email,
        fullName: fullName,
        isStaff: userData.is_staff,
        userType: userData.user_type
      });

      // Fetch staff details if user is staff
      if (userData.is_staff || userData.user_type === 'staff') {
        console.log('User is staff, fetching staff details...');
        setStaffDetailsLoading(true);
        try {
          const staffResponse = await djangoApiClient.get('/staff-details/my_details/');
          const staffData = staffResponse.data;
          
          console.log('Staff details loaded:', staffData);
          
          // Auto-fill staff details from API response
          setStaffDetails({
            full_name: staffData.full_name || fullName,
            position: staffData.position || '',
            license_number: staffData.license_number || '',
            ptr_number: staffData.ptr_number || '',
            phone_number: staffData.phone_number || '',
            assigned_campuses: staffData.assigned_campuses ? 
              (typeof staffData.assigned_campuses === 'string' ? 
                staffData.assigned_campuses.split(',').filter(c => c.trim()) : 
                staffData.assigned_campuses) : 
              ['a'],
            signature: staffData.signature,
            available_days: staffData.available_days || [],
            time_slots: staffData.time_slots || [],
            blocked_dates: staffData.blocked_dates || [],
            daily_appointment_limit: staffData.daily_appointment_limit || 10
          });
          setCurrentSignature(staffData.signature || '');
          
        } catch (staffError: any) {
          console.log('Staff details fetch error:', staffError);
          if (staffError.response?.status === 404) {
            console.log('No staff details found. Auto-filling from user data.');
            // Auto-fill staff details from user data for new staff user
            setStaffDetails({
              full_name: fullName,
              position: userData.user_type === 'admin' ? 'Administrator' : 'Staff',
              license_number: '',
              ptr_number: '',
              phone_number: '',
              assigned_campuses: ['a'], // Default to Campus A
              signature: null,
              available_days: [],
              time_slots: [],
              blocked_dates: [],
              daily_appointment_limit: 10
            });
          } else {
            console.error('Error fetching staff details:', staffError);
            // Still auto-fill basic info even on other errors
            setStaffDetails({
              full_name: fullName,
              position: userData.user_type === 'admin' ? 'Administrator' : 'Staff',
              license_number: '',
              ptr_number: '',
              phone_number: '',
              assigned_campuses: ['a'], // Default to Campus A
              signature: null,
              available_days: [],
              time_slots: [],
              blocked_dates: [],
              daily_appointment_limit: 10
            });
          }
        } finally {
          setStaffDetailsLoading(false);
        }
      } else {
        console.log('User is not staff, skipping staff details');
        // Auto-fill basic staff details even for non-staff users (they might become staff)
        setStaffDetails({
          full_name: fullName,
          position: '',
          license_number: '',
          ptr_number: '',
          phone_number: '',
          assigned_campuses: ['a'],
          signature: null,
          available_days: [],
          time_slots: [],
          blocked_dates: [],
          daily_appointment_limit: 10
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setFeedbackMessage('Failed to load user data');
      setFeedbackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate passwords if changing
      if (newPassword && newPassword !== confirmPassword) {
        setFeedbackMessage('New passwords do not match');
        setFeedbackOpen(true);
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('first_name', name.split(' ')[0]);
      formData.append('last_name', name.split(' ').slice(1).join(' ') || '');
      formData.append('email', email);
      
      if (currentPassword && newPassword) {
        formData.append('current_password', currentPassword);
        formData.append('new_password', newPassword);
      }

      if (profilePic) {
        formData.append('profile_picture', profilePic);
      }

      await djangoApiClient.put('/users/me/', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });

      setFeedbackMessage('Account settings updated successfully!');
      setFeedbackOpen(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setFeedbackMessage(error.response?.data?.message || 'Failed to update account');
      setFeedbackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffDetailsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('full_name', staffDetails.full_name);
      formData.append('position', staffDetails.position);
      formData.append('license_number', staffDetails.license_number || '');
      formData.append('ptr_number', staffDetails.ptr_number || '');
      formData.append('phone_number', staffDetails.phone_number || '');
      formData.append('assigned_campuses', staffDetails.assigned_campuses.join(','));
      formData.append('available_days', JSON.stringify(staffDetails.available_days));
      formData.append('time_slots', JSON.stringify(staffDetails.time_slots));
      formData.append('blocked_dates', JSON.stringify(staffDetails.blocked_dates));
      formData.append('daily_appointment_limit', staffDetails.daily_appointment_limit.toString());

      // Check if signature pad has a signature
      if (signaturePadInstance.current && !signaturePadInstance.current.isEmpty()) {
        const signatureDataURL = signaturePadInstance.current.toDataURL();
        
        // Convert data URL to blob
        const response = await fetch(signatureDataURL);
        const blob = await response.blob();
        
        // Create a file from the blob
        const signatureFile = new File([blob], 'signature.png', { type: 'image/png' });
        formData.append('signature', signatureFile);
      } else if (signatureFile) {
        formData.append('signature', signatureFile);
      }

      console.log('Saving staff details to:', '/staff-details/my_details/');
      console.log('Django API base URL:', djangoApiClient.defaults.baseURL);
      console.log('Full URL will be:', djangoApiClient.defaults.baseURL + '/staff-details/my_details/');
      console.log('Form data being sent:', Object.fromEntries(formData.entries()));
      
      const response = await djangoApiClient.put('/staff-details/my_details/', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Staff details saved successfully:', response.data);
      setFeedbackMessage('Staff details updated successfully!');
      setFeedbackOpen(true);
      setSignatureFile(null);
      
      // Refresh data
      fetchUserData();
    } catch (error: any) {
      console.error('Error saving staff details:', error);
      console.error('Error response:', error.response?.data);
      setFeedbackMessage(error.response?.data?.detail || error.response?.data?.message || 'Failed to update staff details');
      setFeedbackOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCampusChange = (campusValue: string) => {
    const updatedCampuses = staffDetails.assigned_campuses.includes(campusValue)
      ? staffDetails.assigned_campuses.filter(c => c !== campusValue)
      : [...staffDetails.assigned_campuses, campusValue];
    
    setStaffDetails({
      ...staffDetails,
      assigned_campuses: updatedCampuses
    });
  };

  const clearSignature = () => {
    if (signaturePadInstance.current) {
      signaturePadInstance.current.clear();
    }
  };

  return (
    <AdminLayout>
      <FeedbackModal
        open={feedbackOpen}
        message={feedbackMessage}
        onClose={() => setFeedbackOpen(false)}
      />
      
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
        <h1 className="text-3xl font-bold text-[#800000] mb-8">Account Settings</h1>

        {/* Tab Navigation */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('account')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'account'
                  ? 'border-[#800000] text-[#800000]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Account Information
            </button>
            <button
              onClick={() => setActiveTab('staff')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'staff'
                  ? 'border-[#800000] text-[#800000]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Staff Details
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'schedule'
                  ? 'border-[#800000] text-[#800000]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Working Schedule
            </button>
          </nav>
        </div>

        {/* Account Information Tab */}
        {activeTab === 'account' && (
          <form onSubmit={handleAccountSave} className="space-y-8">
            {/* Profile Picture */}
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl text-gray-400 font-bold overflow-hidden">
                {profilePic ? (
                  <Image src={URL.createObjectURL(profilePic)} alt="Profile" width={96} height={96} className="w-24 h-24 rounded-full object-cover" />
                ) : (
                  <span>{name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setProfilePic(e.target.files?.[0] || null)} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#800000] file:text-white hover:file:bg-[#a83232]" 
                />
              </div>
            </div>

            {/* Name & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]" 
                  required
                />
              </div>
            </div>

            {/* Password Change */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Change Password</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <input 
                    type="password" 
                    placeholder="Current Password" 
                    value={currentPassword} 
                    onChange={e => setCurrentPassword(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]" 
                  />
                </div>
                <div>
                  <input 
                    type="password" 
                    placeholder="New Password" 
                    value={newPassword} 
                    onChange={e => setNewPassword(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]" 
                  />
                </div>
                <div>
                  <input 
                    type="password" 
                    placeholder="Confirm New Password" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]" 
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Leave blank to keep current password</p>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-[#800000] text-white rounded-lg font-semibold hover:bg-[#a83232] transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Account Changes'}
            </button>
          </form>
        )}

        {/* Staff Details Tab */}
        {activeTab === 'staff' && (
          <>
            {staffDetailsLoading && (
              <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
                Loading staff details...
              </div>
            )}
            <form onSubmit={handleStaffDetailsSave} className="space-y-8">
            {/* Staff Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={staffDetails.full_name} 
                  onChange={e => setStaffDetails({...staffDetails, full_name: e.target.value})} 
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]" 
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <select
                  value={staffDetails.position}
                  onChange={e => setStaffDetails({...staffDetails, position: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                  required
                  disabled={loadingPositions}
                >
                  <option value="">{loadingPositions ? 'Loading positions...' : 'Select Position'}</option>
                  {positionOptions.map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">License Number</label>
                <input 
                  type="text" 
                  value={staffDetails.license_number} 
                  onChange={e => setStaffDetails({...staffDetails, license_number: e.target.value})} 
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">PTR Number</label>
                <input 
                  type="text" 
                  value={staffDetails.ptr_number} 
                  onChange={e => setStaffDetails({...staffDetails, ptr_number: e.target.value})} 
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <input 
                type="tel" 
                value={staffDetails.phone_number} 
                onChange={e => setStaffDetails({...staffDetails, phone_number: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]" 
              />
            </div>

            {/* Campus Assignment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Assigned Campuses</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {campusOptions.map(campus => (
                  <label key={campus.value} className="flex items-center space-x-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={staffDetails.assigned_campuses.includes(campus.value)}
                      onChange={() => handleCampusChange(campus.value)}
                      className="w-5 h-5 text-[#800000] border-gray-300 rounded focus:ring-[#800000]"
                    />
                    <span className="text-sm font-medium text-gray-700">{campus.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">Digital Signature</label>
              
              {/* Current Signature Display */}
              {currentSignature && (
                <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-2">Current Signature:</p>
                  <Image 
                    src={currentSignature} 
                    alt="Current signature" 
                    width={300}
                    height={96}
                    className="max-h-24 border border-gray-300 rounded bg-white p-2"
                  />
                </div>
              )}

              {/* Signature Pad */}
              <div className="mb-4">
                <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-medium text-gray-700 mb-2">Draw Your Signature:</p>
                  <div className="relative">
                    <canvas
                      ref={sigPad}
                      width={600}
                      height={150}
                      className="border border-gray-300 rounded bg-white w-full"
                      style={{ maxWidth: '100%', height: '150px' }}
                    />
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded px-2 py-1 hover:bg-red-600 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Draw your signature in the box above. You can clear it and redraw if needed.
                  </p>
                </div>
              </div>

              {/* Fallback File Upload */}
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Or upload a signature image:</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={e => setSignatureFile(e.target.files?.[0] || null)} 
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#800000] file:text-white hover:file:bg-[#a83232]" 
                />
                
                {signatureFile && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Signature Preview:</p>
                    <Image 
                      src={URL.createObjectURL(signatureFile)} 
                      alt="Uploaded signature preview" 
                      width={300}
                      height={96}
                      className="max-h-24 border border-gray-300 rounded bg-white p-2"
                    />
                  </div>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Note: The drawn signature will take priority over uploaded files.
                </p>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-[#800000] text-white rounded-lg font-semibold hover:bg-[#a83232] transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Staff Details'}
            </button>
          </form>
          </>
        )}

        {/* Working Schedule Tab */}
        {activeTab === 'schedule' && (
          <>
            {staffDetailsLoading && (
              <div className="mb-6 p-4 bg-blue-100 border border-blue-400 text-blue-700 rounded-lg">
                Loading schedule details...
              </div>
            )}
            <form onSubmit={handleStaffDetailsSave} className="space-y-8">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      Your working days and hours are set by administrators in the Campus Schedules. Here you can block specific dates when you&apos;re unavailable and set your daily appointment limit.
                    </p>
                  </div>
                </div>
              </div>

              {/* Daily Appointment Limit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Daily Appointment Limit</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={staffDetails.daily_appointment_limit}
                  onChange={(e) => setStaffDetails({...staffDetails, daily_appointment_limit: parseInt(e.target.value) || 1})}
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Maximum number of appointments you can accept per day (1-50)
                </p>
              </div>

              {/* Blocked Dates Calendar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">Blocked Dates</label>
                <p className="text-sm text-blue-700 mb-4">
                  Block specific dates when you won&apos;t be available for appointments. Blocked dates will prevent patients from booking on those days.
                </p>

                <div className="space-y-6">
                  {/* Enhanced MUI Calendar */}
                  <div className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-[#800000] to-[#a83232] p-4">
                      <h3 className="text-white font-semibold text-lg flex items-center">
                        <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Select Dates to Block
                      </h3>
                      <p className="text-white text-sm mt-1 opacity-90">Click any date to block or unblock it</p>
                    </div>
                    
                    <div className="p-6 flex justify-center">
                      <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <DateCalendar
                          value={null}
                          minDate={dayjs()}
                          onChange={(newValue: Dayjs | null) => {
                            if (newValue) {
                              const dateString = newValue.format('YYYY-MM-DD');
                              if (staffDetails.blocked_dates.includes(dateString)) {
                                // Remove date if already blocked
                                setStaffDetails({
                                  ...staffDetails,
                                  blocked_dates: staffDetails.blocked_dates.filter(d => d !== dateString)
                                });
                              } else {
                                // Add date to blocked list
                                setStaffDetails({
                                  ...staffDetails,
                                  blocked_dates: [...staffDetails.blocked_dates, dateString].sort()
                                });
                              }
                            }
                          }}
                          slots={{
                            day: (dayProps: any) => {
                              const dateString = dayProps.day.format('YYYY-MM-DD');
                              const isBlocked = staffDetails.blocked_dates.includes(dateString);
                              const isPast = dayProps.day.isBefore(dayjs(), 'day');
                              
                              return (
                                <div className="relative">
                                  <PickersDay
                                    {...dayProps}
                                    disabled={isPast}
                                    sx={{
                                      fontSize: '1rem',
                                      fontWeight: isBlocked ? 700 : 500,
                                      backgroundColor: isBlocked ? '#fee2e2' : 'transparent',
                                      color: isBlocked ? '#991b1b' : dayProps.disabled ? '#d1d5db' : '#374151',
                                      border: isBlocked ? '2px solid #dc2626' : 'none',
                                      '&:hover': {
                                        backgroundColor: isBlocked ? '#fecaca' : '#f3f4f6',
                                      },
                                      '&.Mui-selected': {
                                        backgroundColor: '#800000',
                                        color: 'white',
                                        '&:hover': {
                                          backgroundColor: '#a83232',
                                        },
                                      },
                                      position: 'relative',
                                      width: '48px',
                                      height: '48px',
                                      margin: '2px',
                                    }}
                                  />
                                  {isBlocked && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <span className="text-red-600 font-bold text-lg">✕</span>
                                    </div>
                                  )}
                                </div>
                              );
                            },
                          }}
                          sx={{
                            width: '100%',
                            maxWidth: '450px',
                            height: 'auto',
                            '& .MuiPickersCalendarHeader-root': {
                              paddingLeft: '24px',
                              paddingRight: '24px',
                              marginTop: '8px',
                              marginBottom: '8px',
                            },
                            '& .MuiPickersCalendarHeader-label': {
                              fontSize: '1.25rem',
                              fontWeight: 600,
                              color: '#800000',
                            },
                            '& .MuiDayCalendar-header': {
                              gap: '4px',
                            },
                            '& .MuiDayCalendar-weekDayLabel': {
                              width: '48px',
                              height: '48px',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              color: '#6b7280',
                            },
                            '& .MuiPickersDay-root': {
                              fontSize: '1rem',
                            },
                            '& .MuiPickersArrowSwitcher-button': {
                              color: '#800000',
                              '&:hover': {
                                backgroundColor: '#fee2e2',
                              },
                            },
                          }}
                        />
                      </LocalizationProvider>
                    </div>
                  </div>

                  {/* Blocked Dates Summary */}
                  {staffDetails.blocked_dates.length > 0 ? (
                    <div className="bg-white border-2 border-red-200 rounded-xl p-5 shadow-md">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <div className="bg-red-100 p-2 rounded-lg">
                            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900">Blocked Dates</p>
                            <p className="text-sm text-gray-500">{staffDetails.blocked_dates.length} date{staffDetails.blocked_dates.length !== 1 ? 's' : ''} blocked</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setStaffDetails({...staffDetails, blocked_dates: []})}
                          className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 hover:border-red-400 transition-all flex items-center space-x-2 shadow-sm"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Clear All</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {staffDetails.blocked_dates.map((date, index) => (
                          <div key={index} className="group flex items-center justify-between bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-300 rounded-lg p-3 hover:shadow-md transition-all">
                            <div className="flex items-center space-x-2">
                              <div className="bg-red-200 p-1 rounded">
                                <svg className="h-4 w-4 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                              <span className="text-sm text-red-900 font-semibold">{dayjs(date).format('MMM DD, YYYY')}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newDates = staffDetails.blocked_dates.filter((_, i) => i !== index);
                                setStaffDetails({...staffDetails, blocked_dates: newDates});
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 text-red-600 hover:text-red-800 hover:bg-red-200 rounded transition-all"
                              title="Remove blocked date"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300">
                      <div className="bg-white p-3 rounded-full w-16 h-16 mx-auto mb-3 shadow-sm">
                        <svg className="h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-base font-medium text-gray-700">No blocked dates selected</p>
                      <p className="text-sm text-gray-500 mt-1">Click dates on the calendar above to block them</p>
                    </div>
                  )}
                </div>
                
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-6 rounded-r-lg">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-800">How to use:</p>
                      <ul className="text-sm text-blue-700 mt-1 space-y-1 list-disc list-inside">
                        <li>Click any date to block it (blocked dates show with red background and ✕)</li>
                        <li>Click a blocked date again to unblock it</li>
                        <li>Blocked dates prevent patients from booking appointments on those days</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border-l-4 border-amber-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">
                      Blocked dates prevent patients from booking appointments with you. Your appointment limit helps manage your daily workload.
                    </p>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3 bg-[#800000] text-white rounded-lg font-semibold hover:bg-[#a83232] transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Save Working Schedule</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
      
      {/* Signature Pad Styles */}
      <style jsx>{`
        canvas {
          touch-action: none;
          cursor: crosshair;
        }
        
        .signature-container {
          position: relative;
          display: inline-block;
          width: 100%;
        }
        
        .signature-container canvas {
          display: block;
          width: 100%;
          height: 150px;
        }
      `}</style>
    </AdminLayout>
  );
} 