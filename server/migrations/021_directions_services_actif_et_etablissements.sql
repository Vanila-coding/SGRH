-- Désactivation des directions et services sans suppression : une entrée inactive n'est
-- plus proposée dans les formulaires, mais les fiches qui y sont rattachées restent intactes.
-- Additive : toutes les lignes existantes restent actives.

BEGIN;

ALTER TABLE directions ADD COLUMN actif BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE services ADD COLUMN actif BOOLEAN NOT NULL DEFAULT TRUE;

COMMIT;
