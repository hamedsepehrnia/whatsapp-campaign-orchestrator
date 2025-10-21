const { Campaign, User, Recipient, Attachment } = require('../models');
const prisma = require('../config/prisma');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const websocketService = require('../services/websocketService');
const whatsappService = require('../services/whatsappService');
const { tempUpload, permanentUpload, upload } = require('../config/multer');
const { 
    validateCampaignAccess, 
    ensureCampaignNotRunning, 
    calculateCampaignStats 
} = require('../utils/campaignHelpers');

// Helper: Safe file cleanup
function cleanupFile(filePath) {
    if (filePath && fs.existsSync(filePath)) {
        try {
            fs.unlinkSync(filePath);
        } catch (error) {
            console.error('❌ Error deleting file:', error.message);
        }
    }
}

// Create new campaign
exports.createCampaign = async (req, res) => {
    try {
        const { message, title } = req.body;
        
        if (!message || !title) {
            return res.status(400).json({ 
                message: "Message and title are required" 
            });
        }

        const campaign = await Campaign.create({
            userId: req.user.id,
            message,
            title: title.trim()
        });

        res.status(201).json({
            message: "Campaign created successfully",
            campaign: {
                id: campaign.id,
                title: campaign.title,
                status: campaign.status
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Upload recipients from Excel file
exports.uploadRecipients = [
    tempUpload.single('recipientsFile'),
    async (req, res) => {
        try {
            const { campaignId } = req.params;
            
            if (!req.file) {
                return res.status(400).json({ message: "Excel file is required" });
            }

            const campaign = await validateCampaignAccess(campaignId, req.user.id);

            // Read Excel file
            const workbook = xlsx.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);

            if (!data || data.length === 0) {
                return res.status(400).json({ 
                    message: "Excel file is empty or has no data" 
                });
            }

            // Check if required columns exist
            const firstRow = data[0];
            const hasPhoneColumn = firstRow.phone || firstRow.Phone || firstRow.PHONE || firstRow['شماره تلفن'];
            
            if (!hasPhoneColumn) {
                return res.status(400).json({ 
                    message: "Excel file must contain a 'phone' column" 
                });
            }

            // Extract phone numbers and names
            const recipients = [];
            const errors = [];
            
            data.forEach((row, index) => {
                try {
                    const phone = row.phone || row.Phone || row.PHONE || row['شماره تلفن'];
                    const name = row.name || row.Name || row.NAME || row['نام'];
                    
                    if (!phone) {
                        errors.push(`Row ${index + 2}: Missing phone number`);
                        return;
                    }

                    const cleanPhone = phone.toString().replace(/\D/g, '');
                    if (cleanPhone.length < 10) {
                        errors.push(`Row ${index + 2}: Invalid phone number format`);
                        return;
                    }

                    recipients.push({
                        phone: cleanPhone,
                        name: name ? name.toString() : undefined
                    });
                } catch (error) {
                    errors.push(`Row ${index + 2}: ${error.message}`);
                }
            });

            if (recipients.length === 0) {
                return res.status(400).json({ 
                    message: "No valid recipients found in Excel file",
                    errors: errors
                });
            }

            if (errors.length > 0) {
                console.warn(`⚠️ Excel upload warnings:`, errors);
            }

            // Check subscription limits
            const user = await User.findById(req.user.id);
            const totalRecipients = recipients.length;
            
            let messageLimit = 0;
            if (user.purchasedPackages && user.purchasedPackages.length > 0) {
                messageLimit = user.purchasedPackages.reduce((total, pkg) => {
                    return total + (pkg.messageLimit || 0);
                }, 0);
            }

            if (messageLimit > 0 && totalRecipients > messageLimit) {
                return res.status(400).json({
                    message: `Recipients count (${totalRecipients}) exceeds your subscription limit (${messageLimit})`
                });
            }

            // Save recipients
            const recipientsWithCampaignId = recipients.map(recipient => ({
                ...recipient,
                campaignId: parseInt(campaignId)
            }));
            
            await Recipient.createMany(recipientsWithCampaignId);

            // Update campaign
            await Campaign.update(campaignId, {
                totalRecipients: recipients.length,
                status: 'READY'
            });

            await websocketService.sendCampaignUpdate(campaignId, req.user.id);

            // Clean up uploaded file
            cleanupFile(req.file.path);

            res.json({
                message: "Recipients uploaded successfully",
                recipientsCount: recipients.length,
                warnings: errors.length > 0 ? errors : undefined,
                campaign: {
                    id: campaignId,
                    status: 'READY',
                    totalRecipients: recipients.length
                }
            });

        } catch (err) {
            console.error('❌ Excel upload error:', err);
            cleanupFile(req.file?.path);
            
            const statusCode = err.statusCode || 500;
            res.status(statusCode).json({ 
                message: err.message || "Server error while processing Excel file"
            });
        }
    }
];

// Upload temporary attachment
exports.uploadTempAttachment = [
    tempUpload.single('attachment'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ message: "Attachment file is required" });
            }

            res.json({
                message: "Temporary attachment uploaded successfully",
                file: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype,
                    tempPath: req.file.path,
                    url: `/api/temp-files/${req.file.filename}`
                }
            });

        } catch (err) {
            console.error(err);
            cleanupFile(req.file?.path);
            res.status(500).json({ message: "Server error", error: err.message });
        }
    }
];

