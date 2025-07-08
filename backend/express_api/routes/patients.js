const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const patientsController = require('../controllers/patientsController');

// Get all patients
router.get('/', verifyToken, patientsController.getAllPatients);

// Get a specific patient
router.get('/:id', verifyToken, patientsController.getPatientById);

// Create a new patient
router.post('/', verifyToken, patientsController.createPatient);

// Update patient data
router.put('/:id', verifyToken, patientsController.updatePatient);

// Delete a patient
router.delete('/:id', verifyToken, patientsController.deletePatient);

module.exports = router;
