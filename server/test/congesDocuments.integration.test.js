// Décision d'octroi, état de congé et saisie des soldes d'ouverture (base rh_mahajanga,
// données jetables : matricules 9997xx, emails doc*@example.test, supprimés en fin de test).
const test = require('node:test');
const assert = require('node:assert');
const pool = require('../src/config/db');
const congeService = require('../src/services/congeService');
const congeDroitsService = require('../src/services/congeDroitsService');
const documentService = require('../src/services/documentService');
const ouvertureService = require('../src/services/congeOuvertureService');
const { positions } = require('../src/services/congeDocumentsService');

const ANNEE = new Date().getFullYear();
let compteur = 0;

async function creerPersonnel({ avecCompte = true, dateRecrutement = '2016-11-01', solde } = {}) {
  compteur += 1;
  const matricule = `9997${String(compteur).padStart(2, '0')}`;
  const email = `doc${compteur}_${process.pid}@example.test`;
  const p = await pool.query(
    `INSERT INTO personnel (matricule, email, nom, prenom, date_recrutement, service, fonction, corps ${solde !== undefined ? ', solde_conges' : ''})
     VALUES ($1, $2, 'Test', 'Doc', $3, 'Service Doc', 'Agent', 'EFA' ${solde !== undefined ? ', $4' : ''}) RETURNING id`,
    solde !== undefined ? [matricule, email, dateRecrutement, solde] : [matricule, email, dateRecrutement]
  );
  let userId = null;
  if (avecCompte) {
    userId = (await pool.query(`INSERT INTO users (email, password_hash, role, personnel_id) VALUES ($1, 'x', 'PE', $2) RETURNING id`, [email, p.rows[0].id])).rows[0].id;
  }
  return { personnelId: p.rows[0].id, userId };
}
const solde = async (a) => Number((await pool.query(`SELECT solde_conges FROM personnel WHERE id = $1`, [a.personnelId])).rows[0].solde_conges);
const annuelApprouve = async (a, jours = 15, debut = `${ANNEE}-11-02`) => {
  const [y, m, d] = debut.split('-').map(Number);
  const fin = new Date(Date.UTC(y, m - 1, d + jours - 1)).toISOString().slice(0, 10);
  const demande = await congeService.createDemande(a.userId, { typeConge: 'Congé annuel', dateDebut: debut, dateFin: fin, lieuJouissance: 'Lieu Test' });
  // La demande démarre "en attente de vérification secrétariat" (nouvelle étape,
  // hors périmètre de ces tests de décision/document) : on la fait avancer directement.
  await pool.query(`UPDATE conges SET decision_secretariat = 'approuvee' WHERE id = $1`, [demande.id]);
  await congeService.reviewDemande(demande.id, 'approuvee', a.userId, 'ok');
  return demande;
};

test.after(async () => {
  await pool.query(`DELETE FROM documents_generes WHERE personnel_id IN (SELECT id FROM personnel WHERE matricule LIKE '9997%')`);
  await pool.query(`DELETE FROM carriere_evenements WHERE personnel_id IN (SELECT id FROM personnel WHERE matricule LIKE '9997%')`);
  await pool.query(`DELETE FROM notifications WHERE sender_id IN (SELECT id FROM users WHERE email LIKE 'doc%@example.test') OR recipient_id IN (SELECT id FROM users WHERE email LIKE 'doc%@example.test')`);
  await pool.query(`DELETE FROM activity_log WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'doc%@example.test')`);
  await pool.query(`DELETE FROM users WHERE email LIKE 'doc%@example.test'`);
  await pool.query(`DELETE FROM personnel WHERE matricule LIKE '9997%'`);
  await pool.end();
});

test('décision : contenu établi depuis le congé approuvé (jours en lettres, années, reprise = lendemain de la fin)', async () => {
  const a = await creerPersonnel();
  const d = await annuelApprouve(a, 15);
  const doc = await documentService.generateDocument(a.personnelId, 'decision_conge', { congeId: d.id }, a.userId);
  const x = doc.donnees;
  assert.match(x.numero, /^\d+\/\d{4}\/UMG\/PR\/DAAF\/PERS$/);
  assert.strictEqual(x.jours, 15);
  assert.strictEqual(x.joursEnLettres, 'quinze jours');
  assert.deepStrictEqual(x.anneesService, [ANNEE]);
  assert.strictEqual(x.lieuJouissance, 'Lieu Test');
  assert.strictEqual(x.dateDepart, `${ANNEE}-11-02`);
  assert.strictEqual(x.dateReprise, `${ANNEE}-11-17`);
  assert.strictEqual(x.ampliation.length, 5);
  assert.deepStrictEqual(x.ampliation[3], { destinataire: "Service de l'intéressé(e)", mention: 'Service Doc' });
});

