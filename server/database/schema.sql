-- =============================================================================
-- SGRH — Université de Mahajanga : schéma complet PostgreSQL
-- =============================================================================
-- Reproduit la structure réelle utilisée par le backend et le frontend (32 tables
-- de la base rh_mahajanga + 1 table de référence `roles`), sans réutiliser aucune
-- ancienne structure. À exécuter sur une base VIDE ; ne jamais l'exécuter sur une
-- base existante (utiliser les migrations server/migrations/ dans ce cas).
--
-- Écarts volontaires par rapport à la base actuelle (tous compatibles avec le code) :
--   B1  table `roles` + clés étrangères users/personnel/invitations/role_permissions
--       (remplace le CHECK users_role_check et le rôle inutilisé MESUPRES) ;
--   B3  CHECK sur les types de document (documents_generes, demandes_documents) ;
--   B6  index supplémentaires sur les clés étrangères et les recherches fréquentes.
--
-- Écarts connus NON corrigés, car les corriger changerait le comportement du
-- backend ou du frontend actuels (voir la documentation du MCD) :
--   - personnel.service / personnel.direction : texte relié par le nom (import Excel
--     en saisie libre) ;
--   - personnel.type_contrat / date_echeance_contrat / contrat_permanent /
--     notif_echeance_envoyee : doublonnent la table contrats (utilisés par 3 services) ;
--   - carriere_evenements.fonction : texte libre (formulaire de carrière) ;
--   - conges.user_id : la demande est liée au compte demandeur.
--
-- Matricule : personnel.matricule = 6 chiffres. Un indice comme « 950-FOP » est un
-- indice (colonnes `indice`), jamais un matricule.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Références sans dépendance
-- ---------------------------------------------------------------------------

CREATE TABLE roles (
  code    VARCHAR(20) PRIMARY KEY,
  libelle VARCHAR(100) NOT NULL
);

CREATE TABLE categories_professionnelles (
  id             SERIAL PRIMARY KEY,
  numero         INTEGER NOT NULL UNIQUE,
  code           VARCHAR(10) NOT NULL UNIQUE,
  appellation    VARCHAR(100) NOT NULL,
  niveau_diplome VARCHAR(100),
  CONSTRAINT categories_professionnelles_numero_check CHECK (numero BETWEEN 1 AND 8 AND numero <> 7)
);

CREATE TABLE permissions (
  id       SERIAL PRIMARY KEY,
  key      VARCHAR(100) NOT NULL UNIQUE,
  label    VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL
);

CREATE TABLE types_situation_administrative (
  id                    SERIAL PRIMARY KEY,
  code                  VARCHAR(40) NOT NULL UNIQUE,
  libelle               VARCHAR(100) NOT NULL,
  categories_concernees VARCHAR(100)
);

CREATE TABLE grilles_indiciaires (
  id                     SERIAL PRIMARY KEY,
  code                   VARCHAR(60) NOT NULL UNIQUE,
  nom                    VARCHAR(200) NOT NULL,
  regime                 VARCHAR(30) NOT NULL,
  description            TEXT,
  texte_source_principal VARCHAR(255) NOT NULL,
  date_debut_validite    DATE NOT NULL,
  date_fin_validite      DATE,
  actif                  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMP NOT NULL DEFAULT now(),
  updated_at             TIMESTAMP,
  CONSTRAINT grilles_indiciaires_regime_check CHECK (regime IN ('FONCTIONNAIRE', 'AGENT_NON_ENCADRE', 'AUTRE')),
  CONSTRAINT grilles_indiciaires_dates_check CHECK (date_fin_validite IS NULL OR date_fin_validite >= date_debut_validite)
);

