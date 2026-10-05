const pool = require('../config/db');
const { rolesDeCategorie } = require('../utils/categorieSecretariat');

async function create({ userId, typeConge, dateDebut, dateFin, motif, lieuJouissance, dateRepriseService, remplacant }, db = pool) {
  const result = await db.query(
    `INSERT INTO conges (user_id, type_conge, date_debut, date_fin, motif, lieu_jouissance, date_reprise_service, remplacant)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [userId, typeConge, dateDebut, dateFin, motif || null, lieuJouissance || null, dateRepriseService || null, remplacant || null]
  );
  return result.rows[0];
}

async function findByUser(userId) {
  const result = await pool.query(
    `SELECT * FROM conges WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

async function findPending() {
  const result = await pool.query(
    `SELECT c.*, ud.email, ud.nom, ud.prenom, ud.role
     FROM conges c JOIN user_details ud ON ud.id = c.user_id
     WHERE c.status = 'en_attente' AND c.decision_intermediaire != 'en_attente'
       AND c.decision_secretariat = 'approuvee'
     ORDER BY c.created_at ASC`
  );
  return result.rows;
}

// File du secrétariat : `roleCible` = 'PE' | 'PAT' pour un compte SECRETAIRE_*
// (ne voit que sa catégorie), ou null pour ADMIN_RH/SUPERADMIN (repli anti-blocage,
// voient les deux catégories).
// categorie : 'PE' | 'PAT' | null (toutes). exclureUserId : le secrétaire ne voit pas ses propres demandes.
async function findPendingForSecretariat(categorie, exclureUserId = null) {
  const conditions = [`c.decision_secretariat = 'en_attente'`];
  const values = [];
  if (categorie) { values.push(rolesDeCategorie(categorie)); conditions.push(`ud.role = ANY($${values.length})`); }
  if (exclureUserId) { values.push(exclureUserId); conditions.push(`c.user_id <> $${values.length}`); }
  const result = await pool.query(
    `SELECT c.*, ud.email, ud.nom, ud.prenom, ud.role
     FROM conges c JOIN user_details ud ON ud.id = c.user_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY c.created_at ASC`,
    values
  );
  return result.rows;
}

// Conditionnel comme setDecisionIntermediaire : une seule décision secrétariat possible.
async function setDecisionSecretariat(id, decision, avis, db = pool) {
  const result = await db.query(
    `UPDATE conges SET decision_secretariat = $2, decision_secretariat_le = NOW(), avis_secretariat = $3
     WHERE id = $1 AND decision_secretariat = 'en_attente' RETURNING *`,
    [id, decision, avis || null]
  );
  return result.rows[0] || null;
}

async function findPendingForValidateur(validateurUserId) {
  const result = await pool.query(
    `SELECT c.*, ud.email, ud.nom, ud.prenom, ud.role
     FROM conges c JOIN user_details ud ON ud.id = c.user_id
     WHERE c.validateur_id = $1 AND c.decision_intermediaire = 'en_attente'
     ORDER BY c.created_at ASC`,
    [validateurUserId]
  );
  return result.rows;
}

async function findById(id, db = pool) {
  const result = await db.query(`SELECT * FROM conges WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

// Conditionnel : ne change le statut que d'une demande encore en attente. Renvoie
// null sinon, ce qui empêche un second traitement (et donc une double restitution
// de jours) même si deux décisions arrivent en même temps.
async function updateStatus(id, status, reviewedBy, avisChefService, db = pool) {
  const result = await db.query(
    `UPDATE conges SET status = $2, reviewed_by = $3, reviewed_at = NOW(), avis_chef_service = COALESCE($4, avis_chef_service)
     WHERE id = $1 AND status = 'en_attente' RETURNING *`,
    [id, status, reviewedBy, avisChefService || null]
  );
  return result.rows[0] || null;
}

async function setValidateur(id, validateurId, decisionIntermediaire, db = pool) {
  await db.query(
    `UPDATE conges SET validateur_id = $2, decision_intermediaire = $3 WHERE id = $1`,
    [id, validateurId, decisionIntermediaire]
  );
}

// Conditionnel comme updateStatus : une seule décision intermédiaire possible.
async function setDecisionIntermediaire(id, decision, avis, db = pool) {
  const result = await db.query(
    `UPDATE conges SET decision_intermediaire = $2, decision_intermediaire_le = NOW(), avis_chef_service = $3
     WHERE id = $1 AND decision_intermediaire = 'en_attente' RETURNING *`,
    [id, decision, avis || null]
  );
  return result.rows[0] || null;
}

async function findRecent(limit = 5) {
  const result = await pool.query(
    `SELECT c.*, ud.email, ud.nom, ud.prenom, ud.role
     FROM conges c JOIN user_details ud ON ud.id = c.user_id
     ORDER BY c.created_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

async function findForMonth(year, month) {
  const result = await pool.query(
    `SELECT c.id, c.date_debut, c.date_fin, c.status, ud.nom, ud.prenom
     FROM conges c JOIN user_details ud ON ud.id = c.user_id
     WHERE c.status IN ('approuvee', 'en_attente')
       AND c.date_debut <= (make_date($1, $2, 1) + INTERVAL '1 month' - INTERVAL '1 day')
       AND c.date_fin >= make_date($1, $2, 1)`,
    [year, month]
  );
  return result.rows;
}

async function findByIdWithDetails(id) {
  const result = await pool.query(
    `SELECT c.*, (c.date_fin - c.date_debut + 1) AS nombre_jours,
            ud.matricule, ud.nom, ud.prenom, ud.fonction, ud.corps, ud.grade, ud.role, ud.email,
            ud.service, ud.direction,
            cp.appellation AS categorie,
            vd.nom AS validateur_nom, vd.prenom AS validateur_prenom, vd.fonction AS validateur_fonction,
            COALESCE((SELECT json_agg(json_build_object('annee', ci.annee, 'jours', ci.jours) ORDER BY ci.annee NULLS FIRST)
                      FROM conges_imputations ci WHERE ci.conge_id = c.id), '[]'::json) AS imputations
     FROM conges c
     JOIN user_details ud ON ud.id = c.user_id
     LEFT JOIN user_details vd ON vd.id = c.validateur_id
     LEFT JOIN personnel p ON p.id = ud.personnel_id
     LEFT JOIN categories_professionnelles cp ON cp.id = p.categorie_id
     WHERE c.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function countCongesAnnuelCetteAnnee(userId, db = pool) {
  const result = await db.query(
    `SELECT COUNT(*)::int AS count FROM conges
     WHERE user_id = $1 AND type_conge = 'Congé annuel'
       AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`,
    [userId]
  );
  return result.rows[0].count;
}

// Jours de congé annuel posés (en attente ou approuvés, hors refusés) dont le début
// tombe dans l'année : jours consommés du droit annuel.
async function sommeJoursAnnuelsAnnee(userId, annee) {
  const result = await pool.query(
    `SELECT COALESCE(SUM(date_fin - date_debut + 1), 0)::int AS jours FROM conges
     WHERE user_id = $1 AND type_conge = 'Congé annuel' AND status <> 'refusee'
       AND EXTRACT(YEAR FROM date_debut) = $2`,
    [userId, annee]
  );
  return result.rows[0].jours;
}

// Congés annuels approuvés pour lesquels aucune décision n'a encore été établie.
async function findApprouveesSansDecision() {
  const result = await pool.query(
    `SELECT c.id, c.date_debut, c.date_fin, c.lieu_jouissance, c.reviewed_at, u.personnel_id,
            ud.matricule, ud.nom, ud.prenom
     FROM conges c
     JOIN user_details ud ON ud.id = c.user_id
     JOIN users u ON u.id = c.user_id
     WHERE c.type_conge = 'Congé annuel' AND c.status = 'approuvee'
       AND NOT EXISTS (SELECT 1 FROM documents_generes d
                       WHERE d.type_document = 'decision_conge' AND d.donnees->>'congeId' = c.id::text)
     ORDER BY c.reviewed_at DESC NULLS LAST, c.id DESC`
  );
  return result.rows;
}

async function setJustificatif(id, filename, filePath) {
  const result = await pool.query(
    `UPDATE conges SET justificatif_filename = $2, justificatif_path = $3 WHERE id = $1 RETURNING *`,
    [id, filename, filePath]
  );
  return result.rows[0];
}

module.exports = {
  create, findByUser, findPending, findPendingForValidateur, findById,
  updateStatus, setValidateur, setDecisionIntermediaire,
  findPendingForSecretariat, setDecisionSecretariat,
  findRecent, findForMonth, findByIdWithDetails, countCongesAnnuelCetteAnnee,
  setJustificatif, sommeJoursAnnuelsAnnee, findApprouveesSansDecision,
};