const { Campaign, User, Recipient, Attachment } = require('../models');
const prisma = require('../config/prisma');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const websocketService = require('../services/websocketService');
const whatsappService = require('../services/whatsappService');
const { asyncHandler } = require('../middlewares/errorHandler');
const { BadRequestError, ValidationError } = require('../utils/errors');
const { verifyCampaignAccess, verifyCampaignNotRunning, verifyCampaignReady, verifyCampaignHasRecipients } = require('../utils/campaignHelpers');
const { cleanupUploadedFile, safeDeleteFile } = require('../utils/fileHelpers');

// Configure multer for temporary file uploads
const tempStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tempDir = 'uploads/temp/';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'temp-' + file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure multer for permanent file uploads
const permanentStorage = multer.diskStorage({
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

// Temporary file uploader
const tempUpload = multer({ 
    storage: tempStorage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    },
    fileFilter: (req, file, cb) => {
        // فقط فرمت‌های خطرناک را مسدود می‌کنیم
        const dangerousMimes = [
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
        
        // بررسی فرمت‌های خطرناک
        if (dangerousMimes.includes(file.mimetype)) {
            cb(new Error('File type not allowed for security reasons'), false);
        } else {
            cb(null, true);
        }
    }
});

// Permanent file uploader
const permanentUpload = multer({ 
    storage: permanentStorage,
    limits: {
        fileSize: 20 * 1024 * 1024 // 20MB limit
    },
    fileFilter: (req, file, cb) => {
        // فقط فرمت‌های خطرناک را مسدود می‌کنیم
        const dangerousMimes = [
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
        
        // بررسی فرمت‌های خطرناک
        if (dangerousMimes.includes(file.mimetype)) {
            cb(new Error('File type not allowed for security reasons'), false);
        } else {
            cb(null, true);
        }
    }
});

// Legacy upload for backward compatibility
const upload = permanentUpload;

// Create new campaign
exports.createCampaign = asyncHandler(async (req, res) => {
    const { message, title } = req.body;
    
    if (!message) {
        throw new BadRequestError('Message is required');
    }

    if (!title || !title.trim()) {
        throw new BadRequestError('Title is required');
    }

    const campaign = await Campaign.create({
        userId: req.user.id,
        message,
        title: title.trim()
    });

    res.status(201).json({
        success: true,
        message: "Campaign created successfully",
        campaign: {
            id: campaign.id,
            title: campaign.title,
            status: campaign.status
        }
    });
});

// Upload recipients from Excel file
exports.uploadRecipients = [
    tempUpload.single('recipientsFile'),
    asyncHandler(async (req, res) => {
        const { campaignId } = req.params;
        
        if (!req.file) {
            throw new BadRequestError('Excel file is required');
        }

        const campaign = await verifyCampaignAccess(campaignId, req.user.id);

        // Read Excel file
        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(worksheet);

        // Validate Excel file structure
        if (!data || data.length === 0) {
            cleanupUploadedFile(req);
            throw new BadRequestError('Excel file is empty or has no data');
        }

        // Check if required columns exist
        const firstRow = data[0];
        const hasPhoneColumn = firstRow.phone || firstRow.Phone || firstRow.PHONE || firstRow['شماره تلفن'];
        
        if (!hasPhoneColumn) {
            cleanupUploadedFile(req);
            throw new BadRequestError("Excel file must contain a 'phone' column (or 'Phone', 'PHONE', 'شماره تلفن')");
        }

        // Extract phone numbers and names
        const recipients = [];
        const errors = [];
        
        data.forEach((row, index) => {
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
        });

        if (recipients.length === 0) {
            cleanupUploadedFile(req);
            throw new ValidationError('No valid recipients found in Excel file', errors);
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
            cleanupUploadedFile(req);
            throw new BadRequestError(`Recipients count (${totalRecipients}) exceeds your subscription limit (${messageLimit})`);
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
        cleanupUploadedFile(req);

        res.json({
            success: true,
            message: "Recipients uploaded successfully",
            recipientsCount: recipients.length,
            warnings: errors.length > 0 ? errors : undefined,
            campaign: {
                id: campaignId,
                status: 'READY',
                totalRecipients: recipients.length
            }
        });
    })
];

// Upload temporary attachment
exports.uploadTempAttachment = [
    tempUpload.single('attachment'),
    asyncHandler(async (req, res) => {
        if (!req.file) {
            throw new BadRequestError('Attachment file is required');
        }

        res.json({
            success: true,
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
    })
];

// Upload permanent attachment
exports.uploadAttachment = [
    permanentUpload.single('attachment'),
    asyncHandler(async (req, res) => {
        const { campaignId } = req.params;
        
        if (!req.file) {
            throw new BadRequestError('Attachment file is required');
        }

        const campaign = await verifyCampaignAccess(campaignId, req.user.id);
        verifyCampaignNotRunning(campaign);

        // Delete old attachments
        const existingAttachments = await Attachment.findByCampaign(campaignId);
        for (const attachment of existingAttachments) {
            safeDeleteFile(attachment.path);
            await Attachment.delete(attachment.id);
        }

        // Create new attachment
        const attachmentData = {
            campaignId: parseInt(campaignId),
            filename: req.file.filename,
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        };
        
        await Attachment.create(attachmentData);

        res.json({
            success: true,
            message: "Attachment uploaded successfully",
            attachment: {
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype
            },
            campaign: {
                id: campaignId,
                status: 'READY'
            }
        });
    })
];

// Delete attachment
exports.deleteAttachment = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    
    const campaign = await verifyCampaignAccess(campaignId, req.user.id);
    verifyCampaignNotRunning(campaign);

    // Get attachments
    const attachments = await Attachment.findByCampaign(campaignId);
    
    // Delete attachment files
    attachments.forEach(attachment => {
        safeDeleteFile(attachment.path);
    });

    // Delete all attachments from database
    await prisma.attachment.deleteMany({
        where: { campaignId: parseInt(campaignId) }
    });

    res.json({
        success: true,
        message: "Attachment deleted successfully",
        campaign: {
            id: campaignId,
            attachments: [],
            status: campaign.status
        }
    });
});

// Get attachment details
exports.getAttachmentDetails = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    
    const campaign = await verifyCampaignAccess(campaignId, req.user.id);

    const attachments = await Attachment.findByCampaign(campaignId);
    const attachment = attachments[0] || null;

    if (!attachment) {
        return res.json({
            success: true,
            hasAttachment: false,
            attachment: null
        });
    }

    res.json({
        success: true,
        hasAttachment: true,
        attachment: {
            filename: attachment.filename,
            originalName: attachment.originalName,
            size: attachment.size,
            mimetype: attachment.mimetype,
            uploadDate: attachment.createdAt
        }
    });
});

// Confirm attachment and move from temp to permanent
exports.confirmAttachment = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const { tempFilename } = req.body;
    
    if (!tempFilename) {
        throw new BadRequestError('Temporary filename is required');
    }

    const campaign = await verifyCampaignAccess(campaignId, req.user.id);
    verifyCampaignNotRunning(campaign);

    const tempPath = path.join('uploads/temp', tempFilename);
    
    if (!fs.existsSync(tempPath)) {
        throw new NotFoundError('Temporary file not found');
    }

    // Generate permanent filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(tempFilename);
    const permanentFilename = `attachment-${uniqueSuffix}${fileExtension}`;
    const permanentPath = path.join('uploads', permanentFilename);

    // Move file from temp to permanent location
    fs.renameSync(tempPath, permanentPath);

    // Get file stats
    const stats = fs.statSync(permanentPath);

    // Delete old attachments
    const existingAttachments = await Attachment.findByCampaign(campaignId);
    existingAttachments.forEach(attachment => {
        safeDeleteFile(attachment.path);
    });
    await prisma.attachment.deleteMany({
        where: { campaignId: parseInt(campaignId) }
    });

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
        success: true,
        message: "Attachment confirmed and saved successfully",
        attachment: {
            filename: permanentFilename,
            originalName: req.body.originalName || tempFilename,
            size: stats.size,
            mimetype: req.body.mimetype || 'application/octet-stream'
        },
        campaign: {
            id: campaignId,
            status: 'READY'
        }
    });
});

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
                try {
                    fs.unlinkSync(filePath);
                    cleanedCount++;
                } catch (error) {
                    console.error(`❌ Error deleting temp file ${file}:`, error.message);
                }
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

