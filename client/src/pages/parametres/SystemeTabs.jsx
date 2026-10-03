import { Sparkles, Wrench, CheckCircle2 } from 'lucide-react';
import SettingsCard from '../../components/settings/SettingsCard';
import { traduire } from '../../i18n';

const FONCTIONNALITES = ['Notifications', 'Historique de carrière', 'Documents RH', 'Statistiques'];

export function Fonctionnalites() {
  return (
    <SettingsCard icon={Sparkles} title={traduire('Fonctionnalités')} description={traduire('État des modules actuellement actifs dans le SGRH.')}>
      {FONCTIONNALITES.map((f) => (
        <div key={f} className="flex items-center justify-between py-4">
          <p className="text-sm font-medium text-slate-800 dark:text-gray-100">{f}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-status-approved/10 px-2.5 py-1 text-xs font-medium text-status-approved">
            <CheckCircle2 size={12} /> Actif
          </span>
        </div>
      ))}
    </SettingsCard>
  );
}

export function Maintenance() {
  return (
    <SettingsCard icon={Wrench} title={traduire('Maintenance')} description={traduire('Informations système et mode maintenance.')}>
      <div className="flex items-center justify-between py-4">
        <p className="text-sm font-medium text-slate-800 dark:text-gray-100">{traduire('État du système')}</p>
        <span className="rounded-full bg-status-approved/10 px-2.5 py-1 text-xs font-medium text-status-approved">{traduire('Opérationnel')}</span>
      </div>
      <div className="flex items-center justify-between py-4">
        <p className="text-sm font-medium text-slate-800 dark:text-gray-100">{traduire('Dernière synchronisation')}</p>
        <span className="text-sm text-gray-500 dark:text-gray-400">{traduire('Non disponible')}</span>
      </div>
      <div className="flex items-center justify-between py-4">
        <p className="text-sm font-medium text-slate-800 dark:text-gray-100">{traduire('Mode maintenance')}</p>
        <span className="text-xs text-gray-400" title={traduire('Nécessite une implémentation backend')}>{traduire('Non configurable (backend requis)')}</span>
      </div>
    </SettingsCard>
  );
}