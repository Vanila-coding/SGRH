import { useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { getPendingAccounts, approvePendingAccount, rejectPendingAccount } from '../../services/personnelApi';
import PageHeader from '../../components/PageHeader';
import { SkeletonCard } from '../../components/ui/Skeleton';
import ViewToggle from '../../components/ui/ViewToggle';
import useVueListe, { classeConteneur } from '../../hooks/useVueListe';

export default function ComptesEnAttente() {
  const [vue, setVue] = useVueListe('comptes-en-attente');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [action, setAction] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setAccounts(await getPendingAccounts());
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAction(id, type, request) {
    setActionError('');
    setAction({ id, type });
    try {
      await request(id);
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setAction(null);
    }
  }

  const handleApprove = (id) => handleAction(id, 'approve', approvePendingAccount);
  const handleReject = (id) => handleAction(id, 'reject', rejectPendingAccount);

  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Admin RH' }, { label: 'Utilisateurs & comptes' }, { label: 'Comptes en attente' }]}
        title="Comptes en attente"
        subtitle="Comptes créés via matricule + code de vérification, en attente d'activation"
      />
      <div className="flex justify-end mb-3">
        <ViewToggle value={vue} onChange={setVue} />
      </div>

      {actionError && <p className="text-sm text-status-rejected mb-4">{actionError}</p>}
      {!loading && accounts.length === 0 && <p className="text-gray-500">Aucun compte en attente.</p>}

      {loading ? (
        <div className={classeConteneur(vue, 4)}>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      ) : (
      <div className={classeConteneur(vue, 4)}>
        {accounts.map((a) => (
        <div key={a.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-navy dark:text-gray-100">{a.prenom} {a.nom}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{a.email} — Matricule {a.matricule}</p>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{a.role}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleReject(a.id)}
                disabled={action?.id === a.id}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-status-rejected text-status-rejected text-sm font-medium hover:bg-red-50 disabled:opacity-60 disabled:cursor-wait"
              >
                {action?.id === a.id && action.type === 'reject' && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
                {action?.id === a.id && action.type === 'reject' ? 'Refus…' : 'Refuser'}
              </button>
              <button
                onClick={() => handleApprove(a.id)}
                disabled={action?.id === a.id}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-navy text-white text-sm font-medium hover:opacity-90 disabled:opacity-60 disabled:cursor-wait"
              >
                {action?.id === a.id && action.type === 'approve' && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}
                {action?.id === a.id && action.type === 'approve' ? 'Activation…' : 'Activer'}
              </button>
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
