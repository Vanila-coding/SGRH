// Gestion des établissements de l'université (rattachement des PE) par le Superadmin/RH.
// Contrairement aux directions/services (suppression physique bloquée par dépendances),
// un établissement se désactive : jamais de suppression physique, pour ne jamais perdre
// l'historique des enseignants qui y sont ou y étaient rattachés (demande explicite).
const etablissementRepository = require('../repositories/etablissementRepository');
const activityLogRepository = require('../repositories/activityLogRepository');

class EtablissementError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

function nettoyerNom(valeur) {
  const nom = String(valeur || '').trim();
  if (!nom) throw new EtablissementError("Le nom de l'établissement est requis.");
  if (nom.length > 200) throw new EtablissementError("Le nom de l'établissement ne doit pas dépasser 200 caractères.");
  return nom;
}

async function creer(nom, creePar) {
  const nomPropre = nettoyerNom(nom);
  let etablissement;
  try {
    etablissement = await etablissementRepository.create(nomPropre);
  } catch (err) {
    if (err.code === '23505') throw new EtablissementError('Un établissement porte déjà ce nom.', 409);
    throw err;
  }
  await activityLogRepository.create(creePar, 'etablissement_cree', `Établissement créé : ${nomPropre}`);
  return etablissement;
}

async function changerStatut(idRaw, statut, parId) {
  const id = Number(idRaw);
  if (!Number.isInteger(id) || id < 1) throw new EtablissementError('Identifiant d\'établissement invalide.');
  if (!['ACTIF', 'INACTIF'].includes(statut)) throw new EtablissementError('Statut invalide.');

  const etablissement = await etablissementRepository.findById(id);
  if (!etablissement) throw new EtablissementError('Établissement introuvable.', 404);
  if (etablissement.statut === statut) return etablissement;

  const updated = await etablissementRepository.setStatut(id, statut);
  const action = statut === 'INACTIF' ? 'etablissement_desactive' : 'etablissement_reactive';
  const verbe = statut === 'INACTIF' ? 'désactivé' : 'réactivé';
  await activityLogRepository.create(parId, action, `Établissement ${verbe} : ${etablissement.nom}`);
  return updated;
}

module.exports = { EtablissementError, creer, changerStatut };
