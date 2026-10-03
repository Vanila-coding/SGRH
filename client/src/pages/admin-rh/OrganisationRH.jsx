import { useEffect, useState } from 'react';
import { Building2, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { toast } from '../../utils/toast';
import { ConfirmDialog, SkeletonCard } from '../../components/ui';
import {
  fetchDirections, fetchServices, createDirection, deleteDirection, createService, deleteService,
} from '../../services/organisationApi';

const inputClass = 'flex-1 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy';

// Gestion des directions et services de l'université : ajout et suppression
// uniquement (pas de renommage), pour rester strictement dans le périmètre demandé.
// La suppression est bloquée côté backend si des services ou du personnel en
// dépendent encore ; le message renvoyé par l'API explique pourquoi.
export default function OrganisationRH() {
  const [directions, setDirections] = useState(null);
  const [servicesByDirection, setServicesByDirection] = useState({});
  const [openDirectionId, setOpenDirectionId] = useState(null);

  const [nouvelleDirection, setNouvelleDirection] = useState('');
  const [creatingDirection, setCreatingDirection] = useState(false);
  const [nouveauServiceNom, setNouveauServiceNom] = useState({});
  const [creatingServiceFor, setCreatingServiceFor] = useState(null);
  const [confirmCible, setConfirmCible] = useState(null); // { type: 'direction'|'service', id, nom }
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const list = await fetchDirections();
    setDirections(list);
  }

  useEffect(() => { load(); }, []);

  async function toggleDirection(direction) {
    if (openDirectionId === direction.id) { setOpenDirectionId(null); return; }
    setOpenDirectionId(direction.id);
    if (!servicesByDirection[direction.id]) {
      const services = await fetchServices(direction.id).catch(() => []);
      setServicesByDirection((prev) => ({ ...prev, [direction.id]: services }));
    }
  }

  async function handleCreateDirection(e) {
    e.preventDefault();
    if (creatingDirection) return;
    setCreatingDirection(true);
    try {
      await createDirection(nouvelleDirection);
      setNouvelleDirection('');
      toast.success('Direction créée.');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreatingDirection(false);
    }
  }

  async function handleCreateService(e, direction) {
    e.preventDefault();
    if (creatingServiceFor) return;
    const nom = nouveauServiceNom[direction.id] || '';
    setCreatingServiceFor(direction.id);
    try {
      await createService(nom, direction.id);
      setNouveauServiceNom((prev) => ({ ...prev, [direction.id]: '' }));
      toast.success('Service créé.');
      const services = await fetchServices(direction.id);
      setServicesByDirection((prev) => ({ ...prev, [direction.id]: services }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreatingServiceFor(null);
    }
  }

  async function handleConfirmDelete() {
    if (!confirmCible || deleting) return;
    setDeleting(true);
    try {
      if (confirmCible.type === 'direction') {
        await deleteDirection(confirmCible.id);
        toast.success('Direction supprimée.');
        await load();
        setServicesByDirection((prev) => {
          const next = { ...prev };
          delete next[confirmCible.id];
          return next;
        });
      } else {
        await deleteService(confirmCible.id);
        toast.success('Service supprimé.');
        const services = await fetchServices(confirmCible.directionId);
        setServicesByDirection((prev) => ({ ...prev, [confirmCible.directionId]: services }));
      }
      setConfirmCible(null);
    } catch (err) {
      toast.error(err.message);
      setConfirmCible(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        crumbs={[{ label: 'Admin RH' }, { label: 'Personnel', path: '/admin/personnel' }, { label: 'Directions & services' }]}
        title="Directions & services"
        subtitle="Structure de l'université : ajoutez ou supprimez une direction et ses services"
      />

      <form onSubmit={handleCreateDirection} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 flex flex-wrap gap-2">
        <input
          type="text" value={nouvelleDirection} onChange={(e) => setNouvelleDirection(e.target.value)}
          placeholder="Nom de la nouvelle direction" maxLength={150} required className={`${inputClass} min-w-0`}
        />
        <button
          type="submit" disabled={creatingDirection}
          className="flex items-center gap-1.5 bg-navy text-white rounded-md px-4 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 shrink-0"
        >
          <Plus size={16} aria-hidden="true" /> {creatingDirection ? 'Création...' : 'Ajouter une direction'}
        </button>
      </form>

      {!directions && <SkeletonCard lines={4} />}

      {directions?.length === 0 && (
        <p className="text-sm text-gray-400 px-1">Aucune direction enregistrée pour le moment.</p>
      )}

      <div className="space-y-3">
        {directions?.map((direction) => {
          const ouverte = openDirectionId === direction.id;
          const services = servicesByDirection[direction.id];
          return (
            <div key={direction.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <button
                type="button"
                onClick={() => toggleDirection(direction)}
                aria-expanded={ouverte}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Building2 size={18} className="text-navy dark:text-gold shrink-0" aria-hidden="true" />
                  <span className="font-medium text-navy dark:text-gray-100 truncate">{direction.nom}</span>
                </span>
                <span className="flex items-center gap-3 shrink-0">
                  <span
                    role="button" tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); setConfirmCible({ type: 'direction', id: direction.id, nom: direction.nom }); }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); setConfirmCible({ type: 'direction', id: direction.id, nom: direction.nom }); } }}
                    aria-label={`Supprimer la direction ${direction.nom}`}
                    className="text-gray-400 hover:text-status-rejected"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </span>
                  {ouverte ? <ChevronUp size={18} className="text-gray-400" aria-hidden="true" /> : <ChevronDown size={18} className="text-gray-400" aria-hidden="true" />}
                </span>
              </button>

              {ouverte && (
                <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
                  {services === undefined && <p className="text-xs text-gray-400">Chargement...</p>}
                  {services?.length === 0 && <p className="text-xs text-gray-400 mb-2">Aucun service dans cette direction.</p>}
                  {services && services.length > 0 && (
                    <ul className="space-y-1.5 mb-3">
                      {services.map((service) => (
                        <li key={service.id} className="flex items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <span className="truncate">{service.nom}</span>
                          <button
                            type="button"
                            onClick={() => setConfirmCible({ type: 'service', id: service.id, nom: service.nom, directionId: direction.id })}
                            aria-label={`Supprimer le service ${service.nom}`}
                            className="text-gray-400 hover:text-status-rejected shrink-0"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form onSubmit={(e) => handleCreateService(e, direction)} className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={nouveauServiceNom[direction.id] || ''}
                      onChange={(e) => setNouveauServiceNom((prev) => ({ ...prev, [direction.id]: e.target.value }))}
                      placeholder="Nom du nouveau service" maxLength={150} required
                      className={`${inputClass} text-xs py-1 min-w-0`}
                    />
                    <button
                      type="submit" disabled={creatingServiceFor === direction.id}
                      className="flex items-center gap-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-navy dark:text-gray-100 rounded-md px-3 py-1 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 shrink-0"
                    >
                      <Plus size={14} aria-hidden="true" /> Ajouter
                    </button>
                  </form>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirmCible}
        title={confirmCible?.type === 'direction' ? 'Supprimer la direction' : 'Supprimer le service'}
        message={confirmCible ? `Confirmez-vous la suppression de « ${confirmCible.nom} » ? Cette action est bloquée s'il reste des services ou des personnes rattachées.` : ''}
        confirmLabel="Supprimer"
        danger
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmCible(null)}
      />
    </div>
  );
}
