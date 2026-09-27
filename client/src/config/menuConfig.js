import {
  LayoutDashboard, UserPlus, UserCheck, Bell, Briefcase, GitBranch, FileSignature, SlidersHorizontal,
  CalendarClock, FileText, FileStack, History, ShieldCheck, Trash2, KeyRound, Palette, Building2,
  UserRound, Award, Users2, ClipboardCheck, FolderOpen, HelpCircle, Info, BookOpen, MessageSquareWarning,
  GraduationCap, Wrench, School, ClipboardList,
} from 'lucide-react';

const CHEF_OU_RESPONSABLE = (u) => u?.fonction === 'Chef de service' || u?.fonction === 'Responsable/Directeur';

// Bloc central Admin RH : Tableau de bord, Personnel, Carrière, Contrats, Congés &
// absences, Documents, Utilisateurs & comptes, Audit & journal (+ les fonctionnalités
// existantes non citées dans ce plan, regroupées sous l'item le plus proche pour ne
// rien retirer de l'application).
const ADMIN_RH_MENU = [
  {
    title: null,
    items: [
      { label: 'Tableau de bord', path: '/admin/dashboard', icon: LayoutDashboard, permission: 'view_dashboard_admin' },
    ],
  },
  {
    title: 'Personnel',
    items: [
      { label: 'PE', path: '/admin/personnel/pe', icon: GraduationCap, permission: 'view_personnel' },
      { label: 'PAT', path: '/admin/personnel', icon: Wrench, permission: 'view_personnel' },
      { label: 'Directions & services', path: '/admin/organisation', icon: Building2, permission: 'manage_organisation' },
      { label: 'Établissements', path: '/admin/personnel/etablissements', icon: School, permission: 'manage_etablissements' },
    ],
  },
  {
    title: 'Carrière',
    items: [
      { label: 'Carrière', path: '/admin/carriere', icon: GitBranch, permission: 'manage_fonctions' },
      { label: 'Fonctions', path: '/admin/fonctions', icon: Briefcase, permission: 'manage_fonctions' },
      { label: 'Paramètres carrière', path: '/admin/parametres-carriere', icon: SlidersHorizontal, permission: 'manage_parametres_carriere' },
    ],
  },
  {
    title: null,
    items: [
      { label: 'Contrats', path: '/admin/contrats', icon: FileSignature, permission: 'manage_fonctions' },
    ],
  },
  {
    title: null,
    items: [
      { label: 'Congés & absences', path: '/admin/conges', icon: CalendarClock, permission: 'view_conges_admin' },
    ],
  },
  {
    title: 'Documents',
    items: [
      { label: 'Documents administratifs', path: '/admin/documents', icon: FileText, permission: 'manage_documents' },
      { label: 'Demandes de documents', path: '/admin/demandes-documents', icon: FolderOpen, permission: 'manage_documents' },
    ],
  },
  {
    title: 'Utilisateurs & comptes',
    items: [
      { label: 'Inviter un personnel', path: '/admin/invitations', icon: UserPlus, permission: 'send_registration_link' },
      { label: 'Comptes en attente', path: '/admin/comptes-attente', icon: UserCheck, permission: 'view_pending_accounts' },
    ],
  },
  {
    title: null,
    items: [
      { label: 'Envoyer une notification', path: '/admin/notifications', icon: Bell, permission: 'send_notification' },
    ],
  },
  {
    title: null,
    items: [
      { label: 'Audit & journal', path: '/admin/historique', icon: History, permission: 'view_historique' },
    ],
  },
];

// Bloc Personnel (PE/PAT) : Tableau de bord, Mon dossier, Ma carrière, Mes contrats,
// Mes congés & absences, Mes documents. Profil/Paramètres restent dans le menu
// utilisateur (TopBar), pas ici. Mon équipe/Validation équipe et l'aide sont
// conservées : elles existaient déjà et ne sont pas mentionnées comme à retirer.
function personnelMenu() {
  return [
    {
      title: 'Mon espace',
      items: [
        { label: 'Tableau de bord', path: '/dashboard', icon: LayoutDashboard, permission: null },
        { label: 'Mon dossier', path: '/profil', icon: UserRound, permission: 'view_profil' },
        { label: 'Ma carrière', path: '/carriere', icon: Award, permission: 'view_profil' },
        { label: 'Mes contrats', path: '/mes-contrats', icon: FileSignature, permission: 'view_profil' },
        { label: 'Mes congés & absences', path: '/conges', icon: CalendarClock, permission: 'view_mes_conges' },
        { label: 'Mes documents', path: '/mes-documents', icon: FileStack, permission: 'demander_document' },
        { label: 'Mon équipe', path: '/mon-equipe', icon: Users2, permission: null, showIf: CHEF_OU_RESPONSABLE },
        { label: 'Validation équipe', path: '/validation-equipe', icon: ClipboardCheck, permission: null, showIf: CHEF_OU_RESPONSABLE },
      ],
    },
    {
      title: 'Aide',
      items: [
        { label: 'Par où commencer', path: '/aide/commencer', icon: Info, permission: null },
        { label: 'Vos droits', path: '/aide/droits', icon: HelpCircle, permission: null },
        { label: 'Les procédures', path: '/aide/procedures', icon: BookOpen, permission: null },
        { label: 'Signaler un problème', path: '/aide/signaler', icon: MessageSquareWarning, permission: 'signaler_probleme' },
      ],
    },
  ];
}

// Secrétaire PE / Secrétaire PAT : même espace personnel que PE/PAT (ils gardent
// leur propre fiche, leurs propres congés — la promotion ne change que le rôle
// d'accès système, pas leur identité de personnel), plus un bloc « Secrétariat »
// pour vérifier les demandes de leur catégorie avant transmission au RH.
function secretariatMenu() {
  const [monEspace, aide] = personnelMenu();
  return [
    monEspace,
    {
      title: 'Secrétariat',
      items: [
        { label: 'Congés à vérifier', path: '/secretariat/conges', icon: CalendarClock, permission: 'review_conges_secretariat' },
        { label: 'Demandes de documents', path: '/secretariat/documents', icon: ClipboardList, permission: 'review_documents_secretariat' },
      ],
    },
    aide,
  ];
}

export const menuConfig = {
  ADMIN_RH: ADMIN_RH_MENU,
  // Le Super Admin voit exactement le menu Admin RH (Sidebar.jsx les fusionne déjà),
  // plus ce bloc exclusif : gestion des comptes, corbeille, rôles & permissions,
  // apparence du site.
  SUPERADMIN: [
    {
      title: 'Super Administration',
      items: [
        { label: 'Gestion des comptes', path: '/superadmin/comptes', icon: ShieldCheck, permission: 'manage_accounts' },
        { label: 'Corbeille', path: '/superadmin/corbeille', icon: Trash2, permission: 'manage_corbeille' },
        { label: 'Rôles & permissions', path: '/superadmin/permissions', icon: KeyRound, permission: 'manage_permissions' },
        { label: 'Réclamations', path: '/superadmin/reclamations', icon: MessageSquareWarning, permission: 'manage_reclamations' },
        { label: 'Personnalisation', path: '/superadmin/apparence', icon: Palette, permission: 'manage_site_texts' },
      ],
    },
  ],
  PE: personnelMenu(),
  PAT: personnelMenu(),
  SECRETAIRE_PE: secretariatMenu(),
  SECRETAIRE_PAT: secretariatMenu(),
};
