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
    generateQRCode,
    checkConnection,
    startCampaign,
    getMyCampaigns,
    searchCampaigns,
    getCampaignDetails,
    getCampaignRecipients,
    generateReport,
    downloadReport,
    downloadMultipleReports,
    pauseCampaign,
    resumeCampaign,
    deleteCampaign,
    setCampaignInterval,
    getScheduledCampaigns,
    cancelScheduledCampaign,
    forceCleanupSession,
    updateCampaignTitle
} = require('../controllers/campaignController');
const { downloadExcelTemplate } = require('../controllers/adminController');

const router = express.Router();

// Public route for downloading Excel template (no authentication required)
router.get('/excel-template/download', downloadExcelTemplate);

// All other routes require JWT authentication
router.use(authenticateSession);

// Subscription info
router.get('/subscription', getSubscriptionInfo, require('../controllers/campaignController').getSubscriptionInfo);

// Scheduled campaigns - MUST be before /:campaignId routes
router.get('/scheduled', getScheduledCampaigns);

// Campaign CRUD operations
router.post('/', createCampaign);
router.get('/', validateCampaignStatus, getMyCampaigns);
router.get('/search', validateCampaignStatus, searchCampaigns);

// Campaign settings
router.put('/:campaignId/interval', setCampaignInterval);
router.put('/:campaignId/title', updateCampaignTitle);

// Scheduled campaign cancel
router.post('/:campaignId/cancel-schedule', cancelScheduledCampaign);

// Campaign CRUD with ID - MUST be after all specific routes
router.get('/:campaignId', getCampaignDetails);
router.delete('/:campaignId', deleteCampaign);

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

// WhatsApp integration
router.post('/:campaignId/qr-code', generateQRCode);
router.get('/:campaignId/connection', checkConnection);
router.post('/:campaignId/cleanup-session', forceCleanupSession);

// Campaign control with permission checks
router.post('/:campaignId/start', checkCampaignStartPermission, startCampaign);
router.post('/:campaignId/pause', pauseCampaign);
router.post('/:campaignId/resume', resumeCampaign);

// Progress and reporting
router.get('/:campaignId/report', generateReport);
router.get('/:campaignId/report/download', downloadReport);
router.post('/reports/download-multiple', downloadMultipleReports);

// Recipients management
router.get('/:campaignId/recipients', getCampaignRecipients);

module.exports = router;