test('décision : refusée si le congé n\'est pas approuvé, pas annuel, d\'un autre agent, ou déjà décidé', async () => {
  const a = await creerPersonnel();
  const b = await creerPersonnel();
  const attente = await congeService.createDemande(a.userId, { typeConge: 'Congé annuel', dateDebut: `${ANNEE}-11-02`, dateFin: `${ANNEE}-11-16` });
  await assert.rejects(documentService.generateDocument(a.personnelId, 'decision_conge', { congeId: attente.id }, a.userId), /approuvé/);
  const perm = await congeService.createDemande(a.userId, { typeConge: 'Permission', dateDebut: `${ANNEE}-12-01`, dateFin: `${ANNEE}-12-02` });
  await pool.query(`UPDATE conges SET decision_secretariat = 'approuvee' WHERE id = ANY($1)`, [[attente.id, perm.id]]);
  await congeService.reviewDemande(perm.id, 'approuvee', a.userId, 'ok');
  await assert.rejects(documentService.generateDocument(a.personnelId, 'decision_conge', { congeId: perm.id }, a.userId), /congé annuel/);
  await congeService.reviewDemande(attente.id, 'approuvee', a.userId, 'ok');
  await assert.rejects(documentService.generateDocument(b.personnelId, 'decision_conge', { congeId: attente.id }, a.userId), /n'appartient pas/);
  await assert.rejects(documentService.generateDocument(a.personnelId, 'decision_conge', {}, a.userId), /invalide/);
  await documentService.generateDocument(a.personnelId, 'decision_conge', { congeId: attente.id }, a.userId);
  await assert.rejects(documentService.generateDocument(a.personnelId, 'decision_conge', { congeId: attente.id }, a.userId), /existe déjà/);
});

test('décision : numéros uniques sous génération simultanée', async () => {
  const agents = await Promise.all([creerPersonnel(), creerPersonnel(), creerPersonnel()]);
  const conges = [];
  for (const a of agents) conges.push(await annuelApprouve(a));
  const docs = await Promise.all(agents.map((a, i) => documentService.generateDocument(a.personnelId, 'decision_conge', { congeId: conges[i].id }, a.userId)));
  const numeros = docs.map((d) => d.donnees.numero);
  assert.strictEqual(new Set(numeros).size, 3, numeros.join(' | '));
});

test('décision et génération simultanée pour un même congé : une seule décision', async () => {
  const a = await creerPersonnel();
  const d = await annuelApprouve(a);
  const res = await Promise.allSettled([1, 2, 3].map(() => documentService.generateDocument(a.personnelId, 'decision_conge', { congeId: d.id }, a.userId)));
  assert.strictEqual(res.filter((r) => r.status === 'fulfilled').length, 1);
});

test('positions : ancienne = avant le dernier changement de carrière ; sans historique, identiques', () => {
  const p = { matricule: '123456', chapitre_ib: '00 870 110', grade: 'Stagiaire', fonction: 'Chef de service', indice: '950-FOP' };
  const seul = positions(p, 'Concepteur', []);
  assert.deepStrictEqual(seul.ancienne, seul.nouvelle);
  const evenements = [
    { id: 2, date_effet: '2023-01-01', grade: 'Stagiaire', indice: '950-FOP' },
    { id: 1, date_effet: '2017-01-01', grade: '2ème Classe, 3ème Echelon', indice: '850-FOP', fonction: 'chef de service' },
  ];
  const { ancienne, nouvelle } = positions(p, 'Concepteur', evenements);
  assert.strictEqual(ancienne.grade, '2ème Classe, 3ème Echelon');
  assert.strictEqual(ancienne.indice, '850-FOP');
  assert.strictEqual(nouvelle.grade, 'Stagiaire');
  assert.strictEqual(nouvelle.indice, '950-FOP');
  assert.strictEqual(ancienne.iM, '123456'); // I.M = matricule, jamais l'indice
});

const LIGNES_ETAT = [
  { annee: 2017, libellePeriode: '2016-2017', droit: 34, reference: 'Etat de conge test', conges: [{ dateDebut: '2023-06-22', dateFin: '2023-07-06', jours: 15 }] },
  ...[2018, 2019, 2020, 2021, 2022, 2023, 2024].map((annee) => ({ annee, droit: 30 })),
];

test('saisie d\'ouverture puis état de congé : 19 + 7 x 30 = 229 jours, en lettres, égal au solde', async () => {
  const a = await creerPersonnel({ solde: 0 });
  const r = await ouvertureService.saisirOuverture(a.personnelId, { lignes: LIGNES_ETAT }, a.userId);
  assert.deepStrictEqual([r.soldeAvant, r.soldeApres], [0, 229]);
  assert.strictEqual(await solde(a), 229);
  const doc = await documentService.generateDocument(a.personnelId, 'etat_conge', {}, a.userId);
  const e = doc.donnees;
  assert.strictEqual(e.total, 229);
  assert.strictEqual(e.totalEnLettres, 'deux cent vingt-neuf jours');
  assert.strictEqual(e.lignes.length, 8);
  assert.deepStrictEqual(
    [e.lignes[0].libellePeriode, e.lignes[0].droit, e.lignes[0].pris, e.lignes[0].restant],
    ['2016-2017', 34, 15, 19]
  );
  assert.deepStrictEqual(e.lignes[0].conges, [{ dateDebut: '2023-06-22', dateFin: '2023-07-06', jours: 15 }]);
  assert.strictEqual(e.lignes[7].restant, 30);
  assert.strictEqual(e.ouverture, null);
  assert.strictEqual(e.statut, 'EFA');
});

test('après la saisie, la recharge automatique reprend l\'année suivante (pas de double comptage)', async () => {
  const a = await creerPersonnel({ solde: 0 });
  await ouvertureService.saisirOuverture(a.personnelId, { lignes: LIGNES_ETAT }, a.userId);
  const credits = await congeDroitsService.rechargerSiNecessaire(a.personnelId, undefined, 2026);
  assert.deepStrictEqual(credits.annees.map((x) => x.annee), [2025, 2026]);
  assert.strictEqual(await solde(a), 229 + 60);
});

test('saisie d\'ouverture : agent sans compte utilisateur accepté', async () => {
  const a = await creerPersonnel({ avecCompte: false, solde: 0 });
  await ouvertureService.saisirOuverture(a.personnelId, { lignes: [{ annee: 2024, droit: 30 }] }, null);
  assert.strictEqual(await solde(a), 30);
});

test('saisie d\'ouverture : remplacement d\'un solde non ventilé seulement sur confirmation explicite', async () => {
  const a = await creerPersonnel({ solde: 30 }); // ex. 30 hérité du DEFAULT historique
  const payload = { lignes: [{ annee: 2024, droit: 30, conges: [{ dateDebut: '2024-05-02', dateFin: '2024-05-06' }] }] };
  await assert.rejects(ouvertureService.saisirOuverture(a.personnelId, payload, null), (e) => e.status === 409 && /non ventilé de 30/.test(e.message));
  assert.strictEqual(await solde(a), 30); // rien n'a changé
  const r = await ouvertureService.saisirOuverture(a.personnelId, { ...payload, remplacerSoldeOuverture: true }, a.userId);
  assert.deepStrictEqual([r.soldeAvant, r.soldeApres], [30, 25]); // 30 - 5 jours pris (calculés depuis les dates)
  const trace = (await pool.query(`SELECT description FROM activity_log WHERE action_type = 'conge_ouverture_saisie' AND user_id = $1`, [a.userId])).rows[0];
  assert.match(trace.description, /solde 30 -> 25/); // remplacement tracé
});

test('saisie d\'ouverture : refus des années déjà saisies, des jours pris > droit, des données invalides', async () => {
  const a = await creerPersonnel({ solde: 0 });
  await ouvertureService.saisirOuverture(a.personnelId, { lignes: [{ annee: 2020, droit: 30 }] }, null);
  await assert.rejects(ouvertureService.saisirOuverture(a.personnelId, { lignes: [{ annee: 2020, droit: 30 }] }, null), (e) => e.status === 409);
  await assert.rejects(ouvertureService.saisirOuverture(a.personnelId, { lignes: [{ annee: 2021, droit: 10, conges: [{ dateDebut: '2021-01-01', dateFin: '2021-01-20' }] }] }, null), /dépassent le droit/);
  await assert.rejects(ouvertureService.saisirOuverture(a.personnelId, { lignes: [] }, null), /Au moins une année/);
  await assert.rejects(ouvertureService.saisirOuverture(a.personnelId, { lignes: [{ annee: 2021, droit: -1 }] }, null), /droit invalide/);
  await assert.rejects(ouvertureService.saisirOuverture(a.personnelId, { lignes: [{ annee: 2021, droit: 5, conges: [{ dateDebut: '2021-02-30', dateFin: '2021-03-01' }] }] }, null), /dates de congé/);
  await assert.rejects(ouvertureService.saisirOuverture(a.personnelId, { lignes: [{ annee: ANNEE + 5, droit: 5 }] }, null), /année invalide/);
  await assert.rejects(ouvertureService.saisirOuverture('abc', { lignes: [{ annee: 2021, droit: 5 }] }, null), /invalide/);
  await assert.rejects(ouvertureService.saisirOuverture(99999999, { lignes: [{ annee: 2021, droit: 5 }] }, null), (e) => e.status === 404);
  assert.strictEqual(await solde(a), 30); // les refus n'ont rien écrit
});

test('état de congé d\'un agent sans détail par année : le solde historique apparaît comme « solde d\'ouverture non ventilé »', async () => {
  const a = await creerPersonnel({ solde: 12 });
  const e = (await documentService.generateDocument(a.personnelId, 'etat_conge', {}, a.userId)).donnees;
  assert.strictEqual(e.lignes.length, 0);
  assert.strictEqual(e.ouverture.restant, 12);
  assert.strictEqual(e.total, 12);
  assert.strictEqual(e.totalEnLettres, 'douze jours');
});

// Reproduction de la situation des fiches réelles du Service du Personnel, avec une identité
// fictive : état de congé (34 j en 2016-2017 dont 15 pris du 22/06 au 06/07/2023, puis 30 j
// par an jusqu'en 2024 = 229 j) et décision établie a posteriori pour ce congé de 2023.
test('cas réel reproduit : état de congé (229 j) et décision pour le congé historique de 2023', async () => {
  const a = await creerPersonnel({ solde: 0 });
  await pool.query(
    `UPDATE personnel SET fonction = 'Chef de service', chapitre_ib = '00 870 110', indice = '950-FOP', grade = 'Stagiaire',
            categorie_id = (SELECT id FROM categories_professionnelles WHERE code = 'CAT8') WHERE id = $1`,
    [a.personnelId]
  );
  await pool.query(
    `INSERT INTO carriere_evenements (personnel_id, type_evenement, date_evenement, date_effet, grade, indice, fonction) VALUES
       ($1, 'Avancement de grade', '2017-01-01', '2017-01-01', '2ème Classe, 3ème Echelon', '850-FOP', 'chef de service'),
       ($1, 'Avancement de grade', '2023-01-01', '2023-01-01', 'Stagiaire', '950-FOP', 'Chef de Service')`,
    [a.personnelId]
  );
  const lignes = LIGNES_ETAT.map((l) => (l.conges ? { ...l, conges: l.conges.map((c) => ({ ...c, lieuJouissance: 'Bealanana' })) } : l));
  await ouvertureService.saisirOuverture(a.personnelId, { lignes }, a.userId);

  const etat = (await documentService.generateDocument(a.personnelId, 'etat_conge', {}, a.userId)).donnees;
  assert.strictEqual(etat.total, 229);
  assert.strictEqual(etat.totalEnLettres, 'deux cent vingt-neuf jours');

  const suivi = await ouvertureService.getSuivi(a.personnelId);
  assert.strictEqual(suivi.historiques.length, 1);
  assert.strictEqual(suivi.historiques[0].decisionEtablie, false);
  const hist = suivi.historiques[0];

  const doc = (await documentService.generateDocument(a.personnelId, 'decision_conge', { historiqueId: hist.id }, a.userId)).donnees;
  assert.match(doc.numero, /^\d+\/\d{4}\/UMG\/PR\/DAAF\/PERS$/);
  assert.strictEqual(doc.joursEnLettres, 'quinze jours');
  assert.strictEqual(doc.jours, 15);
  assert.deepStrictEqual(doc.anneesService, [2017]);
  assert.strictEqual(doc.lieuJouissance, 'Bealanana');
  assert.strictEqual(doc.dateDepart, '2023-06-22');
  assert.strictEqual(doc.dateReprise, '2023-07-07'); // lendemain de la fin (06/07/2023)
  assert.strictEqual(doc.ancienne.grade, '2ème Classe, 3ème Echelon');
  assert.strictEqual(doc.ancienne.indice, '850-FOP');
  assert.strictEqual(doc.nouvelle.grade, 'Stagiaire');
  assert.strictEqual(doc.nouvelle.indice, '950-FOP');
  assert.strictEqual(doc.nouvelle.corps, 'Concepteur');
  assert.strictEqual(doc.nouvelle.budget, '00 870 110');
  assert.strictEqual(doc.nouvelle.iM.length, 6); // I.M = matricule à 6 chiffres

  assert.strictEqual((await ouvertureService.getSuivi(a.personnelId)).historiques[0].decisionEtablie, true);
  await assert.rejects(documentService.generateDocument(a.personnelId, 'decision_conge', { historiqueId: hist.id }, a.userId), /existe déjà/);
  const autre = await creerPersonnel({ solde: 0 });
  await assert.rejects(documentService.generateDocument(autre.personnelId, 'decision_conge', { historiqueId: hist.id }, a.userId), /n'appartient pas/);
  await assert.rejects(documentService.generateDocument(a.personnelId, 'decision_conge', { historiqueId: 999999999 }, a.userId), /introuvable/);
});
