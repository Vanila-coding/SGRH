import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { getActivityLog } from '../../services/activityLogApi';
import PageHeader from '../../components/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { ACTION_LABELS } from '../../constants/activityLabels';
import SelectMenu from '../../components/ui/SelectMenu';
import ViewToggle from '../../components/ui/ViewToggle';
import useVueListe from '../../hooks/useVueListe';
import { traduire } from '../../i18n';
import { traduireJournal } from '../../i18n/journal';

export default function Historique() {
  const [vue, setVue] = useVueListe('journal');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [recherche, setRecherche] = useState('');

  useEffect(() => {
    getActivityLog(200).then(setLogs).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return logs.filter((l) => {
      const matchType = !filterType || l.action_type === filterType;
      const matchRecherche = !terme || [l.description, l.email, l.nom, l.prenom]
        .some((champ) => champ && champ.toLowerCase().includes(terme));
      return matchType && matchRecherche;
    });
  }, [logs, filterType, recherche]);

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader crumbs={[{ label: traduire('Admin RH') }, { label: traduire('Audit & journal') }]} title={traduire('Audit & journal')} subtitle={traduire('Historique des actions effectuées dans le SGRH')} />
      <div className="flex justify-end mb-3">
        <ViewToggle value={vue} onChange={setVue} />
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={traduire('Rechercher par personne ou description...')}
            className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>
        <SelectMenu
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy shrink-0"
        >
          <option value="">{traduire("Tous les types d\'action")}</option>
          {Object.entries(ACTION_LABELS).map(([type, { label }]) => (
            <option key={type} value={type}>{label}</option>
          ))}
        </SelectMenu>
      </div>

      {!loading && filtered.length === 0 && (
        <p className="text-gray-400 text-sm">
          {logs.length === 0 ? 'Aucune activité enregistrée.' : traduire('Aucune activité ne correspond à ce filtre.')}
        </p>
      )}

      {loading && (
        <div className={vue === 'liste' ? 'space-y-2' : 'grid grid-cols-1 lg:grid-cols-2 gap-2'} role="status" aria-label={traduire("Chargement du journal d\'activité")}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-start gap-3">
              <Skeleton className="h-5 w-28 rounded shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-2/3 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={vue === 'liste' ? 'space-y-2' : 'grid grid-cols-1 lg:grid-cols-2 gap-2'}>
        {!loading && filtered.map((log) => {
          const meta = ACTION_LABELS[log.action_type] || { label: log.action_type, color: 'bg-gray-100 text-gray-600' };
          return (
            <div key={log.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-start gap-3">
              <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap mt-0.5 ${meta.color}`}>
                {meta.label}
              </span>
              <div className="flex-1">
                <p className="text-sm text-navy dark:text-gray-100">{traduireJournal(log.description)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {log.email ? `${log.prenom || ''} ${log.nom || log.email}`.trim() : traduire('Système')}
                  {' — '}
                  {new Date(log.created_at).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
