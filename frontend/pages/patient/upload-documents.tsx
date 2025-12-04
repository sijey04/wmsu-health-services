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

  // Add state for current viewing document index
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle touch events for mobile swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentViewIndex < filteredDocumentFields.length - 1) {
      setCurrentViewIndex(currentViewIndex + 1);
    }
    if (isRightSwipe && currentViewIndex > 0) {
      setCurrentViewIndex(currentViewIndex - 1);
    }
  };

  // Navigation functions
  const goToNext = () => {
    if (currentViewIndex < filteredDocumentFields.length - 1) {
      setCurrentViewIndex(currentViewIndex + 1);
    }
  };

  const goToPrevious = () => {
    if (currentViewIndex > 0) {
      setCurrentViewIndex(currentViewIndex - 1);
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
        const courseMatches = field.specificCourses.includes(userProfile.course);
        // Make hepatitis test required if user's course is in the specific courses list
        if (field.name === 'hepaB' && courseMatches) {
          field.required = true;
        }
        return courseMatches || field.required;
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
      <div className="fixed inset-0 bg-black">
        {success ? (
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-center text-white max-w-md mx-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500 mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">Documents Submitted!</h3>
              <p className="text-gray-300 mb-6">
                Your medical documents have been uploaded successfully. We will process your request soon.
              </p>
              <button
                onClick={() => window.location.href = '/patient/appointments'}
                className="bg-[#800000] hover:bg-[#a83232] text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                View Appointments
              </button>
            </div>
          </div>
        ) : filteredDocumentFields.length === 0 ? (
          <div className="flex items-center justify-center h-full bg-gray-900">
            <div className="text-center text-white max-w-md mx-4">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-600 mb-6">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-4">No Document Requirements</h3>
              <p className="text-gray-300">
                No document upload requirements available. Please check your profile setup.
              </p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col md:flex-row">
            {/* Top/Left Side - Document Viewer (Social Media Style) */}
            <div className="flex-1 bg-black relative overflow-hidden min-h-[50vh] md:min-h-full">
              {/* Document Display */}
              <div className="h-full flex items-center justify-center p-4 md:p-8">
                {filteredDocumentFields.length > 0 && (
                  <div className="max-w-xl md:max-w-2xl w-full">
                    {(() => {
                      const field = filteredDocumentFields[currentViewIndex];
                      const file = files[field.name];
                      const isImage = file && file.type.startsWith('image/');
                      const imageUrl = file && isImage ? URL.createObjectURL(file) : null;

                      return (
                        <div className="text-center">
                          {file ? (
                            <div className="space-y-6">
                              {/* Image Preview */}
                              {isImage && imageUrl ? (
                                <div className="relative">
                                  <img 
                                    src={imageUrl} 
                                    alt={field.label}
                                    className="w-full max-h-[40vh] md:max-h-[70vh] object-contain rounded-xl shadow-2xl mx-auto"
                                  />
                                  <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white text-sm px-3 py-2 rounded-full">
                                    {field.label}
                                  </div>
                                </div>
                              ) : (
                                /* File Preview */
                                <div className="bg-white rounded-xl shadow-2xl p-12 text-center max-w-md mx-auto">
                                  <svg className="w-20 h-20 text-gray-400 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{field.label}</h3>
                                  <p className="text-sm text-gray-600 mb-4 truncate">{file.name}</p>
                                  <p className="text-xs text-gray-500">
                                    {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type.includes('pdf') ? 'PDF Document' : 'Document'}
                                  </p>
                                </div>
                              )}
                              
                              {/* File Info */}
                              <div className="bg-gray-800 bg-opacity-80 rounded-xl p-4 md:p-6 text-white max-w-sm md:max-w-md mx-auto">
                                <div className="flex items-center justify-between">
                                  <div className="text-left">
                                    <h4 className="font-semibold text-base md:text-lg">{field.label}</h4>
                                    <p className="text-xs md:text-sm text-gray-300 mt-1">{field.description}</p>
                                    <p className="text-xs text-green-400 mt-2">
                                      ✓ Uploaded: {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                                    </p>
                                  </div>
                                  <div className="ml-4">
                                    <span className="text-xs bg-green-500 px-2 md:px-3 py-1 rounded-full">Ready</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* Empty State */
                            <div className="text-white">
                              <div className="bg-gray-800 bg-opacity-60 rounded-xl p-8 md:p-12 max-w-sm md:max-w-md mx-auto">
                                <span className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-[#800000] rounded-full text-white font-bold text-lg md:text-2xl mb-4 md:mb-6">
                                  {currentViewIndex + 1}
                                </span>
                                <h3 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4">{field.label}</h3>
                                <p className="text-gray-300 text-sm mb-4">{field.description}</p>
                                {field.required && (
                                  <span className="inline-block bg-red-500 text-white text-sm px-3 py-1 rounded-full mb-4 md:mb-6">
                                    Required Document
                                  </span>
                                )}
                                <div className="text-center">
                                  <svg className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                  </svg>
                                  <p className="text-base md:text-lg font-medium text-gray-300">No file uploaded yet</p>
                                  <p className="text-sm text-gray-400 mt-2">Use the upload panel <span className="md:inline hidden">on the right →</span><span className="md:hidden inline">below ↓</span></p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Navigation Arrows */}
              {filteredDocumentFields.length > 1 && !isMobile && (
                <>
                  {currentViewIndex > 0 && (
                    <button
                      onClick={goToPrevious}
                      className="absolute left-4 md:left-6 top-1/2 transform -translate-y-1/2 p-2 md:p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all duration-200 z-10"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  {currentViewIndex < filteredDocumentFields.length - 1 && (
                    <button
                      onClick={goToNext}
                      className="absolute right-4 md:right-6 top-1/2 transform -translate-y-1/2 p-2 md:p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all duration-200 z-10"
                    >
                      <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </>
              )}

              {/* Touch area for mobile swiping */}
              {isMobile && (
                <div 
                  className="absolute inset-0 z-10"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                />
              )}

              {/* Progress Dots */}
              <div className="absolute bottom-4 md:bottom-8 left-0 right-0 flex justify-center space-x-2 md:space-x-3">
                {filteredDocumentFields.map((field, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentViewIndex(index)}
                    className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-200 ${
                      index === currentViewIndex 
                        ? 'bg-white shadow-lg' 
                        : files[field.name]
                          ? 'bg-green-500'
                          : 'bg-white bg-opacity-30 hover:bg-opacity-50'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Bottom/Right Side - Upload Panel */}
            <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l border-gray-200 flex flex-col max-h-[50vh] md:max-h-full">
              {/* Header */}
              <div className="p-4 md:p-6 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-3 md:mb-4">
                  <button
                    onClick={() => window.history.back()}
                    className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="text-center">
                    <span className="text-sm text-gray-500">
                      {currentViewIndex + 1} of {filteredDocumentFields.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setCurrentViewIndex(0)}
                    className="text-xs bg-gray-200 hover:bg-gray-300 px-2 md:px-3 py-1 rounded-full transition-colors text-gray-700"
                  >
                    Reset
                  </button>
                </div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">Upload Documents</h2>
                <p className="text-xs md:text-sm text-gray-600">Select and upload your medical documents</p>
              </div>

              {/* Error Display */}
              {error && (
                <div className="mx-4 md:mx-6 mt-3 md:mt-4 bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 md:w-5 md:h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-red-800 font-medium text-xs md:text-sm">{error}</span>
                  </div>
                </div>
              )}

              {/* Upload Fields */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="space-y-3 md:space-y-4">
                  {filteredDocumentFields.map((field, index) => (
                    <div 
                      key={field.name} 
                      className={`bg-gray-50 rounded-lg p-3 md:p-4 border-2 transition-all duration-200 ${
                        index === currentViewIndex 
                          ? 'border-[#800000] bg-[#800000] bg-opacity-5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="mb-2 md:mb-3">
                        <h3 className="text-xs md:text-sm font-medium text-gray-900 flex items-center">
                          <span className={`text-xs font-bold rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center mr-2 md:mr-3 ${
                            index === currentViewIndex 
                              ? 'bg-[#800000] text-white' 
                              : files[field.name] 
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-400 text-white'
                          }`}>
                            {files[field.name] ? '✓' : index + 1}
                          </span>
                          <span className="truncate">{field.label}</span>
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </h3>
                        <p className="text-xs text-gray-600 ml-7 md:ml-9 line-clamp-2">{field.description}</p>
                      </div>

                      {/* Upload Area */}
                      <div className={`relative border-2 border-dashed rounded-lg transition-all duration-200 ml-7 md:ml-9 ${
                        missingFields.includes(field.name) 
                          ? 'border-red-300 bg-red-50' 
                          : files[field.name]
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-300 bg-white hover:border-[#800000] hover:bg-gray-50'
                      }`}>
                        <input
                          type="file"
                          accept=".pdf,.docx,.jpg,.jpeg,.png"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => {
                            handleFileChange(e, field.name);
                            // Auto-advance to next field after upload
                            if (e.target.files && e.target.files[0] && currentViewIndex < filteredDocumentFields.length - 1) {
                              setTimeout(() => setCurrentViewIndex(currentViewIndex + 1), 500);
                            }
                          }}
                        />
                        <div className="px-3 py-4 md:px-4 md:py-6 text-center">
                          {files[field.name] ? (
                            <div className="space-y-1 md:space-y-2">
                              <svg className="w-5 h-5 md:w-6 md:h-6 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <p className="text-xs font-medium text-gray-900 truncate px-2">{files[field.name].name}</p>
                              <p className="text-xs text-green-600">✓ Ready • Tap to replace</p>
                            </div>
                          ) : (
                            <div className="space-y-1 md:space-y-2">
                              <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <p className="text-xs text-gray-600">
                                <span className="font-medium text-[#800000]">Tap to upload</span>
                              </p>
                              <p className="text-xs text-gray-400">PDF, DOCX, JPG, PNG</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Controls */}
              <div className="p-4 md:p-6 border-t border-gray-200 bg-gray-50">
                <div className="mb-3 md:mb-4">
                  <div className="flex items-center justify-between text-xs md:text-sm text-gray-600 mb-2">
                    <span>Progress</span>
                    <span>{Object.keys(files).length} of {requiredDocumentFields.length} required</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-[#800000] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(Object.keys(files).length / Math.max(requiredDocumentFields.length, 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <form onSubmit={handleSubmit}>
                  <button
                    type="submit"
                    disabled={submitting || Object.keys(files).length < requiredDocumentFields.length}
                    className={`w-full px-4 md:px-6 py-2 md:py-3 bg-[#800000] text-white rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 text-sm md:text-base ${
                      submitting || Object.keys(files).length < requiredDocumentFields.length
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-[#a83232] shadow-lg'
                    }`}
                  >
                    {submitting && (
                      <svg className="animate-spin h-4 w-4 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                    )}
                    {submitting ? 'Uploading Documents...' : 'Submit All Documents'}
                  </button>
                </form>

                {/* Mobile Hint */}
                {isMobile && (
                  <p className="text-xs text-gray-500 text-center mt-2 md:mt-3">
                    Swipe the preview area to navigate between documents
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <FeedbackModal open={feedbackOpen} message={feedbackMessage} onClose={() => setFeedbackOpen(false)} />
    </Layout>
  );
} 