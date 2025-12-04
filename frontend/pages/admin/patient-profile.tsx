// frontend/pages/admin/patient-profile.tsx
import AdminLayout from '../../components/AdminLayout';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { djangoApiClient, patientsAPI, academicSemestersAPI } from '../../utils/api';
import PatientProfileModal from '../../components/PatientProfileModal';
import PatientProfileEditor from '../../components/PatientProfileEditor';
import PatientAppointmentHistory from '../../components/PatientAppointmentHistory';
import { 
  AcademicCapIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function AdminPatientProfile() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('All User Types');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [semesters, setSemesters] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [currentSemester, setCurrentSemester] = useState<any>(null);
  const [semesterStats, setSemesterStats] = useState<any>({});
  const router = useRouter();
  
  // Modal states
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [allPatientProfiles, setAllPatientProfiles] = useState<any[]>([]);

  useEffect(() => {
    fetchSemesters();
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [searchTerm, userTypeFilter, selectedSemester, selectedAcademicYear]);

  const fetchSemesters = async () => {
    try {
      // Try to fetch semesters, but handle gracefully if endpoints don't exist
      let semestersData = [];
      let currentSemesterData = null;
      
      try {
        const semestersRes = await academicSemestersAPI.getAll({ ordering: '-academic_year,-semester_type' });
        semestersData = semestersRes.data || [];
      } catch (semesterError) {
        console.warn('Semester API not available, using fallback data');
        // Fallback: Create some mock semester data for the current academic year
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        semestersData = [
          {
            id: 1,
            academic_year: `${currentYear}-${nextYear}`,
            semester_type: '1st',
            is_current: true,
            status: 'active'
          },
          {
            id: 2,
            academic_year: `${currentYear}-${nextYear}`,
            semester_type: '2nd',
            is_current: false,
            status: 'upcoming'
          }
        ];
      }
      
      try {
        const currentRes = await academicSemestersAPI.getCurrent();
        currentSemesterData = currentRes.data;
      } catch (currentError) {
        console.warn('Current semester API not available, using fallback');
        // Use the first semester as current if API is not available
        currentSemesterData = semestersData.find(s => s.is_current) || semestersData[0];
      }
      
      setSemesters(semestersData);
      setCurrentSemester(currentSemesterData);
      
      // Extract unique academic years
      const academicYearsList: string[] = [];
      semestersData.forEach((sem: any) => {
        if (sem.academic_year && !academicYearsList.includes(sem.academic_year)) {
          academicYearsList.push(sem.academic_year);
        }
      });
      setAcademicYears(academicYearsList);
      
    } catch (err: any) {
      console.error('Failed to fetch semesters:', err);
      // Set minimal fallback data
      const currentYear = new Date().getFullYear();
      const nextYear = currentYear + 1;
      const fallbackData = [{
        id: 1,
        academic_year: `${currentYear}-${nextYear}`,
        semester_type: '1st',
        is_current: true,
        status: 'active'
      }];
      
      setSemesters(fallbackData);
      setCurrentSemester(fallbackData[0]);
      setAcademicYears([`${currentYear}-${nextYear}`]);
    }
  };

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (userTypeFilter !== 'All User Types') params.user_type = userTypeFilter;
      
      // Only add semester filters if we have semester data and they're not 'all'
      if (semesters.length > 0) {
        if (selectedSemester !== 'all') params.semester_id = selectedSemester;
        if (selectedAcademicYear !== 'all') params.academic_year = selectedAcademicYear;
      }
      
      const res = await djangoApiClient.get('/patients/', { params });
      const patientsData = res.data || [];
      
      // If we have semester data but patients don't have semester_id, assign current semester
      if (semesters.length > 0 && currentSemester) {
        patientsData.forEach((patient: any) => {
          if (!patient.semester_id) {
            patient.semester_id = currentSemester.id;
          }
        });
      }
      
      setPatients(patientsData);
      
      // Calculate semester statistics
      calculateSemesterStats(patientsData);
      
    } catch (err: any) {
      setError('Failed to fetch patients.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSemesterStats = (patientsData: any[]) => {
    const stats: any = {};
    
    // Only calculate stats if we have semester data
    if (semesters.length > 0) {
      semesters.forEach(semester => {
        const semesterPatients = patientsData.filter(patient => 
          patient.semester_id === semester.id
        );
        
        stats[semester.id] = {
          totalPatients: semesterPatients.length,
          verifiedPatients: semesterPatients.filter(p => p.is_verified).length,
          semester: semester
        };
      });
    } else {
      // If no semester data, create a single stat for all patients
      stats['all'] = {
        totalPatients: patientsData.length,
        verifiedPatients: patientsData.filter(p => p.is_verified).length,
        semester: {
          id: 'all',
          academic_year: 'Current',
          semester_type: 'All Records',
          is_current: true
        }
      };
    }
    
    setSemesterStats(stats);
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

  const exportPatientsBySemester = () => {
    const csvData = [];
    csvData.push(['Academic Year', 'Semester', 'Patient Name', 'Email', 'Age', 'Gender', 'Blood Type', 'Contact Number', 'User Type', 'Verified Status']);
    
    patients.forEach(patient => {
      const semester = semesters.find(s => s.id === patient.semester_id);
      csvData.push([
        semester?.academic_year || 'N/A',
        semester ? `${semester.semester_type} Semester` : 'N/A',
        patient.name || 'N/A',
        patient.email || patient.user_email || 'N/A',
        patient.age || 'N/A',
        patient.gender || 'N/A',
        patient.blood_type || 'N/A',
        patient.contact_number || 'N/A',
        patient.user_type || 'N/A',
        patient.is_verified ? 'Verified' : 'Unverified'
      ]);
    });
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-profiles-${selectedSemester === 'all' ? 'all-semesters' : selectedSemester}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getSemesterLabel = (semesterId: any) => {
    if (!semesterId || semesterId === 'all') return 'All Semesters';
    if (semesters.length === 0) return 'Current Period';
    
    const semester = semesters.find(s => s.id === parseInt(semesterId));
    if (!semester) return 'Unknown Semester';
    
    return `${semester.academic_year} - ${semester.semester_type}`;
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Patient Profiles</h1>
                  <p className="text-gray-600">
                    Manage and organize patient records by academic semester
                    {semesters.length === 0 && (
                      <span className="text-orange-600 ml-2">
                        • Semester tracking will be available when configured
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {currentSemester && semesters.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
                      <div className="flex items-center text-blue-700">
                        <CalendarDaysIcon className="w-5 h-5 mr-2" />
                        <div>
                          <div className="text-sm font-medium">Current Semester</div>
                          <div className="text-xs">{currentSemester.academic_year} - {currentSemester.semester_type}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {semesters.length === 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2">
                      <div className="flex items-center text-orange-700">
                        <CalendarDaysIcon className="w-5 h-5 mr-2" />
                        <div>
                          <div className="text-sm font-medium">Current Period</div>
                          <div className="text-xs">Academic Year {new Date().getFullYear()}-{new Date().getFullYear() + 1}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={exportPatientsBySemester}
                    disabled={patients.length === 0}
                    className="flex items-center px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#a83232] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Semester Statistics */}
            {Object.keys(semesterStats).length > 0 && (
              <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Object.values(semesterStats).map((stat: any) => (
                  <div key={stat.semester.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AcademicCapIcon className="w-8 h-8 text-blue-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-blue-900">
                            {stat.semester.academic_year}
                          </div>
                          <div className="text-xs text-blue-700">
                            {stat.semester.semester_type} Semester
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{stat.totalPatients}</div>
                        <div className="text-xs text-blue-700">
                          {stat.verifiedPatients} verified
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Search and Filter Controls */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
              <div className="flex items-center mb-4">
                <FunnelIcon className="w-5 h-5 text-gray-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Filter & Search Options</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search Patients</label>
                  <input
                    type="text"
                    placeholder="Search by name, email..."
                    className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <svg
                    className="absolute left-3 top-8 h-5 w-5 text-gray-400"
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

                {/* User Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Type</label>
                  <select
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
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

                {/* Academic Year Filter - Only show if we have semester data */}
                {semesters.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                    <select
                      className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                      value={selectedAcademicYear}
                      onChange={(e) => setSelectedAcademicYear(e.target.value)}
                    >
                      <option value="all">All Academic Years</option>
                      {academicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Semester Filter - Only show if we have semester data */}
                {semesters.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                    <select
                      className="border border-gray-300 rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                    >
                      <option value="all">All Semesters</option>
                      {semesters
                        .filter(semester => selectedAcademicYear === 'all' || semester.academic_year === selectedAcademicYear)
                        .map(semester => (
                          <option key={semester.id} value={semester.id}>
                            {semester.academic_year} - {semester.semester_type}
                            {semester.is_current && ' (Current)'}
                          </option>
                        ))
                      }
                    </select>
                  </div>
                )}
              </div>

              {/* Active Filters Display */}
              <div className="mt-4 flex flex-wrap gap-2">
                {searchTerm && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Search: "{searchTerm}"
                    <button 
                      onClick={() => setSearchTerm('')}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-200 hover:bg-blue-300"
                    >
                      ×
                    </button>
                  </span>
                )}
                {userTypeFilter !== 'All User Types' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Type: {userTypeFilter}
                    <button 
                      onClick={() => setUserTypeFilter('All User Types')}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-200 hover:bg-green-300"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedAcademicYear !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Year: {selectedAcademicYear}
                    <button 
                      onClick={() => setSelectedAcademicYear('all')}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-purple-200 hover:bg-purple-300"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedSemester !== 'all' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                    Semester: {getSemesterLabel(selectedSemester)}
                    <button 
                      onClick={() => setSelectedSemester('all')}
                      className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-200 hover:bg-orange-300"
                    >
                      ×
                    </button>
                  </span>
                )}
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
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Table Header with Results Count */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <UserGroupIcon className="w-5 h-5 text-gray-600 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">
                        Patient Records ({patients.length} {patients.length === 1 ? 'patient' : 'patients'})
                      </h3>
                    </div>
                    {selectedSemester !== 'all' && (
                      <div className="text-sm text-gray-600">
                        Filtered by: {getSemesterLabel(selectedSemester)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#800000]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Patient Info</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Academic Period</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Demographics</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Contact Info</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {patients.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <UserGroupIcon className="w-12 h-12 text-gray-300 mb-4" />
                              <div className="text-lg font-medium text-gray-900 mb-2">No patients found</div>
                              <div className="text-sm text-gray-600">
                                {searchTerm ? `Try adjusting your search for "${searchTerm}"` : 'No patient records match the current filters'}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        patients.map((patient) => (
                          <tr key={patient.id} className="hover:bg-gray-50 transition-colors duration-200">
                            {/* Patient Info */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12">
                                  {patient.photo ? (
                                    <img 
                                      src={patient.photo} 
                                      alt={patient.name} 
                                      className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                                    />
                                  ) : (
                                    <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                                      <svg className="h-8 w-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
                                      </svg>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                  <div className="text-sm text-gray-500">{patient.email || patient.user_email}</div>
                                  <div className="text-xs text-gray-400">ID: {patient.id}</div>
                                </div>
                              </div>
                            </td>

                            {/* Academic Period */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {semesters.length > 0 ? (
                                  patient.semester_id ? (
                                    <div>
                                      <div className="font-medium">{getSemesterLabel(patient.semester_id)}</div>
                                      <div className="text-xs text-gray-500">
                                        {semesters.find(s => s.id === patient.semester_id)?.is_current && (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Current
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 italic">Unassigned</span>
                                  )
                                ) : (
                                  <div>
                                    <div className="font-medium text-blue-600">Current Period</div>
                                    <div className="text-xs text-gray-500">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                        Active
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Demographics */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div>{patient.age ? `${patient.age} years old` : 'Age N/A'}</div>
                                <div className="text-gray-500">{patient.gender || 'Gender N/A'}</div>
                                <div className="text-gray-500">Blood: {patient.blood_type || 'N/A'}</div>
                              </div>
                            </td>

                            {/* Contact Info */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div>{patient.contact_number || 'No contact'}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Type: {patient.user_type || 'N/A'}
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col space-y-1">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  patient.is_verified 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {patient.is_verified ? '✓ Verified' : '⚠ Unverified'}
                                </span>
                                {patient.is_blocked && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    🚫 Blocked
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="flex flex-col space-y-1">
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