const User = require('../models/user');
console.log("Loaded User model:", User);
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
 exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log('User model:', User);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ username, email, password: hashPassword});
        res.status(201).json({msg: 'User Registered Successfully'});
        } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ msg: 'Server error', error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const {email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'User does not exist' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });  

        const token = jwt.sign({id: user._id }, process.env.JWT_SECRET, {expiresIn: '1h'});
        res.json({ token });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({msg: 'Server Error', error: error.message});
    }
        
    };
