# Plan de rédaction — Mémoire SGRH Université de Mahajanga

Sommaire complet du mémoire, adapté du plan du mémoire modèle (ISSTM, « Système de gestion des employés appliqué à AQUALMA Mahajanga », 2024-2025) mais réorganisé pour être plus cohérent : numérotation homogène partout (le modèle mélange `IV.1` sans point et `IV.1.1.` avec point), regroupement plus logique de certaines sous-parties, ajout d'une Liste des tableaux et d'une section Annexes qu'un mémoire de cette richesse justifie.

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
| Présentation de l'établissement de formation | Historique, schéma du cursus (BACC → L1/L2 → L3 → M1 → M2), organigramme de l'établissement — reprend telle quelle la structure du modèle (§ « Présentation de l'ISSTM »), à adapter au nom exact de ton établissement | ⚠️ |
| Table des matières | Générée automatiquement par le traitement de texte une fois la rédaction terminée | — |
| Liste des abréviations | SGRH, PE, PAT, RH, JWT, MCD, MLD, MPD, API, CRUD, SQL... — à constituer au fil de la rédaction | ✍️ |
| Liste des figures | Toutes les captures d'écran et tous les schémas, numérotés dans l'ordre d'apparition | ✍️ |
| Liste des tableaux *(ajout recommandé, absent du modèle)* | Le dictionnaire de données (134 lignes), les tableaux comparatifs d'outils (§ V.1), le tableau des rôles — assez nombreux et longs pour mériter leur propre liste | ✍️ |

---

## Introduction

Contexte général (transformation numérique des services RH), problématique (comment un système d'information peut fiabiliser et sécuriser la gestion administrative du personnel d'une université), annonce du plan en trois parties. Une page, à rédiger en dernier — c'est plus facile une fois tout le reste écrit.

---

## PREMIÈRE PARTIE — Cadre théorique de l'étude

### Chapitre I : Présentation du cadre du projet

Dans le modèle, ce chapitre présente AQUALMA (l'entreprise d'accueil du stage). **⚠️ Point structurant à trancher en premier** : le SGRH n'a pas été développé pour une entreprise tierce mais pour l'Université de Mahajanga elle-même — donc ce chapitre ne décrit pas un « client externe » mais le terrain réel du projet. Deux cas possibles, qui changent le contenu de ce chapitre :
- **Cas A — projet réalisé dans le cadre d'un stage** au sein d'un service de l'université (ex. Direction des Ressources Humaines) : ce chapitre suit alors exactement la structure du modèle, avec l'Université de Mahajanga (ou la direction d'accueil) à la place d'AQUALMA.
- **Cas B — projet personnel/académique** sans stage formalisé dans un service précis : ce chapitre devient une présentation de l'Université de Mahajanga comme *sujet d'étude* plutôt que comme *entreprise d'accueil*, formulation légèrement différente mais plan identique.

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| I.1 Historique et création de l'Université de Mahajanga | Date de création, évolution, rattachement | ⚠️ |
| I.2 Missions et offre de formation | Facultés, instituts, mentions proposées | ⚠️ |
| I.3 Organisation administrative | Organigramme général de l'université | ⚠️ |
| I.4 La direction/le service d'accueil du projet | Rôle, organisation interne, effectifs suivis | ⚠️ |
| I.5 Cadre précis du projet | Durée, encadrement, modalités (stage ou non) | ⚠️ |

### Chapitre II : Aperçu de la gestion des ressources humaines

Chapitre généraliste du modèle, directement réutilisable — son contenu ne dépend pas d'AQUALMA ni du SGRH, c'est un rappel théorique classique sur la GRH.

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| II.1 Évolution des pratiques de gestion du personnel | II.1.1 Historique et contexte · II.1.2 Impact sur les organisations | ✍️ |
| II.2 Importance de la gestion administrative des employés | II.2.1 Définition et objectifs · II.2.2 Conséquences d'une gestion efficace | ✍️ |
| II.3 Missions clés de la GRH | II.3.1 Recrutement et intégration · II.3.2 Développement et gestion des talents · II.3.3 Gestion des performances · II.3.4 Gestion des relations avec les employés | ✍️ |
| II.4 Outils et systèmes pour gérer efficacement les employés | II.4.1 Système d'information des ressources humaines (SIRH) — bonne transition vers le chapitre III | ✍️ |

### Chapitre III : Revue de littérature sur les systèmes de gestion des ressources humaines

Le modèle cite SAP R/2 et Workday comme repères historiques (§ III.2) — réutilisables tels quels, ce sont des faits génériques du domaine, indépendants du projet. J'ajoute une sous-section IV absente du modèle, pertinente ici puisque notre sujet est spécifiquement une institution publique malgache et non une entreprise privée.

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| III.1 Définition et concepts de base d'un logiciel de gestion des employés | Définition générale, centralisation, automatisation | ✍️ |
| III.2 Historique et principales évolutions de ces systèmes | Repères historiques (SAP R/2 → Workday, ou équivalents) | ✍️ |
| III.3 Mode de fonctionnement des systèmes de gestion des employés modernes | Centralisation, interface utilisateur, automatisation | ✍️ |
| III.4 *(ajout)* Spécificités de la gestion RH en contexte universitaire public malgache | Statuts EFA/ELD/Fonctionnaire, grilles indiciaires, distinction enseignant/administratif — ce qui motive concrètement les choix du SGRH (transition naturelle vers la Partie 2) | ✅ matière déjà présente dans `README.md` et § IV.1 de `preparation_memoire.md` |

---

## DEUXIÈME PARTIE — Matériels et méthodes de conception

*(Contenu déjà rédigé en détail dans `client/docs/preparation_memoire.md`, § IV et V — ce plan ne fait que rappeler la structure retenue, sans UML, uniquement le MCD.)*

### Chapitre IV : Analyse et conception

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| IV.1 Cahier des charges | Contexte, objectifs, besoins, moyens, résultats attendus, exigences techniques | ✅ § IV.1 |
| IV.2 Dictionnaire de données | Tableau Nom/Désignation/Type, 134 champs sur 11 tables | ✅ § IV.2 + [artefact](https://claude.ai/artifact/CL3gBHExJ3FQusdtvQtGhJ) |
| IV.3 Modèle conceptuel de données (MCD) | Entités, relations, cardinalités Merise | ✅ § IV.3 + [artefact](https://claude.ai/artifact/2Xqyva7uKeq2qwGWf8UQjJ) |
| IV.4 Modèle logique et physique de données (MLD/MPD) | Traduction SQL, migrations versionnées | ✅ § IV.4 |
| IV.5 Choix de méthode de conception | MERISE vs Processus Unifié, méthodologie itérative réellement suivie | ✅ § IV.5 |
| IV.6 Les acteurs du système | 6 rôles, description textuelle (pas de diagramme UML) | ✅ § IV.6 |

### Chapitre V : Réalisation du système de gestion

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| V.1 Présentation des outils techniques | React/Node/Express/PostgreSQL, tableaux comparatifs | ✅ § V.1 |
| V.2 Gestion de la base de données | Connexion, requêtes paramétrées, migrations | ✅ § V.2 |
| V.3 Génération de documents | PDF, numérotation, QR code d'authenticité | ✅ § V.3 |
| V.4 Exploration des interfaces | Identification des utilisateurs, choix de service (menus par rôle) | ✅ § V.4 |

---

## TROISIÈME PARTIE — Résultats et discussions

*(Contenu déjà rédigé dans `preparation_memoire.md`, § VI et VII.)*

### Chapitre VI : Présentation des résultats

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| VI.1 → VI.10 | Une sous-section par écran capturé (connexion, tableaux de bord, personnel PE/PAT, établissements, congés, documents, contrats, comptes, permissions, mode sombre) | ✅ liste précise au § VI, captures à prendre toi-même |

### Chapitre VII : Analyse des résultats et discussions

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| VII.1 Avantages du logiciel développé | 5 points forts identifiés | ✅ § VII.1 |
| VII.2 Limites rencontrées durant le projet | 5 limites assumées honnêtement | ✅ § VII.2 |
| VII.3 Axes d'amélioration envisageables | 6 pistes concrètes | ✅ § VII.3 |

---

## Pages finales

| Section | Contenu attendu | Statut |
| --- | --- | --- |
| Conclusion | Synthèse du travail réalisé, réponse à la problématique, ouverture | ✍️ à rédiger en dernier |
| Bibliographie | Ouvrages/cours cités (GRH, bases de données, génie logiciel) | ⚠️ dépend de tes lectures de cours |
| Webographie | Documentation technique citée (React, PostgreSQL, Express, JWT...) | ✍️ facile à constituer, ce sont les docs officielles utilisées |
| Résumé / Abstract | Une demi-page en français puis en anglais, mêmes mots-clés que l'introduction | ✍️ à rédiger en dernier |
| Annexes *(ajout recommandé)* | Extraits de migrations SQL significatives, MCD en pleine page, capture de la matrice de permissions complète, extrait de `README.md` | ✍️ optionnel mais valorisant vu la richesse du projet |

---

## Repère de longueur indicative

Pour te situer par rapport au modèle (74 pages de corps de texte, hors bibliographie/annexes) :

| Partie | Pages dans le modèle | Repère pour le SGRH |
| --- | --- | --- |
| Partie 1 (Chap. I-III) | ~12 pages | 10-14 pages — contenu largement générique/théorique |
| Partie 2 (Chap. IV-V) | ~29 pages | 25-35 pages — le SGRH a plus de tables et plus de rôles, donc naturellement plus de matière |
| Partie 3 (Chap. VI-VII) | ~20 pages | 20-25 pages — dépend surtout du nombre de captures choisies au Chap. VI |

Le choix de portée évoqué au § IV.1 de `preparation_memoire.md` (système complet vs sous-ensemble) a un impact direct ici : présenter les 36 tables en détail ferait déraper la Partie 2 largement au-delà de ce repère — d'où la recommandation d'y rester concentré sur les 11 tables du cœur métier, comme fait dans le dictionnaire de données.
