import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import ConfirmationModal from '../../components/ConfirmationModal';
import { 
  FaUsers, FaUserSlash, FaSearch, FaFilter, FaEye, FaLock, FaUnlock, 
  FaBan, FaCheck, FaClock, FaUserCheck, FaUserTimes, FaExclamationTriangle,
  FaChevronLeft, FaChevronRight, FaSortAlphaDown, FaSortAlphaUp
} from 'react-icons/fa';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  full_name: string;
  user_type: string;
  is_active: boolean;
  is_email_verified: boolean;
  is_blocked: boolean;
  blocked_at: string;
  blocked_by: number;
  blocked_by_name: string;
  block_reason: string;
  can_book_consultation: boolean;
  date_joined: string;
  last_login: string;
  grade_level: string;
}

interface UserStats {
  total_users: number;
  active_users: number;
  blocked_users: number;
  verified_users: number;
  user_type_counts: {
    student: number;
    staff: number;
    admin: number;
  };
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterVerification, setFilterVerification] = useState('all');
  const [filterConsultation, setFilterConsultation] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'date' | 'email'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockAction, setBlockAction] = useState<'block' | 'unblock'>('block');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedUsers, setPaginatedUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, filterType, filterStatus, filterVerification, filterConsultation, sortField, sortOrder]);

  useEffect(() => {
    applyPagination();
  }, [filteredUsers, currentPage, itemsPerPage]);

  const fetchUsers = async () => {
    try {
      setError(null);
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('No access token found. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api'}/user-management/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch users:', response.status, response.statusText);
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
          // Token might be expired, redirect to login
          window.location.href = '/login';
        } else {
          setError('Failed to fetch users. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Network error. Please check your connection and try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api'}/user-management/get_user_statistics/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch user statistics:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching user statistics:', error);
    }
  };

  const applyFilters = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.grade_level || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // User type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(user => user.user_type === filterType);
    }

    // Status filter
    if (filterStatus !== 'all') {
      switch (filterStatus) {
        case 'active':
          filtered = filtered.filter(user => user.is_active && !user.is_blocked);
          break;
        case 'blocked':
          filtered = filtered.filter(user => user.is_blocked);
          break;
        case 'inactive':
          filtered = filtered.filter(user => !user.is_active);
          break;
      }
    }

    // Email verification filter
    if (filterVerification !== 'all') {
      filtered = filtered.filter(user => 
        filterVerification === 'verified' ? user.is_email_verified : !user.is_email_verified
      );
    }

    // Consultation access filter
    if (filterConsultation !== 'all') {
      filtered = filtered.filter(user => 
        filterConsultation === 'can_book' ? user.can_book_consultation : !user.can_book_consultation
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      let compareValue = 0;
      
      switch (sortField) {
        case 'name':
          const nameA = (a.full_name || a.username || '').toLowerCase();
          const nameB = (b.full_name || b.username || '').toLowerCase();
          compareValue = nameA.localeCompare(nameB);
          break;
        case 'email':
          compareValue = (a.email || '').localeCompare(b.email || '');
          break;
        case 'date':
          const dateA = new Date(a.date_joined || 0).getTime();
          const dateB = new Date(b.date_joined || 0).getTime();
          compareValue = dateA - dateB;
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const applyPagination = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSortChange = (field: 'name' | 'date' | 'email') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setFilterVerification('all');
    setFilterConsultation('all');
    setSortField('date');
    setSortOrder('desc');
  };

  const handleBlockUser = async (reason?: string) => {
    if (!selectedUser) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const endpoint = blockAction === 'block' ? '/user-management/block_user/' : '/user-management/unblock_user/';
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api'}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedUser.id,
          action: blockAction,
          reason: reason || ''
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        fetchUsers();
        fetchUserStats();
        setShowBlockModal(false);
        setSelectedUser(null);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Error updating user status');
    }
  };

  const openBlockModal = (user: User, action: 'block' | 'unblock') => {
    setSelectedUser(user);
    setBlockAction(action);
    setShowBlockModal(true);
  };

  const getUserTypeIcon = (userType: string) => {
    switch (userType) {
      case 'admin':
        return <FaUserCheck className="text-red-500" />;
      case 'staff':
        return <FaUserCheck className="text-blue-500" />;
      case 'student':
        return <FaUsers className="text-green-500" />;
      default:
        return <FaUsers className="text-gray-500" />;
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.is_blocked) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Blocked</span>;
    }
    if (!user.is_active) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Inactive</span>;
    }
    if (!user.is_email_verified) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Unverified</span>;
    }
    return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Active</span>;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#800000]"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center h-64">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 max-w-md">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              fetchUsers();
              fetchUserStats();
            }}
            className="bg-[#800000] text-white px-4 py-2 rounded hover:bg-[#600000]"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
        
          <div className="flex items-center space-x-4">
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
              <div className="flex items-center">
                <FaUsers className="text-blue-500 text-xl sm:text-2xl mr-2 sm:mr-3" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Total Users</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.total_users}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
              <div className="flex items-center">
                <FaUserCheck className="text-green-500 text-xl sm:text-2xl mr-2 sm:mr-3" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Active</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.active_users}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
              <div className="flex items-center">
                <FaUserSlash className="text-red-500 text-xl sm:text-2xl mr-2 sm:mr-3" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Blocked</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.blocked_users}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
              <div className="flex items-center">
                <FaCheck className="text-teal-500 text-xl sm:text-2xl mr-2 sm:mr-3" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Verified</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.verified_users}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
              <div className="flex items-center">
                <FaClock className="text-orange-500 text-xl sm:text-2xl mr-2 sm:mr-3" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-600">Students</p>
                  <p className="text-lg sm:text-2xl font-bold">{stats.user_type_counts.student || 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow">
          <div className="space-y-3 sm:space-y-4">
            {/* Search Bar */}
            <div className="flex items-center">
              <FaSearch className="text-gray-400 mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by name, email, username, or grade level..."
                className="flex-1 border rounded-lg px-3 py-1.5 sm:py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center">
                <FaFilter className="text-gray-400 mr-2 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-gray-700 mr-2">Filters:</span>
              </div>

              <select
                className="flex-1 sm:flex-none border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="student">Students</option>
                <option value="staff">Staff</option>
                <option value="admin">Admins</option>
              </select>

              <select
                className="flex-1 sm:flex-none border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                className="flex-1 sm:flex-none border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
                value={filterVerification}
                onChange={(e) => setFilterVerification(e.target.value)}
              >
                <option value="all">All Verification</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
              </select>

              <select
                className="flex-1 sm:flex-none border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
                value={filterConsultation}
                onChange={(e) => setFilterConsultation(e.target.value)}
              >
                <option value="all">Consultation Access</option>
                <option value="can_book">Can Book</option>
                <option value="cannot_book">Cannot Book</option>
              </select>

              <select
                className="flex-1 sm:flex-none border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as 'name' | 'date' | 'email')}
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="email">Sort by Email</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-50 flex items-center"
                title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              >
                {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
              </button>

              {(searchTerm || filterType !== 'all' || filterStatus !== 'all' || 
                filterVerification !== 'all' || filterConsultation !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="text-xs sm:text-sm text-red-600 hover:text-red-800 underline"
                >
                  Clear Filters
                </button>
              )}
            </div>

            {/* Results Summary */}
            <div className="text-xs sm:text-sm text-gray-600">
              Showing {paginatedUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('name')}
                  >
                    <div className="flex items-center">
                      User
                      {sortField === 'name' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consultation Access
                  </th>
                  <th 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSortChange('date')}
                  >
                    <div className="flex items-center">
                      Joined
                      {sortField === 'date' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <FaUsers className="text-4xl text-gray-300 mb-2" />
                        <p className="text-lg">No users found</p>
                        <p className="text-sm">
                          {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                            ? 'Try adjusting your filters or search terms'
                            : 'No users are registered in the system yet'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getUserTypeIcon(user.user_type)}
                        <div className="ml-3">
                          <div className="text-xs sm:text-sm font-medium text-gray-900">
                            {user.full_name || user.username}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.user_type === 'admin' ? 'bg-red-100 text-red-800' :
                        user.user_type === 'staff' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.user_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user)}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                      {user.can_book_consultation ? (
                        <span className="text-green-600 flex items-center text-xs sm:text-sm">
                          <FaCheck className="mr-1 flex-shrink-0" /> <span className="hidden sm:inline">Can Book</span><span className="sm:hidden">Yes</span>
                        </span>
                      ) : (
                        <span className="text-red-600 flex items-center text-xs sm:text-sm">
                          <FaBan className="mr-1 flex-shrink-0" /> <span className="hidden sm:inline">Blocked</span><span className="sm:hidden">No</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                      <div className="flex space-x-1 sm:space-x-2">
                        {user.user_type !== 'admin' && (
                          <>
                            {user.is_blocked ? (
                              <button
                                onClick={() => openBlockModal(user, 'unblock')}
                                className="text-green-600 hover:text-green-900 flex items-center p-1 rounded hover:bg-green-50"
                                title="Unblock user"
                              >
                                <FaUnlock className="sm:mr-1" /> <span className="hidden sm:inline">Unblock</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => openBlockModal(user, 'block')}
                                className="text-red-600 hover:text-red-900 flex items-center p-1 rounded hover:bg-red-50"
                                title="Block user"
                              >
                                <FaLock className="sm:mr-1" /> <span className="hidden sm:inline">Block</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="bg-gray-50 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of{' '}
                      <span className="font-medium">{filteredUsers.length}</span> results
                    </p>
                  </div>
                  <div>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="border rounded-lg px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#800000]"
                    >
                      <option value={5}>5 per page</option>
                      <option value={10}>10 per page</option>
                      <option value={25}>25 per page</option>
                      <option value={50}>50 per page</option>
                      <option value={100}>100 per page</option>
                    </select>
                  </div>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <FaChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        // Show first page, last page, current page, and pages around current
                        return (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        );
                      })
                      .map((page, index, array) => {
                        // Add ellipsis
                        if (index > 0 && page - array[index - 1] > 1) {
                          return (
                            <React.Fragment key={`ellipsis-${page}`}>
                              <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                ...
                              </span>
                              <button
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  currentPage === page
                                    ? 'z-10 bg-[#800000] border-[#800000] text-white'
                                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-[#800000] border-[#800000] text-white'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <FaChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Block/Unblock Modal */}
        <ConfirmationModal
          open={showBlockModal}
          title={blockAction === 'block' ? 'Block User' : 'Unblock User'}
          message={`Are you sure you want to ${blockAction} ${selectedUser?.full_name || selectedUser?.username}?`}
          onClose={() => {
            setShowBlockModal(false);
            setSelectedUser(null);
          }}
          onConfirm={handleBlockUser}
          showReasonInput={blockAction === 'block'}
          reasonLabel="Reason for blocking (optional)"
          reasonPlaceholder="Enter reason for blocking..."
          confirmText={blockAction === 'block' ? 'Block User' : 'Unblock User'}
          cancelText="Cancel"
          isDestructive={blockAction === 'block'}
        />
      </div>
    </AdminLayout>
  );
}