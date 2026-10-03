const express = require('express');
const organisationController = require('../controllers/organisationController');
const multer = require('multer');
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.get('/directions', requireAuth, organisationController.directions);
router.get('/services', requireAuth, organisationController.services);

router.post('/directions', requireAuth, requirePermission('manage_organisation'), organisationController.createDirection);
router.delete('/directions/:id', requireAuth, requirePermission('manage_organisation'), organisationController.deleteDirection);
router.post('/services', requireAuth, requirePermission('manage_organisation'), organisationController.createService);
router.delete('/services/:id', requireAuth, requirePermission('manage_organisation'), organisationController.deleteService);
router.patch('/directions/:id', requireAuth, requirePermission('manage_organisation'), organisationController.modifierDirection);
router.patch('/services/:id', requireAuth, requirePermission('manage_organisation'), organisationController.modifierService);
router.get('/import/modele', requireAuth, requirePermission('manage_organisation'), organisationController.modeleImport);
router.post('/import', requireAuth, requirePermission('manage_organisation'), upload.single('file'), organisationController.importer);

module.exports = router;