CREATE TABLE lignes_grille_indiciaire (
  id                    SERIAL PRIMARY KEY,
  grille_id             INTEGER NOT NULL REFERENCES grilles_indiciaires(id) ON DELETE CASCADE,
  cadre                 VARCHAR(5),
  echelle               VARCHAR(5),
  categorie             VARCHAR(10),
  corps                 VARCHAR(50),
  classe                VARCHAR(30) NOT NULL,
  echelon               INTEGER NOT NULL,
  indice                INTEGER NOT NULL,
  code_grille_affichage VARCHAR(20),
  source_texte          VARCHAR(255) NOT NULL,
  source_article        VARCHAR(150),
  date_debut_validite   DATE NOT NULL,
  date_fin_validite     DATE,
  actif                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMP NOT NULL DEFAULT now(),
  updated_at            TIMESTAMP,
  CONSTRAINT lignes_grille_cadre_check CHECK (cadre IS NULL OR cadre IN ('A', 'B', 'C', 'D')),
  CONSTRAINT lignes_grille_classe_check CHECK (classe IN ('CLASSE_EXCEPTIONNELLE', 'PRINCIPALAT', 'PREMIERE_CLASSE', 'DEUXIEME_CLASSE')),
  CONSTRAINT lignes_grille_dates_check CHECK (date_fin_validite IS NULL OR date_fin_validite >= date_debut_validite),
  CONSTRAINT lignes_grille_echelon_par_classe_check CHECK (
    (classe = 'CLASSE_EXCEPTIONNELLE' AND echelon BETWEEN 1 AND 2)
    OR (classe IN ('PRINCIPALAT', 'PREMIERE_CLASSE', 'DEUXIEME_CLASSE') AND echelon BETWEEN 1 AND 3)
  ),
  CONSTRAINT lignes_grille_indice_check CHECK (indice > 0)
);
CREATE INDEX idx_lignes_grille_cadre_echelle ON lignes_grille_indiciaire (grille_id, cadre, echelle, classe, echelon);
CREATE INDEX idx_lignes_grille_categorie ON lignes_grille_indiciaire (grille_id, categorie, classe, echelon);

-- ---------------------------------------------------------------------------
-- 2. Personnel et comptes
-- ---------------------------------------------------------------------------

CREATE TABLE personnel (
  id                       SERIAL PRIMARY KEY,
  matricule                VARCHAR(6) NOT NULL UNIQUE,
  nom                      VARCHAR(100),
  prenom                   VARCHAR(100),
  email                    VARCHAR(150) NOT NULL UNIQUE,
  fonction                 VARCHAR(50),
  corps                    VARCHAR(20),
  grade                    VARCHAR(100),
  service                  VARCHAR(100),
  direction                VARCHAR(100),
  telephone                VARCHAR(30),
  type_contrat             VARCHAR(20),
  created_at               TIMESTAMP NOT NULL DEFAULT now(),
  role                     VARCHAR(20) REFERENCES roles(code),
  date_recrutement         DATE,
  date_echeance_contrat    DATE,
  contrat_permanent        BOOLEAN NOT NULL DEFAULT FALSE,
  solde_conges             NUMERIC(6,1) NOT NULL DEFAULT 0,
  derniere_recharge_annee  INTEGER,
  notif_echeance_envoyee   BOOLEAN NOT NULL DEFAULT FALSE,
  indice                   VARCHAR(50),
  chapitre_ib              VARCHAR(100),
  lieu_naissance           VARCHAR(150),
  date_naissance           DATE,
  nationalite              VARCHAR(100),
  situation_familiale      VARCHAR(20),
  adresse                  TEXT,
  sexe                     VARCHAR(10),
  photo_profil             TEXT,
  date_prise_fonction      DATE,
  poste                    VARCHAR(150),
  classe                   VARCHAR(50),
  echelon                  VARCHAR(50),
  categorie_id             INTEGER REFERENCES categories_professionnelles(id),
  cadre                    VARCHAR(5),
  echelle                  VARCHAR(5),
  indice_num               INTEGER,
  ligne_grille_actuelle_id INTEGER REFERENCES lignes_grille_indiciaire(id) ON DELETE SET NULL,
  indice_source            VARCHAR(20) NOT NULL DEFAULT 'A_CONFIRMER',
  CONSTRAINT personnel_matricule_check CHECK (matricule ~ '^[0-9]{6}$'),
  CONSTRAINT personnel_role_check CHECK (role IN ('PE', 'PAT')),
  CONSTRAINT personnel_fonction_check CHECK (fonction IN ('Enseignant', 'Enseignant Chercheur', 'Maître de Conférences', 'Professeur', 'Agent', 'Chef de service', 'Responsable/Directeur')),
  CONSTRAINT personnel_corps_check CHECK (corps IN ('EFA', 'ELD', 'Fonctionnaire')),
  CONSTRAINT personnel_type_contrat_check CHECK (type_contrat IN ('CDI', 'CDD', 'Vacataire', 'Stagiaire')),
  CONSTRAINT personnel_sexe_check CHECK (sexe IN ('Masculin', 'Féminin')),
  CONSTRAINT personnel_situation_familiale_check CHECK (situation_familiale IN ('Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve')),
  CONSTRAINT personnel_cadre_check CHECK (cadre IS NULL OR cadre IN ('A', 'B', 'C', 'D')),
  CONSTRAINT personnel_indice_source_check CHECK (indice_source IN ('IMPORT_EXCEL', 'SAISIE_RH', 'REGLEMENTAIRE', 'A_CONFIRMER'))
);
CREATE INDEX idx_personnel_service ON personnel (service);
CREATE INDEX idx_personnel_direction ON personnel (direction);
CREATE INDEX idx_personnel_categorie ON personnel (categorie_id);

