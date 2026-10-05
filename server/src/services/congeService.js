const congeRepository = require('../repositories/congeRepository');
const notificationRepository = require('../repositories/notificationRepository');
const userRepository = require('../repositories/userRepository');
const personnelRepository = require('../repositories/personnelRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const congeDroitsService = require('./congeDroitsService');
const congeSuiviRepository = require('../repositories/congeSuiviRepository');
const verificationService = require('./verificationService');
const congeUtilisationService = require('./congeUtilisationService');
const pool = require('../config/db');
const { categorieMetier, categorieVerifiee, estSecretaire } = require('../utils/categorieSecretariat');

const JUSTIFICATIF_REQUIS_VALIDATION = ['Congé de maladie', 'Congé de maternité'];

function nombreDeJours(dateDebut, dateFin) {
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin);
  const diffMs = fin - debut;
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1; // inclusif
}

async function determineValidateur(userId, personnel) {
  if (personnel.service) {
    const chefId = await personnelRepository.findChefDeServiceUser(personnel.service, userId);
    if (chefId) return { validateurId: chefId, decisionIntermediaire: 'en_attente' };
  }
  if (personnel.direction) {
    const responsableId = await personnelRepository.findResponsableDirectionUser(personnel.direction, userId);
    if (responsableId) return { validateurId: responsableId, decisionIntermediaire: 'en_attente' };
  }
  return { validateurId: null, decisionIntermediaire: 'non_requise' };
}

// Restitue au solde les jours d'un congé annuel refusé. À n'appeler qu'après un
// changement d'état valide (en_attente -> refusee) obtenu dans la même transaction.
async function restituerJoursSiCongeAnnuel(demande, client) {
  if (demande.type_conge !== 'Congé annuel') return;
  const requester = await userRepository.findById(demande.user_id);
  if (requester?.personnel_id) {
    await personnelRepository.crediterSolde(requester.personnel_id, nombreDeJours(demande.date_debut, demande.date_fin), client);
  }
}

async function createDemande(userId, { typeConge, dateDebut, dateFin, motif, lieuJouissance, dateRepriseService, remplacant }) {
  if (new Date(dateFin) < new Date(dateDebut)) {
    throw new Error('La date de fin doit être après la date de début');
  }

  const user = await userRepository.findById(userId);
  if (!user || !user.personnel_id) {
    throw new Error('Aucune fiche personnel associée à ce compte');
  }

  const jours = nombreDeJours(dateDebut, dateFin);

  // Tout ce qui touche au solde (recharge, contrôles, création, débit) se fait dans
  // UNE transaction qui verrouille la fiche : deux demandes simultanées sont
  // sérialisées, le solde ne peut pas devenir négatif et un échec annule tout.
  const { demande } = await pool.withTransaction(async (client) => {
    // Acquisition des droits : 2,5 jours par mois de service effectif (années manquantes incluses).
    await congeDroitsService.rechargerSiNecessaire(user.personnel_id, client);

    // Règles de prise du congé (distinctes de l'acquisition des droits ci-dessus).
    if (typeConge === 'Congé annuel') {
      const solde = await personnelRepository.getSolde(user.personnel_id, client);
      const nbDemandesAnnuellesCetteAnnee = await congeRepository.countCongesAnnuelCetteAnnee(userId, client);
      congeUtilisationService.verifierPremiereDemandeAnnuelle({ jours, nbDemandesAnnuellesCetteAnnee });
      congeUtilisationService.verifierSoldeSuffisant({ jours, solde });
    }
    if (typeConge === 'Congé de paternité') {
      congeUtilisationService.verifierDureePaternite({ jours });
    }

    const soldeAvant = await personnelRepository.getSolde(user.personnel_id, client);
    const validateur = await determineValidateur(userId, user);
    const created = await congeRepository.create({
      userId, typeConge, dateDebut, dateFin, motif, lieuJouissance, dateRepriseService, remplacant,
    }, client);
    await congeRepository.setValidateur(created.id, validateur.validateurId, validateur.decisionIntermediaire, client);

    if (typeConge === 'Congé annuel') {
      const restant = await personnelRepository.debiterSoldeSiSuffisant(user.personnel_id, jours, client);
      if (restant === null) throw new Error('Solde insuffisant pour cette demande');
      await congeDroitsService.imputerJours(userId, user.personnel_id, created.id, jours, client);
    }
    // Photographie du solde à la date de la demande (fiche imprimable) ; les types
    // sans effet sur le solde le laissent inchangé.
    const soldeApres = typeConge === 'Congé annuel' ? soldeAvant - jours : soldeAvant;
    await congeSuiviRepository.setSnapshotSolde(created.id, soldeAvant, soldeApres, client);
    return { demande: created, validateurId: validateur.validateurId };
  });

  // La notification du validateur (ou du RH s'il n'y en a pas) n'a lieu qu'une fois
  // le secrétariat satisfait — voir reviewSecretariat. À la création, seul le
  // secrétariat de la catégorie du demandeur (et le RH en repli anti-blocage) est prévenu.
  const categorie = categorieMetier(user.role);
  const secretaires = categorie ? await userRepository.listActive({ role: `SECRETAIRE_${categorie}` }) : [];
  const admins = await userRepository.listActive({ role: 'ADMIN_RH' });
  for (const destinataire of [...secretaires, ...admins]) {
    await notificationRepository.create({
      senderId: userId,
      recipientId: destinataire.id,
      title: 'Nouvelle demande de congé à vérifier',
      message: `Une demande de "${typeConge}" de ${user.prenom} ${user.nom} attend la vérification du secrétariat.`,
      type: 'conge',
    });
  }

  await activityLogRepository.create(userId, 'conge_demande', `Demande de "${typeConge}" soumise (${jours} jour(s))`);

  return demande;
}

