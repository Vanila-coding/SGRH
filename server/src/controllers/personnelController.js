const ExcelJS = require('exceljs');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const pool = require('../config/db');
const personnelRepository = require('../repositories/personnelRepository');
const personnelService = require('../services/personnelService');
const { imageExtension } = require('../utils/imageType');
const { FONCTIONS_PAR_ROLE } = require('../services/userService');

const ROLES_EXCEL = ['PE', 'PAT'];
const CORPS_OPTIONS = ['EFA', 'ELD', 'Fonctionnaire'];
const TYPES_CONTRAT_OPTIONS = ['CDI', 'CDD', 'Vacataire', 'Stagiaire'];
const COLONNES_IMPORT = [
  { header: 'Matricule', key: 'matricule', width: 12 },
  { header: 'Nom', key: 'nom', width: 20 },
  { header: 'Prénom', key: 'prenom', width: 20 },
  { header: 'Email', key: 'email', width: 28 },
  { header: 'Rôle', key: 'role', width: 8 },
  { header: 'Fonction', key: 'fonction', width: 22 },
  { header: 'Corps', key: 'corps', width: 12 },
  { header: 'Grade', key: 'grade', width: 18 },
  { header: 'Service', key: 'service', width: 20 },
  { header: 'Direction', key: 'direction', width: 20 },
  { header: 'Téléphone', key: 'telephone', width: 16 },
  { header: 'Type de contrat', key: 'type_contrat', width: 16 },
  { header: 'Classe', key: 'classe', width: 20 },
  { header: 'Échelon', key: 'echelon', width: 10 },
  { header: 'Indice', key: 'indice', width: 12 },
];

async function me(req, res) {
  const fiche = await personnelRepository.findByUserId(req.user.id);
  return res.status(200).json({ personnel: fiche });
}

// Lecture d'une fiche par un RH (permission view_personnel, vérifiée par la route).
async function getOne(req, res) {
  if (!/^\d+$/.test(req.params.id) || Number(req.params.id) > 2147483647) {
    return res.status(400).json({ message: 'Identifiant du personnel invalide' });
  }
  const fiche = await personnelRepository.findDetailleById(Number(req.params.id));
  if (!fiche) return res.status(404).json({ message: 'Fiche personnel introuvable' });
  return res.status(200).json({ personnel: fiche });
}

async function updatePhoto(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Une image est requise' });

  const extension = imageExtension(req.file.buffer);
  if (!extension) {
    return res.status(400).json({ message: 'Format invalide. Utilisez une image JPG, PNG ou WebP.' });
  }

  const fiche = await personnelRepository.findByUserId(req.user.id);
  if (!fiche) return res.status(404).json({ message: 'Aucune fiche personnel associée' });

  const filename = `${crypto.randomUUID()}.${extension}`;
  const folder = path.join(__dirname, '../../uploads/profile-photos');
  const filepath = path.join(folder, filename);
  const photoPath = `/uploads/profile-photos/${filename}`;

  try {
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(filepath, req.file.buffer, { flag: 'wx' });
    const personnel = await personnelRepository.updatePhoto(fiche.id, photoPath);

    if (fiche.photo_profil) {
      const oldFile = path.join(__dirname, '../..', fiche.photo_profil);
      await fs.unlink(oldFile).catch(() => {});
    }

    return res.status(200).json({ message: 'Photo de profil mise à jour', personnel });
  } catch (err) {
    await fs.unlink(filepath).catch(() => {});
    console.error('Erreur de mise à jour de la photo de profil:', err);
    return res.status(500).json({ message: "Impossible d'enregistrer la photo de profil" });
  }
}

