import AdminLayout from '../../components/AdminLayout';
import withAdminAccess from '../../components/withAdminAccess';
import { useState, useEffect } from 'react';
import { appointmentsAPI, djangoApiClient } from '../../utils/api';
import { 
  EyeIcon, 
  ArrowDownTrayIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  CalendarIcon,
  UserIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';

function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await appointmentsAPI.getAll(params);
      setAppointments(response.data);
    } catch (err: any) {
      console.error('Failed to fetch appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCertificate = async (id: number, patientName: string) => {
    setActionLoading(id);
    try {
      const response = await appointmentsAPI.viewMedicalCertificate(id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err: any) {
      console.error('Failed to view certificate:', err);
      alert(err.response?.data?.error || 'Medical certificate not found for this appointment.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadCertificate = async (id: number, patientName: string) => {
    setActionLoading(id);
    try {
      const response = await appointmentsAPI.downloadMedicalCertificate(id);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `medical_certificate_${patientName.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error('Failed to download certificate:', err);
      alert(err.response?.data?.error || 'Medical certificate not found for this appointment.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAppointments = appointments.filter((appt: any) => 
    appt.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appt.purpose?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appt.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Official Header Style */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-center border-b border-maroon-100 pb-6 mb-6">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="relative w-20 h-20">
                <Image src="/WMSU-Logo.jpg" alt="WMSU Logo" fill className="object-contain" />
              </div>
              <div className="text-center md:text-left">
                <h1  className="text-xl font-bold text-[#800000]">WESTERN MINDANAO STATE UNIVERSITY</h1>
                <p className="text-sm text-gray-600 font-medium">UNIVERSITY HEALTH SERVICES CENTER</p>
                <p className="text-xs text-gray-500">Zamboanga City, Philippines</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-xs text-gray-500 italic">"Excellence in Health Service"</p>
                <p className="text-xs text-[#800000] font-semibold">Appointment Management System</p>
              </div>
              <div className="relative w-16 h-16">
                <Image src="/WMSU-HealthLogo.png" alt="Health Logo" fill className="object-contain" />
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Appointment Records</h2>
              <p className="text-sm text-gray-500 mt-1">Manage patient consultations and retrieve medical certificates</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search patients..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent outline-none text-sm w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>
              
              <select
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-[#800000] outline-none"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <button 
                onClick={fetchAppointments}
                className="p-2 text-gray-500 hover:text-[#800000] hover:bg-red-50 rounded-lg transition-colors"
                title="Refresh data"
              >
                <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Patient Details</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-6 py-8">
                        <div className="h-4 bg-gray-100 rounded w-full"></div>
                      </td>
                    </tr>
                  ))
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                      No appointments found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appt: any) => (
                    <tr key={appt.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 bg-red-50 rounded-full flex items-center justify-center">
                            <UserIcon className="h-6 w-6 text-[#800000]" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-bold text-gray-900">{appt.patient?.name || 'Unknown Patient'}</div>
                            <div className="text-xs text-gray-500">{appt.patient?.student_id || 'No ID'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-700">
                          <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {new Date(appt.appointment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-xs text-gray-500 ml-6">{appt.appointment_time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 font-medium truncate max-w-xs">{appt.purpose}</div>
                        <div className="text-xs text-gray-500 italic capitalize">{appt.type} Consultation</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${getStatusColor(appt.status)}`}>
                          {appt.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          {appt.status.toLowerCase() === 'completed' ? (
                            <>
                              <button
                                onClick={() => handleViewCertificate(appt.id, appt.patient?.name)}
                                disabled={actionLoading === appt.id}
                                className="flex items-center px-3 py-1.5 bg-maroon-50 text-[#800000] hover:bg-[#800000] hover:text-white rounded-lg transition-all border border-maroon-100"
                                title="View Medical Certificate"
                              >
                                {actionLoading === appt.id ? (
                                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <EyeIcon className="h-4 w-4 mr-1.5" />
                                    <span>View</span>
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDownloadCertificate(appt.id, appt.patient?.name)}
                                disabled={actionLoading === appt.id}
                                className="flex items-center px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white rounded-lg transition-all border border-green-100"
                                title="Download Medical Certificate"
                              >
                                <ArrowDownTrayIcon className="h-4 w-4 mr-1.5" />
                                <span>Save</span>
                              </button>
                            </>
                          ) : (
                            <button
                              disabled
                              className="flex items-center px-3 py-1.5 bg-gray-50 text-gray-400 rounded-lg cursor-not-allowed opacity-60"
                              title="Certificate only available for completed appointments"
                            >
                              <ClipboardDocumentCheckIcon className="h-4 w-4 mr-1.5" />
                              <span>Pending</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {!loading && filteredAppointments.length > 0 && (
          <div className="mt-4 text-xs text-gray-500 text-right italic">
            * Medical certificates are generated only for completed medical consultations.
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAdminAccess(AdminAppointments);