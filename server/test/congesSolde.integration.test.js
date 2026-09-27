// Tests d'intégration du solde de congés (base rh_mahajanga, données jetables).
// Convention : matricules 9998xx, emails @example.test, supprimés en fin de test.
// Prérequis : migration 012 appliquée (solde_conges numeric(6,1), DEFAULT 0).
const test = require('node:test');
const assert = require('node:assert');
const pool = require('../src/config/db');
const congeService = require('../src/services/congeService');
const congeDroitsService = require('../src/services/congeDroitsService');
const congeSuiviRepository = require('../src/repositories/congeSuiviRepository');
const corbeilleRepository = require('../src/repositories/corbeilleRepository');
const congeOuvertureService = require('../src/services/congeOuvertureService');

const ANNEE = new Date().getFullYear();
let compteur = 0;

async function creerAgent({ dateRecrutement = '2020-01-01', solde, derniere = null } = {}) {
  compteur += 1;
  const matricule = `9998${String(compteur).padStart(2, '0')}`;
  const email = `conge${compteur}_${process.pid}@example.test`;
  const p = await pool.query(
    `INSERT INTO personnel (matricule, email, nom, prenom, date_recrutement, derniere_recharge_annee ${solde !== undefined ? ', solde_conges' : ''})
     VALUES ($1, $2, 'Test', 'Conge', $3, $4 ${solde !== undefined ? ', $5' : ''}) RETURNING id`,
    solde !== undefined ? [matricule, email, dateRecrutement, derniere, solde] : [matricule, email, dateRecrutement, derniere]
  );
  const u = await pool.query(
    `INSERT INTO users (email, password_hash, role, personnel_id) VALUES ($1, 'x', 'PE', $2) RETURNING id`,
    [email, p.rows[0].id]
  );
  return { personnelId: p.rows[0].id, userId: u.rows[0].id, email };
}

async function solde(a) {
  return Number((await pool.query(`SELECT solde_conges FROM personnel WHERE id = $1`, [a.personnelId])).rows[0].solde_conges);
}
// La demande démarre "en attente de vérification secrétariat" (nouvelle étape,
// hors périmètre de ces tests de solde) : on la fait avancer directement pour
// pouvoir tester reviewDemande comme avant.
const annuel = async (a, jours, debut = `${ANNEE}-11-01`) => {
  const [y, m, d] = debut.split('-').map(Number);
  const fin = new Date(Date.UTC(y, m - 1, d + jours - 1)).toISOString().slice(0, 10);
  const demande = await congeService.createDemande(a.userId, { typeConge: 'Congé annuel', dateDebut: debut, dateFin: fin });
  await pool.query(`UPDATE conges SET decision_secretariat = 'approuvee' WHERE id = $1`, [demande.id]);
  return demande;
};

test.after(async () => {
  await pool.query(`DELETE FROM notifications WHERE sender_id IN (SELECT id FROM users WHERE email LIKE 'conge%@example.test') OR recipient_id IN (SELECT id FROM users WHERE email LIKE 'conge%@example.test')`);
  await pool.query(`DELETE FROM activity_log WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'conge%@example.test')`);
  await pool.query(`DELETE FROM users WHERE email LIKE 'conge%@example.test'`);
  await pool.query(`DELETE FROM personnel WHERE matricule LIKE '9998%'`);
  await pool.end();
});

test('nouveau personnel : 0 jour avant acquisition (plus de 30 par DEFAULT)', async () => {
  const a = await creerAgent();
  assert.strictEqual(await solde(a), 0);
});

test('première acquisition 0 + 30 = 30, puis consommation 30 - 15 = 15 (pas 60 ni 45)', async () => {
  const a = await creerAgent();
  await annuel(a, 15);
  assert.strictEqual(await solde(a), 15);
});

test('reliquat : 15 + 30 nouveau droit = 45, puis 45 - 10 = 35', async () => {
  const a = await creerAgent();
  await annuel(a, 15);
  const credits = await congeDroitsService.rechargerSiNecessaire(a.personnelId, undefined, ANNEE + 1);
  assert.strictEqual(credits.total, 30);
  assert.strictEqual(await solde(a), 45);
  await annuel(a, 10, `${ANNEE}-12-01`); // année réelle : déjà créditée (repère ANNEE+1), pas de nouveau crédit
  assert.strictEqual(await solde(a), 35);
});

