<p align="center">
  <img src="docs/images/logo-um-hr.png" alt="UM-HR" width="600">
</p>

<p align="center"><strong>Système de Gestion des Ressources Humaines</strong><br>Université de Mahajanga</p>

# SGRH — Système de Gestion des Ressources Humaines

Application web de gestion des ressources humaines de l'Université de Mahajanga. SGRH réunit une interface React et une API Express connectée à PostgreSQL.

> Cette documentation est fondée sur le code versionné. Le schéma des tables historiques (`personnel`, `users`, `conges`...) n'a pas de fichier `schema.sql` ni de seed dans le dépôt : leur documentation reste déduite des requêtes PostgreSQL réellement utilisées. Les tables ajoutées depuis (`contrats`, `documents_contrat`, `situations_administratives`, `types_situation_administrative`) sont en revanche définies par des migrations versionnées et documentées avec certitude.

## Architecture

```text
Navigateur → React 19 / Vite / Tailwind → API REST Express → services → repositories → PostgreSQL
```

| Dossier | Responsabilité |
| --- | --- |
| `client/src/pages` | Pages publiques, Admin RH, Superadmin et espace personnel. |
| `client/src/components` | `AppShell`, sidebar (tiroir mobile inclus), topbar, footer, `PageHeader` (fil d'Ariane), composants `settings/*`, modal personnel, calendrier et routes protégées. |
| `client/src/context` | Authentification, permissions, thème, préférences d'affichage (`SettingsPreferencesContext`) et textes personnalisables. |
| `client/src/services` | Appels `fetch` vers l'API `/api`. |
| `server/src/routes` | Routes HTTP et gardes d'accès. |
| `server/src/controllers` | Entrées HTTP, validations minimales et réponses. |
| `server/src/services` | Règles métier. |
| `server/src/repositories` | Requêtes PostgreSQL paramétrées. |
| `server/migrations` | Migrations SQL versionnées, numérotées et idempotentes (`001` à `005`). |

## Rôles et fonctionnalités

Les rôles confirmés dans le code sont `SUPERADMIN`, `ADMIN_RH`, `PE`, `PAT`, `SECRETAIRE_PE` et `SECRETAIRE_PAT`. Les permissions sont stockées en base, chargées dans `PermissionContext`, puis vérifiées une seconde fois par le middleware Express `requirePermission`.

| Rôle | Capacités confirmées |
| --- | --- |
| `SUPERADMIN` | Reçoit exactement le menu Admin RH, plus un bloc exclusif : gestion des comptes, désactivation/réactivation, corbeille, rôles & permissions, apparence du site. Sert aussi de repli anti-blocage pour la vérification secrétariat (voir ci-dessous) si aucun secrétaire n'a encore été désigné pour une catégorie. |
| `ADMIN_RH` | Tableau de bord, personnel scindé en **PE** (Personnel Enseignant) et **PAT** (Personnel Administratif et Technique) — une même fiche peut porter les deux rôles à la fois —, **établissements** (`manage_etablissements`, gestion par le Superadmin/RH avec désactivation plutôt que suppression physique), **directions & services** (`manage_organisation`), import/export Excel, invitations, comptes en attente, envoi de notifications, fonctions, carrière, situation administrative, **contrats**, congés, documents administratifs, demandes de documents et audit/journal. |
| `PE` / `PAT` | Tableau de bord, mon dossier (profil), carrière, **mes contrats**, congés & absences, mes documents, notifications, aide et paramètres. Le profil/les paramètres restent accessibles uniquement via le menu utilisateur de la TopBar, pas dans la sidebar. |
| `SECRETAIRE_PE` / `SECRETAIRE_PAT` | Même espace personnel que PE/PAT (la promotion, depuis Gestion des comptes, change uniquement `users.role` — pas la fiche personnel), plus un bloc « Secrétariat » : vérifie les demandes de congé et de documents de sa catégorie avant transmission au RH (jamais de décision finale, seulement un filtre avec renvoi motivé possible). |

Fonctionnalités effectivement implémentées : connexion JWT, changement/réinitialisation de mot de passe, OTP e-mail, inscription par matricule avec validation, fiches personnel, recherche/filtres/tri, import/export Excel, liens d'inscription, invitations, **congés (droits à 2,5 jours par mois de service, reliquat cumulé, suivi par année, soldes d'ouverture)**, **documents de congé (fiche de demande avec QR de vérification, décision d'octroi, état de congé)**, carrière, **situation administrative (avec motif, une seule situation ouverte à la fois — garantie par la base —, contrôle de chevauchement sur tout l'historique, modification, et suppression limitée à la situation en cours)**, **gestion complète des contrats** (import PDF, historique, renouvellement avec renégociation, non-renouvellement motivé, avenants, alerte d'échéance à 183 jours puis notification d'expiration), notifications ciblées **avec lien de navigation direct et « tout marquer comme lu »**, comptes, permissions, **suppression de compte réversible via une corbeille transactionnelle**, historique et personnalisation de textes/couleurs/préférences d'affichage.

## Installation locale

### Prérequis

- Node.js (la CI utilise Node 22) ;
- PostgreSQL ;
- SMTP compatible avec `server/src/config/mailer.js`.

Copiez les modèles sans versionner les fichiers réels :

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

