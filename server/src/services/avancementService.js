const personnelRepository = require('../repositories/personnelRepository');
const carriereRepository = require('../repositories/carriereRepository');
const alerteAvancementRepository = require('../repositories/alerteAvancementRepository');
const parametreCarriereRepository = require('../repositories/parametreCarriereRepository');
const grilleIndiciaireService = require('./grilleIndiciaireService');
const carriereService = require('./carriereService');

const PERIODICITE_PAR_DEFAUT_ANNEES = 2; // Loi n°2003-011, Art.47 — utilisé seulement si le paramètre configurable est absent/invalide.

async function periodiciteEchelonAnnees() {
  const param = await parametreCarriereRepository.findByCle('avancement_echelon_periodicite_annees');
  const valeur = param ? Number(param.valeur) : NaN;
  return Number.isFinite(valeur) && valeur > 0 ? valeur : PERIODICITE_PAR_DEFAUT_ANNEES;
}

// Pure lecture : ne modifie jamais personnel/carriere_evenements. Distingue
// l'éligibilité théorique (date atteinte) du traitement administratif (prompt §10).
async function calculerEcheanceTheorique(personnelId) {
  const personnel = await personnelRepository.findByIdRaw(personnelId);
  if (!personnel) throw new Error('Fiche personnel introuvable');

  const evenements = await carriereRepository.findEvenementsByPersonnel(personnelId);
  const dernierAvecEchelon = evenements
    .filter((e) => e.echelon && (e.date_effet || e.date_evenement))
    .sort((a, b) => {
      const diff = new Date(b.date_effet || b.date_evenement) - new Date(a.date_effet || a.date_evenement);
      return diff !== 0 ? diff : b.id - a.id;
    })[0];

  const dateEntreeEchelon = dernierAvecEchelon
    ? (dernierAvecEchelon.date_effet || dernierAvecEchelon.date_evenement)
    : (personnel.date_prise_fonction || personnel.date_recrutement);

  if (!dateEntreeEchelon) return null; // pas assez de données pour calculer une échéance — jamais devinée

  const periodicite = await periodiciteEchelonAnnees();
  const date = new Date(dateEntreeEchelon);
  date.setFullYear(date.getFullYear() + periodicite);

  return {
    personnelId,
    dateEntreeEchelon,
    dateEcheanceTheorique: date.toISOString().slice(0, 10),
    // Si aucun événement de carrière ne trace l'entrée dans l'échelon actuel, on se
    // rabat sur la date de prise de fonction/recrutement — c'est une approximation
    // explicitement signalée, pas une donnée réglementaire certaine.
    sourceDate: dernierAvecEchelon ? 'carriere_evenements' : 'personnel.date_prise_fonction_ou_recrutement (à confirmer : aucun événement d\'entrée en échelon enregistré)',
    classeActuelle: dernierAvecEchelon?.classe || personnel.classe || null,
    echelonActuel: dernierAvecEchelon?.echelon ? Number(dernierAvecEchelon.echelon) : (personnel.echelon ? Number(personnel.echelon) : null),
  };
}

// Alimente les alertes ouvertes — jamais d'écriture sur personnel/carriere_evenements.
async function scannerAlertes() {
  const personnels = await personnelRepository.listAll();
  const nouvellesAlertes = [];

  for (const personnel of personnels) {
    const regime = grilleIndiciaireService.regimeDepuisCorps(personnel.corps);
    if (regime !== 'FONCTIONNAIRE') continue; // Autres régimes : pas de règle vérifiée, on ne signale rien (prompt §21/§36).

    let echeance;
    try {
      echeance = await calculerEcheanceTheorique(personnel.id);
    } catch {
      continue;
    }
    if (!echeance || !echeance.classeActuelle || !echeance.echelonActuel) continue;

    if (new Date(echeance.dateEcheanceTheorique) <= new Date()) {
      const alerte = await alerteAvancementRepository.creerSiAbsente({
        personnelId: personnel.id,
        type: 'AVANCEMENT_ECHELON_ECHU',
        dateEcheanceTheorique: echeance.dateEcheanceTheorique,
        details: echeance,
      });
      if (alerte) nouvellesAlertes.push({ alerte, personnel });
    }
  }
  return nouvellesAlertes;
}

async function listerAlertesOuvertes(personnelId) {
  return alerteAvancementRepository.findOuvertes({ personnelId });
}

