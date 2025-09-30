const Campaign = require('../models/Campaign');
const User = require('../models/User');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const websocketService = require('../services/websocketService');
const whatsappService = require('../services/whatsappService');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-excel', // .xls
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
            'text/plain',
            'application/zip' // .zip
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type'), false);
        }
    }
});

// Create new campaign
exports.createCampaign = async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                message: "Message is required" 
            });
        }

        const campaign = await Campaign.create({
            user: req.user._id,
            message
        });

        res.status(201).json({
            message: "Campaign created successfully",
            campaign: {
                id: campaign._id,
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
    upload.single('recipientsFile'),
    async (req, res) => {
        try {
            const { campaignId } = req.params;
            
            if (!req.file) {
                return res.status(400).json({ message: "Excel file is required" });
            }

            const campaign = await Campaign.findOne({ 
                _id: campaignId, 
                user: req.user._id 
            });

            if (!campaign) {
                return res.status(404).json({ message: "Campaign not found" });
            }

            // Read Excel file
            const workbook = xlsx.readFile(req.file.path);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(worksheet);

            // Validate Excel file structure
            if (!data || data.length === 0) {
                return res.status(400).json({ 
                    message: "Excel file is empty or has no data" 
                });
            }

            // Check if required columns exist
            const firstRow = data[0];
            const hasPhoneColumn = firstRow.phone || firstRow.Phone || firstRow.PHONE || firstRow['شماره تلفن'];
            const hasNameColumn = firstRow.name || firstRow.Name || firstRow.NAME || firstRow['نام'];
            
            if (!hasPhoneColumn) {
                return res.status(400).json({ 
                    message: "Excel file must contain a 'phone' column (or 'Phone', 'PHONE', 'شماره تلفن')" 
                });
            }

            // Extract phone numbers and names with proper error handling
            const recipients = [];
            const errors = [];
            
            data.forEach((row, index) => {
                try {
                    const phone = row.phone || row.Phone || row.PHONE || row['شماره تلفن'];
                    const name = row.name || row.Name || row.NAME || row['نام'];
                    
                    if (!phone) {
                        errors.push(`Row ${index + 2}: Missing phone number`);
                        return; // Skip this row
                    }

                    // Validate phone number format
                    const cleanPhone = phone.toString().replace(/\D/g, '');
                    if (cleanPhone.length < 10) {
                        errors.push(`Row ${index + 2}: Invalid phone number format`);
                        return; // Skip this row
                    }

                    recipients.push({
                        phone: cleanPhone,
                        name: name ? name.toString() : undefined
                    });
                } catch (error) {
                    errors.push(`Row ${index + 2}: ${error.message}`);
                }
            });

            // Check if we have any valid recipients
            if (recipients.length === 0) {
                return res.status(400).json({ 
                    message: "No valid recipients found in Excel file",
                    errors: errors
                });
            }

            // Log warnings for skipped rows
            if (errors.length > 0) {
                console.warn(`⚠️ Excel upload warnings:`, errors);
            }

            // Check subscription limits
            const user = await User.findById(req.user._id).populate('purchasedPackages');
            const totalRecipients = recipients.length;
            
            // Get user's message limit from their package
            let messageLimit = 0;
            if (user.purchasedPackages && user.purchasedPackages.length > 0) {
                // Assuming each package has a messageLimit field
                messageLimit = user.purchasedPackages.reduce((total, pkg) => {
                    return total + (pkg.messageLimit || 0);
                }, 0);
            }

            if (messageLimit > 0 && totalRecipients > messageLimit) {
                return res.status(400).json({
                    message: `Recipients count (${totalRecipients}) exceeds your subscription limit (${messageLimit})`
                });
            }

            // Update campaign with recipients
            campaign.recipients = recipients;
            campaign.progress.total = recipients.length;
            campaign.status = 'ready';
            await campaign.save();

            // Send WebSocket update
            await websocketService.sendCampaignUpdate(campaign._id, req.user._id);

            // Clean up uploaded file safely
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (error) {
                    console.error('❌ Error deleting uploaded file:', error.message);
                }
            }

            res.json({
                message: "Recipients uploaded successfully",
                recipientsCount: recipients.length,
                warnings: errors.length > 0 ? errors : undefined,
                campaign: {
                    id: campaign._id,
                    status: campaign.status,
                    totalRecipients: campaign.progress.total
                }
            });

        } catch (err) {
            console.error('❌ Excel upload error:', err);
            
            // Clean up uploaded file safely
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (error) {
                    console.error('❌ Error deleting uploaded file:', error.message);
                }
            }
            
            // Handle specific Excel parsing errors
            if (err.message.includes('Cannot read property') || err.message.includes('undefined')) {
                return res.status(400).json({ 
                    message: "Invalid Excel file format. Please check your file structure.",
                    error: "File format error"
                });
            }
            
            res.status(500).json({ 
                message: "Server error while processing Excel file", 
                error: err.message 
            });
        }
    }
];

