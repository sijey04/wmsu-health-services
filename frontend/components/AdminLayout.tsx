import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { notificationsAPI } from '../utils/api';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Get user from localStorage and update in real time
  useEffect(() => {
    function syncUser() {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          
            // RBAC Redirection Logic based on the permissions matrix
            if (!parsedUser.is_superuser) {
              const role = (parsedUser.staff_role || parsedUser.user_type || parsedUser.role || '').toLowerCase();
              const isAdmin = role === 'admin';
              const isMedical = ['doctor', 'nurse', 'medical_staff', 'receptionist'].includes(role);
              const isDental = ['dentist', 'dental_staff'].includes(role);

              if (isAdmin) {
                // Admin has access to everything
                return;
              }

              if (isMedical) {
                // Medical staff cannot see Dental Consultations, Staff Management, or System Settings
                const forbiddenPaths = [
                  '/admin/dental-consultations',
                  '/admin/staff-management',
                  '/admin/controls',
                  '/admin/users'
                ];
                if (forbiddenPaths.includes(router.pathname)) {
                  router.push('/admin');
                }
              } else if (isDental) {
                // Dental staff cannot see Medical Consultations, Medical Documents, Staff Management, or System Settings
                const forbiddenPaths = [
                  '/admin/medical-consultations',
                  '/admin/medical-documents',
                  '/admin/staff-management',
                  '/admin/controls',
                  '/admin/users'
                ];
                if (forbiddenPaths.includes(router.pathname)) {
                  router.push('/admin');
                }
              } else if (!parsedUser.is_staff) {
                // Not staff at all, send to public home
                router.push('/');
              }
            }
        } catch (e) {
          console.error('Error parsing user data:', e);
          setUser(null);
          router.push('/login');
        }
      } else {
        setUser(null);
        router.push('/login');
      }
    }
    syncUser();
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, [router]);

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

  // Helper to get avatar content
  const getAvatar = () => {
    // Use uploaded profile photo if available
    if (user?.photo) {
      const photoUrl = normalizePhotoUrl(user.photo);
      return <img className="w-8 h-8 rounded-full object-cover" src={photoUrl} alt="Profile" />;
    }
    if (user?.profile_picture) {
      const photoUrl = normalizePhotoUrl(user.profile_picture);
      return <img className="w-8 h-8 rounded-full object-cover" src={photoUrl} alt="Profile" />;
    }
    const letter = user?.first_name?.[0]?.toUpperCase() || user?.last_name?.[0]?.toUpperCase() || 'A';
    return (
      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#800000] text-white font-bold text-sm">
        {letter}
      </span>
    );
  };

  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.last_name || user?.username || 'Admin User';
  };

  // Helper to get user email
  const getUserEmail = () => {
    return user?.email || 'admin@wmsu.edu.ph';
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/login');
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router.pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Real notifications from backend
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getNotificationToken = () => {
    return localStorage.getItem('access_token') || localStorage.getItem('token') || localStorage.getItem('accessToken');
  };

  // Fetch notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Set up polling for new notifications
      const interval = setInterval(fetchNotifications, 60000); // Every minute
      return () => clearInterval(interval);
    }
  }, [user]);

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

  // Close profile menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

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

  // RBAC Helper: Check if user has permission to see a link
  const canSee = (link: string) => {
    if (!user) return false;
    
    // Normalize role to lowercase for case-insensitive comparison
    const role = (user.staff_role || user.user_type || user.role || '').toLowerCase();
    const isSuperuser = !!user.is_superuser;
    const isAdmin = role === 'admin' || isSuperuser; // Admin role or superuser has full access
    
    // Admins and superusers see everything
    if (isAdmin) return true;

    // Group permissions for other staff based on the provided permissions matrix
    const isMedical = ['doctor', 'nurse', 'medical_staff', 'receptionist'].includes(role);
    const isDental = ['dentist', 'dental_staff'].includes(role);

    switch (link) {
      case 'dashboard':
        return true;
      case 'appointments':
        return isMedical || isDental;
      case 'content':
        return false; // Only admin (handled above)
      case 'dental':
        return isDental;
      case 'medical':
        return isMedical;
      case 'documents':
        return isMedical; // Document verification is medical staff (doctor/nurse) only according to matrix
      case 'profiles':
        return true; // All staff (Dentist, Doctor/Nurse, Admin) can see profiles according to matrix
      case 'staff':
        return false; // Only admin (handled above)
      case 'users':
        return false; // Only admin (handled above)
      case 'controls':
        return false; // Only admin (handled above)
      default:
        return false;
    }
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <aside 
        ref={sidebarRef}
        className={`text-[#800000] bg-white border-r border-gray-200 h-screen transition-all duration-300 flex flex-col z-50
          ${isMobileMenuOpen ? 'fixed left-0 w-64' : 'fixed -left-64 w-64'}
          lg:sticky lg:left-0 lg:top-0 ${isSidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Header - Sticky at top */}
        <div className="flex flex-col items-center p-4 pb-4 border-b border-gray-100">
          <div className="flex flex-col items-center justify-center">
            <img 
              src="/WMSU-HealthLogo.png" 
              alt="Health Services Logo" 
              className={`transition-all duration-300 object-contain ${isSidebarCollapsed ? 'w-10 h-10' : 'w-16 h-16 mb-2'}`}
            />
            {!isSidebarCollapsed && (
              <div className="text-center transition-all duration-300">
                <h1 className="text-[#800000] font-bold text-[11px] leading-tight uppercase">Western Mindanao</h1>
                <p className="text-gray-500 text-[9px] font-medium uppercase tracking-tighter">State University</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4">
            <ul className="space-y-2">
              {canSee('dashboard') && (
                <li>
                  <Link href="/admin">
                    <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : ''} ${
                      router.pathname === '/admin' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                    }`}>
                      <svg className={`w-6 h-6 ${!(isSidebarCollapsed && !isMobileMenuOpen) ? 'mr-2' : ''} ${router.pathname === '/admin' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      {!(isSidebarCollapsed && !isMobileMenuOpen) && "Dashboard"}
                    </div>
                  </Link>
                </li>
              )}

           

            

              {canSee('dental') && (
                <li>
                  <Link href="/admin/dental-consultations">
                    <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : ''} ${
                      router.pathname === '/admin/dental-consultations' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                    }`}>
                      <svg className={`w-6 h-6 ${!(isSidebarCollapsed && !isMobileMenuOpen) ? 'mr-2' : ''} ${router.pathname === '/admin/dental-consultations' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      {!(isSidebarCollapsed && !isMobileMenuOpen) && "Dental Consultations"}
                    </div>
                  </Link>
                </li>
              )}

              {canSee('medical') && (
                <li>
                  <Link href="/admin/medical-consultations">
                    <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : ''} ${
                      router.pathname === '/admin/medical-consultations' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                    }`}>
                      <svg className={`w-6 h-6 ${!(isSidebarCollapsed && !isMobileMenuOpen) ? 'mr-2' : ''} ${router.pathname === '/admin/medical-consultations' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {!(isSidebarCollapsed && !isMobileMenuOpen) && "Medical Consultations"}
                    </div>
                  </Link>
                </li>
              )}

              {canSee('documents') && (
                <li>
                  <Link href="/admin/medical-documents">
                    <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : ''} ${
                      router.pathname === '/admin/medical-documents' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                    }`}>
                      <svg className={`w-6 h-6 ${!(isSidebarCollapsed && !isMobileMenuOpen) ? 'mr-2' : ''} ${router.pathname === '/admin/medical-documents' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {!(isSidebarCollapsed && !isMobileMenuOpen) && "Medical Documents"}
                    </div>
                  </Link>
                </li>
              )}

              {canSee('profiles') && (
                <li>
                  <Link href="/admin/patient-profile">
                    <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : ''} ${
                      router.pathname === '/admin/patient-profile' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                    }`}>
                      <svg className={`w-6 h-6 ${!(isSidebarCollapsed && !isMobileMenuOpen) ? 'mr-2' : ''} ${router.pathname === '/admin/patient-profile' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {!(isSidebarCollapsed && !isMobileMenuOpen) && "Patient Profile"}
                    </div>
                  </Link>
                </li>
              )}

              {canSee('staff') && (
                <li>
                  <Link href="/admin/staff-management">
                    <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : ''} ${
                      router.pathname === '/admin/staff-management' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                    }`}>
                      <svg className={`w-6 h-6 ${!(isSidebarCollapsed && !isMobileMenuOpen) ? 'mr-2' : ''} ${router.pathname === '/admin/staff-management' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {!(isSidebarCollapsed && !isMobileMenuOpen) && "Staff Management"}
                    </div>
                  </Link>
                </li>
              )}

              {canSee('users') && (
                <li>
                  <Link href="/admin/users">
                    <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : ''} ${
                      router.pathname === '/admin/users' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                    }`}>
                      <svg className={`w-6 h-6 ${!(isSidebarCollapsed && !isMobileMenuOpen) ? 'mr-2' : ''} ${router.pathname === '/admin/users' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      {!(isSidebarCollapsed && !isMobileMenuOpen) && "User Management"}
                    </div>
                  </Link>
                </li>
              )}

              {canSee('controls') && (
                <li>
                  <Link href="/admin/controls">
                    <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed && !isMobileMenuOpen ? 'justify-center' : ''} ${
                      router.pathname === '/admin/controls' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                    }`}>
                      <svg className={`w-6 h-6 ${!(isSidebarCollapsed && !isMobileMenuOpen) ? 'mr-2' : ''} ${router.pathname === '/admin/controls' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                      {!(isSidebarCollapsed && !isMobileMenuOpen) && "System Controls"}
                    </div>
                  </Link>
                </li>
              )}
            </ul>
          </nav>

        {/* Logout button - Sticky at bottom */}
        <div className="p-4 pt-2">
          <button
            onClick={handleLogout}
            className="w-full text-left py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center bg-white text-[#800000] border border-[#800000] hover:bg-[#800000] hover:text-white shadow hover:shadow-lg"
          >
            <svg className={`w-6 h-6 ${!(isSidebarCollapsed && !isMobileMenuOpen) ? 'mr-2' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!(isSidebarCollapsed && !isMobileMenuOpen) && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white w-full lg:w-auto">
        {/* Topbar */}
        <header className="bg-white p-4 flex justify-between items-center sticky top-0 z-10 border-b border-gray-200">
          <div className="flex items-center">
            {/* Mobile Menu Button (visible on small screens) */}
            <button 
              onClick={toggleMobileMenu} 
              className="text-[#800000] hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200 lg:hidden mr-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Desktop Collapse Button (hidden on small screens) */}
            <button 
              onClick={toggleSidebar} 
              className="text-[#800000] hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200 hidden lg:block"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>
            <div className="text-lg sm:text-xl font-bold text-[#800000]">
              {/* Optional: Add page title here */}
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-6">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(v => !v)}
                className="relative p-1.5 sm:p-2 text-gray-500 hover:text-[#800000] transition-colors duration-200"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-[#800000]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[#800000] rounded-full text-[10px] text-white flex items-center justify-center font-medium shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>
              {/* Notification dropdown */}
              {showNotifications && (
                <div
                  ref={notificationRef}
                  onClick={(event) => event.stopPropagation()}
                  className="fixed sm:absolute inset-x-0 sm:inset-x-auto top-16 sm:top-auto sm:right-0 mt-0 sm:mt-2 mx-3 sm:mx-0 w-auto sm:w-80 bg-white border border-gray-200 rounded-lg shadow-2xl z-50 max-h-[calc(100vh-5rem)] sm:max-h-96 overflow-hidden animate-fade-in-up"
                >
                  <div className="p-3 sm:p-3 border-b border-gray-100 bg-gradient-to-r from-[#800000] to-[#a83232]">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-white text-sm sm:text-base">Notifications</h3>
                      {unreadCount > 0 && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleMarkAllAsRead(); }}
                          className="text-[10px] text-white/90 bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition-all font-medium border border-white/10"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                  </div>
                  <ul className="max-h-60 sm:max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <li className="px-4 py-12 text-center text-gray-500 text-sm">
                        <svg className="w-12 h-12 mx-auto text-gray-200 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        No notifications yet
                      </li>
                    ) : (
                      notifications.map(n => (
                        <li 
                          key={n.id} 
                          onClick={() => { if (!n.is_read) handleMarkAsRead(n.id); if (n.link) router.push(n.link); setShowNotifications(false); }}
                          className={`group px-4 py-3 hover:bg-[#fbeaec] transition-all cursor-pointer ${!n.is_read ? 'bg-blue-50/40 relative overflow-hidden' : ''}`}
                        >
                          {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#800000]"></div>}
                          <div className={`text-sm ${!n.is_read ? 'text-[#800000] font-bold' : 'text-gray-700'}`}>{n.message}</div>
                          <div className="flex items-center mt-1 space-x-2">
                            <span className="text-[10px] text-gray-400">{formatTime(n.created_at)}</span>
                            {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-[#800000]"></span>}
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                  <div className="p-2.5 text-center border-t border-gray-50 bg-gray-50/50">
                    <button className="text-xs font-semibold text-[#800000] hover:text-[#a83232] transition-colors">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* User Profile with real user data */}
            <div className="relative group flex items-center cursor-pointer" ref={profileMenuRef} tabIndex={0} onClick={() => setShowProfileMenu(v => !v)}>
              {getAvatar()}
              <div className="ml-2 text-right hidden md:block">
                <div className="text-sm font-medium text-gray-800">{getUserDisplayName()}</div>
                <div className="text-xs text-gray-500">{getUserEmail()}</div>
              </div>
              <svg className="w-4 h-4 text-gray-500 ml-1 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 min-w-[11rem] bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fade-in-up" style={{maxWidth: 'calc(100vw - 1rem)'}}>
                  <div className="px-4 py-3 border-b">
                    <div className="text-sm font-medium text-gray-800 break-words">{getUserDisplayName()}</div>
                    <div className="text-xs text-gray-500 break-all">{getUserEmail()}</div>
                    {user?.user_type && (
                      <div className="text-xs text-[#800000] font-medium capitalize">{user.user_type}</div>
                    )}
                  </div>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-[#fbeaec] transition-all text-sm text-[#800000]"
                    onClick={() => { setShowProfileMenu(false); router.push('/admin/account-settings'); }}
                  >
                    Profile
                  </button>
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-[#fbeaec] transition-all text-sm text-[#800000]"
                    onClick={() => { setShowProfileMenu(false); handleLogout(); }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}