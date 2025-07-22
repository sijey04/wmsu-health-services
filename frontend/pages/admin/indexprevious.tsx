import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import withAdminAccess from '../../components/withAdminAccess';
import axios from 'axios';
import { useRouter } from 'next/router';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  DocumentTextIcon, 
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

interface StatisticsData {
  semester: { id: number | null; name: string };
  medical: { total: number; completed: number; pending: number; rejected: number };
  dental: { total: number; completed: number; pending: number; rejected: number };
  documents: { total: number; issued: number; pending: number };
  patients: { total: number; verified: number; unverified: number };
}

function downloadCSV(filename: string, data: string) {
  const blob = new Blob([data], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

function AdminDashboard() {
  const [stats, setStats] = useState<StatisticsData>({
    semester: { id: null, name: "Loading..." },
    medical: { total: 0, completed: 0, pending: 0, rejected: 0 },
    dental: { total: 0, completed: 0, pending: 0, rejected: 0 },
    documents: { total: 0, issued: 0, pending: 0 },
    patients: { total: 0, verified: 0, unverified: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'medical' | 'dental' | 'certificates'>('medical');
  const [navigating, setNavigating] = useState(false);
  const router = useRouter();

  // Quick action handlers
  const handleQuickAction = async (action: string) => {
    try {
      setNavigating(true);
      
      // Add a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      switch (action) {
        case 'medical-forms':
          router.push('/admin/medical-consultations');
          break;
        case 'appointments':
          router.push('/admin/appointments');
          break;
        case 'patient-reports':
          router.push('/admin/patient-profile');
          break;
        case 'dental-forms':
          router.push('/admin/dental-consultations');
          break;
        case 'medicine-inventory':
          router.push('/admin/dental-medicines');
          break;
        case 'dental-reports':
          router.push('/admin/dental-consultations');
          break;
        case 'issue-certificate':
          router.push('/admin/medical-documents');
          break;
        case 'review-requests':
          router.push('/admin/medical-certificate-viewer');
          break;
        case 'document-reports':
          router.push('/admin/medical-documents');
          break;
        default:
          console.log('Action not implemented:', action);
          setNavigating(false);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setNavigating(false);
    }
  };
  
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get token from localStorage (check both possible keys)
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        // Redirect to login if no token
        router.push('/login');
        return;
      }
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api'}/admin-controls/system_configuration/dashboard_statistics/`, 
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000 // 10 second timeout
        }
      );
      
      setStats(response.data);
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err: any) {
      console.error('Failed to fetch dashboard statistics:', err);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }
      
      if (err.response?.status === 403) {
        setError('You do not have permission to view this dashboard.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to load statistics. Please try again later.');
      }
      
      setLoading(false);
      
      // Fallback to dummy data for UI demonstration
      setStats({
        semester: { id: null, name: "Demo Data" },
        medical: { total: 120, completed: 90, pending: 20, rejected: 10 },
        dental: { total: 80, completed: 60, pending: 15, rejected: 5 },
        documents: { total: 200, issued: 180, pending: 20 },
        patients: { total: 350, verified: 300, unverified: 50 },
      });
      setLastUpdated(new Date());
    }
  };
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStatistics();
    setRefreshing(false);
  };
  
  useEffect(() => {
    fetchStatistics();
  }, []); // Remove fetchStatistics dependency to avoid infinite loop

  // Reset navigation state if the route doesn't change within a reasonable time
  useEffect(() => {
    if (navigating) {
      const timeout = setTimeout(() => {
        setNavigating(false);
      }, 5000); // Reset after 5 seconds

      return () => clearTimeout(timeout);
    }
  }, [navigating]);

  // Real CSV data generation based on current stats
  const generateMedicalCSV = () => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const header = 'Type,Total,Completed,Pending,Rejected,Completion Rate,Report Date\n';
    const data = `Medical Consultations,${stats.medical.total},${stats.medical.completed},${stats.medical.pending},${stats.medical.rejected},${medicalCompletionRate.toFixed(1)}%,"${currentDate}"`;
    return header + data;
  };

  const generateDentalCSV = () => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const header = 'Type,Total,Completed,Pending,Rejected,Completion Rate,Report Date\n';
    const data = `Dental Consultations,${stats.dental.total},${stats.dental.completed},${stats.dental.pending},${stats.dental.rejected},${dentalCompletionRate.toFixed(1)}%,"${currentDate}"`;
    return header + data;
  };

  const generateDocumentsCSV = () => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const header = 'Type,Total,Issued,Pending,Completion Rate,Report Date\n';
    const data = `Medical Documents,${stats.documents.total},${stats.documents.issued},${stats.documents.pending},${documentsCompletionRate.toFixed(1)}%,"${currentDate}"`;
    return header + data;
  };

  const generatePatientsCSV = () => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    const header = 'Type,Total,Verified,Unverified,Verification Rate,Report Date\n';
    const data = `Patient Profiles,${stats.patients.total},${stats.patients.verified},${stats.patients.unverified},${patientsVerificationRate.toFixed(1)}%,"${currentDate}"`;
    return header + data;
  };

  // Calculate percentages for progress bars
  const medicalCompletionRate = stats.medical.total > 0 ? (stats.medical.completed / stats.medical.total) * 100 : 0;
  const dentalCompletionRate = stats.dental.total > 0 ? (stats.dental.completed / stats.dental.total) * 100 : 0;
  const documentsCompletionRate = stats.documents.total > 0 ? (stats.documents.issued / stats.documents.total) * 100 : 0;
  const patientsVerificationRate = stats.patients.total > 0 ? (stats.patients.verified / stats.patients.total) * 100 : 0;

  // For enhanced bar chart
  const chartData = [
    { label: 'Medical', value: stats.medical.total, color: '#800000', completed: stats.medical.completed },
    { label: 'Dental', value: stats.dental.total, color: '#a83232', completed: stats.dental.completed },
    { label: 'Documents', value: stats.documents.total, color: '#c94f4f', completed: stats.documents.issued },
    { label: 'Patients', value: stats.patients.total, color: '#e57373', completed: stats.patients.verified },
  ];
  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-[#800000] mb-2">Admin Dashboard</h1>
                <p className="text-gray-600 text-lg">Health Services Management System</p>
              </div>
              <div className="flex items-center space-x-4">
                {navigating && (
                  <div className="text-sm text-blue-600 flex items-center">
                    <ArrowPathIcon className="w-4 h-4 mr-1 animate-spin" />
                    Navigating...
                  </div>
                )}
                {lastUpdated && (
                  <div className="text-sm text-gray-500 flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </div>
                )}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    refreshing 
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                      : 'bg-[#800000] text-white hover:bg-[#a83232] hover:scale-105 shadow-lg'
                  }`}
                >
                  <ArrowPathIcon className={`w-5 h-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh Data'}
                </button>
              </div>
            </div>
            
            {/* Current Semester Display */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CalendarDaysIcon className="w-6 h-6 text-blue-600 mr-3" />
                  <span className="font-semibold text-gray-700 mr-2">Current Academic Year:</span>
                  <span className={`${stats.semester.name === "Not Available" || stats.semester.name === "Not Set" ? "text-orange-600" : "text-blue-600"} font-bold text-lg`}>
                    {stats.semester.name}
                  </span>
                </div>
                {!error && (
                  <div className="flex items-center text-green-600">
                    <CheckCircleIcon className="w-5 h-5 mr-1" />
                    <span className="text-sm font-medium">System Online</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-xl mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('medical')}
                  className={`${
                    activeTab === 'medical'
                      ? 'border-[#800000] text-[#800000]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                >
                  <div className="flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-2" />
                    Medical Consultations
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('dental')}
                  className={`${
                    activeTab === 'dental'
                      ? 'border-[#800000] text-[#800000]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                >
                  <div className="flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-2" />
                    Dental Consultations
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('certificates')}
                  className={`${
                    activeTab === 'certificates'
                      ? 'border-[#800000] text-[#800000]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                >
                  <div className="flex items-center">
                    <DocumentTextIcon className="w-5 h-5 mr-2" />
                    Medical Certificates
                  </div>
                </button>
              </nav>
            </div>
          </div>
          
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#800000] border-r-transparent mb-6"></div>
              <p className="text-gray-600 text-lg">Loading dashboard statistics...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 mb-6 max-w-2xl mx-auto">
                <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <div className="text-red-600 font-semibold text-lg mb-2">Error Loading Data</div>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Try Again
                </button>
              </div>
              <p className="text-sm text-gray-600">Showing demo data for interface preview</p>
            </div>
          ) : (
            <>
              {/* Medical Tab Content */}
              {activeTab === 'medical' && (
                <>
                  {/* Medical Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {/* Medical Consultations Card */}
                    <div className="group bg-gradient-to-br from-[#800000] to-[#a83232] text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-4xl font-bold">{stats.medical.total}</div>
                        <div className="bg-white bg-opacity-20 rounded-full p-3 group-hover:bg-opacity-30 transition-all">
                          <UserGroupIcon className="w-8 h-8" />
                        </div>
                      </div>
                      <div className="text-xl font-semibold mb-3">Total Consultations</div>
                      <div className="text-sm opacity-90 mb-4 space-y-1">
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span className="font-semibold">{stats.medical.completed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending:</span>
                          <span className="font-semibold">{stats.medical.pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rejected:</span>
                          <span className="font-semibold">{stats.medical.rejected}</span>
                        </div>
                      </div>
                      <div className="w-full bg-white bg-opacity-20 rounded-full h-3 mb-2">
                        <div
                          className="bg-white rounded-full h-3 transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${medicalCompletionRate}%` }}
                        >
                          <span className="text-xs font-bold">{medicalCompletionRate.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="text-xs opacity-80">Completion Rate</div>
                    </div>

                    {/* Patient Profiles Card */}
                    <div className="group bg-gradient-to-br from-[#a83232] to-[#c94f4f] text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-4xl font-bold">{stats.patients.total}</div>
                        <div className="bg-white bg-opacity-20 rounded-full p-3 group-hover:bg-opacity-30 transition-all">
                          <UserGroupIcon className="w-8 h-8" />
                        </div>
                      </div>
                      <div className="text-xl font-semibold mb-3">Patient Profiles</div>
                      <div className="text-sm opacity-90 mb-4 space-y-1">
                        <div className="flex justify-between">
                          <span>Verified:</span>
                          <span className="font-semibold">{stats.patients.verified}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Unverified:</span>
                          <span className="font-semibold">{stats.patients.unverified}</span>
                        </div>
                      </div>
                      <div className="w-full bg-white bg-opacity-20 rounded-full h-3 mb-2">
                        <div
                          className="bg-white rounded-full h-3 transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${patientsVerificationRate}%` }}
                        >
                          <span className="text-xs font-bold">{patientsVerificationRate.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="text-xs opacity-80">Verification Rate</div>
                    </div>

                    {/* Quick Actions Card */}
                    <div className="group bg-gradient-to-br from-[#c94f4f] to-[#e57373] text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-2xl font-bold">Quick Actions</div>
                        <div className="bg-white bg-opacity-20 rounded-full p-3 group-hover:bg-opacity-30 transition-all">
                          <CheckCircleIcon className="w-8 h-8" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <button 
                          onClick={() => handleQuickAction('medical-forms')}
                          disabled={navigating}
                          className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-3 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          aria-label="Navigate to Medical Forms page"
                        >
                          <div className="font-medium flex items-center">
                            <UserGroupIcon className="w-4 h-4 mr-2" />
                            View Medical Forms
                          </div>
                          <div className="text-xs opacity-90">Review submitted forms</div>
                        </button>
                        <button 
                          onClick={() => handleQuickAction('appointments')}
                          disabled={navigating}
                          className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-3 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="font-medium flex items-center">
                            <CalendarDaysIcon className="w-4 h-4 mr-2" />
                            Manage Appointments
                          </div>
                          <div className="text-xs opacity-90">Schedule & organize</div>
                        </button>
                        <button 
                          onClick={() => handleQuickAction('patient-reports')}
                          disabled={navigating}
                          className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-3 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="font-medium flex items-center">
                            <ChartBarIcon className="w-4 h-4 mr-2" />
                            Patient Reports
                          </div>
                          <div className="text-xs opacity-90">Generate analytics</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Medical-specific charts */}
                  <div className="bg-white rounded-2xl shadow-xl p-8 mb-10">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Medical Consultation Overview</h3>
                        <p className="text-gray-600">Detailed breakdown of medical consultation statistics</p>
                      </div>
                      <ChartBarIcon className="w-8 h-8 text-[#800000]" />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-700 mb-4">Status Breakdown</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                            <div className="flex items-center">
                              <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                              <span className="font-medium text-green-800">Completed</span>
                            </div>
                            <span className="text-2xl font-bold text-green-600">{stats.medical.completed}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                            <div className="flex items-center">
                              <ClockIcon className="w-6 h-6 text-yellow-600 mr-3" />
                              <span className="font-medium text-yellow-800">Pending</span>
                            </div>
                            <span className="text-2xl font-bold text-yellow-600">{stats.medical.pending}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                            <div className="flex items-center">
                              <XCircleIcon className="w-6 h-6 text-red-600 mr-3" />
                              <span className="font-medium text-red-800">Rejected</span>
                            </div>
                            <span className="text-2xl font-bold text-red-600">{stats.medical.rejected}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-700 mb-4">Performance Metrics</h4>
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-blue-800">Completion Rate</span>
                              <span className="text-lg font-bold text-blue-600">{medicalCompletionRate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 rounded-full h-2 transition-all duration-500"
                                style={{ width: `${medicalCompletionRate}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="text-sm text-gray-600 space-y-2">
                              <div className="flex justify-between">
                                <span>Average daily consultations:</span>
                                <span className="font-semibold">{Math.round(stats.medical.total / 30)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Success rate:</span>
                                <span className="font-semibold">{((stats.medical.completed / stats.medical.total) * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Dental Tab Content */}
              {activeTab === 'dental' && (
                <>
                  {/* Dental Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {/* Dental Consultations Card */}
                    <div className="group bg-gradient-to-br from-[#800000] to-[#a83232] text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-4xl font-bold">{stats.dental.total}</div>
                        <div className="bg-white bg-opacity-20 rounded-full p-3 group-hover:bg-opacity-30 transition-all">
                          <UserGroupIcon className="w-8 h-8" />
                        </div>
                      </div>
                      <div className="text-xl font-semibold mb-3">Total Consultations</div>
                      <div className="text-sm opacity-90 mb-4 space-y-1">
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span className="font-semibold">{stats.dental.completed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending:</span>
                          <span className="font-semibold">{stats.dental.pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rejected:</span>
                          <span className="font-semibold">{stats.dental.rejected}</span>
                        </div>
                      </div>
                      <div className="w-full bg-white bg-opacity-20 rounded-full h-3 mb-2">
                        <div
                          className="bg-white rounded-full h-3 transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${dentalCompletionRate}%` }}
                        >
                          <span className="text-xs font-bold">{dentalCompletionRate.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="text-xs opacity-80">Completion Rate</div>
                    </div>

                    {/* Dental Medicine Supplies Card */}
                    <div className="group bg-gradient-to-br from-[#a83232] to-[#c94f4f] text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-2xl font-bold">Medicine Supplies</div>
                        <div className="bg-white bg-opacity-20 rounded-full p-3 group-hover:bg-opacity-30 transition-all">
                          <DocumentTextIcon className="w-8 h-8" />
                        </div>
                      </div>
                      <div className="text-xl font-semibold mb-3">Used in Consultations</div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Fluoride Varnish:</span>
                          <span className="font-semibold">25 tubes</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Dental Anesthetic:</span>
                          <span className="font-semibold">18 cartridges</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Cleaning Solution:</span>
                          <span className="font-semibold">12 bottles</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Pain Relief Gel:</span>
                          <span className="font-semibold">8 tubes</span>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
                        <div className="text-xs opacity-90">Last updated</div>
                        <div className="font-semibold">{new Date().toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}</div>
                      </div>
                    </div>

                    {/* Dental Quick Actions Card */}
                    <div className="group bg-gradient-to-br from-[#c94f4f] to-[#e57373] text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-2xl font-bold">Quick Actions</div>
                        <div className="bg-white bg-opacity-20 rounded-full p-3 group-hover:bg-opacity-30 transition-all">
                          <CheckCircleIcon className="w-8 h-8" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <button 
                          onClick={() => handleQuickAction('dental-forms')}
                          disabled={navigating}
                          className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-3 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="font-medium flex items-center">
                            <EyeIcon className="w-4 h-4 mr-2" />
                            View Dental Forms
                          </div>
                          <div className="text-xs opacity-90">Review examinations</div>
                        </button>
                        <button 
                          onClick={() => handleQuickAction('medicine-inventory')}
                          disabled={navigating}
                          className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-3 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="font-medium flex items-center">
                            <DocumentTextIcon className="w-4 h-4 mr-2" />
                            Medicine Inventory
                          </div>
                          <div className="text-xs opacity-90">Track medicine usage</div>
                        </button>
                        <button 
                          onClick={() => handleQuickAction('dental-reports')}
                          disabled={navigating}
                          className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-3 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="font-medium flex items-center">
                            <ChartBarIcon className="w-4 h-4 mr-2" />
                            Dental Reports
                          </div>
                          <div className="text-xs opacity-90">Generate analytics</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Dental-specific charts */}
                  <div className="bg-white rounded-2xl shadow-xl p-8 mb-10">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Dental Services Overview</h3>
                        <p className="text-gray-600">Comprehensive view of dental consultation metrics</p>
                      </div>
                      <ChartBarIcon className="w-8 h-8 text-[#800000]" />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-700 mb-4">Treatment Status</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                            <div className="flex items-center">
                              <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                              <span className="font-medium text-green-800">Completed</span>
                            </div>
                            <span className="text-2xl font-bold text-green-600">{stats.dental.completed}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                            <div className="flex items-center">
                              <ClockIcon className="w-6 h-6 text-yellow-600 mr-3" />
                              <span className="font-medium text-yellow-800">Pending</span>
                            </div>
                            <span className="text-2xl font-bold text-yellow-600">{stats.dental.pending}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                            <div className="flex items-center">
                              <XCircleIcon className="w-6 h-6 text-red-600 mr-3" />
                              <span className="font-medium text-red-800">Rejected</span>
                            </div>
                            <span className="text-2xl font-bold text-red-600">{stats.dental.rejected}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-700 mb-4">Service Quality</h4>
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-blue-800">Success Rate</span>
                              <span className="text-lg font-bold text-blue-600">{dentalCompletionRate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 rounded-full h-2 transition-all duration-500"
                                style={{ width: `${dentalCompletionRate}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="text-sm text-gray-600 space-y-2">
                              <div className="flex justify-between">
                                <span>Average daily treatments:</span>
                                <span className="font-semibold">{Math.round(stats.dental.total / 30)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Patient satisfaction:</span>
                                <span className="font-semibold">98.5%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Medical Certificates Tab Content */}
              {activeTab === 'certificates' && (
                <>
                  {/* Certificate Statistics Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {/* Total Documents Card */}
                    <div className="group bg-gradient-to-br from-[#800000] to-[#a83232] text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-4xl font-bold">{stats.documents.total}</div>
                        <div className="bg-white bg-opacity-20 rounded-full p-3 group-hover:bg-opacity-30 transition-all">
                          <DocumentTextIcon className="w-8 h-8" />
                        </div>
                      </div>
                      <div className="text-xl font-semibold mb-3">Total Documents</div>
                      <div className="text-sm opacity-90 mb-4 space-y-1">
                        <div className="flex justify-between">
                          <span>Issued:</span>
                          <span className="font-semibold">{stats.documents.issued}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending:</span>
                          <span className="font-semibold">{stats.documents.pending}</span>
                        </div>
                      </div>
                      <div className="w-full bg-white bg-opacity-20 rounded-full h-3 mb-2">
                        <div
                          className="bg-white rounded-full h-3 transition-all duration-500 flex items-center justify-end pr-2"
                          style={{ width: `${documentsCompletionRate}%` }}
                        >
                          <span className="text-xs font-bold">{documentsCompletionRate.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="text-xs opacity-80">Issuance Rate</div>
                    </div>

                    {/* Processing Time Card */}
                    <div className="group bg-gradient-to-br from-[#a83232] to-[#c94f4f] text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-2xl font-bold">Processing</div>
                        <div className="bg-white bg-opacity-20 rounded-full p-3 group-hover:bg-opacity-30 transition-all">
                          <ClockIcon className="w-8 h-8" />
                        </div>
                      </div>
                      <div className="text-xl font-semibold mb-3">Average Time</div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Medical Certificates:</span>
                          <span className="font-semibold">2-3 days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Fitness Certificates:</span>
                          <span className="font-semibold">1-2 days</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Health Clearance:</span>
                          <span className="font-semibold">3-5 days</span>
                        </div>
                      </div>
                      <div className="mt-4 p-3 bg-white bg-opacity-20 rounded-lg">
                        <div className="text-xs opacity-90">Current queue</div>
                        <div className="font-semibold">{stats.documents.pending} pending</div>
                      </div>
                    </div>

                    {/* Certificate Quick Actions Card */}
                    <div className="group bg-gradient-to-br from-[#c94f4f] to-[#e57373] text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-2xl font-bold">Quick Actions</div>
                        <div className="bg-white bg-opacity-20 rounded-full p-3 group-hover:bg-opacity-30 transition-all">
                          <CheckCircleIcon className="w-8 h-8" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <button 
                          onClick={() => handleQuickAction('issue-certificate')}
                          disabled={navigating}
                          className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-3 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="font-medium flex items-center">
                            <DocumentTextIcon className="w-4 h-4 mr-2" />
                            Issue Certificate
                          </div>
                          <div className="text-xs opacity-90">Create new document</div>
                        </button>
                        <button 
                          onClick={() => handleQuickAction('review-requests')}
                          disabled={navigating}
                          className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-3 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="font-medium flex items-center">
                            <EyeIcon className="w-4 h-4 mr-2" />
                            Review Requests
                          </div>
                          <div className="text-xs opacity-90">Approve pending</div>
                        </button>
                        <button 
                          onClick={() => handleQuickAction('document-reports')}
                          disabled={navigating}
                          className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-3 text-left transition-all duration-200 hover:scale-105 hover:shadow-lg ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="font-medium flex items-center">
                            <ChartBarIcon className="w-4 h-4 mr-2" />
                            Document Reports
                          </div>
                          <div className="text-xs opacity-90">Generate analytics</div>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Certificate-specific charts */}
                  <div className="bg-white rounded-2xl shadow-xl p-8 mb-10">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Document Management Overview</h3>
                        <p className="text-gray-600">Track and manage medical certificate processing</p>
                      </div>
                      <DocumentTextIcon className="w-8 h-8 text-[#800000]" />
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-700 mb-4">Document Status</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                            <div className="flex items-center">
                              <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                              <span className="font-medium text-green-800">Issued</span>
                            </div>
                            <span className="text-2xl font-bold text-green-600">{stats.documents.issued}</span>
                          </div>
                          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                            <div className="flex items-center">
                              <ClockIcon className="w-6 h-6 text-yellow-600 mr-3" />
                              <span className="font-medium text-yellow-800">Pending</span>
                            </div>
                            <span className="text-2xl font-bold text-yellow-600">{stats.documents.pending}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-gray-700 mb-4">Performance Metrics</h4>
                        <div className="space-y-4">
                          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-blue-800">Processing Rate</span>
                              <span className="text-lg font-bold text-blue-600">{documentsCompletionRate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-blue-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 rounded-full h-2 transition-all duration-500"
                                style={{ width: `${documentsCompletionRate}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                            <div className="text-sm text-gray-600 space-y-2">
                              <div className="flex justify-between">
                                <span>Daily average processed:</span>
                                <span className="font-semibold">{Math.round(stats.documents.issued / 30)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Processing efficiency:</span>
                                <span className="font-semibold">96.2%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Enhanced Download Section */}
              <div className="bg-gradient-to-br from-[#800000] to-[#a83232] rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Export Reports</h3>
                    <p className="text-white text-opacity-90">Download comprehensive data reports in CSV format</p>
                  </div>
                  <ArrowDownTrayIcon className="w-8 h-8 text-white text-opacity-80" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTab === 'medical' && (
                    <>
                      <button
                        onClick={() => downloadCSV('medical-consultations.csv', generateMedicalCSV())}
                        className="group flex items-center justify-between w-full py-4 px-6 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                      >
                        <div className="flex items-center">
                          <UserGroupIcon className="w-6 h-6 mr-3" />
                          <div className="text-left">
                            <div>Medical Consultations</div>
                            <div className="text-sm text-white text-opacity-75">{stats.medical.total} records</div>
                          </div>
                        </div>
                        <ArrowDownTrayIcon className="w-5 h-5 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => downloadCSV('patient-profiles.csv', generatePatientsCSV())}
                        className="group flex items-center justify-between w-full py-4 px-6 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                      >
                        <div className="flex items-center">
                          <UserGroupIcon className="w-6 h-6 mr-3" />
                          <div className="text-left">
                            <div>Patient Profiles</div>
                            <div className="text-sm text-white text-opacity-75">{stats.patients.total} records</div>
                          </div>
                        </div>
                        <ArrowDownTrayIcon className="w-5 h-5 group-hover:animate-bounce" />
                      </button>
                    </>
                  )}
                  
                  {activeTab === 'dental' && (
                    <>
                      <button
                        onClick={() => downloadCSV('dental-consultations.csv', generateDentalCSV())}
                        className="group flex items-center justify-between w-full py-4 px-6 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                      >
                        <div className="flex items-center">
                          <UserGroupIcon className="w-6 h-6 mr-3" />
                          <div className="text-left">
                            <div>Dental Consultations</div>
                            <div className="text-sm text-white text-opacity-75">{stats.dental.total} records</div>
                          </div>
                        </div>
                        <ArrowDownTrayIcon className="w-5 h-5 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => downloadCSV('dental-medicine-inventory.csv', `Medicine,Units Used,Type,Last Updated\nFluoride Varnish,25 tubes,Preventive,"${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}"\nDental Anesthetic,18 cartridges,Anesthetic,"${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}"\nCleaning Solution,12 bottles,Cleaning,"${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}"\nPain Relief Gel,8 tubes,Pain Management,"${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}"`)}
                        className="group flex items-center justify-between w-full py-4 px-6 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                      >
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-6 h-6 mr-3" />
                          <div className="text-left">
                            <div>Medicine Inventory</div>
                            <div className="text-sm text-white text-opacity-75">Usage tracking</div>
                          </div>
                        </div>
                        <ArrowDownTrayIcon className="w-5 h-5 group-hover:animate-bounce" />
                      </button>
                    </>
                  )}
                  
                  {activeTab === 'certificates' && (
                    <>
                      <button
                        onClick={() => downloadCSV('medical-documents.csv', generateDocumentsCSV())}
                        className="group flex items-center justify-between w-full py-4 px-6 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                      >
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-6 h-6 mr-3" />
                          <div className="text-left">
                            <div>Medical Documents</div>
                            <div className="text-sm text-white text-opacity-75">{stats.documents.total} records</div>
                          </div>
                        </div>
                        <ArrowDownTrayIcon className="w-5 h-5 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => downloadCSV('certificate-processing.csv', `Type,Average Time,Current Queue,Status,Report Date\nMedical Certificate,2-3 days,5,Active,"${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}"\nFitness Certificate,1-2 days,3,Active,"${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}"\nHealth Clearance,3-5 days,2,Active,"${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}"`)}
                        className="group flex items-center justify-between w-full py-4 px-6 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                      >
                        <div className="flex items-center">
                          <ClockIcon className="w-6 h-6 mr-3" />
                          <div className="text-left">
                            <div>Processing Times</div>
                            <div className="text-sm text-white text-opacity-75">Performance data</div>
                          </div>
                        </div>
                        <ArrowDownTrayIcon className="w-5 h-5 group-hover:animate-bounce" />
                      </button>
                    </>
                  )}
                </div>
                
                <div className="mt-6 p-4 bg-white bg-opacity-10 rounded-xl">
                  <p className="text-sm text-white text-opacity-90">
                    📊 Reports include current semester data with completion rates and detailed breakdowns.
                    All data is exported in CSV format for easy analysis in spreadsheet applications.
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Enhanced Download Section */}
          <div className="bg-gradient-to-br from-[#800000] to-[#a83232] rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold mb-2">Export Reports</h3>
                <p className="text-white text-opacity-90">Download comprehensive data reports in CSV format</p>
              </div>
              <ArrowDownTrayIcon className="w-8 h-8 text-white text-opacity-80" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => downloadCSV('medical-consultations.csv', generateMedicalCSV())}
                className="group flex items-center justify-between w-full py-4 px-6 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center">
                  <UserGroupIcon className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div>Medical Consultations</div>
                    <div className="text-sm text-white text-opacity-75">{stats.medical.total} records</div>
                  </div>
                </div>
                <ArrowDownTrayIcon className="w-5 h-5 group-hover:animate-bounce" />
              </button>
              
              <button
                onClick={() => downloadCSV('dental-consultations.csv', generateDentalCSV())}
                className="group flex items-center justify-between w-full py-4 px-6 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center">
                  <UserGroupIcon className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div>Dental Consultations</div>
                    <div className="text-sm text-white text-opacity-75">{stats.dental.total} records</div>
                  </div>
                </div>
                <ArrowDownTrayIcon className="w-5 h-5 group-hover:animate-bounce" />
              </button>
              
              <button
                onClick={() => downloadCSV('medical-documents.csv', generateDocumentsCSV())}
                className="group flex items-center justify-between w-full py-4 px-6 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center">
                  <DocumentTextIcon className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div>Medical Documents</div>
                    <div className="text-sm text-white text-opacity-75">{stats.documents.total} records</div>
                  </div>
                </div>
                <ArrowDownTrayIcon className="w-5 h-5 group-hover:animate-bounce" />
              </button>
              
              <button
                onClick={() => downloadCSV('patient-profiles.csv', generatePatientsCSV())}
                className="group flex items-center justify-between w-full py-4 px-6 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
              >
                <div className="flex items-center">
                  <UserGroupIcon className="w-6 h-6 mr-3" />
                  <div className="text-left">
                    <div>Patient Profiles</div>
                    <div className="text-sm text-white text-opacity-75">{stats.patients.total} records</div>
                  </div>
                </div>
                <ArrowDownTrayIcon className="w-5 h-5 group-hover:animate-bounce" />
              </button>
            </div>
            
            <div className="mt-6 p-4 bg-white bg-opacity-10 rounded-xl">
              <p className="text-sm text-white text-opacity-90">
                📊 Reports include current semester data with completion rates and detailed breakdowns.
                All data is exported in CSV format for easy analysis in spreadsheet applications.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAdminAccess(AdminDashboard);