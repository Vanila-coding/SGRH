import { useEffect, useState } from 'react';
import { listAccounts, deactivateAccount, reactivateAccount, changeAccountRole, deleteAccount } from '../../services/accountAdminApi';
import PageHeader from '../../components/PageHeader';
import { SkeletonCard } from '../../components/ui/Skeleton';

const ROLE_LABELS = {
  ADMIN_RH: 'Admin RH', SUPERADMIN: 'Superadmin', PE: 'Personnel PE', PAT: 'Personnel PAT',
  SECRETAIRE_PE: 'Secrétaire PE', SECRETAIRE_PAT: 'Secrétaire PAT',
};
// Promotion réversible : un compte PE/PAT devient secrétaire de sa propre catégorie
// (et inversement), sans jamais toucher sa fiche personnel — même transitions que
// accountAdminController.changeRole côté backend.
const TRANSITIONS_SECRETARIAT = { PE: 'SECRETAIRE_PE', SECRETAIRE_PE: 'PE', PAT: 'SECRETAIRE_PAT', SECRETAIRE_PAT: 'PAT' };

export default function Comptes() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setAccounts(await listAccounts());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleToggleStatus(account) {
    setError('');
    try {
      if (account.status === 'active') {
        await deactivateAccount(account.id);
      } else {
        await reactivateAccount(account.id);
      }
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleChangeRole(account) {
    setError('');
    try {
      await changeAccountRole(account.id, TRANSITIONS_SECRETARIAT[account.role]);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await deleteAccount(id);
      setConfirmDeleteId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const filtered = filterRole ? accounts.filter((a) => a.role === filterRole) : accounts;

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader crumbs={[{ label: 'Administration' }, { label: 'Gestion des comptes' }]} title="Gestion des comptes" subtitle="Activer, désactiver ou supprimer un compte utilisateur" />
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilterRole('')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium ${filterRole === '' ? 'bg-navy text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}
        >
          Tous ({accounts.length})
        </button>
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${filterRole === role ? 'bg-navy text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}
          >
            {label} ({accounts.filter((a) => a.role === role).length})
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-status-rejected mb-4">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map((a) => (
          <div key={a.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-navy dark:text-gray-100 truncate">
                  {a.nom ? [a.prenom, a.nom].filter(Boolean).join(' ') : (a.email || `Compte #${a.id}`)}
                </p>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shrink-0">{ROLE_LABELS[a.role]}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${
                  a.status === 'active' ? 'bg-green-50 text-status-approved' :
                  a.status === 'pending' ? 'bg-amber-50 text-status-pending' : 'bg-red-50 text-status-rejected'
                }`}>
                  {a.status === 'active' ? 'Actif' : a.status === 'pending' ? 'En attente' : 'Désactivé'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 truncate">
                {a.email} {a.matricule && `— Matricule ${a.matricule}`}
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 shrink-0">
              {TRANSITIONS_SECRETARIAT[a.role] && (
                <button
                  onClick={() => handleChangeRole(a)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {a.role.startsWith('SECRETAIRE_') ? 'Retirer le secrétariat' : 'Désigner secrétaire'}
                </button>
              )}
              <button
                onClick={() => handleToggleStatus(a)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border ${
                  a.status === 'active'
                    ? 'border-status-rejected text-status-rejected hover:bg-red-50'
                    : 'border-status-approved text-status-approved hover:bg-green-50'
                }`}
              >
                {a.status === 'active' ? 'Désactiver' : 'Activer'}
              </button>

              {confirmDeleteId === a.id ? (
                <div className="flex gap-1">
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-status-rejected text-white"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                  >
                    Annuler
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDeleteId(a.id)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-status-rejected"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
