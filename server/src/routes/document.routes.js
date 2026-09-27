const express = require('express');
const documentController = require('../controllers/documentController');
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/demandes', requireAuth, requirePermission('demander_document'), documentController.demander);
router.get('/demandes/me', requireAuth, requirePermission('demander_document'), documentController.mesDemandes);
router.get('/demandes/en-attente', requireAuth, requirePermission('manage_documents'), documentController.demandesEnAttente);
router.get('/demandes/en-attente-secretariat', requireAuth, requirePermission('review_documents_secretariat'), documentController.demandesEnAttenteSecretariat);
router.post('/demandes/:id/review-secretariat', requireAuth, requirePermission('review_documents_secretariat'), documentController.reviewSecretariat);
router.post('/demandes/:id/traiter', requireAuth, requirePermission('manage_documents'), documentController.traiter);
router.post('/demandes/:id/refuser', requireAuth, requirePermission('manage_documents'), documentController.refuser);

router.post('/', requireAuth, requirePermission('manage_documents'), documentController.generate);
router.get('/me', requireAuth, requirePermission('view_mes_documents'), documentController.mesDocuments);
router.get('/personnel/:personnelId', requireAuth, requirePermission('manage_documents'), documentController.historiquePersonnel);
router.get('/:id', requireAuth, documentController.getOne);

module.exports = router;