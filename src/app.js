const express = require("express");
const session = require("express-session");
const passport = require("passport");
const morgan = require("morgan");
const cors = require("cors");

const app = express();
const userRoutes = require("./routes/userRoutes");
const packageRoutes = require("./routes/packageRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const refreshRoutes = require("./routes/refreshRoutes");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// MiddleWares
app.use(express.json());
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
<<<<<<< HEAD
app.use(cors());
=======
app.use(cors({
    origin: process.env.FRONTEND_URL,
  credentials: true    
}));
>>>>>>> f0d7df4 (add cros and session config for cookie)
app.use(morgan("dev"));

// session middleware
const sessionSecret = process.env.SESSION_SECRET || 'fallback-session-secret-please-set-in-env';
if (!process.env.SESSION_SECRET) {
    console.warn('⚠️  WARNING: SESSION_SECRET not set in environment variables. Using fallback secret.');
}
app.use(
    session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
<<<<<<< HEAD
    })
=======
          cookie: {
    httpOnly: true,
    secure: false,
    sameSite: "lax"
  }
        
    }
)
>>>>>>> f0d7df4 (add cros and session config for cookie)
)

// Passport middleware
app.use(passport.initialize());
app.use(passport.session())
require("./config/passport")(passport);

// Routes
app.use("/api/user", userRoutes)
app.use("/api/auth", authRoutes)
app.use("/api/refresh", refreshRoutes)
app.use("/api/packages", packageRoutes)
app.use("/api/orders", orderRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/campaigns", campaignRoutes)

// Centralized error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
});

module.exports = app;