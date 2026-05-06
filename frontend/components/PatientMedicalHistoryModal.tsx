import React, { useState, useEffect } from 'react';
import { XMarkIcon, EyeIcon, DocumentTextIcon, PrinterIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { appointmentsAPI, medicalFormAPI } from '../utils/api';
import FormViewerModal from './FormViewerModal';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PatientMedicalHistoryModalProps {
  open: boolean;
  patientId: number | null;
  userId?: number | null;
  patientName: string;
  onClose: () => void;
}

interface MedicalAppointmentRecord {
  id: number;
  appointment_date: string;
  appointment_time: string;
  purpose: string;
  status: string;
  doctor_name?: string;
  notes?: string;
  hasFormData?: boolean;
}

const PatientMedicalHistoryModal: React.FC<PatientMedicalHistoryModalProps> = ({ 
  open, 
  patientId, 
  userId,
  patientName, 
  onClose 
}) => {
  const [appointments, setAppointments] = useState<MedicalAppointmentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formViewerModal, setFormViewerModal] = useState({
    open: false,
    appointmentId: null as number | null,
    patientName: ''
  });

  useEffect(() => {
    if (open && (patientId || userId)) {
      fetchMedicalHistory();
    }
  }, [open, patientId, userId]);

  const fetchMedicalHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {
        type: 'medical',
      };

      if (userId) {
        params.user_id = userId;
      } else if (patientId) {
        params.patient_id = patientId;
      }

      const response = await appointmentsAPI.getAll(params);
      const appointmentData = response.data || [];
      
      // Check for form data existence for each appointment
      const appointmentsWithFormData = await Promise.all(
        appointmentData.map(async (appointment: MedicalAppointmentRecord) => {
          let hasFormData = false;
          try {
            const formResponse = await medicalFormAPI.checkFormExists(appointment.id);
            hasFormData = formResponse.data && formResponse.data.length > 0;
          } catch (err) {
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
      setError('Failed to fetch medical history.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const handleViewFormData = (appointmentId: number) => {
    setFormViewerModal({
      open: true,
      appointmentId,
      patientName
    });
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const primaryColor = [128, 0, 0]; // Maroon
    
    // Add University Header
    doc.addImage('/WMSU-Logo.jpg', 'JPEG', 20, 10, 25, 25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('WESTERN MINDANAO STATE UNIVERSITY', 50, 20);
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text('UNIVERSITY HEALTH SERVICES CENTER', 50, 27);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Zamboanga City, Philippines', 50, 33);
    
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.line(20, 40, 190, 40);
    
    // Report Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MEDICAL CONSULTATION HISTORY', 105, 50, { align: 'center' });
    
    // Patient Info
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Patient Name: ${patientName}`, 20, 60);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 190, 60, { align: 'right' });
    
    // Table Data
    const tableData = appointments.map(appt => [
      new Date(appt.appointment_date).toLocaleDateString(),
      appt.appointment_time,
      appt.purpose,
      appt.doctor_name || 'N/A',
      appt.status.toUpperCase(),
      appt.hasFormData ? 'With Records' : 'No Records'
    ]);
    
    // Examination Details Table
    autoTable(doc, {
      startY: 70,
      head: [['Date', 'Time', 'Purpose', 'Clinician', 'Status', 'Examination Data']],
      body: tableData,
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { top: 70 },
      styles: { fontSize: 9 }
    });
    
    doc.save(`Medical_History_${patientName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/30">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden m-4">
        {/* Header */}
        <div className="bg-[#800000] text-white p-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-8 w-8" />
            <div>
              <h2 className="text-2xl font-bold">Medical Consultation History</h2>
              <p className="text-sm text-red-100">{patientName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 no-print">
            <button
              onClick={handleExportPDF}
              className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/20"
              title="Export to PDF"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Export PDF</span>
            </button>
            <button
              onClick={() => window.print()}
              className="p-2 bg-red-700 hover:bg-red-800 rounded-full transition-colors"
              title="Print History List"
            >
              <PrinterIcon className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <style jsx global>{`
          @media print {
            .no-print {
              display: none !important;
            }
            body {
              padding: 0 !important;
              background: white !important;
            }
            .fixed.inset-0 {
              position: relative !important;
              display: block !important;
              z-index: auto !important;
              background: none !important;
            }
            .max-w-5xl {
              max-width: 100% !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .max-h-\[90vh\] {
              max-height: none !important;
              overflow: visible !important;
            }
            .max-h-\[calc\(90vh-140px\)\] {
              max-height: none !important;
              overflow: visible !important;
            }
            .bg-\[\#800000\] {
              background-color: #800000 !important;
              color: white !important;
              print-color-adjust: exact;
            }
          }
        `}</style>

        {/* Content */}
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000] mb-4"></div>
              <p className="text-gray-600 font-medium">Retrieving medical records...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <XMarkIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No previous medical consultations found for this patient.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {appointments.map((appointment) => (
                <div 
                  key={appointment.id} 
                  className={`border rounded-xl p-4 transition-all duration-200 ${
                    appointment.hasFormData ? 'border-blue-100 bg-blue-50/30 hover:shadow-md' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg font-bold text-gray-900">
                          {new Date(appointment.appointment_date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          appointment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                        <p><span className="font-medium text-gray-500">Time:</span> {appointment.appointment_time}</p>
                        <p><span className="font-medium text-gray-500">Purpose:</span> {appointment.purpose}</p>
                        <p className="md:col-span-2"><span className="font-medium text-gray-500">Doctor:</span> {appointment.doctor_name || 'Not assigned'}</p>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 flex items-center space-x-3">
                      {appointment.hasFormData ? (
                        <button
                          onClick={() => handleViewFormData(appointment.id)}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium text-sm"
                        >
                          <EyeIcon className="h-4 w-4 mr-2" />
                          View Full Details
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 italic bg-gray-100 px-3 py-1.5 rounded-md">
                          No Examination Data recorded
                        </span>
                      )}
                    </div>
                  </div>
                  {appointment.notes && (
                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 italic">
                      <span className="font-medium not-italic mr-1">Notes:</span> {appointment.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>

      <FormViewerModal
        open={formViewerModal.open}
        appointmentId={formViewerModal.appointmentId}
        appointmentType="medical"
        patientName={formViewerModal.patientName}
        onClose={() => setFormViewerModal({ ...formViewerModal, open: false })}
      />
    </div>
  );
};

export default PatientMedicalHistoryModal;
