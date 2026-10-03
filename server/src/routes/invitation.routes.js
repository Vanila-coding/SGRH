const express = require('express');
const invitationController = require('../controllers/invitationController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');
const { creerLimiteur } = require('../middlewares/rateLimit');

const router = express.Router();

const limiteurSubmit = creerLimiteur({ fenetreMs: 60 * 60 * 1000, max: 10, message: 'Trop de tentatives. Réessayez dans une heure.' });

// Routes fixes AVANT les routes à paramètre — règle à ne plus jamais oublier
router.post('/', requireAuth, requireRole('ADMIN_RH'), invitationController.inviteUser);
router.get('/pending', requireAuth, requireRole('ADMIN_RH'), invitationController.listPending);

router.get('/:token', invitationController.getByToken);
router.post('/:token/submit', limiteurSubmit, invitationController.submitForm);
router.post('/:id/confirm', requireAuth, requireRole('ADMIN_RH'), invitationController.confirm);
router.post('/:id/reject', requireAuth, requireRole('ADMIN_RH'), invitationController.reject);

module.exports = router;