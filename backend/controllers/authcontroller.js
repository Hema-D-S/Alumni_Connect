const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { firstname, lastname, phone, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const hashPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await User.create({
      firstname,
      lastname,
      phone,
      email,
      password: hashPassword,
    });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.status(201).json({ 
      msg: 'User Registered Successfully', 
      token,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        phone: user.phone,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ msg: 'Server error', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'User does not exist' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      msg: 'Login successful',
      token,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        phone: user.phone,
        email: user.email
      },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ msg: 'Server Error', error: error.message });
  }
};
