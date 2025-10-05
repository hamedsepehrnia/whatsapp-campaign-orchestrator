const express = require('express');
const { authenticateSession, authorizeRoles } = require('../middlewares/auth');
const { createPackage, getPackages, getPackageById, updatePackage, deletePackage } = require('../controllers/packageController');
const { validate } = require('../middlewares/validate');
const { packageCreateSchema, packageUpdateSchema } = require('../validators/schemas');

const router = express.Router();

// Public list and details
router.get('/', getPackages);
router.get('/:id', getPackageById);

// Admin-only CRUD
router.post('/', authenticateSession, authorizeRoles('admin', 'superAdmin'), validate(packageCreateSchema), createPackage);
router.put('/:id', authenticateSession, authorizeRoles('admin', 'superAdmin'), validate(packageUpdateSchema), updatePackage);
router.delete('/:id', authenticateSession, authorizeRoles('admin', 'superAdmin'), deletePackage);

module.exports = router;


