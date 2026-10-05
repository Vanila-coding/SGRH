# 3. Matrice des rôles et permissions

## 3.1 Principe

Chaque compte porte un rôle d'accès (`users.role`). Chaque rôle reçoit des permissions par la table `role_permissions`, qui relie un rôle à une permission (`permissions`). Le champ `enabled` permet de désactiver une permission sans supprimer la ligne.

Un rôle n'est donc jamais testé directement dans les routes sensibles : les routes vérifient une permission (`requirePermission('clé')`). Une exception est volontaire : **SUPERADMIN hérite de toutes les permissions d'ADMIN_RH** (fonction `rolesToCheck` dans `permissionRepository`), sans duplication de lignes.

## 3.2 Rôles

| Rôle (`users.role`) | Libellé | Qui | Périmètre |
|---|---|---|---|
| `SUPERADMIN` | Superadmin | Administrateur système | Sites et textes, permissions, corbeille, supervision. Hérite des droits RH, sans espace personnel. |
| `ADMIN_RH` | Admin RH | Service des ressources humaines | Gestion complète : personnel, carrière, congés, documents, comptes en attente. Pas de gestion des comptes (permission désactivée, voir 3.5). |
| `PE` | Personnel enseignant | Enseignant ou enseignant-chercheur | Espace personnel : son dossier, sa carrière, ses congés, ses documents. |
| `PAT` | Personnel administratif et technique | Agent administratif ou technique | Espace personnel (dossier, carrière, congés, documents). Ne consulte pas les fiches des autres agents. |
| `SECRETAIRE_PE` | Secrétaire PE | PAT désigné par la RH | Espace personnel, plus la **vérification** des demandes de congé et de documents des PE. Ne décide pas. |
| `SECRETAIRE_PAT` | Secrétaire PAT | PAT désigné par la RH | Même chose, pour les demandes des PAT. |

Règle de désignation : seul un agent **PAT** peut être secrétaire, et il le devient par désignation RH (à la création de la fiche, ou ensuite dans « Gestion des comptes »). Un PE n'est jamais secrétaire. Le rôle d'accès du secrétaire donne la catégorie qu'il vérifie : `SECRETAIRE_PE` vérifie les demandes des PE, `SECRETAIRE_PAT` celles des PAT.

## 3.3 Matrice des permissions

Légende : ✔ accordée, ✘ désactivée (ligne présente, `enabled = false`), — non définie. La colonne SUPERADMIN tient compte de l'héritage d'ADMIN_RH.

<!-- BEGIN GENERE:MATRICE -->
31 permissions. « (hérité) » : SUPERADMIN n'a pas de ligne propre et reçoit la permission par héritage d'ADMIN_RH.

