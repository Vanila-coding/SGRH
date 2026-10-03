-- Permet à l'Admin RH de désigner, dès la création de la fiche personnel, qu'un
-- agent PAT deviendra secrétaire (PE ou PAT) une fois son compte enregistré. La
-- fiche personnel elle-même reste PAT (role/personnel_roles inchangés) ; seule cette
-- colonne annexe détermine le rôle d'accès (users.role) attribué lors de
-- l'inscription (cf. userService.registerWithMatricule). Jamais renseignée pour un
-- PE (vérifié côté application, pas en base, pour rester simple) : un PE n'est
-- jamais secrétaire.

BEGIN;

ALTER TABLE personnel ADD COLUMN secretariat_role VARCHAR(20);
ALTER TABLE personnel ADD CONSTRAINT personnel_secretariat_role_check
  CHECK (secretariat_role IS NULL OR secretariat_role IN ('SECRETAIRE_PE', 'SECRETAIRE_PAT'));

COMMIT;
