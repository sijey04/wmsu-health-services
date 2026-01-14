import { useState, useEffect, useMemo } from 'react';
import AdminLayout from '../../components/AdminLayout';
import withAdminAccess from '../../components/withAdminAccess';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, UserIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { FaSortAlphaDown, FaSortAlphaUp } from 'react-icons/fa';
import { djangoApiClient } from '../../utils/api';
import ConfirmationModal from '../../components/ConfirmationModal';
import FeedbackModal from '../../components/feedbackmodal';

interface Staff {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  date_joined: string;
  role: string;
  campuses: string[];
  phone_number?: string;
}

interface StaffFormData {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  confirm_password: string;
  role: string;
  campuses: string[];
  phone_number: string;
}

function AdminStaffManagement() {
  const [activeTab, setActiveTab] = useState('staffList');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterCampus, setFilterCampus] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'email' | 'role' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedStaff, setPaginatedStaff] = useState<Staff[]>([]);

  // Form state
  const [formData, setFormData] = useState<StaffFormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    confirm_password: '',
    role: '',
    campuses: [],
    phone_number: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<StaffFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  // Modal states
  const [confirmationModal, setConfirmationModal] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDestructive: false,
  });
  const [feedbackModal, setFeedbackModal] = useState({ open: false, message: '' });

  // Role and department options - dynamically loaded from backend
  const [roleOptions, setRoleOptions] = useState<Array<{value: string, label: string}>>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Campus options
  const campusOptions = [
    { value: 'a', label: 'Campus A' },
    { value: 'b', label: 'Campus B' },
    { value: 'c', label: 'Campus C' }
  ];

  const fetchStaffRoles = async () => {
    setLoadingRoles(true);
    try {
      // Fetch staff roles from medical staff schedules or dedicated endpoint
      const response = await djangoApiClient.get('/admin-controls/staff-roles/');
      if (response.data && Array.isArray(response.data)) {
        setRoleOptions(response.data.map((role: any) => ({
          value: role.value || role.name.toLowerCase().replace(/\s+/g, '_'),
          label: role.label || role.name
        })));
      }
    } catch (error: any) {
      console.warn('Failed to fetch staff roles from backend, using defaults:', error);
      // Fallback to default roles if API fails
      setRoleOptions([
        { value: 'admin', label: 'Administrator' },
        { value: 'medical_staff', label: 'Medical Staff' },
        { value: 'doctor', label: 'Doctor' },
        { value: 'nurse', label: 'Nurse' },
        { value: 'dentist', label: 'Dentist' },
        { value: 'dental_staff', label: 'Dental Staff' },
        { value: 'staff', label: 'General Staff' },
        { value: 'receptionist', label: 'Receptionist' }
      ]);
    } finally {
      setLoadingRoles(false);
    }
  };

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await djangoApiClient.get('/staff-management/');
      setStaff(response.data);
    } catch (error: any) {
      console.error('Failed to fetch staff:', error);
      setError('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<StaffFormData> = {};

    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.first_name.trim()) errors.first_name = 'First name is required';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
    if (!formData.role) errors.role = 'Role is required';
    if (!formData.campuses || formData.campuses.length === 0) (errors as any).campuses = 'At least one campus is required';
    
    if (!editingStaff) {
      if (!formData.password) errors.password = 'Password is required';
      if (formData.password.length < 8) errors.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.confirm_password) {
        errors.confirm_password = 'Passwords do not match';
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const submitData = {
        username: formData.username,
        email: formData.email,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        campuses: formData.campuses,
        phone_number: formData.phone_number || null,
        ...(formData.password && { password: formData.password })
      };

      if (editingStaff) {
        await djangoApiClient.put(`/staff-management/${editingStaff.id}/`, submitData);
        setFeedbackModal({ open: true, message: 'Staff member updated successfully!' });
      } else {
        await djangoApiClient.post('/staff-management/', submitData);
        setFeedbackModal({ open: true, message: 'Staff member created successfully!' });
      }

      resetForm();
      setActiveTab('staffList');
      fetchStaff();
    } catch (error: any) {
      console.error('Failed to save staff:', error);
      console.error('Error response:', error.response?.data);
      
      let errorMessage = 'Failed to save staff member';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle field-specific errors
        if (errorData.username) {
          errorMessage = `Username: ${Array.isArray(errorData.username) ? errorData.username.join(', ') : errorData.username}`;
        } else if (errorData.email) {
          errorMessage = `Email: ${Array.isArray(errorData.email) ? errorData.email.join(', ') : errorData.email}`;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          // Show first error found
          const firstErrorKey = Object.keys(errorData)[0];
          if (firstErrorKey && errorData[firstErrorKey]) {
            const firstError = errorData[firstErrorKey];
            errorMessage = `${firstErrorKey}: ${Array.isArray(firstError) ? firstError.join(', ') : firstError}`;
          }
        }
      }
      
      setFeedbackModal({ open: true, message: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
      confirm_password: '',
      role: '',
      campuses: [],
      phone_number: ''
    });
    setFormErrors({});
    setEditingStaff(null);
  };

  const handleEdit = (staffMember: Staff) => {
    setEditingStaff(staffMember);
    setFormData({
      username: staffMember.username,
      email: staffMember.email,
      first_name: staffMember.first_name,
      last_name: staffMember.last_name,
      password: '',
      confirm_password: '',
      role: staffMember.role,
      campuses: staffMember.campuses || ['a'],
      phone_number: staffMember.phone_number || ''
    });
    setActiveTab('createStaff');
  };

  const handleDelete = async (staffId: number) => {
    try {
      await djangoApiClient.delete(`/staff-management/${staffId}/`);
      setFeedbackModal({ open: true, message: 'Staff member deleted successfully!' });
      fetchStaff();
    } catch (error: any) {
      console.error('Failed to delete staff:', error);
      setFeedbackModal({ open: true, message: 'Failed to delete staff member' });
    }
  };

  const openDeleteConfirmation = (staffMember: Staff) => {
    setConfirmationModal({
      open: true,
      title: 'Delete Staff Member',
      message: `Are you sure you want to delete ${staffMember.first_name} ${staffMember.last_name}? This action cannot be undone.`,
      onConfirm: () => handleDelete(staffMember.id),
      isDestructive: true,
    });
  };

  const toggleStaffStatus = async (staffMember: Staff) => {
    try {
      await djangoApiClient.patch(`/staff-management/${staffMember.id}/`, {
        is_active: !staffMember.is_active
      });
      setFeedbackModal({ 
        open: true, 
        message: `Staff member ${staffMember.is_active ? 'deactivated' : 'activated'} successfully!` 
      });
      fetchStaff();
    } catch (error: any) {
      console.error('Failed to update staff status:', error);
      setFeedbackModal({ open: true, message: 'Failed to update staff status' });
    }
  };

  useEffect(() => {
    fetchStaffRoles();
    fetchStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    return staff.filter(staffMember => {
      const matchesSearch = `${staffMember.first_name} ${staffMember.last_name} ${staffMember.username} ${staffMember.email} ${staffMember.phone_number || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesRole = !filterRole || staffMember.role === filterRole;
      const matchesCampus = !filterCampus || (staffMember.campuses && staffMember.campuses.includes(filterCampus));
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'active' && staffMember.is_active) || 
        (filterStatus === 'inactive' && !staffMember.is_active);
      return matchesSearch && matchesRole && matchesCampus && matchesStatus;
    }).sort((a, b) => {
      let compareValue = 0;
      
      switch (sortField) {
        case 'name':
          const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
          const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
          compareValue = nameA.localeCompare(nameB);
          break;
        case 'email':
          compareValue = (a.email || '').localeCompare(b.email || '');
          break;
        case 'role':
          compareValue = (a.role || '').localeCompare(b.role || '');
          break;
        case 'date':
          const dateA = new Date(a.date_joined || 0).getTime();
          const dateB = new Date(b.date_joined || 0).getTime();
          compareValue = dateA - dateB;
          break;
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue;
    });
  }, [staff, searchTerm, filterRole, filterCampus, filterStatus, sortField, sortOrder]);

  const totalPages = useMemo(() => Math.ceil(filteredStaff.length / itemsPerPage), [filteredStaff.length, itemsPerPage]);

  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedStaff(filteredStaff.slice(startIndex, endIndex));
  }, [filteredStaff, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSortChange = (field: 'name' | 'email' | 'role' | 'date') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterRole('');
    setFilterCampus('');
    setFilterStatus('all');
    setSortField('date');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const renderStaffList = () => (
    <div>
      <div className="bg-white rounded-lg shadow p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="space-y-3 sm:space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name, email, username, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg pl-8 sm:pl-10 pr-4 py-1.5 sm:py-2 text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
            />
            <svg
              className="absolute left-2 sm:left-3 top-2 sm:top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
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

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-medium text-gray-700">Filters:</span>
            
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
            >
              <option value="">All Roles</option>
              {roleOptions.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
            
            <select
              value={filterCampus}
              onChange={(e) => setFilterCampus(e.target.value)}
              className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
            >
              <option value="">All Campuses</option>
              {campusOptions.map(campus => (
                <option key={campus.value} value={campus.value}>{campus.label}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as 'name' | 'email' | 'role' | 'date')}
              className="flex-1 sm:flex-none border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
            >
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="email">Sort by Email</option>
              <option value="role">Sort by Role</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm hover:bg-gray-50 flex items-center"
              title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortOrder === 'asc' ? <FaSortAlphaDown /> : <FaSortAlphaUp />}
            </button>

            {(searchTerm || filterRole || filterCampus || filterStatus !== 'all') && (
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
            Showing {paginatedStaff.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, filteredStaff.length)} of {filteredStaff.length} staff members
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
        {loading ? (
          <div className="text-center p-6">Loading...</div>
        ) : error ? (
          <div className="text-center p-6 text-red-500">{error}</div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center p-6">No staff members found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#800000]">
              <tr>
                <th 
                  className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#600000]"
                  onClick={() => handleSortChange('name')}
                >
                  <div className="flex items-center">
                    Name
                    {sortField === 'name' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#600000]"
                  onClick={() => handleSortChange('email')}
                >
                  <div className="flex items-center">
                    Email
                    {sortField === 'email' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#600000]"
                  onClick={() => handleSortChange('role')}
                >
                  <div className="flex items-center">
                    Role
                    {sortField === 'role' && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </div>
                </th>
                <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Assigned Campuses</th>
                <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                <th className="px-3 sm:px-6 py-2 sm:py-4 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedStaff.map((staffMember) => (
                <tr key={staffMember.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-[#800000] flex items-center justify-center">
                          <UserIcon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-xs sm:text-sm font-medium text-gray-900">
                          {staffMember.first_name} {staffMember.last_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {staffMember.phone_number || 'No phone'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {staffMember.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {roleOptions.find(r => r.value === staffMember.role)?.label || staffMember.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex flex-wrap gap-1">
                      {(staffMember.campuses || ['a']).map(campusCode => {
                        const campus = campusOptions.find(c => c.value === campusCode);
                        return (
                          <span key={campusCode} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                            {campus?.label || campusCode}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      staffMember.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {staffMember.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={() => handleEdit(staffMember)}
                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded-full hover:bg-indigo-100"
                        title="Edit"
                      >
                        <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={() => toggleStaffStatus(staffMember)}
                        className={`p-1 rounded-full ${
                          staffMember.is_active 
                            ? 'text-red-600 hover:text-red-900 hover:bg-red-100' 
                            : 'text-green-600 hover:text-green-900 hover:bg-green-100'
                        }`}
                        title={staffMember.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {staffMember.is_active ? (
                          <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        ) : (
                          <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => openDeleteConfirmation(staffMember)}
                        className="text-red-600 hover:text-red-900 p-1 rounded-full hover:bg-red-100"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {filteredStaff.length > 0 && (
        <div className="bg-gray-50 px-3 sm:px-6 py-2 sm:py-3 flex items-center justify-between border-t border-gray-200 mt-4">
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
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredStaff.length)}</span> of{' '}
                  <span className="font-medium">{filteredStaff.length}</span> results
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
                  <ChevronLeftIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    );
                  })
                  .map((page, index, array) => {
                    if (index > 0 && page - array[index - 1] > 1) {
                      return (
                        <span key={`ellipsis-${page}`} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                          ...
                        </span>
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
                  <ChevronRightIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCreateStaffForm = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {editingStaff ? 'Edit Staff Member' : 'Create New Staff Account'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                First Name *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                className={`w-full px-3 py-1.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none ${
                  formErrors.first_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter first name"
              />
              {formErrors.first_name && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{formErrors.first_name}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                className={`w-full px-3 py-1.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none ${
                  formErrors.last_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter last name"
              />
              {formErrors.last_name && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{formErrors.last_name}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              className={`w-full px-3 py-1.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none ${
                formErrors.username ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter username"
            />
            {formErrors.username && (
              <p className="mt-1 text-xs sm:text-sm text-red-600">{formErrors.username}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className={`w-full px-3 py-1.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none ${
                formErrors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
            />
            {formErrors.email && (
              <p className="mt-1 text-xs sm:text-sm text-red-600">{formErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone_number}
              onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
              className="w-full px-3 py-1.5 sm:py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none"
              placeholder="Enter phone number"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className={`w-full px-3 py-1.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none ${
                  formErrors.role ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={loadingRoles}
              >
                <option value="">{loadingRoles ? 'Loading roles...' : 'Select a role'}</option>
                {roleOptions.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
              {formErrors.role && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{formErrors.role}</p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Assigned Campuses *
              </label>
              <div className="space-y-2">
                {campusOptions.map(campus => (
                  <label key={campus.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.campuses.includes(campus.value)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({...formData, campuses: [...formData.campuses, campus.value]});
                        } else {
                          setFormData({...formData, campuses: formData.campuses.filter(c => c !== campus.value)});
                        }
                      }}
                      className="h-4 w-4 text-[#800000] focus:ring-[#800000] border-gray-300 rounded"
                    />
                    <span className="ml-2 text-xs sm:text-sm text-gray-700">{campus.label}</span>
                  </label>
                ))}
              </div>
              {(formErrors as any).campuses && (
                <p className="mt-1 text-xs sm:text-sm text-red-600">{(formErrors as any).campuses}</p>
              )}
            </div>
          </div>

          {!editingStaff && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`w-full px-3 py-1.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none ${
                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter password"
                />
                {formErrors.password && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{formErrors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                  className={`w-full px-3 py-1.5 sm:py-2 text-sm border rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-[#800000] outline-none ${
                    formErrors.confirm_password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Confirm password"
                />
                {formErrors.confirm_password && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{formErrors.confirm_password}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-0 sm:space-x-4">
            <button
              type="button"
              onClick={() => {
                resetForm();
                setActiveTab('staffList');
              }}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-4 py-2 bg-[#800000] text-white text-sm rounded-lg hover:bg-[#600000] transition-colors duration-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (editingStaff ? 'Update Staff' : 'Create Staff')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage staff accounts and permissions</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              <button
                className={`py-2 px-3 sm:py-3 sm:px-6 text-sm sm:text-lg font-medium transition-all duration-200 focus:outline-none whitespace-nowrap ${
                  activeTab === 'staffList'
                    ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => setActiveTab('staffList')}
              >
                Staff List
              </button>
              <button
                className={`py-2 px-3 sm:py-3 sm:px-6 text-sm sm:text-lg font-medium transition-all duration-200 focus:outline-none whitespace-nowrap ${
                  activeTab === 'createStaff'
                    ? 'border-b-2 border-[#800000] text-[#800000] bg-gray-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
                onClick={() => {
                  resetForm();
                  setActiveTab('createStaff');
                }}
              >
                {editingStaff ? 'Edit Staff' : 'Create Staff'}
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-6">
            {activeTab === 'staffList' && renderStaffList()}
            {activeTab === 'createStaff' && renderCreateStaffForm()}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmationModal
        open={confirmationModal.open}
        onClose={() => setConfirmationModal({ ...confirmationModal, open: false })}
        title={confirmationModal.title}
        message={confirmationModal.message}
        onConfirm={confirmationModal.onConfirm}
        isDestructive={confirmationModal.isDestructive}
      />
      
      <FeedbackModal
        open={feedbackModal.open}
        onClose={() => setFeedbackModal({ open: false, message: '' })}
        message={feedbackModal.message}
      />
    </AdminLayout>
  );
}

export default withAdminAccess(AdminStaffManagement);
