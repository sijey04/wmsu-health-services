import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import withAdminAccess from '../../components/withAdminAccess';
import {
  ArrowPathIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface StatisticsData {
  semester: { id: number | null; name: string };
  medical: { total: number; completed: number; pending: number; rejected: number };
  dental: { total: number; completed: number; pending: number; rejected: number };
  documents: { total: number; issued: number; pending: number };
  patients: { total: number; verified: number; unverified: number };
  user_type_breakdown: any;
  monthly_trends: any[];
  completion_rates: { medical: number; dental: number; documents: number; overall: number };
}

// CSV download function
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
    user_type_breakdown: {},
    monthly_trends: [],
    completion_rates: { medical: 0, dental: 0, documents: 0, overall: 0 },
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
      
      // Get token from localStorage
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login again.');
        router.push('/login');
        return;
      }
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api'}/admin-controls/system_configuration/dashboard_statistics/`, 
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
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
      
      // Fallback to demo data with enhanced user type breakdown
      setStats({
        semester: { id: null, name: "Demo Data" },
        medical: { total: 120, completed: 90, pending: 20, rejected: 10 },
        dental: { total: 80, completed: 60, pending: 15, rejected: 5 },
        documents: { total: 200, issued: 180, pending: 20 },
        patients: { total: 350, verified: 300, unverified: 50 },
        user_type_breakdown: {
          'College': {
            medical: { total: 45, completed: 35, pending: 8, rejected: 2 },
            dental: { total: 30, completed: 25, pending: 4, rejected: 1 },
            documents: { total: 80, issued: 75, pending: 5 },
            patients: { total: 150, verified: 140, unverified: 10 }
          },
          'High School': {
            medical: { total: 35, completed: 28, pending: 5, rejected: 2 },
            dental: { total: 25, completed: 20, pending: 4, rejected: 1 },
            documents: { total: 60, issued: 55, pending: 5 },
            patients: { total: 100, verified: 90, unverified: 10 }
          },
          'Senior High School': {
            medical: { total: 25, completed: 20, pending: 4, rejected: 1 },
            dental: { total: 15, completed: 10, pending: 4, rejected: 1 },
            documents: { total: 40, issued: 35, pending: 5 },
            patients: { total: 60, verified: 55, unverified: 5 }
          },
          'Elementary': {
            medical: { total: 10, completed: 5, pending: 3, rejected: 2 },
            dental: { total: 8, completed: 4, pending: 2, rejected: 2 },
            documents: { total: 15, issued: 12, pending: 3 },
            patients: { total: 25, verified: 12, unverified: 13 }
          },
          'Employee': {
            medical: { total: 5, completed: 2, pending: 0, rejected: 3 },
            dental: { total: 2, completed: 1, pending: 1, rejected: 0 },
            documents: { total: 5, issued: 3, pending: 2 },
            patients: { total: 15, verified: 3, unverified: 12 }
          }
        },
        monthly_trends: [
          { month: 'Jan', medical: 15, dental: 10, documents: 25 },
          { month: 'Feb', medical: 18, dental: 12, documents: 30 },
          { month: 'Mar', medical: 22, dental: 15, documents: 35 },
          { month: 'Apr', medical: 25, dental: 18, documents: 40 },
          { month: 'May', medical: 20, dental: 15, documents: 35 },
          { month: 'Jun', medical: 20, dental: 10, documents: 35 }
        ],
        completion_rates: { medical: 75, dental: 75, documents: 90, overall: 80 },
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

  // Reset navigation state if the route doesn't change within a reasonable time
  useEffect(() => {
    if (navigating) {
      const timeout = setTimeout(() => {
        setNavigating(false);
      }, 5000); // Reset after 5 seconds

      return () => clearTimeout(timeout);
    }
  }, [navigating]);

  // CSV data generation functions
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

  // Calculate percentages
  const medicalCompletionRate = stats.medical.total > 0 ? (stats.medical.completed / stats.medical.total) * 100 : 0;
  const dentalCompletionRate = stats.dental.total > 0 ? (stats.dental.completed / stats.dental.total) * 100 : 0;
  const documentsCompletionRate = stats.documents.total > 0 ? (stats.documents.issued / stats.documents.total) * 100 : 0;
  const patientsVerificationRate = stats.patients.total > 0 ? (stats.patients.verified / stats.patients.total) * 100 : 0;

  const getUserTypeData = () => {
    const userTypes = Object.keys(stats.user_type_breakdown || {});
    return userTypes.map(userType => {
      const data = stats.user_type_breakdown[userType];
      const totalTransactions = (data?.medical?.total || 0) + (data?.dental?.total || 0) + (data?.documents?.total || 0);
      const completedTransactions = (data?.medical?.completed || 0) + (data?.dental?.completed || 0) + (data?.documents?.issued || 0);
      
      return {
        userType,
        totalTransactions,
        completedTransactions,
        completionRate: totalTransactions > 0 ? ((completedTransactions / totalTransactions) * 100) : 0,
        medicalRate: (data?.medical?.total || 0) > 0 ? ((data?.medical?.completed || 0) / (data?.medical?.total || 0)) * 100 : 0,
        dentalRate: (data?.dental?.total || 0) > 0 ? ((data?.dental?.completed || 0) / (data?.dental?.total || 0)) * 100 : 0,
        documentRate: (data?.documents?.total || 0) > 0 ? ((data?.documents?.issued || 0) / (data?.documents?.total || 0)) * 100 : 0,
        medical: data?.medical || { total: 0, completed: 0, pending: 0, rejected: 0 },
        dental: data?.dental || { total: 0, completed: 0, pending: 0, rejected: 0 },
        documents: data?.documents || { total: 0, issued: 0, pending: 0 },
        patients: data?.patients || { total: 0, verified: 0, unverified: 0 }
      };
    }).sort((a, b) => b.totalTransactions - a.totalTransactions);
  };

  return (
    <AdminLayout>
      <div className="flex-1 space-y-6 p-6 pt-6">
        {/* Header with Enhanced Information */}
        <div className="rounded-xl border bg-white shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight text-[#800000]">
                Admin Dashboard
              </h2>
              <p className="text-sm text-gray-600">
                Health Services Management System - Overview
              </p>
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
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  refreshing 
                    ? 'border border-gray-200 bg-gray-100 text-gray-500' 
                    : 'border border-gray-200 bg-[#800000] text-white hover:bg-[#a83232]'
                } h-9 px-3`}
              >
                <ArrowPathIcon className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          {/* Current Semester Display */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CalendarDaysIcon className="w-5 h-5 text-blue-600 mr-2" />
                <span className="font-medium text-gray-700 mr-2">Current Academic Year:</span>
                <span className={`${stats.semester.name === "Not Available" || stats.semester.name === "Not Set" ? "text-orange-600" : "text-blue-600"} font-bold`}>
                  {stats.semester.name}
                </span>
              </div>
              {!error && (
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">System Online</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="rounded-xl border bg-white shadow">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('medical')}
                className={`${
                  activeTab === 'medical'
                    ? 'border-[#800000] text-[#800000]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
              >
                <div className="flex items-center">
                  <UserGroupIcon className="w-4 h-4 mr-2" />
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
                  <UserGroupIcon className="w-4 h-4 mr-2" />
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
                  <DocumentTextIcon className="w-4 h-4 mr-2" />
                  Medical Certificates
                </div>
              </button>
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="ml-4 text-sm text-gray-600">Loading dashboard statistics...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error Loading Data
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleRefresh}
                    className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Try Again
                  </button>
                </div>
                <p className="text-xs text-gray-600 mt-2">Showing demo data for interface preview</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Medical Consultations Card */}
              <div className="rounded-xl border bg-white shadow">
                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Medical</h3>
                  <UserGroupIcon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="p-6 pt-0">
                  <div className="text-2xl font-bold">{stats.medical.total}</div>
                  <p className="text-xs text-gray-600">
                    {medicalCompletionRate.toFixed(1)}% completion rate
                  </p>
                </div>
              </div>

              {/* Dental Consultations Card */}
              <div className="rounded-xl border bg-white shadow">
                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Dental</h3>
                  <UserGroupIcon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="p-6 pt-0">
                  <div className="text-2xl font-bold">{stats.dental.total}</div>
                  <p className="text-xs text-gray-600">
                    {dentalCompletionRate.toFixed(1)}% completion rate
                  </p>
                </div>
              </div>

              {/* Total Patients Card */}
              <div className="rounded-xl border bg-white shadow">
                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Patients</h3>
                  <UserGroupIcon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="p-6 pt-0">
                  <div className="text-2xl font-bold">{stats.patients.total}</div>
                  <p className="text-xs text-gray-600">
                    {patientsVerificationRate.toFixed(1)}% verified
                  </p>
                </div>
              </div>

              {/* Documents Card */}
              <div className="rounded-xl border bg-white shadow">
                <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Documents</h3>
                  <DocumentTextIcon className="h-4 w-4 text-gray-600" />
                </div>
                <div className="p-6 pt-0">
                  <div className="text-2xl font-bold">{stats.documents.issued}</div>
                  <p className="text-xs text-gray-600">
                    {documentsCompletionRate.toFixed(1)}% completion rate
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Content with User Type Organization */}
            {activeTab === 'medical' && (
              <div className="space-y-6">
                {/* Medical Overview by User Type */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {getUserTypeData().slice(0, 6).map((userType, index) => (
                    <div key={userType.userType} className="rounded-xl border bg-white shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">{userType.userType}</h3>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#800000] to-[#a83232] flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {userType.userType.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Medical Total:</span>
                          <span className="font-semibold">{userType.medical.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completed:</span>
                          <span className="font-semibold text-green-600">{userType.medical.completed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pending:</span>
                          <span className="font-semibold text-yellow-600">{userType.medical.pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completion Rate:</span>
                          <span className="font-semibold text-[#800000]">{userType.medicalRate.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#800000] to-[#a83232] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${userType.medicalRate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Medical Quick Actions */}
                <div className="rounded-xl border bg-gradient-to-br from-[#800000] to-[#a83232] text-white shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Medical Consultation Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleQuickAction('medical-forms')}
                      disabled={navigating}
                      className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all duration-200 ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    >
                      <div className="font-medium">View Medical Forms</div>
                      <div className="text-sm opacity-90">Review all medical consultations</div>
                    </button>
                    <button
                      onClick={() => handleQuickAction('patient-reports')}
                      disabled={navigating}
                      className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all duration-200 ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    >
                      <div className="font-medium">Patient Profiles</div>
                      <div className="text-sm opacity-90">Manage patient information</div>
                    </button>
                    <button
                      onClick={() => handleQuickAction('appointments')}
                      disabled={navigating}
                      className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all duration-200 ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    >
                      <div className="font-medium">Appointments</div>
                      <div className="text-sm opacity-90">Schedule management</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'dental' && (
              <div className="space-y-6">
                {/* Dental Overview by User Type */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {getUserTypeData().slice(0, 6).map((userType, index) => (
                    <div key={userType.userType} className="rounded-xl border bg-white shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">{userType.userType}</h3>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#800000] to-[#a83232] flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {userType.userType.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Dental Total:</span>
                          <span className="font-semibold">{userType.dental.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completed:</span>
                          <span className="font-semibold text-green-600">{userType.dental.completed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pending:</span>
                          <span className="font-semibold text-yellow-600">{userType.dental.pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completion Rate:</span>
                          <span className="font-semibold text-[#800000]">{userType.dentalRate.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#800000] to-[#a83232] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${userType.dentalRate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dental Quick Actions */}
                <div className="rounded-xl border bg-gradient-to-br from-[#800000] to-[#a83232] text-white shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Dental Services Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleQuickAction('dental-forms')}
                      disabled={navigating}
                      className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all duration-200 ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    >
                      <div className="font-medium">Dental Forms</div>
                      <div className="text-sm opacity-90">Review dental consultations</div>
                    </button>
                    <button
                      onClick={() => handleQuickAction('medicine-inventory')}
                      disabled={navigating}
                      className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all duration-200 ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    >
                      <div className="font-medium">Medicine Inventory</div>
                      <div className="text-sm opacity-90">Manage dental supplies</div>
                    </button>
                    <button
                      onClick={() => handleQuickAction('dental-reports')}
                      disabled={navigating}
                      className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all duration-200 ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    >
                      <div className="font-medium">Dental Reports</div>
                      <div className="text-sm opacity-90">Analytics and insights</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'certificates' && (
              <div className="space-y-6">
                {/* Certificate Overview by User Type */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {getUserTypeData().slice(0, 6).map((userType, index) => (
                    <div key={userType.userType} className="rounded-xl border bg-white shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">{userType.userType}</h3>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#800000] to-[#a83232] flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {userType.userType.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Documents Total:</span>
                          <span className="font-semibold">{userType.documents.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Issued:</span>
                          <span className="font-semibold text-green-600">{userType.documents.issued}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pending:</span>
                          <span className="font-semibold text-yellow-600">{userType.documents.pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completion Rate:</span>
                          <span className="font-semibold text-[#800000]">{userType.documentRate.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#800000] to-[#a83232] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${userType.documentRate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Certificate Quick Actions */}
                <div className="rounded-xl border bg-gradient-to-br from-[#800000] to-[#a83232] text-white shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Medical Certificate Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => handleQuickAction('issue-certificate')}
                      disabled={navigating}
                      className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all duration-200 ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    >
                      <div className="font-medium">Issue Certificate</div>
                      <div className="text-sm opacity-90">Create new medical documents</div>
                    </button>
                    <button
                      onClick={() => handleQuickAction('review-requests')}
                      disabled={navigating}
                      className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all duration-200 ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    >
                      <div className="font-medium">Review Requests</div>
                      <div className="text-sm opacity-90">Pending document approvals</div>
                    </button>
                    <button
                      onClick={() => handleQuickAction('document-reports')}
                      disabled={navigating}
                      className={`w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all duration-200 ${navigating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}`}
                    >
                      <div className="font-medium">Document Reports</div>
                      <div className="text-sm opacity-90">Certificate analytics</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Chart and Activity Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              {/* System Activity Chart */}
              <div className="col-span-4 rounded-xl border bg-white shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Monthly Activity Trends</h3>
                    <div className="flex items-center space-x-2">
                      <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-200 bg-white hover:bg-gray-50 h-8 px-3">
                        Last 6 months
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Transaction trends across all services
                  </p>
                  
                  {/* Enhanced Bar Chart */}
                  <div className="h-[200px] mt-4">
                    {stats.monthly_trends && stats.monthly_trends.length > 0 ? (
                      <div className="h-full flex items-end justify-between space-x-2">
                        {stats.monthly_trends.map((item, index) => {
                          const maxVal = Math.max(...stats.monthly_trends.map(d => (d.medical || 0) + (d.dental || 0) + (d.documents || 0)), 1);
                          const totalVal = (item.medical || 0) + (item.dental || 0) + (item.documents || 0);
                          const height = maxVal > 0 ? Math.max((totalVal / maxVal) * 100, 5) : 5;
                          
                          const medicalHeight = maxVal > 0 ? Math.max(((item.medical || 0) / maxVal) * 100, 2) : 2;
                          const dentalHeight = maxVal > 0 ? Math.max(((item.dental || 0) / maxVal) * 100, 2) : 2;
                          const documentsHeight = maxVal > 0 ? Math.max(((item.documents || 0) / maxVal) * 100, 2) : 2;
                          
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center group">
                              <div className="w-full flex items-end justify-center mb-2 relative">
                                {/* Stacked bars */}
                                <div className="w-12 flex flex-col items-center">
                                  {/* Documents (top) */}
                                  <div 
                                    className="w-full bg-gradient-to-t from-[#c94f4f] to-[#e57373] rounded-t transition-all duration-500 hover:opacity-80 cursor-pointer"
                                    style={{ height: `${documentsHeight}px`, minHeight: '4px' }}
                                    title={`${item.month}: ${item.documents || 0} documents`}
                                  ></div>
                                  {/* Dental (middle) */}
                                  <div 
                                    className="w-full bg-gradient-to-t from-[#a83232] to-[#c94f4f] transition-all duration-500 hover:opacity-80 cursor-pointer"
                                    style={{ height: `${dentalHeight}px`, minHeight: '4px' }}
                                    title={`${item.month}: ${item.dental || 0} dental`}
                                  ></div>
                                  {/* Medical (bottom) */}
                                  <div 
                                    className="w-full bg-gradient-to-t from-[#800000] to-[#a83232] transition-all duration-500 hover:opacity-80 cursor-pointer"
                                    style={{ height: `${medicalHeight}px`, minHeight: '4px' }}
                                    title={`${item.month}: ${item.medical || 0} medical`}
                                  ></div>
                                </div>
                                
                                {/* Tooltip on hover */}
                                <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                                  <div className="text-center">
                                    <div className="font-semibold">{item.month}</div>
                                    <div>Total: {totalVal}</div>
                                    <div>Medical: {item.medical || 0}</div>
                                    <div>Dental: {item.dental || 0}</div>
                                    <div>Documents: {item.documents || 0}</div>
                                  </div>
                                </div>
                              </div>
                              <div className="text-xs text-gray-600 mt-1 font-medium">{item.month}</div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No chart data available</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Chart Legend */}
                  <div className="mt-4 flex justify-center space-x-6 text-xs">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gradient-to-t from-[#800000] to-[#a83232] rounded mr-2"></div>
                      <span>Medical</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gradient-to-t from-[#a83232] to-[#c94f4f] rounded mr-2"></div>
                      <span>Dental</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gradient-to-t from-[#c94f4f] to-[#e57373] rounded mr-2"></div>
                      <span>Documents</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Type Activity Feed */}
              <div className="col-span-3 rounded-xl border bg-white shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold mb-4">User Type Activity</h3>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {getUserTypeData().map((user, index) => (
                      <div key={user.userType} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#800000] to-[#a83232] flex items-center justify-center mr-4 flex-shrink-0">
                          <span className="text-sm font-bold text-white">
                            {user.userType.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.userType}</p>
                          <p className="text-xs text-gray-600">
                            {user.totalTransactions} total • {user.completedTransactions} completed
                          </p>
                          <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-[#800000] to-[#a83232] h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${user.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="text-right ml-4 flex-shrink-0">
                          <div className="text-sm font-bold text-[#800000]">
                            {user.completionRate.toFixed(0)}%
                          </div>
                          <div className="text-xs text-gray-500">completion</div>
                        </div>
                      </div>
                    ))}
                    
                    {getUserTypeData().length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <UserGroupIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No user activity data</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Export Reports Section */}
            <div className="rounded-xl border bg-gradient-to-br from-[#800000] to-[#a83232] text-white shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Export Reports</h3>
                  <p className="text-white text-opacity-90 text-sm">Download comprehensive data reports in CSV format</p>
                </div>
                <ArrowDownTrayIcon className="w-6 h-6 text-white text-opacity-80" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => downloadCSV('medical-consultations.csv', generateMedicalCSV())}
                  className="group flex items-center justify-between w-full py-3 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="text-sm">Medical Report</div>
                      <div className="text-xs text-white text-opacity-75">{stats.medical.total} records</div>
                    </div>
                  </div>
                  <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                </button>
                
                <button
                  onClick={() => downloadCSV('dental-consultations.csv', generateDentalCSV())}
                  className="group flex items-center justify-between w-full py-3 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="text-sm">Dental Report</div>
                      <div className="text-xs text-white text-opacity-75">{stats.dental.total} records</div>
                    </div>
                  </div>
                  <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                </button>
                
                <button
                  onClick={() => downloadCSV('medical-documents.csv', generateDocumentsCSV())}
                  className="group flex items-center justify-between w-full py-3 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center">
                    <DocumentTextIcon className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="text-sm">Documents Report</div>
                      <div className="text-xs text-white text-opacity-75">{stats.documents.total} records</div>
                    </div>
                  </div>
                  <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                </button>
                
                <button
                  onClick={() => downloadCSV('patient-profiles.csv', generatePatientsCSV())}
                  className="group flex items-center justify-between w-full py-3 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                >
                  <div className="flex items-center">
                    <UserGroupIcon className="w-5 h-5 mr-3" />
                    <div className="text-left">
                      <div className="text-sm">Patient Profiles</div>
                      <div className="text-xs text-white text-opacity-75">{stats.patients.total} records</div>
                    </div>
                  </div>
                  <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-white bg-opacity-10 rounded-lg">
                <p className="text-xs text-white text-opacity-90">
                  📊 Reports include current semester data with completion rates and detailed breakdowns.
                  All data is exported in CSV format for easy analysis.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAdminAccess(AdminDashboard);