// Upload attachment
exports.uploadAttachment = [
    upload.single('attachment'),
    async (req, res) => {
        try {
            const { campaignId } = req.params;
            
            if (!req.file) {
                return res.status(400).json({ message: "Attachment file is required" });
            }

            const campaign = await Campaign.findOne({ 
                _id: campaignId, 
                user: req.user._id 
            });

            if (!campaign) {
                return res.status(404).json({ message: "Campaign not found" });
            }

            // Check if campaign is not running
            if (campaign.status === 'running') {
                return res.status(400).json({ 
                    message: "Cannot upload attachment while campaign is running" 
                });
            }

            // Delete old attachment if exists
            if (campaign.attachment && campaign.attachment.path) {
                if (fs.existsSync(campaign.attachment.path)) {
                    try {
                        fs.unlinkSync(campaign.attachment.path);
                    } catch (error) {
                        console.error('❌ Error deleting old attachment file:', error.message);
                    }
                }
            }

            // Update campaign with new attachment info
            campaign.attachment = {
                filename: req.file.filename,
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path
            };

            await campaign.save();

            res.json({
                message: "Attachment uploaded successfully",
                attachment: {
                    filename: campaign.attachment.filename,
                    originalName: campaign.attachment.originalName,
                    size: campaign.attachment.size,
                    mimetype: campaign.attachment.mimetype
                }
            });

        } catch (err) {
            console.error(err);
            if (req.file && req.file.path && fs.existsSync(req.file.path)) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (error) {
                    console.error('❌ Error deleting uploaded file:', error.message);
                }
            }
            res.status(500).json({ message: "Server error", error: err.message });
        }
    }
];

