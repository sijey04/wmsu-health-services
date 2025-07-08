const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const appointmentsController = require('../controllers/appointmentsController');

// Get all appointments
router.get('/', verifyToken, appointmentsController.getAllAppointments);

// Get a specific appointment
router.get('/:id', verifyToken, appointmentsController.getAppointmentById);

// Create a new appointment
router.post('/', verifyToken, appointmentsController.createAppointment);

// Update appointment data
router.put('/:id', verifyToken, appointmentsController.updateAppointment);

// Delete an appointment
router.delete('/:id', verifyToken, appointmentsController.deleteAppointment);

module.exports = router;
