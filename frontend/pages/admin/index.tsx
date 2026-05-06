import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import withAdminAccess from '../../components/withAdminAccess';
import { generateServiceSpecificCSV, generateServiceSpecificPDFReport, generatePDFReport, downloadFile } from '../../utils/reportExport';
import UserTypeDetailsModal from '../../components/UserTypeDetailsModal';
import {
  ArrowPathIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface UserTypeInformation {
  id: number;
  name: string; // Changed from user_type
  enabled: boolean; // Changed from is_active
  description?: string;
  required_fields: string[];
  available_courses: string[];
  available_departments: string[];
  available_strands: string[];
  year_levels: string[]; // Changed from available_year_levels
  position_types: string[];
  created_at: string;
  updated_at: string;
}

interface StatisticsData {
  semester: { id: number | null; name: string };
  medical: { total: number; completed: number; pending: number; rejected: number };
  dental: { total: number; completed: number; pending: number; rejected: number };
  documents: { total: number; issued: number; pending: number };
  patients: { total: number; verified: number; unverified: number };
  user_type_breakdown: any;
  detailed_demographics: any;
  monthly_trends: any[];
  completion_rates: { medical: number; dental: number; documents: number; overall: number };
  clinicians?: Array<{
    id: number;
    name: string;
    consultations: number;
    medical_count?: number;
    dental_count?: number;
    document_count?: number;
  }>;
  medicine_usage?: Array<{ name: string; quantity: number; unit: string; type: string }>;
  medical_med_total_entries?: number;
}


function AdminDashboard() {
  const [stats, setStats] = useState<StatisticsData>({
    semester: { id: null, name: "Loading..." },
    medical: { total: 0, completed: 0, pending: 0, rejected: 0 },
    dental: { total: 0, completed: 0, pending: 0, rejected: 0 },
    documents: { total: 0, issued: 0, pending: 0 },
    patients: { total: 0, verified: 0, unverified: 0 },
    user_type_breakdown: {},
    detailed_demographics: {},
    monthly_trends: [],
    completion_rates: { medical: 0, dental: 0, documents: 0, overall: 0 },
  });
  const [userTypeInformations, setUserTypeInformations] = useState<UserTypeInformation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'medical' | 'dental' | 'certificates'>('medical');
  const [navigating, setNavigating] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState<string | null>(null);
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

  // User type details modal handler
  const handleUserTypeClick = (userType: string) => {
    setSelectedUserType(userType);
    setShowDetailsModal(true);
  };

  // Fetch UserTypeInformation configurations
  const fetchUserTypeInformations = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api'}/admin-controls/user-type-information/`, 
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        }
      );
      
      setUserTypeInformations(response.data);
    } catch (err: any) {
      console.error('Failed to fetch user type information:', err);
      // Use fallback demo data
      setUserTypeInformations([
        {
          id: 1,
          name: 'College',
          enabled: true,
          description: 'Undergraduate college students',
          required_fields: ['student_id', 'year_level', 'course', 'department'],
          available_courses: ['Computer Science', 'Engineering', 'Business', 'Education'],
          available_departments: ['CCS', 'Engineering', 'Business', 'Education'],
          available_strands: [],
          year_levels: ['1st Year', '2nd Year', '3rd Year', '4th Year'],
          position_types: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 2,
          name: 'High School',
          enabled: true,
          description: 'Junior high school students',
          required_fields: ['student_id', 'grade_level', 'section'],
          available_courses: [],
          available_departments: ['Junior High'],
          available_strands: [],
          year_levels: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
          position_types: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);
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
      
      // Fetch both statistics and user type configurations
      await Promise.all([
        (async () => {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api'}/admin-controls/system_configuration/dashboard_statistics/`, 
            { 
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000
            }
          );
          setStats(response.data);
        })(),
        fetchUserTypeInformations()
      ]);
      
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
      
      // Fallback to demo data with enhanced user type breakdown
      const demoStats = {
        semester: { id: null, name: "Demo Data - API Connection Failed" },
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
        detailed_demographics: {
          'College': {
            total: 150,
            details: {
              by_year_level: { '1st Year': 40, '2nd Year': 35, '3rd Year': 40, '4th Year': 35 },
              by_course: { 'Computer Science': 50, 'Engineering': 40, 'Business': 35, 'Education': 25 },
              by_department: { 'CCS': 50, 'Engineering': 40, 'Business': 35, 'Education': 25 }
            }
          },
          'Employee': {
            total: 15,
            details: {
              by_position_type: { 'Teaching': 10, 'Non-Teaching': 5 },
              by_department: { 'Academic': 10, 'Administrative': 5 }
            }
          },
          'High School': {
            total: 100,
            details: {
              by_grade_level: { 'Grade 7': 25, 'Grade 8': 25, 'Grade 9': 25, 'Grade 10': 25 },
              by_department: { 'Main Campus': 100 }
            }
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
      };
      
      setStats(demoStats);
      setLastUpdated(new Date());
      
      if (err.response?.status === 403) {
        setError('You do not have permission to view this dashboard.');
      } else if (err.code === 'ECONNABORTED') {
        setError('Request timed out. Please try again.');
      } else {
        setError('Failed to load statistics. Using demo data for preview.');
      }
      setLoading(false);
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
      
      // Find corresponding UserTypeInformation configuration
      const configuration = userTypeInformations.find(uti => uti.name === userType);
      
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
        patients: data?.patients || { total: 0, verified: 0, unverified: 0 },
        // Add configuration data for enhanced reporting
        configuration: configuration ? {
          enabled: configuration.enabled,
          description: configuration.description,
          required_fields: configuration.required_fields,
          available_options: {
            courses: configuration.available_courses,
            departments: configuration.available_departments,
            strands: configuration.available_strands,
            year_levels: configuration.year_levels,
            position_types: configuration.position_types
          }
        } : {
          enabled: true,
          description: undefined,
          required_fields: [],
          available_options: {
            courses: [],
            departments: [],
            strands: [],
            year_levels: [],
            position_types: []
          }
        }
      };
    }).sort((a, b) => b.totalTransactions - a.totalTransactions);
  };

  // Service-specific export functions
  const handleServiceSpecificCSVExport = async (serviceType: 'medical' | 'dental' | 'certificates', reportType: 'weekly' | 'monthly' | 'yearly') => {
    try {
      let medicalInventory: Array<{ item_name: string; quantity_used: number; unit?: string; total_cost?: number; }> | undefined;
      
      // Fetch dental inventory data if needed
      if (serviceType === 'dental') {
        try {
          const inventoryToken = localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('accessToken');
          const response = await fetch(`/api/patients/dental_inventory_usage/?type=${reportType}`, {
            headers: {
              'Authorization': inventoryToken ? `Bearer ${inventoryToken}` : '',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            medicalInventory = data.inventory_usage;
          }
        } catch (error) {
          console.warn('Could not fetch dental inventory data:', error);
        }
      }
      
      // Normalize inventory data for CSV as well
      const normalizedInventoryForCSV = medicalInventory?.map(item => ({
        item_name: item.item_name,
        quantity_used: item.quantity_used,
        unit: item.unit || 'pcs',
        total_cost: item.total_cost
      }));
      
      const csvContent = generateServiceSpecificCSV(stats, getUserTypeData(), serviceType, reportType, normalizedInventoryForCSV);
      const filename = `wmsu-health-${serviceType}-${reportType}-demographic-report-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}.csv`;
      downloadFile(filename, csvContent, 'csv');
    } catch (error) {
      console.error('Error generating service-specific CSV:', error);
      alert('Failed to generate service-specific CSV report. Please try again.');
    }
  };

  const handleServiceSpecificPDFExport = async (serviceType: 'medical' | 'dental' | 'certificates', reportType: 'weekly' | 'monthly' | 'yearly') => {
    try {
      let medicalInventory: Array<{ item_name: string; quantity_used: number; unit?: string; total_cost?: number; }> | undefined;
      
      // Fetch dental inventory data if needed
      if (serviceType === 'dental') {
        try {
          const inventoryToken = localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('accessToken');
          const response = await fetch(`/api/patients/dental_inventory_usage/?type=${reportType}`, {
            headers: {
              'Authorization': inventoryToken ? `Bearer ${inventoryToken}` : '',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            medicalInventory = data.inventory_usage;
          }
        } catch (error) {
          console.warn('Could not fetch dental inventory data:', error);
        }
      }
      
      // Ensure medical inventory items have required unit field
      const normalizedInventory = medicalInventory?.map(item => ({
        item_name: item.item_name,
        quantity_used: item.quantity_used,
        unit: item.unit || 'pcs', // Default unit if not provided
        total_cost: item.total_cost,
        usage_date: new Date().toISOString() // Add required usage_date
      }));
      
      const serviceLabels = {
        medical: 'Medical Consultations',
        dental: 'Dental Consultations',
        certificates: 'Medical Documents',
      } as const;

      await generateServiceSpecificPDFReport(stats, getUserTypeData(), serviceType, reportType, normalizedInventory);
      alert(`${serviceLabels[serviceType]} ${reportType} PDF report generated successfully!`);
    } catch (error) {
      console.error('Error generating service-specific PDF:', error);
      alert('Failed to generate service-specific PDF report. Please try again.');
    }
  };

  const reportRowsByTab: Record<'medical' | 'dental' | 'certificates', Array<{ label: string; service: 'medical' | 'dental' | 'certificates' }>> = {
    medical: [{ label: 'Medical Consultations', service: 'medical' }],
    dental: [{ label: 'Dental Consultations', service: 'dental' }],
    certificates: [{ label: 'Medical Documents', service: 'certificates' }],
  };

  const activeReportRows = reportRowsByTab[activeTab];
  const activeReportLabel = reportRowsByTab[activeTab][0].label;

  const reportPeriods: Array<{ key: 'weekly' | 'monthly' | 'yearly'; label: string }> = [
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'yearly', label: 'Yearly' },
  ];

  return (
    <AdminLayout>
      <div className="flex-1 space-y-4 sm:space-y-6 p-4 sm:p-6 pt-4 sm:pt-6">
        {/* Header with Enhanced Information */}
        <div className="rounded-xl border bg-white shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#800000]">
                Admin Dashboard
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Health Services Management System - Overview
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              {navigating && (
                <div className="text-xs sm:text-sm text-blue-600 flex items-center">
                  <ArrowPathIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 animate-spin" />
                  <span className="hidden sm:inline">Navigating...</span>
                </div>
              )}
              {lastUpdated && (
                <div className="text-xs sm:text-sm text-gray-500 flex items-center">
                  <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="hidden sm:inline">Last updated: {lastUpdated.toLocaleTimeString()}</span>
                  <span className="sm:hidden">{lastUpdated.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                  refreshing 
                    ? 'border border-gray-200 bg-gray-100 text-gray-500' 
                    : 'border border-gray-200 bg-[#800000] text-white hover:bg-[#a83232]'
                } h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm`}
              >
                <ArrowPathIcon className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                <span className="sm:hidden">↻</span>
              </button>
              <button
                onClick={() => generatePDFReport(stats, getUserTypeData())}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-200 bg-slate-800 text-white hover:bg-slate-900 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <DocumentTextIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden sm:inline">Export Full PDF</span>
                <span className="sm:hidden">PDF</span>
              </button>
            </div>
          </div>
          
          {/* Current Semester Display */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 rounded-lg border border-blue-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
              <div className="flex items-center flex-wrap">
                <CalendarDaysIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 mr-2">Current Academic Year:</span>
                <span className={`text-xs sm:text-sm ${stats.semester.name === "Not Available" || stats.semester.name === "Not Set" ? "text-orange-600" : "text-blue-600"} font-bold`}>
                  {stats.semester.name}
                </span>
              </div>
              {!error && (
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  <span className="text-xs sm:text-sm font-medium">System Online</span>
                </div>
              )}
            </div>
          </div>

          {/* New Dashboard Insights - Performance & Resources */}
          {!loading && !error && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <h3 className="text-sm font-bold text-[#800000] mb-3 uppercase tracking-wider">Clinician Activity Highlights</h3>
                <div className="space-y-3">
                  {stats.clinicians && stats.clinicians.length > 0 ? (
                    stats.clinicians.slice(0, 3).map((clinician, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mr-3">
                            {idx + 1}
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{clinician.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{clinician.consultations} records</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No clinical activity recorded yet.</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border shadow-sm">
                <h3 className="text-sm font-bold text-[#800000] mb-3 uppercase tracking-wider">Resource Utilization Breakdown</h3>
                <div className="space-y-3">
                  {stats.medicine_usage && stats.medicine_usage.length > 0 ? (
                    stats.medicine_usage.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold mr-3">
                            <DocumentTextIcon className="w-4 h-4" />
                          </div>
                          <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{item.quantity} {item.unit || 'pcs'}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic">No inventory usage data available.</p>
                  )}
                  {stats.medical_med_total_entries > 0 && (
                    <div className="pt-2 border-t text-xs text-gray-500 flex justify-between">
                      <span>Total Medical Prescriptions:</span>
                      <span className="font-bold">{stats.medical_med_total_entries} entries</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="rounded-xl border bg-white shadow">
          <div className="border-b border-gray-200 overflow-x-auto">
            <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('medical')}
                className={`${
                  activeTab === 'medical'
                    ? 'border-[#800000] text-[#800000]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200`}
              >
                <div className="flex items-center">
                  <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Medical Consultations</span>
                  <span className="sm:hidden">Medical</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('dental')}
                className={`${
                  activeTab === 'dental'
                    ? 'border-[#800000] text-[#800000]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200`}
              >
                <div className="flex items-center">
                  <UserGroupIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Dental Consultations</span>
                  <span className="sm:hidden">Dental</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('certificates')}
                className={`${
                  activeTab === 'certificates'
                    ? 'border-[#800000] text-[#800000]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200`}
              >
                <div className="flex items-center">
                  <DocumentTextIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Medical Certificates</span>
                  <span className="sm:hidden">Certificates</span>
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
          <div className="space-y-6">
            {/* Common Status Section - Dynamic based on tab */}
            <div className="rounded-xl border bg-white shadow">
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                  <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-[#800000]" />
                  {activeTab === 'medical' ? 'Medical' : activeTab === 'dental' ? 'Dental' : 'Certificate'} Service Configuration Status
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Service-specific configuration and utilization overview
                </p>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Total {activeTab === 'certificates' ? 'Issued' : 'Consultations'}</span>
                      <DocumentTextIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {activeTab === 'medical' ? stats.medical.total : activeTab === 'dental' ? stats.dental.total : stats.documents.total}
                    </div>
                    <p className="text-xs text-blue-700">
                      System-wide total for {activeTab}
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-900">Completion Status</span>
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {activeTab === 'medical' ? stats.medical.completed : activeTab === 'dental' ? stats.dental.completed : stats.documents.issued}
                    </div>
                    <p className="text-xs text-green-700">
                      Processed and finalized records
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-900">Pending Requests</span>
                      <ClockIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {activeTab === 'medical' ? stats.medical.pending : activeTab === 'dental' ? stats.dental.pending : stats.documents.pending}
                    </div>
                    <p className="text-xs text-purple-700">
                      Awaiting staff action
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Individual User Type Overview */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {getUserTypeData().map((userType) => {
                  const currentStats = activeTab === 'medical' ? userType.medical : activeTab === 'dental' ? userType.dental : userType.documents;
                  const rate = activeTab === 'medical' ? userType.medicalRate : activeTab === 'dental' ? userType.dentalRate : userType.documentRate;
                  const label = activeTab === 'certificates' ? 'Issued' : 'Completed';

                  return (
                    <div 
                      key={userType.userType} 
                      className="rounded-xl border bg-white shadow p-4 sm:p-6 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
                      onClick={() => handleUserTypeClick(userType.userType)}
                    >
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
                          <span className="text-gray-600">Total Records:</span>
                          <span className="font-semibold">{currentStats.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">{label}:</span>
                          <span className="font-semibold text-green-600">{activeTab === 'certificates' ? (currentStats as any).issued : (currentStats as any).completed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pending:</span>
                          <span className="font-semibold text-yellow-600">{currentStats.pending}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Completion Rate:</span>
                          <span className="font-semibold text-[#800000]">{rate.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-[#800000] to-[#a83232] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${rate}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Service Reports Table */}
              <div className="rounded-xl border bg-white shadow p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900">Reports</h3>
                    <p className="text-xs sm:text-sm text-slate-600">{activeReportLabel}</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border border-slate-200 rounded-lg">
                    <thead className="bg-slate-50 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Report Type</th>
                        {reportPeriods.map(period => (
                          <th key={period.key} className="px-4 py-3 text-left font-semibold">{period.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {activeReportRows.map(row => (
                        <tr key={row.service} className="bg-white">
                          <td className="px-4 py-3 font-medium text-slate-900">{row.label}</td>
                          {reportPeriods.map(period => (
                            <td key={`${row.service}-${period.key}`} className="px-4 py-3">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleServiceSpecificPDFExport(row.service, period.key)}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-700 hover:bg-slate-800 rounded-md transition-colors"
                                >
                                  PDF
                                </button>
                                <button
                                  onClick={() => handleServiceSpecificCSVExport(row.service, period.key)}
                                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                                >
                                  CSV
                                </button>
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Quick Actions Footer - Dynamic based on tab */}
              <div className="rounded-xl border bg-gradient-to-br from-[#800000] to-[#a83232] text-white shadow p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
                  {activeTab === 'medical' ? 'Medical' : activeTab === 'dental' ? 'Dental' : 'Certificate'} Quick Actions
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {activeTab === 'medical' ? (
                    <>
                      <button onClick={() => handleQuickAction('medical-forms')} className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all hover:scale-105">
                        <div className="font-medium">Medical Forms</div>
                        <div className="text-sm opacity-90">View all consultations</div>
                      </button>
                      <button onClick={() => handleQuickAction('patient-reports')} className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all hover:scale-105">
                        <div className="font-medium">Patient Profiles</div>
                        <div className="text-sm opacity-90">Manage patient records</div>
                      </button>
                      <button onClick={() => handleQuickAction('appointments')} className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all hover:scale-105">
                        <div className="font-medium">Appointments</div>
                        <div className="text-sm opacity-90">Manage schedules</div>
                      </button>
                    </>
                  ) : activeTab === 'dental' ? (
                    <>
                      <button onClick={() => handleQuickAction('dental-forms')} className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all hover:scale-105">
                        <div className="font-medium">Dental Forms</div>
                        <div className="text-sm opacity-90">View all consultations</div>
                      </button>
                      <button onClick={() => handleQuickAction('medicine-inventory')} className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all hover:scale-105">
                        <div className="font-medium">Medicine Inventory</div>
                        <div className="text-sm opacity-90">Manage supplies</div>
                      </button>
                      <button onClick={() => handleQuickAction('dental-reports')} className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all hover:scale-105">
                        <div className="font-medium">Dental Analytics</div>
                        <div className="text-sm opacity-90">View reports</div>
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleQuickAction('issue-certificate')} className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all hover:scale-105">
                        <div className="font-medium">Issue Certificate</div>
                        <div className="text-sm opacity-90">Create new documents</div>
                      </button>
                      <button onClick={() => handleQuickAction('review-requests')} className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all hover:scale-105">
                        <div className="font-medium">Review Requests</div>
                        <div className="text-sm opacity-90">Verify applications</div>
                      </button>
                      <button onClick={() => handleQuickAction('document-reports')} className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-4 text-left transition-all hover:scale-105">
                        <div className="font-medium">Document Archive</div>
                        <div className="text-sm opacity-90">History and reports</div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Type Details Modal */}
      {showDetailsModal && selectedUserType && (
        <UserTypeDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUserType(null);
          }}
          userType={selectedUserType}
          userTypeData={stats.user_type_breakdown?.[selectedUserType] || {}}
          detailedBreakdown={stats.detailed_demographics?.[selectedUserType] || {}}
        />
      )}
    </AdminLayout>
  );
}

export default withAdminAccess(AdminDashboard);