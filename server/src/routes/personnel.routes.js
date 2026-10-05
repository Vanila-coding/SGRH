const express = require('express');
const multer = require('multer');
const personnelController = require('../controllers/personnelController');
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const photoUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024 } });

function uploadProfilePhoto(req, res, next) {
  photoUpload.single('photo')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: "L'image ne doit pas dépasser 3 Mo." });
    }
    return res.status(400).json({ message: "Impossible de lire l'image envoyée." });
  });
}

const router = express.Router();

router.get('/me', requireAuth, requirePermission('view_profil'), personnelController.me);
router.get('/me/dossier.pdf', requireAuth, requirePermission('view_profil'), personnelController.monDossierPdf);
router.patch('/me/photo', requireAuth, requirePermission('view_profil'), uploadProfilePhoto, personnelController.updatePhoto);
router.get('/mon-equipe', requireAuth, personnelController.monEquipe);
router.post('/', requireAuth, requirePermission('create_personnel'), personnelController.create);
router.get('/export', requireAuth, requirePermission('view_personnel'), personnelController.exportExcel);
router.get('/import/modele', requireAuth, requirePermission('create_personnel'), personnelController.modeleImportExcel);
router.post('/import', requireAuth, requirePermission('create_personnel'), upload.single('file'), personnelController.importExcel);
router.get('/', requireAuth, requirePermission('view_personnel'), personnelController.list);
router.get('/sans-compte', requireAuth, requirePermission('send_registration_link'), personnelController.listWithoutAccount);
// Déclarée après les routes GET fixes (/me, /mon-equipe, /export, /sans-compte) : sinon ":id" les capterait.
router.get('/:id/dossier.pdf', requireAuth, requirePermission('view_personnel'), personnelController.dossierPdf);
router.get('/:id', requireAuth, requirePermission('view_personnel'), personnelController.getOne);
router.post('/:id/envoyer-lien', requireAuth, requirePermission('send_registration_link'), personnelController.sendRegistrationLink);
router.patch('/me', requireAuth, requirePermission('modifier_mes_infos'), personnelController.updateMesInfos);
router.patch('/:id', requireAuth, requirePermission('create_personnel'), personnelController.update);

module.exports = router;