import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { getMonEquipe } from '../../services/personnelApi';
import { SkeletonAvatar, Skeleton } from '../../components/ui/Skeleton';
import ViewToggle from '../../components/ui/ViewToggle';
import useVueListe from '../../hooks/useVueListe';
import { traduire } from '../../i18n';

export default function MonEquipe() {
  const [vue, setVue] = useVueListe('mon-equipe');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMonEquipe().then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-status-rejected text-sm">{error}</p>;

  if (!data) {
    return (
      <div>
        <PageHeader crumbs={[{ label: traduire('Mon espace'), path: '/dashboard' }, { label: traduire('Mon équipe') }]} title={traduire('Mon équipe')} />
      <div className="flex justify-end mb-3">
        <ViewToggle value={vue} onChange={setVue} />
      </div>
        <div className={vue === 'liste' ? 'flex flex-col gap-4' : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'} role="status" aria-label={traduire("Chargement de l'équipe")}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center gap-3">
              <SkeletonAvatar size={40} />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-2/3 rounded" />
                <Skeleton className="h-2.5 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        crumbs={[{ label: traduire('Mon espace'), path: '/dashboard' }, { label: traduire('Mon équipe') }]}
        title={traduire('Mon équipe')}
        subtitle={`${data.portee === 'service' ? 'Service' : traduire('Direction')} : ${data.nom}`}
      />

      {data.equipe.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-sm text-gray-400">{traduire("Aucun membre dans cette équipe pour l'instant.")}</p>
        </div>
      )}
      <div className={vue === 'liste' ? 'flex flex-col gap-4' : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'}>
        {data.equipe.map((m) => (
          <div key={m.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 shrink-0 rounded-full bg-navy text-white flex items-center justify-center text-sm font-bold">
                {(m.prenom?.[0] || m.email[0]).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-navy dark:text-gray-100 truncate">{m.prenom} {m.nom}</p>
                <p className="text-xs text-gray-400 truncate">{m.fonction || m.role} — {m.matricule}</p>
              </div>
            </div>
            {m.en_conge ? (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-status-pending font-medium shrink-0">{traduire('En congé')}</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-status-approved font-medium shrink-0">{traduire('Présent')}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
