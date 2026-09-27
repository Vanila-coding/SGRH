const pool = require('../config/db');

async function create({ role, email, passwordHash, personnelId }) {
  const result = await pool.query(
    `INSERT INTO users (role, email, password_hash, personnel_id, status)
     VALUES ($1, $2, $3, $4, 'active')
     RETURNING id, role, email, personnel_id, status`,
    [role, email || null, passwordHash, personnelId || null]
  );
  return result.rows[0];
}

async function findByEmail(email) {
  const result = await pool.query(`SELECT * FROM user_details WHERE email = $1`, [email]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query(`SELECT * FROM user_details WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function findFullById(id) {
  const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function updatePassword(id, passwordHash) {
  const result = await pool.query(
    `UPDATE users SET password_hash = $2 WHERE id = $1 RETURNING id`,
    [id, passwordHash]
  );
  return result.rows[0];
}

async function countByRole() {
  const result = await pool.query(
    `SELECT role, COUNT(*)::int AS count FROM users WHERE status = 'active' GROUP BY role`
  );
  return result.rows;
}

async function countNewThisMonth() {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM users WHERE created_at >= date_trunc('month', CURRENT_DATE)`
  );
  return result.rows[0].count;
}

async function listActive({ role, fonction } = {}) {
  const conditions = [`status = 'active'`];
  const values = [];
  if (role) { values.push(role); conditions.push(`role = $${values.length}`); }
  if (fonction) { values.push(fonction); conditions.push(`fonction = $${values.length}`); }
  const result = await pool.query(
    `SELECT id, email, role, fonction, matricule, nom, prenom FROM user_details WHERE ${conditions.join(' AND ')} ORDER BY email`,
    values
  );
  return result.rows;
}

async function listPersonnelWithLeaveStatus({ role } = {}) {
  const conditions = [`ud.status = 'active'`, `ud.role IN ('PE', 'PAT')`];
  const values = [];
  if (role) { values.push(role); conditions.push(`ud.role = $${values.length}`); }
  const result = await pool.query(
    `SELECT ud.id, ud.email, ud.nom, ud.prenom, ud.role, ud.fonction, ud.type_contrat,
            ud.matricule, ud.corps, ud.grade, ud.service, ud.direction,
            EXISTS (
              SELECT 1 FROM conges c
              WHERE c.user_id = ud.id AND c.status = 'approuvee'
                AND CURRENT_DATE BETWEEN c.date_debut AND c.date_fin
            ) AS en_conge
     FROM user_details ud
     WHERE ${conditions.join(' AND ')}
     ORDER BY ud.nom NULLS LAST, ud.email`,
    values
  );
  return result.rows;
}

async function updateFonction(userId, fonction) {
  const result = await pool.query(
    `UPDATE personnel SET fonction = $2
     WHERE id = (SELECT personnel_id FROM users WHERE id = $1)
     RETURNING id, fonction`,
    [userId, fonction]
  );
  return result.rows[0];
}

async function findPending() {
  const result = await pool.query(
    `SELECT * FROM user_details WHERE status = 'pending' ORDER BY created_at ASC`
  );
  return result.rows;
}

async function activate(id) {
  const result = await pool.query(
    `UPDATE users SET status = 'active' WHERE id = $1 RETURNING id, role, personnel_id, status`,
    [id]
  );
  return result.rows[0];
}

async function reject(id) {
  await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
}

async function listAllAccounts() {
  const result = await pool.query(
    `SELECT id, role, status, email, matricule, nom, prenom, created_at
     FROM user_details ORDER BY created_at DESC`
  );
  return result.rows;
}

async function setStatus(id, status) {
  const result = await pool.query(
    `UPDATE users SET status = $2 WHERE id = $1 RETURNING id, role, status`,
    [id, status]
  );
  return result.rows[0];
}

async function setRole(id, role) {
  const result = await pool.query(
    `UPDATE users SET role = $2 WHERE id = $1 RETURNING id, role, status`,
    [id, role]
  );
  return result.rows[0];
}

async function deleteAccount(id) {
  await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
}

async function findFullByIdRaw(id) {
  const result = await pool.query(`SELECT * FROM users WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function deleteRaw(id) {
  await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
}

async function restore(row) {
  const result = await pool.query(
    `INSERT INTO users (id, role, email, password_hash, personnel_id, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING
     RETURNING *`,
    [row.id, row.role, row.email, row.password_hash, row.personnel_id, row.status, row.created_at]
  );
  return result.rows[0] || null;
}

module.exports = {
  create, findByEmail, findById, findFullById, updatePassword,
  countByRole, countNewThisMonth, listActive, listPersonnelWithLeaveStatus, updateFonction,
  findPending, activate, reject, listAllAccounts, setStatus, setRole, deleteAccount,
  findFullByIdRaw, deleteRaw, restore,
};