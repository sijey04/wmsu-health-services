import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import {
  ArrowPathIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
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
  const router = useRouter();

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
      
      setError('Failed to load statistics. Please try again later.');
      setLoading(false);
      
      // Fallback to demo data
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

  // Calculate percentages
  const medicalCompletionRate = stats.medical.total > 0 ? (stats.medical.completed / stats.medical.total) * 100 : 0;
  const dentalCompletionRate = stats.dental.total > 0 ? (stats.dental.completed / stats.dental.total) * 100 : 0;
  const documentsCompletionRate = stats.documents.total > 0 ? (stats.documents.issued / stats.documents.total) * 100 : 0;
  const patientsVerificationRate = stats.patients.total > 0 ? (stats.patients.verified / stats.patients.total) * 100 : 0;

  const getUserTypeData = () => {
    const userTypes = Object.keys(stats.user_type_breakdown || {});
    return userTypes.map(userType => {
      const data = stats.user_type_breakdown[userType];
      return {
        userType,
        totalTransactions: data.medical.total + data.dental.total + data.documents.total,
        completedTransactions: data.medical.completed + data.dental.completed + data.documents.issued,
        medicalRate: data.medical.total > 0 ? (data.medical.completed / data.medical.total) * 100 : 0,
        dentalRate: data.dental.total > 0 ? (data.dental.completed / data.dental.total) * 100 : 0,
        documentRate: data.documents.total > 0 ? (data.documents.issued / data.documents.total) * 100 : 0,
        ...data
      };
    });
  };

  return (
    <AdminLayout>
      <div className="flex-1 space-y-6 p-6 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
            <p className="text-sm text-gray-600">
              Overview of your health services management system
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {lastUpdated && (
              <p className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 h-9 px-3"
            >
              <ArrowPathIcon className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Revenue Card */}
          <div className="rounded-xl border bg-white shadow">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Revenue</h3>
              <svg
                className="h-4 w-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">$1,250.00</div>
              <p className="text-xs text-gray-600">
                +12.5% from last month
              </p>
            </div>
          </div>

          {/* New Patients Card */}
          <div className="rounded-xl border bg-white shadow">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">New Patients</h3>
              <UserGroupIcon className="h-4 w-4 text-gray-600" />
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{stats.patients.total}</div>
              <p className="text-xs text-gray-600">
                +{stats.patients.verified} verified profiles
              </p>
            </div>
          </div>

          {/* Active Consultations Card */}
          <div className="rounded-xl border bg-white shadow">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Active Consultations</h3>
              <svg
                className="h-4 w-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="m22 21-3-3m0 0a4 4 0 1 0-6-6 4 4 0 0 0 6 6z" />
              </svg>
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{stats.medical.total + stats.dental.total}</div>
              <p className="text-xs text-gray-600">
                +{medicalCompletionRate.toFixed(1)}% completion rate
              </p>
            </div>
          </div>

          {/* Documents Issued Card */}
          <div className="rounded-xl border bg-white shadow">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Documents Issued</h3>
              <svg
                className="h-4 w-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
              </svg>
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{stats.documents.issued}</div>
              <p className="text-xs text-gray-600">
                +{documentsCompletionRate.toFixed(1)}% from last month
              </p>
            </div>
          </div>
        </div>

        {/* Main Chart Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Total Visitors Chart */}
          <div className="col-span-4 rounded-xl border bg-white shadow">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Total Visitors</h3>
                <div className="flex items-center space-x-2">
                  <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-200 bg-white hover:bg-gray-50 h-8 px-3">
                    Last 3 months
                  </button>
                  <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-200 bg-white hover:bg-gray-50 h-8 px-3">
                    Last 30 days
                  </button>
                  <button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors border border-gray-200 bg-white hover:bg-gray-50 h-8 px-3">
                    Last 7 days
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Total for the last 3 months
              </p>
              
              {/* Simple Line Chart */}
              <div className="h-[200px] mt-4">
                {stats.monthly_trends && stats.monthly_trends.length > 0 && (
                  <div className="h-full flex items-end justify-between space-x-1">
                    {stats.monthly_trends.map((item, index) => {
                      const maxVal = Math.max(...stats.monthly_trends.map(d => d.medical + d.dental + d.documents));
                      const totalVal = item.medical + item.dental + item.documents;
                      const height = (totalVal / maxVal) * 100;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center">
                          <div className="w-full flex items-end justify-center">
                            <div 
                              className="w-8 bg-gray-900 rounded-t transition-all duration-500 hover:bg-gray-700"
                              style={{ height: `${height}%` }}
                              title={`${item.month}: ${totalVal} total transactions`}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-600 mt-2">{item.month}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="col-span-3 rounded-xl border bg-white shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {getUserTypeData().slice(0, 5).map((user, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center mr-4">
                      <span className="text-sm font-medium text-gray-600">
                        {user.userType.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{user.userType}</p>
                      <p className="text-sm text-gray-600">
                        {user.totalTransactions} total transactions
                      </p>
                    </div>
                    <div className="text-sm font-medium">
                      +{((user.medicalRate + user.dentalRate + user.documentRate) / 3).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="ml-4 text-sm text-gray-600">Loading dashboard statistics...</p>
          </div>
        )}

        {error && (
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
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminDashboard;
