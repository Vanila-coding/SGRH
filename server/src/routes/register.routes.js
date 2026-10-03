const express = require('express');
const registerController = require('../controllers/registerController');
const { creerLimiteur } = require('../middlewares/rateLimit');

const router = express.Router();

const limiteur = creerLimiteur({ fenetreMs: 60 * 60 * 1000, max: 5, message: 'Trop de tentatives d\'inscription. Réessayez dans une heure.' });

router.post('/', limiteur, registerController.register);

module.exports = router;