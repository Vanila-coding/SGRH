import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { listCorbeille, restoreFromCorbeille, deletePermanently, emptyCorbeille } from '../../services/corbeilleApi';
import PageHeader from '../../components/PageHeader';
import { SkeletonCard } from '../../components/ui/Skeleton';

const TYPE_LABELS = { compte: 'Compte utilisateur' };

export default function Corbeille() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmEmptyAll, setConfirmEmptyAll] = useState(false);
  const [emptying, setEmptying] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setItems(await listCorbeille());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRestore(id) {
    setError('');
    try {
      await restoreFromCorbeille(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setError('');
    try {
      await deletePermanently(id);
      setConfirmDeleteId(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleEmptyAll() {
    setError('');
    setEmptying(true);
    try {
      await emptyCorbeille();
      setConfirmEmptyAll(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setEmptying(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader
        crumbs={[{ label: 'Administration' }, { label: 'Corbeille' }]}
        title="Corbeille"
        subtitle="Les éléments supprimés restent ici jusqu'à restauration ou suppression définitive"
      />

      {!loading && items.length > 0 && (
        <div className="flex justify-end mb-4">
          {confirmEmptyAll ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Supprimer définitivement les {items.length} éléments ?</span>
              <button
                onClick={handleEmptyAll}
                disabled={emptying}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-status-rejected text-white disabled:opacity-50"
              >
                {emptying ? '...' : 'Confirmer'}
              </button>
              <button
                onClick={() => setConfirmEmptyAll(false)}
                disabled={emptying}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmEmptyAll(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border border-status-rejected text-status-rejected hover:bg-red-50"
            >
              <Trash2 size={14} /> Vider la corbeille
            </button>
          )}
        </div>
      )}

      {error && <p className="text-sm text-status-rejected mb-4">{error}</p>}
      {!loading && items.length === 0 && <p className="text-gray-500">La corbeille est vide.</p>}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {items.map((item) => {
          // Un compte utilisateur (`archiveAndDeleteCompte`) est archivé avec ses données
          // liées (congés, notifications...) : l'utilisateur lui-même est imbriqué sous
          // `donnees.user`. Les autres types (`personnel_modifie`...) stockent la ligne
          // directement à plat sous `donnees`.
          const donnees = item.type_element === 'compte' ? item.donnees?.user : item.donnees;
          return (
          <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mr-2">
                  {TYPE_LABELS[item.type_element] || item.type_element}
                </span>
                <span className="text-sm text-navy dark:text-gray-100 font-medium">
                  {donnees?.email || `#${donnees?.id}`}
                </span>
                <span className="text-xs text-gray-400 ml-2">— {donnees?.role}</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRestore(item.id)}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border border-status-approved text-status-approved hover:bg-green-50"
                >
                  Restaurer
                </button>
                {confirmDeleteId === item.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(item.id)}
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
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-status-rejected"
                  >
                    Suppr. définitive
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Supprimé par {item.supprime_par_email || 'système'} le {new Date(item.supprime_le).toLocaleString('fr-FR')}
            </p>
          </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
