// Catégorie métier (PE ou PAT) des demandes et catégorie vérifiée par un secrétaire.
//
// Un secrétaire est toujours un PAT (RG-P06) : ses propres demandes relèvent donc de la
// catégorie PAT, quel que soit le rôle SECRETAIRE_* qu'il porte. En revanche, le rôle
// SECRETAIRE_PE / SECRETAIRE_PAT indique la catégorie qu'il vérifie.

// Catégorie métier d'un demandeur (PE ou PAT), à partir de son rôle d'accès.
function categorieMetier(role) {
  if (role === 'PE') return 'PE';
  if (role === 'PAT' || role === 'SECRETAIRE_PE' || role === 'SECRETAIRE_PAT') return 'PAT';
  return null;
}

// Catégorie qu'un rôle secrétaire vérifie. null pour ADMIN_RH et SUPERADMIN, qui servent
// de repli et vérifient toutes les catégories.
function categorieVerifiee(role) {
  if (role === 'SECRETAIRE_PE') return 'PE';
  if (role === 'SECRETAIRE_PAT') return 'PAT';
  return null;
}

function estSecretaire(role) {
  return categorieVerifiee(role) !== null;
}

// Rôles d'accès qui entrent dans une catégorie métier, pour filtrer les listes en SQL.
function rolesDeCategorie(categorie) {
  return ['PE', 'PAT', 'SECRETAIRE_PE', 'SECRETAIRE_PAT'].filter((role) => categorieMetier(role) === categorie);
}

module.exports = { categorieMetier, categorieVerifiee, estSecretaire, rolesDeCategorie };
