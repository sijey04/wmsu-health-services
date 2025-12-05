import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [user, setUser] = useState<any>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Get user from localStorage and update in real time
  useEffect(() => {
    function syncUser() {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      } else {
        setUser(null);
      }
    }
    syncUser();
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  // Helper to get avatar content
  const getAvatar = () => {
    // Use uploaded profile photo if available
    if (user?.photo) {
      const photoUrl = user.photo.startsWith('http') ? user.photo : `${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000'}${user.photo}`;
      return <Image className="w-8 h-8 rounded-full object-cover" src={photoUrl} alt="Profile" width={32} height={32} />;
    }
    if (user?.profile_picture) {
      return <Image className="w-8 h-8 rounded-full object-cover" src={user.profile_picture} alt="Profile" width={32} height={32} />;
    }
    const letter = user?.first_name?.[0]?.toUpperCase() || user?.name?.[0]?.toUpperCase() || 'A';
    return (
      <span className="w-8 h-8 flex items-center justify-center rounded-full bg-[#800000] text-white font-bold text-sm">
        {letter}
      </span>
    );
  };

  // Helper to get user display name
  const getUserDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.name || user?.username || 'Admin User';
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

  // Sample notifications
  const notifications = [
    { id: 1, message: 'New medical appointment booked', time: '2 mins ago' },
    { id: 2, message: 'Document request approved', time: '10 mins ago' },
    { id: 3, message: 'System update scheduled', time: '1 hour ago' },
  ];

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

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar Navigation */}
      <aside className={`text-[#800000] sticky top-0 h-screen transition-all duration-300 flex flex-col ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Header - Sticky at top */}
        <div className="flex flex-col items-center p-4 pb-4">
          <Image src="/logo.png" alt="WMSU Logo" width={isSidebarCollapsed ? 48 : 80} height={isSidebarCollapsed ? 48 : 80} className="mb-2" />
          <h2 className={`text-xl font-bold text-center transition-all duration-200 ${isSidebarCollapsed ? 'hidden' : ''}`}>WMSU Health Admin</h2>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-4">
            <ul>
              <li className="mb-4">
                <Link href="/admin">
                  <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${
                    router.pathname === '/admin' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                  }`}>
                    <svg className={`w-6 h-6 ${!isSidebarCollapsed ? 'mr-2' : ''} ${router.pathname === '/admin' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    {!isSidebarCollapsed && "Dashboard"}
                  </div>
                </Link>
              </li>
              <li className="mb-4">
                <Link href="/admin/content">
                  <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${
                    router.pathname === '/admin/content' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                  }`}>
                    <svg className={`w-6 h-6 ${!isSidebarCollapsed ? 'mr-2' : ''} ${router.pathname === '/admin/content' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {!isSidebarCollapsed && "Content Management"}
                  </div>
                </Link>
              </li>
              <li className="mb-4">
                <Link href="/admin/dental-consultations">
                  <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${
                    router.pathname === '/admin/dental-consultations' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                  }`}>
                    <svg className={`w-6 h-6 ${!isSidebarCollapsed ? 'mr-2' : ''} ${router.pathname === '/admin/dental-consultations' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    {!isSidebarCollapsed && "Dental Consultations"}
                  </div>
                </Link>
              </li>
              <li className="mb-4">
                <Link href="/admin/medical-consultations">
                  <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${
                    router.pathname === '/admin/medical-consultations' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                  }`}>
                    <svg className={`w-6 h-6 ${!isSidebarCollapsed ? 'mr-2' : ''} ${router.pathname === '/admin/medical-consultations' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    {!isSidebarCollapsed && "Medical Consultations"}
                  </div>
                </Link>
              </li>
              <li className="mb-4">
                <Link href="/admin/medical-documents">
                  <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${
                    router.pathname === '/admin/medical-documents' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                  }`}>
                    <svg className={`w-6 h-6 ${!isSidebarCollapsed ? 'mr-2' : ''} ${router.pathname === '/admin/medical-documents' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {!isSidebarCollapsed && "Medical Documents"}
                  </div>
                </Link>
              </li>
              <li className="mb-4">
                <Link href="/admin/patient-profile">
                  <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${
                    router.pathname === '/admin/patient-profile' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                  }`}>
                    <svg className={`w-6 h-6 ${!isSidebarCollapsed ? 'mr-2' : ''} ${router.pathname === '/admin/patient-profile' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {!isSidebarCollapsed && "Patient Profile"}
                  </div>
                </Link>
              </li>
              <li className="mb-4">
                <Link href="/admin/staff-management">
                  <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${
                    router.pathname === '/admin/staff-management' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                  }`}>
                    <svg className={`w-6 h-6 ${!isSidebarCollapsed ? 'mr-2' : ''} ${router.pathname === '/admin/staff-management' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {!isSidebarCollapsed && "Staff Management"}
                  </div>
                </Link>
              </li>
              <li className="mb-4">
                <Link href="/admin/users">
                  <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${
                    router.pathname === '/admin/users' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                  }`}>
                    <svg className={`w-6 h-6 ${!isSidebarCollapsed ? 'mr-2' : ''} ${router.pathname === '/admin/users' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                    </svg>
                    {!isSidebarCollapsed && "User Management"}
                  </div>
                </Link>
              </li>
              <li className="mb-4">
                <Link href="/admin/controls">
                  <div className={`block py-2 px-4 rounded-lg transition-all duration-200 flex items-center cursor-pointer ${isSidebarCollapsed ? 'justify-center' : ''} ${
                    router.pathname === '/admin/controls' ? 'bg-[#800000] text-white shadow-lg' : 'text-[#800000] hover:bg-[#fbeaec] hover:shadow-md'
                  }`}>
                    <svg className={`w-6 h-6 ${!isSidebarCollapsed ? 'mr-2' : ''} ${router.pathname === '/admin/controls' ? 'text-white' : 'text-[#800000]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                    {!isSidebarCollapsed && "System Controls"}
                  </div>
                </Link>
              </li>
            </ul>
          </nav>

        {/* Logout button - Sticky at bottom */}
        <div className="p-4 pt-2">
          <button
            onClick={handleLogout}
            className="w-full text-left py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center bg-white text-[#800000] border border-[#800000] hover:bg-[#800000] hover:text-white shadow hover:shadow-lg"
          >
            <svg className={`w-6 h-6 ${!isSidebarCollapsed ? 'mr-2' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isSidebarCollapsed && "Logout"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Topbar */}
        <header className="bg-white p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center">
            <button onClick={toggleSidebar} className="text-[#800000] hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isSidebarCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                )}
              </svg>
            </button>
            <div className="text-xl font-bold text-[#800000]"></div>
          </div>
          <div className="flex items-center space-x-6">
            {/* Notification Bell */}
            <div className="relative cursor-pointer group" tabIndex={0} onClick={() => setShowNotifications(v => !v)}>
              <svg className="w-7 h-7 text-[#800000] group-hover:text-[#a83232] transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Red dot for unread notifications */}
              <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-red-500 animate-pulse"></span>
              {/* Notification dropdown */}
              {showNotifications && (
                <div ref={notificationRef} className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fade-in-up">
                  <div className="p-4 border-b font-semibold text-[#800000]">Notifications</div>
                  <ul className="max-h-60 overflow-y-auto">
                    {notifications.map(n => (
                      <li key={n.id} className="px-4 py-3 hover:bg-[#fbeaec] transition-all border-b last:border-b-0">
                        <div className="text-sm text-gray-800">{n.message}</div>
                        <div className="text-xs text-gray-500 mt-1">{n.time}</div>
                      </li>
                    ))}
                  </ul>
                  <div className="p-2 text-center text-xs text-gray-500 cursor-pointer hover:text-[#800000]">View all notifications</div>
                </div>
              )}
            </div>
            {/* User Profile with real user data */}
            <div className="relative group flex items-center cursor-pointer" ref={profileMenuRef} tabIndex={0} onClick={() => setShowProfileMenu(v => !v)}>
              {getAvatar()}
              <div className="ml-2 text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-800">{getUserDisplayName()}</div>
                <div className="text-xs text-gray-500">{getUserEmail()}</div>
              </div>
              <svg className="w-4 h-4 text-gray-500 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 min-w-[11rem] bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-fade-in-up" style={{maxWidth: 'calc(100vw - 1rem)'}}>
                  <div className="px-4 py-3 border-b">
                    <div className="text-sm font-medium text-gray-800">{getUserDisplayName()}</div>
                    <div className="text-xs text-gray-500">{getUserEmail()}</div>
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

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}