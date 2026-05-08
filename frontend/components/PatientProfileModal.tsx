import React from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { waiversAPI } from '../utils/api';
import { exportPatientProfilePDF, exportWaiverPDF } from '../utils/reportExport';

interface Patient {
  // Basic info
  id?: number;
  user?: number;
  student_id: string;
  name: string;
  first_name?: string;
  middle_name?: string;
  suffix?: string;
  photo?: string;
  
  // Personal details
  gender: string;
  date_of_birth?: string;
  age?: number;
  department?: string;
  contact_number?: string;
  email?: string;
  address?: string;
  city_municipality?: string;
  barangay?: string;
  street?: string;
  blood_type?: string;
  religion?: string;
  nationality?: string;
  nationality_specify?: string;
  civil_status?: string;
  
  // Emergency contact
  emergency_contact_surname?: string;
  emergency_contact_first_name?: string;
  emergency_contact_middle_name?: string;
  emergency_contact_number?: string;
  emergency_contact_relationship?: string;
  emergency_contact_address?: string;
  emergency_contact_barangay?: string;
  emergency_contact_street?: string;
  
  // Health information
  comorbid_illnesses?: (string | object)[] | null;
  psychiatric_illnesses?: string[] | null;
  food_allergy_specify?: string;
  other_comorbid_specify?: string;
  maintenance_medications?: (string | { 
    drug?: string; 
    drug_type?: string;
    custom_drug?: string;
    name?: string; 
    dose?: string; 
    dosage?: string; 
    unit?: string; 
    frequency?: string;
    frequency_type?: string;
    custom_frequency?: string;
    duration?: string;
    duration_type?: string;
    custom_duration?: string;
  })[] | null;
  vaccination_history?: any | null;
  past_medical_history?: (string | object)[] | null;
  past_medical_history_other?: string;
  hospital_admission_or_surgery?: boolean;
  hospital_admission_details?: string;
  family_medical_history?: (string | object)[] | null;
  family_medical_history_other?: string;
  family_medical_history_allergies?: string;
  allergies?: string;
  food_allergy_specify?: string;
  other_comorbid_specify?: string;
  
  // User account information
  user_email?: string;
  user_name?: string;
  user_first_name?: string;
  user_middle_name?: string;
  user_last_name?: string;
  
  // School year information
  school_year?: {
    id: number;
    academic_year: string;
    semester_type?: string;
    is_current?: boolean;
  };
  
  // Timestamps
  created_at?: string;
  updated_at?: string;
}

interface PatientProfileModalProps {
  open: boolean;
  patient: Patient | any;
  allPatientProfiles?: Patient[]; // All profiles for this patient across different years
  onClose: () => void;
}

interface Waiver {
  id: number;
  user: number;
  patient: number;
  full_name: string;
  date_signed: string;
  signature: string;
  created_at: string;
}

