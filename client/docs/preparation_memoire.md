# Préparation du mémoire — SGRH Université de Mahajanga

## 0. Comment utiliser ce document

Ce fichier n'est **pas** le mémoire — c'est la matière première pour l'écrire, organisée exactement selon la structure d'un mémoire modèle que tu m'as fourni (ISSTM, Mention STNPA, Licence professionnelle en Génie Informatique, thème « Système de gestion des employés »). Tu m'as demandé de me concentrer sur les **Deuxième** et **Troisième parties** (conception/réalisation puis résultats), donc c'est ce que je couvre ici en détail — la Première partie (contexte, présentation de l'établissement, revue de littérature) suit une structure standard que tu peux reprendre du modèle directement, adaptée à l'Université de Mahajanga plutôt qu'à AQUALMA.

Pour chaque section :
- **Ce qu'attend la structure modèle** — un rappel bref de ce qui doit s'y trouver.
- **Matière réelle du projet SGRH** — du contenu déjà rédigé ou des données réelles extraites du code, prêtes à être reprises, complétées et mises en forme dans ton traitement de texte.
- **⚠️ À toi de trancher** — les points où je ne peux pas décider à ta place (portée du mémoire, dates, noms du jury...).

Un écart important avec le mémoire modèle : leur système est un projet desktop (C#/.NET/SQL Server, ~7 entités). Le SGRH est une application web complète (React/Express/PostgreSQL, **36 tables**, **6 rôles**, **19 migrations**, **72 tests automatisés**). C'est une bonne nouvelle pour la richesse du mémoire, mais ça veut dire que tu ne peux probablement pas tout présenter en détail sans dépasser largement la longueur attendue d'un mémoire de Licence — voir la remarque de cadrage au § IV.1.

---

# DEUXIÈME PARTIE : MATÉRIELS ET MÉTHODES DE CONCEPTION

## CHAPITRE IV : ANALYSE ET CONCEPTION

### IV.1. Cahier des charges

**Ce qu'attend la structure modèle** : description du contexte (stage/projet), formulation, objectifs et besoins utilisateurs, moyens humains/matériels, résultats attendus, exigences techniques.

**⚠️ À toi de trancher en premier, avant tout le reste** : le SGRH couvre énormément de fonctionnalités (personnel PE/PAT, carrière, grilles indiciaires, congés avec double vérification secrétariat/chef de service, contrats, documents administratifs, permissions par rôle, corbeille, audit...). Un mémoire de Licence n'a pas vocation à tout détailler. Deux options :
1. **Présenter le système complet dans ses grandes lignes**, puis choisir 2-3 modules à approfondir en diagrammes de séquence détaillés (ex. congés + personnel PE/PAT, qui sont les plus riches en règles métier).
2. **Recentrer le mémoire sur un sous-ensemble cohérent** (ex. « Gestion du personnel et des congés ») et mentionner le reste comme extension déjà livrée.

Je recommande l'option 1 : le système entier est déjà construit et documenté, ce serait dommage de ne pas le montrer, même en restant concis sur les modules secondaires.

**Matière réelle — objectifs et besoins identifiés** (à reformuler avec « nous » comme dans le modèle) :
- Centraliser les données du personnel de l'Université de Mahajanga, avec une distinction claire entre **PE** (Personnel Enseignant) et **PAT** (Personnel Administratif et Technique) — une même personne pouvant cumuler les deux rôles.
- Automatiser le calcul des droits à congé (2,5 jours par mois de service, règle légale malgache) et fiabiliser le suivi du solde, pour remplacer un suivi manuel sujet à erreurs.
- Sécuriser et tracer les décisions administratives (congés, contrats, situations administratives) avec un circuit de validation à plusieurs niveaux, conforme à la pratique administrative réelle (secrétariat qui vérifie les pièces avant transmission, avis du chef de service, décision finale du RH).
- Permettre au personnel lui-même de consulter son dossier, demander des documents administratifs et suivre ses demandes, sans passer systématiquement par un guichet physique.
- Garantir que chaque permission accordée à un rôle produit un effet réel dans l'interface (pas de fonctionnalité "fantôme" visible en base mais invisible à l'écran).

**Matière réelle — moyens** :
- *Humains* : un développeur (toi), avec Claude Code (assistant de développement basé sur un LLM, Anthropic) comme outil de pair-programming pour l'implémentation — à documenter honnêtement dans la méthodologie, voir § IV.5.
- *Matériels* : poste de développement standard (à compléter avec tes specs machine, comme le tableau du modèle) ; serveur PostgreSQL local (`rh_mahajanga`) ; dépôt Git (GitHub, `tanahelr-create/SGRH`).

