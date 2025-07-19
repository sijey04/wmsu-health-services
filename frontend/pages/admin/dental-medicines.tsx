import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import withAdminAccess from '../../components/withAdminAccess';
import { dentalMedicinesAPI, dentalFormAPI } from '../../utils/api';
import { 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  ChartBarIcon,
  DocumentTextIcon,
  BeakerIcon,
  CalendarDaysIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface DentalMedicine {
  id: number;
  name: string;
  type: string;
  type_display: string;
  description: string;
  unit: string;
  is_active: boolean;
}

interface MedicineUsage {
  medicine_id: number;
  medicine_name: string;
  quantity: number;
  unit: string;
  date_used: string;
  patient_name: string;
  appointment_id: number;
}

interface UsageReport {
  medicine_name: string;
  total_quantity: number;
  unit: string;
  usage_count: number;
  avg_per_appointment: number;
}

function DentalMedicinesAdmin() {
  const [medicines, setMedicines] = useState<DentalMedicine[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editingMedicine, setEditingMedicine] = useState<DentalMedicine | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'medicines' | 'usage' | 'reports'>('medicines');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [usageData, setUsageData] = useState<MedicineUsage[]>([]);
  const [usageReports, setUsageReports] = useState<UsageReport[]>([]);
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const [formData, setFormData] = useState({
    name: '',
    type: 'medicine',
    description: '',
    unit: 'pcs'
  });

  const typeOptions = [
    { value: 'medicine', label: 'Medicine', color: 'bg-blue-100 text-blue-800' },
    { value: 'anesthetic', label: 'Anesthetic', color: 'bg-purple-100 text-purple-800' },
    { value: 'antibiotic', label: 'Antibiotic', color: 'bg-green-100 text-green-800' },
    { value: 'dental_supply', label: 'Dental Supply', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'equipment', label: 'Equipment', color: 'bg-red-100 text-red-800' },
    { value: 'material', label: 'Material', color: 'bg-gray-100 text-gray-800' }
  ];

  const getTypeColor = (type: string) => {
    const typeOption = typeOptions.find(option => option.value === type);
    return typeOption?.color || 'bg-gray-100 text-gray-800';
  };

  const loadMedicines = async () => {
    setLoading(true);
    try {
      const response = await dentalMedicinesAPI.getAll();
      setMedicines(response.data || []);
      setMessage(`Loaded ${response.data?.length || 0} dental medicines`);
    } catch (error: any) {
      console.error('Error loading medicines:', error);
      setMessage('Error loading medicines: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUsageData = async () => {
    setLoading(true);
    try {
      // Try to get data from the new usage tracking API
      try {
        const response = await dentalMedicinesAPI.getUsageData({
          period: reportPeriod
        });
        setUsageData(response.data || []);
      } catch (apiError) {
        // Fallback to processing dental forms data if API endpoint doesn't exist yet
        console.log('Usage API not available, falling back to dental forms processing');
        const response = await dentalFormAPI.getAll();
        const dentalForms = response.data || [];
        
        const usageArray: MedicineUsage[] = [];
        
        dentalForms.forEach((form: any) => {
          if (form.used_medicines && Array.isArray(form.used_medicines)) {
            form.used_medicines.forEach((medicine: any) => {
              usageArray.push({
                medicine_id: medicine.id || 0,
                medicine_name: medicine.name || 'Unknown',
                quantity: parseFloat(medicine.quantity) || 1,
                unit: medicine.unit || 'pcs',
                date_used: form.date || form.created_at,
                patient_name: `${form.first_name} ${form.surname}`,
                appointment_id: form.appointment_id || form.id
              });
            });
          }
        });
        
        setUsageData(usageArray);
      }
    } catch (error: any) {
      console.error('Error loading usage data:', error);
      setMessage('Error loading usage data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateUsageReport = async () => {
    try {
      // Try to get reports from the new API first
      try {
        const response = await dentalMedicinesAPI.getUsageReports({
          period: reportPeriod,
          group_by: 'medicine'
        });
        setUsageReports(response.data || []);
        return;
      } catch (apiError) {
        console.log('Reports API not available, generating from local data');
      }
    } catch (error) {
      console.error('Error getting usage reports:', error);
    }

    // Fallback to local processing
    const filtered = filterUsageByPeriod(usageData);
    const reportMap = new Map<string, UsageReport>();

    filtered.forEach(usage => {
      const key = usage.medicine_name;
      if (reportMap.has(key)) {
        const existing = reportMap.get(key)!;
        existing.total_quantity += usage.quantity;
        existing.usage_count += 1;
      } else {
        reportMap.set(key, {
          medicine_name: usage.medicine_name,
          total_quantity: usage.quantity,
          unit: usage.unit,
          usage_count: 1,
          avg_per_appointment: usage.quantity
        });
      }
    });

    // Calculate averages
    const reports = Array.from(reportMap.values()).map(report => ({
      ...report,
      avg_per_appointment: report.total_quantity / report.usage_count
    }));

    reports.sort((a, b) => b.total_quantity - a.total_quantity);
    setUsageReports(reports);
  };

  const filterUsageByPeriod = (data: MedicineUsage[]) => {
    const now = new Date();
    const filterDate = new Date();

    switch (reportPeriod) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        filterDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return data.filter(usage => new Date(usage.date_used) >= filterDate);
  };

  const exportReport = async () => {
    try {
      // Try to use the API export function first
      try {
        const response = await dentalMedicinesAPI.exportUsageReport({
          period: reportPeriod,
          format: 'csv'
        });
        
        // Create download link from blob response
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = `dental-medicine-usage-${reportPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return;
      } catch (apiError) {
        console.log('Export API not available, generating CSV locally');
      }
    } catch (error) {
      console.error('Error using export API:', error);
    }

    // Fallback to local CSV generation
    const csvContent = [
      'Medicine Name,Total Quantity,Unit,Usage Count,Average per Appointment,Report Period',
      ...usageReports.map(report => 
        `"${report.medicine_name}",${report.total_quantity},"${report.unit}",${report.usage_count},${report.avg_per_appointment.toFixed(2)},"${reportPeriod}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dental-medicine-usage-${reportPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || medicine.type === filterType;
    return matchesSearch && matchesType;
  });

  const populateSamples = async () => {
    setLoading(true);
    try {
      const response = await dentalMedicinesAPI.populateSamples();
      setMessage(response.data.message);
      await loadMedicines();
    } catch (error: any) {
      console.error('Error populating samples:', error);
      setMessage('Error populating samples: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editingMedicine) {
        await dentalMedicinesAPI.update(editingMedicine.id, formData);
        setMessage('Medicine updated successfully');
      } else {
        await dentalMedicinesAPI.create(formData);
        setMessage('Medicine created successfully');
      }
      
      resetForm();
      await loadMedicines();
    } catch (error: any) {
      console.error('Error saving medicine:', error);
      setMessage('Error saving medicine: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (medicine: DentalMedicine) => {
    setEditingMedicine(medicine);
    setFormData({
      name: medicine.name,
      type: medicine.type,
      description: medicine.description || '',
      unit: medicine.unit
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this medicine/supply?')) {
      setLoading(true);
      try {
        await dentalMedicinesAPI.delete(id);
        setMessage('Medicine deleted successfully');
        await loadMedicines();
      } catch (error: any) {
        console.error('Error deleting medicine:', error);
        setMessage('Error deleting medicine: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', type: 'medicine', description: '', unit: 'pcs' });
    setEditingMedicine(null);
    setShowAddForm(false);
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  useEffect(() => {
    if (activeTab === 'usage' || activeTab === 'reports') {
      loadUsageData();
    }
  }, [activeTab]);

  useEffect(() => {
    if (usageData.length > 0) {
      generateUsageReport();
    }
  }, [usageData, reportPeriod]);

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-[#800000] mb-2">Dental Medicines & Supplies</h1>
                <p className="text-gray-600 text-lg">Manage medicines, supplies, and track usage analytics</p>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center px-6 py-3 bg-[#800000] text-white rounded-xl font-medium hover:bg-[#a83232] transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Add Medicine
                </button>
                <button
                  onClick={populateSamples}
                  disabled={loading}
                  className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50"
                >
                  <BeakerIcon className="w-5 h-5 mr-2" />
                  {loading ? 'Loading...' : 'Sample Data'}
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('medicines')}
                  className={`${
                    activeTab === 'medicines'
                      ? 'border-[#800000] text-[#800000]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                >
                  <div className="flex items-center">
                    <BeakerIcon className="w-5 h-5 mr-2" />
                    Medicines & Supplies
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('usage')}
                  className={`${
                    activeTab === 'usage'
                      ? 'border-[#800000] text-[#800000]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                >
                  <div className="flex items-center">
                    <EyeIcon className="w-5 h-5 mr-2" />
                    Usage Tracking
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`${
                    activeTab === 'reports'
                      ? 'border-[#800000] text-[#800000]'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
                >
                  <div className="flex items-center">
                    <ChartBarIcon className="w-5 h-5 mr-2" />
                    Usage Reports
                  </div>
                </button>
              </nav>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div className={`mb-6 p-4 rounded-xl border-l-4 ${
              message.includes('Error') 
                ? 'bg-red-50 border-red-400 text-red-700' 
                : 'bg-green-50 border-green-400 text-green-700'
            }`}>
              <div className="flex items-center">
                {message.includes('Error') ? (
                  <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
                ) : (
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                )}
                {message}
              </div>
            </div>
          )}

          {/* Medicines Tab Content */}
          {activeTab === 'medicines' && (
            <>
              {/* Search and Filter Section */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-1 items-center space-x-4">
                    <div className="relative flex-1 max-w-md">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search medicines..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                      />
                    </div>
                    <div className="relative">
                      <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                      >
                        <option value="all">All Types</option>
                        {typeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    Showing {filteredMedicines.length} of {medicines.length} medicines
                  </div>
                </div>
              </div>

              {/* Add/Edit Form Modal */}
              {showAddForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <div className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-gray-800">
                          {editingMedicine ? 'Edit Medicine/Supply' : 'Add New Medicine/Supply'}
                        </h3>
                        <button
                          onClick={resetForm}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Medicine Name *</label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                            placeholder="Enter medicine name"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                          <select
                            value={formData.type}
                            onChange={(e) => setFormData({...formData, type: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                          >
                            {typeOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Unit *</label>
                          <input
                            type="text"
                            value={formData.unit}
                            onChange={(e) => setFormData({...formData, unit: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                            placeholder="mg, ml, pcs, tablet, etc."
                          />
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                            rows={3}
                            placeholder="Optional description or notes"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-4 mt-8">
                        <button
                          onClick={resetForm}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={loading || !formData.name.trim()}
                          className="px-6 py-3 bg-[#800000] text-white rounded-xl hover:bg-[#a83232] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Saving...' : (editingMedicine ? 'Update' : 'Create')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Medicines Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredMedicines.map((medicine) => (
                  <div key={medicine.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-800 mb-2 line-clamp-2">{medicine.name}</h3>
                          <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${getTypeColor(medicine.type)}`}>
                            {medicine.type_display}
                          </span>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEdit(medicine)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(medicine.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Unit:</span>
                          <span className="font-medium">{medicine.unit}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Status:</span>
                          <span className={`font-medium ${medicine.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                            {medicine.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      
                      {medicine.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{medicine.description}</p>
                      )}
                      
                      <div className={`w-full h-1 rounded-full ${medicine.is_active ? 'bg-green-200' : 'bg-gray-200'}`}>
                        <div className={`h-1 rounded-full transition-all duration-300 ${medicine.is_active ? 'bg-green-500 w-full' : 'bg-gray-400 w-0'}`}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredMedicines.length === 0 && !loading && (
                <div className="text-center py-16">
                  <BeakerIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-600 mb-2">No medicines found</h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm || filterType !== 'all' 
                      ? 'Try adjusting your search or filter criteria'
                      : 'Get started by adding your first medicine or loading sample data'
                    }
                  </p>
                  {!searchTerm && filterType === 'all' && (
                    <div className="space-x-4">
                      <button
                        onClick={() => setShowAddForm(true)}
                        className="px-6 py-3 bg-[#800000] text-white rounded-xl hover:bg-[#a83232] transition-colors"
                      >
                        Add Medicine
                      </button>
                      <button
                        onClick={populateSamples}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                      >
                        Load Sample Data
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Usage Tracking Tab Content */}
          {activeTab === 'usage' && (
            <>
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Medicine Usage Tracking</h3>
                    <p className="text-gray-600">Real-time tracking of medicine usage from dental consultations</p>
                  </div>
                  <button
                    onClick={loadUsageData}
                    disabled={loading}
                    className="flex items-center px-6 py-3 bg-[#800000] text-white rounded-xl font-medium hover:bg-[#a83232] transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50"
                  >
                    <ArrowPathIcon className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? 'Loading...' : 'Refresh Data'}
                  </button>
                </div>

                {usageData.length > 0 ? (
                  <div className="overflow-x-auto">
                    <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="text-sm text-gray-600">
                        Showing {Math.min(usageData.length, 50)} of {usageData.length} usage records
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Sort by:</span>
                        <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#800000] focus:border-transparent">
                          <option value="date_desc">Date (Newest)</option>
                          <option value="date_asc">Date (Oldest)</option>
                          <option value="medicine_name">Medicine Name</option>
                          <option value="quantity">Quantity</option>
                        </select>
                      </div>
                    </div>
                    <table className="w-full bg-white rounded-xl overflow-hidden shadow-lg">
                      <thead className="bg-gradient-to-r from-[#800000] to-[#a83232] text-white">
                        <tr>
                          <th className="text-left py-4 px-6 font-semibold">Medicine Name</th>
                          <th className="text-center py-4 px-6 font-semibold">Quantity</th>
                          <th className="text-center py-4 px-6 font-semibold">Unit</th>
                          <th className="text-left py-4 px-6 font-semibold">Patient</th>
                          <th className="text-left py-4 px-6 font-semibold">Date Used</th>
                          <th className="text-center py-4 px-6 font-semibold">Appointment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usageData
                          .sort((a, b) => new Date(b.date_used).getTime() - new Date(a.date_used).getTime())
                          .slice(0, 50) // Show latest 50 records
                          .map((usage, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200">
                            <td className="py-4 px-6">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                                <div className="font-medium text-gray-800">{usage.medicine_name}</div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
                                {usage.quantity}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
                                {usage.unit}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-gray-800 font-medium">{usage.patient_name}</div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="text-gray-600">
                                {new Date(usage.date_used).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(usage.date_used).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                #{usage.appointment_id}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {usageData.length > 50 && (
                      <div className="text-center py-6">
                        <div className="inline-flex items-center space-x-2 text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                          <ClockIcon className="w-4 h-4" />
                          <span className="text-sm">Showing latest 50 of {usageData.length} usage records</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-600 mb-2">No usage data found</h3>
                    <p className="text-gray-500">Medicine usage will appear here after dental consultations are completed</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Reports Tab Content */}
          {activeTab === 'reports' && (
            <>
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Usage Reports & Analytics</h3>
                    <p className="text-gray-600">Generate detailed reports on medicine usage patterns</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 mt-4 lg:mt-0">
                    <div className="flex items-center space-x-2">
                      <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                      <select
                        value={reportPeriod}
                        onChange={(e) => setReportPeriod(e.target.value as 'week' | 'month' | 'year')}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#800000] focus:border-transparent"
                      >
                        <option value="week">Last Week</option>
                        <option value="month">Last Month</option>
                        <option value="year">Last Year</option>
                      </select>
                    </div>
                    <button
                      onClick={exportReport}
                      disabled={usageReports.length === 0}
                      className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                      Export CSV
                    </button>
                  </div>
                </div>

                {usageReports.length > 0 ? (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-blue-100 text-sm">Total Medicines Used</p>
                            <p className="text-3xl font-bold">{usageReports.length}</p>
                          </div>
                          <BeakerIcon className="w-8 h-8 text-blue-200" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-green-100 text-sm">Total Usage Count</p>
                            <p className="text-3xl font-bold">{usageReports.reduce((sum, report) => sum + report.usage_count, 0)}</p>
                          </div>
                          <ChartBarIcon className="w-8 h-8 text-green-200" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-100 text-sm">Most Used Medicine</p>
                            <p className="text-lg font-bold leading-tight">{usageReports[0]?.medicine_name || 'N/A'}</p>
                          </div>
                          <DocumentTextIcon className="w-8 h-8 text-purple-200" />
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-orange-100 text-sm">Avg per Appointment</p>
                            <p className="text-3xl font-bold">
                              {usageReports.length > 0 ? 
                                (usageReports.reduce((sum, report) => sum + report.avg_per_appointment, 0) / usageReports.length).toFixed(1) 
                                : '0'
                              }
                            </p>
                          </div>
                          <ClockIcon className="w-8 h-8 text-orange-200" />
                        </div>
                      </div>
                    </div>

                    {/* Reports Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full bg-white rounded-xl overflow-hidden shadow-lg">
                        <thead className="bg-gradient-to-r from-[#800000] to-[#a83232] text-white">
                          <tr>
                            <th className="text-left py-4 px-6 font-semibold">Medicine Name</th>
                            <th className="text-center py-4 px-6 font-semibold">Total Quantity</th>
                            <th className="text-center py-4 px-6 font-semibold">Unit</th>
                            <th className="text-center py-4 px-6 font-semibold">Usage Count</th>
                            <th className="text-center py-4 px-6 font-semibold">Avg per Appointment</th>
                            <th className="text-center py-4 px-6 font-semibold">Usage Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usageReports.map((report, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200">
                              <td className="py-6 px-6">
                                <div className="flex items-center">
                                  <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-3"></div>
                                  <div className="font-medium text-gray-800 text-lg">{report.medicine_name}</div>
                                </div>
                              </td>
                              <td className="py-6 px-6 text-center">
                                <div className="flex flex-col items-center">
                                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                                    {report.total_quantity}
                                  </span>
                                </div>
                              </td>
                              <td className="py-6 px-6 text-center">
                                <span className="bg-gray-100 text-gray-700 px-3 py-2 rounded-full text-sm font-medium">
                                  {report.unit}
                                </span>
                              </td>
                              <td className="py-6 px-6 text-center">
                                <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                                  {report.usage_count}
                                </span>
                              </td>
                              <td className="py-6 px-6 text-center">
                                <div className="text-xl font-semibold text-gray-700">
                                  {report.avg_per_appointment.toFixed(2)}
                                </div>
                              </td>
                              <td className="py-6 px-6">
                                <div className="flex items-center justify-center">
                                  <div className="w-32 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                                    <div 
                                      className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 relative"
                                      style={{ 
                                        width: `${Math.min((report.total_quantity / Math.max(...usageReports.map(r => r.total_quantity))) * 100, 100)}%` 
                                      }}
                                    >
                                      <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse"></div>
                                    </div>
                                  </div>
                                  <span className="ml-3 text-sm font-medium text-gray-600">
                                    {Math.round((report.total_quantity / Math.max(...usageReports.map(r => r.total_quantity))) * 100)}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Period Information */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center text-blue-800">
                        <CalendarDaysIcon className="w-5 h-5 mr-2" />
                        <span className="text-sm font-medium">
                          Report Period: {reportPeriod === 'week' ? 'Last 7 days' : reportPeriod === 'month' ? 'Last 30 days' : 'Last 365 days'}
                          {' • '}Generated on {new Date().toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-16">
                    <ChartBarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-600 mb-2">No usage data available</h3>
                    <p className="text-gray-500 mb-6">Reports will be generated once medicine usage data is available</p>
                    <button
                      onClick={loadUsageData}
                      className="px-6 py-3 bg-[#800000] text-white rounded-xl hover:bg-[#a83232] transition-colors"
                    >
                      Load Usage Data
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {loading && (
            <div className="text-center py-20">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#800000] border-r-transparent mb-6"></div>
              <p className="text-gray-600 text-lg">Loading data...</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default withAdminAccess(DentalMedicinesAdmin);
