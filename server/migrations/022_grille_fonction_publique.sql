-- Grille générale des fonctionnaires : classes et échelons adaptés du fichier de référence
-- Grille_indiciaire_fonction_publique_Madagascar.xlsx (feuille « Données format long »).
--
-- Catégories I à IX : deuxième classe, première classe, principalat (échelons 1 à 3) et
-- classe exceptionnelle (échelons 1 et 2). Catégorie X : seuls les deux échelons de la classe
-- exceptionnelle sont repris ; ses échelons 1 à 6 (structure particulière, décret n°79-363)
-- n'ont pas de classe dans le modèle et ne sont pas chargés.
-- Les stagiaires (échelon 0) ne sont pas chargés : le modèle exige un échelon ≥ 1.
--
-- La grille transitoire « classe exceptionnelle » (migration initiale) est désactivée, pas
-- supprimée. Aucune fiche ni aucun événement ne référence ses lignes (vérifié avant migration).
-- Une seule grille active par régime : sinon le calcul de l'indice est refusé.
--
-- Date de début de validité : 1997-01-16 (date du décret n°97-009), à confirmer par la RH.
-- Retour arrière : réactiver FONCTIONNAIRE_CLASSE_EXC_TRANSITOIRE et désactiver
-- FONCTIONNAIRE_GRILLE_GENERALE.

BEGIN;

INSERT INTO grilles_indiciaires (code, nom, regime, description, texte_source_principal, date_debut_validite, actif)
VALUES (
  'FONCTIONNAIRE_GRILLE_GENERALE',
  'Grille générale — fonctionnaires (catégories I à X)',
  'FONCTIONNAIRE',
  'Classes (deuxième, première, principalat, classe exceptionnelle) et échelons par catégorie. Catégorie X limitée à la classe exceptionnelle.',
  'Grille indiciaire fonction publique Madagascar (fichier de référence RH) ; décret n°97-009 pour la classe exceptionnelle',
  '1997-01-16',
  TRUE
);

INSERT INTO lignes_grille_indiciaire (grille_id, categorie, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, actif)
SELECT g.id, v.categorie, v.classe, v.echelon, v.indice, v.code,
       'Grille indiciaire fonction publique Madagascar (fichier de référence RH)',
       'Feuille « Données format long »', '1997-01-16', TRUE