// Get campaign preview for wizard step 6
exports.getCampaignPreview = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findById(campaignId);
        
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.userId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Check if campaign is ready for preview
        if (campaign.status !== 'READY') {
            return res.status(400).json({ 
                message: "Campaign is not ready for preview. Please complete all previous steps." 
            });
        }

        // Get attachments
        const attachments = await Attachment.findByCampaign(campaignId);
        const attachment = attachments[0] || null;

        // Prepare recipients cards for preview
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

        // Campaign summary
        const campaignSummary = {
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
        };

        res.json({
            message: "Campaign preview retrieved successfully",
            campaign: campaignSummary,
            recipients: recipientCards,
            preview: {
                totalCards: recipientCards.length,
                sampleCards: recipientCards.slice(0, 5), // نمایش 5 کارت نمونه
                hasMore: recipientCards.length > 5
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get campaign step status for navigation
exports.getCampaignStepStatus = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findById(campaignId);
        
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.userId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Determine which steps are completed
        const steps = {
            step1: {
                name: "تعریف کمپین و متن پیام",
                completed: !!campaign.message,
                canNavigate: true
            },
            step2: {
                name: "آپلود فایل Excel مخاطبین",
                completed: campaign.recipients && campaign.recipients.length > 0,
                canNavigate: !!campaign.message
            },
            step3: {
                name: "آپلود فایل ضمیمه (اختیاری)",
                completed: campaign.attachments && campaign.attachments.length > 0,
                canNavigate: campaign.recipients && campaign.recipients.length > 0,
                optional: true
            },
            step4: {
                name: "تنظیم فاصله ارسال",
                completed: !!campaign.interval,
                canNavigate: campaign.recipients && campaign.recipients.length > 0
            },
            step5: {
                name: "اتصال WhatsApp",
                completed: campaign.whatsappSession?.isConnected || false,
                canNavigate: !!campaign.interval
            },
            step6: {
                name: "پیش‌نمایش و تایید",
                completed: false, // Only completed when campaign starts
                canNavigate: campaign.whatsappSession?.isConnected || false
            }
        };

        // Calculate current step
        let currentStep = 1;
        if (steps.step1.completed) currentStep = 2;
        if (steps.step2.completed) currentStep = 3;
        if (steps.step3.completed || steps.step3.canNavigate) currentStep = 4;
        if (steps.step4.completed) currentStep = 5;
        if (steps.step5.completed) currentStep = 6;

        res.json({
            message: "Campaign step status retrieved successfully",
            campaign: {
                id: campaign.id,
                status: campaign.status,
                currentStep,
                totalSteps: 6
            },
            steps,
            navigation: {
                canGoBack: currentStep > 1,
                canGoForward: currentStep < 6 && steps[`step${currentStep}`]?.completed,
                availableSteps: Object.keys(steps).filter(step => 
                    steps[step].canNavigate
                )
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Navigate to specific step
exports.navigateToStep = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { step } = req.body;
        
        const campaign = await Campaign.findById(campaignId);
        
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.userId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Validate step number
        if (step < 1 || step > 6) {
            return res.status(400).json({ 
                message: "Invalid step number. Must be between 1 and 6." 
            });
        }

        // Check if user can navigate to this step
        const stepStatus = await exports.getCampaignStepStatus(req, res);
        if (stepStatus.status !== 200) {
            return stepStatus;
        }

        const stepData = stepStatus.json;
        const targetStep = `step${step}`;
        
        if (!stepData?.steps?.[targetStep]?.canNavigate) {
            return res.status(400).json({ 
                message: `Cannot navigate to step ${step}. Please complete previous steps first.` 
            });
        }

        // Return step data for navigation
        res.json({
            message: `Navigating to step ${step}`,
            step: {
                number: step,
                name: stepData?.steps?.[targetStep]?.name || `Step ${step}`,
                completed: stepData?.steps?.[targetStep]?.completed || false,
                optional: stepData?.steps?.[targetStep]?.optional || false
            },
            campaign: {
                id: campaign.id,
                status: campaign.status,
                message: campaign.message,
                recipients: campaign.recipients?.length || 0,
                attachments: campaign.attachments || [],
                interval: campaign.interval,
                whatsappConnected: campaign.whatsappSession?.isConnected || false
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Go back to previous step
exports.goBackStep = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findById(campaignId);
        
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.userId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Get current step status
        const stepStatus = await exports.getCampaignStepStatus(req, res);
        if (stepStatus.status !== 200) {
            return stepStatus;
        }

        const stepData = stepStatus.json;
        const currentStep = stepData?.campaign?.currentStep || 1;

        if (currentStep <= 1) {
            return res.status(400).json({ 
                message: "Cannot go back. You are already at the first step." 
            });
        }

        const previousStep = currentStep - 1;
        
        res.json({
            message: `Going back to step ${previousStep}`,
            step: {
                number: previousStep,
                name: stepData.steps[`step${previousStep}`].name,
                completed: stepData.steps[`step${previousStep}`].completed
            },
            campaign: {
                id: campaign.id,
                status: campaign.status
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Reset campaign to specific step (clear data from that step onwards)
exports.resetToStep = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { step } = req.body;
        
        const campaign = await Campaign.findById(campaignId);
        
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.userId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Validate step number
        if (step < 1 || step > 6) {
            return res.status(400).json({ 
                message: "Invalid step number. Must be between 1 and 6." 
            });
        }

        // Reset data based on step
        switch (step) {
            case 1:
                // Reset everything - delete attachments
                await prisma.attachment.deleteMany({
                    where: { campaignId: parseInt(campaignId) }
                });
                await Campaign.update(campaignId, {
                    message: null,
                    interval: 'TEN_SECONDS',
                    isConnected: false,
                    status: 'DRAFT'
                });
                break;
            case 2:
                // Reset from step 2 onwards
                await Campaign.update(campaignId, {
                    interval: 'TEN_SECONDS',
                    isConnected: false,
                    status: 'DRAFT'
                });
                break;
            case 3:
                // Reset from step 3 onwards - delete attachments
                await prisma.attachment.deleteMany({
                    where: { campaignId: parseInt(campaignId) }
                });
                await Campaign.update(campaignId, {
                    interval: 'TEN_SECONDS',
                    isConnected: false,
                    status: 'READY'
                });
                break;
            case 4:
                // Reset from step 4 onwards
                await Campaign.update(campaignId, {
                    interval: 'TEN_SECONDS',
                    isConnected: false,
                    status: 'READY'
                });
                break;
            case 5:
                // Reset from step 5 onwards
                await Campaign.update(campaignId, {
                    isConnected: false,
                    status: 'READY'
                });
                break;
            case 6:
                // Just reset status
                await Campaign.update(campaignId, {
                    status: 'READY'
                });
                break;
        }

        const updatedCampaign = await Campaign.findById(campaignId);
        const campaignAttachments = await Attachment.findByCampaign(campaignId);

        res.json({
            success: true,
            message: `Campaign reset to step ${step}`,
            campaign: {
                id: updatedCampaign.id,
                status: updatedCampaign.status,
                message: updatedCampaign.message,
                recipients: updatedCampaign.recipients?.length || 0,
                attachments: campaignAttachments,
                interval: updatedCampaign.interval,
                whatsappConnected: updatedCampaign.isConnected || false
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
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
        
        const campaign = await Campaign.findById(campaignId);
        
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.userId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (!campaign.isScheduled) {
            return res.status(400).json({ 
                message: "Campaign is not scheduled" 
            });
        }

        // Reset schedule
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
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Generate WhatsApp QR code
exports.generateQRCode = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    
    const campaign = await verifyCampaignAccess(campaignId, req.user.id);

    // Clean up any existing session for this campaign first
    whatsappService.cleanupSession(campaignId);

    // Generate unique session ID
    const sessionId = uuidv4();

    // Update campaign with sessionId in database
    await Campaign.update(campaignId, {
        sessionId: sessionId,
        status: 'READY',
        isConnected: false
    });

    // Initialize WhatsApp session with timeout
    await whatsappService.prepareWhatsAppSessions([campaign], req.user.id);

    res.json({
        success: true,
        message: "QR code generation initiated",
        sessionId: sessionId,
        instructions: "WhatsApp session is being prepared. QR code will be sent via WebSocket."
    });
});

// Check WhatsApp connection status
exports.checkConnection = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    
    const campaign = await verifyCampaignAccess(campaignId, req.user.id);

    // Check if there's an active session in memory
    const hasActiveSession = whatsappService.hasActiveSession(campaignId);
    
    // Get sessionId from database first, then from memory if exists
    let sessionId = campaign.sessionId;
    
    // If no sessionId in DB but has active session, get it from memory
    if (!sessionId && hasActiveSession) {
        sessionId = whatsappService.getSessionId(campaignId);
    }

    res.json({
        success: true,
        isConnected: campaign.isConnected || false,
        lastActivity: campaign.lastActivity || null,
        hasActiveSession: hasActiveSession,
        sessionId: sessionId
    });
});

// Force cleanup WhatsApp session
exports.forceCleanupSession = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    
    const campaign = await verifyCampaignAccess(campaignId, req.user.id);

    // Force cleanup session
    whatsappService.cleanupSession(campaignId);

    // Reset campaign WhatsApp session in database
    await Campaign.update(campaignId, {
        sessionId: null,
        isConnected: false,
        status: 'READY',
        lastActivity: null
    });

    res.json({
        success: true,
        message: "Session cleaned up successfully",
        campaignId: campaignId
    });
});

// Start campaign
exports.startCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    
    const campaign = await verifyCampaignAccess(campaignId, req.user.id);
    verifyCampaignReady(campaign);
    verifyCampaignHasRecipients(campaign);

    await whatsappService.handleStartCampaign(campaignId, req.user.id);

    res.json({
        success: true,
        message: "Campaign started successfully",
        campaign: {
            id: campaign.id,
            status: 'RUNNING',
            totalRecipients: campaign.totalRecipients,
            startedAt: new Date()
        }
    });
});

// Pause campaign
exports.pauseCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    
    const campaign = await verifyCampaignAccess(campaignId, req.user.id);
    
    if (campaign.status !== 'RUNNING') {
        throw new BadRequestError('Campaign is not running');
    }

    await whatsappService.handleStopCampaign(campaignId, 'PAUSED', req.user.id);

    res.json({
        success: true,
        message: "Campaign paused successfully",
        campaign: {
            id: campaign.id,
            status: 'PAUSED'
        }
    });
});

// Resume campaign
exports.resumeCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    
    const campaign = await verifyCampaignAccess(campaignId, req.user.id);
    
    if (campaign.status !== 'PAUSED') {
        throw new BadRequestError('Campaign is not paused');
    }

    await whatsappService.handleStartCampaign(campaignId, req.user.id);

    res.json({
        success: true,
        message: "Campaign resumed successfully",
        campaign: {
            id: campaign.id,
            status: 'RUNNING'
        }
    });
});

// Get user's campaigns
exports.getMyCampaigns = asyncHandler(async (req, res) => {
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
    
    // Filter by status
    if (status) {
        if (Array.isArray(status)) {
            filter.status = { in: status.map(s => s.trim()) };
        } else {
            filter.status = status.trim();
        }
    }
    
    // Filter by title
    if (title) {
        const titleStr = String(title);
        filter.title = { contains: titleStr };
    }
    
    // Filter by date range
    if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) {
            filter.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
            filter.createdAt.lte = new Date(endDate);
        }
    }

    // Sort options
    const sortOptions = {
        'createdAt': { createdAt: sortOrder === 'desc' ? 'desc' : 'asc' },
        'updatedAt': { updatedAt: sortOrder === 'desc' ? 'desc' : 'asc' },
        'title': { title: sortOrder === 'desc' ? 'desc' : 'asc' },
        'status': { status: sortOrder === 'desc' ? 'desc' : 'asc' },
        'totalRecipients': { totalRecipients: sortOrder === 'desc' ? 'desc' : 'asc' },
        'sentCount': { sentCount: sortOrder === 'desc' ? 'desc' : 'asc' }
    };

    const orderBy = sortOptions[sortBy] || sortOptions['createdAt'];

    const pagination = { 
        page: parseInt(page) || 1, 
        limit: parseInt(limit) || 10 
    };
    const campaigns = await Campaign.findAll(filter, pagination, orderBy);
    
    // Get total count for pagination
    const total = await prisma.campaign.count({ where: filter });

    res.json({
        success: true,
        campaigns,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        },
        filters: {
            status: status || null,
            title: title || null,
            startDate: startDate || null,
            endDate: endDate || null
        },
        sorting: {
            sortBy: sortBy || 'createdAt',
            sortOrder: sortOrder || 'desc'
        }
    });
});

