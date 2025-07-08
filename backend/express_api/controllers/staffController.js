// Basic staffController.js for Express API

// Example: Get all staff
exports.getAllStaff = (req, res) => {
  // Replace with real DB logic
  res.json([
    { id: 1, name: 'John Doe', position: 'Nurse' },
    { id: 2, name: 'Jane Smith', position: 'Doctor' },
  ]);
};

// Example: Get a single staff by ID
exports.getStaffById = (req, res) => {
  const { id } = req.params;
  // Replace with real DB logic
  res.json({ id, name: 'John Doe', position: 'Nurse' });
};

// Example: Create a new staff
exports.createStaff = (req, res) => {
  const { name, position } = req.body;
  // Replace with real DB logic
  res.status(201).json({ id: 3, name, position });
};

// Example: Update a staff
exports.updateStaff = (req, res) => {
  const { id } = req.params;
  const { name, position } = req.body;
  // Replace with real DB logic
  res.json({ id, name, position });
};

// Example: Delete a staff
exports.deleteStaff = (req, res) => {
  const { id } = req.params;
  // Replace with real DB logic
  res.status(204).send();
}; 