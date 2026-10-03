import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { resetPassword } from '../services/passwordResetApi';
import Footer from '../components/layout/Footer';
import { traduire } from '../i18n';

export default function ReinitialiserMotDePasse() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage(traduire('Les mots de passe ne correspondent pas.'));
      return;
    }
    setStatus('loading');
    try {
      await resetPassword(token, password);
      setStatus('success');
      setMessage(traduire('Mot de passe réinitialisé. Vous pouvez vous connecter.'));
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
        <p className="text-status-rejected">{traduire('Lien invalide : aucun token fourni.')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <h1 className="text-lg font-bold text-navy dark:text-gray-100 mb-6">{traduire('Choisir un nouveau mot de passe')}</h1>

          {status !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder={traduire('Nouveau mot de passe')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 rounded-full pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:bg-white dark:focus:bg-gray-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy dark:hover:text-gold"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  placeholder={traduire('Confirmer le mot de passe')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-100 rounded-full pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-navy focus:bg-white dark:focus:bg-gray-700"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full bg-navy text-white rounded-full py-3 font-medium hover:opacity-90 disabled:opacity-50"
              >
                {status === 'loading' ? 'Enregistrement...' : traduire('Réinitialiser')}
              </button>
              {status === 'error' && <p className="text-sm text-status-rejected">{message}</p>}
            </form>
          )}

          {status === 'success' && (
            <div>
              <p className="text-sm text-status-approved mb-4">{message}</p>
              <Link to="/login" className="text-navy dark:text-gold font-medium text-sm">{traduire('Se connecter')}</Link>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}