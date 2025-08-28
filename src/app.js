const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const app = express();

// MiddleWares
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

// Routes
app.get("/", (req, res) => {
    res.json({ message: "API is running..." });
});

// در آینده اینو اضافه می‌کنی:
// const userRoutes = require("./routes/userRoutes");
// app.use("/api/users", userRoutes);

module.exports = app;