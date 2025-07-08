import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import AuthModal from '../components/AuthModal';
import PostLoginOptionsModal from '../components/PostLoginOptionsModal';

/**
 * Home page component of the WMSU Health Services application.
 * Shows a professional landing page with adaptive CTA based on authentication state.
 * 
 * @returns {JSX.Element} The rendered Home component
 */
export default function Home() {  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [showPostLoginModal, setShowPostLoginModal] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userDismissedModal, setUserDismissedModal] = useState(false);  // Check authentication status when component mounts
  useEffect(() => {    const checkAuthStatus = () => {
      // Check for both possible token names
      const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      
      const isAuthenticated = !!token;
      setIsLoggedIn(isAuthenticated);
      
      // Show auth modal if user is not logged in and hasn't manually dismissed it
      if (!isAuthenticated && !userDismissedModal) {
        setShowAuthModal(true);
        setAuthMode('login'); // Default to login mode
      }
      
      if (userData && isAuthenticated) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.error('Error parsing user data:', e);
          localStorage.removeItem('user');
        }
      }
    };
    
    checkAuthStatus();
    
    // Also listen for storage changes (useful for multiple tabs)
    const handleStorageChange = () => {
      checkAuthStatus();
    };
      window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userDismissedModal]); // Add userDismissedModal as dependency

  const handleLoginClick = () => {
    // Don't show auth modal if user is already logged in
    if (isLoggedIn) {
      return;
    }
    setAuthMode('login');
    setShowAuthModal(true);
  };
  
  const handleSignupClick = () => {
    // Don't show auth modal if user is already logged in
    if (isLoggedIn) {
      return;
    }
    setAuthMode('signup');
    setShowAuthModal(true);
  };
    const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    setUserDismissedModal(false); // Reset dismissal state on logout
  };const handleLoginSuccess = (gradeLevel: string, user: any) => {
    // Re-check authentication status
    const token = localStorage.getItem('access_token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsLoggedIn(true);
        setShowAuthModal(false);
        setUserDismissedModal(false); // Reset dismissal state on successful login
        
        // Only show post-login modal for non-staff users
        // Staff users are already redirected to admin pages by LoginForm
        if (gradeLevel && !(parsedUser.is_staff || parsedUser.user_type === 'staff' || parsedUser.user_type === 'admin')) {
          setShowPostLoginModal(true);
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  };

  const handleSignupSuccess = () => {
    setShowAuthModal(false);
    // Optionally switch to login mode
    setAuthMode('login');
    setShowAuthModal(true);
  };  const handleBookAppointment = () => {
    if (isLoggedIn) {
      setShowPostLoginModal(true);
    } else {
      setAuthMode('login');
      setShowAuthModal(true);
    }
  };
  // Force re-check authentication when auth modal closes
  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    setUserDismissedModal(true); // Mark that user has manually dismissed the modal
    // Re-check authentication status after a brief delay
    setTimeout(() => {
      const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
      const userData = localStorage.getItem('user');
      setIsLoggedIn(!!token);
      if (userData && token) {
        try {
          setUser(JSON.parse(userData));
        } catch (e) {
          console.error('Error parsing user data:', e);
        }
      }    }, 100);
  };

  return (
    <>
      <div className="min-h-screen bg-white">
        <Head>
          <title>WMSU Health Services</title>
          <meta name="description" content="Western Mindanao State University Health Services Portal - Providing quality healthcare to the university community" />
        </Head>

        {/* Always show landing page for all users */}
        <Layout onLoginClick={handleLoginClick} onSignupClick={handleSignupClick} isLoggedIn={isLoggedIn}>
          {/* Main Content Wrapper with white background */}
          <div className="w-full bg-white min-h-screen">
            {/* Hero Section with soft subtle crimson background */}
            <section className="relative py-12 sm:py-16 lg:py-20 xl:py-32 bg-gradient-to-br from-rose-50 via-pink-50 to-red-100">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-100/20 via-pink-100/15 to-red-200/25"></div>
              <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-4xl mx-auto">
                <div className="flex justify-center mb-8 sm:mb-10">
                  <div className="flex items-center justify-center">
                    <img 
                      src="/logo.png" 
                      alt="WMSU Logo" 
                      className="h-24 w-24 sm:h-32 sm:w-32 lg:h-40 lg:w-40 xl:h-48 xl:w-48 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 tracking-tight leading-tight">
                  Your Health, <span className="text-[#800000]">Our Priority</span>
                </h1>
                
                <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
                  Comprehensive healthcare services designed for the WMSU community with excellence and care.
                </p>                {/* CTA Buttons */}
                <div className="flex flex-row gap-2 sm:gap-3 justify-center mb-8 sm:mb-10 px-4 sm:px-0">
                  <button
                    onClick={handleBookAppointment}
                    className="flex-1 sm:flex-none sm:w-auto bg-[#800000] hover:bg-[#a83232] text-white px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-base transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:scale-95"
                  >
                    Book Appointment
                  </button>
                  <button 
                    onClick={handleLoginClick}
                    className="flex-1 sm:flex-none sm:w-auto bg-white border-2 border-gray-200 hover:border-[#800000] text-gray-700 hover:text-[#800000] px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-base transition-all duration-300 active:scale-95"
                  >
                    Patient Portal
                  </button>
                </div>
                
                {/* Announcement Banner */}
                <div className="bg-gradient-to-r from-[#800000] to-[#a83232] rounded-lg sm:rounded-xl p-3 sm:p-4 text-white shadow-lg mx-4 sm:mx-0">
                  <div className="flex items-center justify-center space-x-1 sm:space-x-2 mb-1">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium uppercase tracking-wider">Current Event</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold mb-1">Free Medical Check-up Week</h3>
                  <p className="text-pink-100 text-xs sm:text-sm">
                    Available for all students and staff • June 10-14, 2025
                  </p>
                </div>
              </div>
            </div>
          </section>
          
          {/* Services Section */}
          <section className="py-12 sm:py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">Our Services</h2>
                <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4 sm:px-0">
                  Professional healthcare services tailored to meet your needs
                </p>
              </div>
              
              {/* Mobile: 3 columns, larger screens: 2 and 3 columns */}
              <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8">
                {/* Primary Care */}
                <div className="group bg-white hover:bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-lg sm:rounded-xl lg:rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg active:scale-95 sm:active:scale-100">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 text-center">Primary Care</h3>
                  {/* Show description only on larger screens */}
                  <div className="hidden sm:block">
                    <p className="text-gray-600 mb-4 lg:mb-6 leading-relaxed text-sm lg:text-base text-center mt-2 lg:mt-3">
                      Comprehensive health check-ups and preventive care services.
                    </p>
                  </div>
                </div>

                {/* Dental Care */}
                <div className="group bg-white hover:bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-lg sm:rounded-xl lg:rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg active:scale-95 sm:active:scale-100">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 0 1 0 5H9m0-5v5m0-5H7.5M9 15H7.5m3-5h1.5a2.5 2.5 0 0 1 0 5H9" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 text-center">Dental Care</h3>
                  {/* Show description only on larger screens */}
                  <div className="hidden sm:block">
                    <p className="text-gray-600 mb-4 lg:mb-6 leading-relaxed text-sm lg:text-base text-center mt-2 lg:mt-3">
                      Professional dental services including cleanings and treatments.
                    </p>
                  </div>
                </div>

                {/* Pharmacy */}
                <div className="group bg-white hover:bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-lg sm:rounded-xl lg:rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg active:scale-95 sm:active:scale-100">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-red-100 to-red-200 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 text-center">Pharmacy</h3>
                  {/* Show description only on larger screens */}
                  <div className="hidden sm:block">
                    <p className="text-gray-600 mb-4 lg:mb-6 leading-relaxed text-sm lg:text-base text-center mt-2 lg:mt-3">
                      Prescription medications with expert pharmacist consultation.
                    </p>
                  </div>
                </div>

                {/* Vaccinations */}
                <div className="group bg-white hover:bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-lg sm:rounded-xl lg:rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg active:scale-95 sm:active:scale-100">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 text-center">Vaccinations</h3>
                  {/* Show description only on larger screens */}
                  <div className="hidden sm:block">
                    <p className="text-gray-600 mb-4 lg:mb-6 leading-relaxed text-sm lg:text-base text-center mt-2 lg:mt-3">
                      Immunization services to protect against various diseases.
                    </p>
                  </div>
                </div>

                {/* Health Screenings */}
                <div className="group bg-white hover:bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-lg sm:rounded-xl lg:rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg active:scale-95 sm:active:scale-100">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 text-center">Health Screenings</h3>
                  {/* Show description only on larger screens */}
                  <div className="hidden sm:block">
                    <p className="text-gray-600 mb-4 lg:mb-6 leading-relaxed text-sm lg:text-base text-center mt-2 lg:mt-3">
                      Regular health assessments and diagnostic screenings.
                    </p>
                  </div>
                </div>

                {/* Health Education */}
                <div className="group bg-white hover:bg-gray-50 p-4 sm:p-6 lg:p-8 rounded-lg sm:rounded-xl lg:rounded-2xl border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-lg active:scale-95 sm:active:scale-100">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-lg sm:rounded-xl flex items-center justify-center mb-2 sm:mb-4 lg:mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto">
                    <svg className="w-4 h-4 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-sm sm:text-lg lg:text-xl font-semibold text-gray-900 text-center">Health Education</h3>
                  {/* Show description only on larger screens */}
                  <div className="hidden sm:block">
                    <p className="text-gray-600 mb-4 lg:mb-6 leading-relaxed text-sm lg:text-base text-center mt-2 lg:mt-3">
                      Wellness programs and health awareness initiatives.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          
          {/* Call to Action Section */}
          <section className="py-12 sm:py-16 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10 sm:mb-12 lg:mb-16">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
                  {isLoggedIn ? 'Ready to Book?' : 'Get Started Today'}
                </h2>                <p className="text-base sm:text-lg text-gray-600 px-4 sm:px-0">
                  {isLoggedIn 
                    ? 'Schedule your appointment with our healthcare professionals' 
                    : 'Join our community to access comprehensive healthcare services'
                  }
                </p>
              </div>
                <div className="max-w-2xl mx-auto px-4 sm:px-0">
                {isLoggedIn ? (
                  // Logged in user - Show appointment booking
                  <button 
                    onClick={handleBookAppointment}
                    className="group relative bg-white hover:bg-gray-50 w-full p-6 sm:p-8 lg:p-12 rounded-2xl sm:rounded-3xl border border-gray-200 hover:border-[#800000] transition-all duration-300 hover:shadow-xl text-left active:scale-95 sm:active:scale-100"
                  >
                    <div className="absolute top-6 sm:top-8 right-6 sm:right-8">
                      <div className="w-3 h-3 bg-[#800000] rounded-full"></div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6 sm:mb-8">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#800000] to-[#a83232] rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-0 sm:mr-6 group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-9 6v10a1 1 0 001 1h8a1 1 0 001-1V13M7 10h10M7 10V7a1 1 0 011-1h8a1 1 0 011 1v3" />
                        </svg>
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Book Your Appointment</h3>
                        <p className="text-gray-600 text-base sm:text-lg">
                          Choose from medical consultations, dental care, or request medical certificates
                        </p>
                      </div>
                    </div>
                      <div className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
                      <div className="flex items-center text-[#800000] font-semibold">
                        <span className="text-sm sm:text-base">Select Service</span>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        Welcome back, {user?.first_name || 'User'}!
                      </div>
                    </div>
                  </button>
                ) : (
                  // Not logged in - Show login/signup options
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-6 sm:p-8 lg:p-12 shadow-lg">
                    <div className="text-center mb-6 sm:mb-8">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-[#800000] to-[#a83232] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Access Your Health Portal</h3>
                      <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                        Log in to book appointments, view medical records, and manage your healthcare needs
                      </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                      <button 
                        onClick={handleLoginClick}
                        className="flex-1 bg-[#800000] hover:bg-[#a83232] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:scale-95"
                      >
                        Log In
                      </button>
                      <button 
                        onClick={handleSignupClick}
                        className="flex-1 bg-white border-2 border-[#800000] hover:bg-[#800000] text-[#800000] hover:text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-semibold text-base sm:text-lg transition-all duration-300 active:scale-95"
                      >
                        Sign Up
                      </button>                    </div>
                    
                    <div className="mt-4 sm:mt-6 text-center">
                      <p className="text-xs sm:text-sm text-gray-500">
                        New to WMSU Health Services? Create an account to get started
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>          </section>
        </div>
      </Layout>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        onLogin={handleLoginSuccess}
        onSignup={handleSignupSuccess}
        initialMode={authMode}
      />

      {showPostLoginModal && user && (
        <PostLoginOptionsModal
          isOpen={showPostLoginModal}
          onClose={() => setShowPostLoginModal(false)}
          userGradeLevel={user.grade_level || ''}
        />
      )}
    </div>
    </>
  );
}
