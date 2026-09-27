-- =============================================================================
-- SGRH — données de RÉFÉRENCE (aucune donnée personnelle)
-- =============================================================================
-- À exécuter après schema.sql. Idempotent (ON CONFLICT DO NOTHING).
-- Contenu : rôles, permissions et permissions par rôle, catégories professionnelles,
-- types de situation administrative, grille indiciaire vérifiée (Décret n°97-009 +
-- Circulaire n°132/MFPTLS/2005), paramètres de carrière, textes/couleurs par défaut du
-- site, directions et services de l'Université de Mahajanga (sans responsables).
-- =============================================================================

BEGIN;

INSERT INTO roles (code, libelle) VALUES
  ('SUPERADMIN', 'Super administrateur'),
  ('ADMIN_RH', 'Administrateur RH'),
  ('PE', 'Personnel enseignant'),
  ('PAT', 'Personnel administratif et technique'),
  ('SECRETAIRE_PE', 'Secrétaire PE'),
  ('SECRETAIRE_PAT', 'Secrétaire PAT')
ON CONFLICT DO NOTHING;

-- permissions (31 lignes)
INSERT INTO permissions (id, key, label, category) VALUES (1, 'view_dashboard_admin', 'Voir le tableau de bord Admin RH', 'Admin RH') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (2, 'view_personnel', 'Voir la liste du personnel', 'Admin RH') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (3, 'create_personnel', 'Ajouter un employé', 'Admin RH') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (4, 'send_registration_link', 'Envoyer un lien d''inscription', 'Admin RH') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (5, 'view_pending_accounts', 'Voir/valider les comptes en attente', 'Admin RH') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (6, 'send_notification', 'Envoyer une notification', 'Communication') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (7, 'view_notifications', 'Voir ses notifications', 'Communication') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (8, 'manage_fonctions', 'Gérer les fonctions/grades', 'Admin RH') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (9, 'view_conges_admin', 'Voir/traiter les demandes de congé (Admin)', 'Congés') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (10, 'create_conge', 'Faire une demande de congé', 'Congés') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (11, 'view_mes_conges', 'Voir ses propres demandes', 'Congés') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (12, 'view_historique', 'Voir le journal d''activité', 'Admin RH') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (13, 'view_profil', 'Voir son profil', 'Personnel') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (14, 'manage_accounts', 'Activer/désactiver/supprimer des comptes', 'Superadmin') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (15, 'manage_permissions', 'Gérer les permissions par rôle', 'Superadmin') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (16, 'manage_corbeille', 'Gérer la corbeille', 'Superadmin') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (17, 'manage_site_texts', 'Modifier les textes du site', 'Superadmin') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (18, 'manage_site_settings', 'Modifier l''apparence du site', 'Superadmin') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (19, 'manage_documents', 'Générer des documents administratifs', 'Admin RH') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (20, 'view_mes_documents', 'Voir mes documents', 'Personnel') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (21, 'demander_document', 'Demander un document administratif', 'Personnel') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (22, 'modifier_mes_infos', 'Modifier ses informations personnelles', 'Personnel') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (23, 'delete_carriere_evenement', 'Supprimer un événement de carrière', 'Carrière') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (24, 'manage_situations_administratives', 'Gérer les situations administratives et contrats', 'Carrière') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (25, 'manage_parametres_carriere', 'Configurer les paramètres de carrière', 'Carrière') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (26, 'manage_organisation', 'Gérer les directions et services', 'Admin RH') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (27, 'signaler_probleme', 'Signaler un problème (réclamation)', 'Personnel') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (28, 'manage_reclamations', 'Gérer les réclamations du personnel', 'Superadmin') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (29, 'manage_etablissements', 'Gérer les établissements (PE)', 'Admin RH') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (30, 'review_conges_secretariat', 'Vérifier les demandes de congé (secrétariat)', 'Secrétariat') ON CONFLICT DO NOTHING;
INSERT INTO permissions (id, key, label, category) VALUES (31, 'review_documents_secretariat', 'Vérifier les demandes de documents (secrétariat)', 'Secrétariat') ON CONFLICT DO NOTHING;