// Search campaigns with advanced filters
exports.searchCampaigns = asyncHandler(async (req, res) => {
        const { 
            query,
            status, 
            title, 
            startDate, 
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1, 
            limit = 10 
        } = req.query;
        
        const filter = { user: req.user.id };
        
        // General search query (searches in title and message)
        if (query) {
            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
                { message: { $regex: query, $options: 'i' } }
            ];
        }
        
        // Filter by status
        if (status) {
            if (Array.isArray(status)) {
                filter.status = { in: status.map(s => s.trim()) };
            } else {
                filter.status = status.trim();
            }
        }
        
        // Filter by title (case-insensitive search)
        if (title) {
            // تبدیل به string برای جلوگیری از کرش
            const titleStr = String(title);
            filter.title = { contains: titleStr };
        }
        
        // Filter by date range
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        // Sort configuration
        const sortConfig = {};
        sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const pagination = { page, limit };
        const campaigns = await Campaign.findAll(filter, pagination);
        
        // Get total count for pagination
        const total = await prisma.campaign.count({ where: filter });

    res.json({
        success: true,
        campaigns,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        },
        filters: {
            query: query || null,
            status: status || null,
            title: title || null,
            startDate: startDate || null,
            endDate: endDate || null,
            sortBy,
            sortOrder
        }
    });
});

