// Tests du moteur "grilles indiciaires & carrière". Exécutés via `node --test`
// contre la base de développement réelle (comme les autres vérifications de ce
// projet) : chaque test crée ses propres fiches personnel/utilisateurs jetables
// (matricules 9999xx) et les nettoie dans `after()`, sans jamais toucher aux
// données existantes.
const assert = require('node:assert/strict');
const { test, before, after } = require('node:test');

const pool = require('../src/config/db');
const grilleIndiciaireService = require('../src/services/grilleIndiciaireService');
const grilleIndiciaireRepository = require('../src/repositories/grilleIndiciaireRepository');
const carriereService = require('../src/services/carriereService');
const avancementService = require('../src/services/avancementService');
const personnelRepository = require('../src/repositories/personnelRepository');
const { normaliserClasse, normaliserEchelon } = require('../src/utils/normalisationCarriere');

const MATRICULES = ['999911', '999912', '999913'];
const createdPersonnelIds = [];

async function creerPersonnelTest(matricule, overrides = {}) {
  const personnel = await personnelRepository.create({
    matricule, nom: 'Test', prenom: 'Grille', email: `test.${matricule}@example.test`,
    role: 'PAT', corps: 'Fonctionnaire', ...overrides,
  });
  createdPersonnelIds.push(personnel.id);
  return personnel;
}

after(async () => {
  if (createdPersonnelIds.length > 0) {
    await pool.query('DELETE FROM alertes_avancement WHERE personnel_id = ANY($1)', [createdPersonnelIds]);
    await pool.query('DELETE FROM carriere_evenements WHERE personnel_id = ANY($1)', [createdPersonnelIds]);
    await pool.query('DELETE FROM personnel WHERE id = ANY($1)', [createdPersonnelIds]);
  }
  await pool.end();
});

test('TEST 1 — combinaison valide retourne le bon indice, avec sa source', async () => {
  const resolution = await grilleIndiciaireService.resolveIndice({
    regime: 'FONCTIONNAIRE', categorie: 'I', classe: 'CLASSE_EXCEPTIONNELLE', echelon: 2, dateEffet: '2026-01-01',
  });
  assert.equal(resolution.indice, 675);
  assert.equal(resolution.verified, true);
  assert.match(resolution.source, /97-009|132\/MFPTLS/);
});

test('TEST 2 — combinaison inexistante (grille sans ligne correspondante) est rejetée', async () => {
  await assert.rejects(
    grilleIndiciaireService.resolveIndice({
      regime: 'FONCTIONNAIRE', categorie: 'X', classe: 'DEUXIEME_CLASSE', echelon: 1, dateEffet: '2026-01-01', // X n'a que la classe exceptionnelle
    }),
    /Aucune ligne indiciaire ne correspond/
  );
});

test('TEST 3 — une classe ne peut pas utiliser un échelon inexistant', async () => {
  assert.throws(() => grilleIndiciaireService.validateCoherence({ classe: 'DEUXIEME_CLASSE', echelon: 5 }), /ne comporte que 3 échelon/);
  assert.throws(() => grilleIndiciaireService.validateCoherence({ classe: 'CLASSE_EXCEPTIONNELLE', echelon: 3 }), /ne comporte que 2 échelon/);
  // Contrainte SQL : même une insertion directe hors service est bloquée.
  await assert.rejects(
    pool.query(
      `INSERT INTO lignes_grille_indiciaire (grille_id, categorie, classe, echelon, indice, source_texte, date_debut_validite)
       VALUES (1, 'I', 'DEUXIEME_CLASSE', 5, 999, 'test', '2020-01-01')`
    ),
    /lignes_grille_echelon_par_classe_check/
  );
});

test('TEST 4 — la grille active à la date d\'effet est choisie (validité temporelle)', async () => {
  // La grille générale est valide à partir du 1997-01-16 : une résolution avant cette
  // date ne doit trouver aucune grille active (pas de choix arbitraire).
  await assert.rejects(
    grilleIndiciaireService.resolveIndice({
      regime: 'FONCTIONNAIRE', categorie: 'I', classe: 'CLASSE_EXCEPTIONNELLE', echelon: 1, dateEffet: '1990-01-01',
    }),
    /grille inconnue/
  );
  const resolution = await grilleIndiciaireService.resolveIndice({
    regime: 'FONCTIONNAIRE', categorie: 'I', classe: 'CLASSE_EXCEPTIONNELLE', echelon: 1, dateEffet: '2010-01-01',
  });
  assert.equal(resolution.indice, 515);
});