const PatientProfileModal: React.FC<PatientProfileModalProps> = ({ 
  open, 
  patient, 
  allPatientProfiles = [], 
  onClose 
}) => {
  const [selectedProfile, setSelectedProfile] = React.useState<Patient | null>(null);
  const [activeTab, setActiveTab] = React.useState<'current' | 'history' | 'waiver' | 'dental'>('current');
  const [waiver, setWaiver] = React.useState<Waiver | null>(null);
  const [loadingWaiver, setLoadingWaiver] = React.useState(false);

  const fetchWaiver = React.useCallback(async () => {
    if (!patient?.user) return;
    
    setLoadingWaiver(true);
    try {
      const response = await waiversAPI.getAll();
      const waivers = Array.isArray(response.data) ? response.data : [];
      const userWaiver = waivers.find((w: Waiver) => w.user === patient.user);
      setWaiver(userWaiver || null);
    } catch (error) {
      console.error('Failed to fetch waiver:', error);
      setWaiver(null);
    } finally {
      setLoadingWaiver(false);
    }
  }, [patient?.user]);

  React.useEffect(() => {
    console.log('=== PatientProfileModal Debug ===');
    console.log('Patient:', patient);
    console.log('Patient User ID:', patient?.user);
    console.log('All Patient Profiles received:', allPatientProfiles);
    console.log('All Patient Profiles count:', allPatientProfiles.length);
    
    if (patient && allPatientProfiles.length > 0) {
      // Set the most recent profile as the default selected profile
      // Use string comparison to handle both string and number user IDs
      const userProfiles = allPatientProfiles.filter(profile => 
        String(profile.user) === String(patient.user)
      );
      
      console.log('Filtered User Profiles:', userProfiles);
      console.log('Filtered User Profiles count:', userProfiles.length);
      
      // Create a new sorted array (don't mutate)
      const sortedByDate = [...userProfiles].sort((a, b) => {
        const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
        const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
        return dateB - dateA; // Most recent first
      });
      
      console.log('Sorted Profiles:', sortedByDate);
      console.log('Sorted Profiles count:', sortedByDate.length);
      
      // Use the most recent profile, or fall back to patient prop
      const mostRecentProfile = sortedByDate[0] || patient;
      console.log('Most Recent Profile selected:', mostRecentProfile);
      setSelectedProfile(mostRecentProfile);
      fetchWaiver();
    } else if (patient) {
      // If no profiles array yet, just use patient
      console.log('No allPatientProfiles, using patient directly');
      setSelectedProfile(patient);
      fetchWaiver();
    }
    console.log('=== End PatientProfileModal Debug ===');
  }, [patient, allPatientProfiles, fetchWaiver]);

  // Filter and sort profiles - must be before early return to avoid conditional hook calls
  const sortedProfiles = React.useMemo(() => {
    console.log('=== sortedProfiles useMemo Debug ===');
    console.log('patient?.user:', patient?.user);
    console.log('patient?.user type:', typeof patient?.user);
    console.log('allPatientProfiles.length:', allPatientProfiles.length);
    
    if (!patient?.user || !allPatientProfiles.length) {
      console.log('Returning empty array - no patient user or no profiles');
      return [];
    }
    
    // Filter profiles to only show those belonging to the current patient's user account
    // Use loose equality to handle both string and number types
    const userProfiles = allPatientProfiles.filter(profile => {
      const matches = String(profile.user) === String(patient.user);
      console.log(`Profile ${profile.id} user: ${profile.user} (${typeof profile.user}), patient user: ${patient.user} (${typeof patient.user}), matches: ${matches}`);
      return matches;
    });
    
    console.log('User Profiles (filtered):', userProfiles);
    console.log('User Profiles count:', userProfiles.length);
    
    // Sort all profiles by date (most recent first) to show complete edit history
    const sorted = [...userProfiles].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
      const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
      return dateB - dateA; // Most recent first
    });
    
    console.log('Sorted profiles:', sorted);
    console.log('Sorted profiles count:', sorted.length);
    console.log('=== End sortedProfiles Debug ===');
    
    return sorted;
  }, [patient?.user, allPatientProfiles]);

  if (!open || !patient) return null;

  const handleProfileSelect = (profile: Patient) => {
    setSelectedProfile(profile);
    setActiveTab('current'); // Switch to Current Profile tab to view the selected version
  };

  const displayedProfile = selectedProfile || patient;

  // Get the most recent profile (latest update) as the current one to display
  const currentProfile = sortedProfiles[0] || patient;
  
  // Get all other profiles (edit history) - all previous updates/versions
  // Use string comparison to avoid type mismatch issues between string and number IDs
  const profileHistory = sortedProfiles.filter(p => {
    const isDifferent = String(p.id) !== String(currentProfile?.id);
    console.log(`Profile ${p.id} vs Current ${currentProfile?.id}: isDifferent=${isDifferent}`);
    return isDifferent;
  });
  
  console.log('=== Display Logic Debug ===');
  console.log('displayedProfile:', displayedProfile);
  console.log('displayedProfile.id:', displayedProfile?.id, 'type:', typeof displayedProfile?.id);
  console.log('currentProfile:', currentProfile);
  console.log('currentProfile.id:', currentProfile?.id, 'type:', typeof currentProfile?.id);
  console.log('sortedProfiles.length:', sortedProfiles.length);
  console.log('profileHistory count:', profileHistory.length);
  console.log('profileHistory:', profileHistory);
  console.log('=== End Display Logic Debug ===');
  
  // Helper to format profile version label
  const getProfileVersionLabel = (profile: Patient, index: number) => {
    const date = new Date(profile.updated_at || profile.created_at || '');
    const dateStr = date.toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const academicInfo = `${profile.school_year?.academic_year || 'Unknown'}${profile.school_year?.semester_type ? ` - ${profile.school_year.semester_type}` : ''}`;
    
    if (index === 0) {
      // Most recent profile
      return `${academicInfo} (Latest Update) - ${dateStr}`;
    } else {
      // Previous versions
      return `${academicInfo} - ${dateStr}`;
    }
  };

  // Helper function to safely render array data that might contain strings or objects
  const renderArrayData = (data: any[], field: string): string => {
    if (!data || !Array.isArray(data)) return '';
    return data.map((item) => {
      if (typeof item === 'string') {
        return item;
      } else if (typeof item === 'object' && item !== null) {
        if (field === 'maintenance_medications') {
          const drug = (item.drug === 'Others' || item.drug_type === 'Others') ? item.custom_drug : (item.drug || item.drug_type || item.name || 'Unknown');
          const dose = item.dose || item.dosage || '';
          const unit = item.unit || '';
          const frequency = item.frequency_type === 'specify' ? item.custom_frequency : (item.frequency || item.frequency_type || '');
          return `${drug}${dose ? ` ${dose}${unit}` : ''}${frequency ? ` - ${frequency}` : ''}`;
        } else if (field === 'vaccination_history') {
          if ((item as any).vaccine && (item as any).date) {
            return `${(item as any).vaccine} (${(item as any).date})`;
          } else if ((item as any).name || (item as any).vaccine) {
            return (item as any).name || (item as any).vaccine;
          } else {
            return (item as any).type || 'Unknown vaccine';
          }
        } else {
          return item.name || item.condition || item.illness || item.history || 'Unknown';
        }
      }
      return String(item);
    }).join(', ');
  };

  // Helper function to render vaccination history object
  const renderVaccinationHistory = (vaccinationHistory: any): string => {
    if (!vaccinationHistory || typeof vaccinationHistory !== 'object') return 'No vaccinations recorded';
    
    const statuses = Object.entries(vaccinationHistory)
      .filter(([vaccine, status]) => status && status !== 'lapsed')
      .map(([vaccine, status]) => `${vaccine}: ${status}`)
      .join(', ');
    
    return statuses || 'No vaccinations recorded';
  };

  // Helper function to render maintenance medications with proper formatting
  const renderMaintainanceMedications = (medications: any[]): JSX.Element => {
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return <div className="p-3 min-h-[60px]">None reported</div>;
    }

    return (
      <div className="space-y-2">
        {medications.map((med, index) => {
          const drugName = (med.drug === 'Others' || med.drug_type === 'Others') ? med.custom_drug : (med.drug || med.drug_type || med.name || 'Unknown medication');
          const frequency = med.frequency_type === 'specify' ? med.custom_frequency : (med.frequency || med.frequency_type || '');
          const duration = med.duration_type === 'specify' ? med.custom_duration : (med.duration || med.duration_type || '');
          
          return (
            <div key={index} className="p-3 border-b border-gray-200 last:border-b-0">
              <div className="font-medium text-sm">
                {drugName}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {med.dose || med.dosage ? `${med.dose || med.dosage}${med.unit ? ` ${med.unit}` : ''}` : ''}
                {(med.dose || med.dosage) && frequency ? ' - ' : ''}
                {frequency}
                {duration ? ` (${duration})` : ''}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper function to render vaccination status with proper formatting
  const renderVaccinationStatus = (vaccinationHistory: any): JSX.Element => {
    if (!vaccinationHistory || typeof vaccinationHistory !== 'object') {
      return <div className="p-3 min-h-[60px]">No vaccinations recorded</div>;
    }

    const entries = Object.entries(vaccinationHistory).filter(([vaccine, status]) => status);
    
    if (entries.length === 0) {
      return <div className="p-3 min-h-[60px]">No vaccinations recorded</div>;
    }

    return (
      <div className="space-y-2">
        {entries.map(([vaccine, status], index) => (
          <div key={index} className="p-3 border-b border-gray-200 last:border-b-0">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">{vaccine}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                status === 'fully_vaccinated' || status === 'boosted' ? 'bg-green-100 text-green-800' :
                status === 'partially_vaccinated' ? 'bg-yellow-100 text-yellow-800' :
                status === 'unvaccinated' || status === 'lapsed' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {status === 'fully_vaccinated' ? 'Fully Vaccinated' :
                 status === 'partially_vaccinated' ? 'Partially Vaccinated' :
                 status === 'unvaccinated' ? 'Unvaccinated' :
                 status === 'boosted' ? 'Boosted' :
                 status === 'lapsed' ? 'Lapsed' :
                 String(status)}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  function renderProfileContent(profile: Patient) {
    return (
      <div className="space-y-6 text-sm">
        {/* Personal Information Section */}
        <div className="border border-gray-400 relative">
          {/* Vertical Section Label */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-[#8B0000] border-r border-gray-400 flex items-center justify-center">
            <div className="transform -rotate-90 whitespace-nowrap text-[10px] font-bold text-white tracking-wide">
              PERSONAL INFORMATION
            </div>
          </div>
          
          {/* Content with Photo and Details */}
          <div className="pl-24 p-4 flex gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              <div className="w-24 h-32 border border-gray-400 bg-gray-50 flex items-center justify-center">
                {profile.photo ? (
                  <img 
                    src={profile.photo.startsWith('http') ? profile.photo : `${(process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api').replace('/api', '')}${profile.photo}`} 
                    alt="Patient" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="text-center text-gray-500">
                    <UserCircleIcon className="h-12 w-12 mx-auto mb-1" />
                    <p className="text-xs">Photo</p>
                  </div>
                )}
              </div>
              <div className="text-center text-xs mt-1 border border-gray-400 p-1">
                2x2 Picture
              </div>
            </div>

            {/* Personal Details Table */}
            <div className="flex-1">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50 w-24">Name:</td>
                    <td className="border border-gray-400 p-2" colSpan={3}>{profile.name || ''}</td>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50 w-16">Sex:</td>
                    <td className="border border-gray-400 p-2 w-20">{profile.gender || ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Age:</td>
                    <td className="border border-gray-400 p-2 w-20">{profile.age || ''}</td>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50 w-24">Year Level:</td>
                    <td className="border border-gray-400 p-2 w-20">N/A</td>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Religion:</td>
                    <td className="border border-gray-400 p-2">{profile.religion || ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Course:</td>
                    <td className="border border-gray-400 p-2" colSpan={3}>{profile.department || ''}</td>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Civil Status:</td>
                    <td className="border border-gray-400 p-2">{profile.civil_status || ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Birthday:</td>
                    <td className="border border-gray-400 p-2" colSpan={3}>
                      {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : ''}
                    </td>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Nationality:</td>
                    <td className="border border-gray-400 p-2">
                      {profile.nationality === 'Foreigner' && profile.nationality_specify ? (
                        `${profile.nationality_specify}`
                      ) : (
                        profile.nationality || ''
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Email:</td>
                    <td className="border border-gray-400 p-2" colSpan={5}>{profile.email || ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Contact #:</td>
                    <td className="border border-gray-400 p-2" colSpan={5}>{profile.contact_number || ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">City/Municipality:</td>
                    <td className="border border-gray-400 p-2" colSpan={5}>{profile.city_municipality || ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Barangay:</td>
                    <td className="border border-gray-400 p-2" colSpan={5}>{profile.barangay || ''}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Street:</td>
                    <td className="border border-gray-400 p-2" colSpan={5}>{profile.street || ''}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Emergency Contact Section */}
        <div className="border border-gray-400 relative">
          {/* Vertical Section Label */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-[#8B0000] border-r border-gray-400 flex items-center justify-center">
            <div className="transform -rotate-90 whitespace-nowrap text-[10px] font-bold text-white tracking-wide">
              EMERGENCY <br /> CONTACT
            </div>
          </div>
          
          <div className="pl-24 p-4">
            <div className="mb-2 font-medium text-sm">Emergency Contact Person within Zamboanga City:</div>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="border border-gray-400 p-2 font-medium bg-gray-50 w-24">Name:</td>
                  <td className="border border-gray-400 p-2" colSpan={2}>
                    {`${profile.emergency_contact_first_name || ''} ${profile.emergency_contact_middle_name || ''} ${profile.emergency_contact_surname || ''}`.trim()}
                  </td>
                  <td className="border border-gray-400 p-2 font-medium bg-gray-50 w-24">Contact #:</td>
                  <td className="border border-gray-400 p-2">{profile.emergency_contact_number || ''}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 font-medium bg-gray-50">Relationship:</td>
                  <td className="border border-gray-400 p-2" colSpan={2}>{profile.emergency_contact_relationship || ''}</td>
                  <td className="border border-gray-400 p-2 font-medium bg-gray-50">Barangay:</td>
                  <td className="border border-gray-400 p-2">{profile.emergency_contact_barangay || ''}</td>
                </tr>
                <tr>
                  <td className="border border-gray-400 p-2 font-medium bg-gray-50">Street:</td>
                  <td className="border border-gray-400 p-2" colSpan={4}>{profile.emergency_contact_street || ''}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Health Information Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Health Info */}
          <div className="border border-gray-400 relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-[#8B0000] border-r border-gray-400 flex items-center justify-center">
              <div className="transform -rotate-90 whitespace-nowrap text-[10px] font-bold text-white tracking-wide">
                HEALTH INFO
              </div>
            </div>
            
            <div className="pl-24 p-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Blood Type:</td>
                    <td className="border border-gray-400 p-2">{profile.blood_type || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Allergies:</td>
                    <td className="border border-gray-400 p-2">{profile.allergies || 'None reported'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Vaccination History:</td>
                    <td className="border border-gray-400 p-2">
                      {profile.vaccination_history && typeof profile.vaccination_history === 'object' ? 
                        renderVaccinationHistory(profile.vaccination_history) : 
                        'No vaccinations recorded'
                      }
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Record Information */}
          <div className="border border-gray-400 relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-[#8B0000] border-r border-gray-400 flex items-center justify-center">
              <div className="transform -rotate-90 whitespace-nowrap text-[10px] font-bold text-white tracking-wide">
                RECORD INFO
              </div>
            </div>
            
            <div className="pl-24 p-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Student ID:</td>
                    <td className="border border-gray-400 p-2">{profile.student_id || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Profile Created:</td>
                    <td className="border border-gray-400 p-2">
                      {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-400 p-2 font-medium bg-gray-50">Last Updated:</td>
                    <td className="border border-gray-400 p-2">
                      {profile.updated_at ? new Date(profile.updated_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                  {profile.school_year && (
                    <tr>
                      <td className="border border-gray-400 p-2 font-medium bg-gray-50">Semester:</td>
                      <td className="border border-gray-400 p-2">
                        {profile.school_year.academic_year}
                        {profile.school_year.semester_type && ` - ${profile.school_year.semester_type}`}
                        {profile.school_year.is_current && ' (Current)'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Medical History Sections */}
        <div className="space-y-4">
          {/* Comorbid Illnesses */}
          <div className="border border-gray-400 relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-[#8B0000] border-r border-gray-400 flex items-center justify-center">
              <div className="transform -rotate-90 whitespace-nowrap text-[10px] font-bold text-white tracking-wide">
                COMORBID ILLNESSES
              </div>
            </div>
            
            <div className="pl-24 p-4">
              <div className="mb-2 font-medium text-sm">Reported Conditions:</div>
              <div className="border border-gray-400 p-3 min-h-[60px] bg-gray-50 space-y-3">
                {(() => {
                  const comorbidData = profile.comorbid_illnesses || [];
                  const foodAllergies: any[] = [];
                  const psychiatricConditions: any[] = [];
                  const respiratoryConditions: any[] = [];
                  const otherConditions: any[] = [];
                  
                  // Categorize conditions
                  comorbidData.forEach((item: any) => {
                    const itemStr = typeof item === 'string' ? item : (item.name || item.condition || item.illness || '');
                    const itemLower = itemStr.toLowerCase();
                    
                    if (itemLower.includes('food allerg') || itemLower.includes('shellfish') || 
                        itemLower.includes('nuts') || itemLower.includes('dairy') || 
                        itemLower.includes('eggs') || itemLower.includes('wheat') || 
                        itemLower.includes('gluten') || itemLower.includes('soy')) {
                      foodAllergies.push(item);
                    } else if (itemLower.includes('psychiatric') || itemLower.includes('depression') || 
                               itemLower.includes('anxiety') || itemLower.includes('bipolar') || 
                               itemLower.includes('schizophrenia') || itemLower.includes('ptsd')) {
                      psychiatricConditions.push(item);
                    } else if (itemLower.includes('asthma') || itemLower.includes('copd') || 
                               itemLower.includes('respiratory') || itemLower.includes('bronchitis') || 
                               itemLower.includes('emphysema')) {
                      respiratoryConditions.push(item);
                    } else {
                      otherConditions.push(item);
                    }
                  });
                  
                  const hasAnyConditions = foodAllergies.length > 0 || psychiatricConditions.length > 0 || 
                                          respiratoryConditions.length > 0 || otherConditions.length > 0 ||
                                          profile.food_allergy_specify || profile.other_comorbid_specify;
                  
                  if (!hasAnyConditions) {
                    return <div className="text-gray-500">None reported</div>;
                  }
                  
                  return (
                    <>
                      {/* Food Allergies */}
                      {(foodAllergies.length > 0 || profile.food_allergy_specify) && (
                        <div>
                          <div className="font-medium text-xs text-gray-700 mb-1 flex items-center">
                            <span className="mr-2">🍽️</span> Food Allergies:
                          </div>
                          <div className="text-sm pl-5">
                            {renderArrayData(foodAllergies, 'comorbid_illnesses')}
                            {profile.food_allergy_specify && (
                              <span>{foodAllergies.length > 0 ? ', ' : ''}{profile.food_allergy_specify}</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Psychiatric Conditions */}
                      {psychiatricConditions.length > 0 && (
                        <div>
                          <div className="font-medium text-xs text-gray-700 mb-1 flex items-center">
                            <span className="mr-2">🧠</span> Psychiatric Conditions:
                          </div>
                          <div className="text-sm pl-5">{renderArrayData(psychiatricConditions, 'comorbid_illnesses')}</div>
                        </div>
                      )}
                      
                      {/* Respiratory Conditions */}
                      {respiratoryConditions.length > 0 && (
                        <div>
                          <div className="font-medium text-xs text-gray-700 mb-1 flex items-center">
                            <span className="mr-2">🫁</span> Respiratory Conditions:
                          </div>
                          <div className="text-sm pl-5">{renderArrayData(respiratoryConditions, 'comorbid_illnesses')}</div>
                        </div>
                      )}
                      
                      {/* Other Medical Conditions */}
                      {(otherConditions.length > 0 || profile.other_comorbid_specify) && (
                        <div>
                          <div className="font-medium text-xs text-gray-700 mb-1 flex items-center">
                            <span className="mr-2">🏥</span> Other Medical Conditions:
                          </div>
                          <div className="text-sm pl-5">
                            {renderArrayData(otherConditions, 'comorbid_illnesses')}
                            {profile.other_comorbid_specify && (
                              <span>{otherConditions.length > 0 ? ', ' : ''}{profile.other_comorbid_specify}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Maintenance Medications */}
          <div className="border border-gray-400 relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-[#8B0000] border-r border-gray-400 flex items-center justify-center">
              <div className="transform -rotate-90 whitespace-nowrap text-[10px] font-bold text-white tracking-wide">
                MEDICATIONS
              </div>
            </div>
            
            <div className="pl-24 p-4">
              <div className="mb-2 font-medium text-sm">Maintenance Medications:</div>
              <div className="border border-gray-400 bg-gray-50">
                {profile.maintenance_medications && profile.maintenance_medications.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="border border-gray-400 p-2 bg-gray-100">Medication</th>
                        <th className="border border-gray-400 p-2 bg-gray-100">Dosage</th>
                        <th className="border border-gray-400 p-2 bg-gray-100">Frequency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profile.maintenance_medications.map((med: any, index: number) => {
                        const drugName = (med.drug === 'Others' || med.drug_type === 'Others') ? med.custom_drug : (med.drug || med.drug_type || med.name || 'Unknown');
                        const frequency = med.frequency_type === 'specify' ? med.custom_frequency : (med.frequency || med.frequency_type || '-');
                        const duration = med.duration_type === 'specify' ? med.custom_duration : (med.duration || med.duration_type || '-');
                        
                        return (
                          <tr key={index}>
                            <td className="border border-gray-400 p-2">
                              {drugName}
                            </td>
                            <td className="border border-gray-400 p-2">
                              {typeof med === 'object' ? 
                                `${med.dose || med.dosage || ''}${med.unit ? ` ${med.unit}` : ''}`.trim() || '-' : 
                                '-'
                              }
                            </td>
                            <td className="border border-gray-400 p-2">
                              {frequency} {duration !== '-' ? `(${duration})` : ''}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-3 text-center text-gray-500">No maintenance medications reported</div>
                )}
              </div>
            </div>
          </div>

          {/* Vaccination History */}
          <div className="border border-gray-400 relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-[#8B0000] border-r border-gray-400 flex items-center justify-center">
              <div className="transform -rotate-90 whitespace-nowrap text-[10px] font-bold text-white tracking-wide">
                VACCINATION HISTORY
              </div>
            </div>
            
            <div className="pl-24 p-4">
              <div className="mb-2 font-medium text-sm">Vaccination Records:</div>
              <div className="border border-gray-400 bg-gray-50">
                {profile.vaccination_history && typeof profile.vaccination_history === 'object' && Object.keys(profile.vaccination_history).length > 0 ? (
                  renderVaccinationStatus(profile.vaccination_history)
                ) : (
                  <div className="p-3 text-center text-gray-500">No vaccination records found</div>
                )}
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="border border-gray-400 relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-[#8B0000] border-r border-gray-400 flex items-center justify-center">
              <div className="transform -rotate-90 whitespace-nowrap text-[10px] font-bold text-white tracking-wide">
                MEDICAL HISTORY
              </div>
            </div>
            
            <div className="pl-24 p-4 space-y-4">
              <div>
                <div className="font-medium text-sm mb-2">Past Medical History:</div>
                <div className="border border-gray-400 p-3 min-h-[60px] bg-gray-50 space-y-1">
                  {profile.past_medical_history && profile.past_medical_history.length > 0 ? (
                    <div>{renderArrayData(profile.past_medical_history, 'past_medical_history')}</div>
                  ) : null}
                  
                  {profile.past_medical_history_other && (
                    <div className="text-sm">
                      <span className="font-medium">Other: </span>{profile.past_medical_history_other}
                    </div>
                  )}
                  
                  {(!profile.past_medical_history || profile.past_medical_history.length === 0) &&
                   !profile.past_medical_history_other && (
                    <div className="text-gray-500">None reported</div>
                  )}
                </div>
              </div>

              <div>
                <div className="font-medium text-sm mb-2">Family Medical History:</div>
                <div className="border border-gray-400 p-3 min-h-[60px] bg-gray-50 space-y-1">
                  {profile.family_medical_history && profile.family_medical_history.length > 0 ? (
                    <div>{renderArrayData(profile.family_medical_history, 'family_medical_history')}</div>
                  ) : null}
                  
                  {profile.family_medical_history_other && (
                    <div className="text-sm">
                      <span className="font-medium">Other: </span>{profile.family_medical_history_other}
                    </div>
                  )}
                  
                  {profile.family_medical_history_allergies && (
                    <div className="text-sm">
                      <span className="font-medium">Allergies: </span>{profile.family_medical_history_allergies}
                    </div>
                  )}
                  
                  {(!profile.family_medical_history || profile.family_medical_history.length === 0) &&
                   !profile.family_medical_history_other &&
                   !profile.family_medical_history_allergies && (
                    <div className="text-gray-500">None reported</div>
                  )}
                </div>
              </div>

              <div>
                <div className="font-medium text-sm mb-2">Hospital Admission/Surgery:</div>
                <div className="border border-gray-400 p-3 bg-gray-50 space-y-1">
                  <div>{profile.hospital_admission_or_surgery ? 'Yes' : 'No'}</div>
                  {profile.hospital_admission_or_surgery && profile.hospital_admission_details && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium">Details: </span>{profile.hospital_admission_details}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Full Screen Header */}
      <div className="bg-white border-b-2 border-[#8B0000] p-4 flex-shrink-0">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="bg-[#8B0000] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-red-800 transition-colors flex items-center gap-2 print:hidden"
          >
            <span>←</span> Back
          </button>

          {/* Header Content */}
          <div className="flex items-center gap-4 sm:gap-6 print:w-full print:justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center relative">
              <img 
                src="/WMSU-Logo.jpg" 
                alt="WMSU Logo" 
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              />
            </div>
            <div className="text-center">
              <h1 className="text-[#8B0000] text-lg sm:text-xl font-bold leading-tight">WESTERN MINDANAO STATE UNIVERSITY</h1>
              <p className="text-xs text-gray-600 uppercase tracking-wider">Zamboanga City</p>
              <p className="text-xs sm:text-sm font-bold text-[#8B0000] mt-1">UNIVERSITY HEALTH SERVICES CENTER</p>
              <p className="text-[10px] sm:text-xs text-gray-500 mt-1">Tel. no. (062) 991-6736 | Email: healthservices@wmsu.edu.ph</p>
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center relative">
              <img 
                src="/WMSU-HealthLogo.png" 
                alt="Health Services Logo" 
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
              />
            </div>
          </div>

          {/* Profile Selection */}
          <div className="flex items-center gap-4 print:hidden">
            {allPatientProfiles.length > 0 && (
              <div className="text-right">
                <label className="text-xs font-medium text-gray-500 block mb-1">VIEW PROFILE VERSION:</label>
                <select 
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm max-w-md"
                  value={displayedProfile.id || ''}
                  onChange={(e) => {
                    const profile = sortedProfiles.find(p => p.id === parseInt(e.target.value));
                    if (profile) handleProfileSelect(profile);
                  }}
                >
                  {sortedProfiles.map((profile, index) => (
                    <option key={profile.id} value={profile.id}>
                      {getProfileVersionLabel(profile, index)}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Title */}
      <div className="bg-[#8B0000] text-white text-center py-3 text-base font-bold flex-shrink-0">
        {activeTab === 'dental' ? 'DENTAL PATIENT INFORMATION RECORD' : 
         activeTab === 'waiver' ? 'WAIVER AND CONSENT FORM' : 
         'PATIENT HEALTH PROFILE & CONSULTATIONS RECORD'}
        {displayedProfile.school_year && (
          <span className="ml-4 text-sm opacity-90">
            {displayedProfile.school_year.academic_year}
            {displayedProfile.school_year.semester_type && ` - ${displayedProfile.school_year.semester_type}`}
            {displayedProfile.school_year.is_current && ' (Current)'}
          </span>
        )}
      </div>
      
      {/* Navigation Tabs */}
      <div className="bg-gray-50 border-b border-gray-200 flex-shrink-0 print:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'current' 
                  ? 'border-[#8B0000] text-[#8B0000]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('current')}
            >
              Current Profile
            </button>
            {profileHistory.length > 0 && (
              <button
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'history' 
                    ? 'border-[#8B0000] text-[#8B0000]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('history')}
              >
                Edit History ({profileHistory.length})
              </button>
            )}
            <button
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'dental' 
                  ? 'border-[#8B0000] text-[#8B0000]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('dental')}
            >
              Dental Information
            </button>
            <button
              className={`py-4 px-2 border-b-2 font-medium text-sm ${
                activeTab === 'waiver' 
                  ? 'border-[#8B0000] text-[#8B0000]' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('waiver')}
            >
              Waiver {waiver && '✓'}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
        <div className="max-w-7xl mx-auto p-6">
          {activeTab === 'current' ? (
            <div className="bg-white rounded-lg shadow-lg print:shadow-none">
              {/* Current Profile Content */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#8B0000]">Patient Information Record</h2>
                  <button 
                    onClick={() => exportPatientProfilePDF(displayedProfile)}
                    className="flex items-center gap-2 bg-[#8B0000] text-white px-5 py-2.5 rounded-lg hover:bg-[#660000] transition-all shadow-md active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-bold">EXPORT AS PDF</span>
                  </button>
                </div>
                <div className="text-center italic text-sm py-2 mb-4 text-gray-600">
                  (Electronic or Paper-based Input)
                </div>
                {renderProfileContent(displayedProfile)}
              </div>
            </div>
          ) : activeTab === 'waiver' ? (
            <div className="bg-white rounded-lg shadow-lg p-6 print:shadow-none print:p-0">
              <div className="flex justify-between items-center mb-6 print:hidden">
                <h2 className="text-lg font-bold text-[#8B0000]">Signed Waiver</h2>
                {waiver && (
                  <button 
                    onClick={() => exportWaiverPDF(waiver, displayedProfile.name || `${displayedProfile.first_name} ${displayedProfile.last_name}`)}
                    className="flex items-center gap-2 bg-[#8B0000] text-white px-4 py-2 rounded-lg hover:bg-[#660000] transition-colors shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export Waiver PDF
                  </button>
                )}
              </div>
              {loadingWaiver ? (
                <div className="flex justify-center items-center py-12">
                  <svg className="animate-spin h-8 w-8 text-[#8B0000]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                </div>
              ) : waiver ? (
                <div className="max-w-4xl mx-auto">
                  {/* Formal Waiver Layout */}
                  <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-gray-900 border-b-2 border-gray-900 pb-2 inline-block px-12">
                      WAIVER AND CONSENT FORM
                    </h2>
                  </div>

                  <div className="space-y-8 text-gray-800 leading-relaxed text-justify">
                    <p className="text-base">
                      I, <span className="font-bold border-b border-gray-800 px-4 min-w-[200px] inline-block text-center">{waiver.full_name}</span>, 
                      of legal age, currently enrolled/employed at Western Mindanao State University, hereby acknowledge and agree to the following:
                    </p>

                    <p>
                      I have given explicit consent to the <strong>University Health Services Center (UHSC)</strong> to collect, use, store, 
                      and process my personal and sensitive health information for the purpose of promoting and maintaining my health 
                      and general well-being as part of the school community.
                    </p>

                    <p>
                      I understand that this information will be used to maintain my medical records, facilitate consultations, 
                      and ensure that appropriate medical assistance is provided when necessary. I am aware that my data will be 
                      handled with the utmost confidentiality in accordance with the <strong>Data Privacy Act of 2012 (Republic Act 10173)</strong>.
                    </p>

                    <p>
                      This consent is given freely and voluntarily, and I understand that I may withdraw this consent at any time 
                      by providing a written notice to the University Health Services Center, subject to legal and university requirements.
                    </p>

                    <div className="mt-16 pt-8 flex flex-col items-center sm:items-end">
                      <div className="w-full max-w-xs flex flex-col items-center">
                        {waiver.signature ? (
                          <img 
                            src={waiver.signature} 
                            alt="Signature" 
                            className="max-h-24 object-contain mb-[-10px] relative z-10"
                          />
                        ) : (
                          <div className="h-20 flex items-end justify-center italic text-gray-400 text-sm">No signature on file</div>
                        )}
                        <div className="w-full border-t border-gray-900 pt-2 text-center">
                          <p className="font-bold text-base uppercase">{waiver.full_name}</p>
                          <p className="text-xs text-gray-600">Signature over Printed Name</p>
                          <p className="text-sm mt-2 font-medium">Date Signed: {new Date(waiver.date_signed).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 text-[10px] text-gray-500 border-t border-gray-100 pt-4 italic">
                      This is a system-generated document based on the electronic waiver signed on {new Date(waiver.created_at).toLocaleString()}.
                      Document ID: WMSU-UHSC-WVR-{waiver.id.toString().padStart(6, '0')}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Waiver Found</h3>
                  <p className="text-gray-500 text-sm">This patient has not yet signed a waiver for health information collection.</p>
                </div>
              )}
            </div>
          ) : activeTab === 'dental' ? (
            <div className="bg-white rounded-lg shadow-lg p-6 print:shadow-none">
              <div className="flex justify-between items-center mb-6 print:hidden">
                <h2 className="text-lg font-bold text-[#8B0000]">Dental Patient Information Record</h2>
              </div>
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h3>
                <p className="text-gray-500 text-sm">There are currently no dental patient information records for this patient.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile History */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-bold text-[#8B0000] mb-4">Profile Edit History</h2>
                <p className="text-sm text-gray-600 mb-4">
                  View all previous versions of this profile, including edits and updates made over time.
                </p>
                {profileHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No previous profile versions found.</p>
                ) : (
                  <div className="space-y-4">
                    {profileHistory.map((profile, index) => {
                      const isCurrentSemester = profile.school_year?.is_current;
                      const editDate = new Date(profile.updated_at || profile.created_at || '');
                      
                      return (
                        <div key={profile.id} className="border border-gray-200 rounded-lg p-5 hover:border-[#8B0000] transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900">
                                  {profile.school_year?.academic_year || 'Unknown'}
                                  {profile.school_year?.semester_type && ` - ${profile.school_year.semester_type}`}
                                </h3>
                                {isCurrentSemester && (
                                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                    Current Semester
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>
                                  <span className="font-medium">Last Updated:</span>{' '}
                                  {editDate.toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                                <p>
                                  <span className="font-medium">Profile ID:</span> {profile.id}
                                </p>
                                <p>
                                  <span className="font-medium">Created:</span>{' '}
                                  {profile.created_at ? new Date(profile.created_at).toLocaleString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  }) : 'N/A'}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleProfileSelect(profile)}
                              className="px-4 py-2 text-sm bg-[#8B0000] text-white rounded-lg hover:bg-red-800 transition-colors font-medium"
                            >
                              View This Version
                            </button>
                          </div>
                          
                          <div className="border-t border-gray-200 pt-3 mt-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-600">Age:</span>
                                <span className="ml-2 text-gray-900">{profile.age || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Department:</span>
                                <span className="ml-2 text-gray-900">{profile.department || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Blood Type:</span>
                                <span className="ml-2 text-gray-900">{profile.blood_type || 'N/A'}</span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600">Contact:</span>
                                <span className="ml-2 text-gray-900">{profile.contact_number || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfileModal;
