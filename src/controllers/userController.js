const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Otp = require("../models/Otp");

// REGISTER
exports.registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, verificationToken } = req.body;

        // بررسی اینکه کاربر قبلاً وجود نداشته باشه
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        // Enforce OTP verification (simple mode)
        if (!verificationToken) {
            return res.status(400).json({ message: "verificationToken is required" });
        }

        const otpRecord = await Otp.findById(verificationToken);
        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid verification token" });
        }
        if (!otpRecord.verified) {
            return res.status(400).json({ message: "OTP not verified" });
        }
        // Ensure OTP target matches email or phone
        const matchesEmail = otpRecord.channel === 'email' && otpRecord.target === email;
        const matchesPhone = otpRecord.channel === 'sms' && otpRecord.target === phone;
        if (!matchesEmail && !matchesPhone) {
            return res.status(400).json({ message: "OTP does not match provided contact" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            phone,
            password: hashedPassword,
            profile: { age: null, address: null, avatar: null },
        });

        await user.save();
        // Invalidate OTP record for reuse prevention
        try { await Otp.deleteOne({ _id: otpRecord._id }); } catch (e) {}
        res.json({ message: "User registered successfully", user: { id: user._id, name: user.name, email: user.email } });

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
            { id: user._id, role: user.role },
            jwtSecret,
            { expiresIn: "30d" }
        );

        return res.status(200).json({
            message: "User login successfully",
            token,
            user: { id: user._id, name: user.name, email: user.email, profile: user.profile }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// GET PROFILE
exports.getProfile = async (req, res) => {
<<<<<<< HEAD
=======
    
>>>>>>> f0d7df4 (add cros and session config for cookie)
    if (!req.user) return res.status(401).json({ message: "User not authorized" });
    res.json({ user: req.user });
};

// EDIT PROFILE
exports.editProfile = async (req, res) => {
    try {
        if (!req.user) return res.status(401).json({ message: "User not authorized" });

        const { email, password, currentPassword, age, avatar, address } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.profile = user.profile || {};

        if (email) {
            const existingUser = await User.findOne({ email });
            if (existingUser && existingUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: "Email already in use" });
            }
            user.email = email;
        }

        if (age !== undefined) {
            if (typeof age !== "number" || age < 0) return res.status(400).json({ message: "Invalid age" });
            user.profile.age = age;
        }

        if (address !== undefined) user.profile.address = address;
        if (avatar !== undefined) user.profile.avatar = avatar;

        if (password) {
            if (!currentPassword) return res.status(400).json({ message: "Current password is required" });
            if (!user.password) return res.status(400).json({ message: "This account uses Google login and cannot change password" });

            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(401).json({ message: "Current password is incorrect" });

            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();
        res.json({ message: "Profile updated successfully", user: { id: user._id, name: user.name, email: user.email, profile: user.profile } });

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
