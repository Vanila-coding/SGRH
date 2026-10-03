const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const siteSettingsService = require('../services/siteSettingsService');
const siteSettingsRepository = require('../repositories/siteSettingsRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const { imageExtension } = require('../utils/imageType');

async function get(req, res) {
  const settings = await siteSettingsService.getSettings();
  return res.status(200).json({ settings });
}

async function update(req, res) {
  const { key, value } = req.body;
  if (!key || !value) return res.status(400).json({ message: 'key et value requis' });

  try {
    const updated = await siteSettingsService.updateSetting(key, value, req.user.id);
    return res.status(200).json({ message: 'Couleur mise à jour', updated });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function resetColors(req, res) {
  const settings = await siteSettingsService.resetColors(req.user.id);
  return res.status(200).json({ message: 'Couleurs réinitialisées', settings });
}

// Logo principal, favicon, logo de la page de connexion : des chemins de fichier, pas des
// couleurs hexadécimales — ils ne passent donc pas par siteSettingsService.updateSetting
// (qui valide strictement le format #RRGGBB) mais écrivent directement dans site_settings,
// même table que les couleurs, réutilisée telle quelle.
const IMAGE_SETTING_KEYS = { logo: 'logo_principal_url', favicon: 'favicon_url', 'logo-connexion': 'logo_connexion_url' };

function makeImageUploadHandler(slot) {
  const settingKey = IMAGE_SETTING_KEYS[slot];
  return async function uploadImage(req, res) {
    if (!req.file) return res.status(400).json({ message: 'Une image est requise' });

    const extension = imageExtension(req.file.buffer);
    if (!extension) {
      return res.status(400).json({ message: 'Format invalide. Utilisez une image JPG, PNG ou WebP.' });
    }

    const filename = `${crypto.randomUUID()}.${extension}`;
    const folder = path.join(__dirname, '../../uploads/site');
    const filepath = path.join(folder, filename);
    const publicPath = `/uploads/site/${filename}`;

    try {
      await fs.mkdir(folder, { recursive: true });
      await fs.writeFile(filepath, req.file.buffer, { flag: 'wx' });

      const current = await siteSettingsRepository.getAll();
      const updated = await siteSettingsRepository.updateOne(settingKey, publicPath);

      if (current[settingKey] && current[settingKey].startsWith('/uploads/site/')) {
        await fs.unlink(path.join(__dirname, '../..', current[settingKey])).catch(() => {});
      }

      await activityLogRepository.create(req.user.id, 'apparence_modifiee', `Image "${settingKey}" mise à jour`);
      return res.status(200).json({ message: 'Image mise à jour', updated });
    } catch (err) {
      await fs.unlink(filepath).catch(() => {});
      console.error('Erreur upload image site:', err);
      return res.status(500).json({ message: "Erreur lors de l'enregistrement de l'image" });
    }
  };
}

module.exports = {
  get,
  update,
  resetColors,
  uploadLogo: makeImageUploadHandler('logo'),
  uploadFavicon: makeImageUploadHandler('favicon'),
  uploadLogoConnexion: makeImageUploadHandler('logo-connexion'),
};
