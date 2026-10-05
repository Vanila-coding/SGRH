// Création d'une fiche avec classe et échelon choisis dans le formulaire : l'indice vient de
// la grille (comme à la modification). Données jetables : matricules 9995xx, emails
// creation*@example.test, supprimés en fin de test.
const test = require('node:test');
const assert = require('node:assert');
const pool = require('../src/config/db');
const personnelService = require('../src/services/personnelService');
const personnelController = require('../src/controllers/personnelController');

let compteur = 0;
const nouvelleFiche = (extra = {}) => {
  compteur += 1;
  return {
    matricule: `9995${String(compteur).padStart(2, '0')}`,
    nom: 'Test', prenom: 'Creation', email: `creation${compteur}_${process.pid}@example.test`,
    roles: ['PAT'], corps: 'Fonctionnaire', fonction: 'Agent',
    ...extra,
  };
};

test.after(async () => {
  await pool.query(`DELETE FROM personnel_roles WHERE personnel_id IN (SELECT id FROM personnel WHERE matricule LIKE '9995%')`);
  await pool.query(`DELETE FROM personnel WHERE matricule LIKE '9995%'`);
  await pool.end();
});

test('création : classe et échelon de la grille fixent l\'indice (source réglementaire, ligne de grille)', async () => {
  const personnel = await personnelService.createPersonnel(nouvelleFiche({
    resolveFromGrille: { classe: 'PRINCIPALAT', echelon: 2, categorie: 'I' },
    classe: 'PRINCIPALAT', echelon: '2', indice: '1',
  }), null);
  const fiche = (await pool.query(`SELECT * FROM personnel WHERE id = $1`, [personnel.id])).rows[0];
  assert.strictEqual(fiche.classe, 'PRINCIPALAT');
  assert.strictEqual(fiche.echelon, '2');
  assert.strictEqual(fiche.indice_num, 455, 'IB issu de la grille, pas de la valeur saisie');
  assert.strictEqual(fiche.indice_source, 'REGLEMENTAIRE');
  assert.notStrictEqual(fiche.ligne_grille_actuelle_id, null);
  assert.match(fiche.indice, /^455/);
});

test('création : une combinaison absente de la grille bloque la création', async () => {
  await assert.rejects(
    personnelService.createPersonnel(nouvelleFiche({
      resolveFromGrille: { classe: 'DEUXIEME_CLASSE', echelon: 1, categorie: 'X' },
    }), null),
    /Aucune ligne indiciaire|grille inconnue|À confirmer|ne correspond/
  );
  const cree = await pool.query(`SELECT 1 FROM personnel WHERE matricule = $1`, [nouvelleFiche().matricule]);
  assert.strictEqual(cree.rowCount, 0);
});

test('création sans grille : classe et échelon saisis sont gardés, l\'indice reste texte libre', async () => {
  const personnel = await personnelService.createPersonnel(nouvelleFiche({
    corps: 'EFA', classe: 'DEUXIEME_CLASSE', echelon: '3', indice: '950-FOP',
  }), null);
  const fiche = (await pool.query(`SELECT * FROM personnel WHERE id = $1`, [personnel.id])).rows[0];
  assert.strictEqual(fiche.classe, 'DEUXIEME_CLASSE');
  assert.strictEqual(fiche.echelon, '3');
  assert.strictEqual(fiche.indice, '950-FOP');
  assert.strictEqual(fiche.indice_num, 950);
  assert.strictEqual(fiche.indice_source, 'SAISIE_RH');
});

// Régression : le contrôleur (route POST /personnel) doit transmettre la situation de grille,
// sinon le formulaire enregistre la fiche sans indice.
test('route de création : la classe et l\'échelon de la grille arrivent jusqu\'au service', async () => {
  const fiche = nouvelleFiche({
    classe: 'PRINCIPALAT', echelon: '2', indice: null,
    resolveFromGrille: { classe: 'PRINCIPALAT', echelon: 2, categorie: 'I' },
  });
  const reponse = { statut: null, corps: null, status(c) { this.statut = c; return this; }, json(b) { this.corps = b; return this; } };
  await personnelController.create({ body: fiche, user: { id: null } }, reponse);
  assert.strictEqual(reponse.statut, 201, JSON.stringify(reponse.corps));
  const fichePersonnel = (await pool.query(`SELECT * FROM personnel WHERE matricule = $1`, [fiche.matricule])).rows[0];
  assert.strictEqual(fichePersonnel.indice_num, 455);
  assert.strictEqual(fichePersonnel.indice_source, 'REGLEMENTAIRE');
});
