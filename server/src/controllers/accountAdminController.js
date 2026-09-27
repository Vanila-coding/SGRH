const userRepository = require('../repositories/userRepository');
const corbeilleRepository = require('../repositories/corbeilleRepository');
const activityLogRepository = require('../repositories/activityLogRepository');

async function list(req, res) {
  const accounts = await userRepository.listAllAccounts();
  return res.status(200).json({ accounts });
}

async function deactivate(req, res) {
  const user = await userRepository.setStatus(req.params.id, 'inactive');
  if (!user) return res.status(404).json({ message: 'Compte introuvable' });
  await activityLogRepository.create(req.user.id, 'compte_desactive', `Compte #${req.params.id} désactivé`);
  return res.status(200).json({ message: 'Compte désactivé', user });
}

async function reactivate(req, res) {
  const user = await userRepository.setStatus(req.params.id, 'active');
  if (!user) return res.status(404).json({ message: 'Compte introuvable' });
  await activityLogRepository.create(req.user.id, 'compte_reactive', `Compte #${req.params.id} réactivé`);
  return res.status(200).json({ message: 'Compte réactivé', user });
}

// Transitions strictement limitées : promouvoir/rétrograder un compte PE/PAT en
// secrétaire de sa propre catégorie. Jamais touché : ADMIN_RH, SUPERADMIN, ni un
// changement de catégorie (PE ne devient jamais SECRETAIRE_PAT).
const TRANSITIONS_AUTORISEES = {
  PE: 'SECRETAIRE_PE',
  SECRETAIRE_PE: 'PE',
  PAT: 'SECRETAIRE_PAT',
  SECRETAIRE_PAT: 'PAT',
};

async function changeRole(req, res) {
  const { role } = req.body;
  const current = await userRepository.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Compte introuvable' });

  if (TRANSITIONS_AUTORISEES[current.role] !== role) {
    return res.status(400).json({ message: 'Changement de rôle non autorisé pour ce compte' });
  }

  const user = await userRepository.setRole(req.params.id, role);
  const promotion = role.startsWith('SECRETAIRE_');
  await activityLogRepository.create(
    req.user.id,
    promotion ? 'compte_promu_secretariat' : 'compte_retrograde_secretariat',
    `Compte #${req.params.id} ${promotion ? 'désigné secrétaire' : 'retiré du secrétariat'} (${current.role} → ${role})`
  );
  return res.status(200).json({ message: promotion ? 'Compte désigné secrétaire' : 'Rôle de secrétaire retiré', user });
}

async function remove(req, res) {
  if (Number(req.params.id) === req.user.id) {
    return res.status(400).json({ message: 'Impossible de supprimer son propre compte' });
  }

  try {
    const archived = await corbeilleRepository.archiveAndDeleteCompte(req.params.id, req.user.id);
    if (!archived) return res.status(404).json({ message: 'Compte introuvable' });

    await activityLogRepository.create(req.user.id, 'compte_supprime', `Compte #${req.params.id} déplacé dans la corbeille`);
    return res.status(200).json({ message: 'Compte déplacé dans la corbeille' });
  } catch (err) {
    console.error('Erreur lors de la suppression du compte', req.params.id, err);
    return res.status(500).json({ message: "La suppression du compte a échoué. Aucune donnée n'a été modifiée." });
  }
}

module.exports = { list, deactivate, reactivate, changeRole, remove };