const jwt = require("jsonwebtoken");
const { User } = require("../models");

// Extract token from Authorization header or session cookie
const extractToken = (req) => {
    // First try Authorization header
    const authHeader = req.headers.authorization || "";
    if (authHeader.startsWith("Bearer ")) {
        return authHeader.slice(7);
    }
    
    // Then try session cookie
    if (req.session && req.session.token) {
        return req.session.token;
    }
    
    // Also check for JWT in session
    if (req.session && req.session.jwt) {
        return req.session.jwt;
    }
    
    return null;
};

// Verify JWT and attach user to req (supports both header and session)
exports.authenticateJwt = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ 
                message: "Authorization token missing",
                hint: "Provide token in Authorization header or ensure user is logged in via session"
            });
        }

        const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-please-set-in-env';
        if (!process.env.JWT_SECRET) {
            console.warn('⚠️  WARNING: JWT_SECRET not set in environment variables. Using fallback secret.');
        }
        
        const payload = jwt.verify(token, jwtSecret);
        const user = await User.findById(payload.id);
        if (!user) return res.status(401).json({ message: "User not found" });

        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Session-based authentication (for frontend convenience)
exports.authenticateSession = async (req, res, next) => {
    try {
        // Debug logging
        console.log('🔍 Session auth check:', {
            hasSession: !!req.session,
            sessionId: req.session?.id,
            userId: req.session?.userId,
            token: req.session?.token,
            jwt: req.session?.jwt
        });

        // Check if user is already authenticated via session
        if (req.session && req.session.userId) {
            try {
                const user = await User.findById(req.session.userId);
                if (user) {
                    console.log('✅ User found in session:', user.email);
                    req.user = user;
                    return next();
                } else {
                    console.log('❌ User not found for session userId:', req.session.userId);
                }
            } catch (dbError) {
                console.log('⚠️ Database error, using session data:', dbError.message);
                // If database is not available, create a mock user from session
                req.user = {
                    id: req.session.userId,
                    email: req.session.userEmail || 'unknown@example.com',
                    role: req.session.userRole || 'user'
                };
                return next();
            }
        }
        
        // Fallback to JWT token extraction from session
        const token = extractToken(req);
        if (!token) {
            console.log('❌ No token found');
            return res.status(401).json({ 
                message: "Authentication required",
                hint: "Please login or provide valid token"
            });
        }

        console.log('🔑 Token found, verifying...');
        const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-please-set-in-env';
        
        try {
            const payload = jwt.verify(token, jwtSecret);
            const user = await User.findById(payload.id);
            if (!user) {
                console.log('❌ User not found for token payload:', payload.id);
                return res.status(401).json({ message: "User not found" });
            }

            console.log('✅ User authenticated via token:', user.email);
            // Store user in session for future requests
            if (req.session) {
                req.session.userId = user.id;
                req.session.userRole = user.role;
            }
            req.user = user;
            next();
        } catch (dbError) {
            // console.log('⚠️ Database error during token verification:', dbError.message);
            // If database is not available, create a mock user from token payload
            try {
                const payload = jwt.verify(token, jwtSecret);
                req.user = {
                    id: payload.id,
                    email: payload.email || 'unknown@example.com',
                    role: payload.role || 'user'
                };
                // Store user in session for future requests
                if (req.session) {
                    req.session.userId = payload.id;
                    req.session.userRole = payload.role || 'user';
                }
                next();
            } catch (jwtError) {
                // console.log('❌ JWT verification failed:', jwtError.message);
                return res.status(401).json({ message: "Invalid or expired token" });
            }
        }
    } catch (err) {
        // console.log('❌ Auth error:', err.message);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Role-based access control
exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: "Not authenticated" });
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        next();
    };
};

// Optional authentication (doesn't fail if no token)
exports.optionalAuth = async (req, res, next) => {
    try {
        const token = extractToken(req);
        if (token) {
            const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-please-set-in-env';
            const payload = jwt.verify(token, jwtSecret);
            const user = await User.findById(payload.id);
            if (user) {
                req.user = user;
            }
        }
        next();
    } catch (err) {
        // Continue without authentication
        next();
    }
};


