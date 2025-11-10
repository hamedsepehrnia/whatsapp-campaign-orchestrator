const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { RefreshToken } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { asyncHandler } = require('../middlewares/errorHandler');
const { UnauthorizedError, BadRequestError } = require('../utils/errors');

// Generate JWT token (short-lived)
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' } // 30 روز
    );
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = async (user) => {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 روز
    
    await RefreshToken.create({
        userId: user.id,
        token: token,
        expiresAt: expiresAt
    });
    
    return token;
};

// Login with Refresh Token
exports.login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    const user = await User.findByEmail(email);
    if (!user) {
        throw new UnauthorizedError('Invalid credentials');
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new UnauthorizedError('Invalid credentials');
    }
    
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user);
    
    if (req.session) {
        req.session.token = accessToken;
        req.session.jwt = accessToken;
        req.session.userId = user.id;
        req.session.userRole = user.role;
    }
    
    res.json({
        success: true,
        message: 'Login successful',
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            profile: user.profile
        }
    });
});

// Refresh Access Token
exports.refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        throw new BadRequestError('Refresh token required');
    }
    
    const tokenRecord = await RefreshToken.findByToken(refreshToken);
    
    if (!tokenRecord) {
        throw new UnauthorizedError('Invalid refresh token');
    }
    
    if (tokenRecord.expiresAt < new Date()) {
        await RefreshToken.delete(tokenRecord.id);
        throw new UnauthorizedError('Refresh token expired');
    }
    
    const newAccessToken = generateAccessToken(tokenRecord.user);
    
    res.json({
        success: true,
        message: 'Token refreshed successfully',
        accessToken: newAccessToken
    });
});

// Logout (revoke refresh token)
exports.logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
        const tokenRecord = await RefreshToken.findByToken(refreshToken);
        if (tokenRecord) {
            await RefreshToken.update(tokenRecord.id, { isRevoked: true });
        }
    }
    
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
        });
    }
    
    res.json({ 
        success: true,
        message: 'Logout successful' 
    });
});

// Logout from all devices
exports.logoutAll = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    await RefreshToken.revokeAllForUser(userId);
    
    if (req.session) {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err);
            }
        });
    }
    
    res.json({ 
        success: true,
        message: 'Logged out from all devices' 
    });
});
