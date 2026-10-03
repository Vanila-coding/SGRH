import { useEffect, useState } from 'react';
import { resolveIndice, CLASSES_GRILLE } from '../services/grilleIndiciaireApi';
import SelectMenu from './ui/SelectMenu';

const CATEGORIES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const inputClass = 'w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy';

/**
 * Sélection classe/échelon réglementaire avec résolution automatique de l'indice
 * via la grille indiciaire (régime FONCTIONNAIRE). Si aucune ligne de grille ne
 * couvre la combinaison choisie, l'indice reste modifiable en texte libre et un
 * bandeau "à confirmer" est affiché — jamais bloquant (aucune donnée inventée).
 *
 * Props :
 *  - regime : 'FONCTIONNAIRE' | 'AGENT_NON_ENCADRE' | null
 *  - value : { classe, echelon, categorie, cadre, echelle, indice }
 *  - onChange(nextValue, resolution|null)
 */
export default function GrilleIndiciaireSelector({ regime, value, onChange, dateEffet }) {
  const [resolution, setResolution] = useState(null);
  const [resolutionError, setResolutionError] = useState('');
  const [loading, setLoading] = useState(false);

  const classeInfo = CLASSES_GRILLE.find((c) => c.value === value.classe);
  const echelons = classeInfo ? Array.from({ length: classeInfo.echelons }, (_, i) => i + 1) : [];

  useEffect(() => {
    if (regime !== 'FONCTIONNAIRE' || !value.classe || !value.echelon || !value.categorie) {
      setResolution(null);
      setResolutionError('');
      return;
    }
    let cancelled = false;
    setLoading(true);
    resolveIndice({
      regime, classe: value.classe, echelon: value.echelon, categorie: value.categorie,
      cadre: value.cadre, echelle: value.echelle, dateEffet,
    }).then(({ resolution: r, error }) => {
      if (cancelled) return;
      setLoading(false);
      if (r) {
        setResolution(r);
        setResolutionError('');
        onChange({ ...value, indice: String(r.indice) }, r);
      } else {
        setResolution(null);
        setResolutionError(error);
      }
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regime, value.classe, value.echelon, value.categorie, value.cadre, value.echelle, dateEffet]);

  function update(field, val) {
    const next = { ...value, [field]: val };
    if (field === 'classe') next.echelon = '';
    onChange(next, null);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Classe</label>
          <SelectMenu className={inputClass} value={value.classe || ''} onChange={(e) => update('classe', e.target.value)}>
            <option value="">-- Choisir --</option>
            {CLASSES_GRILLE.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </SelectMenu>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Échelon</label>
          <SelectMenu className={inputClass} value={value.echelon || ''} onChange={(e) => update('echelon', e.target.value)} disabled={!classeInfo}>
            <option value="">-- Choisir --</option>
            {echelons.map((e) => <option key={e} value={e}>{e}</option>)}
          </SelectMenu>
        </div>
      </div>

      {regime === 'FONCTIONNAIRE' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            Catégorie (régime transitoire — Décret n°97-009, Circulaire n°132/2005)
          </label>
          <SelectMenu className={inputClass} value={value.categorie || ''} onChange={(e) => update('categorie', e.target.value)}>
            <option value="">-- Choisir --</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>Catégorie {c}</option>)}
          </SelectMenu>
        </div>
      )}

      {loading && <p className="text-xs text-gray-400">Recherche dans la grille…</p>}

      {resolution && (
        <div className="rounded-md bg-status-approved/10 border border-status-approved/30 px-3 py-2 text-sm">
          <p className="font-medium text-status-approved">Indice réglementaire : {resolution.display}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Source : {resolution.source}{resolution.reference ? ` (${resolution.reference})` : ''}</p>
        </div>
      )}

      {!resolution && resolutionError && (
        <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 px-3 py-2 text-sm">
          <p className="text-amber-700 dark:text-amber-400">À confirmer — {resolutionError}</p>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mt-2 mb-1">Indice (saisie manuelle, non vérifiée)</label>
          <input
            type="text" className={inputClass} value={value.indice || ''}
            onChange={(e) => onChange({ ...value, indice: e.target.value }, null)}
            placeholder="Ex. 950-FOP"
          />
        </div>
      )}
    </div>
  );
}
