const User = require('../models/User');

// Handle User Signup
const signupUser = async (req, res) => {
    const { email, name, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use.' });
        }

        // Create and save new user
        const user = new User({ email, name, password });
        await user.save(); // Password will be hashed in the pre-save middleware

        res.status(201).json({ message: 'User registered successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error.' });
    }
};

// Handle User Login
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check if user exists
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.status(200).json({ message: 'Login successful', user: { email: user.email, name: user.name } });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

module.exports = {
    signupUser,
    loginUser,
};
