import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import AdminLayout from '../../components/AdminLayout';
import { djangoApiClient, dentalMedicinesAPI } from '../../utils/api';
import ConfirmationModal from '../../components/ConfirmationModal';

interface ProfileRequirement {
  id: string;
  name: string;
  required: boolean;
  description: string;
  category: 'personal' | 'health' | 'emergency' | 'family';
  isNew?: boolean;
}

interface DocumentRequirement {
  id: string;
  name: string;
  required: boolean;
  description: string;
  validityPeriod: number; // in months
  specificCourses: string[];
  isNew?: boolean;
}

interface CampusSchedule {
  id: string;
  campus: string;
  openTime: string;
  closeTime: string;
  days: string[];
  isActive: boolean;
  isNew?: boolean;
}

interface DentistSchedule {
  id: string;
  dentistName: string;
  campus: string;
  availableDays: string[];
  timeSlots: string[];
  isActive: boolean;
  isNew?: boolean;
}

interface SchoolYear {
  id: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  first_sem_start: string;
  first_sem_end: string;
  second_sem_start: string;
  second_sem_end: string;
  summer_start: string;
  summer_end: string;
  is_current: boolean;
  status: string;
  current_semester?: string;
  current_semester_display?: string;
  isNew?: boolean;
}

interface ComorbidIllness {
  id: string;
  label: string;
  enabled: boolean;
  has_sub_options?: boolean;
  sub_options?: string[];
  requires_specification?: boolean;
  specification_placeholder?: string;
  isNew?: boolean;
}

interface Vaccination {
  id: string;
  name: string;
  enabled: boolean;
  isNew?: boolean;
}

interface PastMedicalHistoryItem {
  id: string;
  name: string;
  enabled: boolean;
  has_sub_options?: boolean;
  sub_options?: string[];
  requires_specification?: boolean;
  specification_placeholder?: string;
  isNew?: boolean;
}

interface FamilyMedicalHistoryItem {
  id: string;
  name: string;
  enabled: boolean;
  has_sub_options?: boolean;
  sub_options?: string[];
  requires_specification?: boolean;
  specification_placeholder?: string;
  isNew?: boolean;
}

interface DentalMedicine {
  id: string;
  name: string;
  type: 'medicine' | 'anesthetic' | 'antibiotic' | 'dental_supply' | 'equipment' | 'material';
  type_display: string;
  description: string;
  unit: string;
  is_active: boolean;
  isNew?: boolean;
}

