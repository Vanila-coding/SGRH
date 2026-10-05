# 1. Règles de gestion

Ce document liste les règles métier de SGRH, telles qu'elles sont appliquées par le code et la base au 5 octobre 2026. Pour chaque règle : son identifiant, son énoncé, sa source (contrainte de base ou fichier du code) et son statut.

Statuts :
- **Implémenté** : la règle est appliquée par le code ou la base.
- **Partiel** : appliquée dans certains cas seulement.
- **À faire** : prévue par le cahier des charges, absente du code.
- **À confirmer** : le code applique une règle, mais sa conformité au texte officiel ou au besoin de la RH n'est pas établie.

## 1.1 Personnel et fiches

| Id | Règle | Source | Statut |
|---|---|---|---|
| RG-P01 | Le matricule est composé de exactement 6 chiffres et est unique. | Contrainte `personnel_matricule_check`, index unique `personnel_matricule_key` | Implémenté |
| RG-P02 | L'adresse email d'une fiche personnel est unique. | Index unique `personnel_email_key` | Implémenté |
| RG-P03 | Une fiche personnel est liée à au plus un compte d'accès. | Index unique `users_personnel_id_key` | Implémenté |
| RG-P04 | Le rôle métier d'un agent est PE ou PAT. Un agent peut cumuler les deux via `personnel_roles`. | Contrainte `personnel_role_check`, table `personnel_roles` (migration 018) | Implémenté |
| RG-P05 | Le corps est EFA, ELD ou Fonctionnaire. | Contrainte `personnel_corps_check` | Implémenté |
| RG-P06 | Seul un agent PAT peut être désigné secrétaire. Un PE n'est jamais secrétaire. | Validation dans `personnelService` ; transitions autorisées dans `accountAdminController` (PAT vers SECRETAIRE_PE ou SECRETAIRE_PAT, retour vers PAT) | Implémenté |
| RG-P07 | Le secrétaire garde sa fiche métier et son espace personnel (dossier, congés, documents). | Rôle d'accès et `personnel_roles` indépendants | Implémenté |
| RG-P08 | L'indice brut (IB) est calculé à partir de la grille lorsque la classe et l'échelon sont connus. Une fiche sans corps ni classe/échelon reste sans IB. | `resolveIndice`, `resoudreClasseEchelonImport` ; `personnel.indice_num` | Partiel : grille générale chargée (migration 022, I à IX et deux échelons de la classe exceptionnelle de X) ; stagiaires et échelons 1 à 6 de la catégorie X non chargés ; 199 fiches sur 204 n'ont pas de corps à ce jour |
| RG-P09 | Chaque valeur d'indice porte sa source : import Excel, saisie RH, réglementaire ou à confirmer. | Contrainte `personnel_indice_source_check` | Implémenté |

## 1.2 Comptes et accès

| Id | Règle | Source | Statut |
|---|---|---|---|
| RG-A01 | Un agent crée son compte avec son matricule et un code de vérification. Le compte reste en attente jusqu'à activation par la RH ; la RH peut aussi le refuser. | Page « Comptes en attente » ; permission `view_pending_accounts` | Implémenté |
| RG-A02 | Un compte se désactive ou se supprime depuis « Gestion des comptes », réservé au superadmin (`manage_accounts`). | Permission `manage_accounts` (désactivée pour ADMIN_RH) | Implémenté (décision : réservé au superadmin) |
| RG-A03 | Avant de supprimer ou désactiver un compte, le superadmin doit avoir contacté la personne par email. | Fenêtre de contact obligatoire dans `Comptes.jsx` | Implémenté |
| RG-A04 | Une suppression passe par la corbeille et reste restaurable par le superadmin. | Table `corbeille`, permission `manage_corbeille` | Implémenté |
| RG-A05 | Protection contre le brute-force : 10 échecs de connexion bloquent le compte 30 minutes. Cette protection ne concerne que PE, PAT et secrétaires. Au 10e échec, le superadmin reçoit une notification. ADMIN_RH et SUPERADMIN ne sont jamais bloqués. | `ROLES_PROTEGES_BRUTE_FORCE`, `authService.login` | Implémenté ; suivi en mémoire, remis à zéro au redémarrage du serveur |
| RG-A06 | Les demandes de réinitialisation de mot de passe sont limitées à 10 par 15 minutes ; les inscriptions à 5 par heure ; les soumissions d'invitation à 10 par heure. | `creerLimiteur` dans les routes d'authentification, d'inscription et d'invitation | Implémenté |

## 1.3 Congés

