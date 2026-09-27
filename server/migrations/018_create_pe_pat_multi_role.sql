-- Un même personnel peut être PE (enseignant) et/ou PAT (administratif et technique)
-- en même temps : personnel.role (valeur unique) devient personnel_roles (0 à 2 lignes).
-- La colonne personnel.role N'EST PAS supprimée dans cette migration (transition en
-- douceur — voir plan) ; elle cesse simplement d'être la source de vérité.
CREATE TABLE personnel_roles (
  id           SERIAL PRIMARY KEY,
  personnel_id INTEGER NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  role         VARCHAR(20) NOT NULL CHECK (role IN ('PE', 'PAT')),
  created_at   TIMESTAMP NOT NULL DEFAULT now(),
  CONSTRAINT personnel_roles_unique UNIQUE (personnel_id, role)
);
CREATE INDEX idx_personnel_roles_personnel ON personnel_roles (personnel_id);
CREATE INDEX idx_personnel_roles_role ON personnel_roles (role);

-- Reprise des rôles existants. Les fiches sans rôle connu (ex. certaines créées via
-- invitation, voir plan §A) n'obtiennent aucune ligne ici et devront être complétées
-- manuellement par la RH — pas de valeur devinée.
INSERT INTO personnel_roles (personnel_id, role)
SELECT id, role FROM personnel WHERE role IN ('PE', 'PAT')
ON CONFLICT DO NOTHING;

-- Établissements de l'université pour les PE, gérés par le Superadmin/RH. Désactivation
-- plutôt que suppression physique pour ne jamais perdre l'historique des enseignants
-- qui y sont/étaient rattachés.
CREATE TABLE etablissements (
  id         SERIAL PRIMARY KEY,
  nom        VARCHAR(200) NOT NULL,
  statut     VARCHAR(20) NOT NULL DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'INACTIF')),
  created_at TIMESTAMP NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX idx_etablissements_nom ON etablissements (nom);

-- Informations propres aux PE (établissement, corps académique, catégorie, diplôme,
-- spécialité) : jamais vues sur `personnel` aujourd'hui, sans rapport avec les colonnes
-- corps/categorie_id existantes qui sont, elles, spécifiques au régime PAT (voir plan §D).
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
