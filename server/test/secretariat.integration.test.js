// Secrétariat : une demande relève de la catégorie métier de son auteur (PE ou PAT), un
// secrétaire ne voit ni ne vérifie sa propre demande (RG-C13, RG-C14). Données jetables :
// matricules 9996xx, emails sec*@example.test, supprimés en fin de test.
const test = require('node:test');
const assert = require('node:assert');
const pool = require('../src/config/db');
const congeService = require('../src/services/congeService');
const { categorieMetier, categorieVerifiee, estSecretaire, rolesDeCategorie } = require('../src/utils/categorieSecretariat');

let compteur = 0;

async function creerCompte(role) {
  compteur += 1;
  const matricule = `9996${String(compteur).padStart(2, '0')}`;
  const email = `sec${compteur}_${process.pid}@example.test`;
  const p = await pool.query(
    `INSERT INTO personnel (matricule, email, nom, prenom, service, fonction, corps)
     VALUES ($1, $2, 'Test', 'Sec', 'Service Sec', 'Agent', 'EFA') RETURNING id`,
    [matricule, email]
  );
  const u = await pool.query(
    `INSERT INTO users (email, password_hash, role, personnel_id) VALUES ($1, 'x', $2, $3) RETURNING id`,
    [email, role, p.rows[0].id]
  );
  return { userId: u.rows[0].id, personnelId: p.rows[0].id };
}

const demande = (userId, dateDebut) => congeService.createDemande(userId, {
  typeConge: 'Permission', dateDebut, dateFin: dateDebut,
});

test.after(async () => {
  await pool.query(`DELETE FROM conges WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'sec%@example.test')`);
  await pool.query(`DELETE FROM notifications WHERE sender_id IN (SELECT id FROM users WHERE email LIKE 'sec%@example.test') OR recipient_id IN (SELECT id FROM users WHERE email LIKE 'sec%@example.test')`);
  await pool.query(`DELETE FROM activity_log WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'sec%@example.test')`);
  await pool.query(`DELETE FROM users WHERE email LIKE 'sec%@example.test'`);
  await pool.query(`DELETE FROM personnel WHERE matricule LIKE '9996%'`);
  await pool.end();
});

test('catégories : un secrétaire est PAT et vérifie la catégorie de son rôle', () => {
  assert.strictEqual(categorieMetier('PE'), 'PE');
  assert.strictEqual(categorieMetier('PAT'), 'PAT');
  assert.strictEqual(categorieMetier('SECRETAIRE_PE'), 'PAT');
  assert.strictEqual(categorieMetier('SECRETAIRE_PAT'), 'PAT');
  assert.strictEqual(categorieVerifiee('SECRETAIRE_PE'), 'PE');
  assert.strictEqual(categorieVerifiee('SECRETAIRE_PAT'), 'PAT');
  assert.strictEqual(categorieVerifiee('ADMIN_RH'), null);
  assert.strictEqual(estSecretaire('ADMIN_RH'), false);
  assert.strictEqual(estSecretaire('SECRETAIRE_PE'), true);
  assert.deepStrictEqual(rolesDeCategorie('PE'), ['PE']);
  assert.deepStrictEqual(rolesDeCategorie('PAT'), ['PAT', 'SECRETAIRE_PE', 'SECRETAIRE_PAT']);
});

test('files : chaque secrétaire ne voit que sa catégorie, et jamais sa propre demande', async () => {
  const secPE = await creerCompte('SECRETAIRE_PE');
  const secPAT = await creerCompte('SECRETAIRE_PAT');
  const pe = await creerCompte('PE');

  const demandePE = await demande(pe.userId, '2031-03-10');
  const demandeSecPE = await demande(secPE.userId, '2031-03-11');

  const ids = async (role, userId) => (await congeService.getPendingForSecretariat(role, userId)).map((d) => d.id);

  const filePE = await ids('SECRETAIRE_PE', secPE.userId);
  assert.ok(filePE.includes(demandePE.id), 'le secrétaire PE voit la demande d\'un PE');
  assert.ok(!filePE.includes(demandeSecPE.id), 'le secrétaire PE ne voit pas sa propre demande');

  const filePAT = await ids('SECRETAIRE_PAT', secPAT.userId);
  assert.ok(filePAT.includes(demandeSecPE.id), 'la demande d\'un secrétaire (PAT) est dans la file PAT');
  assert.ok(!filePAT.includes(demandePE.id), 'la file PAT ne contient pas les demandes PE');

  const fileRH = await ids('ADMIN_RH', null);
  assert.ok(fileRH.includes(demandePE.id) && fileRH.includes(demandeSecPE.id), 'le RH voit toutes les demandes (repli)');
});

test('vérification : refus de vérifier sa propre demande ou une demande d\'une autre catégorie', async () => {
  const secPE = await creerCompte('SECRETAIRE_PE');
  const secPAT = await creerCompte('SECRETAIRE_PAT');
  const pe = await creerCompte('PE');
  const demandePE = await demande(pe.userId, '2031-04-10');
  const demandeSecPE = await demande(secPE.userId, '2031-04-11');

  await assert.rejects(
    congeService.reviewSecretariat(demandeSecPE.id, 'approuvee', secPE.userId, 'SECRETAIRE_PE', 'ok'),
    /propre demande/
  );
  await assert.rejects(
    congeService.reviewSecretariat(demandePE.id, 'approuvee', secPAT.userId, 'SECRETAIRE_PAT', 'ok'),
    /ne relève pas de votre secrétariat/
  );

  // Le secrétaire PAT peut vérifier la demande de son collègue secrétaire.
  const verifiee = await congeService.reviewSecretariat(demandeSecPE.id, 'approuvee', secPAT.userId, 'SECRETAIRE_PAT', 'ok');
  assert.strictEqual(verifiee.decision_secretariat, 'approuvee');
});
