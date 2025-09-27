const express = require('express');
const { authenticateJwt, authorizeRoles } = require('../middlewares/auth');
const { listUsers, updateUserRole, updateUserStatus, listTransactions, dashboardStats } = require('../controllers/adminController');
const { validate } = require('../middlewares/validate');
const { adminUpdateRoleSchema, adminUpdateStatusSchema } = require('../validators/schemas');

const router = express.Router();

router.use(authenticateJwt, authorizeRoles('admin', 'superAdmin'));

router.get('/users', listUsers);
router.patch('/users/:userId/role', validate(adminUpdateRoleSchema), updateUserRole);
router.patch('/users/:userId/status', validate(adminUpdateStatusSchema), updateUserStatus);

router.get('/transactions', listTransactions);
router.get('/dashboard', dashboardStats);

module.exports = router;


