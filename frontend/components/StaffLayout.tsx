import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';

interface StaffLayoutProps {
  children: ReactNode;
  staffType: 'medical' | 'dental';
}

export default function StaffLayout({ children, staffType }: StaffLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      
      // Check if user is staff
      if (!parsedUser.is_staff && !parsedUser.is_superuser) {
        router.push('/');
        return;
      }

      setUser(parsedUser);
    } catch (error) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8B1538]"></div>
      </div>
    );
  }

  const staffTitle = staffType === 'medical' ? 'Medical Staff' : 'Dental Staff';
  const dashboardPath = `/staff/${staffType}`;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-[#8B1538] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Image src="/logo.png" alt="WMSU Logo" width={40} height={40} className="mr-3" />
              <div>
                <h1 className="text-xl font-bold">WMSU Health Services</h1>
                <p className="text-xs text-pink-100">{staffTitle} Portal</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user.first_name} {user.last_name}</p>
                <p className="text-xs text-pink-100">{staffTitle}</p>
              </div>
              <button
                onClick={handleLogout}
                className="bg-white text-[#8B1538] px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