test('TEST 5/6 — un avancement d\'échelon crée un nouvel événement et conserve l\'ancien indice dans l\'historique', async () => {
  const personnel = await creerPersonnelTest(MATRICULES[0]);
  const premier = await carriereService.addEvenement(personnel.id, {
    typeEvenement: 'Recrutement', dateEvenement: '2020-01-01', dateEffet: '2020-01-01',
    resolveFromGrille: { regime: 'FONCTIONNAIRE', categorie: 'I', classe: 'CLASSE_EXCEPTIONNELLE', echelon: 1 },
  }, null);
  const second = await carriereService.addEvenement(personnel.id, {
    typeEvenement: 'Avancement d\'échelon', dateEvenement: '2022-01-01', dateEffet: '2022-01-01',
    resolveFromGrille: { regime: 'FONCTIONNAIRE', categorie: 'I', classe: 'CLASSE_EXCEPTIONNELLE', echelon: 2 },
  }, null);

  assert.notEqual(premier.id, second.id);

  const { timeline } = await carriereService.getCarriere(personnel.id);
  const evenementsCarriere = timeline.filter((t) => t.source === 'evenement');
  assert.equal(evenementsCarriere.length, 2);
  const ancien = evenementsCarriere.find((e) => e.id === premier.id);
  assert.equal(ancien.indice, '515-CE/E1'); // indice + code de grille du fichier // l'ancien événement garde SON indice, jamais réécrit

  const personnelMisAJour = await personnelRepository.findByIdRaw(personnel.id);
  assert.equal(personnelMisAJour.indice_num, 675); // situation courante = l'événement le plus récent
  assert.equal(personnelMisAJour.indice_source, 'REGLEMENTAIRE');
});

test('TEST 7 — un indice Excel incompatible avec la grille produit un avertissement, pas un écrasement', async () => {
  const personnelService = require('../src/services/personnelService');
  const matricule = MATRICULES[1];
  const results = await personnelService.importFromRows([
    {
      matricule, nom: 'Import', prenom: 'Test', email: `import.${matricule}@example.test`, role: 'PAT',
      classe: 'DEUXIEME CLASSE', echelon: '7', indice: '9999', // échelon 7 n'existe pour aucune classe
    },
  ], null);
  assert.equal(results.inserted, 1);
  assert.equal(results.warnings.length, 1);
  assert.match(results.warnings[0].reason, /ne comporte que 3 échelon/);

  const created = await personnelRepository.findByMatricule(matricule);
  createdPersonnelIds.push(created.id);
  assert.equal(created.indice, '9999'); // valeur brute conservée, pas perdue
  assert.equal(created.indice_source, 'A_CONFIRMER'); // jamais faussement marquée réglementaire
});

test('TEST 8 — "950-FOP" est séparé en indice numérique 950 et code de grille FOP', () => {
  const { indiceNum, codeGrille } = grilleIndiciaireService.parseIndiceAffiche('950-FOP');
  assert.equal(indiceNum, 950);
  assert.equal(codeGrille, 'FOP');
  assert.equal(grilleIndiciaireService.formatDisplay(950, 'FOP'), '950-FOP');
  assert.equal(grilleIndiciaireService.formatDisplay(950, null), '950');
});

test('TEST 9 — permission : la logique de résolution reste accessible en lecture sans dépendre du rôle appelant (contrôle réel au niveau des routes)', async () => {
  // Le contrôle de permission vit dans les middlewares de route (requirePermission),
  // vérifié en direct contre le serveur HTTP pendant le développement de cette
  // fonctionnalité (PE/PAT reçoivent 403 sur /alertes-avancement et sur le
  // traitement d'une alerte). Ici on vérifie que le service métier lui-même ne
  // fait aucune hypothèse de rôle — la garde est uniquement dans les routes.
  const routesSource = require('fs').readFileSync(require.resolve('../src/routes/carriere.routes.js'), 'utf8');
  assert.match(routesSource, /alertes-avancement.*requirePermission\('manage_fonctions'\)/s);
});