// Delete attachment
exports.deleteAttachment = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Check if campaign is not running
        if (campaign.status === 'running') {
            return res.status(400).json({ 
                message: "Cannot delete attachment while campaign is running" 
            });
        }

        // Delete attachment file if exists
        if (campaign.attachment && campaign.attachment.path) {
            if (fs.existsSync(campaign.attachment.path)) {
                try {
                    fs.unlinkSync(campaign.attachment.path);
                } catch (error) {
                    console.error('❌ Error deleting attachment file:', error.message);
                }
            }
        }

        // Remove attachment from campaign
        campaign.attachment = undefined;
        await campaign.save();

        res.json({
            message: "Attachment deleted successfully"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get attachment details
exports.getAttachmentDetails = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (!campaign.attachment) {
            return res.json({
                hasAttachment: false,
                attachment: null
            });
        }

        res.json({
            hasAttachment: true,
            attachment: {
                filename: campaign.attachment.filename,
                originalName: campaign.attachment.originalName,
                size: campaign.attachment.size,
                mimetype: campaign.attachment.mimetype,
                uploadDate: campaign.updatedAt
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Generate WhatsApp QR code
exports.generateQRCode = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Generate unique session ID
        const sessionId = uuidv4();
        
        // Update campaign with WhatsApp session info
        campaign.whatsappSession = {
            isConnected: false,
            sessionId: sessionId,
            lastActivity: new Date()
        };

        await campaign.save();

        // Initialize WhatsApp session
        await whatsappService.prepareWhatsAppSessions([campaign], req.user._id);

        res.json({
            message: "QR code generation initiated",
            sessionId: sessionId,
            instructions: "WhatsApp session is being prepared. QR code will be sent via WebSocket."
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Check WhatsApp connection status
exports.checkConnection = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        res.json({
            isConnected: campaign.whatsappSession.isConnected,
            lastActivity: campaign.whatsappSession.lastActivity
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Start campaign
exports.startCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.status !== 'ready') {
            return res.status(400).json({ 
                message: "Campaign is not ready to start" 
            });
        }

        if (!campaign.whatsappSession.isConnected) {
            return res.status(400).json({ 
                message: "WhatsApp account is not connected" 
            });
        }

        if (campaign.recipients.length === 0) {
            return res.status(400).json({ 
                message: "No recipients found" 
            });
        }

        // Start WhatsApp campaign
        await whatsappService.handleStartCampaign(campaignId, req.user._id);

        res.json({
            message: "Campaign started successfully",
            campaign: {
                id: campaign._id,
                status: 'running',
                totalRecipients: campaign.progress.total,
                startedAt: new Date()
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get campaign progress
exports.getProgress = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        res.json({
            campaign: {
                id: campaign._id,
                status: campaign.status,
                progress: campaign.progress,
                startedAt: campaign.startedAt,
                completedAt: campaign.completedAt
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Pause campaign
exports.pauseCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.status !== 'running') {
            return res.status(400).json({ 
                message: "Campaign is not running" 
            });
        }

        // Pause campaign
        await whatsappService.handleStopCampaign(campaignId, 'paused', req.user._id);

        res.json({
            message: "Campaign paused successfully",
            campaign: {
                id: campaign._id,
                status: 'paused'
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Resume campaign
exports.resumeCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.status !== 'paused') {
            return res.status(400).json({ 
                message: "Campaign is not paused" 
            });
        }

        // Resume campaign
        await whatsappService.handleStartCampaign(campaignId, req.user._id);

        res.json({
            message: "Campaign resumed successfully",
            campaign: {
                id: campaign._id,
                status: 'running'
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get user's campaigns
exports.getMyCampaigns = async (req, res) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        const filter = { user: req.user._id };
        if (status) {
            filter.status = status;
        }

        const campaigns = await Campaign.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('status progress createdAt startedAt completedAt');

        const total = await Campaign.countDocuments(filter);

        res.json({
            campaigns,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get campaign details
exports.getCampaignDetails = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        res.json({
            campaign: {
                id: campaign._id,
                message: campaign.message,
                status: campaign.status,
                progress: campaign.progress,
                whatsappSession: {
                    isConnected: campaign.whatsappSession.isConnected
                },
                attachment: campaign.attachment ? {
                    originalName: campaign.attachment.originalName,
                    size: campaign.attachment.size,
                    mimetype: campaign.attachment.mimetype
                } : null,
                recipientsCount: campaign.recipients.length,
                createdAt: campaign.createdAt,
                startedAt: campaign.startedAt,
                completedAt: campaign.completedAt
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Generate campaign report
exports.generateReport = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Allow report generation for completed, running, and paused campaigns
        if (!['completed', 'running', 'paused'].includes(campaign.status)) {
            return res.status(400).json({ 
                message: "Campaign report is only available for running, paused, or completed campaigns" 
            });
        }

        // Calculate report data
        const totalMessages = campaign.progress.total;
        const successfulMessages = campaign.progress.sent;
        const failedMessages = campaign.progress.failed;
        const deliveryRate = totalMessages > 0 ? (successfulMessages / totalMessages) * 100 : 0;

        const report = {
            campaignId: campaign._id,
            status: campaign.status,
            totalMessages,
            successfulMessages,
            failedMessages,
            remainingMessages: totalMessages - successfulMessages - failedMessages,
            deliveryRate: Math.round(deliveryRate * 100) / 100,
            startedAt: campaign.startedAt,
            completedAt: campaign.completedAt,
            duration: campaign.completedAt ? 
                (campaign.completedAt - campaign.startedAt) : 
                (new Date() - campaign.startedAt),
            isCompleted: campaign.status === 'completed',
            errors: campaign.recipients
                .filter(r => r.status === 'failed')
                .map(r => ({ phone: r.phone, error: r.error }))
        };

        res.json({
            message: "Report generated successfully",
            report
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Download campaign report as Excel
exports.downloadReport = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Allow report download for completed, running, and paused campaigns
        if (!['completed', 'running', 'paused'].includes(campaign.status)) {
            return res.status(400).json({ 
                message: "Campaign report is only available for running, paused, or completed campaigns" 
            });
        }

        // Generate Excel report
        const xlsx = require('xlsx');
        const wb = xlsx.utils.book_new();
        
        // Campaign summary sheet
        const summaryData = [{
            'Campaign ID': campaign._id,
            'Status': campaign.status,
            'Total Messages': campaign.progress.total,
            'Sent': campaign.progress.sent,
            'Failed': campaign.progress.failed,
            'Remaining': campaign.progress.total - campaign.progress.sent - campaign.progress.failed,
            'Delivery Rate': `${Math.round((campaign.progress.sent / campaign.progress.total) * 100)}%`,
            'Started At': campaign.startedAt,
            'Completed At': campaign.completedAt || 'N/A'
        }];
        
        const summaryWs = xlsx.utils.json_to_sheet(summaryData);
        xlsx.utils.book_append_sheet(wb, summaryWs, "Campaign Summary");
        
        // Recipients details sheet
        const recipientsData = campaign.recipients.map(recipient => ({
            'Phone': recipient.phone,
            'Name': recipient.name || 'N/A',
            'Status': recipient.status,
            'Sent At': recipient.sentAt || 'N/A',
            'Error': recipient.error || 'N/A'
        }));
        
        const recipientsWs = xlsx.utils.json_to_sheet(recipientsData);
        xlsx.utils.book_append_sheet(wb, recipientsWs, "Recipients Details");
        
        // Set response headers for Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="campaign-report-${campaignId}.xlsx"`);
        
        // Write Excel file to response
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Pause campaign
exports.pauseCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.status !== 'running') {
            return res.status(400).json({ 
                message: "Campaign is not running" 
            });
        }

        campaign.status = 'paused';
        await campaign.save();

        res.json({
            message: "Campaign paused successfully",
            campaign: {
                id: campaign._id,
                status: campaign.status
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Resume campaign
exports.resumeCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.status !== 'paused') {
            return res.status(400).json({ 
                message: "Campaign is not paused" 
            });
        }

        campaign.status = 'running';
        await campaign.save();

        res.json({
            message: "Campaign resumed successfully",
            campaign: {
                id: campaign._id,
                status: campaign.status
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Delete campaign
exports.deleteCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.status === 'running') {
            return res.status(400).json({ 
                message: "Cannot delete running campaign" 
            });
        }

        // Delete attachment file if exists
        if (campaign.attachment && campaign.attachment.path) {
            if (fs.existsSync(campaign.attachment.path)) {
                fs.unlinkSync(campaign.attachment.path);
            }
        }

        await Campaign.findByIdAndDelete(campaignId);

        res.json({
            message: "Campaign deleted successfully"
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Set campaign interval
exports.setCampaignInterval = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { interval } = req.body;
        
        // Validate interval
        const validIntervals = ['5s', '10s', '20s'];
        if (!validIntervals.includes(interval)) {
            return res.status(400).json({ 
                message: "Invalid interval. Must be one of: 5s, 10s, 20s" 
            });
        }

        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Update campaign with interval
        campaign.interval = interval;
        await campaign.save();

        res.json({
            message: "Campaign interval updated successfully",
            campaign: {
                id: campaign._id,
                interval: campaign.interval,
                status: campaign.status
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get campaign step status
exports.getCampaignStepStatus = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Determine current step based on campaign data
        let currentStep = 1;
        let stepStatus = {
            step1: { completed: true, title: "تعریف کمپین و متن پیام" },
            step2: { completed: false, title: "دانلود فایل نمونه اکسل" },
            step3: { completed: false, title: "آپلود فایل اکسل" },
            step4: { completed: false, title: "افزودن فایل ضمیمه" },
            step5: { completed: false, title: "تنظیمات وقفه ارسال" },
            step6: { completed: false, title: "اتصال حساب WhatsApp" },
            step7: { completed: false, title: "ارسال پیام‌ها" },
            step8: { completed: false, title: "گزارش نهایی" }
        };

        // Step 2: Excel template downloaded (always available)
        stepStatus.step2.completed = true;
        currentStep = 2;

        // Step 3: Recipients uploaded
        if (campaign.recipients && campaign.recipients.length > 0) {
            stepStatus.step3.completed = true;
            currentStep = 3;
        }

        // Step 4: Attachment uploaded
        if (campaign.attachment && campaign.attachment.filename) {
            stepStatus.step4.completed = true;
            currentStep = 4;
        }

        // Step 5: Interval set
        if (campaign.interval) {
            stepStatus.step5.completed = true;
            currentStep = 5;
        }

        // Step 6: WhatsApp connected
        if (campaign.whatsappSession && campaign.whatsappSession.isConnected) {
            stepStatus.step6.completed = true;
            currentStep = 6;
        }

        // Step 7: Campaign running
        if (campaign.status === 'running') {
            stepStatus.step7.completed = true;
            currentStep = 7;
        }

        // Step 8: Campaign completed
        if (campaign.status === 'completed') {
            stepStatus.step8.completed = true;
            currentStep = 8;
        }

        res.json({
            campaign: {
                id: campaign._id,
                status: campaign.status,
                currentStep: currentStep,
                stepStatus: stepStatus,
                progress: campaign.progress,
                message: campaign.message,
                interval: campaign.interval,
                recipientsCount: campaign.recipients ? campaign.recipients.length : 0,
                hasAttachment: !!(campaign.attachment && campaign.attachment.filename),
                whatsappConnected: !!(campaign.whatsappSession && campaign.whatsappSession.isConnected)
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get subscription info
exports.getSubscriptionInfo = async (req, res) => {
    try {
        // This middleware should be called before this controller
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
