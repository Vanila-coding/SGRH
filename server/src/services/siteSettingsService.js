const siteSettingsRepository = require('../repositories/siteSettingsRepository');
const activityLogRepository = require('../repositories/activityLogRepository');

const HEX_REGEX = /^#[0-9A-Fa-f]{6}$/;

// Couleur de base du site : sobre, dérivée du logo (bleu marine institutionnel) plutôt
// que d'une teinte arbitraire — c'est à ces valeurs que « Réinitialiser » doit toujours
// ramener le site, quoi que le Superadmin ait choisi entre-temps. Mêmes valeurs que le
// seed initial (seed_reference.sql) et que le thème CSS par défaut (index.css @theme),
// gardées ici comme unique source de vérité pour la réinitialisation.
const DEFAULT_COLORS = {
  color_navy: '#02295D',
  color_gold: '#F2B705',
  color_status_pending: '#B8860B',
  color_status_approved: '#2E8459',
  color_status_rejected: '#B23A3A',
};

async function getSettings() {
  return siteSettingsRepository.getAll();
}

async function updateSetting(key, value, changedBy) {
  if (!HEX_REGEX.test(value)) {
    throw new Error('Couleur invalide (format attendu : #RRGGBB)');
  }
  const updated = await siteSettingsRepository.updateOne(key, value);
  await activityLogRepository.create(changedBy, 'apparence_modifiee', `Couleur "${key}" changée en ${value}`);
  return updated;
}

async function resetColors(changedBy) {
  for (const [key, value] of Object.entries(DEFAULT_COLORS)) {
    await siteSettingsRepository.updateOne(key, value);
  }
  await activityLogRepository.create(changedBy, 'apparence_modifiee', 'Couleurs réinitialisées à la palette par défaut');
  return siteSettingsRepository.getAll();
}

module.exports = { getSettings, updateSetting, resetColors, DEFAULT_COLORS };