-- Un même personnel peut être PE et/ou PAT en même temps : remplace personnel.role
-- (valeur unique, conservée pour compatibilité mais plus considérée comme source de
-- vérité) par 0 à 2 lignes ici.
CREATE TABLE personnel_roles (
  id           SERIAL PRIMARY KEY,
  personnel_id INTEGER NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  role         VARCHAR(20) NOT NULL CHECK (role IN ('PE', 'PAT')),
  created_at   TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT personnel_roles_unique UNIQUE (personnel_id, role)
);
CREATE INDEX idx_personnel_roles_personnel ON personnel_roles (personnel_id);
CREATE INDEX idx_personnel_roles_role ON personnel_roles (role);

-- Établissements de l'université pour les PE, gérés par le Superadmin/RH. Désactivation
-- (statut) plutôt que suppression physique, pour ne jamais perdre l'historique des
-- enseignants qui y sont/étaient rattachés.
CREATE TABLE etablissements (
  id         SERIAL PRIMARY KEY,
  nom        VARCHAR(200) NOT NULL,
  statut     VARCHAR(20) NOT NULL DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'INACTIF')),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_etablissements_nom ON etablissements (nom);

-- Informations propres aux PE — sans rapport avec corps/categorie_id sur `personnel`,
-- qui décrivent le régime PAT (EFA/ELD/Fonctionnaire), pas les grades académiques.
CREATE TABLE personnel_pe_infos (
  personnel_id      INTEGER PRIMARY KEY REFERENCES personnel(id) ON DELETE CASCADE,
  etablissement_id  INTEGER REFERENCES etablissements(id),
  corps_pe          VARCHAR(20),
  categorie_libelle VARCHAR(150),
  diplome           VARCHAR(150),
  specialite        VARCHAR(200),
  updated_at        TIMESTAMP
);
CREATE INDEX idx_personnel_pe_infos_etablissement ON personnel_pe_infos (etablissement_id);

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL REFERENCES roles(code),
  status        VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at    TIMESTAMP NOT NULL DEFAULT now(),
  personnel_id  INTEGER UNIQUE REFERENCES personnel(id),
  CONSTRAINT users_status_check CHECK (status IN ('pending', 'active', 'inactive'))
);

