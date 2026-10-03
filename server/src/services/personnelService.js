const personnelRepository = require('../repositories/personnelRepository');
const activityLogRepository = require('../repositories/activityLogRepository');
const organisationRepository = require('../repositories/organisationRepository');
const { sendRegistrationLinkEmail } = require('../config/mailer');
const corbeilleRepository = require('../repositories/corbeilleRepository');
const grilleIndiciaireService = require('./grilleIndiciaireService');
const { normaliserClasse, normaliserEchelon } = require('../utils/normalisationCarriere');

const ROLES_VALIDES = ['PE', 'PAT'];

async function createPersonnel(data, createdBy) {
  const existing = await personnelRepository.findByMatricule(data.matricule);
  if (existing) throw new Error('Ce matricule existe déjà');

  const roles = Array.isArray(data.roles) && data.roles.length > 0 ? data.roles : (data.role ? [data.role] : []);
  if (roles.length === 0) throw new Error('Au moins un rôle (PE ou PAT) est requis');

  // Un PE n'est jamais secrétaire : la désignation n'est acceptée que pour un agent PAT.
  if (data.secretariatRole && !roles.includes('PAT')) {
    throw new Error('Seul un agent PAT peut être désigné secrétaire');
  }
  if (data.secretariatRole && !['SECRETAIRE_PE', 'SECRETAIRE_PAT'].includes(data.secretariatRole)) {
    throw new Error('Catégorie de secrétariat invalide');
  }

  const personnel = await personnelRepository.create({ ...data, role: roles[0], secretariatRole: data.secretariatRole || null });
  await personnelRepository.setRoles(personnel.id, roles);
  if (roles.includes('PE') && data.peInfos) {
    await personnelRepository.upsertPeInfos(personnel.id, data.peInfos);
  }
  await organisationRepository.syncResponsable(personnel.id, data.fonction, data.service, data.direction);
  await activityLogRepository.create(createdBy, 'personnel_cree', `Fiche personnel créée : ${data.matricule} — ${[data.nom, data.prenom].filter(Boolean).join(' ')}`);
  return personnel;
}

async function updatePersonnel(id, data, updatedBy) {
  const existing = await personnelRepository.findByIdRaw(id);
  if (!existing) throw new Error('Fiche personnel introuvable');

  if (data.email && data.email !== existing.email) {
    const emailTaken = await personnelRepository.findByEmailRaw(data.email);
    if (emailTaken && emailTaken.id !== existing.id) {
      throw new Error('Cet email est déjà utilisé par une autre fiche');
    }
  }

  await corbeilleRepository.add('personnel_modifie', existing, updatedBy);

  // Si la fiche est éditée via la grille (resolveFromGrille), l'indice vient de la
  // grille réglementaire et devient la référence ; sinon comportement inchangé
  // (texte libre, indice_source réévalué seulement si l'indice a changé).
  let classe = data.classe ?? existing.classe;
  let echelon = data.echelon ?? existing.echelon;
  let indice = data.indice ?? existing.indice;
  let indiceNum = existing.indice_num;
  let indiceSource = existing.indice_source;
  let ligneGrilleActuelleId = existing.ligne_grille_actuelle_id;

  if (data.resolveFromGrille) {
    const { cadre, echelle, categorie, classe: classeGrille, echelon: echelonGrille } = data.resolveFromGrille;
    const regime = data.resolveFromGrille.regime || grilleIndiciaireService.regimeDepuisCorps(data.corps ?? existing.corps);
    const resolution = await grilleIndiciaireService.resolveIndice({
      regime, cadre, echelle, categorie, classe: classeGrille, echelon: echelonGrille, dateEffet: new Date().toISOString().slice(0, 10),
    });
    classe = resolution.classe;
    echelon = String(resolution.echelon);
    indice = resolution.display;
    indiceNum = resolution.indice;
    indiceSource = 'REGLEMENTAIRE';
    ligneGrilleActuelleId = resolution.ligneGrilleId;
  } else if (data.indice !== undefined && data.indice !== existing.indice) {
    indiceNum = grilleIndiciaireService.parseIndiceAffiche(data.indice).indiceNum;
    indiceSource = data.indice ? 'SAISIE_RH' : 'A_CONFIRMER';
    ligneGrilleActuelleId = null;
  }

  const updated = await personnelRepository.updateFiche(id, {
    nom: data.nom ?? existing.nom,
    prenom: data.prenom ?? existing.prenom,
    email: data.email ?? existing.email,
    corps: data.corps ?? existing.corps,
    grade: data.grade ?? existing.grade,
    poste: data.poste ?? existing.poste,
    service: data.service ?? existing.service,
    direction: data.direction ?? existing.direction,
    telephone: data.telephone ?? existing.telephone,
    typeContrat: data.typeContrat ?? existing.type_contrat,
    dateRecrutement: data.dateRecrutement ?? existing.date_recrutement,
    dateEcheanceContrat: data.dateEcheanceContrat ?? existing.date_echeance_contrat,
    contratPermanent: data.contratPermanent ?? existing.contrat_permanent,
    classe, echelon, indice, indiceNum, indiceSource, ligneGrilleActuelleId,
    chapitreIb: data.chapitreIb ?? existing.chapitre_ib,
    categorieId: data.categorieId ?? existing.categorie_id,
  });

  await organisationRepository.syncResponsable(id, existing.fonction, updated.service, updated.direction);

  // Rôles PE/PAT et informations PE optionnels dans cette mise à jour : absents,
  // le rôle et les infos PE existants restent inchangés (comportement historique).
  if (Array.isArray(data.roles)) {
    const roles = await personnelRepository.setRoles(id, data.roles);
    if (roles.includes('PE') && data.peInfos) {
      await personnelRepository.upsertPeInfos(id, data.peInfos);
    } else if (!roles.includes('PE')) {
      await personnelRepository.removePeInfos(id);
    }
  } else if (data.peInfos) {
    await personnelRepository.upsertPeInfos(id, data.peInfos);
  }

  await activityLogRepository.create(updatedBy, 'personnel_modifie_par_rh', `Fiche personnel #${id} modifiée par le RH`);

  return updated;
}

