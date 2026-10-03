const activityLogRepository = require('../repositories/activityLogRepository');

// Types d'action réalisables uniquement via une permission exclusive au SUPERADMIN
// (comptes, corbeille, permissions, personnalisation, réclamations) : l'Admin RH ne
// doit pas les voir dans son propre journal d'activité, même s'il détient
// `view_historique` (qui ne lui donne accès qu'à ce que son propre périmètre couvre —
// personnel, carrière, congés, contrats, documents, organisation). Liste fixe plutôt que
// déduite dynamiquement : `activity_log.action_type` n'est pas relié à une permission en
// base, chaque service l'écrit en dur.
const TYPES_RESERVES_SUPERADMIN = [
  'compte_desactive', 'compte_reactive', 'compte_supprime', 'compte_contacte',
  'element_restaure', 'element_supprime_definitivement', 'corbeille_videe',
  'permission_modifiee',
  'apparence_modifiee', 'texte_modifie',
  'reclamation_deposee', 'reclamation_traitee',
  // Qui s'est connecté et les modifications génériques de compte (mot de passe) ne
  // concernent pas le périmètre métier de l'Admin RH (personnel, carrière, congés,
  // contrats, documents) — seul le Superadmin les voit.
  'connexion', 'mot_de_passe_modifie', 'mot_de_passe_reinitialise',
];

async function list(req, res) {
  const limit = Number(req.query.limit) || 50;
  const excludeTypes = req.query.exclude ? String(req.query.exclude).split(',').filter(Boolean) : [];
  if (req.user.role !== 'SUPERADMIN') {
    for (const type of TYPES_RESERVES_SUPERADMIN) {
      if (!excludeTypes.includes(type)) excludeTypes.push(type);
    }
  }
  const logs = await activityLogRepository.findRecent(limit, excludeTypes);
  return res.status(200).json({ logs });
}

module.exports = { list };
