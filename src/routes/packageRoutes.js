const express = require('express');
const { authenticateJwt, authorizeRoles } = require('../middlewares/auth');
const { createPackage, getPackages, getPackageById, updatePackage, deletePackage } = require('../controllers/packageController');
const { validate } = require('../middlewares/validate');
const { packageCreateSchema, packageUpdateSchema } = require('../validators/schemas');

const router = express.Router();

// Public list and details
router.get('/', getPackages);
router.get('/:id', getPackageById);

// Admin-only CRUD
router.post('/', authenticateJwt, authorizeRoles('admin', 'superAdmin'), validate(packageCreateSchema), createPackage);
router.put('/:id', authenticateJwt, authorizeRoles('admin', 'superAdmin'), validate(packageUpdateSchema), updatePackage);
router.delete('/:id', authenticateJwt, authorizeRoles('admin', 'superAdmin'), deletePackage);

module.exports = router;


