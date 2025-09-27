const { requestOtpForRegister, verifyOtpForRegister } = require('../services/otpService');

exports.requestOtp = async (req, res) => {
    try {
        const { channel, target } = req.body;
        await requestOtpForRegister({ channel, target });
        res.json({ message: 'OTP sent' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        const { channel, target, code } = req.body;
        const result = await verifyOtpForRegister({ channel, target, code });
        if (!result.ok) return res.status(result.status).json({ message: result.message });
        res.json({ message: 'Verified', verificationToken: result.verificationToken });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};


