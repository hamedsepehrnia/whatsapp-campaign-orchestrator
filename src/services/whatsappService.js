const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const { Campaign, User } = require('../models');
const websocketService = require('./websocketService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

let io;
const clients = new Map(); // Stores { campaignId: { client, userId, status } }
const campaignIntervals = new Map(); // Stores { campaignId: intervalId }

const whatsappService = {
    init(socketIo) {
        io = socketIo;
        console.log('📱 WhatsApp service initialized with WebSocket support');
    },


    // Generate QR code image from raw data
    async generateQRCodeImage(qrData) {
        try {
            const QRCode = require('qrcode');
            const qrImage = await QRCode.toDataURL(qrData, {
                errorCorrectionLevel: 'M',
                margin: 1,
                width: 300,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            return qrImage;
        } catch (error) {
            console.error('Error generating QR code image:', error);
            return null;
        }
    },

    // Get active sessions for a user
    async getActiveUserSessions(userId) {
        let count = 0;
        for (const session of clients.values()) {
            if (session.userId === userId) {
                count++;
            }
        }
        return count;
    },

    // Prepare WhatsApp sessions for campaigns
    async prepareWhatsAppSessions(campaigns, userId) {
        for (const campaign of campaigns) {
            const campaignId = campaign.id.toString();
            console.log(`📱 Preparing WhatsApp session for campaign ${campaignId}`);

            try {
                const client = new Client({
                    authStrategy: new LocalAuth({
                        clientId: `session-${userId}-${campaignId}`
                    }),
                    puppeteer: {
                        headless: true,
                        args: ['--no-sandbox', '--disable-setuid-sandbox'],
                        executablePath: process.env.CHROME_PATH || undefined,
                    }
                });

                // Set timeout for client initialization (30 seconds)
                const initTimeout = setTimeout(async () => {
                    console.log(`⏰ Timeout reached for campaign ${campaignId}, cleaning up...`);
                    try {
                        // Use cleanupSession which has better error handling
                        this.cleanupSession(campaignId);
                    } catch (error) {
                        console.error(`Error during timeout cleanup:`, error);
                    }

                    // Send timeout error via WebSocket
                    await websocketService.sendErrorUpdate(campaignId, 'WhatsApp session initialization timeout', userId);
                }, 30000);

                clients.set(campaignId, { client, userId, status: 'pending', timeout: initTimeout });

                // QR Code event
                client.on('qr', async (qr) => {
                    console.log(`📱 QR code generated for campaign ${campaignId}`);

                    // Clear timeout since QR code was generated
                    const session = clients.get(campaignId);
                    if (session && session.timeout) {
                        clearTimeout(session.timeout);
                        session.timeout = null;
                    }

                    // Generate QR code image data
                    const qrCodeData = {
                        raw: qr,
                        image: await this.generateQRCodeImage(qr)
                    };

                    // Update campaign with QR code
                    await Campaign.update(campaignId, {
                        qrCode: JSON.stringify(qrCodeData),
                        isConnected: false
                    });

                    // Send QR code via WebSocket
                    await websocketService.sendQRCode(campaignId, qrCodeData, userId);
                });

                // Client ready event
                client.on('ready', async () => {
                    console.log(`✅ WhatsApp client ready for campaign ${campaignId}`);

                    // Clear timeout since client is ready
                    const session = clients.get(campaignId);
                    if (session && session.timeout) {
                        clearTimeout(session.timeout);
                        session.timeout = null;
                    }

                    const clientInfo = {
                        number: client.info.wid.user,
                        name: client.info.pushname
                    };

                    // Update campaign status
                    await Campaign.update(campaignId, {
                        isConnected: true,
                        lastActivity: new Date(),
                        status: 'READY'
                    });
                    // Mark session as ready in memory
                    if (clients.has(campaignId)) {
                        clients.get(campaignId).status = 'ready';
                    }


                    // Send ready status via WebSocket
                    await websocketService.sendStatusUpdate(campaignId, 'ready', 'WhatsApp connected successfully', userId);
                });

                // Client disconnected event
                client.on('disconnected', async (reason) => {
                    console.log(`❌ WhatsApp client disconnected for campaign ${campaignId}:`, reason);

                    // Clear timeout
                    const session = clients.get(campaignId);
                    if (session && session.timeout) {
                        clearTimeout(session.timeout);
                        session.timeout = null;
                    }

                    // Update campaign status
                    await Campaign.update(campaignId, {
                        isConnected: false,
                        status: 'FAILED'
                    });

                    // Send disconnected status via WebSocket
                    await websocketService.sendStatusUpdate(campaignId, 'failed', 'WhatsApp disconnected', userId);

                    this.cleanupSession(campaignId);
                });

                // Initialize client
                await client.initialize();

            } catch (error) {
                console.error(`❌ Failed to initialize WhatsApp client for campaign ${campaignId}:`, error);

                // Update campaign status
                await Campaign.update(campaignId, {
                    status: 'FAILED'
                });

                // Send error via WebSocket
                await websocketService.sendErrorUpdate(campaignId, 'Failed to initialize WhatsApp client', userId);

                // Clean up session on error with better error handling
                try {
                    this.cleanupSession(campaignId);
                } catch (cleanupError) {
                    console.error(`❌ Error during cleanup for campaign ${campaignId}:`, cleanupError.message);
                }
            }
        }
    },

    // Start campaign with message sending
    async handleStartCampaign(campaignId, userId) {
        try {
            const campaign = await Campaign.findById(campaignId);

            if (!campaign || campaign.userId !== userId) {
                throw new Error("Campaign not found or access denied");
            }


            // Check if WhatsApp is connected
            const session = clients.get(campaignId);
            if (!session || !session.client || session.status !== 'ready') {
                throw new Error("WhatsApp client not ready");
            }

            // Check user's message limit
            const user = await User.findById(userId);
            if (!user) {
                throw new Error("User not found");
            }

            // Calculate message limit
            let messageLimit = 0;
            if (user.purchasedPackages && user.purchasedPackages.length > 0) {
                messageLimit = user.purchasedPackages.reduce((total, pkg) => {
                    return total + (pkg.messageLimit || 0);
                }, 0);
            }

            const totalMessages = campaign.recipients.length;
            if (messageLimit > 0 && totalMessages > messageLimit) {
                const remainingMessages = messageLimit - (user.messagesSent || 0);
                throw new Error(`You can only send ${remainingMessages} more messages. Upgrade your plan.`);
            }

            // Update campaign status
            await Campaign.update(campaignId, {
                status: 'RUNNING',
                startedAt: new Date()
            });

            // Send status update
            await websocketService.sendStatusUpdate(campaignId, 'running', 'Campaign started successfully', userId);

            // Start sending messages
            await this.startMessageSending(campaign, session.client, userId);

        } catch (error) {
            console.error('❌ Error starting campaign:', error);

            // Update campaign status
            await Campaign.update(campaignId, {
                status: 'FAILED'
            });

            // Send error via WebSocket
            await websocketService.sendErrorUpdate(campaignId, error.message, userId);
        }
    },

    // Start sending messages with interval
    async startMessageSending(campaign, client, userId) {
        const recipients = campaign.recipients;
        const intervalMs = this.getIntervalMs(campaign.interval);
        let currentIndex = 0;
        const report = [];

        const intervalId = setInterval(async () => {
            if (currentIndex >= recipients.length) {
                // Campaign completed
                await this.handleStopCampaign(campaign.id, 'COMPLETED', userId);
                return;
            }

            const recipient = recipients[currentIndex];

            try {
                // Send message
                const numberId = `${this.normalizeNumber(recipient.phone)}@c.us`;
                await client.sendMessage(numberId, campaign.message);

                // Send attachment if exists
                if (campaign.attachment && campaign.attachment.path) {
                    const media = MessageMedia.fromFilePath(campaign.attachment.path);
                    await client.sendMessage(numberId, media);
                }

                // Update recipient status
                recipient.status = 'sent';
                recipient.sentAt = new Date();

                // Update campaign progress
                await Campaign.update(campaign.id, {
                    sentCount: campaign.sentCount + 1
                });
                

                // Add to report
                report.push({
                    phone: recipient.phone,
                    name: recipient.name,
                    status: 'sent',
                    sentAt: new Date()
                });

                // Send progress update via WebSocket
                await websocketService.sendProgressUpdate(campaign.id, {
                    sent: currentIndex + 1,
                    total: recipients.length,
                    current: recipient.phone
                }, userId);

            } catch (error) {
                console.error(`❌ Failed to send message to ${recipient.phone}:`, error);

                // Update recipient status
                recipient.status = 'failed';
                recipient.error = error.message;

                // Update campaign progress
                await Campaign.update(campaign.id, {
                    failedCount: campaign.failedCount + 1
                });

                // Add to report
                report.push({
                    phone: recipient.phone,
                    name: recipient.name,
                    status: 'failed',
                    error: error.message,
                    sentAt: new Date()
                });

                // Send error update via WebSocket
                await websocketService.sendErrorUpdate(campaign.id, `Failed to send to ${recipient.phone}: ${error.message}`, userId);
            }

            currentIndex++;
        }, intervalMs);

        // Store interval for cleanup
        campaignIntervals.set(campaign.id.toString(), { intervalId, report });
    },

    // Stop campaign
    async handleStopCampaign(campaignId, finalStatus = 'stopped', userId) {
        const campaignInfo = campaignIntervals.get(campaignId.toString());
        
        if (campaignInfo) {
            clearInterval(campaignInfo.intervalId);
            campaignIntervals.delete(campaignId.toString());
        }

        // Get campaign details
        const campaign = await Campaign.findById(campaignId);

        // Update campaign status
        await Campaign.update(campaignId, {
            status: finalStatus,
            completedAt: new Date()
        });

        if (campaign) {
            // Generate final report
            await this.generateCampaignReport(campaign, campaignInfo?.report || []);

            // Send completion update via WebSocket
            await websocketService.sendCompletionUpdate(campaignId, {
                status: finalStatus,
                totalSent: campaign.sentCount || 0,
                totalFailed: campaign.failedCount || 0,
                reportUrl: `/api/campaigns/${campaignId}/report`
            }, userId);
        }

        // Cleanup session
        this.cleanupSession(campaignId.toString());
    },

    // Generate campaign report
    async generateCampaignReport(campaign, report) {
        try {
            const totalMessages = campaign.totalRecipients || 0;
            const successfulMessages = campaign.sentCount || 0;
            const failedMessages = campaign.failedCount || 0;
            
            const reportData = {
                totalMessages: totalMessages,
                successfulMessages: successfulMessages,
                failedMessages: failedMessages,
                deliveryRate: totalMessages > 0 ? (successfulMessages / totalMessages) * 100 : 0,
                averageDeliveryTime: 0, // Calculate based on timestamps
                errors: report.filter(r => r.status === 'failed').map(r => r.error)
            };

            // Update campaign with report (using existing fields)
            await Campaign.update(campaign.id, {
                totalMessages: reportData.totalMessages,
                successfulMessages: reportData.successfulMessages,
                failedMessages: reportData.failedMessages,
                deliveryRate: reportData.deliveryRate,
                averageDeliveryTime: reportData.averageDeliveryTime
            });

            // Generate Excel report
            const wb = xlsx.utils.book_new();
            const ws = xlsx.utils.json_to_sheet(report);
            xlsx.utils.book_append_sheet(wb, ws, "Campaign Report");

            const reportPath = path.join(__dirname, '..', '..', 'uploads', `report-${campaign.id}-${Date.now()}.xlsx`);
            xlsx.writeFile(wb, reportPath);

            console.log(`📊 Campaign report generated: ${reportPath}`);

        } catch (error) {
            console.error('❌ Error generating campaign report:', error);
        }
    },

    // Cancel user campaigns
    async cancelUserCampaigns(userId) {
        console.log(`🛑 Cancelling all campaigns for user ID: ${userId}`);

        const campaigns = await Campaign.findAll({
            userId: userId,
            status: 'RUNNING'
        });

        for (const campaign of campaigns) {
            await this.handleStopCampaign(campaign.id, 'CANCELLED', userId);
        }
    },

    // Cleanup session
    cleanupSession(campaignId) {
        const session = clients.get(campaignId);
        if (session) {
            try {
                // Clear any existing timeout
                if (session.timeout) {
                    clearTimeout(session.timeout);
                }

                // Check if client exists and has proper methods before destroying
                if (session.client && typeof session.client.destroy === 'function') {
                    // Check if the client's browser is still valid before destroying
                    if (session.client.pupBrowser && !session.client.pupBrowser.isClosed()) {
                        session.client.destroy();
                    } else {
                        console.log(`⚠️ Browser already closed for campaign ${campaignId}, skipping destroy`);
                    }
                }
            } catch (error) {
                console.error("❌ Error destroying WhatsApp client:", error.message);
            }
            clients.delete(campaignId);
            console.log(`🧹 Cleaned up session for campaign ${campaignId}`);
        }
    },

    // Cleanup user sessions
    cleanupUserSessions(userId) {
        for (const [campaignId, session] of clients.entries()) {
            if (session.userId === userId) {
                this.cleanupSession(campaignId);
            }
        }
    },

    // Check if campaign has active session
    hasActiveSession(campaignId) {
        return clients.has(campaignId);
    },

    // Get interval in milliseconds
    getIntervalMs(interval) {
        switch (interval) {
            case '5s': return 5000;
            case '10s': return 10000;
            case '20s': return 20000;
            default: return 10000;
        }
    },

    // Normalize phone number
    normalizeNumber(number) {
        number = String(number).trim();
        if (number.startsWith('0')) {
            return `98${number.substring(1)}`;
        }
        if (number.startsWith('9')) {
            return `98${number}`;
        }
        if (number.startsWith('+98')) {
            return number.substring(1);
        }
        return number;
    },

    // Get campaign status
    async getCampaignStatus(campaignId) {
        const session = clients.get(campaignId);
        if (!session) {
            return { status: 'not_found', message: 'Campaign session not found' };
        }

        return {
            status: session.status,
            isConnected: session.client ? true : false,
            lastActivity: new Date()
        };
    }
};

module.exports = whatsappService;