test('plusieurs années non créditées : toutes récupérées, jamais de suppression du reliquat', async () => {
  const a = await creerAgent({ solde: 20, derniere: ANNEE - 3 }); // 30 acquis, 10 pris, 20 restants en ANNEE-3
  const credits = await congeDroitsService.rechargerSiNecessaire(a.personnelId, undefined, ANNEE);
  assert.deepStrictEqual(credits.annees.map((x) => x.annee), [ANNEE - 2, ANNEE - 1, ANNEE]);
  assert.strictEqual(await solde(a), 20 + 90);
});

test('année d\'arrivée : 2,5 jours par mois complet, valeurs décimales', async () => {
  const a = await creerAgent({ dateRecrutement: `${ANNEE}-06-01` });
  await congeDroitsService.rechargerSiNecessaire(a.personnelId, undefined, ANNEE);
  assert.strictEqual(await solde(a), 17.5); // juin à décembre = 7 mois
  const b = await creerAgent({ dateRecrutement: `${ANNEE}-06-15` });
  await congeDroitsService.rechargerSiNecessaire(b.personnelId, undefined, ANNEE);
  assert.strictEqual(await solde(b), 15); // juin entamé non compté
});

test('date de recrutement absente : le solde d\'ouverture est conservé, aucun crédit', async () => {
  const a = await creerAgent({ dateRecrutement: null, solde: 12 });
  const credits = await congeDroitsService.rechargerSiNecessaire(a.personnelId, undefined, ANNEE);
  assert.strictEqual(credits.dateManquante, true);
  assert.strictEqual(await solde(a), 12);
});

test('double recharge (séquentielle) : les droits ne sont ajoutés qu\'une fois', async () => {
  const a = await creerAgent();
  await congeDroitsService.rechargerSiNecessaire(a.personnelId, undefined, ANNEE);
  await congeDroitsService.rechargerSiNecessaire(a.personnelId, undefined, ANNEE);
  assert.strictEqual(await solde(a), 30);
});

test('recharge simultanée (5 appels en parallèle) : une seule attribution', async () => {
  const a = await creerAgent();
  await Promise.all(Array.from({ length: 5 }, () => congeDroitsService.rechargerSiNecessaire(a.personnelId, undefined, ANNEE)));
  assert.strictEqual(await solde(a), 30);
});

test('solde insuffisant : refus, solde et demandes inchangés', async () => {
  const a = await creerAgent();
  await assert.rejects(annuel(a, 40), /Solde insuffisant/);
  // Rien n'est écrit (la recharge est annulée avec la demande) ; le solde disponible reste 30.
  assert.strictEqual(await solde(a), 0);
  assert.strictEqual((await congeDroitsService.getSoldeDetails(a.userId, a.personnelId, ANNEE)).soldeDisponible, 30);
  assert.strictEqual((await pool.query(`SELECT count(*)::int c FROM conges WHERE user_id = $1`, [a.userId])).rows[0].c, 0);
});

test('demandes simultanées : le solde ne devient jamais négatif', async () => {
  const a = await creerAgent({ solde: 20, derniere: ANNEE });
  const res = await Promise.allSettled([annuel(a, 15), annuel(a, 15), annuel(a, 15)]);
  assert.strictEqual(res.filter((r) => r.status === 'fulfilled').length, 1);
  assert.strictEqual(await solde(a), 5);
});

test('refus : jours restitués une seule fois, même en cas de double décision', async () => {
  const a = await creerAgent();
  const demande = await annuel(a, 15);
  assert.strictEqual(await solde(a), 15);
  await congeService.reviewDemande(demande.id, 'refusee', a.userId, 'test');
  assert.strictEqual(await solde(a), 30);
  await assert.rejects(congeService.reviewDemande(demande.id, 'refusee', a.userId, 'test'), /déjà traitée/);
  assert.strictEqual(await solde(a), 30);
  // décisions simultanées sur une autre demande
  const d2 = await annuel(a, 10);
  assert.strictEqual(await solde(a), 20);
  const res = await Promise.allSettled([
    congeService.reviewDemande(d2.id, 'refusee', a.userId, 'x'),
    congeService.reviewDemande(d2.id, 'refusee', a.userId, 'y'),
  ]);
  assert.strictEqual(res.filter((r) => r.status === 'fulfilled').length, 1);
  assert.strictEqual(await solde(a), 30);
});

