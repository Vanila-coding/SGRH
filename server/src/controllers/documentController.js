const documentService = require('../services/documentService');
const personnelRepository = require('../repositories/personnelRepository');

async function generate(req, res) {
  const { personnelId, typeDocument, donnees } = req.body;
  if (!personnelId || !typeDocument) {
    return res.status(400).json({ message: 'personnelId et typeDocument sont requis' });
  }
  try {
    const document = await documentService.generateDocument(personnelId, typeDocument, donnees || {}, req.user.id);
    return res.status(201).json({ message: 'Document généré', document });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function getOne(req, res) {
  try {
    const document = await documentService.getDocument(req.params.id, req.user);
    return res.status(200).json({ document });
  } catch (err) {
    return res.status(err.message === 'Accès refusé à ce document' ? 403 : 404).json({ message: err.message });
  }
}

async function historiquePersonnel(req, res) {
  const historique = await documentService.getHistoriquePersonnel(req.params.personnelId);
  return res.status(200).json({ historique });
}

async function mesDocuments(req, res) {
  const personnel = await personnelRepository.findByUserId(req.user.id);
  if (!personnel) return res.status(404).json({ message: 'Aucune fiche personnel associée' });

  const historique = await documentService.getHistoriquePersonnel(personnel.id);
  return res.status(200).json({ historique });
}

async function demander(req, res) {
  const { typeDocument, motif } = req.body;
  if (!typeDocument) return res.status(400).json({ message: 'typeDocument requis' });

  try {
    const demande = await documentService.demanderDocument(req.user.id, typeDocument, motif);
    return res.status(201).json({ message: 'Demande envoyée', demande });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function mesDemandes(req, res) {
  try {
    const demandes = await documentService.getMesDemandesDocuments(req.user.id);
    return res.status(200).json({ demandes });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function demandesEnAttente(req, res) {
  const demandes = await documentService.getDemandesEnAttente();
  return res.status(200).json({ demandes });
}

async function demandesEnAttenteSecretariat(req, res) {
  const demandes = await documentService.getDemandesEnAttenteSecretariat(req.user.role);
  return res.status(200).json({ demandes });
}

async function reviewSecretariat(req, res) {
  try {
    const demande = await documentService.reviewDemandeSecretariat(req.params.id, req.body.decision, req.user.id, req.user.role, req.body.avis);
    return res.status(200).json({ message: 'Vérification enregistrée', demande });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function traiter(req, res) {
  try {
    const document = await documentService.traiterDemande(req.params.id, req.body.donnees || {}, req.user.id);
    return res.status(200).json({ message: 'Demande traitée', document });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function refuser(req, res) {
  try {
    await documentService.refuserDemande(req.params.id, req.user.id);
    return res.status(200).json({ message: 'Demande refusée' });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

module.exports = {
  generate, getOne, historiquePersonnel, mesDocuments,
  demander, mesDemandes, demandesEnAttente, traiter, refuser,
  demandesEnAttenteSecretariat, reviewSecretariat,
};