| Id | Règle | Source | Statut |
|---|---|---|---|
| RG-C01 | Un congé est d'un des 8 types : Congé annuel, Permission, Autorisation d'absence, Congé de maternité, Congé de paternité, Congé de maladie, Formation, Autres. | Contrainte `conges_type_conge_check` | Implémenté |
| RG-C02 | La date de fin est au moins égale à la date de début. La durée compte les deux jours bornes (fin moins début, plus 1). | `congeService.createDemande`, contrainte `conges_check` | Implémenté |
| RG-C03 | Le droit annuel est acquis à raison de 2,5 jours par mois de service effectif. Les années manquantes sont créditées ; une année ne peut être créditée deux fois. | `congeDroitsService.rechargerSiNecessaire`, verrou sur la fiche | Implémenté |
| RG-C04 | Un congé annuel ne peut dépasser le solde disponible. | `verifierSoldeSuffisant` | Implémenté |
| RG-C05 | La première demande de congé annuel de l'année doit compter au moins 15 jours. | `verifierPremiereDemandeAnnuelle` | Implémenté ; base juridique non établie pour les fonctionnaires (signalé dans le code) : à confirmer |
| RG-C06 | Un congé de paternité ne dépasse pas 15 jours. | `verifierDureePaternite` ; Loi 2003-011, art. 65 (citée dans le code) | Implémenté |
| RG-C07 | Un congé de maladie ou de maternité ne peut être approuvé par la RH sans justificatif joint. | `reviewDemande`, constante `JUSTIFICATIF_REQUIS_VALIDATION` | Implémenté |
| RG-C08 | Les jours d'un congé annuel sont imputés sur les années de droit, la plus ancienne d'abord. Ce qui n'a pas d'année connue est imputé à « solde d'ouverture non ventilé ». | `congeDroitsService.imputerJours` | Implémenté |
| RG-C09 | Le circuit d'une demande comporte trois étapes : vérification du secrétariat de la catégorie (ou de la RH en repli), avis du responsable direct si un est assigné, décision finale de la RH. | `createDemande`, `reviewSecretariat`, `reviewIntermediaire`, `reviewDemande` | Implémenté (voir 4.2) |
| RG-C10 | Un refus à n'importe quelle étape clôt la demande (statut `refusee`). Si c'est un congé annuel, les jours sont restitués au solde. | `restituerJoursSiCongeAnnuel` | Implémenté |
| RG-C11 | La décision RH n'est possible qu'après la vérification du secrétariat et l'avis du responsable, s'il existe. | Gardes dans `reviewDemande` | Implémenté |
| RG-C12 | Un renvoi par le secrétariat clôt la demande : l'agent doit en déposer une nouvelle. | `reviewSecretariat`, branche refusée | À confirmer (le secrétariat ne peut pas demander un complément) |
| RG-C13 | Un secrétaire ne voit et ne vérifie que les demandes de sa catégorie (PE ou PAT). RH et superadmin peuvent agir en repli si aucun secrétaire n'existe pour la catégorie. | Filtre `findPendingForSecretariat`, contrôle de catégorie dans `reviewSecretariat` | Implémenté : la catégorie vient du métier de l'auteur (un secrétaire est PAT) |
| RG-C14 | Un secrétaire ne voit pas et ne vérifie pas sa propre demande. Un RH en repli peut encore vérifier la sienne. | Filtre `exclureUserId` dans les deux files ; contrôle dans `reviewSecretariat` et `reviewDemandeSecretariat` | Implémenté |
| RG-C15 | Les demandes antérieures à l'étape secrétariat sont réputées vérifiées. | Migration 019 (mise à jour rétroactive à `approuvee`) | Implémenté |
| RG-C16 | Le solde est photographié à la date de la demande, pour la fiche imprimable. | `setSnapshotSolde` | Implémenté |

## 1.4 Demandes de documents

| Id | Règle | Source | Statut |
|---|---|---|---|
| RG-D01 | Un agent ne peut demander que : certificat administratif, lettre de confirmation, état de congé. La RH peut en plus générer une décision de congé. | `TYPES_VALIDES` et `TYPES_GENERABLES` dans `documentService` | Implémenté |
| RG-D02 | Le circuit d'une demande de document est : vérification du secrétariat, puis traitement ou refus par la RH. Un refus du secrétariat clôt la demande. | `demanderDocument`, `reviewDemandeSecretariat`, `traiterDemande`, `refuserDemande` | Implémenté |
| RG-D03 | Un document généré garde un instantané des données utilisées et l'auteur de la génération. | `documents_generes.donnees`, `genere_par` | Implémenté |
| RG-D04 | Le certificat administratif affiche l'IB. Il affiche aujourd'hui `chapitre_ib` sous le libellé « I.B ». | Modèle de certificat | Écart : à corriger après confirmation de la RH |
| RG-D05 | Le dossier de profil PDF est accessible à la personne (`view_profil`) et à la RH ou au superadmin pour tous les agents (`view_personnel`). | `personnel.routes.js`, `dossierPdf` | Implémenté |
| RG-D06 | Chaque téléchargement du dossier PDF est journalisé. | `personnelController.envoyerDossierPdf` (action `dossier_pdf_telecharge`) | Implémenté |

## 1.5 Carrière

