const userRepository = require('../repositories/userRepository');
const corbeilleRepository = require('../repositories/corbeilleRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const { sendCustomMessage } = require('../config/mailer');

async function list(req, res) {
  const accounts = await userRepository.listAllAccounts();
  return res.status(200).json({ accounts });
}

// ADMIN_RH et SUPERADMIN ne peuvent jamais être désactivés ou supprimés depuis cet
// écran : ce sont les deux seuls rôles qui administrent le système lui-même (dont
// l'attribution des permissions et la gestion des comptes), un verrouillage accidentel
// ou malveillant de ces comptes pourrait couper l'accès à l'application elle-même.
const ROLES_PROTEGES = ['ADMIN_RH', 'SUPERADMIN'];

async function deactivate(req, res) {
  const current = await userRepository.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Compte introuvable' });
  if (ROLES_PROTEGES.includes(current.role)) {
    return res.status(400).json({ message: 'Les comptes Admin RH et Superadmin ne peuvent pas être désactivés.' });
  }

  const user = await userRepository.setStatus(req.params.id, 'inactive');
  await activityLogRepository.create(req.user.id, 'compte_desactive', `Compte #${req.params.id} désactivé`);
  return res.status(200).json({ message: 'Compte désactivé', user });
}

async function reactivate(req, res) {
  const user = await userRepository.setStatus(req.params.id, 'active');
  if (!user) return res.status(404).json({ message: 'Compte introuvable' });
  await activityLogRepository.create(req.user.id, 'compte_reactive', `Compte #${req.params.id} réactivé`);
  return res.status(200).json({ message: 'Compte réactivé', user });
}

// Le secrétariat est une fonction administrative : seul un compte PAT peut être
// désigné secrétaire, jamais un PE. En revanche, un PAT secrétaire peut être affecté à
// l'une ou l'autre catégorie de demandes (PE ou PAT) — ce n'est pas forcément sa propre
// catégorie, puisque sa tâche est administrative, pas liée à son propre dossier. Un
// secrétaire retiré de ses fonctions retourne toujours à PAT (jamais à PE, qu'il n'a
// jamais été). Jamais touché : ADMIN_RH, SUPERADMIN.
const TRANSITIONS_AUTORISEES = {
  PAT: ['SECRETAIRE_PE', 'SECRETAIRE_PAT'],
  SECRETAIRE_PE: ['PAT'],
  SECRETAIRE_PAT: ['PAT'],
};

async function changeRole(req, res) {
  const { role } = req.body;
  const current = await userRepository.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Compte introuvable' });

  const transitionsPossibles = TRANSITIONS_AUTORISEES[current.role] || [];
  if (!transitionsPossibles.includes(role)) {
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

  const current = await userRepository.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Compte introuvable' });
  if (ROLES_PROTEGES.includes(current.role)) {
    return res.status(400).json({ message: 'Les comptes Admin RH et Superadmin ne peuvent pas être supprimés.' });
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

// Message libre du Superadmin vers le titulaire d'un compte — typiquement avant une
// suppression, ou pour prévenir qu'un compte vient d'être créé/est en attente. Par
// e-mail uniquement : aucun fournisseur SMS n'est configuré dans ce projet (pas de clé
// Twilio/Vonage en .env) — mieux vaut le dire clairement que de simuler un envoi.
async function contacter(req, res) {
  const { sujet, message } = req.body;
  if (!sujet || !message) return res.status(400).json({ message: 'Sujet et message requis' });

  const current = await userRepository.findById(req.params.id);
  if (!current) return res.status(404).json({ message: 'Compte introuvable' });
  if (!current.email) return res.status(400).json({ message: "Ce compte n'a pas d'adresse e-mail enregistrée" });

  try {
    await sendCustomMessage(current.email, sujet, message);
  } catch (err) {
    console.error('Erreur envoi e-mail personnalisé:', err);
    return res.status(502).json({ message: "Échec de l'envoi de l'e-mail" });
  }

  await activityLogRepository.create(req.user.id, 'compte_contacte', `E-mail envoyé à ${current.email} — sujet : "${sujet}"`);
  return res.status(200).json({ message: 'E-mail envoyé' });
}

module.exports = { list, deactivate, reactivate, changeRole, remove, contacter };