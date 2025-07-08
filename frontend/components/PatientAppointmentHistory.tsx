import React, { useState, useEffect } from 'react';
import { XMarkIcon, EyeIcon } from '@heroicons/react/24/outline';
import { appointmentsAPI, medicalFormAPI, dentalFormAPI } from '../utils/api';
import FormViewerModal from './FormViewerModal';

interface PatientAppointmentHistoryProps {
  open: boolean;
  patientId: number | null;
  patientName: string;
  onClose: () => void;
}

interface AppointmentRecord {
  id: number;
  appointment_date: string;
  appointment_time: string;
  purpose: string;
  status: string;
  type: 'medical' | 'dental';
  doctor_name?: string;
  rejection_reason?: string;
  notes?: string;
  hasFormData?: boolean; // Add this field to track if form data exists
}

const PatientAppointmentHistory: React.FC<PatientAppointmentHistoryProps> = ({ 
  open, 
  patientId, 
  patientName, 
  onClose 
}) => {
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, medical, dental
  const [statusFilter, setStatusFilter] = useState('all'); // all, completed, cancelled
  const [formViewerModal, setFormViewerModal] = useState({
    open: false,
    appointmentId: null as number | null,
    appointmentType: 'medical' as 'medical' | 'dental',
    patientName: ''
  });

  useEffect(() => {
    if (open && patientId) {
      fetchAppointments();
    }
  }, [open, patientId, filter, statusFilter]);  const fetchAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {
        patient_id: patientId, // Use patient_id instead of patient for proper filtering
      };
      
      if (filter !== 'all') {
        params.type = filter;
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const response = await appointmentsAPI.getAll(params);
      const appointmentData = response.data || [];
      
      // Check for form data existence for each appointment
      const appointmentsWithFormData = await Promise.all(
        appointmentData.map(async (appointment: AppointmentRecord) => {
          let hasFormData = false;
          
          try {
            if (appointment.type === 'medical') {
              const formResponse = await medicalFormAPI.checkFormExists(appointment.id);
              hasFormData = formResponse.data && formResponse.data.length > 0;
            } else if (appointment.type === 'dental') {
              const formResponse = await dentalFormAPI.checkFormExists(appointment.id);
              hasFormData = formResponse.data && formResponse.data.length > 0;
            }
          } catch (err) {
            // If form check fails, assume no form data exists
            hasFormData = false;
          }
          
          return {
            ...appointment,
            hasFormData
          };
        })
      );
      
      setAppointments(appointmentsWithFormData);
    } catch (err: any) {
      setError('Failed to fetch appointment history.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      completed: 'bg-green-100 text-green-800',
      confirmed: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      scheduled: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };
  const getTypeBadge = (type: string) => {
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        type === 'medical' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
      }`}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const handleViewFormData = (appointmentId: number, appointmentType: 'medical' | 'dental') => {
    setFormViewerModal({
      open: true,
      appointmentId,
      appointmentType,
      patientName
    });
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden m-4">
        {/* Header */}
        <div className="bg-[#800000] text-white p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Appointment History - {patientName}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Type:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
              >
                <option value="all">All Types</option>
                <option value="medical">Medical</option>
                <option value="dental">Dental</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000]"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[calc(90vh-200px)] overflow-y-auto p-6">
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="text-lg text-gray-600">Loading appointment history...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              {appointments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No appointment history found for this patient.</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {appointments.map((appointment) => (
                        <tr key={appointment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium">
                                {new Date(appointment.appointment_date).toLocaleDateString()}
                              </div>
                              <div className="text-gray-500">
                                {appointment.appointment_time}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getTypeBadge(appointment.type)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {appointment.purpose}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(appointment.status)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {appointment.doctor_name || 'N/A'}
                          </td>                          <td className="px-6 py-4 text-sm text-gray-900">
                            {appointment.status === 'cancelled' && appointment.rejection_reason ? (
                              <div className="text-red-600">
                                <span className="font-medium">Cancelled:</span> {appointment.rejection_reason}
                              </div>
                            ) : (
                              appointment.notes || 'N/A'
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {appointment.hasFormData ? (
                              <button
                                onClick={() => handleViewFormData(appointment.id, appointment.type)}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
                                title={`View ${appointment.type} form data`}
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                View
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">No form data</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-md"
          >
            Close
          </button>
        </div>
      </div>

      {/* Form Viewer Modal */}
      <FormViewerModal
        open={formViewerModal.open}
        appointmentId={formViewerModal.appointmentId}
        appointmentType={formViewerModal.appointmentType}
        patientName={formViewerModal.patientName}
        onClose={() => setFormViewerModal({ ...formViewerModal, open: false })}
      />
    </div>
  );
};

export default PatientAppointmentHistory;
