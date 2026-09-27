const carriereRepository = require('../repositories/carriereRepository');
const personnelRepository = require('../repositories/personnelRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const corbeilleRepository = require('../repositories/corbeilleRepository');
const grilleIndiciaireService = require('./grilleIndiciaireService');

// Si `resolveFromGrille` est fourni, l'indice/classe/échelon viennent de la grille
// réglementaire (jamais de la saisie libre) ; sinon comportement inchangé (texte
// libre, indice_source='SAISIE_RH') — rétrocompatible avec les événements existants.
async function resoudreDepuisGrille(data, personnel) {
  if (!data.resolveFromGrille) {
    const { indiceNum } = grilleIndiciaireService.parseIndiceAffiche(data.indice);
    return {
      corps: data.corps, classe: data.classe, echelon: data.echelon, indice: data.indice,
      ligneGrilleId: null, indiceNum, indiceSource: data.indice ? 'SAISIE_RH' : 'A_CONFIRMER',
    };
  }
  // `corps` ici est la valeur réglementaire d'un texte corps-spécifique (rare) —
  // à ne pas confondre avec `personnel.corps`, qui dans ce projet sert de régime
  // (EFA/ELD/Fonctionnaire), utilisé seulement pour dériver `regime` et pour
  // l'affichage legacy, jamais comme critère de correspondance de la grille.
  const { cadre, echelle, categorie, corps, classe, echelon } = data.resolveFromGrille;
  const displayCorps = corps || data.corps || personnel.corps;
  const regime = data.resolveFromGrille.regime || grilleIndiciaireService.regimeDepuisCorps(displayCorps);
  const resolution = await grilleIndiciaireService.resolveIndice({
    regime, cadre, echelle, categorie, corps, classe, echelon,
    dateEffet: data.dateEffet || data.dateEvenement,
  });
  return {
    corps: displayCorps,
    classe: resolution.classe,
    echelon: String(resolution.echelon),
    indice: resolution.display,
    ligneGrilleId: resolution.ligneGrilleId,
    indiceNum: resolution.indice,
    indiceSource: 'REGLEMENTAIRE',
  };
}

// Recalcule la situation "courante" de personnel à partir de l'événement de
// carrière le plus récent (par date d'effet, sinon date d'événement) parmi tous
// ceux connus — pas seulement celui qu'on vient d'écrire, pour rester correct
// même en cas de saisie rétroactive (prompt §14).
async function syncPersonnelDepuisHistorique(personnelId) {
  const evenements = await carriereRepository.findEvenementsByPersonnel(personnelId);
  const plusRecentAvecSituation = evenements
    .filter((e) => e.classe || e.echelon || e.indice)
    .sort((a, b) => {
      const diff = new Date(b.date_effet || b.date_evenement) - new Date(a.date_effet || a.date_evenement);
      // À date d'effet égale, l'événement saisi le plus récemment (id le plus grand)
      // représente la dernière correction/décision RH connue pour cette date.
      return diff !== 0 ? diff : b.id - a.id;
    })[0];
  if (!plusRecentAvecSituation) return;

  await personnelRepository.syncSituationCourante(personnelId, {
    classe: plusRecentAvecSituation.classe,
    echelon: plusRecentAvecSituation.echelon,
    indice: plusRecentAvecSituation.indice,
    indiceNum: plusRecentAvecSituation.indice_num,
    indiceSource: plusRecentAvecSituation.indice_source,
    ligneGrilleActuelleId: plusRecentAvecSituation.ligne_grille_id,
  });
}

async function addEvenement(personnelId, data, createdBy) {
  const personnel = await personnelRepository.findByIdRaw(personnelId);
  if (!personnel) throw new Error('Fiche personnel introuvable');

  const resolu = await resoudreDepuisGrille(data, personnel);

  const ancienneSituation = {
    corps: personnel.corps, grade: personnel.grade, classe: personnel.classe, echelon: personnel.echelon,
    indice: personnel.indice, fonction: personnel.fonction, service: personnel.service, direction: personnel.direction,
  };
  const nouvelleSituation = {
    corps: resolu.corps || null, grade: data.grade || null, classe: resolu.classe || null, echelon: resolu.echelon || null,
    indice: resolu.indice || null, fonction: data.fonction || null, affectation: data.affectation || null,
  };

  const evenement = await carriereRepository.createEvenement({
    personnelId,
    typeEvenement: data.typeEvenement,
    description: data.description,
    dateEvenement: data.dateEvenement,
    dateEffet: data.dateEffet,
    ancienneSituation,
    nouvelleSituation,
    corps: resolu.corps, grade: data.grade, classe: resolu.classe, echelon: resolu.echelon,
    indice: resolu.indice, fonction: data.fonction, affectation: data.affectation,
    motif: data.motif, referenceDecision: data.referenceDecision, autoriteDecision: data.autoriteDecision,
    observations: data.observations,
    justificatifFilename: data.justificatif?.filename || null,
    justificatifPath: data.justificatif?.path || null,
    createdBy,
    ligneGrilleId: resolu.ligneGrilleId, indiceNum: resolu.indiceNum, indiceSource: resolu.indiceSource,
  });

  if (resolu.classe || resolu.echelon || resolu.indice) {
    await syncPersonnelDepuisHistorique(personnelId);
  }

  await activityLogRepository.create(createdBy, 'carriere_evenement', `Événement "${data.typeEvenement}" ajouté à la carrière (fiche #${personnelId})`);
  return evenement;
}

async function updateEvenement(id, data, updatedBy) {
  const existing = await carriereRepository.findEvenementById(id);
  if (!existing) throw new Error('Événement introuvable');

  await corbeilleRepository.add('carriere_evenement_modifie', existing, updatedBy);

  const justificatifFilename = data.justificatif?.filename || existing.justificatif_filename;
  const justificatifPath = data.justificatif?.path || existing.justificatif_path;

  const personnel = data.resolveFromGrille ? await personnelRepository.findByIdRaw(existing.personnel_id) : null;
  const resolu = data.resolveFromGrille || data.indice !== undefined
    ? await resoudreDepuisGrille({ ...data, dateEvenement: data.dateEvenement ?? existing.date_evenement }, personnel || existing)
    : { corps: existing.corps, classe: existing.classe, echelon: existing.echelon, indice: existing.indice,
        ligneGrilleId: existing.ligne_grille_id, indiceNum: existing.indice_num, indiceSource: existing.indice_source };

  const updated = await carriereRepository.updateEvenement(id, {
    typeEvenement: data.typeEvenement ?? existing.type_evenement,
    description: data.description ?? existing.description,
    dateEvenement: data.dateEvenement ?? existing.date_evenement,
    dateEffet: data.dateEffet ?? existing.date_effet,
    corps: resolu.corps ?? existing.corps,
    grade: data.grade ?? existing.grade,
    classe: resolu.classe ?? existing.classe,
    echelon: resolu.echelon ?? existing.echelon,
    indice: resolu.indice ?? existing.indice,
    fonction: data.fonction ?? existing.fonction,
    affectation: data.affectation ?? existing.affectation,
    motif: data.motif ?? existing.motif,
    referenceDecision: data.referenceDecision ?? existing.reference_decision,
    autoriteDecision: data.autoriteDecision ?? existing.autorite_decision,
    observations: data.observations ?? existing.observations,
    justificatifFilename, justificatifPath,
    updatedBy,
    ligneGrilleId: resolu.ligneGrilleId, indiceNum: resolu.indiceNum, indiceSource: resolu.indiceSource,
  });

  if (resolu.classe || resolu.echelon || resolu.indice) {
    await syncPersonnelDepuisHistorique(existing.personnel_id);
  }

  await activityLogRepository.create(updatedBy, 'carriere_evenement_modifie', `Événement de carrière #${id} modifié (fiche #${existing.personnel_id})`);
  return updated;
}

async function deleteEvenement(id, deletedBy) {
  const existing = await carriereRepository.findEvenementById(id);
  if (!existing) throw new Error('Événement introuvable');

  await corbeilleRepository.add('carriere_evenement_supprime', existing, deletedBy);
  await carriereRepository.deleteEvenement(id);
  if (existing.classe || existing.echelon || existing.indice) {
    await syncPersonnelDepuisHistorique(existing.personnel_id);
  }
  await activityLogRepository.create(deletedBy, 'carriere_evenement_supprime', `Événement de carrière #${id} supprimé (fiche #${existing.personnel_id})`);
}

async function getCarriere(personnelId) {
  const personnel = await personnelRepository.findByIdRaw(personnelId);
  if (!personnel) throw new Error('Fiche personnel introuvable');

  const [evenements, fonctionHistory, diplomes, roles] = await Promise.all([
    carriereRepository.findEvenementsByPersonnel(personnelId),
    carriereRepository.findFonctionHistoryByPersonnel(personnelId),
    carriereRepository.findDiplomesByPersonnel(personnelId),
    personnelRepository.getRoles(personnelId),
  ]);
  personnel.roles = roles;

  const timeline = [
    ...evenements.map((e) => ({
      id: e.id,
      date: e.date_evenement,
      dateEffet: e.date_effet,
      type: e.type_evenement,
      description: e.description,
      corps: e.corps, grade: e.grade, classe: e.classe, echelon: e.echelon, indice: e.indice,
      indiceNum: e.indice_num, indiceSource: e.indice_source,
      codeGrille: e.code_grille_affichage || null,
      indiceSourceTexte: e.grille_source_texte || null, indiceSourceArticle: e.grille_source_article || null,
      fonction: e.fonction, affectation: e.affectation, motif: e.motif,
      referenceDecision: e.reference_decision, autoriteDecision: e.autorite_decision,
      observations: e.observations,
      ancienneSituation: e.ancienne_situation, nouvelleSituation: e.nouvelle_situation,
      justificatifFilename: e.justificatif_filename, justificatifPath: e.justificatif_path,
      source: 'evenement',
    })),
    ...fonctionHistory.map((h) => ({
      date: h.changed_at,
      type: 'Changement de fonction',
      description: `${h.ancienne_fonction || 'Aucune fonction'} → ${h.nouvelle_fonction}`,
      source: 'fonction',
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return { personnel, timeline, diplomes };
}

async function addDiplome(personnelId, { intitule, etablissement, anneeObtention, document }, createdBy) {
  const diplome = await carriereRepository.createDiplome({
    personnelId, intitule, etablissement, anneeObtention,
    documentFilename: document?.filename || null, documentPath: document?.path || null, createdBy,
  });
  await activityLogRepository.create(createdBy, 'diplome_ajoute', `Diplôme "${intitule}" ajouté (fiche #${personnelId})`);
  return diplome;
}

async function deleteDiplome(id, deletedBy) {
  const existing = await carriereRepository.findDiplomeById(id);
  if (!existing) throw new Error('Diplôme introuvable');
  await corbeilleRepository.add('diplome_supprime', existing, deletedBy);
  await carriereRepository.deleteDiplome(id);
  await activityLogRepository.create(deletedBy, 'diplome_supprime', `Diplôme #${id} supprimé (fiche #${existing.personnel_id})`);
}

function checkAccesDocumentPersonnel(personnelId, requestingUser) {
  const isAdmin = requestingUser.role === 'ADMIN_RH' || requestingUser.role === 'SUPERADMIN';
  const isOwner = requestingUser.personnel_id === personnelId;
  if (!isAdmin && !isOwner) throw new Error('Accès refusé à ce document');
}

async function getJustificatifEvenement(id, requestingUser) {
  const evenement = await carriereRepository.findEvenementById(id);
  if (!evenement) throw new Error('Événement introuvable');
  if (!evenement.justificatif_path) throw new Error('Aucun justificatif pour cet événement');
  checkAccesDocumentPersonnel(evenement.personnel_id, requestingUser);
  return evenement;
}

async function getDocumentDiplome(id, requestingUser) {
  const diplome = await carriereRepository.findDiplomeById(id);
  if (!diplome) throw new Error('Diplôme introuvable');
  if (!diplome.document_path) throw new Error('Aucun document pour ce diplôme');
  checkAccesDocumentPersonnel(diplome.personnel_id, requestingUser);
  return diplome;
}

async function getEcheancesProches() {
  return carriereRepository.findEcheancesProches(30);
}

module.exports = {
  addEvenement, updateEvenement, deleteEvenement, getCarriere, getEcheancesProches, addDiplome, deleteDiplome,
  getJustificatifEvenement, getDocumentDiplome,
};