const express = require('express');
const { authenticateJwt } = require('../middlewares/auth');
const { createOrder, getMyOrders } = require('../controllers/orderController');
const { validate } = require('../middlewares/validate');
const { orderCreateSchema } = require('../validators/schemas');

const router = express.Router();

router.post('/', authenticateJwt, validate(orderCreateSchema), createOrder);
router.get('/me', authenticateJwt, getMyOrders);

module.exports = router;


