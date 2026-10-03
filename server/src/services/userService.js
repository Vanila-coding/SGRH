const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const userRepository = require('../repositories/userRepository');
const personnelRepository = require('../repositories/personnelRepository');
const fonctionHistoryRepository = require('../repositories/fonctionHistoryRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const organisationRepository = require('../repositories/organisationRepository');

const FONCTIONS_PAR_ROLE = {
  PE: ['Enseignant', 'Enseignant Chercheur', 'Maître de Conférences', 'Professeur'],
  PAT: ['Agent', 'Chef de service', 'Responsable/Directeur'],
};

async function changeFonction(userId, newFonction, changedBy) {
  const user = await userRepository.findById(userId);
  if (!user) throw new Error('Utilisateur introuvable');

  const allowed = FONCTIONS_PAR_ROLE[user.role] || [];
  if (!allowed.includes(newFonction)) {
    throw new Error('Fonction invalide pour ce rôle');
  }
  if (user.fonction === newFonction) {
    throw new Error('Cette personne a déjà cette fonction');
  }

  await fonctionHistoryRepository.create({
    userId,
    ancienneFonction: user.fonction,
    nouvelleFonction: newFonction,
    changedBy,
  });

  await activityLogRepository.create(changedBy, 'fonction_modifiee', `Fonction de ${user.email} changée : ${user.fonction || 'aucune'} → ${newFonction}`);

  const updated = await userRepository.updateFonction(userId, newFonction);

  if (user.personnel_id) {
    await organisationRepository.syncResponsable(user.personnel_id, newFonction, user.service, user.direction);
  }

  return updated;
}

async function getFonctionHistory(userId) {
  return fonctionHistoryRepository.findByUser(userId);
}

async function registerWithMatricule(email, matricule, password) {
  const personnel = await personnelRepository.findByMatricule(matricule);
  if (!personnel) throw new Error('Matricule introuvable');
  if (personnel.email !== email) {
    throw new Error("Cet email ne correspond pas au matricule fourni");
  }

  const alreadyLinked = await personnelRepository.isLinkedToUser(personnel.id);
  if (alreadyLinked) throw new Error('Un compte existe déjà pour ce matricule');

  if (password.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères');
  const passwordHash = await bcrypt.hash(password, 10);

  // Un agent désigné secrétaire par l'Admin RH à la création de sa fiche (secretariat_role)
  // obtient directement ce rôle d'accès au lieu de son rôle PE/PAT métier habituel.
  const role = personnel.secretariat_role || personnel.role;

  const result = await pool.query(
    `INSERT INTO users (email, role, personnel_id, password_hash, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING id, email, role, personnel_id, status`,
    [email, role, personnel.id, passwordHash]
  );

  return result.rows[0];
}

module.exports = { changeFonction, getFonctionHistory, FONCTIONS_PAR_ROLE, registerWithMatricule };