-- Vue de lecture : compte + fiche (utilisée par le backend).
CREATE VIEW user_details AS
  SELECT u.id, u.role, u.status, u.password_hash, u.personnel_id, u.created_at,
         COALESCE(u.email, p.email) AS email,
         p.matricule, p.nom, p.prenom, p.fonction, p.corps, p.grade, p.service, p.direction,
         p.telephone, p.type_contrat
  FROM users u LEFT JOIN personnel p ON p.id = u.personnel_id;

CREATE TABLE role_permissions (
  id            SERIAL PRIMARY KEY,
  role          VARCHAR(20) NOT NULL REFERENCES roles(code),
  permission_id INTEGER NOT NULL REFERENCES permissions(id),
  enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT role_permissions_role_permission_id_key UNIQUE (role, permission_id)
);

CREATE TABLE invitations (
  id              SERIAL PRIMARY KEY,
  email           VARCHAR(150) NOT NULL,
  role            VARCHAR(20) NOT NULL REFERENCES roles(code),
  token           VARCHAR(255) NOT NULL UNIQUE,
  status          VARCHAR(20) NOT NULL DEFAULT 'envoyee',
  submitted_data  JSONB,
  sent_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  expires_at      TIMESTAMP NOT NULL,
  fonction        VARCHAR(50),
  matricule       VARCHAR(6),
  CONSTRAINT invitations_role_check CHECK (role IN ('PE', 'PAT')),
  CONSTRAINT invitations_status_check CHECK (status IN ('envoyee', 'soumise', 'confirmee', 'refusee'))
);
CREATE INDEX idx_invitations_email ON invitations (email);

CREATE TABLE otp_codes (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(150) NOT NULL,
  code       VARCHAR(4) NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_otp_codes_email ON otp_codes (email, expires_at);

CREATE TABLE password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) NOT NULL UNIQUE,
  used       BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_password_reset_user ON password_reset_tokens (user_id);

-- ---------------------------------------------------------------------------
-- 3. Organisation
-- ---------------------------------------------------------------------------

CREATE TABLE directions (
  id                       SERIAL PRIMARY KEY,
  nom                      VARCHAR(150) NOT NULL UNIQUE,
  responsable_personnel_id INTEGER UNIQUE REFERENCES personnel(id)
);

CREATE TABLE services (
  id                       SERIAL PRIMARY KEY,
  nom                      VARCHAR(150) NOT NULL,
  direction_id             INTEGER NOT NULL REFERENCES directions(id),
  responsable_personnel_id INTEGER UNIQUE REFERENCES personnel(id),
  CONSTRAINT services_nom_direction_id_key UNIQUE (nom, direction_id)
);

-- ---------------------------------------------------------------------------
-- 4. Carrière, situations administratives, diplômes
-- ---------------------------------------------------------------------------

CREATE TABLE carriere_evenements (
  id                    SERIAL PRIMARY KEY,
  personnel_id          INTEGER NOT NULL REFERENCES personnel(id),
  type_evenement        VARCHAR(50) NOT NULL,
  description           TEXT,
  date_evenement        DATE NOT NULL,
  created_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMP NOT NULL DEFAULT now(),
  date_effet            DATE,
  ancienne_situation    JSONB,
  nouvelle_situation    JSONB,
  corps                 VARCHAR(20),
  grade                 VARCHAR(100),
  classe                VARCHAR(50),
  echelon               VARCHAR(50),
  indice                VARCHAR(50),
  fonction              VARCHAR(50),
  affectation           VARCHAR(150),
  motif                 TEXT,
  reference_decision    VARCHAR(150),
  autorite_decision     VARCHAR(150),
  observations          TEXT,
  justificatif_filename VARCHAR(255),
  justificatif_path     VARCHAR(255),
  updated_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at            TIMESTAMP,
  ligne_grille_id       INTEGER REFERENCES lignes_grille_indiciaire(id) ON DELETE SET NULL,
  indice_num            INTEGER,
  indice_source         VARCHAR(20) NOT NULL DEFAULT 'A_CONFIRMER',
  CONSTRAINT carriere_evenements_indice_source_check CHECK (indice_source IN ('IMPORT_EXCEL', 'SAISIE_RH', 'REGLEMENTAIRE', 'A_CONFIRMER')),
  CONSTRAINT carriere_evenements_type_evenement_check CHECK (type_evenement IN (
    'Recrutement', 'Stage', 'Titularisation', 'Prolongation de stage', 'Avancement d''échelon',
    'Avancement de grade', 'Reclassement', 'Changement de fonction', 'Changement d''affectation',
    'Changement de service', 'Mise à disposition', 'Détachement', 'Disponibilité', 'Formation ou diplôme',
    'Changement de qualification', 'Avenant au contrat', 'Renouvellement de contrat',
    'Suspension ou événement disciplinaire', 'Retraite', 'Fin de contrat',
    'Cessation définitive de fonctions', 'Réintégration', 'Autre'))
);
CREATE INDEX idx_carriere_evenements_personnel ON carriere_evenements (personnel_id, date_evenement);

