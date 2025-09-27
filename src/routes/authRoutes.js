const express = require('express');
const { requestOtp, verifyOtp } = require('../controllers/otpController');
const { validate } = require('../middlewares/validate');
const { otpRequestSchema, otpVerifySchema } = require('../validators/schemas');

const router = express.Router();

router.post('/request-otp', validate(otpRequestSchema), requestOtp);
router.post('/verify-otp', validate(otpVerifySchema), verifyOtp);

module.exports = router;


