const express = require('express');
const etablissementController = require('../controllers/etablissementController');
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, etablissementController.list);
router.post('/', requireAuth, requirePermission('manage_etablissements'), etablissementController.create);
router.patch('/:id/desactiver', requireAuth, requirePermission('manage_etablissements'), etablissementController.desactiver);
router.patch('/:id/reactiver', requireAuth, requirePermission('manage_etablissements'), etablissementController.reactiver);

module.exports = router;
