// frontend/pages/patient/profile.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { djangoApiClient } from '../../utils/api';

interface PatientProfile {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_conditions: string;
  allergies: string;
  medications: string;
  student_id: string;
  department: string;
  year_level: string;
  guardian_name: string;
  guardian_phone: string;
}

export default function PatientProfile() {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState<Partial<PatientProfile>>({});
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await djangoApiClient.get('/patients/my_profile/');
      setProfile(response.data);
      setFormData(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No profile exists, switch to create mode
        setProfile(null);
        setEditing(true);
        setFormData({});
      } else {
        setError('Failed to load profile');
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      let response;
      if (profile) {
        // Update existing profile
        response = await djangoApiClient.put('/patients/update_my_profile/', formData);
      } else {
        // Create new profile
        response = await djangoApiClient.post('/patients/create_my_profile/', formData);
      }

      setProfile(response.data);
      setFormData(response.data);
      setEditing(false);
      setSuccess('Profile saved successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData(profile);
      setEditing(false);
    } else {
      // If no profile exists and user cancels, redirect to dashboard
      router.push('/');
    }
    setError('');
    setSuccess('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-800 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img 
                src="/wmsu-logo.png" 
                alt="WMSU Logo" 
                className="h-10 w-10"
              />
              <div>
                <h1 className="text-xl font-bold text-red-800">WMSU Health Services</h1>
                <p className="text-sm text-gray-600">Patient Profile</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-red-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">
                {profile ? 'My Profile' : 'Create Your Profile'}
              </h2>
              {profile && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="bg-red-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            {/* Success/Error Messages */}
            {success && (
              <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {editing ? (
              <form onSubmit={handleSave} className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date of Birth *
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender || ''}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <textarea
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                    />
                  </div>
                </div>

                {/* Student Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Student ID
                      </label>
                      <input
                        type="text"
                        name="student_id"
                        value={formData.student_id || ''}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department || ''}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year Level
                      </label>
                      <select
                        name="year_level"
                        value={formData.year_level || ''}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      >
                        <option value="">Select year level</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="5th Year">5th Year</option>
                        <option value="Graduate">Graduate</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Contact Name
                      </label>
                      <input
                        type="text"
                        name="emergency_contact_name"
                        value={formData.emergency_contact_name || ''}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Emergency Contact Phone
                      </label>
                      <input
                        type="tel"
                        name="emergency_contact_phone"
                        value={formData.emergency_contact_phone || ''}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Guardian Name
                      </label>
                      <input
                        type="text"
                        name="guardian_name"
                        value={formData.guardian_name || ''}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Guardian Phone
                      </label>
                      <input
                        type="tel"
                        name="guardian_phone"
                        value={formData.guardian_phone || ''}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Medical Conditions
                      </label>
                      <textarea
                        name="medical_conditions"
                        value={formData.medical_conditions || ''}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="List any medical conditions, chronic illnesses, or health concerns"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Allergies
                      </label>
                      <textarea
                        name="allergies"
                        value={formData.allergies || ''}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="List any known allergies (food, medication, environmental)"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Medications
                      </label>
                      <textarea
                        name="medications"
                        value={formData.medications || ''}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="List current medications, dosages, and frequency"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-red-800 focus:border-red-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-red-800 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-800 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : (profile ? 'Update Profile' : 'Create Profile')}
                  </button>
                </div>
              </form>
            ) : profile ? (
              <div className="space-y-6">
                {/* Display profile information in read-only mode */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <p className="mt-1 text-gray-900">{profile.first_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <p className="mt-1 text-gray-900">{profile.last_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="mt-1 text-gray-900">{profile.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="mt-1 text-gray-900">{profile.phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                      <p className="mt-1 text-gray-900">{profile.date_of_birth || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <p className="mt-1 text-gray-900 capitalize">{profile.gender || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <p className="mt-1 text-gray-900">{profile.address || 'Not provided'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Student Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Student ID</label>
                      <p className="mt-1 text-gray-900">{profile.student_id || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department</label>
                      <p className="mt-1 text-gray-900">{profile.department || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Year Level</label>
                      <p className="mt-1 text-gray-900">{profile.year_level || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Emergency Contact Name</label>
                      <p className="mt-1 text-gray-900">{profile.emergency_contact_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Emergency Contact Phone</label>
                      <p className="mt-1 text-gray-900">{profile.emergency_contact_phone || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Guardian Name</label>
                      <p className="mt-1 text-gray-900">{profile.guardian_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Guardian Phone</label>
                      <p className="mt-1 text-gray-900">{profile.guardian_phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Medical Conditions</label>
                      <p className="mt-1 text-gray-900">{profile.medical_conditions || 'None reported'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Allergies</label>
                      <p className="mt-1 text-gray-900">{profile.allergies || 'None reported'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Current Medications</label>
                      <p className="mt-1 text-gray-900">{profile.medications || 'None reported'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">You don't have a profile yet.</p>
                <button
                  onClick={() => setEditing(true)}
                  className="bg-red-800 text-white px-6 py-3 rounded-md hover:bg-red-700"
                >
                  Create Your Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
