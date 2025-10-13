const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Otp } = require("../models");

// REGISTER WITH OTP
exports.registerUser = async (req, res) => {
    try {
        const { name, username, email, password, phone, verificationToken } = req.body;

        // بررسی اینکه username قبلاً وجود نداشته باشه
        const existingUsername = await User.findByUsername(username);
        if (existingUsername) return res.status(400).json({ message: "Username already exists" });

        // بررسی اینکه email قبلاً وجود نداشته باشه
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) return res.status(400).json({ message: "Email already exists" });

        // Enforce OTP verification (simple mode)
        if (!verificationToken) {
            return res.status(400).json({ message: "verificationToken is required" });
        }

        const otpRecord = await Otp.findByTarget(email, 'EMAIL', 'REGISTER') || 
                          await Otp.findByTarget(phone, 'SMS', 'REGISTER');
        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid verification token" });
        }
        if (!otpRecord.verified) {
            return res.status(400).json({ message: "OTP not verified" });
        }
        // Ensure OTP target matches email or phone
        const matchesEmail = otpRecord.channel === 'EMAIL' && otpRecord.target === email;
        const matchesPhone = otpRecord.channel === 'SMS' && otpRecord.target === phone;
        if (!matchesEmail && !matchesPhone) {
            return res.status(400).json({ message: "OTP does not match provided contact" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            username,
            email,
            phone,
            password: hashedPassword,
            age: null,
            address: null,
            avatar: null,
        });

// REGISTER WITHOUT OTP (Simple Registration)
exports.registerUserSimple = async (req, res) => {
    try {
        const { name, username, email, password, phone } = req.body;

        // بررسی اینکه username قبلاً وجود نداشته باشه
        const existingUsername = await User.findByUsername(username);
        if (existingUsername) return res.status(400).json({ message: "Username already exists" });

        // بررسی اینکه email قبلاً وجود نداشته باشه
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) return res.status(400).json({ message: "Email already exists" });

        // بررسی اینکه phone قبلاً وجود نداشته باشه
        if (phone) {
            const existingPhone = await User.findByPhone(phone);
            if (existingPhone) return res.status(400).json({ message: "Phone number already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            username,
            email,
            phone: phone || null,
            password: hashedPassword,
            age: null,
            address: null,
            avatar: null,
        });

        // Invalidate OTP record for reuse prevention
        try { await Otp.delete(otpRecord.id); } catch (e) {}
        res.json({ 
            message: "User registered successfully", 
            user: { 
                id: user.id, 
                name: user.name, 
                username: user.username,
                email: user.email 
            } 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

        res.json({ 
            message: "User registered successfully (without OTP)", 
            user: { 
                id: user.id, 
                name: user.name, 
                username: user.username,
                email: user.email,
                phone: user.phone
            } 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// LOGIN (expects req.user set by passport.authenticate)
exports.loginUser = async (req, res) => {
    try {
        const user = req.user;
        if (!user) return res.status(401).json({ message: "Not authenticated" });

        const jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret-please-set-in-env';
        if (!process.env.JWT_SECRET) {
            console.warn('⚠️  WARNING: JWT_SECRET not set in environment variables. Using fallback secret.');
        }
        const token = jwt.sign(
            { id: user.id, role: user.role },
            jwtSecret,
            { expiresIn: "30d" }
        );

        return res.status(200).json({
            message: "User login successfully",
            token,
            user: { 
                id: user.id, 
                name: user.name, 
                username: user.username, 
                email: user.email, 
                profile: { 
                    age: user.age, 
                    address: user.address, 
                    avatar: user.avatar 
                } 
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// GET PROFILE
exports.getProfile = async (req, res) => {
    if (!req.user) return res.status(401).json({ message: "User not authorized" });
    res.json({ user: req.user });
};

// EDIT PROFILE
exports.editProfile = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "User not authorized" });

        const { username, email, password, currentPassword, age, avatar, address } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const updateData = {};

        if (username) {
            const existingUsername = await User.findByUsername(username);
            if (existingUsername && existingUsername.id !== user.id) {
                return res.status(400).json({ message: "Username already in use" });
            }
            updateData.username = username;
        }

        if (email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== user.id) {
                return res.status(400).json({ message: "Email already in use" });
            }
            updateData.email = email;
        }

        if (age !== undefined) {
            if (typeof age !== "number" || age < 0) return res.status(400).json({ message: "Invalid age" });
            updateData.age = age;
        }

        if (address !== undefined) updateData.address = address;
        if (avatar !== undefined) updateData.avatar = avatar;

        if (password) {
            if (!currentPassword) return res.status(400).json({ message: "Current password is required" });
            if (!user.password) return res.status(400).json({ message: "This account uses Google login and cannot change password" });

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.update(user.id, updateData);
        res.json({ 
            message: "Profile updated successfully", 
            user: { 
                id: updatedUser.id, 
                name: updatedUser.name, 
                username: updatedUser.username, 
                email: updatedUser.email, 
                profile: { 
                    age: updatedUser.age, 
                    address: updatedUser.address, 
                    avatar: updatedUser.avatar 
                } 
            } 
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// LOGOUT
exports.logoutUser = async (req, res, next) => {
    req.logout(err => {
        if (err) return next(err);
        res.json({ message: "Logout successfully" });
    });
};