| Fichier | Variables requises |
| --- | --- |
| `client/.env` | `VITE_API_URL` ; l'API locale par défaut est `http://localhost:4000/api`. |
| `server/.env` | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `JWT_SECRET`, `QR_SECRET` (clé de signature des QR de vérification, distincte de `JWT_SECRET` ; générer une valeur aléatoire de 32 octets), `PORT`, `FRONTEND_URL`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`. |

Sur une base existante, appliquez les migrations dans l'ordre (chacune est réexécutable sans risque) :

```bash
for f in server/migrations/*.sql; do psql -d "$DB_NAME" -f "$f"; done
```

```bash
cd client && npm ci && npm run dev
# dans un second terminal
cd server && npm ci && node src/app.js
```

Le client fournit aussi `npm run build`, `npm run preview` et `npm run lint`. Le backend n'a pas de script `start` défini ; son point d'entrée réel est `server/src/app.js` et son port par défaut est `4000`. Au démarrage, le serveur lance aussi une vérification périodique des échéances de contrat (`contratEcheanceJob`, toutes les 24h après un premier passage à 30 secondes).

## Frontend

Le client est une SPA React 19 créée avec Vite et Tailwind CSS 4. `client/src/App.jsx` centralise les routes. Les pages authentifiées sont contenues dans `AppShell` : sidebar, topbar, contenu et footer. Sur écran large, le shell occupe la hauteur de la fenêtre : la sidebar et la topbar restent visibles, tandis que seule la zone principale défile.

Sous le seuil `lg` (1024px), la sidebar devient un tiroir superposé fermé par défaut : un bouton hamburger apparaît dans la TopBar, un fond assombri couvre le contenu, et le tiroir se ferme au clic sur ce fond, à la touche `Échap` ou après un clic sur un lien de navigation. À partir de `lg`, le comportement redevient statique.

La navigation latérale affiche uniquement les entrées autorisées par rôle et permission, regroupées par thème (Personnel, Carrière, Documents, Utilisateurs & comptes...). Le Super Admin voit le menu Admin RH complet, prolongé par un groupe « Super Administration » exclusif — ce n'est pas une sidebar différente. **Les catégories de plusieurs entrées sont des accordéons** : un chevron à droite du titre les déplie ou les replie (bouton `aria-expanded`, animation de hauteur, touche Entrée/Espace, contenu replié `inert`) ; **une seule catégorie est ouverte à la fois** et, par défaut, seule celle de la page active l'est (les autres sont repliées, ce qui réduit fortement la hauteur du menu : par exemple 939 → 394 px pour un Super Admin). Naviguer rouvre la catégorie de la nouvelle page. Une entrée seule (ex. Tableau de bord, Contrats, Congés) reste un lien direct sans chevron. La visibilité par rôle et permission, l'ordre et les libellés des entrées sont inchangés (`menuConfig.js` n'est pas modifié). L'accès au compte est regroupé dans l'avatar de la TopBar : le menu affiche le nom (ou l'e-mail en repli), le rôle, les paramètres et la déconnexion. Pour les rôles `PE` et `PAT` disposant de `view_profil`, il inclut également le lien vers `/profil`. Le menu se ferme au clic extérieur, avec la touche `Escape` ou après le choix d'une action. La déconnexion réutilise `AuthContext.logout()`, qui supprime `rh_token` du `localStorage` et vide l'utilisateur courant ; aucune route ou API supplémentaire n'est impliquée.

Chaque page affiche un en-tête cohérent via le composant réutilisable `PageHeader` (fil d'Ariane + titre + sous-titre), et les listes/formulaires exploitent la largeur disponible (grilles à deux colonnes plutôt que des colonnes étroites centrées) plutôt que de laisser de l'espace vide sur les grands écrans.

| Zone | Pages principales |
| --- | --- |
| Publique | Connexion, inscription, OTP, mot de passe oublié et réinitialisation. |
| Admin RH | Tableau de bord, personnel, carrière (fonctions, paramètres carrière **+ grilles indiciaires**), **contrats**, congés & absences, documents (administratifs, demandes), utilisateurs & comptes (invitations, comptes en attente), envoyer une notification, audit & journal. |
| Superadmin | Gestion des comptes, corbeille, rôles & permissions, apparence. |
| Personnel | Tableau de bord, mon dossier, ma carrière, **mes contrats**, mes congés & absences, mes documents, mon équipe / validation équipe (chefs de service), aide. |

`AuthContext` enregistre le JWT sous `rh_token` dans `localStorage`, restaure la session via `GET /api/auth/me` et déconnecte l'utilisateur. `ThemeContext` mémorise le thème sous `rh_theme` (clair/sombre/système) et bascule la classe `dark` sur `<html>` ; `index.css` donne à `html`/`body` un fond et un texte de base adaptés à cette classe, pour qu'aucune zone ne reste claire par défaut en mode sombre avant qu'un composant ne prenne le relais avec ses propres classes `dark:`. `SettingsPreferencesContext` mémorise sous `rh_settings_prefs` les préférences d'affichage (densité, taille du texte, mode sidebar, animations, accessibilité, notifications app/e-mail, langue, préférences de tableaux et de documents) — entièrement côté client, aucune API dédiée. `TextContext` charge les textes personnalisables et enregistre leur valeur initiale si absente. `ProtectedRoute` bloque les visiteurs non authentifiés ; quand une route précise une permission, celle-ci est la seule autorité (le `allowedRoles` de la route est ignoré) — une permission accordée à un rôle inhabituel depuis Rôles & permissions rend donc réellement la page accessible à ce rôle, pas seulement l'API. `allowedRoles` ne reste un verrou dur que pour les routes sans permission associée (espace personnel en libre-service). `Sidebar.jsx` ajoute de même, uniquement pour PE/PAT, les entrées ADMIN_RH/SUPERADMIN rendues accessibles par une permission accordée hors de leur rôle (regroupées sous « Accès supplémentaires » si présentes, affichées seulement une fois les permissions chargées, jamais de façon optimiste). Dans l'autre sens, ADMIN_RH/SUPERADMIN ne gagnent jamais les pages personnelles en libre-service de PE/PAT (Mon dossier, Mes congés...) : ces pages lisent le dossier du compte connecté lui-même, qu'un compte ADMIN_RH/SUPERADMIN n'a pas, quelle que soit la permission accordée.

La page Personnel permet la recherche nom/prénom/matricule, les filtres par rôle, fonction, corps, service, direction, contrat et statut, ainsi que le tri, l'import et l'export Excel.

### Paramètres

La page `/parametres` regroupe cinq catégories filtrées par rôle et permission : **Compte** (profil et compte, sécurité, sessions), **Préférences** (apparence, notifications, langue & région, accessibilité), **Données** (préférences des tableaux, documents), **Administration** (redirections vers Personnel, Carrière, Utilisateurs, Rôles & permissions, Journal d'activité — pas de logique dupliquée, juste un raccourci), et **Système** (fonctionnalités, maintenance, réservés au Super Admin). Les préférences réellement fonctionnelles (thème, densité, notifications, tableaux, documents) sont persistées via `SettingsPreferencesContext` ; les éléments qui nécessiteraient une API dédiée (déconnecter les autres sessions, mode maintenance) sont présentés à l'état visuel, désactivés, sans fausse fonctionnalité.

### Dossier personnel

La route `/profil` (« Mon dossier » dans la navigation) présente le dossier de la personne connectée : une bannière d'identité (photo, statut, matricule/fonction/catégorie), puis deux grilles d'informations personnelles et administratives, puis le parcours professionnel. Les données proviennent de `GET /api/personnel/me` et `GET /api/carriere/me` ; toute donnée absente est affichée comme « Non renseigné ».

**Personnel scindé PE / PAT** : la sidebar « Personnel » propose désormais quatre entrées — **PE** (`/admin/personnel/pe`, nouveau tableau : nom, matricule, établissement, corps/catégorie, diplôme, spécialité, statut du compte), **PAT** (`/admin/personnel`, tableau existant inchangé — recherche, filtres, import/export Excel, carte de résumé), **Directions & services** (`manage_organisation`) et **Établissements** (`/admin/personnel/etablissements`, `manage_etablissements` : liste, création, activer/désactiver — jamais de suppression physique, pour préserver l'historique des PE qui y sont/étaient rattachés). Une même fiche peut porter les deux rôles PE et PAT à la fois (`personnel_roles`, migration `018`) : elle apparaît alors sur les deux tableaux, et sa fiche affiche un badge « Catégorie » combiné (ex. « PAT + PE ») plutôt qu'un rôle unique. Le tableau PE est peuplé de 199 enseignants réels de l'Université de Mahajanga, récupérés depuis l'API publique de FOSIKA (`fosika.mesupres.mg`) — email et téléphone n'y sont pas fournis, remplacés par un placeholder explicite (`pe.<matricule>@a-completer.local`, `+261 00 00 000 00`) à compléter par la RH via « Modifier la fiche ». Le champ **prénom** est désormais optionnel (nom obligatoire) : une partie du personnel malgache n'a légitimement qu'un seul nom.

**Sélection du personnel par recherche** (`client/src/components/PersonnelSearchSelect.jsx`) : sur Carrière, Fonctions, Contrats et Documents administratifs, le `<select>` qui obligeait à faire défiler tout l'effectif pour trouver quelqu'un est remplacé par un champ de recherche (nom, prénom ou matricule) avec liste déroulante filtrée, navigable au clavier (flèches, Entrée, Échap) et accessible (`role="combobox"`/`listbox`, `aria-activedescendant`). `GET /api/users` renvoie désormais aussi `matricule`, `nom`, `prenom` (additif, nécessaire pour que Fonctions — qui liste des comptes, pas des fiches personnel — soit cherchable de la même façon). Demandes de documents garde une liste de cartes (pas une sélection) mais gagne le même filtre par nom/matricule au-dessus de la grille. Ces cinq pages ne sont plus limitées en largeur (`max-w-*` retiré) : elles utilisent l'espace jusqu'au plafond de `AppShell` (1600px) ; les autres pages admin gardent leur largeur actuelle, volontairement inchangée (dossier/formulaire de type « lecture » ou action ponctuelle, où une colonne plus étroite reste plus lisible).

**Vue RH « Voir la fiche »** (`/admin/personnel/:id/fiche`, ADMIN_RH et SUPERADMIN, permission `view_personnel`) : dans la liste du personnel, la ligne dépliée propose « Voir la fiche » (à la place de « Modifier la fiche », qui est désormais un bouton de la page de la fiche, avec les mêmes fonctionnalités : `ModifierEmployeModal`, permission `create_personnel`). La page est en lecture seule et affiche les **mêmes blocs que « Mon dossier »** (composants partagés `client/src/components/dossier/DossierBlocs.jsx`) : informations, état de carrière, congé restant, durée de contrat restante, parcours, plus le statut du compte (actif, en attente, inactif, sans compte). Elle s'appuie sur `GET /api/personnel/:id` (nouvelle route de lecture, `view_personnel`, 400/404 JSON) et sur les routes RH existantes ; `GET /api/conges/suivi/:personnelId` renvoie désormais aussi le solde disponible, les droits de l'année, le reliquat et les jours posés, calculés par le même code que `GET /api/conges/solde` : la RH et la personne voient exactement les mêmes chiffres.

**Synthèse du dossier** : sous les informations personnelles et administratives (direction et service inclus), trois cartes reprennent, sans nouvelle route, les endpoints `/me` existants — **État de carrière** (statut EFA/ELD/Fonctionnaire, catégorie professionnelle, grade, classe et échelon, indice tel que « 950-FOP », situation administrative actuelle, dernière évolution), **Congés** (congé annuel restant, droits de l'année, reliquat et jours posés, calculés par le backend via `GET /api/conges/solde`) et **Contrat** (contrat actif avec renouvellements, **durée restante** en mois et jours, barre de progression, badge « échéance dans moins de 6 mois » au seuil de 183 jours utilisé par le backend ; à défaut de contrat enregistré, les champs historiques de la fiche sont utilisés). Chaque carte dégrade proprement (« non disponible », « aucun contrat enregistré »). Les règles partagées avec le tableau de bord sont dans `client/src/utils/dossier.js`. Les dates renvoyées par l'API (ISO UTC d'un jour local, par exemple `1990-03-04T21:00:00.000Z` pour le 05/03/1990) y sont lues avec les getters locaux : la page les affichait avec un jour de retard et le formulaire de modification préremplissait la veille, ce qui décalait la date à chaque enregistrement.

La personne peut remplacer sa photo depuis ce dossier. L'image est prévisualisée avant confirmation, puis envoyée à `PATCH /api/personnel/me/photo`. Le serveur n'accepte que les signatures binaires JPEG, PNG ou WebP, dans une limite de 3 Mo ; il génère un nom non prédictible et ne persiste en base que le chemin relatif du fichier. Les fichiers sont stockés localement dans `server/uploads/profile-photos/` (ignoré par Git) et servis sous `/uploads`.

### Contrats

Deux pages distinctes, séparées de la carrière : `/mes-contrats` (personnel, lecture seule) et `/admin/contrats` (RH, gestion complète — import, décision, renouvellement, avenants). La page RH accepte un paramètre `?personnel=<id>` pour présélectionner un employé, utilisé par les liens de notification d'échéance. Les PDF de contrat sont stockés hors de `express.static`, dans `server/private-uploads/contrats/` (ignoré par Git, à ajouter explicitement si absent), sous un nom UUID non prédictible ; leur téléchargement passe par une route authentifiée qui vérifie que le demandeur est le propriétaire du contrat ou un `ADMIN_RH`.

### Identité visuelle

Le logo de l'Université de Mahajanga (`client/public/logo-univ-mahajanga.png`) apparaît dans l'en-tête de la sidebar et sur la page de connexion, sur une pastille blanche (le fichier a un fond blanc, le bleu se lirait mal sur le fond navy). L'icône de l'onglet est `favicon.png` (et `apple-touch-icon.png`), le titre de l'onglet est « SGRH ».

La page de connexion (`Login.jsx`) a son propre habillage : une carte flottante avec un panneau dégradé violet/bleu à gauche (couleurs propres à cette page, pas les variables `--color-navy`/`--color-gold` globales) et un formulaire blanc épuré à droite ; purement visuel, aucune logique d'authentification modifiée.

### Personnalisation (Superadmin)

`/superadmin/apparence` (« Personnalisation » dans la navigation, `manage_site_texts`/`manage_site_settings`, réservé au SUPERADMIN) réorganise l'ancienne page Couleurs/Textes en trois onglets, sans nouvelle table :

- **Apparence** : logo principal, favicon et logo de connexion optionnel (upload image, `POST /api/site-settings/{logo,favicon,logo-connexion}`, chemin stocké dans `site_settings`) ; couleurs existantes (le projet n'a que 2 variables CSS d'accent — `--color-navy` et `--color-gold`, utilisées respectivement comme couleur principale/boutons et couleur secondaire/élément actif de la sidebar, pas 4 couleurs indépendantes) ; mode clair/sombre signalé comme déjà disponible **par utilisateur** (pas une bascule globale). `client/src/context/SiteSettingsContext.jsx` applique couleurs et favicon à chaque démarrage de l'application (avant cette page, un changement de couleur n'était appliqué qu'en mémoire, sur l'onglet où il avait été fait, et se perdait au rechargement).
- **Contenu** : formulaires dédiés pour la page de connexion (titre, sous-titre, message d'accueil), le pied de page (`Footer.jsx`, auparavant codé en dur), les messages système à la connexion (compte en attente / compte désactivé — un message serveur distinct pour chaque cas, `authService.js`) et six libellés de menu fixes (Tableau de bord, Personnel, Carrière, Congés, Documents, Paramètres), appliqués au rendu dans `Sidebar.jsx`/`TopBar.jsx` sans toucher à `menuConfig.js` : le Superadmin ne peut ni créer ni déplacer une entrée de menu. La liste générique de tous les textes personnalisables reste disponible, repliée, pour les textes hors de cette liste. Mode maintenance non implémenté dans l'application, signalé comme tel plutôt qu'ajouté.
- **Informations institutionnelles** : nom, nom court, adresse, téléphone, email, site officiel — vides par défaut (sauf le nom de l'université, déjà utilisé ailleurs), pour ne rien présenter comme confirmé sans l'être.
- **Aide (personnel)** : contenu des 3 pages d'aide du personnel (« Par où commencer », « Vos droits », « Les procédures » — voir ci-dessous), en `textarea`, texte affiché tel quel (`whitespace-pre-line`).

Tous ces champs utilisent `site_texts` via `useText` (même mécanisme d'auto-enregistrement que le reste de l'application) ; seul changement de schéma : `site_settings.value` élargi de `VARCHAR(20)` à `VARCHAR(255)` (migration `016`) pour accueillir un chemin de fichier, pas seulement une couleur hexadécimale.

### Aide et réclamations (personnel)

Le groupe « Aide » du menu personnel (PE/PAT) a 4 pages : les 3 pages de documentation (`/aide/commencer`, `/aide/droits`, `/aide/procedures`, contenu personnalisable ci-dessus) et `/aide/signaler` (permission `signaler_probleme`), où l'agent décrit un problème (sujet + description) adressé au Superadmin. `POST /api/reclamations` enregistre la réclamation (table `reclamations`, migration `017` — distincte de `notifications` : ici l'auteur décrit un problème et attend une réponse, avec un statut `ouverte`/`traitee`, ce que `notifications` ne modélise pas) et notifie tous les comptes SUPERADMIN via le mécanisme de notification existant (`target: {type: 'role', role: 'SUPERADMIN'}`). Le Superadmin gère les réclamations sur `/superadmin/reclamations` (permission `manage_reclamations`, **non héritée par ADMIN_RH** contrairement à la plupart des permissions Superadmin) : réponse obligatoire pour marquer une réclamation traitée.

`Footer.jsx` (partagé par toutes les pages via `AppShell`) affiche un pied de page enrichi uniquement pour PE/PAT (détecté via `useAuth()`, rien à passer en prop) : informations institutionnelles déjà saisies par le Superadmin (n'affiche que les champs réellement renseignés) et raccourcis vers les 4 pages Aide ci-dessus. Pour ADMIN_RH/SUPERADMIN et les pages publiques, le pied de page reste le copyright seul, inchangé.

### Grilles indiciaires (frontend)

Sur `/admin/carriere`, quand l'employé sélectionné a `corps = 'Fonctionnaire'`, le formulaire d'événement remplace les champs libres classe/échelon/indice par `GrilleIndiciaireSelector` (`client/src/components/GrilleIndiciaireSelector.jsx`) : sélection classe/échelon/catégorie, résolution automatique de l'indice via `GET /api/indiciaire/resolve`, source réglementaire affichée. Si aucune ligne ne correspond, un bandeau « à confirmer » réactive une saisie manuelle — jamais bloquant. Ce même composant est réutilisé dans `ModifierEmployeModal.jsx`. Un bloc « Alertes avancement » liste les échéances d'échelon ouvertes pour l'employé sélectionné, avec un traitement en un clic. La page « Paramètres carrière » gagne un onglet « Grilles indiciaires » (lecture des grilles/lignes existantes + ajout RH d'une ligne, source obligatoire) — pas de nouvelle entrée de sidebar, elle reste dans le groupe « Carrière » existant. `MaCarriere.jsx`/`Profil.jsx` affichent l'indice au format `950-FOP` (générique, jamais `FOP` en dur) avec sa source quand disponible.

## Backend et sécurité

L'API Express est montée sous `/api`, active CORS et le JSON, puis répond `404` aux routes absentes. La chaîne interne est : **route → controller → service → repository → PostgreSQL**.

1. `POST /api/auth/login` compare le mot de passe avec `bcryptjs`.
2. Le serveur signe un JWT (identifiant et rôle) valable huit heures.
3. Le client le transmet avec `Authorization: Bearer <token>`.
4. `requireAuth` vérifie le jeton, recharge l'utilisateur et rejette tout compte désactivé (`401 Compte inactif`), même avec un jeton encore valide.
5. `requireRole` ou `requirePermission` applique l'autorisation demandée.

Protections transverses : `helmet` (en-têtes de sécurité, `Cross-Origin-Resource-Policy: cross-origin` pour que le frontend séparé charge les images), CORS restreint à `FRONTEND_URL`/`CORS_ORIGINS`, corps JSON limité à 2 Mo, en-tête `X-Powered-By` désactivé, et un middleware d'erreur global qui ne renvoie jamais de trace de pile. Limitation de débit en mémoire (`rateLimit.js`, par IP) sur la vérification des QR d'avis, le mot de passe oublié, la réinitialisation, les codes OTP, l'inscription et la soumission d'invitation. Le blocage de connexion est **par compte** et ne concerne que les rôles PE, PAT, SECRETAIRE_PE et SECRETAIRE_PAT : après 10 échecs, le compte est verrouillé 30 minutes et tous les Superadmin reçoivent une notification. Les rôles ADMIN_RH et SUPERADMIN ne sont jamais verrouillés. Le compteur est en mémoire et repart à zéro au redémarrage du serveur. Les repositories emploient des requêtes paramétrées PostgreSQL. Les services portent les règles métier, notamment la validité des dates de congé, les fonctions admises pour PE/PAT, les statuts de compte et les notifications associées.

La suppression d'un compte (`DELETE /api/account-admin/:id`) est transactionnelle et réversible : `corbeilleRepository.archiveAndDeleteCompte` capture le compte et tout ce qui lui appartient substantiellement (congés, historique de fonction, notifications reçues) dans la corbeille avant de le supprimer ; `restoreCompte` recrée ces lignes avec leurs identifiants d'origine. Les autres tables qui ne font que référencer l'utilisateur comme auteur d'une action (`activity_log`, `carriere_evenements`, `documents_generes`...) passent à `NULL` automatiquement grâce aux contraintes `ON DELETE` posées par la migration `002` et restent intactes.

## Flux métier

### Recherche de personnel

```text
Admin RH → page Personnel → personnelApi.listPersonnel()
→ GET /api/personnel (Bearer JWT)
→ requireAuth + view_personnel
→ controller/service/repository
→ SELECT personnel LEFT JOIN users
→ { personnel: [...] } → recherche, filtres et tri dans React
```

La réponse fournit notamment `a_un_compte`, qui indique si une fiche est reliée à un utilisateur.

### Demande de congé

```text
Personnel → formulaire → POST /api/conges  (permission create_conge)
→ une transaction verrouille la fiche : recharge des droits manquants, contrôles, création, débit
→ vérification secrétariat : POST /api/conges/:id/review-secretariat (permission review_conges_secretariat)
  — SECRETAIRE_PE/SECRETAIRE_PAT de la catégorie du demandeur, ADMIN_RH/SUPERADMIN en repli
  — filtre uniquement (pièces, cohérence) ; refus = fin de la demande, jamais vue par le RH
→ validateur = chef de service (même service) ou responsable de direction, sinon les Admin RH sont notifiés
→ avis intermédiaire : POST /api/conges/:id/review-intermediaire (validateur assigné uniquement)
→ décision finale : POST /api/conges/:id/review (permission view_conges_admin)
→ refus : restitution unique des jours ; notification au demandeur + activity_log
```

Le détail d'une demande est accessible à son propriétaire, à son validateur assigné, aux `ADMIN_RH`/`SUPERADMIN` et au secrétariat de sa catégorie. Chaque changement de statut est conditionnel (« en attente » uniquement) : rejouer ou doubler une décision ne peut pas restituer les jours deux fois.

**Vérification secrétariat** (`decision_secretariat`, colonne séparée de `decision_intermediaire`/`avis_chef_service`) : étape ajoutée avant le circuit ci-dessus, sans le modifier — la notification du validateur/RH, envoyée à la création avant cette fonctionnalité, ne part désormais qu'une fois le secrétariat satisfait. Même principe pour les demandes de documents (`GET /api/documents/demandes/en-attente-secretariat`, `POST /api/documents/demandes/:id/review-secretariat`) : la file RH (`GET /api/documents/demandes/en-attente`) exclut ce qui n'est pas encore vérifié. Un compte Secrétaire est un compte PE/PAT existant **promu** (`PATCH /api/account-admin/:id/role`, réversible, transitions strictement `PE⇄SECRETAIRE_PE`/`PAT⇄SECRETAIRE_PAT`) — sa fiche personnel ne change jamais.

### Droits à congé

Base juridique vérifiée : **2,5 jours par mois de service effectif**, congé cumulable — Loi n°2003-011 art. 64 (fonctionnaires) et Loi n°2003-044 art. 86 (Code du travail, agents non encadrés). Le régime détaillé des fonctionnaires relève d'un décret (art. 66) non localisé.

- **Acquisition** (`congeDroitsService`, source de vérité) : mois calendaires **complets** seulement (recruté le 1er du mois, ce mois compte ; sinon le mois suivant), 30 jours pour une année complète. Toutes les années non créditées sont récupérées ; un reliquat n'est jamais supprimé. La recharge est atomique et idempotente (verrou sur la fiche).
- **Sans date de recrutement** : aucun droit calculé, le solde actuel reste le solde d'ouverture.
- **Solde** : `personnel.solde_conges` (`numeric(6,1)`, `DEFAULT 0`) = reliquat + droits acquis − congés annuels posés. Seul le **congé annuel** consomme le solde ; permission, autorisation d'absence, maternité, paternité, maladie, formation et autres ne le modifient pas. Le débit est atomique et ne peut jamais rendre le solde négatif.
- **Règles de prise** (`congeUtilisationService`, séparées de l'acquisition) : 15 jours minimum pour la première demande de congé annuel de l'année, congé de paternité limité à 15 jours, justificatif requis pour maladie et maternité. Leur base juridique par régime n'est pas confirmée pour les fonctionnaires.
- **Non appliqués, à traiter ultérieurement** : délai de 12 mois avant jouissance et prescription de 3 ans (Code du travail art. 86 et 88), plafond de cumul des fonctionnaires, congé annuel cumulé (permission de 20 jours, Statut art. 64).
- **Suivi par année** : `conges_droits_annuels` (un droit par année), `conges_imputations` (jours imputés du plus ancien au plus récent ; année `NULL` = solde d'ouverture non ventilé), `conges_historiques` (congés d'avant le SGRH). `GET /api/conges/solde` renvoie solde disponible, droits de l'année, reliquat et jours posés, calculés côté serveur.
- **Soldes d'ouverture** : saisis par la RH année par année depuis les états de congé officiels (écran « Soldes d'ouverture » de la page Congés). Un solde historique non ventilé n'est remplacé que sur confirmation explicite et la modification est journalisée.

### Documents de congé

- **Fiche de demande imprimable** (`/demandes/:id/fiche`) : identité, service réel, corps (catégorie professionnelle) et statut, nombre de jours, bloc « Service du Personnel » rempli automatiquement (droit avant, jours demandés, reste, années imputées, figés à la date de la demande) et avis du chef de service : **QR code** si favorable, **motif du refus** sinon.
- **QR de vérification** : l'adresse encodée contient un identifiant signé (HMAC-SHA256, clé `QR_SECRET`) ; `GET /api/verification/avis/:token` est **publique**, limitée à 30 requêtes par 10 minutes et par IP, ne renvoie que des données minimales (numéro, initiale + nom, type, période, validateur, date de l'avis) et relit la base à chaque appel : un avis modifié ensuite n'est plus confirmé. **Sans `QR_SECRET`**, l'application continue de fonctionner : la fiche affiche l'avis favorable en texte (sans QR), la route de vérification répond `503` avec un message explicite et le serveur écrit un avertissement au démarrage.
- **Décision portant octroi d'une fraction de congé** (`decision_conge`) : établie par la RH depuis un congé annuel approuvé ou un congé historique ; numéro `N°…/année/UMG/PR/DAAF/PERS` ; nombre de jours en lettres ; positions ancienne/nouvelle (l'ancienne vient de l'avant-dernier événement de carrière ; catégorie et chapitre ne sont pas historisés) ; une seule décision par congé.
- **État de congé** (`etat_conge`) : une ligne par année (droit, dates, pris, restant), solde d'ouverture non ventilé, total en chiffres et en lettres égal au solde ; peut être demandé par l'agent comme un certificat.

### Inscription par matricule

```text
Fiche personnel → lien d'inscription → POST /api/register
→ contrôle e-mail/matricule et mot de passe → users.status = pending
→ notification des Admin RH → approbation ou refus
```

Le rôle d'accès créé (`users.role`) vient de `personnel.secretariat_role` s'il est renseigné, sinon de `personnel.role` (PE ou PAT). L'Admin RH désigne ce secrétariat au moment de l'ajout de l'employé (« Secrétariat » : Aucun, Secrétaire PE, Secrétaire PAT), uniquement pour un agent PAT ; un PE n'est jamais secrétaire. La fiche garde sa catégorie PE/PAT métier.

Une voie distincte d'invitation par jeton existe également : invitation, formulaire, confirmation ou refus par l'Admin RH.

### Cycle de vie d'un contrat

```text
Admin RH → import initial (PDF + type/dates) → POST /api/contrats/personnel/:personnelId
→ contrat "actif", numero_renouvellement = 0

183 jours avant date_fin → contratEcheanceJob.verifierEcheances()
→ notification au personnel + notification (rôle ADMIN_RH), notifie_echeance_le horodaté (anti-doublon)

Admin RH décide :
  "Renouveler (renégociation)"  → POST /:contratId/decision → statut inchangé, décision mémorisée
    → finalisation après signature → POST /personnel/:personnelId/:contratId/renouveler
    → nouveau contrat (numero_renouvellement + 1, contrat_precedent_id), ancien passe à "renouvele"
    → notification "Contrat renouvelé" au personnel
  "Ne pas renouveler" (motif obligatoire) → POST /:contratId/decision
    → statut "non_renouvele" → notification "Non-renouvellement de contrat" au personnel (motif réel, jamais inventé)

Si aucune décision n'est prise avant la date de fin → contratEcheanceJob.verifierExpirations()
→ notification "Contrat expiré" (personnel) + "Contrat expiré sans décision" (ADMIN_RH), notifie_expiration_le horodaté
```

Aucun contrat ni document n'est jamais supprimé par l'application. Les notifications liées à un contrat portent un champ `lien` (`/mes-contrats` ou `/admin/contrats?personnel=<id>`) qui permet à la cloche de notifications de rediriger directement vers la bonne page.

### Situation administrative

```text
Admin RH → nouvelle situation (type, date_debut, motif, référence, justificatif) → POST /api/situations-administratives/:personnelId
→ transaction avec verrou sur la fiche ; validation avant toute écriture (date AAAA-MM-JJ réelle, type existant) ; refus (409) si la date coïncide avec une autre situation ou en chevauche une
→ si une situation est déjà ouverte pour ce personnel, elle est fermée automatiquement (date_fin = veille de la nouvelle date_debut)
→ notification au personnel concerné, avec le libellé réel de la nouvelle situation
```

Une situation déjà close ne peut pas être supprimée (`DELETE /api/situations-administratives/:id` renvoie 400) — seule la situation actuelle (non close) peut l'être, et sa suppression rouvre automatiquement la situation qu'elle avait fermée (supprimer puis rouvrir, dans une transaction), pour préserver la continuité de la chronologie. L'index unique partiel `uniq_situation_ouverte_par_personnel` (migration `010`) garantit en base qu'un personnel n'a jamais deux situations ouvertes, même sous requêtes simultanées. Les erreurs sont des JSON explicites (400 validation, 404 introuvable, 409 conflit), jamais un message PostgreSQL brut.

## Grilles indiciaires et carrière

L'indice de traitement d'un fonctionnaire n'est jamais une valeur saisie librement : il est **déterminé** par `grilleIndiciaireService.resolveIndice()` (logique centralisée, jamais dupliquée) à partir d'une grille réglementaire et de la situation de l'agent (classe, échelon, catégorie/cadre/échelle, date d'effet). Cette règle ne s'applique qu'au régime `FONCTIONNAIRE` (déduit de `personnel.corps = 'Fonctionnaire'` — voir note terminologique ci-dessous) ; pour les agents non encadrés (`EFA`/`ELD`), aucune grille chiffrée n'a pu être vérifiée par une source officielle, donc aucune n'est codée en dur : leur indice reste en saisie libre (`indice_source = 'A_CONFIRMER'`).

La grille générale des fonctionnaires est chargée depuis le fichier de référence RH (migration 022) : catégories I à IX (deuxième classe, première classe, principalat, classe exceptionnelle, échelons 1 à 3, classe exceptionnelle 1 et 2) et deux échelons de la classe exceptionnelle pour la catégorie X. Les stagiaires (échelon 0) et les échelons 1 à 6 de la structure particulière de X ne sont pas chargés. Les EFA et ELD n'ont pas de grille : leur indice reste à saisir ou à confirmer.

### Sources réglementaires vérifiées

| Texte | Ce qu'il fixe |
| --- | --- |
| Loi n°2003-011 du 03/09/2003 (Statut Général des Fonctionnaires), Art.3/34/45-49 | Corps → 4 cadres (A/B/C/D), 2 à 4 échelles par cadre ; à cadre/échelle/classe/échelon égaux l'indice est identique dans tous les cadres ; avancement = échelon (automatique après 2 ans d'ancienneté) + classe (au mérite, tableau annuel après avis de la Commission Administrative Paritaire) ; 4 classes : classe exceptionnelle (2 échelons), principalat/1ère/2ème classe (3 échelons chacune). |
| Décret n°2005-134 du 15/03/2005 + Circulaire n°132/MFPTLS du 01/06/2005 | Mécanisme de **reclassement indiciaire étroit** (pas une règle générale) : réservé au fonctionnaire ayant 2 ans dans le 2e échelon de la classe exceptionnelle, proche de la retraite. Donne un tableau chiffré réel (catégories transitoires I à X) repris tel quel dans le seed de la migration `006`. |
| Décret n°97-009 du 16/01/1997 | Indices de traitement de la classe exceptionnelle (1er/2e échelon), régime transitoire par catégorie — seule donnée numérique intégralement vérifiée à ce jour. |
| Décret n°96-745 du 27/08/1996 | Structure cadre → échelle (A→A1/A2/A3, B→B1/B2, C→C1/C2, D→D1/D2/D3), antérieure à la loi 2003-011. |

**Point non résolu, documenté plutôt que deviné** : la Circulaire 132/2005 indique elle-même qu'en juin 2005 le décret de classement hiérarchique cadre/échelle et la grille indiciaire complète prévus par la loi 2003-011 n'étaient pas encore adoptés. Aucun texte postérieur confirmant cette transition n'a été localisé. En conséquence, seule la classe exceptionnelle (régime transitoire par catégorie I-X) est peuplée en base ; le principalat, la première classe et la deuxième classe restent des combinaisons valides *structurellement* (contrainte SQL) mais sans ligne d'indice tant qu'aucune source fiable ou confirmation RH n'est fournie. Le sigle « FOP » n'a été trouvé défini dans aucun texte officiel consulté et n'est jamais codé en dur : `lignes_grille_indiciaire.code_grille_affichage` reste un champ générique et optionnel.

**Note terminologique** : `personnel.corps` (`CHECK IN ('EFA','ELD','Fonctionnaire')`) sert dans ce projet de marqueur de *régime* (agent non encadré vs. fonctionnaire), et non de « corps » au sens réglementaire strict (ex. un corps précis d'enseignants-chercheurs). `lignes_grille_indiciaire.corps` est un champ distinct, réservé à un futur texte réellement corps-spécifique.

### Modèle de données

- **`grilles_indiciaires`** : une grille par régime/période de validité, avec sa source réglementaire obligatoire.
- **`lignes_grille_indiciaire`** : une ligne = un indice pour `(cadre, échelle) | catégorie | corps` × `classe` × `échelon`, avec sa propre source/article. Un `CHECK` SQL encode directement la Loi 2003-011 Art.46 (2 échelons en classe exceptionnelle, 3 pour les autres) : une combinaison réglementairement impossible est rejetée en base, pas seulement côté applicatif.
- **`personnel`** et **`carriere_evenements`** gagnent (migration `007`, additive) : `indice_num` (entier, la valeur exploitable — la colonne texte `indice` reste pour l'affichage legacy "950-FOP"), `indice_source` (`REGLEMENTAIRE`/`SAISIE_RH`/`IMPORT_EXCEL`/`A_CONFIRMER`), `ligne_grille_id`/`ligne_grille_actuelle_id` (traçabilité vers la ligne de grille utilisée), `cadre`/`echelle`. Après chaque création/modification/suppression d'un événement de carrière portant une situation, `carriereService` resynchronise automatiquement `personnel` sur l'événement le plus récent (par date d'effet) : la fiche personnel ne peut pas diverger silencieusement de son historique.
- **`alertes_avancement`** (migration `008`) : file d'alertes RH (`AVANCEMENT_ECHELON_ECHU`, `AVANCEMENT_CLASSE_ELIGIBLE`, `INCOHERENCE_INDICE`, `GRILLE_INCONNUE`, `DOSSIER_INCOMPLET`), jamais d'écriture automatique sur `personnel`/`carriere_evenements` — seulement une alerte à traiter par le RH.

### Flux : avancement d'échelon

```text
avancementEcheanceJob (toutes les 24h, comme contratEcheanceJob) → avancementService.scannerAlertes()
→ pour chaque agent régime FONCTIONNAIRE : date d'entrée dans l'échelon actuel + périodicité (paramètre
  "avancement_echelon_periodicite_annees", 2 ans par défaut, Art.47) = échéance théorique
→ si échéance atteinte : crée une alertes_avancement OUVERTE (anti-doublon par index unique partiel) + notifie l'ADMIN_RH
→ RH consulte /api/carriere/alertes-avancement, choisit "Traiter" avec la catégorie/cadre-échelle réels
→ PATCH /api/carriere/alertes-avancement/:id/traiter → resolveIndice() → nouveau carriere_evenements
  (type "Avancement d'échelon", indice_source=REGLEMENTAIRE) → personnel resynchronisé → alerte marquée TRAITEE
```

L'éligibilité théorique (date atteinte) est donc toujours distincte du traitement administratif (validation RH) et de la situation effective (nouvel événement) — jamais de changement silencieux de l'indice d'un agent.

## API REST

Les réponses sont JSON, sauf l'export Excel et le téléchargement de documents/contrats. Toutes les routes listées comme protégées attendent un jeton Bearer.

### Authentification et inscription

| Méthode | URL | Accès | Objectif |
| --- | --- | --- | --- |
| POST | `/api/auth/login` | Public | `{ email, password }` → jeton et utilisateur. |
| GET | `/api/auth/me` | Authentifié | Utilisateur courant. |
| PATCH | `/api/auth/password` | Authentifié | Change le mot de passe. |
| POST | `/api/auth/forgot-password` | Public | Envoie le lien de réinitialisation. |
| POST | `/api/auth/reset-password` | Public | Réinitialise avec jeton et nouveau mot de passe. |
| POST | `/api/otp/request`, `/api/otp/verify` | Public | Envoie puis vérifie un code e-mail. |
| POST | `/api/register` | Public | Inscription `{ email, matricule, password }` en attente. |

### Personnel, comptes et invitations

| Méthode | URL | Accès | Objectif |
| --- | --- | --- | --- |
| GET / POST | `/api/personnel` | `view_personnel` / `create_personnel` | Liste ou crée une fiche ; chaque fiche renvoie `roles` (tableau `PE`/`PAT`, une personne peut avoir les deux) et, si PE, `etablissement_id`/`etablissement_nom`/`corps_pe`/`diplome`/`specialite`. Création/modification acceptent `roles: []` (au moins un requis) et `peInfos: {}` (établissement, corps, diplôme, spécialité). La création accepte aussi `secretariatRole` (`SECRETAIRE_PE` ou `SECRETAIRE_PAT`), refusé si la fiche n'est pas PAT. |
| GET / POST / PATCH | `/api/etablissements`, `/:id` (renommage), `/:id/desactiver`, `/:id/reactiver` | `view_personnel` (lecture) / `manage_etablissements` (écriture) | Établissements auxquels rattacher un PE ; désactivation seulement, jamais de suppression physique. |
| GET | `/api/personnel/me` | `view_profil` | Fiche de l'utilisateur courant. |
| PATCH | `/api/personnel/me/photo` | `view_profil` | Enregistre la photo personnelle multipart `photo` (JPG/PNG/WebP, 3 Mo maximum). |
| GET | `/api/personnel/sans-compte` | `send_registration_link` | Personnel sans compte. |
| POST | `/api/personnel/:id/envoyer-lien` | `send_registration_link` | Lien d'inscription par e-mail. |
| GET / POST | `/api/personnel/export?role=PE\|PAT`, `/api/personnel/import` | `view_personnel` / `create_personnel` | Export Excel (filtrable par rôle) / import multipart `file` (5 Mo maximum). |
| GET | `/api/personnel/import/modele?role=PE\|PAT` | `create_personnel` | Modèle d'import Excel : feuille « Personnel » avec listes déroulantes et feuille « Instructions ». |
| GET / POST | `/api/pending-accounts`, `/:id/approve`, `/:id/reject` | `view_pending_accounts` | Liste et traite les comptes en attente. |
| GET / POST / DELETE | `/api/account-admin`, `/:id/deactivate`, `/:id/reactivate`, `/:id` | `manage_accounts` | Gestion des comptes ; la suppression est transactionnelle et réversible (voir Backend et sécurité). |
| PATCH | `/api/account-admin/:id/role` | `manage_accounts` | Promeut/rétrograde un compte en secrétaire de sa catégorie — transitions strictement limitées à `PE⇄SECRETAIRE_PE`/`PAT⇄SECRETAIRE_PAT`, jamais `ADMIN_RH`/`SUPERADMIN`. |
| POST | `/api/invitations` | `ADMIN_RH` | Invitation avec e-mail, rôle, fonction, matricule. |
| GET | `/api/invitations/pending` | `ADMIN_RH` | Invitations soumises. |
| GET / POST | `/api/invitations/:token`, `/:token/submit` | Public | Lecture et soumission d'invitation. |
| POST | `/api/invitations/:id/confirm`, `/:id/reject` | `ADMIN_RH` | Décision sur une invitation. |

### Congés, carrière et administration

| Méthode | URL | Accès | Objectif |
| --- | --- | --- | --- |
| POST / GET | `/api/conges`, `/api/conges/me` | `create_conge` / `view_mes_conges` | Crée et liste ses congés. |
| GET | `/api/conges/pending`, `/recent`, `/calendar` | `view_conges_admin` | Pilotage RH des congés. |
| GET | `/api/conges/solde` | `view_mes_conges` | Solde disponible, droits de l'année, reliquat, jours posés (calculés par le backend). |
| GET | `/api/conges/pending-equipe` | Authentifié (validateur) | Demandes de son équipe en attente d'avis. |
| POST | `/api/conges/:id/review-intermediaire` | Validateur assigné | Avis intermédiaire du chef de service (un refus restitue les jours). |
| GET / POST | `/api/conges/pending-secretariat`, `/:id/review-secretariat` | `review_conges_secretariat` | File et vérification secrétariat (filtre avant le circuit ci-dessus) — `SECRETAIRE_PE`/`SECRETAIRE_PAT` ne voient que leur catégorie, `ADMIN_RH`/`SUPERADMIN` voient tout (repli anti-blocage). |
| GET / POST | `/api/conges/:id`, `/:id/review` | Propriétaire/validateur/Admin RH / `view_conges_admin` | Détail (avec QR d'avis si favorable) et décision finale. |
| GET | `/api/conges/suivi/:personnelId` | `view_conges_admin` | Solde enregistré et disponible, droits de l'année, reliquat, jours posés, restant par année, congés historiques (avec « décision établie »). |
| POST | `/api/conges/ouverture/:personnelId` | `view_conges_admin` | Saisie des soldes d'ouverture par année (409 si année existante ou solde non ventilé non confirmé). |
| GET | `/api/conges/sans-decision` | `view_conges_admin` | Congés annuels approuvés sans décision d'octroi. |
| GET | `/api/verification/avis/:token` | **Publique**, 30 req / 10 min / IP | Vérifie l'authenticité d'un avis de chef de service (jeton signé). |
| GET | `/api/carriere/me` | `view_profil` | Carrière personnelle. |
| GET / POST | `/api/carriere/:personnelId` | `manage_fonctions` | Carrière et événement. |
| GET | `/api/carriere/echeances` | `manage_fonctions` | Personnel dont `date_echeance_contrat` (champ historique, distinct des contrats ci-dessous) tombe sous 30 jours. |
| PATCH / GET | `/api/users/:id/fonction`, `/:id/fonction-history` | `manage_fonctions` | Fonction et son historique. |
| GET | `/api/activity-log?limit=&exclude=` | `view_historique` | Journal des actions ; `exclude` (optionnel) écarte certains `action_type`. Pour un appelant non SUPERADMIN, le serveur écarte en plus systématiquement les types réservés à une permission exclusive au Superadmin (comptes, corbeille, permissions, personnalisation, réclamations) — non contournable via `exclude`. |
| GET | `/api/stats/admin-dashboard` | `view_dashboard_admin` | Indicateurs RH. |
| POST / GET | `/api/notifications`, `/api/notifications/me` | `send_notification` / `view_notifications` | Envoi ciblé et réception. |
| POST | `/api/notifications/read-all` | `view_notifications` | Marque toutes ses notifications comme lues. |
| POST | `/api/notifications/:id/read` | `view_notifications` | Marque une notification comme lue. |
| GET / PATCH | `/api/permissions`, `/api/permissions/me` | `manage_permissions` / authentifié | Gère ou lit les permissions. |
| GET / POST / DELETE | `/api/corbeille`, `/:id/restaurer`, `/:id`, `/vider` | `manage_corbeille` | Corbeille, restauration, suppression définitive d'un élément ou de la corbeille entière (`DELETE /vider`, déclarée avant `/:id` pour ne pas être capturée par ce paramètre). |
| GET / PATCH | `/api/site-settings` | Public / `manage_site_settings` | Couleurs du site. |
| POST | `/api/site-settings/{logo,favicon,logo-connexion}` | `manage_site_settings` | Upload d'image (JPG/PNG/WebP, 2 Mo max), remplace le fichier précédent. |
| GET / POST / PATCH | `/api/site-texts`, `/ensure-default`, `/` | Public / `manage_site_texts` | Textes personnalisables. |
| POST / GET | `/api/reclamations`, `/api/reclamations/me` | `signaler_probleme` | Le personnel signale un problème au Superadmin (notifie le rôle SUPERADMIN) et suit ses propres réclamations. |
| GET / PATCH | `/api/reclamations`, `/:id/traiter` | `manage_reclamations` | Liste (Superadmin uniquement) et traitement d'une réclamation (réponse obligatoire). |

### Contrats

| Méthode | URL | Accès | Objectif |
| --- | --- | --- | --- |
| GET | `/api/contrats/me` | `view_profil` | Historique de contrats de l'utilisateur courant. |
| GET | `/api/contrats/personnel/:personnelId` | `manage_fonctions` | Historique de contrats d'une fiche. |
| POST | `/api/contrats/personnel/:personnelId` | `manage_fonctions` | Importe un contrat, multipart `fichier` (PDF, 10 Mo maximum). |
| POST | `/api/contrats/personnel/:personnelId/:contratId/renouveler` | `manage_fonctions` | Finalise un renouvellement : nouveau contrat + PDF. |
| POST | `/api/contrats/:contratId/documents` | `manage_fonctions` | Ajoute un document (avenant...) à un contrat existant. |
| POST | `/api/contrats/:contratId/decision` | `manage_fonctions` | Enregistre une décision (`renouvele_renegociation` ou `non_renouvele`, motif obligatoire pour le second). |
| GET | `/api/contrats/documents/:documentId/fichier` | Authentifié (propriétaire ou `ADMIN_RH`) | Télécharge le PDF d'un document de contrat. |

### Situations administratives

| Méthode | URL | Accès | Objectif |
| --- | --- | --- | --- |
| GET | `/api/situations-administratives/types` | Authentifié | Catalogue des types de situation. |
| GET | `/api/situations-administratives/me` | `view_profil` | Situation actuelle et historique de l'utilisateur courant. |
| GET | `/api/situations-administratives/:personnelId` | `manage_situations_administratives` | Situation actuelle et historique d'une fiche. |
| POST | `/api/situations-administratives/:personnelId` | `manage_situations_administratives` | Ouvre une nouvelle situation (ferme la précédente la veille), multipart `justificatif` optionnel. 400 validation, 404 fiche, 409 date en conflit. |
| PATCH | `/api/situations-administratives/:id` | `manage_situations_administratives` | Modifie référence/observations/motif. |
| DELETE | `/api/situations-administratives/:id` | `manage_situations_administratives` | Supprime la situation actuelle uniquement ; rouvre la précédente. |

### Documents administratifs

| Méthode | URL | Accès | Objectif |
| --- | --- | --- | --- |
| POST | `/api/documents` | `manage_documents` | Génère un document (`certificat_administratif`, `lettre_confirmation`, `etat_conge`, ou `decision_conge` avec `{ congeId }` ou `{ historiqueId }`) pour une fiche. |
| GET | `/api/documents/me` | `view_mes_documents` | Documents générés pour l'utilisateur courant. |
| GET | `/api/documents/personnel/:personnelId` | `manage_documents` | Historique des documents d'une fiche. |
| GET | `/api/documents/:id` | Authentifié (propriétaire ou `manage_documents`) | Détail d'un document généré, pour affichage/impression. |
| POST | `/api/documents/demandes` | `demander_document` | Le personnel demande un document (type + motif optionnel). |
| GET | `/api/documents/demandes/me` | `demander_document` | Ses propres demandes. |
| GET | `/api/documents/demandes/en-attente` | `manage_documents` | Demandes en attente de traitement RH (déjà vérifiées par le secrétariat). |
| GET / POST | `/api/documents/demandes/en-attente-secretariat`, `/:id/review-secretariat` | `review_documents_secretariat` | File et vérification secrétariat, avant la file RH ci-dessus — mêmes règles de catégorie/repli que pour les congés. |
| POST | `/api/documents/demandes/:id/traiter` | `manage_documents` | Génère le document et clôt la demande. |
| POST | `/api/documents/demandes/:id/refuser` | `manage_documents` | Refuse la demande sans générer de document. |

### Organisation, catégories et paramètres de carrière

| Méthode | URL | Accès | Objectif |
| --- | --- | --- | --- |
| GET | `/api/organisation/directions` | Authentifié | Catalogue des directions actives (nom, responsable) ; `?tous=1` inclut les désactivées (page de gestion). |
| GET | `/api/organisation/services?directionId=&tous=1` | Authentifié | Catalogue des services actifs, filtrable par direction (`tous=1` pour la gestion). |
| POST | `/api/organisation/directions` | `manage_organisation` | Crée une direction (`nom`, unique, ≤150 caractères). |
| PATCH | `/api/organisation/directions/:id` | `manage_organisation` | Renomme (`nom`) et/ou désactive/réactive (`actif`). Un renommage est répercuté sur `personnel.direction` dans la même transaction. |
| DELETE | `/api/organisation/directions/:id` | `manage_organisation` | Supprime une direction ; refusée (409) si des services ou des fiches personnel la référencent encore. |
| POST | `/api/organisation/services` | `manage_organisation` | Crée un service (`nom`, `directionId`). |
| PATCH | `/api/organisation/services/:id` | `manage_organisation` | Renomme et/ou désactive un service ; le renommage est répercuté sur `personnel.service`. |
| DELETE | `/api/organisation/services/:id` | `manage_organisation` | Supprime un service ; refusée (409) si des fiches personnel le référencent encore. |
| GET / POST | `/api/organisation/import/modele`, `/api/organisation/import` | `manage_organisation` | Modèle Excel (Direction / Service) et import : les entrées existantes sont réutilisées, jamais dupliquées. |
| GET | `/api/categories` | Authentifié | Catalogue des catégories professionnelles (numéro 1 à 8, sans 7 ; code, appellation, niveau de diplôme requis). |
| GET | `/api/parametres-carriere` | `manage_parametres_carriere` | Liste les paramètres de progression de carrière. |
| PATCH | `/api/parametres-carriere/:cle` | `manage_parametres_carriere` | Modifie un paramètre ; consigné dans `activity_log`. |

### Grilles indiciaires et alertes d'avancement

| Méthode | URL | Accès | Objectif |
| --- | --- | --- | --- |
| GET | `/api/indiciaire/grilles` | `view_profil` | Liste les grilles (filtrable par `?regime=`). |
| GET | `/api/indiciaire/grilles/:id` | `view_profil` ou `view_personnel` | Détail d'une grille (les agents voient leur indice, les RH consultent les grilles). |
| GET | `/api/indiciaire/recherche` | `view_profil` | Parcourt les lignes de grille (filtres `regime`, `classe`, `echelon`, `cadre`, `echelle`, `categorie`). |
| GET | `/api/indiciaire/resolve` | `manage_fonctions` | Résout un indice réglementaire (`regime`, `classe`, `echelon`, `categorie`/`cadre`/`echelle`, `dateEffet`) ; 422 explicite si aucune ligne ou plusieurs grilles concurrentes. |
| POST | `/api/indiciaire/grilles/:id/lignes` | `manage_parametres_carriere` | Ajoute une ligne de grille ; `sourceTexte` et `dateDebutValidite` obligatoires, aucune insertion sans référence. |
| GET | `/api/carriere/alertes-avancement` | `manage_fonctions` | Alertes ouvertes (filtrable par `?personnel=`). |
| PATCH | `/api/carriere/alertes-avancement/:id/traiter` | `manage_fonctions` | Valide l'avancement d'échelon proposé : crée l'événement de carrière via la grille. |
| PATCH | `/api/carriere/alertes-avancement/:id/ignorer` | `manage_fonctions` | Marque l'alerte comme ignorée, sans effet sur la fiche. |

`POST /api/carriere/:personnelId` et `PATCH /api/carriere/evenements/:id` (voir tableau *Congés, carrière et administration*) acceptent un champ optionnel `resolveFromGrille` (JSON stringifié, car envoyé en `multipart/form-data` avec le justificatif) — s'il est fourni, `classe`/`echelon`/`indice` sont recalculés depuis la grille plutôt que pris tels quels. `PATCH /api/personnel/:id` accepte le même champ, en JSON natif cette fois (pas de fichier sur cette route).

Le responsable d'une direction ou d'un service n'est jamais modifié par une route dédiée : `organisationRepository.syncResponsable` est appelée en interne lors d'un changement de fonction/service/direction d'une fiche personnel, et retire automatiquement la personne de tout ancien poste de responsable avant, le cas échéant, de l'assigner au nouveau.

**Gestion des directions et services** (page `/admin/organisation`, lien « Gérer les directions & services » depuis `/admin/personnel`, permission `manage_organisation`) : la RH crée, renomme, désactive (`actif`) et supprime des directions et des services, et peut les importer depuis Excel. Une entrée désactivée n'est plus proposée dans les formulaires, mais les fiches qui la référencent restent intactes. `personnel.direction`/`personnel.service` étant du texte libre relié par le nom (sans clé étrangère), un renommage est répercuté sur ces fiches, et une suppression est refusée avec un message explicite tant que des services (pour une direction) ou des fiches personnel (pour une direction ou un service) la référencent encore — chaque création et suppression est tracée dans `activity_log`.

## Structure de la base de données

`user_details` est interrogée comme une vue ou une table de lecture : sa définition n'est pas dans le dépôt. Les relations ci-dessous sont celles utilisées dans le code ; `contrats`, `documents_contrat`, `situations_administratives` et `types_situation_administrative` sont en revanche définies par les migrations `003` et `004`, colonnes et contraintes garanties exactes.

```mermaid
erDiagram
    PERSONNEL ||--o| USERS : "personnel_id"
    USERS ||--o{ CONGES : "demande"
    USERS ||--o{ NOTIFICATIONS : "reçoit ou envoie"
    USERS ||--o{ ACTIVITY_LOG : "déclenche"
    USERS ||--o{ FONCTION_HISTORY : "concerne ou modifie"
    PERSONNEL ||--o{ CARRIERE_EVENEMENTS : "possède"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "est attribuée"
    USERS ||--o{ PASSWORD_RESET_TOKENS : "possède"
    USERS ||--o{ CORBEILLE : "supprime"
    PERSONNEL ||--o{ CONTRATS : "possède"
    CONTRATS ||--o{ CONTRATS : "contrat_precedent_id"
    CONTRATS ||--o{ DOCUMENTS_CONTRAT : "contient"
    PERSONNEL ||--o{ SITUATIONS_ADMINISTRATIVES : "possède"
    TYPES_SITUATION_ADMINISTRATIVE ||--o{ SITUATIONS_ADMINISTRATIVES : "catégorise"
    PERSONNEL ||--o{ DOCUMENTS_GENERES : "possède"
    PERSONNEL ||--o{ DEMANDES_DOCUMENTS : "demande"
    DOCUMENTS_GENERES ||--o| DEMANDES_DOCUMENTS : "clôt"
    DIRECTIONS ||--o{ SERVICES : "contient"
    PERSONNEL ||--o| DIRECTIONS : "dirige (optionnel)"
    PERSONNEL ||--o| SERVICES : "encadre (optionnel)"
    CATEGORIES_PROFESSIONNELLES ||--o{ PERSONNEL : "catégorise"
    GRILLES_INDICIAIRES ||--o{ LIGNES_GRILLE_INDICIAIRE : "contient"
    LIGNES_GRILLE_INDICIAIRE ||--o{ PERSONNEL : "situation actuelle"
    LIGNES_GRILLE_INDICIAIRE ||--o{ CARRIERE_EVENEMENTS : "indice résolu"
    PERSONNEL ||--o{ ALERTES_AVANCEMENT : "concerne"
    CARRIERE_EVENEMENTS ||--o| ALERTES_AVANCEMENT : "résout"
    PERSONNEL ||--o{ PERSONNEL_ROLES : "porte (PE et/ou PAT)"
    PERSONNEL ||--o| PERSONNEL_PE_INFOS : "infos PE (si rôle PE)"
    ETABLISSEMENTS ||--o{ PERSONNEL_PE_INFOS : "rattache"
```

| Table / vue | Colonnes observées et rôle |
| --- | --- |
| `personnel` | `id`, matricule, identité, e-mail, rôle, fonction, corps, grade, service, direction, téléphone, contrat, échéance, `photo_profil`, `solde_conges` (`numeric(6,1)`, défaut 0) et `derniere_recharge_annee` (dernière année de droits créditée). Fiche RH ; matricule validé à six chiffres par l'application. `photo_profil` contient le chemin relatif de la photo, pas l'image elle-même. La colonne `role` (valeur unique) reste présente et resynchronisée automatiquement, mais `personnel_roles` fait foi depuis la migration `018` : une personne peut porter PE et PAT à la fois. |
| `personnel_roles` | `personnel_id`, `role` (`PE`/`PAT`), unique `(personnel_id, role)` — 0 à 2 lignes par personne. Migration `018`. |
| `personnel_pe_infos` | `personnel_id` (clé primaire, `ON DELETE CASCADE`), `etablissement_id`, `corps_pe` (grade académique type FOSIKA — AES/MC/PT/PES..., sans rapport avec `personnel.corps` qui est un régime d'emploi EFA/ELD/Fonctionnaire), `categorie_libelle`, `diplome`, `specialite`. Une ligne par personne ayant le rôle PE ; supprimée si le rôle PE est retiré. Migration `018`. |
| `etablissements` | `id`, `nom` (unique), `statut` (`ACTIF`/`INACTIF` — désactivation seulement, jamais de suppression physique pour préserver l'historique des PE qui y sont/étaient rattachés). Migration `018`. |
| `users` | `id`, rôle, e-mail, `password_hash`, `personnel_id`, statut, création. Statuts observés : `pending`, `active`, `inactive`. |
| `user_details` | Lecture jointe compte/personnel : identité, matricule, rôle, fonction, statut, e-mail et contrat. |
| `conges` | Identifiant utilisateur, type, dates, motif, statut, relecteur, date/avis de revue, validateur intermédiaire, `solde_avant` / `solde_apres` (solde figé à la date de la demande), `decision_secretariat`/`decision_secretariat_le`/`avis_secretariat` (vérification secrétariat, migration `019`, colonne séparée de `decision_intermediaire`). Statuts : `en_attente`, `approuvee`, `refusee`. |
| `conges_droits_annuels` | Un droit par personnel et par année (`droit`, `libelle_periode` comme « 2016-2017 », `source` `CALCULE`/`OUVERTURE`, `reference`). Unique `(personnel_id, annee)`. |
| `conges_imputations` | Jours d'un congé annuel imputés à une année de droit (`annee` `NULL` = solde d'ouverture non ventilé) ; supprimées avec le congé (cascade), restaurées par la corbeille. |
| `conges_historiques` | Congés pris avant le SGRH (année de droit, dates, jours, `lieu_jouissance`), rattachés à `personnel` : un agent sans compte peut en avoir. |
| `invitations` | E-mail, rôle, fonction, jeton, émetteur, expiration, statut, données soumises, utilisateur créé. Statuts : `envoyee`, `soumise`, `confirmee`, `refusee`. |
| `notifications` | Expéditeur, destinataire, titre, message, type, `lien` (chemin frontend optionnel pour la redirection au clic), lecture et date. |
| `reclamations` | Réclamation du personnel (PE/PAT) au Superadmin : `auteur_id` (`SET NULL`), `sujet`, `description`, `statut` (`ouverte`/`traitee`), `reponse`, `traite_par`, `traite_le`. Distincte de `notifications` (aucune notion de statut/réponse côté annonces). |
| `fonction_history` / `carriere_evenements` | Historique de fonction et événements de carrière. |
| `activity_log` | Utilisateur, type d'action, description, date ; l'utilisateur peut être nul (migration `002`). |
| `permissions` / `role_permissions` | Catalogue et association rôle/permission avec indicateur `enabled`. L'upsert repose sur l'unicité fonctionnelle `(role, permission_id)`. |
| `otp_codes` | E-mail, code, expiration, utilisation ; validité de dix minutes. |
| `password_reset_tokens` | Utilisateur, jeton, expiration, utilisation ; validité de trente minutes. |
| `corbeille` | Type, données JSON (compte + congés/historique de fonction/notifications capturés), auteur et date de suppression. |
| `site_settings` / `site_texts` | Paires clé/valeur pour couleurs, logo/favicon/logo de connexion (chemins de fichier, `value VARCHAR(255)` depuis la migration `016`) et textes personnalisables ; textes catégorisés. |
| `contrats` | `personnel_id`, `type_contrat` (`CDI`/`CDD`/`Vacataire`/`Stagiaire`), `date_debut`, `date_fin`, `numero_renouvellement`, `contrat_precedent_id` (auto-référence), `statut` (`actif`/`expire`/`renouvele`/`non_renouvele`/`resilie`), `decision`, `motif_non_renouvellement`, `reference_decision`, `observations`, `notifie_echeance_le`, `notifie_expiration_le` (migration `005`), auteur/date. Contraintes `CHECK` sur type, statut, décision, cohérence des dates et obligation du motif si non-renouvellement. |
| `documents_contrat` | `contrat_id` (`ON DELETE CASCADE`), `type_document` (`contrat_original`/`avenant`/`autre`), `filename` (nom d'origine affiché), `path` (nom UUID sur disque), mime type, taille, importateur, date. |
| `situations_administratives` | `personnel_id`, `type_situation_id`, `date_debut`, `date_fin` (une seule ligne par personnel avec `date_fin` nulle à la fois), `reference_decision`, justificatif (nom + chemin), `observations`, `motif` (migration `004`), auteur, date. |
| `types_situation_administrative` | Catalogue : `code` (unique), `libelle`, `categories_concernees`. |
| `documents_generes` | `personnel_id`, `type_document` (`certificat_administratif`/`lettre_confirmation`), `donnees` (JSONB — contenu libre du document, notamment son numéro), auteur, date. |
| `demandes_documents` | `personnel_id`, `type_document`, `motif`, `statut` (`en_attente`/`traitee`/`refusee`), `document_id` une fois traitée, `traite_par`, dates de demande/traitement, `decision_secretariat`/`decision_secretariat_le`/`avis_secretariat` (vérification secrétariat, migration `019`). |
| `directions` | `nom` (unique), `responsable_personnel_id` (unique — une seule direction par responsable). |
| `services` | `nom`, `direction_id`, `responsable_personnel_id` (unique) ; unicité de `(nom, direction_id)`. |
| `categories_professionnelles` | `numero` (1 à 8, jamais 7, unique), `code` (unique), `appellation`, `niveau_diplome`. Référencée par `personnel.categorie_id`. |
| `parametres_carriere` | Clé/valeur (`cle` en clé primaire), `description`, `a_valider` (issu d'une information non encore confirmée officiellement), auteur/date de la dernière modification. |
| `grilles_indiciaires` | `code` (unique), `nom`, `regime` (`FONCTIONNAIRE`/`AGENT_NON_ENCADRE`/`AUTRE`), `texte_source_principal` (obligatoire), `date_debut_validite`/`date_fin_validite`, `actif`. |
| `lignes_grille_indiciaire` | `grille_id`, `cadre`/`echelle`/`categorie`/`corps` (dimensions optionnelles selon le régime), `classe`, `echelon`, `indice` (entier), `code_grille_affichage` (générique, jamais `'FOP'` en dur), `source_texte`/`source_article` (obligatoires), validité temporelle. `CHECK` garantissant 2 échelons en classe exceptionnelle et 3 pour les 3 autres classes (Loi 2003-011 Art.46). |
| `alertes_avancement` | `personnel_id`, `type`, `date_echeance_theorique`, `statut` (`OUVERTE`/`TRAITEE`/`IGNOREE`), `details` (JSONB, snapshot de la situation au moment du scan), `evenement_resultant_id`, `traite_par`/`traite_at`. Index unique partiel `(personnel_id, type) WHERE statut='OUVERTE'` pour l'anti-doublon. |

Relations utilisées : `users.personnel_id → personnel.id`, `conges.user_id → users.id`, `notifications.sender_id/recipient_id → users.id`, `fonction_history.user_id/changed_by → users.id`, `carriere_evenements.personnel_id → personnel.id`, `role_permissions.permission_id → permissions.id`, les jetons de mot de passe vers `users.id`, `contrats.personnel_id → personnel.id`, `contrats.contrat_precedent_id → contrats.id`, `documents_contrat.contrat_id → contrats.id`, `situations_administratives.personnel_id → personnel.id`, `situations_administratives.type_situation_id → types_situation_administrative.id`, `documents_generes.personnel_id → personnel.id`, `demandes_documents.personnel_id → personnel.id`, `demandes_documents.document_id → documents_generes.id`, `services.direction_id → directions.id`, `directions.responsable_personnel_id`/`services.responsable_personnel_id → personnel.id`, `personnel.categorie_id → categories_professionnelles.id`, `lignes_grille_indiciaire.grille_id → grilles_indiciaires.id`, `personnel.ligne_grille_actuelle_id`/`carriere_evenements.ligne_grille_id → lignes_grille_indiciaire.id`, `alertes_avancement.personnel_id → personnel.id` et `alertes_avancement.evenement_resultant_id → carriere_evenements.id`, `personnel_roles.personnel_id → personnel.id` (`ON DELETE CASCADE`), `personnel_pe_infos.personnel_id → personnel.id` (`ON DELETE CASCADE`), `personnel_pe_infos.etablissement_id → etablissements.id`.

Toutes les clés étrangères vers `users.id` ont un comportement `ON DELETE` explicite depuis la migration `002` : `SET NULL` pour les colonnes qui ne font que référencer l'auteur d'une action (la ligne d'origine reste intacte), `CASCADE` pour les colonnes qui définissent le propriétaire d'une ligne (congés, historique de fonction, notifications reçues, jetons de reset) — dans ce dernier cas, le code applicatif sauvegarde ces lignes dans la corbeille avant suppression, sauf les jetons de reset qui n'ont aucune valeur de restauration.

### Migrations

| Fichier | Contenu | Destructif ? |
| --- | --- | --- |
| `001_add_personnel_photo.sql` | Ajoute la colonne nullable `personnel.photo_profil`. | Non |
| `002_fix_account_deletion_fk.sql` | Pose un comportement `ON DELETE` explicite sur toutes les FK vers `users(id)` (voir ci-dessus). | Non |
| `003_create_contrats.sql` | Crée `contrats` et `documents_contrat`. | Non |
| `004_situations_administratives_motif.sql` | Ajoute la colonne nullable `situations_administratives.motif`. | Non |
| `005_notifications_lien_et_expiration.sql` | Ajoute `notifications.lien` et `contrats.notifie_expiration_le`. | Non |
| `006_create_grilles_indiciaires.sql` | Crée `grilles_indiciaires` et `lignes_grille_indiciaire` ; seed de la seule grille chiffrée vérifiée (classe exceptionnelle, régime transitoire par catégorie — Décret n°97-009 + Circulaire n°132/2005). | Non |
| `007_extend_personnel_carriere_grille.sql` | Ajoute `cadre`/`echelle`/`indice_num`/`indice_source`/`ligne_grille_actuelle_id` sur `personnel` et `ligne_grille_id`/`indice_num`/`indice_source` sur `carriere_evenements` ; rétro-remplit `indice_num` depuis les valeurs texte déjà numériques (aucune perte, aucune valeur devinée pour le reste). | Non |
| `008_create_alertes_avancement.sql` | Crée `alertes_avancement`. | Non |
| `009_contrats_unique_actif.sql` | Index unique partiel : un seul contrat actif par personnel. | Non |
| `010_situations_administratives_unique_ouverte.sql` | Index unique partiel : une seule situation ouverte (`date_fin IS NULL`) par personnel. | Non |
| `011_carriere_type_evenement_changement_service.sql` | Remplace, dans le `CHECK` de `carriere_evenements`, « Changement de service ou d'établissement » par « Changement de service » (s'interrompt si une ligne utilise l'ancienne valeur). | Non |
| `012_conges_solde_decimal_default_zero.sql` | `personnel.solde_conges` passe de `integer` à `numeric(6,1)` et de `DEFAULT 30` à `DEFAULT 0` (corrige le double comptage 30 + 30). Aucune ligne modifiée. | Non |
| `013_conges_suivi_annuel_et_snapshots.sql` | Crée `conges_droits_annuels`, `conges_imputations` ; ajoute `conges.solde_avant` / `solde_apres`. | Non |
| `014_conges_historiques.sql` | Crée `conges_historiques`. | Non |
| `015_conges_historiques_lieu.sql` | Ajoute `conges_historiques.lieu_jouissance`. | Non |
| `016_widen_site_settings_value.sql` | `site_settings.value` passe de `VARCHAR(20)` à `VARCHAR(255)` (les couleurs `#RRGGBB` tenaient dans 20 caractères, pas un chemin de fichier logo/favicon). | Non |
| `017_create_reclamations.sql` | Crée `reclamations`. | Non |
| `018_create_pe_pat_multi_role.sql` | Crée `personnel_roles`, `etablissements`, `personnel_pe_infos` ; rétro-remplit `personnel_roles` depuis `personnel.role`. `personnel.role` conservé, non supprimé. | Non |
| `019_add_secretariat_roles.sql` | Élargit `users_role_check` à `SECRETAIRE_PE`/`SECRETAIRE_PAT` ; ajoute `decision_secretariat`/`decision_secretariat_le`/`avis_secretariat` sur `conges` et `demandes_documents` ; rétro-approuve les lignes déjà existantes (jamais bloquées rétroactivement par la nouvelle étape). | Non |
| `020_add_personnel_secretariat_role.sql` | Ajoute la colonne nullable `personnel.secretariat_role` (`SECRETAIRE_PE`/`SECRETAIRE_PAT`, `CHECK`) désignée par l'Admin RH à la création de la fiche. | Non |
| `021_directions_services_actif_et_etablissements.sql` | Ajoute `directions.actif` et `services.actif` (`BOOLEAN NOT NULL DEFAULT TRUE`) pour désactiver sans supprimer. | Non |
| `022_grille_fonction_publique.sql` | Crée la grille `FONCTIONNAIRE_GRILLE_GENERALE` (101 lignes : catégories I à IX en 2e classe, 1re classe, principalat et classe exceptionnelle ; deux échelons de la classe exceptionnelle pour X), puis **désactive** (sans supprimer) la grille transitoire. Modifie des données : il n'existe aucune fiche ni événement lié aux anciennes lignes. | Non (désactive, ne supprime pas) |

Elles sont réexécutables sans risque (`IF NOT EXISTS` / `DROP CONSTRAINT IF EXISTS` avant chaque `ADD`) et n'altèrent jamais de données existantes. Les migrations `012` (type de colonne et `DEFAULT`) et `011` (contrainte) modifient la définition d'une colonne ou d'une contrainte, sans toucher aux lignes.

**Installation depuis zéro** : `server/database/schema.sql` décrit la structure complète (33 tables : les 32 tables de la base `rh_mahajanga` plus la table de référence `roles`, avec clés primaires, types, `NOT NULL`, clés étrangères, index, `CHECK` et la vue `user_details`), `seed_reference.sql` les données de référence et `seed_dev.sql` des données fictives de développement (comptes `@example.test`, mot de passe `Demo1234!`). Le modèle conceptuel (diagramme Mermaid, cardinalités, écarts connus) est dans `server/database/MCD.md`. Le schéma a été comparé colonne par colonne, contrainte par contrainte et index par index avec la base réelle : seuls diffèrent la table `roles` et ses clés étrangères (à la place du `CHECK` sur les rôles), les `CHECK` sur les types de document et des index supplémentaires. Il ne doit jamais être exécuté sur une base existante (utiliser les migrations).

## Langue de l'interface

L'interface est disponible en français (par défaut) et en anglais : Paramètres > Langue & région, ou FR / EN sur la page de connexion. Les textes passent par `traduire('Texte français')` (`client/src/i18n/`), avec le dictionnaire `dictionnaires.js` ; un texte absent reste en français. Les documents officiels imprimables restent en français.

## Qualité et CI

GitHub Actions s'exécute sur chaque push et pull request vers `main` : `npm ci` dans les deux applications, build du frontend et vérification syntaxique de tous les fichiers backend avec `node --check`.

Le backend contient 72 tests (`cd server && npm test`, runner `node:test`) : calcul des droits, jeton de vérification, limiteur, conversion en lettres, grilles indiciaires, et tests d'intégration du solde et des documents de congé, ainsi que de la gestion des directions/services. Ces derniers s'exécutent sur la base `rh_mahajanga` avec des données jetables (matricules `999xxx`, noms/e-mails `@example.test`) supprimées en fin de test ; ils ne sont pas lancés par la CI, qui n'a pas de base PostgreSQL. Aucun déploiement n'est configuré. GitHub Pages ne peut pas héberger Express et PostgreSQL ; un futur hébergeur doit utiliser des GitHub Actions Secrets pour ses identifiants, jamais des secrets commités.
