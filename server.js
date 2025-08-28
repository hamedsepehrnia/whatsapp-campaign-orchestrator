// server.js
const http = require("http");
const dotenv = require("dotenv");
const connectDB = require("./src/config/db");
const app = require("./src/app");


dotenv.config();

connectDB();


const PORT = process.env.PORT || 5000;
const server = http.createServer(app);


server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
});