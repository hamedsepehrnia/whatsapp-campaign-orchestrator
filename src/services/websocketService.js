const WebSocket = require('ws');
const { Campaign } = require('../models');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // Map of campaignId -> Set of WebSocket connections
    }

    initialize(server) {
        this.wss = new WebSocket.Server({ 
            server,
            path: '/ws/campaigns'
        });

        this.wss.on('connection', (ws, req) => {
            console.log('New WebSocket connection established');

            // Extract campaign ID from query parameters
            const url = new URL(req.url, `http://${req.headers.host}`);
            const campaignId = url.searchParams.get('campaignId');
            const userId = url.searchParams.get('userId');

            if (!campaignId || !userId) {
                ws.close(1008, 'Missing campaignId or userId');
                return;
            }

            // Store connection
            if (!this.clients.has(campaignId)) {
                this.clients.set(campaignId, new Set());
            }
            this.clients.get(campaignId).add(ws);

            // Send initial campaign status
            this.sendCampaignUpdate(campaignId, userId);

            ws.on('close', () => {
                console.log('WebSocket connection closed');
                if (this.clients.has(campaignId)) {
                    this.clients.get(campaignId).delete(ws);
                    if (this.clients.get(campaignId).size === 0) {
                        this.clients.delete(campaignId);
                    }
                }
            });

            ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });

            // Handle ping/pong for connection health
            ws.on('pong', () => {
                ws.isAlive = true;
            });
        });

        // Ping clients every 30 seconds to keep connection alive
        setInterval(() => {
            this.wss.clients.forEach((ws) => {
                if (ws.isAlive === false) {
                    ws.terminate();
                    return;
                }
                ws.isAlive = false;
                ws.ping();
            });
        }, 30000);

        console.log('WebSocket service initialized');
    }

    // Send campaign update to all connected clients for a specific campaign
    async sendCampaignUpdate(campaignId, userId) {
        try {
            const campaign = await Campaign.findById(campaignId);
            
            if (!campaign || campaign.userId !== userId) {
                return;
            }


            const update = {
                type: 'campaign_update',
                campaignId: campaign.id,
                data: {
                    id: campaign.id,
                    title: campaign.title,
                    status: campaign.status,
                    progress: campaign.progress,
                    startedAt: campaign.startedAt,
                    completedAt: campaign.completedAt,
                    timestamp: new Date().toISOString()
                }
            };

            this.broadcastToCampaign(campaignId, update);

        } catch (error) {
            console.error('Error sending campaign update:', error);
        }
    }

    // Send progress update
    async sendProgressUpdate(campaignId, progress, userId = null) {
        const update = {
            type: 'progress_update',
            campaignId: campaignId,
            data: {
                progress: progress,
                timestamp: new Date().toISOString()
            }
        };

        this.broadcastToCampaign(campaignId, update);
    }

    // Send status update
    async sendStatusUpdate(campaignId, status, message = null, userId = null) {
        const update = {
            type: 'status_update',
            campaignId: campaignId,
            data: {
                status: status,
                message: message,
                timestamp: new Date().toISOString()
            }
        };

        this.broadcastToCampaign(campaignId, update);
    }

    // Send error update
    async sendErrorUpdate(campaignId, error, userId = null) {
        const update = {
            type: 'error_update',
            campaignId: campaignId,
            data: {
                error: error,
                timestamp: new Date().toISOString()
            }
        };

        this.broadcastToCampaign(campaignId, update);
    }

    // Send completion update
    async sendCompletionUpdate(campaignId, report, userId = null) {
        const update = {
            type: 'completion_update',
            campaignId: campaignId,
            data: {
                report: report,
                timestamp: new Date().toISOString()
            }
        };

        this.broadcastToCampaign(campaignId, update);
    }

    // Send QR code
    async sendQRCode(campaignId, qrCode, userId = null) {
        const update = {
            type: 'qr_code',
            campaignId: campaignId,
            data: {
                qrCode: qrCode,
                timestamp: new Date().toISOString()
            }
        };

        this.broadcastToCampaign(campaignId, update);
    }

    // Broadcast message to all clients connected to a specific campaign
    broadcastToCampaign(campaignId, message) {
        if (this.clients.has(campaignId)) {
            const campaignClients = this.clients.get(campaignId);
            const messageStr = JSON.stringify(message);

            campaignClients.forEach((ws) => {
                if (ws.readyState === WebSocket.OPEN) {
                    try {
                        ws.send(messageStr);
                    } catch (error) {
                        console.error('Error sending message to client:', error);
                        campaignClients.delete(ws);
                    }
                } else {
                    campaignClients.delete(ws);
                }
            });

            // Clean up empty sets
            if (campaignClients.size === 0) {
                this.clients.delete(campaignId);
            }
        }
    }

    // Get connected clients count for a campaign
    getConnectedClientsCount(campaignId) {
        return this.clients.has(campaignId) ? this.clients.get(campaignId).size : 0;
    }

    // Get all connected campaigns
    getConnectedCampaigns() {
        return Array.from(this.clients.keys());
    }

    // Close all connections
    close() {
        if (this.wss) {
            this.wss.close();
        }
    }
}

// Create singleton instance
const websocketService = new WebSocketService();

module.exports = websocketService;
