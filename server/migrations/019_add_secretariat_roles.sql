-- Ajoute les rôles SECRETAIRE_PE / SECRETAIRE_PAT et l'étape de vérification
-- secrétariat sur les congés et les demandes de documents, insérée avant le
-- circuit existant (avis intermédiaire du chef de service, décision RH) sans
-- le modifier. Additive et réversible : aucune donnée existante supprimée.

BEGIN;

ALTER TABLE users DROP CONSTRAINT users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('SUPERADMIN', 'ADMIN_RH', 'PE', 'PAT', 'MESUPRES', 'SECRETAIRE_PE', 'SECRETAIRE_PAT'));

ALTER TABLE conges ADD COLUMN decision_secretariat VARCHAR(20) NOT NULL DEFAULT 'en_attente';
ALTER TABLE conges ADD COLUMN decision_secretariat_le TIMESTAMP;
ALTER TABLE conges ADD COLUMN avis_secretariat TEXT;
ALTER TABLE conges ADD CONSTRAINT conges_decision_secretariat_check
  CHECK (decision_secretariat IN ('en_attente', 'approuvee', 'refusee'));

-- Rétrocompatibilité : les demandes déjà existantes n'ont jamais eu de
-- secrétariat à traverser, on ne les bloque pas rétroactivement.
UPDATE conges SET decision_secretariat = 'approuvee' WHERE decision_secretariat = 'en_attente';

ALTER TABLE demandes_documents ADD COLUMN decision_secretariat VARCHAR(20) NOT NULL DEFAULT 'en_attente';
ALTER TABLE demandes_documents ADD COLUMN decision_secretariat_le TIMESTAMP;
ALTER TABLE demandes_documents ADD COLUMN avis_secretariat TEXT;
ALTER TABLE demandes_documents ADD CONSTRAINT demandes_documents_decision_secretariat_check
  CHECK (decision_secretariat IN ('en_attente', 'approuvee', 'refusee'));

UPDATE demandes_documents SET decision_secretariat = 'approuvee' WHERE decision_secretariat = 'en_attente';

COMMIT;
