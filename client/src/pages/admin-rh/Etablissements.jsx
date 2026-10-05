import { useEffect, useMemo, useState } from 'react';
import { School, Plus, Search, LayoutGrid, List as ListIcon, Check, Pencil, X } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { toast } from '../../utils/toast';
import { SkeletonCard } from '../../components/ui';
import { fetchEtablissements, createEtablissement, desactiverEtablissement, reactiverEtablissement, renommerEtablissement } from '../../services/etablissementApi';
import SelectMenu from '../../components/ui/SelectMenu';
import { traduire } from '../../i18n';

const inputClass = 'flex-1 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy';

// Les établissements n'ont pas de champ "type" en base (juste un nom libre) : la
// catégorie est déduite du nom lui-même, pour un filtre utile sans migration —
// cohérent avec les intitulés réels de l'université (Institut, Faculté, École...).
const CATEGORIES = ['TOUS', 'INSTITUT', 'FACULTE', 'ECOLE', 'AUTRE'];
const CATEGORIE_LABELS = { TOUS: 'Toutes les catégories', INSTITUT: 'Institut', FACULTE: 'Faculté', ECOLE: 'École', AUTRE: 'Autre' };

function categoriser(nom) {
  const n = (nom || '').toLowerCase();
  if (n.includes('institut')) return 'INSTITUT';
  if (n.includes('facult')) return 'FACULTE';
  if (n.includes('ecole') || n.includes('école')) return 'ECOLE';
  return 'AUTRE';
}