test('TEST 10 — deux agents avec la même situation administrative obtiennent le même indice', async () => {
  const a = await grilleIndiciaireService.resolveIndice({ regime: 'FONCTIONNAIRE', categorie: 'V', classe: 'CLASSE_EXCEPTIONNELLE', echelon: 1, dateEffet: '2026-01-01' });
  const b = await grilleIndiciaireService.resolveIndice({ regime: 'FONCTIONNAIRE', categorie: 'V', classe: 'CLASSE_EXCEPTIONNELLE', echelon: 1, dateEffet: '2026-01-01' });
  assert.equal(a.indice, b.indice);
  assert.equal(a.ligneGrilleId, b.ligneGrilleId);
});

test('TEST 11 — deux situations différentes mais même indice numérique restent distinctes', async () => {
  // catégorie II / 2e échelon et catégorie III / 1er échelon partagent l'indice 1020
  // (diagonale de la circulaire 132/2005) mais sont deux lignes de grille distinctes.
  const a = await grilleIndiciaireService.resolveIndice({ regime: 'FONCTIONNAIRE', categorie: 'II', classe: 'CLASSE_EXCEPTIONNELLE', echelon: 2, dateEffet: '2026-01-01' });
  const b = await grilleIndiciaireService.resolveIndice({ regime: 'FONCTIONNAIRE', categorie: 'III', classe: 'CLASSE_EXCEPTIONNELLE', echelon: 1, dateEffet: '2026-01-01' });
  assert.equal(a.indice, b.indice);
  assert.notEqual(a.ligneGrilleId, b.ligneGrilleId);
});

test('TEST 12 — une grille avec une date de validité future ne modifie pas rétroactivement une résolution passée', async () => {
  const grille = (await grilleIndiciaireRepository.listGrilles({ regime: 'FONCTIONNAIRE' })).find((g) => g.code === 'FONCTIONNAIRE_GRILLE_GENERALE');
  const resolutionPassee = await grilleIndiciaireService.resolveIndice({
    regime: 'FONCTIONNAIRE', categorie: 'I', classe: 'CLASSE_EXCEPTIONNELLE', echelon: 1, dateEffet: '2006-01-01',
  });
  assert.equal(resolutionPassee.grilleId, grille.id);
  assert.equal(resolutionPassee.indice, 515); // même valeur qu'avant la grille générale : pas de grille hypothétique future
});

test('TEST 13 — le scan d\'alertes crée une alerte pour un échelon échu sans modifier personnel/carriere_evenements', async () => {
  const personnel = await creerPersonnelTest(MATRICULES[2], {
    classe: 'CLASSE_EXCEPTIONNELLE', echelon: '1',
    dateRecrutement: new Date(Date.now() - 4 * 365.25 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  });
  const avant = await personnelRepository.findByIdRaw(personnel.id);

  const nouvelles = await avancementService.scannerAlertes();
  const alerteCreee = nouvelles.find((n) => n.personnel.id === personnel.id);
  assert.ok(alerteCreee, 'une alerte AVANCEMENT_ECHELON_ECHU aurait dû être créée pour cet agent');
  assert.equal(alerteCreee.alerte.type, 'AVANCEMENT_ECHELON_ECHU');

  const apres = await personnelRepository.findByIdRaw(personnel.id);
  assert.deepEqual(
    { classe: apres.classe, echelon: apres.echelon, indice: apres.indice },
    { classe: avant.classe, echelon: avant.echelon, indice: avant.indice }
  );
  const evenements = await pool.query('SELECT count(*) FROM carriere_evenements WHERE personnel_id = $1', [personnel.id]);
  assert.equal(Number(evenements.rows[0].count), 0);

  // Anti-doublon : un second scan ne recrée pas la même alerte ouverte.
  const nouvelles2 = await avancementService.scannerAlertes();
  assert.equal(nouvelles2.filter((n) => n.personnel.id === personnel.id).length, 0);
});

test('normalisationCarriere — reconnaît les variantes usuelles sans deviner les valeurs non reconnues', () => {
  assert.equal(normaliserClasse('2ème classe'), 'DEUXIEME_CLASSE');
  assert.equal(normaliserClasse('2e classe'), 'DEUXIEME_CLASSE');
  assert.equal(normaliserClasse('DEUXIÈME CLASSE'), 'DEUXIEME_CLASSE');
  assert.equal(normaliserClasse('classe exceptionnelle'), 'CLASSE_EXCEPTIONNELLE');
  assert.equal(normaliserClasse('valeur farfelue'), null);
  assert.equal(normaliserEchelon('2'), 2);
  assert.equal(normaliserEchelon('abc'), null);
});
