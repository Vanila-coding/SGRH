import {
  UserRound, ShieldCheck, MonitorSmartphone, Palette, Bell, Globe, Accessibility,
  Table2, FileText, Users, Briefcase, UserCog, History, Settings2, Sparkles, Wrench,
} from 'lucide-react';
import { traduire } from '../i18n';

const ALL_ROLES = ['ADMIN_RH', 'SUPERADMIN', 'PE', 'PAT'];

export const SETTINGS_CATEGORIES = [
  {
    key: 'compte',
    label: traduire('Compte'),
    items: [
      { key: 'profil', label: traduire('Profil et compte'), icon: UserRound, roles: ALL_ROLES },
      { key: 'securite', label: traduire('Sécurité'), icon: ShieldCheck, roles: ALL_ROLES },
      { key: 'sessions', label: traduire('Sessions'), icon: MonitorSmartphone, roles: ALL_ROLES },
    ],
  },
  {
    key: 'preferences',
    label: traduire('Préférences'),
    items: [
      { key: 'apparence', label: traduire('Apparence'), icon: Palette, roles: ALL_ROLES },
      { key: 'notifications', label: traduire('Notifications'), icon: Bell, roles: ALL_ROLES },
      { key: 'langue', label: traduire('Langue & région'), icon: Globe, roles: ALL_ROLES },
      { key: 'accessibilite', label: traduire('Accessibilité'), icon: Accessibility, roles: ALL_ROLES },
    ],
  },
  {
    key: 'donnees',
    label: traduire('Données'),
    items: [
      { key: 'tableaux', label: traduire('Préférences des tableaux'), icon: Table2, roles: ['ADMIN_RH', 'SUPERADMIN'] },
      { key: 'documents', label: traduire('Documents'), icon: FileText, roles: ALL_ROLES },
    ],
  },
  {
    key: 'administration',
    label: traduire('Administration'),
    items: [
      { key: 'personnel', label: traduire('Personnel'), icon: Users, description: traduire('Types, catégories, corps, grades et statuts du personnel.'), roles: ['ADMIN_RH', 'SUPERADMIN'], permission: 'view_personnel', path: '/admin/personnel' },
      { key: 'carriere', label: traduire('Carrière'), icon: Briefcase, description: traduire('Corps, grades, échelons, positions et mouvements de carrière.'), roles: ['ADMIN_RH', 'SUPERADMIN'], permission: 'manage_fonctions', path: '/admin/carriere' },
      { key: 'utilisateurs', label: traduire('Utilisateurs'), icon: UserCog, description: traduire('Liste des comptes, statuts et rôles.'), roles: ['SUPERADMIN'], permission: 'manage_accounts', path: '/superadmin/comptes' },
      { key: 'roles', label: traduire('Rôles & permissions'), icon: ShieldCheck, description: traduire('Personnel, Administration RH, Super Administration.'), roles: ['SUPERADMIN'], permission: 'manage_permissions', path: '/superadmin/permissions' },
      { key: 'journal', label: traduire('Journal d\'activité'), icon: History, description: traduire('Historique des actions effectuées dans le SGRH.'), roles: ['ADMIN_RH', 'SUPERADMIN'], permission: 'view_historique', path: '/admin/historique' },
    ],
  },
  {
    key: 'systeme',
    label: traduire('Système'),
    items: [
      { key: 'configuration', label: traduire('Configuration système'), icon: Settings2, description: traduire('Nom, logo, couleurs, textes du site.'), roles: ['SUPERADMIN'], permission: 'manage_site_texts', path: '/superadmin/apparence' },
      { key: 'fonctionnalites', label: traduire('Fonctionnalités'), icon: Sparkles, roles: ['SUPERADMIN'] },
      { key: 'maintenance', label: traduire('Maintenance'), icon: Wrench, roles: ['SUPERADMIN'] },
    ],
  },
];