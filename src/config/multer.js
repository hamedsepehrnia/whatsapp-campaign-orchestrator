const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { fileFilter } = require('../utils/campaignHelpers');

/**
 * Create multer storage configuration
 * @param {string} directory - Upload directory
 * @param {string} prefix - Filename prefix
 */
function createStorage(directory, prefix = 'file') {
    return multer.diskStorage({
        destination: (req, file, cb) => {
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true });
            }
            cb(null, directory);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `${prefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
        }
    });
}

// Temporary storage for preview uploads
const tempStorage = createStorage('uploads/temp/', 'temp');

// Permanent storage for final uploads
const permanentStorage = createStorage('uploads/', 'file');

// Multer configuration options
const multerOptions = {
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    },
    fileFilter: fileFilter
};

// Temporary file uploader
const tempUpload = multer({ 
    storage: tempStorage,
    ...multerOptions
});

// Permanent file uploader
const permanentUpload = multer({ 
    storage: permanentStorage,
    ...multerOptions
});

// Legacy upload for backward compatibility
const upload = permanentUpload;

module.exports = {
    tempUpload,
    permanentUpload,
    upload,
    createStorage
};