async function create(req, res) {
  const { matricule, nom, prenom, email, role, roles, fonction, corps, grade, poste, service, direction, telephone, typeContrat, dateRecrutement, dateEcheanceContrat, contratPermanent, categorieId, peInfos, secretariatRole } = req.body;

  const rolesFinal = Array.isArray(roles) && roles.length > 0 ? roles : (role ? [role] : []);
  if (!matricule || !nom || !email || rolesFinal.length === 0) {
    return res.status(400).json({ message: 'Matricule, nom, email et au moins un rôle (PE ou PAT) sont requis' });
  }
  if (!/^[0-9]{6}$/.test(matricule)) {
    return res.status(400).json({ message: 'Le matricule doit contenir exactement 6 chiffres' });
  }

  try {
    const personnel = await personnelService.createPersonnel(
      { matricule, nom, prenom, email, roles: rolesFinal, fonction, corps, grade, poste, service, direction, telephone, typeContrat, dateRecrutement, dateEcheanceContrat, contratPermanent, categorieId, peInfos, secretariatRole },
      req.user.id
    );
    return res.status(201).json({ message: 'Fiche personnel créée', personnel });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function update(req, res) {
  const {
    nom, prenom, email, corps, grade, poste, service, direction, telephone, typeContrat,
    dateRecrutement, dateEcheanceContrat, contratPermanent, classe, echelon, indice, chapitreIb, categorieId,
    resolveFromGrille, roles, peInfos,
  } = req.body;

  try {
    const personnel = await personnelService.updatePersonnel(req.params.id, {
      nom, prenom, email, corps, grade, poste, service, direction, telephone, typeContrat,
      dateRecrutement, dateEcheanceContrat, contratPermanent, classe, echelon, indice, chapitreIb, categorieId,
      resolveFromGrille, roles, peInfos,
    }, req.user.id);
    return res.status(200).json({ message: 'Fiche mise à jour', personnel });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function list(req, res) {
  const list = await personnelService.listPersonnel();
  return res.status(200).json({ personnel: list });
}

async function listWithoutAccount(req, res) {
  const list = await personnelService.listWithoutAccount();
  return res.status(200).json({ personnel: list });
}

async function sendRegistrationLink(req, res) {
  try {
    await personnelService.sendRegistrationLink(req.params.id, req.user.id);
    return res.status(200).json({ message: "Lien d'inscription envoyé" });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

async function exportExcel(req, res) {
  const roleFiltre = ROLES_EXCEL.includes(req.query.role) ? req.query.role : null;
  try {
    const result = await pool.query(
      `SELECT p.* FROM personnel p
       WHERE ($1::text IS NULL OR EXISTS (SELECT 1 FROM personnel_roles pr WHERE pr.personnel_id = p.id AND pr.role = $1))
       ORDER BY p.nom NULLS LAST, p.matricule`,
      [roleFiltre]
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Personnel');

    sheet.columns = COLONNES_IMPORT;
    sheet.getRow(1).font = { bold: true };

    result.rows.forEach((row) => sheet.addRow(row));

    const nomFichier = roleFiltre ? `personnel-${roleFiltre}.xlsx` : 'personnel.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${nomFichier}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Erreur export Excel:', err);
    res.status(500).json({ message: "Erreur lors de l'export" });
  }
}

async function modeleImportExcel(req, res) {
  const role = ROLES_EXCEL.includes(req.query.role) ? req.query.role : 'PE';
  const workbook = new ExcelJS.Workbook();

  const sheet = workbook.addWorksheet('Personnel');
  sheet.columns = COLONNES_IMPORT;
  sheet.getRow(1).font = { bold: true };
  sheet.addRow({
    matricule: '123456', nom: 'EXEMPLE', prenom: 'Jean', email: 'jean.exemple@univ.mg', role,
    fonction: FONCTIONS_PAR_ROLE[role][0], corps: 'Fonctionnaire', type_contrat: 'CDI',
  });
  sheet.getRow(2).font = { italic: true, color: { argb: 'FF888888' } };

  const listes = {
    role: '"PE,PAT"',
    corps: `"${CORPS_OPTIONS.join(',')}"`,
    type_contrat: `"${TYPES_CONTRAT_OPTIONS.join(',')}"`,
    fonction: `"${[...new Set([...FONCTIONS_PAR_ROLE.PE, ...FONCTIONS_PAR_ROLE.PAT])].join(',')}"`,
  };
  const colonne = { role: 'E', fonction: 'F', corps: 'G', type_contrat: 'L' };
  for (let ligne = 2; ligne <= 500; ligne++) {
    for (const [cle, lettre] of Object.entries(colonne)) {
      sheet.getCell(`${lettre}${ligne}`).dataValidation = { type: 'list', allowBlank: true, formulae: [listes[cle]] };
    }
  }

  const aide = workbook.addWorksheet('Instructions');
  aide.getColumn(1).width = 110;
  const lignes = [
    'Mode d’emploi de l’import du personnel',
    '',
    '1. Remplissez la feuille « Personnel ». Supprimez la ligne d’exemple (en grisé) avant d’importer.',
    '2. Une ligne = une fiche. Les colonnes Matricule, Nom, Email et Rôle sont obligatoires.',
    '3. Matricule : exactement 6 chiffres, unique.',
    '4. Email : unique, au format adresse@domaine.',
    '5. Rôle : PE (enseignant) ou PAT (administratif et technique).',
    `6. Fonction (valeurs admises) : ${[...new Set([...FONCTIONS_PAR_ROLE.PE, ...FONCTIONS_PAR_ROLE.PAT])].join(', ')}.`,
    `7. Corps : ${CORPS_OPTIONS.join(', ')}.`,
    `8. Type de contrat : ${TYPES_CONTRAT_OPTIONS.join(', ')}.`,
    '9. Service et Direction : nom tel qu’il figure dans Directions & services.',
    '10. Classe, Échelon et Indice sont facultatifs ; une valeur non reconnue est conservée et signalée au RH.',
    '',
    'Les lignes en erreur sont ignorées et listées après l’import ; le reste est importé.',
  ];
  lignes.forEach((texte, i) => {
    const cellule = aide.getCell(`A${i + 1}`);
    cellule.value = texte;
    if (i === 0) cellule.font = { bold: true, size: 13 };
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="modele-import-personnel-${role}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
}

async function importExcel(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: 'Fichier Excel requis' });
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.worksheets[0];

    const rows = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const values = row.values.slice(1);
      rows.push({
        matricule: values[0], nom: values[1], prenom: values[2], email: values[3],
        role: values[4], fonction: values[5], corps: values[6], grade: values[7],
        service: values[8], direction: values[9], telephone: values[10], type_contrat: values[11],
        // Colonnes optionnelles (absentes = undefined, l'import continue de fonctionner à l'identique) :
        classe: values[12], echelon: values[13], indice: values[14],
      });
    });

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Le fichier ne contient aucune ligne de données' });
    }

    const results = await personnelService.importFromRows(rows, req.user.id);
    return res.status(200).json(results);
  } catch (err) {
    console.error('Erreur import Excel:', err);
    return res.status(400).json({ message: "Impossible de lire ce fichier. Vérifiez qu'il s'agit bien d'un .xlsx valide." });
  }
}

async function monEquipe(req, res) {
  const personnel = await personnelRepository.findByUserId(req.user.id);
  if (!personnel) return res.status(404).json({ message: 'Aucune fiche personnel associée' });

  if (personnel.fonction === 'Chef de service' && personnel.service) {
    const equipe = await personnelRepository.findEquipeParService(personnel.service, req.user.id);
    return res.status(200).json({ equipe, portee: 'service', nom: personnel.service });
  }
  if (personnel.fonction === 'Responsable/Directeur' && personnel.direction) {
    const equipe = await personnelRepository.findEquipeParDirection(personnel.direction, req.user.id);
    return res.status(200).json({ equipe, portee: 'direction', nom: personnel.direction });
  }
  return res.status(403).json({ message: "Vous n'avez pas de fonction d'encadrement" });
}

async function updateMesInfos(req, res) {
  const { telephone, adresse, situationFamiliale, dateNaissance, sexe, lieuNaissance, nationalite, datePriseFonction } = req.body;

  if (sexe && !['Masculin', 'Féminin'].includes(sexe)) {
    return res.status(400).json({ message: 'Sexe invalide' });
  }

  try {
    const personnel = await personnelService.updateMesInfos(req.user.id, {
      telephone, adresse, situationFamiliale, dateNaissance, sexe, lieuNaissance, nationalite, datePriseFonction,
    });
    return res.status(200).json({ message: 'Informations mises à jour', personnel });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
}

module.exports = { me, getOne, updatePhoto, create, update, list, listWithoutAccount, sendRegistrationLink, exportExcel, modeleImportExcel, importExcel, monEquipe, updateMesInfos };