CREATE TABLE personnel_diplomes (
  id                SERIAL PRIMARY KEY,
  personnel_id      INTEGER NOT NULL REFERENCES personnel(id),
  intitule          VARCHAR(200) NOT NULL,
  etablissement     VARCHAR(200),
  annee_obtention   INTEGER,
  document_filename VARCHAR(255),
  document_path     VARCHAR(255),
  created_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_personnel_diplomes_personnel ON personnel_diplomes (personnel_id);

CREATE TABLE fonction_history (
  id                SERIAL PRIMARY KEY,
  user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ancienne_fonction VARCHAR(50),
  nouvelle_fonction VARCHAR(50) NOT NULL,
  changed_by        INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_at        TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_fonction_history_user ON fonction_history (user_id);

CREATE TABLE situations_administratives (
  id                 SERIAL PRIMARY KEY,
  personnel_id       INTEGER NOT NULL REFERENCES personnel(id),
  type_situation_id  INTEGER NOT NULL REFERENCES types_situation_administrative(id),
  date_debut         DATE NOT NULL,
  date_fin           DATE,
  reference_decision VARCHAR(150),
  document_filename  VARCHAR(255),
  document_path      VARCHAR(255),
  observations       TEXT,
  created_by         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT now(),
  motif              TEXT,
  CONSTRAINT situations_administratives_dates_check CHECK (date_fin IS NULL OR date_fin >= date_debut)
);
-- Un personnel a au plus une situation ouverte (date_fin IS NULL).
CREATE UNIQUE INDEX uniq_situation_ouverte_par_personnel ON situations_administratives (personnel_id) WHERE date_fin IS NULL;
CREATE INDEX idx_situations_personnel ON situations_administratives (personnel_id, date_debut);

CREATE TABLE alertes_avancement (
  id                     SERIAL PRIMARY KEY,
  personnel_id           INTEGER NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  type                   VARCHAR(30) NOT NULL,
  date_echeance_theorique DATE,
  statut                 VARCHAR(20) NOT NULL DEFAULT 'OUVERTE',
  details                JSONB,
  evenement_resultant_id INTEGER REFERENCES carriere_evenements(id) ON DELETE SET NULL,
  created_at             TIMESTAMP NOT NULL DEFAULT now(),
  traite_at              TIMESTAMP,
  traite_par             INTEGER REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT alertes_avancement_statut_check CHECK (statut IN ('OUVERTE', 'TRAITEE', 'IGNOREE')),
  CONSTRAINT alertes_avancement_type_check CHECK (type IN ('AVANCEMENT_ECHELON_ECHU', 'AVANCEMENT_CLASSE_ELIGIBLE', 'INCOHERENCE_INDICE', 'GRILLE_INCONNUE', 'DOSSIER_INCOMPLET'))
);
CREATE INDEX idx_alertes_avancement_personnel_id ON alertes_avancement (personnel_id);
CREATE UNIQUE INDEX uniq_alertes_avancement_ouverte ON alertes_avancement (personnel_id, type) WHERE statut = 'OUVERTE';

CREATE TABLE parametres_carriere (
  cle         VARCHAR(80) PRIMARY KEY,
  valeur      VARCHAR(200) NOT NULL,
  description TEXT,
  a_valider   BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMP NOT NULL DEFAULT now(),
  updated_by  INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------------------
-- 5. Contrats
-- ---------------------------------------------------------------------------

CREATE TABLE contrats (
  id                       SERIAL PRIMARY KEY,
  personnel_id             INTEGER NOT NULL REFERENCES personnel(id),
  type_contrat             VARCHAR(20) NOT NULL,
  date_debut               DATE NOT NULL,
  date_fin                 DATE,
  numero_renouvellement    INTEGER NOT NULL DEFAULT 0,
  contrat_precedent_id     INTEGER REFERENCES contrats(id) ON DELETE SET NULL,
  statut                   VARCHAR(20) NOT NULL DEFAULT 'actif',
  decision                 VARCHAR(30),
  motif_non_renouvellement TEXT,
  reference_decision       VARCHAR(150),
  observations             TEXT,
  notifie_echeance_le      TIMESTAMP,
  created_by               INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by               INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at               TIMESTAMP NOT NULL DEFAULT now(),
  updated_at               TIMESTAMP,
  notifie_expiration_le    TIMESTAMP,
  CONSTRAINT contrats_type_contrat_check CHECK (type_contrat IN ('CDI', 'CDD', 'Vacataire', 'Stagiaire')),
  CONSTRAINT contrats_statut_check CHECK (statut IN ('actif', 'expire', 'renouvele', 'non_renouvele', 'resilie')),
  CONSTRAINT contrats_decision_check CHECK (decision IS NULL OR decision IN ('renouvele_renegociation', 'non_renouvele')),
  CONSTRAINT contrats_dates_check CHECK (date_fin IS NULL OR date_fin >= date_debut),
  CONSTRAINT contrats_motif_non_renouvellement_check CHECK (
    decision IS DISTINCT FROM 'non_renouvele' OR (motif_non_renouvellement IS NOT NULL AND btrim(motif_non_renouvellement) <> ''))
);
CREATE INDEX idx_contrats_personnel_id ON contrats (personnel_id);
CREATE INDEX idx_contrats_statut ON contrats (statut);
CREATE INDEX idx_contrats_date_fin ON contrats (date_fin);
-- Un seul contrat actif par personnel.
CREATE UNIQUE INDEX uniq_contrats_actif_par_personnel ON contrats (personnel_id) WHERE statut = 'actif';

CREATE TABLE documents_contrat (
  id            SERIAL PRIMARY KEY,
  contrat_id    INTEGER NOT NULL REFERENCES contrats(id) ON DELETE CASCADE,
  type_document VARCHAR(30) NOT NULL DEFAULT 'contrat_original',
  filename      VARCHAR(255) NOT NULL,
  path          VARCHAR(255) NOT NULL,
  mime_type     VARCHAR(100),
  taille_octets INTEGER,
  importe_par   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  importe_le    TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT documents_contrat_type_check CHECK (type_document IN ('contrat_original', 'avenant', 'autre'))
);
CREATE INDEX idx_documents_contrat_contrat_id ON documents_contrat (contrat_id);

-- ---------------------------------------------------------------------------
-- 6. Congés
-- ---------------------------------------------------------------------------

CREATE TABLE conges (
  id                        SERIAL PRIMARY KEY,
  user_id                   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type_conge                VARCHAR(50) NOT NULL,
  date_debut                DATE NOT NULL,
  date_fin                  DATE NOT NULL,
  motif                     TEXT,
  status                    VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  reviewed_by               INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at               TIMESTAMP,
  created_at                TIMESTAMP NOT NULL DEFAULT now(),
  avis_chef_service         TEXT,
  lieu_jouissance           VARCHAR(150),
  date_reprise_service      DATE,
  remplacant                VARCHAR(150),
  validateur_id             INTEGER REFERENCES users(id) ON DELETE SET NULL,
  decision_intermediaire    VARCHAR(20) NOT NULL DEFAULT 'non_requise',
  decision_intermediaire_le TIMESTAMP,
  justificatif_filename     VARCHAR(255),
  justificatif_path         VARCHAR(255),
  solde_avant               NUMERIC(6,1),
  solde_apres               NUMERIC(6,1),
  decision_secretariat      VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  decision_secretariat_le   TIMESTAMP,
  avis_secretariat          TEXT,
  CONSTRAINT conges_check CHECK (date_fin >= date_debut),
  CONSTRAINT conges_status_check CHECK (status IN ('en_attente', 'approuvee', 'refusee')),
  CONSTRAINT conges_decision_intermediaire_check CHECK (decision_intermediaire IN ('en_attente', 'approuvee', 'refusee', 'non_requise')),
  CONSTRAINT conges_decision_secretariat_check CHECK (decision_secretariat IN ('en_attente', 'approuvee', 'refusee')),
  CONSTRAINT conges_type_conge_check CHECK (type_conge IN ('Congé annuel', 'Permission', 'Autorisation d''absence', 'Congé de maternité', 'Congé de paternité', 'Congé de maladie', 'Formation', 'Autres'))
);
CREATE INDEX idx_conges_user ON conges (user_id);
CREATE INDEX idx_conges_status ON conges (status);
CREATE INDEX idx_conges_validateur ON conges (validateur_id);

CREATE TABLE conges_droits_annuels (
  id              SERIAL PRIMARY KEY,
  personnel_id    INTEGER NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  annee           INTEGER NOT NULL,
  libelle_periode VARCHAR(20),
  droit           NUMERIC(6,1) NOT NULL,
  source          VARCHAR(12) NOT NULL DEFAULT 'CALCULE',
  reference       VARCHAR(255),
  created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT uniq_droit_annuel_par_personnel UNIQUE (personnel_id, annee),
  CONSTRAINT conges_droits_annuels_annee_check CHECK (annee BETWEEN 1950 AND 2200),
  CONSTRAINT conges_droits_annuels_droit_check CHECK (droit >= 0),
  CONSTRAINT conges_droits_annuels_source_check CHECK (source IN ('CALCULE', 'OUVERTURE'))
);

CREATE TABLE conges_imputations (
  id       SERIAL PRIMARY KEY,
  conge_id INTEGER NOT NULL REFERENCES conges(id) ON DELETE CASCADE,
  annee    INTEGER,
  jours    NUMERIC(6,1) NOT NULL,
  CONSTRAINT conges_imputations_jours_check CHECK (jours > 0)
);
CREATE INDEX idx_conges_imputations_conge ON conges_imputations (conge_id);
CREATE INDEX idx_conges_imputations_annee ON conges_imputations (annee);

CREATE TABLE conges_historiques (
  id              SERIAL PRIMARY KEY,
  personnel_id    INTEGER NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  annee           INTEGER NOT NULL,
  date_debut      DATE NOT NULL,
  date_fin        DATE NOT NULL,
  jours           NUMERIC(6,1) NOT NULL,
  reference       VARCHAR(255),
  created_by      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT now(),
  lieu_jouissance VARCHAR(150),
  CONSTRAINT conges_historiques_annee_check CHECK (annee BETWEEN 1950 AND 2200),
  CONSTRAINT conges_historiques_dates_check CHECK (date_fin >= date_debut),
  CONSTRAINT conges_historiques_jours_check CHECK (jours > 0)
);
CREATE INDEX idx_conges_historiques_personnel ON conges_historiques (personnel_id, annee);

-- ---------------------------------------------------------------------------
-- 7. Documents administratifs
-- ---------------------------------------------------------------------------

CREATE TABLE documents_generes (
  id            SERIAL PRIMARY KEY,
  personnel_id  INTEGER NOT NULL REFERENCES personnel(id),
  type_document VARCHAR(50) NOT NULL,
  donnees       JSONB NOT NULL,
  genere_par    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  genere_le     TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT documents_generes_type_check CHECK (type_document IN ('certificat_administratif', 'lettre_confirmation', 'etat_conge', 'decision_conge'))
);
CREATE INDEX idx_documents_generes_personnel ON documents_generes (personnel_id);

CREATE TABLE demandes_documents (
  id              SERIAL PRIMARY KEY,
  personnel_id    INTEGER NOT NULL REFERENCES personnel(id),
  type_document   VARCHAR(50) NOT NULL,
  motif           TEXT,
  statut          VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  document_id     INTEGER REFERENCES documents_generes(id),
  traite_par      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  date_demande    TIMESTAMP NOT NULL DEFAULT now(),
  date_traitement TIMESTAMP,
  decision_secretariat    VARCHAR(20) NOT NULL DEFAULT 'en_attente',
  decision_secretariat_le TIMESTAMP,
  avis_secretariat        TEXT,
  CONSTRAINT demandes_documents_statut_check CHECK (statut IN ('en_attente', 'traitee', 'refusee')),
  CONSTRAINT demandes_documents_decision_secretariat_check CHECK (decision_secretariat IN ('en_attente', 'approuvee', 'refusee')),
  CONSTRAINT demandes_documents_type_check CHECK (type_document IN ('certificat_administratif', 'lettre_confirmation', 'etat_conge'))
);
CREATE INDEX idx_demandes_documents_personnel ON demandes_documents (personnel_id);
CREATE INDEX idx_demandes_documents_statut ON demandes_documents (statut);

-- ---------------------------------------------------------------------------
-- 8. Communication, audit, corbeille, configuration
-- ---------------------------------------------------------------------------

CREATE TABLE notifications (
  id           SERIAL PRIMARY KEY,
  sender_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title        VARCHAR(150) NOT NULL,
  message      TEXT NOT NULL,
  type         VARCHAR(30) NOT NULL DEFAULT 'info',
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP NOT NULL DEFAULT now(),
  lien         VARCHAR(255),
  CONSTRAINT notifications_type_check CHECK (type IN ('info', 'reunion', 'echeance', 'conge', 'paie'))
);
CREATE INDEX idx_notifications_recipient ON notifications (recipient_id, is_read, created_at DESC);

-- Réclamations du personnel (PE/PAT) adressées au Superadmin — distinct de
-- `notifications` (annonces à sens unique, sans statut ni réponse).
CREATE TABLE reclamations (
  id           SERIAL PRIMARY KEY,
  auteur_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sujet        VARCHAR(150) NOT NULL,
  description  TEXT NOT NULL,
  statut       VARCHAR(20) NOT NULL DEFAULT 'ouverte' CHECK (statut IN ('ouverte', 'traitee')),
  reponse      TEXT,
  traite_par   INTEGER REFERENCES users(id) ON DELETE SET NULL,
  traite_le    TIMESTAMP,
  created_at   TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_reclamations_statut ON reclamations (statut, created_at DESC);

CREATE TABLE activity_log (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_log_created ON activity_log (created_at DESC);
CREATE INDEX idx_activity_log_user ON activity_log (user_id);

CREATE TABLE corbeille (
  id           SERIAL PRIMARY KEY,
  type_element VARCHAR(30) NOT NULL,
  donnees      JSONB NOT NULL,
  supprime_par INTEGER REFERENCES users(id) ON DELETE SET NULL,
  supprime_le  TIMESTAMP NOT NULL DEFAULT now()
);
CREATE INDEX idx_corbeille_supprime_le ON corbeille (supprime_le DESC);

CREATE TABLE site_settings (
  key   VARCHAR(50) PRIMARY KEY,
  value VARCHAR(255) NOT NULL
);

CREATE TABLE site_texts (
  key      VARCHAR(100) PRIMARY KEY,
  value    TEXT NOT NULL,
  category VARCHAR(50) NOT NULL
);

COMMIT;