async function uploadJustificatif(demandeId, userId, { filename, path }) {
  const demande = await congeRepository.findById(demandeId);
  if (!demande) throw new Error('Demande introuvable');
  if (demande.user_id !== userId) throw new Error('Vous ne pouvez pas modifier cette demande');

  const updated = await congeRepository.setJustificatif(demandeId, filename, path);
  await activityLogRepository.create(userId, 'conge_justificatif_ajoute', `Justificatif ajouté à la demande #${demandeId}`);
  return updated;
}

async function getMyDemandes(userId) {
  return congeRepository.findByUser(userId);
}

async function getPendingDemandes() {
  return congeRepository.findPending();
}

async function getPendingForValidateur(validateurUserId) {
  return congeRepository.findPendingForValidateur(validateurUserId);
}

async function reviewIntermediaire(id, decision, validateurUserId, avis) {
  if (!['approuvee', 'refusee'].includes(decision)) {
    throw new Error('Décision invalide');
  }
  const demande = await congeRepository.findById(id);
  if (!demande) throw new Error('Demande introuvable');
  if (demande.validateur_id !== validateurUserId) {
    throw new Error("Vous n'êtes pas le validateur assigné à cette demande");
  }
  if (demande.decision_intermediaire !== 'en_attente') {
    throw new Error('Cette demande a déjà été traitée à ce niveau');
  }

  // Décision, changement de statut et restitution des jours : atomiques. Chaque
  // écriture est conditionnelle (état "en attente"), donc rejouer ou doubler la
  // décision ne peut pas restituer les jours deux fois.
  const updated = await pool.withTransaction(async (client) => {
    const row = await congeRepository.setDecisionIntermediaire(id, decision, avis, client);
    if (!row) throw new Error('Cette demande a déjà été traitée à ce niveau');

    if (decision === 'refusee') {
      const refused = await congeRepository.updateStatus(id, 'refusee', null, avis, client);
      if (!refused) throw new Error('Demande introuvable ou déjà traitée');
      await restituerJoursSiCongeAnnuel(demande, client);
    }
    return row;
  });

  if (decision === 'refusee') {
    await notificationRepository.create({
      senderId: validateurUserId,
      recipientId: demande.user_id,
      title: 'Congé refusé',
      message: `Votre demande de "${demande.type_conge}" a été refusée par votre responsable direct.`,
      type: 'conge',
    });
  } else {
    const admins = await userRepository.listActive({ role: 'ADMIN_RH' });
    for (const admin of admins) {
      await notificationRepository.create({
        senderId: validateurUserId,
        recipientId: admin.id,
        title: 'Demande de congé à valider',
        message: `Une demande de "${demande.type_conge}" a été approuvée par le responsable direct, en attente de votre décision finale.`,
        type: 'conge',
      });
    }
  }

  await activityLogRepository.create(validateurUserId, 'conge_avis_intermediaire', `Demande #${id} : avis intermédiaire "${decision}"`);
  return updated;
}

