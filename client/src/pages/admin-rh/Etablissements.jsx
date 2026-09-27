import { useEffect, useState } from 'react';
import { School, Plus } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { toast } from '../../utils/toast';
import { SkeletonCard } from '../../components/ui';
import { fetchEtablissements, createEtablissement, desactiverEtablissement, reactiverEtablissement } from '../../services/etablissementApi';

const inputClass = 'flex-1 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy';

// Gestion des établissements de l'université pour les PE : ajout, désactivation,
// réactivation — jamais de suppression physique, pour ne pas perdre l'historique des
// enseignants qui y sont ou y étaient rattachés (contrairement aux directions/services,
// dont la suppression est bloquée par dépendance plutôt que remplacée par un statut).
export default function Etablissements() {
  const [etablissements, setEtablissements] = useState(null);
  const [nouveauNom, setNouveauNom] = useState('');
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  async function load() {
    const list = await fetchEtablissements();
    setEtablissements(list);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      await createEtablissement(nouveauNom);
      setNouveauNom('');
      toast.success('Établissement créé.');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleToggle(etablissement) {
    if (togglingId) return;
    setTogglingId(etablissement.id);
    try {
      if (etablissement.statut === 'ACTIF') {
        await desactiverEtablissement(etablissement.id);
        toast.success('Établissement désactivé.');
      } else {
        await reactiverEtablissement(etablissement.id);
        toast.success('Établissement réactivé.');
      }
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        crumbs={[{ label: 'Admin RH' }, { label: 'Personnel', path: '/admin/personnel/pe' }, { label: 'Établissements' }]}
        title="Établissements"
        subtitle="Établissements de l'université auxquels rattacher un PE"
      />

      <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 flex flex-wrap gap-2">
        <input
          type="text" value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)}
          placeholder="Nom du nouvel établissement" maxLength={200} required className={`${inputClass} min-w-0`}
        />
        <button
          type="submit" disabled={creating}
          className="flex items-center gap-1.5 bg-navy text-white rounded-md px-4 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 shrink-0"
        >
          <Plus size={16} aria-hidden="true" /> {creating ? 'Création...' : 'Ajouter un établissement'}
        </button>
      </form>

      {!etablissements && <SkeletonCard lines={4} />}
      {etablissements?.length === 0 && (
        <p className="text-sm text-gray-400 px-1">Aucun établissement enregistré pour le moment.</p>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-100 dark:divide-gray-700">
        {etablissements?.map((etablissement) => (
          <div key={etablissement.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="flex items-center gap-2 min-w-0">
              <School size={18} className="text-navy dark:text-gold shrink-0" aria-hidden="true" />
              <span className={`font-medium truncate ${etablissement.statut === 'ACTIF' ? 'text-navy dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 line-through'}`}>
                {etablissement.nom}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${etablissement.statut === 'ACTIF' ? 'bg-green-50 text-status-approved' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                {etablissement.statut === 'ACTIF' ? 'Actif' : 'Inactif'}
              </span>
            </span>
            <button
              type="button"
              onClick={() => handleToggle(etablissement)}
              disabled={togglingId === etablissement.id}
              className="text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 shrink-0"
            >
              {togglingId === etablissement.id ? '...' : etablissement.statut === 'ACTIF' ? 'Désactiver' : 'Réactiver'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
