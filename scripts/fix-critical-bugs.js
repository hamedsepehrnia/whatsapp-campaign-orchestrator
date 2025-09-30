// Fix Critical Bugs in the Project
// This file contains fixes for critical bugs that can cause server crashes

// 1. Fix Environment Variables Validation
const validateEnvironmentVariables = () => {
    const requiredEnvVars = [
        'JWT_SECRET',
        'SESSION_SECRET', 
        'MONGODB_URI',
        'PORT'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:', missingVars);
        console.error('Please set these variables in your .env file');
        process.exit(1);
    }
    
    console.log('✅ All required environment variables are set');
};

// 2. Fix JWT Secret Fallback
const getJWTSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        console.warn('⚠️  WARNING: JWT_SECRET not set. Using fallback secret.');
        return 'fallback-jwt-secret-please-set-in-env';
    }
    return secret;
};

// 3. Fix Session Secret Fallback
const getSessionSecret = () => {
    const secret = process.env.SESSION_SECRET;
    if (!secret) {
        console.warn('⚠️  WARNING: SESSION_SECRET not set. Using fallback secret.');
        return 'fallback-session-secret-please-set-in-env';
    }
    return secret;
};

// 4. Fix MongoDB Connection with Retry
const connectDBWithRetry = async (mongoose) => {
    const maxRetries = 5;
    let retries = 0;
    
    while (retries < maxRetries) {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB');
            return;
        } catch (error) {
            retries++;
            console.error(`❌ MongoDB connection failed (attempt ${retries}/${maxRetries}):`, error.message);
            
            if (retries === maxRetries) {
                console.error('❌ Failed to connect to MongoDB after all retries');
                process.exit(1);
            }
            
            await new Promise(resolve => setTimeout(resolve, 2000 * retries));
        }
    }
};

// 5. Fix File Upload Error Handling
const safeFileDelete = (filePath) => {
    try {
        if (filePath && require('fs').existsSync(filePath)) {
            require('fs').unlinkSync(filePath);
        }
    } catch (error) {
        console.error('❌ Error deleting file:', error.message);
    }
};

// 6. Fix WhatsApp Service Error Handling
const safeWhatsAppCleanup = (client) => {
    try {
        if (client && typeof client.destroy === 'function') {
            client.destroy();
        }
    } catch (error) {
        console.error('❌ Error destroying WhatsApp client:', error.message);
    }
};

// 7. Fix WebSocket Error Handling
const safeWebSocketSend = async (websocketService, method, ...args) => {
    try {
        if (websocketService && typeof websocketService[method] === 'function') {
            await websocketService[method](...args);
        }
    } catch (error) {
        console.error(`❌ WebSocket ${method} error:`, error.message);
    }
};

// 8. Fix Campaign Status Validation
const validateCampaignStatus = (status) => {
    const validStatuses = ['draft', 'ready', 'running', 'paused', 'completed', 'failed', 'cancelled'];
    return validStatuses.includes(status);
};

// 9. Fix Phone Number Validation
const validatePhoneNumber = (phone) => {
    if (!phone) return false;
    const cleaned = phone.toString().replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
};

// 10. Fix Memory Leak Prevention
const cleanupResources = () => {
    // Cleanup WhatsApp clients
    if (global.whatsappClients) {
        for (const [campaignId, session] of global.whatsappClients.entries()) {
            safeWhatsAppCleanup(session.client);
        }
        global.whatsappClients.clear();
    }
    
    // Cleanup campaign intervals
    if (global.campaignIntervals) {
        for (const [campaignId, interval] of global.campaignIntervals.entries()) {
            clearInterval(interval.intervalId);
        }
        global.campaignIntervals.clear();
    }
};

// Export all fixes
module.exports = {
    validateEnvironmentVariables,
    getJWTSecret,
    getSessionSecret,
    connectDBWithRetry,
    safeFileDelete,
    safeWhatsAppCleanup,
    safeWebSocketSend,
    validateCampaignStatus,
    validatePhoneNumber,
    cleanupResources
};