async function listPersonnel() {
  return personnelRepository.listAll();
}

async function listWithoutAccount() {
  return personnelRepository.listWithoutAccount();
}

async function sendRegistrationLink(personnelId, sentBy) {
  const personnel = await personnelRepository.findByIdRaw(personnelId);
  if (!personnel) throw new Error('Fiche personnel introuvable');

  const alreadyLinked = await personnelRepository.isLinkedToUser(personnel.id);
  if (alreadyLinked) throw new Error('Cette personne a déjà un compte');

  const registerLink = `${process.env.FRONTEND_URL}/register?email=${encodeURIComponent(personnel.email)}`;
  await sendRegistrationLinkEmail(personnel.email, registerLink);

  await activityLogRepository.create(sentBy, 'lien_inscription_envoye', `Lien d'inscription envoyé à ${personnel.email} (matricule ${personnel.matricule})`);
}

function validateRow(row) {
  const matricule = String(row.matricule || '').trim();
  const role = String(row.role || '').trim().toUpperCase();
  const email = String(row.email || '').trim();

  if (!/^[0-9]{6}$/.test(matricule)) return 'Matricule invalide (doit contenir exactement 6 chiffres)';
  if (!ROLES_VALIDES.includes(role)) return 'Rôle invalide (doit être PE ou PAT)';
  if (!email || !email.includes('@')) return 'Email invalide ou manquant';
  if (!row.nom) return 'Nom requis';
  return null;
}

// Classe/échelon/indice sont des colonnes OPTIONNELLES de l'import (absentes = tout
// reste null, comportement inchangé). Quand elles sont fournies mais non reconnues
// ou structurellement incohérentes (Art.46, ex. "2ème classe" échelon 5), la ligne
// n'est PAS rejetée : la valeur brute est conservée telle quelle (indice_source
// 'A_CONFIRMER') et un avertissement est renvoyé au RH, jamais un écrasement
// silencieux (prompt §18).
function resoudreClasseEchelonImport(row) {
  const classeNormalisee = normaliserClasse(row.classe);
  const echelonNum = normaliserEchelon(row.echelon);
  const indiceBrut = row.indice !== undefined && row.indice !== null && String(row.indice).trim() !== '' ? String(row.indice).trim() : null;
  const { indiceNum } = grilleIndiciaireService.parseIndiceAffiche(indiceBrut);

  if (!row.classe && !row.echelon && !indiceBrut) {
    return { classe: null, echelon: null, indice: null, indiceNum: null, indiceSource: 'A_CONFIRMER', warning: null };
  }

  if (classeNormalisee && echelonNum) {
    try {
      grilleIndiciaireService.validateCoherence({ classe: classeNormalisee, echelon: echelonNum });
      return {
        classe: classeNormalisee, echelon: String(echelonNum), indice: indiceBrut,
        indiceNum, indiceSource: indiceBrut ? 'IMPORT_EXCEL' : 'A_CONFIRMER', warning: null,
      };
    } catch (err) {
      return {
        classe: String(row.classe).trim(), echelon: String(row.echelon).trim(), indice: indiceBrut,
        indiceNum, indiceSource: 'A_CONFIRMER', warning: err.message,
      };
    }
  }

  return {
    classe: row.classe ? String(row.classe).trim() : null,
    echelon: row.echelon ? String(row.echelon).trim() : null,
    indice: indiceBrut, indiceNum, indiceSource: 'A_CONFIRMER',
    warning: (row.classe || row.echelon)
      ? 'Classe/échelon non reconnus tels quels : valeur conservée sans validation réglementaire, à vérifier.'
      : null,
  };
}

