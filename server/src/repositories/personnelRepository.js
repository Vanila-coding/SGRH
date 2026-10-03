const pool = require('../config/db');

async function create({
  matricule, nom, prenom, email, role, fonction, corps, grade, poste, service, direction, telephone, typeContrat,
  dateRecrutement, dateEcheanceContrat, contratPermanent, indice, chapitreIb, categorieId,
  classe, echelon, indiceNum, indiceSource, secretariatRole,
}) {
  const result = await pool.query(
    `INSERT INTO personnel (
       matricule, nom, prenom, email, role, fonction, corps, grade, poste, service, direction, telephone, type_contrat,
       date_recrutement, date_echeance_contrat, contrat_permanent, indice, chapitre_ib, categorie_id,
       classe, echelon, indice_num, indice_source, secretariat_role
     )
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
     RETURNING *`,
    [
      matricule, nom, prenom, email, role, fonction || null, corps || null, grade || null, poste || null,
      service || null, direction || null, telephone || null, typeContrat || null,
      dateRecrutement || null, contratPermanent ? null : (dateEcheanceContrat || null), !!contratPermanent,
      indice || null, chapitreIb || null, categorieId || null,
      classe || null, echelon || null, indiceNum ?? null, indiceSource || 'A_CONFIRMER', secretariatRole || null,
    ]
  );
  return result.rows[0];
}

