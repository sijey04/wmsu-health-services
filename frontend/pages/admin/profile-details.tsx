// frontend/pages/admin/patient-profile-details.tsx
import AdminLayout from '../../components/AdminLayout';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import { djangoApiClient, patientsAPI } from '../../utils/api';
import { PrinterIcon } from '@heroicons/react/24/outline';

export default function PatientProfileDetails() {
  const router = useRouter();
  const { patient_id } = router.query;
  
  const [patient, setPatient] = useState<any>(null);
  const [semester, setSemester] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (patient_id) {
      fetchPatientData();
    }
  }, [patient_id]);

  const fetchPatientData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch patient data
      const patientRes = await patientsAPI.getById(parseInt(patient_id as string));
      const patientData = patientRes.data;
      setPatient(patientData);
      
      // Fetch semester information if patient has school_year
      if (patientData.school_year) {
        try {
          const semesterRes = await djangoApiClient.get(`/academic-school-years/${patientData.school_year}/`);
          setSemester(semesterRes.data);
        } catch (err) {
          console.warn('Could not fetch semester data:', err);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch patient data:', err);
      setError('Failed to load patient information.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-lg text-gray-600">Loading patient information...</div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !patient) {
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || 'Patient not found.'}
          </div>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Go Back
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-6 print:shadow-none">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2 print:hidden">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              >
                ← Back
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                <PrinterIcon className="h-5 w-5 mr-2" />
                Print Profile
              </button>
            </div>
            <div className="text-center flex-grow">
              <h2 className="text-xl font-bold text-[#800000]">WESTERN MINDANAO STATE UNIVERSITY</h2>
              <p className="text-sm text-gray-700">ZAMBOANGA CITY</p>
              <p className="text-sm text-gray-700">UNIVERSITY HEALTH SERVICES CENTER</p>
              <p className="text-sm text-gray-700">Tel. No. (062) 991-8739 | Email: healthservices@wmsu.edu.ph</p>
              {semester && (
                <div className="mt-2">
                  <p className="text-sm font-semibold text-blue-700">
                    Academic Year: {semester.academic_year} - {semester.semester_type} Semester
                  </p>
                </div>
              )}
            </div>
            <div className="w-16 h-16 print:block hidden">{/* Spacer for print */}</div>
          </div>
          <div className="bg-[#800000] text-white text-center py-2 rounded-md">
            <h3 className="text-lg font-semibold">PATIENT HEALTH PROFILE & CONSULTATIONS RECORD</h3>
            <p className="text-sm">(Electronic or Paper-based Input)</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Left Sidebar for Navigation */}
          <div className="md:col-span-1 bg-[#800000] rounded-xl shadow-lg p-4 text-white print:hidden">
            <div className="flex items-center mb-4">
              <div className="relative h-20 w-20 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center">
                {patient.photo ? (
                  <img src={patient.photo} alt={patient.name} className="h-20 w-20 object-cover" />
                ) : (
                  <svg className="h-16 w-16 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" />
                  </svg>
                )}
              </div>
              <p className="ml-3 font-semibold">{patient.name}</p>
            </div>
            <ul className="space-y-2">
              <li className="p-2 rounded-md bg-[#600000] font-medium">Personal Information</li>
              <li className="p-2 rounded-md hover:bg-[#600000] cursor-pointer">Comorbid Illnesses</li>
              <li className="p-2 rounded-md hover:bg-[#600000] cursor-pointer">Maintenance Medications</li>
              <li className="p-2 rounded-md hover:bg-[#600000] cursor-pointer">COVID-19 Vaccination</li>
              <li className="p-2 rounded-md hover:bg-[#600000] cursor-pointer">Menstrual & Obstetric History</li>
              <li className="p-2 rounded-md hover:bg-[#600000] cursor-pointer">Past Medical & Surgical History</li>
              <li className="p-2 rounded-md hover:bg-[#600000] cursor-pointer">Family Medical History</li>
            </ul>
          </div>

          {/* Right Content Area for Form Fields */}
          <div className="md:col-span-3 bg-white rounded-xl shadow-lg p-6 space-y-8 print:col-span-4 print:shadow-none">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-xl font-bold text-[#800000] mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name-first" className="block text-sm font-medium text-gray-700">Name:</label>
                  <div className="flex space-x-2 mt-1">
                    <input type="text" id="name-first" value={patient.first_name || ''} readOnly className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                    <input type="text" id="name-middle" value={patient.middle_name || ''} readOnly className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                    <input type="text" id="name-last" value={patient.name?.split(' ').pop() || ''} readOnly className="w-1/4 border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                  </div>
                </div>
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age:</label>
                  <input type="text" id="age" value={patient.age || 'N/A'} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                </div>
                <div>
                  <label htmlFor="sex" className="block text-sm font-medium text-gray-700">Sex:</label>
                  <input type="text" id="sex" value={patient.gender || 'N/A'} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                </div>
                <div>
                  <label htmlFor="course" className="block text-sm font-medium text-gray-700">Course:</label>
                  <input type="text" id="course" value={patient.course || patient.user_type || 'N/A'} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                </div>
                <div>
                  <label htmlFor="year-level" className="block text-sm font-medium text-gray-700">Year Level:</label>
                  <input type="text" id="year-level" value={patient.year_level || 'N/A'} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                </div>
                <div>
                  <label htmlFor="birthday" className="block text-sm font-medium text-gray-700">Birthday:</label>
                  <input type="text" id="birthday" value={patient.date_of_birth || 'N/A'} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                </div>
                <div>
                  <label htmlFor="religion" className="block text-sm font-medium text-gray-700">Religion:</label>
                  <input type="text" id="religion" value={patient.religion || 'N/A'} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                </div>
                <div>
                  <label htmlFor="nationality" className="block text-sm font-medium text-gray-700">Nationality:</label>
                  <input type="text" id="nationality" value={patient.nationality === 'Foreigner' && patient.nationality_specify ? patient.nationality_specify : (patient.nationality || 'N/A')} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                </div>
                <div>
                  <label htmlFor="civil-status" className="block text-sm font-medium text-gray-700">Civil Status:</label>
                  <input type="text" id="civil-status" value={patient.civil_status || 'N/A'} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address:</label>
                  <input type="email" id="email" value={patient.email || patient.user_email || 'N/A'} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Contact #:</label>
                  <input type="text" id="contact" value={patient.contact_number || 'N/A'} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="city-address" className="block text-sm font-medium text-gray-700">City Address:</label>
                  <input type="text" id="city-address" value={`${patient.street || ''}, ${patient.barangay || ''}, ${patient.city_municipality || 'Zamboanga City'}`} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="provincial-address" className="block text-sm font-medium text-gray-700">Provincial Address (if applicable):</label>
                  <input type="text" id="provincial-address" value={patient.provincial_address || 'N/A'} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="emergency-contact" className="block text-sm font-medium text-gray-700">Emergency Contact Person</label>
                  <div className="grid grid-cols-3 gap-4 mt-1">
                    <input type="text" value={`${patient.emergency_contact_first_name || ''} ${patient.emergency_contact_middle_name || ''} ${patient.emergency_contact_surname || ''}`} readOnly placeholder="Name" className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                    <input type="text" value={patient.emergency_contact_number || 'N/A'} readOnly placeholder="Contact #" className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                    <input type="text" value={patient.emergency_contact_relationship || 'N/A'} readOnly placeholder="Relationship" className="border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="emergency-city-address" className="block text-sm font-medium text-gray-700">Emergency Contact Address:</label>
                  <input type="text" id="emergency-city-address" value={`${patient.emergency_contact_street || ''}, ${patient.emergency_contact_barangay || ''}`} readOnly className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50" />
                </div>
              </div>
            </div>

            {/* Comorbid Illnesses Section */}
            <div>
              <h3 className="text-xl font-bold text-[#800000] mb-4">Comorbid Illnesses</h3>
              <p className="text-sm font-medium text-gray-700 mb-2">Which of these conditions do you currently have?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center">
                  <input id="bronchial-asthma" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="bronchial-asthma" className="ml-2 block text-sm text-gray-900">Bronchial Asthma (&ldquo;Hika&rdquo;)</label>
                </div>
                <div className="flex items-center">
                  <input id="food-allergies" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="food-allergies" className="ml-2 block text-sm text-gray-900">Food Allergies</label>
                </div>
                <div className="flex items-center">
                  <input id="allergic-rhinitis" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="allergic-rhinitis" className="ml-2 block text-sm text-gray-900">Allergic Rhinitis</label>
                </div>
                <div className="flex items-center">
                  <input id="hyperthyroidism" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="hyperthyroidism" className="ml-2 block text-sm text-gray-900">Hyperthyroidism</label>
                </div>
                <div className="flex items-center">
                  <input id="hypothyroidism-goiter" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="hypothyroidism-goiter" className="ml-2 block text-sm text-gray-900">Hypothyroidism/Goiter</label>
                </div>
                <div className="flex items-center">
                  <input id="anemia" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="anemia" className="ml-2 block text-sm text-gray-900">Anemia</label>
                </div>
                <div className="flex items-center">
                  <input id="major-depressive-disorder" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="major-depressive-disorder" className="ml-2 block text-sm text-gray-900">Major Depressive Disorder</label>
                </div>
                <div className="flex items-center">
                  <input id="bipolar-disorder" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="bipolar-disorder" className="ml-2 block text-sm text-gray-900">Bipolar Disorder</label>
                </div>
                <div className="flex items-center">
                  <input id="generalized-anxiety-disorder" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="generalized-anxiety-disorder" className="ml-2 block text-sm text-gray-900">Generalized Anxiety Disorder</label>
                </div>
                <div className="flex items-center">
                  <input id="panic-disorder" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="panic-disorder" className="ml-2 block text-sm text-gray-900">Panic Disorder</label>
                </div>
                <div className="flex items-center">
                  <input id="posttraumatic-stress-disorder" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="posttraumatic-stress-disorder" className="ml-2 block text-sm text-gray-900">Posttraumatic Stress Disorder</label>
                </div>
                <div className="flex items-center">
                  <input id="schizophrenia" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="schizophrenia" className="ml-2 block text-sm text-gray-900">Schizophrenia</label>
                </div>
                <div className="flex items-center">
                  <input id="migraine-headaches" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="migraine-headaches" className="ml-2 block text-sm text-gray-900">Migraine (recurrent headaches)</label>
                </div>
                <div className="flex items-center">
                  <input id="epilepsy-seizures" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="epilepsy-seizures" className="ml-2 block text-sm text-gray-900">Epilepsy/Seizures</label>
                </div>
                <div className="flex items-center">
                  <input id="gerd" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="gerd" className="ml-2 block text-sm text-gray-900">Gastroesophageal Reflux Disease (GERD)</label>
                </div>
                <div className="flex items-center">
                  <input id="irritable-bowel-syndrome" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="irritable-bowel-syndrome" className="ml-2 block text-sm text-gray-900">Irritable Bowel Syndrome</label>
                </div>
                <div className="flex items-center">
                  <input id="hypertension" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="hypertension" className="ml-2 block text-sm text-gray-900">Hypertension (elevated blood pressure)</label>
                </div>
                <div className="flex items-center">
                  <input id="diabetes-mellitus" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="diabetes-mellitus" className="ml-2 block text-sm text-gray-900">Diabetes mellitus (elevated blood sugar)</label>
                </div>
                <div className="flex items-center">
                  <input id="dyslipidemia" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="dyslipidemia" className="ml-2 block text-sm text-gray-900">Dyslipidemia (elevated cholesterol levels)</label>
                </div>
                <div className="flex items-center">
                  <input id="arthritis" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="arthritis" className="ml-2 block text-sm text-gray-900">Arthritis (joint pains)</label>
                </div>
                <div className="flex items-center">
                  <input id="sle" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="sle" className="ml-2 block text-sm text-gray-900">Systemic Lupus Erythematosus (SLE)</label>
                </div>
                <div className="flex items-center">
                  <input id="pcos" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="pcos" className="ml-2 block text-sm text-gray-900">Polycystic Ovarian Syndrome (PCOS)</label>
                </div>
                <div className="flex items-center">
                  <input id="cancer" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="cancer" className="ml-2 block text-sm text-gray-900">Cancer</label>
                </div>
                <div className="flex items-center">
                  <input id="other-comorbid" type="checkbox" className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="other-comorbid" className="ml-2 block text-sm text-gray-900">Other</label>
                </div>
              </div>
            </div>

            {/* Maintenance Medications Section */}
            <div>
              <h3 className="text-xl font-bold text-[#800000] mb-4">Maintenance Medications</h3>
              <table className="min-w-full divide-y divide-gray-200 border border-gray-300 rounded-md">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generic Name of Drug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dose and Frequency</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{i + 1}.</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="text" className="w-full border border-gray-200 rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-[#800000]" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input type="text" className="w-full border border-gray-200 rounded-md py-1 px-2 focus:outline-none focus:ring-1 focus:ring-[#800000]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* COVID-19 Vaccination Section */}
            <div>
              <h3 className="text-xl font-bold text-[#800000] mb-4">COVID-19 Vaccination</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input id="fully-vaccinated" name="covid-vaccination" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="fully-vaccinated" className="ml-2 block text-sm text-gray-900">Fully vaccinated (Primary series with or without booster shot/s)</label>
                </div>
                <div className="flex items-center">
                  <input id="partially-vaccinated" name="covid-vaccination" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="partially-vaccinated" className="ml-2 block text-sm text-gray-900">Partially vaccinated (Incomplete primary series)</label>
                </div>
                <div className="flex items-center">
                  <input id="not-vaccinated" name="covid-vaccination" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="not-vaccinated" className="ml-2 block text-sm text-gray-900">Not vaccinated</label>
                </div>
              </div>
            </div>

            {/* Menstrual & Obstetric History Section */}
            <div>
              <h3 className="text-xl font-bold text-[#800000] mb-4">Menstrual & Obstetric History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <label htmlFor="menstruation-age" className="block text-sm font-medium text-gray-700">Age when menstruation began:</label>
                  <input type="text" id="menstruation-age" defaultValue="0" className="w-16 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#800000] focus:border-[#800000]" />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input id="regular-monthly" name="menstrual-regularity" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                    <label htmlFor="regular-monthly" className="ml-2 block text-sm text-gray-900">Regular (monthly)</label>
                  </div>
                  <div className="flex items-center">
                    <input id="irregular" name="menstrual-regularity" type="checkbox" className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                    <label htmlFor="irregular" className="ml-2 block text-sm text-gray-900">Irregular</label>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="number-pregnancies" className="block text-sm font-medium text-gray-700">Number of pregnancies:</label>
                  <input type="text" id="number-pregnancies" defaultValue="0" className="w-16 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#800000] focus:border-[#800000]" />
                </div>
                <div className="flex items-center space-x-2">
                  <label htmlFor="live-children" className="block text-sm font-medium text-gray-700">Number of live children:</label>
                  <input type="text" id="live-children" defaultValue="0" className="w-16 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#800000] focus:border-[#800000]" />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-700 mt-4 mb-2">Menstrual Symptoms:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center">
                  <input id="dysmenorrhea" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="dysmenorrhea" className="ml-2 block text-sm text-gray-900">Dysmenorrhea (cramps)</label>
                </div>
                <div className="flex items-center">
                  <input id="migraine-menstrual" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="migraine-menstrual" className="ml-2 block text-sm text-gray-900">Migraine</label>
                </div>
                <div className="flex items-center">
                  <input id="loss-of-consciousness" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="loss-of-consciousness" className="ml-2 block text-sm text-gray-900">Loss of consciousness</label>
                </div>
                <div className="flex items-center">
                  <input id="other-menstrual" type="checkbox" className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="other-menstrual" className="ml-2 block text-sm text-gray-900">Other</label>
                </div>
              </div>
            </div>

            {/* Past Medical & Surgical History Section */}
            <div>
              <h3 className="text-xl font-bold text-[#800000] mb-4">Past Medical & Surgical History</h3>
              <p className="text-sm font-medium text-gray-700 mb-2">Which of these conditions have you had in the past?</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center">
                  <input id="varicella" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="varicella" className="ml-2 block text-sm text-gray-900">Varicella (Chicken Pox)</label>
                </div>
                <div className="flex items-center">
                  <input id="measles" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="measles" className="ml-2 block text-sm text-gray-900">Measles</label>
                </div>
                <div className="flex items-center">
                  <input id="dengue" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="dengue" className="ml-2 block text-sm text-gray-900">Dengue</label>
                </div>
                <div className="flex items-center">
                  <input id="typhoid-fever" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="typhoid-fever" className="ml-2 block text-sm text-gray-900">Typhoid fever</label>
                </div>
                <div className="flex items-center">
                  <input id="tuberculosis" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="tuberculosis" className="ml-2 block text-sm text-gray-900">Tuberculosis</label>
                </div>
                <div className="flex items-center">
                  <input id="amoebiasis" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="amoebiasis" className="ml-2 block text-sm text-gray-900">Amoebiasis</label>
                </div>
                <div className="flex items-center">
                  <input id="pneumonia" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="pneumonia" className="ml-2 block text-sm text-gray-900">Pneumonia</label>
                </div>
                <div className="flex items-center">
                  <input id="nephrolithiasis" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="nephrolithiasis" className="ml-2 block text-sm text-gray-900">Nephro/Urolithiasis (kidney stones)</label>
                </div>
                <div className="flex items-center">
                  <input id="urinary-tract-infection" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="urinary-tract-infection" className="ml-2 block text-sm text-gray-900">Urinary Tract Infection</label>
                </div>
                <div className="flex items-center">
                  <input id="appendicitis" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="appendicitis" className="ml-2 block text-sm text-gray-900">Appendicitis</label>
                </div>
                <div className="flex items-center">
                  <input id="injury" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="injury" className="ml-2 block text-sm text-gray-900">Injury</label>
                </div>
                <div className="flex items-center">
                  <input id="burn" type="checkbox" className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="burn" className="ml-2 block text-sm text-gray-900">Burn</label>
                </div>
                <div className="flex items-center">
                  <input id="cholecystitis" type="checkbox" className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="cholecystitis" className="ml-2 block text-sm text-gray-900">Cholecystitis</label>
                </div>
                <div className="flex items-center">
                  <input id="stab-laceration" type="checkbox" className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="stab-laceration" className="ml-2 block text-sm text-gray-900">Stab/Laceration</label>
                </div>
                <div className="flex items-center">
                  <input id="fracture" type="checkbox" className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="fracture" className="ml-2 block text-sm text-gray-900">Fracture</label>
                </div>
                <div className="flex items-center">
                  <input id="other-past-medical" type="checkbox" className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="other-past-medical" className="ml-2 block text-sm text-gray-900">Other</label>
                </div>
              </div>

              <p className="text-sm font-medium text-gray-700 mt-4 mb-2">Have you ever been admitted to the hospital and/or underwent a surgery?</p>
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input id="hospital-no-1" name="hospital-admission-1" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                    <label htmlFor="hospital-no-1" className="ml-2 block text-sm text-gray-900">No</label>
                  </div>
                  <div className="flex items-center">
                    <input id="hospital-yes-1" name="hospital-admission-1" type="checkbox" className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                    <label htmlFor="hospital-yes-1" className="ml-2 block text-sm text-gray-900">Yes</label>
                  </div>
                  <label htmlFor="hospital-year-1" className="block text-sm font-medium text-gray-700">Year:</label>
                  <input type="text" id="hospital-year-1" className="w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#800000] focus:border-[#800000]" />
                  <label htmlFor="hospital-reason-1" className="block text-sm font-medium text-gray-700">Reason/s:</label>
                  <input type="text" id="hospital-reason-1" className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#800000] focus:border-[#800000]" />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input id="hospital-no-2" name="hospital-admission-2" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                    <label htmlFor="hospital-no-2" className="ml-2 block text-sm text-gray-900">No</label>
                  </div>
                  <div className="flex items-center">
                    <input id="hospital-yes-2" name="hospital-admission-2" type="checkbox" className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                    <label htmlFor="hospital-yes-2" className="ml-2 block text-sm text-gray-900">Yes</label>
                  </div>
                  <label htmlFor="hospital-year-2" className="block text-sm font-medium text-gray-700">Year:</label>
                  <input type="text" id="hospital-year-2" className="w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#800000] focus:border-[#800000]" />
                  <label htmlFor="hospital-reason-2" className="block text-sm font-medium text-gray-700">Reason/s:</label>
                  <input type="text" id="hospital-reason-2" className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#800000] focus:border-[#800000]" />
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input id="hospital-no-3" name="hospital-admission-3" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                    <label htmlFor="hospital-no-3" className="ml-2 block text-sm text-gray-900">No</label>
                  </div>
                  <div className="flex items-center">
                    <input id="hospital-yes-3" name="hospital-admission-3" type="checkbox" className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                    <label htmlFor="hospital-yes-3" className="ml-2 block text-sm text-gray-900">Yes</label>
                  </div>
                  <label htmlFor="hospital-year-3" className="block text-sm font-medium text-gray-700">Year:</label>
                  <input type="text" id="hospital-year-3" className="w-24 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#800000] focus:border-[#800000]" />
                  <label htmlFor="hospital-reason-3" className="block text-sm font-medium text-gray-700">Reason/s:</label>
                  <input type="text" id="hospital-reason-3" className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-[#800000] focus:border-[#800000]" />
                </div>
              </div>
            </div>

            {/* Family Medical History Section */}
            <div>
              <h3 className="text-xl font-bold text-[#800000] mb-4">Family Medical History</h3>
              <p className="text-sm font-medium text-gray-700 mb-2">Indicate the known health condition/s of your immediate family members.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="flex items-center">
                  <input id="family-hypertension" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-hypertension" className="ml-2 block text-sm text-gray-900">Hypertension (elevated blood pressure)</label>
                </div>
                <div className="flex items-center">
                  <input id="family-coronary-artery-disease" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-coronary-artery-disease" className="ml-2 block text-sm text-gray-900">Coronary Artery Disease</label>
                </div>
                <div className="flex items-center">
                  <input id="family-congestive-heart-failure" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-congestive-heart-failure" className="ml-2 block text-sm text-gray-900">Congestive Heart Failure</label>
                </div>
                <div className="flex items-center">
                  <input id="family-diabetes-mellitus" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-diabetes-mellitus" className="ml-2 block text-sm text-gray-900">Diabetes mellitus (elevated blood sugar)</label>
                </div>
                <div className="flex items-center">
                  <input id="family-chronic-kidney-disease" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-chronic-kidney-disease" className="ml-2 block text-sm text-gray-900">Chronic Kidney Disease (with/without regular Hemodialysis)</label>
                </div>
                <div className="flex items-center">
                  <input id="family-dyslipidemia" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-dyslipidemia" className="ml-2 block text-sm text-gray-900">Dyslipidemia (elevated cholesterol levels)</label>
                </div>
                <div className="flex items-center">
                  <input id="family-arthritis" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-arthritis" className="ml-2 block text-sm text-gray-900">Arthritis (joint pains)</label>
                </div>
                <div className="flex items-center">
                  <input id="family-cancer" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-cancer" className="ml-2 block text-sm text-gray-900">Cancer</label>
                </div>
                <div className="flex items-center">
                  <input id="family-bronchial-asthma" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-bronchial-asthma" className="ml-2 block text-sm text-gray-900">Bronchial Asthma (&ldquo;Hika&rdquo;)</label>
                </div>
                <div className="flex items-center">
                  <input id="family-chronic-obstructive-pulmonary-disease" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-chronic-obstructive-pulmonary-disease" className="ml-2 block text-sm text-gray-900">Chronic Obstructive Pulmonary Disease (COPD)</label>
                </div>
                <div className="flex items-center">
                  <input id="family-food-allergies" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-food-allergies" className="ml-2 block text-sm text-gray-900">Food Allergies</label>
                </div>
                <div className="flex items-center">
                  <input id="family-allergic-rhinitis" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-allergic-rhinitis" className="ml-2 block text-sm text-gray-900">Allergic Rhinitis</label>
                </div>
                <div className="flex items-center">
                  <input id="family-hyperthyroidism" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-hyperthyroidism" className="ml-2 block text-sm text-gray-900">Hyperthyroidism</label>
                </div>
                <div className="flex items-center">
                  <input id="family-hypothyroidism-goiter" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-hypothyroidism-goiter" className="ml-2 block text-sm text-gray-900">Hypothyroidism/Goiter</label>
                </div>
                <div className="flex items-center">
                  <input id="family-major-depressive-disorder" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-major-depressive-disorder" className="ml-2 block text-sm text-gray-900">Major Depressive Disorder</label>
                </div>
                <div className="flex items-center">
                  <input id="family-bipolar-disorder" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-bipolar-disorder" className="ml-2 block text-sm text-gray-900">Bipolar Disorder</label>
                </div>
                <div className="flex items-center">
                  <input id="family-generalized-anxiety-disorder" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-generalized-anxiety-disorder" className="ml-2 block text-sm text-gray-900">Generalized Anxiety Disorder</label>
                </div>
                <div className="flex items-center">
                  <input id="family-panic-disorder" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-panic-disorder" className="ml-2 block text-sm text-gray-900">Panic Disorder</label>
                </div>
                <div className="flex items-center">
                  <input id="family-posttraumatic-stress-disorder" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-posttraumatic-stress-disorder" className="ml-2 block text-sm text-gray-900">Posttraumatic Stress Disorder</label>
                </div>
                <div className="flex items-center">
                  <input id="family-schizophrenia" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-schizophrenia" className="ml-2 block text-sm text-gray-900">Schizophrenia</label>
                </div>
                <div className="flex items-center">
                  <input id="family-epilepsy-seizures" type="checkbox" defaultChecked className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="family-epilepsy-seizures" className="ml-2 block text-sm text-gray-900">Epilepsy/Seizures</label>
                </div>
                <div className="flex items-center">
                  <input id="other-family-medical" type="checkbox" className="h-4 w-4 text-[#800000] border-gray-300 rounded focus:ring-[#800000]" />
                  <label htmlFor="other-family-medical" className="ml-2 block text-sm text-gray-900">Other</label>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
}