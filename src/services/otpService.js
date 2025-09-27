const bcrypt = require('bcryptjs');
const Otp = require('../models/Otp');
const { sendSms } = require('../utils/sms');
const { sendEmail } = require('../utils/mailer');

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.requestOtpForRegister = async ({ channel, target }) => {
    if (!['sms', 'email'].includes(channel)) throw new Error('Invalid channel');

    const code = generateCode();
    const hashedCode = await bcrypt.hash(code, 10);
    const ttlMinutes = 5;
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await Otp.findOneAndUpdate(
        { target, channel, purpose: 'register' },
        { hashedCode, expiresAt, attempts: 0, verified: false },
        { upsert: true, new: true }
    );

    if (channel === 'sms') await sendSms(target, `کد تایید شما: ${code}`);
    else await sendEmail(target, 'کد تایید', `کد تایید شما: ${code}`);
};

exports.verifyOtpForRegister = async ({ channel, target, code }) => {
    const record = await Otp.findOne({ target, channel, purpose: 'register' });
    if (!record) return { ok: false, status: 404, message: 'OTP not found' };
    if (record.verified) return { ok: false, status: 400, message: 'Already verified' };
    if (record.attempts >= record.maxAttempts) return { ok: false, status: 429, message: 'Too many attempts' };
    if (record.expiresAt < new Date()) return { ok: false, status: 410, message: 'OTP expired' };

    const match = await bcrypt.compare(code, record.hashedCode);
    await Otp.updateOne({ _id: record._id }, { $inc: { attempts: 1 } });
    if (!match) {
        if (record.attempts + 1 >= record.maxAttempts) await Otp.deleteOne({ _id: record._id });
        return { ok: false, status: 401, message: 'Invalid code' };
    }

    record.verified = true;
    await record.save();
    return { ok: true, verificationToken: record._id.toString() };
};