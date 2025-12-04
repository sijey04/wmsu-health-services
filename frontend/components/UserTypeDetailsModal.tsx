import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface UserTypeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userType: string;
  userTypeData: any;
  detailedBreakdown: any;
}

const UserTypeDetailsModal: React.FC<UserTypeDetailsModalProps> = ({
  isOpen,
  onClose,
  userType,
  userTypeData,
  detailedBreakdown
}) => {
  if (!isOpen) return null;

  const renderUserTypeDetails = () => {
    if (!detailedBreakdown?.details) return null;

    const details = detailedBreakdown.details;
    
    // Filter data based on user type
    let filteredYearLevel = {};
    let filteredCourse = {};
    let filteredDepartment = {};
    
    if (userType === 'College') {
      // For college, show only college-related year levels (1st-6th year)
      const collegeYearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year'];
      filteredYearLevel = Object.fromEntries(
        Object.entries(details.by_year_level || {}).filter(([key]) => 
          collegeYearLevels.includes(key) || key.includes('Year')
        )
      );
      filteredCourse = details.by_course || {};
      filteredDepartment = details.by_department || {};
    } else if (userType === 'High School') {
      // For high school, show grades 7-10
      const hsGrades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'];
      filteredYearLevel = Object.fromEntries(
        Object.entries(details.by_year_level || {}).filter(([key]) => 
          hsGrades.includes(key)
        )
      );
      filteredCourse = details.by_strand || details.by_course || {};
      filteredDepartment = details.by_department || {};
    } else if (userType === 'Senior High School') {
      // For senior high school, show grades 11-12
      const shsGrades = ['Grade 11', 'Grade 12'];
      filteredYearLevel = Object.fromEntries(
        Object.entries(details.by_year_level || {}).filter(([key]) => 
          shsGrades.includes(key)
        )
      );
      filteredCourse = details.by_strand || details.by_course || {};
      filteredDepartment = details.by_department || {};
    } else if (userType === 'Elementary') {
      // For elementary, show grades 1-6
      const elemGrades = ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'];
      filteredYearLevel = Object.fromEntries(
        Object.entries(details.by_year_level || {}).filter(([key]) => 
          elemGrades.includes(key)
        )
      );
      filteredCourse = {};
      filteredDepartment = details.by_department || {};
    } else if (userType === 'Kindergarten') {
      // For kindergarten, show kindergarten levels
      const kGrades = ['Kindergarten', 'Nursery', 'Pre-K'];
      filteredYearLevel = Object.fromEntries(
        Object.entries(details.by_year_level || {}).filter(([key]) => 
          kGrades.includes(key) || key.toLowerCase().includes('kinder')
        )
      );
      filteredCourse = {};
      filteredDepartment = details.by_department || {};
    } else if (userType === 'Employee') {
      // For employees, show position types and teaching status
      filteredYearLevel = details.by_position_type || {};
      filteredCourse = details.by_teaching_status || {};
      filteredDepartment = details.by_department || {};
    } else {
      // Default case - show all data
      filteredYearLevel = details.by_year_level || {};
      filteredCourse = details.by_course || {};
      filteredDepartment = details.by_department || {};
    }

    // Prepare data for year level chart
    const yearLevelData = {
      labels: Object.keys(filteredYearLevel),
      datasets: [
        {
          label: userType === 'Employee' ? 'Employees by Position' : 'Students by Year Level',
          data: Object.values(filteredYearLevel),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          tension: 0.1,
        },
      ],
    };

    // Prepare data for course distribution
    const courseData = {
      labels: Object.keys(filteredCourse).slice(0, 10), // Top 10 courses/strands
      datasets: [
        {
          label: userType === 'High School' || userType === 'Senior High School' ? 'Students by Strand' : 
                 userType === 'Employee' ? 'Employees by Type' : 'Students by Course',
          data: Object.values(filteredCourse).slice(0, 10),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(147, 51, 234, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(14, 165, 233, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(132, 204, 22, 0.8)',
            'rgba(168, 85, 247, 0.8)',
          ],
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="space-y-6">
        {/* Year Level Distribution */}
        <div>
          <h4 className="text-lg font-semibold mb-4">
            {userType === 'Employee' ? 'Position Distribution' : 'Year Level Distribution'}
          </h4>
          <div className="h-64">
            <Line
              data={yearLevelData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: userType === 'Employee' ? 'Employees by Position' : 'Students by Year Level',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Course Distribution */}
        {Object.keys(filteredCourse).length > 0 && (
          <div>
            <h4 className="text-lg font-semibold mb-4">
              {userType === 'High School' || userType === 'Senior High School' ? 'Top Strands' : 
               userType === 'Employee' ? 'Teaching vs Non-Teaching Staff' : 'Top Courses'}
            </h4>
          <div className="h-64">
            <Bar
              data={courseData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  title: {
                    display: true,
                    text: userType === 'High School' || userType === 'Senior High School' ? 'Student Distribution by Strand' :
                          userType === 'Employee' ? 'Employee Distribution by Category' : 'Student Distribution by Course',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                  x: {
                    ticks: {
                      maxRotation: 45,
                      minRotation: 45,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
        )}

        {/* Department Breakdown */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Department Breakdown</h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(filteredDepartment).map(([dept, count]) => (
              <div key={dept} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{dept}</div>
                <div className="text-lg font-bold text-blue-600">{count as number}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEmployeeDetails = () => {
    if (!detailedBreakdown?.details) return null;

    const { by_position_type, by_department } = detailedBreakdown.details;

    const positionData = {
      labels: Object.keys(by_position_type || {}),
      datasets: [
        {
          label: 'Employees by Position Type',
          data: Object.values(by_position_type || {}),
          backgroundColor: ['rgba(220, 38, 38, 0.8)', 'rgba(59, 130, 246, 0.8)'],
          borderWidth: 1,
        },
      ],
    };

    return (
      <div className="space-y-6">
        {/* Position Type Distribution */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Position Type Distribution</h4>
          <div className="h-64">
            <Bar
              data={positionData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                  title: {
                    display: true,
                    text: 'Employees by Position Type',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Department Breakdown */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Department Distribution</h4>
          <div className="grid grid-cols-2 gap-4 max-h-64 overflow-y-auto">
            {Object.entries(by_department || {}).map(([dept, count]) => (
              <div key={dept} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{dept}</div>
                <div className="text-lg font-bold text-red-600">{count as number}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderElementaryHighSchoolDetails = () => {
    if (!detailedBreakdown?.details) return null;

    const { by_grade_level, by_strand, by_department } = detailedBreakdown.details;

    const gradeLevelData = {
      labels: Object.keys(by_grade_level || {}),
      datasets: [
        {
          label: `${userType} Students by Grade`,
          data: Object.values(by_grade_level || {}),
          backgroundColor: 'rgba(34, 197, 94, 0.8)',
          borderColor: 'rgb(34, 197, 94)',
          tension: 0.1,
        },
      ],
    };

    return (
      <div className="space-y-6">
        {/* Grade Level Distribution */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Grade Level Distribution</h4>
          <div className="h-64">
            <Line
              data={gradeLevelData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  },
                  title: {
                    display: true,
                    text: `${userType} Students by Grade Level`,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Strand Distribution (for Senior High School) */}
        {userType === 'Senior High School' && by_strand && (
          <div>
            <h4 className="text-lg font-semibold mb-4">Strand Distribution</h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(by_strand).map(([strand, count]) => (
                <div key={strand} className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-900">{strand}</div>
                  <div className="text-lg font-bold text-green-600">{count as number}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Department Breakdown */}
        <div>
          <h4 className="text-lg font-semibold mb-4">School/Department</h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(by_department || {}).map(([dept, count]) => (
              <div key={dept} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{dept}</div>
                <div className="text-lg font-bold text-green-600">{count as number}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderKindergartenDetails = () => {
    if (!detailedBreakdown?.details) return null;

    const { by_section, by_department } = detailedBreakdown.details;

    return (
      <div className="space-y-6">
        {/* Section Distribution */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Section Distribution</h4>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(by_section || {}).map(([section, count]) => (
              <div key={section} className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-sm font-medium text-gray-900">{section}</div>
                <div className="text-xl font-bold text-purple-600">{count as number}</div>
              </div>
            ))}
          </div>
        </div>

        {/* School/Department */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Schools</h4>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(by_department || {}).map(([dept, count]) => (
              <div key={dept} className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-gray-900">{dept}</div>
                <div className="text-lg font-bold text-purple-600">{count as number}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderServiceStatistics = () => {
    return (
      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-4">Service Statistics</h4>
        <div className="grid grid-cols-3 gap-4">
          {/* Medical Services */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">Medical Services</h5>
            <div className="space-y-1 text-sm">
              <div>Total: <span className="font-bold">{userTypeData.medical?.total || 0}</span></div>
              <div>Completed: <span className="font-bold text-green-600">{userTypeData.medical?.completed || 0}</span></div>
              <div>Pending: <span className="font-bold text-yellow-600">{userTypeData.medical?.pending || 0}</span></div>
              <div>Rate: <span className="font-bold">{userTypeData.medicalRate?.toFixed(1) || 0}%</span></div>
            </div>
          </div>

          {/* Dental Services */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h5 className="font-medium text-green-900 mb-2">Dental Services</h5>
            <div className="space-y-1 text-sm">
              <div>Total: <span className="font-bold">{userTypeData.dental?.total || 0}</span></div>
              <div>Completed: <span className="font-bold text-green-600">{userTypeData.dental?.completed || 0}</span></div>
              <div>Pending: <span className="font-bold text-yellow-600">{userTypeData.dental?.pending || 0}</span></div>
              <div>Rate: <span className="font-bold">{userTypeData.dentalRate?.toFixed(1) || 0}%</span></div>
            </div>
          </div>

          {/* Document Services */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h5 className="font-medium text-yellow-900 mb-2">Documents</h5>
            <div className="space-y-1 text-sm">
              <div>Total: <span className="font-bold">{userTypeData.documents?.total || 0}</span></div>
              <div>Issued: <span className="font-bold text-green-600">{userTypeData.documents?.issued || 0}</span></div>
              <div>Pending: <span className="font-bold text-yellow-600">{userTypeData.documents?.pending || 0}</span></div>
              <div>Rate: <span className="font-bold">{userTypeData.documentRate?.toFixed(1) || 0}%</span></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            {userType} Demographics & Statistics
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Service Statistics */}
          {renderServiceStatistics()}

          {/* Demographics Details */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Demographics Breakdown</h4>
            {renderUserTypeDetails()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTypeDetailsModal;
