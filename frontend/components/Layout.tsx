import React, { ReactNode, useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';

type LayoutProps = {
  children: ReactNode;
  onLoginClick: () => void;
  onSignupClick: () => void;
  isLoggedIn?: boolean;
};

export default function Layout({ children, onLoginClick, onSignupClick, isLoggedIn: parentIsLoggedIn }: LayoutProps) {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  // Get user from localStorage and update in real time
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Sample notifications
  const notifications = [
    { id: 1, message: 'New medical appointment booked', time: '2 mins ago' },
    { id: 2, message: 'Document request approved', time: '10 mins ago' },
    { id: 3, message: 'System update scheduled', time: '1 hour ago' },
  ];

  // Close notification dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    function syncUser() {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    }
    syncUser();
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  // Use parent login state if provided, otherwise use local state
  const currentIsLoggedIn = parentIsLoggedIn !== undefined ? parentIsLoggedIn : isLoggedIn;

  // Helper function to check if user is incoming freshman
  const isIncomingFreshman = () => {
    if (!user) return false;
    const gradeLevel = user.grade_level?.toLowerCase() || '';
    return gradeLevel.includes('grade 12') || 
           gradeLevel.includes('incoming freshman') ||
           gradeLevel.includes('freshman') ||
           gradeLevel === '12';
  };

  // Helper to get avatar content
  const getAvatar = () => {
    // Use uploaded profile photo if available
    if (user?.photo) {
      // If the photo is a relative path, prepend the backend URL if needed
      const photoUrl = user.photo.startsWith('http') ? user.photo : `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'}${user.photo}`;
      return <img className="h-8 w-8 rounded-full object-cover" src={photoUrl} alt="Profile" />;
    }
    if (user?.profile_picture) {
      return <img className="h-8 w-8 rounded-full object-cover" src={user.profile_picture} alt="Profile" />;
    }
    const letter = user?.first_name?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || '?';
    return (
      <span className="h-8 w-8 flex items-center justify-center rounded-full bg-[#800000] text-white font-bold text-lg">
        {letter}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>WMSU Health Services</title>
        <meta name="description" content="WMSU Health Services Portal" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <header className="bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center group">
                <Link href="/" className="flex items-center space-x-3 hover:scale-105 transition-transform duration-300">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#800000] to-[#a83232] rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div className="hidden sm:block">
                    <h1 className="font-bold text-xl bg-gradient-to-r from-[#800000] to-[#a83232] bg-clip-text text-transparent">
                      WMSU Health Services
                    </h1>
                    <p className="text-xs text-gray-500 font-medium">Your Health, Our Priority</p>
                  </div>
                </Link>
              </div>
            </div>
            {/* Minimalistic Notification Bell and User Menu */}
            <div className="flex items-center space-x-4">
              {/* Larger Notification Bell */}
              <div className="relative" tabIndex={0}>
                <button 
                  onClick={() => setShowNotifications(v => !v)}
                  className="relative p-2 text-gray-500 hover:text-[#800000] transition-colors duration-200"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#800000] rounded-full text-xs text-white flex items-center justify-center font-medium">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div ref={notificationRef} className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                    <div className="p-3 border-b border-gray-100">
                      <h3 className="font-medium text-gray-900 text-sm">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((n, index) => (
                        <div key={n.id} className={`p-3 hover:bg-gray-50 transition-colors ${index === notifications.length - 1 ? '' : 'border-b border-gray-50'}`}>
                          <p className="text-sm text-gray-900">{n.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 border-t border-gray-100">
                      <button className="w-full text-center text-xs text-gray-500 hover:text-[#800000] py-1">
                        View all
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* Minimalistic User Menu */}
              <div className="hidden lg:flex lg:items-center">
                {currentIsLoggedIn && user ? (
                  <div className="relative flex-shrink-0">
                    <button
                      type="button"
                      className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded-lg transition-colors duration-200"
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    >
                      <div className="relative">
                        {getAvatar()}
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border border-white rounded-full"></div>
                      </div>
                      <div className="hidden xl:block text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {user.user_type || 'Student'}
                        </p>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {isUserMenuOpen && (
                      <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-xl bg-white border border-gray-200 z-50">
                        <div className="py-1">
                          <Link
                            href="/profile"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profile
                          </Link>
                          <Link
                            href="/appointments"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Appointments
                          </Link>
                          <Link
                            href="/patient/profile-setup"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Settings
                          </Link>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={() => {
                              setIsUserMenuOpen(false);
                              localStorage.removeItem('user');
                              localStorage.removeItem('access_token');
                              localStorage.removeItem('refresh_token');
                              window.location.reload();
                            }}
                          >
                            <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={onLoginClick} 
                      className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#800000] transition-colors"
                    >
                      Login
                    </button>
                    <button 
                      onClick={onSignupClick} 
                      className="px-4 py-2 text-sm font-medium text-white bg-[#800000] hover:bg-[#a83232] rounded-lg transition-colors"
                    >
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
              {/* User menu for mobile */}
              <div className="lg:hidden flex items-center">
                {currentIsLoggedIn && user ? (
                  <button
                    type="button"
                    className="flex rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#800000]"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    {getAvatar()}
                  </button>
                ) : (
                  <button onClick={onLoginClick} className="btn bg-white text-[#800000] border border-[#800000] hover:bg-[#f3eaea] ml-2">Login</button>
                )}
              </div>
              {/* Burger menu */}
              <div className="-mr-2 flex items-center lg:hidden">
                <button
                  type="button"
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <span className="sr-only">Open main menu</span>
                  <svg
                    className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <svg
                    className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Mobile menu (no notification bell here) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  {user ? (
                    getAvatar()
                  ) : (
                    <img className="h-10 w-10 rounded-full" src={'https://ui-avatars.com/api/?name=Admin&color=7F9CF5&background=EBF4FF'} alt="" />
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.first_name || user?.name || 'Dr. Admin'}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.email || 'admin@wmsu.edu.ph'}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Your Profile
                </Link>
                <Link
                  href="/appointments"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Appointments
                </Link>
                <Link
                  href="/patient/profile-setup"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile Setup
                </Link>
                {isIncomingFreshman() && (
                  <Link
                    href="/medical-papers"
                    className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Medical Papers
                  </Link>
                )}
                <button
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    localStorage.removeItem('user');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    window.location.reload();
                  }}
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:order-2">
              <span className="text-sm text-gray-500">
                &copy; {new Date().getFullYear()} WMSU Health Services. All rights reserved.
              </span>
            </div>
            <div className="mt-8 md:mt-0 md:order-1">
              <p className="text-center text-sm text-gray-500">
                Western Mindanao State University
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}