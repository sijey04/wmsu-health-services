import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useRouter } from 'next/router';

interface PostLoginOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userGradeLevel: string;
  onOptionSelect?: (option: string) => void;
}

export default function PostLoginOptionsModal({ isOpen, onClose, userGradeLevel, onOptionSelect }: PostLoginOptionsModalProps) {
  const router = useRouter();
  const [hasRequestedCertificate, setHasRequestedCertificate] = useState(false);
  const [checkingCertificate, setCheckingCertificate] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState<any[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Fetch dynamic options from API
  useEffect(() => {
    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch('http://localhost:8000/api/content-management/post_login_options/', {
          headers: token ? {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          } : {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setDynamicOptions(data.options || []);
        }
      } catch (error) {
        console.error('Error fetching post-login options:', error);
        // Fallback to default options if API fails
        setDynamicOptions([
          {
            key: 'Book Dental Consultation',
            icon: '🦷',
            title: 'Book Dental Consultation',
            description: 'Schedule your routine dental check-up or specific treatment.',
            color: 'text-[#800000] border-[#800000] hover:bg-[#f3eaea]',
          },
          {
            key: 'Book Medical Consultation',
            icon: '⚕️',
            title: 'Book Medical Consultation',
            description: 'Book an appointment for general medical advice or specific health concerns.',
            color: 'text-[#800000] border-[#800000] hover:bg-[#f3eaea]',
          },
        ]);
      } finally {
        setLoadingOptions(false);
      }
    };
    
    if (isOpen) {
      fetchOptions();
    }
  }, [isOpen]);

  // Check if user has already requested a medical certificate
  useEffect(() => {
    if (isOpen && userGradeLevel && userGradeLevel.toLowerCase().includes('freshman')) {
      checkMedicalCertificateStatus();
    }
  }, [isOpen, userGradeLevel]);

  const checkMedicalCertificateStatus = async () => {
    setCheckingCertificate(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // Check for any medical document records across all academic years
      const response = await fetch('http://localhost:8000/api/medical-documents/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Only consider documents with certain statuses as "already requested"
        // Allow re-upload if the previous request was rejected or advised for consultation
        const activeStatuses = ['pending', 'verified', 'issued'];
        
        if (Array.isArray(data)) {
          // Check if there are any documents with active statuses
          const hasActiveRequest = data.some((doc: any) => activeStatuses.includes(doc.status));
          setHasRequestedCertificate(hasActiveRequest);
        } else if (data.id) {
          // Single document - check if status is in active statuses
          setHasRequestedCertificate(activeStatuses.includes(data.status));
        } else {
          setHasRequestedCertificate(false);
        }
      }
    } catch (error) {
      console.error('Error checking medical certificate status:', error);
    } finally {
      setCheckingCertificate(false);
    }
  };

  const handleOptionSelect = (option: string) => {
    onClose();
    
    // Generate a unique navigation token to prevent direct URL access
    const navigationToken = btoa(`${Date.now()}-${Math.random().toString(36)}`);
    sessionStorage.setItem('appointment_navigation_token', navigationToken);
    sessionStorage.setItem('appointment_option', option);
    sessionStorage.setItem('navigation_timestamp', Date.now().toString());
    
    if (onOptionSelect) {
      onOptionSelect(option);
    } else {
      router.push(`/patient/waiver?option=${encodeURIComponent(option)}&token=${navigationToken}`);
    }
  };

  // Build options array from dynamic options fetched from API
  const options = [...dynamicOptions];

  // Only show medical certificate option for freshmen who haven't requested one yet
  // This overrides the API options for freshman-specific logic
  if (userGradeLevel && 
      userGradeLevel.toLowerCase().includes('freshman') && 
      !hasRequestedCertificate && 
      !checkingCertificate) {
    // Check if certificate option isn't already in dynamic options
    const hasCertificateOption = options.some(opt => opt.key === 'Request Medical Certificate');
    if (!hasCertificateOption) {
      options.push({
        key: 'Request Medical Certificate',
        icon: '📜',
        title: 'Request Medical Certificate',
        description: 'For incoming freshmen only. Request an official medical certificate.',
        color: 'text-blue-600 border-blue-600 hover:bg-blue-50',
      });
    }
  }

  const gridCols = options.length === 1 
    ? 'grid-cols-1 justify-center' 
    : options.length === 2 
    ? 'grid-cols-1 sm:grid-cols-2 justify-center' 
    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 justify-center';

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidthClass="max-w-5xl">
      <div className="text-center px-4">
        <h3 className="text-2xl sm:text-3xl font-bold text-[#800000] mb-8">What would you like to do?</h3>
        
        {(checkingCertificate || loadingOptions) && (
          <div className="mb-4 text-sm text-gray-600">
            <div className="inline-flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {loadingOptions ? 'Loading options...' : 'Checking medical certificate status...'}
            </div>
          </div>
        )}
        
        <div className={`grid ${gridCols} gap-6 justify-items-center`}>
          {options.map(option => (
            <button
              key={option.key}
              onClick={() => handleOptionSelect(option.key)}
              className={`flex flex-col items-center justify-center p-6 rounded-lg shadow-md bg-white ${option.color} border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-50 text-center hover:shadow-lg transform hover:-translate-y-1 min-h-[160px] w-full max-w-[280px]`}
            >
              <span className="text-4xl mb-3">{option.icon}</span>
              <span className="text-lg font-semibold mb-2">{option.title}</span>
              <p className="text-sm text-gray-600 leading-relaxed px-2">{option.description}</p>
            </button>
          ))}
        </div>
        
        {/* Show a note if user is a freshman but has already requested a certificate */}
        {userGradeLevel && 
         userGradeLevel.toLowerCase().includes('freshman') && 
         hasRequestedCertificate && 
         !checkingCertificate && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-blue-800">
                You have an active medical certificate request. Check your <span className="font-medium">appointments</span> for the status. If your documents were rejected or you were advised for consultation, you can submit a new request after addressing the issues.
              </p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}