const fs = require('fs');
const logger = require('./logger');

/**
 * Safely delete a file
 */
const safeDeleteFile = (filePath) => {
    if (!filePath) return;
    
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        logger.logError('Error deleting file:', error.message);
    }
};

/**
 * Clean up uploaded file from request
 */
const cleanupUploadedFile = (req) => {
    if (req.file && req.file.path) {
        safeDeleteFile(req.file.path);
    }
};

module.exports = {
    safeDeleteFile,
    cleanupUploadedFile
};

