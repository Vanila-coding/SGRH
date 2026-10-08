import { Link, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useText } from '../../context/TextContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useSettingsPreferences } from '../../context/SettingsPreferencesContext';
import { urlFichierSite } from '../../utils/siteAssets';
import { traduire } from '../../i18n';

const LIENS = [
  { to: '/a-propos', label: traduire('À propos') },
  { to: '/contact', label: traduire('Contact') },
  { to: '/faq', label: traduire('FAQ / Aide') },
];

// En-tête public partagé par les pages avant connexion (Accueil, Contact, FAQ) : même
// logo, même nav, même sélecteur de langue partout, pour que ces pages se comportent
// comme un seul petit site plutôt que des écrans isolés.
export default function PublicHeader() {
  const { settings } = useSiteSettings();
  const { prefs, update } = useSettingsPreferences();
  const { pathname } = useLocation();
  const logo = urlFichierSite(settings.logo_principal_url) || '/logo-univ-mahajanga.png';
  const logoEstSvg = /\.svg$/i.test(logo);
  const nomInstitution = useText('institution.nom', 'Université de Mahajanga', 'Institution');

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img
            src={logo}
            alt={traduire(nomInstitution)}
            className={logoEstSvg ? 'h-8 w-8 object-contain' : 'h-8 w-8 rounded-md object-contain'}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <span className="font-semibold text-navy dark:text-gold text-sm sm:text-base">{traduire(nomInstitution)}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {LIENS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`text-sm font-medium transition ${
                pathname === to
                  ? 'text-navy dark:text-gold'
                  : 'text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-gold'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div role="group" aria-label={traduire('Langue')} className="hidden sm:inline-flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden text-xs">
            {[{ code: 'fr', label: traduire('FR') }, { code: 'en', label: traduire('EN') }].map(({ code, label }) => (
              <button
                key={code}
                type="button"
                onClick={() => update('langue', code)}
                aria-pressed={prefs.langue === code}
                className={`px-2.5 py-1 font-medium ${prefs.langue === code ? 'bg-navy text-white' : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition"
          >
            <LogIn size={15} />
            {traduire('Se connecter')}
          </Link>
        </div>
      </div>

      <nav className="md:hidden flex items-center gap-5 px-4 pb-3 overflow-x-auto">
        {LIENS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={`text-sm font-medium whitespace-nowrap ${
              pathname === to ? 'text-navy dark:text-gold' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
