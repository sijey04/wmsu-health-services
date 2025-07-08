// Mock database for demo
const patients = [
  { 
    id: 1, 
    name: 'Juan Dela Cruz', 
    age: 21, 
    gender: 'Male', 
    studentId: '2020-0001', 
    department: 'Engineering', 
    contactNumber: '09123456789',
    lastVisit: '2025-05-30'
  },
  { 
    id: 2, 
    name: 'Maria Santos', 
    age: 19, 
    gender: 'Female', 
    studentId: '2021-0042', 
    department: 'Education', 
    contactNumber: '09198765432',
    lastVisit: '2025-06-01'
  },
  { 
    id: 3, 
    name: 'Carlos Reyes', 
    age: 20, 
    gender: 'Male', 
    studentId: '2022-0105', 
    department: 'Nursing', 
    contactNumber: '09178901234',
    lastVisit: '2025-05-25'
  },
];

// Get all patients
const getAllPatients = (req, res) => {
  res.status(200).json(patients);
};

// Get patient by ID
const getPatientById = (req, res) => {
  const id = parseInt(req.params.id);
  const patient = patients.find(p => p.id === id);
  
  if (!patient) {
    return res.status(404).json({ message: 'Patient not found' });
  }
  
  res.status(200).json(patient);
};

// Create new patient
const createPatient = (req, res) => {
  const { name, age, gender, studentId, department, contactNumber } = req.body;
  
  // Validate required fields
  if (!name || !age || !gender || !studentId) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }
  
  // Check if student ID already exists
  if (patients.some(p => p.studentId === studentId)) {
    return res.status(400).json({ message: 'Student ID already exists' });
  }
  
  const newPatient = {
    id: patients.length + 1,
    name,
    age: parseInt(age),
    gender,
    studentId,
    department: department || 'Not specified',
    contactNumber: contactNumber || 'Not provided',
    lastVisit: new Date().toISOString().split('T')[0]
  };
  
  // Add to patients array (in a real app, save to database)
  patients.push(newPatient);
  
  res.status(201).json({
    message: 'Patient created successfully',
    patient: newPatient
  });
};

// Update patient
const updatePatient = (req, res) => {
  const id = parseInt(req.params.id);
  const { name, age, gender, studentId, department, contactNumber } = req.body;
  
  // Find patient index
  const index = patients.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Patient not found' });
  }
  
  // Check if updating to a student ID that already exists
  if (studentId && studentId !== patients[index].studentId && 
      patients.some(p => p.studentId === studentId)) {
    return res.status(400).json({ message: 'Student ID already exists' });
  }
  
  // Update patient data
  patients[index] = {
    ...patients[index],
    name: name || patients[index].name,
    age: age ? parseInt(age) : patients[index].age,
    gender: gender || patients[index].gender,
    studentId: studentId || patients[index].studentId,
    department: department || patients[index].department,
    contactNumber: contactNumber || patients[index].contactNumber
  };
  
  res.status(200).json({
    message: 'Patient updated successfully',
    patient: patients[index]
  });
};

// Delete patient
const deletePatient = (req, res) => {
  const id = parseInt(req.params.id);
  const index = patients.findIndex(p => p.id === id);
  
  if (index === -1) {
    return res.status(404).json({ message: 'Patient not found' });
  }
  
  patients.splice(index, 1);
  
  res.status(200).json({
    message: 'Patient deleted successfully'
  });
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
};
