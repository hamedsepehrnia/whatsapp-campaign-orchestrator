const { NotFoundError, ForbiddenError, BadRequestError } = require('./errors');
const { Campaign } = require('../models');

/**
 * Verify campaign exists and user has access
 */
const verifyCampaignAccess = async (campaignId, userId) => {
    const campaign = await Campaign.findById(campaignId);
    
    if (!campaign) {
        throw new NotFoundError('Campaign not found');
    }
    
    if (campaign.userId !== userId) {
        throw new ForbiddenError('Access denied');
    }
    
    return campaign;
};

/**
 * Verify campaign is not running
 */
const verifyCampaignNotRunning = (campaign) => {
    if (campaign.status === 'RUNNING') {
        throw new BadRequestError('Cannot modify running campaign');
    }
};

/**
 * Verify campaign is ready
 */
const verifyCampaignReady = (campaign) => {
    if (campaign.status !== 'READY') {
        throw new BadRequestError('Campaign is not ready');
    }
};

/**
 * Verify campaign has recipients
 */
const verifyCampaignHasRecipients = (campaign) => {
    if (!campaign.recipients || campaign.recipients.length === 0) {
        throw new BadRequestError('No recipients found');
    }
};

module.exports = {
    verifyCampaignAccess,
    verifyCampaignNotRunning,
    verifyCampaignReady,
    verifyCampaignHasRecipients
};