FROM grilles_indiciaires g
CROSS JOIN (VALUES
  ('I', 'DEUXIEME_CLASSE', 1, 295, '2C/E1'),
  ('I', 'DEUXIEME_CLASSE', 2, 310, '2C/E2'),
  ('I', 'DEUXIEME_CLASSE', 3, 335, '2C/E3'),
  ('I', 'PREMIERE_CLASSE', 1, 355, '1C/E1'),
  ('I', 'PREMIERE_CLASSE', 2, 375, '1C/E2'),
  ('I', 'PREMIERE_CLASSE', 3, 400, '1C/E3'),
  ('I', 'PRINCIPALAT', 1, 425, 'P/E1'),
  ('I', 'PRINCIPALAT', 2, 455, 'P/E2'),
  ('I', 'PRINCIPALAT', 3, 485, 'P/E3'),
  ('I', 'CLASSE_EXCEPTIONNELLE', 1, 515, 'CE/E1'),
  ('I', 'CLASSE_EXCEPTIONNELLE', 2, 675, 'CE/E2'),
  ('II', 'DEUXIEME_CLASSE', 1, 415, '2C/E1'),
  ('II', 'DEUXIEME_CLASSE', 2, 435, '2C/E2'),
  ('II', 'DEUXIEME_CLASSE', 3, 455, '2C/E3'),
  ('II', 'PREMIERE_CLASSE', 1, 490, '1C/E1'),
  ('II', 'PREMIERE_CLASSE', 2, 515, '1C/E2'),
  ('II', 'PREMIERE_CLASSE', 3, 540, '1C/E3'),
  ('II', 'PRINCIPALAT', 1, 570, 'P/E1'),
  ('II', 'PRINCIPALAT', 2, 605, 'P/E2'),
  ('II', 'PRINCIPALAT', 3, 640, 'P/E3'),
  ('II', 'CLASSE_EXCEPTIONNELLE', 1, 675, 'CE/E1'),
  ('II', 'CLASSE_EXCEPTIONNELLE', 2, 1020, 'CE/E2'),
  ('III', 'DEUXIEME_CLASSE', 1, 540, '2C/E1'),
  ('III', 'DEUXIEME_CLASSE', 2, 580, '2C/E2'),
  ('III', 'DEUXIEME_CLASSE', 3, 620, '2C/E3'),
  ('III', 'PREMIERE_CLASSE', 1, 665, '1C/E1'),
  ('III', 'PREMIERE_CLASSE', 2, 715, '1C/E2'),
  ('III', 'PREMIERE_CLASSE', 3, 765, '1C/E3'),
  ('III', 'PRINCIPALAT', 1, 825, 'P/E1'),
  ('III', 'PRINCIPALAT', 2, 885, 'P/E2'),
  ('III', 'PRINCIPALAT', 3, 950, 'P/E3'),
  ('III', 'CLASSE_EXCEPTIONNELLE', 1, 1020, 'CE/E1'),
  ('III', 'CLASSE_EXCEPTIONNELLE', 2, 1550, 'CE/E2'),
  ('IV', 'DEUXIEME_CLASSE', 1, 665, '2C/E1'),
  ('IV', 'DEUXIEME_CLASSE', 2, 730, '2C/E2'),
  ('IV', 'DEUXIEME_CLASSE', 3, 800, '2C/E3'),
  ('IV', 'PREMIERE_CLASSE', 1, 880, '1C/E1'),
  ('IV', 'PREMIERE_CLASSE', 2, 970, '1C/E2'),
  ('IV', 'PREMIERE_CLASSE', 3, 1065, '1C/E3'),
  ('IV', 'PRINCIPALAT', 1, 1170, 'P/E1'),
  ('IV', 'PRINCIPALAT', 2, 1285, 'P/E2'),
  ('IV', 'PRINCIPALAT', 3, 1410, 'P/E3'),
  ('IV', 'CLASSE_EXCEPTIONNELLE', 1, 1550, 'CE/E1'),
  ('IV', 'CLASSE_EXCEPTIONNELLE', 2, 1600, 'CE/E2'),
  ('V', 'DEUXIEME_CLASSE', 1, 710, '2C/E1'),
  ('V', 'DEUXIEME_CLASSE', 2, 780, '2C/E2'),
  ('V', 'DEUXIEME_CLASSE', 3, 850, '2C/E3'),
  ('V', 'PREMIERE_CLASSE', 1, 930, '1C/E1'),
  ('V', 'PREMIERE_CLASSE', 2, 1020, '1C/E2'),
  ('V', 'PREMIERE_CLASSE', 3, 1115, '1C/E3'),
  ('V', 'PRINCIPALAT', 1, 1220, 'P/E1'),
  ('V', 'PRINCIPALAT', 2, 1335, 'P/E2'),
  ('V', 'PRINCIPALAT', 3, 1460, 'P/E3'),
  ('V', 'CLASSE_EXCEPTIONNELLE', 1, 1600, 'CE/E1'),
  ('V', 'CLASSE_EXCEPTIONNELLE', 2, 1750, 'CE/E2'),
  ('VI', 'DEUXIEME_CLASSE', 1, 815, '2C/E1'),
  ('VI', 'DEUXIEME_CLASSE', 2, 900, '2C/E2'),
  ('VI', 'DEUXIEME_CLASSE', 3, 970, '2C/E3'),
  ('VI', 'PREMIERE_CLASSE', 1, 1055, '1C/E1'),
  ('VI', 'PREMIERE_CLASSE', 2, 1145, '1C/E2'),
  ('VI', 'PREMIERE_CLASSE', 3, 1250, '1C/E3'),
  ('VI', 'PRINCIPALAT', 1, 1360, 'P/E1'),
  ('VI', 'PRINCIPALAT', 2, 1480, 'P/E2'),
  ('VI', 'PRINCIPALAT', 3, 1610, 'P/E3'),
  ('VI', 'CLASSE_EXCEPTIONNELLE', 1, 1750, 'CE/E1'),
  ('VI', 'CLASSE_EXCEPTIONNELLE', 2, 1850, 'CE/E2'),
  ('VII', 'DEUXIEME_CLASSE', 1, 920, '2C/E1'),
  ('VII', 'DEUXIEME_CLASSE', 2, 995, '2C/E2'),
  ('VII', 'DEUXIEME_CLASSE', 3, 1075, '2C/E3'),
  ('VII', 'PREMIERE_CLASSE', 1, 1160, '1C/E1'),
  ('VII', 'PREMIERE_CLASSE', 2, 1255, '1C/E2'),
  ('VII', 'PREMIERE_CLASSE', 3, 1355, '1C/E3'),
  ('VII', 'PRINCIPALAT', 1, 1465, 'P/E1'),
  ('VII', 'PRINCIPALAT', 2, 1585, 'P/E2'),
  ('VII', 'PRINCIPALAT', 3, 1710, 'P/E3'),
  ('VII', 'CLASSE_EXCEPTIONNELLE', 1, 1850, 'CE/E1'),
  ('VII', 'CLASSE_EXCEPTIONNELLE', 2, 2225, 'CE/E2'),
  ('VIII', 'DEUXIEME_CLASSE', 1, 1035, '2C/E1'),
  ('VIII', 'DEUXIEME_CLASSE', 2, 1125, '2C/E2'),
  ('VIII', 'DEUXIEME_CLASSE', 3, 1225, '2C/E3'),
  ('VIII', 'PREMIERE_CLASSE', 1, 1335, '1C/E1'),
  ('VIII', 'PREMIERE_CLASSE', 2, 1455, '1C/E2'),
  ('VIII', 'PREMIERE_CLASSE', 3, 1585, '1C/E3'),
  ('VIII', 'PRINCIPALAT', 1, 1725, 'P/E1'),
  ('VIII', 'PRINCIPALAT', 2, 1880, 'P/E2'),
  ('VIII', 'PRINCIPALAT', 3, 2045, 'P/E3'),
  ('VIII', 'CLASSE_EXCEPTIONNELLE', 1, 2225, 'CE/E1'),
  ('VIII', 'CLASSE_EXCEPTIONNELLE', 2, 2325, 'CE/E2'),
  ('IX', 'DEUXIEME_CLASSE', 1, 1185, '2C/E1'),
  ('IX', 'DEUXIEME_CLASSE', 2, 1280, '2C/E2'),
  ('IX', 'DEUXIEME_CLASSE', 3, 1380, '2C/E3'),
  ('IX', 'PREMIERE_CLASSE', 1, 1485, '1C/E1'),
  ('IX', 'PREMIERE_CLASSE', 2, 1600, '1C/E2'),
  ('IX', 'PREMIERE_CLASSE', 3, 1725, '1C/E3'),
  ('IX', 'PRINCIPALAT', 1, 1860, 'P/E1'),
  ('IX', 'PRINCIPALAT', 2, 2000, 'P/E2'),
  ('IX', 'PRINCIPALAT', 3, 2155, 'P/E3'),
  ('IX', 'CLASSE_EXCEPTIONNELLE', 1, 2325, 'CE/E1'),
  ('IX', 'CLASSE_EXCEPTIONNELLE', 2, 2520, 'CE/E2'),
  ('X', 'CLASSE_EXCEPTIONNELLE', 1, 2520, 'X-7'),
  ('X', 'CLASSE_EXCEPTIONNELLE', 2, 2620, 'X-8')
) AS v(categorie, classe, echelon, indice, code)
WHERE g.code = 'FONCTIONNAIRE_GRILLE_GENERALE';

UPDATE grilles_indiciaires SET actif = FALSE, updated_at = NOW()
WHERE code = 'FONCTIONNAIRE_CLASSE_EXC_TRANSITOIRE';

COMMIT;
