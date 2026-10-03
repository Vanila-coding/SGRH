import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { traduire } from '../i18n';

const DEFAULT_LABEL = (item) => `${item.matricule ? `${item.matricule} — ` : ''}${[item.prenom, item.nom].filter(Boolean).join(' ')}`.trim();

// Sélecteur de personnel (ou de compte) avec recherche par nom, prénom ou matricule :
// remplace un <select> natif qui obligeait à faire défiler toute la liste pour trouver
// quelqu'un (Carrière, Fonctions, Contrats, Documents administratifs). `items` doit
// contenir au minimum { id, matricule, nom, prenom } ; le libellé et le rendu d'une
// option sont personnalisables (formatLabel/formatOption) pour afficher plus, comme
// le rôle ou la fonction, sans changer le comportement de recherche.
export default function PersonnelSearchSelect({
  items, value, onChange, placeholder = 'Rechercher par nom ou matricule…', disabled = false,
  formatLabel = DEFAULT_LABEL, formatOption, emptyLabel = 'Aucun résultat.', required = false, id: idProp, className = '',
}) {
  const generatedId = useId();
  const id = idProp || generatedId;
  const listboxId = `${id}-listbox`;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const selected = useMemo(() => items.find((i) => String(i.id) === String(value)) || null, [items, value]);

  // Pas d'effet de synchronisation : tant que la liste n'est pas ouverte, le champ
  // affiche directement le libellé de la sélection courante (dérivé au rendu, jamais
  // stocké) — un changement de sélection depuis l'extérieur (ex. remise à zéro après
  // création) se reflète donc sans code spécifique. `query` ne sert qu'à la saisie en
  // cours pendant que la liste est ouverte.
  const displayValue = open ? query : (selected ? formatLabel(selected) : '');

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const results = useMemo(() => {
    if (!open) return [];
    const q = query.trim().toLowerCase();
    const showAll = q === '' || (selected && formatLabel(selected) === query);
    const base = showAll
      ? items
      : items.filter((i) => `${i.matricule || ''} ${i.prenom || ''} ${i.nom || ''}`.toLowerCase().includes(q));
    return base.slice(0, 50); // liste bornée : évite un rendu de milliers d'options si l'effectif grossit
  }, [items, query, open, selected, formatLabel]);

  function select(item) {
    onChange(item ? String(item.id) : '');
    setQuery(item ? formatLabel(item) : '');
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { e.preventDefault(); setOpen(true); return; }
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (results[activeIndex]) select(results[activeIndex]); }
    else if (e.key === 'Escape') { setOpen(false); setActiveIndex(-1); }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          ref={inputRef}
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 && results[activeIndex] ? `${listboxId}-opt-${results[activeIndex].id}` : undefined}
          type="text"
          autoComplete="off"
          required={required && !selected}
          disabled={disabled}
          value={displayValue}
          placeholder={placeholder}
          onFocus={() => { setQuery(selected ? formatLabel(selected) : ''); setOpen(true); }}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActiveIndex(-1); if (selected) onChange(''); }}
          onKeyDown={handleKeyDown}
          className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md pl-9 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
        />
        {selected && !disabled && (
          <button
            type="button"
            onClick={() => select(null)}
            aria-label={traduire('Effacer la sélection')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={15} aria-hidden="true" />
          </button>
        )}
      </div>
      {open && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg dark:border-gray-600 dark:bg-gray-800"
        >
          {results.length === 0 && <li className="px-3 py-2 text-gray-400">{emptyLabel}</li>}
          {results.map((item, index) => (
            <li
              key={item.id}
              id={`${listboxId}-opt-${item.id}`}
              role="option"
              aria-selected={String(item.id) === String(value)}
              onMouseDown={(e) => { e.preventDefault(); select(item); }}
              onMouseEnter={() => setActiveIndex(index)}
              className={`cursor-pointer px-3 py-2 ${index === activeIndex ? 'bg-navy/10 dark:bg-gold/10' : ''} ${String(item.id) === String(value) ? 'font-medium text-navy dark:text-gold' : 'text-gray-700 dark:text-gray-200'}`}
            >
              {formatOption ? formatOption(item) : formatLabel(item)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
