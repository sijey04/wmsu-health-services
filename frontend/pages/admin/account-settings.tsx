import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { djangoApiClient } from '../../utils/api';
import SignaturePad from 'signature_pad';

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
    signature: null
  });
  const [signatureFile, setSignatureFile] = useState(null);
  const [currentSignature, setCurrentSignature] = useState('');
  
  // Signature pad refs
  const sigPad = useRef<any>(null);
  const signaturePadInstance = useRef<any>(null);
  
  // UI states
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
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
            signature: staffData.signature
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
              signature: null
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
              signature: null
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
          signature: null
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate passwords if changing
      if (newPassword && newPassword !== confirmPassword) {
        setError('New passwords do not match');
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

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update account');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffDetailsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('full_name', staffDetails.full_name);
      formData.append('position', staffDetails.position);
      formData.append('license_number', staffDetails.license_number || '');
      formData.append('ptr_number', staffDetails.ptr_number || '');
      formData.append('phone_number', staffDetails.phone_number || '');
      formData.append('assigned_campuses', staffDetails.assigned_campuses.join(','));

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
      setSuccess(true);
      setSignatureFile(null);
      setTimeout(() => setSuccess(false), 3000);
      
      // Refresh data
      fetchUserData();
    } catch (error: any) {
      console.error('Error saving staff details:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.detail || error.response?.data?.message || 'Failed to update staff details');
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
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
        <h1 className="text-3xl font-bold text-[#800000] mb-8">Account Settings</h1>
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            Settings updated successfully!
          </div>
        )}

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
          </nav>
        </div>

        {/* Account Information Tab */}
        {activeTab === 'account' && (
          <form onSubmit={handleAccountSave} className="space-y-8">
            {/* Profile Picture */}
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl text-gray-400 font-bold">
                {profilePic ? (
                  <img src={URL.createObjectURL(profilePic)} alt="Profile" className="w-24 h-24 rounded-full object-cover" />
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
                <input 
                  type="text" 
                  value={staffDetails.position} 
                  onChange={e => setStaffDetails({...staffDetails, position: e.target.value})} 
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-[#800000]" 
                  required
                />
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
                  <img 
                    src={currentSignature} 
                    alt="Current signature" 
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
                    <img 
                      src={URL.createObjectURL(signatureFile)} 
                      alt="Uploaded signature preview" 
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