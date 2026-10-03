import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserRound, Mail, Phone, Briefcase, Hash, BadgeCheck, ShieldCheck, Eye, EyeOff, Laptop, MonitorSmartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { changePassword } from '../../services/authApi';
import SettingsCard from '../../components/settings/SettingsCard';
import { traduire } from '../../i18n';

const STATUS_STYLES = {
  active: 'bg-status-approved/10 text-status-approved',
  inactive: 'bg-status-rejected/10 text-status-rejected',
  pending: 'bg-status-pending/10 text-status-pending',
};
const STATUS_LABELS = { active: 'Actif', inactive: 'Inactif', pending: 'En attente' };
const isPersonnel = (role) => role === 'PE' || role === 'PAT';

export function ProfilCompte() {
  const { user } = useAuth();
  const fullName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.email;
  const initial = (user?.prenom?.[0] || user?.email?.[0] || '?').toUpperCase();

  return (
    <SettingsCard icon={UserRound} title={traduire('Profil et compte')} description={traduire('Informations liées à votre compte SGRH.')}>
      <div className="flex items-center gap-4 py-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-navy text-xl font-semibold text-white dark:bg-gold dark:text-navy">
          {initial}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-slate-800 dark:text-gray-100 truncate">{fullName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user?.fonction || traduire('Fonction non renseignée')}</p>
          {user?.status && (
            <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[user.status] || ''}`}>
              {STATUS_LABELS[user.status] || user.status}
            </span>
          )}
        </div>
      </div>

      {[
        { icon: Hash, label: traduire('Matricule'), value: user?.matricule },
        { icon: Mail, label: traduire('Email'), value: user?.email },
        { icon: Phone, label: traduire('Téléphone'), value: user?.telephone },
        { icon: Briefcase, label: traduire('Fonction'), value: user?.fonction },
      ].map(({ icon: Icon, label, value }) => (
        <div key={label} className="flex items-center gap-3 py-4">
          <Icon size={16} className="text-slate-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-gray-400">{label}</p>
            <p className="text-sm font-medium text-slate-800 dark:text-gray-100 truncate">{value || traduire('Non renseigné')}</p>
          </div>
        </div>
      ))}

      {isPersonnel(user?.role) && (
        <div className="pt-4">
          <Link to="/profil" className="inline-flex items-center gap-1 text-sm font-medium text-navy hover:underline dark:text-gold">
            <BadgeCheck size={16} /> Modifier ma photo et mes informations personnelles
          </Link>
        </div>
      )}
    </SettingsCard>
  );
}

function computeStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return Math.min(score, 4);
}
const STRENGTH_LABELS = ['Très faible', 'Faible', 'Moyen', 'Fort'];
const STRENGTH_COLORS = ['bg-status-rejected', 'bg-status-rejected', 'bg-status-pending', 'bg-status-approved'];

export function Securite() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [status, setStatus] = useState(null);
  const [feedback, setFeedback] = useState('');
  const strength = computeStrength(newPassword);

  async function handleSubmit(e) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setStatus('error');
      setFeedback(traduire('Les nouveaux mots de passe ne correspondent pas.'));
      return;
    }
    setStatus('loading');
    try {
      await changePassword(currentPassword, newPassword);
      setStatus('success');
      setFeedback(traduire('Mot de passe mis à jour.'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setStatus('error');
      setFeedback(err.message);
    }
  }

  const inputType = showPwd ? 'text' : 'password';
  const inputClass = 'w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-navy';

  return (
    <SettingsCard icon={ShieldCheck} title={traduire('Sécurité')} description={traduire('Changez votre mot de passe régulièrement pour protéger votre compte.')}>
      <form onSubmit={handleSubmit} className="space-y-4 py-4">
        <input type={inputType} required placeholder={traduire('Mot de passe actuel')} value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)} className={inputClass} />

        <div className="relative">
          <input type={inputType} required minLength={8} placeholder={traduire('Nouveau mot de passe')} value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} className={inputClass} />
          <button type="button" onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {newPassword && (
          <div>
            <div className="flex h-1.5 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`flex-1 rounded-full ${i < strength ? STRENGTH_COLORS[strength - 1] || STRENGTH_COLORS[0] : 'bg-slate-200 dark:bg-gray-600'}`} />
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{STRENGTH_LABELS[Math.max(strength - 1, 0)]}</p>
          </div>
        )}

        <input type={inputType} required minLength={8} placeholder={traduire('Confirmer le nouveau mot de passe')} value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)} className={inputClass} />

        <button type="submit" disabled={status === 'loading'}
          className="w-full bg-navy text-white rounded-md py-2 font-medium hover:opacity-90 disabled:opacity-50 dark:bg-gold dark:text-navy">
          {status === 'loading' ? 'Mise à jour...' : traduire('Mettre à jour le mot de passe')}
        </button>
        {feedback && (
          <p className={`text-sm ${status === 'success' ? 'text-status-approved' : 'text-status-rejected'}`}>{feedback}</p>
        )}
      </form>
    </SettingsCard>
  );
}

export function Sessions() {
  const ua = navigator.userAgent;
  const browser = /Chrome/i.test(ua) ? 'Chrome' : /Firefox/i.test(ua) ? traduire('Firefox') : /Safari/i.test(ua) ? traduire('Safari') : traduire('Navigateur');
  const device = /Mobile|Android|iPhone/i.test(ua) ? 'Mobile' : traduire('Ordinateur');

  return (
    <SettingsCard icon={MonitorSmartphone} title={traduire('Sessions')} description={traduire('Appareils actuellement connectés à votre compte.')}>
      <div className="flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <Laptop size={20} className="text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-gray-100">{device} · {browser}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{traduire("Dernière activité : à l\'instant")}</p>
          </div>
        </div>
        <span className="rounded-full bg-status-approved/10 px-2.5 py-1 text-xs font-medium text-status-approved">{traduire('Session actuelle')}</span>
      </div>
      <div className="py-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{traduire('Aucune autre session active détectée.')}</p>
        <button type="button" disabled title={traduire('Nécessite une implémentation backend')}
          className="text-sm font-medium text-status-rejected opacity-50 cursor-not-allowed">
          {traduire('Se déconnecter de toutes les autres sessions')}
        </button>
      </div>
    </SettingsCard>
  );
}