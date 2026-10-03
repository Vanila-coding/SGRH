const pool = require('../config/db');

async function listDirections({ tous = false } = {}) {
  const result = await pool.query(
    `SELECT id, nom, responsable_personnel_id, actif FROM directions ${tous ? '' : 'WHERE actif'} ORDER BY nom`
  );
  return result.rows;
}

async function listServices(directionId, { tous = false } = {}) {
  const filtres = [];
  const valeurs = [];
  if (directionId) {
    valeurs.push(directionId);
    filtres.push(`direction_id = $${valeurs.length}`);
  }
  if (!tous) filtres.push('actif');
  const where = filtres.length ? `WHERE ${filtres.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT id, nom, direction_id, responsable_personnel_id, actif FROM services ${where} ORDER BY nom`,
    valeurs
  );
  return result.rows;
}

async function findDirectionById(id) {
  const result = await pool.query(`SELECT id, nom, responsable_personnel_id, actif FROM directions WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function findDirectionByNom(nom) {
  const result = await pool.query(`SELECT id, nom, actif FROM directions WHERE nom = $1`, [nom]);
  return result.rows[0] || null;
}

async function findServiceById(id) {
  const result = await pool.query(`SELECT id, nom, direction_id, responsable_personnel_id, actif FROM services WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function findServiceByNomEtDirection(nom, directionId) {
  const result = await pool.query(
    `SELECT id, nom, direction_id, actif FROM services WHERE nom = $1 AND direction_id = $2`,
    [nom, directionId]
  );
  return result.rows[0] || null;
}

async function createDirection(nom) {
  const result = await pool.query(
    `INSERT INTO directions (nom) VALUES ($1) RETURNING id, nom, responsable_personnel_id, actif`,
    [nom]
  );
  return result.rows[0];
}

async function deleteDirection(id) {
  await pool.query(`DELETE FROM directions WHERE id = $1`, [id]);
}

async function createService(nom, directionId) {
  const result = await pool.query(
    `INSERT INTO services (nom, direction_id) VALUES ($1, $2) RETURNING id, nom, direction_id, responsable_personnel_id, actif`,
    [nom, directionId]
  );
  return result.rows[0];
}

async function deleteService(id) {
  await pool.query(`DELETE FROM services WHERE id = $1`, [id]);
}

// personnel.direction / personnel.service sont du texte libre relié par le nom (pas de FK,
// voir server/database/MCD.md) : un renommage doit donc être répercuté sur les fiches.
async function updateDirection(id, { nom, actif }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const avant = (await client.query(`SELECT nom FROM directions WHERE id = $1 FOR UPDATE`, [id])).rows[0];
    if (!avant) {
      await client.query('ROLLBACK');
      return null;
    }
    const result = await client.query(
      `UPDATE directions SET nom = $2, actif = $3 WHERE id = $1 RETURNING id, nom, responsable_personnel_id, actif`,
      [id, nom, actif]
    );
    if (avant.nom !== nom) {
      await client.query(`UPDATE personnel SET direction = $2 WHERE direction = $1`, [avant.nom, nom]);
    }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateService(id, { nom, actif }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const avant = (await client.query(
      `SELECT s.nom, d.nom AS direction_nom FROM services s JOIN directions d ON d.id = s.direction_id WHERE s.id = $1 FOR UPDATE OF s`,
      [id]
    )).rows[0];
    if (!avant) {
      await client.query('ROLLBACK');
      return null;
    }
    const result = await client.query(
      `UPDATE services SET nom = $2, actif = $3 WHERE id = $1 RETURNING id, nom, direction_id, responsable_personnel_id, actif`,
      [id, nom, actif]
    );
    if (avant.nom !== nom) {
      await client.query(
        `UPDATE personnel SET service = $2 WHERE service = $1 AND direction = $3`,
        [avant.nom, nom, avant.direction_nom]
      );
    }
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function countServicesByDirection(directionId) {
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM services WHERE direction_id = $1`, [directionId]);
  return result.rows[0].count;
}

async function countPersonnelByDirectionNom(nom) {
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM personnel WHERE direction = $1`, [nom]);
  return result.rows[0].count;
}

async function countPersonnelByServiceNom(nom) {
  const result = await pool.query(`SELECT COUNT(*)::int AS count FROM personnel WHERE service = $1`, [nom]);
  return result.rows[0].count;
}

async function syncResponsable(personnelId, fonction, service, direction) {
  // On retire d'abord cette personne de tout poste de responsable existant
  // (cas d'un changement de service/direction/fonction)
  await pool.query(`UPDATE directions SET responsable_personnel_id = NULL WHERE responsable_personnel_id = $1`, [personnelId]);
  await pool.query(`UPDATE services SET responsable_personnel_id = NULL WHERE responsable_personnel_id = $1`, [personnelId]);

  if (fonction === 'Chef de service' && service) {
    await pool.query(`UPDATE services SET responsable_personnel_id = $1 WHERE nom = $2`, [personnelId, service]);
  }
  if (fonction === 'Responsable/Directeur' && direction) {
    await pool.query(`UPDATE directions SET responsable_personnel_id = $1 WHERE nom = $2`, [personnelId, direction]);
  }
}

module.exports = {
  listDirections, listServices, syncResponsable,
  findDirectionById, findDirectionByNom, findServiceById, findServiceByNomEtDirection,
  createDirection, deleteDirection, createService, deleteService,
  updateDirection, updateService,
  countServicesByDirection, countPersonnelByDirectionNom, countPersonnelByServiceNom,
};
