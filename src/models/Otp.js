const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    target: { type: String, required: true }, // email or phone
    channel: { type: String, required: true, enum: ['sms', 'email'] },
    purpose: { type: String, required: true, enum: ['register'] },
    hashedCode: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    verified: { type: Boolean, default: false },
}, { timestamps: true });

otpSchema.index({ target: 1, channel: 1, purpose: 1 }, { unique: true });
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Otp', otpSchema);


