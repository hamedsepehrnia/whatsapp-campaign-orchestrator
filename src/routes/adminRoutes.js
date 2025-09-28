const express = require('express');
const { authenticateJwt, authorizeRoles } = require('../middlewares/auth');
const { listUsers, updateUserRole, updateUserStatus, listTransactions, dashboardStats, uploadExcelTemplate, downloadExcelTemplate, getExcelTemplateInfo } = require('../controllers/adminController');
const { validate } = require('../middlewares/validate');
const { adminUpdateRoleSchema, adminUpdateStatusSchema } = require('../validators/schemas');
const multer = require('multer');

const router = express.Router();

// Configure multer for Excel template upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/temp/');
    },
    filename: function (req, file, cb) {
        cb(null, 'template-' + Date.now() + '.xlsx');
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype.includes('spreadsheetml') || 
            file.mimetype.includes('excel') ||
            file.originalname.endsWith('.xlsx')) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx) are allowed'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

router.use(authenticateJwt, authorizeRoles('admin', 'superAdmin'));

router.get('/users', listUsers);
router.patch('/users/:userId/role', validate(adminUpdateRoleSchema), updateUserRole);
router.patch('/users/:userId/status', validate(adminUpdateStatusSchema), updateUserStatus);

router.get('/transactions', listTransactions);
router.get('/dashboard', dashboardStats);

// Excel Template Management
router.post('/excel-template', upload.single('template'), uploadExcelTemplate);
router.get('/excel-template/download', downloadExcelTemplate);
router.get('/excel-template/info', getExcelTemplateInfo);

module.exports = router;


