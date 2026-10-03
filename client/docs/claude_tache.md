Oui. En me basant sur **l’état actuel du SGRH tel qu’on l’a suivi ensemble**, je retire les éléments que tu as déjà terminés. Voici uniquement la **checklist des tâches restantes**.

# 🔴 À FAIRE — SGRH

## 1. 🏛️ Carrière & situation administrative

*Statut vérifié le 2026-09-19 : ce bloc existait déjà avant la mission grilles indiciaires (`situations_administratives`, `situationAdministrativeService/Repository/routes`, branché dans `Carriere.jsx` et `MaCarriere.jsx`). Relu et vérifié en détail lors de cette passe.*

* ✅ Finaliser la **situation administrative** comme bloc indépendant de la timeline carrière — table `situations_administratives` séparée de `carriere_evenements`, service/repo/route dédiés
* ✅ Garantir qu'une seule situation soit ouverte à la fois — appliqué au niveau service (`findCurrentOpen`), **pas de contrainte `UNIQUE ... WHERE date_fin IS NULL` en base** (à ajouter si on veut une garantie DB en plus du service)
* ✅ Fermer automatiquement l'ancienne situation lors de la création d'une nouvelle — `closeSituation` appelé dans `addSituation`
* ✅ Gérer `date_debut` / `date_fin`
* 🟡 Empêcher les chevauchements de situations — vérifié seulement contre la situation ouverte courante (`dateDebut >= current.date_debut`), pas de vérification contre tout l'historique ; suffisant tant que le flux passe uniquement par `addSituation`, mais pas garanti si une donnée est insérée autrement
* ✅ Ajouter le **motif du changement** — colonne `motif` (migration 004)
* ✅ Afficher clairement la situation actuelle — `historique.find(s => !s.date_fin)`
* ✅ Afficher l'historique complet des situations
* ✅ Vérifier modification/suppression d'une situation — `updateSituation`/`deleteSituation` codés, y compris réouverture de la situation précédente si on supprime la courante
* ⬜ Tester tous les changements de situation — pas retesté en live dans cette session (aucune modification apportée à ce module cette passe)

---

## 2. 🔢 Gestion des indices

*Fait le 2026-09-19 — mission "Modélisation complète des grilles indiciaires" : audit + recherche réglementaire (Loi 2003-011, Décret 97-009, Circulaire 132/2005, Décret 2005-134, Décret 96-745) puis implémentation. 3 migrations (006-008), moteur `resolveIndice()` centralisé, 13 tests automatisés passants, vérifié en HTTP direct avec comptes jetables. Détails dans le README section "Grilles indiciaires et carrière".*

* ✅ Finaliser la gestion de l'indice — **pour le régime FONCTIONNAIRE, classe exceptionnelle uniquement** (seule donnée chiffrée vérifiée dans un texte officiel) ; principalat/1ère/2ème classe et régime agents non encadrés (EFA/ELD) restent volontairement non peuplés faute de texte fiable trouvé — schéma prêt, à compléter dès confirmation RH ou texte localisé (règle "ne rien inventer")
* ✅ Gérer la partie numérique (`950`) — colonne `indice_num INTEGER` sur `personnel` et `carriere_evenements`
* ✅ Gérer le code (`FOP`) — `code_grille_affichage`, jamais concaténé en dur ; `parseIndiceAffiche`/`formatDisplay` dans `grilleIndiciaireService.js`
* ✅ Associer l'indice à la situation/carrière — `ligne_grille_id` sur `carriere_evenements`, `ligne_grille_actuelle_id` sur `personnel`
* ✅ Afficher l'indice actuel — `MaCarriere.jsx`/`Profil.jsx`/`Carriere.jsx` via `formatIndiceDisplay`
* ✅ Conserver l'historique des indices — chaque `carriere_evenements` garde son propre `indice_num`/`ligne_grille_id`, jamais réécrit
* ✅ Gérer les changements d'indice — `avancementService.traiterAvancementEchelon` (validation RH obligatoire, jamais automatique) + `calculerReclassementIndiciaire` (règle étroite Art.49/Décret 2005-134) + alertes `alertes_avancement`
* ✅ Vérifier qu'un **simple renouvellement de contrat ne modifie pas automatiquement l'indice** — confirmé par grep : aucune référence à `indice` dans les services/contrôleurs/repositories de contrats

---

## 3. 📄 Contrats ELD / PAT / PE

*Statut vérifié le 2026-09-19 (audit + tests live avec comptes jetables). L'essentiel existait déjà (implémenté avant cette passe, checklist non tenue à jour) ; 2 vrais bugs trouvés et corrigés ci-dessous.*

* ✅ Finaliser l'import des contrats
* ✅ Accepter uniquement les PDF — extension **et** contenu réel (magic bytes `%PDF-`) vérifiés désormais, pas seulement le nom du fichier (`server/src/utils/fileSignature.js`)
* ✅ Sécuriser le stockage des contrats — `server/private-uploads/contrats`, jamais servi par `express.static`
* ✅ Afficher les contrats sur la fiche personnel
* ✅ Permettre au RH de télécharger un contrat
* ✅ Permettre au personnel de télécharger **uniquement son propre contrat** — vérifié en direct (compte "owner" OK, compte "other" → 403)
* ✅ Empêcher l'accès au contrat d'un autre personnel — idem
* 🟡 Gérer le remplacement d'un contrat — il n'existe pas de "remplacer le PDF actuel" ; on ne peut qu'ajouter une pièce supplémentaire (avenant) sans jamais écraser l'original. C'est cohérent avec la règle "jamais d'écrasement silencieux", mais il n'y a aucun moyen de corriger un PDF mal importé autrement qu'en base
* ✅ Conserver l'historique des contrats
* ✅ Corriger définitivement le problème **403 Forbidden** lié aux documents/PDF — **bug réel trouvé et corrigé** : un SUPERADMIN recevait un 403 sur tout document qui n'était pas sa propre fiche personnel, car `contratService.js:173` ne testait que `role === 'ADMIN_RH'` (le SUPERADMIN hérite normalement de tous les droits ADMIN_RH ailleurs dans l'app, mais pas ici). Corrigé + vérifié en direct sur les 4 types de documents (contrats, situations administratives, carrière, congés)

---

## 4. 🔄 Renouvellement des contrats

*Statut vérifié le 2026-09-19. Déjà implémenté avant cette passe ; 1 bug d'ordonnancement trouvé et corrigé.*

* ✅ Détecter les contrats arrivant prochainement à échéance — `contratEcheanceJob.js` (183 jours avant échéance)
* ✅ Afficher les contrats concernés au RH
* ✅ Workflow de renouvellement
* ✅ Workflow de renouvellement avec renégociation
* ✅ Workflow de non-renouvellement
* ✅ Demander un motif obligatoire pour le non-renouvellement — validé serveur + contrainte SQL + client
* ✅ Enregistrer le motif
* ✅ Conserver l'historique des décisions
* ✅ Créer le nouveau contrat après renouvellement
* ✅ Clôturer correctement l'ancien contrat — **bug réel trouvé et corrigé** : l'ancien contrat était marqué "renouvelé" **après** la création du nouveau, ce qui aurait laissé passer deux contrats "actif" simultanés pour la même personne. Corrigé (clôture avant création) et une contrainte SQL empêche maintenant ce cas structurellement (migration 009, `uniq_contrats_actif_par_personnel`), vérifié en direct

---

# 🔴 5. 🔔 Notifications RH

*Statut vérifié le 2026-09-19. L'essentiel (triggers automatiques + cloche + lien cliquable) existait déjà. Un gap réel identifié, non corrigé cette passe (hors périmètre sécurité).*

* ✅ Finaliser les notifications automatiques
* ✅ Notification d'approche d'expiration d'un contrat
* ✅ Notification de contrat expiré
* ✅ Notification de renouvellement
* ✅ Notification de non-renouvellement
* ✅ Notification de changement de situation administrative
* ✅ Notification des événements RH importants — avancement d'échelon (`avancementEcheanceJob.js`)
* ✅ Vérifier les destinataires
* ✅ Badge compteur non-lu
* ✅ Marquer comme lu
* ✅ Tout marquer comme lu
* 🟡 Accès depuis la cloche vers l'élément concerné — fonctionne pour les 4 déclencheurs automatiques (contrat, situation, avancement). **Gap identifié, non corrigé** : l'envoi manuel de notification (`EnvoyerNotification.jsx` → `notificationController.js`) ne renseigne jamais `lien`, donc une notification envoyée à la main par le RH n'est pas cliquable

---

# 🔴 6. 🧭 Nettoyage de la Sidebar

*Statut vérifié le 2026-09-19 : déjà propre, rien à faire.*

* ✅ Faire l'inventaire des entrées actuelles — `menuConfig.js`, config unique bien organisée par rôle, aucune entrée orpheline (toutes les routes ont une entrée menu ou sont volontairement accessibles hors sidebar, ex. `/notifications`, `/parametres`)
* ✅ Supprimer les doublons — aucun trouvé
* ✅ Regrouper les fonctionnalités similaires — déjà fait (voir commentaires dans le fichier)
* ✅ Retirer les éléments secondaires inutiles
* ✅ Adapter la sidebar selon le rôle — `Sidebar.jsx` filtre déjà par permission/rôle
* ✅ Éviter d'avoir les notifications comme élément inutilement séparé
* ✅ Vérifier que la navigation reste claire après le nettoyage

---

# 🟠 7. 📱 Responsive & Sidebar mobile

*Statut vérifié le 2026-09-19 (lecture de code uniquement, pas de test visuel navigateur cette passe).*

* 🟡 Adapter les pages aux écrans laptop — la majorité des pages n'ont pas de classes responsive du tout (`lg:`/`md:` utilisés dans seulement ~1/3 des fichiers), effectivement conçues pour desktop fixe
* ⬜ Vérifier 1366×768 — non testé visuellement
* ⬜ Vérifier les grands écrans — non testé visuellement
* 🟡 Adapter aux tablettes — dépend des mêmes classes manquantes que ci-dessus
* 🟡 Adapter aux smartphones — idem
* ✅ Sidebar rétractable — déjà implémenté (`Sidebar.jsx`, drawer + overlay)
* ✅ Menu hamburger sur mobile — `TopBar.jsx`
* ✅ Fermeture de la sidebar après navigation — déjà implémenté (`onClick={onClose}` sur chaque lien + Echap + clic sur l'overlay)
* ✅ Adapter les tableaux au mobile — les 3 pages avec `<table>` ont déjà `overflow-x-auto`
* 🟡 Adapter les formulaires — plusieurs grilles fixes sans repli mobile identifiées : `Conges.jsx`, `FicheDemande.jsx`, `Personnel.jsx`, `DocumentsAdmin.jsx` (non corrigé cette passe)
* ✅ Adapter les modales — déjà raisonnablement responsive (`max-w-* w-full p-4`)
* 🟡 Éliminer les débordements horizontaux — pas vérifié systématiquement page par page

---

# 🟠 8. 🎨 Harmonisation Design / UX

*Fait le 2026-09-19 (partiel, volontairement) : la bibliothèque de composants demandée dans la mission "UI partagée / toasts / skeletons" a été créée dans `client/src/components/ui/` (Button, Input, Select, Textarea, Checkbox, Badge, Card, Modal, ConfirmDialog, Table, EmptyState, Skeleton/SkeletonText/SkeletonAvatar/SkeletonCard/SkeletonTable/SkeletonPage — export groupé via `ui/index.js`), avec le même design (couleurs `navy`/`gold`/`status-*`, mêmes classes que l'existant) — mais appliquée seulement aux pages prioritaires (personnel, fiche employé, carrière, contrats, congés, documents, paramètres), pas aux ~60 pages du projet. Voir le détail dans le bloc "UI Component Library" plus bas.*

* ⬜ Revoir les pages qui apparaissent trop petites — non évalué visuellement, hors périmètre de cette passe
* ⬜ Recentrer correctement les contenus — idem
* ⬜ Améliorer l'utilisation de l'espace disponible — idem
* 🟡 Uniformiser les boutons — composant `Button` créé (variantes primary/secondary/danger/ghost + état `loading`), utilisé dans les 3 modales migrées ; **pas encore appliqué** aux ~99 boutons existants ailleurs (risque de régression trop élevé pour le faire en masse sans revue page par page)
* 🟡 Uniformiser les cartes — composant `Card` créé, pas encore appliqué partout (le remplacement pur est à faible risque, juste non prioritaire cette passe)
* 🟡 Uniformiser les tableaux — coquille `Table`/`TableHead`/`TableBody`/`TableRow`/`TableCell` créée, pas encore appliquée (les 3 tables existantes gardent leur JSX natif + leur logique de tri/filtre intacte)
* ⬜ Uniformiser les formulaires — `Input`/`Select`/`Textarea`/`Checkbox`/`FormField` créés, pas encore substitués aux champs existants (uniquement utilisés dans du nouveau code)
* ✅ Uniformiser les modales — `Modal` créé et **les 3 modales existantes y sont migrées** (`AjouterEmployeModal`, `ModifierEmployeModal`, la modale de non-renouvellement dans `Contrats.jsx`) : Echap pour fermer, `role="dialog"` + `aria-modal="true"`, focus posé sur le premier champ à l'ouverture (bug de focus trouvé et corrigé pendant les tests — il tombait d'abord sur le bouton "Fermer"), focus restauré à la fermeture. Vérifié en navigateur réel.
* ⬜ Uniformiser les badges — composant `Badge` créé, pas encore substitué aux badges existants
* ⬜ Uniformiser les icônes — non touché
* ⬜ Vérifier la cohérence des couleurs UM — non évalué (mais la bibliothèque réutilise strictement les tokens existants, aucune nouvelle couleur introduite)
* ⬜ Vérifier l'utilisation correcte du logo UM — non évalué

**Explicitement laissé de côté** : migrer les ~60 pages restantes vers ces composants. La bibliothèque existe et est prête à être adoptée progressivement ; l'appliquer partout d'un coup aurait été un refactor visuel massif avec un risque de régression que cette passe (dont la contrainte explicite était "aucune régression n'est acceptable") ne justifiait pas.

---

# 🟠 9. ⏳ Skeleton / chargement

*Fait le 2026-09-19 pour les pages prioritaires, puis étendu le 2026-09-20 à toutes les pages ayant un vrai chargement de données asynchrone (27 pages au total, testées en navigateur réel — voir bilan détaillé plus bas). Les pages sans fetch asynchrone (formulaires purs, contenu statique) n'ont volontairement pas de skeleton, il n'y a rien à y remplacer.*

* ✅ Skeleton Dashboard — `admin-rh/Dashboard.jsx` et `personnel/Dashboard.jsx` (2026-09-20)
* ✅ Skeleton liste personnel — `Personnel.jsx`, `SkeletonTable`, vérifié en navigateur (apparaît pendant le chargement, disparaît une fois les données arrivées)
* ✅ Skeleton fiche personnel — `Profil.jsx`, skeleton composé (avatar + bandeau + 2 cartes) reproduisant la structure réelle de la page
* ✅ Skeleton carrière — `Carriere.jsx` (admin) et `MaCarriere.jsx` (personnel), `SkeletonPage` ; `ParametresCarriere.jsx` (onglets Paramètres + Grilles indiciaires) ajouté le 2026-09-20
* ✅ Skeleton contrats — `Contrats.jsx` (admin) et `MesContrats.jsx` (personnel), `SkeletonCard`
* ✅ Skeleton congés — `CongesAdmin.jsx`, `Conges.jsx`, `ValidationEquipe.jsx`
* ✅ Skeleton notifications — `NotificationsPage.jsx` (2026-09-20)
* ✅ Skeleton utilisateurs — pages superadmin `Comptes.jsx`, `Corbeille.jsx`, `Permissions.jsx` (`SkeletonTable`), `ApparenceSite.jsx` (2026-09-20)
* ✅ Skeleton documents — `MesDocuments.jsx` ; `DocumentsAdmin.jsx`, `DemandesDocuments.jsx` ajoutés le 2026-09-20
* ✅ Autres pages ajoutées le 2026-09-20 : `ComptesEnAttente.jsx`, `Invitations.jsx`, `Historique.jsx`, `GestionFonctions.jsx`, `EnvoyerNotification.jsx`, `MonEquipe.jsx`, `DocumentImprimable.jsx`, `FicheDemande.jsx`
* ✅ Vérifier qu'aucune page importante reste blanche pendant le chargement — plus aucun texte "Chargement..." dans `client/src/pages` (vérifié par recherche exhaustive) ; les pages restées sans skeleton (`Login.jsx`, `Register.jsx`, `Parametres.jsx` et ses onglets, `aide/*`...) n'ont aucun fetch asynchrone au chargement, donc rien à skeletoniser

---

# 🟠 10. 📭 États vides

*Statut vérifié le 2026-09-19 : déjà fait, rien à faire.*

* ✅ Aucun contrat
* ✅ Aucun événement carrière
* ✅ Aucune situation historique
* ✅ Aucune notification
* ✅ Aucun congé
* ✅ Aucun document
* ✅ Aucun résultat de recherche

Chaque liste échantillonnée pendant l'audit associe déjà `length === 0` à un message clair ("Aucun événement enregistré", etc.).

---

# 🟠 11. ⚠️ Gestion des erreurs

*Fait le 2026-09-19 pour l'infrastructure + les 7 fichiers `services/*.js` des pages prioritaires ; pas les 17 autres fichiers de service.*

* 🟡 Uniformiser les erreurs API — `client/src/utils/apiError.js` créé (`makeApiError(res, data, fallback)`, priorité : message métier du backend > phrase fixe pour 401/403/404/409/500 > fallback existant du service > générique) ; appliqué à `personnelApi.js`, `carriereApi.js`, `contratApi.js`, `congeApi.js`, `situationAdministrativeApi.js`, `parametreCarriereApi.js`, `documentApi.js`, `fileDownload.js` (56 sites migrés) — **pas** aux 17 autres fichiers `services/*.js` (auth, notifications, organisation, comptes...), qui gardent leur `throw new Error(...)` d'origine, fonctionnellement inchangé
* ✅ Erreurs réseau — "Impossible de contacter le serveur. Vérifiez votre connexion." (`makeNetworkError`), pour les appels migrés
* ✅ Erreurs de validation — les 4 `alert()` restants remplacés par `toast.error()` (`ApparenceSite.jsx` ×2, `Personnel.jsx`, `ParametresCarriere.jsx`)
* 🟡 Erreurs upload — inchangé en dehors des `alert()` remplacés
* 🟡 Erreurs téléchargement — `fileDownload.js` migré vers `makeApiError`/`makeNetworkError`
* ✅ 401 — `apiError.js` expose `registerUnauthorizedHandler`, câblé dans `AuthContext.jsx` : un 401 reçu en cours de session (pas seulement au chargement initial) déclenche maintenant une déconnexion propre + `toast.warning("Votre session a expiré...")`, sans toucher à l'architecture JWT existante
* ✅ 403 — "Vous n'avez pas les droits nécessaires pour effectuer cette action." en repli si le backend n'a pas fourni de message (il en fournit presque toujours un, qui reste prioritaire)
* ✅ 404 — "Ressource introuvable." en repli
* ✅ 409 — message métier du backend utilisé en priorité, comme demandé
* ✅ 500 — "Une erreur interne est survenue. Veuillez réessayer." en repli
* ⬜ Bouton "Réessayer" — non implémenté cette passe (nécessiterait de refactorer chaque page pour exposer une fonction `retry`, non fait pour rester dans le périmètre)
* ✅ Messages compréhensibles pour l'utilisateur — présentation désormais uniforme via toast pour les cas migrés ; le détail technique reste en `console.error` (jamais montré tel quel à l'utilisateur), conformément à la consigne "ne jamais masquer l'erreur réelle pendant le développement"

