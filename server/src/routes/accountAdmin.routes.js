const express = require('express');
const accountAdminController = require('../controllers/accountAdminController');
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', requireAuth, requirePermission('manage_accounts'), accountAdminController.list);
router.post('/:id/deactivate', requireAuth, requirePermission('manage_accounts'), accountAdminController.deactivate);
router.post('/:id/reactivate', requireAuth, requirePermission('manage_accounts'), accountAdminController.reactivate);
router.patch('/:id/role', requireAuth, requirePermission('manage_accounts'), accountAdminController.changeRole);
router.delete('/:id', requireAuth, requirePermission('manage_accounts'), accountAdminController.remove);
router.post('/:id/contacter-email', requireAuth, requirePermission('manage_accounts'), accountAdminController.contacter);

module.exports = router;