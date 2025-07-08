import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import SignaturePad from 'signature_pad';
import FeedbackModal from '../../components/feedbackmodal';
import { waiversAPI } from '../../utils/api';

export default function WaiverPage() {
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
        router.push({
          pathname: '/patient/profile-setup',
          query: router.query,
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitted, router]);

  useEffect(() => {
    async function checkWaiver() {
      setLoading(true);
      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      let userId = null;
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user.id;
        } catch {}
      }
      if (!userId) {
        setLoading(false);
        return;
      }
      try {
        // Fetch all waivers and check if any match the current user id
        const res = await waiversAPI.getAll();
        const waivers = Array.isArray(res.data) ? res.data : [];
        const hasWaiver = waivers.some(w => String(w.user) === String(userId));
        if (hasWaiver) {
          setRedirecting(true);
          router.replace({ pathname: '/patient/profile-setup', query: router.query });
          return;
        }
      } catch {}
      setLoading(false);
    }
    checkWaiver();
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
        full_name: fullName,
        date_signed: dateSigned,
        signature,
      };
      await waiversAPI.create(data);
      setShowFeedback(true);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Failed to submit waiver.');
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
          <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
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
            Waiver for Collection of Personal and Sensitive Health Information
          </h1>

          {/* Body */}
          <div className="space-y-4 text-sm text-justify">
            <p>
              In consideration of Western Mindanao State University Health Services Center's collecting and processing of
              personal and sensitive health information, the undersigned individual, hereby agrees to the following terms and conditions:
            </p>
            
            <h2 className="font-bold pt-2">Consent:</h2>
            <p>
              By signing this waiver, the individual gives explicit consent to the University Health Services
              Center to collect, use, store, and process their personal and sensitive health information, as described in this
              document.
            </p>

            <h2 className="font-bold pt-2">Purpose of Collection:</h2>
            <p>
              The University Health Services Center collects personal and sensitive health
              information solely for the purpose of promoting and maintaining the health and general well-being of the
              school community.
            </p>
            
            <h2 className="font-bold pt-2">Types of Information:</h2>
            <p>
              The personal and sensitive health information that may be collected includes, but is not limited to, the following:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><b>Personal details:</b> Name, date of birth, gender, address, contact information</li>
              <li><b>Health-related information:</b> Medical history, current health conditions, medications, allergies, vaccination history, diagnostic reports, and test results.</li>
              <li><b>Other sensitive information:</b> Information about mental health, religious beliefs, or other similar data</li>
            </ul>

            <h2 className="font-bold pt-2">Collection Methods:</h2>
            <p>
              The University Health Services Center may collect personal and sensitive health information through various means, including but not limited to face-to-face interactions, written forms, and electronic/online forms.
            </p>

            <h2 className="font-bold pt-2">Data Storage and Security:</h2>
            <p>
              The University Health Services Center will implement reasonable technical and organizational measures to protect the personal and sensitive health information from unauthorized access, disclosure, alteration, or destruction. However, it cannot guarantee absolute security and shall not be liable for any security breaches, provided that University Health Services Center, acting as the personal information controller, promptly notifies the National Privacy Commission and the affected data subject.
            </p>

            <h2 className="font-bold pt-2">Data Sharing:</h2>
            <p>
              The University Health Services Center may forward the personal and sensitive health information to authorized personnel or entities, including fellow healthcare providers, insurers, research institutions, or government authorities, as required or permitted by applicable laws and regulations provided that the University Health Services Center will inform the data subject that the personal and sensitive health information will be forwarded to another entity or institution. The University Health Services Center shall be responsible that proper safeguards are in place to ensure the confidentiality of the personal information.
            </p>
            
            <h2 className="font-bold pt-2">Data Retention:</h2>
            <p>
              The University Health Services Center will retain the personal and sensitive health information for as long as necessary to fulfill the purposes stated in this waiver or as required by law. After the retention period, it will securely dispose of or anonymize the data.
            </p>

            <h2 className="font-bold pt-2">Rights of the Individual:</h2>
            <ul className="list-decimal list-inside ml-4 space-y-1">
                <li><b>Access:</b> The Individual has the right to request access to their personal and sensitive health information held by the Organization.</li>
                <li><b>Correction:</b> The Individual may request corrections or updates to their personal and sensitive health information if it is inaccurate or incomplete.</li>
                <li><b>Withdrawal of Consent:</b> The Individual may withdraw their consent for the collection and processing of their personal and sensitive health information. However, such withdrawal may affect the quality of certain health services.</li>
                <li><b>All other rights</b> included in the Data Privacy Act of 2012 (Republic Act 10173).</li>
            </ul>
            
            <h2 className="font-bold pt-2">Legal Compliance:</h2>
            <p>
              The University Health Services Center will comply with applicable laws and regulations regarding the collection, use, and disclosure of personal and sensitive health information, including but not limited to data protection and privacy laws, particularly the Data Privacy Act of 2012 (Republic Act 10173).
            </p>
            <p>
              The individual agrees to hold harmless the University Health Services Center, its officers and employees, from any claims, damages, or liabilities arising out of or related to the collection, use, or disclosure of their personal and sensitive health information, except in cases of gross negligence or willful misconduct.
            </p>
            <p>
              By signing below, the individual acknowledges that they have read and understood the terms and conditions of this waiver, and voluntarily agrees to the collection and processing of their personal and sensitive health information by the University Health Services Center.
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
                <p className="text-center text-sm mt-1">Individual's Full Name</p>
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
                <p className="text-center text-sm mt-1">Individual's Signature</p>
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
            <span>WMSU-UHSC-FR-006</span>
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
        message="Waiver submitted! Proceeding to profile setup..."
        onClose={() => {
          setShowFeedback(false);
          router.push({ pathname: '/patient/profile-setup', query: router.query });
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