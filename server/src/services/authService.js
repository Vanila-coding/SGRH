const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const notificationRepository = require('../repositories/notificationRepository');
const passwordResetRepository = require('../repositories/passwordResetRepository');
const siteTextsRepository = require('../repositories/siteTextsRepository');
const { sendPasswordResetEmail } = require('../config/mailer');

const JWT_SECRET = process.env.JWT_SECRET;

class AuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthError';
    this.status = 401;
  }
}

// Protection contre le brute-force : uniquement pour les comptes personnel (PE/PAT et
// Secrétaires, qui en découlent) — jamais pour ADMIN_RH/SUPERADMIN, qui doivent toujours
// pouvoir se connecter (comptes peu nombreux, surveillés, et un verrouillage sur ces
// rôles serait lui-même un vecteur de déni de service). Suivi en mémoire par email,
// comme le rate limiter des routes publiques — pas de nouvelle table pour ça.
const ROLES_PROTEGES_BRUTE_FORCE = ['PE', 'PAT', 'SECRETAIRE_PE', 'SECRETAIRE_PAT'];
const SEUIL_TENTATIVES = 10;
const FENETRE_VERROUILLAGE_MS = 30 * 60 * 1000;
const tentativesEchouees = new Map(); // email -> { compte, finFenetre }

function compteBloque(email) {
  const entree = tentativesEchouees.get(email);
  return !!entree && entree.compte >= SEUIL_TENTATIVES && entree.finFenetre > Date.now();
}

function enregistrerEchec(email) {
  const maintenant = Date.now();
  let entree = tentativesEchouees.get(email);
  if (!entree || entree.finFenetre <= maintenant) {
    entree = { compte: 0, finFenetre: maintenant + FENETRE_VERROUILLAGE_MS };
    tentativesEchouees.set(email, entree);
  }
  entree.compte += 1;
  return entree.compte;
}

function reinitialiserTentatives(email) {
  tentativesEchouees.delete(email);
}

async function notifierSuperadminBruteForce(user) {
  const nomComplet = [user.prenom, user.nom].filter(Boolean).join(' ');
  const superadmins = await userRepository.listActive({ role: 'SUPERADMIN' });
  for (const superadmin of superadmins) {
    await notificationRepository.create({
      senderId: null,
      recipientId: superadmin.id,
      title: 'Tentatives de connexion suspectes',
      message: `${SEUIL_TENTATIVES} tentatives de connexion échouées coup sur coup sur le compte ${nomComplet || user.email} (${user.email}). Le compte est temporairement bloqué.`,
      type: 'info',
    });
  }
}

// Équivalent serveur de useText() (qui n'existe que côté React) : renvoie le texte
// personnalisé par le Superadmin s'il existe, sinon l'enregistre comme valeur par défaut
// (visible ensuite dans Paramètres → Personnalisation → Contenu) et renvoie ce défaut.
async function textOrDefault(key, defaultValue, category) {
  const value = await siteTextsRepository.getOne(key);
  if (value !== null) return value;
  await siteTextsRepository.ensureDefault(key, defaultValue, category);
  return defaultValue;
}

async function login(email, password) {
  const user = await userRepository.findByEmailAvecMotDePasse(email);
  if (!user) throw new AuthError('Identifiants invalides');

  const estCompteProtege = ROLES_PROTEGES_BRUTE_FORCE.includes(user.role);
  if (estCompteProtege && compteBloque(email)) {
    throw new AuthError('Trop de tentatives échouées. Réessayez dans 30 minutes ou contactez l\'administration RH.');
  }

  if (user.status === 'pending') {
    throw new AuthError(await textOrDefault(
      'systeme.message_compte_attente',
      "Votre compte est en attente de validation par l'administration RH.",
      'Système',
    ));
  }
  if (user.status !== 'active') {
    throw new AuthError(await textOrDefault(
      'systeme.message_compte_desactive',
      "Votre compte a été désactivé. Contactez l'administration RH pour plus d'informations.",
      'Système',
    ));
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    if (estCompteProtege) {
      const compte = enregistrerEchec(email);
      if (compte === SEUIL_TENTATIVES) await notifierSuperadminBruteForce(user);
    }
    throw new AuthError('Identifiants invalides');
  }
  if (estCompteProtege) reinitialiserTentatives(email);

  const token = jwt.sign(
    { sub: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  const nomComplet = [user.prenom, user.nom].filter(Boolean).join(' ');
  await activityLogRepository.create(user.id, 'connexion', `Connexion${nomComplet ? ` de ${nomComplet}` : ''} (${user.email})`);

  return {
    token,
    user: {
      id: user.id, email: user.email, role: user.role,
      nom: user.nom, prenom: user.prenom, fonction: user.fonction,
      matricule: user.matricule, corps: user.corps, grade: user.grade,
      service: user.service, direction: user.direction, type_contrat: user.type_contrat,
    },
  };
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await userRepository.findFullById(userId);
  if (!user) throw new AuthError('Utilisateur introuvable');

  const matches = await bcrypt.compare(currentPassword, user.password_hash);
  if (!matches) throw new AuthError('Mot de passe actuel incorrect');

  if (newPassword.length < 8) {
    throw new AuthError('Le nouveau mot de passe doit contenir au moins 8 caractères');
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await userRepository.updatePassword(userId, newHash);

  await activityLogRepository.create(userId, 'mot_de_passe_modifie', `Mot de passe modifié`);
}

async function requestPasswordReset(email) {
  const user = await userRepository.findByEmail(email);
  if (!user) return;

  const resetToken = await passwordResetRepository.create(user.id);
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken.token}`;
  await sendPasswordResetEmail(email, resetLink);
}

async function resetPassword(token, newPassword) {
  const resetToken = await passwordResetRepository.findValid(token);
  if (!resetToken) throw new AuthError('Lien invalide ou expiré');

  if (newPassword.length < 8) {
    throw new AuthError('Le mot de passe doit contenir au moins 8 caractères');
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await userRepository.updatePassword(resetToken.user_id, newHash);
  await passwordResetRepository.markUsed(resetToken.id);

  await activityLogRepository.create(resetToken.user_id, 'mot_de_passe_reinitialise', 'Mot de passe réinitialisé via lien de récupération');
}

module.exports = { login, changePassword, requestPasswordReset, resetPassword, AuthError };