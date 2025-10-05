const express = require('express');
const { authenticateSession } = require('../middlewares/auth');
const { createOrder, getMyOrders } = require('../controllers/orderController');
const { validate } = require('../middlewares/validate');
const { orderCreateSchema } = require('../validators/schemas');

const router = express.Router();

router.post('/', authenticateSession, validate(orderCreateSchema), createOrder);
router.get('/me', authenticateSession, getMyOrders);

module.exports = router;


