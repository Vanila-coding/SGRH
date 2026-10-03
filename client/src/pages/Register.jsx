import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestOtp, verifyOtp, registerWithMatricule } from '../services/otpApi';
import Footer from '../components/layout/Footer';
import { traduire } from '../i18n';

export default function Register() {
  const [step, setStep] = useState('contact'); // 'contact' | 'otp' | 'matricule' | 'done'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [matricule, setMatricule] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestOtp(email);
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(index, value) {
    if (!/^[0-9]?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyOtp(email, otp.join(''));
      setStep('matricule');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(traduire('Les mots de passe ne correspondent pas.'));
      return;
    }
    setLoading(true);
    try {
      await registerWithMatricule(email, matricule, password);
      setStep('done');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-sm">
          <h1 className="text-lg font-bold text-navy dark:text-gray-100 mb-1">{traduire('Créer mon compte')}</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">{traduire('Université de Mahajanga — Espace personnel')}</p>

          {step === 'contact' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Adresse email')}</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={traduire('votre.email@example.com')}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-navy text-white rounded-md py-2 font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Envoi...' : traduire('Recevoir le code de vérification')}
              </button>
              {error && <p className="text-sm text-status-rejected">{error}</p>}
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">{traduire('Code envoyé à')} {email}</p>
              <div className="flex gap-2 justify-center">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    className="w-12 h-12 text-center text-lg border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-navy"
                  />
                ))}
              </div>
              <button
                type="submit"
                disabled={loading || otp.some((d) => d === '')}
                className="w-full bg-navy text-white rounded-md py-2 font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Vérification...' : traduire('Vérifier le code')}
              </button>
              {error && <p className="text-sm text-status-rejected">{error}</p>}
            </form>
          )}

          {step === 'matricule' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Matricule (6 chiffres)')}</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Mot de passe')}</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Confirmer le mot de passe')}</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-white rounded-md py-2 font-medium hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Création...' : traduire('Créer mon compte')}
              </button>
              {error && <p className="text-sm text-status-rejected">{error}</p>}
            </form>
          )}

          {step === 'done' && (
            <div className="text-center">
              <p className="text-status-approved font-medium mb-2">{traduire('Compte créé avec succès')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {traduire("Votre compte est en attente de validation par l\'administration RH.")}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6">
            Déjà un compte ? <Link to="/login" className="text-navy dark:text-gold font-medium">{traduire('Se connecter')}</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}