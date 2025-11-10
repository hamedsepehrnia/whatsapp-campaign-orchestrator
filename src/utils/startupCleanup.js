const { Campaign } = require('../models');
const { logInfo, logWarning } = require('./logger');

/**
 * Cleanup running campaigns on server startup
 * This function pauses all RUNNING campaigns that were left in RUNNING state
 * due to server shutdown or crash
 */
async function cleanupRunningCampaigns() {
    try {
        logInfo('🔍 Checking for running campaigns that need cleanup...');
        
        // Find all campaigns with RUNNING status
        // Use a large limit to get all running campaigns
        const runningCampaigns = await Campaign.findAll(
            { status: 'RUNNING' },
            { page: 1, limit: 10000 } // Get all running campaigns (up to 10k)
        );
        
        if (runningCampaigns.length === 0) {
            logInfo('✅ No running campaigns found. All good!');
            return;
        }
        
        logWarning(`⚠️ Found ${runningCampaigns.length} campaign(s) in RUNNING state. Pausing them...`);
        
        // Pause all running campaigns
        const campaignIds = [];
        for (const campaign of runningCampaigns) {
            try {
                await Campaign.update(campaign.id, {
                    status: 'PAUSED',
                    isConnected: false
                });
                campaignIds.push(campaign.id);
                logInfo(`   ✓ Paused campaign ID: ${campaign.id} (${campaign.title || 'Untitled'})`);
            } catch (error) {
                logWarning(`   ✗ Failed to pause campaign ID: ${campaign.id} - ${error.message}`);
            }
        }
        
        logInfo(`✅ Successfully paused ${campaignIds.length} out of ${runningCampaigns.length} campaign(s)`);
        
        return {
            total: runningCampaigns.length,
            paused: campaignIds.length,
            failed: runningCampaigns.length - campaignIds.length
        };
    } catch (error) {
        logWarning(`❌ Error during campaign cleanup: ${error.message}`);
        // Don't throw - we don't want to prevent server startup
        return null;
    }
}

module.exports = {
    cleanupRunningCampaigns
};

