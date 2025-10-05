const express = require('express');
const { authenticateSession } = require('../middlewares/auth');
const { startPayment, confirmPayment, paymentCallback } = require('../controllers/paymentController');
const { validate } = require('../middlewares/validate');
const { paymentStartSchema, paymentConfirmSchema } = require('../validators/schemas');

const router = express.Router();

router.post('/start', authenticateSession, validate(paymentStartSchema), startPayment);
router.post('/confirm', authenticateSession, validate(paymentConfirmSchema), confirmPayment);

// Zarinpal callback (no auth required - called by Zarinpal)
router.get('/callback', paymentCallback);

module.exports = router;


