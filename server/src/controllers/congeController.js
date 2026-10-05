const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const congeService = require('../services/congeService');
const congeRepository = require('../repositories/congeRepository');
const congeOuvertureService = require('../services/congeOuvertureService');
const { sendUploadedFile } = require('../utils/secureFileServing');
const { isAllowedFile } = require('../utils/fileSignature');

async function create(req, res) {
  const { typeConge, dateDebut, dateFin, motif, lieuJouissance, dateRepriseService, remplacant } = req.body;
  if (!typeConge || !dateDebut || !dateFin) {
    return res.status(400).json({ message: 'typeConge, dateDebut et dateFin sont requis' });
  }
  try {
    const demande = await congeService.createDemande(req.user.id, {
      typeConge, dateDebut, dateFin, motif, lieuJouissance, dateRepriseService, remplacant,
    });
    return res.status(201).json({ message: 'Demande envoyée', demande });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function uploadJustificatif(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Un fichier est requis' });

  const allowedExt = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(req.file.originalname).toLowerCase();
  if (!allowedExt.includes(ext) || !isAllowedFile(req.file.buffer, req.file.originalname, ['pdf', 'jpg', 'png'])) {
    return res.status(400).json({ message: 'Formats acceptés : PDF, JPG, PNG' });
  }

  const filename = `${crypto.randomUUID()}${ext}`;
  const folder = path.join(__dirname, '../../uploads/justificatifs-conges');
  const filepath = path.join(folder, filename);
  const justificatifPath = `/uploads/justificatifs-conges/${filename}`;

  try {
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(filepath, req.file.buffer, { flag: 'wx' });
    const demande = await congeService.uploadJustificatif(req.params.id, req.user.id, {
      filename: req.file.originalname,
      path: justificatifPath,
    });
    return res.status(200).json({ message: 'Justificatif envoyé', demande });
  } catch (err) {
    await fs.unlink(filepath).catch(() => {});
    return res.status(400).json({ message: err.message });
  }
}

async function myDemandes(req, res) {
  const demandes = await congeService.getMyDemandes(req.user.id);
  return res.status(200).json({ demandes });
}

async function solde(req, res) {
  try {
    const result = await congeService.getSolde(req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
}

function envoyerErreurOuverture(res, err) {
  if (err instanceof congeOuvertureService.OuvertureError) return res.status(err.status).json({ message: err.message });
  console.error('[conges-ouverture]', err);
  return res.status(500).json({ message: 'Une erreur interne est survenue. Veuillez réessayer.' });
}

async function suivi(req, res) {
  try {
    return res.status(200).json(await congeOuvertureService.getSuivi(req.params.personnelId));
  } catch (err) {
    return envoyerErreurOuverture(res, err);
  }
}

async function ouverture(req, res) {
  try {
    return res.status(201).json(await congeOuvertureService.saisirOuverture(req.params.personnelId, req.body, req.user.id));
  } catch (err) {
    return envoyerErreurOuverture(res, err);
  }
}

async function sansDecision(req, res) {
  return res.status(200).json({ conges: await congeRepository.findApprouveesSansDecision() });
}

async function pending(req, res) {
  const demandes = await congeService.getPendingDemandes();
  return res.status(200).json({ demandes });
}

async function pendingPourValidateur(req, res) {
  const demandes = await congeService.getPendingForValidateur(req.user.id);
  return res.status(200).json({ demandes });
}

async function reviewIntermediaire(req, res) {
  try {
    const demande = await congeService.reviewIntermediaire(req.params.id, req.body.decision, req.user.id, req.body.avis);
    return res.status(200).json({ message: 'Avis enregistré', demande });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function pendingSecretariat(req, res) {
  const demandes = await congeService.getPendingForSecretariat(req.user.role, req.user.id);
  return res.status(200).json({ demandes });
}

async function reviewSecretariat(req, res) {
  try {
    const demande = await congeService.reviewSecretariat(req.params.id, req.body.decision, req.user.id, req.user.role, req.body.avis);
    return res.status(200).json({ message: 'Vérification enregistrée', demande });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function review(req, res) {
  try {
    const demande = await congeService.reviewDemande(req.params.id, req.body.decision, req.user.id, req.body.avisChefService);
    return res.status(200).json({ message: 'Demande traitée', demande });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function recent(req, res) {
  const demandes = await congeService.getRecentDemandes(5);
  return res.status(200).json({ demandes });
}

async function calendar(req, res) {
  const year = Number(req.query.year) || new Date().getFullYear();
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const demandes = await congeService.getCalendarDemandes(year, month);
  return res.status(200).json({ demandes });
}

async function getOne(req, res) {
  try {
    const demande = await congeService.getDemandeDetails(req.params.id, req.user);
    return res.status(200).json({ demande });
  } catch (err) {
    return res.status(err.message === 'Accès refusé à cette demande' ? 403 : 404).json({ message: err.message });
  }
}

async function telechargerJustificatif(req, res) {
  try {
    const demande = await congeService.getJustificatifPourTelechargement(req.params.id, req.user);
    return sendUploadedFile(res, demande.justificatif_path, demande.justificatif_filename);
  } catch (err) {
    const status = err.message === 'Accès refusé à ce document' ? 403 : 404;
    return res.status(status).json({ message: err.message });
  }
}

module.exports = {
  create, myDemandes, solde, suivi, ouverture, sansDecision, pending, pendingPourValidateur, reviewIntermediaire, review, recent, calendar, getOne, uploadJustificatif,
  telechargerJustificatif, pendingSecretariat, reviewSecretariat,
};