---

# 📦 Mission "UI partagée / toasts / erreurs / skeletons" — bilan détaillé (2026-09-19)

### UI Component Library
**Statut** : fait pour les composants listés, appliqué aux pages prioritaires uniquement.
**Emplacement** : `client/src/components/ui/` (`Button`, `Input`, `Select`, `Textarea`, `Checkbox`, `Badge`, `Card`, `Modal`, `ConfirmDialog`, `EmptyState`, `FormField`, `Table`/`TableHead`/`TableBody`/`TableRow`/`TableCell`, `Skeleton`/`SkeletonText`/`SkeletonAvatar`/`SkeletonCard`/`SkeletonTable`/`SkeletonPage`), export groupé `ui/index.js`.
**Composants réutilisés tels quels** : `PageHeader.jsx` (déjà générique, non modifié).
**Design** : aucune nouvelle couleur — réutilise `navy`/`gold`/`status-approved`/`status-pending`/`status-rejected` déjà définis dans `index.css`.
**Pages migrées** : `Personnel.jsx`, `Profil.jsx`, `Carriere.jsx`, `MaCarriere.jsx`, `Contrats.jsx`, `MesContrats.jsx`, `CongesAdmin.jsx`, `Conges.jsx`, `ValidationEquipe.jsx`, `MesDocuments.jsx`, `ApparenceSite.jsx`, `ParametresCarriere.jsx` (skeletons/toasts) + `AjouterEmployeModal.jsx`, `ModifierEmployeModal.jsx`, `Contrats.jsx` (modale non-renouvellement) migrées sur le composant `Modal` partagé.
**Non migré (volontairement)** : les ~60 autres pages gardent leurs boutons/cartes/tableaux existants tels quels.

