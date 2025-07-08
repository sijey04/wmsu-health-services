// Mock data for appointments
const appointments = [
  {
    id: 1,
    patientId: 1,
    patientName: 'Juan Dela Cruz',
    doctorId: 1,
    doctorName: 'Dr. Santos',
    appointmentDate: '2025-06-05',
    appointmentTime: '10:00:00',
    purpose: 'Regular Check-up',
    status: 'scheduled',
    notes: '',
    createdAt: '2025-06-01T10:30:00',
    updatedAt: '2025-06-01T10:30:00'
  },
  {
    id: 2,
    patientId: 2,
    patientName: 'Maria Santos',
    doctorId: 2,
    doctorName: 'Dr. Reyes',
    appointmentDate: '2025-06-05',
    appointmentTime: '11:30:00',
    purpose: 'Follow-up Consultation',
    status: 'confirmed',
    notes: 'Follow-up for previous treatment',
    createdAt: '2025-06-02T09:15:00',
    updatedAt: '2025-06-02T14:20:00'
  },
  {
    id: 3,
    patientId: 3,
    patientName: 'Carlos Reyes',
    doctorId: 3,
    doctorName: 'Dr. Garcia',
    appointmentDate: '2025-06-05',
    appointmentTime: '14:15:00',
    purpose: 'Medical Certificate Request',
    status: 'pending',
    notes: 'For university requirements',
    createdAt: '2025-06-03T08:45:00',
    updatedAt: '2025-06-03T08:45:00'
  }
];

// Get all appointments
const getAllAppointments = (req, res) => {
  try {
    // In production, this would fetch from the database
    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments'
    });
  }
};

// Get appointment by ID
const getAppointmentById = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const appointment = appointments.find(a => a.id === id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching appointment'
    });
  }
};

// Create a new appointment
const createAppointment = (req, res) => {
  try {
    const { patientId, doctorId, appointmentDate, appointmentTime, purpose, notes } = req.body;

    // Validate required fields
    if (!patientId || !doctorId || !appointmentDate || !appointmentTime || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // In production, this would insert into the database and get the new ID
    const newAppointment = {
      id: appointments.length + 1,
      patientId,
      // This would be joined with patient data in production
      patientName: `Patient ID: ${patientId}`,
      doctorId,
      // This would be joined with doctor data in production
      doctorName: `Doctor ID: ${doctorId}`,
      appointmentDate,
      appointmentTime,
      purpose,
      status: 'pending',
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    appointments.push(newAppointment);

    return res.status(201).json({
      success: true,
      data: newAppointment
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while creating appointment'
    });
  }
};

// Update an appointment
const updateAppointment = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const appointmentIndex = appointments.findIndex(a => a.id === id);

    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const updatedAppointment = {
      ...appointments[appointmentIndex],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    appointments[appointmentIndex] = updatedAppointment;

    return res.status(200).json({
      success: true,
      data: updatedAppointment
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating appointment'
    });
  }
};

// Delete an appointment
const deleteAppointment = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const appointmentIndex = appointments.findIndex(a => a.id === id);

    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // In production, this would archive the record or mark it as deleted
    const deletedAppointment = appointments.splice(appointmentIndex, 1)[0];

    return res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully',
      data: deletedAppointment
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting appointment'
    });
  }
};

module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
};
