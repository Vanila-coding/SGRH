const express = require('express');
const multer = require('multer');
const siteSettingsController = require('../controllers/siteSettingsController');
const { requireAuth, requirePermission } = require('../middlewares/authMiddleware');

const imageUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

function upload(handler) {
  return [
    requireAuth,
    requirePermission('manage_site_settings'),
    (req, res, next) => imageUpload.single('file')(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: "L'image ne doit pas dépasser 2 Mo." });
      }
      return res.status(400).json({ message: "Impossible de lire l'image envoyée." });
    }),
    handler,
  ];
}

const router = express.Router();

router.get('/', siteSettingsController.get); // public, volontairement sans requireAuth — nécessaire dès la page de login
router.patch('/', requireAuth, requirePermission('manage_site_settings'), siteSettingsController.update);
router.post('/reset-colors', requireAuth, requirePermission('manage_site_settings'), siteSettingsController.resetColors);
router.post('/logo', ...upload(siteSettingsController.uploadLogo));
router.post('/favicon', ...upload(siteSettingsController.uploadFavicon));
router.post('/logo-connexion', ...upload(siteSettingsController.uploadLogoConnexion));

module.exports = router;
