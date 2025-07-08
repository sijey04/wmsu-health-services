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
  const router = useRouter();
  
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
  }, []);

  // Real CSV data generation based on current stats
  const generateMedicalCSV = () => {
    const header = 'Type,Total,Completed,Pending,Rejected,Completion Rate\n';
    const data = `Medical Consultations,${stats.medical.total},${stats.medical.completed},${stats.medical.pending},${stats.medical.rejected},${medicalCompletionRate.toFixed(1)}%`;
    return header + data;
  };

  const generateDentalCSV = () => {
    const header = 'Type,Total,Completed,Pending,Rejected,Completion Rate\n';
    const data = `Dental Consultations,${stats.dental.total},${stats.dental.completed},${stats.dental.pending},${stats.dental.rejected},${dentalCompletionRate.toFixed(1)}%`;
    return header + data;
  };

  const generateDocumentsCSV = () => {
    const header = 'Type,Total,Issued,Pending,Completion Rate\n';
    const data = `Medical Documents,${stats.documents.total},${stats.documents.issued},${stats.documents.pending},${documentsCompletionRate.toFixed(1)}%`;
    return header + data;
  };

  const generatePatientsCSV = () => {
    const header = 'Type,Total,Verified,Unverified,Verification Rate\n';
    const data = `Patient Profiles,${stats.patients.total},${stats.patients.verified},${stats.patients.unverified},${patientsVerificationRate.toFixed(1)}%`;
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
              {/* Enhanced Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {/* Medical Consultations Card */}
                <div className="group bg-gradient-to-br from-[#800000] to-[#a83232] text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-bold">{stats.medical.total}</div>
                    <div className="bg-white bg-opacity-20 rounded-full p-3 group-hover:bg-opacity-30 transition-all">
                      <UserGroupIcon className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="text-xl font-semibold mb-3">Medical Consultations</div>
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

                {/* Dental Consultations Card */}
                <div className="group bg-gradient-to-br from-[#a83232] to-[#c94f4f] text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-bold">{stats.dental.total}</div>
                    <div className="bg-white bg-opacity-20 rounded-full p-3 group-hover:bg-opacity-30 transition-all">
                      <UserGroupIcon className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="text-xl font-semibold mb-3">Dental Consultations</div>
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

                {/* Medical Documents Card */}
                <div className="group bg-gradient-to-br from-[#c94f4f] to-[#e57373] text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl font-bold">{stats.documents.total}</div>
                    <div className="bg-white bg-opacity-20 rounded-full p-3 group-hover:bg-opacity-30 transition-all">
                      <DocumentTextIcon className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="text-xl font-semibold mb-3">Medical Documents</div>
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
                  <div className="text-xs opacity-80">Issued Rate</div>
                </div>

                {/* Patient Profiles Card */}
                <div className="group bg-gradient-to-br from-[#e57373] to-[#ffab91] text-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
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
              </div>

              {/* Enhanced Interactive Data Visualization */}
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Data Overview</h3>
                    <p className="text-gray-600">Interactive comparison of all health services</p>
                  </div>
                  <ChartBarIcon className="w-8 h-8 text-[#800000]" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Bar Chart Visualization */}
                  <div className="relative">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Total Records by Category</h4>
                    <div className="flex items-end justify-between space-x-4 h-64 bg-gradient-to-t from-gray-50 to-white p-4 rounded-xl border">
                      {chartData.map((d, i) => (
                        <div key={i} className="flex flex-col items-center group flex-1">
                          <div className="relative w-full">
                            <div
                              className="w-full rounded-t-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 cursor-pointer relative overflow-hidden"
                              style={{
                                height: `${(d.value / maxValue) * 200 + 20}px`,
                                background: `linear-gradient(to top, ${d.color}, ${d.color}dd)`,
                              }}
                              title={`${d.label}: ${d.value} total, ${d.completed} completed`}
                            >
                              {/* Completion overlay */}
                              <div
                                className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-40 rounded-t-xl"
                                style={{
                                  height: `${(d.completed / d.value) * 100}%`,
                                }}
                              ></div>
                              {/* Value label */}
                              <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                                <span className="text-white text-sm font-bold bg-black bg-opacity-20 px-2 py-1 rounded">
                                  {d.value}
                                </span>
                              </div>
                            </div>
                            {/* Hover tooltip */}
                            <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                              {d.completed}/{d.value} completed
                            </div>
                          </div>
                          <span className="mt-3 text-sm font-semibold text-gray-700 text-center">{d.label}</span>
                          <span className="text-xs text-gray-500">{((d.completed / d.value) * 100).toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Statistics */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-700 mb-4">Quick Statistics</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center">
                          <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                          <span className="font-medium text-green-800">Total Completed</span>
                        </div>
                        <span className="text-2xl font-bold text-green-600">
                          {stats.medical.completed + stats.dental.completed}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                        <div className="flex items-center">
                          <ClockIcon className="w-6 h-6 text-yellow-600 mr-3" />
                          <span className="font-medium text-yellow-800">Total Pending</span>
                        </div>
                        <span className="text-2xl font-bold text-yellow-600">
                          {stats.medical.pending + stats.dental.pending + stats.documents.pending}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                        <div className="flex items-center">
                          <XCircleIcon className="w-6 h-6 text-red-600 mr-3" />
                          <span className="font-medium text-red-800">Total Rejected</span>
                        </div>
                        <span className="text-2xl font-bold text-red-600">
                          {stats.medical.rejected + stats.dental.rejected}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center">
                          <EyeIcon className="w-6 h-6 text-blue-600 mr-3" />
                          <span className="font-medium text-blue-800">Active Patients</span>
                        </div>
                        <span className="text-2xl font-bold text-blue-600">
                          {stats.patients.verified}
                        </span>
                      </div>
                    </div>

                    {/* Overall Performance */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-[#800000] to-[#a83232] rounded-xl text-white">
                      <h5 className="font-semibold mb-3">Overall System Performance</h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Average Completion Rate</span>
                          <span className="font-bold">
                            {(
                              (medicalCompletionRate + dentalCompletionRate + documentsCompletionRate + patientsVerificationRate) / 4
                            ).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                          <div
                            className="bg-white rounded-full h-2 transition-all duration-500"
                            style={{ 
                              width: `${(medicalCompletionRate + dentalCompletionRate + documentsCompletionRate + patientsVerificationRate) / 4}%` 
                            }}
                          ></div>
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