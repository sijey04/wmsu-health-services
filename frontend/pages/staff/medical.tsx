import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import StaffLayout from '../../components/StaffLayout';
import { appointmentsAPI, medicalDocumentsAPI } from '../../utils/api';

export default function MedicalStaffDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('appointments');
  const [appointments, setAppointments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    completed: 0,
    total: 0
  });

  useEffect(() => {
    // Verify user has appropriate access
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      const staffRole = user.staff_role || user.user_type;
      
      // Only allow medical staff, doctors, nurses, or superusers
      if (!user.is_superuser && 
          staffRole !== 'medical_staff' && 
          staffRole !== 'doctor' && 
          staffRole !== 'nurse') {
        router.push('/');
        return;
      }
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appointmentsRes, documentsRes] = await Promise.all([
        appointmentsAPI.getAll(),
        medicalDocumentsAPI.getAll()
      ]);

      // Filter for medical appointments only
      const medicalAppointments = (appointmentsRes.data || []).filter(
        (apt: any) => apt.type === 'medical'
      );
      
      setAppointments(medicalAppointments);
      setDocuments(documentsRes.data || []);

      // Calculate stats
      const pending = medicalAppointments.filter((apt: any) => apt.status === 'pending').length;
      const confirmed = medicalAppointments.filter((apt: any) => apt.status === 'confirmed').length;
      const completed = medicalAppointments.filter((apt: any) => apt.status === 'completed').length;
      
      setStats({
        pending,
        confirmed,
        completed,
        total: medicalAppointments.length
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (appointmentId: number, newStatus: string) => {
    try {
      await appointmentsAPI.update(appointmentId, { status: newStatus });
      loadData(); // Reload data
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <StaffLayout staffType="medical">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8B1538]"></div>
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout staffType="medical">
      <Head>
        <title>Medical Staff Dashboard - WMSU Health Services</title>
      </Head>

      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Total Appointments</div>
            <div className="text-3xl font-bold text-[#8B1538]">{stats.total}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Confirmed</div>
            <div className="text-3xl font-bold text-blue-600">{stats.confirmed}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-600">Completed</div>
            <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('appointments')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'appointments'
                    ? 'border-[#8B1538] text-[#8B1538]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Appointments
              </button>
              <button
                onClick={() => setActiveTab('documents')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'documents'
                    ? 'border-[#8B1538] text-[#8B1538]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Medical Documents
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'appointments' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Medical Appointments</h3>
                {appointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No appointments found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Patient
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Purpose
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {appointments.map((apt: any) => (
                          <tr key={apt.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {apt.patient_name || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{apt.appointment_date}</div>
                              <div className="text-sm text-gray-500">{apt.appointment_time}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{apt.purpose}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(apt.status)}`}>
                                {apt.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {apt.status === 'pending' && (
                                <button
                                  onClick={() => handleStatusUpdate(apt.id, 'confirmed')}
                                  className="text-blue-600 hover:text-blue-900 mr-2"
                                >
                                  Confirm
                                </button>
                              )}
                              {apt.status === 'confirmed' && (
                                <button
                                  onClick={() => handleStatusUpdate(apt.id, 'completed')}
                                  className="text-green-600 hover:text-green-900 mr-2"
                                >
                                  Complete
                                </button>
                              )}
                              {(apt.status === 'pending' || apt.status === 'confirmed') && (
                                <button
                                  onClick={() => handleStatusUpdate(apt.id, 'cancelled')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Cancel
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-4">Medical Documents</h3>
                {documents.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No documents found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Patient
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Document Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Submitted
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {documents.map((doc: any) => (
                          <tr key={doc.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {doc.patient_name || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{doc.document_type}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(doc.created_at).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                                {doc.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
}
