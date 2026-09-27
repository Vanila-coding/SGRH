const documentRepository = require('../repositories/documentRepository');
const demandeDocumentRepository = require('../repositories/demandeDocumentRepository');
const personnelRepository = require('../repositories/personnelRepository');
const notificationRepository = require('../repositories/notificationRepository');
const userRepository = require('../repositories/userRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const congeDocumentsService = require('./congeDocumentsService');
const pool = require('../config/db');

// Types qu'un agent peut demander, et types que la RH peut générer (la décision
// d'octroi est établie à partir d'un congé approuvé, jamais demandée par l'agent).
const TYPES_VALIDES = ['certificat_administratif', 'lettre_confirmation', 'etat_conge'];
const TYPES_GENERABLES = [...TYPES_VALIDES, 'decision_conge'];

async function generateDocument(personnelId, typeDocument, donnees, generePar) {
  if (!TYPES_GENERABLES.includes(typeDocument)) {
    throw new Error('Type de document invalide');
  }
  const personnel = await personnelRepository.findByIdRaw(personnelId);
  if (!personnel) throw new Error('Fiche personnel introuvable');

  // Numéro, contrôle d'unicité (une décision par congé) et insertion dans une même
  // transaction, sous verrou consultatif par type et par année.
  const document = await pool.withTransaction(async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`doc:${typeDocument}:${new Date().getFullYear()}`]);

    let donneesFinales = donnees;
    if (typeDocument === 'decision_conge') {
      donneesFinales = await congeDocumentsService.construireDonneesDecision(donnees, personnelId, client);
    } else if (typeDocument === 'etat_conge') {
      donneesFinales = await congeDocumentsService.construireDonneesEtat(personnelId, client);
    }

    const numero = await documentRepository.genererNumero(typeDocument, client);
    return documentRepository.create({ personnelId, typeDocument, donnees: { ...donneesFinales, numero }, generePar }, client);
  });

  await activityLogRepository.create(
    generePar, 'document_genere',
    `Document "${typeDocument}" (${document.donnees.numero}) généré pour ${personnel.prenom} ${personnel.nom}`
  );

  return document;
}

async function getDocument(id, requestingUser) {
  const document = await documentRepository.findById(id);
  if (!document) throw new Error('Document introuvable');

  const isAdmin = requestingUser.role === 'ADMIN_RH' || requestingUser.role === 'SUPERADMIN';
  const isOwner = requestingUser.personnel_id === document.personnel_id;
  if (!isAdmin && !isOwner) throw new Error('Accès refusé à ce document');

  return document;
}

async function getHistoriquePersonnel(personnelId) {
  return documentRepository.findByPersonnel(personnelId);
}

async function demanderDocument(userId, typeDocument, motif) {
  if (!TYPES_VALIDES.includes(typeDocument)) {
    throw new Error('Type de document invalide');
  }
  const user = await userRepository.findById(userId);
  if (!user || !user.personnel_id) throw new Error('Aucune fiche personnel associée à ce compte');

  const demande = await demandeDocumentRepository.create({ personnelId: user.personnel_id, typeDocument, motif });

  // La notification du RH n'a lieu qu'une fois le secrétariat satisfait — voir
  // reviewDemandeSecretariat. À la création, seul le secrétariat de la catégorie du
  // demandeur (et le RH en repli anti-blocage) est prévenu.
  const secretaires = await userRepository.listActive({ role: user.role === 'PE' ? 'SECRETAIRE_PE' : 'SECRETAIRE_PAT' });
  const admins = await userRepository.listActive({ role: 'ADMIN_RH' });
  for (const destinataire of [...secretaires, ...admins]) {
    await notificationRepository.create({
      senderId: userId,
      recipientId: destinataire.id,
      title: 'Nouvelle demande de document à vérifier',
      message: `${user.prenom} ${user.nom} demande un document : ${typeDocument}.`,
      type: 'info',
    });
  }

  await activityLogRepository.create(userId, 'document_demande', `Demande de document "${typeDocument}" soumise`);
  return demande;
}

async function getDemandesEnAttenteSecretariat(secretaireRole) {
  const roleCible = secretaireRole === 'SECRETAIRE_PE' ? 'PE' : secretaireRole === 'SECRETAIRE_PAT' ? 'PAT' : null;
  return demandeDocumentRepository.findPendingForSecretariat(roleCible);
}