async function findByUserId(userId) {
  const result = await pool.query(
    `SELECT p.*, cp.code AS categorie_code, cp.appellation AS categorie_appellation,
       (SELECT array_agg(pr.role ORDER BY pr.role) FROM personnel_roles pr WHERE pr.personnel_id = p.id) AS roles,
       pe.etablissement_id, pe.corps_pe, pe.categorie_libelle, pe.diplome, pe.specialite,
       et.nom AS etablissement_nom,
       COALESCE(
         (SELECT resp.nom || ' ' || resp.prenom FROM services s JOIN personnel resp ON resp.id = s.responsable_personnel_id WHERE s.nom = p.service AND resp.id != p.id),
         (SELECT resp.nom || ' ' || resp.prenom FROM directions d JOIN personnel resp ON resp.id = d.responsable_personnel_id WHERE d.nom = p.direction AND resp.id != p.id)
       ) AS responsable_hierarchique
     FROM personnel p
     LEFT JOIN categories_professionnelles cp ON cp.id = p.categorie_id
     LEFT JOIN personnel_pe_infos pe ON pe.personnel_id = p.id
     LEFT JOIN etablissements et ON et.id = pe.etablissement_id
     JOIN users u ON u.personnel_id = p.id WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

// Fiche complète d'un personnel (vue RH « Voir la fiche ») : mêmes champs que /me
// (catégorie, responsable hiérarchique) plus l'existence et le statut du compte.
async function findDetailleById(id) {
  const result = await pool.query(
    `SELECT p.*, cp.code AS categorie_code, cp.appellation AS categorie_appellation,
       (u.id IS NOT NULL) AS a_un_compte, u.status AS statut_compte,
       (SELECT array_agg(pr.role ORDER BY pr.role) FROM personnel_roles pr WHERE pr.personnel_id = p.id) AS roles,
       pe.etablissement_id, pe.corps_pe, pe.categorie_libelle, pe.diplome, pe.specialite,
       et.nom AS etablissement_nom,
       COALESCE(
         (SELECT resp.nom || ' ' || resp.prenom FROM services s JOIN personnel resp ON resp.id = s.responsable_personnel_id WHERE s.nom = p.service AND resp.id != p.id),
         (SELECT resp.nom || ' ' || resp.prenom FROM directions d JOIN personnel resp ON resp.id = d.responsable_personnel_id WHERE d.nom = p.direction AND resp.id != p.id)
       ) AS responsable_hierarchique
     FROM personnel p
     LEFT JOIN categories_professionnelles cp ON cp.id = p.categorie_id
     LEFT JOIN users u ON u.personnel_id = p.id
     LEFT JOIN personnel_pe_infos pe ON pe.personnel_id = p.id
     LEFT JOIN etablissements et ON et.id = pe.etablissement_id
     WHERE p.id = $1`,
    [id]
  );
  return result.rows[0] || null;
}

async function updatePhoto(id, photoPath) {
  const result = await pool.query(
    `UPDATE personnel SET photo_profil = $2 WHERE id = $1 RETURNING *`,
    [id, photoPath]
  );
  return result.rows[0] || null;
}

async function findByMatricule(matricule) {
  const result = await pool.query(`SELECT * FROM personnel WHERE matricule = $1`, [matricule]);
  return result.rows[0] || null;
}

async function findByEmailRaw(email) {
  const result = await pool.query(`SELECT * FROM personnel WHERE email = $1`, [email]);
  return result.rows[0] || null;
}

async function isLinkedToUser(personnelId) {
  const result = await pool.query(`SELECT id FROM users WHERE personnel_id = $1`, [personnelId]);
  return result.rows.length > 0;
}

async function findLinkedUserId(personnelId) {
  const result = await pool.query(`SELECT id FROM users WHERE personnel_id = $1`, [personnelId]);
  return result.rows[0]?.id || null;
}

async function listAll() {
  const result = await pool.query(
    `SELECT p.*, (u.id IS NOT NULL) AS a_un_compte, cp.code AS categorie_code, cp.appellation AS categorie_appellation,
       (SELECT array_agg(pr.role ORDER BY pr.role) FROM personnel_roles pr WHERE pr.personnel_id = p.id) AS roles,
       pe.etablissement_id, pe.corps_pe, pe.categorie_libelle, pe.diplome, pe.specialite,
       et.nom AS etablissement_nom
     FROM personnel p
     LEFT JOIN users u ON u.personnel_id = p.id
     LEFT JOIN categories_professionnelles cp ON cp.id = p.categorie_id
     LEFT JOIN personnel_pe_infos pe ON pe.personnel_id = p.id
     LEFT JOIN etablissements et ON et.id = pe.etablissement_id
     ORDER BY p.nom NULLS LAST, p.matricule`
  );
  return result.rows;
}

async function findByIdRaw(id) {
  const result = await pool.query(`SELECT * FROM personnel WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function listWithoutAccount() {
  const result = await pool.query(
    `SELECT p.* FROM personnel p
     LEFT JOIN users u ON u.personnel_id = p.id
     WHERE u.id IS NULL
     ORDER BY p.nom NULLS LAST, p.matricule`
  );
  return result.rows;
}

// Verrouille la fiche (FOR UPDATE, dans la transaction de l'appelant) et renvoie
// ce qu'il faut pour calculer les droits à congé manquants.
async function lockPourRecharge(personnelId, db = pool) {
  const result = await db.query(
    `SELECT id, solde_conges, derniere_recharge_annee, date_recrutement::text AS date_recrutement, created_at
     FROM personnel WHERE id = $1 FOR UPDATE`,
    [personnelId]
  );
  return result.rows[0] || null;
}

async function appliquerRecharge(personnelId, jours, annee, db = pool) {
  await db.query(
    `UPDATE personnel SET solde_conges = solde_conges + $2, derniere_recharge_annee = $3 WHERE id = $1`,
    [personnelId, jours, annee]
  );
}

async function getSolde(personnelId, db = pool) {
  const result = await db.query(`SELECT solde_conges FROM personnel WHERE id = $1`, [personnelId]);
  return Number(result.rows[0]?.solde_conges ?? 0);
}

// Débit atomique qui ne peut jamais rendre le solde négatif : renvoie le nouveau
// solde, ou null si le solde est insuffisant (aucune modification dans ce cas).
async function debiterSoldeSiSuffisant(personnelId, jours, db = pool) {
  const result = await db.query(
    `UPDATE personnel SET solde_conges = solde_conges - $2
     WHERE id = $1 AND solde_conges >= $2 RETURNING solde_conges`,
    [personnelId, jours]
  );
  return result.rows[0] ? Number(result.rows[0].solde_conges) : null;
}

async function crediterSolde(personnelId, jours, db = pool) {
  const result = await db.query(
    `UPDATE personnel SET solde_conges = solde_conges + $2 WHERE id = $1 RETURNING solde_conges`,
    [personnelId, jours]
  );
  return Number(result.rows[0]?.solde_conges ?? 0);
}

async function findChefDeServiceUser(service, excludeUserId) {
  const result = await pool.query(
    `SELECT u.id AS user_id FROM personnel p
     JOIN users u ON u.personnel_id = p.id
     WHERE p.service = $1 AND p.fonction = 'Chef de service' AND u.id != $2 AND u.status = 'active'
     LIMIT 1`,
    [service, excludeUserId]
  );
  return result.rows[0]?.user_id || null;
}

async function findResponsableDirectionUser(direction, excludeUserId) {
  const result = await pool.query(
    `SELECT u.id AS user_id FROM personnel p
     JOIN users u ON u.personnel_id = p.id
     WHERE p.direction = $1 AND p.fonction = 'Responsable/Directeur' AND u.id != $2 AND u.status = 'active'
     LIMIT 1`,
    [direction, excludeUserId]
  );
  return result.rows[0]?.user_id || null;
}

async function findEquipeParService(service, excludeUserId) {
  const result = await pool.query(
    `SELECT ud.id, ud.email, ud.nom, ud.prenom, ud.role, ud.fonction, ud.matricule,
            EXISTS (
              SELECT 1 FROM conges c
              WHERE c.user_id = ud.id AND c.status = 'approuvee'
                AND CURRENT_DATE BETWEEN c.date_debut AND c.date_fin
            ) AS en_conge
     FROM user_details ud
     WHERE ud.service = $1 AND ud.id != $2 AND ud.status = 'active'
     ORDER BY ud.nom NULLS LAST`,
    [service, excludeUserId]
  );
  return result.rows;
}

async function findEquipeParDirection(direction, excludeUserId) {
  const result = await pool.query(
    `SELECT ud.id, ud.email, ud.nom, ud.prenom, ud.role, ud.fonction, ud.matricule, ud.service,
            EXISTS (
              SELECT 1 FROM conges c
              WHERE c.user_id = ud.id AND c.status = 'approuvee'
                AND CURRENT_DATE BETWEEN c.date_debut AND c.date_fin
            ) AS en_conge
     FROM user_details ud
     WHERE ud.direction = $1 AND ud.id != $2 AND ud.status = 'active'
     ORDER BY ud.nom NULLS LAST`,
    [direction, excludeUserId]
  );
  return result.rows;
}

async function updateInfosPersonnelles(personnelId, { telephone, adresse, situationFamiliale, dateNaissance, sexe, lieuNaissance, nationalite, datePriseFonction }) {
  const result = await pool.query(
    `UPDATE personnel
     SET telephone = $2, adresse = $3, situation_familiale = $4,
         date_naissance = $5, sexe = $6, lieu_naissance = $7, nationalite = $8, date_prise_fonction = $9
     WHERE id = $1 RETURNING *`,
    [
      personnelId, telephone || null, adresse || null, situationFamiliale || null,
      dateNaissance || null, sexe || null, lieuNaissance || null, nationalite || null, datePriseFonction || null,
    ]
  );
  return result.rows[0];
}

async function updateFiche(id, {
  nom, prenom, email, corps, grade, poste, service, direction, telephone, typeContrat,
  dateRecrutement, dateEcheanceContrat, contratPermanent, classe, echelon, indice, chapitreIb, categorieId,
  indiceNum, indiceSource, ligneGrilleActuelleId,
}) {
  const result = await pool.query(
    `UPDATE personnel SET
       nom = $2, prenom = $3, email = $4, corps = $5, grade = $6, poste = $7, service = $8, direction = $9,
       telephone = $10, type_contrat = $11, date_recrutement = $12,
       date_echeance_contrat = $13, contrat_permanent = $14, classe = $15, echelon = $16, indice = $17, chapitre_ib = $18,
       categorie_id = $19, indice_num = $20, indice_source = $21, ligne_grille_actuelle_id = $22
     WHERE id = $1 RETURNING *`,
    [
      id, nom || null, prenom || null, email, corps || null, grade || null, poste || null,
      service || null, direction || null, telephone || null, typeContrat || null,
      dateRecrutement || null, contratPermanent ? null : (dateEcheanceContrat || null), !!contratPermanent,
      classe || null, echelon || null, indice || null, chapitreIb || null, categorieId || null,
      indiceNum ?? null, indiceSource || 'A_CONFIRMER', ligneGrilleActuelleId || null,
    ]
  );
  return result.rows[0];
}

// Met à jour uniquement le "snapshot" de situation courante (classe/échelon/indice/
// grille) — jamais les autres champs de la fiche. Appelée après chaque événement de
// carrière pour que `personnel` reste un dérivé synchronisé de l'historique
// (carriere_evenements reste la source de vérité), et non une valeur qui pourrait
// diverger silencieusement (prompt §14).
async function syncSituationCourante(id, { cadre, echelle, classe, echelon, indice, indiceNum, indiceSource, ligneGrilleActuelleId }) {
  const result = await pool.query(
    `UPDATE personnel SET
       cadre = $2, echelle = $3, classe = $4, echelon = $5, indice = $6,
       indice_num = $7, indice_source = $8, ligne_grille_actuelle_id = $9
     WHERE id = $1 RETURNING *`,
    [id, cadre || null, echelle || null, classe || null, echelon || null, indice || null,
     indiceNum ?? null, indiceSource || 'A_CONFIRMER', ligneGrilleActuelleId || null]
  );
  return result.rows[0] || null;
}

// Remplace entièrement les rôles d'un personnel (0 à 2 lignes : PE, PAT, ou les deux).
// personnel.role (colonne historique) est maintenu en synchronisation avec le premier
// rôle de la liste, uniquement pour compatibilité descendante — voir plan PE/PAT.
async function setRoles(personnelId, roles, db = pool) {
  const rolesValides = [...new Set((roles || []).filter((r) => r === 'PE' || r === 'PAT'))];
  await db.query(`DELETE FROM personnel_roles WHERE personnel_id = $1`, [personnelId]);
  for (const role of rolesValides) {
    await db.query(`INSERT INTO personnel_roles (personnel_id, role) VALUES ($1, $2)`, [personnelId, role]);
  }
  await db.query(`UPDATE personnel SET role = $2 WHERE id = $1`, [personnelId, rolesValides[0] || null]);
  return rolesValides;
}

async function getRoles(personnelId) {
  const result = await pool.query(`SELECT role FROM personnel_roles WHERE personnel_id = $1 ORDER BY role`, [personnelId]);
  return result.rows.map((r) => r.role);
}

// Crée ou remplace les informations PE d'un personnel. Passer `null` explicitement pour
// un champ l'efface (ex. retrait de l'établissement) ; `undefined` (champ absent du
// payload) conserve la valeur existante.
async function upsertPeInfos(personnelId, { etablissementId, corpsPe, categorieLibelle, diplome, specialite }) {
  const existing = await pool.query(`SELECT * FROM personnel_pe_infos WHERE personnel_id = $1`, [personnelId]);
  const actuel = existing.rows[0] || {};
  const result = await pool.query(
    `INSERT INTO personnel_pe_infos (personnel_id, etablissement_id, corps_pe, categorie_libelle, diplome, specialite, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, now())
     ON CONFLICT (personnel_id) DO UPDATE SET
       etablissement_id = $2, corps_pe = $3, categorie_libelle = $4, diplome = $5, specialite = $6, updated_at = now()
     RETURNING *`,
    [
      personnelId,
      etablissementId !== undefined ? etablissementId : actuel.etablissement_id ?? null,
      corpsPe !== undefined ? corpsPe : actuel.corps_pe ?? null,
      categorieLibelle !== undefined ? categorieLibelle : actuel.categorie_libelle ?? null,
      diplome !== undefined ? diplome : actuel.diplome ?? null,
      specialite !== undefined ? specialite : actuel.specialite ?? null,
    ]
  );
  return result.rows[0];
}

async function removePeInfos(personnelId) {
  await pool.query(`DELETE FROM personnel_pe_infos WHERE personnel_id = $1`, [personnelId]);
}

module.exports = {
  create, findByUserId, updatePhoto, findByMatricule, findByEmailRaw, isLinkedToUser, findLinkedUserId,
  listAll, findByIdRaw, findDetailleById, listWithoutAccount,
  lockPourRecharge, appliquerRecharge, getSolde, debiterSoldeSiSuffisant, crediterSolde,
  findChefDeServiceUser, findResponsableDirectionUser,
  findEquipeParService, findEquipeParDirection,
  updateInfosPersonnelles, updateFiche, syncSituationCourante,
  setRoles, getRoles, upsertPeInfos, removePeInfos,
};