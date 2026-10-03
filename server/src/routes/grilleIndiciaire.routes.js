const express = require('express');
const controller = require('../controllers/grilleIndiciaireController');
const { requireAuth, requirePermission, requireAnyPermission } = require('../middlewares/authMiddleware');

const router = express.Router();

// Lecture : un agent doit pouvoir comprendre son propre indice (view_profil), et les RH
// doivent pouvoir consulter les grilles dans l'administration (view_personnel).
router.get('/grilles', requireAuth, requireAnyPermission(['view_profil', 'view_personnel']), controller.listGrilles);
router.get('/grilles/:id', requireAuth, requireAnyPermission(['view_profil', 'view_personnel']), controller.getGrille);
router.get('/recherche', requireAuth, requireAnyPermission(['view_profil', 'view_personnel']), controller.rechercher);
router.get('/resolve', requireAuth, requirePermission('manage_fonctions'), controller.resolve);
router.post('/grilles/:id/lignes', requireAuth, requirePermission('manage_parametres_carriere'), controller.ajouterLigne);

module.exports = router;
