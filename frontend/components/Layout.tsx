import React, { ReactNode, useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { notificationsAPI } from '../utils/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

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
  // Real notifications from backend
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  const getNotificationToken = () => {
    return localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('accessToken');
  };

  const normalizePhotoUrl = (photoUrl: string) => {
    let url = photoUrl;
    if (!url) return url;

    if (!url.startsWith('http') && !url.startsWith('blob:') && !url.startsWith('data:')) {
      const base = (process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api').replace('/api', '');
      url = `${base}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }

    return url;
  };

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
        try {
          setUser(JSON.parse(userData));
          setIsLoggedIn(true);
        } catch (e) {
          console.error('Error parsing user data:', e);
          setUser(null);
          setIsLoggedIn(false);
        }
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
    }
    syncUser();
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  // Fetch notifications
  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
      // Set up polling for new notifications
      const interval = setInterval(fetchNotifications, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchNotifications = async () => {
    const token = getNotificationToken();
    if (!token) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    try {
      const response = await notificationsAPI.getAll();
      const data = response.data.results || response.data;
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationLink = (notification: any) => {
    const message = (notification?.message || '').toLowerCase();
    const routeToAppointments =
      message.includes('medical certificate') ||
      message.includes('medical documents') ||
      message.includes('advised for consultation');

    if (routeToAppointments) {
      return '/appointments';
    }

    return notification?.link || '';
  };

  const formatTime = (dateString: string) => {
    try {
      return dayjs(dateString).fromNow();
    } catch (e) {
      return 'just now';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  useEffect(() => {
    if (showNotifications) {
      fetchNotifications();
    }
  }, [showNotifications]);

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
      const photoUrl = normalizePhotoUrl(user.photo);
      return <img className="h-8 w-8 rounded-full object-cover" src={photoUrl} alt="Profile" />;
    }
    if (user?.profile_picture) {
      const photoUrl = normalizePhotoUrl(user.profile_picture);
      return <img className="h-8 w-8 rounded-full object-cover" src={photoUrl} alt="Profile" />;
    }
    const letter = user?.first_name?.[0]?.toUpperCase() || user?.last_name?.[0]?.toUpperCase() || '?';
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
        <link rel="icon" href="/WMSU-Logo.jpg" />
      </Head>

      <header className="bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex justify-between h-16 sm:h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center group">
                <Link href="/" className="flex items-center space-x-2 sm:space-x-3 hover:scale-105 transition-transform duration-300">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                        <img 
                          src="/WMSU-Logo.jpg" 
                          alt="WMSU Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
                        <img 
                          src="/WMSU-HealthLogo.png" 
                          alt="Health Services Logo" 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="hidden sm:block">
                      <h1 className="font-bold text-lg sm:text-xl bg-gradient-to-r from-[#800000] to-[#a83232] bg-clip-text text-transparent">
                        WMSU Health Services
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">Your Health, Our Priority</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
            {/* Minimalistic Notification Bell and User Menu */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Larger Notification Bell */}
              <div className="relative" tabIndex={0}>
                <button
                  onClick={() => setShowNotifications(v => !v)}
                  className="relative p-1.5 sm:p-2 text-gray-500 hover:text-[#800000] transition-colors duration-200"
                >
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#800000] rounded-full text-xs text-white flex items-center justify-center font-medium">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && (
                  <div
                    ref={notificationRef}
                    onClick={(event) => event.stopPropagation()}
                    className="fixed sm:absolute inset-x-0 sm:inset-x-auto top-16 sm:top-auto sm:right-0 mt-0 sm:mt-2 mx-3 sm:mx-0 w-auto sm:w-80 bg-white border border-gray-200 rounded-lg shadow-2xl z-50 max-h-[calc(100vh-5rem)] sm:max-h-96 overflow-hidden"
                  >
                    <div className="p-3 sm:p-3 border-b border-gray-100 bg-gradient-to-r from-[#800000] to-[#a83232]">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-white text-sm sm:text-base">Notifications</h3>
                        <div className="flex items-center space-x-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }}
                              className="text-[10px] text-white/90 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors"
                            >
                              Mark all read
                            </button>
                          )}
                          <span className="text-xs text-white/90 bg-white/20 px-2 py-0.5 rounded-full">{unreadCount} new</span>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-[calc(100vh-12rem)] sm:max-h-64">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n, index) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.is_read) handleMarkAsRead(n.id);
                              const targetLink = getNotificationLink(n);
                              if (targetLink) router.push(targetLink);
                            }}
                            className={`p-3 sm:p-3 hover:bg-gray-50 transition-all duration-200 cursor-pointer group ${index === notifications.length - 1 ? '' : 'border-b border-gray-100'} ${!n.is_read ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors ${!n.is_read ? 'bg-[#800000]/20' : 'bg-gray-100 group-hover:bg-gray-200'}`}>
                                  <svg className={`w-4 h-4 sm:w-5 sm:h-5 ${!n.is_read ? 'text-[#800000]' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                  </svg>
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs sm:text-sm transition-colors line-clamp-2 ${!n.is_read ? 'text-gray-900 font-bold group-hover:text-[#800000]' : 'text-gray-600'}`}>{n.message}</p>
                                <p className="text-xs text-gray-500 mt-1 flex items-center">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  {formatTime(n.created_at)}
                                </p>
                              </div>
                              {!n.is_read && (
                                <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2 animate-pulse"></div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
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
                            Personal Information
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
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <button
                      onClick={onLoginClick}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 hover:text-[#800000] transition-colors"
                    >
                      Login
                    </button>
                    <button
                      onClick={onSignupClick}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-white bg-[#800000] hover:bg-[#a83232] rounded-lg transition-colors"
                    >
                      Sign Up
                    </button>
                  </div>
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
            <div className="pt-3 sm:pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-3 sm:px-4">
                <div className="flex-shrink-0">
                  {user ? (
                    getAvatar()
                  ) : (
                    <Image className="h-10 w-10 rounded-full" src={'https://ui-avatars.com/api/?name=Admin&color=7F9CF5&background=EBF4FF'} alt="" width={40} height={40} />
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-sm sm:text-base font-medium text-gray-800">
                    {user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Dr. Admin' : 'Dr. Admin'}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-gray-500">{user?.email || 'admin@wmsu.edu.ph'}</div>
                </div>
              </div>
              <div className="mt-2 sm:mt-3 space-y-1">
                <Link
                  href="/profile"
                  className="block px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Your Profile
                </Link>
                <Link
                  href="/appointments"
                  className="block px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Appointments
                </Link>
                <Link
                  href="/patient/profile-setup"
                  className="block px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile Setup
                </Link>

                <button
                  className="block w-full text-left px-3 sm:px-4 py-2 text-sm sm:text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
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

      <footer className="bg-white border-t border-gray-200 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:order-2">
              <span className="text-xs sm:text-sm text-gray-500">
                &copy; {new Date().getFullYear()} WMSU Health Services. All rights reserved.
              </span>
            </div>
            <div className="mt-4 sm:mt-8 md:mt-0 md:order-1">
              <p className="text-center text-xs sm:text-sm text-gray-500">
                Western Mindanao State University
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}