// Gestion des établissements de l'université pour les PE : ajout, désactivation,
// réactivation — jamais de suppression physique, pour ne pas perdre l'historique des
// enseignants qui y sont ou y étaient rattachés (contrairement aux directions/services,
// dont la suppression est bloquée par dépendance plutôt que remplacée par un statut).
export default function Etablissements() {
  const [etablissements, setEtablissements] = useState(null);
  const [nouveauNom, setNouveauNom] = useState('');
  const [creating, setCreating] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [edition, setEdition] = useState(null);
  const [enregistrementNom, setEnregistrementNom] = useState(false);
  const [vue, setVue] = useState('liste');
  const [recherche, setRecherche] = useState('');
  const [categorie, setCategorie] = useState('TOUS');

  async function load() {
    const list = await fetchEtablissements();
    setEtablissements(list);
  }

  useEffect(() => {
    fetchEtablissements().then(setEtablissements);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (creating) return;
    setCreating(true);
    try {
      await createEtablissement(nouveauNom);
      setNouveauNom('');
      toast.success(traduire('Établissement créé.'));
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function enregistrerNom() {
    if (!edition || enregistrementNom) return;
    setEnregistrementNom(true);
    try {
      await renommerEtablissement(edition.id, edition.valeur);
      setEdition(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnregistrementNom(false);
    }
  }

  async function handleToggle(etablissement) {
    if (togglingId) return;
    setTogglingId(etablissement.id);
    try {
      if (etablissement.statut === 'ACTIF') {
        await desactiverEtablissement(etablissement.id);
        toast.success(traduire('Établissement désactivé.'));
      } else {
        await reactiverEtablissement(etablissement.id);
        toast.success(traduire('Établissement réactivé.'));
      }
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  const filtres = useMemo(() => (etablissements || []).filter((e) => {
    const matchNom = e.nom.toLowerCase().includes(recherche.trim().toLowerCase());
    const matchCategorie = categorie === 'TOUS' || categoriser(e.nom) === categorie;
    return matchNom && matchCategorie;
  }), [etablissements, recherche, categorie]);

  const badgeStatut = (etablissement) => (
    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${etablissement.statut === 'ACTIF' ? 'bg-green-50 text-status-approved' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
      {etablissement.statut === 'ACTIF' ? 'Actif' : traduire('Inactif')}
    </span>
  );

  const badgeCategorie = (etablissement) => (
    <span className="text-xs px-2 py-0.5 rounded-full shrink-0 bg-navy/10 text-navy dark:bg-gold/10 dark:text-gold">
      {CATEGORIE_LABELS[categoriser(etablissement.nom)]}
    </span>
  );

  const nomOuEdition = (etablissement, classes) => (
    edition?.id === etablissement.id ? (
      <span className="flex items-center gap-2 min-w-0 flex-1">
        <input
          autoFocus value={edition.valeur} maxLength={200}
          onChange={(e) => setEdition({ ...edition, valeur: e.target.value })}
          onKeyDown={(e) => { if (e.key === 'Enter') enregistrerNom(); if (e.key === 'Escape') setEdition(null); }}
          aria-label={traduire("Nouveau nom de l'établissement")}
          className="flex-1 min-w-0 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
        />
        <button type="button" onClick={enregistrerNom} disabled={enregistrementNom} aria-label={traduire('Enregistrer')} className="text-status-approved"><Check size={16} /></button>
        <button type="button" onClick={() => setEdition(null)} aria-label={traduire('Annuler')} className="text-gray-400"><X size={16} /></button>
      </span>
    ) : (
      <span className={`font-medium truncate ${classes}`}>{etablissement.nom}</span>
    )
  );

  const boutonEditer = (etablissement) => (
    edition?.id === etablissement.id ? null : (
      <button
        type="button"
        onClick={() => setEdition({ id: etablissement.id, valeur: etablissement.nom })}
        aria-label={`Renommer ${etablissement.nom}`}
        className="text-gray-400 hover:text-navy dark:hover:text-gold shrink-0"
      >
        <Pencil size={15} aria-hidden="true" />
      </button>
    )
  );

  const boutonToggle = (etablissement, className = '') => (
    <button
      type="button"
      onClick={() => handleToggle(etablissement)}
      disabled={togglingId === etablissement.id}
      className={`text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 shrink-0 ${className}`}
    >
      {togglingId === etablissement.id ? '...' : etablissement.statut === 'ACTIF' ? traduire('Désactiver') : traduire('Réactiver')}
    </button>
  );

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader
        crumbs={[{ label: traduire('Admin RH') }, { label: traduire('Personnel'), path: '/admin/personnel/pe' }, { label: traduire('Établissements') }]}
        title={traduire('Établissements')}
        subtitle={traduire("Établissements de l'université auxquels rattacher un PE")}
      />

      <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 flex flex-wrap gap-2">
        <input
          type="text" value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)}
          placeholder={traduire('Nom du nouvel établissement')} maxLength={200} required className={`${inputClass} min-w-0`}
        />
        <button
          type="submit" disabled={creating}
          className="flex items-center gap-1.5 bg-navy text-white rounded-md px-4 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-50 shrink-0"
        >
          <Plus size={16} aria-hidden="true" /> {creating ? 'Création...' : traduire('Ajouter un établissement')}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder={traduire('Rechercher un établissement...')}
            className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>
        <SelectMenu
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy shrink-0"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORIE_LABELS[c]}</option>)}
        </SelectMenu>
        <div className="flex items-center rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden shrink-0" role="group" aria-label={traduire("Mode d'affichage")}>
          <button
            type="button"
            onClick={() => setVue('liste')}
            aria-pressed={vue === 'liste'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium ${vue === 'liste' ? 'bg-navy text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
          >
            <ListIcon size={15} aria-hidden="true" /> Liste
          </button>
          <button
            type="button"
            onClick={() => setVue('cartes')}
            aria-pressed={vue === 'cartes'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border-l border-gray-300 dark:border-gray-600 ${vue === 'cartes' ? 'bg-navy text-white' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
          >
            <LayoutGrid size={15} aria-hidden="true" /> Cartes
          </button>
        </div>
      </div>

      {!etablissements && <SkeletonCard lines={4} />}
      {etablissements?.length === 0 && (
        <p className="text-sm text-gray-400 px-1">{traduire('Aucun établissement enregistré pour le moment.')}</p>
      )}
      {etablissements?.length > 0 && filtres.length === 0 && (
        <p className="text-sm text-gray-400 px-1">{traduire('Aucun établissement ne correspond à ce filtre.')}</p>
      )}

      {vue === 'liste' ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y divide-gray-100 dark:divide-gray-700">
          {filtres.map((etablissement) => (
            <div key={etablissement.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="flex items-center gap-2 min-w-0 flex-1">
                <School size={18} className="text-navy dark:text-gold shrink-0" aria-hidden="true" />
                {nomOuEdition(etablissement, etablissement.statut === 'ACTIF' ? 'text-navy dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 line-through')}
                {edition?.id !== etablissement.id && badgeCategorie(etablissement)}
                {edition?.id !== etablissement.id && badgeStatut(etablissement)}
              </span>
              <span className="flex items-center gap-3 shrink-0">
                {boutonEditer(etablissement)}
                {boutonToggle(etablissement)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtres.map((etablissement) => (
            <div key={etablissement.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy/10 dark:bg-gold/10">
                  <School size={18} className="text-navy dark:text-gold" aria-hidden="true" />
                </span>
                {nomOuEdition(etablissement, `font-medium leading-snug ${etablissement.statut === 'ACTIF' ? 'text-navy dark:text-gray-100' : 'text-gray-400 dark:text-gray-500 line-through'}`)}
                {boutonEditer(etablissement)}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {badgeCategorie(etablissement)}
                {badgeStatut(etablissement)}
              </div>
              {boutonToggle(etablissement, 'w-full mt-auto')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
