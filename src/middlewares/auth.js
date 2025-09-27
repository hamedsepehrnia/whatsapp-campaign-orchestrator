const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verify JWT and attach user to req
exports.authenticateJwt = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
        if (!token) return res.status(401).json({ message: "Authorization token missing" });

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


