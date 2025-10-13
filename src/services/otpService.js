const bcrypt = require('bcryptjs');
const { Otp } = require('../models');
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

    await Otp.upsert({
        target, 
        channel, 
        purpose: 'register'
    }, {
        hashedCode, 
        expiresAt, 
        attempts: 0, 
        verified: false
    });

    if (channel === 'sms') await sendSms(target, `کد تایید شما: ${code}`);
    else await sendEmail(target, 'کد تایید', `کد تایید شما: ${code}`);
};

exports.verifyOtpForRegister = async ({ channel, target, code }) => {
    const record = await Otp.findByTargetAndChannel(target, channel, 'register');
    if (!record) return { ok: false, status: 404, message: 'OTP not found' };
    if (record.verified) return { ok: false, status: 400, message: 'Already verified' };
    if (record.attempts >= record.maxAttempts) return { ok: false, status: 429, message: 'Too many attempts' };
    if (record.expiresAt < new Date()) return { ok: false, status: 410, message: 'OTP expired' };

    const match = await bcrypt.compare(code, record.hashedCode);
    await Otp.update(record.id, { attempts: record.attempts + 1 });
    if (!match) {
        if (record.attempts + 1 >= record.maxAttempts) await Otp.delete(record.id);
        return { ok: false, status: 401, message: 'Invalid code' };
    }

    await Otp.update(record.id, { verified: true });
    return { ok: true, verificationToken: record.id.toString() };
};