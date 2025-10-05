const express = require('express');
const { authenticateSession } = require('../middlewares/auth');
const { refreshToken, logout, logoutAll } = require('../controllers/authController');

const router = express.Router();

// Refresh access token
router.post('/refresh', refreshToken);

// Logout (revoke refresh token)
router.post('/logout', logout);

// Logout from all devices (requires authentication)
router.post('/logout-all', authenticateSession, logoutAll);

module.exports = router;
