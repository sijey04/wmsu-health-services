import React, { useState, useEffect } from 'react';
import { 
  CalendarDaysIcon, 
  CheckCircleIcon, 
  ClockIcon, 
  ExclamationTriangleIcon, 
  ChartBarIcon, 
  UserIcon, 
  BookOpenIcon 
} from '@heroicons/react/24/outline';

interface Semester {
  id: string;
  semester_type: string;
  semester_display: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status: string;
}

interface StudentProfile {
  id: string;
  year_level: string;
  course_program: string;
  health_status: string;
  health_status_display: string;
  health_clearance_date: string | null;
  compliance_percentage: number;
  pending_requirements_count: number;
  overdue_requirements_count: number;
}

interface Requirement {
  id: string;
  requirement_name: string;
  requirement_type: string;
  status: string;
  status_display: string;
  completion_date: string | null;
  days_until_due: number | null;
  is_overdue: boolean;
}

interface DashboardData {
  current_semester: Semester;
  student_profile: StudentProfile;
  requirements: Requirement[];
  upcoming_deadlines: Array<{
    requirement: string;
    due_date: string;
    days_until_due: number;
    status: string;
  }>;
  health_trends: Array<{
    semester: string;
    bmi: number | null;
    blood_pressure: { systolic: number; diastolic: number } | null;
    health_status: string;
    compliance_rate: number;
  }>;
}

const SemesterDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'requirements' | 'history'>('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch('/api/semester-dashboard/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      case 'exempted': return 'text-blue-600 bg-blue-100';
      case 'compliant': return 'text-green-600 bg-green-100';
      case 'non_compliant': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getComplianceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading semester dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-[#800000] text-white px-4 py-2 rounded-md hover:bg-[#600000] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Semester Data</h2>
          <p className="text-gray-600">No current semester information available.</p>
        </div>
      </div>
    );
  }

  const { current_semester, student_profile, requirements, upcoming_deadlines, health_trends } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Health Services Dashboard</h1>
                <p className="text-gray-600">
                  {current_semester.semester_display} {current_semester.academic_year}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(current_semester.status)}`}>
                  {current_semester.status.charAt(0).toUpperCase() + current_semester.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: ChartBarIcon },
              { id: 'requirements', label: 'Requirements', icon: CheckCircleIcon },
              { id: 'history', label: 'History', icon: CalendarDaysIcon },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`${
                  activeTab === id
                    ? 'border-[#800000] text-[#800000]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Health Status Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <UserIcon className="h-8 w-8 text-[#800000]" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Health Status</h3>
                    {student_profile ? (
                      <div>
                        <span className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(student_profile.health_status)}`}>
                          {student_profile.health_status_display}
                        </span>
                        <p className="text-sm text-gray-600 mt-1">
                          {student_profile.year_level} • {student_profile.course_program}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-600">No profile found</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Compliance Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-8 w-8 text-[#800000]" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Compliance</h3>
                    {student_profile ? (
                      <div>
                        <span className={`text-2xl font-bold ${getComplianceColor(student_profile.compliance_percentage)}`}>
                          {student_profile.compliance_percentage}%
                        </span>
                        <p className="text-sm text-gray-600">
                          {student_profile.pending_requirements_count} pending, {student_profile.overdue_requirements_count} overdue
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-600">No data available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Clearance Card */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpenIcon className="h-8 w-8 text-[#800000]" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Health Clearance</h3>
                    {student_profile?.health_clearance_date ? (
                      <div>
                        <p className="text-sm text-green-600 font-medium">Issued</p>
                        <p className="text-sm text-gray-600">
                          {new Date(student_profile.health_clearance_date).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">Not issued</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Deadlines */}
            {upcoming_deadlines && upcoming_deadlines.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <ClockIcon className="h-5 w-5 mr-2 text-[#800000]" />
                    Upcoming Deadlines
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {upcoming_deadlines.map((deadline, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{deadline.requirement}</h4>
                          <p className="text-sm text-gray-600">
                            Due: {new Date(deadline.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-yellow-600">
                            {deadline.days_until_due} days
                          </span>
                          <p className="text-sm text-gray-600">remaining</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'requirements' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Health Requirements</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {requirements.map((requirement) => (
                  <div key={requirement.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{requirement.requirement_name}</h4>
                        <p className="text-sm text-gray-600 capitalize">{requirement.requirement_type.replace('_', ' ')}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        {requirement.completion_date && (
                          <span className="text-sm text-gray-600">
                            Completed: {new Date(requirement.completion_date).toLocaleDateString()}
                          </span>
                        )}
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(requirement.status)}`}>
                          {requirement.status_display}
                        </span>
                        {requirement.days_until_due !== null && requirement.days_until_due > 0 && (
                          <span className="text-sm text-gray-600">
                            {requirement.days_until_due} days left
                          </span>
                        )}
                        {requirement.is_overdue && (
                          <span className="text-sm font-medium text-red-600">Overdue</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Health Trends</h3>
            </div>
            <div className="p-6">
              {health_trends && health_trends.length > 0 ? (
                <div className="space-y-6">
                  {health_trends.map((trend, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">{trend.semester}</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <label className="text-sm text-gray-600">Health Status</label>
                          <p className={`font-medium ${getStatusColor(trend.health_status)} inline-block px-2 py-1 rounded text-sm`}>
                            {trend.health_status.replace('_', ' ').toUpperCase()}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Compliance Rate</label>
                          <p className={`font-medium ${getComplianceColor(trend.compliance_rate)}`}>
                            {trend.compliance_rate}%
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">BMI</label>
                          <p className="font-medium text-gray-900">
                            {trend.bmi ? trend.bmi.toFixed(1) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">Blood Pressure</label>
                          <p className="font-medium text-gray-900">
                            {trend.blood_pressure 
                              ? `${trend.blood_pressure.systolic}/${trend.blood_pressure.diastolic}` 
                              : 'N/A'
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No historical data available.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SemesterDashboard;