### Toast / Error handling
**Statut** : fait.
**Architecture** : `client/src/context/ToastContext.jsx` (`ToastProvider`, monté dans `App.jsx` autour de toute l'app) + `client/src/components/ui/ToastContainer.jsx` (rendu, `aria-live="polite"`, empilement haut-droite) + `client/src/utils/toast.js` (API impérative singleton `toast.success/error/warning/info(message)`, utilisable sans hook depuis n'importe quel composant) + `useToast()` comme alternative React-idiomatique.
**Types supportés** : success, error, warning, info — chacun avec icône, couleur et durée d'auto-fermeture différenciées (erreur = 7 s, le reste 4-6 s), fermeture manuelle possible à tout moment.
**Gestion HTTP** : `client/src/utils/apiError.js` (`makeApiError`, `makeNetworkError`, `getFriendlyMessage`, `registerUnauthorizedHandler`) — voir section 11 ci-dessus pour le détail par code HTTP. Câblé dans `AuthContext.jsx` pour la déconnexion propre sur 401 en cours de session.
**Migré** : 4 `alert()` → `toast.error()` (+ `toast.success()` ajouté sur les sauvegardes qui n'avaient aucun retour visuel avant), 56 sites d'erreur API dans 7 fichiers `services/*.js` + `fileDownload.js`, 6 boutons d'action désormais protégés contre la double-soumission (`CongesAdmin.jsx`, `ValidationEquipe.jsx`, `Contrats.jsx` ×2, `Carriere.jsx`, `Personnel.jsx`).

### Skeleton loaders
**Statut** : fait pour les pages prioritaires, testé en navigateur réel (voir Tests manuels).
**Composants** : `Skeleton`, `SkeletonText`, `SkeletonAvatar`, `SkeletonCard`, `SkeletonTable`, `SkeletonPage` dans `client/src/components/ui/Skeleton.jsx`, chacun façonné sur la structure réelle de la page qui l'utilise (pas un rectangle générique).
**Pages concernées** : `Personnel.jsx` (liste), `Profil.jsx` (fiche), `Carriere.jsx`/`MaCarriere.jsx`, `Contrats.jsx`/`MesContrats.jsx`, `CongesAdmin.jsx`/`Conges.jsx`/`ValidationEquipe.jsx`, `MesDocuments.jsx`.
**Hors périmètre** : Dashboard (exclu explicitement de la mission), notifications, pages superadmin (comptes/permissions/corbeille).

### Éléments volontairement laissés en dehors du périmètre
- Migration des ~60 pages restantes vers les composants UI partagés (bibliothèque prête, adoption progressive recommandée).
- Bouton "Réessayer" générique sur les erreurs.
- Sections responsive/tablette non corrigées (`Conges.jsx`, `FicheDemande.jsx`, `Personnel.jsx`, `DocumentsAdmin.jsx` gardent leurs grilles fixes).
- Dashboards (exclu explicitement par la consigne pour la mission du 2026-09-19 ; skeletons ajoutés le 2026-09-20 sur demande explicite, sans autre changement fonctionnel).
- Sessions serveur (exclu explicitement par la consigne — confirmé architecturalement absent, nécessiterait de changer l'authentification JWT, ce qui était explicitement interdit).

---

# 📦 Extension skeleton loaders + réparation d'accès — bilan (2026-09-20)

### 1. Extension des skeleton loaders à 27 pages
Sur demande explicite ("ajoute le skeleton à toutes les pages, vraiment toutes"), les 17 pages restantes ayant un chargement de données asynchrone réel ont été skeletonnées, en plus des 10 déjà faites le 2026-09-19 — total **27 pages** :
`admin-rh/Dashboard.jsx`, `personnel/Dashboard.jsx`, `ComptesEnAttente.jsx`, `DemandesDocuments.jsx`, `DocumentsAdmin.jsx`, `EnvoyerNotification.jsx`, `GestionFonctions.jsx`, `Historique.jsx`, `Invitations.jsx`, `ParametresCarriere.jsx` (les 2 onglets), `NotificationsPage.jsx`, `MonEquipe.jsx`, `DocumentImprimable.jsx`, `FicheDemande.jsx`, `superadmin/Comptes.jsx`, `superadmin/Corbeille.jsx`, `superadmin/Permissions.jsx`, `superadmin/ApparenceSite.jsx`.
Chaque skeleton est façonné sur la structure réelle de sa page (cartes, tableau, avatar, liste...), pas un rectangle générique. Les pages sans fetch asynchrone (`Login.jsx`, `Register.jsx`, `Parametres.jsx` et ses onglets, `aide/*`) n'ont volontairement aucun skeleton — il n'y a rien à y remplacer.

### 2. Réparation de l'accès aux pages / sidebar
**Cause identifiée** : la table PostgreSQL `role_permissions` s'est retrouvée entièrement vide (0 ligne), sans lien avec ce chantier — vérifié par diff nul sur `Sidebar.jsx`/`PermissionContext.jsx` (jamais modifiés cette session) et par absence de toute requête destructrice sur cette table dans les logs PostgreSQL et dans tous les scripts de test de la session. Conséquence : aucun rôle, y compris SUPERADMIN, n'avait plus aucune permission active, donc la sidebar n'affichait quasiment plus rien (un seul onglet visible selon le rôle), et SUPERADMIN ne pouvait même plus accéder à sa propre page "Rôles & permissions" pour se réparer lui-même.
**Réparation effectuée** (après validation utilisateur) : permissions par défaut réinsérées dans `role_permissions`, basées sur les clés réellement référencées dans `menuConfig.js` (pas une invention arbitraire) — SUPERADMIN 25 permissions (toutes), ADMIN_RH 14, PE 7, PAT 7. Chaque insertion tracée dans `activity_log` (`permission_modifiee`).
**Aucune modification de code** n'a été nécessaire pour cette réparation — uniquement des données.

### 3. Vérification des permissions par rôle (comptes jetables, API directe)
- **PE** → `GET /api/personnel` → **403** confirmé (permission non accordée à PE, comportement attendu)
- **ADMIN_RH** → `GET /api/personnel` → **200** confirmé (permission restaurée)
- **SUPERADMIN** → vérifié indirectement via le rendu de la sidebar complète (Admin RH + Super Administration, ≥12 entrées) et l'accès sans erreur aux 4 pages `superadmin/*` ; pas de test API direct supplémentaire au-delà de ça
- **PAT** → non testé séparément de PE cette passe (même jeu de 7 permissions que PE, aucune raison technique de se comporter différemment) ; seul le rendu de la sidebar "Mon espace" a été vérifié via le compte PE

### 4. Tests effectués
- `npm test` (backend) → **13/13 ✅**
- `npm run build` (client) → **✅**, aucun import cassé
- `npx eslint src/pages` → aucune erreur nouvelle (résidu `react-hooks/set-state-in-effect` confirmé préexistant, présent aussi dans des fichiers jamais touchés comme `Login.jsx`)
- Tests navigateur réels (Chrome headless isolé, piloté en CDP, 4 comptes jetables `*_smoke_9999@example.test`) → **20/20 ✅** : sidebar ADMIN_RH/SUPERADMIN/PE, rendu sans erreur des 8 pages ADMIN_RH + 4 pages SUPERADMIN + 2 pages PE nouvellement skeletonnées, skeleton effectivement visible pendant un chargement réseau ralenti sur `Permissions.jsx` (capture d'écran), contrôle croisé des permissions API (403/200 ci-dessus)

### 5. Données métier réelles
Aucune donnée métier réelle n'a été modifiée. Les 4 comptes jetables (matricule `999941`/`999942`, emails `*_smoke_9999@example.test`) et leurs lignes `personnel`/`users` ont été créés puis intégralement supprimés après les tests — vérifié par requête de comptage (0 ligne restante). Les 6 utilisateurs réels et leurs données sont intacts (vérifié après coup). Seule modification de données réelle : le repeuplement de `role_permissions` (point 2), qui restaure un état fonctionnel plutôt que de modifier des données métier existantes.

### 6. Ce qui reste réellement à faire
- Configurer précisément les permissions ADMIN_RH/PE/PAT via la page "Rôles & permissions" selon les règles métier exactes de l'université (le jeu de permissions restauré est un défaut raisonnable basé sur `menuConfig.js`, pas une validation métier officielle) — SUPERADMIN peut le faire dès maintenant.
- Identifier la cause racine de la vidange de `role_permissions` (non déterminée avec certitude — aucune trace dans les logs applicatifs ni PostgreSQL disponibles).
- Vérifier séparément un compte PAT réel (non testé isolément cette passe, seul PE l'a été).
- Le reste du périmètre non couvert (migration des ~60 pages restantes vers les composants UI, bouton "Réessayer", responsive tablette) est inchangé par rapport au bilan du 2026-09-19 ci-dessus.

---

# 🟠 12. ⚙️ Paramètres — finalisation

*Statut vérifié le 2026-09-19. Plus avancé que la checklist ne le suggérait, mais 1 point (sessions) est une vraie limite d'architecture, pas un oubli.*

* 🟡 Paramètres de sécurité — seul le changement de mot de passe est réel ; rien au-delà (pas de 2FA, pas d'alertes de connexion)
* ✅ Gestion du mot de passe — fonctionnel, vérifie l'ancien mot de passe, logué dans l'audit
* ⬜ Gestion des sessions — **structurellement absent, pas juste "à coder"** : l'authentification est un JWT sans état (aucune table de sessions/refresh tokens côté serveur), donc "lister/révoquer les sessions actives" n'a rien à lire. L'UI actuelle affiche seulement le user-agent du navigateur courant, sans appel serveur. Implémenter ceci correctement veut dire ajouter une table de sessions et un mécanisme de révocation au milieu d'authentification — un changement d'architecture d'authentification, pas une simple case à cocher. **Non fait cette passe**, recommandé comme décision à prendre séparément plutôt que de le faire à la hâte au milieu d'un gros lot de tâches
* 🟡 Préférences de notifications — l'UI existe et fonctionne, mais uniquement en `localStorage` : rien côté serveur ne lit ces préférences, donc elles ne filtrent aucune notification réellement envoyée. Pas corrigé cette passe (implique de faire lire `notificationService.js` une table de préférences par utilisateur)
* 🟡 Préférences d'affichage — même limite (localStorage uniquement)
* 🟡 Accessibilité — idem
* 🟡 Langue — toggle présent, mais l'anglais est explicitement marqué "bientôt disponible" ; aucune vraie infrastructure i18n
* 🟡 Paramètres système — la partie "apparence du site" (nom/logo/couleurs/textes) est réelle et persistée en base ; la partie "Fonctionnalités/Maintenance" est entièrement figée en dur dans le code (`SystemeTabs.jsx`)
* ✅ Paramètres utilisateurs
* ✅ Paramètres rôles/permissions — désormais aussi journalisé dans l'audit (corrigé cette passe)
* ✅ Journal/audit

---

# 🟡 13. 📊 Dashboard — finalisation

*Statut vérifié le 2026-09-19. Non touché cette passe (chantier de développement à part entière, pas des corrections ponctuelles) — mais l'audit a établi précisément ce qui est réel vs manquant, utile pour prioriser une prochaine passe.*

### Admin RH

* ✅ Statistiques réellement connectées à la BDD — vérifié : vraies requêtes SQL, pas de valeurs figées
* ✅ Contrats bientôt expirés
* ⬜ Contrats expirés — pas de compteur distinct des "bientôt expirés" (30 jours seulement)
* 🟡 Statistiques PAT/PE/ELD — PE et PAT réels, **ELD absent** (n'existe que comme valeur d'un champ `corps`, jamais agrégé)
* 🟡 Événements RH importants — seulement le flux échéances + demandes de congé récentes, rien de plus large
* 🟡 Actions rapides — un seul lien ("Notifier"), pas un vrai panneau d'actions

### Personnel

* ⬜ Situation actuelle — absent du dashboard (existe seulement sur `MaCarriere.jsx`)
* ⬜ Contrat actuel — absent du dashboard (existe seulement sur `MesContrats.jsx`)
* ⬜ Date d'expiration — absent du dashboard
* ⬜ Indice — absent du dashboard
* ⬜ Événements carrière — absent du dashboard
* ⬜ Documents — absent du dashboard
* 🟡 Actions rapides — présentes mais génériques (raccourcis statiques Profil/Congés/Notifications), pas connectées aux données ci-dessus

### Super Admin

* ⬜ Vue système — **aucun dashboard Super Admin dédié n'existe** ; le rôle réutilise tel quel le dashboard Admin RH
* 🟡 Statistiques utilisateurs — seulement les chiffres génériques partagés avec Admin RH, rien de spécifique au rôle Super Admin
* ✅ Comptes en attente — réel (carte partagée avec Admin RH)
* ⬜ Rôles — existe comme page à part (`Permissions.jsx`) mais jamais résumé sur un dashboard
* ⬜ Permissions — idem
* ⬜ Audit — idem (`Historique.jsx` existe, non résumé sur un dashboard)
* ⬜ Sécurité — absent
* ⬜ Maintenance — absent, et la donnée sous-jacente est de toute façon figée en dur (voir section 12)

---

# 🟡 14. 📝 Journal d'audit

*Statut vérifié le 2026-09-19. Déjà largement fait ; 2 vrais trous trouvés et corrigés (connexion, changement de permission).*

* ✅ Enregistrer les actions importantes
* ✅ Connexion/déconnexion — **corrigé cette passe** : la connexion n'était pas loguée, c'est fait maintenant (`authService.js`). La déconnexion n'existe pas comme concept dans cette architecture (JWT sans état, pas de route `/logout`), donc rien à loguer côté serveur pour ça
* ✅ Création
* ✅ Modification
* ✅ Suppression
* ✅ Restauration
* ✅ Modification carrière
* ✅ Modification situation
* ✅ Modification indice
* ✅ Gestion contrat
* ✅ Renouvellement
* 🟡 Changement de rôle — n'existe pas comme fonctionnalité dans ce projet (le rôle d'un utilisateur n'est jamais modifié après sa création), donc rien à loguer ici ; à ne pas confondre avec le changement de fonction/grade qui, lui, est déjà logué
* ✅ Changement de permission — **corrigé cette passe** : n'était pas logué (`permissionController.js`), l'est maintenant
* ✅ Afficher qui a effectué l'action
* ✅ Afficher date/heure
* ✅ Interface de consultation de l'audit — `Historique.jsx`, filtrage côté client seulement (pas de filtre serveur au-delà de `limit`)

---

# 🟡 15. 🗄️ Vérification BDD

*Statut vérifié le 2026-09-19 (lecture de toutes les migrations + requêtes directes sur la DB réelle). 1 vrai trou trouvé et corrigé.*

* ✅ Vérifier les nouvelles tables/colonnes liées à la carrière
* ✅ Vérifier situation administrative
* ✅ Vérifier indices
* ✅ Vérifier contrats — **bug réel trouvé et corrigé** : aucune contrainte n'empêchait deux contrats "actif" simultanés pour la même personne (migration 009, `uniq_contrats_actif_par_personnel`), vérifié qu'aucune donnée réelle existante ne la violait avant de l'ajouter
* ✅ Vérifier renouvellements
* ✅ Vérifier notifications
* ✅ Vérifier audit
* ✅ Vérifier toutes les clés étrangères — toutes explicites avec `ON DELETE` géré (`SET NULL` pour les colonnes "auteur", `CASCADE` pour les colonnes "propriétaire")
* ✅ Vérifier contraintes `UNIQUE`
* ✅ Vérifier contraintes `NOT NULL`
* ✅ Vérifier les index
* ✅ Vérifier l'intégrité des données — aucune incohérence trouvée sur la DB réelle (ex. aucun personnel avec 2 contrats actifs avant l'ajout de la contrainte)
* 🟡 Tester les suppressions/modifications en cascade — vérifié pour contrats/carrière/situations/congés lors du nettoyage des comptes de test cette passe, pas systématiquement sur toutes les tables du projet

---

# 🟡 16. 🔌 API Backend

*Statut vérifié le 2026-09-19 (revue de toutes les routes mutantes du backend).*

* ✅ Vérifier toutes les routes carrière
* ✅ Vérifier routes situation administrative
* ✅ Vérifier routes indices
* ✅ Vérifier routes contrats
* ✅ Vérifier routes renouvellement
* ✅ Vérifier routes notifications
* ✅ Vérifier routes audit
* ✅ Vérifier validation des données
* 🟡 Vérifier les permissions de chaque endpoint — presque tout est `requireAuth` + `requirePermission`. 2 routes congés (`GET /pending-equipe`, `POST /:id/review-intermediaire`) n'ont que `requireAuth`, la vérification réelle (le demandeur est bien le validateur assigné) se fait dans le service. Fonctionnellement correct et vérifié par le code, mais fragile si le service change un jour — **non modifié cette passe** pour ne pas casser l'accès légitime des chefs de service (il n'existe pas de permission dédiée pour "valider les congés de son équipe" à réutiliser sans risque)
* ✅ Vérifier les réponses d'erreur

---

# 🟡 17. 🔒 Sécurité finale

*Statut vérifié le 2026-09-19. Le point le plus important de toute cette passe : une vraie fuite de documents a été trouvée et corrigée.*

* ✅ Vérifier que `.env` n'est pas envoyé sur GitHub
* ✅ Vérifier les permissions backend
* ✅ Vérifier l'accès aux documents — **faille réelle trouvée et corrigée** : les justificatifs de congés, de carrière, de situations administratives et les diplômes étaient servis sans aucune authentification via `express.static` (tout `/uploads/...` était public — n'importe qui avec le lien, même déconnecté, pouvait les lire). Seuls les contrats faisaient déjà les choses correctement. Corrigé : ces 3 types de documents passent maintenant par une route authentifiée avec vérification propriétaire/RH (comme les contrats) ; seules les photos de profil restent publiques (choix documenté : faible sensibilité, affichées comme avatars dans toute l'app, noms de fichiers aléatoires). Vérifié en direct : l'ancien lien statique renvoie désormais 404
* ✅ Vérifier l'accès aux contrats
* ✅ Vérifier l'accès aux données personnelles
* ✅ Vérifier les uploads — **renforcé cette passe** : en plus de l'extension déclarée, le contenu réel du fichier (magic bytes) est maintenant vérifié pour contrats/carrière/situations administratives/congés (les photos de profil le faisaient déjà) ; un fichier renommé en `.pdf` qui n'est pas un vrai PDF est désormais rejeté, vérifié en direct
* ✅ Vérifier les tailles de fichiers — déjà en place partout (limites `multer`)
* ✅ Vérifier les types MIME — voir "Vérifier les uploads" ci-dessus
* ✅ Vérifier les données sensibles dans les logs — aucune fuite de mot de passe/token trouvée dans les `console.log`/`console.error`

---

# 🟡 18. 🐛 Tests & corrections

*Cette passe elle-même : tests live sur serveur isolé (port 4001), comptes jetables créés/utilisés/nettoyés, jamais sur l'environnement réel de l'utilisateur.*

* ✅ Tester chaque fonctionnalité modifiée cette passe — contrats, situations administratives, carrière, congés, permissions, connexion : tous testés en direct (24/24 vérifications passées, comptes nettoyés après)
* 🟡 Tester le workflow complet d'un personnel — testé par morceaux (contrat + situation + carrière + congé), pas un unique scénario bout-en-bout continu
* 🟡 Tester un changement de situation — code non modifié cette passe, non re-testé (déjà validé lors d'une passe antérieure)
* ✅ Tester un changement d'indice — fait lors de la mission grilles indiciaires précédente
* ✅ Tester un renouvellement — testé en direct cette passe, bug d'ordonnancement trouvé et corrigé
* 🟡 Tester un non-renouvellement — code non modifié cette passe, non re-testé
* 🟡 Tester les notifications — code non modifié cette passe (hormis la journalisation), non re-testé
* ✅ Tester les permissions — matrice complète testée en direct : propriétaire OK, tiers refusé (403), RH OK, SUPERADMIN OK (bug corrigé)
* ✅ Tester l'accès aux PDF — testé en direct sur les 4 types de documents + rejet d'un faux PDF
* 🟡 Tester les trois rôles — PE testé (propriétaire et tiers), ADMIN_RH et SUPERADMIN testés ; PAT non testé spécifiquement (mêmes chemins de code que PE, risque faible mais non vérifié)
* ⬜ Vérifier la console navigateur — pas de test navigateur cette passe (vérifié uniquement par API directe + build)
* ✅ Vérifier les erreurs backend — logs du serveur de test surveillés pendant tous les tests, aucune erreur inattendue
* ✅ Vérifier PostgreSQL — migration 009 appliquée et vérifiée sur la DB réelle, `npm test` (13/13) et `npm run build` (client) passent

---

# 🟢 19. 📚 Documentation finale

* ⬜ Mettre à jour README
* ⬜ Architecture du projet
* ⬜ Installation
* ⬜ Configuration
* ⬜ Variables `.env`
* ⬜ Fonctionnalités
* ⬜ Rôles
* ⬜ Permissions
* ⬜ API
* ⬜ Structure PostgreSQL
* ⬜ Diagramme UML
* ⬜ Workflow carrière
* ⬜ Workflow contrat
* ⬜ Workflow renouvellement
* ⬜ Guide d'utilisation

---

# 🟢 20. 🚀 Validation finale

* ⬜ `npm run build` frontend OK
* ⬜ Backend démarre sans erreur
* ⬜ PostgreSQL fonctionne
* ⬜ Aucun import cassé
* ⬜ Aucune erreur console importante
* ⬜ Aucune erreur API importante
* ⬜ Tous les rôles fonctionnent
* ⬜ Responsive vérifié
* ⬜ Documents/PDF vérifiés
* ⬜ Permissions vérifiées
* ⬜ README finalisé
* ⬜ GitHub propre
* ⬜ Dernier commit
* ⬜ Déploiement final

---

# 📦 Situations administratives, Établissement, Congés et documents de congé — bilan (2026-09-20)

Quatre chantiers menés dans la même passe, avec les mêmes garde-fous : analyse avant modification, aucune donnée réelle supprimée, aucune réinitialisation PostgreSQL, comptes et fiches jetables supprimés après chaque test (0 résidu vérifié). Commits : `a1886da`, `4fb0cc1`, `f199114`.

### 1. Situations administratives — durcissement ✅ (priorité 3 terminée)
- **Bugs réels trouvés et corrigés** : course concurrente (3 POST simultanés → 2 situations ouvertes), chevauchement non détecté hors du cas « situation ouverte », même date de début acceptée (période de durée zéro), type inexistant qui fermait la situation en cours sans créer la suivante (pas de transaction), messages PostgreSQL bruts, `GET /:id` non numérique → 500 HTML.
- **Correction** : transaction + `SELECT … FOR UPDATE` sur la fiche, validation avant toute écriture, contrôle sur tout l'historique, `date_fin` = veille de la nouvelle date (suppression : supprimer puis rouvrir), erreurs 400/404/409 JSON. Migration `010` : index unique partiel (une seule situation ouverte par personnel).
- **Tests** : 57/58 puis 58/58 API (concurrence 5 POST → 1 seul succès, rollback vérifié), navigateur 17/17.

### 2. Suppression de « Établissement » ✅
Audit complet : aucune route, table, permission ni menu n'existait. Retirés : carte vide du profil, mentions de documentation et d'anciens prompts. Migration `011` : le type d'événement « Changement de service ou d'établissement » devient « Changement de service » (0 ligne concernée, garde-fou intégré). Le champ `etablissement` des **diplômes** (école/université) est conservé volontairement.

### 3. Congés — droits, reliquat, transactions ✅
- **Base juridique vérifiée dans les textes** : 2,5 jours par mois de service effectif, congé cumulable (Loi 2003-011 art. 64 ; Loi 2003-044 art. 86). Décret des fonctionnaires (art. 66) non localisé.
- **Bug corrigé** : `DEFAULT 30` + recharge annuelle de 30 = 60 jours. Autres défauts corrigés : années non créditées perdues (un seul « +30 »), solde négatif possible (contrôle et débit non atomiques), double restitution possible au refus, recharge et demande non transactionnelles.
- **Décisions validées** : mois complets seulement, `solde_conges` en `numeric(6,1)` avec `DEFAULT 0` (migration `012`), délai de 12 mois et prescription de 3 ans **non appliqués** (documentés), reliquat jamais supprimé, aucun recalcul rétroactif ni modification des soldes existants.
- **Architecture** : `congeDroitsService` (acquisition, source de vérité), `congeUtilisationService` (règles de prise, inchangées), `GET /conges/solde` (le frontend n'a plus aucun calcul métier). Seul le congé annuel consomme le solde.
- **Suivi par année** (migrations `013`–`015`) : droits annuels, imputations du plus ancien au plus récent, congés historiques, photographie du solde à la date de la demande, saisie d'ouverture RH depuis les états officiels (remplacement d'un solde non ventilé seulement sur confirmation, tracé).
- **Corbeille** : la restauration remet aussi les imputations et la photographie du solde.

### 4. Documents de congé ✅
- Modèles : trois fiches du Service du Personnel (demande de permission, décision, état de congé) — **utilisées uniquement comme modèles de mise en page, aucune donnée réelle d'agent n'est saisie ni versionnée**.
- **Fiche de demande** : service réel (plus de texte en dur), « Corps » = catégorie professionnelle, « Statut » = EFA/ELD/Fonctionnaire, nombre de jours, bloc « Service du Personnel » automatique, avis du chef de service en **QR code** signé (HMAC, clé `QR_SECRET`) ou motif du refus.
- **Page publique `/verification/:token`** : données minimales, relue en base à chaque scan, **limitée à 30 requêtes / 10 min / IP** (middleware `rateLimit`, sans dépendance). Robustesse : sans `QR_SECRET`, la fiche s'affiche avec l'avis en texte, la vérification répond 503 explicite et le serveur avertit au démarrage.
- **Décision d'octroi** (depuis un congé approuvé ou historique) et **état de congé** (total en chiffres et en lettres = solde). Certificat : catégorie + statut ; le rôle est maintenant fourni (un PE n'était jamais libellé « Enseignant »).

### 5. Tests et vérifications
`npm test` **63/63** (7 unitaires du calcul, 4 du jeton, 3 du limiteur, 3 de conversion en lettres, 21 d'intégration du solde + 12 des documents de congé, 13 grilles indiciaires), `npm run build` ✅, vérifications navigateur (Chrome headless isolé, comptes jetables) sur chaque chantier, aucune erreur console. Base réelle : 6 fiches, 6 utilisateurs, 2 congés, 7 documents, soldes inchangés (30, 30, 30, 30, 60, 30).
Incident maîtrisé : un script de test a cliqué le bouton « Générer la décision » d'un vrai congé approuvé et créé un document réel ; supprimé aussitôt, état vérifié.

### 5 bis. Sidebar en accordéon ✅ (2026-09-21)
- `Sidebar.jsx` : les catégories de plusieurs entrées (Carrière, Documents, Utilisateurs & comptes, Super Administration, Mon espace, Aide) deviennent des accordéons avec chevron ; **une seule ouverte à la fois**, par défaut celle de la page active ; les entrées seules restent des liens directs. `menuConfig.js`, permissions et routes **non modifiés**.
- Accessibilité et mobile : bouton `aria-expanded`/`aria-controls`, clavier (Entrée/Espace), contenu replié `inert`, cible tactile ≥ 40 px, tiroir mobile inchangé (se referme au clic sur un lien).
- Vérifié sur 4 rôles (Chrome headless, comptes jetables supprimés) : **mêmes liens, même ordre, mêmes libellés qu'avant** (17/13/11/9), hauteur du menu réduite (SUPERADMIN 939 → 394 px, ADMIN_RH 746 → 358, PE chef 501 → 405, PAT 421 → 325), 31/31 vérifications (accordéon, clavier, navigation, mobile 390, tablette 820, console sans erreur), build et lint OK.

### 6. Reste à faire
- **QR de la décision du RH** sur la fiche de demande (celui du chef de service existe déjà).
- **Soldes existants** : stratégie non tranchée (fiche 5 à 60 jours issue de l'ancien double comptage ; fiche 11 recevrait 30 jours de plus à sa première demande). Sans enjeu tant que ce sont des comptes de test ; pour de vrais agents, saisir les états de congé officiels via « Soldes d'ouverture ».
- **Points juridiques** : règle des 15 jours non confirmée pour les fonctionnaires, délai de 12 mois, prescription de 3 ans, plafond de cumul, congé annuel cumulé (permission de 20 jours).
- Comparer une **impression papier réelle** de la fiche, de la décision et de l'état avec les originaux (seul l'affichage écran a été testé).
- **Situation administrative** : lien avec les documents non décidé (« Grade : Stagiaire » vient-il de la situation ou d'un grade libre ?) ; aucune situation n'est saisie pour les 6 fiches.
- Les tests d'intégration ne tournent pas en CI (pas de PostgreSQL) : à prévoir si une base de test dédiée est créée.

---

# 📦 Modélisation de la base, identité visuelle — bilan (2026-09-21)

### Modélisation complète de la base (MCD, schema.sql, seeds)
- **Analyse réelle** : `pg_dump --schema-only` de `rh_mahajanga` (32 tables + vue `user_details`), code (24 routes, 24 repositories), migrations 001–015. MCD à 33 entités livré et validé (option B **restreinte** aux corrections compatibles avec le code actuel).
- **Corrections retenues** : B1 table `roles` + clés étrangères (supprime le rôle inutilisé `MESUPRES`), B3 `CHECK` sur les types de document, B6 index. **Abandonnées car elles auraient cassé le frontend/backend** : clé étrangère sur `personnel.service/direction` (import Excel en saisie libre), `CHECK` sur `carriere_evenements.fonction` (champ texte libre), colonnes de liens documents→congés (jamais alimentées), suppression des champs de contrat de `personnel` et rattachement des congés à `personnel` (refonte du backend) : documentés dans `server/database/MCD.md`.
- **Livrables** : `server/database/schema.sql`, `seed_reference.sql` (référence sans donnée personnelle), `seed_dev.sql` (9 fiches fictives, 9 comptes, congés avec droits/imputations/photographies de solde, états et décisions, contrats avec renouvellement, situations, notifications, corbeille, invitations…), `MCD.md`, `README.md`.
- **Tests (transaction annulée, aucune trace)** : comparaison structurelle avec la base réelle (colonnes, contraintes, index, vue : seuls les écarts voulus), chargement sans violation, invariants métier (solde = somme des restants par année sur les 3 fiches, photographies de solde, une situation ouverte et un contrat actif par personnel, validateur = chef du même service, liens JSON valides, numéros de document uniques), **14 insertions interdites bien refusées** (matricule invalide ou « 950-FOP », rôle inconnu, deuxième situation ouverte, deuxième contrat actif, dates inversées, type inconnu, doublons, clé étrangère…).
- **Reste à faire** : test de compatibilité runtime (backend `npm test` et navigation du frontend sur une base réellement créée) : `rh_admin` n'a pas le droit `CREATEDB`, il faut créer une base de test (`sudo -u postgres createdb -O rh_admin rh_mahajanga_test`) ; corrections structurelles B2/B4/B5/B8/B9 à traiter séparément avec adaptation du code et migration des données (fiches 2, 3, 4 : service « SI »/« DSI » ne correspond à aucun service).

### Identité visuelle
- Logo de l'université ajouté dans la **sidebar** (pastille blanche) et sur la **page de connexion** (le fichier `/logo-univ-mahajanga.png` était référencé mais absent : image manquante corrigée), **favicon** remplacée (l'icône Vite/React `favicon.svg` supprimée au profit de `favicon.png` + `apple-touch-icon.png`), **titre de l'onglet « client » → « SGRH »**.
- Vérifié (14/14) : fichiers servis, titre, lien favicon, logo chargé sur login et sidebar, pas de débordement (bureau et tiroir mobile), bouton fermer visible, aucune erreur console ; contrôle visuel des captures. Le sous-titre « Gestion des Ressources Humaines » passe sur deux lignes dans la sidebar (largeur inchangée de 256 px).

---

# 📦 « Mon dossier » enrichi — bilan (2026-09-21)

- **Analyse** : la page affichait identité, informations personnelles/administratives et parcours, mais ni l'état de carrière, ni le congé restant, ni la durée de contrat restante, ni la direction. Les données existaient déjà (`/situations-administratives/me`, `/contrats/me`, `/conges/solde`, `/personnel/me`, `/carriere/me`) : **aucune route, table ni migration ajoutée**.
- **Ajouts** (`Profil.jsx`, `utils/dossier.js`) : cartes **État de carrière**, **Congés** (solde calculé par le backend), **Contrat** (durée restante en mois/jours, progression, alerte < 6 mois au seuil backend de 183 jours, repli sur les champs historiques de la fiche) ; champ **Direction** ; libellé « Statut » de l'ancienne carte renommé « Type de contrat » pour ne plus être ambigu avec le statut EFA/ELD/Fonctionnaire. Le tableau de bord réutilise désormais les mêmes règles (`contratActuel`, `joursRestants`, libellés).
- **Bug réel corrigé** : les dates de la page étaient coupées au 10ᵉ caractère de l'ISO UTC, donc affichées avec **un jour de retard** (05/03/1990 → 04/03/1990) et le formulaire « Modifier mes informations » préremplissait la veille : **chaque enregistrement décalait la date d'un jour**. Corrigé (lecture avec les getters locaux) ; vérifié qu'un enregistrement sans modification ne dérive plus. Le même motif de découpe peut exister dans d'autres écrans (non audités).
- **Tests** (Chrome headless, 4 profils jetables supprimés ensuite) : **26/26** — carte carrière complète, situation et dernière évolution, solde 30 jours avec détail, contrat actif (durée restante 3 mois et 9 jours pour 100 jours, badge, barre à 50 %), contrat permanent historique, contrat expiré, agent sans aucune donnée, message sans date de recrutement, pas de dérive de date, mobile 390 et tablette 820 sans débordement, aucune erreur console. Build et lint OK.

---

# 📦 « Voir la fiche » côté RH / Super admin — bilan (2026-09-21)

- **Demande** : dans `/admin/personnel`, « Modifier la fiche » devient « Voir la fiche » (page dédiée) ; la page de la fiche reçoit un bouton « Modifier la fiche » aux mêmes fonctionnalités, avec état de carrière, congé restant et durée de contrat restante de la personne.
- **Backend** : `GET /api/personnel/:id` (lecture, `view_personnel`, 400/404 JSON, déclarée après les routes fixes) ; `GET /conges/suivi/:personnelId` enrichi du solde disponible (même `getSoldeDetails` que le dossier de l'agent). Aucune migration.
- **Frontend** : blocs du dossier extraits en composants partagés (`components/dossier/DossierBlocs.jsx`, règles dans `utils/dossier.js`) utilisés par « Mon dossier » et la nouvelle page `PersonnelFiche.jsx` (route `/admin/personnel/:id/fiche`, lecture seule, statut du compte, liens vers les pages RH). Le modal de modification a été déplacé de la liste vers la fiche.
- **Bug réel corrigé** : `ModifierEmployeModal` préremplissait la date de recrutement et l'échéance du contrat avec la veille (même coupe de chaîne ISO que côté personnel) : **chaque enregistrement décalait la date de recrutement d'un jour**, alors qu'elle pilote les droits à congé. Le même motif existe dans `Carriere.jsx` (modification d'un événement de carrière, lignes ~155-156), **non corrigé** car hors périmètre : à traiter.
- **Tests** : backend **65/65** (2 tests ajoutés : le suivi RH égale le dossier de l'agent, personnel sans compte consultable) ; navigateur **33/33** — API (200/403/401/404/400, routes fixes non capturées, chiffres RH = chiffres agent), liste (« Voir la fiche » présent, « Modifier la fiche » retiré), page (mêmes trois cartes au caractère près que côté agent, lecture seule, liens), modification (téléphone enregistré, date de recrutement inchangée), sans compte, SUPERADMIN, PE redirigé, fiche inexistante, mobile 390 et tablette 820, aucune erreur console. Base réelle inchangée (6 fiches, 6 utilisateurs).

---

# 📦 Résumé PE/PAT et gestion des directions & services — bilan (2026-09-22)

- **Demande** : sur `/admin/personnel`, afficher un résumé du nombre total de personnel (PE/PAT) ; rendre la table des directions et services modifiable par la RH (ajout/suppression d'une direction avec plusieurs services).
- **Résumé effectifs** (`Personnel.jsx`) : trois cartes (total, PE, PAT), calculées côté client sur la liste complète, indépendantes des filtres de recherche déjà présents. Aucune route ajoutée.
- **Backend organisation** : `organisationService.js` (nouveau, motif `OrganisationError` avec statut, même style que `congeOuvertureService`) + 4 routes (`POST`/`DELETE /organisation/directions`, `POST`/`DELETE /organisation/services`), gardées par une **nouvelle permission `manage_organisation`** (id 26, accordée à `ADMIN_RH`, héritée par `SUPERADMIN` via `rolesToCheck`). Aucune migration : `directions`/`services` existaient déjà. `permissions`/`role_permissions` mis à jour en base réelle et dans `server/database/seed_reference.sql`, tracé dans `activity_log`.
- **Règles de suppression** (`personnel.direction`/`personnel.service` sont du texte libre, sans clé étrangère — voir `MCD.md`) : une direction est refusée à la suppression si elle a encore des services (409, "N service(s) en dépendent") ou si des fiches personnel la référencent par nom (409) ; un service est refusé s'il est encore référencé par nom. Pas de cascade automatique, pas de renommage (hors périmètre demandé). Création : nom requis, ≤150 caractères, doublon → 409 propre (pas d'erreur SQL brute).
- **Frontend** : nouvelle page `OrganisationRH.jsx` (`/admin/organisation`, lien "Gérer les directions & services" depuis `/admin/personnel`, entrée de sidebar sous "Personnel"), directions en accordéon avec leurs services, formulaires d'ajout, `ConfirmDialog` pour la suppression, messages d'erreur du backend affichés via `toast`.
- **Tests** : backend **72/72** (7 tests ajoutés : création, validations, doublons, direction bloquée par ses services, direction/service bloqués par du personnel rattaché, suppression réussie sans dépendance, identifiants invalides). Navigateur **29/29** — permissions (403 PE/PAT, 401 sans jeton, hérité par SUPERADMIN), validations, suppression bloquée avec message explicite puis réussie une fois débloquée, création via formulaire, résumé PE/PAT exact (comparé au compte réel via API), lien conditionné à la permission, PE redirigé hors des deux pages, mobile 390 sans débordement, aucune erreur console. Build et lint sans régression (les erreurs de lint restantes dans `Personnel.jsx`/`OrganisationRH.jsx` — composant déclaré pendant le rendu, `setState` dans un effet — sont préexistantes/pervasives dans l'app, 40 occurrences ailleurs, non corrigées pour rester dans le périmètre). Base réelle inchangée (6 fiches, 6 utilisateurs, 3 directions, 12 services).

---

# 📦 Recherche personnel (nom/matricule) et pleine largeur — bilan (2026-09-23)

- **Demande** : sur Carrière, Fonctions, Contrats, Documents administratifs et Demandes de documents, remplacer le défilement dans un `<select>` par une recherche puis sélection ; revoir le design de ces pages en pleine largeur, avec des éléments internes adaptés.
- **Composant partagé** : `client/src/components/PersonnelSearchSelect.jsx` — combobox accessible (`role=combobox`/`listbox`, `aria-expanded`, `aria-activedescendant`), recherche par nom/prénom/matricule (`includes`, insensible à la casse), clavier (flèches, Entrée, Échap), bouton d'effacement, valeur dérivée au rendu (pas d'effet de synchronisation, pour éviter le motif `setState` dans un effet que ce fichier aurait sinon ajouté à l'app). Utilisé dans **Carrière**, **Contrats**, **Documents administratifs**, **Fonctions** (les trois premières sur `personnel`, Fonctions sur `users` — `GET /api/users` renvoie désormais aussi `matricule`/`nom`/`prenom`, additif, seul changement backend de cette tâche). **Demandes de documents** garde sa grille de cartes mais gagne un filtre texte par nom/matricule au-dessus (le matricule, déjà renvoyé par l'API, est aussi maintenant affiché sur chaque carte).
- **Pleine largeur** : les 5 pages perdent leur `max-w-6xl`/`max-w-5xl` et utilisent tout l'espace jusqu'au plafond de 1600px d'`AppShell` (comme `Personnel.jsx`/`CongesAdmin.jsx`/`Dashboard.jsx` le faisaient déjà) ; leurs grilles de formulaire existantes (`sm:grid-cols-3/4`) s'élargissent proportionnellement sans rien casser (vérifié par capture à 1920px : rendu propre, pas d'espace mort ni de champs déformés). **Scope volontairement limité à ces 5 pages**, pas à tout l'admin : un premier essai d'élargir aussi `Historique.jsx` (journal d'audit) a été fait puis **annulé** — c'est un flux de lecture (comme « Mon dossier »), pas une page de gestion, et le rendait pas plus lisible ; les autres pages admin (`Invitations.jsx`, `EnvoyerNotification.jsx`, `OrganisationRH.jsx`, `ParametresCarriere.jsx`, `PersonnelFiche.jsx`, `OuvertureSoldes.jsx`) ne sont pas touchées, plusieurs étant volontairement étroites par nature (formulaire court, dossier en lecture).
- **Tests** : backend **72/72** (inchangé, aucune logique métier modifiée). Navigateur, Chrome headless, compte et 5 personnels jetables (matricules `9999xx`, supprimés en fin de test) : **33/33** — recherche par prénom/matricule filtre au bon résultat, sélection à la souris et au clavier, bouton d'effacement, chargement correct de la fiche/des contrats/du formulaire de fonction pour la personne choisie, filtre de Demandes de documents (avec et sans résultat), pleine largeur mesurée (≥1500px à 1920px), mobile 390 sans débordement **et liste déroulante qui s'ouvre bien dans l'écran** (un premier passage avait donné un faux négatif : `.click()`/`.focus()` déclenchés via `Runtime.evaluate` ne posent pas le focus natif en Chrome headless — confirmé et corrigé en rejouant avec un vrai clic CDP `Input.dispatchMouseEvent`, qui fonctionne), aucune erreur console. Un artefact similaire (redirection vers `/login`) est apparu en enchaînant 5 rechargements complets dans une même session de script — confirmé comme un artefact du script (`Page.navigate` = rechargement complet à chaque étape, jamais fait par un utilisateur réel qui navigue via les liens de la sidebar en SPA) et non reproductible page par page.
- **Build et lint** : verts ; le nouveau composant n'introduit aucune erreur de lint (le motif `setState` dans un effet, déjà présent ~40 fois ailleurs dans l'app, a été évité dès l'écriture plutôt que reproduit).

---

# 📦 Superadmin → Paramètres → Personnalisation — bilan (2026-09-23)

- **Demande** : donner au Superadmin un espace « Personnalisation » (Apparence / Contenu / Informations institutionnelles) sans créer de nouvelles routes ni menus librement définissables, en réutilisant `site_settings`/`site_texts` plutôt qu'en créant de nouvelles tables.
- **Réutilisation confirmée** : `site_settings` (couleurs + désormais logo/favicon) et `site_texts` (via `useText`, mécanisme d'auto-enregistrement déjà en place) ont suffi pour tout le contenu ; **aucune nouvelle table**. Un seul changement de schéma, minimal : `site_settings.value` élargi de `VARCHAR(20)` à `VARCHAR(255)` (migration `016_widen_site_settings_value.sql`) car il ne pouvait stocker que des couleurs `#RRGGBB`, pas un chemin de fichier logo (`/uploads/site/<uuid>.png`).
- **Apparence** : upload logo principal / favicon / logo de connexion (optionnel) — nouvelles routes `POST /api/site-settings/{logo,favicon,logo-connexion}` (`manage_site_settings`, même permission que les couleurs), stockage `uploads/site/` servi publiquement comme `uploads/profile-photos/` (même justification : fichiers à faible sensibilité, noms UUID), ancien fichier supprimé au remplacement. Couleurs existantes reclassées clairement : il n'existe que 2 variables CSS d'accent dans le projet (`--color-navy`, `--color-gold`), donc « couleur principale/boutons » et « couleur secondaire/sidebar active » pointent chacune vers l'une d'elles (transparent dans l'UI, pas de fausse 4ᵉ couleur inventée). Mode clair/sombre : déjà existant **par utilisateur** (pas une bascule globale) — expliqué dans la page plutôt que dupliqué.
- **Persistance des couleurs corrigée** : avant cette tâche, une couleur enregistrée n'était appliquée qu'en mémoire, sur l'onglet d'où elle avait été changée — perdue au rechargement. Nouveau `client/src/context/SiteSettingsContext.jsx` (même schéma que `TextContext`) applique couleurs et favicon à `document.documentElement`/`<link rel="icon">` **à chaque démarrage de l'app**, pour tout le monde.
- **Contenu** : formulaires dédiés (au lieu de la seule liste générique clé/valeur) pour Page de connexion (titre, sous-titre, message d'accueil — `login.slogan` existait déjà côté `Login.jsx` mais n'était jamais affiché, corrigé), Pied de page (`Footer.jsx` était intégralement codé en dur, maintenant sur `useText`), Messages système (connexion refusée : message différent pour compte **en attente** vs **désactivé**, ajouté côté serveur dans `authService.js` puisque `useText` n'existe que côté React — mode maintenance non implémenté dans l'app, donc rien à personnaliser pour cet élément, signalé tel quel plutôt qu'inventé) et Libellés de navigation. La liste générique existante (« Textes ») est conservée, repliée sous « Autres textes », pour ne rien retirer.
- **Libellés de navigation — 6 clés fixes seulement** (Dashboard, Personnel, Carrière, Congés, Documents, Paramètres), appliquées par une table de correspondance au **rendu** dans `Sidebar.jsx`/`TopBar.jsx` : `menuConfig.js` n'est pas touché, les clés React (accordéon ouvert/fermé), permissions et chemins restent ceux du code. Le Superadmin ne peut ni créer, ni renommer, ni déplacer une entrée de menu.
- **Informations institutionnelles** : nom, nom court, adresse, téléphone, email, site officiel — tous vides par défaut sauf le nom (déjà utilisé partout dans l'app), pour ne rien inventer.
- **Page** : `ApparenceSite.jsx` restructurée en 3 onglets (auparavant Couleurs/Textes), renommée « Personnalisation » dans le menu (`Palette`, même route `/superadmin/apparence`, mêmes permissions `manage_site_texts`/`manage_site_settings`, déjà exclusives au rôle SUPERADMIN en base — vérifié, aucune permission à créer).
- **Tests** : backend **72/72** inchangé. Vérifications directes en HTTP (compte SUPERADMIN jetable) : messages pending/inactive distincts, upload logo/favicon (200, fichier servi, ancien supprimé au remplacement), couleur et texte enregistrés et tracés dans `activity_log`, un compte ADMIN_RH jetable reçoit bien 403 sur les 3 routes protégées. Navigateur (Chrome headless, même compte) : page de connexion (slogan affiché, pied de page dynamique), les 3 onglets de Personnalisation, upload avec aperçu, modification d'un libellé de menu répercutée dans la sidebar **sans rechargement complet** (juste en changeant de page), aucune erreur console. Toutes les données de test supprimées et les couleurs/textes remis à leur valeur d'origine ensuite. `npm run build` OK.
- **Reste hors périmètre** (signalé, pas oublié) : les deux variables `login.titre_universite_1`/`_2` existaient déjà avant cette tâche, récupérées par `useText` mais jamais affichées dans `Login.jsx` (erreur de lint `no-unused-vars` préexistante) — non touchées pour ne pas changer le design actuel de la page de connexion sans le demander explicitement.

---

# 📦 Nouveau design de la page de connexion — bilan (2026-09-23)

- **Demande** : reprendre visuellement une maquette de référence (carte flottante, panneau gradient violet/bleu avec icône « sparkle » à gauche, formulaire blanc épuré à droite) sur `/login`, sans toucher à aucune fonctionnalité.
- **Périmètre strictement visuel** : `client/src/pages/Login.jsx` seulement — `handleSubmit`, `useAuth().login`, les états (email, mot de passe, affichage du mot de passe, « se souvenir de moi », erreur, chargement), tous les `useText` (mêmes clés/valeurs par défaut, toujours personnalisables depuis Personnalisation → Contenu), le logo dynamique (`site_settings`) et `Footer` sont **inchangés au niveau du code**, seuls le JSX/les classes ont changé. Le dégradé violet/bleu est local à cette page (style inline), **pas** un changement des variables `--color-navy`/`--color-gold` globales du reste de l'application.
- **Icône** : `Sparkle` de `lucide-react` (déjà une dépendance du projet), pas de nouvelle dépendance.
- **Tests** : `npm run build` et lint OK (mêmes 2 erreurs préexistantes et non liées — `titreUniversite1`/`_2` jamais affichés, déjà signalées dans le bilan précédent). Vérifié en navigateur (Chrome headless) sur desktop (1400px) et mobile (390px, la carte s'empile proprement) : saisie réelle au clavier, clic réel sur « Se connecter » avec un compte jetable → connexion réussie et redirection correcte, aucune erreur console. Compte de test supprimé ensuite.

---

# 📦 Vider la corbeille + activité récente centrée sur le personnel — bilan (2026-09-23)

- **Demande** : ajouter un moyen de vider entièrement la corbeille ; sur le tableau de bord Superadmin, limiter « Activité récente » aux 10 dernières entrées et ne plus y afficher les connexions, pour laisser la place à l'activité du personnel (congés, documents, modifications...).
- **Vider la corbeille** : nouvelle route `DELETE /api/corbeille/vider` (déclarée **avant** `DELETE /:id` dans `corbeille.routes.js` — sinon `:id` capturerait « vider » comme identifiant), `corbeilleRepository.removeAll()` (`DELETE FROM corbeille` sans condition), tracée dans `activity_log` (`corbeille_videe`) seulement si au moins un élément a été supprimé. Toujours réservée à `manage_corbeille` (SUPERADMIN uniquement, vérifié). Côté page (`Corbeille.jsx`), un bouton « Vider la corbeille » n'apparaît que si la corbeille n'est pas vide, avec la même confirmation en deux temps que la suppression individuelle déjà en place.
- **Activité récente** : `getActivityLog(limit, exclude)` accepte désormais une liste de `action_type` à exclure (`GET /api/activity-log?exclude=connexion`, paramètre optionnel, **comportement par défaut inchangé** pour Historique.jsx qui continue d'afficher tout). Le badge affiche maintenant le libellé français + couleur (« Demande de congé », « Solde de congé saisi »...) au lieu du type brut (`conge_demande`) : la table `ACTION_LABELS`, qui n'existait que dans `Historique.jsx`, a été déplacée vers `client/src/constants/activityLabels.js` (réutilisée par les deux pages, rien dupliqué) et complétée des 7 types qui n'y figuraient pas encore (`permission_modifiee`, `conge_ouverture_saisie`, les 4 événements `organisation_*`, `connexion`).
- **Ajustement (même journée)** : la première version (10 entrées, non repliable) prenait trop de place. Par défaut **5 dernières**, avec un menu déroulant (5 / 10 / 20) qui ne recharge que le widget (`useEffect` séparé du chargement initial du tableau de bord, pas besoin de tout re-fetcher). Au-delà de 5 entrées visibles, la liste est plafonnée à `max-h-80` avec défilement interne (`overflow-y-auto`) — le reste de la page ne bouge plus, seul ce bloc défile, comme la liste des notifications (`NotificationBell.jsx`) qui suit déjà ce même principe ailleurs dans l'app.
- **Tests** : backend 72/72 inchangé. Vérifié en HTTP direct (compte SUPERADMIN jetable) : 401 sans jeton et 403 pour un compte ADMIN_RH sur `/corbeille/vider`, `exclude=connexion` filtre bien les entrées renvoyées, et la route `/:id` existante refonctionne normalement après l'ajout de `/vider` (testé sur un élément jetable créé puis supprimé définitivement). **La suppression réelle de « vider la corbeille » n'a volontairement pas été testée de bout en bout contre la base réelle** : elle contient une quarantaine d'éléments déjà présents (visiblement d'anciens comptes de test), et les supprimer définitivement aurait été irréversible sans certitude qu'ils ne servaient plus à rien — vérifié uniquement par revue de code (la requête SQL est aussi simple et sûre que celle, déjà en production, de la suppression d'un seul élément) et par capture d'écran du bouton et de l'état de confirmation. Vérifié en navigateur : 5 entrées par défaut, aucune « connexion », libellés français colorés, passage à 20 confirmé avec défilement interne visible et le reste du tableau de bord immobile ; build et lint sans régression.

---

# 📦 Qualité du mode sombre + placement du bouton — bilan (2026-09-23)

- **Demande** : « améliorer la qualité du mode sombre et bien placer son bouton ».
- **Fondation (`index.css`)** : `html`/`body` n'avaient **aucune** règle `dark` — fond clair (`#f8fafc`) et texte foncé (`#1e293b`) fixes, sans lien avec la classe `.dark` posée sur `<html>` par `ThemeContext`. Concrètement : au chargement d'une page ou sur toute zone que `min-h-screen`/les conteneurs ne couvrent pas exactement, un bord ou un flash clair apparaissait derrière l'interface sombre. Ajout de `html.dark { background: #030712 }` (même gris que le fond extérieur d'`AppShell`) et `html.dark body { color: #f3f4f6 }` (même gris clair que le texte principal utilisé partout ailleurs).
- **`NotificationBell.jsx` — bug réel trouvé** : composant utilisé sur **toutes** les pages via `TopBar`, entièrement dépourvu de classes `dark:` (fond, texte, survols). En mode sombre, ouvrir les notifications affichait un panneau **blanc** avec du texte foncé, alors que le reste de l'interface est sombre — la régression la plus visible du lot. Aligné sur la palette déjà utilisée par le menu profil du même `TopBar.jsx` (`bg-white dark:bg-gray-800`, bordures `dark:border-gray-700`, texte `dark:text-gray-100`/`dark:text-gray-400`, survols `dark:hover:bg-gray-700`).
- **Placement/style du bouton (« bien placer son bouton »)** : `ThemeToggle` et le déclencheur de `NotificationBell` étaient deux icônes nues sans zone cliquable définie (pas de `padding`, pas de fond au survol), contrairement au bouton hamburger du même `TopBar.jsx` qui, lui, a toujours eu `rounded-md p-1.5 hover:bg-slate-100 dark:hover:bg-gray-700`. Les deux boutons reprennent maintenant exactement ce style : même taille, même zone de survol, alignés à la même hauteur que la cloche et l'avatar — plus une icône flottante isolée. `aria-label` ajouté sur les deux (absent avant). Espacement de la rangée resserré (`gap-2 sm:gap-4` → `gap-1 sm:gap-2`) car les boutons ont maintenant leur propre respiration interne.
- **Autres écrans sans aucune classe `dark:`** (repérés par recherche systématique — fichiers contenant `bg-white`/`text-navy`/`text-gray-400/500` sans un seul `dark:` dans tout le fichier) : `Calendar.jsx` (mini-calendrier des congés), `ProtectedRoute.jsx` (écran « accès non autorisé »), `personnel/Conges.jsx` (formulaire de demande de congé, page réellement utilisée au quotidien par PE/PAT — carte, champs, liste des demandes), `Register.jsx`, `MotDePasseOublie.jsx`, `ReinitialiserMotDePasse.jsx` (pages publiques, atteignables en mode sombre car `ThemeProvider` englobe toute l'app y compris hors connexion). Tous complétés avec les mêmes couples de couleurs déjà utilisés ailleurs (`bg-white dark:bg-gray-800`, `border-gray-300 dark:border-gray-600 dark:bg-gray-700`, `text-gray-700 dark:text-gray-300`, etc.) — **aucune nouvelle couleur inventée**.
- **Délibérément non touchés** : `FicheDemande.jsx`, `DocumentImprimable.jsx`, `components/documents/DocumentsConge.jsx` — ce sont les gabarits des fiches imprimables (bordures noires, mise en page papier) ; les laisser figées en clair est correct, un mode sombre y nuirait à l'impression. `Sidebar.jsx` (faux positif de la recherche : fond navy et actif or **volontairement fixes** dans les deux modes, comme le panneau gradient de la page de connexion — ce sont des couleurs de marque, pas des surfaces neutres).
- **Tests** : build et lint sans régression (aucune nouvelle erreur ; les erreurs `set-state-in-effect` déjà signalées comme préexistantes dans `Corbeille.jsx`/`Conges.jsx` n'ont pas changé). Vérifié en navigateur (Chrome headless, compte PAT et page publique jetables) : fond `html`/`body` correctement sombre au premier chargement (`/register`, `/mot-de-passe-oublie` avant toute connexion), `Conges.jsx` entièrement lisible en sombre, notifications ouvertes en sombre (panneau sombre, plus de flash blanc), bascule clair → sombre au clic vérifiée par l'état réel de la classe `.dark` sur `<html>` (pas seulement visuellement), aucune erreur console, mobile 390px sans débordement horizontal. Compte et fiche personnel jetables supprimés ensuite.
- **Écart annexe constaté, pas une régression** : les couleurs `color_navy`/`color_gold` affichées lors de la vérification n'étaient plus les valeurs d'usine (`#02295d`/`#F2B705`) mais des tons violet/bleu (`#593af2`/`#687eee`) — c'est `site_settings` en base, modifié depuis Paramètres → Personnalisation → Apparence (fonctionnalité livrée plus tôt cette même journée) : la personnalisation fonctionne et s'applique bien globalement comme prévu. Non modifié à cette occasion, aucune raison de le faire sans que ce soit demandé.

---

# 📦 Contenu de l'Aide éditable + réclamations du personnel — bilan (2026-09-23)

- **Demande** : rendre le contenu des 3 pages Aide (« Par où commencer », « Vos droits », « Les procédures ») modifiable par le Superadmin ; ajouter un onglet Aide pour que le personnel signale un problème au Superadmin.
- **Aide éditable** : les 3 pages (`client/src/pages/aide/*.jsx`) passaient d'un contenu codé en dur à `useText('aide.xxx', DEFAUT, 'Aide')`, le texte par défaut reprenant **mot pour mot** le contenu déjà en place (rien inventé, seule sa modifiabilité change) — rendu en `whitespace-pre-line` pour garder les sauts de ligne sans gérer de HTML éditable. Un nouveau bloc « Aide (personnel) » dans Paramètres → Personnalisation → Contenu (`ApparenceSite.jsx`) expose les 3 champs en `textarea` (mêmes composants `ChampTexte`/`Section` déjà utilisés pour la page de connexion, le pied de page, etc. — `rows` rendu configurable par champ, 6-8 lignes ici contre 2 par défaut, pour ces textes plus longs).
- **Réclamations — nouvelle table dédiée** (`reclamations` : `auteur_id`, `sujet`, `description`, `statut` ouverte/traitee, `reponse`, `traite_par`, `traite_le`), pas une réutilisation de `notifications` : `notifications` est une annonce à sens unique par destinataire, sans champ pour que l'auteur décrive un problème ni notion de statut/réponse — la détourner aurait mélangé deux besoins différents plutôt que d'ajouter une table de plus, cohérente avec `demandes_documents` déjà dans le même esprit (auteur, statut, traitement). `auteur_id`/`traite_par` en `SET NULL` (comme `activity_log.user_id`) : une réclamation reste dans l'historique même si le compte de son auteur est supprimé plus tard.
- **Backend** : `POST /api/reclamations` (personnel, permission `signaler_probleme`, nouvelle — PE et PAT) déclenche aussi une notification au rôle SUPERADMIN via `notificationService.sendNotification` déjà existant (échec de la notification non bloquant pour l'enregistrement de la réclamation) ; `GET /api/reclamations/me` (même permission, suivi par l'auteur) ; `GET /api/reclamations` et `PATCH /:id/traiter` (permission `manage_reclamations`, nouvelle — **SUPERADMIN uniquement**, conformément à la demande explicite « au superadmin », pas héritée par ADMIN_RH). Traiter une réclamation exige une réponse non vide ; deux permissions ajoutées en base + `seed_reference.sql` (`signaler_probleme` id 27 → PE/PAT ; `manage_reclamations` id 28 → SUPERADMIN), migration `017` pour la table.
- **Frontend** : `client/src/pages/aide/Reclamation.jsx` (`/aide/signaler`, nouvel item dans le menu Aide du personnel) — formulaire sujet/description à gauche, liste de ses réclamations avec statut et réponse à droite, même schéma que `Conges.jsx`. `client/src/pages/superadmin/Reclamations.jsx` (`/superadmin/reclamations`, nouvel item « Super Administration ») — réclamations ouvertes en tête avec formulaire de réponse inline, traitées en dessous repliées visuellement (`opacity-75`), même schéma que `DemandesDocuments.jsx`.
- **Tests** : backend 72/72 inchangé. Vérifié en HTTP direct (comptes PE et SUPERADMIN jetables) : dépôt d'une réclamation, notification bien reçue par le Superadmin, 403 pour PE sur `GET /reclamations` et `PATCH .../traiter`, 400 si réponse vide, traitement réussi, la réponse redescend bien côté `GET /reclamations/me`. Vérifié en navigateur : page « Signaler un problème » (formulaire + historique avec réponse affichée), page Superadmin « Réclamations » (badge de notification sur la cloche, réclamation traitée affichée avec réponse), section « Aide (personnel) » dans Personnalisation → Contenu affichant bien les 3 textes par défaut, modification d'un texte d'Aide confirmée en direct (lue par `GET /api/site-texts`) puis remise à sa valeur d'origine. Aucune erreur console. Build et lint sans régression (les deux erreurs `set-state-in-effect` sur les 2 nouvelles pages suivent le même motif déjà présent partout ailleurs dans l'app, pas une régression introduite ici).

---

# 📦 Journal d'audit scindé par rôle + mode sombre de la sidebar — bilan (2026-09-23)

- **Demande** : l'Admin RH ne doit pas voir dans son propre journal d'activité ce que le Superadmin a fait (modifications de rôles/permissions, etc.) — seulement son propre périmètre (contrats, congés...) — alors que le Superadmin doit continuer à tout voir, y compris ce que fait l'Admin RH ; améliorer le mode sombre de la sidebar et des couleurs associées.
- **Journal d'audit scindé** : `GET /api/activity-log` (`activityLogController.js`) écarte désormais automatiquement, pour tout appelant qui n'est pas SUPERADMIN, une liste fixe de types réservés aux permissions exclusives au Superadmin (`compte_desactive/reactive/supprime` → `manage_accounts`, `element_restaure/element_supprime_definitivement/corbeille_videe` → `manage_corbeille`, `permission_modifiee` → `manage_permissions`, `apparence_modifiee/texte_modifie` → `manage_site_settings`/`manage_site_texts`, `reclamation_deposee/traitee` → `signaler_probleme`/`manage_reclamations`). **Interprétation** : le filtre porte sur le *type* d'action (ce qui n'est atteignable que via une permission Superadmin), pas sur l'auteur — si un compte Superadmin traitait lui-même un congé (action qu'un Admin RH peut aussi faire), elle resterait visible côté RH ; à corriger si l'intention était plutôt de masquer tout ce qu'un compte Superadmin fait, quel que soit le type. Le paramètre `exclude` existant (ajouté plus tôt le même jour pour le tableau de bord) ne peut pas être détourné pour réafficher ces types : le filtre serveur les ajoute toujours en plus de ce que le client demande, jamais en retrait.
- **Sidebar en mode sombre** : la sidebar restait toujours `bg-navy` (couleur de marque fixe), quel que soit le thème — contrairement à la page de connexion (choix déjà justifié : bannière de marque). Passage à `bg-navy dark:bg-gray-950`, ce qui donne en sombre un panneau nettement plus foncé que la zone de contenu (`dark:bg-gray-900` sur `AppShell`), une hiérarchie visuelle habituelle dans ce genre d'interface plutôt qu'un même bloc de couleur vive dans les deux thèmes.
- **Autres écarts trouvés en vérifiant** (pages avec *une partie* de leurs classes déjà en `dark:` mais pas toutes — ratées par le grep « aucun `dark:` dans le fichier » de la passe précédente) : `admin-rh/Dashboard.jsx` (cartes de statistiques, calendrier, « Dernières demandes »), `admin-rh/CongesAdmin.jsx` (cartes de demandes en attente), `admin-rh/OuvertureSoldes.jsx` (quelques textes secondaires) — corrigés avec les mêmes couples de couleurs déjà utilisés ailleurs. **Non exhaustif** : un balayage plus large (comptage `text-gray-400/500`, `bg-white` avec/sans `dark:` associé par fichier) a trouvé une trentaine d'autres fichiers avec une couverture partielle similaire (`superadmin/Comptes.jsx`, `admin-rh/OrganisationRH.jsx`, `personnel/MaCarriere.jsx`, `NotificationsPage.jsx`...) — pas corrigés à ce passage faute de les avoir vérifiés un par un ; à traiter si voulu.
- **Tests** : backend 72/72 inchangé. Vérifié en HTTP direct (comptes ADMIN_RH et SUPERADMIN jetables) : les types réservés disparaissent bien de la réponse pour l'Admin RH, restent tous présents pour le Superadmin. Vérifié en navigateur (mode sombre forcé) : sidebar visiblement plus sombre que le contenu, `admin/conges` entièrement lisible (cartes, formulaire de solde d'ouverture), aucune erreur console. Build et lint sans régression.

---

# 📦 Généralisation des permissions à n'importe quel rôle — bilan (2026-09-24)

- **Demande** : accorder une permission à un rôle inhabituel (ex. « supprimer un compte » donné à un PAT) ne se voyait nulle part — l'item de menu et la page restaient invisibles pour ce rôle. Confirmé via `Rôles & permissions` : la page permet de cocher **n'importe laquelle** des 4 rôles pour **n'importe quelle** permission, une promesse que le reste de l'app ne tenait pas. Deux options proposées (correctif ciblé sur la gestion des comptes, ou généralisation complète) — généralisation complète retenue.
- **Cause réelle, à deux niveaux, tous deux indépendants de la permission réellement accordée** :
  1. `ProtectedRoute.jsx` verrouillait chaque route admin/superadmin sur un `allowedRoles` figé (ex. `['SUPERADMIN']`) vérifié **avant** la permission — un rôle non prévu était donc redirigé, même titulaire de la permission.
  2. `Sidebar.jsx` n'affichait que le menu figé du rôle de l'utilisateur (`menuConfig[role]`) — un PAT n'a simplement jamais accès aux entrées définies dans le bloc SUPERADMIN, quelle que soit sa permission : rien à filtrer, l'entrée n'existe pas dans son menu candidat.
  Le backend, lui, était déjà correct : chaque route API vérifie `requirePermission(...)`, sans jamais regarder `allowedRoles` — implique que la sécurité réelle n'a jamais été affaiblie, seul le routage/menu **frontend** ignorait la permission.
- **`ProtectedRoute.jsx`** : quand une route précise une `permission`, elle devient la **seule** autorité — `allowedRoles` n'est plus vérifié du tout dans ce cas. `allowedRoles` reste un verrou dur uniquement pour les routes sans permission associée (espace personnel en libre-service : `/profil`, `/conges`, `/mon-equipe`...), où il n'y a pas de permission à faire autorité à sa place.
- **`Sidebar.jsx`** : en plus du menu habituel de l'utilisateur (« intrinsèque », strictement inchangé), un nouveau bloc calcule les éléments des **autres** menus (`menuConfig`) que l'utilisateur peut désormais atteindre grâce à une permission accordée en dehors de son rôle, en excluant tout chemin déjà présent dans son menu habituel (évite les doublons, notamment le « Tableau de bord » réécrit pour SUPERADMIN). S'il y en a, ils apparaissent regroupés sous « Accès supplémentaires » (un seul élément → lien direct, sans en-tête, comme le reste du menu) ; sans permission en dehors du rôle, **le menu reste pixel pour pixel identique à avant** (vérifié pour ADMIN_RH, SUPERADMIN et PE sans permission supplémentaire).
- **Tests** : backend 72/72 inchangé (aucune route API modifiée). Vérifié en HTTP direct puis en navigateur avec un compte PAT jetable : avant l'octroi, 403 sur `/api/account-admin` et rien dans le menu ; le Superadmin accorde `manage_accounts` via `PATCH /api/permissions` (la vraie page Rôles & permissions passe par ce même endpoint) ; le PAT voit alors apparaître « Gestion des comptes » dans son menu, la page `/superadmin/comptes` s'ouvre et fonctionne normalement (liste, filtres par rôle) ; après retrait de la permission, la route affiche « Accès non autorisé » et l'entrée de menu disparaît. Aucune erreur console, build et lint sans régression.

---

# 📦 Pied de page enrichi pour l'espace personnel — bilan (2026-09-24)

- **Demande** : « améliorer le footer des pages personnel » — champ libre, en restant cohérent avec le reste de l'app et réaliste (rien d'inventé).
- **Décision** : `Footer.jsx` est un composant unique partagé par toutes les pages (rendu par `AppShell`) ; plutôt que de faire passer une prop à travers ~9 routes, il détecte lui-même le contexte via `useAuth()` (`user.role === 'PE' | 'PAT'`) — déjà disponible partout où `Footer` est monté. Pour ADMIN_RH/SUPERADMIN et les pages publiques (login, inscription...), le pied de page reste **strictement identique** à avant (copyright seul).
- **Contenu ajouté, uniquement pour PE/PAT** : les informations institutionnelles déjà saisies par le Superadmin (Personnalisation → Informations institutionnelles, construites il y a deux jours mais jamais réellement affichées nulle part jusqu'ici) — nom, adresse, téléphone/email — **n'affiche que ce qui a été renseigné**, jamais un champ vide ni une valeur inventée (adresse/téléphone/email sont vides par défaut, donc absents du pied de page tant que le Superadmin ne les a pas remplis). Raccourcis vers les 4 pages Aide (Par où commencer, Vos droits, Les procédures, Signaler un problème — ce dernier caché si `signaler_probleme` venait à être retiré du rôle), utiles depuis n'importe quel écran et pas seulement depuis la section Aide elle-même.
- **Tests** : build et lint sans régression. Vérifié en navigateur (compte PE jetable) : rien d'affiché pour les coordonnées tant qu'elles sont vides ; un Superadmin jetable renseigne temporairement adresse/téléphone/email via `PATCH /api/site-texts`, les 3 réapparaissent aussitôt dans le pied de page (revert à vide ensuite, valeurs de test uniquement, jamais laissées en place) ; mobile 390px sans débordement ; mode sombre correctement lisible ; le pied de page d'un compte SUPERADMIN reste inchangé. Aucune erreur console.

---

# 📦 Correction — « Accès supplémentaires » ne concerne que PE/PAT — bilan (2026-09-24)

- **Signalé** : le compte Superadmin voyait apparaître un bloc « ACCÈS SUPPLÉMENTAIRES » avec Mon dossier / Ma carrière / Mes contrats / Mes congés & absences / Mes documents — les pages personnelles en libre-service de `personnelMenu()`, qui n'ont pourtant aucun sens pour ce rôle.
- **Deux causes cumulées dans le mécanisme livré la veille** :
  1. Le calcul des éléments supplémentaires scannait **tous** les rôles autres que le sien, dans les deux sens — alors que seul un sens a du sens : PE/PAT gagnant une page ADMIN_RH/SUPERADMIN via une permission accordée. L'inverse (ADMIN_RH/SUPERADMIN gagnant une page personnelle en libre-service) n'en a aucun, puisque ces pages lisent le dossier du **compte connecté lui-même** — un compte Superadmin n'a pas de fiche personnel, peu importe la permission qu'on lui accorde.
  2. Le filtre reprenait `loading || can(item.permission)` du rendu existant (pensé pour éviter un flash sur le menu habituel de l'utilisateur) — appliqué ici, il affichait **tous** les éléments potentiels de façon optimiste tant que les permissions n'étaient pas encore chargées, avant de les retirer une fois `can()` disponible. Vérifié en réel (compte Superadmin jetable, rechargements répétés, mesures toutes les 200-300ms) : le bloc n'apparaît plus à aucun moment, ni au premier chargement ni après un rechargement complet — donc bien la cause, ou en tout cas une cause suffisante pour produire ce qui était visible.
- **Correctif** : `itemsSupplementaires` n'est plus calculé que pour `user.role === 'PE' | 'PAT'` (sinon tableau vide), ne scanne plus que les menus ADMIN_RH/SUPERADMIN comme source, et n'affiche plus rien tant que `loading` est vrai (au lieu de l'afficher puis le retirer).
- **Tests** : build et lint sans régression. Vérifié en navigateur avec un compte Superadmin jetable (aucune trace du bloc, y compris juste après connexion et juste après un rechargement complet, mesuré à intervalles rapprochés) et un compte PAT jetable (son propre menu — Mon dossier etc. — reste bien présent ; après avoir reçu `manage_accounts`, « Gestion des comptes » apparaît toujours correctement, la fonctionnalité réellement demandée n'a pas régressé). 72/72 tests backend.

---

# 📦 Séparation PE / PAT — bilan (2026-09-25)

- **Demande** : distinguer clairement PE (Personnel Enseignant) et PAT (Personnel Administratif et Technique) dans la sidebar (dropdown « Personnel » à plusieurs entrées), un tableau PE dédié avec des champs propres inspirés de FOSIKA (`fosika.mesupres.mg/enseignants`), et une gestion des établissements par le Superadmin — avec une règle centrale explicite : **une même personne peut être PE, PAT, ou les deux à la fois**, jamais deux identités séparées. Instruction : analyse complète d'abord (plan mode), aucun code avant validation.
- **Analyse préalable** (voir plan validé) : la table `personnel` réelle en base (vérifiée en direct, pas seulement `schema.sql` qui référence une table `roles` inexistante en pratique — écart déjà documenté dans `MCD.md`, non corrigé ici) a déjà une colonne `role` à **valeur unique**. FOSIKA s'est révélé être une plateforme de signalement de fraudes/faux diplômes (pas un annuaire RH officiel) ; ses données publiques (200 enseignants de Mahajanga, endpoints `/api/enseignants/all?universite_id=5`) n'ont ni email ni téléphone — incompatibles avec `personnel.email NOT NULL UNIQUE`. **Aucune donnée FOSIKA n'a été importée** : seule la structure du site a été vérifiée (échantillon), la décision d'utiliser cette source pour peupler des fiches réelles reste à prendre séparément (données personnelles de tiers, source non officielle).
- **Architecture retenue — additive, aucune colonne existante touchée** : plutôt que de recréer toute la logique PAT dans une structure symétrique (comme suggéré initialement), 3 tables neuves seulement — `personnel_roles` (personnel_id, role, UNIQUE) qui remplace `personnel.role` comme source de vérité (0 à 2 lignes par personne), `etablissements` (id, nom, statut ACTIF/INACTIF — désactivation seulement, jamais de suppression physique, pour préserver l'historique des PE qui y sont/étaient rattachés), et `personnel_pe_infos` (établissement, corps académique, diplôme, spécialité — champs propres aux PE, jamais mélangés avec le `corps` PAT existant EFA/ELD/Fonctionnaire, qui est un régime d'emploi sans rapport). `personnel.role` est **conservé** (non supprimé) et resynchronisé automatiquement sur `roles[0]` à chaque écriture (`personnelRepository.setRoles`), pour ne rien casser côté endroits pas encore migrés vers `roles[]`.
- **Backend** : migration `018_create_pe_pat_multi_role.sql` (additive, backfill automatique des 6 fiches existantes depuis `personnel.role`) ; module `Établissements` répliquant exactement le pattern `directions/services` (repository/service/controller/routes, permission `manage_etablissements`) ; `personnelRepository`/`personnelService`/`personnelController` étendus pour lire/écrire `roles[]` et `peInfos` (création, modification, import Excel — qui reste single-role par ligne, contrat inchangé) ; `carriereService.getCarriere` complété pour renvoyer `roles[]` (sinon `Ma carrière`/`Carrière` admin restaient bloqués sur l'ancien `role` unique pour une personne devenue PE+PAT).
- **Frontend** : sidebar « Personnel » passe de 2 à 4 entrées (PE, PAT, Directions & services, Établissements — réutilise l'accordéon déjà actif sur ce groupe) ; `/admin/personnel` (PAT) inchangée dans son URL et son comportement, seul le filtre « Rôle » disparaît puisqu'elle ne montre plus que des PAT ; nouvelle `/admin/personnel/pe` (mêmes conventions UX : recherche, carte de résumé, ligne dépliable, lien fiche) ; nouvelle `/admin/personnel/etablissements` (liste + création + activer/désactiver, Superadmin/RH) ; `DossierBlocs.jsx`/`PersonnelFiche.jsx`/`Profil.jsx` affichent désormais un badge « Catégorie » basé sur `roles[]` (ex. « PAT + PE ») plutôt que l'ancien champ unique, plus un bloc « Informations enseignant (PE) » conditionnel ; `AjouterEmployeModal.jsx` et `ModifierEmployeModal.jsx` remplacent le `<select>` rôle unique par deux cases à cocher PE/PAT (au moins une requise), avec les champs établissement/corps académique/diplôme/spécialité qui n'apparaissent que si PE est coché — décocher PE en modification efface bien ces informations côté serveur.
- **Non traité dans cette passe** (endroits identifiés qui lisent encore l'ancien `personnel.role` unique, acceptable tant que le jeu de données reste mono-rôle, à corriger si une vraie fiche PE+PAT est créée) : `DocumentImprimable.jsx` (texte du certificat administratif généré, utilise `doc.role` — vient d'une requête différente, pas retouchée) ; `userRepository.js`, `statsService.js`, `invitationController.js`, `permissionRepository.js`, `userService.js` (utilisent `users.role`, un champ distinct de `personnel.role`, hors périmètre de cette demande).
- **Bug trouvé pendant la vérification, sans rapport avec le code livré** : le serveur backend tournait depuis la veille (process resté actif), donc sans aucune des modifications de cette session — a donné l'impression que `roles[]` n'était jamais renvoyé par l'API. Résolu en relançant le process ; aucune correction de code nécessaire. Sert de rappel : toujours vérifier qu'un serveur de dev fraîchement relancé sert bien le code courant avant de diagnostiquer un « bug ».
- **Tests** : 72/72 backend inchangé. Vérifié en navigateur de bout en bout avec un compte Superadmin jetable : création d'un établissement, création d'une fiche PE rattachée (établissement/corps/diplôme/spécialité bien enregistrés), fiche affichant le bloc PE et le badge de catégorie, passage de cette même fiche en PE + PAT via la modale de modification (apparaît alors sur les deux tableaux PE et PAT, badge « PAT + PE », bloc PE toujours affiché) ; toutes les données de test supprimées après coup.

---

# 📦 Import réel des PE de l'Université de Mahajanga depuis FOSIKA — bilan (2026-09-25)

- **Demande** : peupler la base réelle avec les enseignants (PE) de l'Université de Mahajanga à partir de `fosika.mesupres.mg/enseignants`, en se limitant strictement à cette université.
- **Récupération** : appel direct des deux endpoints publics déjà identifiés lors de l'analyse (`/api/universites/all`, `/api/enseignants/all?universite_id=5`) — 200 fiches réelles récupérées, aucune extraction au-delà de ce qui était nécessaire. 13 établissements canoniques obtenus depuis la liste imbriquée de l'université elle-même (noms déjà propres côté FOSIKA, pas de dédoublonnage de texte libre à faire).
- **Décisions prises avec toi avant écriture** (aucune n'a été devinée) :
  - **Email manquant** (FOSIKA n'en fournit pas, `personnel.email` reste `NOT NULL UNIQUE`) → email placeholder explicite et non ambigu par fiche : `pe.<matricule>@a-completer.local`, à corriger par la RH via « Modifier la fiche » (déjà fonctionnel).
  - **Téléphone manquant**, même principe (une future invitation par SMS y lira un numéro) → valeur placeholder unique `+261 00 00 000 00` pour les 200 fiches.
  - **Séparation nom/prénom** : heuristique sur la casse (« NOM Prénom » — série de tokens en MAJUSCULES en tête = nom, reste = prénom), fiable sur 193/200 fiches. Pour les 7 restantes (6 noms à un seul mot, 1 entièrement en majuscules) : tu as confirmé qu'un nom unique sans prénom est une réalité malgache courante, pas une erreur de découpage — ces fiches sont donc importées telles quelles (`nom` = le nom complet, `prenom` vide), pas exclues.
  - **2 fiches exclues de l'import automatique** : même matricule (« im » 336705) et même nom utilisés deux fois dans FOSIKA lui-même, avec des dates de naissance différentes (1970 vs 1974) — doublon dans la source, pas dans notre récupération ; impossible de savoir laquelle est correcte sans deviner, donc ni importées ni fusionnées. À traiter manuellement si besoin.
  - **Date de naissance** : FOSIKA stocke systématiquement `T21:00:00.000000Z` (minuit local UTC+3 Madagascar tronqué à la veille en UTC — même artefact déjà rencontré ailleurs dans ce projet) ; corrigée de +1 jour avant écriture pour retrouver la date calendaire réelle.
  - **`corps`/`fonction` PAT non renseignés** pour ces fiches : le `corps` académique FOSIKA (AES/MC/PT/PES/PE) est stocké dans le nouveau `personnel_pe_infos.corps_pe`, jamais dans `personnel.corps` (régime d'emploi EFA/ELD/Fonctionnaire, information que FOSIKA ne fournit pas) ; `personnel.fonction` est laissé vide plutôt que de forcer une correspondance approximative vers la liste PAT existante (Enseignant/Enseignant Chercheur/Maître de Conférences/Professeur), qui aurait perdu la précision du grade académique réel déjà capturé ailleurs.
- **Exécution** : script ponctuel (non versionné, hors dépôt — une opération de données réelles, pas un seed de dev/test comme `seed_reference.sql`) avec un mode `--dry-run` par défaut (aperçu complet affiché et validé avant toute écriture) et `--apply` pour l'exécution réelle. L'écriture réelle a été refusée par le classificateur de sécurité de l'environnement (données personnelles) lorsque j'ai tenté de la lancer moi-même ; le script t'a été laissé dans `server/` et tu l'as exécuté toi-même côté `--apply`.
- **Effet de bord repéré et corrigé au passage** : en confirmant que certains PE n'ont légitimement qu'un seul nom, tu as demandé que le champ **Prénom** devienne optionnel (Nom obligatoire) dans le formulaire d'ajout d'employé — appliqué côté frontend (`AjouterEmployeModal.jsx`) et backend (validation de création et de l'import Excel). Effet de bord trouvé en vérifiant : 5 endroits construisaient un nom complet par concaténation de gabarit (`` `${prenom} ${nom}` ``) qui aurait littéralement affiché « null » pour une personne sans prénom (`ModifierEmployeModal.jsx`, sélecteurs de personnel sur Carrière/Contrats, l'infobulle du calendrier des congés, la fiche congés) — tous corrigés pour ignorer un prénom absent proprement (`[prenom, nom].filter(Boolean).join(' ')`), déjà le motif utilisé ailleurs dans le projet (`PersonnelFiche.jsx`/`Profil.jsx`).
- **Résultat vérifié en base** : 204 fiches personnel au total (6 existantes + 198 nouvelles), 199 rôles PE (1 existant + 198), 13 établissements, répartition par établissement recoupée avec l'aperçu du dry-run (198 = 51+36+32+23+18+10+7+5+4+4+4+3+1, exact). Vérifié en navigateur avec un compte Superadmin jetable : la page `/admin/personnel/pe` affiche bien 199 fiches, la recherche fonctionne, la fiche à nom unique (« ZAFILAZA ») s'affiche sans artefact (pas d'espace ni de « null » superflu). 72/72 tests backend, build client sans régression.

---

# 📦 Rôles Secrétaire PE / Secrétaire PAT — filtrage des congés et documents avant le RH — bilan (2026-09-27)

- **Demande** : à l'image du poste réel de secrétaire RH dans l'administration malgache (recherche partagée : instruction des demandes, vérification des pièces et du respect des règles, avant transmission), insérer un rôle de secrétariat qui filtre les demandes de congé et de documents avant qu'elles n'arrivent au RH, pour éviter qu'il soit « bombardé » de données non vérifiées. Deux rôles distincts (Secrétaire PE / Secrétaire PAT, chacun limité à sa catégorie), qui **filtrent et transmettent** — aucun pouvoir de décision finale, qui reste exclusivement au RH.
- **Décisions prises avec toi avant de coder** (architecture non triviale, passée par le mode Plan avec 3 agents d'exploration en parallèle — congés, demandes de documents, rôles/permissions) :
  - **Création du compte** : pas de nouveau flux d'inscription — le RH/Superadmin **promeut** un compte PE/PAT existant en secrétaire depuis Gestion des comptes (réversible). La fiche personnel ne change jamais ; seul `users.role` (le rôle d'accès système, indépendant de `personnel_roles`) devient `SECRETAIRE_PE`/`SECRETAIRE_PAT` — la personne garde son propre espace self-service (Mon dossier, Mes congés...).
  - **Ordre des vérifications pour les congés** : le mécanisme déjà existant d'avis intermédiaire du chef de service (basé sur l'organigramme réel de la personne, pas un rôle) **n'a pas été touché**. Le secrétariat s'insère strictement *avant* : à la création, c'est lui qui est notifié en premier ; une fois transmis, le circuit existant (chef de service puis RH) se déroule exactement comme avant.
  - **Anti-blocage** : si aucun secrétaire n'a encore été désigné pour une catégorie, `ADMIN_RH` (hérité par `SUPERADMIN`) a aussi la permission de vérification, en repli — jamais de demande bloquée indéfiniment faute de secrétaire.
- **Écart de base confirmé pendant l'analyse** : `schema.sql` déclare un `users.role REFERENCES roles(code)` (table `roles` jamais appliquée en réel, écart déjà documenté lors d'une mission précédente) — la vraie base a un simple `CHECK` littéral sur `users.role`. La migration `019` élargit ce `CHECK` (pas d'`INSERT INTO roles`), et `role_permissions.role` n'a aucune contrainte FK donc les nouvelles lignes de permissions sont de simples `INSERT`.
- **Base de données** — migration `019_add_secretariat_roles.sql` (additive, rétrocompatible) : `users_role_check` élargi à `SECRETAIRE_PE`/`SECRETAIRE_PAT` ; `conges` et `demandes_documents` gagnent chacune `decision_secretariat` (`en_attente`/`approuvee`/`refusee`, colonne séparée de `decision_intermediaire`/`avis_chef_service` pour ne jamais mélanger les avis), `decision_secretariat_le`, `avis_secretariat` — les lignes déjà existantes sont rétro-approuvées automatiquement (jamais bloquées rétroactivement). Deux nouvelles permissions (`review_conges_secretariat`, `review_documents_secretariat`, catégorie « Secrétariat »), accordées à `SECRETAIRE_PE`/`SECRETAIRE_PAT` (avec le même socle personnel que PE/PAT) et à `ADMIN_RH` en repli.
- **Backend** : `congeRepository`/`demandeDocumentRepository` gagnent `findPendingForSecretariat(roleCible)` et `setDecisionSecretariat` ; les files RH existantes (`findPending`) excluent désormais aussi ce qui n'est pas encore `decision_secretariat = 'approuvee'`. Nouvelles fonctions `reviewSecretariat`/`reviewDemandeSecretariat` : vérifient l'appartenance de catégorie (protection contre un accès direct par id hors de la liste déjà filtrée), et **déplacent** la notification du validateur/RH — retirée de la création de la demande, elle ne part plus qu'une fois le secrétariat satisfait, avec le même contenu qu'avant. Un refus par le secrétariat termine la demande immédiatement (comme un refus du chef de service), avec restitution des jours de congé annuel le cas échéant. Nouvelle action `accountAdminController.changeRole`, transitions strictement limitées à `PE⇄SECRETAIRE_PE`/`PAT⇄SECRETAIRE_PAT` (jamais `ADMIN_RH`/`SUPERADMIN`, jamais de changement de catégorie).
- **Frontend** : nouveau groupe de menu « Secrétariat » (deux pages, `CongesSecretariat.jsx`/`DemandesDocumentsSecretariat.jsx`, vocabulaire volontairement différent de l'admin — « Transmettre au RH »/« Renvoyer au demandeur », pas « Approuver »/« Refuser », pour rester fidèle au rôle de filtre) ; un motif est obligatoire pour renvoyer une demande. `FicheDemande.jsx` (fiche imprimable) gagne un bloc « Vérifié par le secrétariat » avant l'avis du chef de service. `Comptes.jsx` gagne les boutons « Désigner secrétaire »/« Retirer le secrétariat ». `Sidebar.jsx`/`App.jsx`/`menuConfig.js` étendus aux deux nouveaux rôles (espace personnel conservé, comme PE/PAT).
- **Bug d'infrastructure rencontré, sans rapport avec le code** : PostgreSQL s'est arrêté en cours de session (service système, hors de mon contrôle) — j'ai dû demander à l'utilisateur de le relancer (`sudo systemctl start postgresql`) avant de pouvoir terminer la vérification en navigateur.
- **Tests** : 72/72 backend (2 fixtures de tests existants ont dû être mises à jour — elles créaient des congés puis appelaient directement la décision RH, sans passer par la nouvelle étape secrétariat ; corrigé en faisant avancer `decision_secretariat` directement par SQL dans ces helpers de test, la logique testée par ces fichiers étant le solde/la génération de documents, pas le nouveau circuit). Vérifié de bout en bout en navigateur avec des comptes jetables : promotion d'un compte PAT en Secrétaire PAT (menu « Secrétariat » présent, espace personnel conservé) ; une demande de congé et une demande de document déposées par un autre compte PAT sont invisibles côté RH tant qu'elles n'ont pas été vérifiées ; visibles côté secrétariat ; transmission → apparaissent alors côté RH avec `decision_secretariat = 'approuvee'` ; renvoi sans motif bloqué côté formulaire, avec motif → la demande se termine proprement (statut refusée, jours restitués, n'atteint jamais le RH) ; un compte Superadmin accède aux deux pages du secrétariat sans permission dédiée (repli anti-blocage) ; rétrogradation d'un secrétaire vers son rôle d'origine testée et fonctionnelle. Toutes les données de test supprimées après coup.

# 📦 Audit de sécurité, contact obligatoire avant suppression, secrétariat à la création — bilan (2026-10-03)

- **Design** : retrait des dégradés, cercles décoratifs, icônes dans des pastilles et émojis dans toute l'application (Login, tableaux de bord, fiches, profil) pour un rendu moins « généré ».
- **Audit de sécurité** (missions en trois phases, audit puis validation puis corrections) : fuite du hash de mot de passe corrigée à la source (la vue `user_details` expose `password_hash` ; les requêtes générales passent par `COLONNES_PUBLIQUES`, seul `authService.login` lit le hash via `findByEmailAvecMotDePasse`). `requireAuth` rejette les comptes désactivés même avec un jeton encore valide. `helmet`, CORS restreint, limite de 2 Mo sur le JSON, middleware d'erreur global sans trace de pile, `nodemailer` passé en 10.x après vérification réelle de l'envoi, limitation de débit sur les routes sensibles. `npm audit` : la vulnérabilité `uuid`/`exceljs` est volontairement laissée (correction = rétrogradation d'`exceljs` en rupture).
- **Verrouillage de connexion** : le blocage par IP a été retiré (il bloquait l'accès du Superadmin et de l'Admin RH). À la place, compteur par compte pour PE/PAT/SECRETAIRE_PE/SECRETAIRE_PAT : 10 échecs → 30 minutes de blocage, notification à tous les Superadmin. Compteur en mémoire, remis à zéro au redémarrage.
- **Gestion des comptes (Superadmin)** : recherche par nom, prénom, e-mail ou matricule. Désactiver et Supprimer ouvrent directement une fenêtre de contact obligatoire ; l'e-mail part d'abord, puis l'action est exécutée seulement si l'envoi a réussi. Les comptes Admin RH et Superadmin affichent « Protégé ». Le SMS n'est pas disponible (aucun fournisseur configuré) ; le numéro est affiché avec un bouton « Copier ». La restauration depuis la corbeille envoie un e-mail de notification, en best-effort.
- **Corbeille** : recherche placée sur la même ligne que « Vider la corbeille ».
- **Tableau de bord Superadmin** : les six rôles sont affichés (la liste n'en comptait que quatre), ajout d'un bloc « Aperçu RH » (personnel PE+PAT, congés et documents en attente, file du secrétariat) car le Superadmin ne voyait pas les tableaux de bord de l'Admin RH, et compteur des réclamations ouvertes.
- **Secrétariat** : la règle a été corrigée deux fois. Un PE n'est jamais secrétaire ; seul un PAT peut l'être, et le secrétariat peut être PE ou PAT (ce n'est pas forcément sa propre catégorie). La désignation se fait **à l'ajout de l'employé par l'Admin RH** (menu « Secrétariat » du formulaire, visible seulement si PAT est coché), et non par le Superadmin après coup. Les boutons « Désigner secrétaire PE / PAT » et « Retirer le secrétariat » de Gestion des comptes restent pour corriger ou réassigner un compte existant. Le retrait ramène toujours à PAT.
  - **Base** : migration `020_add_personnel_secretariat_role.sql` (colonne nullable `personnel.secretariat_role`, `CHECK` sur `SECRETAIRE_PE`/`SECRETAIRE_PAT`), appliquée à la base réelle après validation. La fiche garde `role`/`personnel_roles` en PE/PAT, car `personnel.role` a un `CHECK` limité à PE/PAT.
  - **Inscription** : `userService.registerWithMatricule` prend `secretariat_role` s'il existe, sinon `role`.
  - **Vérifié** : PAT + secrétaire à la création → fiche `role: PAT`, `secretariat_role` renseigné, puis inscription → `users.role = SECRETAIRE_PE`. Un PE avec une désignation est refusé par le serveur. Dans Gestion des comptes, un PAT propose les deux désignations, un PE n'en propose aucune, un secrétaire peut être retiré vers PAT, et le passage direct d'un secrétaire vers l'autre catégorie est refusé. Formulaire vérifié dans le navigateur. Comptes de test supprimés.
- **Tests** : 72/72 backend.
- **Non commité avant cette publication** : aucun commit n'a été fait pendant la session ; ce bilan accompagne le push. Les fichiers `client/docs/*memoire*` non suivis n'en font pas partie.

---

## 🎯 Les 10 prochaines tâches prioritaires

Si tu veux simplement savoir **quoi attaquer maintenant**, je mettrais :

1. ✅ **Finaliser Situation administrative** (durcissement terminé le 2026-09-20 : voir le bilan ci-dessus)
2. ⬜ **Finaliser Gestion des indices**
3. ⬜ **Finaliser Contrats**
4. ⬜ **Finaliser Renouvellement / Non-renouvellement**
5. ⬜ **Finaliser Notifications automatiques**
6. ⬜ **Nettoyer la Sidebar**
7. ⬜ **Responsive + Sidebar mobile**
8. ⬜ **Corriger le 403 des PDF**
9. ⬜ **Audit BDD/API + sécurité**
10. ⬜ **Tests complets + corrections**

C'est cette liste que je considérerais comme **le vrai reste à faire**, plutôt que de reprendre les fonctionnalités que tu as déjà validées.
