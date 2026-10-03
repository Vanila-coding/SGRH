import { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut, Menu, Settings, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import { useText } from '../../context/TextContext';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import { traduire } from '../../i18n';

const roleLabels = {
  ADMIN_RH: 'Admin RH',
  SUPERADMIN: 'Superadmin',
  PE: 'Personnel PE',
  PAT: 'Personnel PAT',
};

export default function TopBar({ title, subtitle, onMenuClick }) {
  const { user, logout } = useAuth();
  const { can, loading } = usePermissions();
  const libelleParametres = useText('menu.libelle_parametres', 'Paramètres', 'Menu');
  const [profileOpen, setProfileOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const isPersonnel = user?.role === 'PE' || user?.role === 'PAT';
  const canViewProfile = isPersonnel && (loading || can('view_profil'));
  const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.email || traduire('Utilisateur');
  const initial = (user?.prenom?.[0] || user?.email?.[0] || '?').toUpperCase();

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === 'Escape') setProfileOpen(false);
    }

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  function handleLogout() {
    setProfileOpen(false);
    logout();
  }

  return (
    <header className="flex min-h-20 shrink-0 items-center border-b border-slate-200 bg-white/95 px-4 shadow-sm dark:border-gray-700 dark:bg-gray-800/95 sm:px-6 xl:px-8">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label={traduire('Ouvrir le menu')}
          className="shrink-0 rounded-md p-1.5 text-gray-500 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700 lg:hidden"
        >
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="font-bold text-lg text-navy dark:text-gold leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        <ThemeToggle />
        <NotificationBell />

        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-left transition hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold dark:hover:bg-gray-700"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white" aria-hidden="true">
              {initial}
            </span>
            <span className="hidden max-w-56 text-sm lg:block">
              <span className="block truncate font-medium leading-tight text-navy dark:text-gray-100">{fullName}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400">{roleLabels[user?.role] || user?.role}</span>
            </span>
            <ChevronDown size={16} className={`hidden text-gray-400 transition sm:block ${profileOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
            <span className="sr-only">{traduire('Ouvrir le menu utilisateur')}</span>
          </button>

          {profileOpen && (
            <div
              role="menu"
              aria-label={traduire('Menu utilisateur')}
              className="absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="flex items-center gap-3 px-4 py-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white" aria-hidden="true">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy dark:text-gray-100">{fullName}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{roleLabels[user?.role] || user?.role || traduire('Utilisateur')}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 py-1 dark:border-gray-700">
                {canViewProfile && (
                  <Link to="/profil" role="menuitem" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700">
                    <UserRound size={17} />
                    {traduire('Mon profil')}
                  </Link>
                )}
                <Link to="/parametres" role="menuitem" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 focus:bg-slate-50 focus:outline-none dark:text-gray-200 dark:hover:bg-gray-700 dark:focus:bg-gray-700">
                  <Settings size={17} />
                  {traduire(libelleParametres)}
                </Link>
              </div>

              <div className="border-t border-slate-100 py-1 dark:border-gray-700">
                <button type="button" role="menuitem" onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-status-rejected transition hover:bg-red-50 focus:bg-red-50 focus:outline-none dark:hover:bg-red-950/30 dark:focus:bg-red-950/30">
                  <LogOut size={17} />
                  {traduire('Déconnexion')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  );
}
