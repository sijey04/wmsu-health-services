import React from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { waiversAPI } from '../utils/api';

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
  maintenance_medications?: (string | { drug?: string; name?: string; dose?: string; dosage?: string; unit?: string; frequency?: string })[] | null;
  vaccination_history?: any | null; // Changed to any to support object structure
  past_medical_history?: (string | object)[] | null;
  past_medical_history_other?: string;
  hospital_admission_or_surgery?: boolean;
  hospital_admission_details?: string;
  family_medical_history?: (string | object)[] | null;
  family_medical_history_other?: string;
  family_medical_history_allergies?: string;
  allergies?: string;
  
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
  const [activeTab, setActiveTab] = React.useState<'current' | 'history' | 'waiver'>('current');
  const [waiver, setWaiver] = React.useState<Waiver | null>(null);
  const [loadingWaiver, setLoadingWaiver] = React.useState(false);

  React.useEffect(() => {
    if (patient) {
      setSelectedProfile(patient);
      fetchWaiver();
    }
  }, [patient]);

  const fetchWaiver = async () => {
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
  };

  if (!open || !patient) return null;

  const handleProfileSelect = (profile: Patient) => {
    setSelectedProfile(profile);
  };

  const displayedProfile = selectedProfile || patient;

  // Sort profiles by school year, with current year first
  const sortedProfiles = allPatientProfiles.sort((a, b) => {
    if (a.school_year?.is_current) return -1;
    if (b.school_year?.is_current) return 1;
    return (b.school_year?.academic_year || '').localeCompare(a.school_year?.academic_year || '');
  });

  const currentProfile = sortedProfiles.find(p => p.school_year?.is_current) || patient;
  const pastProfiles = sortedProfiles.filter(p => !p.school_year?.is_current && p.id !== patient.id);

  // Helper function to safely render array data that might contain strings or objects
  const renderArrayData = (data: any[], field: string): string => {
    if (!data || !Array.isArray(data)) return '';
    return data.map((item) => {
      if (typeof item === 'string') {
        return item;
      } else if (typeof item === 'object' && item !== null) {
        if (field === 'maintenance_medications') {
          const drug = item.drug || item.name || 'Unknown';
          const dose = item.dose || item.dosage || '';
          const unit = item.unit || '';
          const frequency = item.frequency || '';
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
        {medications.map((med, index) => (
          <div key={index} className="p-3 border-b border-gray-200 last:border-b-0">
            <div className="font-medium text-sm">
              {med.drug || med.name || 'Unknown medication'}
            </div>
            {(med.dose || med.dosage || med.unit || med.frequency) && (
              <div className="text-xs text-gray-600 mt-1">
                {med.dose || med.dosage ? `${med.dose || med.dosage}${med.unit ? ` ${med.unit}` : ''}` : ''}
                {(med.dose || med.dosage) && med.frequency ? ' - ' : ''}
                {med.frequency || ''}
              </div>
            )}
          </div>
        ))}
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
                    src={profile.photo} 
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
                      <td className="border border-gray-400 p-2 font-medium bg-gray-50">School Year:</td>
                      <td className="border border-gray-400 p-2">
                        {profile.school_year.academic_year}
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
                                          respiratoryConditions.length > 0 || otherConditions.length > 0;
                  
                  if (!hasAnyConditions) {
                    return <div className="text-gray-500">None reported</div>;
                  }
                  
                  return (
                    <>
                      {/* Food Allergies */}
                      {foodAllergies.length > 0 && (
                        <div>
                          <div className="font-medium text-xs text-gray-700 mb-1 flex items-center">
                            <span className="mr-2">🍽️</span> Food Allergies:
                          </div>
                          <div className="text-sm pl-5">{renderArrayData(foodAllergies, 'comorbid_illnesses')}</div>
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
                      {otherConditions.length > 0 && (
                        <div>
                          <div className="font-medium text-xs text-gray-700 mb-1 flex items-center">
                            <span className="mr-2">🏥</span> Other Medical Conditions:
                          </div>
                          <div className="text-sm pl-5">{renderArrayData(otherConditions, 'comorbid_illnesses')}</div>
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
                      {profile.maintenance_medications.map((med, index) => (
                        <tr key={index}>
                          <td className="border border-gray-400 p-2">
                            {typeof med === 'string' ? med : med.drug || med.name || 'Unknown'}
                          </td>
                          <td className="border border-gray-400 p-2">
                            {typeof med === 'object' ? 
                              `${med.dose || med.dosage || ''}${med.unit ? ` ${med.unit}` : ''}`.trim() || '-' : 
                              '-'
                            }
                          </td>
                          <td className="border border-gray-400 p-2">
                            {typeof med === 'object' ? med.frequency || '-' : '-'}
                          </td>
                        </tr>
                      ))}
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
            className="bg-[#8B0000] text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-red-800 transition-colors flex items-center gap-2"
          >
            <span>←</span> Back
          </button>

          {/* Header Content */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-[#8B0000] font-bold text-xs">WMSU</span>
            </div>
            <div className="text-center">
              <h1 className="text-[#8B0000] text-lg font-bold">WESTERN MINDANAO STATE UNIVERSITY</h1>
              <p className="text-xs text-gray-600">ZAMBOANGA CITY - UNIVERSITY HEALTH SERVICES CENTER</p>
              <p className="text-xs text-gray-600">Tel. no. (062) 991-6736 | Email: healthservices@wmsu.edu.ph</p>
            </div>
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-[#8B0000] font-bold text-xs">DOH</span>
            </div>
          </div>

          {/* Profile Selection */}
          <div className="flex items-center gap-4">
            {allPatientProfiles.length > 0 && (
              <div className="text-right">
                <label className="text-xs font-medium text-gray-500 block mb-1">VIEW PROFILE FROM:</label>
                <select 
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  value={displayedProfile.id || ''}
                  onChange={(e) => {
                    const profile = allPatientProfiles.find(p => p.id === parseInt(e.target.value));
                    if (profile) handleProfileSelect(profile);
                  }}
                >
                  {sortedProfiles.map(profile => (
                    <option key={profile.id} value={profile.id}>
                      {profile.school_year?.academic_year || 'Unknown Year'} 
                      {profile.school_year?.is_current && ' (Current)'}
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
        PATIENT HEALTH PROFILE & CONSULTATIONS RECORD
        {displayedProfile.school_year && (
          <span className="ml-4 text-sm opacity-90">
            Academic Year: {displayedProfile.school_year.academic_year}
            {displayedProfile.school_year.is_current && ' (Current)'}
          </span>
        )}
      </div>
      
      {/* Navigation Tabs */}
      <div className="bg-gray-50 border-b border-gray-200 flex-shrink-0">
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
            {pastProfiles.length > 0 && (
              <button
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === 'history' 
                    ? 'border-[#8B0000] text-[#8B0000]' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab('history')}
              >
                Profile History ({pastProfiles.length})
              </button>
            )}
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
            <div className="bg-white rounded-lg shadow-lg">
              {/* Current Profile Content */}
              <div className="p-6">
                <div className="text-center italic text-sm py-2 mb-4 text-gray-600">
                  (Electronic or Paper-based Input)
                </div>
                {renderProfileContent(displayedProfile)}
              </div>
            </div>
          ) : activeTab === 'waiver' ? (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-bold text-[#8B0000] mb-4">Signed Waiver</h2>
              {loadingWaiver ? (
                <div className="flex justify-center items-center py-12">
                  <svg className="animate-spin h-8 w-8 text-[#8B0000]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                </div>
              ) : waiver ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Waiver Information</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Full Name:</span>
                          <div className="mt-1 text-gray-900">{waiver.full_name}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Date Signed:</span>
                          <div className="mt-1 text-gray-900">{new Date(waiver.date_signed).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Submitted On:</span>
                          <div className="mt-1 text-gray-900">{new Date(waiver.created_at).toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Status:</span>
                          <div className="mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Signed
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">Signature</h3>
                      <div className="bg-gray-50 border border-gray-300 rounded p-4 flex items-center justify-center min-h-[150px]">
                        {waiver.signature ? (
                          <img 
                            src={waiver.signature} 
                            alt="Patient Signature" 
                            className="max-h-32 max-w-full object-contain"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">No signature image</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-semibold text-gray-900 mb-3">Waiver Agreement</h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        By signing this waiver, the individual has given explicit consent to the University Health Services
                        Center to collect, use, store, and process their personal and sensitive health information for the purpose 
                        of promoting and maintaining their health and general well-being as part of the school community.
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed mt-3">
                        This consent was provided in accordance with the Data Privacy Act of 2012 (Republic Act 10173).
                      </p>
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
          ) : (
            <div className="space-y-6">
              {/* Profile History */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-bold text-[#8B0000] mb-4">Profile History</h2>
                {pastProfiles.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No previous profiles found.</p>
                ) : (
                  <div className="grid gap-4">
                    {pastProfiles.map(profile => (
                      <div key={profile.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Academic Year: {profile.school_year?.academic_year || 'Unknown'}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Profile ID: {profile.id} | 
                              Created: {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleProfileSelect(profile)}
                            className="px-3 py-1 text-sm bg-[#8B0000] text-white rounded hover:bg-red-800 transition-colors"
                          >
                            View Details
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Age:</span>
                            <span className="ml-2">{profile.age || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Department:</span>
                            <span className="ml-2">{profile.department || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Blood Type:</span>
                            <span className="ml-2">{profile.blood_type || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Contact:</span>
                            <span className="ml-2">{profile.contact_number || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
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
