const express = require('express');
const passport = require('passport');
const { registerUser, registerUserSimple, loginUser, getProfile, editProfile, logoutUser } = require('../controllers/userController');
const { validate } = require('../middlewares/validate');
const { userRegisterSchema, userRegisterSimpleSchema, userLoginSchema } = require('../validators/schemas');

const router = express.Router();

// Middleware برای چک کردن لاگین بودن کاربر
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Not authenticated" });
}

// ثبت‌نام با OTP
router.post("/register", validate(userRegisterSchema), registerUser);

// ثبت‌نام ساده بدون OTP
router.post("/register-simple", validate(userRegisterSimpleSchema), registerUserSimple);

// لاگین با Passport + JWT
router.post("/login", validate(userLoginSchema), (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) return res.status(401).json({ message: info.message });

        // Establish session once via passport, then return JWT via controller using req.user
        req.login(user, { session: true }, (err) => {
            if (err) return next(err);
            req.user = user;
            return loginUser(req, res);
        });
    })(req, res, next);
});

// پروفایل کاربر
router.get('/profile', isAuthenticated, getProfile);
router.post('/profile', isAuthenticated, editProfile);

// خروج از حساب کاربری
router.post("/logout", isAuthenticated, logoutUser);

module.exports = router;
