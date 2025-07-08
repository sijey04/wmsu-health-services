const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const staffController = require('../controllers/staffController');

// Get all staff members
router.get('/', verifyToken, staffController.getAllStaff);

// Get a specific staff member
router.get('/:id', verifyToken, staffController.getStaffById);

// Create a new staff member
router.post('/', verifyToken, staffController.createStaff);

// Update staff data
router.put('/:id', verifyToken, staffController.updateStaff);

// Delete a staff member
router.delete('/:id', verifyToken, staffController.deleteStaff);

module.exports = router;
