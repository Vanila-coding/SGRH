const pool = require('../config/db');

async function list() {
  const result = await pool.query(`SELECT id, nom, statut FROM etablissements ORDER BY nom`);
  return result.rows;
}

async function findById(id) {
  const result = await pool.query(`SELECT id, nom, statut FROM etablissements WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function create(nom) {
  const result = await pool.query(
    `INSERT INTO etablissements (nom) VALUES ($1) RETURNING id, nom, statut`,
    [nom]
  );
  return result.rows[0];
}

async function setStatut(id, statut) {
  const result = await pool.query(
    `UPDATE etablissements SET statut = $2 WHERE id = $1 RETURNING id, nom, statut`,
    [id, statut]
  );
  return result.rows[0] || null;
}

async function countPersonnelByEtablissement(id) {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM personnel_pe_infos WHERE etablissement_id = $1`,
    [id]
  );
  return result.rows[0].count;
}

module.exports = { list, findById, create, setStatut, countPersonnelByEtablissement };