// `secretaireRole` : 'SECRETAIRE_PE' | 'SECRETAIRE_PAT' | 'ADMIN_RH' | 'SUPERADMIN'
// (ADMIN_RH/SUPERADMIN servent de repli anti-blocage si aucun secrétaire n'est
// désigné pour une catégorie — ils passent sans restriction de catégorie).
// Un secrétaire ne voit pas ses propres demandes (séparation des tâches).
async function getPendingForSecretariat(secretaireRole, secretaireUserId) {
  const exclure = estSecretaire(secretaireRole) ? secretaireUserId : null;
  return congeRepository.findPendingForSecretariat(categorieVerifiee(secretaireRole), exclure);
}

async function reviewSecretariat(id, decision, secretaireUserId, secretaireRole, avis) {
  if (!['approuvee', 'refusee'].includes(decision)) {
    throw new Error('Décision invalide');
  }
  const demande = await congeRepository.findByIdWithDetails(id);
  if (!demande) throw new Error('Demande introuvable');
  if (demande.decision_secretariat !== 'en_attente') {
    throw new Error('Cette demande a déjà été vérifiée par le secrétariat');
  }
  if (estSecretaire(secretaireRole)) {
    if (demande.user_id === secretaireUserId) {
      throw new Error('Vous ne pouvez pas vérifier votre propre demande');
    }
    if (categorieMetier(demande.role) !== categorieVerifiee(secretaireRole)) {
      throw new Error("Cette demande ne relève pas de votre secrétariat");
    }
  }

  // Décision, changement de statut et restitution des jours : atomiques, comme
  // reviewIntermediaire (chaque écriture est conditionnelle "en_attente", donc rejouer
  // ou doubler la décision ne peut pas restituer les jours deux fois).
  const updated = await pool.withTransaction(async (client) => {
    const row = await congeRepository.setDecisionSecretariat(id, decision, avis, client);
    if (!row) throw new Error('Cette demande a déjà été vérifiée par le secrétariat');

    if (decision === 'refusee') {
      const refused = await congeRepository.updateStatus(id, 'refusee', null, avis, client);
      if (!refused) throw new Error('Demande introuvable ou déjà traitée');
      await restituerJoursSiCongeAnnuel(demande, client);
    }
    return row;
  });

  if (decision === 'refusee') {
    await notificationRepository.create({
      senderId: secretaireUserId,
      recipientId: demande.user_id,
      title: 'Congé renvoyé par le secrétariat',
      message: `Votre demande de "${demande.type_conge}" a été renvoyée par le secrétariat${avis ? ` : ${avis}` : ''}.`,
      type: 'conge',
    });
  } else {
    // Le circuit existant démarre ici, inchangé : avis du chef de service si un
    // validateur a été assigné à la création, sinon décision RH directe.
    if (demande.validateur_id) {
      await notificationRepository.create({
        senderId: secretaireUserId,
        recipientId: demande.validateur_id,
        title: 'Nouvelle demande de congé (votre équipe)',
        message: `Une demande de "${demande.type_conge}" a été vérifiée par le secrétariat et attend votre avis.`,
        type: 'conge',
      });
    } else {
      const admins = await userRepository.listActive({ role: 'ADMIN_RH' });
      for (const admin of admins) {
        await notificationRepository.create({
          senderId: secretaireUserId,
          recipientId: admin.id,
          title: 'Nouvelle demande de congé',
          message: `Une demande de "${demande.type_conge}" a été vérifiée par le secrétariat.`,
          type: 'conge',
        });
      }
    }
  }

  await activityLogRepository.create(secretaireUserId, 'conge_avis_secretariat', `Demande #${id} : vérification secrétariat "${decision}"`);
  return updated;
}