// Upload permanent attachment
exports.uploadAttachment = [
    permanentUpload.single('attachment'),
    async (req, res) => {
        try {
            const { campaignId } = req.params;
            
            if (!req.file) {
                return res.status(400).json({ message: "Attachment file is required" });
            }

            const campaign = await validateCampaignAccess(campaignId, req.user.id);
            ensureCampaignNotRunning(campaign);

            // Delete old attachments
            const existingAttachments = await Attachment.findByCampaign(campaignId);
            for (const attachment of existingAttachments) {
                cleanupFile(attachment.path);
                await Attachment.delete(attachment.id);
            }

            // Create new attachment
            await Attachment.create({
                campaignId: parseInt(campaignId),
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            });

            res.json({
                message: "Attachment uploaded successfully",
                attachment: {
                    filename: req.file.filename,
                    originalName: req.file.originalname,
                    size: req.file.size,
                    mimetype: req.file.mimetype
                }
            });

        } catch (err) {
            console.error(err);
            cleanupFile(req.file?.path);
            const statusCode = err.statusCode || 500;
            res.status(statusCode).json({ message: err.message || "Server error" });
        }
    }
];

// Delete attachment
exports.deleteAttachment = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await validateCampaignAccess(campaignId, req.user.id);
        ensureCampaignNotRunning(campaign);

        // Delete attachment files
        const attachments = await Attachment.findByCampaign(campaignId);
        for (const attachment of attachments) {
            cleanupFile(attachment.path);
            await Attachment.delete(attachment.id);
        }

        res.json({
            message: "Attachment deleted successfully",
            campaign: {
                id: campaignId,
                attachment: null
            }
        });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Get attachment details
exports.getAttachmentDetails = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await validateCampaignAccess(campaignId, req.user.id);

        const attachments = await Attachment.findByCampaign(campaignId);
        
        if (!attachments || attachments.length === 0) {
            return res.json({
                hasAttachment: false,
                attachment: null
            });
        }

        const attachment = attachments[0];
        res.json({
            hasAttachment: true,
            attachment: {
                filename: attachment.filename,
                originalName: attachment.originalName,
                size: attachment.size,
                mimetype: attachment.mimetype,
                uploadDate: attachment.createdAt
            }
        });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Confirm attachment and move from temp to permanent
