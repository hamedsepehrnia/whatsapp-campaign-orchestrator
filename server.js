// server.js
const http = require("http");
const dotenv = require("dotenv");

// Load env BEFORE requiring app and DB
dotenv.config();

const connectDB = require("./src/config/db");
const app = require("./src/app");
const websocketService = require("./src/services/websocketService");
const whatsappService = require("./src/services/whatsappService");

// Global error handlers to prevent server crash
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
    // Don't exit the process - keep server running
});

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    // Log the error but don't exit immediately
    // Allow current operations to complete
});

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