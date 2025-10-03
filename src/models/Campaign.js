const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    recipients: [{
        phone: {
            type: String,
            required: true
        },
        name: String,
        status: {
            type: String,
            enum: ['pending', 'sent', 'failed', 'delivered'],
            default: 'pending'
        },
        sentAt: Date,
        error: String
    }],
    attachment: {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        path: String
    },
    interval: {
        type: String,
        enum: ['5s', '10s', '20s'],
        default: '10s'
    },
    schedule: {
        isScheduled: {
            type: Boolean,
            default: false
        },
        scheduledAt: {
            type: Date,
            default: null
        },
        timezone: {
            type: String,
            default: 'Asia/Tehran'
        },
        sendType: {
            type: String,
            enum: ['immediate', 'scheduled'],
            default: 'immediate'
        }
    },
    status: {
        type: String,
        enum: ['draft', 'ready', 'running', 'completed', 'paused', 'failed'],
        default: 'draft'
    },
    whatsappSession: {
        isConnected: {
            type: Boolean,
            default: false
        },
        qrCode: String,
        sessionId: String,
        lastActivity: Date
    },
    progress: {
        total: {
            type: Number,
            default: 0
        },
        sent: {
            type: Number,
            default: 0
        },
        failed: {
            type: Number,
            default: 0
        },
        delivered: {
            type: Number,
            default: 0
        }
    },
    startedAt: Date,
    completedAt: Date,
    report: {
        totalMessages: Number,
        successfulMessages: Number,
        failedMessages: Number,
        deliveryRate: Number,
        averageDeliveryTime: Number,
        errors: [String]
    }
}, {
    timestamps: true
});

// Index for better query performance
campaignSchema.index({ user: 1, status: 1 });
campaignSchema.index({ 'whatsappSession.sessionId': 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