test('les types autres que le congé annuel ne consomment pas le solde', async () => {
  const a = await creerAgent();
  await congeService.createDemande(a.userId, { typeConge: 'Permission', dateDebut: `${ANNEE}-11-01`, dateFin: `${ANNEE}-11-03` });
  assert.strictEqual(await solde(a), 30); // recharge faite, rien de consommé
});

test('règle des 15 jours conservée telle quelle (règle de prise, indépendante de l\'acquisition)', async () => {
  const a = await creerAgent();
  await assert.rejects(annuel(a, 5), /au moins 15 jours/);
  assert.strictEqual((await congeDroitsService.getSoldeDetails(a.userId, a.personnelId, ANNEE)).soldeDisponible, 30);
  // agent arrivé en fin d'année : droit de 5 jours < 15, la règle inchangée bloque la 1ère demande annuelle
  const b = await creerAgent({ dateRecrutement: `${ANNEE}-11-01` });
  await assert.rejects(annuel(b, 5), /au moins 15 jours/);
  assert.strictEqual((await congeDroitsService.getSoldeDetails(b.userId, b.personnelId, ANNEE)).soldeDisponible, 5); // 2 mois x 2,5, rien débité
});

test('getSoldeDetails : calcul serveur (droits, reliquat, jours posés, solde disponible)', async () => {
  const a = await creerAgent({ solde: 15, derniere: ANNEE - 1 });
  const d = await congeDroitsService.getSoldeDetails(a.userId, a.personnelId, ANNEE);
  assert.strictEqual(d.soldeDisponible, 45);
  assert.strictEqual(d.droitsAnnee, 30);
  assert.strictEqual(d.reliquat, 15);
  assert.strictEqual(d.joursPrisAnnee, 0);
  assert.strictEqual(await solde(a), 15); // lecture seule : rien n'est écrit
});

const imputations = async (congeId) => (await pool.query(
  `SELECT annee, jours::float8 AS jours FROM conges_imputations WHERE conge_id = $1 ORDER BY annee NULLS FIRST`, [congeId]
)).rows;
const sommeRestants = async (a) => (await congeSuiviRepository.restantsParAnnee(a.personnelId, a.userId)).reduce((t, r) => t + r.restant, 0);

test('suivi annuel : un droit par année, imputation du plus ancien au plus récent, solde = total des restants', async () => {
  const a = await creerAgent({ solde: 0, derniere: ANNEE - 2 });
  const d = await annuel(a, 40);
  const lignes = await congeSuiviRepository.restantsParAnnee(a.personnelId, a.userId);
  assert.deepStrictEqual(lignes.map((l) => [l.annee, l.droit, l.restant]), [[ANNEE - 1, 30, 0], [ANNEE, 30, 20]]);
  assert.deepStrictEqual(await imputations(d.id), [{ annee: ANNEE - 1, jours: 30 }, { annee: ANNEE, jours: 10 }]);
  assert.strictEqual(await solde(a), 20);
  assert.strictEqual(await sommeRestants(a), 20); // cohérence solde <-> suivi annuel
  const c = (await pool.query(`SELECT solde_avant::float8 AS av, solde_apres::float8 AS ap FROM conges WHERE id = $1`, [d.id])).rows[0];
  assert.deepStrictEqual([c.av, c.ap], [60, 20]); // photographie « à la date de la demande »
});

test('solde historique sans détail par année : imputé au « solde d\'ouverture non ventilé »', async () => {
  const a = await creerAgent({ solde: 20, derniere: ANNEE }); // pas de ligne de droit annuel
  const d = await annuel(a, 15);
  assert.deepStrictEqual(await imputations(d.id), [{ annee: null, jours: 15 }]);
  assert.strictEqual(await solde(a), 5);
});

test('refus : jours restitués et imputations exclues du « pris » (cohérence maintenue)', async () => {
  const a = await creerAgent();
  const d = await annuel(a, 15);
  assert.strictEqual(await sommeRestants(a), 15);
  await congeService.reviewDemande(d.id, 'refusee', a.userId, 'test');
  assert.strictEqual(await solde(a), 30);
  assert.strictEqual(await sommeRestants(a), 30);
});

test('types sans effet sur le solde : photographie avant = après', async () => {
  const a = await creerAgent();
  const d = await congeService.createDemande(a.userId, { typeConge: 'Permission', dateDebut: `${ANNEE}-11-01`, dateFin: `${ANNEE}-11-02` });
  const c = (await pool.query(`SELECT solde_avant::float8 AS av, solde_apres::float8 AS ap FROM conges WHERE id = $1`, [d.id])).rows[0];
  assert.deepStrictEqual([c.av, c.ap], [30, 30]);
  assert.deepStrictEqual(await imputations(d.id), []);
});

