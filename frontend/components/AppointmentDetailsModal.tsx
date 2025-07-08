import React from 'react';
import { XMarkIcon as XIcon } from '@heroicons/react/24/outline';

interface AppointmentDetailsModalProps {
  open: boolean;
  appointment: any;
  onClose: () => void;
}

const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({ open, appointment, onClose }) => {
  if (!open || !appointment) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'Not set';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10));
    date.setMinutes(parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
      case 'scheduled':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/20 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/95 rounded-2xl shadow-2xl px-8 py-6 max-w-2xl w-[90vw] max-h-[90vh] overflow-y-auto animate-modal-pop">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#800000]">Appointment Details</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
          >
            <XIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Appointment ID and Status */}
          <div className="flex justify-between items-center">
            <div>
              <label className="text-sm font-medium text-gray-600">Appointment ID</label>
              <p className="text-gray-900 font-semibold">#{appointment.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Status</label>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full capitalize ${getStatusColor(appointment.status)}`}>
                {appointment.status}
              </span>
            </div>
          </div>

          {/* Patient Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Patient Name</label>
                <p className="text-gray-900">{appointment.patient_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Patient ID</label>
                <p className="text-gray-900">{appointment.patient || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">Appointment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Type</label>
                <p className="text-gray-900 capitalize">{appointment.type || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date</label>
                <p className="text-gray-900">{formatDate(appointment.appointment_date)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Time</label>
                <p className="text-gray-900">{formatTime(appointment.appointment_time)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Doctor</label>
                <p className="text-gray-900">{appointment.doctor_name || 'To be assigned'}</p>
              </div>
            </div>
          </div>

          {/* Purpose and Notes */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">Visit Information</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Purpose of Visit</label>
                <p className="text-gray-900">{appointment.purpose || 'Not specified'}</p>
              </div>
              
              {appointment.concern && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Specific Concern</label>
                  <p className="text-gray-900">{appointment.concern}</p>
                </div>
              )}
              
              {appointment.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Additional Notes</label>
                  <p className="text-gray-900">{appointment.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">Timestamps</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <p className="text-gray-900">{formatDate(appointment.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Last Updated</label>
                <p className="text-gray-900">{formatDate(appointment.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-modal-pop {
          animation: modalPop 0.32s cubic-bezier(0.39, 0.575, 0.565, 1) both;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPop {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default AppointmentDetailsModal; 