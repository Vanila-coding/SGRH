import { useEffect, useMemo, useState } from 'react';
import { Trash2, Search } from 'lucide-react';
import { listCorbeille, restoreFromCorbeille, deletePermanently, emptyCorbeille } from '../../services/corbeilleApi';
import PageHeader from '../../components/PageHeader';
import { SkeletonCard } from '../../components/ui/Skeleton';
import ViewToggle from '../../components/ui/ViewToggle';
import useVueListe, { classeConteneur } from '../../hooks/useVueListe';
import { traduire } from '../../i18n';

const TYPE_LABELS = { compte: 'Compte utilisateur' };

export default function Corbeille() {
  const [vue, setVue] = useVueListe('corbeille');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmEmptyAll, setConfirmEmptyAll] = useState(false);
  const [emptying, setEmptying] = useState(false);
  const [recherche, setRecherche] = useState('');

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

  useEffect(() => {
    listCorbeille()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

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

  const filtered = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    if (!terme) return items;
    return items.filter((item) => {
      const donnees = item.type_element === 'compte' ? item.donnees?.user : item.donnees;
      return [donnees?.email, donnees?.role, donnees?.id, item.supprime_par_email]
        .some((champ) => champ != null && String(champ).toLowerCase().includes(terme));
    });
  }, [items, recherche]);

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        crumbs={[{ label: traduire('Administration') }, { label: traduire('Corbeille') }]}
        title={traduire('Corbeille')}
        subtitle={traduire("Les éléments supprimés restent ici jusqu'à restauration ou suppression définitive")}
      />
      <div className="flex justify-end mb-3">
        <ViewToggle value={vue} onChange={setVue} />
      </div>

      {!loading && items.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder={traduire('Rechercher par email, rôle ou supprimé par...')}
              className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          {confirmEmptyAll ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{traduire('Supprimer définitivement les')} {items.length} {traduire('éléments ?')}</span>
              <button
                onClick={handleEmptyAll}
                disabled={emptying}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-status-rejected text-white disabled:opacity-50"
              >
                {emptying ? '...' : traduire('Confirmer')}
              </button>
              <button
                onClick={() => setConfirmEmptyAll(false)}
                disabled={emptying}
                className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {traduire('Annuler')}
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
      {!loading && items.length === 0 && <p className="text-gray-500">{traduire('La corbeille est vide.')}</p>}
      {!loading && items.length > 0 && filtered.length === 0 && (
        <p className="text-gray-500">{traduire('Aucun élément ne correspond à cette recherche.')}</p>
      )}

      {loading ? (
        <div className={classeConteneur(vue, 3)}>
          <SkeletonCard lines={1} />
          <SkeletonCard lines={1} />
        </div>
      ) : (
      <div className={classeConteneur(vue, 3)}>
        {filtered.map((item) => {
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
                  {traduire('Restaurer')}
                </button>
                {confirmDeleteId === item.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-status-rejected text-white"
                    >
                      {traduire('Confirmer')}
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    >
                      {traduire('Annuler')}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(item.id)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-status-rejected"
                  >
                    {traduire('Suppr. définitive')}
                  </button>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Supprimé par {item.supprime_par_email || traduire('système')} le {new Date(item.supprime_le).toLocaleString('fr-FR')}
            </p>
          </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
