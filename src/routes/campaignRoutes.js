const express = require('express');
const { authenticateSession } = require('../middlewares/auth');
const { validateCampaignStatus } = require('../middlewares/validateCampaignStatus');
const { 
    checkCampaignStartPermission, 
    getSubscriptionInfo 
} = require('../middlewares/subscription');
const {
    createCampaign,
    uploadRecipients,
    uploadAttachment,
    uploadTempAttachment,
    confirmAttachment,
    serveTempFile,
    cleanupTempFiles,
    deleteAttachment,
    getAttachmentDetails,
    getCampaignPreview,
    confirmAndStartCampaign,
    getCampaignStepStatus,
    navigateToStep,
    goBackStep,
    resetToStep,
    generateQRCode,
    checkConnection,
    startCampaign,
    getMyCampaigns,
    searchCampaigns,
    getCampaignDetails,
    downloadReport,
    pauseCampaign,
    resumeCampaign,
    deleteCampaign,
    setCampaignInterval,
    getScheduledCampaigns,
    cancelScheduledCampaign,
    forceCleanupSession
} = require('../controllers/campaignController');
const { downloadExcelTemplate } = require('../controllers/adminController');

const router = express.Router();

// Public route for downloading Excel template (no authentication required)
router.get('/excel-template/download', downloadExcelTemplate);

// All other routes require JWT authentication
router.use(authenticateSession);

// Subscription info
router.get('/subscription', getSubscriptionInfo, require('../controllers/campaignController').getSubscriptionInfo);

// Campaign CRUD operations
router.post('/', createCampaign);
router.get('/', validateCampaignStatus, getMyCampaigns);
router.get('/search', validateCampaignStatus, searchCampaigns);
router.get('/:campaignId', getCampaignDetails);
router.delete('/:campaignId', deleteCampaign);

// Campaign settings
router.put('/:campaignId/interval', setCampaignInterval);

// Scheduled campaigns
router.get('/scheduled', getScheduledCampaigns);
router.post('/:campaignId/cancel-schedule', cancelScheduledCampaign);

// File uploads with subscription validation
router.post('/:campaignId/recipients', uploadRecipients);
router.post('/:campaignId/attachment', uploadAttachment);
router.delete('/:campaignId/attachment', deleteAttachment);
router.get('/:campaignId/attachment', getAttachmentDetails);

// Temporary file management
router.post('/:campaignId/attachment/temp', uploadTempAttachment);
router.post('/:campaignId/attachment/confirm', confirmAttachment);
router.get('/temp-files/:filename', serveTempFile);
router.post('/cleanup-temp', cleanupTempFiles);

// Campaign preview and confirmation
router.get('/:campaignId/preview', getCampaignPreview);
router.post('/:campaignId/confirm-and-start', confirmAndStartCampaign);

// Wizard navigation
router.get('/:campaignId/steps', getCampaignStepStatus);
router.post('/:campaignId/navigate', navigateToStep);
router.post('/:campaignId/go-back', goBackStep);
router.post('/:campaignId/reset', resetToStep);

// WhatsApp integration
router.post('/:campaignId/qr-code', generateQRCode);
router.get('/:campaignId/connection', checkConnection);
router.post('/:campaignId/cleanup-session', forceCleanupSession);

// Campaign control with permission checks
router.post('/:campaignId/start', checkCampaignStartPermission, startCampaign);
router.post('/:campaignId/pause', pauseCampaign);
router.post('/:campaignId/resume', resumeCampaign);

// Progress and reporting
router.get('/:campaignId/report/download', downloadReport);

module.exports = router;
