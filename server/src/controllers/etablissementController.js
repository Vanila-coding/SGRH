const etablissementRepository = require('../repositories/etablissementRepository');
const etablissementService = require('../services/etablissementService');

const { EtablissementError } = etablissementService;

function sendError(res, err) {
  if (err instanceof EtablissementError) return res.status(err.status).json({ message: err.message });
  console.error('[etablissement]', err);
  return res.status(500).json({ message: 'Une erreur interne est survenue. Veuillez réessayer.' });
}

async function list(req, res) {
  const etablissements = await etablissementRepository.list();
  return res.status(200).json({ etablissements });
}

async function create(req, res) {
  try {
    const etablissement = await etablissementService.creer(req.body.nom, req.user.id);
    return res.status(201).json({ message: 'Établissement créé', etablissement });
  } catch (err) {
    return sendError(res, err);
  }
}

async function desactiver(req, res) {
  try {
    const etablissement = await etablissementService.changerStatut(req.params.id, 'INACTIF', req.user.id);
    return res.status(200).json({ message: 'Établissement désactivé', etablissement });
  } catch (err) {
    return sendError(res, err);
  }
}

async function reactiver(req, res) {
  try {
    const etablissement = await etablissementService.changerStatut(req.params.id, 'ACTIF', req.user.id);
    return res.status(200).json({ message: 'Établissement réactivé', etablissement });
  } catch (err) {
    return sendError(res, err);
  }
}

module.exports = { list, create, desactiver, reactiver };
