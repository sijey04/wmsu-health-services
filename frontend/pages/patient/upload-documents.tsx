import React, { useState, useMemo, useEffect } from 'react';
import Layout from '../../components/Layout';
import { medicalDocumentsAPI, djangoApiClient } from '../../utils/api';
import FeedbackModal from '../../components/feedbackmodal';

const allDocumentFields = [
  {
    label: 'Chest X-ray Results',
    description: '(results valid for 6 months)',
    name: 'chestXray',
    backendField: 'chest_xray',
    required: true,
    specificCourses: []
  },
  {
    label: 'Complete Blood Count Results',
    description: '(PDF, DOCX, JPG, JPEG, PNG, Max 50MB)',
    name: 'cbc',
    backendField: 'cbc',
    required: true,
    specificCourses: []
  },
  {
    label: 'Blood Typing Results',
    description: '(PDF, DOCX, JPG, JPEG, PNG, Max 50MB)',
    name: 'bloodTyping',
    backendField: 'blood_typing',
    required: true,
    specificCourses: []
  },
  {
    label: 'Urinalysis Results',
    description: '(PDF, DOCX, JPG, JPEG, PNG, Max 50MB)',
    name: 'urinalysis',
    backendField: 'urinalysis',
    required: true,
    specificCourses: []
  },
  {
    label: 'Drug Test Results',
    description: '(results valid for 1 year)',
    name: 'drugTest',
    backendField: 'drug_test',
    required: true,
    specificCourses: []
  },
  {
    label: 'Hepatitis B Surface Antigen Test',
    description: 'Required only for students of College of Medicine, College of Nursing, College of Home Economics, College of Criminal Justice Education, BS Food Technology, & BS Biology.',
    name: 'hepaB',
    backendField: 'hepa_b',
    required: false,
    specificCourses: ['College of Medicine', 'College of Nursing', 'College of Home Economics', 'College of Criminal Justice Education', 'BS Food Technology', 'BS Biology'],
  },
];

