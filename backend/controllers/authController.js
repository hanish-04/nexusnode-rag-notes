const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateJWT = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};

const registerUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with that email already exists' });
    }

    const user = await User.create({ email, password });
    const token = generateJWT(user._id);
    res.status(201).json({ token, user: { _id: user._id, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to register user', error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateJWT(user._id);
    res.status(200).json({ token, user: { _id: user._id, email: user.email } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to authenticate user', error: error.message });
  }
};

const getMe = async (req, res) => {
  res.status(200).json({ user: req.user });
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
