import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useText } from '../context/TextContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import Footer from '../components/layout/Footer';
import { urlFichierSite } from '../utils/siteAssets';
import { useSettingsPreferences } from '../context/SettingsPreferencesContext';
import { traduire } from '../i18n';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();
  const { prefs, update } = useSettingsPreferences();
  const logoConnexion = urlFichierSite(settings.logo_connexion_url || settings.logo_principal_url) || '/logo-univ-mahajanga.png';
  const logoConnexionEstSvg = /\.svg$/i.test(logoConnexion);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const titreUniversite1 = useText('login.titre_universite_1', 'UNIVERSITÉ', 'Login');
  const titreUniversite2 = useText('login.titre_universite_2', 'DE MAHAJANGA', 'Login');
  const slogan = useText('login.slogan', 'Excellence • Intégrité • Innovation', 'Login');
  const titreBienvenue = useText('login.titre_bienvenue', "Bienvenue sur l'espace RH", 'Login');
  const descriptionBienvenue = useText(
    'login.description_bienvenue',
    "Université de Mahajanga — Plateforme de gestion des ressources humaines. Consultez votre dossier, vos congés et vos notifications en un seul endroit.",
    'Login'
  );
  const labelConnexion = useText('login.label_connexion', 'Connexion', 'Login');
  const titreFormulaire = useText('login.titre_formulaire', 'Accéder à mon espace', 'Login');
  const placeholderEmail = useText('login.placeholder_email', 'Adresse email', 'Login');
  const placeholderMdp = useText('login.placeholder_mdp', 'Mot de passe', 'Login');
  const labelRemember = useText('login.label_remember', 'Se souvenir de moi', 'Login');
  const labelMdpOublie = useText('login.label_mdp_oublie', 'Mot de passe oublié ?', 'Login');
  const boutonConnexion = useText('login.bouton_connexion', 'Se connecter', 'Login');
  const boutonConnexionChargement = useText('login.bouton_connexion_chargement', 'Connexion...', 'Login');
  const texteInscription = useText('login.texte_inscription', 'Pas encore de compte ?', 'Login');
  const lienInscription = useText('login.lien_inscription', 'Créer mon compte', 'Login');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'ADMIN_RH') navigate('/admin/dashboard');
      else if (user.role === 'SUPERADMIN') navigate('/superadmin/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950">
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-3xl shadow-2xl overflow-hidden bg-white dark:bg-gray-800">
          <div className="relative overflow-hidden flex flex-col justify-between p-8 sm:p-10 min-h-[220px] md:min-h-[520px] bg-navy">
            <div className="relative z-10 flex items-center gap-2">
              <img
                src={logoConnexion}
                alt={traduire('Université de Mahajanga')}
                className={logoConnexionEstSvg ? 'h-8 w-8 object-contain brightness-0 invert' : 'h-8 w-8 rounded-md bg-white object-contain p-0.5'}
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            </div>

            <div className="relative z-10 text-white">
              {slogan && <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-2">{traduire(slogan)}</p>}
              <h1 className="text-2xl sm:text-3xl font-bold leading-snug mb-3">{traduire(titreBienvenue)}</h1>
              <p className="text-white/80 text-sm max-w-sm">{traduire(descriptionBienvenue)}</p>
            </div>
          </div>

          <div className="flex items-center justify-center p-8 sm:p-10">
            <div className="w-full max-w-sm">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{traduire(labelConnexion)}</p>
              <div className="flex justify-end mb-2">
                <div role="group" aria-label={traduire('Langue')} className="inline-flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden text-xs">
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
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">{traduire(titreFormulaire)}</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{traduire(placeholderEmail)}</label>
                  <div className="relative">
                    <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{traduire(placeholderMdp)}</label>
                  <div className="relative">
                    <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy dark:hover:text-gold"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-gray-500 dark:text-gray-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="w-4 h-4 accent-navy"
                    />
                    {traduire(labelRemember)}
                  </label>
                  <Link to="/mot-de-passe-oublie" className="text-navy dark:text-gold font-medium hover:underline">
                    {traduire(labelMdpOublie)}
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-navy text-white rounded-xl py-3 font-medium hover:opacity-90 disabled:opacity-50 transition"
                >
                  {traduire(loading ? boutonConnexionChargement : boutonConnexion)}
                </button>

                {error && <p className="text-sm text-status-rejected text-center">{error}</p>}
              </form>

              <p className="text-xs text-gray-400 text-center mt-6">
                {traduire(texteInscription)} <Link to="/register" className="text-navy dark:text-gold font-medium">{traduire(lienInscription)}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}