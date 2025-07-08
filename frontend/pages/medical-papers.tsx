import { useState, useEffect } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import { djangoApiClient } from '../utils/api';

interface MedicalDocument {
  id: number;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  file?: File | null;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  backendField: string; // Maps to backend field names
  fileUrl?: string;
  validityPeriod?: number; // Validity period in months
  specificCourses?: string[]; // Courses that require this document
}

export default function MedicalPapers() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [uploading, setUploading] = useState<number | null>(null);
  const [medicalDocumentRecord, setMedicalDocumentRecord] = useState<any>(null);

  // Load document requirements from admin controls
  const loadDocumentRequirements = async () => {
    try {
      const response = await djangoApiClient.get('/admin-controls/document_requirements/');
      const requirements = response.data || [];
      
      // Convert backend requirements to frontend format
      const formattedDocuments = requirements
        .filter((req: any) => req.is_active)
        .map((req: any, index: number) => ({
          id: index + 1,
          name: req.display_name,
          description: req.description,
          required: req.is_required,
          completed: false,
          status: 'pending' as const,
          backendField: req.field_name,
          validityPeriod: req.validity_period_months,
          specificCourses: req.specific_courses || []
        }));

      setDocuments(formattedDocuments);
    } catch (error) {
      console.error('Error loading document requirements:', error);
      // Fall back to hardcoded requirements if API fails
      setDocuments([
        {
          id: 1,
          name: 'Chest X-Ray',
          description: 'Recent chest X-ray results (not older than 6 months)',
          required: true,
          completed: false,
          status: 'pending',
          backendField: 'chest_xray'
        },
        {
          id: 2,
          name: 'Complete Blood Count (CBC)',
          description: 'Complete blood count laboratory results',
          required: true,
          completed: false,
          status: 'pending',
          backendField: 'cbc'
        },
        {
          id: 3,
          name: 'Blood Typing',
          description: 'Blood type and Rh factor test results',
          required: true,
          completed: false,
          status: 'pending',
          backendField: 'blood_typing'
        },
        {
          id: 4,
          name: 'Urinalysis',
          description: 'Complete urinalysis test results',
          required: true,
          completed: false,
          status: 'pending',
          backendField: 'urinalysis'
        },
        {
          id: 5,
          name: 'Drug Test',
          description: 'Drug screening test results',
          required: true,
          completed: false,
          status: 'pending',
          backendField: 'drug_test'
        },
        {
          id: 6,
          name: 'Hepatitis B Test',
          description: 'Hepatitis B surface antigen test results',
          required: false,
          completed: false,
          status: 'pending',
          backendField: 'hepa_b'
        }
      ]);
    }
  };

  // Check backend connectivity
  const checkBackendConnectivity = async () => {
    try {
      const response = await djangoApiClient.get('/medical-documents/my_documents/');
      return response.status === 200;
    } catch (error) {
      console.error('Backend connectivity check failed:', error);
      return false;
    }
  };

  useEffect(() => {
    // Check if user is logged in and is incoming freshman
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Check if user is incoming freshman
      const gradeLevel = parsedUser.grade_level?.toLowerCase() || '';
      const isIncomingFreshman = gradeLevel.includes('grade 12') || 
                               gradeLevel.includes('incoming freshman') ||
                               gradeLevel.includes('freshman') ||
                               gradeLevel === '12';
      
      if (!isIncomingFreshman) {
        router.push('/');
        return;
      }
      
      // Check backend connectivity and load existing documents
      checkBackendConnectivity().then(isConnected => {
        if (!isConnected) {
          console.warn('Backend server may not be running. Some features may not work.');
        }
        loadDocumentRequirements().then(() => {
          loadUserDocuments();
        });
      });
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);
  const loadUserDocuments = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // Use the new endpoint to get user's medical documents
      const response = await djangoApiClient.get('/medical-documents/my_documents/');

      const documentData = response.data;
      setMedicalDocumentRecord(documentData);
      
      if (documentData.id) {
        // Update document statuses based on backend data
        setDocuments(prev => prev.map(doc => {
          const backendFile = documentData[doc.backendField];
          let status: 'pending' | 'uploaded' | 'verified' | 'rejected' = 'pending';
          
          if (backendFile) {
            // Determine status based on document state
            if (documentData.status === 'issued' || documentData.status === 'verified') {
              status = 'verified';
            } else if (documentData.status === 'rejected') {
              status = 'rejected';
            } else {
              status = 'uploaded';
            }
          }
          
          return {
            ...doc,
            completed: !!backendFile,
            status,
            fileUrl: backendFile || undefined
          };
        }));
      }
    } catch (error: any) {
      console.error('Error loading user documents:', error);
      
      // Handle specific errors
      if (error.response?.status === 404) {
        // Check if it's a patient profile issue or documents issue
        if (error.response?.data?.detail?.includes('patient profile')) {
          alert('Please complete your patient profile first before uploading medical documents.');
          router.push('/patient/profile-setup');
        } else {
          // User doesn't have documents yet, this is normal for new users
          console.log('No medical documents found - user hasn\'t uploaded any yet.');
        }
      } else if (error.response?.status === 401) {
        // Authentication error
        alert('Please log in again.');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        router.push('/login');
      } else if (error.response?.status === 500) {
        // Check if it's a school year issue
        if (error.response?.data?.detail?.includes('school year')) {
          alert('System configuration error: No current school year found. Please contact the administrator.');
        } else {
          alert('Server error: There was an issue processing your request. Please try again later.');
        }
      } else {
        // Other errors
        console.warn('Backend server may not be running. Some features may not work.');
      }
    }
  };

  const handleFileUpload = async (documentId: number, file: File) => {
    setUploading(documentId);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const document = documents.find(doc => doc.id === documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append(document.backendField, file);

      // Use the new update endpoint
      const response = await djangoApiClient.post('/medical-documents/update_my_documents/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const updatedRecord = response.data;
      setMedicalDocumentRecord(updatedRecord);
      
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, completed: true, status: 'uploaded', file, fileUrl: updatedRecord[doc.backendField] }
          : doc
      ));
      
      console.log(`Successfully uploaded ${document.name}`);    } catch (error: any) {
      console.error('Upload failed:', error);
      
      // Enhanced error handling
      let userMessage = 'Upload failed';
      if (error.response?.status === 404) {
        userMessage = 'Please complete your patient profile first before uploading medical documents.';
        setTimeout(() => router.push('/patient/profile-setup'), 2000);
      } else if (error.response?.status === 401) {
        userMessage = 'Please log in again.';
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setTimeout(() => router.push('/login'), 2000);
      } else if (error.response?.status === 500) {
        userMessage = 'Server error: There was an issue processing your request. Please try again later.';
      } else if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
        userMessage = 'Network error: Please check if the backend server is running and try again.';
      } else if (error.response?.data?.detail) {
        userMessage = error.response.data.detail;
      } else if (error.message) {
        userMessage = error.message;
      }
      
      alert(userMessage);
    } finally {
      setUploading(null);
    }
  };

  const handleFileChange = (documentId: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (accept common image and PDF formats)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload only JPEG, PNG, or PDF files.');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
      }
      
      handleFileUpload(documentId, file);
    }
  };

  const handleDeleteFile = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Unable to delete file. Please try again.');
        return;
      }

      const document = documents.find(doc => doc.id === documentId);
      if (!document || !medicalDocumentRecord?.id) {
        alert('Document not found.');
        return;
      }

      const response = await djangoApiClient.delete(`/medical-documents/${medicalDocumentRecord.id}/delete_file/`, {
        data: {
          file_field: document.backendField
        }
      });

      // Update the local state
      setDocuments(prev => prev.map(doc => 
        doc.id === documentId 
          ? { ...doc, completed: false, status: 'pending', fileUrl: undefined }
          : doc
      ));
      
      // Reload documents to get updated status
      loadUserDocuments();
      
      alert('File deleted successfully.');
    } catch (error) {
      console.error('Delete failed:', error);
      alert(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'uploaded':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0l1 16a1 1 0 001 1h8a1 1 0 001-1L17 4" />
          </svg>
        );
      case 'verified':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'rejected':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Upload';
      case 'uploaded':
        return 'Under Review';
      case 'verified':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-gray-600';
      case 'uploaded':
        return 'text-yellow-600';
      case 'verified':
        return 'text-green-600';
      case 'rejected':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCompletionPercentage = () => {
    const completedRequired = documents.filter(doc => doc.required && doc.completed).length;
    const totalRequired = documents.filter(doc => doc.required).length;
    return totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0;
  };

  const handleSubmitAllDocuments = async () => {
    if (getCompletionPercentage() < 100) {
      alert('Please upload all required documents before submitting.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Unable to submit documents. Please try again.');
        return;
      }

      // Use the new submit_for_review endpoint
      const response = await djangoApiClient.post('/medical-documents/submit_for_review/');

      alert('Documents submitted successfully for review! You will be notified once they are reviewed.');
      // Reload the documents to reflect the new status
      loadUserDocuments();
    } catch (error) {
      console.error('Submit failed:', error);
      alert(`Failed to submit documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (isLoading) {
    return (
      <Layout onLoginClick={() => {}} onSignupClick={() => {}}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8B1538]"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout onLoginClick={() => {}} onSignupClick={() => {}}>
      <Head>
        <title>Medical Papers - WMSU Health Services</title>
        <meta name="description" content="Upload required medical documents for incoming freshmen" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Medical Papers</h1>
                <p className="text-gray-600 mt-2">
                  Upload your required medical documents for enrollment
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Completion Progress</div>
                <div className="text-2xl font-bold text-[#8B1538]">
                  {getCompletionPercentage()}%
                </div>
                <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-[#8B1538] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getCompletionPercentage()}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Important Information
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>All medical documents must be recent (not older than 6 months)</li>
                    <li>Files must be in JPEG, PNG, or PDF format</li>
                    <li>Maximum file size is 10MB per document</li>
                    <li>Documents marked with * are required for enrollment</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((document) => (
              <div key={document.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {document.name}
                        {document.required && <span className="text-red-500 ml-1">*</span>}
                      </h3>
                    </div>
                    <div className="flex items-center">
                      {getStatusIcon(document.status)}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-4">
                    {document.description}
                  </p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-sm font-medium ${getStatusColor(document.status)}`}>
                      {getStatusText(document.status)}
                    </span>
                  </div>
                  
                  {document.status === 'pending' ? (
                    <div className="relative">
                      <input
                        type="file"
                        id={`file-${document.id}`}
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileChange(document.id, e)}
                        disabled={uploading === document.id}
                      />
                      <label
                        htmlFor={`file-${document.id}`}
                        className={`
                          w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
                          ${uploading === document.id 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-[#8B1538] hover:bg-[#A31545] cursor-pointer'
                          }
                          transition-colors duration-200
                        `}
                      >
                        {uploading === document.id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Uploading...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Upload File
                          </>
                        )}
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {document.fileUrl && (
                        <div className="flex flex-col space-y-2">
                          <div className="text-sm text-gray-600">
                            File uploaded successfully
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => window.open(document.fileUrl, '_blank')}
                              className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-[#8B1538] rounded-md shadow-sm text-sm font-medium text-[#8B1538] bg-white hover:bg-[#f8f4f4] transition-colors duration-200"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                            {document.status !== 'verified' && (
                              <>
                                <div className="flex-1">
                                  <input
                                    type="file"
                                    id={`replace-file-${document.id}`}
                                    className="hidden"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    onChange={(e) => handleFileChange(document.id, e)}
                                    disabled={uploading === document.id}
                                  />
                                  <label
                                    htmlFor={`replace-file-${document.id}`}
                                    className="w-full inline-flex justify-center items-center px-3 py-2 border border-orange-500 rounded-md shadow-sm text-sm font-medium text-orange-600 bg-white hover:bg-orange-50 transition-colors duration-200 cursor-pointer"
                                  >
                                    Replace
                                  </label>
                                </div>
                                <button
                                  onClick={() => handleDeleteFile(document.id)}
                                  className="px-3 py-2 border border-red-500 rounded-md shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50 transition-colors duration-200"
                                  title="Delete file"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      {document.file && !document.fileUrl && (
                        <div className="text-sm text-gray-600">
                          File: {document.file.name}
                        </div>
                      )}
                      {document.status === 'rejected' && medicalDocumentRecord?.rejection_reason && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                          <div className="text-sm text-red-800">
                            <strong>Rejection Reason:</strong> {medicalDocumentRecord.rejection_reason}
                          </div>
                        </div>
                      )}
                      {document.status === 'rejected' && (
                        <button
                          onClick={() => {
                            // Clear the rejection status locally to allow re-upload
                            setDocuments(prev => prev.map(doc => 
                              doc.id === document.id 
                                ? { ...doc, status: 'pending', completed: false, file: null, fileUrl: undefined }
                                : doc
                            ));
                          }}
                          className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 transition-colors duration-200"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Re-upload
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Section */}
          <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
            <div className="text-center">
              {medicalDocumentRecord?.submitted_for_review ? (
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Documents Under Review
                  </h3>
                  <p className="text-gray-600">
                    Your documents have been submitted and are currently being reviewed by our staff. 
                    You will be notified once the review is complete.
                  </p>
                  <div className="text-sm text-gray-500">
                    Status: <span className={`font-medium ${getStatusColor(medicalDocumentRecord.status)}`}>
                      {getStatusText(medicalDocumentRecord.status)}
                    </span>
                  </div>
                </div>
              ) : medicalDocumentRecord?.status === 'verified' ? (
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-green-800">
                    Documents Verified
                  </h3>
                  <p className="text-gray-600">
                    Congratulations! Your medical documents have been verified. Your medical certificate will be processed shortly.
                  </p>
                </div>
              ) : medicalDocumentRecord?.status === 'issued' ? (
                <div className="space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-blue-800">
                    Medical Certificate Issued
                  </h3>
                  <p className="text-gray-600">
                    Your medical certificate has been issued. Please contact the health services office to collect it.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Ready to Submit?
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Make sure all required documents are uploaded before submitting for review.
                  </p>
                  <button
                    onClick={handleSubmitAllDocuments}
                    disabled={getCompletionPercentage() < 100}
                    className={`
                      px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300
                      ${getCompletionPercentage() >= 100
                        ? 'bg-[#8B1538] hover:bg-[#A31545] text-white shadow-lg hover:shadow-xl transform hover:-translate-y-1'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }
                    `}
                  >
                    Submit All Documents
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