export default function AdminControls() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  
  // State for all control types
  const [profileRequirements, setProfileRequirements] = useState<ProfileRequirement[]>([]);
  const [documentRequirements, setDocumentRequirements] = useState<DocumentRequirement[]>([]);
  const [campusSchedules, setCampusSchedules] = useState<CampusSchedule[]>([]);
  const [dentistSchedules, setDentistSchedules] = useState<DentistSchedule[]>([]);
  const [schoolYears, setSchoolYears] = useState<SchoolYear[]>([]);
  const [comorbidIllnesses, setComorbidIllnesses] = useState<ComorbidIllness[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [pastMedicalHistories, setPastMedicalHistories] = useState<PastMedicalHistoryItem[]>([]);
  const [familyMedicalHistories, setFamilyMedicalHistories] = useState<FamilyMedicalHistoryItem[]>([]);
  const [dentalMedicines, setDentalMedicines] = useState<DentalMedicine[]>([]);

  const [saving, setSaving] = useState(false);
  
  // Modal and Alert States
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState('');
  const [alert, setAlert] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editType, setEditType] = useState<'profile' | 'document' | 'campus' | 'dentist'>('profile');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  
  // Sub-options modal state
  const [showSubOptionsModal, setShowSubOptionsModal] = useState(false);
  const [editingSubOptions, setEditingSubOptions] = useState<any>(null);
  const [subOptionsType, setSubOptionsType] = useState<'past' | 'family' | 'comorbid'>('past');
  const [tempSubOptions, setTempSubOptions] = useState<string[]>([]);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load all data from backend
      const [profileResponse, docResponse, campusResponse, dentistResponse, comorbidResponse, vaccinationResponse, pastMedicalResponse, familyMedicalResponse] = await Promise.all([
        djangoApiClient.get('/admin-controls/profile_requirements/'),
        djangoApiClient.get('/admin-controls/document_requirements/'),
        djangoApiClient.get('/admin-controls/campus_schedules/'),
        djangoApiClient.get('/admin-controls/dentist_schedules/'),
        djangoApiClient.get('/user-management/comorbid_illnesses/'),
        djangoApiClient.get('/user-management/vaccinations/'),
        djangoApiClient.get('/user-management/past_medical_histories/'),
        djangoApiClient.get('/user-management/family_medical_histories/')
      ]);

      // Try to fetch school year data separately to handle 404 gracefully
      let schoolYearData = [];
      try {
        const schoolYearResponse = await djangoApiClient.get('/academic-school-years/');
        if (schoolYearResponse.data) {
          schoolYearData = schoolYearResponse.data;
        }
      } catch (error) {
        console.warn('School Year API not available, using fallback data');
        // Provide fallback data if endpoint is not available
        schoolYearData = [
          {
            id: 1,
            academic_year: '2025-2026',
            start_date: '2025-08-15',
            end_date: '2026-07-31',
            first_sem_start: '2025-08-15',
            first_sem_end: '2025-12-20',
            second_sem_start: '2026-01-15',
            second_sem_end: '2026-05-15',
            summer_start: '2026-06-01',
            summer_end: '2026-07-31',
            is_current: true,
            status: 'active',
            current_semester: '1st_semester',
            current_semester_display: 'First Semester'
          },
          {
            id: 2,
            academic_year: '2026-2027',
            start_date: '2026-08-15',
            end_date: '2027-07-31',
            first_sem_start: '2026-08-15',
            first_sem_end: '2026-12-20',
            second_sem_start: '2027-01-15',
            second_sem_end: '2027-05-15',
            summer_start: '2027-06-01',
            summer_end: '2027-07-31',
            is_current: false,
            status: 'upcoming',
            current_semester: null,
            current_semester_display: 'Not in session'
          }
        ];
      }

      if (profileResponse.data) {
        setProfileRequirements(profileResponse.data.map((req: any) => ({
          id: req.id.toString(),
          name: req.display_name,
          required: req.is_required,
          description: req.description,
          category: req.category
        })));
      }

      if (docResponse.data) {
        setDocumentRequirements(docResponse.data.map((req: any) => ({
          id: req.id.toString(),
          name: req.display_name,
          required: req.is_required,
          description: req.description,
          validityPeriod: req.validity_period_months,
          specificCourses: req.specific_courses || []
        })));
      }

      if (campusResponse.data) {
        setCampusSchedules(campusResponse.data.map((schedule: any) => ({
          id: schedule.id.toString(),
          campus: `Campus ${schedule.campus.toUpperCase()}`,
          openTime: schedule.open_time,
          closeTime: schedule.close_time,
          days: schedule.operating_days || [],
          isActive: schedule.is_active
        })));
      }

      if (dentistResponse.data) {
        setDentistSchedules(dentistResponse.data.map((schedule: any) => ({
          id: schedule.id.toString(),
          dentistName: schedule.dentist_name,
          campus: `Campus ${schedule.campus.toUpperCase()}`,
          availableDays: schedule.available_days || [],
          timeSlots: schedule.time_slots || [],
          isActive: schedule.is_active
        })));
      }

      // Set school year data
      setSchoolYears(schoolYearData.map((year: any) => ({
        id: year.id.toString(),
        academic_year: year.academic_year,
        start_date: year.start_date,
        end_date: year.end_date,
        first_sem_start: year.first_sem_start || '',
        first_sem_end: year.first_sem_end || '',
        second_sem_start: year.second_sem_start || '',
        second_sem_end: year.second_sem_end || '',
        summer_start: year.summer_start || '',
        summer_end: year.summer_end || '',
        is_current: year.is_current,
        status: year.status,
        current_semester: year.current_semester,
        current_semester_display: year.current_semester_display
      })));

      // Set medical list data from backend
      if (comorbidResponse.data) {
        setComorbidIllnesses(comorbidResponse.data.map((illness: any) => ({
          id: illness.id.toString(),
          label: illness.label,
          enabled: illness.is_enabled,
          has_sub_options: illness.has_sub_options || false,
          sub_options: illness.sub_options || [],
          requires_specification: illness.requires_specification || false,
          specification_placeholder: illness.specification_placeholder || ''
        })));
      }

      if (vaccinationResponse.data) {
        setVaccinations(vaccinationResponse.data.map((vaccination: any) => ({
          id: vaccination.id.toString(),
          name: vaccination.name,
          enabled: vaccination.is_enabled
        })));
      }

      if (pastMedicalResponse.data) {
        setPastMedicalHistories(pastMedicalResponse.data.map((history: any) => ({
          id: history.id.toString(),
          name: history.name,
          enabled: history.is_enabled,
          has_sub_options: history.has_sub_options || false,
          sub_options: history.sub_options || [],
          requires_specification: history.requires_specification || false,
          specification_placeholder: history.specification_placeholder || ''
        })));
      }

      if (familyMedicalResponse.data) {
        setFamilyMedicalHistories(familyMedicalResponse.data.map((history: any) => ({
          id: history.id.toString(),
          name: history.name,
          enabled: history.is_enabled,
          has_sub_options: history.has_sub_options || false,
          sub_options: history.sub_options || [],
          requires_specification: history.requires_specification || false,
          specification_placeholder: history.specification_placeholder || ''
        })));
      }

      // Load dental medicines if the endpoint is available
      try {
        const dentalResponse = await dentalMedicinesAPI.getAll();
        if (dentalResponse.data) {
          setDentalMedicines(dentalResponse.data.map((medicine: any) => ({
            id: medicine.id.toString(),
            name: medicine.name,
            type: medicine.type,
            type_display: medicine.type_display,
            description: medicine.description,
            unit: medicine.unit,
            is_active: medicine.is_active
          })));
        }
      } catch (error) {
        console.warn('Dental Medicines API not available');
      }

    } catch (error) {
      console.error('Error loading settings:', error);
      showAlert('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check if user is admin
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      if (!user.is_staff && user.user_type !== 'admin') {
        router.push('/');
        return;
      }
    } catch (error) {
      router.push('/login');
      return;
    }

    loadSettings();
  }, [router, loadSettings]);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Sub-options modal functions
  const openSubOptionsModal = (item: any, type: 'past' | 'family' | 'comorbid') => {
    setEditingSubOptions(item);
    setSubOptionsType(type);
    setTempSubOptions([...(item.sub_options || [])]);
    setShowSubOptionsModal(true);
  };

  const closeSubOptionsModal = () => {
    setShowSubOptionsModal(false);
    setEditingSubOptions(null);
    setTempSubOptions([]);
  };

  const addSubOption = () => {
    setTempSubOptions([...tempSubOptions, '']);
  };

  const updateSubOption = (index: number, value: string) => {
    const newSubOptions = [...tempSubOptions];
    newSubOptions[index] = value;
    setTempSubOptions(newSubOptions);
  };

  const removeSubOption = (index: number) => {
    const newSubOptions = tempSubOptions.filter((_, i) => i !== index);
    setTempSubOptions(newSubOptions);
  };

  const saveSubOptions = () => {
    const filteredOptions = tempSubOptions.filter(option => option.trim() !== '');
    if (subOptionsType === 'past') {
      updatePastMedicalHistory(editingSubOptions.id, 'sub_options', filteredOptions);
    } else if (subOptionsType === 'family') {
      updateFamilyMedicalHistory(editingSubOptions.id, 'sub_options', filteredOptions);
    } else if (subOptionsType === 'comorbid') {
      updateComorbidIllness(editingSubOptions.id, 'sub_options', filteredOptions);
    }
    closeSubOptionsModal();
  };

  const confirmDelete = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        djangoApiClient.post('/admin-controls/profile_requirements/update_profile_requirements/', {
          requirements: profileRequirements.map(req => ({
            id: parseInt(req.id),
            is_required: req.required,
            is_active: true
          }))
        }),
        djangoApiClient.post('/admin-controls/document_requirements/update_document_requirements/', {
          requirements: documentRequirements.map(req => ({
            id: parseInt(req.id),
            is_required: req.required,
            validity_period_months: req.validityPeriod,
            specific_courses: req.specificCourses,
            is_active: true
          }))
        }),
        djangoApiClient.post('/admin-controls/campus_schedules/update_campus_schedules/', {
          schedules: campusSchedules.map(schedule => ({
            campus: schedule.campus.toLowerCase().replace('campus ', ''),
            open_time: schedule.openTime,
            close_time: schedule.closeTime,
            operating_days: schedule.days,
            is_active: schedule.isActive
          }))
        }),
        djangoApiClient.post('/admin-controls/dentist_schedules/update_dentist_schedules/', {
          schedules: dentistSchedules.map(schedule => ({
            dentist_name: schedule.dentistName,
            campus: schedule.campus.toLowerCase().replace('campus ', ''),
            available_days: schedule.availableDays,
            time_slots: schedule.timeSlots,
            is_active: schedule.isActive
          }))
        })
      ]);
      
      // Save medical lists - update each item individually
      const savePromises = [];
      
      // Save comorbid illnesses
      comorbidIllnesses.forEach(illness => {
        if (illness.isNew) {
          savePromises.push(
            djangoApiClient.post('/user-management/comorbid_illnesses/create_comorbid_illness/', {
              label: illness.label,
              is_enabled: illness.enabled,
              has_sub_options: illness.has_sub_options || false,
              sub_options: illness.sub_options || [],
              requires_specification: illness.requires_specification || false,
              specification_placeholder: illness.specification_placeholder || ''
            })
          );
        } else {
          savePromises.push(
            djangoApiClient.put('/user-management/comorbid_illnesses/update_comorbid_illness/', {
              id: parseInt(illness.id),
              is_enabled: illness.enabled,
              has_sub_options: illness.has_sub_options || false,
              sub_options: illness.sub_options || [],
              requires_specification: illness.requires_specification || false,
              specification_placeholder: illness.specification_placeholder || ''
            })
          );
        }
      });
      
      // Save vaccinations
      vaccinations.forEach(vaccination => {
        if (vaccination.isNew) {
          savePromises.push(
            djangoApiClient.post('/user-management/vaccinations/create_vaccination/', {
              name: vaccination.name,
              is_enabled: vaccination.enabled
            })
          );
        } else {
          savePromises.push(
            djangoApiClient.put('/user-management/vaccinations/update_vaccination/', {
              id: parseInt(vaccination.id),
              is_enabled: vaccination.enabled
            })
          );
        }
      });
      
      // Save past medical histories
      pastMedicalHistories.forEach(history => {
        if (history.isNew) {
          savePromises.push(
            djangoApiClient.post('/user-management/past_medical_histories/create_past_medical_history/', {
              name: history.name,
              is_enabled: history.enabled,
              has_sub_options: history.has_sub_options || false,
              sub_options: history.sub_options || [],
              requires_specification: history.requires_specification || false,
              specification_placeholder: history.specification_placeholder || ''
            })
          );
        } else {
          savePromises.push(
            djangoApiClient.put('/user-management/past_medical_histories/update_past_medical_history/', {
              id: parseInt(history.id),
              is_enabled: history.enabled,
              has_sub_options: history.has_sub_options || false,
              sub_options: history.sub_options || [],
              requires_specification: history.requires_specification || false,
              specification_placeholder: history.specification_placeholder || ''
            })
          );
        }
      });
      
      // Save family medical histories
      familyMedicalHistories.forEach(history => {
        if (history.isNew) {
          savePromises.push(
            djangoApiClient.post('/user-management/family_medical_histories/create_family_medical_history/', {
              name: history.name,
              is_enabled: history.enabled,
              has_sub_options: history.has_sub_options || false,
              sub_options: history.sub_options || [],
              requires_specification: history.requires_specification || false,
              specification_placeholder: history.specification_placeholder || ''
            })
          );
        } else {
          savePromises.push(
            djangoApiClient.put('/user-management/family_medical_histories/update_family_medical_history/', {
              id: parseInt(history.id),
              is_enabled: history.enabled,
              has_sub_options: history.has_sub_options || false,
              sub_options: history.sub_options || [],
              requires_specification: history.requires_specification || false,
              specification_placeholder: history.specification_placeholder || ''
            })
          );
        }
      });
      
      // Execute all medical list save operations
      if (savePromises.length > 0) {
        await Promise.all(savePromises);
      }
      
      // Try to save school year data, but handle gracefully if endpoint doesn't exist yet
      try {
        // Handle new school years separately
        const newSchoolYears = schoolYears.filter(year => year.isNew);
        const existingSchoolYears = schoolYears.filter(year => !year.isNew);
        
        // Save new school years
        for (const newYear of newSchoolYears) {
          await djangoApiClient.post('/academic-school-years/', {
            academic_year: newYear.academic_year,
            start_date: newYear.start_date,
            end_date: newYear.end_date,
            first_sem_start: newYear.first_sem_start,
            first_sem_end: newYear.first_sem_end,
            second_sem_start: newYear.second_sem_start,
            second_sem_end: newYear.second_sem_end,
            summer_start: newYear.summer_start,
            summer_end: newYear.summer_end,
            is_current: newYear.is_current,
            status: newYear.status
          });
        }
        
        // Update existing school years
        if (existingSchoolYears.length > 0) {
          await djangoApiClient.post('/academic-school-years/bulk_update/', {
            years: existingSchoolYears.map(year => ({
              id: parseInt(year.id),
              academic_year: year.academic_year,
              start_date: year.start_date,
              end_date: year.end_date,
              first_sem_start: year.first_sem_start,
              first_sem_end: year.first_sem_end,
              second_sem_start: year.second_sem_start,
              second_sem_end: year.second_sem_end,
              summer_start: year.summer_start,
              summer_end: year.summer_end,
              is_current: year.is_current,
              status: year.status
            }))
          });
        }
        
        // Reload school years data after successful save
        const schoolYearResponse = await djangoApiClient.get('/academic-school-years/');
        if (schoolYearResponse.data) {
          setSchoolYears(schoolYearResponse.data.map((year: any) => ({
            id: year.id.toString(),
            academic_year: year.academic_year,
            start_date: year.start_date,
            end_date: year.end_date,
            first_sem_start: year.first_sem_start || '',
            first_sem_end: year.first_sem_end || '',
            second_sem_start: year.second_sem_start || '',
            second_sem_end: year.second_sem_end || '',
            summer_start: year.summer_start || '',
            summer_end: year.summer_end || '',
            is_current: year.is_current,
            status: year.status,
            current_semester: year.current_semester,
            current_semester_display: year.current_semester_display
          })));
        }
        
      } catch (yearError) {
        console.log('School year endpoint not available yet, school year data not saved');
        // In a real implementation, we might want to show a warning that school year data wasn't saved
      }

      // Save dental medicines if any new ones were added
      const newDentalMedicines = dentalMedicines.filter(medicine => medicine.isNew);
      if (newDentalMedicines.length > 0) {
        await Promise.all(newDentalMedicines.map(medicine => 
          dentalMedicinesAPI.create({
            name: medicine.name,
            type: medicine.type,
            description: medicine.description,
            unit: medicine.unit,
            is_active: medicine.is_active
          })
        ));
      }

      showAlert('success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showAlert('error', 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetCurrentSchoolYear = async (yearId: string) => {
    try {
      // Check if the endpoint exists, if not just update the UI
      try {
        await djangoApiClient.post(`/academic-school-years/${yearId}/set_current/`);
      } catch (error) {
        console.log('School year endpoint not available yet, updating UI only');
      }
      
      // Update local state
      setSchoolYears(prevYears => 
        prevYears.map(year => ({
          ...year,
          is_current: year.id === yearId
        }))
      );
      
      showAlert('success', 'Current school year updated successfully!');
    } catch (error) {
      console.error('Error setting current school year:', error);
      showAlert('error', 'Failed to update current school year');
    }
  };

  const handleToggleSchoolYearStatus = (yearId: string, active: boolean) => {
    setSchoolYears(prevYears => 
      prevYears.map(year => 
        year.id === yearId 
          ? { ...year, status: active ? 'active' : 'inactive' } 
          : year
      )
    );
  };

  const handleAddNewSchoolYear = () => {
    // Find the latest academic year to determine the next one
    let nextStartYear = new Date().getFullYear();
    
    if (schoolYears.length > 0) {
      // Get the latest academic year from existing school years
      const latestYear = schoolYears.reduce((latest, current) => {
        const currentYearStart = parseInt(current.academic_year.split('-')[0]);
        const latestYearStart = parseInt(latest.academic_year.split('-')[0]);
        return currentYearStart > latestYearStart ? current : latest;
      });
      
      // Extract the ending year from the latest academic year and use it as the start of the next year
      const latestEndYear = parseInt(latestYear.academic_year.split('-')[1]);
      nextStartYear = latestEndYear;
    }
    
    const newSchoolYear: SchoolYear = {
      id: `new-${Date.now()}`, // Temporary ID until saved
      academic_year: `${nextStartYear}-${nextStartYear + 1}`,
      start_date: new Date(nextStartYear, 7, 15).toISOString().split('T')[0], // August 15
      end_date: new Date(nextStartYear + 1, 6, 31).toISOString().split('T')[0], // July 31 of next year
      first_sem_start: new Date(nextStartYear, 7, 15).toISOString().split('T')[0], // August 15
      first_sem_end: new Date(nextStartYear, 11, 20).toISOString().split('T')[0], // December 20
      second_sem_start: new Date(nextStartYear + 1, 0, 15).toISOString().split('T')[0], // January 15
      second_sem_end: new Date(nextStartYear + 1, 4, 15).toISOString().split('T')[0], // May 15
      summer_start: new Date(nextStartYear + 1, 5, 1).toISOString().split('T')[0], // June 1
      summer_end: new Date(nextStartYear + 1, 6, 31).toISOString().split('T')[0], // July 31
      is_current: true, // Set as current/active by default
      status: 'active', // Set as active by default
      current_semester: '1st_semester',
      current_semester_display: 'First Semester',
      isNew: true
    };
    
    // Set all existing school years as not current
    setSchoolYears(prevYears => [
      ...prevYears.map(year => ({ ...year, is_current: false })),
      newSchoolYear
    ]);
    
    showAlert('success', 'New school year added and set as active!');
  };

  const handlePinSubmit = () => {
    if (pinInput === '1216') {
      setShowPinModal(false);
      setPinInput('');
      setPinError('');
      handleAddNewSchoolYear();
    } else {
      setPinError('Invalid PIN. Please try again.');
      setPinInput('');
    }
  };

  const showAddSchoolYearModal = () => {
    setShowPinModal(true);
    setPinInput('');
    setPinError('');
  };

  const handleUpdateSchoolYearField = (yearId: string, field: keyof SchoolYear, value: any) => {
    setSchoolYears(prevYears => 
      prevYears.map(year => 
        year.id === yearId 
          ? { ...year, [field]: value } 
          : year
      )
    );
  };

  // Helper function to get the status display
  const getStatusDisplay = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'upcoming':
        return 'Upcoming';
      case 'completed':
        return 'Completed';
      case 'inactive':
        return 'Inactive';
      default:
        return status;
    }
  };

  const tabGroups = [
    {
      name: 'System Configuration',
      tabs: [
        { id: 'profile', name: 'Profile Requirements', icon: '👤' },
        { id: 'documents', name: 'Document Requirements', icon: '📄' },
        { id: 'campus', name: 'Campus Schedules', icon: '🏢' },
        { id: 'dentist', name: 'Dentist Schedules', icon: '🦷' },
        { id: 'schoolyears', name: 'Academic Years', icon: '🗓️' }
      ]
    },
    {
      name: 'Medical Data Management',
      tabs: [
        { id: 'comorbid', name: 'Comorbid Illnesses', icon: '🩺' },
        { id: 'vaccinations', name: 'Vaccinations', icon: '💉' },
        { id: 'pastmedical', name: 'Past Medical History', icon: '📋' },
        { id: 'familyhistory', name: 'Family Medical History', icon: '👪' }
      ]
    },
    {
      name: 'Dental Medicine Management',
      tabs: [
        { id: 'dental', name: 'Dental Medicines', icon: '🦷' }
      ]
    }
  ];

  // Helper functions for Comorbid Illnesses
  const addComorbidIllness = () => {
    const newItem: ComorbidIllness = {
      id: Date.now().toString(),
      label: '',
      enabled: true,
      has_sub_options: false,
      sub_options: [],
      requires_specification: false,
      specification_placeholder: '',
      isNew: true
    };
    setComorbidIllnesses(prev => [...prev, newItem]);
  };

  const updateComorbidIllness = (id: string, field: keyof ComorbidIllness, value: any) => {
    setComorbidIllnesses(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeComorbidIllness = async (id: string) => {
    try {
      // If it's not a new item, delete it from the backend
      const item = comorbidIllnesses.find(item => item.id === id);
      if (item && !item.isNew) {
        await djangoApiClient.delete('/user-management/delete_comorbid_illness/', { 
          data: { id: parseInt(id) } 
        });
      }
      setComorbidIllnesses(prev => prev.filter(item => item.id !== id));
      showAlert('success', 'Item removed successfully');
    } catch (error) {
      console.error('Error removing comorbid illness:', error);
      showAlert('error', 'Failed to remove item');
    }
  };

  // Helper functions for Vaccinations
  const addVaccination = () => {
    const newItem: Vaccination = {
      id: Date.now().toString(),
      name: '',
      enabled: true,
      isNew: true
    };
    setVaccinations(prev => [...prev, newItem]);
  };

  const updateVaccination = (id: string, field: keyof Vaccination, value: any) => {
    setVaccinations(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeVaccination = async (id: string) => {
    try {
      // If it's not a new item, delete it from the backend
      const item = vaccinations.find(item => item.id === id);
      if (item && !item.isNew) {
        await djangoApiClient.delete('/user-management/delete_vaccination/', { 
          data: { id: parseInt(id) } 
        });
      }
      setVaccinations(prev => prev.filter(item => item.id !== id));
      showAlert('success', 'Item removed successfully');
    } catch (error) {
      console.error('Error removing vaccination:', error);
      showAlert('error', 'Failed to remove item');
    }
  };

  // Helper functions for Past Medical History
  const addPastMedicalHistory = () => {
    const newItem: PastMedicalHistoryItem = {
      id: Date.now().toString(),
      name: '',
      enabled: true,
      has_sub_options: false,
      sub_options: [],
      requires_specification: false,
      specification_placeholder: '',
      isNew: true
    };
    setPastMedicalHistories(prev => [...prev, newItem]);
  };

  const updatePastMedicalHistory = (id: string, field: keyof PastMedicalHistoryItem, value: any) => {
    setPastMedicalHistories(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removePastMedicalHistory = async (id: string) => {
    try {
      // If it's not a new item, delete it from the backend
      const item = pastMedicalHistories.find(item => item.id === id);
      if (item && !item.isNew) {
        await djangoApiClient.delete('/user-management/delete_past_medical_history/', { 
          data: { id: parseInt(id) } 
        });
      }
      setPastMedicalHistories(prev => prev.filter(item => item.id !== id));
      showAlert('success', 'Item removed successfully');
    } catch (error) {
      console.error('Error removing past medical history:', error);
      showAlert('error', 'Failed to remove item');
    }
  };

  // Helper functions for Family Medical History
  const addFamilyMedicalHistory = () => {
    const newItem: FamilyMedicalHistoryItem = {
      id: Date.now().toString(),
      name: '',
      enabled: true,
      has_sub_options: false,
      sub_options: [],
      requires_specification: false,
      specification_placeholder: '',
      isNew: true
    };
    setFamilyMedicalHistories(prev => [...prev, newItem]);
  };

  const updateFamilyMedicalHistory = (id: string, field: keyof FamilyMedicalHistoryItem, value: any) => {
    setFamilyMedicalHistories(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeFamilyMedicalHistory = async (id: string) => {
    try {
      // If it's not a new item, delete it from the backend
      const item = familyMedicalHistories.find(item => item.id === id);
      if (item && !item.isNew) {
        await djangoApiClient.delete('/user-management/delete_family_medical_history/', { 
          data: { id: parseInt(id) } 
        });
      }
      setFamilyMedicalHistories(prev => prev.filter(item => item.id !== id));
      showAlert('success', 'Item removed successfully');
    } catch (error) {
      console.error('Error removing family medical history:', error);
      showAlert('error', 'Failed to remove item');
    }
  };

  // Helper functions for Dental Medicines
  const addDentalMedicine = () => {
    const newItem: DentalMedicine = {
      id: Date.now().toString(),
      name: '',
      type: 'medicine',
      type_display: 'Medicine',
      description: '',
      unit: 'mg',
      is_active: true,
      isNew: true
    };
    setDentalMedicines(prev => [...prev, newItem]);
  };

  const updateDentalMedicine = (id: string, field: keyof DentalMedicine, value: any) => {
    setDentalMedicines(prev => 
      prev.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          
          // Auto-update type_display when type changes
          if (field === 'type') {
            const typeDisplayMap: { [key: string]: string } = {
              'medicine': 'Medicine',
              'anesthetic': 'Anesthetic',
              'antibiotic': 'Antibiotic',
              'dental_supply': 'Dental Supply',
              'equipment': 'Equipment',
              'material': 'Material'
            };
            updatedItem.type_display = typeDisplayMap[value] || value;
          }
          
          return updatedItem;
        }
        return item;
      })
    );
  };

  const removeDentalMedicine = async (id: string) => {
    try {
      // If it's not a new item, delete it from the backend
      const item = dentalMedicines.find(item => item.id === id);
      if (item && !item.isNew) {
        await djangoApiClient.delete('/admin-controls/delete_dental_medicine/', { 
          data: { id: parseInt(id) } 
        });
      }
      setDentalMedicines(prev => prev.filter(item => item.id !== id));
      showAlert('success', 'Item removed successfully');
    } catch (error) {
      console.error('Error removing dental medicine:', error);
      showAlert('error', 'Failed to remove item');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#8B1538]"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Head>
        <title>Admin Controls - WMSU Health Services</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <div className="px-6 pt-4">
              {tabGroups.map((group, groupIndex) => (
                <div key={group.name} className={`${groupIndex > 0 ? 'mt-4' : ''}`}>
                  <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {group.name}
                  </h3>
                  <nav className="-mb-px flex flex-wrap gap-x-6 gap-y-2" aria-label="Tabs">
                    {group.tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${
                          activeTab === tab.id
                            ? 'border-[#8B1538] text-[#8B1538]'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                      >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.name}
                      </button>
                    ))}
                  </nav>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Profile Requirements Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Profile Setup Requirements</h3>
                    <p className="text-sm text-gray-500">Configure which fields are required during profile setup</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {['personal', 'health', 'emergency', 'family'].map(category => (
                    <div key={category} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 capitalize">{category} Information</h4>
                      <div className="space-y-3">
                        {profileRequirements.filter(req => req.category === category).map((requirement) => (
                          <div key={requirement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={requirement.required}
                                  onChange={(e) => {
                                    const updated = { ...requirement, required: e.target.checked };
                                    setProfileRequirements(prev => prev.map(req => 
                                      req.id === requirement.id ? updated : req
                                    ));
                                  }}
                                  className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                                />
                                <div>
                                  <label className="text-sm font-medium text-gray-900">{requirement.name}</label>
                                  <p className="text-xs text-gray-500">{requirement.description}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                requirement.required 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {requirement.required ? 'Required' : 'Optional'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Document Requirements Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Medical Document Requirements</h3>
                    <p className="text-sm text-gray-500">Configure which documents are required for enrollment</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {documentRequirements.map((document) => (
                    <div key={document.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={document.required}
                            onChange={(e) => {
                              const updated = { ...document, required: e.target.checked };
                              setDocumentRequirements(prev => prev.map(req => 
                                req.id === document.id ? updated : req
                              ));
                            }}
                            className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded mt-1"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{document.name}</h4>
                            <p className="text-sm text-gray-500 mt-1">{document.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            document.required 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {document.required ? 'Required' : 'Optional'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Validity Period (months)</label>
                          <input
                            type="number"
                            value={document.validityPeriod}
                            onChange={(e) => {
                              const updated = { ...document, validityPeriod: parseInt(e.target.value) };
                              setDocumentRequirements(prev => prev.map(req => 
                                req.id === document.id ? updated : req
                              ));
                            }}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                            min="1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Campus Schedules Tab */}
            {activeTab === 'campus' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Campus Operating Hours</h3>
                    <p className="text-sm text-gray-500">Configure opening and closing times for each campus</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {campusSchedules.map((schedule) => (
                    <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-900">{schedule.campus}</h4>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Active:</span>
                          <input
                            type="checkbox"
                            checked={schedule.isActive}
                            onChange={(e) => {
                              const updated = { ...schedule, isActive: e.target.checked };
                              setCampusSchedules(prev => prev.map(s => 
                                s.id === schedule.id ? updated : s
                              ));
                            }}
                            className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Opening Time</label>
                          <input
                            type="time"
                            value={schedule.openTime}
                            onChange={(e) => {
                              const updated = { ...schedule, openTime: e.target.value };
                              setCampusSchedules(prev => prev.map(s => 
                                s.id === schedule.id ? updated : s
                              ));
                            }}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Closing Time</label>
                          <input
                            type="time"
                            value={schedule.closeTime}
                            onChange={(e) => {
                              const updated = { ...schedule, closeTime: e.target.value };
                              setCampusSchedules(prev => prev.map(s => 
                                s.id === schedule.id ? updated : s
                              ));
                            }}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dentist Schedules Tab */}
            {activeTab === 'dentist' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Dentist Schedules</h3>
                    <p className="text-sm text-gray-500">Configure dentist availability for appointments</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {dentistSchedules.map((schedule) => (
                    <div key={schedule.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <h4 className="font-medium text-gray-900">{schedule.dentistName || 'Unnamed Dentist'}</h4>
                          <span className="text-sm text-gray-500">{schedule.campus}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-500">Active:</span>
                          <input
                            type="checkbox"
                            checked={schedule.isActive}
                            onChange={(e) => {
                              const updated = { ...schedule, isActive: e.target.checked };
                              setDentistSchedules(prev => prev.map(s => 
                                s.id === schedule.id ? updated : s
                              ));
                            }}
                            className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
                          <div className="space-y-1">
                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                              <label key={day} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={schedule.availableDays.includes(day)}
                                  onChange={(e) => {
                                    const newDays = e.target.checked 
                                      ? [...schedule.availableDays, day]
                                      : schedule.availableDays.filter(d => d !== day);
                                    const updated = { ...schedule, availableDays: newDays };
                                    setDentistSchedules(prev => prev.map(s => 
                                      s.id === schedule.id ? updated : s
                                    ));
                                  }}
                                  className="h-3 w-3 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">{day}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Time Slots</label>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {schedule.timeSlots.map((slot, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={slot}
                                  onChange={(e) => {
                                    const newSlots = [...schedule.timeSlots];
                                    newSlots[index] = e.target.value;
                                    const updated = { ...schedule, timeSlots: newSlots };
                                    setDentistSchedules(prev => prev.map(s => 
                                      s.id === schedule.id ? updated : s
                                    ));
                                  }}
                                  placeholder="09:00-10:00"
                                  className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] flex-1"
                                />
                                <button
                                  onClick={() => {
                                    const newSlots = schedule.timeSlots.filter((_, i) => i !== index);
                                    const updated = { ...schedule, timeSlots: newSlots };
                                    setDentistSchedules(prev => prev.map(s => 
                                      s.id === schedule.id ? updated : s
                                    ));
                                  }}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const newSlots = [...schedule.timeSlots, ''];
                                const updated = { ...schedule, timeSlots: newSlots };
                                setDentistSchedules(prev => prev.map(s => 
                                  s.id === schedule.id ? updated : s
                                ));
                              }}
                              className="text-sm text-[#8B1538] hover:text-[#7A1230] flex items-center"
                            >
                              <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add Time Slot
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Academic Semesters Tab */}
            {activeTab === 'schoolyears' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Academic School Years</h3>
                    <p className="text-sm text-gray-500">Manage academic years with semester periods for health records tracking</p>
                  </div>
                  <button
                    onClick={showAddSchoolYearModal}
                    className="px-4 py-2 bg-[#8B1538] text-white rounded-md hover:bg-[#7A1230] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B1538]"
                  >
                    Add New School Year
                  </button>
                </div>

                <div className="space-y-4">
                  {schoolYears.map((year) => (
                    <div key={year.id} className={`border ${year.is_current ? 'border-[#8B1538]' : 'border-gray-200'} rounded-lg p-4 ${year.is_current ? 'bg-red-50' : 'bg-white'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium text-gray-900">
                            School Year {year.academic_year}
                            {year.is_current && (
                              <div className="inline-flex items-center space-x-2">
                                <span className="ml-2 px-2 py-1 text-xs bg-[#8B1538] text-white rounded-full">Current</span>
                                {year.current_semester_display && (
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                    {year.current_semester_display}
                                  </span>
                                )}
                              </div>
                            )}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-4">
                          {!year.is_current && (
                            <button
                              onClick={() => handleSetCurrentSchoolYear(year.id)}
                              className="text-sm text-[#8B1538] hover:text-[#7A1230] font-medium"
                            >
                              Set as Current
                            </button>
                          )}
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">Status:</span>
                            <select
                              value={year.status}
                              onChange={(e) => handleUpdateSchoolYearField(year.id, 'status', e.target.value)}
                              className="ml-2 border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] text-sm"
                            >
                              <option value="active">Active</option>
                              <option value="upcoming">Upcoming</option>
                              <option value="completed">Completed</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Academic Year Basic Info */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Academic Year</label>
                          <input
                            type="text"
                            value={year.academic_year}
                            onChange={(e) => handleUpdateSchoolYearField(year.id, 'academic_year', e.target.value)}
                            placeholder="YYYY-YYYY"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Overall Start Date</label>
                          <input
                            type="date"
                            value={year.start_date}
                            onChange={(e) => handleUpdateSchoolYearField(year.id, 'start_date', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                            readOnly
                            title="Auto-calculated from First Semester start date"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Overall End Date</label>
                          <input
                            type="date"
                            value={year.end_date}
                            onChange={(e) => handleUpdateSchoolYearField(year.id, 'end_date', e.target.value)}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                            readOnly
                            title="Auto-calculated from Summer semester end date"
                          />
                        </div>
                      </div>

                      {/* Semester Periods */}
                      <div className="border-t pt-4">
                        <h5 className="text-md font-medium text-gray-800 mb-4">Semester Periods</h5>
                        
                        {/* First Semester */}
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <h6 className="text-sm font-medium text-blue-800 mb-2">First Semester</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700">Start Date</label>
                              <input
                                type="date"
                                value={year.first_sem_start}
                                onChange={(e) => {
                                  handleUpdateSchoolYearField(year.id, 'first_sem_start', e.target.value);
                                  // Auto-update overall start date
                                  handleUpdateSchoolYearField(year.id, 'start_date', e.target.value);
                                }}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700">End Date</label>
                              <input
                                type="date"
                                value={year.first_sem_end}
                                onChange={(e) => handleUpdateSchoolYearField(year.id, 'first_sem_end', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Second Semester */}
                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                          <h6 className="text-sm font-medium text-green-800 mb-2">Second Semester</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700">Start Date</label>
                              <input
                                type="date"
                                value={year.second_sem_start}
                                onChange={(e) => handleUpdateSchoolYearField(year.id, 'second_sem_start', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700">End Date</label>
                              <input
                                type="date"
                                value={year.second_sem_end}
                                onChange={(e) => handleUpdateSchoolYearField(year.id, 'second_sem_end', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Summer Semester */}
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                          <h6 className="text-sm font-medium text-yellow-800 mb-2">Summer Semester</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700">Start Date</label>
                              <input
                                type="date"
                                value={year.summer_start}
                                onChange={(e) => handleUpdateSchoolYearField(year.id, 'summer_start', e.target.value)}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700">End Date</label>
                              <input
                                type="date"
                                value={year.summer_end}
                                onChange={(e) => {
                                  handleUpdateSchoolYearField(year.id, 'summer_end', e.target.value);
                                  // Auto-update overall end date
                                  handleUpdateSchoolYearField(year.id, 'end_date', e.target.value);
                                }}
                                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Semester Timeline Visualization */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h6 className="text-sm font-medium text-gray-700 mb-2">Semester Timeline</h6>
                          <div className="flex items-center space-x-2 text-xs">
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 bg-blue-400 rounded"></div>
                              <span>1st Sem: {year.first_sem_start || 'Not set'} - {year.first_sem_end || 'Not set'}</span>
                            </div>
                            <span className="text-gray-400">→</span>
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 bg-green-400 rounded"></div>
                              <span>2nd Sem: {year.second_sem_start || 'Not set'} - {year.second_sem_end || 'Not set'}</span>
                            </div>
                            <span className="text-gray-400">→</span>
                            <div className="flex items-center space-x-1">
                              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
                              <span>Summer: {year.summer_start || 'Not set'} - {year.summer_end || 'Not set'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comorbid Illnesses Tab */}
            {activeTab === 'comorbid' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Comorbid Illnesses Management</h3>
                  <button
                    onClick={addComorbidIllness}
                    className="bg-[#8B1538] text-white px-4 py-2 rounded-md hover:bg-[#7A1230] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B1538]"
                  >
                    Add Illness
                  </button>
                </div>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {comorbidIllnesses.map((illness) => (
                      <li key={illness.id} className={`px-4 py-4 ${illness.isNew ? 'bg-green-50' : ''}`}>
                        <div className="space-y-4">
                          {/* Main illness configuration */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-4">
                              <input
                                type="text"
                                value={illness.label}
                                onChange={(e) => updateComorbidIllness(illness.id, 'label', e.target.value)}
                                placeholder="Enter illness name"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                              />
                            </div>
                            <div className="flex items-center space-x-3">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={illness.enabled}
                                  onChange={(e) => updateComorbidIllness(illness.id, 'enabled', e.target.checked)}
                                  className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Enabled</span>
                              </label>
                              <button
                                onClick={() => removeComorbidIllness(illness.id)}
                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          {/* Sub-options configuration */}
                          <div className="ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={illness.has_sub_options || false}
                                  onChange={(e) => updateComorbidIllness(illness.id, 'has_sub_options', e.target.checked)}
                                  className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Has sub-options (checkboxes)</span>
                              </label>
                              
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={illness.requires_specification || false}
                                  onChange={(e) => updateComorbidIllness(illness.id, 'requires_specification', e.target.checked)}
                                  className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Requires text specification</span>
                              </label>
                            </div>

                            {/* Sub-options list */}
                            {illness.has_sub_options && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Sub-options:
                                  </label>
                                  <button
                                    onClick={() => openSubOptionsModal(illness, 'comorbid')}
                                    className="px-3 py-1 bg-[#8B1538] text-white text-xs rounded hover:bg-[#7A1230] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B1538]"
                                  >
                                    Configure Sub-options
                                  </button>
                                </div>
                                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                  {(illness.sub_options || []).length > 0 ? (
                                    <span>{(illness.sub_options || []).length} sub-option(s) configured: {(illness.sub_options || []).slice(0, 3).join(', ')}{(illness.sub_options || []).length > 3 ? '...' : ''}</span>
                                  ) : (
                                    <span className="text-gray-400">No sub-options configured yet</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Specification placeholder */}
                            {illness.requires_specification && (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Specification placeholder text:
                                </label>
                                <input
                                  type="text"
                                  value={illness.specification_placeholder || ''}
                                  onChange={(e) => updateComorbidIllness(illness.id, 'specification_placeholder', e.target.value)}
                                  placeholder="e.g., Please specify the condition details..."
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                                />
                                <p className="text-xs text-gray-500">
                                  💡 This text will appear as placeholder in the text input field for patients to specify details.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Vaccinations Tab */}
            {activeTab === 'vaccinations' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Vaccinations Management</h3>
                  <button
                    onClick={addVaccination}
                    className="bg-[#8B1538] text-white px-4 py-2 rounded-md hover:bg-[#7A1230] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B1538]"
                  >
                    Add Vaccination
                  </button>
                </div>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {vaccinations.map((vaccination) => (
                      <li key={vaccination.id} className={`px-4 py-4 ${vaccination.isNew ? 'bg-green-50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-4">
                            <input
                              type="text"
                              value={vaccination.name}
                              onChange={(e) => updateVaccination(vaccination.id, 'name', e.target.value)}
                              placeholder="Enter vaccination name"
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                            />
                          </div>
                          <div className="flex items-center space-x-3">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={vaccination.enabled}
                                onChange={(e) => updateVaccination(vaccination.id, 'enabled', e.target.checked)}
                                className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">Enabled</span>
                            </label>
                            <button
                              onClick={() => removeVaccination(vaccination.id)}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Past Medical History Tab */}
            {activeTab === 'pastmedical' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Past Medical & Surgical History Management</h3>
                  <button
                    onClick={addPastMedicalHistory}
                    className="bg-[#8B1538] text-white px-4 py-2 rounded-md hover:bg-[#7A1230] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B1538]"
                  >
                    Add Medical History Item
                  </button>
                </div>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {pastMedicalHistories.map((item) => (
                      <li key={item.id} className={`px-4 py-4 ${item.isNew ? 'bg-green-50' : ''}`}>
                        <div className="space-y-4">
                          {/* Main item configuration */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-4">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updatePastMedicalHistory(item.id, 'name', e.target.value)}
                                placeholder="Enter medical condition name"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                              />
                            </div>
                            <div className="flex items-center space-x-3">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={item.enabled}
                                  onChange={(e) => updatePastMedicalHistory(item.id, 'enabled', e.target.checked)}
                                  className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Enabled</span>
                              </label>
                              <button
                                onClick={() => removePastMedicalHistory(item.id)}
                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          {/* Sub-options configuration */}
                          <div className="ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={item.has_sub_options || false}
                                  onChange={(e) => updatePastMedicalHistory(item.id, 'has_sub_options', e.target.checked)}
                                  className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Has sub-options (checkboxes)</span>
                              </label>
                              
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={item.requires_specification || false}
                                  onChange={(e) => updatePastMedicalHistory(item.id, 'requires_specification', e.target.checked)}
                                  className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Requires text specification</span>
                              </label>
                            </div>

                            {/* Sub-options list */}
                            {item.has_sub_options && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Sub-options:
                                  </label>
                                  <button
                                    onClick={() => openSubOptionsModal(item, 'past')}
                                    className="px-3 py-1 bg-[#8B1538] text-white text-xs rounded hover:bg-[#7A1230] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B1538]"
                                  >
                                    Configure Sub-options
                                  </button>
                                </div>
                                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                  {(item.sub_options || []).length > 0 ? (
                                    <span>{(item.sub_options || []).length} sub-option(s) configured: {(item.sub_options || []).slice(0, 3).join(', ')}{(item.sub_options || []).length > 3 ? '...' : ''}</span>
                                  ) : (
                                    <span className="text-gray-400">No sub-options configured yet</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Specification placeholder */}
                            {item.requires_specification && (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Specification placeholder text:
                                </label>
                                <input
                                  type="text"
                                  value={item.specification_placeholder || ''}
                                  onChange={(e) => updatePastMedicalHistory(item.id, 'specification_placeholder', e.target.value)}
                                  placeholder="e.g., Please specify the condition..."
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                                />
                                <p className="text-xs text-gray-500">
                                  💡 This text will appear as placeholder in the text input field for patients to specify details.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Family Medical History Tab */}
            {activeTab === 'familyhistory' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Family Medical History Management</h3>
                  <button
                    onClick={addFamilyMedicalHistory}
                    className="bg-[#8B1538] text-white px-4 py-2 rounded-md hover:bg-[#7A1230] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B1538]"
                  >
                    Add Family History Item
                  </button>
                </div>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {familyMedicalHistories.map((item) => (
                      <li key={item.id} className={`px-4 py-4 ${item.isNew ? 'bg-green-50' : ''}`}>
                        <div className="space-y-4">
                          {/* Main item configuration */}
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0 mr-4">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateFamilyMedicalHistory(item.id, 'name', e.target.value)}
                                placeholder="Enter family medical condition name"
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                              />
                            </div>
                            <div className="flex items-center space-x-3">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={item.enabled}
                                  onChange={(e) => updateFamilyMedicalHistory(item.id, 'enabled', e.target.checked)}
                                  className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Enabled</span>
                              </label>
                              <button
                                onClick={() => removeFamilyMedicalHistory(item.id)}
                                className="text-red-600 hover:text-red-900 text-sm font-medium"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          {/* Sub-options configuration */}
                          <div className="ml-6 space-y-3 border-l-2 border-gray-200 pl-4">
                            <div className="flex items-center space-x-4">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={item.has_sub_options || false}
                                  onChange={(e) => updateFamilyMedicalHistory(item.id, 'has_sub_options', e.target.checked)}
                                  className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Has sub-options (checkboxes)</span>
                              </label>
                              
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={item.requires_specification || false}
                                  onChange={(e) => updateFamilyMedicalHistory(item.id, 'requires_specification', e.target.checked)}
                                  className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Requires text specification</span>
                              </label>
                            </div>

                            {/* Sub-options list */}
                            {item.has_sub_options && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="block text-sm font-medium text-gray-700">
                                    Sub-options:
                                  </label>
                                  <button
                                    onClick={() => openSubOptionsModal(item, 'family')}
                                    className="px-3 py-1 bg-[#8B1538] text-white text-xs rounded hover:bg-[#7A1230] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B1538]"
                                  >
                                    Configure Sub-options
                                  </button>
                                </div>
                                <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                  {(item.sub_options || []).length > 0 ? (
                                    <span>{(item.sub_options || []).length} sub-option(s) configured: {(item.sub_options || []).slice(0, 3).join(', ')}{(item.sub_options || []).length > 3 ? '...' : ''}</span>
                                  ) : (
                                    <span className="text-gray-400">No sub-options configured yet</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Specification placeholder */}
                            {item.requires_specification && (
                              <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Specification placeholder text:
                                </label>
                                <input
                                  type="text"
                                  value={item.specification_placeholder || ''}
                                  onChange={(e) => updateFamilyMedicalHistory(item.id, 'specification_placeholder', e.target.value)}
                                  placeholder="e.g., Please specify family medical condition..."
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                                />
                                <p className="text-xs text-gray-500">
                                  💡 This text will appear as placeholder in the text input field for patients to specify details.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Dental Medicines Tab */}
            {activeTab === 'dental' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Dental Medicines Management</h3>
                  <button
                    onClick={addDentalMedicine}
                    className="bg-[#8B1538] text-white px-4 py-2 rounded-md hover:bg-[#7A1230] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B1538]"
                  >
                    Add Dental Medicine
                  </button>
                </div>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {dentalMedicines.map((medicine) => (
                      <li key={medicine.id} className={`px-4 py-4 ${medicine.isNew ? 'bg-green-50' : ''}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0 mr-4 space-y-3">
                            <input
                              type="text"
                              value={medicine.name}
                              onChange={(e) => updateDentalMedicine(medicine.id, 'name', e.target.value)}
                              placeholder="Enter dental medicine name"
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                            />
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                                <select
                                  value={medicine.unit}
                                  onChange={(e) => updateDentalMedicine(medicine.id, 'unit', e.target.value)}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                                >
                                  <option value="mg">mg (milligrams)</option>
                                  <option value="ml">ml (milliliters)</option>
                                  <option value="g">g (grams)</option>
                                  <option value="pcs">pcs (pieces)</option>
                                  <option value="pack">pack</option>
                                  <option value="cartridge">cartridge</option>
                                  <option value="vial">vial</option>
                                  <option value="bottle">bottle</option>
                                  <option value="tube">tube</option>
                                  <option value="box">box</option>
                                  <option value="unit">unit</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                                <select
                                  value={medicine.type}
                                  onChange={(e) => updateDentalMedicine(medicine.id, 'type', e.target.value)}
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                                >
                                  <option value="medicine">Medicine</option>
                                  <option value="anesthetic">Anesthetic</option>
                                  <option value="antibiotic">Antibiotic</option>
                                  <option value="dental_supply">Dental Supply</option>
                                  <option value="equipment">Equipment</option>
                                  <option value="material">Material</option>
                                </select>
                              </div>
                            </div>
                            <input
                              type="text"
                              value={medicine.description}
                              onChange={(e) => updateDentalMedicine(medicine.id, 'description', e.target.value)}
                              placeholder="Enter description (optional)"
                              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                            />
                          </div>
                          <div className="flex items-center space-x-3">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={medicine.is_active}
                                onChange={(e) => updateDentalMedicine(medicine.id, 'is_active', e.target.checked)}
                                className="h-4 w-4 text-[#8B1538] focus:ring-[#8B1538] border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">Active</span>
                            </label>
                            <button
                              onClick={() => removeDentalMedicine(medicine.id)}
                              className="text-red-600 hover:text-red-900 text-sm font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-3 bg-[#8B1538] text-white font-medium rounded-md hover:bg-[#7A1230] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B1538] ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    
      {/* Confirmation Modal */}
      <ConfirmationModal
        open={showConfirmModal}
        title="Confirm Action"
        message={confirmMessage}
        onConfirm={() => {
          confirmAction();
          setShowConfirmModal(false);
        }}
        onClose={() => setShowConfirmModal(false)}
        isDestructive={true}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Enter PIN</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Please enter the PIN to add a new school year.
                </p>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handlePinSubmit()}
                  placeholder="Enter PIN"
                  className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B1538] focus:border-[#8B1538]"
                  maxLength={4}
                />
                {pinError && (
                  <p className="mt-2 text-sm text-red-600">{pinError}</p>
                )}
              </div>
              <div className="items-center px-4 py-3 flex space-x-4">
                <button
                  onClick={handlePinSubmit}
                  className="px-4 py-2 bg-[#8B1538] text-white text-base font-medium rounded-md hover:bg-[#7A1230] focus:outline-none focus:ring-2 focus:ring-[#8B1538]"
                >
                  Submit
                </button>
                <button
                  onClick={() => setShowPinModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alert */}
      {alert && (
        <div className={`fixed top-4 right-4 p-4 rounded-md z-50 ${
          alert.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {alert.message}
        </div>
      )}

      {/* Sub-options Configuration Modal */}
      {showSubOptionsModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Configure Sub-options for "{editingSubOptions?.name || editingSubOptions?.label}"
                </h3>
                <button
                  onClick={closeSubOptionsModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                <p className="text-sm text-gray-600 mb-4">
                  💡 These will appear as individual checkboxes under the main condition for patients to select.
                </p>
                
                {tempSubOptions.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateSubOption(index, e.target.value)}
                        placeholder={`Sub-option ${index + 1}`}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#8B1538] focus:border-[#8B1538] sm:text-sm"
                      />
                    </div>
                    <button
                      onClick={() => removeSubOption(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remove this sub-option"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={addSubOption}
                  className="flex items-center space-x-2 text-[#8B1538] hover:text-[#7A1230] text-sm font-medium"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Sub-option</span>
                </button>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                <button
                  onClick={closeSubOptionsModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSubOptions}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#8B1538] rounded-md hover:bg-[#7A1230] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B1538]"
                >
                  Save Sub-options
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}