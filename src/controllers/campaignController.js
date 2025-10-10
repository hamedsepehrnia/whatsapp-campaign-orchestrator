const { Campaign, User } = require('../models');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const websocketService = require('../services/websocketService');
const whatsappService = require('../services/whatsappService');

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
exports.createCampaign = async (req, res) => {
    try {
        const { message, title } = req.body;
        
        if (!message) {
            return res.status(400).json({ 
                message: "Message is required" 
            });
        }

        if (!title) {
            return res.status(400).json({ 
                message: "Title is required" 
            });
        }

        const campaign = await Campaign.create({
            user: req.user._id,
            message,
            title: title.trim()
        });

        res.status(201).json({
            message: "Campaign created successfully",
            campaign: {
                id: campaign._id,
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

// Upload permanent attachment
exports.uploadAttachment = [
    permanentUpload.single('attachment'),
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

// Confirm attachment and move from temp to permanent
exports.confirmAttachment = async (req, res) => {
    try {
        const { campaignId } = req.params;
        const { tempFilename } = req.body;
        
        if (!tempFilename) {
            return res.status(400).json({ message: "Temporary filename is required" });
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
                message: "Cannot update attachment while campaign is running" 
            });
        }

        const tempPath = path.join('uploads/temp', tempFilename);
        
        if (!fs.existsSync(tempPath)) {
            return res.status(404).json({ message: "Temporary file not found" });
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
            filename: permanentFilename,
            originalName: req.body.originalName || tempFilename,
            mimetype: req.body.mimetype || 'application/octet-stream',
            size: stats.size,
            path: permanentPath
        };

        await campaign.save();

        res.json({
            message: "Attachment confirmed and saved successfully",
            attachment: {
                filename: campaign.attachment.filename,
                originalName: campaign.attachment.originalName,
                size: campaign.attachment.size,
                mimetype: campaign.attachment.mimetype
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
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
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Check if campaign is ready for preview
        if (campaign.status !== 'ready') {
            return res.status(400).json({ 
                message: "Campaign is not ready for preview. Please complete all previous steps." 
            });
        }

        // Prepare recipients cards for preview
        const recipientCards = campaign.recipients.map((recipient, index) => ({
            id: index + 1,
            phone: recipient.phone,
            name: recipient.name || 'بدون نام',
            message: campaign.message,
            attachment: campaign.attachment ? {
                filename: campaign.attachment.originalName,
                size: campaign.attachment.size,
                type: campaign.attachment.mimetype
            } : null
        }));

        // Campaign summary
        const campaignSummary = {
            id: campaign._id,
            message: campaign.message,
            totalRecipients: campaign.recipients.length,
            interval: campaign.interval,
            hasAttachment: !!campaign.attachment,
            attachment: campaign.attachment ? {
                filename: campaign.attachment.originalName,
                size: campaign.attachment.size,
                type: campaign.attachment.mimetype
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

// Confirm campaign and start sending
exports.confirmAndStartCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Check if campaign is ready
        if (campaign.status !== 'ready') {
            return res.status(400).json({ 
                message: "Campaign is not ready to start" 
            });
        }

        // Check WhatsApp connection
        if (!campaign.whatsappSession?.isConnected) {
            return res.status(400).json({ 
                message: "WhatsApp is not connected. Please connect WhatsApp first." 
            });
        }

        // Start the campaign
        campaign.status = 'running';
        campaign.startedAt = new Date();
        await campaign.save();

        // Send WebSocket update
        await websocketService.sendCampaignUpdate(campaign._id, req.user._id);

        // Start sending messages in background
        whatsappService.startCampaign(campaign._id).catch(error => {
            console.error('❌ Error starting campaign:', error);
        });

        res.json({
            message: "Campaign confirmed and started successfully",
            campaign: {
                id: campaign._id,
                status: campaign.status,
                totalRecipients: campaign.recipients.length,
                startedAt: campaign.startedAt
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
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

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
                completed: !!campaign.attachment,
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
                id: campaign._id,
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
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

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
        
        if (!stepData.steps[targetStep]?.canNavigate) {
            return res.status(400).json({ 
                message: `Cannot navigate to step ${step}. Please complete previous steps first.` 
            });
        }

        // Return step data for navigation
        res.json({
            message: `Navigating to step ${step}`,
            step: {
                number: step,
                name: stepData.steps[targetStep].name,
                completed: stepData.steps[targetStep].completed,
                optional: stepData.steps[targetStep].optional
            },
            campaign: {
                id: campaign._id,
                status: campaign.status,
                message: campaign.message,
                recipients: campaign.recipients?.length || 0,
                attachment: campaign.attachment,
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
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Get current step status
        const stepStatus = await exports.getCampaignStepStatus(req, res);
        if (stepStatus.status !== 200) {
            return stepStatus;
        }

        const stepData = stepStatus.json;
        const currentStep = stepData.campaign.currentStep;

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
                id: campaign._id,
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
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

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
                // Reset everything
                campaign.message = undefined;
                campaign.recipients = [];
                campaign.attachment = undefined;
                campaign.interval = '10s';
                campaign.whatsappSession = { isConnected: false };
                campaign.status = 'draft';
                break;
            case 2:
                // Reset from step 2 onwards
                campaign.recipients = [];
                campaign.attachment = undefined;
                campaign.interval = '10s';
                campaign.whatsappSession = { isConnected: false };
                campaign.status = 'draft';
                break;
            case 3:
                // Reset from step 3 onwards
                campaign.attachment = undefined;
                campaign.interval = '10s';
                campaign.whatsappSession = { isConnected: false };
                campaign.status = 'ready';
                break;
            case 4:
                // Reset from step 4 onwards
                campaign.interval = '10s';
                campaign.whatsappSession = { isConnected: false };
                campaign.status = 'ready';
                break;
            case 5:
                // Reset from step 5 onwards
                campaign.whatsappSession = { isConnected: false };
                campaign.status = 'ready';
                break;
            case 6:
                // Just reset status
                campaign.status = 'ready';
                break;
        }

        await campaign.save();

        res.json({
            message: `Campaign reset to step ${step}`,
            campaign: {
                id: campaign._id,
                status: campaign.status,
                message: campaign.message,
                recipients: campaign.recipients?.length || 0,
                attachment: campaign.attachment,
                interval: campaign.interval,
                whatsappConnected: campaign.whatsappSession?.isConnected || false
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
        const campaigns = await Campaign.find({
            user: req.user._id,
            'schedule.isScheduled': true,
            'schedule.scheduledAt': { $gt: new Date() },
            status: { $in: ['ready', 'draft'] }
        }).sort({ 'schedule.scheduledAt': 1 });

        res.json({
            message: "Scheduled campaigns retrieved successfully",
            campaigns: campaigns.map(campaign => ({
                id: campaign._id,
                message: campaign.message,
                recipients: campaign.recipients.length,
                scheduledAt: campaign.schedule.scheduledAt,
                timezone: campaign.schedule.timezone,
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
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (!campaign.schedule.isScheduled) {
            return res.status(400).json({ 
                message: "Campaign is not scheduled" 
            });
        }

        // Reset schedule
        campaign.schedule = {
            isScheduled: false,
            scheduledAt: null,
            timezone: 'Asia/Tehran',
            sendType: 'immediate'
        };

        await campaign.save();

        res.json({
            message: "Scheduled campaign cancelled successfully",
            campaign: {
                id: campaign._id,
                schedule: campaign.schedule
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

        // Clean up any existing session for this campaign first
        console.log(`🧹 Cleaning up existing session for campaign ${campaignId}`);
        whatsappService.cleanupSession(campaignId);

        // Generate unique session ID
        const sessionId = uuidv4();
        
        // Update campaign with WhatsApp session info
        campaign.whatsappSession = {
            isConnected: false,
            sessionId: sessionId,
            lastActivity: new Date()
        };

        await campaign.save();

        // Initialize WhatsApp session with timeout
        console.log(`📱 Initializing new WhatsApp session for campaign ${campaignId}`);
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

        // Check if there's an active session in memory
        const hasActiveSession = whatsappService.hasActiveSession(campaignId);

        res.json({
            isConnected: campaign.whatsappSession.isConnected,
            lastActivity: campaign.whatsappSession.lastActivity,
            hasActiveSession: hasActiveSession,
            sessionId: campaign.whatsappSession.sessionId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Force cleanup WhatsApp session
exports.forceCleanupSession = async (req, res) => {
    try {
        const { campaignId } = req.params;
        
        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Force cleanup session
        whatsappService.cleanupSession(campaignId);

        // Reset campaign WhatsApp session
        campaign.whatsappSession = {
            isConnected: false,
            sessionId: null,
            lastActivity: null
        };
        await campaign.save();

        res.json({
            message: "Session cleaned up successfully",
            campaignId: campaignId
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
        const { 
            status, 
            title, 
            startDate, 
            endDate, 
            page = 1, 
            limit = 10 
        } = req.query;
        
        const filter = { user: req.user._id };
        
        // Filter by status
        if (status) {
            filter.status = status;
        }
        
        // Filter by title (case-insensitive search)
        if (title) {
            filter.title = { $regex: title, $options: 'i' };
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

        const campaigns = await Campaign.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('title status progress createdAt startedAt completedAt message');

        const total = await Campaign.countDocuments(filter);

        res.json({
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
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// Search campaigns with advanced filters
exports.searchCampaigns = async (req, res) => {
    try {
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
        
        const filter = { user: req.user._id };
        
        // General search query (searches in title and message)
        if (query) {
            filter.$or = [
                { title: { $regex: query, $options: 'i' } },
                { message: { $regex: query, $options: 'i' } }
            ];
        }
        
        // Filter by status
        if (status) {
            filter.status = status;
        }
        
        // Filter by title (case-insensitive search)
        if (title) {
            filter.title = { $regex: title, $options: 'i' };
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

        const campaigns = await Campaign.find(filter)
            .sort(sortConfig)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('title status progress createdAt startedAt completedAt message');

        const total = await Campaign.countDocuments(filter);

        res.json({
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
                title: campaign.title,
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
        const { interval, sendType, scheduledAt, timezone } = req.body;
        
        // Validate interval
        const validIntervals = ['5s', '10s', '20s'];
        if (interval && !validIntervals.includes(interval)) {
            return res.status(400).json({ 
                message: "Invalid interval. Must be one of: 5s, 10s, 20s" 
            });
        }

        // Validate sendType
        if (sendType && !['immediate', 'scheduled'].includes(sendType)) {
            return res.status(400).json({ 
                message: "Invalid sendType. Must be 'immediate' or 'scheduled'." 
            });
        }

        const campaign = await Campaign.findOne({ 
            _id: campaignId, 
            user: req.user._id 
        });

        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        if (campaign.status === 'running') {
            return res.status(400).json({ 
                message: "Cannot modify running campaign" 
            });
        }

        // Validate scheduled time
        if (sendType === 'scheduled') {
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

            // Check if scheduled time is not too far in the future (e.g., 1 year)
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
            
            if (scheduledDate > oneYearFromNow) {
                return res.status(400).json({ 
                    message: "Scheduled time cannot be more than 1 year in the future" 
                });
            }
        }

        // Update campaign settings
        if (interval) campaign.interval = interval;
        
        campaign.schedule = {
            isScheduled: sendType === 'scheduled',
            scheduledAt: sendType === 'scheduled' ? new Date(scheduledAt) : null,
            timezone: timezone || 'Asia/Tehran',
            sendType: sendType || 'immediate'
        };

        await campaign.save();

        res.json({
            message: "Campaign settings updated successfully",
            campaign: {
                id: campaign._id,
                interval: campaign.interval,
                schedule: campaign.schedule,
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
