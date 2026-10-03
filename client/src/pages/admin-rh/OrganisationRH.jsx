import { useEffect, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, ChevronUp, FileSpreadsheet, Pencil, Plus, Trash2, Upload, X } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { toast } from '../../utils/toast';
import { ConfirmDialog, SkeletonCard } from '../../components/ui';
import {
  fetchDirections, fetchServices, createDirection, deleteDirection, createService, deleteService,
  updateDirection, updateService, telechargerModeleOrganisation, importerOrganisationExcel,
} from '../../services/organisationApi';

const inputClass = 'flex-1 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy';
const boutonSecondaire = 'flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-navy dark:text-gray-100 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50';

function Pastille({ actif }) {
  return actif
    ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-status-approved dark:bg-green-900/20 font-medium">Active</span>
    : <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 font-medium">Désactivée</span>;
}

// Gestion des directions et services : ajout, renommage, désactivation (sans suppression
// tant qu'une fiche y est rattachée), suppression si plus aucune dépendance, et import Excel.
export default function OrganisationRH() {
  const [directions, setDirections] = useState(null);
  const [servicesByDirection, setServicesByDirection] = useState({});
  const [openDirectionId, setOpenDirectionId] = useState(null);

  const [nouvelleDirection, setNouvelleDirection] = useState('');
  const [creatingDirection, setCreatingDirection] = useState(false);
  const [nouveauServiceNom, setNouveauServiceNom] = useState({});
  const [creatingServiceFor, setCreatingServiceFor] = useState(null);
  const [confirmCible, setConfirmCible] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [edition, setEdition] = useState(null); // { type, id, directionId?, valeur }
  const [enregistrement, setEnregistrement] = useState(false);
  const [modele, setModele] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resultatImport, setResultatImport] = useState(null);
  const fileInputRef = useRef(null);

  async function load() {
    setDirections(await fetchDirections({ tous: true }));
  }

  useEffect(() => { load(); }, []);

  async function rechargerServices(directionId) {
    const services = await fetchServices(directionId, { tous: true });
    setServicesByDirection((prev) => ({ ...prev, [directionId]: services }));
  }

  async function toggleDirection(direction) {
    if (openDirectionId === direction.id) { setOpenDirectionId(null); return; }
    setOpenDirectionId(direction.id);
    if (!servicesByDirection[direction.id]) await rechargerServices(direction.id).catch(() => {});
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
      await rechargerServices(direction.id);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreatingServiceFor(null);
    }
  }

  async function basculerActif(type, element, directionId) {
    try {
      if (type === 'direction') {
        await updateDirection(element.id, { actif: !element.actif });
        await load();
      } else {
        await updateService(element.id, { actif: !element.actif });
        await rechargerServices(directionId);
      }
      toast.success(element.actif ? 'Désactivé.' : 'Réactivé.');
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function enregistrerEdition() {
    if (!edition || enregistrement) return;
    setEnregistrement(true);
    try {
      if (edition.type === 'direction') {
        await updateDirection(edition.id, { nom: edition.valeur });
        await load();
      } else {
        await updateService(edition.id, { nom: edition.valeur });
        await rechargerServices(edition.directionId);
      }
      setEdition(null);
      toast.success('Nom mis à jour.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnregistrement(false);
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
        await rechargerServices(confirmCible.directionId);
      }
      setConfirmCible(null);
    } catch (err) {
      toast.error(err.message);
      setConfirmCible(null);
    } finally {
      setDeleting(false);
    }
  }

  async function handleModele() {
    setModele(true);
    try {
      await telechargerModeleOrganisation();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setModele(false);
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setResultatImport(null);
    try {
      const resultat = await importerOrganisationExcel(file);
      setResultatImport(resultat);
      await load();
      setServicesByDirection({});
    } catch (err) {
      setResultatImport({ directionsCreees: 0, servicesCrees: 0, erreurs: [{ line: '-', reason: err.message }] });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        crumbs={[{ label: 'Admin RH' }, { label: 'Personnel', path: '/admin/personnel' }, { label: 'Directions & services' }]}
        title="Directions & services"
        subtitle="Structure de l'université : ajoutez, renommez ou désactivez une direction et ses services"
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button type="button" onClick={handleModele} disabled={modele} className={boutonSecondaire}>
          <FileSpreadsheet size={16} /> {modele ? 'Téléchargement…' : 'Modèle d’import'}
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importing} className={boutonSecondaire}>
          <Upload size={16} /> {importing ? 'Import en cours…' : 'Importer un fichier Excel'}
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx" onChange={handleImportFile} className="hidden" />
      </div>

      {resultatImport && (
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm font-medium text-status-approved">
            {resultatImport.directionsCreees} direction(s) et {resultatImport.servicesCrees} service(s) créé(s).
          </p>
          {resultatImport.erreurs?.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-status-rejected font-medium">{resultatImport.erreurs.length} ligne(s) ignorée(s) :</p>
              <ul className="text-xs text-gray-500 list-disc list-inside mt-1">
                {resultatImport.erreurs.map((e, i) => <li key={i}>Ligne {e.line} : {e.reason}</li>)}
              </ul>
            </div>
          )}
          <button onClick={() => setResultatImport(null)} className="text-xs text-navy underline mt-2">Fermer</button>
        </div>
      )}

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
          const editeDirection = edition?.type === 'direction' && edition.id === direction.id;
          return (
            <div key={direction.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden ${direction.actif ? '' : 'opacity-70'}`}>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <button
                  type="button"
                  onClick={() => !editeDirection && toggleDirection(direction)}
                  aria-expanded={ouverte}
                  className="flex items-center gap-2 min-w-0 text-left"
                >
                  <Building2 size={18} className="text-navy dark:text-gold shrink-0" aria-hidden="true" />
                  {editeDirection ? null : (
                    <span className="font-medium text-navy dark:text-gray-100 truncate">{direction.nom}</span>
                  )}
                  {!editeDirection && <Pastille actif={direction.actif} />}
                </button>

                {editeDirection ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      autoFocus value={edition.valeur} maxLength={150}
                      onChange={(e) => setEdition({ ...edition, valeur: e.target.value })}
                      onKeyDown={(e) => { if (e.key === 'Enter') enregistrerEdition(); if (e.key === 'Escape') setEdition(null); }}
                      className={`${inputClass} min-w-0`}
                      aria-label="Nouveau nom de la direction"
                    />
                    <button type="button" onClick={enregistrerEdition} disabled={enregistrement} aria-label="Enregistrer" className="text-status-approved"><Check size={18} /></button>
                    <button type="button" onClick={() => setEdition(null)} aria-label="Annuler" className="text-gray-400"><X size={18} /></button>
                  </div>
                ) : (
                  <span className="flex items-center gap-3 shrink-0">
                    <button type="button" onClick={() => setEdition({ type: 'direction', id: direction.id, valeur: direction.nom })} aria-label={`Renommer la direction ${direction.nom}`} className="text-gray-400 hover:text-navy">
                      <Pencil size={15} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => basculerActif('direction', direction)} className="text-xs font-medium text-navy dark:text-gold underline underline-offset-2">
                      {direction.actif ? 'Désactiver' : 'Réactiver'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmCible({ type: 'direction', id: direction.id, nom: direction.nom })}
                      aria-label={`Supprimer la direction ${direction.nom}`}
                      className="text-gray-400 hover:text-status-rejected"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => toggleDirection(direction)} aria-label={ouverte ? 'Replier' : 'Déplier'}>
                      {ouverte ? <ChevronUp size={18} className="text-gray-400" aria-hidden="true" /> : <ChevronDown size={18} className="text-gray-400" aria-hidden="true" />}
                    </button>
                  </span>
                )}
              </div>

              {ouverte && (
                <div className="border-t border-gray-100 dark:border-gray-700 px-4 py-3">
                  {services === undefined && <p className="text-xs text-gray-400">Chargement...</p>}
                  {services?.length === 0 && <p className="text-xs text-gray-400 mb-2">Aucun service dans cette direction.</p>}
                  {services && services.length > 0 && (
                    <ul className="space-y-1.5 mb-3">
                      {services.map((service) => {
                        const editeService = edition?.type === 'service' && edition.id === service.id;
                        return (
                          <li key={service.id} className="flex items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-300">
                            {editeService ? (
                              <span className="flex items-center gap-2 flex-1">
                                <input
                                  autoFocus value={edition.valeur} maxLength={150}
                                  onChange={(e) => setEdition({ ...edition, valeur: e.target.value })}
                                  onKeyDown={(e) => { if (e.key === 'Enter') enregistrerEdition(); if (e.key === 'Escape') setEdition(null); }}
                                  className={`${inputClass} text-xs py-1 min-w-0`}
                                  aria-label="Nouveau nom du service"
                                />
                                <button type="button" onClick={enregistrerEdition} disabled={enregistrement} aria-label="Enregistrer" className="text-status-approved"><Check size={15} /></button>
                                <button type="button" onClick={() => setEdition(null)} aria-label="Annuler" className="text-gray-400"><X size={15} /></button>
                              </span>
                            ) : (
                              <>
                                <span className="flex items-center gap-2 min-w-0">
                                  <span className="truncate">{service.nom}</span>
                                  <Pastille actif={service.actif} />
                                </span>
                                <span className="flex items-center gap-3 shrink-0">
                                  <button type="button" onClick={() => setEdition({ type: 'service', id: service.id, directionId: direction.id, valeur: service.nom })} aria-label={`Renommer le service ${service.nom}`} className="text-gray-400 hover:text-navy">
                                    <Pencil size={13} aria-hidden="true" />
                                  </button>
                                  <button type="button" onClick={() => basculerActif('service', service, direction.id)} className="text-xs font-medium text-navy dark:text-gold underline underline-offset-2">
                                    {service.actif ? 'Désactiver' : 'Réactiver'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmCible({ type: 'service', id: service.id, nom: service.nom, directionId: direction.id })}
                                    aria-label={`Supprimer le service ${service.nom}`}
                                    className="text-gray-400 hover:text-status-rejected"
                                  >
                                    <Trash2 size={14} aria-hidden="true" />
                                  </button>
                                </span>
                              </>
                            )}
                          </li>
                        );
                      })}
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
        message={confirmCible ? `Confirmez-vous la suppression de « ${confirmCible.nom} » ? Cette action est bloquée s'il reste des services ou des personnes rattachées. Pour retirer une entrée sans la supprimer, utilisez plutôt « Désactiver ».` : ''}
        confirmLabel="Supprimer"
        danger
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmCible(null)}
      />
    </div>
  );
}
