import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import SignaturePad from 'signature_pad';
import FeedbackModal from '../../components/feedbackmodal';
import { dentalWaiversAPI } from '../../utils/api';

export default function DentalWaiverPage() {
  const router = useRouter();
  const sigPad = useRef<any>(null);
  const pad = useRef<any>(null);
  const [submitted, setSubmitted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);

  // Editable full name
  // Get user info from localStorage for default full name
  let defaultFullName = '';
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      defaultFullName = user.last_name || '';
      if (user.first_name) defaultFullName += (defaultFullName ? ', ' : '') + user.first_name;
      if (user.middle_name) defaultFullName += ' ' + user.middle_name;
    } catch {}
  }
  const [fullName, setFullName] = useState(defaultFullName);

  // Date logic: today and one year from today
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  const [dateSigned] = useState(todayStr);
  const effectiveDateObj = new Date(today);
  effectiveDateObj.setFullYear(today.getFullYear() + 1);
  const effectiveDateStr = `${effectiveDateObj.getFullYear()}-${String(effectiveDateObj.getMonth() + 1).padStart(2, '0')}-${String(effectiveDateObj.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    if (!loading && sigPad.current) {
      pad.current = new SignaturePad(sigPad.current, { penColor: 'black' });
    }
  }, [loading]);

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        // Redirect back to dental appointment booking with original query params
        router.push({
          pathname: '/appointments/dental',
          query: router.query,
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [submitted, router]);

  useEffect(() => {
    async function checkDentalWaiver() {
      setLoading(true);
      try {
        // Check if user has already signed the dental waiver
        const res = await dentalWaiversAPI.checkStatus();
        if (res.data.has_signed) {
          setRedirecting(true);
          router.replace({ pathname: '/appointments/dental', query: router.query });
          return;
        }
      } catch (error) {
        console.error('Error checking dental waiver status:', error);
      }
      setLoading(false);
    }
    checkDentalWaiver();
  }, [router]);

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async () => {
    if (!pad.current || pad.current.isEmpty()) {
      alert("Please provide your signature before submitting.");
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      let patientId = null;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          // Use patient_profile directly as the patient ID
          patientId = user.patient_profile || user.patient?.id || user.id;
        } catch (e) {}
      }
      if (!patientId) {
        setError('Could not determine your patient ID. Please log in again.');
        setSubmitting(false);
        return;
      }
      // Get signature as base64
      const signature = pad.current.toDataURL();
      // Prepare data
      const data = {
        patient: patientId,
        patient_name: fullName,
        date_signed: dateSigned,
        patient_signature: signature,
      };
      await dentalWaiversAPI.create(data);
      setShowFeedback(true);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit dental waiver.');
    } finally {
      setSubmitting(false);
    }
  };

  const clearSignature = () => {
    if (pad.current) {
      pad.current.clear();
    }
  };

  // Dummy handlers for Layout
  const handleLoginClick = () => {};
  const handleSignupClick = () => {};

  return (
    <Layout onLoginClick={handleLoginClick} onSignupClick={handleSignupClick}>
      {(loading || redirecting) ? (
        <div className="flex items-center justify-center min-h-screen">
          <svg className="animate-spin h-12 w-12 text-[#800000]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
        </div>
      ) : (
      <div className="bg-white text-black min-h-screen py-12 px-4 sm:px-6 lg:px-8 printable-area">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex justify-between items-center border-b-2 border-black pb-4 mt-6 mb-6">
            <div className="flex items-center space-x-2">
              {/* Placeholders for logos */}
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-xs">Logo 1</div>
              <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center text-xs">Logo 2</div>
            </div>
            <div className="text-center">
              <p className="font-bold">WESTERN MINDANAO STATE UNIVERSITY</p>
              <p className="font-bold">ZAMBOANGA CITY</p>
              <p className="font-semibold">UNIVERSITY HEALTH SERVICES CENTER</p>
              <p className="text-sm">Tel. no. (062) 991-0736 | Email: healthservices@wmsu.edu.ph</p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Placeholders for logos */}
              <div className="w-16 h-16 bg-gray-300 flex items-center justify-center text-xs">Logo 3</div>
              <div className="w-16 h-16 bg-gray-300 flex items-center justify-center text-xs">Logo 4</div>
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-xl font-bold text-center my-8">
            INFORMED CONSENT TO CARE
          </h1>

          {/* Body */}
          <div className="space-y-4 text-sm text-justify">
            <p>
              I understand that I am receiving care from the WMSU Health Services Center and that various dental procedures may be performed on me by dentists, dental hygienists, dental assistants, and other oral health care providers.
            </p>
            
            <h2 className="font-bold pt-2">Risks and Benefits:</h2>
            <p>
              I understand that no dental treatment is 100% successful, and I understand that no guarantee of success has been made to me. I also understand that I have the right to be informed of the treatment options available to me, the risks, benefits, and costs of each option, and the prognosis if no treatment is provided.
            </p>

            <h2 className="font-bold pt-2">Alternative Treatments:</h2>
            <p>
              I understand that I have the right to consent or refuse any proposed treatment at any time. I understand that my cooperation and oral hygiene efforts are important for the success of treatment.
            </p>
            
            <h2 className="font-bold pt-2">Financial Arrangements:</h2>
            <p>
              I understand that payment is due at the time services are rendered unless other arrangements have been made. I understand that any collection costs and reasonable attorney fees incurred in collecting amounts owed to the practice shall be paid by me.
            </p>

            <h2 className="font-bold pt-2">Cancellation Policy:</h2>
            <p>
              I understand that any appointment cancelled without 24-hour notice may result in a charge for the reserved time.
            </p>

            <h2 className="font-bold pt-2">Privacy and Records:</h2>
            <p>
              I understand that my dental records are confidential and will not be released to others without my written consent, except as required by law. I understand that I may request copies of my records at any time.
            </p>

            <h2 className="font-bold pt-2">Emergency Treatment:</h2>
            <p>
              I understand that if emergency treatment is needed and I cannot be contacted, the dental staff will use their professional judgment to provide necessary care.
            </p>
            
            <h2 className="font-bold pt-2">Medical History:</h2>
            <p>
              I understand that it is my responsibility to inform the dental staff of any changes in my medical history, medications, or health status. I understand that failure to do so may jeopardize my treatment and health.
            </p>

            <h2 className="font-bold pt-2">Photography and Records:</h2>
            <p>
              I consent to the taking of photographs, videos, or other images of my treatment for documentation, education, or quality assurance purposes. I understand that my identity will be protected in any use of such images.
            </p>
            
            <h2 className="font-bold pt-2">Acknowledgment:</h2>
            <p>
              I acknowledge that I have read and understand this consent form. I have had the opportunity to ask questions, and all my questions have been answered to my satisfaction. I understand that signing this form does not obligate me to proceed with any specific treatment.
            </p>
            <p>
              By signing below, I give my informed consent to receive dental care at the WMSU Health Services Center and agree to the terms outlined above.
            </p>
          </div>
          
          {/* Signature Section */}
          <div className="mt-12 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10 items-center">
              {/* Full Name */}
              <div className="flex flex-col items-center">
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="text-center font-semibold border-b border-black w-full max-w-xs mb-1 focus:outline-none"
                  style={{ fontSize: '1.1rem' }}
                  required
                />
                <p className="text-center text-sm mt-1">Patient's Full Name</p>
              </div>
              {/* Signature */}
              <div className="relative flex flex-col items-center">
                <div className="border border-black w-full h-24 bg-gray-50 rounded-md relative">
                  <canvas
                    ref={sigPad}
                      width={400}
                      height={96}
                    style={{ width: '100%', height: '100%' }}
                  />
                </div>
                <button
                  onClick={clearSignature}
                  className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded px-2 py-0.5 hover:bg-red-600 no-print"
                  disabled={submitted}
                >
                  Clear
                </button>
                <p className="text-center text-sm mt-1">Patient's Signature</p>
              </div>
              {/* Date Signed */}
              <div className="flex flex-col items-center">
                <span className="text-center font-semibold border-b border-black w-full max-w-xs mb-1" style={{ fontSize: '1.1rem' }}>{dateSigned}</span>
                <p className="text-center text-sm mt-1">Date Signed</p>
              </div>
            </div>
          </div>
          {/* Footer */}
          <div className="text-xs text-gray-600 mt-16 pt-4 border-t flex justify-between">
            <span>WMSU-UHSC-FR-007</span>
            <span>Effective Date Till: {effectiveDateStr}</span>
          </div>
          {/* Action Buttons and Submission Message */}
          <div className="mt-12 flex flex-col items-end no-print">
            {error && <div className="text-red-600 text-sm mb-2 text-center w-full">{error}</div>}
            <div className="flex justify-end space-x-4 w-full">
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-all duration-200"
                disabled={showFeedback || submitting}
              >
                Print
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-[#007bff] text-white rounded-lg font-semibold hover:bg-[#0056b3] transition-all duration-200"
                disabled={showFeedback || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
      <FeedbackModal
        open={showFeedback}
        message="Dental waiver submitted! Returning to appointment booking..."
        onClose={() => {
          setShowFeedback(false);
          router.push({ pathname: '/appointments/dental', query: router.query });
        }}
      />
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
        .printable-area {
          padding: 0;
          margin: 0;
        }
        body {
          background-color: white;
        }
        /* Style for the signature pad container */
        .border-black {
          position: relative;
          width: 100%;
          height: 96px; /* h-24 */
        }
        /* Style for the signature pad canvas */
        .border-black > div > canvas, .border-black > canvas {
          position: absolute;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </Layout>
  );
}