**Matière réelle — résultats attendus (déjà livrés, à formuler au passé/présent puisque le système fonctionne)** :
- Inscription/connexion sécurisée (JWT, réinitialisation de mot de passe par OTP e-mail).
- Tableau de bord différencié par rôle.
- Gestion complète du personnel PE/PAT (ajout, modification, import/export Excel, recherche, fiches détaillées).
- Gestion des congés avec calcul automatique des droits, vérification secrétariat, avis du chef de service, décision RH, restitution des jours en cas de refus.
- Gestion des contrats (import PDF, renouvellement, non-renouvellement motivé, alertes d'échéance).
- Génération de documents administratifs (certificats, décisions de congé, état de congé) avec QR code de vérification d'authenticité.
- Système de permissions granulaire : n'importe quelle permission est attribuable à n'importe quel rôle, avec effet immédiat dans l'interface.
- Corbeille transactionnelle (suppression réversible de comptes).
- Journal d'audit scindé par rôle (le RH ne voit pas les actions réservées au Superadmin).

**Matière réelle — exigences techniques** :
- Langage/plateforme : JavaScript (Node.js côté serveur, React côté client) — voir comparatif détaillé au § V.1.
- Base de données : PostgreSQL, accédée via des requêtes SQL paramétrées (pas d'ORM — choix assumé, à justifier dans le mémoire : contrôle fin des requêtes, pas de couche d'abstraction à apprendre en plus).
- Authentification : JSON Web Token (JWT), mots de passe hachés avec bcrypt.
- Tests : suite de tests automatisés (Node.js `node:test`), 72 tests couvrant les règles métier critiques (calcul de solde de congé, sécurité des documents, limitation de débit des tentatives de connexion...).

---

### IV.2. L'analyse des données à travers un dictionnaire de données

**Ce qu'attend la structure modèle** : un **tableau unique et continu** Nom / Désignation / Type couvrant tous les champs du système (le modèle liste ainsi, dans une seule table, l'identifiant, le nom, l'adresse, le CIN, le salaire, les horaires de présence... champ par champ), puis une section séparée « Identification des entités » qui regroupe ces champs par entité, puis « Définition des relations ».

**Matière réelle — exhaustive, pas une sélection** : le tableau ci-dessous reprend exactement ce format, avec **134 champs sur 11 tables**, extraits directement du schéma réel (`server/database/schema.sql`). Il est volontairement complet plutôt que résumé, comme celui du mémoire modèle — c'est normal qu'il soit nettement plus long que le leur (~30 champs) : un système réel en production porte plus d'attributs qu'un prototype de stage. Version consultable et copiable dans le navigateur : **https://claude.ai/artifact/CL3gBHExJ3FQusdtvQtGhJ**. Le SGRH compte 36 tables au total ; celles listées ici sont les 11 du cœur « ressources humaines » (les tables annexes — grilles indiciaires, catégories professionnelles, paramétrage du site... — sont dans `README.md`, « Structure de la base de données », à ajouter si tu élargis le périmètre du mémoire).

**PERSONNEL** (table `personnel`, 39 champs) :

| Nom | Désignation | Type |
| --- | --- | --- |
| id | Identifiant unique de la fiche (clé primaire) | Entier |
| matricule | Matricule interne, 6 chiffres, unique | Chaîne de caractères |
| nom | Nom de famille | Chaîne de caractères |
| prenom | Prénom (facultatif — une partie du personnel n'a légitimement qu'un seul nom) | Chaîne de caractères |
| email | Adresse e-mail, unique | Chaîne de caractères |
| fonction | Fonction occupée (Enseignant, Agent, Chef de service...) | Chaîne de caractères |
| corps | Statut d'emploi (EFA / ELD / Fonctionnaire) | Chaîne de caractères |
| grade | Grade académique ou administratif | Chaîne de caractères |
| service | Nom du service (copie texte héritée ; la relation officielle passe par la table Service) | Chaîne de caractères |
| direction | Nom de la direction (copie texte héritée, idem) | Chaîne de caractères |
| telephone | Numéro de téléphone | Chaîne de caractères |
| type_contrat | Type de contrat (CDI / CDD / Vacataire / Stagiaire) | Chaîne de caractères |
| created_at | Date de création de la fiche | Horodatage |
| role | Rôle métier historique (PE/PAT), conservé pour compatibilité — remplacé par Personnel_rôles | Chaîne de caractères |
| date_recrutement | Date d'entrée en fonction | Date |
| date_echeance_contrat | Date d'échéance du contrat en cours | Date |
| contrat_permanent | Contrat à durée indéterminée | Booléen |
| solde_conges | Solde de congé annuel disponible | Numérique |
| derniere_recharge_annee | Dernière année où le solde annuel a été crédité | Entier |
| notif_echeance_envoyee | L'alerte d'échéance de contrat a déjà été envoyée | Booléen |
| indice | Indice de solde | Chaîne de caractères |
| chapitre_ib | Chapitre budgétaire associé à l'indice | Chaîne de caractères |
| lieu_naissance | Lieu de naissance | Chaîne de caractères |
| date_naissance | Date de naissance | Date |
| nationalite | Nationalité | Chaîne de caractères |
| situation_familiale | Situation familiale (célibataire, marié(e), divorcé(e), veuf/veuve) | Chaîne de caractères |
| adresse | Adresse postale | Texte long |
| sexe | Sexe (Masculin / Féminin) | Chaîne de caractères |
| photo_profil | Chemin du fichier de la photo de profil | Chaîne de caractères |
| date_prise_fonction | Date de prise du poste actuel | Date |
| poste | Intitulé précis du poste occupé | Chaîne de caractères |
| classe | Classe dans la grille indiciaire | Chaîne de caractères |
| echelon | Échelon dans la grille indiciaire | Chaîne de caractères |
| categorie_id | Catégorie professionnelle de rattachement | Entier |
| cadre | Cadre statutaire (A / B / C / D) | Chaîne de caractères |
| echelle | Échelle de rémunération | Chaîne de caractères |
| indice_num | Valeur numérique de l'indice | Entier |
| ligne_grille_actuelle_id | Ligne de la grille indiciaire actuellement appliquée | Entier |
| indice_source | Origine de l'indice (import Excel / saisie RH / réglementaire / à confirmer) | Chaîne de caractères |

**PERSONNEL_RÔLES** (table `personnel_roles`, 4 champs) :

| Nom | Désignation | Type |
| --- | --- | --- |
| id | Identifiant de la ligne (clé primaire) | Entier |
| personnel_id | Fiche personnel concernée | Entier |
| role | Rôle métier exercé (PE ou PAT) — une personne peut avoir 0 à 2 lignes | Chaîne de caractères |
| created_at | Date d'attribution du rôle | Horodatage |

**PERSONNEL_PE_INFOS** (table `personnel_pe_infos`, 7 champs) :

| Nom | Désignation | Type |
| --- | --- | --- |
| personnel_id | Fiche personnel concernée (clé primaire et étrangère) | Entier |
| etablissement_id | Établissement de rattachement de l'enseignant | Entier |
| corps_pe | Grade académique (ex. Maître de Conférences) | Chaîne de caractères |
| categorie_libelle | Libellé de catégorie académique | Chaîne de caractères |
| diplome | Diplôme le plus élevé | Chaîne de caractères |
| specialite | Spécialité académique | Chaîne de caractères |
| updated_at | Date de dernière mise à jour | Horodatage |

**DIRECTION** (table `directions`, 3 champs) :

| Nom | Désignation | Type |
| --- | --- | --- |
| id | Identifiant (clé primaire) | Entier |
| nom | Nom de la direction, unique | Chaîne de caractères |
| responsable_personnel_id | Responsable désigné de la direction | Entier |

**SERVICE** (table `services`, 4 champs) :

| Nom | Désignation | Type |
| --- | --- | --- |
| id | Identifiant (clé primaire) | Entier |
| nom | Nom du service | Chaîne de caractères |
| direction_id | Direction de rattachement | Entier |
| responsable_personnel_id | Responsable désigné du service | Entier |

**ÉTABLISSEMENT** (table `etablissements`, 4 champs) :

| Nom | Désignation | Type |
| --- | --- | --- |
| id | Identifiant (clé primaire) | Entier |
| nom | Nom de l'établissement | Chaîne de caractères |
| statut | Actif ou inactif | Chaîne de caractères |
| created_at | Date de création | Horodatage |

**COMPTE** (table `users`, 7 champs) :

| Nom | Désignation | Type |
| --- | --- | --- |
| id | Identifiant du compte (clé primaire) | Entier |
| email | Identifiant de connexion | Chaîne de caractères |
| password_hash | Mot de passe haché (bcrypt, jamais stocké en clair) | Chaîne de caractères |
| role | Rôle d'accès système (Superadmin, Admin RH, PE, PAT, Secrétaire PE, Secrétaire PAT) | Chaîne de caractères |
| status | État du compte (en attente / actif / inactif) | Chaîne de caractères |
| created_at | Date de création du compte | Horodatage |
| personnel_id | Fiche personnel liée (vide pour un compte purement administratif) | Entier |

**CONGÉ** (table `conges`, 24 champs) :

| Nom | Désignation | Type |
| --- | --- | --- |
| id | Identifiant de la demande (clé primaire) | Entier |
| user_id | Demandeur | Entier |
| type_conge | Nature du congé (annuel, permission, maladie, maternité, paternité, formation...) | Chaîne de caractères |
| date_debut | Début de la période demandée | Date |
| date_fin | Fin de la période demandée | Date |
| motif | Motif de la demande | Texte long |
| status | Décision finale (en attente / approuvée / refusée) | Chaîne de caractères |
| reviewed_by | Compte ayant pris la décision finale | Entier |
| reviewed_at | Date de la décision finale | Horodatage |
| created_at | Date de dépôt de la demande | Horodatage |
| avis_chef_service | Avis motivé du chef de service | Texte long |
| lieu_jouissance | Lieu où le congé sera pris | Chaîne de caractères |
| date_reprise_service | Date de reprise prévue | Date |
| remplacant | Personne assurant l'intérim | Chaîne de caractères |
| validateur_id | Chef de service désigné comme validateur intermédiaire | Entier |
| decision_intermediaire | Avis du chef de service (non requis / en attente / approuvé / refusé) | Chaîne de caractères |
| decision_intermediaire_le | Date de l'avis intermédiaire | Horodatage |
| justificatif_filename | Nom du fichier justificatif joint | Chaîne de caractères |
| justificatif_path | Emplacement de stockage du justificatif | Chaîne de caractères |
| solde_avant | Solde de congé avant la demande | Numérique |
| solde_apres | Solde de congé après décision | Numérique |
| decision_secretariat | Vérification du secrétariat (en attente / approuvée / refusée) | Chaîne de caractères |
| decision_secretariat_le | Date de la vérification du secrétariat | Horodatage |
| avis_secretariat | Avis ou motif du secrétariat | Texte long |

**DEMANDE DE DOCUMENT** (table `demandes_documents`, 12 champs) :

| Nom | Désignation | Type |
| --- | --- | --- |
| id | Identifiant de la demande (clé primaire) | Entier |
| personnel_id | Demandeur | Entier |
| type_document | Type demandé (certificat administratif / lettre de confirmation / état de congé) | Chaîne de caractères |
| motif | Motif de la demande | Texte long |
| statut | État de traitement (en attente / traitée / refusée) | Chaîne de caractères |
| document_id | Document généré correspondant, une fois traité | Entier |
| traite_par | Compte RH ayant traité la demande | Entier |
| date_demande | Date de dépôt | Horodatage |
| date_traitement | Date de traitement final | Horodatage |
| decision_secretariat | Vérification du secrétariat | Chaîne de caractères |
| decision_secretariat_le | Date de la vérification | Horodatage |
| avis_secretariat | Avis ou motif du secrétariat | Texte long |

**CONTRAT** (table `contrats`, 18 champs) :

| Nom | Désignation | Type |
| --- | --- | --- |
| id | Identifiant du contrat (clé primaire) | Entier |
| personnel_id | Titulaire du contrat | Entier |
| type_contrat | CDI / CDD / Vacataire / Stagiaire | Chaîne de caractères |
| date_debut | Début du contrat | Date |
| date_fin | Fin du contrat | Date |
| numero_renouvellement | Numéro d'ordre du renouvellement | Entier |
| contrat_precedent_id | Contrat précédent, en cas de renouvellement | Entier |
| statut | actif / expiré / renouvelé / non renouvelé / résilié | Chaîne de caractères |
| decision | Décision prise à l'échéance (renouvellement renégocié / non-renouvellement) | Chaîne de caractères |
| motif_non_renouvellement | Motif obligatoire en cas de non-renouvellement | Texte long |
| reference_decision | Référence administrative de la décision | Chaîne de caractères |
| observations | Observations libres | Texte long |
| notifie_echeance_le | Date d'envoi de l'alerte d'échéance | Horodatage |
| created_by | Compte ayant créé le contrat | Entier |
| updated_by | Compte ayant modifié le contrat en dernier | Entier |
| created_at | Date de création | Horodatage |
| updated_at | Date de dernière modification | Horodatage |
| notifie_expiration_le | Date d'envoi de l'alerte d'expiration | Horodatage |

**SITUATION ADMINISTRATIVE** (table `situations_administratives`, 12 champs) :

| Nom | Désignation | Type |
| --- | --- | --- |
| id | Identifiant de la situation (clé primaire) | Entier |
| personnel_id | Personne concernée | Entier |
| type_situation_id | Type de situation (détachement, disponibilité, stage...) | Entier |
| date_debut | Début de la situation | Date |
| date_fin | Fin de la situation | Date |
| reference_decision | Référence administrative | Chaîne de caractères |
| document_filename | Nom du justificatif joint | Chaîne de caractères |
| document_path | Emplacement de stockage du justificatif | Chaîne de caractères |
| observations | Observations libres | Texte long |
| created_by | Compte ayant enregistré la situation | Entier |
| created_at | Date d'enregistrement | Horodatage |
| motif | Motif de la situation | Texte long |

**RÔLE_MÉTIER** (abstraction conceptuelle de la valeur `personnel_roles.role`, qui n'a pas de table de référence au niveau physique — un simple `CHECK (role IN ('PE','PAT'))` ; modélisée ici comme entité pour représenter proprement, au niveau conceptuel, qu'une personne peut cumuler plusieurs rôles) :

| Nom | Désignation | Type |
| --- | --- | --- |
| code | PE ou PAT (clé primaire) | Chaîne de caractères |
| libelle | Personnel Enseignant / Personnel Administratif et Technique | Chaîne de caractères |

**Identification des entités** (à rédiger comme la liste à puces du modèle) : Personnel, Rôle métier, Compte utilisateur, Congé, Demande de document, Contrat, Situation administrative, Direction, Service, Établissement.

**Définition des relations** (ce sont exactement les 9 relations dessinées dans le MCD du § IV.3) :
- Un Personnel *exerce* zéro, un ou deux Rôles métier (PE et/ou PAT) — relation `EXERCE` (0,2)–(0,n), la différence structurante avec un système classique où une personne n'a qu'un seul rôle.
- Un Personnel *possède* zéro ou un Compte utilisateur — relation `POSSEDE` (0,1)–(0,1) : optionnelle des deux côtés (le personnel importé n'a pas forcément encore de compte ; un compte Admin RH/Superadmin n'a pas forcément de fiche personnel).
- Un Compte utilisateur *dépose* plusieurs Congés — relation `DEPOSE` (1,1)–(0,n).
- Un Personnel *demande* plusieurs Demandes de documents — relation `DEMANDE` (1,1)–(0,n).
- Un Personnel *signe* plusieurs Contrats — relation `SIGNE` (1,1)–(0,n).
- Un Personnel *connaît* plusieurs Situations administratives — relation `CONNAIT` (1,1)–(0,n).
- Un Personnel *est affecté à* zéro ou un Service — relation `AFFECTE` (0,1)–(0,n) ; un Service *appartient à* une Direction — relation `APPARTIENT_A` (1,1)–(0,n).
- Un Personnel (s'il est PE) *est affecté à* zéro ou un Établissement — relation `AFFECTE_A` (0,1)–(0,n).
- Un Congé *peut avoir* un Validateur (chef de service, déterminé automatiquement selon l'organigramme) — relation existante, non représentée sur le MCD simplifié pour ne pas le surcharger, à mentionner en texte.

**Schéma déjà prêt** : le MCD correspondant à ce dictionnaire est publié ici, avec cardinalités et notation Merise : https://claude.ai/artifact/2Xqyva7uKeq2qwGWf8UQjJ — capture d'écran à insérer directement au § IV.3 ci-dessous.

---

### IV.3. La création du modèle conceptuel de données (MCD)

**Ce qu'attend la structure modèle** : définition, puis schéma.

**Matière réelle** : le schéma physique complet existe déjà et sert de référence exacte (`server/database/schema.sql`, `server/database/MCD.md`). Voici un MCD simplifié centré sur le cœur métier, à redessiner proprement avec un outil de modélisation (Looping, draw.io, MySQL Workbench...) pour ton mémoire — je te donne la structure exacte à reproduire, pas une image :

```
PERSONNEL (id, matricule, nom, prenom, email, fonction, corps, service, direction, solde_conges...)
  │
  ├──< PERSONNEL_ROLES (personnel_id, role) — 0 à 2 lignes par personne (PE et/ou PAT)
  ├──< PERSONNEL_PE_INFOS (personnel_id, etablissement_id, corps_pe, diplome, specialite) — si rôle PE
  ├──1,1 USERS (id, email, password_hash, role, status, personnel_id) — 0 ou 1 compte
  ├──< CONTRATS (id, personnel_id, type_contrat, date_debut, date_fin, statut...)
  ├──< SITUATIONS_ADMINISTRATIVES (id, personnel_id, type_situation_id, date_debut, date_fin...)
  ├──< CARRIERE_EVENEMENTS (id, personnel_id, type_evenement, date_evenement...)
  └──< DEMANDES_DOCUMENTS (id, personnel_id, type_document, statut, decision_secretariat...)

USERS (id, email, role, personnel_id)
  └──< CONGES (id, user_id, type_conge, date_debut, date_fin, status, decision_secretariat,
               decision_intermediaire, validateur_id, solde_avant, solde_apres...)
        └──1,1 CONGES_IMPUTATIONS (conge_id, annee, jours) — répartition des jours sur les années de droit

ETABLISSEMENTS (id, nom, statut)
  └──< PERSONNEL_PE_INFOS (etablissement_id)

DIRECTIONS (id, nom, responsable_personnel_id)
  └──< SERVICES (id, nom, direction_id, responsable_personnel_id)

PERMISSIONS (id, key, label, category)
  └──< ROLE_PERMISSIONS (role, permission_id, enabled) — quelle permission pour quel rôle
```

**Cardinalités à faire apparaître sur ton schéma** (comme le `Avoir` du modèle) : la relation PERSONNEL–PERSONNEL_ROLES est **(0,2) — (1,1)** : c'est la particularité à mettre en avant dans ta soutenance, puisqu'elle permet à une même personne d'être PE et PAT simultanément — c'est un choix de conception explicitement demandé et justifié (voir § VII, avantages).

---

### IV.4. La transition vers le modèle logique et physique de données (MLD/MPD)

**Ce qu'attend la structure modèle** : traduction du MCD en tables avec clés primaires/étrangères.

**Matière réelle** : contrairement au modèle où le MPD est présenté comme une simple copie du MCD, le SGRH a un vrai MLD/MPD versionné et exécutable : `server/database/schema.sql` (déclaration complète des 36 tables) et **19 migrations SQL numérotées et idempotentes** (`server/migrations/001_...sql` à `019_...sql`), qui documentent l'évolution du schéma dans le temps — un bon argument pour ton mémoire : la base n'a jamais été modifiée « à la main », chaque changement de structure est un fichier SQL versionné, relisable, ré-exécutable sur une base vierge. C'est une pratique professionnelle réelle (à comparer, dans ta partie discussion, à une approche sans migrations où l'historique du schéma se perd).

Exemple de traduction MCD → MPD pour l'entité centrale (format identique à ton modèle, `Tableau X`) :

```sql
CREATE TABLE personnel (
  id           SERIAL PRIMARY KEY,
  matricule    VARCHAR(6) NOT NULL UNIQUE,
  nom          VARCHAR(100),
  prenom       VARCHAR(100),
  email        VARCHAR(150) NOT NULL UNIQUE,
  ...
  CONSTRAINT personnel_matricule_check CHECK (matricule ~ '^[0-9]{6}$')
);

CREATE TABLE personnel_roles (
  id           SERIAL PRIMARY KEY,
  personnel_id INTEGER NOT NULL REFERENCES personnel(id) ON DELETE CASCADE,
  role         VARCHAR(20) NOT NULL CHECK (role IN ('PE', 'PAT')),
  CONSTRAINT personnel_roles_unique UNIQUE (personnel_id, role)
);
```

Le mémoire modèle utilise SQL Server ; le SGRH utilise **PostgreSQL** — à justifier au § V.1 (gratuit, open-source, contraintes `CHECK` natives utilisées massivement dans le projet pour garantir l'intégrité des données au niveau de la base elle-même, pas seulement dans le code applicatif).

---

### IV.5. Choix de méthode de conception

**Ce qu'attend la structure modèle** : comparatif de deux méthodes (ex. MERISE vs Processus Unifié), justification du choix.

**⚠️ Point à rédiger avec honnêteté méthodologique** : le SGRH n'a pas été conçu en dessinant d'abord un MCD complet sur papier puis en codant. Il a été développé de façon **itérative et incrémentale** : chaque fonctionnalité (personnel, congés, contrats, secrétariat...) a été analysée, modélisée en base et implémentée en un cycle complet (analyse du besoin → migration SQL → API → interface → tests → vérification manuelle), avant de passer à la suivante — avec un assistant de développement basé sur l'IA (Claude Code, Anthropic) en pair-programming pour l'implémentation, sous la direction et la validation constante du développeur (toi) à chaque étape.

C'est en réalité **exactement la philosophie du Processus Unifié** que ton modèle décrit (cycle « Exigences → Analyse & conception → Implémentation → Tests → Déploiement », répété à chaque itération) — tu peux donc reprendre le même comparatif MERISE/UP que le modèle et conclure au choix de l'**UP/itératif**, avec un argument supplémentaire et vécu : contrairement à un cycle en cascade, cette méthode a permis d'intégrer des demandes d'évolution en cours de projet (ex. la séparation PE/PAT ou l'ajout du rôle Secrétaire sont arrivées après que le système de base existait déjà, et ont été intégrées sans casser l'existant — c'est un vrai avantage du développement itératif à documenter).

Sur le MCD/MLD présentés au § IV.3-IV.4 : ils sont une **reconstruction a posteriori**, fidèle à la base réelle — une pratique standard et légitime (beaucoup de projets réels documentent leur modèle après coup, une fois stabilisé, plutôt que de figer un schéma théorique jamais tenu à jour). Tu peux le dire simplement dans ton mémoire : *« Le modèle conceptuel présenté ci-dessus formalise a posteriori la structure de données telle qu'elle a été construite itérativement, afin d'en faciliter la lecture et la validation. »*

---

### IV.6. Les acteurs du système

**Choix de portée pour ce mémoire : seul le MCD (§ IV.3) est produit comme diagramme formel.** Pas de diagramme de cas d'utilisation ni de diagramme de séquence (ces deux-là relèvent du formalisme UML, hors périmètre retenu ici) — le comportement du système (qui fait quoi, dans quel ordre) est décrit par du texte structuré, comme ci-dessous et au § IV.1.

Contrairement au modèle (un seul acteur « Ressource Humaine »), le SGRH a **6 rôles**, ce qui est un point fort à valoriser : le système ne suppose pas un utilisateur unique mais modélise une vraie hiérarchie d'accès.

- **Superadmin** : administration système complète, gestion des rôles et permissions.
- **Admin RH** : gestion opérationnelle complète du personnel, congés, contrats, documents.
- **Personnel Enseignant (PE)** / **Personnel Administratif et Technique (PAT)** : libre-service (dossier, congés, documents).
- **Secrétaire PE / Secrétaire PAT** : vérifie les demandes de congé et de documents de sa catégorie avant transmission au RH (rôle promu depuis un compte PE/PAT existant).

Le circuit le plus riche à décrire en texte (bon candidat pour un paragraphe détaillé, voire un simple schéma-flèches non-UML dans ton traitement de texte) est celui de la **demande de congé** : dépôt par le personnel → vérification par le secrétariat de sa catégorie (transmet ou renvoie) → avis du chef de service si applicable → décision finale du RH → notification du demandeur, avec restitution des jours débités en cas de refus à n'importe quelle étape.

---

## CHAPITRE V : RÉALISATION DU SYSTÈME DE GESTION

### V.1. Présentation des outils techniques

**Ce qu'attend la structure modèle** : présentation de chaque outil, avantages/inconvénients, tableau comparatif avec des alternatives.

**Langage et environnement d'exécution — JavaScript / Node.js**

| Langage | Type | Utilisation | Caractéristiques |
| --- | --- | --- | --- |
| **JavaScript (Node.js)** | Interprété, dynamique | Développement web full-stack (client et serveur avec le même langage) | Écosystème npm immense ; асynchrone par nature (utile pour les requêtes réseau/BDD) ; pas de compilation |
| PHP | Interprété, dynamique | Développement web serveur uniquement | Très répandu dans l'hébergement mutualisé ; langage/écosystème serveur et client différents |
| Python (Django) | Interprété, dynamique | Développement web, data | Syntaxe simple ; écosystème web moins dominant que Node.js pour du REST pur |
| Java (Spring) | Compilé, typé statiquement | Applications d'entreprise | Très robuste et multiplateforme ; plus lourd à mettre en place pour un projet de cette taille |

*Avantages du choix JavaScript/Node.js pour le SGRH* : un seul langage pour le client (React) et le serveur (Express) — réduit la charge cognitive et permet de partager des conventions (validation, formats de date) ; très large communauté et documentation.
*Inconvénients* : typage dynamique (source d'erreurs seulement détectées à l'exécution, compensée ici par les tests automatisés et les contraintes `CHECK` en base) ; performance CPU inférieure à un langage compilé (non critique pour une application de gestion RH).

**Framework frontend — React 19 (avec Vite et Tailwind CSS v4)**
- **React** : bibliothèque de composants d'interface, approche déclarative (on décrit l'état voulu de l'écran, React se charge de la mise à jour du DOM).
- **Vite** : outil de build, remplace Webpack — démarrage et rechargement à chaud quasi instantanés en développement.
- **Tailwind CSS** : classes utilitaires (`bg-navy`, `rounded-lg`...) plutôt que des fichiers CSS séparés — cohérence visuelle et rapidité d'écriture, au prix d'un HTML plus verbeux.

**Framework backend — Express.js**
- Micro-framework HTTP minimaliste pour Node.js. Architecture en couches adoptée dans le projet : `routes` (déclaration des endpoints et permissions requises) → `controllers` (validation, réponses HTTP) → `services` (règles métier) → `repositories` (requêtes SQL). Ce découpage sépare clairement « ce qui parle HTTP » de « ce qui parle métier » et de « ce qui parle base de données ».

**Base de données — PostgreSQL**

| SGBD | Type | Caractéristiques |
| --- | --- | --- |
| **PostgreSQL** | Relationnel, open-source | Contraintes `CHECK`/clés étrangères strictes ; verrouillage transactionnel avancé (utilisé pour empêcher un solde de congé négatif en cas de double requête simultanée) ; gratuit |
| MySQL/MariaDB | Relationnel, open-source | Très répandu, un peu moins strict par défaut sur l'intégrité des données |
| SQL Server | Relationnel, propriétaire (Microsoft) | Très intégré à l'écosystème .NET (utilisé par le mémoire modèle) ; licence payante en production |
| MongoDB | NoSQL, orienté document | Adapté à des données peu structurées ; moins pertinent ici où les relations (personnel/congés/contrats) sont fortes et doivent rester cohérentes |

**Authentification et sécurité**
- **JWT (JSON Web Token)** : jeton signé, contient le rôle de l'utilisateur, vérifié à chaque requête par un middleware Express (`requireAuth`).
- **bcryptjs** : hachage des mots de passe (jamais stocké en clair), 10 tours de salage.
- **Système de permissions à deux niveaux** : vérifiées côté client (affichage du menu) *et* systématiquement revérifiées côté serveur (`requirePermission`) — le client ne peut jamais être la seule barrière de sécurité.

**Tests automatisés**
- Module natif `node:test` (aucune dépendance externe). 72 tests, principalement des tests d'intégration contre une vraie base PostgreSQL jetable (pas de mocks pour les règles métier critiques — un choix assumé après un incident où des tests avec base simulée avaient laissé passer un bug réel).

---

### V.2. La gestion de la base de données

Reprends la structure du modèle (« Gestion de serveur SQL ») en l'adaptant :
- Connexion via le module `pg` (client PostgreSQL pour Node.js), pool de connexions configuré dans `server/src/config/db.js`.
- Toutes les requêtes sont **paramétrées** (`$1, $2...`) — protection systématique contre l'injection SQL, à mentionner explicitement dans ton mémoire comme un choix de sécurité.
- Les migrations SQL (`server/migrations/`) sont numérotées, encapsulées dans une transaction (`BEGIN`/`COMMIT`), et idempotentes autant que possible — aucune n'est jamais exécutée automatiquement en production sans confirmation explicite (règle de sécurité du projet).

---

### V.3. La génération de documents (équivalent « gestion des rapports » du modèle)

Le SGRH génère des documents administratifs officiels plutôt que de simples rapports :
- **Certificat administratif**, **lettre de confirmation**, **état de congé**, **décision d'octroi de congé** — générés en PDF avec numérotation séquentielle unique par type et par année (verrou en base pour éviter les doublons en cas de génération simultanée).
- **QR code de vérification** : chaque décision de congé porte un QR encodant une adresse signée (HMAC-SHA256) qui permet de vérifier l'authenticité du document sans réintroduire de données personnelles dans le QR lui-même.

---

### V.4. Exploration des différentes interfaces du logiciel

**V.4.1. Identification des utilisateurs** — reprends le tableau des 6 rôles déjà détaillé au § IV.6.a, avec pour chacun les permissions précises (la liste complète des permissions, avec leur clé technique et leur intitulé, est dans `README.md` et directement visible dans l'écran « Rôles & permissions » du Superadmin — fais-en une capture, ce sera un bon visuel pour cette section).

**V.4.2. Choix de service** — structure du menu par rôle (à illustrer avec des captures de la barre latérale de chaque rôle) :
- **Admin RH** : Tableau de bord, Personnel (PE / PAT / Directions & services / Établissements), Carrière, Contrats, Congés, Documents, Utilisateurs & comptes, Audit.
- **Personnel (PE/PAT)** : Mon espace (tableau de bord, dossier, carrière, contrats, congés, documents), Aide.
- **Secrétaire (PE/PAT)** : même espace personnel + bloc « Secrétariat » (congés à vérifier, demandes de documents).
- **Superadmin** : menu Admin RH complet + bloc Super Administration (comptes, corbeille, permissions, personnalisation).

---

# TROISIÈME PARTIE : RÉSULTATS ET DISCUSSIONS

## CHAPITRE VI : PRÉSENTATION DES RÉSULTATS

**Ce qu'attend la structure modèle** : une capture d'écran commentée par fonctionnalité, dans l'ordre du parcours utilisateur.

**⚠️ À toi de faire** : je ne peux pas insérer d'images dans ce fichier, mais voici la liste précise des captures à prendre, dans un ordre qui reproduit celui du modèle (chargement → connexion → tableau de bord → modules), adapté au SGRH. Lance l'application (`npm run dev` dans `client/` et `server/`) et capture, avec un compte jetable pour chaque rôle si besoin :

1. **Page de connexion** (`/login`).
2. **Tableau de bord** — une capture par rôle si tu veux montrer la différenciation (Admin RH, Superadmin, PE, Secrétaire) : `/admin/dashboard`, `/superadmin/dashboard`, `/dashboard`.
3. **Gestion du personnel** : liste PE (`/admin/personnel/pe`) et liste PAT (`/admin/personnel`) — montre les filtres et la pagination ; la fiche détaillée d'une personne (« Voir la fiche ») ; le formulaire d'ajout avec les cases PE/PAT.
4. **Établissements** (`/admin/personnel/etablissements`) — spécificité du projet à valoriser.
5. **Congés** : formulaire de demande côté personnel (`/conges`) ; file de vérification secrétariat (`/secretariat/conges`) — capture avant et après transmission pour montrer visuellement le filtrage ; file de décision RH (`/admin/conges`).
6. **Demandes de documents** : demande côté personnel (`/mes-documents`) ; vérification secrétariat (`/secretariat/documents`) ; traitement RH (`/admin/demandes-documents`) ; document généré avec QR code.
7. **Contrats** (`/admin/contrats`).
8. **Gestion des comptes** (`/superadmin/comptes`) — montre en particulier le bouton « Désigner secrétaire », c'est une fonctionnalité originale par rapport au modèle.
9. **Rôles & permissions** (`/superadmin/permissions`) — la matrice complète, bon visuel pour démontrer la richesse du système de droits.
10. **Mode sombre** — une capture avant/après sur un même écran, pour montrer le soin apporté à l'accessibilité/ergonomie.

Pour chaque capture, rédige un court paragraphe explicatif dans le style du modèle (« L'interface de X permet à l'utilisateur de... Lorsque... le système... »).

---

## CHAPITRE VII : ANALYSE DES RÉSULTATS ET DISCUSSIONS

### VII.1. Les avantages du logiciel développé

Reprends la structure « Efficacité/Centralisation » du modèle, avec ce contenu réel :

- **Un rôle, une permission, un effet réel** : contrairement à un système où une permission accordée en base peut rester invisible dans l'interface (bug fréquent des systèmes de droits mal conçus), le SGRH garantit qu'une permission attribuée à un rôle — même de façon inhabituelle (ex. donner le droit de gérer les congés à un secrétaire) — produit immédiatement l'accès correspondant dans le menu.
- **Une personne, deux rôles possibles** : la modélisation `personnel_roles` permet à une même personne d'être à la fois enseignante et membre du personnel administratif, une réalité fréquente à l'université, que la plupart des systèmes RH génériques ne gèrent pas (ils forcent un rôle unique).
- **Traçabilité et réversibilité** : suppression de compte réversible (corbeille transactionnelle), journal d'audit complet, aucune migration de base appliquée sans confirmation explicite.
- **Circuit de validation fidèle à la pratique réelle** : le rôle Secrétaire reproduit fidèlement la fonction de secrétariat RH dans l'administration malgache (vérification des pièces avant transmission), plutôt qu'un simple circuit d'approbation générique à deux niveaux.
- **Sécurité par construction** : requêtes SQL systématiquement paramétrées, permissions vérifiées côté serveur indépendamment de l'interface, mots de passe jamais stockés en clair.

### VII.2. Les limites rencontrées durant le projet

Sois honnête ici — un jury valorise la lucidité plus qu'une façade sans défaut. Éléments réels, documentés au fil du projet :

- **Données d'import externes incomplètes** : les fiches enseignantes importées depuis une source externe (FOSIKA, plateforme publique du Ministère) ne contiennent ni e-mail ni téléphone réels — des valeurs *placeholder* explicites ont été utilisées, à compléter manuellement par le service RH.
- **Incohérences historiques de schéma** : `schema.sql` (le schéma de référence documentaire) contient un écart connu et documenté avec la base réellement utilisée (une table `roles` déclarée mais jamais appliquée) — signalé plutôt que corrigé silencieusement, pour ne pas casser l'existant sans une décision explicite.
- **Couverture inégale du mode sombre** : plusieurs pages avaient une couverture partielle du thème sombre, détectée par relecture systématique et corrigée au fil des sessions plutôt que dès la conception initiale.
- **Pas de couche d'abstraction (ORM)** : chaque requête SQL est écrite à la main — plus de contrôle, mais plus de code répétitif que l'utilisation d'un ORM (Prisma, Sequelize, Entity Framework côté C#).
- **Dépendance à un service externe pour les tests** : les tests d'intégration nécessitent une vraie instance PostgreSQL disponible — pas d'exécution possible hors ligne sans base de données locale configurée.

### VII.3. Les axes d'amélioration envisageables pour une future version

- Étendre la vérification secrétariat aux autres types de demandes (actuellement limitée aux congés et documents).
- Construire un vrai flux de création de compte pour les rôles purement administratifs (actuellement, Superadmin/Admin RH ne peuvent être créés que directement en base).
- Notifications par SMS (le format de téléphone standardisé a été préparé en amont pour cet usage futur).
- Compléter automatiquement les e-mails placeholder par un mécanisme d'invitation dédié plutôt qu'une saisie manuelle une par une.
- Étendre la couverture de tests automatisés aux parcours de bout en bout (actuellement centrée sur les règles métier critiques côté serveur).
- Découpage du code client en chunks (`code-splitting`) pour réduire la taille du bundle JavaScript initial, actuellement au-dessus du seuil recommandé.

---

## Annexe — ce qu'il te reste à trancher toi-même

- Portée exacte du mémoire (système complet ou sous-ensemble, § IV.1).
- Cadre institutionnel de la Première partie : présentation de l'Université de Mahajanga comme structure d'accueil (à la place d'AQUALMA dans le modèle) — historique, organigramme du service RH si tu y as eu accès.
- Dates réelles (stage, soutenance), noms du jury, promotion — informations administratives propres à ton dossier.
- Comment présenter la collaboration avec l'assistant IA dans ta méthodologie (§ IV.5) — à formuler selon les attentes de ton encadreur ; certaines écoles demandent une mention explicite, d'autres non.