| Clé | Permission | Catégorie | ADMIN_RH | SUPERADMIN | PE | PAT | SECRETAIRE_PE | SECRETAIRE_PAT |
|---|---|---|---|---|---|---|---|---|
| `create_personnel` | Ajouter un employé | Admin RH | ✔ | ✔ | — | — | — | — |
| `manage_documents` | Générer des documents administratifs | Admin RH | ✔ | ✔ | — | — | — | — |
| `manage_etablissements` | Gérer les établissements (PE) | Admin RH | ✔ | ✔ (hérité) | — | — | — | — |
| `manage_fonctions` | Gérer les fonctions/grades | Admin RH | ✔ | ✔ | — | — | — | — |
| `manage_organisation` | Gérer les directions et services | Admin RH | ✔ | ✔ (hérité) | — | — | — | — |
| `send_registration_link` | Envoyer un lien d'inscription | Admin RH | ✔ | ✔ | — | — | — | — |
| `view_dashboard_admin` | Voir le tableau de bord Admin RH | Admin RH | ✔ | ✔ | — | — | — | — |
| `view_historique` | Voir le journal d'activité | Admin RH | ✔ | ✔ | — | — | — | — |
| `view_pending_accounts` | Voir/valider les comptes en attente | Admin RH | ✔ | ✔ | — | — | — | — |
| `view_personnel` | Voir la liste du personnel | Admin RH | ✔ | ✔ | — | ✘ | — | — |
| `delete_carriere_evenement` | Supprimer un événement de carrière | Carrière | ✔ | ✔ | — | — | — | — |
| `manage_parametres_carriere` | Configurer les paramètres de carrière | Carrière | ✔ | ✔ | — | — | — | — |
| `manage_situations_administratives` | Gérer les situations administratives et contrats | Carrière | ✔ | ✔ | — | — | — | — |
| `send_notification` | Envoyer une notification | Communication | ✔ | ✔ | — | — | — | — |
| `view_notifications` | Voir ses notifications | Communication | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `create_conge` | Faire une demande de congé | Congés | — | ✔ | ✔ | ✔ | ✔ | ✔ |
| `view_conges_admin` | Voir/traiter les demandes de congé (Admin) | Congés | ✔ | ✔ | — | — | — | — |
| `view_mes_conges` | Voir ses propres demandes | Congés | — | ✘ | ✔ | ✔ | ✔ | ✔ |
| `demander_document` | Demander un document administratif | Personnel | — | ✘ | ✔ | ✔ | ✔ | ✔ |
| `modifier_mes_infos` | Modifier ses informations personnelles | Personnel | — | ✘ | ✔ | ✔ | ✔ | ✔ |
| `signaler_probleme` | Signaler un problème (réclamation) | Personnel | — | — | ✔ | ✔ | ✔ | ✔ |
| `view_mes_documents` | Voir mes documents | Personnel | — | ✘ | ✔ | ✔ | ✔ | ✔ |
| `view_profil` | Voir son profil | Personnel | — | ✘ | ✔ | ✔ | ✔ | ✔ |
| `review_conges_secretariat` | Vérifier les demandes de congé (secrétariat) | Secrétariat | ✔ | ✔ (hérité) | — | — | ✔ | ✔ |
| `review_documents_secretariat` | Vérifier les demandes de documents (secrétariat) | Secrétariat | ✔ | ✔ (hérité) | — | — | ✔ | ✔ |
| `manage_accounts` | Activer/désactiver/supprimer des comptes | Superadmin | ✘ | ✔ | — | — | — | — |
| `manage_corbeille` | Gérer la corbeille | Superadmin | — | ✔ | — | — | — | — |
| `manage_permissions` | Gérer les permissions par rôle | Superadmin | — | ✔ | — | — | — | — |
| `manage_reclamations` | Gérer les réclamations du personnel | Superadmin | — | ✔ | — | — | — | — |
| `manage_site_settings` | Modifier l'apparence du site | Superadmin | — | ✔ | — | — | — | — |
| `manage_site_texts` | Modifier les textes du site | Superadmin | — | ✔ | — | — | — | — |
<!-- END GENERE:MATRICE -->

## 3.4 Contrôles hors matrice

Tous les contrôles ne passent pas par la table `role_permissions`. Trois autres mécanismes existent, à connaître pour l'audit :

1. **Routes côté interface** : chaque page est protégée par `allowedRoles` dans `client/src/App.jsx`. C'est un confort d'affichage ; la sécurité reste côté serveur.
2. **Contrôle de propriété** : une personne ne lit que ses propres demandes (`isOwner`, par exemple dans `getDemandeDetails`). Cela s'ajoute à la permission, il ne la remplace pas.
3. **Contrôle de catégorie** pour les secrétaires : un secrétaire ne voit et ne vérifie que les demandes de sa catégorie (PE ou PAT). Ce contrôle est dans le service (`reviewSecretariat`, `reviewDemandeSecretariat`), pas dans la matrice.

## 3.5 Décisions à confirmer

- **`manage_accounts` réservé au superadmin.** Décision de la RH : ADMIN_RH ne gère pas les comptes (désactivation, suppression, changement de rôle). La permission reste désactivée pour ADMIN_RH.
- **`view_personnel` absent pour PE et désactivé pour PAT.** Ni PE ni PAT ne consultent les fiches des autres agents ; seuls ADMIN_RH et SUPERADMIN le peuvent. C'est le comportement voulu à confirmer, car la consultation de l'équipe (« Mon équipe ») passe par un autre écran.
- **Séparation des tâches.** Un secrétaire ne voit pas et ne vérifie pas sa propre demande (appliqué dans les services et les listes). Un ADMIN_RH en repli peut encore vérifier sa propre demande : cas accepté, à confirmer.
