
import AdminLayout from '../../components/AdminLayout';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { djangoApiClient, patientsAPI, academicSemestersAPI } from '../../utils/api';
import PatientProfileModal from '../../components/PatientProfileModal';
import PatientProfileEditor from '../../components/PatientProfileEditor';
import PatientAppointmentHistory from '../../components/PatientAppointmentHistory';
import { 
  AcademicCapIcon,
  CalendarDaysIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';

export default function AdminPatientProfile() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('All User Types');
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [bloodTypeFilter, setBloodTypeFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'age' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [semesters, setSemesters] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<string[]>([]);
  const [currentSemester, setCurrentSemester] = useState<any>(null);
  const [semesterStats, setSemesterStats] = useState<any>({});
  const router = useRouter();
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedPatients, setPaginatedPatients] = useState<any[]>([]);
  
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
  }, [searchTerm, userTypeFilter, selectedSemester, selectedAcademicYear]); // Remove fetchPatients dependency to avoid infinite loop

  const filteredPatients = useMemo(() => {
    return patients.filter(patient => {
      const matchesGender = genderFilter === 'all' || patient.gender === genderFilter;
      const matchesBloodType = bloodTypeFilter === 'all' || patient.blood_type === bloodTypeFilter;
      const matchesVerification = verificationFilter === 'all' || 
        (verificationFilter === 'verified' && patient.is_verified) ||
        (verificationFilter === 'unverified' && !patient.is_verified);
      
      return matchesGender && matchesBloodType && matchesVerification;
    }).sort((a, b) => {
      let compareValue = 0;
      
      switch (sortField) {
        case 'name':
          compareValue = (a.name || '').localeCompare(b.name || '');
          break;
        case 'age':
          compareValue = (a.age || 0) - (b.age || 0);
          break;
        case 'date':
          compareValue = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  }, [patients, genderFilter, bloodTypeFilter, verificationFilter, sortField, sortOrder]);

  const totalPages = useMemo(() => Math.ceil(filteredPatients.length / itemsPerPage), [filteredPatients.length, itemsPerPage]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedPatients(filteredPatients.slice(startIndex, endIndex));
  }, [filteredPatients, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSortChange = (field: 'name' | 'age' | 'date') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setUserTypeFilter('All User Types');
    setSelectedAcademicYear('all');
    setSelectedSemester('all');
    setGenderFilter('all');
    setBloodTypeFilter('all');
    setVerificationFilter('all');
    setSortField('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

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
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="bg-white rounded-xl overflow-hidden">
          <div className="">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full">
                  <div className="w-full sm:w-auto">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Patient Profiles</h1>
                    <p className="text-sm sm:text-base text-gray-600">
                      Manage and organize patient records by academic semester
                      {semesters.length === 0 && (
                        <span className="text-orange-600 ml-2">
                          • Semester tracking will be available when configured
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Current Semester Info */}
                  {currentSemester && semesters.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 sm:px-4 py-2 w-full sm:w-auto">
                      <div className="flex items-center text-blue-700">
                        <CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <div>
                          <div className="text-sm font-medium">Current Semester</div>
                          <div className="text-xs">{currentSemester.academic_year} - {currentSemester.semester_type}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  {semesters.length === 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 sm:px-4 py-2 w-full sm:w-auto">
                      <div className="flex items-center text-orange-700">
                        <CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        <div>
                          <div className="text-sm font-medium">Current Period</div>
                          <div className="text-xs">Academic Year {new Date().getFullYear()}-{new Date().getFullYear() + 1}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Semester Statistics - Inline */}
                  {Object.keys(semesterStats).length > 0 && Object.values(semesterStats).map((stat: any) => (
                    <div key={stat.semester.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-3 sm:px-4 py-2 w-full sm:w-auto">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <AcademicCapIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-blue-900">
                            {stat.semester.academic_year}
                          </div>
                          <div className="text-xs text-blue-700">
                            {stat.semester.semester_type} Semester
                          </div>
                        </div>
                        <div className="text-right border-l border-blue-300 pl-3">
                          <div className="text-2xl font-bold text-blue-600">{stat.totalPatients}</div>
                          <div className="text-xs text-blue-700">
                            {stat.verifiedPatients} verified
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Export Button */}
                <button
                  onClick={exportPatientsBySemester}
                  disabled={patients.length === 0}
                  className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#a83232] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 text-sm sm:text-base"
                >
                  <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Export CSV
                </button>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="space-y-3 sm:space-y-4">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, email, contact number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
                  />
                  <svg
                    className="absolute left-2 sm:left-3 top-2 sm:top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
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

                {/* Filter Row */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 w-full sm:w-auto">Filters:</span>
                  
                  <select
                    value={userTypeFilter}
                    onChange={(e) => setUserTypeFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none flex-1 sm:flex-none"
                  >
                    <option>All User Types</option>
                    <option>College</option>
                    <option>Incoming Freshman</option>
                    <option>Kindergarten</option>
                    <option>student</option>
                    <option>staff</option>
                    <option>admin</option>
                  </select>

                  {semesters.length > 0 && (
                    <select
                      value={selectedAcademicYear}
                      onChange={(e) => setSelectedAcademicYear(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none flex-1 sm:flex-none"
                    >
                      <option value="all">All Academic Years</option>
                      {academicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  )}

                  {semesters.length > 0 && (
                    <select
                      value={selectedSemester}
                      onChange={(e) => setSelectedSemester(e.target.value)}
                      className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none flex-1 sm:flex-none"
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
                  )}

                  <select
                    value={genderFilter}
                    onChange={(e) => setGenderFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none flex-1 sm:flex-none"
                  >
                    <option value="all">All Genders</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>

                  <select
                    value={bloodTypeFilter}
                    onChange={(e) => setBloodTypeFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none flex-1 sm:flex-none"
                  >
                    <option value="all">All Blood Types</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>

                  <select
                    value={verificationFilter}
                    onChange={(e) => setVerificationFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none flex-1 sm:flex-none"
                  >
                    <option value="all">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="unverified">Unverified</option>
                  </select>

                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as 'name' | 'age' | 'date')}
                    className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none flex-1 sm:flex-none"
                  >
                    <option value="date">Sort by Date</option>
                    <option value="name">Sort by Name</option>
                    <option value="age">Sort by Age</option>
                  </select>

                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-50 flex items-center"
                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                  >
                    {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
                  </button>

                  {(searchTerm || userTypeFilter !== 'All User Types' || selectedAcademicYear !== 'all' || 
                    selectedSemester !== 'all' || genderFilter !== 'all' || bloodTypeFilter !== 'all' || 
                    verificationFilter !== 'all') && (
                    <button
                      onClick={clearFilters}
                      className="text-xs sm:text-sm text-red-600 hover:text-red-800 underline w-full sm:w-auto text-center sm:text-left mt-2 sm:mt-0"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {/* Results Summary */}
                <div className="text-xs sm:text-sm text-gray-600">
                  Showing {paginatedPatients.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredPatients.length)} of {filteredPatients.length} patients
                </div>
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
                <div className="bg-gray-50 px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center">
                      <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mr-2" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-900">
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
                        <th 
                          className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#600000]"
                          onClick={() => handleSortChange('name')}
                        >
                          <div className="flex items-center">
                            Patient Info
                            {sortField === 'name' && (
                              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Academic Period</th>
                        <th 
                          className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#600000]"
                          onClick={() => handleSortChange('age')}
                        >
                          <div className="flex items-center">
                            Demographics
                            {sortField === 'age' && (
                              <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Contact Info</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                        <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedPatients.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <UserGroupIcon className="w-12 h-12 text-gray-300 mb-4" />
                              <div className="text-lg font-medium text-gray-900 mb-2">No patients found</div>
                              <div className="text-sm text-gray-600">
                                {searchTerm ? `Try adjusting your search for &ldquo;{searchTerm}&rdquo;` : 'No patient records match the current filters'}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedPatients.map((patient) => (
                          <tr key={patient.id} className="hover:bg-gray-50 transition-colors duration-200">
                            {/* Patient Info */}
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-12 w-12">
                                  {patient.photo ? (
                                    <Image 
                                      src={patient.photo} 
                                      alt={patient.name} 
                                      width={48}
                                      height={48}
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
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
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
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                <div>{patient.age ? `${patient.age} years old` : 'Age N/A'}</div>
                                <div className="text-gray-500">{patient.gender || 'Gender N/A'}</div>
                                <div className="text-gray-500">Blood: {patient.blood_type || 'N/A'}</div>
                              </div>
                            </td>

                            {/* Contact Info */}
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                              <div className="text-xs sm:text-sm text-gray-900">
                                <div>{patient.contact_number || 'No contact'}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Type: {patient.user_type || 'N/A'}
                                </div>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
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
                            <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
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

                {/* Pagination */}
                {filteredPatients.length > 0 && (
                  <div className="bg-gray-50 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between border-t border-gray-200">
                    <div className="flex-1 flex justify-between sm:hidden">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentPage === 1
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                          currentPage === totalPages
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                            <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredPatients.length)}</span> of{' '}
                            <span className="font-medium">{filteredPatients.length}</span> results
                          </p>
                        </div>
                        <div>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
                          >
                            <option value={5}>5 per page</option>
                            <option value={10}>10 per page</option>
                            <option value={25}>25 per page</option>
                            <option value={50}>50 per page</option>
                            <option value={100}>100 per page</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                              currentPage === 1
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => {
                              return (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              );
                            })
                            .map((page, index, array) => {
                              if (index > 0 && page - array[index - 1] > 1) {
                                return (
                                  <span key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    ...
                                  </span>
                                );
                              }
                              return (
                                <button
                                  key={page}
                                  onClick={() => handlePageChange(page)}
                                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                    currentPage === page
                                      ? 'z-10 bg-[#800000] border-[#800000] text-white'
                                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                  }`}
                                >
                                  {page}
                                </button>
                              );
                            })}
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                              currentPage === totalPages
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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