const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { RefreshToken } = require('../models');
const { v4: uuidv4 } = require('uuid');

// Generate JWT token (short-lived)
const generateAccessToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' } // 30 روز
    );
};

// Generate Refresh Token (long-lived)
const generateRefreshToken = async (user) => {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60 روز
    
    const refreshToken = new RefreshToken({
        user: user._id,
        token: token,
        expiresAt: expiresAt
    });
    
    await refreshToken.save();
    return token;
};

// Login with Refresh Token
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        
        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user);
        
        // Store JWT token in session for frontend convenience
        if (req.session) {
            req.session.token = accessToken;
            req.session.jwt = accessToken;
            req.session.userId = user._id;
            req.session.userRole = user.role;
        }
        
        res.json({
            message: 'Login successful',
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                profile: user.profile
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Refresh Access Token
exports.refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token required' });
        }
        
        // Find refresh token in database
        const tokenRecord = await RefreshToken.findOne({ 
            token: refreshToken,
            isRevoked: false 
        }).populate('user');
        
        if (!tokenRecord) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
        
        // Check if token is expired
        if (tokenRecord.expiresAt < new Date()) {
            await RefreshToken.deleteOne({ _id: tokenRecord._id });
            return res.status(401).json({ message: 'Refresh token expired' });
        }
        
        // Generate new access token
        const newAccessToken = generateAccessToken(tokenRecord.user);
        
        res.json({
            message: 'Token refreshed successfully',
            accessToken: newAccessToken
        });
        
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout (revoke refresh token)
exports.logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (refreshToken) {
            await RefreshToken.findOneAndUpdate(
                { token: refreshToken },
                { isRevoked: true }
            );
        }
        
        // Clear session data
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destroy error:', err);
                }
            });
        }
        
        res.json({ message: 'Logout successful' });
        
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Logout from all devices
exports.logoutAll = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Revoke all refresh tokens for this user
        await RefreshToken.updateMany(
            { user: userId },
            { isRevoked: true }
        );
        
        // Clear current session
        if (req.session) {
            req.session.destroy((err) => {
                if (err) {
                    console.error('Session destroy error:', err);
                }
            });
        }
        
        res.json({ message: 'Logged out from all devices' });
        
    } catch (error) {
        console.error('Logout all error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
