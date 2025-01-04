const express = require('express');
const { signupUser } = require('../controllers/userController');
const { loginUser } = require('../controllers/userController');

const router = express.Router();

// Signup Route
router.post('/signup', signupUser);

// POST /api/users/login
router.post('/login', loginUser);

module.exports = router;
