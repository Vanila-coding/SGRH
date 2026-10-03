const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { creerLimiteur } = require('../middlewares/rateLimit');

const router = express.Router();

// Pas de limiteur par IP sur /login : bloquait aussi Admin RH/Superadmin, dont les
// connexions légitimes partagent souvent la même IP (réseau de l'université). La
// protection contre le brute-force est désormais par compte (voir authService.login,
// réservée aux rôles personnel) plutôt que par adresse IP.
// Spam : chaque appel envoie un e-mail réel (coût, boîte de la victime).
const limiteurForgotPassword = creerLimiteur({ fenetreMs: 60 * 60 * 1000, max: 5, message: 'Trop de demandes de réinitialisation. Réessayez dans une heure.' });
const limiteurResetPassword = creerLimiteur({ fenetreMs: 15 * 60 * 1000, max: 10, message: 'Trop de tentatives. Réessayez dans quelques minutes.' });

router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me);
router.patch('/password', requireAuth, authController.changePassword);
router.post('/forgot-password', limiteurForgotPassword, authController.forgotPassword);
router.post('/reset-password', limiteurResetPassword, authController.resetPassword);

module.exports = router;