const organisationRepository = require('../repositories/organisationRepository');
const organisationService = require('../services/organisationService');
const ExcelJS = require('exceljs');

const { OrganisationError } = organisationService;

function sendError(res, err) {
  if (err instanceof OrganisationError) return res.status(err.status).json({ message: err.message });
  console.error('[organisation]', err);
  return res.status(500).json({ message: 'Une erreur interne est survenue. Veuillez réessayer.' });
}

// Par défaut, seules les entrées actives sont renvoyées (formulaires) ; ?tous=1 pour la gestion.
async function directions(req, res) {
  const list = await organisationRepository.listDirections({ tous: req.query.tous === '1' });
  return res.status(200).json({ directions: list });
}

async function services(req, res) {
  const { directionId } = req.query;
  const list = await organisationRepository.listServices(directionId || null, { tous: req.query.tous === '1' });
  return res.status(200).json({ services: list });
}

async function modifierDirection(req, res) {
  try {
    const direction = await organisationService.modifierDirection(req.params.id, req.body, req.user.id);
    return res.status(200).json({ message: 'Direction mise à jour', direction });
  } catch (err) {
    return sendError(res, err);
  }
}

async function modifierService(req, res) {
  try {
    const service = await organisationService.modifierService(req.params.id, req.body, req.user.id);
    return res.status(200).json({ message: 'Service mis à jour', service });
  } catch (err) {
    return sendError(res, err);
  }
}

const COLONNES_MODELE = [
  { header: 'Direction', key: 'direction', width: 40 },
  { header: 'Service (facultatif)', key: 'service', width: 40 },
];

async function modeleImport(req, res) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Directions et services');
  sheet.columns = COLONNES_MODELE;
  sheet.getRow(1).font = { bold: true };
  sheet.addRow({ direction: 'Direction des Technologies de l’Information', service: 'Service de Maintenance Informatique' });
  sheet.addRow({ direction: 'Direction des Affaires Académiques', service: '' });
  sheet.getRow(2).font = { italic: true, color: { argb: 'FF888888' } };
  sheet.getRow(3).font = { italic: true, color: { argb: 'FF888888' } };

  const aide = workbook.addWorksheet('Instructions');
  aide.getColumn(1).width = 110;
  const lignes = [
    'Mode d’emploi de l’import des directions et services',
    '',
    '1. Une ligne = une direction. Renseignez la colonne Service pour rattacher un service à cette direction.',
    '2. Une direction ou un service déjà existant est réutilisé : il n’est ni dupliqué ni modifié.',
    '3. Supprimez les lignes d’exemple (en grisé) avant d’importer.',
    '4. Pour renommer ou désactiver une entrée, utilisez Directions & services dans l’application.',
    '',
    'Les lignes en erreur sont ignorées et listées après l’import ; le reste est importé.',
  ];
  lignes.forEach((texte, i) => {
    const cellule = aide.getCell(`A${i + 1}`);
    cellule.value = texte;
    if (i === 0) cellule.font = { bold: true, size: 13 };
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="modele-import-directions-services.xlsx"');
  await workbook.xlsx.write(res);
  res.end();
}

async function importer(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Fichier Excel requis' });

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.worksheets[0];

    const rows = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const values = row.values.slice(1);
      const direction = values[0] ? String(values[0]).trim() : '';
      const service = values[1] ? String(values[1]).trim() : '';
      if (!direction && !service) return;
      rows.push({ direction, service });
    });

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Le fichier ne contient aucune ligne de données' });
    }

    const resultat = await organisationService.importerDirectionsServices(rows, req.user.id);
    return res.status(200).json(resultat);
  } catch (err) {
    console.error('[organisation] import Excel', err);
    return res.status(400).json({ message: "Impossible de lire ce fichier. Vérifiez qu'il s'agit bien d'un .xlsx valide." });
  }
}

async function createDirection(req, res) {
  try {
    const direction = await organisationService.creerDirection(req.body.nom, req.user.id);
    return res.status(201).json({ message: 'Direction créée', direction });
  } catch (err) {
    return sendError(res, err);
  }
}

async function deleteDirection(req, res) {
  try {
    await organisationService.supprimerDirection(req.params.id, req.user.id);
    return res.status(200).json({ message: 'Direction supprimée' });
  } catch (err) {
    return sendError(res, err);
  }
}

async function createService(req, res) {
  try {
    const service = await organisationService.creerService(req.body.nom, req.body.directionId, req.user.id);
    return res.status(201).json({ message: 'Service créé', service });
  } catch (err) {
    return sendError(res, err);
  }
}

async function deleteService(req, res) {
  try {
    await organisationService.supprimerService(req.params.id, req.user.id);
    return res.status(200).json({ message: 'Service supprimé' });
  } catch (err) {
    return sendError(res, err);
  }
}

module.exports = {
  directions, services, createDirection, deleteDirection, createService, deleteService,
  modifierDirection, modifierService, modeleImport, importer,
};