export default function UploadDocumentsPage() {
  // --- MOCK USER DATA ---
  // This should be replaced with actual user data from your auth context or state management
  const [userProfile, setUserProfile] = useState({
    isFreshman: true,
    course: 'College of Nursing', // Example: Change to a different course to test logic
  });
  // --------------------

  const [documentFields, setDocumentFields] = useState(allDocumentFields);
  const [apiLoaded, setApiLoaded] = useState(false);

  // Load document requirements from admin controls
  useEffect(() => {
    loadDocumentRequirements();
    loadCurrentPatientId();
  }, []);

  const loadCurrentPatientId = async () => {
    try {
      // Try to get current patient profile
      const response = await djangoApiClient.get('/patients/my_profile/');
      if (response.data?.id) {
        setCurrentPatientId(response.data.id);
      }
    } catch (error: any) {
      console.error('Error loading current patient ID:', error);
      
      // If 404, user doesn't have a patient profile yet
      if (error.response?.status === 404) {
        setError('Please create your patient profile first before uploading documents.');
        setFeedbackMessage('Please create your patient profile first before uploading documents.');
        setFeedbackOpen(true);
      }
    }
  };

  const loadDocumentRequirements = async () => {
    try {
      const response = await djangoApiClient.get('/admin-controls/document_requirements/');
      const requirements = response.data || [];
      
      // Convert backend requirements to frontend format
      const formattedFields = requirements
        .filter((req: any) => req.is_active)
        .map((req: any) => ({
          label: req.display_name,
          description: req.description + (req.validity_period_months ? ` (valid for ${req.validity_period_months} months)` : ''),
          name: req.field_name === 'chest_xray' ? 'chestXray' : 
                req.field_name === 'blood_typing' ? 'bloodTyping' :
                req.field_name === 'drug_test' ? 'drugTest' :
                req.field_name === 'hepa_b' ? 'hepaB' : req.field_name,
          backendField: req.field_name,
          required: req.is_required,
          specificCourses: req.specific_courses || []
        }));

      // Only update if we have formatted fields, otherwise keep defaults
      if (formattedFields.length > 0) {
        setDocumentFields(formattedFields);
      }
    } catch (error) {
      console.error('Error loading document requirements:', error);
      // Keep default requirements if API fails - documentFields already initialized with allDocumentFields
    }
  };

  const filteredDocumentFields = useMemo(() => {
    if (!userProfile.isFreshman) {
      // Hide all documents if not a freshman, per the image
      return [];
    }
    
    // Filter documents based on requirements and user's course
    const filtered = documentFields.filter(field => {
      // If it's required for all, include it
      if (field.required && field.specificCourses.length === 0) {
        return true;
      }
      
      // If it has specific course requirements, check if user's course matches
      if (field.specificCourses.length > 0) {
        return field.specificCourses.includes(userProfile.course);
      }
      
      // Include non-required documents
      return true;
    });
    
    return filtered;
  }, [userProfile, documentFields]);

  const [files, setFiles] = useState<{ [key: string]: File | null }>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [currentPatientId, setCurrentPatientId] = useState<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, name: string) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((prev) => ({ ...prev, [name]: e.target.files![0] }));
      setMissingFields((prev) => prev.filter((f) => f !== name));
    }
  };

  const requiredDocumentFields = useMemo(() => filteredDocumentFields.filter(f => f.required), [filteredDocumentFields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);
    setFeedbackMessage('');
    setFeedbackOpen(false);
    
    // Check if we have a patient ID (for user feedback)
    if (!currentPatientId) {
      setError('Please create your patient profile first before uploading documents.');
      setFeedbackMessage('Please create your patient profile first before uploading documents.');
      setFeedbackOpen(true);
      setSubmitting(false);
      return;
    }
    
    // Check required documents
    const missing = requiredDocumentFields.filter(f => !files[f.name]).map(f => f.name);
    setMissingFields(missing);
    if (missing.length > 0) {
      setError('Please upload all required documents.');
      setFeedbackMessage('Please upload all required documents.');
      setFeedbackOpen(true);
      setSubmitting(false);
      return;
    }
    try {
      const formData = new FormData();
      
      // Note: We don't need to include the patient ID in the form data
      // The backend MedicalDocumentViewSet.perform_create() will automatically
      // set the patient profile for authenticated users
      
      documentFields.forEach((field) => {
        if (files[field.name]) {
          // Use backend field name for API
          formData.append(field.backendField, files[field.name]!);
        }
      });
      
      await medicalDocumentsAPI.upload(formData);
      setSuccess(true);
      setFeedbackMessage('Your medical documents have been uploaded successfully. We will process your request soon. Please check your appointments for updates.');
      setFeedbackOpen(true);
      setMissingFields([]);
    } catch (err: any) {
      console.error('Upload error:', err);
      const msg = err?.response?.data?.detail || 
                  err?.response?.data?.patient?.[0] || 
                  err?.response?.data?.error || 
                  'Failed to upload documents.';
      setError(msg);
      setFeedbackMessage(msg);
      setFeedbackOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Dummy handlers for Layout (no login/signup in this flow)
  const handleLoginClick = () => {};
  const handleSignupClick = () => {};

  return (
    <Layout onLoginClick={handleLoginClick} onSignupClick={handleSignupClick}>
      <div className="fixed inset-0 w-full h-full bg-gradient-to-br from-[#fbeaec] via-[#fff] to-[#fbeaec] -z-10" />
      <div className="relative min-h-[80vh] w-full flex items-center justify-center">
        <div className="relative z-10 w-full max-w-2xl mx-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#f3eaea] animate-fade-in-up">
            <div className="px-8 pt-8 pb-2">
              {/* Card Header */}
              <div className="flex flex-col items-center mb-6">
                <div className="bg-[#800000] rounded-full p-3 mb-2 shadow-md">
                  <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#800000] text-center">Upload Medical Documents</h2>
                <p className="text-gray-500 text-center mt-1 text-sm">Please upload the required documents to request your medical certificate.</p>
              </div>
              {success ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto mb-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <h3 className="text-xl font-bold text-green-600">Documents Submitted!</h3>
                  <p className="mt-2 text-sm text-gray-600 text-center">Your medical documents have been uploaded successfully.<br />We will process your request soon.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {filteredDocumentFields.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No document upload fields available.</p>
                      <p className="text-sm mt-2">
                        Please ensure you have a patient profile set up and check if document requirements are configured.
                      </p>
                    </div>
                  )}
                  {filteredDocumentFields.map((field) => (
                    <div key={field.name}>
                      <label className="block font-semibold text-gray-700 mb-1">
                        {field.label} <span className="font-normal text-gray-500 text-xs">{field.description}</span>
                      </label>
                      <div className={`relative border-2 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200 flex items-center px-4 py-4 ${missingFields.includes(field.name) ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}>
                        <input
                          type="file"
                          accept=".pdf,.docx,.jpg,.jpeg,.png"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => handleFileChange(e, field.name)}
                        />
                        <div className="flex items-center w-full">
                          <svg className="h-6 w-6 text-[#800000] mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4a1 1 0 011-1h8a1 1 0 011 1v12m-4 4h-4a1 1 0 01-1-1v-4h6v4a1 1 0 01-1 1z" />
                          </svg>
                          <span className="text-gray-600 text-sm truncate">
                            {files[field.name]?.name || 'Drag & drop or click to select file'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {error && (
                    <div className="text-red-600 text-center mb-2">{error}</div>
                  )}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`px-6 py-2 bg-[#800000] text-white rounded-lg font-semibold hover:bg-[#a83232] transition-all duration-200 shadow-md flex items-center gap-2 ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {submitting && (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                        </svg>
                      )}
                      {submitting ? 'Uploading...' : 'Submit'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <FeedbackModal open={feedbackOpen} message={feedbackMessage} onClose={() => setFeedbackOpen(false)} />
      <style jsx>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.8s cubic-bezier(0.39, 0.575, 0.565, 1) both;
        }
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(40px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Layout>
  );
} 