async function reviewDemande(id, decision, reviewedBy, avisChefService) {
  if (!['approuvee', 'refusee'].includes(decision)) {
    throw new Error('Décision invalide');
  }

  const demande = await congeRepository.findById(id);
  if (!demande || demande.status !== 'en_attente') {
    throw new Error('Demande introuvable ou déjà traitée');
  }
  if (demande.decision_intermediaire === 'en_attente') {
    throw new Error("Cette demande attend encore l'avis du responsable direct");
  }
  if (demande.decision_secretariat !== 'approuvee') {
    throw new Error('Cette demande attend encore la vérification du secrétariat');
  }
  if (decision === 'approuvee' && JUSTIFICATIF_REQUIS_VALIDATION.includes(demande.type_conge) && !demande.justificatif_path) {
    throw new Error('Un justificatif est requis avant de valider ce type de congé');
  }

  const updated = await pool.withTransaction(async (client) => {
    const row = await congeRepository.updateStatus(id, decision, reviewedBy, avisChefService, client);
    if (!row) throw new Error('Demande introuvable ou déjà traitée');
    if (decision === 'refusee') await restituerJoursSiCongeAnnuel(demande, client);
    return row;
  });

  await notificationRepository.create({
    senderId: reviewedBy,
    recipientId: demande.user_id,
    title: decision === 'approuvee' ? 'Congé approuvé' : 'Congé refusé',
    message: `Votre demande de "${demande.type_conge}" du ${demande.date_debut} au ${demande.date_fin} a été ${decision === 'approuvee' ? 'approuvée' : 'refusée'}.`,
    type: 'conge',
  });

  await activityLogRepository.create(reviewedBy, 'conge_traite', `Demande de congé #${id} ${decision === 'approuvee' ? 'approuvée' : 'refusée'}`);

  return updated;
}

async function getRecentDemandes(limit) {
  return congeRepository.findRecent(limit);
}

async function getCalendarDemandes(year, month) {
  return congeRepository.findForMonth(year, month);
}

// Le QR est un plus : sans clé de signature (ou en cas d'erreur), la fiche s'affiche
// quand même, avec l'avis favorable en texte.
async function qrAvisOuNull(congeId) {
  if (!verificationService.qrDisponible()) return null;
  try {
    return await verificationService.genererQrAvis(congeId);
  } catch (err) {
    console.error('[conges] QR d\'avis non généré :', err.message);
    return null;
  }
}

async function getDemandeDetails(id, requestingUser) {
  const demande = await congeRepository.findByIdWithDetails(id);
  if (!demande) throw new Error('Demande introuvable');

  const isOwner = demande.user_id === requestingUser.id;
  const isAdmin = requestingUser.role === 'ADMIN_RH' || requestingUser.role === 'SUPERADMIN';
  const isValidateur = demande.validateur_id === requestingUser.id;
  const isSecretaire = requestingUser.role === 'SECRETAIRE_PE' || requestingUser.role === 'SECRETAIRE_PAT';
  if (!isOwner && !isAdmin && !isValidateur && !isSecretaire) throw new Error('Accès refusé à cette demande');

  // Chiffres « à la date de la demande » (numeric -> nombre) et QR de l'avis favorable
  // qui remplace la signature du chef de service.
  const nombre = (v) => (v === null || v === undefined ? null : Number(v));
  return {
    ...demande,
    solde_avant: nombre(demande.solde_avant),
    solde_apres: nombre(demande.solde_apres),
    avis_qr: demande.decision_intermediaire === 'approuvee' ? await qrAvisOuNull(demande.id) : null,
  };
}

async function getJustificatifPourTelechargement(id, requestingUser) {
  const demande = await congeRepository.findById(id);
  if (!demande) throw new Error('Demande introuvable');
  if (!demande.justificatif_path) throw new Error('Aucun justificatif pour cette demande');

  const isOwner = demande.user_id === requestingUser.id;
  const isAdmin = requestingUser.role === 'ADMIN_RH' || requestingUser.role === 'SUPERADMIN';
  const isValidateur = demande.validateur_id === requestingUser.id;
  const isSecretaire = requestingUser.role === 'SECRETAIRE_PE' || requestingUser.role === 'SECRETAIRE_PAT';
  if (!isOwner && !isAdmin && !isValidateur && !isSecretaire) throw new Error('Accès refusé à ce document');

  return demande;
}

async function getSolde(userId) {
  const user = await userRepository.findById(userId);
  if (!user || !user.personnel_id) throw new Error('Aucune fiche personnel associée à ce compte');
  return congeDroitsService.getSoldeDetails(userId, user.personnel_id);
}

module.exports = {
  getSolde, createDemande, getMyDemandes, getPendingDemandes, reviewDemande,
  getRecentDemandes, getCalendarDemandes, getDemandeDetails,
  getPendingForValidateur, reviewIntermediaire, uploadJustificatif,
  getJustificatifPourTelechargement,
  getPendingForSecretariat, reviewSecretariat,
};