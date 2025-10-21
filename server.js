// server.js
const http = require("http");
const dotenv = require("dotenv");

// Load env BEFORE requiring app and DB
dotenv.config();

const connectDB = require("./src/config/db");
const app = require("./src/app");
const websocketService = require("./src/services/websocketService");
const whatsappService = require("./src/services/whatsappService");

connectDB();

const PORT = process.env.PORT;
const server = http.createServer(app);

// Initialize WebSocket service
websocketService.initialize(server);

// Initialize WhatsApp service with WebSocket
whatsappService.init(websocketService);

server.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📡 WebSocket server running on ws://localhost:${PORT}/ws/campaigns`);
    console.log(`📱 WhatsApp service initialized`);
});