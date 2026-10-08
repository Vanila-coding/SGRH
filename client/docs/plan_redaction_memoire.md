# Plan de rédaction — Mémoire SGRH Université de Mahajanga

Sommaire complet du mémoire. Deux sources de référence ont servi à construire ce plan :
- **JAOSOA Tanaël Faustin, « Digitalisation du suivi administratif du personnel : cas de l'Université de Mahajanga », ISSTM, 2025-2026** — fournit la **structure d'ensemble** (découpage en parties/sections, niveau de détail de chaque sous-partie). Son contenu de corps de texte (Laravel/Inertia.js, préinscription, site vitrine…) correspond à un autre projet logiciel et n'est pas repris : seule l'architecture du plan est réutilisée, adaptée au SGRH.
- **RAKOTONOMENJANAHARY Elio Rachel, « Système de gestion des employés appliqué à AQUALMA Mahajanga », ISSTM, 2024-2025** — fournit la **matière des sous-chapitres** (cahier des charges, dictionnaire de données, MCD/MPD, choix de méthode, diagrammes, structure du chapitre résultats et du chapitre discussion) adaptée au contenu réel du SGRH.

Numérotation homogène partout. Liste des tableaux et section Annexes ajoutées (absentes des deux modèles mais justifiées par la richesse du projet).

Légende de la colonne **Statut** :
- ✅ **Matière prête** — contenu déjà rédigé, à reprendre dans `client/docs/preparation_memoire.md` ou dans les artefacts liés (MCD, dictionnaire de données).
- ✍️ **À rédiger** — structure et angle donnés ici, mais le texte reste à écrire (contenu générique/académique, pas spécifique au SGRH).
- ⚠️ **À toi de décider** — dépend d'informations que je n'ai pas (contexte du stage, dates, jury, choix de portée).

---

## Pages liminaires

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| Page de garde | Institution, mention, intitulé du diplôme, titre du mémoire, nom, date de soutenance, jury, promotion | ⚠️ |
| Dédicace | Un paragraphe personnel, libre | ⚠️ |
| Remerciements | Encadreur pédagogique, encadreur professionnel (si stage), équipe pédagogique, proches | ⚠️ |
| Présentation de l'établissement de formation | Historique, schéma du cursus (BACC → L1/L2 → L3 → M1 → M2), organigramme de l'établissement | ⚠️ |
| Table des matières | Générée automatiquement par le traitement de texte une fois la rédaction terminée | — |
| Liste des abréviations | SGRH, PE, PAT, RH, JWT, MCD, MLD, MPD, API, CRUD, SQL, SIRH... — à constituer au fil de la rédaction | ✍️ |
| Liste des figures | Toutes les captures d'écran et tous les schémas, numérotés dans l'ordre d'apparition | ✍️ |
| Liste des tableaux *(ajout recommandé)* | Le dictionnaire de données, les tableaux comparatifs d'outils, le tableau des rôles, le tableau MERISE/UP — assez nombreux et longs pour mériter leur propre liste | ✍️ |

---

## Introduction

Contexte général (transformation numérique des services RH), problématique (comment un système d'information peut centraliser, sécuriser et faciliter la gestion des personnels d'une université tout en améliorant le suivi des procédures administratives), annonce du plan en trois parties. Une page, à rédiger en dernier — c'est plus facile une fois tout le reste écrit.

---

## PREMIÈRE PARTIE — Matériel et méthode