exports.confirmAttachment = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { tempFilename } = req.body;
        
        if (!tempFilename) {
            return res.status(400).json({ message: "Temporary filename is required" });
        }

        const campaign = await validateCampaignAccess(campaignId, req.user.id);
        ensureCampaignNotRunning(campaign);

        const tempPath = path.join('uploads/temp', tempFilename);
        
        if (!fs.existsSync(tempPath)) {
            return res.status(404).json({ message: "Temporary file not found" });
        }

        // Generate permanent filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(tempFilename);
        const permanentFilename = `attachment-${uniqueSuffix}${fileExtension}`;
        const permanentPath = path.join('uploads', permanentFilename);

        // Move file
        fs.renameSync(tempPath, permanentPath);
        const stats = fs.statSync(permanentPath);

        // Delete old attachment
        const existingAttachments = await Attachment.findByCampaign(campaignId);
        for (const attachment of existingAttachments) {
            cleanupFile(attachment.path);
            await Attachment.delete(attachment.id);
        }

        // Create new attachment
        await Attachment.create({
            campaignId: parseInt(campaignId),
            filename: permanentFilename,
            originalName: req.body.originalName || tempFilename,
            mimetype: req.body.mimetype || 'application/octet-stream',
            size: stats.size,
            path: permanentPath
        });

        res.json({
            message: "Attachment confirmed and saved successfully",
            attachment: {
                filename: permanentFilename,
                originalName: req.body.originalName || tempFilename,
                size: stats.size,
                mimetype: req.body.mimetype || 'application/octet-stream'
            }
        });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Serve temporary files
exports.serveTempFile = async (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join('uploads/temp', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "File not found" });
        }

        res.sendFile(path.resolve(filePath));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Clean up old temporary files
