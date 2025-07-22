import React, { useState, useEffect } from 'react';
import { dentalFormAPI, djangoApiClient, patientsAPI, dentalMedicinesAPI } from '../utils/api';
import FeedbackModal from './feedbackmodal';

/**
 * DentalForm Component
 * 
 * Usage:
 * - With appointment ID: <DentalForm appointmentId="123" />
 * - With patient ID: <DentalForm patientId="456" />
 * - Without auto-fill: <DentalForm />
 * 
 * The component will automatically fetch and fill patient information
 * when appointmentId or patientId is provided.
 */

// Helper functions to calculate teeth counts based on dental chart status
const calculateTeethCounts = (permanentTeethStatus, temporaryTeethStatus) => {
  const allTeethStatus = { ...permanentTeethStatus, ...temporaryTeethStatus };
  
  let missingCount = 0;
  let decayedCount = 0;
  let filledCount = 0;
  
  Object.values(allTeethStatus).forEach((tooth: any) => {
    if (tooth.status === 'Missing' || tooth.status === 'Extracted') {
      missingCount++;
    } else if (tooth.status === 'Decayed') {
      decayedCount++;
    } else if (tooth.status === 'Filled') {
      filledCount++;
    }
  });
  
  return {
    missing: missingCount,
    decayed: decayedCount,
    filled: filledCount
  };
};

