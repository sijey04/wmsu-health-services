import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import withAdminAccess from '../../components/withAdminAccess';
import { BarChart, LineChart, DoughnutChart, MiniBarChart, MiniLineChart } from '../../components/Charts';
import { generatePDFReport, generateEnhancedCSV, generateServiceSpecificCSV, generateServiceSpecificPDFReport, downloadFile } from '../../utils/reportExport';
import UserTypeDetailsModal from '../../components/UserTypeDetailsModal';
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

  // Enhanced CSV data generation functions with comprehensive reports

  const generateMedicalCSV = () => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    let csvData = `"WMSU Health Services - Medical Consultations Report"\n`;
    csvData += `"Generated on: ${currentDate}"\n`;
    csvData += `"Academic Semester: ${stats.semester.name}"\n\n`;
    
    csvData += `"=== MEDICAL CONSULTATION SUMMARY ==="\n`;
    csvData += `"Metric","Value"\n`;
    csvData += `"Total Consultations","${stats.medical.total}"\n`;
    csvData += `"Completed","${stats.medical.completed}"\n`;
    csvData += `"Pending","${stats.medical.pending}"\n`;
    csvData += `"Rejected","${stats.medical.rejected}"\n`;
    csvData += `"Completion Rate","${medicalCompletionRate.toFixed(1)}%"\n\n`;
    
    csvData += `"=== BY USER TYPE ==="\n`;
    csvData += `"User Type","Total","Completed","Pending","Rejected","Rate (%)"\n`;
    getUserTypeData().forEach(userType => {
      csvData += `"${userType.userType}","${userType.medical.total}","${userType.medical.completed}","${userType.medical.pending}","${userType.medical.rejected}","${userType.medicalRate.toFixed(1)}"\n`;
    });
    
    return csvData;
  };

  const generateDentalCSV = () => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    let csvData = `"WMSU Health Services - Dental Consultations Report"\n`;
    csvData += `"Generated on: ${currentDate}"\n`;
    csvData += `"Academic Semester: ${stats.semester.name}"\n\n`;
    
    csvData += `"=== DENTAL CONSULTATION SUMMARY ==="\n`;
    csvData += `"Metric","Value"\n`;
    csvData += `"Total Consultations","${stats.dental.total}"\n`;
    csvData += `"Completed","${stats.dental.completed}"\n`;
    csvData += `"Pending","${stats.dental.pending}"\n`;
    csvData += `"Rejected","${stats.dental.rejected}"\n`;
    csvData += `"Completion Rate","${dentalCompletionRate.toFixed(1)}%"\n\n`;
    
    csvData += `"=== BY USER TYPE ==="\n`;
    csvData += `"User Type","Total","Completed","Pending","Rejected","Rate (%)"\n`;
    getUserTypeData().forEach(userType => {
      csvData += `"${userType.userType}","${userType.dental.total}","${userType.dental.completed}","${userType.dental.pending}","${userType.dental.rejected}","${userType.dentalRate.toFixed(1)}"\n`;
    });
    
    return csvData;
  };

  const generateDocumentsCSV = () => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    let csvData = `"WMSU Health Services - Medical Documents Report"\n`;
    csvData += `"Generated on: ${currentDate}"\n`;
    csvData += `"Academic Semester: ${stats.semester.name}"\n\n`;
    
    csvData += `"=== DOCUMENT ISSUANCE SUMMARY ==="\n`;
    csvData += `"Metric","Value"\n`;
    csvData += `"Total Documents","${stats.documents.total}"\n`;
    csvData += `"Issued","${stats.documents.issued}"\n`;
    csvData += `"Pending","${stats.documents.pending}"\n`;
    csvData += `"Completion Rate","${documentsCompletionRate.toFixed(1)}%"\n\n`;
    
    csvData += `"=== BY USER TYPE ==="\n`;
    csvData += `"User Type","Total","Issued","Pending","Rate (%)"\n`;
    getUserTypeData().forEach(userType => {
      csvData += `"${userType.userType}","${userType.documents.total}","${userType.documents.issued}","${userType.documents.pending}","${userType.documentRate.toFixed(1)}"\n`;
    });
    
    return csvData;
  };

  const generatePatientsCSV = () => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    let csvData = `"WMSU Health Services - Patient Profiles Report"\n`;
    csvData += `"Generated on: ${currentDate}"\n`;
    csvData += `"Academic Semester: ${stats.semester.name}"\n\n`;
    
    csvData += `"=== PATIENT PROFILE SUMMARY ==="\n`;
    csvData += `"Metric","Value"\n`;
    csvData += `"Total Patients","${stats.patients.total}"\n`;
    csvData += `"Verified","${stats.patients.verified}"\n`;
    csvData += `"Unverified","${stats.patients.unverified}"\n`;
    csvData += `"Verification Rate","${patientsVerificationRate.toFixed(1)}%"\n\n`;
    
    csvData += `"=== BY USER TYPE ==="\n`;
    csvData += `"User Type","Total","Verified","Unverified","Rate (%)"\n`;
    getUserTypeData().forEach(userType => {
      const verificationRate = userType.patients.total > 0 ? ((userType.patients.verified / userType.patients.total) * 100) : 0;
      csvData += `"${userType.userType}","${userType.patients.total}","${userType.patients.verified}","${userType.patients.unverified}","${verificationRate.toFixed(1)}"\n`;
    });
    
    return csvData;
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

  // PDF Export Functions
  const handlePDFExport = async (reportType: 'weekly' | 'monthly' | 'yearly') => {
    try {
      setNavigating(true);
      await generatePDFReport(stats, getUserTypeData(), reportType);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setNavigating(false);
    }
  };

  const handleEnhancedCSVExport = (reportType: 'weekly' | 'monthly' | 'yearly') => {
    try {
      const csvContent = generateEnhancedCSV(stats, getUserTypeData(), reportType);
      const filename = `wmsu-health-${reportType}-enhanced-report-${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${new Date().getDate().toString().padStart(2, '0')}.csv`;
      downloadFile(filename, csvContent, 'csv');
    } catch (error) {
      console.error('Error generating enhanced CSV:', error);
      alert('Failed to generate enhanced CSV report. Please try again.');
    }
  };

  // Service-specific export functions
  const handleServiceSpecificCSVExport = async (serviceType: 'medical' | 'dental' | 'certificates', reportType: 'weekly' | 'monthly' | 'yearly') => {
    try {
      let medicalInventory: Array<{ item_name: string; quantity_used: number; unit?: string; total_cost?: number; }> | undefined;
      
      // Fetch dental inventory data if needed
      if (serviceType === 'dental') {
        try {
          const response = await fetch(`/api/patients/dental_inventory_usage/?type=${reportType}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
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
          const response = await fetch(`/api/patients/dental_inventory_usage/?type=${reportType}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
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
      
      await generateServiceSpecificPDFReport(stats, getUserTypeData(), serviceType, reportType, normalizedInventory);
      alert(`${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} demographics ${reportType} PDF report generated successfully!`);
    } catch (error) {
      console.error('Error generating service-specific PDF:', error);
      alert('Failed to generate service-specific PDF report. Please try again.');
    }
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

            {/* User Type Configuration Status */}
            <div className="rounded-xl border bg-white shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <UserGroupIcon className="w-5 h-5 mr-2 text-[#800000]" />
                  User Type Configuration Status
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  System configuration overview and user type management
                </p>
              </div>
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Total Configurations */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Total User Types</span>
                      <UserGroupIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{userTypeInformations.length}</div>
                    <p className="text-xs text-blue-700">
                      {userTypeInformations.filter(uti => uti.enabled).length} active configurations
                    </p>
                  </div>

                  {/* Service Coverage */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-900">Service Coverage</span>
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {userTypeInformations.filter(uti => 
                        uti.enabled
                      ).length}
                    </div>
                    <p className="text-xs text-green-700">
                      User types with service access
                    </p>
                  </div>

                  {/* Configuration Health */}
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-purple-900">Avg. Required Fields</span>
                      <DocumentTextIcon className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-purple-600">
                      {userTypeInformations.length > 0 
                        ? (userTypeInformations.reduce((sum, uti) => sum + (uti.required_fields?.length || 0), 0) / userTypeInformations.length).toFixed(1)
                        : '0'
                      }
                    </div>
                    <p className="text-xs text-purple-700">
                      Fields per user type
                    </p>
                  </div>
                </div>
                
                {userTypeInformations.length === 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-sm text-yellow-800">
                        No user type configurations found. Consider setting up user types through the Controls panel.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tab Content with User Type Organization */}
            {activeTab === 'medical' && (
              <div className="space-y-6">
                {/* Medical Overview by User Type */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {getUserTypeData().slice(0, 6).map((userType, index) => (
                    <div 
                      key={userType.userType} 
                      className="rounded-xl border bg-white shadow p-6 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
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
                    <div 
                      key={userType.userType} 
                      className="rounded-xl border bg-white shadow p-6 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
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
                    <div 
                      key={userType.userType} 
                      className="rounded-xl border bg-white shadow p-6 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200"
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

            {/* Enhanced Chart and Activity Section with Chart.js */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              {/* Monthly Trends Bar Chart */}
              <div className="col-span-4 rounded-xl border bg-white shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">Monthly Activity Trends</h3>
                      <p className="text-sm text-slate-600">Transaction trends across all services</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-slate-200 bg-white hover:bg-slate-50 h-8 px-3 text-slate-700">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        Last 6 months
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-[280px]" id="monthly-trends-chart">
                    {stats.monthly_trends && Array.isArray(stats.monthly_trends) && stats.monthly_trends.length > 0 ? (
                      <BarChart
                        data={{
                          labels: stats.monthly_trends.map(item => item.month),
                          datasets: [
                            {
                              label: 'Medical',
                              data: stats.monthly_trends.map(item => item.medical || 0),
                              backgroundColor: '#3b82f6',
                            },
                            {
                              label: 'Dental', 
                              data: stats.monthly_trends.map(item => item.dental || 0),
                              backgroundColor: '#10b981',
                            },
                            {
                              label: 'Documents',
                              data: stats.monthly_trends.map(item => item.documents || 0),
                              backgroundColor: '#f59e0b',
                            },
                          ],
                        }}
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500">
                        <div className="text-center">
                          <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                          <p className="text-sm">No chart data available</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {loading ? "Loading data..." : "Data will appear when available"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* User Type Activity Feed */}
              <div className="col-span-3 rounded-xl border bg-white shadow">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">User Type Activity</h3>
                  <div className="space-y-4 max-h-80 overflow-y-auto">
                    {getUserTypeData() && getUserTypeData().length > 0 ? (
                      getUserTypeData().map((user, index) => (
                        <div key={user.userType} className="flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center mr-4 flex-shrink-0">
                            <span className="text-sm font-bold text-white">
                              {user.userType.charAt(0)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{user.userType}</p>
                            <p className="text-xs text-slate-600">
                              {user.totalTransactions} total • {user.completedTransactions} completed
                            </p>
                            <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                              <div 
                                className="bg-gradient-to-r from-slate-700 to-slate-900 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${user.completionRate}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-right ml-4 flex-shrink-0">
                            <div className="text-sm font-bold text-slate-900">
                              {user.completionRate.toFixed(0)}%
                            </div>
                            <div className="text-xs text-slate-500">completion</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <UserGroupIcon className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                        <p className="text-sm">No user activity data</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Chart Analytics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Service Distribution Doughnut Chart */}
              <div className="rounded-xl border bg-white shadow p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Service Distribution</h3>
                  <p className="text-sm text-slate-600">Overview of all health services</p>
                </div>
                <div className="h-[240px]" id="service-distribution-chart">
                  <DoughnutChart
                    data={{
                      labels: ['Medical', 'Dental', 'Documents'],
                      datasets: [{
                        data: [stats.medical.total, stats.dental.total, stats.documents.total],
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
                      }],
                    }}
                  />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <div className="font-semibold text-slate-900">{stats.medical.total}</div>
                    <div className="text-slate-600">Medical</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{stats.dental.total}</div>
                    <div className="text-slate-600">Dental</div>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{stats.documents.total}</div>
                    <div className="text-slate-600">Documents</div>
                  </div>
                </div>
              </div>

              {/* Completion Rates Progress Chart */}
              <div className="rounded-xl border bg-white shadow p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Completion Rates</h3>
                  <p className="text-sm text-slate-600">Service completion performance</p>
                </div>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600 font-medium">Medical Consultations</span>
                      <span className="font-semibold text-slate-900">{medicalCompletionRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${medicalCompletionRate}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {stats.medical.completed} of {stats.medical.total} completed
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600 font-medium">Dental Consultations</span>
                      <span className="font-semibold text-slate-900">{dentalCompletionRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${dentalCompletionRate}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {stats.dental.completed} of {stats.dental.total} completed
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600 font-medium">Medical Documents</span>
                      <span className="font-semibold text-slate-900">{documentsCompletionRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${documentsCompletionRate}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {stats.documents.issued} of {stats.documents.total} issued
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-600 font-medium">Patient Verification</span>
                      <span className="font-semibold text-slate-900">{patientsVerificationRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="bg-slate-700 h-2 rounded-full transition-all duration-1000"
                        style={{ width: `${patientsVerificationRate}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {stats.patients.verified} of {stats.patients.total} verified
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performing User Types */}
              <div className="rounded-xl border bg-white shadow p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Top User Types</h3>
                  <p className="text-sm text-slate-600">Ranked by total activity</p>
                </div>
                <div className="space-y-4">
                  {getUserTypeData().slice(0, 5).map((user, index) => (
                    <div key={user.userType} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center mr-3">
                          <span className="text-xs font-bold text-white">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-slate-900">{user.userType}</span>
                          <div className="flex items-center mt-1">
                            <MiniBarChart 
                              data={[user.medical.total, user.dental.total, user.documents.total]} 
                              height={16} 
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900">{user.totalTransactions}</div>
                        <div className="text-xs text-slate-500">{user.completionRate.toFixed(0)}% rate</div>
                      </div>
                    </div>
                  ))}
                  
                  {getUserTypeData().length === 0 && (
                    <div className="text-center py-4 text-slate-500">
                      <p className="text-sm">No user type data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Export Reports Section with Time Periods */}
            <div className="rounded-xl border bg-gradient-to-br from-[#800000] to-[#a83232] text-white shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">📊 Comprehensive Reports</h3>
                  <p className="text-white text-opacity-90 text-sm">Export detailed analytics with charts, graphs, and breakdowns</p>
                </div>
                <ArrowDownTrayIcon className="w-6 h-6 text-white text-opacity-80" />
              </div>
              
              {/* Visual Reports with Charts and Demographics (PDF) */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3 text-white text-opacity-90">📊 Professional PDF Reports (Charts + Demographics)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => handlePDFExport('weekly')}
                    disabled={navigating}
                    className="group flex items-center justify-between w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50"
                  >
                    <div className="flex items-center">
                      <CalendarDaysIcon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="text-sm">Weekly Report</div>
                        <div className="text-xs text-white text-opacity-90">Professional Layout</div>
                      </div>
                    </div>
                    <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                  </button>
                  
                  <button
                    onClick={() => handlePDFExport('monthly')}
                    disabled={navigating}
                    className="group flex items-center justify-between w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50"
                  >
                    <div className="flex items-center">
                      <ChartBarIcon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="text-sm">Monthly Report</div>
                        <div className="text-xs text-white text-opacity-90">Professional Layout</div>
                      </div>
                    </div>
                    <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                  </button>
                  
                  <button
                    onClick={() => handlePDFExport('yearly')}
                    disabled={navigating}
                    className="group flex items-center justify-between w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 disabled:opacity-50"
                  >
                    <div className="flex items-center">
                      <ClockIcon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="text-sm">Yearly Report</div>
                        <div className="text-xs text-white text-opacity-90">Professional Layout</div>
                      </div>
                    </div>
                    <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                  </button>
                </div>
              </div>

              {/* Comprehensive CSV Reports */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3 text-white text-opacity-90">� Comprehensive CSV Reports</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => handleEnhancedCSVExport('weekly')}
                    className="group flex items-center justify-between w-full py-3 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                  >
                    <div className="flex items-center">
                      <CalendarDaysIcon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="text-sm">Enhanced Weekly</div>
                        <div className="text-xs text-white text-opacity-75">Detailed analytics</div>
                      </div>
                    </div>
                    <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                  </button>
                  
                  <button
                    onClick={() => handleEnhancedCSVExport('monthly')}
                    className="group flex items-center justify-between w-full py-3 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                  >
                    <div className="flex items-center">
                      <ChartBarIcon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="text-sm">Enhanced Monthly</div>
                        <div className="text-xs text-white text-opacity-75">Comprehensive data</div>
                      </div>
                    </div>
                    <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                  </button>
                  
                  <button
                    onClick={() => handleEnhancedCSVExport('yearly')}
                    className="group flex items-center justify-between w-full py-3 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                  >
                    <div className="flex items-center">
                      <ClockIcon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="text-sm">Enhanced Yearly</div>
                        <div className="text-xs text-white text-opacity-75">Annual insights</div>
                      </div>
                    </div>
                    <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                  </button>
                </div>
              </div>
              
              {/* Service-Specific Demographic Reports */}
              <div className="border-t border-white border-opacity-20 pt-4">
                <h4 className="text-sm font-semibold mb-3 text-white text-opacity-90">🔍 Service-Specific Demographic Reports</h4>
                
                {/* Medical Consultations Reports */}
                <div className="mb-4">
                  <h5 className="text-xs font-medium mb-2 text-white text-opacity-80">🏥 Medical Consultations by Demographics</h5>
                  
                  {/* CSV Exports */}
                  <div className="mb-2">
                    <p className="text-xs text-white text-opacity-70 mb-1">CSV Reports:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <button
                        onClick={() => handleServiceSpecificCSVExport('medical', 'weekly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <CalendarDaysIcon className="w-4 h-4 mr-2" />
                          <span>Weekly CSV</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => handleServiceSpecificCSVExport('medical', 'monthly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <ChartBarIcon className="w-4 h-4 mr-2" />
                          <span>Monthly CSV</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => handleServiceSpecificCSVExport('medical', 'yearly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-blue-500 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-2" />
                          <span>Yearly CSV</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                    </div>
                  </div>
                  
                  {/* PDF Exports */}
                  <div>
                    <p className="text-xs text-white text-opacity-70 mb-1">PDF Reports with Charts:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <button
                        onClick={() => handleServiceSpecificPDFExport('medical', 'weekly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-blue-600 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          <span>Weekly PDF</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => handleServiceSpecificPDFExport('medical', 'monthly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-blue-600 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          <span>Monthly PDF</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => handleServiceSpecificPDFExport('medical', 'yearly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-blue-600 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          <span>Yearly PDF</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dental Consultations Reports */}
                <div className="mb-4">
                  <h5 className="text-xs font-medium mb-2 text-white text-opacity-80">🦷 Dental Consultations by Demographics</h5>
                  
                  {/* CSV Exports */}
                  <div className="mb-2">
                    <p className="text-xs text-white text-opacity-70 mb-1">CSV Reports:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <button
                        onClick={() => handleServiceSpecificCSVExport('dental', 'weekly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-green-500 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <CalendarDaysIcon className="w-4 h-4 mr-2" />
                          <span>Weekly CSV</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => handleServiceSpecificCSVExport('dental', 'monthly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-green-500 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <ChartBarIcon className="w-4 h-4 mr-2" />
                          <span>Monthly CSV</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => handleServiceSpecificCSVExport('dental', 'yearly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-green-500 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-2" />
                          <span>Yearly CSV</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                    </div>
                  </div>
                  
                  {/* PDF Exports */}
                  <div>
                    <p className="text-xs text-white text-opacity-70 mb-1">PDF Reports with Charts:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <button
                        onClick={() => handleServiceSpecificPDFExport('dental', 'weekly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-green-600 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          <span>Weekly PDF</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => handleServiceSpecificPDFExport('dental', 'monthly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-green-600 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          <span>Monthly PDF</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => handleServiceSpecificPDFExport('dental', 'yearly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-green-600 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          <span>Yearly PDF</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Medical Certificates Reports */}
                <div className="mb-4">
                  <h5 className="text-xs font-medium mb-2 text-white text-opacity-80">📄 Medical Certificates by Demographics</h5>
                  
                  {/* CSV Exports */}
                  <div className="mb-2">
                    <p className="text-xs text-white text-opacity-70 mb-1">CSV Reports:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <button
                        onClick={() => handleServiceSpecificCSVExport('certificates', 'weekly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-amber-500 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <CalendarDaysIcon className="w-4 h-4 mr-2" />
                          <span>Weekly CSV</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => handleServiceSpecificCSVExport('certificates', 'monthly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-amber-500 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <ChartBarIcon className="w-4 h-4 mr-2" />
                          <span>Monthly CSV</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => handleServiceSpecificCSVExport('certificates', 'yearly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-amber-500 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-2" />
                          <span>Yearly CSV</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                    </div>
                  </div>
                  
                  {/* PDF Exports */}
                  <div>
                    <p className="text-xs text-white text-opacity-70 mb-1">PDF Reports with Charts:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <button
                        onClick={() => handleServiceSpecificPDFExport('certificates', 'weekly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-amber-600 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          <span>Weekly PDF</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => handleServiceSpecificPDFExport('certificates', 'monthly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-amber-600 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          <span>Monthly PDF</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                      
                      <button
                        onClick={() => handleServiceSpecificPDFExport('certificates', 'yearly')}
                        className="group flex items-center justify-between w-full py-2 px-3 bg-amber-600 bg-opacity-20 hover:bg-opacity-30 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
                      >
                        <div className="flex items-center">
                          <DocumentTextIcon className="w-4 h-4 mr-2" />
                          <span>Yearly PDF</span>
                        </div>
                        <ArrowDownTrayIcon className="w-3 h-3 group-hover:animate-bounce" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-white text-opacity-70 italic mt-3 p-2 bg-white bg-opacity-10 rounded-md">
                  💡 These reports include detailed demographic breakdowns: Elementary, High School, College students with their year levels, courses, and Employee categories (Teaching/Non-Teaching staff).
                </div>
              </div>
              
              {/* Legacy Specialized Reports */}
              <div className="border-t border-white border-opacity-20 pt-4">
                <h4 className="text-sm font-semibold mb-3 text-white text-opacity-90">📋 Legacy Detailed Reports</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => downloadCSV('medical-consultations-detailed.csv', generateMedicalCSV())}
                    className="group flex items-center justify-between w-full py-3 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                  >
                    <div className="flex items-center">
                      <UserGroupIcon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="text-sm">Medical Detailed</div>
                        <div className="text-xs text-white text-opacity-75">{stats.medical.total} consultations</div>
                      </div>
                    </div>
                    <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                  </button>
                  
                  <button
                    onClick={() => downloadCSV('dental-consultations-detailed.csv', generateDentalCSV())}
                    className="group flex items-center justify-between w-full py-3 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                  >
                    <div className="flex items-center">
                      <UserGroupIcon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="text-sm">Dental Detailed</div>
                        <div className="text-xs text-white text-opacity-75">{stats.dental.total} consultations</div>
                      </div>
                    </div>
                    <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                  </button>
                  
                  <button
                    onClick={() => downloadCSV('medical-documents-detailed.csv', generateDocumentsCSV())}
                    className="group flex items-center justify-between w-full py-3 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                  >
                    <div className="flex items-center">
                      <DocumentTextIcon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="text-sm">Documents Detailed</div>
                        <div className="text-xs text-white text-opacity-75">{stats.documents.total} certificates</div>
                      </div>
                    </div>
                    <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                  </button>
                  
                  <button
                    onClick={() => downloadCSV('patient-profiles-detailed.csv', generatePatientsCSV())}
                    className="group flex items-center justify-between w-full py-3 px-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105"
                  >
                    <div className="flex items-center">
                      <UserGroupIcon className="w-5 h-5 mr-3" />
                      <div className="text-left">
                        <div className="text-sm">Patient Detailed</div>
                        <div className="text-xs text-white text-opacity-75">{stats.patients.total} profiles</div>
                      </div>
                    </div>
                    <ArrowDownTrayIcon className="w-4 h-4 group-hover:animate-bounce" />
                  </button>
                </div>
              </div>
              
              {/* Report Information */}
              <div className="mt-6 p-4 bg-white bg-opacity-10 rounded-lg">
                <h5 className="text-sm font-semibold mb-2 text-white">📋 Report Features:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-white text-opacity-90">
                  <div className="flex items-start">
                    <span className="mr-2">📊</span>
                    <span>Comprehensive data tables with all metrics</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">👥</span>
                    <span>User type breakdown analysis</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">📈</span>
                    <span>Monthly activity trends data</span>
                  </div>
                  <div className="flex items-start">
                    <span className="mr-2">⚡</span>
                    <span>Real-time completion rates</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-white text-opacity-75">
                  💡 <strong>Tip:</strong> Open CSV files in Excel or Google Sheets for advanced data visualization and pivot tables.
                </div>
              </div>
            </div>
          </>
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