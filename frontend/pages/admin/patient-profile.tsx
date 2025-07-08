// frontend/pages/admin/patient-profile.tsx
import AdminLayout from '../../components/AdminLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { djangoApiClient, patientsAPI } from '../../utils/api';
import PatientProfileModal from '../../components/PatientProfileModal';
import PatientProfileEditor from '../../components/PatientProfileEditor';
import PatientAppointmentHistory from '../../components/PatientAppointmentHistory';

export default function AdminPatientProfile() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('All User Types');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [allPatientProfiles, setAllPatientProfiles] = useState<any[]>([]);

  useEffect(() => {
    fetchPatients();
  }, [searchTerm, userTypeFilter]);

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (userTypeFilter !== 'All User Types') params.user_type = userTypeFilter;
      const res = await djangoApiClient.get('/patients/', { params });
      setPatients(res.data);
    } catch (err: any) {
      setError('Failed to fetch patients.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = async (patientId: number) => {
    const patient = patients.find((p) => p.id === patientId);
    setSelectedPatient(patient);
    
    // Fetch all patient profiles for this user
    let allProfiles = [];
    if (patient && patient.user) {
      try {
        const allProfilesResponse = await patientsAPI.getByUserId(patient.user);
        allProfiles = allProfilesResponse.data;
      } catch (error) {
        console.error("Failed to fetch all patient profiles:", error);
        allProfiles = [patient]; // Fallback to single profile
      }
    } else {
      allProfiles = [patient]; // If no user linked, just use the current profile
    }
    
    setAllPatientProfiles(allProfiles);
    setViewModalOpen(true);
  };

  const handleEditProfile = (patientId: number) => {
    const patient = patients.find((p) => p.id === patientId);
    setSelectedPatient(patient);
    setEditModalOpen(true);
  };

  const handleSaveProfile = (savedPatient: any) => {
    // Refresh the patients list
    fetchPatients();
    // Close modals
    setEditModalOpen(false);
  };

  const handleDeleteProfile = (patientId: number) => {
    // Remove from local state and refresh
    setPatients(prev => prev.filter(p => p.id !== patientId));
    fetchPatients();
  };

  const handleViewHistory = (patientId: number) => {
    const patient = patients.find((p) => p.id === patientId);
    setSelectedPatient(patient);
    setHistoryModalOpen(true);
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Patient Profiles</h1>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex justify-between items-center mb-6">
              <div className="relative flex-grow mr-4">
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              <div className="flex items-center space-x-2">
                <select
                  id="user-type-filter"
                  className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                  value={userTypeFilter}
                  onChange={(e) => setUserTypeFilter(e.target.value)}
                >
                  <option>All User Types</option>
                  <option>College</option>
                  <option>Incoming Freshman</option>
                  <option>Kindergarten</option>
                  <option>student</option>
                  <option>staff</option>
                  <option>admin</option>
                </select>
              </div>
            </div>

            {/* Loading and Error States */}
            {loading && (
              <div className="flex justify-center items-center py-8">
                <div className="text-lg text-gray-600">Loading patients...</div>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            {/* Patients Table */}
            {!loading && !error && (
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-[#800000]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Patient Name</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Age</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Gender</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Blood Type</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Contact #</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {patients.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          No patients found. {searchTerm && `Try adjusting your search for "${searchTerm}".`}
                        </td>
                      </tr>
                    ) : (
                      patients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {patient.photo ? (
                                  <img 
                                    src={patient.photo} 
                                    alt={patient.name} 
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <svg className="h-10 w-10 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
                                  </svg>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                <div className="text-sm text-gray-500">{patient.email || patient.user_email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.age || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.gender}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.blood_type || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{patient.contact_number || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleViewProfile(patient.id)}
                                className="inline-flex items-center px-3 py-1 border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md text-xs font-medium transition-colors duration-200"
                              >
                                👁️ View
                              </button>
                              <button
                                onClick={() => handleEditProfile(patient.id)}
                                className="inline-flex items-center px-3 py-1 border border-yellow-300 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-md text-xs font-medium transition-colors duration-200"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() => handleViewHistory(patient.id)}
                                className="inline-flex items-center px-3 py-1 border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 rounded-md text-xs font-medium transition-colors duration-200"
                              >
                                📋 History
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination (placeholder) */}
            <div className="mt-4 flex justify-end">
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Previous
                </a>
                <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  1
                </a>
                <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  2
                </a>
                <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                  3
                </a>
                <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                  Next
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PatientProfileModal 
        open={viewModalOpen} 
        patient={selectedPatient} 
        allPatientProfiles={allPatientProfiles}
        onClose={() => setViewModalOpen(false)} 
      />
      
      <PatientProfileEditor
        open={editModalOpen}
        patient={selectedPatient}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveProfile}
        onDelete={handleDeleteProfile}
        mode="edit"
        isAdmin={true}
      />

      <PatientAppointmentHistory
        open={historyModalOpen}
        patientId={selectedPatient?.id || null}
        patientName={selectedPatient?.name || ''}
        onClose={() => setHistoryModalOpen(false)}
      />
    </AdminLayout>
  );
}