-- role_permissions (80 lignes)
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (80, 'SUPERADMIN', 1, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (81, 'SUPERADMIN', 2, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (82, 'SUPERADMIN', 3, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (83, 'SUPERADMIN', 4, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (84, 'SUPERADMIN', 5, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (85, 'SUPERADMIN', 6, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (86, 'SUPERADMIN', 7, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (87, 'SUPERADMIN', 8, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (88, 'SUPERADMIN', 9, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (89, 'SUPERADMIN', 10, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (90, 'SUPERADMIN', 11, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (91, 'SUPERADMIN', 12, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (92, 'SUPERADMIN', 13, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (93, 'SUPERADMIN', 14, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (94, 'SUPERADMIN', 15, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (95, 'SUPERADMIN', 16, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (96, 'SUPERADMIN', 17, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (97, 'SUPERADMIN', 18, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (98, 'SUPERADMIN', 19, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (99, 'SUPERADMIN', 20, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (100, 'SUPERADMIN', 21, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (101, 'SUPERADMIN', 22, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (102, 'SUPERADMIN', 23, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (103, 'SUPERADMIN', 24, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (104, 'SUPERADMIN', 25, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (105, 'ADMIN_RH', 1, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (106, 'ADMIN_RH', 2, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (107, 'ADMIN_RH', 3, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (108, 'ADMIN_RH', 4, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (109, 'ADMIN_RH', 5, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (110, 'ADMIN_RH', 6, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (111, 'ADMIN_RH', 7, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (112, 'ADMIN_RH', 8, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (113, 'ADMIN_RH', 9, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (114, 'ADMIN_RH', 12, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (115, 'ADMIN_RH', 19, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (116, 'ADMIN_RH', 23, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (117, 'ADMIN_RH', 24, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (118, 'ADMIN_RH', 25, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (119, 'PE', 7, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (120, 'PAT', 7, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (121, 'PE', 10, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (122, 'PAT', 10, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (123, 'PE', 11, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (124, 'PAT', 11, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (125, 'PE', 13, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (126, 'PAT', 13, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (127, 'PE', 20, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (128, 'PAT', 20, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (129, 'PE', 21, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (130, 'PAT', 21, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (131, 'PE', 22, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (132, 'PAT', 22, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (133, 'ADMIN_RH', 26, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (134, 'PE', 27, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (135, 'PAT', 27, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (136, 'SUPERADMIN', 28, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (152, 'ADMIN_RH', 29, true) ON CONFLICT DO NOTHING;
-- Secrétaire PE / Secrétaire PAT : le socle personnel déjà accordé à PE/PAT (notifications,
-- congés, profil, documents, réclamation) + les deux permissions de vérification secrétariat.
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (153, 'SECRETAIRE_PE', 7, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (154, 'SECRETAIRE_PAT', 7, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (155, 'SECRETAIRE_PE', 10, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (156, 'SECRETAIRE_PAT', 10, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (157, 'SECRETAIRE_PE', 11, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (158, 'SECRETAIRE_PAT', 11, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (159, 'SECRETAIRE_PE', 13, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (160, 'SECRETAIRE_PAT', 13, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (161, 'SECRETAIRE_PE', 20, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (162, 'SECRETAIRE_PAT', 20, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (163, 'SECRETAIRE_PE', 21, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (164, 'SECRETAIRE_PAT', 21, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (165, 'SECRETAIRE_PE', 22, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (166, 'SECRETAIRE_PAT', 22, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (167, 'SECRETAIRE_PE', 27, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (168, 'SECRETAIRE_PAT', 27, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (169, 'SECRETAIRE_PE', 30, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (170, 'SECRETAIRE_PAT', 31, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (171, 'SECRETAIRE_PAT', 30, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (172, 'SECRETAIRE_PE', 31, true) ON CONFLICT DO NOTHING;
-- ADMIN_RH (héritée par SUPERADMIN) : repli anti-blocage si aucun secrétaire n'est encore désigné.
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (173, 'ADMIN_RH', 30, true) ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (id, role, permission_id, enabled) VALUES (174, 'ADMIN_RH', 31, true) ON CONFLICT DO NOTHING;

-- categories_professionnelles (7 lignes)
INSERT INTO categories_professionnelles (id, numero, code, appellation, niveau_diplome) VALUES (1, 1, 'CAT1', 'Sous-opérateur', 'CEPE') ON CONFLICT DO NOTHING;
INSERT INTO categories_professionnelles (id, numero, code, appellation, niveau_diplome) VALUES (2, 2, 'CAT2', 'Opérateur', 'BEPC') ON CONFLICT DO NOTHING;
INSERT INTO categories_professionnelles (id, numero, code, appellation, niveau_diplome) VALUES (3, 3, 'CAT3', 'Encadreur', 'BAC') ON CONFLICT DO NOTHING;
INSERT INTO categories_professionnelles (id, numero, code, appellation, niveau_diplome) VALUES (4, 4, 'CAT4', 'Technicien supérieur', 'DTS') ON CONFLICT DO NOTHING;
INSERT INTO categories_professionnelles (id, numero, code, appellation, niveau_diplome) VALUES (5, 5, 'CAT5', 'Réalisateur adjoint', 'Licence') ON CONFLICT DO NOTHING;
INSERT INTO categories_professionnelles (id, numero, code, appellation, niveau_diplome) VALUES (6, 6, 'CAT6', 'Réalisateur', 'Maîtrise') ON CONFLICT DO NOTHING;
INSERT INTO categories_professionnelles (id, numero, code, appellation, niveau_diplome) VALUES (7, 8, 'CAT8', 'Concepteur', 'DA ou Master et plus') ON CONFLICT DO NOTHING;

-- types_situation_administrative (7 lignes)
INSERT INTO types_situation_administrative (id, code, libelle, categories_concernees) VALUES (1, 'ELD_CONTRACTUEL', 'ELD contractuel', NULL) ON CONFLICT DO NOTHING;
INSERT INTO types_situation_administrative (id, code, libelle, categories_concernees) VALUES (2, 'EFA', 'EFA', 'CAT1, CAT2, CAT3') ON CONFLICT DO NOTHING;
INSERT INTO types_situation_administrative (id, code, libelle, categories_concernees) VALUES (3, 'STAGIAIRE_CLASSIQUE', 'Stagiaire classique', NULL) ON CONFLICT DO NOTHING;
INSERT INTO types_situation_administrative (id, code, libelle, categories_concernees) VALUES (4, 'STAGIAIRE_GRADE', 'Stagiaire gradé', NULL) ON CONFLICT DO NOTHING;
INSERT INTO types_situation_administrative (id, code, libelle, categories_concernees) VALUES (5, 'INTEGRE', 'Intégré(e)', 'CAT1, CAT2, CAT3') ON CONFLICT DO NOTHING;
INSERT INTO types_situation_administrative (id, code, libelle, categories_concernees) VALUES (6, 'TITULAIRE', 'Titulaire', NULL) ON CONFLICT DO NOTHING;
INSERT INTO types_situation_administrative (id, code, libelle, categories_concernees) VALUES (7, 'FONCTIONNAIRE', 'Fonctionnaire', NULL) ON CONFLICT DO NOTHING;

-- grilles_indiciaires (1 lignes)
INSERT INTO grilles_indiciaires (id, code, nom, regime, description, texte_source_principal, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (1, 'FONCTIONNAIRE_CLASSE_EXC_TRANSITOIRE', 'Classe exceptionnelle — régime transitoire par catégorie (I à X)', 'FONCTIONNAIRE', 'Régime transitoire appliqué en attendant le décret de classement hiérarchique cadre/échelle et la grille indiciaire complète prévus par la Loi n°2003-011 (non localisés lors de cette recherche). Ne couvre que la classe exceptionnelle (1er et 2e échelon), par catégorie I à X.', 'Décret n°97-009 du 16/01/1997, complété par la Circulaire n°132/MFPTLS du 01/06/2005', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;

-- lignes_grille_indiciaire (20 lignes)
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (1, 1, NULL, NULL, 'I', NULL, 'CLASSE_EXCEPTIONNELLE', 1, 515, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (2, 1, NULL, NULL, 'II', NULL, 'CLASSE_EXCEPTIONNELLE', 1, 675, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (3, 1, NULL, NULL, 'III', NULL, 'CLASSE_EXCEPTIONNELLE', 1, 1020, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (4, 1, NULL, NULL, 'IV', NULL, 'CLASSE_EXCEPTIONNELLE', 1, 1550, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (5, 1, NULL, NULL, 'V', NULL, 'CLASSE_EXCEPTIONNELLE', 1, 1600, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (6, 1, NULL, NULL, 'VI', NULL, 'CLASSE_EXCEPTIONNELLE', 1, 1750, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (7, 1, NULL, NULL, 'VII', NULL, 'CLASSE_EXCEPTIONNELLE', 1, 1850, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (8, 1, NULL, NULL, 'VIII', NULL, 'CLASSE_EXCEPTIONNELLE', 1, 2225, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (9, 1, NULL, NULL, 'IX', NULL, 'CLASSE_EXCEPTIONNELLE', 1, 2325, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (10, 1, NULL, NULL, 'X', NULL, 'CLASSE_EXCEPTIONNELLE', 1, 2520, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (11, 1, NULL, NULL, 'I', NULL, 'CLASSE_EXCEPTIONNELLE', 2, 675, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (12, 1, NULL, NULL, 'II', NULL, 'CLASSE_EXCEPTIONNELLE', 2, 1020, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (13, 1, NULL, NULL, 'III', NULL, 'CLASSE_EXCEPTIONNELLE', 2, 1550, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (14, 1, NULL, NULL, 'IV', NULL, 'CLASSE_EXCEPTIONNELLE', 2, 1600, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (15, 1, NULL, NULL, 'V', NULL, 'CLASSE_EXCEPTIONNELLE', 2, 1750, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (16, 1, NULL, NULL, 'VI', NULL, 'CLASSE_EXCEPTIONNELLE', 2, 1850, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (17, 1, NULL, NULL, 'VII', NULL, 'CLASSE_EXCEPTIONNELLE', 2, 2225, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (18, 1, NULL, NULL, 'VIII', NULL, 'CLASSE_EXCEPTIONNELLE', 2, 2325, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (19, 1, NULL, NULL, 'IX', NULL, 'CLASSE_EXCEPTIONNELLE', 2, 2520, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;
INSERT INTO lignes_grille_indiciaire (id, grille_id, cadre, echelle, categorie, corps, classe, echelon, indice, code_grille_affichage, source_texte, source_article, date_debut_validite, date_fin_validite, actif, created_at, updated_at) VALUES (20, 1, NULL, NULL, 'X', NULL, 'CLASSE_EXCEPTIONNELLE', 2, 2620, NULL, 'Décret n°97-009 du 16/01/1997 ; Circulaire n°132/MFPTLS du 01/06/2005', 'Art.2 (décret) / tableau (circulaire)', '2005-06-01', NULL, true, '2026-09-19 16:42:30.584077', NULL) ON CONFLICT DO NOTHING;

-- parametres_carriere (12 lignes)
INSERT INTO parametres_carriere (cle, valeur, description, a_valider, updated_at, updated_by) VALUES ('eld_periodicite_progression_annees', '2', 'ELD contractuel : périodicité de progression/majoration (en années).', true, '2026-09-18 09:44:45.905157', NULL) ON CONFLICT DO NOTHING;
INSERT INTO parametres_carriere (cle, valeur, description, a_valider, updated_at, updated_by) VALUES ('eld_paliers_progression_pourcentage', '10,20,30,40', 'ELD contractuel : paliers de majoration successifs, en %, séparés par des virgules.', true, '2026-09-18 09:44:45.905157', NULL) ON CONFLICT DO NOTHING;
INSERT INTO parametres_carriere (cle, valeur, description, a_valider, updated_at, updated_by) VALUES ('efa_duree_integration_annees', '10', 'EFA (catégories 1,2,3) : durée avant intégration (en années). Ancienne règle évoquée : 6 ans.', true, '2026-09-18 09:44:45.905157', NULL) ON CONFLICT DO NOTHING;
INSERT INTO parametres_carriere (cle, valeur, description, a_valider, updated_at, updated_by) VALUES ('stagiaire_classique_duree_annees', '1', 'Stagiaire classique : durée du stage avant levée de stage (en années).', true, '2026-09-18 09:44:45.905157', NULL) ON CONFLICT DO NOTHING;
INSERT INTO parametres_carriere (cle, valeur, description, a_valider, updated_at, updated_by) VALUES ('stagiaire_grade_periode_avant_avenant_annees', '2', 'Stagiaire gradé : durée avant le premier avenant (en années).', true, '2026-09-18 09:44:45.905157', NULL) ON CONFLICT DO NOTHING;
INSERT INTO parametres_carriere (cle, valeur, description, a_valider, updated_at, updated_by) VALUES ('stagiaire_grade_periodicite_progression_annees', '2', 'Stagiaire gradé : périodicité de progression après le premier avenant (en années).', true, '2026-09-18 09:44:45.905157', NULL) ON CONFLICT DO NOTHING;
INSERT INTO parametres_carriere (cle, valeur, description, a_valider, updated_at, updated_by) VALUES ('titularisation_delai_apres_integration_annees', '1', 'Catégories 1,2,3 : délai entre intégration et titularisation (en années).', true, '2026-09-18 09:44:45.905157', NULL) ON CONFLICT DO NOTHING;
INSERT INTO parametres_carriere (cle, valeur, description, a_valider, updated_at, updated_by) VALUES ('avancement_echelon_periodicite_annees', '2', 'Périodicité de l''avancement d''échelon (en années), toutes catégories.', true, '2026-09-18 09:44:45.905157', NULL) ON CONFLICT DO NOTHING;
INSERT INTO parametres_carriere (cle, valeur, description, a_valider, updated_at, updated_by) VALUES ('avancement_classe_condition', 'classe 2, echelon 3', 'Condition d''éligibilité à l''avancement de classe (texte libre, à formaliser).', true, '2026-09-18 09:44:45.905157', NULL) ON CONFLICT DO NOTHING;
INSERT INTO parametres_carriere (cle, valeur, description, a_valider, updated_at, updated_by) VALUES ('renouvellement_notification_delai_mois', '6', 'Délai de notification avant échéance de contrat pour un renouvellement (en mois).', false, '2026-09-18 09:44:45.905157', NULL) ON CONFLICT DO NOTHING;
INSERT INTO parametres_carriere (cle, valeur, description, a_valider, updated_at, updated_by) VALUES ('retraite_anticipation_annees', '1', 'Anticipation de détection de l''échéance de retraite (en années).', true, '2026-09-18 09:44:45.905157', NULL) ON CONFLICT DO NOTHING;
INSERT INTO parametres_carriere (cle, valeur, description, a_valider, updated_at, updated_by) VALUES ('retraite_age_legal_annees', '60', 'Âge légal de départ à la retraite (en années). À confirmer selon la réglementation applicable.', true, '2026-09-18 09:44:45.905157', NULL) ON CONFLICT DO NOTHING;

-- site_settings (5 lignes)
INSERT INTO site_settings (key, value) VALUES ('color_status_approved', '#2e8459') ON CONFLICT DO NOTHING;
INSERT INTO site_settings (key, value) VALUES ('color_navy', '#02295d') ON CONFLICT DO NOTHING;
INSERT INTO site_settings (key, value) VALUES ('color_gold', '#F2B705') ON CONFLICT DO NOTHING;
INSERT INTO site_settings (key, value) VALUES ('color_status_pending', '#B8860B') ON CONFLICT DO NOTHING;
INSERT INTO site_settings (key, value) VALUES ('color_status_rejected', '#B23A3A') ON CONFLICT DO NOTHING;

-- site_texts (15 lignes)
INSERT INTO site_texts (key, value, category) VALUES ('login.titre_universite_1', 'UNIVERSITÉ', 'Login') ON CONFLICT DO NOTHING;
INSERT INTO site_texts (key, value, category) VALUES ('login.titre_universite_2', 'DE MAHAJANGA', 'Login') ON CONFLICT DO NOTHING;
INSERT INTO site_texts (key, value, category) VALUES ('login.slogan', 'Excellence • Intégrité • Innovation', 'Login') ON CONFLICT DO NOTHING;
INSERT INTO site_texts (key, value, category) VALUES ('login.titre_bienvenue', 'Bienvenue sur l''espace RH', 'Login') ON CONFLICT DO NOTHING;
INSERT INTO site_texts (key, value, category) VALUES ('login.description_bienvenue', 'Université de Mahajanga — Plateforme de gestion des ressources humaines. Consultez votre dossier, vos congés et vos notifications en un seul endroit.', 'Login') ON CONFLICT DO NOTHING;
INSERT INTO site_texts (key, value, category) VALUES ('login.label_connexion', 'Connexion', 'Login') ON CONFLICT DO NOTHING;
INSERT INTO site_texts (key, value, category) VALUES ('login.titre_formulaire', 'Accéder à mon espace', 'Login') ON CONFLICT DO NOTHING;
INSERT INTO site_texts (key, value, category) VALUES ('login.placeholder_email', 'Adresse email', 'Login') ON CONFLICT DO NOTHING;
INSERT INTO site_texts (key, value, category) VALUES ('login.bouton_connexion_chargement', 'Connexion...', 'Login') ON CONFLICT DO NOTHING;
INSERT INTO site_texts (key, value, category) VALUES ('login.texte_inscription', 'Pas encore de compte ?', 'Login') ON CONFLICT DO NOTHING;
INSERT INTO site_texts (key, value, category) VALUES ('login.lien_inscription', 'Créer mon compte', 'Login') ON CONFLICT DO NOTHING;
INSERT INTO site_texts (key, value, category) VALUES ('login.label_mdp_oublie', 'Mot de passe oublié ?', 'Login') ON CONFLICT DO NOTHING;
INSERT INTO site_texts (key, value, category) VALUES ('login.label_remember', 'Se souvenir de moi', 'Login') ON CONFLICT DO NOTHING;
INSERT INTO site_texts (key, value, category) VALUES ('login.placeholder_mdp', 'Mot de passe', 'Login') ON CONFLICT DO NOTHING;
INSERT INTO site_texts (key, value, category) VALUES ('login.bouton_connexion', 'Se connecter', 'Login') ON CONFLICT DO NOTHING;

-- directions (3 lignes)
INSERT INTO directions (id, nom, responsable_personnel_id) VALUES (1, 'Direction du Patrimoine', NULL) ON CONFLICT DO NOTHING;
INSERT INTO directions (id, nom, responsable_personnel_id) VALUES (2, 'Direction des Affaires Administratives et Financières', NULL) ON CONFLICT DO NOTHING;
INSERT INTO directions (id, nom, responsable_personnel_id) VALUES (3, 'Direction des Technologies de l''Information et de la Communication', NULL) ON CONFLICT DO NOTHING;

-- services (12 lignes)
INSERT INTO services (id, nom, direction_id, responsable_personnel_id) VALUES (1, 'Service Maintenance des Infrastructures et Logistique', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO services (id, nom, direction_id, responsable_personnel_id) VALUES (2, 'Service du Patrimoine', 1, NULL) ON CONFLICT DO NOTHING;
INSERT INTO services (id, nom, direction_id, responsable_personnel_id) VALUES (3, 'Service Financier', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO services (id, nom, direction_id, responsable_personnel_id) VALUES (4, 'Service de la Gestion des Ressources Humaines', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO services (id, nom, direction_id, responsable_personnel_id) VALUES (5, 'Service de Suivi et Contrôle Interne', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO services (id, nom, direction_id, responsable_personnel_id) VALUES (6, 'Service Formation du PAT', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO services (id, nom, direction_id, responsable_personnel_id) VALUES (7, 'Service des Relations et Actions Sociales', 2, NULL) ON CONFLICT DO NOTHING;
INSERT INTO services (id, nom, direction_id, responsable_personnel_id) VALUES (8, 'Service de Maintenance Informatique', 3, NULL) ON CONFLICT DO NOTHING;
INSERT INTO services (id, nom, direction_id, responsable_personnel_id) VALUES (9, 'Service d''Administration Réseau et Informatisation', 3, NULL) ON CONFLICT DO NOTHING;
INSERT INTO services (id, nom, direction_id, responsable_personnel_id) VALUES (10, 'Communication Universitaire', 3, NULL) ON CONFLICT DO NOTHING;
INSERT INTO services (id, nom, direction_id, responsable_personnel_id) VALUES (11, 'Service Radio Université Mahajanga', 3, NULL) ON CONFLICT DO NOTHING;
INSERT INTO services (id, nom, direction_id, responsable_personnel_id) VALUES (12, 'Service de la Communication et Informatique en Ligne', 3, NULL) ON CONFLICT DO NOTHING;

-- Séquences alignées sur les identifiants insérés explicitement.
SELECT setval(pg_get_serial_sequence('permissions', 'id'), (SELECT max(id) FROM permissions));
SELECT setval(pg_get_serial_sequence('role_permissions', 'id'), (SELECT max(id) FROM role_permissions));
SELECT setval(pg_get_serial_sequence('categories_professionnelles', 'id'), (SELECT max(id) FROM categories_professionnelles));
SELECT setval(pg_get_serial_sequence('types_situation_administrative', 'id'), (SELECT max(id) FROM types_situation_administrative));
SELECT setval(pg_get_serial_sequence('grilles_indiciaires', 'id'), (SELECT max(id) FROM grilles_indiciaires));
SELECT setval(pg_get_serial_sequence('lignes_grille_indiciaire', 'id'), (SELECT max(id) FROM lignes_grille_indiciaire));
SELECT setval(pg_get_serial_sequence('directions', 'id'), (SELECT max(id) FROM directions));
SELECT setval(pg_get_serial_sequence('services', 'id'), (SELECT max(id) FROM services));

COMMIT;