async function reviewDemandeSecretariat(demandeId, decision, secretaireUserId, secretaireRole, avis) {
  if (!['approuvee', 'refusee'].includes(decision)) {
    throw new Error('Décision invalide');
  }
  const demande = await demandeDocumentRepository.findById(demandeId);
  if (!demande) throw new Error('Demande introuvable');
  if (demande.decision_secretariat !== 'en_attente') {
    throw new Error('Cette demande a déjà été vérifiée par le secrétariat');
  }

  const requesterUserId = await personnelRepository.findLinkedUserId(demande.personnel_id);
  const requester = requesterUserId ? await userRepository.findById(requesterUserId) : null;
  const roleCible = secretaireRole === 'SECRETAIRE_PE' ? 'PE' : secretaireRole === 'SECRETAIRE_PAT' ? 'PAT' : null;
  if (roleCible && requester?.role !== roleCible) {
    throw new Error("Cette demande ne relève pas de votre secrétariat");
  }

  const updated = await demandeDocumentRepository.setDecisionSecretariat(demandeId, decision, avis);
  if (!updated) throw new Error('Cette demande a déjà été vérifiée par le secrétariat');

  if (decision === 'refusee') {
    await demandeDocumentRepository.marquerRefusee(demandeId, secretaireUserId);
    if (requesterUserId) {
      await notificationRepository.create({
        senderId: secretaireUserId,
        recipientId: requesterUserId,
        title: 'Demande de document renvoyée par le secrétariat',
        message: `Votre demande de "${demande.type_document}" a été renvoyée par le secrétariat${avis ? ` : ${avis}` : ''}.`,
        type: 'info',
      });
    }
  } else {
    const admins = await userRepository.listActive({ role: 'ADMIN_RH' });
    for (const admin of admins) {
      await notificationRepository.create({
        senderId: secretaireUserId,
        recipientId: admin.id,
        title: 'Nouvelle demande de document',
        message: `Une demande de "${demande.type_document}" a été vérifiée par le secrétariat.`,
        type: 'info',
      });
    }
  }

  await activityLogRepository.create(secretaireUserId, 'document_demande_avis_secretariat', `Demande de document #${demandeId} : vérification secrétariat "${decision}"`);
  return updated;
}

async function getMesDemandesDocuments(userId) {
  const user = await userRepository.findById(userId);
  if (!user || !user.personnel_id) throw new Error('Aucune fiche personnel associée à ce compte');
  return demandeDocumentRepository.findByPersonnel(user.personnel_id);
}

async function getDemandesEnAttente() {
  return demandeDocumentRepository.findPending();
}

async function traiterDemande(demandeId, donnees, traitePar) {
  const demande = await demandeDocumentRepository.findById(demandeId);
  if (!demande || demande.statut !== 'en_attente') {
    throw new Error('Demande introuvable ou déjà traitée');
  }
  if (demande.decision_secretariat !== 'approuvee') {
    throw new Error('Cette demande attend encore la vérification du secrétariat');
  }

  const document = await generateDocument(demande.personnel_id, demande.type_document, donnees, traitePar);
  await demandeDocumentRepository.marquerTraitee(demandeId, document.id, traitePar);

  const destinataireUserId = await personnelRepository.findLinkedUserId(demande.personnel_id);
  if (destinataireUserId) {
    await notificationRepository.create({
      senderId: traitePar,
      recipientId: destinataireUserId,
      title: 'Document prêt',
      message: `Votre demande de "${demande.type_document}" a été traitée, le document est disponible.`,
      type: 'info',
    });
  }

  await activityLogRepository.create(traitePar, 'document_demande_traitee', `Demande de document #${demandeId} traitée`);
  return document;
}

async function refuserDemande(demandeId, traitePar) {
  const demande = await demandeDocumentRepository.findById(demandeId);
  if (!demande || demande.statut !== 'en_attente') {
    throw new Error('Demande introuvable ou déjà traitée');
  }
  if (demande.decision_secretariat !== 'approuvee') {
    throw new Error('Cette demande attend encore la vérification du secrétariat');
  }
  const result = await demandeDocumentRepository.marquerRefusee(demandeId, traitePar);

  const destinataireUserId = await personnelRepository.findLinkedUserId(demande.personnel_id);
  if (destinataireUserId) {
    await notificationRepository.create({
      senderId: traitePar,
      recipientId: destinataireUserId,
      title: 'Demande de document refusée',
      message: `Votre demande de "${demande.type_document}" a été refusée.`,
      type: 'info',
    });
  }

  await activityLogRepository.create(traitePar, 'document_demande_refusee', `Demande de document #${demandeId} refusée`);
  return result;
}

module.exports = {
  generateDocument, getDocument, getHistoriquePersonnel, TYPES_VALIDES,
  demanderDocument, getMesDemandesDocuments, getDemandesEnAttente, traiterDemande, refuserDemande,
  getDemandesEnAttenteSecretariat, reviewDemandeSecretariat,
};