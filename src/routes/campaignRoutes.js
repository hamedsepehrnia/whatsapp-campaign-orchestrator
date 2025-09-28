const express = require('express');
const { authenticateJwt } = require('../middlewares/auth');
const { 
    checkSubscriptionLimit, 
    checkCampaignStartPermission, 
    getSubscriptionInfo 
} = require('../middlewares/subscription');
const {
    createCampaign,
    uploadRecipients,
    uploadAttachment,
    generateQRCode,
    checkConnection,
    startCampaign,
    getProgress,
    getMyCampaigns,
    getCampaignDetails,
    generateReport,
    downloadReport,
    pauseCampaign,
    resumeCampaign,
    deleteCampaign,
    setCampaignInterval,
    getCampaignStepStatus
} = require('../controllers/campaignController');
const { downloadExcelTemplate } = require('../controllers/adminController');

const router = express.Router();

// Public route for downloading Excel template (no authentication required)
router.get('/excel-template/download', downloadExcelTemplate);

// All other routes require JWT authentication
router.use(authenticateJwt);

// Subscription info
router.get('/subscription', getSubscriptionInfo, require('../controllers/campaignController').getSubscriptionInfo);

// Campaign CRUD operations
router.post('/', createCampaign);
router.get('/', getMyCampaigns);
router.get('/:campaignId', getCampaignDetails);
router.get('/:campaignId/steps', getCampaignStepStatus);
router.delete('/:campaignId', deleteCampaign);

// Campaign settings
router.put('/:campaignId/interval', setCampaignInterval);

// File uploads with subscription validation
router.post('/:campaignId/recipients', checkSubscriptionLimit, uploadRecipients);
router.post('/:campaignId/attachment', uploadAttachment);

// WhatsApp integration
router.post('/:campaignId/qr-code', generateQRCode);
router.get('/:campaignId/connection', checkConnection);

// Campaign control with permission checks
router.post('/:campaignId/start', checkCampaignStartPermission, startCampaign);
router.post('/:campaignId/pause', pauseCampaign);
router.post('/:campaignId/resume', resumeCampaign);

// Progress and reporting
router.get('/:campaignId/progress', getProgress);
router.get('/:campaignId/report', generateReport);
router.get('/:campaignId/report/download', downloadReport);

module.exports = router;
