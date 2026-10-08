# 6. Modèle physique de données (MPD)

Traduction du [MCD](02_modele_donnees_dictionnaire.md#22-modèle-conceptuel-simplifié) en tables SQL réelles : noms de colonnes, types PostgreSQL, clés primaires et étrangères, contraintes. Généré par introspection de la base `rh_mahajanga` le 8 octobre 2026 (migrations jusqu'à la 022 incluse), pas recopié à la main.

Limité aux **13 tables du cœur métier** (personnel, comptes, organisation, congés, documents, contrats, grille indiciaire, permissions, notifications), pour rester dans un format exploitable au corps du texte. Le détail complet des 36 tables de la base reste disponible dans le [dictionnaire de données](02_modele_donnees_dictionnaire.md#24-dictionnaire-de-données) et dans `server/database/schema.sql` ; il peut être placé en annexe du mémoire.

## 6.1 Diagramme physique

```mermaid
erDiagram
    personnel {
        integer id PK
        varchar_6 matricule
        varchar_100 nom
        varchar_100 prenom
        varchar_150 email
        varchar_20 corps
        varchar_100 grade
        varchar_50 fonction
        varchar_100 direction
        varchar_100 service
        varchar_20 role
        varchar_50 classe
        varchar_50 echelon
        integer categorie_id FK
        varchar_50 indice
        integer indice_num
        varchar_20 indice_source
        integer ligne_grille_actuelle_id FK
        numeric solde_conges
        boolean contrat_permanent
        varchar_20 secretariat_role
        date date_recrutement
        timestamp created_at
    }

    users {
        integer id PK
        integer personnel_id FK
        varchar_150 email
        varchar_255 password_hash
        varchar_20 role
        varchar_20 status
        timestamp created_at
    }

    directions {
        integer id PK
        varchar_150 nom
        integer responsable_personnel_id FK
        boolean actif
    }

    services {
        integer id PK
        varchar_150 nom
        integer direction_id FK
        integer responsable_personnel_id FK
        boolean actif
    }

    etablissements {
        integer id PK
        varchar_200 nom
        varchar_20 statut
        timestamp created_at
    }

    conges {
        integer id PK
        integer user_id FK
        varchar_50 type_conge
        date date_debut
        date date_fin
        varchar_20 status
        integer validateur_id FK
        varchar_20 decision_intermediaire
        integer reviewed_by FK
        varchar_20 decision_secretariat
        numeric solde_avant
        numeric solde_apres
        timestamp created_at
    }

    demandes_documents {
        integer id PK
        integer personnel_id FK
        varchar_50 type_document
        varchar_20 statut
        integer document_id FK
        integer traite_par FK
        varchar_20 decision_secretariat
        timestamp date_demande
    }

    contrats {
        integer id PK
        integer personnel_id FK
        varchar_20 type_contrat
        date date_debut
        date date_fin
        integer numero_renouvellement
        integer contrat_precedent_id FK
        varchar_20 statut
        varchar_30 decision
        integer created_by FK
        integer updated_by FK
        timestamp created_at
    }

    grilles_indiciaires {
        integer id PK
        varchar_60 code
        varchar_200 nom
        varchar_30 regime
        date date_debut_validite
        date date_fin_validite
        boolean actif
    }

    lignes_grille_indiciaire {
        integer id PK
        integer grille_id FK
        varchar_10 categorie
        varchar_30 classe
        integer echelon
        integer indice
        varchar_255 source_texte
        boolean actif
    }

    permissions {
        integer id PK
        varchar_100 key
        varchar_150 label
        varchar_50 category
    }

    role_permissions {
        integer id PK
        varchar_20 role
        integer permission_id FK
        boolean enabled
    }

    notifications {
        integer id PK
        integer sender_id FK
        integer recipient_id FK
        varchar_150 title
        text message
        varchar_30 type
        boolean is_read
        timestamp created_at
    }

    personnel ||--o{ users : "users.personnel_id"
    personnel ||--o{ directions : "directions.responsable_personnel_id"
    directions ||--o{ services : "services.direction_id"
    personnel ||--o{ services : "services.responsable_personnel_id"
    users ||--o{ conges : "conges.user_id"
    users ||--o{ conges : "conges.validateur_id"
    users ||--o{ conges : "conges.reviewed_by"
    personnel ||--o{ demandes_documents : "demandes_documents.personnel_id"
    users ||--o{ demandes_documents : "demandes_documents.traite_par"
    personnel ||--o{ contrats : "contrats.personnel_id"
    contrats ||--o{ contrats : "contrats.contrat_precedent_id"
    users ||--o{ contrats : "contrats.created_by"
    users ||--o{ contrats : "contrats.updated_by"
    grilles_indiciaires ||--o{ lignes_grille_indiciaire : "lignes_grille_indiciaire.grille_id"
    lignes_grille_indiciaire ||--o{ personnel : "personnel.ligne_grille_actuelle_id"
    permissions ||--o{ role_permissions : "role_permissions.permission_id"
    users ||--o{ notifications : "notifications.recipient_id"
    users ||--o{ notifications : "notifications.sender_id"
```

*(Mermaid n'accepte pas d'espace ni de parenthèses dans les noms de type d'un bloc d'entité : `varchar_6` se lit `VARCHAR(6)`, `varchar_100` se lit `VARCHAR(100)`, etc. — à corriger en légende lisible dans la version Word, voir § 6.2.)*

## 6.2 Légende des types (pour la version Word/figure du mémoire)

| Raccourci dans le diagramme | Type PostgreSQL réel |
| --- | --- |
| `integer` | `INTEGER` |
| `varchar_N` | `VARCHAR(N)` |
| `text` | `TEXT` |
| `date` | `DATE` |
| `timestamp` | `TIMESTAMP` (sans fuseau) |
| `numeric` | `NUMERIC` |
| `boolean` | `BOOLEAN` |

## 6.3 Clés et contraintes notables

- **Toutes les clés primaires** sont des `INTEGER` auto-incrémentés (séquence PostgreSQL `nextval(...)`), sauf mention contraire.
- **Suppression** : les clés étrangères ci-dessus utilisent `CASCADE`, `SET NULL` ou `NO ACTION` selon la table (détail exact dans `server/database/schema.sql`) ; la suppression applicative passe en plus par la table `corbeille` (non représentée ici, car hors cœur métier), qui conserve une copie JSON de la ligne supprimée pour restauration.
- **Contraintes `CHECK`** (non représentées dans le diagramme, mais actives en base) : `users.role` ∈ {SUPERADMIN, ADMIN_RH, PE, PAT, MESUPRES, SECRETAIRE_PE, SECRETAIRE_PAT}, `personnel.corps` ∈ {FONCTIONNAIRE, EFA, ELD}, `conges.status` ∈ {en_attente, approuvee, refusee}, `conges.decision_secretariat` ∈ {en_attente, approuvee, refusee}, `contrats.statut` ∈ {actif, expire, resilie, ...}. Liste complète dans `docs/conception/01_regles_de_gestion.md`.
- **`personnel.direction` et `personnel.service` sont des `VARCHAR`**, pas des clés étrangères vers `directions`/`services` (voir point de vigilance n°1 du [MCD](02_modele_donnees_dictionnaire.md#23-points-de-vigilance-du-modèle)) : un écart assumé du modèle physique par rapport à ce qu'un MCD « pur » suggérerait, à mentionner explicitement dans le mémoire comme un choix documenté plutôt qu'un oubli.
- **Table hors cœur métier mais structurante** : `categories_professionnelles` (référencée par `personnel.categorie_id`) n'est pas détaillée ici ; voir le dictionnaire complet.

## 6.4 Pour la rédaction du mémoire

- Ce diagramme correspond à la section **III.7 « Modélisation du système »** du [plan de rédaction](../../client/docs/plan_redaction_memoire.md), juste après le MCD.
- Pour un rendu « boîtes » façon mémoire (une table = un rectangle avec le nom des colonnes, comme illustré dans le modèle AQUALMA), le fichier Word `docs/memoire/modele_physique_donnees.docx` reprend ces mêmes 13 tables sous forme de tableaux Word plutôt que de diagramme Mermaid (plus fiable à l'impression qu'un rendu de diagramme).