// RH valide une alerte d'échelon échu : résout le nouvel échelon via la grille et
// crée l'événement de carrière correspondant. N'écrit jamais automatiquement sans
// cette validation explicite (prompt §10.B).
async function traiterAvancementEchelon(alerteId, { categorie, cadre, echelle, dateEffet, referenceDecision, autoriteDecision }, traitePar) {
  const alerte = await alerteAvancementRepository.findById(alerteId);
  if (!alerte) throw new Error('Alerte introuvable');
  if (alerte.statut !== 'OUVERTE') throw new Error('Cette alerte a déjà été traitée ou ignorée');
  if (alerte.type !== 'AVANCEMENT_ECHELON_ECHU') throw new Error('Cette alerte n\'est pas une échéance d\'avancement d\'échelon');

  const personnel = await personnelRepository.findByIdRaw(alerte.personnel_id);
  if (!personnel) throw new Error('Fiche personnel introuvable');

  const classeActuelle = alerte.details?.classeActuelle;
  const echelonActuel = alerte.details?.echelonActuel;
  const maxEchelon = classeActuelle === 'CLASSE_EXCEPTIONNELLE' ? 2 : 3;
  const nouvelEchelon = Number(echelonActuel) + 1;
  if (nouvelEchelon > maxEchelon) {
    throw new Error(`L'agent est déjà au dernier échelon de la classe "${classeActuelle}" : il s'agit d'un avancement de classe, pas d'un avancement d'échelon.`);
  }

  const evenement = await carriereService.addEvenement(alerte.personnel_id, {
    typeEvenement: 'Avancement d\'échelon',
    dateEvenement: dateEffet,
    dateEffet,
    referenceDecision,
    autoriteDecision,
    motif: 'Avancement automatique d\'échelon après ancienneté réglementaire (Loi n°2003-011, Art.47)',
    resolveFromGrille: { regime: 'FONCTIONNAIRE', cadre, echelle, categorie, classe: classeActuelle, echelon: nouvelEchelon },
  }, traitePar);

  await alerteAvancementRepository.marquerTraitee(alerteId, { evenementResultantId: evenement.id, traitePar });
  return evenement;
}

async function ignorerAlerte(alerteId, traitePar) {
  const alerte = await alerteAvancementRepository.marquerIgnoree(alerteId, traitePar);
  if (!alerte) throw new Error('Alerte introuvable');
  return alerte;
}

// Application STRICTE de l'Art.49 (Loi n°2003-011) / Décret n°2005-134 : mécanisme
// étroit réservé au fonctionnaire ayant 2 ans dans le 2e échelon de la classe
// exceptionnelle, proche de la retraite. Ne généralise jamais à un "reclassement"
// générique (prompt §12) — c'est un calcul de proposition, jamais une écriture directe.
async function calculerReclassementIndiciaire(personnelId, dateEffet) {
  const personnel = await personnelRepository.findByIdRaw(personnelId);
  if (!personnel) throw new Error('Fiche personnel introuvable');
  if (personnel.classe !== 'CLASSE_EXCEPTIONNELLE' || Number(personnel.echelon) !== 2) {
    throw new Error('Le reclassement indiciaire (Art.49 / Décret n°2005-134) ne s\'applique qu\'au 2e échelon de la classe exceptionnelle.');
  }
  const ageLimiteParam = await parametreCarriereRepository.findByCle('retraite_age_legal_annees');
  const ageLimite = ageLimiteParam ? Number(ageLimiteParam.valeur) : null;
  if (ageLimite && personnel.date_naissance) {
    const age = Math.floor((new Date(dateEffet) - new Date(personnel.date_naissance)) / (365.25 * 24 * 3600 * 1000));
    if (age >= ageLimite) {
      throw new Error('L\'agent a atteint la limite d\'âge pour l\'admission à la retraite : le reclassement de l\'Art.49 ne s\'applique plus.');
    }
  }
  // Majoration de 100 points tous les 2 ans, plafonnée à 500 (cadre A / échelle A1
  // uniquement — Décret n°2005-134, Art.3). Pour les autres cadres, la règle est
  // "indice immédiatement supérieur du cadre/échelle immédiatement supérieur", ce
  // qui suppose le classement cadre/échelle complet non disponible ici (voir README).
  if (personnel.cadre === 'A' && personnel.echelle === 'A1') {
    const majoration = 100; // une seule majoration par déclenchement ; répétable tous les 2 ans (cf. Art.3), plafond 500
    return {
      type: 'MAJORATION_INDICE_CADRE_A1',
      majoration,
      plafond: 500,
      source: 'Loi n°2003-011 Art.49 ; Décret n°2005-134 Art.3',
    };
  }
  throw new Error('Reclassement indiciaire non calculable automatiquement pour ce cadre/échelle : le classement hiérarchique cadre/échelle complet n\'a pas été localisé (voir README) — traitement manuel RH requis.');
}

module.exports = {
  calculerEcheanceTheorique, scannerAlertes, listerAlertesOuvertes,
  traiterAvancementEchelon, ignorerAlerte, calculerReclassementIndiciaire,
};