// Get campaign details with optional includes
exports.getCampaignDetails = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { include } = req.query;
        
        const campaign = await Campaign.findById(campaignId);
        
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Check if user owns this campaign
        if (campaign.userId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Parse include parameter
        const includes = include ? include.split(',').map(item => item.trim()) : [];
        
        // Base campaign data
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

        // Include progress if requested
        if (includes.includes('progress')) {
            const recipients = campaign.recipients || [];
            const totalMessages = recipients.length;
            const successfulMessages = recipients.filter(r => r.status === 'SENT' || r.status === 'DELIVERED').length;
            const failedMessages = recipients.filter(r => r.status === 'FAILED').length;
            const deliveredMessages = recipients.filter(r => r.status === 'DELIVERED').length;
            const pendingMessages = recipients.filter(r => r.status === 'PENDING').length;
            
            campaignData.progress = {
                total: totalMessages,
                sent: successfulMessages,
                failed: failedMessages,
                delivered: deliveredMessages,
                pending: pendingMessages,
                remaining: pendingMessages,
                deliveryRate: totalMessages > 0 ? 
                    Math.round((successfulMessages / totalMessages) * 100) : 0
            };
        }

        // Include recipients if requested
        if (includes.includes('recipients')) {
            const { recipientSortBy = 'id', recipientSortOrder = 'asc' } = req.query;
            campaignData.recipients = await Recipient.findByCampaign(campaignId, recipientSortBy, recipientSortOrder);
        }

        // Include attachments if requested
        if (includes.includes('attachments')) {
            campaignData.attachments = await Attachment.findByCampaign(campaignId);
        }

        // Include report if requested
        if (includes.includes('report')) {
            const recipients = campaign.recipients || [];
            const totalMessages = recipients.length;
            const successfulMessages = recipients.filter(r => r.status === 'SENT' || r.status === 'DELIVERED').length;
            const failedMessages = recipients.filter(r => r.status === 'FAILED').length;
            const deliveredMessages = recipients.filter(r => r.status === 'DELIVERED').length;
            const pendingMessages = recipients.filter(r => r.status === 'PENDING').length;
            const deliveryRate = totalMessages > 0 ? (successfulMessages / totalMessages) * 100 : 0;

            campaignData.report = {
                totalMessages,
                successfulMessages,
                failedMessages,
                deliveredMessages,
                pendingMessages,
                remainingMessages: pendingMessages,
                deliveryRate: Math.round(deliveryRate * 100) / 100,
                startedAt: campaign.startedAt,
                completedAt: campaign.completedAt,
                duration: campaign.completedAt && campaign.startedAt ? 
                    (new Date(campaign.completedAt) - new Date(campaign.startedAt)) : 
                    (campaign.startedAt ? (new Date() - new Date(campaign.startedAt)) : 0),
                isCompleted: campaign.status === 'COMPLETED',
                errors: recipients
                    .filter(r => r.status === 'FAILED')
                    .map(r => ({ phone: r.phone, error: r.error, name: r.name }))
            };
        }

        res.json({
            campaign: campaignData
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Get campaign recipients with sorting
exports.getCampaignRecipients = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { 
            sortBy = 'id', 
            sortOrder = 'asc',
            status,
            page = 1,
            limit = 50
        } = req.query;
        
        const campaign = await Campaign.findById(campaignId);
        
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Check if user owns this campaign
        if (campaign.userId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Build filter for recipients
        const filter = { campaignId: parseInt(campaignId) };
        if (status) {
            filter.status = status;
        }

        // Get recipients with sorting
        const recipients = await Recipient.findByCampaign(campaignId, sortBy, sortOrder);
        
        // Apply status filter if provided
        let filteredRecipients = recipients;
        if (status) {
            filteredRecipients = recipients.filter(r => r.status === status);
        }

        // Apply pagination
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedRecipients = filteredRecipients.slice(startIndex, endIndex);

        // Get total count
        const total = filteredRecipients.length;

        res.json({
            recipients: paginatedRecipients,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            },
            sorting: {
                sortBy: sortBy || 'id',
                sortOrder: sortOrder || 'asc'
            },
            filters: {
                status: status || null
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
        
        const campaign = await Campaign.findById(campaignId);
        
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Check if user owns this campaign
        if (campaign.userId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Allow report generation for completed, running, and paused campaigns
        if (!['COMPLETED', 'RUNNING', 'PAUSED'].includes(campaign.status)) {
            return res.status(400).json({ 
                message: "Campaign report is only available for running, paused, or completed campaigns" 
            });
        }

        // Calculate report data from actual recipients (more accurate than campaign counters)
        const recipients = campaign.recipients || [];
        const totalMessages = recipients.length;
        const successfulMessages = recipients.filter(r => r.status === 'SENT' || r.status === 'DELIVERED').length;
        const failedMessages = recipients.filter(r => r.status === 'FAILED').length;
        const deliveredMessages = recipients.filter(r => r.status === 'DELIVERED').length;
        const pendingMessages = recipients.filter(r => r.status === 'PENDING').length;
        const deliveryRate = totalMessages > 0 ? (successfulMessages / totalMessages) * 100 : 0;

        const report = {
            campaignId: campaign.id,
            title: campaign.title,
            status: campaign.status,
            totalMessages,
            successfulMessages,
            failedMessages,
            deliveredMessages,
            pendingMessages,
            remainingMessages: pendingMessages,
            deliveryRate: Math.round(deliveryRate * 100) / 100,
            startedAt: campaign.startedAt,
            completedAt: campaign.completedAt,
            duration: campaign.completedAt && campaign.startedAt ? 
                (new Date(campaign.completedAt) - new Date(campaign.startedAt)) : 
                (campaign.startedAt ? (new Date() - new Date(campaign.startedAt)) : 0),
            isCompleted: campaign.status === 'COMPLETED',
            errors: recipients
                .filter(r => r.status === 'FAILED')
                .map(r => ({ phone: r.phone, error: r.error, name: r.name }))
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
        
        const campaign = await Campaign.findById(campaignId);
        
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Check if user owns this campaign
        if (campaign.userId !== req.user.id) {
            return res.status(403).json({ message: "Access denied" });
        }

        // Allow report download for completed, running, and paused campaigns
        if (!['COMPLETED', 'RUNNING', 'PAUSED'].includes(campaign.status)) {
            return res.status(400).json({ 
                message: "Campaign report is only available for running, paused, or completed campaigns" 
            });
        }

        // Generate Excel report
        const xlsx = require('xlsx');
        const wb = xlsx.utils.book_new();
        
        // Calculate accurate stats from recipients
        const recipients = campaign.recipients || [];
        const totalMessages = recipients.length;
        const successfulMessages = recipients.filter(r => r.status === 'SENT' || r.status === 'DELIVERED').length;
        const failedMessages = recipients.filter(r => r.status === 'FAILED').length;
        const deliveredMessages = recipients.filter(r => r.status === 'DELIVERED').length;
        const pendingMessages = recipients.filter(r => r.status === 'PENDING').length;
        const deliveryRate = totalMessages > 0 ? Math.round((successfulMessages / totalMessages) * 100) : 0;
        
        // Campaign summary sheet
        const summaryData = [{
            'Campaign ID': campaign.id,
            'Title': campaign.title || 'N/A',
            'Status': campaign.status,
            'Total Messages': totalMessages,
            'Sent': successfulMessages,
            'Failed': failedMessages,
            'Delivered': deliveredMessages,
            'Pending': pendingMessages,
            'Delivery Rate': `${deliveryRate}%`,
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
        const messageData = [{
            'Campaign Message': campaign.message
        }];
        
        const messageWs = xlsx.utils.json_to_sheet(messageData);
        xlsx.utils.book_append_sheet(wb, messageWs, "Campaign Message");
        
        // Set response headers for Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="campaign-report-${campaignId}-${new Date().toISOString().split('T')[0]}.xlsx"`);
        
        // Write Excel file to response
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Download multiple campaigns report as Excel
exports.downloadMultipleReports = async (req, res) => {
    try {
        const { campaignIds } = req.body;
        const { sortBy = 'createdAt', sortOrder = 'desc', recipientSortBy = 'phone', recipientSortOrder = 'asc' } = req.query;
        
        if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
            return res.status(400).json({ message: "Campaign IDs array is required" });
        }

        if (campaignIds.length > 10) {
            return res.status(400).json({ message: "Maximum 10 campaigns can be selected at once" });
        }

        // Find all campaigns that belong to the user
        const campaigns = await Campaign.find({
            _id: { $in: campaignIds },
            userId: req.user.id
        });

        if (campaigns.length === 0) {
            return res.status(404).json({ message: "No campaigns found" });
        }

        // Check if all campaigns are accessible for report generation
        const invalidCampaigns = campaigns.filter(campaign => 
            !['COMPLETED', 'RUNNING', 'PAUSED'].includes(campaign.status)
        );

        if (invalidCampaigns.length > 0) {
            return res.status(400).json({ 
                message: "Some campaigns are not available for report generation",
                invalidCampaigns: invalidCampaigns.map(c => ({ id: c.id, status: c.status }))
            });
        }

        // Sort campaigns based on sortBy parameter
        const sortOptions = {
            'createdAt': (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
            'updatedAt': (a, b) => new Date(a.updatedAt) - new Date(b.updatedAt),
            'title': (a, b) => (a.title || '').localeCompare(b.title || ''),
            'status': (a, b) => a.status.localeCompare(b.status),
            'totalRecipients': (a, b) => a.totalRecipients - b.totalRecipients,
            'sentCount': (a, b) => a.sentCount - b.sentCount
        };

        const sortFunction = sortOptions[sortBy] || sortOptions['createdAt'];
        campaigns.sort((a, b) => {
            const result = sortFunction(a, b);
            return sortOrder === 'desc' ? -result : result;
        });

        // Generate Excel report
        const xlsx = require('xlsx');
        const wb = xlsx.utils.book_new();
        
        // Combined summary sheet
        const summaryData = campaigns.map(campaign => {
            const recipients = campaign.recipients || [];
            const totalMessages = recipients.length;
            const successfulMessages = recipients.filter(r => r.status === 'SENT' || r.status === 'DELIVERED').length;
            const failedMessages = recipients.filter(r => r.status === 'FAILED').length;
            const deliveredMessages = recipients.filter(r => r.status === 'DELIVERED').length;
            const pendingMessages = recipients.filter(r => r.status === 'PENDING').length;
            const deliveryRate = totalMessages > 0 ? Math.round((successfulMessages / totalMessages) * 100) : 0;
            
            return {
                'Campaign ID': campaign.id,
                'Title': campaign.title || 'N/A',
                'Status': campaign.status,
                'Total Messages': totalMessages,
                'Sent': successfulMessages,
                'Failed': failedMessages,
                'Delivered': deliveredMessages,
                'Pending': pendingMessages,
                'Delivery Rate': `${deliveryRate}%`,
                'Started At': campaign.startedAt ? new Date(campaign.startedAt).toLocaleString('fa-IR') : 'N/A',
                'Completed At': campaign.completedAt ? new Date(campaign.completedAt).toLocaleString('fa-IR') : 'N/A',
                'Created At': new Date(campaign.createdAt).toLocaleString('fa-IR')
            };
        });
        
        const summaryWs = xlsx.utils.json_to_sheet(summaryData);
        xlsx.utils.book_append_sheet(wb, summaryWs, "Campaigns Summary");
        
        // Combined recipients details sheet
        let allRecipients = [];
        campaigns.forEach(campaign => {
            const campaignRecipients = campaign.recipients.map(recipient => ({
                'Campaign ID': campaign.id,
                'Campaign Title': campaign.title || 'N/A',
                'Phone': recipient.phone,
                'Name': recipient.name || 'N/A',
                'Status': recipient.status,
                'Sent At': recipient.sentAt ? new Date(recipient.sentAt).toLocaleString('fa-IR') : 'N/A',
                'Error': recipient.error || 'N/A'
            }));
            allRecipients = allRecipients.concat(campaignRecipients);
        });

        // Sort recipients based on recipientSortBy parameter
        const recipientSortOptions = {
            'phone': (a, b) => a.Phone.localeCompare(b.Phone),
            'name': (a, b) => (a.Name || '').localeCompare(b.Name || ''),
            'status': (a, b) => a.Status.localeCompare(b.Status),
            'sentAt': (a, b) => new Date(a['Sent At']) - new Date(b['Sent At']),
            'campaignId': (a, b) => a['Campaign ID'].localeCompare(b['Campaign ID'])
        };

        const recipientSortFunction = recipientSortOptions[recipientSortBy] || recipientSortOptions['phone'];
        allRecipients.sort((a, b) => {
            const result = recipientSortFunction(a, b);
            return recipientSortOrder === 'desc' ? -result : result;
        });
        
        const recipientsWs = xlsx.utils.json_to_sheet(allRecipients);
        xlsx.utils.book_append_sheet(wb, recipientsWs, "All Recipients");
        
        // Individual campaign messages sheet
        const messagesData = campaigns.map(campaign => ({
            'Campaign ID': campaign.id,
            'Campaign Title': campaign.title || 'N/A',
            'Campaign Message': campaign.message
        }));
        
        const messagesWs = xlsx.utils.json_to_sheet(messagesData);
        xlsx.utils.book_append_sheet(wb, messagesWs, "Campaign Messages");
        
        // Set response headers for Excel download
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="multiple-campaigns-report-${new Date().toISOString().split('T')[0]}.xlsx"`);
        
        // Write Excel file to response
        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Delete campaign
exports.deleteCampaign = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    
    const campaign = await verifyCampaignAccess(campaignId, req.user.id);
    verifyCampaignNotRunning(campaign);

    // Delete attachment files
    const attachments = await Attachment.findByCampaign(campaignId);
    attachments.forEach(attachment => {
        safeDeleteFile(attachment.path);
    });
    await prisma.attachment.deleteMany({
        where: { campaignId: parseInt(campaignId) }
    });

    await Campaign.delete(campaignId);

    res.json({
        success: true,
        message: "Campaign deleted successfully"
    });
});

// Set campaign interval
exports.setCampaignInterval = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const { interval, sendType, scheduledAt, timezone } = req.body;
    
    // Validate interval
    const validIntervals = ['5s', '10s', '20s'];
    if (interval && !validIntervals.includes(interval)) {
        throw new BadRequestError("Invalid interval. Must be one of: 5s, 10s, 20s");
    }

    // Validate sendType
    if (sendType && !['immediate', 'scheduled', 'IMMEDIATE', 'SCHEDULED'].includes(sendType)) {
        throw new BadRequestError("Invalid sendType. Must be 'immediate' or 'scheduled'.");
    }

    const campaign = await verifyCampaignAccess(campaignId, req.user.id);
    verifyCampaignNotRunning(campaign);

    // Validate scheduled time
    if (sendType === 'scheduled' || sendType === 'SCHEDULED') {
        if (!scheduledAt) {
            throw new BadRequestError("scheduledAt is required for scheduled campaigns");
        }

        const scheduledDate = new Date(scheduledAt);
        const now = new Date();
        
        if (scheduledDate <= now) {
            throw new BadRequestError("Scheduled time must be in the future");
        }

        // Check if scheduled time is not too far in the future (e.g., 1 year)
        const oneYearFromNow = new Date();
        oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
        
        if (scheduledDate > oneYearFromNow) {
            throw new BadRequestError("Scheduled time cannot be more than 1 year in the future");
        }
    }

    // Convert sendType to uppercase for Prisma
    const normalizedSendType = sendType?.toUpperCase() || 'IMMEDIATE';
    
    // Convert interval to enum for Prisma
    let normalizedInterval = null;
    if (interval) {
        switch (interval.toLowerCase()) {
            case '5s':
                normalizedInterval = 'FIVE_SECONDS';
                break;
            case '10s':
                normalizedInterval = 'TEN_SECONDS';
                break;
            case '20s':
                normalizedInterval = 'TWENTY_SECONDS';
                break;
            default:
                normalizedInterval = 'TEN_SECONDS';
        }
    }
    
    // Update campaign settings
    const updateData = {
        isScheduled: normalizedSendType === 'SCHEDULED',
        scheduledAt: normalizedSendType === 'SCHEDULED' ? new Date(scheduledAt) : null,
        timezone: timezone || 'Asia/Tehran',
        sendType: normalizedSendType
    };
    
    if (normalizedInterval) updateData.interval = normalizedInterval;
    
    const updatedCampaign = await Campaign.update(campaignId, updateData);

    res.json({
        success: true,
        message: "Campaign settings updated successfully",
        campaign: {
            id: updatedCampaign.id,
            interval: updatedCampaign.interval,
            schedule: {
                isScheduled: updatedCampaign.isScheduled,
                scheduledAt: updatedCampaign.scheduledAt,
                timezone: updatedCampaign.timezone,
                sendType: updatedCampaign.sendType
            },
            status: updatedCampaign.status
        }
    });
});

// Get subscription info
exports.getSubscriptionInfo = asyncHandler(async (req, res) => {
    if (!req.subscriptionInfo) {
        throw new BadRequestError("Subscription info not available");
    }

    res.json({
        success: true,
        subscription: req.subscriptionInfo
    });
});

// Update campaign title
exports.updateCampaignTitle = asyncHandler(async (req, res) => {
    const { campaignId } = req.params;
    const { title } = req.body;
    
    // Validate input
    if (!title || title.trim().length === 0) {
        throw new BadRequestError("Title is required");
    }
    
    if (title.trim().length > 100) {
        throw new BadRequestError("Title must be less than 100 characters");
    }
    
    const campaign = await verifyCampaignAccess(campaignId, req.user.id);
    verifyCampaignNotRunning(campaign);
    
    // Update title
    const updatedCampaign = await Campaign.update(campaignId, {
        title: title.trim()
    });
    
    res.json({
        success: true,
        message: "Campaign title updated successfully",
        campaign: {
            id: updatedCampaign.id,
            title: updatedCampaign.title,
            status: updatedCampaign.status
        }
    });
});