async function importFromRows(rows, importedBy) {
  const results = { inserted: 0, errors: [], warnings: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNumber = i + 2;

    const validationError = validateRow(row);
    if (validationError) {
      results.errors.push({ line: lineNumber, reason: validationError });
      continue;
    }

    const matricule = String(row.matricule).trim();
    const email = String(row.email).trim();

    try {
      const existingMatricule = await personnelRepository.findByMatricule(matricule);
      if (existingMatricule) {
        results.errors.push({ line: lineNumber, reason: `Matricule ${matricule} déjà existant, ligne ignorée` });
        continue;
      }
      const existingEmail = await personnelRepository.findByEmailRaw(email);
      if (existingEmail) {
        results.errors.push({ line: lineNumber, reason: `Email ${email} déjà existant, ligne ignorée` });
        continue;
      }

      const fonction = row.fonction ? String(row.fonction).trim() : null;
      const service = row.service ? String(row.service).trim() : null;
      const direction = row.direction ? String(row.direction).trim() : null;
      const carriereResolue = resoudreClasseEchelonImport(row);

      const roleImporte = String(row.role).trim().toUpperCase();
      const personnel = await personnelRepository.create({
        matricule,
        nom: String(row.nom).trim(),
        prenom: row.prenom ? String(row.prenom).trim() : null,
        email,
        role: roleImporte,
        fonction,
        corps: row.corps ? String(row.corps).trim() : null,
        grade: row.grade ? String(row.grade).trim() : null,
        service,
        direction,
        telephone: row.telephone ? String(row.telephone).trim() : null,
        typeContrat: row.type_contrat ? String(row.type_contrat).trim() : null,
        classe: carriereResolue.classe, echelon: carriereResolue.echelon,
        indice: carriereResolue.indice, indiceNum: carriereResolue.indiceNum, indiceSource: carriereResolue.indiceSource,
      });
      await personnelRepository.setRoles(personnel.id, [roleImporte]);
      await organisationRepository.syncResponsable(personnel.id, fonction, service, direction);
      if (carriereResolue.warning) {
        results.warnings.push({ line: lineNumber, reason: carriereResolue.warning });
      }
      results.inserted++;
    } catch (err) {
      results.errors.push({ line: lineNumber, reason: err.message });
    }
  }

  await activityLogRepository.create(
    importedBy, 'personnel_importe',
    `Import Excel : ${results.inserted} fiche(s) créée(s), ${results.errors.length} erreur(s)`
  );

  return results;
}

async function updateMesInfos(userId, nouvellesInfos) {
  const userRepository = require('./../repositories/userRepository');
  const user = await userRepository.findById(userId);
  if (!user || !user.personnel_id) throw new Error('Aucune fiche personnel associée à ce compte');

  const ancienneFiche = await personnelRepository.findByIdRaw(user.personnel_id);
  if (!ancienneFiche) throw new Error('Fiche personnel introuvable');

  await corbeilleRepository.add('personnel_modifie', ancienneFiche, userId);

  const misAJour = await personnelRepository.updateInfosPersonnelles(user.personnel_id, nouvellesInfos);

  await activityLogRepository.create(userId, 'personnel_infos_modifiees', `Informations personnelles mises à jour (téléphone/adresse/situation familiale)`);

  return misAJour;
}

module.exports = { createPersonnel, updatePersonnel, listPersonnel, listWithoutAccount, sendRegistrationLink, importFromRows, updateMesInfos };