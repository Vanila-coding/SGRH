const pool = require('../config/db');
const { rolesDeCategorie } = require('../utils/categorieSecretariat');

async function create({ personnelId, typeDocument, motif }) {
  const result = await pool.query(
    `INSERT INTO demandes_documents (personnel_id, type_document, motif)
     VALUES ($1, $2, $3) RETURNING *`,
    [personnelId, typeDocument, motif || null]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await pool.query(`SELECT * FROM demandes_documents WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function findPending() {
  const result = await pool.query(
    `SELECT d.*, p.matricule, p.nom, p.prenom, p.email
     FROM demandes_documents d JOIN personnel p ON p.id = d.personnel_id
     WHERE d.statut = 'en_attente' AND d.decision_secretariat = 'approuvee'
     ORDER BY d.date_demande ASC`
  );
  return result.rows;
}

// File du secrétariat : `roleCible` = 'PE' | 'PAT' pour un compte SECRETAIRE_*
// (ne voit que sa catégorie), ou null pour ADMIN_RH/SUPERADMIN (repli anti-blocage).
// categorie : 'PE' | 'PAT' | null (toutes). exclureUserId : le secrétaire ne voit pas ses propres demandes.
async function findPendingForSecretariat(categorie, exclureUserId = null) {
  const conditions = [`d.decision_secretariat = 'en_attente'`];
  const values = [];
  if (categorie) { values.push(rolesDeCategorie(categorie)); conditions.push(`u.role = ANY($${values.length})`); }
  if (exclureUserId) { values.push(exclureUserId); conditions.push(`u.id <> $${values.length}`); }
  const result = await pool.query(
    `SELECT d.*, p.matricule, p.nom, p.prenom, p.email, u.role AS requester_role
     FROM demandes_documents d
     JOIN personnel p ON p.id = d.personnel_id
     JOIN users u ON u.personnel_id = p.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY d.date_demande ASC`,
    values
  );
  return result.rows;
}

// Conditionnel : une seule décision secrétariat possible (protège contre un double
// traitement, même motif que congeRepository.setDecisionIntermediaire).
async function setDecisionSecretariat(id, decision, avis) {
  const result = await pool.query(
    `UPDATE demandes_documents SET decision_secretariat = $2, decision_secretariat_le = NOW(), avis_secretariat = $3
     WHERE id = $1 AND decision_secretariat = 'en_attente' RETURNING *`,
    [id, decision, avis || null]
  );
  return result.rows[0] || null;
}

async function findByPersonnel(personnelId) {
  const result = await pool.query(
    `SELECT * FROM demandes_documents WHERE personnel_id = $1 ORDER BY date_demande DESC`,
    [personnelId]
  );
  return result.rows;
}

async function marquerTraitee(id, documentId, traitePar) {
  const result = await pool.query(
    `UPDATE demandes_documents SET statut = 'traitee', document_id = $2, traite_par = $3, date_traitement = NOW()
     WHERE id = $1 RETURNING *`,
    [id, documentId, traitePar]
  );
  return result.rows[0];
}

async function marquerRefusee(id, traitePar) {
  const result = await pool.query(
    `UPDATE demandes_documents SET statut = 'refusee', traite_par = $2, date_traitement = NOW()
     WHERE id = $1 RETURNING *`,
    [id, traitePar]
  );
  return result.rows[0];
}

module.exports = {
  create, findById, findPending, findByPersonnel, marquerTraitee, marquerRefusee,
  findPendingForSecretariat, setDecisionSecretariat,
};