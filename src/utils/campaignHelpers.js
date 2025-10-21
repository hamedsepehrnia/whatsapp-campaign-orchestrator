const { Campaign } = require('../models');

/**
 * Validate campaign access for a user
 * @param {string|number} campaignId - Campaign ID
 * @param {string|number} userId - User ID
 * @returns {Promise<Campaign>} - Campaign object if valid
 * @throws {Error} - If campaign not found or access denied
 */
async function validateCampaignAccess(campaignId, userId) {
    const campaign = await Campaign.findById(campaignId);
    
    if (!campaign) {
        const error = new Error("Campaign not found");
        error.statusCode = 404;
        throw error;
    }

    if (campaign.userId !== userId) {
        const error = new Error("Access denied");
        error.statusCode = 403;
        throw error;
    }

    return campaign;
}

/**
 * Validate campaign status for modification
 * @param {Campaign} campaign - Campaign object
 * @param {Array<string>} allowedStatuses - Allowed statuses for this operation
 * @throws {Error} - If status is not allowed
 */
function validateCampaignStatus(campaign, allowedStatuses = []) {
    if (allowedStatuses.length > 0 && !allowedStatuses.includes(campaign.status)) {
        const error = new Error(`Campaign must be in one of these statuses: ${allowedStatuses.join(', ')}`);
        error.statusCode = 400;
        throw error;
    }
}

/**
 * Validate campaign is not running
 * @param {Campaign} campaign - Campaign object
 * @throws {Error} - If campaign is running
 */
function ensureCampaignNotRunning(campaign) {
    if (campaign.status === 'RUNNING') {
        const error = new Error("Cannot modify running campaign");
        error.statusCode = 400;
        throw error;
    }
}

/**
 * Multer file filter for dangerous file types
 */
const dangerousMimeTypes = [
    'application/x-executable',
    'application/x-msdownload',
    'application/x-msdos-program',
    'application/x-winexe',
    'application/x-msi',
    'application/x-ms-shortcut',
    'application/x-ms-wim',
    'application/x-ms-wmd',
    'application/x-ms-wmz',
    'application/x-ms-xbap',
    'application/x-msaccess',
    'application/x-mscardfile',
    'application/x-msclip',
    'application/x-msdownload',
    'application/x-msmediaview',
    'application/x-msmetafile',
    'application/x-msmoney',
    'application/x-mspublisher',
    'application/x-msschedule',
    'application/x-msterminal',
    'application/x-mswrite'
];

/**
 * Multer file filter function
 */
function fileFilter(req, file, cb) {
    if (dangerousMimeTypes.includes(file.mimetype)) {
        cb(new Error('File type not allowed for security reasons'), false);
    } else {
        cb(null, true);
    }
}

/**
 * Calculate campaign statistics from recipients
 * @param {Array} recipients - Array of recipients
 * @returns {Object} - Statistics object
 */
function calculateCampaignStats(recipients = []) {
    const totalMessages = recipients.length;
    const successfulMessages = recipients.filter(r => r.status === 'SENT' || r.status === 'DELIVERED').length;
    const failedMessages = recipients.filter(r => r.status === 'FAILED').length;
    const deliveredMessages = recipients.filter(r => r.status === 'DELIVERED').length;
    const pendingMessages = recipients.filter(r => r.status === 'PENDING').length;
    const deliveryRate = totalMessages > 0 ? Math.round((successfulMessages / totalMessages) * 100) : 0;

    return {
        totalMessages,
        successfulMessages,
        failedMessages,
        deliveredMessages,
        pendingMessages,
        remainingMessages: pendingMessages,
        deliveryRate
    };
}

module.exports = {
    validateCampaignAccess,
    validateCampaignStatus,
    ensureCampaignNotRunning,
    dangerousMimeTypes,
    fileFilter,
    calculateCampaignStats
};

