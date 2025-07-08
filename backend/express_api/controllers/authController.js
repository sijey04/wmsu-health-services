const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../models/db');

// Mock database for demo
const users = [
  {
    id: 1,
    email: 'admin@wmsu.edu.ph',
    password: '$2a$10$XQjKtAHvSDGKBjQ1rN0xL.TQY07tZutV1q3HZlp5qhNUFarU/YkEe', // hashed 'admin123'
    name: 'Administrator',
    role: 'admin'
  },
  {
    id: 2,
    email: 'doctor@wmsu.edu.ph',
    password: '$2a$10$XFdiUhP5Nu45u4zVqDdnMOJCT.Ip2t0Od0RDiSHZ2aAKUPFoMZsLC', // hashed 'doctor123'
    name: 'Dr. Santos',
    role: 'doctor'
  }
];

// Login user
const login = (req, res) => {
  const { email, password } = req.body;
  
  // Find user by email
  const user = users.find(u => u.email === email);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // Compare password
  const isPasswordValid = bcrypt.compareSync(password, user.password);
  
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  
  // Generate token
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
  
  res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    accessToken: token
  });
};

// Register user
const register = (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Check if user already exists
  if (users.some(u => u.email === email)) {
    return res.status(400).json({ message: 'Email already in use' });
  }
  
  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  // Create new user
  const newUser = {
    id: users.length + 1,
    name,
    email,
    password: hashedPassword,
    role: role || 'staff'
  };
  
  // Add to users array (in a real app, save to database)
  users.push(newUser);
  
  // Generate token
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email, role: newUser.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
  
  res.status(201).json({
    message: 'User registered successfully',
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    accessToken: token
  });
};

module.exports = {
  login,
  register
};
