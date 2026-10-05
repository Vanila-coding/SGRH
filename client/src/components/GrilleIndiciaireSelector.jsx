import { useEffect, useState } from 'react';
import { resolveIndice, CLASSES_GRILLE } from '../services/grilleIndiciaireApi';
import SelectMenu from './ui/SelectMenu';
import { traduire } from '../i18n';

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
  const classeInfo = CLASSES_GRILLE.find((c) => c.value === value.classe);
  const echelons = classeInfo ? Array.from({ length: classeInfo.echelons }, (_, i) => i + 1) : [];

  // Résolution seulement pour un fonctionnaire avec classe, échelon et catégorie. Le résultat
  // est rattaché à la combinaison qui l'a produit : pas de réinitialisation dans l'effet.
  const applicable = regime === 'FONCTIONNAIRE' && !!value.classe && !!value.echelon && !!value.categorie;
  const cle = applicable ? [value.classe, value.echelon, value.categorie, value.cadre, value.echelle, dateEffet].join('|') : null;
  const [resultat, setResultat] = useState(null); // { cle, resolution, error }

  useEffect(() => {
    if (!cle) return;
    let cancelled = false;
    resolveIndice({
      regime, classe: value.classe, echelon: value.echelon, categorie: value.categorie,
      cadre: value.cadre, echelle: value.echelle, dateEffet,
    }).then(({ resolution: r, error }) => {
      if (cancelled) return;
      setResultat({ cle, resolution: r, error });
      if (r) onChange({ ...value, indice: String(r.indice) }, r);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);

  const loading = applicable && resultat?.cle !== cle;
  const resolution = applicable && resultat?.cle === cle ? resultat.resolution : null;
  const resolutionError = applicable && resultat?.cle === cle && !resultat.resolution ? resultat.error : '';

  function update(field, val) {
    const next = { ...value, [field]: val };
    if (field === 'classe') next.echelon = '';
    onChange(next, null);
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{traduire('Classe')}</label>
          <SelectMenu className={inputClass} value={value.classe || ''} onChange={(e) => update('classe', e.target.value)}>
            <option value="">{traduire('-- Choisir --')}</option>
            {CLASSES_GRILLE.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </SelectMenu>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">{traduire('Échelon')}</label>
          <SelectMenu className={inputClass} value={value.echelon || ''} onChange={(e) => update('echelon', e.target.value)} disabled={!classeInfo}>
            <option value="">{traduire('-- Choisir --')}</option>
            {echelons.map((e) => <option key={e} value={e}>{e}</option>)}
          </SelectMenu>
        </div>
      </div>

      {regime === 'FONCTIONNAIRE' && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            {traduire('Catégorie (régime transitoire — Décret n°97-009, Circulaire n°132/2005)')}
          </label>
          <SelectMenu className={inputClass} value={value.categorie || ''} onChange={(e) => update('categorie', e.target.value)}>
            <option value="">{traduire('-- Choisir --')}</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{traduire('Catégorie')} {c}</option>)}
          </SelectMenu>
        </div>
      )}

      {regime === 'FONCTIONNAIRE' && value.classe && value.echelon && !value.categorie && (
        <p className="text-xs text-amber-600 dark:text-amber-400">{traduire("Choisis la catégorie (I à X) pour calculer l'indice et l'IB.")}</p>
      )}

      {loading && <p className="text-xs text-gray-400">{traduire('Recherche dans la grille…')}</p>}

      {resolution && (
        <div className="rounded-md bg-status-approved/10 border border-status-approved/30 px-3 py-2 text-sm">
          <p className="font-medium text-status-approved">{traduire('Indice réglementaire :')} {resolution.display}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{traduire('Source :')} {resolution.source}{resolution.reference ? ` (${resolution.reference})` : ''}</p>
        </div>
      )}

      {!resolution && resolutionError && (
        <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 px-3 py-2 text-sm">
          <p className="text-amber-700 dark:text-amber-400">{traduire('À confirmer —')} {resolutionError}</p>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mt-2 mb-1">{traduire('Indice (saisie manuelle, non vérifiée)')}</label>
          <input
            type="text" className={inputClass} value={value.indice || ''}
            onChange={(e) => onChange({ ...value, indice: e.target.value }, null)}
            placeholder={traduire('Ex. 950-FOP')}
          />
        </div>
      )}
    </div>
  );
}
