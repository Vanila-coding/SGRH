// Démonstration lisible du calcul de l'indice et de l'IB, avec le même service que l'application :
// création d'une fiche (classe et échelon de la grille), contrôle d'une combinaison absente,
// puis changement d'échelon. Données jetables : matricules 9994xx, supprimées à la fin.
// Usage : node scripts/verifier-ib-indice.js
require('dotenv').config();
const pool = require('../src/config/db');
const personnelService = require('../src/services/personnelService');
const personnelRepository = require('../src/repositories/personnelRepository');

const base = { nom: 'Demo', prenom: 'IB', roles: ['PAT'], fonction: 'Agent', email: '' };
let n = 0;
const fiche = (extra) => {
  n += 1;
  return { ...base, matricule: `9994${String(n).padStart(2, '0')}`, email: `demo-ib${n}@example.test`, ...extra };
};

function ligne(libelle, f) {
  return {
    cas: libelle,
    matricule: f.matricule,
    corps: f.corps,
    categorie: f.categorie || '',
    classe: f.classe || '',
    echelon: f.echelon || '',
    indice_affiche: f.indice || '',
    IB: f.indice_num ?? '',
    source: f.indice_source || '',
    code_grille: f.code_grille || '',
  };
}

async function lire(id) {
  const r = await pool.query(
    `SELECT p.*, lg.code_grille_affichage AS code_grille FROM personnel p
     LEFT JOIN lignes_grille_indiciaire lg ON lg.id = p.ligne_grille_actuelle_id WHERE p.id = $1`, [id]);
  return r.rows[0];
}

async function main() {
  const lignes = [];
  const ids = [];
  try {
    const a = await personnelService.createPersonnel(fiche({
      corps: 'Fonctionnaire', categorie: 'I', classe: 'PRINCIPALAT', echelon: '2',
      resolveFromGrille: { classe: 'PRINCIPALAT', echelon: 2, categorie: 'I' },
    }), null);
    ids.push(a.id);
    lignes.push(ligne('1. Fonctionnaire cat. I, principalat échelon 2', await lire(a.id)));

    const b = await personnelService.createPersonnel(fiche({
      corps: 'Fonctionnaire', categorie: 'VIII', classe: 'CLASSE_EXCEPTIONNELLE', echelon: '1',
      resolveFromGrille: { classe: 'CLASSE_EXCEPTIONNELLE', echelon: 1, categorie: 'VIII' },
    }), null);
    ids.push(b.id);
    lignes.push(ligne('2. Fonctionnaire cat. VIII, classe exc. échelon 1', await lire(b.id)));

    const c = await personnelService.createPersonnel(fiche({
      corps: 'EFA', classe: 'DEUXIEME_CLASSE', echelon: '3', indice: '950-FOP',
    }), null);
    ids.push(c.id);
    lignes.push(ligne('3. EFA, indice saisi à la main', await lire(c.id)));

    try {
      await personnelService.createPersonnel(fiche({
        corps: 'Fonctionnaire', categorie: 'X', classe: 'DEUXIEME_CLASSE', echelon: '1',
        resolveFromGrille: { classe: 'DEUXIEME_CLASSE', echelon: 1, categorie: 'X' },
      }), null);
      lignes.push({ cas: '4. Catégorie X, deuxième classe (absente de la grille)', matricule: 'CRÉÉE — anomalie' });
    } catch (err) {
      lignes.push({ cas: '4. Catégorie X, deuxième classe (absente de la grille)', matricule: 'refusée', indice_affiche: err.message });
    }

    // Changement d'échelon : I principalat 2 (455) -> I première classe 1 (355)
    await personnelService.updatePersonnel(a.id, {
      corps: 'Fonctionnaire', categorie: 'I', classe: 'PREMIERE_CLASSE', echelon: '1',
      resolveFromGrille: { classe: 'PREMIERE_CLASSE', echelon: 1, categorie: 'I' },
    }, null);
    lignes.push(ligne('5. Après avancement de la fiche 1 (1re classe échelon 1)', await lire(a.id)));
  } finally {
    await pool.query(`DELETE FROM personnel_roles WHERE personnel_id IN (SELECT id FROM personnel WHERE matricule LIKE '9994%')`);
    await pool.query(`DELETE FROM corbeille WHERE donnees->>'matricule' LIKE '9994%'`);
    await pool.query(`DELETE FROM personnel WHERE matricule LIKE '9994%'`);
    await pool.end();
  }
  console.table(lignes);
}

main().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
