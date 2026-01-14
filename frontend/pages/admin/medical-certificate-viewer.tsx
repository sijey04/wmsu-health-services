import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { djangoApiClient } from '../../utils/api';
import AdminLayout from '../../components/AdminLayout';
import withAdminAccess from '../../components/withAdminAccess';

interface StaffDetails {
  id: number;
  full_name: string;
  position: string;
  license_number: string;
  ptr_number: string;
  campus_assigned: string;
  signature: string;
}

interface MedicalDocument {
  id: number;
  patient_name: string;
  patient_full_name?: string;
  patient_first_name?: string;
  patient_middle_name?: string;
  patient_last_name?: string;
  patient_student_id: string;
  patient_department: string;
  medical_certificate: string;
  certificate_issued_at: string;
  reviewed_by: number;
}

function MedicalCertificateViewer() {
  const router = useRouter();
  const { id } = router.query;
  const [medicalDoc, setMedicalDoc] = useState<MedicalDocument | null>(null);
  const [staffDetails, setStaffDetails] = useState<StaffDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetchDocumentAndStaff();
    }
  }, [id]);
  const fetchDocumentAndStaff = async () => {
    try {
      setLoading(true);
      const docResponse = await djangoApiClient.get(`/medical-documents/${id}/`);
      const documentData = docResponse.data;
      setMedicalDoc(documentData);

      if (documentData.reviewed_by) {
        try {
          const staffResponse = await djangoApiClient.get(`/staff-details/?user=${documentData.reviewed_by}`);
          if (staffResponse.data.length > 0) {
            setStaffDetails(staffResponse.data[0]);
          }
        } catch (staffErr) {
          console.warn('Staff details not found for reviewer');
        }
      }
    } catch (err) {
      setError('Failed to load medical certificate');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };  const handleDownload = () => {
    if (medicalDoc?.medical_certificate) {
      const linkElement = window.document.createElement('a');
      // Handle both relative and absolute URLs
      const fileUrl = medicalDoc.medical_certificate.startsWith('http') 
        ? medicalDoc.medical_certificate 
        : `http://localhost:8000${medicalDoc.medical_certificate}`;
      
      linkElement.href = fileUrl;
      linkElement.download = `medical_certificate_${medicalDoc.patient_student_id}.pdf`;
      linkElement.target = '_blank'; // Open in new tab if download fails
      window.document.body.appendChild(linkElement);
      linkElement.click();
      window.document.body.removeChild(linkElement);
    } else {
      alert('No medical certificate file available for download');
    }
  };
  const handleWebsiteShare = () => {
    if (medicalDoc?.medical_certificate) {
      const shareUrl = `${window.location.origin}/certificate/view/${medicalDoc.id}`;
      navigator.clipboard.writeText(shareUrl);
      alert('Certificate link copied to clipboard!');
    }
  };

  // Format the full name properly
  const getPatientFullName = () => {
    if (!medicalDoc) return '';
    
    // Check if patient_full_name is provided
    if (medicalDoc.patient_full_name) {
      return medicalDoc.patient_full_name;
    }
    
    // Build full name from components
    if (medicalDoc.patient_first_name || medicalDoc.patient_middle_name || medicalDoc.patient_last_name) {
      const parts = [];
      if (medicalDoc.patient_last_name) parts.push(medicalDoc.patient_last_name.toUpperCase());
      if (medicalDoc.patient_first_name) parts.push(medicalDoc.patient_first_name);
      if (medicalDoc.patient_middle_name) parts.push(medicalDoc.patient_middle_name);
      return parts.join(', ').replace(/, ([^,]*)$/, ' $1'); // Format as "LAST NAME, First Name Middle Name"
    }
    
    // Fallback to patient_name
    return medicalDoc.patient_name;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading medical certificate...</div>
        </div>
      </AdminLayout>
    );
  }
  if (error || !medicalDoc) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500 text-lg">{error || 'Certificate not found'}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Action Buttons - Hide when printing */}
        <div className="mb-6 print:hidden">
          <div className="flex justify-between items-center">
            <button
              onClick={() => router.back()}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              ← Back to Medical Documents
            </button>
            <div className="flex space-x-3">
              <button
                onClick={handlePrint}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                🖨️ Print
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                📥 Download
              </button>
            </div>
          </div>
        </div>        {/* Medical Certificate Display */}
        <div className="certificate-print-container bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:rounded-none">
          <div className="p-8 print:p-4">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <img src="/logo.png" alt="WMSU Logo" className="w-20 h-20 mr-4" />
                <div>
                  <h1 className="text-2xl font-bold text-red-600">
                    WESTERN MINDANAO STATE UNIVERSITY
                  </h1>
                  <p className="text-lg text-gray-600">ZAMBOANGA CITY</p>
                  <p className="text-base text-gray-600 font-semibold">
                    UNIVERSITY HEALTH SERVICES CENTER
                  </p>
                </div>
              </div>
              <div className="border-b-2 border-red-600 w-full"></div>
            </div>

            {/* Certificate Title */}
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold">MEDICAL CERTIFICATE</h2>
            </div>

            {/* Certificate Content */}            <div className="space-y-6 text-base leading-relaxed">
              <p>To Whom It May Concern:</p>
              
              <p>
                This is to certify that <span className="font-bold underline">{getPatientFullName()}</span>, 
                a {medicalDoc.patient_department} student, has been officially examined by the University Health Services Center and was deemed physically fit for college activities.
              </p>

              <p>
                The examinee is advised to observe the general precautions of healthy lifestyle and medicine. Medical instructions, if any, are to be followed explicitly as prescribed for controlled illnesses not any unmonitored medications. Hence, there are no contraindications for school-related activities.
              </p>

              <p>
                This certification is issued upon request of <span className="font-bold underline">{getPatientFullName()}</span> for 
                whatever purpose it may serve him/her best.
              </p>
            </div>            {/* Date and Location */}
            <div className="mt-12 mb-8">
              <p>
                Given this {medicalDoc.certificate_issued_at ? new Date(medicalDoc.certificate_issued_at).getDate() : new Date().getDate()}
                {(() => {
                  const day = medicalDoc.certificate_issued_at ? new Date(medicalDoc.certificate_issued_at).getDate() : new Date().getDate();
                  return day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th';
                })()} day of{' '}
                {medicalDoc.certificate_issued_at ? 
                  new Date(medicalDoc.certificate_issued_at).toLocaleDateString('en-US', { month: 'long' }) : 
                  new Date().toLocaleDateString('en-US', { month: 'long' })},{' '}
                {medicalDoc.certificate_issued_at ? 
                  new Date(medicalDoc.certificate_issued_at).getFullYear() : 
                  new Date().getFullYear()} in the City of Zamboanga, Philippines.
              </p>
            </div>

            {/* Signature Section */}
            <div className="mt-16 flex justify-end">
              <div className="text-center">
                {staffDetails ? (
                  <>
                    {staffDetails.signature && (
                      <div className="mb-4">
                        <img 
                          src={staffDetails.signature} 
                          alt="Signature" 
                          className="h-16 mx-auto"
                        />
                      </div>
                    )}
                    <div className="border-b-2 border-black w-64 mb-2"></div>
                    <div className="text-center">
                      <p className="font-bold text-blue-600">
                        {staffDetails.full_name}
                      </p>
                      <p className="text-sm">
                        {staffDetails.position}
                      </p>
                      {staffDetails.license_number && (
                        <p className="text-sm">
                          LICENSE NO. {staffDetails.license_number}
                        </p>
                      )}
                      {staffDetails.ptr_number && (
                        <p className="text-sm">
                          PTR NO. {staffDetails.ptr_number}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 italic">
                    Staff details not available
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>        {/* PDF Preview if available */}
        {medicalDoc.medical_certificate && (
          <div className="mt-8 print:hidden">
            <h3 className="text-lg font-semibold mb-4">Original Certificate (PDF)</h3>
            <div className="border rounded-lg overflow-hidden">
              <iframe
                src={medicalDoc.medical_certificate.startsWith('http') 
                  ? medicalDoc.medical_certificate 
                  : `http://localhost:8000${medicalDoc.medical_certificate}`}
                className="w-full h-96"
                title="Medical Certificate PDF"
              />
            </div>
          </div>
        )}
      </div>      <style jsx global>{`
        @media print {
          /* Hide everything by default */
          body * {
            visibility: hidden !important;
          }
          
          /* Hide the sidebar and admin layout completely */
          nav, .sidebar, aside, header, footer {
            display: none !important;
          }
          
          /* Hide all elements with print:hidden class */
          .print\\:hidden {
            display: none !important;
          }
          
          /* Show only the certificate container and its contents */
          .certificate-print-container,
          .certificate-print-container * {
            visibility: visible !important;
          }
          
          /* Position certificate container to fill the page */
          .certificate-print-container {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: white !important;
            margin: 0 !important;
            padding: 1rem !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          
          /* Remove shadows and borders for print */
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
          
          /* Set page properties */
          @page {
            margin: 0.5in;
            size: letter;
          }
          
          /* Reset body for print */
          body {            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </AdminLayout>
  );
}

export default withAdminAccess(MedicalCertificateViewer);