exports.cleanupTempFiles = async (req, res) => {
    try {
        const tempDir = 'uploads/temp/';
        
        if (!fs.existsSync(tempDir)) {
            return res.json({ message: "No temp directory found" });
        }

        const files = fs.readdirSync(tempDir);
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        let cleanedCount = 0;

        files.forEach(file => {
            const filePath = path.join(tempDir, file);
            const stats = fs.statSync(filePath);
            
            if (now - stats.mtime.getTime() > maxAge) {
                cleanupFile(filePath);
                cleanedCount++;
            }
        });

        res.json({
            message: `Cleaned up ${cleanedCount} temporary files`,
            cleanedCount
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get campaign preview
exports.getCampaignPreview = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await validateCampaignAccess(campaignId, req.user.id);

        if (campaign.status !== 'READY') {
            return res.status(400).json({ 
                message: "Campaign is not ready for preview" 
            });
        }

        const attachments = await Attachment.findByCampaign(campaignId);
        const attachment = attachments.length > 0 ? attachments[0] : null;

        // Prepare recipients cards
        const recipientCards = campaign.recipients.map((recipient, index) => ({
            id: index + 1,
            phone: recipient.phone,
            name: recipient.name || 'بدون نام',
            message: campaign.message,
            attachment: attachment ? {
                filename: attachment.originalName,
                size: attachment.size,
                type: attachment.mimetype
            } : null
        }));

        res.json({
            message: "Campaign preview retrieved successfully",
            campaign: {
                id: campaign.id,
                message: campaign.message,
                totalRecipients: campaign.recipients.length,
                interval: campaign.interval,
                hasAttachment: !!attachment,
                attachment: attachment ? {
                    filename: attachment.originalName,
                    size: attachment.size,
                    type: attachment.mimetype
                } : null,
                whatsappConnected: campaign.whatsappSession?.isConnected || false,
                status: campaign.status
            },
            recipients: recipientCards,
            preview: {
                totalCards: recipientCards.length,
                sampleCards: recipientCards.slice(0, 5),
                hasMore: recipientCards.length > 5
            }
        });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Get scheduled campaigns
exports.getScheduledCampaigns = async (req, res) => {
    try {
        const campaigns = await Campaign.findAll({
            userId: req.user.id,
            isScheduled: true,
            scheduledAt: { gt: new Date() },
            status: { in: ['READY', 'DRAFT'] }
        }, {
            orderBy: { scheduledAt: 'asc' }
        });

        res.json({
            message: "Scheduled campaigns retrieved successfully",
            campaigns: campaigns.map(campaign => ({
                id: campaign.id,
                message: campaign.message,
                recipients: campaign.recipients.length,
                scheduledAt: campaign.scheduledAt,
                timezone: campaign.timezone,
                interval: campaign.interval,
                status: campaign.status
            }))
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Cancel scheduled campaign
exports.cancelScheduledCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await validateCampaignAccess(campaignId, req.user.id);

        if (!campaign.isScheduled) {
            return res.status(400).json({ 
                message: "Campaign is not scheduled" 
            });
        }

        await Campaign.update(campaignId, {
            isScheduled: false,
            scheduledAt: null,
            timezone: 'Asia/Tehran',
            sendType: 'immediate'
        });

        res.json({
            message: "Scheduled campaign cancelled successfully",
            campaign: {
                id: campaign.id,
                isScheduled: false
            }
        });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Generate WhatsApp QR code
exports.generateQRCode = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await validateCampaignAccess(campaignId, req.user.id);

        // Clean up existing session
        console.log(`🧹 Cleaning up existing session for campaign ${campaignId}`);
        whatsappService.cleanupSession(campaignId);

        // Generate unique session ID
        const sessionId = uuidv4();
        
        campaign.whatsappSession = {
            isConnected: false,
            sessionId: sessionId,
            lastActivity: new Date()
        };

        await Campaign.update(campaignId, {
            status: 'READY'
        });

        // Initialize WhatsApp session
        console.log(`📱 Initializing new WhatsApp session for campaign ${campaignId}`);
        await whatsappService.prepareWhatsAppSessions([campaign], req.user.id);

        res.json({
            message: "QR code generation initiated",
            sessionId: sessionId,
            instructions: "WhatsApp session is being prepared. QR code will be sent via WebSocket."
        });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Check WhatsApp connection status
exports.checkConnection = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await validateCampaignAccess(campaignId, req.user.id);

        const hasActiveSession = whatsappService.hasActiveSession(campaignId);

        res.json({
            isConnected: campaign.whatsappSessionConnected,
            lastActivity: campaign.whatsappSessionLastActivity,
            hasActiveSession: hasActiveSession,
            sessionId: campaign.sessionId
        });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Force cleanup WhatsApp session
exports.forceCleanupSession = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await validateCampaignAccess(campaignId, req.user.id);

        whatsappService.cleanupSession(campaignId);

        campaign.whatsappSession = {
            isConnected: false,
            sessionId: null,
            lastActivity: null
        };
        await Campaign.update(campaignId, {
            status: 'READY'
        });

        res.json({
            message: "Session cleaned up successfully",
            campaignId: campaignId
        });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Start campaign
exports.startCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await validateCampaignAccess(campaignId, req.user.id);

        if (campaign.status !== 'READY') {
            return res.status(400).json({ 
                message: "Campaign is not ready to start" 
            });
        }

        if (campaign.recipients.length === 0) {
            return res.status(400).json({ 
                message: "No recipients found" 
            });
        }

        // Start WhatsApp campaign
        await whatsappService.handleStartCampaign(campaignId, req.user.id);

        res.json({
            message: "Campaign started successfully",
            campaign: {
                id: campaign.id,
                status: 'RUNNING',
                totalRecipients: campaign.totalRecipients,
                startedAt: new Date()
            }
        });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Pause campaign
exports.pauseCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await validateCampaignAccess(campaignId, req.user.id);

        if (campaign.status !== 'RUNNING') {
            return res.status(400).json({ 
                message: "Campaign is not running" 
            });
        }

        await whatsappService.handleStopCampaign(campaignId, 'PAUSED', req.user.id);

        res.json({
            message: "Campaign paused successfully",
            campaign: {
                id: campaign.id,
                status: 'PAUSED'
            }
        });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Resume campaign
exports.resumeCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await validateCampaignAccess(campaignId, req.user.id);

        if (campaign.status !== 'PAUSED') {
            return res.status(400).json({ 
                message: "Campaign is not paused" 
            });
        }

        await whatsappService.handleStartCampaign(campaignId, req.user.id);

        res.json({
            message: "Campaign resumed successfully",
            campaign: {
                id: campaign.id,
                status: 'RUNNING'
            }
        });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Get user's campaigns
exports.getMyCampaigns = async (req, res) => {
    try {
        const { 
            status, 
            title, 
            startDate, 
            endDate, 
            page = 1, 
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        
        const filter = { userId: parseInt(req.user.id) };
        
        if (status) {
            filter.status = Array.isArray(status) ? { in: status.map(s => s.trim()) } : status.trim();
        }
        
        if (title) {
            filter.title = { contains: String(title) };
        }
        
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.gte = new Date(startDate);
            if (endDate) filter.createdAt.lte = new Date(endDate);
        }

        const sortOptions = {
            'createdAt': { createdAt: sortOrder === 'desc' ? 'desc' : 'asc' },
            'updatedAt': { updatedAt: sortOrder === 'desc' ? 'desc' : 'asc' },
            'title': { title: sortOrder === 'desc' ? 'desc' : 'asc' },
            'status': { status: sortOrder === 'desc' ? 'desc' : 'asc' },
            'totalRecipients': { totalRecipients: sortOrder === 'desc' ? 'desc' : 'asc' },
            'sentCount': { sentCount: sortOrder === 'desc' ? 'desc' : 'asc' }
        };

        const orderBy = sortOptions[sortBy] || sortOptions['createdAt'];
        const pagination = { page: parseInt(page), limit: parseInt(limit) };
        const campaigns = await Campaign.findAll(filter, pagination, orderBy);
        const total = await prisma.campaign.count({ where: filter });

        res.json({
            campaigns,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            },
            filters: { status: status || null, title: title || null, startDate: startDate || null, endDate: endDate || null },
            sorting: { sortBy: sortBy || 'createdAt', sortOrder: sortOrder || 'desc' }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get campaign details with optional includes
exports.getCampaignDetails = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { include } = req.query;
        
        const campaign = await validateCampaignAccess(campaignId, req.user.id);
        const includes = include ? include.split(',').map(item => item.trim()) : [];
        
        const campaignData = {
            id: campaign.id,
            title: campaign.title,
            message: campaign.message,
            status: campaign.status,
            interval: campaign.interval,
            isScheduled: campaign.isScheduled,
            scheduledAt: campaign.scheduledAt,
            timezone: campaign.timezone,
            sendType: campaign.sendType,
            isConnected: campaign.isConnected,
            qrCode: campaign.qrCode,
            sessionId: campaign.sessionId,
            lastActivity: campaign.lastActivity,
            startedAt: campaign.startedAt,
            completedAt: campaign.completedAt,
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt
        };

        // Include progress
        if (includes.includes('progress')) {
            campaignData.progress = calculateCampaignStats(campaign.recipients || []);
        }

        // Include recipients
        if (includes.includes('recipients')) {
            const { recipientSortBy = 'id', recipientSortOrder = 'asc' } = req.query;
            campaignData.recipients = await Recipient.findByCampaign(campaignId, recipientSortBy, recipientSortOrder);
        }

        // Include attachments
        if (includes.includes('attachments')) {
            campaignData.attachments = await Attachment.findByCampaign(campaignId);
        }

        // Include report
        if (includes.includes('report')) {
            const stats = calculateCampaignStats(campaign.recipients || []);
            campaignData.report = {
                ...stats,
                startedAt: campaign.startedAt,
                completedAt: campaign.completedAt,
                duration: campaign.completedAt && campaign.startedAt ? 
                    (new Date(campaign.completedAt) - new Date(campaign.startedAt)) : 
                    (campaign.startedAt ? (new Date() - new Date(campaign.startedAt)) : 0),
                isCompleted: campaign.status === 'COMPLETED',
                errors: (campaign.recipients || [])
                    .filter(r => r.status === 'FAILED')
                    .map(r => ({ phone: r.phone, error: r.error, name: r.name }))
            };
        }

        res.json({ campaign: campaignData });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Get campaign recipients
exports.getCampaignRecipients = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { sortBy = 'id', sortOrder = 'asc', status, page = 1, limit = 50 } = req.query;
        
        const campaign = await validateCampaignAccess(campaignId, req.user.id);
        
        let recipients = await Recipient.findByCampaign(campaignId, sortBy, sortOrder);
        
        if (status) {
            recipients = recipients.filter(r => r.status === status);
        }

        // Apply pagination
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedRecipients = recipients.slice(startIndex, endIndex);
        const total = recipients.length;

        res.json({
            recipients: paginatedRecipients,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            sorting: { sortBy, sortOrder },
            filters: { status: status || null }
        });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Generate campaign report
exports.generateReport = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await validateCampaignAccess(campaignId, req.user.id);

        if (!['COMPLETED', 'RUNNING', 'PAUSED'].includes(campaign.status)) {
            return res.status(400).json({ 
                message: "Campaign report is only available for running, paused, or completed campaigns" 
            });
        }

        const stats = calculateCampaignStats(campaign.recipients || []);

        const report = {
            campaignId: campaign.id,
            title: campaign.title,
            status: campaign.status,
            ...stats,
            startedAt: campaign.startedAt,
            completedAt: campaign.completedAt,
            duration: campaign.completedAt && campaign.startedAt ? 
                (new Date(campaign.completedAt) - new Date(campaign.startedAt)) : 
                (campaign.startedAt ? (new Date() - new Date(campaign.startedAt)) : 0),
            isCompleted: campaign.status === 'COMPLETED',
            errors: (campaign.recipients || [])
                .filter(r => r.status === 'FAILED')
                .map(r => ({ phone: r.phone, error: r.error, name: r.name }))
        };

        res.json({
            message: "Report generated successfully",
            report
        });
    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Download campaign report as Excel
exports.downloadReport = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await validateCampaignAccess(campaignId, req.user.id);

        if (!['COMPLETED', 'RUNNING', 'PAUSED'].includes(campaign.status)) {
            return res.status(400).json({ 
                message: "Campaign report is only available for running, paused, or completed campaigns" 
            });
        }

        const wb = xlsx.utils.book_new();
        const stats = calculateCampaignStats(campaign.recipients || []);
        
        // Campaign summary sheet
        const summaryData = [{
            'Campaign ID': campaign.id,
            'Title': campaign.title || 'N/A',
            'Status': campaign.status,
            'Total Messages': stats.totalMessages,
            'Sent': stats.successfulMessages,
            'Failed': stats.failedMessages,
            'Delivered': stats.deliveredMessages,
            'Pending': stats.pendingMessages,
            'Delivery Rate': `${stats.deliveryRate}%`,
            'Started At': campaign.startedAt ? new Date(campaign.startedAt).toLocaleString('fa-IR') : 'N/A',
            'Completed At': campaign.completedAt ? new Date(campaign.completedAt).toLocaleString('fa-IR') : 'N/A',
            'Created At': new Date(campaign.createdAt).toLocaleString('fa-IR')
        }];
        
        const summaryWs = xlsx.utils.json_to_sheet(summaryData);
        xlsx.utils.book_append_sheet(wb, summaryWs, "Campaign Summary");
        
        // Recipients details sheet
        const recipientsData = campaign.recipients.map(recipient => ({
            'Phone': recipient.phone,
            'Name': recipient.name || 'N/A',
            'Status': recipient.status,
            'Sent At': recipient.sentAt ? new Date(recipient.sentAt).toLocaleString('fa-IR') : 'N/A',
            'Error': recipient.error || 'N/A'
        }));
        
        const recipientsWs = xlsx.utils.json_to_sheet(recipientsData);
        xlsx.utils.book_append_sheet(wb, recipientsWs, "Recipients Details");
        
        // Campaign message sheet
        const messageData = [{ 'Campaign Message': campaign.message }];
        const messageWs = xlsx.utils.json_to_sheet(messageData);
        xlsx.utils.book_append_sheet(wb, messageWs, "Campaign Message");
        
        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="campaign-report-${campaignId}-${new Date().toISOString().split('T')[0]}.xlsx"`);
        
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Delete campaign
exports.deleteCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const campaign = await validateCampaignAccess(campaignId, req.user.id);

        if (campaign.status === 'RUNNING') {
            return res.status(400).json({ 
                message: "Cannot delete running campaign" 
            });
        }

        // Delete attachments
        const attachments = await Attachment.findByCampaign(campaignId);
        for (const attachment of attachments) {
            cleanupFile(attachment.path);
            await Attachment.delete(attachment.id);
        }

        await Campaign.delete(campaignId);

        res.json({
            message: "Campaign deleted successfully"
        });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Set campaign interval
exports.setCampaignInterval = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { interval, sendType, scheduledAt, timezone } = req.body;
        
        const validIntervals = ['5s', '10s', '20s'];
        if (interval && !validIntervals.includes(interval)) {
            return res.status(400).json({ 
                message: "Invalid interval. Must be one of: 5s, 10s, 20s" 
            });
        }

        if (sendType && !['immediate', 'scheduled', 'IMMEDIATE', 'SCHEDULED'].includes(sendType)) {
            return res.status(400).json({ 
                message: "Invalid sendType. Must be 'immediate' or 'scheduled'." 
            });
        }

        const campaign = await validateCampaignAccess(campaignId, req.user.id);
        ensureCampaignNotRunning(campaign);

        // Validate scheduled time
        if (sendType === 'scheduled' || sendType === 'SCHEDULED') {
            if (!scheduledAt) {
                return res.status(400).json({ 
                    message: "scheduledAt is required for scheduled campaigns" 
                });
            }

            const scheduledDate = new Date(scheduledAt);
            const now = new Date();
            
            if (scheduledDate <= now) {
                return res.status(400).json({ 
                    message: "Scheduled time must be in the future" 
                });
            }

            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
            
            if (scheduledDate > oneYearFromNow) {
                return res.status(400).json({ 
                    message: "Scheduled time cannot be more than 1 year in the future" 
                });
            }
        }

        const normalizedSendType = sendType?.toUpperCase() || 'IMMEDIATE';
        
        let normalizedInterval = null;
        if (interval) {
            switch (interval.toLowerCase()) {
                case '5s': normalizedInterval = 'FIVE_SECONDS'; break;
                case '10s': normalizedInterval = 'TEN_SECONDS'; break;
                case '20s': normalizedInterval = 'TWENTY_SECONDS'; break;
                default: normalizedInterval = 'TEN_SECONDS';
            }
        }
        
        const updateData = {
            isScheduled: normalizedSendType === 'SCHEDULED',
            scheduledAt: normalizedSendType === 'SCHEDULED' ? new Date(scheduledAt) : null,
            timezone: timezone || 'Asia/Tehran',
            sendType: normalizedSendType
        };
        
        if (normalizedInterval) updateData.interval = normalizedInterval;
        
        await Campaign.update(campaignId, updateData);

        res.json({
            message: "Campaign settings updated successfully",
            campaign: {
                id: campaign.id,
                interval: campaign.interval,
                schedule: {
                    isScheduled: campaign.isScheduled,
                    scheduledAt: campaign.scheduledAt,
                    timezone: campaign.timezone,
                    sendType: campaign.sendType
                }
            }
        });

    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Get subscription info
exports.getSubscriptionInfo = async (req, res) => {
    try {
        if (!req.subscriptionInfo) {
            return res.status(500).json({ message: "Subscription info not available" });
        }

        res.json({
            subscription: req.subscriptionInfo
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Update campaign title
exports.updateCampaignTitle = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { title } = req.body;
        
        if (!title || title.trim().length === 0) {
            return res.status(400).json({ message: "Title is required" });
        }
        
        if (title.trim().length > 100) {
            return res.status(400).json({ message: "Title must be less than 100 characters" });
        }
        
        const campaign = await validateCampaignAccess(campaignId, req.user.id);
        ensureCampaignNotRunning(campaign);
        
        const updatedCampaign = await Campaign.update(campaignId, {
            title: title.trim(),
            updatedAt: new Date()
        });
        
        res.json({
            message: "Campaign title updated successfully",
            campaign: {
                id: updatedCampaign.id,
                title: updatedCampaign.title,
                status: updatedCampaign.status
            }
        });
        
    } catch (err) {
        console.error(err);
        const statusCode = err.statusCode || 500;
        res.status(statusCode).json({ message: err.message || "Server error" });
    }
};

// Export legacy upload for backward compatibility
exports.upload = upload;
exports.tempUpload = tempUpload;
exports.permanentUpload = permanentUpload;