Partie en trois chapitres : le terrain du stage, le cadre théorique (GRH + revue de littérature, fusionnés), puis les matériels et méthodes de conception proprement dits — ce dernier chapitre reprend, en plus détaillé, la logique du plan JAOSOA (étude de l'existant, spécification des besoins, architecture, technologies, méthodologie, modélisation, méthodologie de test).

### Chapitre I : Cadre du stage

**⚠️ En attente** — à rédiger une fois que tu auras fourni le PDF avec les informations du stage (service d'accueil, dates, encadrement, organisation interne). Je n'invente aucune donnée d'ici là.

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| I.1 Présentation de l'Université de Mahajanga | Historique et création, missions et offre de formation, organisation administrative générale | ⚠️ en attente du PDF |
| I.2 Le service d'accueil du stage | Rôle, organisation interne, effectifs suivis, rattachement hiérarchique | ⚠️ en attente du PDF |
| I.3 Cadre précis du stage | Durée, encadrement pédagogique et professionnel, modalités, missions confiées | ⚠️ en attente du PDF |

### Chapitre II : Aperçu de la gestion des ressources humaines et revue de littérature

Fusion des deux chapitres généralistes (Aperçu de la GRH + Revue de littérature sur les systèmes de gestion des employés) en un seul chapitre de cadrage théorique : on part de la GRH en général, on arrive aux systèmes d'information qui la soutiennent, ce qui amène naturellement au chapitre suivant (le SGRH comme réponse à ce besoin).

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| II.1 Évolution des pratiques de gestion du personnel | Historique et contexte, impact sur les organisations | ✍️ |
| II.2 Importance de la gestion administrative des employés | Définition et objectifs, conséquences d'une gestion efficace | ✍️ |
| II.3 Missions clés de la GRH | Recrutement et intégration, développement des talents, gestion des performances, gestion des relations avec les employés | ✍️ |
| II.4 Définition et concepts de base d'un logiciel de gestion des employés | Définition générale, centralisation, automatisation | ✍️ |
| II.5 Historique et évolution des systèmes de gestion des employés | Repères historiques (SAP R/2 → Workday, ou équivalents) | ✍️ |
| II.6 Mode de fonctionnement des systèmes modernes | Centralisation, interface utilisateur, automatisation — transition vers le SIRH | ✍️ |
| II.7 Spécificités de la gestion RH en contexte universitaire public malgache | Statuts EFA/ELD/Fonctionnaire, grilles indiciaires, distinction enseignant/administratif — ce qui motive concrètement les choix du SGRH (transition vers le chapitre III) | ✅ matière déjà présente dans `README.md` et § IV.1 de `preparation_memoire.md` |

### Chapitre III : Matériels et méthodes de conception

Chapitre le plus dense de la Partie 1. Structure inspirée des sections 1 à 10 de la Partie I du plan JAOSOA (étude de l'existant, spécification des besoins, architecture, technologies, environnement, méthodologie, modélisation, méthodologie de test), mais avec le contenu réellement produit cette session, présent dans `docs/conception/` (généré depuis la base réelle, pas écrit à la main) et dans `preparation_memoire.md` § IV-V. Le MCD et le MPD existent désormais tous les deux (diagramme Mermaid + tableaux Word par table, cœur métier de 13 tables).

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| III.1 Cahier des charges | Contexte, objectifs, besoins de l'utilisateur, moyens, résultats attendus, exigences techniques | ✅ § IV.1 de `preparation_memoire.md` |
| III.2 Étude de l'existant | Fonctionnement avant le SGRH (suivi papier/tableurs dispersés), limites et insuffisances constatées, besoins identifiés pour la refonte | ✍️ à rédiger — reprend l'esprit de JAOSOA § 2 (« Étude de l'existant »), adapté au contexte RH réel (pas de préinscription/scolarité) |
| III.3 Spécification des besoins | Besoins fonctionnels (par module : personnel, congés, documents, contrats, comptes), besoins non fonctionnels (sécurité, traçabilité, performance), identification des acteurs | ✅ reprend `docs/conception/03_matrice_roles_permissions.md` pour les acteurs |
| III.4 Choix de l'architecture logicielle | Architecture client/serveur (React côté client, API Express côté serveur, PostgreSQL), séparation des responsabilités frontend/backend, communication par API REST | ✅ § V de `preparation_memoire.md` |
| III.5 Technologies et outils utilisés | React, Vite, Tailwind CSS, Express, PostgreSQL, bibliothèques (lucide-react, etc.), configuration matérielle, environnement logiciel, Git/GitHub — tableaux comparatifs | ✅ § V.1 de `preparation_memoire.md` + `docs/memoire/partie1_materiel_methode.docx` §4 |
| III.6 Méthode de conception | Comparaison MERISE / Processus Unifié (tableau avantages-inconvénients), démarche itérative réellement suivie, règles de gestion (58 règles numérotées RG-P/A/C/D/K/T/O/J) | ✅ § IV.5 de `preparation_memoire.md` + `docs/conception/01_regles_de_gestion.md` |
| III.7 Modélisation du système | Cas d'utilisation par rôle, **modèle conceptuel de données (MCD)** complet, **modèle physique de données (MPD)**, dictionnaire de données et modélisation complète des tables | MCD ✅ `docs/conception/02_modele_donnees_dictionnaire.md` + [artefact](https://claude.ai/artifact/2Xqyva7uKeq2qwGWf8UQjJ) · MPD ✅ `docs/conception/06_modele_physique_donnees.md` + `docs/memoire/modele_physique_donnees.docx` (13 tables, format boîtes) · dictionnaire ✅ (36 tables) + [artefact à 11 tables](https://claude.ai/artifact/CL3gBHExJ3FQusdtvQtGhJ) · cas d'utilisation ✅ `docs/conception/07_cas_utilisation.md` + `docs/memoire/cas_utilisation.docx` (6 acteurs, 12 cas, diagramme avec stick figures) |
| III.8 Acteurs et permissions du système | 6 rôles, matrice des permissions, circuits de validation et notifications (congé, document, compte, alertes, contrats) | ✅ `docs/conception/03_matrice_roles_permissions.md` + `docs/conception/04_circuits_validation_notifications.md` |
| III.9 Méthodologie de test et de validation | Tests automatisés (suite serveur), tests manuels et recette fonctionnelle, stratégie de déploiement | ✅ suite `server/test/` (79 tests) — partiel pour le parcours navigateur complet, voir `docs/conception/05_audit_modifications.md` § 5.4 |

---

## DEUXIÈME PARTIE — Résultats

Captures d'écran des interfaces avec leurs explications, puis l'étape de déploiement. Structure du chapitre IV inspirée de la logique « une section par brique fonctionnelle » de JAOSOA Partie II, adaptée aux modules réels du SGRH (et non à un site vitrine/préinscription).

### Chapitre IV : Présentation des résultats

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| IV.1 Présentation générale de l'interface | Charte graphique et identité visuelle, ergonomie et logique de navigation, mode sombre, adaptation responsive | ✍️ à rédiger, captures à prendre |
| IV.2 Authentification et gestion des comptes | Connexion, rôles et permissions, promotion de compte (secrétariat) | ✅ liste précise au § VI de `preparation_memoire.md` |
| IV.3 Tableau de bord | Par rôle (RH, PE, PAT, secrétariat) | ✍️ |
| IV.4 Gestion du personnel (PE/PAT) | Fiche employé, création/modification, grille indiciaire, import/export Excel | ✍️ |
| IV.5 Gestion des établissements et directions/services | Organigramme, rattachements | ✍️ |
| IV.6 Gestion des congés | Dépôt, circuit secrétariat → chef de service → RH, décision | ✅ `docs/conception/04_circuits_validation_notifications.md` |
| IV.7 Gestion des documents administratifs | Demande, circuit secrétariat, génération de documents | ✍️ |
| IV.8 Gestion des contrats et de la carrière | Suivi, avancement, dossier PDF | ✍️ |
| IV.9 Fonctionnalités transversales | Notifications, journal d'activité, recherche, corbeille/restauration | ✍️ |

### Chapitre V : Déploiement

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| V.1 Environnement de déploiement | Serveur, base de données, prérequis | ✍️ à rédiger selon le déploiement réel choisi |
| V.2 Étapes de mise en production | Migrations, variables d'environnement, build client, démarrage du serveur | ✍️ à rédiger — s'appuyer sur `README.md` |
| V.3 Vérifications post-déploiement | Tests de bon fonctionnement, points de contrôle | ✍️ |

---

## TROISIÈME PARTIE — Discussion et recommandations

Structure enrichie par rapport au plan AQUALMA (qui ne traitait qu'avantages/limites/axes d'amélioration) : reprend le découpage plus fin de JAOSOA Partie III (performance, sécurité, qualité du code, difficultés rencontrées, impact du projet), pertinent pour un système qui gère des données RH sensibles.

### Chapitre VI : Discussion

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| VI.1 Avantages du système développé | Points forts identifiés (centralisation, traçabilité, automatisation des calculs d'indice, etc.) | ✅ § VII.1 de `preparation_memoire.md` |
| VI.2 Performance et efficacité | Temps de réponse, requêtes paramétrées, gains de temps pour la RH | ✍️ |
| VI.3 Sécurité de l'application | Authentification JWT, hachage des mots de passe, contrôle d'accès par rôle (permissions), limitation des tentatives de connexion, en-têtes de sécurité | ✅ reprend `docs/conception/05_audit_modifications.md` (point 7, verrouillage de connexion) |
| VI.4 Qualité du code et maintenabilité | Organisation modulaire (contrôleurs/services/repositories côté serveur, contexts/hooks côté client), couverture de tests, conventions de code (lint à zéro) | ✅ `docs/conception/05_audit_modifications.md` § 5.3-5.4 |
| VI.5 Limites techniques rencontrées | Grilles indiciaires manquantes pour EFA/ELD, catégorie non persistée sur la fiche, parcours secrétariat non entièrement rejoué en navigateur | ✅ § VII.2 de `preparation_memoire.md` + `docs/conception/05_audit_modifications.md` § 5.4 |
| VI.6 Difficultés rencontrées durant le développement | Difficultés techniques et solutions apportées (à choisir parmi les incidents réels de la session : bug d'indice à la création, CORS, migration de grille, etc.) | ✍️ à sélectionner et rédiger |
| VI.7 Impact et retombées attendues | Impact sur la gestion administrative du personnel, sur la fiabilité des données de carrière, sur la charge de travail du secrétariat et de la RH | ✍️ |

### Chapitre VII : Recommandations

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| VII.1 Axes d'amélioration envisageables | Pistes concrètes déjà identifiées (persistance de la catégorie, grilles EFA/ELD, etc.) | ✅ § VII.3 de `preparation_memoire.md` |
| VII.2 Modifications et mises à jour futures possibles | Évolutions envisageables du SGRH (nouveaux modules, statut « à compléter » pour le secrétariat, etc.) | ✍️ reprend les points « restant » de `docs/conception/05_audit_modifications.md` § 5.4 |
| VII.3 Recommandations pour la maintenance et le déploiement | Bonnes pratiques pour les futurs développeurs/mainteneurs (migrations, tests avant commit, mise à jour de la documentation) | ✍️ s'appuie sur les conventions déjà suivies dans `README.md` et `client/docs/claude_tache.md` |

---

## Pages finales

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| Conclusion | Synthèse du travail réalisé, réponse à la problématique, ouverture | ✍️ à rédiger en dernier |
| Bibliographie | Ouvrages/cours cités (GRH, bases de données, génie logiciel) | ⚠️ dépend de tes lectures de cours |
| Webographie | Documentation technique citée (React, PostgreSQL, Express, JWT...) | ✍️ facile à constituer, ce sont les docs officielles utilisées |
| Résumé / Abstract | Une demi-page en français puis en anglais, mêmes mots-clés que l'introduction | ✍️ à rédiger en dernier |
| Annexes *(ajout recommandé)* | Extraits de migrations SQL significatives, MCD/MPD en pleine page, capture de la matrice de permissions complète, extrait de `README.md`, détail des 36 tables si non inclus au corps du texte | ✍️ optionnel mais valorisant vu la richesse du projet |

---

## Repère de longueur indicative

Pour te situer par rapport aux deux modèles (AQUALMA : 74 pages de corps de texte ; JAOSOA : plan plus détaillé mais contenu générique) :

| Partie | Repère pour le SGRH |
| --- | --- |
| Partie 1 (Chap. I-III) | 18-24 pages — le chapitre III (étude de l'existant + spécification + architecture + MCD + MPD + modélisation des tables) est le plus dense, plus riche que son équivalent dans les deux modèles |
| Partie 2 (Chap. IV-V) | 25-35 pages — le SGRH a plus de tables et plus de rôles, donc naturellement plus de matière, plus le chapitre déploiement |
| Partie 3 (Chap. VI-VII) | 14-20 pages — discussion enrichie (performance, sécurité, qualité du code, impact) + recommandations |

Le choix de portée évoqué au § IV.1 de `preparation_memoire.md` (système complet vs sous-ensemble) a un impact direct ici : présenter les 36 tables en détail dans le corps du texte ferait déraper le chapitre III au-delà de ce repère — d'où la recommandation d'y rester concentré sur les 11 tables du cœur métier, comme fait dans le dictionnaire de données, et de renvoyer le détail des 36 tables en annexe.
