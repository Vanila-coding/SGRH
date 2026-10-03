const express = require('express');
const otpController = require('../controllers/otpController');
const { creerLimiteur } = require('../middlewares/rateLimit');

const router = express.Router();

// Un code à 4 chiffres n'a que 10 000 combinaisons : sans limite, /verify est
// brute-forçable en quelques minutes. 10 essais / 10 min garde une marge pour une
// erreur de frappe légitime tout en rendant le brute-force impraticable.
const limiteurRequest = creerLimiteur({ fenetreMs: 60 * 60 * 1000, max: 5, message: 'Trop de demandes de code. Réessayez dans une heure.' });
const limiteurVerify = creerLimiteur({ fenetreMs: 10 * 60 * 1000, max: 10, message: 'Trop de tentatives. Réessayez dans quelques minutes.' });

router.post('/request', limiteurRequest, otpController.request);
router.post('/verify', limiteurVerify, otpController.verify);

module.exports = router;