// Tooth edit form component for individual tooth data entry
const ToothEditForm = ({ tooth, initialData, onSave, onCancel }) => {
  const [treatment, setTreatment] = useState(initialData?.treatment || '');
  const [status, setStatus] = useState(initialData?.status || '');

  const handleSave = () => {
    onSave({ tooth, treatment, status });
  };

  const statusOptions = [
    '', // Default empty for healthy
    'Missing',
    'Decayed',
    'Filled',
    'Extracted',
    'Needs Extraction', 
    'Needs Filling',
    'Treated'
  ];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Treatment Notes
        </label>
        <textarea
          value={treatment}
          onChange={(e) => setTreatment(e.target.value)}
          placeholder="Enter treatment details..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Healthy</option>
          {statusOptions.slice(1).map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      
      <div className="flex space-x-3 pt-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors duration-200"
        >
          Save Changes
        </button>
        <button
          onClick={onCancel}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-md transition-colors duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// Complete dental chart with wholeset.svg and accurate coordinates
const DentalChart = ({ onToothClick, permanentTeethStatus, temporaryTeethStatus }) => {
  const [showFullModal, setShowFullModal] = useState(false);
  const [selectedToothModal, setSelectedToothModal] = useState({ open: false, tooth: null });

  const getToothStatus = (toothNumber) => {
    return permanentTeethStatus[toothNumber] || temporaryTeethStatus[toothNumber] || {};
  };

  const hasToothData = (toothNumber) => {
    const status = getToothStatus(toothNumber);
    return status.treatment || status.status;
  };

  const getToothColor = (toothNumber) => {
    const status = getToothStatus(toothNumber);
    if (status.status === 'Missing') return '#6b7280'; // Gray for missing
    if (status.status === 'Decayed') return '#dc2626'; // Dark red for decayed
    if (status.status === 'Filled') return '#059669'; // Green for filled
    if (status.status === 'Extracted') return '#ef4444'; // Red
    if (status.status === 'Needs Extraction') return '#f97316'; // Orange
    if (status.status === 'Needs Filling') return '#eab308'; // Yellow
    if (status.status === 'Treated') return '#22c55e'; // Green
    if (status.treatment || status.status) return '#3b82f6'; // Blue for any data
    return '#ffffff'; // White for healthy/no data
  };

  const handleAreaClick = (e, toothNumber) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedToothModal({ open: true, tooth: parseInt(toothNumber) });
  };

  const handleToothModalSave = (toothData) => {
    onToothClick(toothData.tooth, toothData);
    setSelectedToothModal({ open: false, tooth: null });
  };

  // Accurate tooth coordinates from provided SVG map (viewBox 0 0 600 651)
  const toothCoords = {
    1: "210,251,215,273,213,289,192,302,169,284,165,265,167,254,178,244,182,248,191,243,203,249",
    2: "209,210,205,238,206,196,187,196,169,195,158,211,159,226,162,241,202,245",
    3: "203,194,177,194,164,180,167,156,186,155,212,169,208,185",
    4: "196,119,215,123,215,136,209,156,169,152,173,125,184,114",
    5: "205,84,224,91,222,104,210,121,190,110,184,91,196,80",
    6: "216,53,235,57,236,70,236,87,218,81,203,74,200,59",
    7: "250,30,260,40,259,53,258,70,245,70,227,49,225,37",
    8: "294,20,295,43,279,64,259,35,267,21",
    9: "313,21,341,27,332,42,320,59,305,54,303,41,301,23",
    10: "366,40,374,51,366,56,357,69,343,74,340,59,340,44,349,33",
    11: "386,86,375,87,358,84,363,74,367,60,387,55,398,65,388,76",
    12: "398,79,412,100,404,114,386,117,377,108,377,88",
    13: "402,161,384,154,381,138,387,121,416,116,423,131,425,150",
    14: "429,163,430,190,414,198,389,195,384,179,387,165,407,162",
    15: "389,220,389,230,394,242,410,249,419,244,436,236,438,219,435,209,425,201,394,200",
    16: "391,249,383,274,388,295,401,303,423,294,426,273,423,253",
    17: "415,352,425,360,431,379,431,395,411,403,391,394,390,373,389,361,403,348",
    18: "434,405,442,416,443,439,432,451,415,450,398,443,393,425,400,403",
    19: "409,493,428,491,436,481,436,465,428,452,398,453,392,468,392,485",
    20: "394,525,408,532,422,532,425,516,433,504,418,495,397,490,387,497,385,515",
    21: "382,534,376,551,385,564,402,567,413,558,413,539,394,531",
    22: "372,558,364,570,368,583,378,593,396,594,400,584,396,568",
    23: "348,575,340,589,342,603,347,616,361,614,380,606,375,587",
    24: "317,584,309,598,306,611,308,626,324,626,342,623,336,598",
    25: "285,587,277,594,272,604,263,619,271,627,286,629,305,628,298,601",
    26: "264,617,266,589,254,576,246,584,234,590,226,611,249,618,267,618",
    27: "219,565,206,576,205,592,215,598,236,590,244,573,242,561,238,561",
    28: "203,534,194,541,193,561,210,569,230,556,223,535",
    29: "188,495,180,502,176,515,187,536,203,533,223,525,214,493,201,495",
    30: "176,459,197,454,211,457,216,485,188,498,174,488,170,469",
    31: "187,409,214,409,207,453,171,452,162,432,171,407",
    32: "202,351,224,363,217,390,206,405,182,404,167,389,182,356"
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-8 p-6 bg-white">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Interactive Dental Chart</h3>
          <p className="text-sm text-gray-600">Click on the dental chart below to open full-size view for accurate tooth selection</p>
        </div>
        
        {/* Whole Dental Chart Preview */}
        <div className="mb-12 w-full max-w-4xl">
          <h4 className="text-lg font-semibold text-gray-700 mb-6 text-center">Complete Dental Chart (All Teeth)</h4>
          <div 
            className="relative inline-block bg-gray-50 rounded-lg p-4 shadow-md w-full cursor-pointer hover:bg-gray-100 transition-colors duration-200"
            onClick={() => setShowFullModal(true)}
          >
            <svg 
              style={{width:'100%', maxWidth: '500px', margin: '0 auto', display: 'block'}} 
              xmlns="http://www.w3.org/2000/svg" 
              xmlnsXlink="http://www.w3.org/1999/xlink" 
              viewBox="0 0 600 651"
              className="opacity-90 hover:opacity-100 transition-opacity duration-200"
            >
              <image xlinkHref="/wholeset.svg" style={{width: '600px'}} />
              {/* Overlay colored polygons for tooth status visualization */}
              {Object.entries(toothCoords).map(([toothNum, coords]) => {
                const toothNumber = parseInt(toothNum);
                const color = getToothColor(toothNumber);
                return (
                  <polygon
                    key={toothNumber}
                    points={coords}
                    fill={color}
                    fillOpacity="0.6"
                    stroke={color === '#ffffff' ? '#e5e7eb' : color}
                    strokeWidth="1"
                    className="pointer-events-none"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200">
              <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                <span className="text-sm font-medium text-gray-800">🔍 Click to open full view</span>
              </div>
            </div>
            {/* Stats overlay */}
            <div className="absolute top-2 right-2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
              {Object.keys(permanentTeethStatus).length + Object.keys(temporaryTeethStatus).length} teeth with data
            </div>
          </div>
        </div>

        {/* Enhanced Legend */}
        <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl shadow-sm border border-gray-200 w-full max-w-2xl">
          <h4 className="text-sm font-semibold text-gray-800 mb-3 text-center">How to Use & Color Legend</h4>
          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <p>• Click on the dental chart above to open full-size view</p>
            <p>• In the full view, click directly on individual teeth for precise selection</p>
            <p>• Color coding shows current tooth status at a glance</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
              <span>Healthy</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span>Missing</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span>Decayed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-emerald-600 rounded"></div>
              <span>Filled</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Extracted</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span>Needs Extraction</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Needs Filling</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Treated</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Other Data</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 w-full max-w-4xl">
          <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-200">
            <div className="text-lg font-bold text-blue-600">
              {Object.keys(permanentTeethStatus).filter(t => parseInt(t) >= 1 && parseInt(t) <= 16).length}
            </div>
            <div className="text-xs text-blue-600">Upper Teeth (1-16)</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center border border-green-200">
            <div className="text-lg font-bold text-green-600">
              {Object.keys(permanentTeethStatus).filter(t => parseInt(t) >= 17 && parseInt(t) <= 32).length}
            </div>
            <div className="text-xs text-green-600">Lower Teeth (17-32)</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center border border-purple-200">
            <div className="text-lg font-bold text-purple-600">
              {Object.keys(temporaryTeethStatus).length}
            </div>
            <div className="text-xs text-purple-600">Temporary Teeth</div>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-center border border-red-200">
            <div className="text-lg font-bold text-red-600">
              {(() => {
                const counts = calculateTeethCounts(permanentTeethStatus, temporaryTeethStatus);
                return counts.missing + counts.decayed;
              })()}
            </div>
            <div className="text-xs text-red-600">Problem Teeth</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-center border border-gray-200">
            <div className="text-lg font-bold text-gray-600">
              {Object.keys(permanentTeethStatus).length + Object.keys(temporaryTeethStatus).length}
            </div>
            <div className="text-xs text-gray-600">Total Entries</div>
          </div>
        </div>
      </div>

      {/* Full Dental Chart Modal */}
      {showFullModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-2">
          <div className="bg-white rounded-xl shadow-2xl w-[95vw] h-[95vh] max-w-[1400px] overflow-auto relative">
            <button 
              className="absolute top-4 right-4 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold transition-colors duration-200"
              onClick={() => setShowFullModal(false)}
            >
              ×
            </button>
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center">Complete Dental Chart - Full View</h3>
              <p className="text-sm text-gray-600 mb-6 text-center">Click on any tooth to add treatment and status information</p>
              <div className="relative inline-block w-full flex justify-center">
                <svg 
                  style={{width:'100%', maxWidth: '900px', height: 'auto'}} 
                  xmlns="http://www.w3.org/2000/svg" 
                  xmlnsXlink="http://www.w3.org/1999/xlink" 
                  viewBox="0 0 600 651"
                >
                  <style>{`
                    .tooth-area {
                      fill: rgba(0, 0, 0, 0);
                      cursor: pointer;
                    }
                    .tooth-area:hover {
                      stroke: #3b82f6;
                      stroke-width: 3px;
                      fill: rgba(59, 130, 246, 0.2);
                    }
                  `}</style>
                  
                  <image xlinkHref="/wholeset.svg" style={{width: '600px'}} />
                  
                  {/* Clickable tooth areas with status colors */}
                  {Object.entries(toothCoords).map(([toothNum, coords]) => {
                    const toothNumber = parseInt(toothNum);
                    const color = getToothColor(toothNumber);
                    const hasData = hasToothData(toothNumber);
                    
                    return (
                      <g key={toothNumber}>
                        {/* Colored background for status */}
                        <polygon
                          points={coords}
                          fill={color}
                          fillOpacity="0.6"
                          stroke={color === '#ffffff' ? '#e5e7eb' : color}
                          strokeWidth="1"
                          className="pointer-events-none"
                        />
                        {/* Clickable area */}
                        <polygon
                          className="tooth-area"
                          points={coords}
                          onClick={(e) => handleAreaClick(e, toothNumber)}
                        >
                          <title>{`Tooth ${toothNumber}${hasData ? ' (Has Data)' : ''} - Click to edit`}</title>
                        </polygon>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            {/* Individual Tooth Modal (overlaid on full chart) */}
            {selectedToothModal.open && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20">
                <div className="bg-white rounded-xl shadow-lg p-8 min-w-[320px] max-w-[90vw] relative">
                  <button 
                    className="absolute top-4 right-4 bg-gray-500 hover:bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg font-bold transition-colors duration-200"
                    onClick={() => setSelectedToothModal({ open: false, tooth: null })}
                  >
                    ×
                  </button>
                  
                  <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">
                    Tooth #{selectedToothModal.tooth}
                  </h3>
                  
                  <ToothEditForm 
                    tooth={selectedToothModal.tooth}
                    initialData={getToothStatus(selectedToothModal.tooth)}
                    onSave={handleToothModalSave}
                    onCancel={() => setSelectedToothModal({ open: false, tooth: null })}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// Tooth type definitions based on the image
const getToothType = (toothNumber) => {
  const toothStr = toothNumber.toString();
  const lastDigit = parseInt(toothStr[toothStr.length - 1]);
  
  // For permanent teeth (adult teeth)
  if (toothNumber >= 11) {
    if ([1, 2].includes(lastDigit)) return 'incisor';
    if ([3].includes(lastDigit)) return 'canine';
    if ([4, 5].includes(lastDigit)) return 'premolar';
    if ([6, 7, 8].includes(lastDigit)) return 'molar';
  }
  // For primary teeth (baby teeth)
  else {
    if ([1, 2].includes(lastDigit)) return 'incisor';
    if ([3].includes(lastDigit)) return 'canine';
    if ([4, 5].includes(lastDigit)) return 'molar'; // Primary teeth don't have premolars
  }
  return 'molar';
};

const RadioGroup = ({ title, name, options, value, onChange, disabled = false }) => (
    <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-700">{title}</h4>
        <div className="flex flex-wrap gap-4">
            {options.map(option => (
                <label key={option} className={`flex items-center space-x-2 group ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                    <input
                        type="radio"
                        name={name}
                        value={option}
                        checked={value === option}
                        onChange={onChange}
                        disabled={disabled}
                        className={`h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                    <span className={`text-sm transition-colors ${disabled ? 'text-gray-400' : 'text-gray-600 group-hover:text-gray-800'}`}>{option}</span>
                </label>
            ))}
        </div>
    </div>
);

const FormSection = ({ title, children }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-8 pb-3 border-b border-gray-100">{title}</h2>
        <div className="space-y-8">{children}</div>
    </div>
);

const InputField = ({ label, name, type = "text", value, onChange, placeholder, required = false, disabled = false }) => (
    <div className="space-y-2">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 ${
                disabled ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
        />
    </div>
);

const TextAreaField = ({ label, name, value, onChange, placeholder, rows = 4, required = false }) => (
    <div className="space-y-2">
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
            name={name}
            id={name}
            rows={rows}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 resize-none"
        />
    </div>
);

const TOOTH_STATUS_OPTIONS = [
  'Missing',
  'Decayed',
  'Filled',
  'Extracted',
  'Needs Extraction',
  'Needs Filling',
  'Treated',
];

interface DentalFormProps {
  appointmentId?: string;
  patientId?: string;
}

const DentalForm: React.FC<DentalFormProps> = ({ appointmentId, patientId: patientIdProp }) => {
  const [formData, setFormData] = useState({
    fileNo: '',
    surname: '',
    firstName: '',
    middleName: '',
    age: '',
    sex: 'Male',
    hasToothbrush: 'Yes',
    dentition: '',
    periodontal: '',
    occlusion: '',
    malocclusionSeverity: '',
    decayedTeeth: '',
    missingTeeth: '',
    filledTeeth: '',
    oralHygiene: '',
    recommendedTreatments: '',
    preventionAdvice: '',
    nextAppointment: '',
    treatmentPriority: '',
    remarks: '',
    examinedBy: '',
    examinerPosition: '',
    examinerLicense: '',
    examinerPtr: '',
    examinerPhone: '',
    date: '',
    nextAppointmentDate: '',
    nextAppointmentTime: '10:00',
  });

  const [selectedTooth, setSelectedTooth] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState(patientIdProp);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [permanentTeethStatus, setPermanentTeethStatus] = useState({});
  const [temporaryTeethStatus, setTemporaryTeethStatus] = useState({});
  
  // Medicine/Inventory tracking states
  const [availableInventory, setAvailableInventory] = useState([]);
  const [usedMedicines, setUsedMedicines] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // Load available inventory items
  const loadInventory = async () => {
    setLoadingInventory(true);
    try {
      const response = await dentalMedicinesAPI.getAll();
      // All items are already filtered for dental use
      console.log('Loaded inventory:', response.data);
      setAvailableInventory(response.data || []);
    } catch (error) {
      console.error('Error loading dental medicines:', error);
    } finally {
      setLoadingInventory(false);
    }
  };

  // Add medicine to used list
  const addUsedMedicine = () => {
    setUsedMedicines([...usedMedicines, { 
      id: '', 
      name: '', 
      quantity: 1, 
      unit: '', 
      notes: '' 
    }]);
  };

  // Remove medicine from used list
  const removeUsedMedicine = (index) => {
    setUsedMedicines(usedMedicines.filter((_, i) => i !== index));
  };

  // Update used medicine data
  const updateUsedMedicine = (index, field, value) => {
    console.log(`Updating medicine at index ${index}, field: ${field}, value:`, value);
    const updated = usedMedicines.map((medicine, i) => 
      i === index ? { ...medicine, [field]: value } : medicine
    );
    console.log('Updated medicines array:', updated);
    console.log('Updated medicine at index:', updated[index]);
    setUsedMedicines(updated);
  };

  useEffect(() => {
    // Load inventory when component mounts
    loadInventory();
  }, []);

  // Auto-calculate teeth counts based on dental chart status
  useEffect(() => {
    const counts = calculateTeethCounts(permanentTeethStatus, temporaryTeethStatus);
    setFormData(prev => ({
      ...prev,
      missingTeeth: counts.missing.toString(),
      decayedTeeth: counts.decayed.toString(),
      filledTeeth: counts.filled.toString()
    }));
  }, [permanentTeethStatus, temporaryTeethStatus]);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!appointmentId && !patientIdProp) return;

      setLoading(true);
      try {
        // Check if dental form already exists for this appointment
        if (appointmentId) {
          try {
            const existingFormResponse = await dentalFormAPI.getByAppointment(appointmentId);
            if (existingFormResponse.data && existingFormResponse.data.id) {
              setFeedbackMessage('A dental form already exists for this appointment. You cannot create another one.');
              setFeedbackOpen(true);
              return;
            }
          } catch (error) {
            // Form doesn't exist, continue with normal flow
            console.log('No existing dental form found, proceeding to create new one');
          }
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
          console.error('No access token found. Please log in.');
          alert('Please log in to access the dental form.');
          window.location.href = '/login';
          return;
        }

        // Try using the dentalFormAPI first
        let response;
        try {
          response = await dentalFormAPI.getData(appointmentId);
        } catch (apiError) {
          console.warn('API call failed, trying direct Django API:', apiError);
          // Fallback to direct Django API call
          response = await djangoApiClient.get(`/dental-forms/get_patient_data/?appointment_id=${appointmentId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        }

        const data = response.data;

        setFormData(prev => ({
          ...prev,
          fileNo: data.file_no || '',
          surname: data.surname || '',
          firstName: data.first_name || '',
          middleName: data.middle_name || '',
          age: data.age ? data.age.toString() : '',
          // Convert gender to sex field, mapping 'Other' to 'Male' as fallback
          sex: data.gender === 'Other' ? 'Male' : (data.gender || 'Male'),
          examinedBy: data.examined_by || '', // Auto-populated from staff details
          examinerPosition: data.examiner_position || '',
          examinerLicense: data.examiner_license || '',
          examinerPtr: data.examiner_ptr || '',
          examinerPhone: data.examiner_phone || '',
          date: data.date || '', // Auto-populated with current date
        }));
        
        if (data.patient_id) {
          setPatientId(data.patient_id);
        }

      } catch (error) {
        console.error('Error fetching initial data for Dental Form:', error);
        if (error.response?.status === 401) {
          console.error('Authentication failed. Please log in again.');
          alert('Authentication failed. Please log in again.');
          // Clear invalid tokens
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          // Redirect to login if authentication fails
          window.location.href = '/login';
        } else if (error.response?.status === 404) {
          console.error('Appointment not found or no patient data available.');
          alert('Appointment not found or no patient data available.');
        } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
          console.error('Network error. Please check your connection.');
          alert('Network error. Please check your connection and try again.');
        } else {
          console.error('Error fetching patient data:', error.message);
          alert('Error fetching patient data. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (appointmentId || patientIdProp) {
      fetchPatientData();
    }
  }, [appointmentId, patientIdProp]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setFeedbackMessage('Please log in to submit the form.');
        setFeedbackOpen(true);
        window.location.href = '/login';
        return;
      }

      // Format date to YYYY-MM-DD
      let formattedDate = formData.date;
      if (formattedDate && formattedDate.includes('/')) {
        // Convert from DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = formattedDate.split('/');
        formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }

      const dentalFormData = {
        file_no: formData.fileNo,
        surname: formData.surname,
        first_name: formData.firstName,
        middle_name: formData.middleName,
        age: parseInt(formData.age) || 0, // Convert age to integer
        sex: formData.sex,
        has_toothbrush: formData.hasToothbrush,
        dentition: formData.dentition,
        periodontal: formData.periodontal,
        occlusion: formData.occlusion,
        malocclusion_severity: formData.malocclusionSeverity,
        decayed_teeth: formData.decayedTeeth,
        missing_teeth: formData.missingTeeth,
        filled_teeth: formData.filledTeeth,
        oral_hygiene: formData.oralHygiene,
        recommended_treatments: formData.recommendedTreatments,
        prevention_advice: formData.preventionAdvice,
        next_appointment: formData.nextAppointment,
        treatment_priority: formData.treatmentPriority,
        remarks: formData.remarks,
        examined_by: formData.examinedBy,
        date: formattedDate,
        patient: patientId,
        appointment: appointmentId,
        permanent_teeth_status: permanentTeethStatus,
        temporary_teeth_status: temporaryTeethStatus,
        used_medicines: usedMedicines,
        // Add next appointment data if provided
        next_appointment_date: formData.nextAppointmentDate || null,
        next_appointment_time: formData.nextAppointmentTime || '10:00:00',
      };

      // Use the new submit and complete endpoint
      const response = await dentalFormAPI.submitAndComplete(dentalFormData);
      
      if (response.status === 201 || response.status === 200) {
        
        const responseData = response.data;
        let message = 'Dental form saved successfully!';
        
        if (responseData.appointment_completed) {
          message += ' The appointment has been automatically marked as completed.';
        }
        
        if (responseData.next_appointment_created) {
          message += ` Next appointment has been scheduled for ${responseData.next_appointment_date}.`;
        }
        
        setFeedbackMessage(message);
        setFeedbackOpen(true);
        
        // Optionally redirect back to appointments page after successful submission
        setTimeout(() => {
          window.history.back();
        }, 3000); // Increased timeout to allow reading the message
      } else {
        setFeedbackMessage('Error saving dental form. Please try again.');
        setFeedbackOpen(true);
      }
    } catch (error) {
      // Log the actual backend error message
      console.error('Error submitting form:', error, error.response?.data);
      
      let errorMsg = 'Invalid form data. Please check your inputs.';
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data) {
        errorMsg = JSON.stringify(error.response.data);
      }
      
      setFeedbackMessage(`Form submission error: ${errorMsg}`);
      setFeedbackOpen(true);
    } finally {
      setLoading(false);
    }
  };
  
  const handleToothClick = (toothNumber, toothData = null) => {
    if (toothData) {
      // If toothData is provided, save it directly (from ToothEditForm)
      const isPermanent = toothData.tooth >= 11;
      if (isPermanent) {
        setPermanentTeethStatus(prev => ({ ...prev, [toothData.tooth]: { treatment: toothData.treatment, status: toothData.status } }));
      } else {
        setTemporaryTeethStatus(prev => ({ ...prev, [toothData.tooth]: { treatment: toothData.treatment, status: toothData.status } }));
      }
      return;
    }
    
    // For the new dental chart system, we don't need to set the old modal
    // The tooth selection will be handled by the new selectedToothModal in DentalChart
    setSelectedTooth(toothNumber);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <FeedbackModal open={feedbackOpen} message={feedbackMessage} onClose={() => setFeedbackOpen(false)} />
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dental Examination Form</h1>
        <p className="text-gray-600">Complete the dental examination details below</p>
        {loading && (
          <div className="mt-4">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading patient data...
            </div>
          </div>
        )}
      </div>
      
      <form className="space-y-8" onSubmit={handleSubmit}>
        <FormSection title="Personal Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              label="File No." 
              name="fileNo" 
              value={formData.fileNo} 
              onChange={handleInputChange}
              placeholder="Enter file number"
            />
            <div></div> {/* Empty div for spacing */}
                </div>
          
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField 
              label="Surname" 
              name="surname" 
              value={formData.surname} 
              onChange={handleInputChange}
              placeholder="Enter surname"
            />
            <InputField 
              label="First Name" 
              name="firstName" 
              value={formData.firstName} 
              onChange={handleInputChange}
              placeholder="Enter first name"
            />
            <InputField 
              label="Middle Name" 
              name="middleName" 
              value={formData.middleName} 
              onChange={handleInputChange}
              placeholder="Enter middle name"
            />
                </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <InputField 
                label="Age" 
                name="age" 
                type="number"
                value={formData.age} 
                onChange={handleInputChange}
                placeholder="Auto-populated from patient data"
                disabled={true}
              />
              <p className="text-sm text-gray-500">
                Automatically filled from patient data
              </p>
            </div>
            <div className="space-y-2">
              <RadioGroup title="Sex" name="sex" options={['Male', 'Female']} value={formData.sex} onChange={handleInputChange} disabled={true} />
              <p className="text-sm text-gray-500">
                Automatically filled from patient data
              </p>
            </div>
            </div>
          
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <RadioGroup title="Have Own Toothbrush?" name="hasToothbrush" options={['Yes', 'No']} value={formData.hasToothbrush} onChange={handleInputChange} />
            </div>
        </FormSection>

        <FormSection title="Dental Chart - Click on tooth numbers to add treatment and status">
          <div style={{ minHeight: '800px' }}>
            <DentalChart 
              onToothClick={handleToothClick}
              permanentTeethStatus={permanentTeethStatus}
              temporaryTeethStatus={temporaryTeethStatus}
            />
          </div>
          
          {/* Real-time Summary of Teeth Status */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Current Dental Chart Summary
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {(() => {
                    const counts = calculateTeethCounts(permanentTeethStatus, temporaryTeethStatus);
                    return counts.missing;
                  })()}
                </div>
                <div className="text-sm text-gray-600 font-medium">Missing/Extracted Teeth</div>
                <div className="text-xs text-gray-500 mt-1">Includes extracted teeth</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                <div className="text-2xl font-bold text-red-600">
                  {(() => {
                    const counts = calculateTeethCounts(permanentTeethStatus, temporaryTeethStatus);
                    return counts.decayed;
                  })()}
                </div>
                <div className="text-sm text-gray-600 font-medium">Decayed Teeth</div>
                <div className="text-xs text-gray-500 mt-1">Need immediate attention</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {(() => {
                    const counts = calculateTeethCounts(permanentTeethStatus, temporaryTeethStatus);
                    return counts.filled;
                  })()}
                </div>
                <div className="text-sm text-gray-600 font-medium">Filled Teeth</div>
                <div className="text-xs text-gray-500 mt-1">Previously treated</div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                These counts automatically update the Summary section below and will be saved with the form.
              </p>
            </div>
          </div>
        </FormSection>

        <FormSection title="Summary of Status of Oral Health (Based on Dental Chart)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <RadioGroup title="Dentition:" name="dentition" options={['Satisfactory', 'Fair', 'Poor']} value={formData.dentition} onChange={handleInputChange} />
                <RadioGroup title="Periodontal:" name="periodontal" options={['Satisfactory', 'Fair', 'Poor']} value={formData.periodontal} onChange={handleInputChange} />
                <RadioGroup title="Occlusion:" name="occlusion" options={['Normal', 'Malocclusion']} value={formData.occlusion} onChange={handleInputChange} />
                <RadioGroup title="Malocclusion Severity:" name="malocclusionSeverity" options={['Mild', 'Moderate', 'Severe']} value={formData.malocclusionSeverity} onChange={handleInputChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-8">
                <div className="space-y-2">
                  <InputField 
                    label="Decayed Teeth Count" 
                    name="decayedTeeth" 
                    type="number"
                    value={formData.decayedTeeth || ''} 
                    onChange={handleInputChange}
                    placeholder="Auto-calculated from dental chart"
                    disabled={true}
                  />
                  <p className="text-sm text-gray-500">
                    Automatically calculated from dental chart data
                  </p>
                </div>
                <div className="space-y-2">
                  <InputField 
                    label="Missing Teeth Count" 
                    name="missingTeeth" 
                    type="number"
                    value={formData.missingTeeth || ''} 
                    onChange={handleInputChange}
                    placeholder="Auto-calculated from dental chart"
                    disabled={true}
                  />
                  <p className="text-sm text-gray-500">
                    Automatically calculated from dental chart data
                  </p>
                </div>
                <div className="space-y-2">
                  <InputField 
                    label="Filled Teeth Count" 
                    name="filledTeeth" 
                    type="number"
                    value={formData.filledTeeth || ''} 
                    onChange={handleInputChange}
                    placeholder="Auto-calculated from dental chart"
                    disabled={true}
                  />
                  <p className="text-sm text-gray-500">
                    Automatically calculated from dental chart data
                  </p>
                </div>
                <RadioGroup title="Oral Hygiene:" name="oralHygiene" options={['Good', 'Fair', 'Poor']} value={formData.oralHygiene || ''} onChange={handleInputChange} />
            </div>
          
          <TextAreaField 
            label="Remarks" 
            name="remarks" 
            value={formData.remarks} 
            onChange={handleInputChange}
            placeholder="Enter any additional remarks or observations..."
          />
        </FormSection>
        
        <FormSection title="Treatment Recommendations">
          <div className="grid grid-cols-1 gap-6">
            <TextAreaField 
              label="Recommended Treatments" 
              name="recommendedTreatments" 
              value={formData.recommendedTreatments || ''} 
              onChange={handleInputChange}
              placeholder="List recommended treatments and procedures..."
              rows={3}
            />
            <TextAreaField 
              label="Prevention Advice" 
              name="preventionAdvice" 
              value={formData.preventionAdvice || ''} 
              onChange={handleInputChange}
              placeholder="Oral hygiene instructions and prevention advice..."
              rows={3}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <InputField 
                  label="Next Appointment Date (Optional)" 
                  name="nextAppointmentDate" 
                  type="date"
                  value={formData.nextAppointmentDate || ''} 
                  onChange={handleInputChange}
                  placeholder=""
                />
                <p className="text-sm text-gray-500">
                  If specified, a new confirmed appointment will be automatically created
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Next Appointment Time (Optional)
                </label>
                <input
                  type="time"
                  name="nextAppointmentTime"
                  value={formData.nextAppointmentTime || '10:00'}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-sm text-gray-500">
                  Time for the next appointment (defaults to 10:00 AM)
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputField 
                label="Next Appointment (Text Notes)" 
                name="nextAppointment" 
                value={formData.nextAppointment || ''} 
                onChange={handleInputChange}
                placeholder="Additional notes about next appointment..."
              />
              <RadioGroup 
                title="Treatment Priority:" 
                name="treatmentPriority" 
                options={['Urgent', 'High', 'Medium', 'Low']} 
                value={formData.treatmentPriority || ''} 
                onChange={handleInputChange} 
              />
            </div>
          </div>
        </FormSection>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Examiner Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <InputField 
                label="Examined By (Full Name)" 
                name="examinedBy" 
                value={formData.examinedBy} 
                onChange={handleInputChange}
                placeholder="Auto-populated from staff details"
                disabled={true}  // Auto-populated from staff details
              />
              <p className="text-sm text-gray-500">
                Automatically filled from staff details
              </p>
            </div>
            <div className="space-y-2">
              <InputField 
                label="Position" 
                name="examinerPosition" 
                value={formData.examinerPosition} 
                onChange={handleInputChange}
                placeholder="Auto-populated from staff details"
                disabled={true}  // Auto-populated from staff details
              />
              <p className="text-sm text-gray-500">
                Staff position from staff details
              </p>
            </div>
            <div className="space-y-2">
              <InputField 
                label="License Number" 
                name="examinerLicense" 
                value={formData.examinerLicense} 
                onChange={handleInputChange}
                placeholder="Auto-populated from staff details"
                disabled={true}  // Auto-populated from staff details
              />
              <p className="text-sm text-gray-500">
                Professional license number
              </p>
            </div>
            <div className="space-y-2">
              <InputField 
                label="PTR Number" 
                name="examinerPtr" 
                value={formData.examinerPtr} 
                onChange={handleInputChange}
                placeholder="Auto-populated from staff details"
                disabled={true}  // Auto-populated from staff details
              />
              <p className="text-sm text-gray-500">
                Professional Tax Receipt number
              </p>
            </div>
            <div className="space-y-2">
              <InputField 
                label="Phone Number" 
                name="examinerPhone" 
                value={formData.examinerPhone} 
                onChange={handleInputChange}
                placeholder="Auto-populated from staff details"
                disabled={true}  // Auto-populated from staff details
              />
              <p className="text-sm text-gray-500">
                Contact phone number
              </p>
            </div>
            <div className="space-y-2">
              <InputField 
                label="Date" 
                name="date" 
                type="date"
                value={formData.date} 
                onChange={handleInputChange}
                placeholder=""
                disabled={true}  // Auto-populated with current date
              />
              <p className="text-sm text-gray-500">
                Automatically filled with the current date
              </p>
            </div>
          </div>
        </div>

        <FormSection title="Medicines & Supplies Used">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">
                Track medicines and supplies used during this dental appointment for record keeping.
              </p>
              <button
                type="button"
                onClick={addUsedMedicine}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 text-sm font-medium"
              >
                + Add Medicine/Supply
              </button>
            </div>

            {loadingInventory && (
              <div className="text-center py-4">
                <svg className="animate-spin h-8 w-8 mx-auto text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-500 mt-2">Loading inventory...</p>
              </div>
            )}

            {usedMedicines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 8.172V5L8 4z" />
                </svg>
                <p>No medicines or supplies added yet</p>
                <p className="text-sm">Click &quot;Add Medicine/Supply&quot; to track usage for record keeping</p>
              </div>
            ) : (
              <div className="space-y-4">
                {usedMedicines.map((medicine, index) => (
                  <div key={`${index}-${medicine.id || 'empty'}`} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Medicine/Supply *
                        </label>
                        <select
                          key={`medicine-select-${index}-${medicine.id || 'empty'}`}
                          value={medicine.id ? medicine.id.toString() : ''}
                          onChange={(e) => {
                            console.log('Selection changed:', e.target.value);
                            console.log('Current medicine before update:', medicine);
                            const selectedItem = availableInventory.find(item => item.id.toString() === e.target.value);
                            console.log('Selected item:', selectedItem);
                            
                            // Update all fields in a single call to avoid batching issues
                            const updated = usedMedicines.map((med, i) => 
                              i === index ? { 
                                ...med, 
                                id: e.target.value,
                                name: selectedItem?.name || '',
                                unit: selectedItem?.unit || ''
                              } : med
                            );
                            console.log('Updated medicines array:', updated);
                            setUsedMedicines(updated);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select medicine/supply...</option>
                          {availableInventory.map(item => (
                            <option key={item.id} value={item.id.toString()}>
                              {item.name} ({item.type_display})
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity Used *
                        </label>
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={medicine.quantity}
                          onChange={(e) => updateUsedMedicine(index, 'quantity', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="0"
                        />
                        {medicine.unit && (
                          <p className="text-xs text-gray-500 mt-1">Unit: {medicine.unit}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={medicine.notes}
                          onChange={(e) => updateUsedMedicine(index, 'notes', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Optional notes"
                        />
                      </div>
                      
                      <div>
                        <button
                          type="button"
                          onClick={() => removeUsedMedicine(index)}
                          className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {usedMedicines.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Inventory Impact Summary</h4>
                <div className="space-y-1">
                  {usedMedicines.filter(m => m.id && m.quantity).map((medicine, index) => {
                    const inventoryItem = availableInventory.find(item => item.id === parseInt(medicine.id));
                    const remaining = inventoryItem ? inventoryItem.quantity - medicine.quantity : 0;
                    return (
                      <div key={index} className="text-sm text-blue-700">
                        • {medicine.name}: {medicine.quantity} {medicine.unit} used, {remaining} {medicine.unit} remaining
                        {remaining < 5 && remaining >= 0 && (
                          <span className="ml-2 text-red-600 font-medium">⚠️ Low stock!</span>
                        )}
                        {remaining < 0 && (
                          <span className="ml-2 text-red-600 font-medium">❌ Insufficient stock!</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </FormSection>

        <div className="flex justify-end pt-6">
            <button
                type="submit"
            disabled={loading}
            className={`inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-lg text-white transition-all duration-200 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Submit Form'
            )}
            </button>
        </div>
    </form>
    </div>
  );
};

export default DentalForm;