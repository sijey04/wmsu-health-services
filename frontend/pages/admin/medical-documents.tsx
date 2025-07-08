import AdminLayout from '../../components/AdminLayout';
import withAdminAccess from '../../components/withAdminAccess';
import FeedbackModal from '../../components/feedbackmodal';
import { useState, useEffect } from 'react';
import { medicalDocumentsAPI, academicSchoolYearsAPI } from '../../utils/api';

function AdminMedicalDocuments() {
  const [activeTab, setActiveTab] = useState('medicalCertificateRequests');
  const [pendingDocs, setPendingDocs] = useState([]);
  const [issuedDocs, setIssuedDocs] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [advisedDocs, setAdvisedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  
  // Consultation advice modal state
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [consultationReason, setConsultationReason] = useState('');
  
  // Feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  
  // New states for full-screen image view
  const [showImageFullscreen, setShowImageFullscreen] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<{url: string, label: string} | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [availableImages, setAvailableImages] = useState<Array<{key: string, label: string, url: string}>>([]);
  
  // Zoom state for fullscreen images
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Consultation-specific filter states
  const [consultationSearchTerm, setConsultationSearchTerm] = useState('');
  const [consultationSortBy, setConsultationSortBy] = useState('date');
  
  // Academic year filtering state
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [loadingAcademicYears, setLoadingAcademicYears] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  // Document browsing state
  const [currentDocIndex, setCurrentDocIndex] = useState(0);

  // Fetch academic years
  const fetchAcademicYears = async () => {
    if (loadingAcademicYears) return;
    
    setLoadingAcademicYears(true);
    try {
      const response = await academicSchoolYearsAPI.getAll();
      setAcademicYears(response.data);
      
      // Try to get current academic year
      try {
        const currentResponse = await academicSchoolYearsAPI.getCurrent();
        if (currentResponse.data) {
          setSelectedAcademicYear(currentResponse.data.id.toString());
        }
      } catch (error) {
        // No current academic year set, use first available
        if (response.data.length > 0) {
          setSelectedAcademicYear(response.data[0].id.toString());
        }
      }
      
      fetchDocs();
      setInitialLoaded(true);
    } catch (error: any) {
      console.error('Failed to fetch academic years:', error);
      console.error('Academic years error response:', error.response?.data);
      
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in as an admin or staff member.');
      } else if (error.response?.status === 403) {
        setError('Permission denied. You need admin or staff privileges to access this page.');
      } else {
        // If academic years fail to load, still try to fetch all docs
        fetchDocs();
        setInitialLoaded(true);
      }
    } finally {
      setLoadingAcademicYears(false);
    }
  };

  // Handle academic year change
  const handleAcademicYearChange = (academicYearId: string) => {
    setSelectedAcademicYear(academicYearId);
    fetchDocs(academicYearId);
  };

  // Sort documents by date (most recent first)
  const sortDocumentsByDate = (documents: any[]) => {
    return documents.sort((a, b) => {
      // Try different date fields in order of preference
      const getDateValue = (doc: any) => {
        if (doc.advised_for_consultation_at) return new Date(doc.advised_for_consultation_at);
        if (doc.reviewed_at) return new Date(doc.reviewed_at);
        if (doc.certificate_issued_at) return new Date(doc.certificate_issued_at);
        if (doc.updated_at) return new Date(doc.updated_at);
        if (doc.uploaded_at) return new Date(doc.uploaded_at);
        if (doc.created_at) return new Date(doc.created_at);
        return new Date(0); // fallback to epoch if no date found
      };
      
      const dateA = getDateValue(a);
      const dateB = getDateValue(b);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
  };

  // Fetch documents
  const fetchDocs = async (academicYear = selectedAcademicYear) => {
    if (loading) return; // Prevent multiple concurrent requests
    
    setLoading(true);
    setError('');
    try {
      const params: any = {};
      if (academicYear) {
        params.academic_year = academicYear;
      }
      
      const response = await medicalDocumentsAPI.getAll(params);
      const documents = response.data;
      
      // Categorize documents by status and sort by date
      const pending = sortDocumentsByDate(documents.filter((doc: any) => doc.status === 'pending'));
      const forConsultation = sortDocumentsByDate(documents.filter((doc: any) => doc.status === 'for_consultation'));
      const verified = sortDocumentsByDate(documents.filter((doc: any) => doc.status === 'verified'));
      const rejected = sortDocumentsByDate(documents.filter((doc: any) => doc.status === 'rejected'));
      const issued = sortDocumentsByDate(documents.filter((doc: any) => doc.status === 'issued'));
      
      setPendingDocs(pending);
      setAdvisedDocs(forConsultation); // Use the documents with 'for_consultation' status
      setIssuedDocs(sortDocumentsByDate([...verified, ...issued]));
      setUploadedDocs(sortDocumentsByDate(documents));
      
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      
      if (err.response?.status === 401) {
        setError('Authentication required. Please log in as an admin or staff member.');
      } else if (err.response?.status === 403) {
        setError('Permission denied. You need admin or staff privileges to view medical documents.');
      } else if (err.response?.status === 500) {
        setError('Server error: ' + (err.response?.data?.detail || err.response?.data?.error || err.message));
      } else {
        setError('Failed to fetch documents: ' + (err.response?.data?.error || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    if (!initialLoaded) {
      fetchAcademicYears();
    }
  }, [initialLoaded]);

  // Fetch documents when selected academic year changes
  useEffect(() => {
    if (initialLoaded && selectedAcademicYear !== '') {
      fetchDocs(selectedAcademicYear);
    }
  }, [selectedAcademicYear, initialLoaded]);

  // Verify documents action
  const handleVerify = async (id: number) => {
    try {
      await medicalDocumentsAPI.verify(id);
      showFeedback('Documents verified successfully!');
      fetchDocs(); // Refresh the data
    } catch (err: any) {
      console.error('Failed to verify documents:', err);
      showFeedback('Failed to verify documents: ' + (err.response?.data?.error || err.message));
    }
  };

  // Reject documents action
  const handleReject = async (id: number, reason: string) => {
    if (!reason.trim()) {
      showFeedback('Please provide a rejection reason.');
      return;
    }
    
    try {
      await medicalDocumentsAPI.reject(id, reason);
      showFeedback('Documents rejected successfully!');
      fetchDocs(); // Refresh the data
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (err: any) {
      console.error('Failed to reject documents:', err);
      showFeedback('Failed to reject documents: ' + (err.response?.data?.error || err.message));
    }
  };
  // Issue Certificate action - Simplified to directly issue certificate
  const handleIssueCertificate = async (id: number) => {
    try {
      // Issue certificate directly
      await medicalDocumentsAPI.issueCertificate(id);
      
      showFeedback('Certificate issued successfully! The patient can now view it in their appointments.');
      fetchDocs(); // Refresh the data
    } catch (err: any) {
      console.error('Failed to issue certificate:', err);
      showFeedback('Failed to issue certificate: ' + (err.response?.data?.error || err.message));
    }
  };

  // Advise for consultation action
  const handleAdviseForConsultation = (document: any) => {
    setSelectedDocument(document);
    setShowConsultationModal(true);
  };

  // Confirm consultation advice
  const handleConfirmConsultationAdvice = async () => {
    if (!consultationReason.trim()) {
      return; // Button should be disabled anyway
    }

    try {
      // Call the new API endpoint to advise for consultation
      await medicalDocumentsAPI.adviseForConsultation(selectedDocument.id, consultationReason.trim());
      
      // Close modals and reset state
      setShowConsultationModal(false);
      setViewModalOpen(false);
      setConsultationReason('');
      
      // Refresh the data to see updated statuses
      fetchDocs();
      
      // Switch to the advised consultations tab to show the newly advised document
      setActiveTab('advisedForConsultations');
      
      // Show success message
      showFeedback('Patient has been advised for consultation successfully!');
      
    } catch (err: any) {
      console.error('Failed to advise for consultation:', err);
      showFeedback('Failed to advise for consultation: ' + (err.response?.data?.error || err.message));
    }
  };

  // Close consultation modal
  const handleCloseConsultationModal = () => {
    setShowConsultationModal(false);
    setConsultationReason('');
  };

  // Helper function to show feedback messages
  const showFeedback = (message: string) => {
    setFeedbackMessage(message);
    setShowFeedbackModal(true);
  };

  // Handle actions for advised consultations
  const handleResendAdvice = (consultationId: number) => {
    showFeedback('Advice has been resent to the patient!');
    // TODO: In a real implementation, you would make an API call here
    // await medicalDocumentsAPI.resendConsultationAdvice(consultationId);
  };

  const handleCancelAdvice = async (consultationId: number) => {
    try {
      // Use the new API method to cancel consultation advice
      await medicalDocumentsAPI.cancelConsultationAdvice(consultationId);
      
      // Refresh data to show updated status
      fetchDocs();
      
      showFeedback('Consultation advice has been cancelled and document restored to pending.');
    } catch (err: any) {
      console.error('Failed to cancel consultation advice:', err);
      showFeedback('Failed to cancel consultation advice: ' + (err.response?.data?.error || err.message));
    }
  };

  // Clear all advised consultations
  const handleClearAllAdvice = async () => {
    // Create a simple confirmation by checking if there are actually items to clear
    if (advisedDocs.length === 0) {
      showFeedback('No consultation advice to clear.');
      return;
    }
    
    try {
      // Reset all documents with 'for_consultation' status back to 'pending'
      const updatePromises = advisedDocs.map(doc => 
        medicalDocumentsAPI.cancelConsultationAdvice(doc.id)
      );
      
      await Promise.all(updatePromises);
      
      // Refresh data to show updated statuses
      fetchDocs();
      
      showFeedback('All consultation advice has been cleared and documents restored to pending.');
    } catch (err: any) {
      console.error('Failed to clear consultation advice:', err);
      showFeedback('Failed to clear consultation advice: ' + (err.response?.data?.error || err.message));
    }
  };

  // Helper to get file icon
  const getFileIcon = (url: string) => {
    if (url.match(/\.(jpg|jpeg|png|gif)$/i)) return (
      <svg className="w-6 h-6 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2" strokeWidth="2" stroke="currentColor" fill="none"/><path d="M8 14l2-2a2 2 0 0 1 2.83 0l2.17 2.17M8 14l-2 2m0 0h12" strokeWidth="2" stroke="currentColor" fill="none"/></svg>
    );
    if (url.match(/\.(pdf)$/i)) return (
      <svg className="w-6 h-6 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2" strokeWidth="2" stroke="currentColor" fill="none"/><path d="M8 8h8M8 12h8M8 16h4" strokeWidth="2" stroke="currentColor" fill="none"/></svg>
    );
    return (
      <svg className="w-6 h-6 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2" strokeWidth="2" stroke="currentColor" fill="none"/><path d="M8 8h8M8 12h8M8 16h4" strokeWidth="2" stroke="currentColor" fill="none"/></svg>
    );
  };

  // Helper to render file links
  const renderFileLinks = (doc: any) => {
    const files = [
      { key: 'chest_xray', label: 'Chest X-Ray (6 months)' },
      { key: 'cbc', label: 'CBC' },
      { key: 'blood_typing', label: 'Blood Typing' },
      { key: 'urinalysis', label: 'Urinalysis' },
      { key: 'drug_test', label: 'Drug Test (1 year)' },
      { key: 'hepa_b', label: 'Hepa B' },
    ];
    
    return files.filter(f => doc[f.key]).map((f, idx) => (
      <div key={f.key} className="flex items-center mb-2">
        {getFileIcon(doc[f.key])}
        <a 
          href={doc[f.key]} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:underline text-sm"
        >
          {f.label}
        </a>
      </div>
    ));
  };

  // Helper to get completion percentage
  const getCompletionPercentage = (doc: any) => {
    if (doc.completion_percentage !== undefined) {
      return doc.completion_percentage;
    }
    
    // Calculate completion percentage if not provided
    const requiredFiles = ['chest_xray', 'cbc', 'blood_typing', 'urinalysis', 'drug_test', 'hepa_b'];
    const completedFiles = requiredFiles.filter(field => doc[field]).length;
    return Math.round((completedFiles / requiredFiles.length) * 100);
  };

  // Helper to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'issued': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Helper to get available images from document
  const getAvailableImages = (doc: any) => {
    const files = [
      { key: 'chest_xray', label: 'Chest X-Ray (6 months)' },
      { key: 'cbc', label: 'CBC' },
      { key: 'blood_typing', label: 'Blood Typing' },
      { key: 'urinalysis', label: 'Urinalysis' },
      { key: 'drug_test', label: 'Drug Test (1 year)' },
      { key: 'hepa_b', label: 'Hepa B' },
    ];
    
    return files
      .filter(f => doc[f.key] && doc[f.key].match(/\.(jpg|jpeg|png|gif)$/i))
      .map(f => ({
        key: f.key,
        label: f.label,
        url: doc[f.key]
      }));
  };

  // Open image slideshow
  const openImageSlideshow = (doc: any, startIndex: number = 0) => {
    const images = getAvailableImages(doc);
    setAvailableImages(images);
    setSelectedImageIndex(startIndex);
    if (images[startIndex]) {
      setFullscreenImage({ url: images[startIndex].url, label: images[startIndex].label });
    }
    // Reset zoom state
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
    setShowImageFullscreen(true);
  };

  // Navigate to next image
  const goToNextImage = () => {
    if (availableImages.length === 0) return;
    const nextIndex = (selectedImageIndex + 1) % availableImages.length;
    setSelectedImageIndex(nextIndex);
    setFullscreenImage({ 
      url: availableImages[nextIndex].url, 
      label: availableImages[nextIndex].label 
    });
  };

  // Navigate to previous image
  const goToPreviousImage = () => {
    if (availableImages.length === 0) return;
    const prevIndex = selectedImageIndex === 0 ? availableImages.length - 1 : selectedImageIndex - 1;
    setSelectedImageIndex(prevIndex);
    setFullscreenImage({ 
      url: availableImages[prevIndex].url, 
      label: availableImages[prevIndex].label 
    });
  };

  // Navigate to specific image
  const goToImage = (index: number) => {
    if (index >= 0 && index < availableImages.length) {
      setSelectedImageIndex(index);
      setFullscreenImage({ 
        url: availableImages[index].url, 
        label: availableImages[index].label 
      });
      // Reset zoom when changing images
      setImageZoom(1);
      setImagePosition({ x: 0, y: 0 });
    }
  };

  // Zoom functions
  const zoomIn = () => {
    setImageZoom(prev => Math.min(prev + 0.5, 3));
  };

  const zoomOut = () => {
    setImageZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const resetZoom = () => {
    setImageZoom(1);
    setImagePosition({ x: 0, y: 0 });
  };

  // Keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (!showImageFullscreen) return;
    
    switch (e.key) {
      case 'ArrowLeft':
        goToPreviousImage();
        break;
      case 'ArrowRight':
        goToNextImage();
        break;
      case 'Escape':
        setShowImageFullscreen(false);
        break;
      case '+':
      case '=':
        zoomIn();
        break;
      case '-':
        zoomOut();
        break;
      case '0':
        resetZoom();
        break;
    }
  };

  // Add keyboard event listener
  useEffect(() => {
    const handleKeyDownWrapper = (e: KeyboardEvent) => handleKeyDown(e);
    
    if (showImageFullscreen) {
      document.addEventListener('keydown', handleKeyDownWrapper);
      return () => document.removeEventListener('keydown', handleKeyDownWrapper);
    }
  }, [showImageFullscreen, selectedImageIndex, availableImages]);

  // Filter function for consultation documents
  const filterConsultationDocuments = (docs: any[]) => {
    let filtered = docs.filter(doc => {
      const matchesSearch = !consultationSearchTerm || 
        doc.patient_name?.toLowerCase().includes(consultationSearchTerm.toLowerCase()) ||
        doc.patient_display?.toLowerCase().includes(consultationSearchTerm.toLowerCase()) ||
        doc.student_id?.toLowerCase().includes(consultationSearchTerm.toLowerCase());
      
      return matchesSearch;
    });
    
    // Apply sorting
    if (consultationSortBy === 'name') {
      filtered = filtered.sort((a, b) => {
        const nameA = (a.patient_display || a.patient_name || '').toLowerCase();
        const nameB = (b.patient_display || b.patient_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (consultationSortBy === 'date') {
      // Already sorted by date in fetchDocs, but ensure it's correct
      filtered = sortDocumentsByDate(filtered);
    }
    
    return filtered;
  };

  // Use state variable for advised consultations instead of hardcoded array
  const advisedForConsultations = filterConsultationDocuments(advisedDocs);
  const filterDocuments = (docs: any[]) => {
    return docs.filter(doc => {
      const matchesSearch = !searchTerm || 
        doc.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.patient_display?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
      
      const matchesDate = dateFilter === 'all' || (() => {
        const docDate = new Date(doc.uploaded_at || doc.created_at);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'today':
            return daysDiff === 0;
          case 'week':
            return daysDiff <= 7;
          case 'month':
            return daysDiff <= 30;
          default:
            return true;
        }
      })();
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Medical Documents</h1>
          <p className="text-gray-600">Manage medical document submissions, verifications, and certificate issuance</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden min-h-[500px]">
          <div className="flex justify-between border-b border-gray-200">
            <div className="flex">
              <button
                className={`py-3 px-6 text-lg font-medium transition-all duration-200 ${activeTab === 'medicalCertificateRequests' ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('medicalCertificateRequests')}
              >
                Medical Certificate Requests
                {pendingDocs.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-blue-600 rounded-full">
                    {pendingDocs.length}
                  </span>
                )}
              </button>
              <button
                className={`py-3 px-6 text-lg font-medium transition-all duration-200 focus:outline-none ${activeTab === 'uploadedDocuments' ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('uploadedDocuments')}
              >
                Uploaded Documents
                {uploadedDocs.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-gray-600 rounded-full">
                    {uploadedDocs.length}
                  </span>
                )}
              </button>
              <button
                className={`py-3 px-6 text-lg font-medium transition-all duration-200 focus:outline-none ${activeTab === 'issuedMedicalCertificates' ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('issuedMedicalCertificates')}
              >
                Issued Medical Certificates
                {issuedDocs.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-green-600 rounded-full">
                    {issuedDocs.length}
                  </span>
                )}
              </button>
              <button
                className={`py-3 px-6 text-lg font-medium transition-all duration-200 focus:outline-none ${activeTab === 'advisedForConsultations' ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                onClick={() => setActiveTab('advisedForConsultations')}
              >
                Advised for Consultations
                {advisedDocs.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {advisedDocs.length}
                  </span>
                )}
              </button>
            </div>
            
            {/* Academic Year Selector */}
            <div className="py-3 px-6">
              <select
                value={selectedAcademicYear}
                onChange={(e) => handleAcademicYearChange(e.target.value)}
                className="w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                disabled={loadingAcademicYears}
              >
                <option value="">All Academic Years</option>
                {academicYears.map((year: any) => (
                  <option key={year.id} value={year.id}>
                    {year.academic_year} {year.is_current && '(Current)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-6">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800000]"></div>
                <span className="ml-2 text-gray-600">Loading documents...</span>
              </div>
            )}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      Error Loading Documents
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'medicalCertificateRequests' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Medical Certificate Requests ({filterDocuments(pendingDocs).length} of {pendingDocs.length})
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Status:</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Date:</label>
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                      </select>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by patient name"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-80 focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#800000]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Patient Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Student ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Submission Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Documents</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filterDocuments(pendingDocs).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <p className="text-gray-500 text-lg font-medium">No medical certificate requests found</p>
                              <p className="text-gray-400 text-sm mt-2">
                                {loading ? 'Loading...' : 'No documents match your current filters.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filterDocuments(pendingDocs).map((doc, index) => (
                          <tr key={`pending-${doc.id}-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {doc.patient_display || doc.patient_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {doc.student_id || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                                {doc.status?.charAt(0).toUpperCase() + doc.status?.slice(1) || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(doc.uploaded_at || doc.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setViewModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                View Documents ({getCompletionPercentage(doc)}%)
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              {doc.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleVerify(doc.id)}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700"
                                  >
                                    Verify
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      setShowRejectModal(true);
                                    }}
                                    className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {doc.status === 'verified' && (
                                <button
                                  onClick={() => handleIssueCertificate(doc.id)}
                                  className="bg-[#800000] text-white px-3 py-1 rounded text-xs hover:bg-[#a83232]"
                                >
                                  Issue Certificate
                                </button>
                              )}
                              <button
                                onClick={() => handleAdviseForConsultation(doc)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                              >
                                Advise Consultation
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>              </div>
            )}

            {activeTab === 'uploadedDocuments' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Uploaded Documents ({filterDocuments(uploadedDocs).length} of {uploadedDocs.length})
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Status:</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="verified">Verified</option>
                        <option value="rejected">Rejected</option>
                        <option value="issued">Issued</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Date:</label>
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                      </select>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by patient name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-80 focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
                    />
                    <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#800000]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Student ID</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Department</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Completion</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Uploaded Date</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filterDocuments(uploadedDocs).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <p className="text-gray-500 text-lg font-medium">No uploaded documents found</p>
                              <p className="text-gray-400 text-sm mt-2">
                                {loading ? 'Loading...' : 'No documents match your current filters.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filterDocuments(uploadedDocs).map((doc: any, index) => (
                          <tr key={`uploaded-${doc.id}-${index}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {doc.patient_display || doc.patient_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {doc.student_id || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {doc.department || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(doc.status)}`}>
                                {doc.status?.charAt(0).toUpperCase() + doc.status?.slice(1) || 'Unknown'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-[#800000] h-2 rounded-full" 
                                    style={{ width: `${getCompletionPercentage(doc)}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs">{getCompletionPercentage(doc)}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(doc.uploaded_at || doc.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedDocument(doc);
                                  setViewModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors duration-200"
                              >
                                View Files
                              </button>
                              {doc.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleVerify(doc.id)}
                                    className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-lg transition-colors duration-200"
                                  >
                                    Verify
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedDocument(doc);
                                      setShowRejectModal(true);
                                    }}
                                    className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors duration-200"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}
                              {doc.status === 'verified' && (
                                <button
                                  onClick={() => handleIssueCertificate(doc.id)}
                                  className="text-[#800000] hover:text-[#a83232] bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors duration-200"
                                >
                                  Issue Certificate
                                </button>
                              )}
                              <button
                                onClick={() => handleAdviseForConsultation(doc)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg transition-colors duration-200"
                              >
                                Advise Consultation
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'issuedMedicalCertificates' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Issued Medical Certificates ({filterDocuments(issuedDocs).length} of {issuedDocs.length})
                  </h3>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Status:</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
                      >
                        <option value="all">All Status</option>
                        <option value="issued">Issued</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">Date:</label>
                      <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
                      >
                        <option value="all">All Time</option>
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                      </select>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by patient name"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-80 focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#800000]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">View Results</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Date Issued</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">View Certificate</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filterDocuments(issuedDocs).length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                              </svg>
                              <p className="text-gray-500 text-lg font-medium">No issued certificates found</p>
                              <p className="text-gray-400 text-sm mt-2">
                                {loading ? 'Loading...' : 'No documents match your current filters.'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filterDocuments(issuedDocs).map((doc: any, index) => (
                          <tr key={`issued-${doc.id}-${index}`} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {doc.patient_display || doc.patient_name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="space-y-1">
                                {renderFileLinks(doc)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(doc.updated_at || doc.created_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {doc.status === 'issued' ? (
                                <button
                                  onClick={() => window.open(`/admin/medical-certificate-viewer?id=${doc.id}`, '_blank')}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                                >
                                  View Certificate
                                </button>
                              ) : (
                                <span className="text-gray-400 text-sm">Certificate not issued</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'advisedForConsultations' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center justify-between w-full">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Advised for Consultations ({advisedForConsultations.length} of {advisedDocs.length})
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label htmlFor="sort-by" className="text-gray-700 font-medium">Sort By:</label>
                        <select
                          id="sort-by"
                          value={consultationSortBy}
                          onChange={(e) => setConsultationSortBy(e.target.value)}
                          className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                        >
                          <option value="date">Date Advised (Recent First)</option>
                          <option value="name">Patient Name (A-Z)</option>
                        </select>
                      </div>
                      {advisedForConsultations.length > 0 && (
                        <button
                          onClick={handleClearAllAdvice}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                        >
                          Clear All
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by patient name"
                      value={consultationSearchTerm}
                      onChange={(e) => setConsultationSearchTerm(e.target.value)}
                      className="border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-80 focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none transition-all duration-200"
                    />
                    <svg
                      className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-[#800000]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">User Type</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Reason</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Date Advised</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>                    <tbody className="bg-white divide-y divide-gray-200">
                      {advisedForConsultations.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                            <div className="flex flex-col items-center">
                              <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                              </svg>
                              <p className="text-lg font-medium">No consultation advice yet</p>
                              <p className="text-sm">Advised consultations will appear here when you advise patients for consultations.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        advisedForConsultations.map((record) => (
                          <tr key={`consultation-${record.id}`} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {record.patient_name || record.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.patient_department || record.userType || 'Student'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                              <div className="truncate" title={record.consultation_reason || record.reason}>
                                {record.consultation_reason || record.reason}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {record.advised_for_consultation_at ? 
                                new Date(record.advised_for_consultation_at).toLocaleDateString() : 
                                record.dateAdvised || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                For Consultation
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap items-center gap-2">
                                <button 
                                  onClick={() => {
                                    setSelectedDocument(record);
                                    setViewModalOpen(true);
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View
                                </button>
                                <button 
                                  onClick={() => handleVerify(record.id)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Verify
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedDocument(record);
                                    setShowRejectModal(true);
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Reject
                                </button>
                                <button 
                                  onClick={() => handleIssueCertificate(record.id)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-[#800000] hover:bg-[#a83232] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000] transition-colors duration-200"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Issue Cert
                                </button>
                                <button 
                                  onClick={() => handleCancelAdvice(record.id)}
                                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  Cancel Advice
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Full-screen Medical Documents Modal */}
      {viewModalOpen && selectedDocument && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <h1 className="text-xl font-semibold text-gray-900">Medical Documents</h1>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedDocument.status)}`}>
                {selectedDocument.status?.charAt(0).toUpperCase() + selectedDocument.status?.slice(1) || 'Unknown'}
              </span>
              <div className="text-sm text-gray-500">
                {getCompletionPercentage(selectedDocument)}% Complete
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-1 min-h-0">
            {/* Left Side - Medical Documents */}
            <div className="flex-1 bg-gray-50 p-8 overflow-y-auto">
              <div className="max-w-5xl mx-auto pb-8">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Medical Documents</h2>
                  <p className="text-gray-600">Navigate through documents using the arrows or thumbnails below</p>
                </div>
                
                {(() => {
                  const files = [
                    { key: 'chest_xray', label: 'Chest X-Ray (6 months)' },
                    { key: 'cbc', label: 'CBC' },
                    { key: 'blood_typing', label: 'Blood Typing' },
                    { key: 'urinalysis', label: 'Urinalysis' },
                    { key: 'drug_test', label: 'Drug Test (1 year)' },
                    { key: 'hepa_b', label: 'Hepa B' },
                  ];
                  
                  const availableFiles = files.filter(f => selectedDocument[f.key]);
                  
                  if (availableFiles.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No documents available</p>
                      </div>
                    );
                  }

                  const currentDoc = availableFiles[currentDocIndex];
                  
                  return (
                    <div className="space-y-6">
                      {/* Main Document Display */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {getFileIcon(selectedDocument[currentDoc.key])}
                              <h3 className="text-xl font-semibold text-gray-900">{currentDoc.label}</h3>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>{currentDocIndex + 1} of {availableFiles.length}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="relative mx-4">
                          {/* Navigation Arrows */}
                          {availableFiles.length > 1 && (
                            <>
                              <button
                                onClick={() => setCurrentDocIndex(currentDocIndex === 0 ? availableFiles.length - 1 : currentDocIndex - 1)}
                                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all duration-200"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => setCurrentDocIndex(currentDocIndex === availableFiles.length - 1 ? 0 : currentDocIndex + 1)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full transition-all duration-200"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </>
                          )}
                          
                          {/* Document Content */}
                          <div className="p-8">
                            {selectedDocument[currentDoc.key] && selectedDocument[currentDoc.key].match(/\.(jpg|jpeg|png|gif)$/i) ? (
                              <div 
                                className="relative cursor-pointer group"
                                onClick={() => {
                                  const imageFiles = files.filter(file => selectedDocument[file.key] && selectedDocument[file.key].match(/\.(jpg|jpeg|png|gif)$/i));
                                  const imageIndex = imageFiles.findIndex(file => file.key === currentDoc.key);
                                  openImageSlideshow(selectedDocument, imageIndex);
                                }}
                              >
                                <img 
                                  src={selectedDocument[currentDoc.key]} 
                                  alt={currentDoc.label} 
                                  className="w-full h-96 object-contain rounded-lg border border-gray-200 group-hover:opacity-95 transition-opacity duration-200 bg-white shadow-sm"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg">
                                  <svg className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center w-full h-96 bg-gray-100 rounded-lg border border-gray-200 shadow-sm">
                                {getFileIcon(selectedDocument[currentDoc.key])}
                                <span className="ml-2 text-gray-600 text-lg">Document Preview</span>
                              </div>
                            )}
                            
                            <div className="mt-8 flex items-center justify-between">
                              <a 
                                href={selectedDocument[currentDoc.key]} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="inline-flex items-center px-6 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200 font-medium"
                              >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Download
                              </a>
                              <button 
                                onClick={() => window.open(selectedDocument[currentDoc.key], '_blank')}
                                className="inline-flex items-center px-6 py-3 bg-gray-50 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 font-medium"
                              >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                View in New Tab
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Document Thumbnails/Navigation */}
                      {availableFiles.length > 1 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mx-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-4">All Documents ({availableFiles.length})</h4>
                          <div className="flex space-x-4 overflow-x-auto pb-2">
                            {availableFiles.map((doc, index) => (
                              <button
                                key={doc.key}
                                onClick={() => setCurrentDocIndex(index)}
                                className={`flex-shrink-0 p-4 rounded-lg border transition-all duration-200 ${
                                  currentDocIndex === index 
                                    ? 'border-[#800000] bg-[#800000] bg-opacity-10' 
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              >
                                <div className="flex items-center space-x-3">
                                  {getFileIcon(selectedDocument[doc.key])}
                                  <span className={`text-sm font-medium whitespace-nowrap ${
                                    currentDocIndex === index ? 'text-[#800000]' : 'text-gray-700'
                                  }`}>
                                    {doc.label}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Right Side - Patient Profile */}
            <div className="w-[32rem] bg-white border-l border-gray-200 p-8 overflow-y-auto">
              <div className="space-y-8 pb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Patient Information</h2>
                  <div className="space-y-6">
                    {/* Patient Header */}
                    <div className="flex items-center p-6 bg-gradient-to-r from-[#800000] to-[#a83232] rounded-xl text-white">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white border-opacity-30 relative">
                          {(() => {
                            const photoUrl = selectedDocument.photo || 
                                           selectedDocument.patient_photo || 
                                           selectedDocument.profile_photo || 
                                           selectedDocument.image || 
                                           selectedDocument.avatar || 
                                           selectedDocument.profile_image ||
                                           selectedDocument.user_photo ||
                                           selectedDocument.picture;
                            
                            return photoUrl ? (
                              <img 
                                src={photoUrl} 
                                alt={selectedDocument.patient_display || selectedDocument.patient_name || 'Patient'}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to initials if image fails to load
                                  e.currentTarget.style.display = 'none';
                                  const fallbackDiv = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallbackDiv) {
                                    fallbackDiv.style.display = 'flex';
                                  }
                                }}
                              />
                            ) : null;
                          })()}
                          <div 
                            className="absolute inset-0 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
                            style={{ 
                              display: (selectedDocument.photo || 
                                       selectedDocument.patient_photo || 
                                       selectedDocument.profile_photo || 
                                       selectedDocument.image || 
                                       selectedDocument.avatar || 
                                       selectedDocument.profile_image ||
                                       selectedDocument.user_photo ||
                                       selectedDocument.picture) ? 'none' : 'flex'
                            }}
                          >
                            <span className="text-white font-bold text-2xl">
                              {(selectedDocument.patient_display || selectedDocument.patient_name || 'N/A').charAt(0)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-6">
                        <p className="text-xl font-bold">
                          {selectedDocument.patient_display || selectedDocument.patient_name || 'N/A'}
                        </p>
                        <p className="text-white text-opacity-90 text-base">Patient</p>
                      </div>
                    </div>

                    {/* Patient Information from Patient Table */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Full Name:</span>
                          <span className="text-base text-gray-900 font-medium">
                            {selectedDocument.first_name || ''} {selectedDocument.middle_name || ''} {selectedDocument.last_name || selectedDocument.name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Student ID:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.student_id || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Email:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Contact Number:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.contact_number || selectedDocument.phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Gender:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.gender || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Date of Birth:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.date_of_birth ? formatDate(selectedDocument.date_of_birth) : 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Age:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.age || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Department:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.department || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Address:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.address || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Blood Type:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.blood_type || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Religion:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.religion || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Nationality:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.nationality || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Civil Status:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.civil_status || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Contact Information */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Contact Name:</span>
                          <span className="text-base text-gray-900 font-medium">
                            {selectedDocument.emergency_contact_first_name || ''} {selectedDocument.emergency_contact_middle_name || ''} {selectedDocument.emergency_contact_surname || selectedDocument.emergency_contact_name || 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Contact Number:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.emergency_contact_number || selectedDocument.emergency_contact_phone || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Relationship:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.emergency_contact_relationship || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">Address:</span>
                          <span className="text-base text-gray-900 font-medium">{selectedDocument.emergency_contact_address || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Medical History */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h4>
                      <div className="space-y-4">
                        <div className="border-b border-gray-200 pb-3">
                          <span className="text-base font-medium text-gray-700">Allergies:</span>
                          <p className="text-base text-gray-900 mt-2 font-medium">{selectedDocument.allergies || 'None reported'}</p>
                        </div>
                        <div className="border-b border-gray-200 pb-3">
                          <span className="text-base font-medium text-gray-700">Current Medications:</span>
                          <div className="text-base text-gray-900 mt-2 font-medium">
                            {selectedDocument.medications && Array.isArray(selectedDocument.medications) && selectedDocument.medications.length > 0 ? (
                              <ul className="list-disc list-inside">
                                {selectedDocument.medications.map((med: any, index: number) => (
                                  <li key={index}>{typeof med === 'string' ? med : med.name || JSON.stringify(med)}</li>
                                ))}
                              </ul>
                            ) : (
                              'None reported'
                            )}
                          </div>
                        </div>
                        <div className="border-b border-gray-200 pb-3">
                          <span className="text-base font-medium text-gray-700">Medical Conditions:</span>
                          <div className="text-base text-gray-900 mt-2 font-medium">
                            {selectedDocument.medical_conditions && Array.isArray(selectedDocument.medical_conditions) && selectedDocument.medical_conditions.length > 0 ? (
                              <ul className="list-disc list-inside space-y-1">
                                {selectedDocument.medical_conditions.map((condition: any, index: number) => (
                                  <li key={index}>{typeof condition === 'string' ? condition : condition.name || JSON.stringify(condition)}</li>
                                ))}
                              </ul>
                            ) : (
                              'None reported'
                            )}
                          </div>
                        </div>
                        <div className="border-b border-gray-200 pb-3">
                          <span className="text-base font-medium text-gray-700">Past Medical History:</span>
                          <div className="text-base text-gray-900 mt-2 font-medium">
                            {selectedDocument.past_medical_history && Array.isArray(selectedDocument.past_medical_history) && selectedDocument.past_medical_history.length > 0 ? (
                              <ul className="list-disc list-inside space-y-1">
                                {selectedDocument.past_medical_history.map((history: any, index: number) => (
                                  <li key={index}>{typeof history === 'string' ? history : history.name || JSON.stringify(history)}</li>
                                ))}
                              </ul>
                            ) : (
                              'None reported'
                            )}
                          </div>
                        </div>
                        <div className="border-b border-gray-200 pb-3">
                          <span className="text-base font-medium text-gray-700">Hospital Admission/Surgery:</span>
                          <div className="text-base text-gray-900 mt-2 font-medium">
                            {selectedDocument.hospital_admission_or_surgery ? 'Yes' : 'No'}
                            {selectedDocument.hospital_admission_or_surgery && selectedDocument.hospital_admission_details && (
                              <p className="text-gray-700 text-sm mt-2">{selectedDocument.hospital_admission_details}</p>
                            )}
                          </div>
                        </div>
                        <div className="border-b border-gray-200 pb-3">
                          <span className="text-base font-medium text-gray-700">Family Medical History:</span>
                          <div className="text-base text-gray-900 mt-2 font-medium">
                            {selectedDocument.family_medical_history && Array.isArray(selectedDocument.family_medical_history) && selectedDocument.family_medical_history.length > 0 ? (
                              <ul className="list-disc list-inside space-y-1">
                                {selectedDocument.family_medical_history.map((history: any, index: number) => (
                                  <li key={index}>{typeof history === 'string' ? history : history.name || JSON.stringify(history)}</li>
                                ))}
                              </ul>
                            ) : (
                              'None reported'
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-base font-medium text-gray-700">Vaccination History:</span>
                          <div className="text-base text-gray-900 mt-2 font-medium">
                            {selectedDocument.vaccination_history && Array.isArray(selectedDocument.vaccination_history) && selectedDocument.vaccination_history.length > 0 ? (
                              <ul className="list-disc list-inside space-y-1">
                                {selectedDocument.vaccination_history.map((vaccine: any, index: number) => (
                                  <li key={index}>{typeof vaccine === 'string' ? vaccine : vaccine.name || JSON.stringify(vaccine)}</li>
                                ))}
                              </ul>
                            ) : (
                              'None reported'
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>                {/* Submission Details */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Submission Details</h3>
                  <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-base font-medium text-gray-700">Submitted:</span>
                      <span className="text-base text-gray-900 font-medium">{formatDate(selectedDocument.uploaded_at || selectedDocument.created_at)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-200">
                      <span className="text-base font-medium text-gray-700">Status:</span>
                      <span className={`text-base px-3 py-1 rounded-full font-medium ${getStatusColor(selectedDocument.status)}`}>
                        {selectedDocument.status?.charAt(0).toUpperCase() + selectedDocument.status?.slice(1) || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-base font-medium text-gray-700">Completion:</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-20 bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-[#800000] h-3 rounded-full transition-all duration-300"
                            style={{ width: `${getCompletionPercentage(selectedDocument)}%` }}
                          ></div>
                        </div>
                        <span className="text-base text-gray-900 font-medium">{getCompletionPercentage(selectedDocument)}%</span>
                      </div>
                    </div>
                    {selectedDocument.rejection_reason && (
                      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-base font-medium text-red-800 mb-2">Rejection Reason:</p>
                        <p className="text-base text-red-700">{selectedDocument.rejection_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Document Progress */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Document Progress</h3>
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="space-y-4">
                      {[
                        { key: 'chest_xray', label: 'Chest X-Ray' },
                        { key: 'cbc', label: 'CBC' },
                        { key: 'blood_typing', label: 'Blood Typing' },
                        { key: 'urinalysis', label: 'Urinalysis' },
                        { key: 'drug_test', label: 'Drug Test' },
                        { key: 'hepa_b', label: 'Hepa B' },
                      ].map((doc) => (
                        <div key={doc.key} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                          <span className="text-base font-medium text-gray-700">{doc.label}:</span>
                          <div className="flex items-center space-x-2">
                            {selectedDocument[doc.key] ? (
                              <span className="inline-flex items-center text-sm text-green-600 font-medium">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Uploaded
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-sm text-gray-400 font-medium">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                Missing
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900">Actions</h3>
                  
                  {/* Advise for Consultation Button - Available for all statuses */}
                  <button
                    onClick={() => handleAdviseForConsultation(selectedDocument)}
                    className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Advise for Consultation
                  </button>

                  {/* Actions based on document status */}
                  {selectedDocument.status === 'pending' && (
                    <div className="flex flex-col space-y-3">
                      <button
                        onClick={() => {
                          setViewModalOpen(false);
                          handleVerify(selectedDocument.id);
                        }}
                        className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Verify Documents
                      </button>
                      <button
                        onClick={() => {
                          setViewModalOpen(false);
                          setShowRejectModal(true);
                        }}
                        className="w-full flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Reject Documents
                      </button>
                    </div>
                  )}

                  {selectedDocument.status === 'for_consultation' && (
                    <div className="flex flex-col space-y-3">
                      {/* Show consultation reason if available */}
                      {selectedDocument.consultation_reason && (
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">Consultation Reason:</h4>
                          <p className="text-sm text-blue-700">{selectedDocument.consultation_reason}</p>
                          {selectedDocument.advised_for_consultation_at && (
                            <p className="text-xs text-blue-600 mt-2">
                              Advised on: {new Date(selectedDocument.advised_for_consultation_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      )}
                      
                      {/* Actions for consultation documents */}
                      <button
                        onClick={() => {
                          setViewModalOpen(false);
                          handleVerify(selectedDocument.id);
                        }}
                        className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Verify Documents
                      </button>
                      <button
                        onClick={() => {
                          setViewModalOpen(false);
                          setShowRejectModal(true);
                        }}
                        className="w-full flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Reject Documents
                      </button>
                      <button
                        onClick={() => {
                          setViewModalOpen(false);
                          handleIssueCertificate(selectedDocument.id);
                        }}
                        className="w-full flex items-center justify-center px-6 py-3 bg-[#800000] text-white rounded-lg hover:bg-[#a83232] transition-colors duration-200 font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Issue Certificate
                      </button>
                      <button
                        onClick={() => {
                          setViewModalOpen(false);
                          handleCancelAdvice(selectedDocument.id);
                        }}
                        className="w-full flex items-center justify-center px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200 font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Cancel Consultation Advice
                      </button>
                    </div>
                  )}

                  {selectedDocument.status === 'verified' && (
                    <button
                      onClick={() => {
                        setViewModalOpen(false);
                        handleIssueCertificate(selectedDocument.id);
                      }}
                      className="w-full flex items-center justify-center px-6 py-3 bg-[#800000] text-white rounded-lg hover:bg-[#a83232] transition-colors duration-200 font-medium"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Issue Certificate
                    </button>
                  )}

                  {selectedDocument.status === 'rejected' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="text-sm font-medium text-red-800 mb-2">Document Rejected</h4>
                      <p className="text-sm text-red-700">This document has been rejected and cannot be processed until resubmitted.</p>
                    </div>
                  )}

                  {selectedDocument.status === 'issued' && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="text-sm font-medium text-green-800 mb-2">Certificate Issued</h4>
                      <p className="text-sm text-green-700">Medical certificate has been issued for this patient.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Image Modal - Slideshow */}
      {showImageFullscreen && fullscreenImage && (
        <div className="fixed inset-0 z-60 bg-black bg-opacity-95 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setShowImageFullscreen(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-all duration-200 z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Image Info */}
            <div className="absolute top-4 left-4 text-white bg-black bg-opacity-50 px-4 py-2 rounded-lg z-10">
              <p className="text-lg font-semibold">{fullscreenImage.label}</p>
              <p className="text-sm text-gray-300">{selectedDocument.patient_display || selectedDocument.patient_name || 'N/A'}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-400">
                  {selectedImageIndex + 1} of {availableImages.length}
                </p>
                <p className="text-xs text-gray-400">
                  Zoom: {Math.round(imageZoom * 100)}%
                </p>
              </div>
            </div>

            {/* Navigation Buttons */}
            {availableImages.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={goToPreviousImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-all duration-200 z-10"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Next Button */}
                <button
                  onClick={goToNextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 p-3 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-all duration-200 z-10"
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Main Image */}
            <img
              src={fullscreenImage.url}
              alt={fullscreenImage.label}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${imageZoom}) translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                transition: 'transform 0.2s',
              }}
            />

            {/* Zoom Controls */}
            <div className="absolute top-20 right-4 flex flex-col space-y-2 z-10">
              <button
                onClick={zoomIn}
                className="text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-all duration-200"
                disabled={imageZoom >= 3}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              <button
                onClick={zoomOut}
                className="text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-all duration-200"
                disabled={imageZoom <= 0.5}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                </svg>
              </button>
              <button
                onClick={resetZoom}
                className="text-white hover:text-gray-300 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-75 transition-all duration-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* Thumbnail Navigation */}
            {availableImages.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 px-4 py-2 rounded-lg z-10">
                {availableImages.map((image, index) => (
                  <button
                    key={image.key}
                    onClick={() => goToImage(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      selectedImageIndex === index 
                        ? 'border-white scale-110' 
                        : 'border-gray-400 hover:border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.label}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Keyboard Navigation Hint */}
            <div className="absolute bottom-4 right-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded-lg text-xs z-10">
              Use arrow keys to navigate • ESC to close • +/- to zoom
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Document - {selectedDocument.patient_display || selectedDocument.patient_name || 'N/A'}
            </h3>
            <textarea
              placeholder="Enter rejection reason..."
              className="w-full p-3 border border-gray-300 rounded-md"
              rows={4}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedDocument(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleReject(selectedDocument.id, rejectionReason);
                  setShowRejectModal(false);
                  setSelectedDocument(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Reject
              </button>
            </div>          </div>
        </div>
      )}

      {/* Consultation Advice Modal */}
      {showConsultationModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-50 backdrop-blur-sm animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseConsultationModal();
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-modal-pop">
            <div className="flex items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-grow">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Advise for Consultation
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Provide a reason why {selectedDocument?.patient_display || selectedDocument?.patient_name || 'this patient'} should visit the clinic for a consultation.
                  </p>
                </div>
                <div className="mt-4">
                  <label htmlFor="consultation-reason" className="block text-sm font-medium text-gray-700">
                    Consultation Reason
                  </label>
                  <textarea
                    id="consultation-reason"
                    name="consultation-reason"
                    rows={4}
                    className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    value={consultationReason}
                    onChange={(e) => setConsultationReason(e.target.value)}
                    placeholder="Please provide a detailed reason for the consultation advice..."
                  />
                </div>
              </div>
              <button
                onClick={handleCloseConsultationModal}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleConfirmConsultationAdvice}
                disabled={!consultationReason.trim()}
              >
                Send Advice
              </button>
              <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                onClick={handleCloseConsultationModal}
              >
                Cancel
              </button>
            </div>
          </div>
          <style jsx>{`
            .animate-fade-in {
              animation: fadeIn 0.2s ease-out;
            }
            .animate-modal-pop {
              animation: modalPop 0.25s cubic-bezier(0.39, 0.575, 0.565, 1) both;
            }
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes modalPop {
              0% {
                opacity: 0;
                transform: scale(0.95);
              }
              100% {
                opacity: 1;
                transform: scale(1);
              }
            }
          `}</style>
        </div>
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        open={showFeedbackModal}
        message={feedbackMessage}
        onClose={() => setShowFeedbackModal(false)}
      />
    </AdminLayout>
  );
}

export default withAdminAccess(AdminMedicalDocuments);
