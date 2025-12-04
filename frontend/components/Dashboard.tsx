import { useState, useEffect } from 'react';
import Link from 'next/link';

// Mock statistics for the dashboard
const mockStats = {
  totalPatients: 254,
  todayAppointments: 12,
  pendingRequests: 5,
  inventoryAlerts: 3
};

// Mock recent appointments
const mockRecentAppointments = [
  {
    id: 1,
    patientName: 'Juan Dela Cruz',
    time: '10:00 AM',
    purpose: 'Regular Check-up',
    status: 'scheduled'
  },
  {
    id: 2,
    patientName: 'Maria Santos',
    time: '11:30 AM',
    purpose: 'Follow-up Consultation',
    status: 'confirmed'
  },
  {
    id: 3,
    patientName: 'Carlos Reyes',
    time: '02:15 PM',
    purpose: 'Medical Certificate Request',
    status: 'pending'
  }
];

// Mock inventory alerts
const mockInventoryAlerts = [
  {
    id: 1,
    itemName: 'Paracetamol 500mg',
    remaining: 10,
    threshold: 20
  },
  {
    id: 2,
    itemName: 'Disposable Masks',
    remaining: 15,
    threshold: 30
  },
  {
    id: 3,
    itemName: 'Alcohol 70%',
    remaining: 2,
    threshold: 5
  }
];

// Get today's date in formatted string
const getTodayDate = () => {
  const today = new Date();
  return today.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

export default function Dashboard() {
  const [stats, setStats] = useState(mockStats);
  const [recentAppointments, setRecentAppointments] = useState(mockRecentAppointments);
  const [inventoryAlerts, setInventoryAlerts] = useState(mockInventoryAlerts);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data from API
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Confirmed
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Scheduled
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Staff Dashboard</h2>
        <p className="text-sm text-gray-500">{getTodayDate()}</p>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <svg className="animate-spin h-10 w-10 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Patients</dt>
                    <dd className="text-lg font-bold text-gray-900">{stats.totalPatients}</dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Today&apos;s Appointments</dt>
                    <dd className="text-lg font-bold text-gray-900">{stats.todayAppointments}</dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Requests</dt>
                    <dd className="text-lg font-bold text-gray-900">{stats.pendingRequests}</dd>
                  </dl>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-100 rounded-md p-3">
                  <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Inventory Alerts</dt>
                    <dd className="text-lg font-bold text-gray-900">{stats.inventoryAlerts}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's Appointments */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Today&apos;s Appointments</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {recentAppointments.length > 0 ? (
                  recentAppointments.map(appointment => (
                    <div key={appointment.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-primary-600 truncate">{appointment.patientName}</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          {getStatusBadge(appointment.status)}
                        </div>
                      </div>
                      <div className="mt-2 sm:flex sm:justify-between">
                        <div className="sm:flex">
                          <p className="flex items-center text-sm text-gray-500">
                            <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {appointment.time}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          {appointment.purpose}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-5 text-center text-gray-500">
                    No appointments scheduled for today.
                  </div>
                )}
              </div>
              {recentAppointments.length > 0 && (
                <div className="bg-gray-50 px-4 py-4 sm:px-6">
                  <Link href="/appointments" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                    View all appointments
                    <span aria-hidden="true"> &rarr;</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Inventory Alerts */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Inventory Alerts</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {inventoryAlerts.length > 0 ? (
                  inventoryAlerts.map(item => (
                    <div key={item.id} className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.itemName}</p>
                        <div className="ml-2 flex-shrink-0 flex">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            Low Stock
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between">
                        <p className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                          </svg>
                          Remaining: {item.remaining}
                        </p>
                        <p className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Threshold: {item.threshold}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-5 text-center text-gray-500">
                    No inventory alerts at this time.
                  </div>
                )}
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6">
                <Link href="/inventory" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                  Go to inventory management
                  <span aria-hidden="true"> &rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
