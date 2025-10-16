// config/passport.js
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const { User } = require("../models");

module.exports = function (passport) {
    // Local Strategy
    passport.use(
        new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
            try {
                console.log('🔍 Passport Strategy - Looking for user with email:', email);
                
                const user = await User.findByEmail(email);
                console.log('👤 User found:', user ? `ID: ${user.id}, Email: ${user.email}` : 'Not found');
                
                if (!user) {
                    console.log('❌ User not found for email:', email);
                    return done(null, false, { message: "User not found" });
                }

                // بررسی وضعیت کاربر
                if (user.status === 'BANNED') {
                    console.log('🚫 User is banned:', user.id);
                    return done(null, false, { message: "Account is banned" });
                }

                if (user.status === 'INACTIVE') {
                    console.log('⏸️ User is inactive:', user.id);
                    return done(null, false, { message: "Account is inactive" });
                }

                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    console.log('🔒 Wrong password for user:', user.id);
                    return done(null, false, { message: "Wrong password" });
                }

                console.log('✅ Login successful for user:', user.id);
                return done(null, user);
            } catch (err) {
                console.error('💥 Passport Strategy Error:', err);
                return done(err);
            }
        })
    );

    // Serialize & Deserialize
    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            console.log('🔍 Deserializing user:', id);
            const user = await User.findById(id);
            console.log('👤 Deserialized user:', user ? `ID: ${user.id}, Email: ${user.email}` : 'Not found');
            
            if (!user) {
                console.log('❌ User not found during deserialization:', id);
                return done(null, false);
            }
            
            done(null, user);
        } catch (err) {
            console.error('💥 Deserialize Error:', err);
            done(err, null);
        }
    });
};