| Id | Règle | Source | Statut |
|---|---|---|---|
| RG-K01 | Un événement de carrière est d'un des 23 types prévus (recrutement, stage, titularisation, avancement, reclassement, retraite, fin de contrat, etc.). | Contrainte `carriere_evenements_type_evenement_check` | Implémenté |
| RG-K02 | L'échéance d'avancement d'échelon est calculée à partir de la périodicité de 2 ans (paramètre `avancement_echelon_periodicite_annees`). Quand elle est échue, une alerte est ouverte pour la RH. | `avancementService`, `avancementEcheanceJob` | Implémenté |
| RG-K03 | Une alerte d'avancement porte un type (5 types) et un statut : OUVERTE, TRAITEE ou IGNOREE. | Contraintes `alertes_avancement_type_check` et `alertes_avancement_statut_check` | Implémenté |
| RG-K04 | Le reclassement indiciaire (Loi 2003-011, art. 49) n'est calculé automatiquement que pour le cadre A, échelle A1 : majoration de 100 points, plafond 500. Les autres cadres sont traités à la main. | `calculerReclassementIndiciaire` | Partiel |
| RG-K05 | Le reclassement est refusé si l'agent a atteint la limite d'âge de la retraite. | `calculerReclassementIndiciaire` | Implémenté |
| RG-K06 | Les durées de carrière sont des paramètres modifiables : intégration EFA 10 ans, titularisation 1 an après intégration, stagiaire classique 1 an, stagiaire grade 2 ans, progression ELD tous les 2 ans, retraite à 60 ans, anticipation 1 an. | Table `parametres_carriere`, permission `manage_parametres_carriere` | Paramètres : implémentés. Calcul des échéances de titularisation et de retraite : À faire |
| RG-K07 | Les paramètres portent un indicateur `a_valider` tant que leur valeur n'est pas confirmée par la RH. | Colonne `parametres_carriere.a_valider` | À confirmer (valeurs à valider avec la RH) |
| RG-K08 | Le mouvement d'un indice enregistre sa source (`indice_source`) et, s'il est réglementaire, sa référence. | `carriere_evenements.indice_source`, `reference_decision` | Implémenté |

## 1.6 Contrats

| Id | Règle | Source | Statut |
|---|---|---|---|
| RG-T01 | Un contrat est de type CDI, CDD, Vacataire ou Stagiaire. | Contrainte `contrats_type_contrat_check` | Implémenté |
| RG-T02 | La date de fin est vide ou postérieure à la date de début. | Contrainte `contrats_dates_check` | Implémenté |
| RG-T03 | Un contrat non renouvelé doit porter un motif. | Contrainte `contrats_motif_non_renouvellement_check` | Implémenté |
| RG-T04 | Un renouvellement incrémente le numéro de renouvellement et pointe vers le contrat précédent. | Colonnes `numero_renouvellement`, `contrat_precedent_id` | Implémenté |
| RG-T05 | Un contrat a un statut : actif, expiré, renouvelé, non renouvelé ou résilié. | Contrainte `contrats_statut_check` | Implémenté |
| RG-T06 | À l'approche de la fin d'un contrat, l'agent et la RH sont notifiés une seule fois. Le délai d'alerte est le paramètre `renouvellement_notification_delai_mois` (6 mois). | `contratEcheanceJob`, colonne `notifie_echeance_le` | Implémenté |
| RG-T07 | À l'expiration, une notification distincte est envoyée une seule fois. | `contratEcheanceJob`, colonne `notifie_expiration_le` | Implémenté |

## 1.7 Organisation et établissements

| Id | Règle | Source | Statut |
|---|---|---|---|
| RG-O01 | Un service appartient à une direction. | Clé étrangère `services.direction_id` | Implémenté |
| RG-O02 | Une direction ou un service se désactive au lieu de se supprimer. | Colonnes `actif` (migration 021) | Implémenté |
| RG-O03 | Renommer une direction ou un service met à jour les fiches qui le portent. | Cascade dans `organisationRepository` | Implémenté ; cohérence applicative, pas par clé étrangère (voir 02, point 1) |
| RG-O04 | Un PE est rattaché à un établissement. | `personnel_pe_infos.etablissement_id` | À confirmer (le rattachement est-il obligatoire ?) |

## 1.8 Journal et traçabilité

| Id | Règle | Source | Statut |
|---|---|---|---|
| RG-J01 | Les décisions et actions de gestion (avis, décisions, comptes, documents, carrière) sont journalisées dans `activity_log`. | `activityLogRepository.create` | Implémenté |
| RG-J02 | Quand un compte est supprimé, son journal est conservé et l'auteur est remis à vide (NULL). | Clé étrangère `activity_log.user_id` (`SET NULL`) | Implémenté |

## 1.9 Hors périmètre actuel

Ces règles figurent dans le cahier des charges de stage et ne sont pas encore implémentées :

- ordres de mission ;
- détection des demandes répétitives ;
- notifications en temps réel (aujourd'hui, l'application interroge le serveur) ;
- échéances de carrière complètes : titularisation, retraite, reclassement de tous les cadres ;
- registre des absences et présences ;
- permissions de courte durée (non confirmées par la RH) ;
- documentation finale : rapport, guide, maquettes, présentation.