test('getDemandeDetails : QR d\'avis seulement si l\'avis du chef est favorable', async () => {
  const a = await creerAgent();
  const d = await annuel(a, 15);
  const details = await congeService.getDemandeDetails(d.id, { id: a.userId, role: 'PE', personnel_id: a.personnelId });
  assert.strictEqual(details.avis_qr, null); // pas de validateur : pas d'avis favorable
  assert.strictEqual(details.solde_avant, 30);
  assert.strictEqual(details.solde_apres, 15);
  assert.strictEqual(details.nombre_jours, 15);
});

test('corbeille : la restauration d\'un compte remet imputations et photographie du solde', async () => {
  const a = await creerAgent();
  const acteur = await creerAgent();
  const d = await annuel(a, 15);
  const archive = await corbeilleRepository.archiveAndDeleteCompte(a.userId, acteur.userId);
  assert.ok(archive);
  assert.strictEqual((await imputations(d.id)).length, 0); // supprimées en cascade avec le compte
  await corbeilleRepository.restoreCompte(archive.donnees);
  assert.deepStrictEqual(await imputations(d.id), [{ annee: ANNEE, jours: 15 }]);
  const c = (await pool.query(`SELECT solde_avant::float8 AS av, solde_apres::float8 AS ap FROM conges WHERE id = $1`, [d.id])).rows[0];
  assert.deepStrictEqual([c.av, c.ap], [30, 15]);
});

test('getDemandeDetails sans QR_SECRET : la fiche reste consultable, sans QR', async () => {
  const a = await creerAgent();
  const d = await annuel(a, 15);
  await pool.query(`UPDATE conges SET decision_intermediaire = 'approuvee', decision_intermediaire_le = NOW() WHERE id = $1`, [d.id]);
  const sauvegarde = process.env.QR_SECRET;
  process.env.QR_SECRET = 'cle-de-test';
  const avec = await congeService.getDemandeDetails(d.id, { id: a.userId, role: 'PE', personnel_id: a.personnelId });
  assert.match(avec.avis_qr.dataUrl, /^data:image\/png/);
  delete process.env.QR_SECRET;
  try {
    const sans = await congeService.getDemandeDetails(d.id, { id: a.userId, role: 'PE', personnel_id: a.personnelId });
    assert.strictEqual(sans.avis_qr, null);
    assert.strictEqual(sans.decision_intermediaire, 'approuvee');
  } finally {
    if (sauvegarde === undefined) delete process.env.QR_SECRET; else process.env.QR_SECRET = sauvegarde;
  }
});

test('vue RH (getSuivi) : solde disponible et détail identiques à ceux du dossier de l\'agent', async () => {
  const a = await creerAgent({ solde: 15, derniere: ANNEE - 1 });
  const suivi = await congeOuvertureService.getSuivi(a.personnelId);
  const agent = await congeDroitsService.getSoldeDetails(a.userId, a.personnelId);
  for (const champ of ['annee', 'soldeDisponible', 'droitsAnnee', 'reliquat', 'joursPrisAnnee', 'dateRecrutementConnue']) {
    assert.strictEqual(suivi[champ], agent[champ], champ);
  }
  assert.strictEqual(suivi.soldeDisponible, 45); // 15 enregistrés + 30 de l'année non encore créditée
  assert.strictEqual(suivi.soldeEnregistre, 15); // le solde stocké reste indiqué séparément
});

test('vue RH (getSuivi) : un personnel sans compte utilisateur reste consultable', async () => {
  compteur += 1;
  const p = await pool.query(
    `INSERT INTO personnel (matricule, email, nom, prenom, date_recrutement) VALUES ($1, $2, 'Test', 'SansCompte', '2020-01-01') RETURNING id`,
    [`9998${String(compteur).padStart(2, '0')}`, `conge${compteur}_${process.pid}@example.test`]
  );
  const suivi = await congeOuvertureService.getSuivi(p.rows[0].id);
  assert.strictEqual(suivi.joursPrisAnnee, 0);
  assert.strictEqual(suivi.dateRecrutementConnue, true);
  assert.strictEqual(suivi.soldeDisponible, 30);
});
