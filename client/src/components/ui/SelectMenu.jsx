import { Children, isValidElement, useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const TAILLES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-3 py-2 text-sm',
};

const APPARENCE = 'rounded-md border border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-navy dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800';

function depuisEnfants(children) {
  return Children.toArray(children)
    .filter((c) => isValidElement(c) && c.type === 'option')
    .map((c) => ({ value: String(c.props.value ?? ''), label: c.props.children }));
}

export default function SelectMenu({
  value = '', onChange, children, options, placeholder = 'Tous', size = 'md',
  className = '', disabled = false, required = false, id, name, ariaLabel, ariaLabelledBy,
  'aria-label': ariaLabelNatif, 'aria-labelledby': ariaLabelledByNatif,
}) {
  const [ouvert, setOuvert] = useState(false);
  const [actif, setActif] = useState(-1);
  const racine = useRef(null);
  const declencheur = useRef(null);

  const items = children
    ? depuisEnfants(children)
    : [
      ...(placeholder !== null ? [{ value: '', label: placeholder }] : []),
      ...(options || []).map((o) => (typeof o === 'string' ? { value: o, label: o } : o)),
    ];
  const valeur = String(value ?? '');
  const courant = items.find((i) => i.value === valeur) || items[0];

  useEffect(() => {
    if (!ouvert) return undefined;
    function fermerSiDehors(e) {
      if (!racine.current?.contains(e.target)) setOuvert(false);
    }
    document.addEventListener('mousedown', fermerSiDehors);
    return () => document.removeEventListener('mousedown', fermerSiDehors);
  }, [ouvert]);

  function ouvrir() {
    if (disabled) return;
    setActif(Math.max(0, items.findIndex((i) => i.value === valeur)));
    setOuvert(true);
  }

  function choisir(v) {
    setOuvert(false);
    declencheur.current?.focus();
    if (v !== valeur) onChange?.({ target: { value: v, name } });
  }

  function onKeyDown(e) {
    if (!ouvert) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        ouvrir();
      }
      return;
    }
    if (e.key === 'Escape') setOuvert(false);
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActif((i) => Math.min(items.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActif((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); choisir(items[actif].value); }
    else if (e.key === 'Tab') setOuvert(false);
  }

  return (
    <div ref={racine} className="relative">
      <button
        ref={declencheur}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={ouvert}
        aria-label={ariaLabel ?? ariaLabelNatif}
        aria-labelledby={ariaLabelledBy ?? ariaLabelledByNatif}
        onClick={() => (ouvert ? setOuvert(false) : ouvrir())}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-70 ${className || `${APPARENCE} ${TAILLES[size]}`}`}
      >
        <span className="truncate">{courant?.label}</span>
        <ChevronDown size={14} className={`shrink-0 text-gray-400 transition-transform ${ouvert ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          required
          value={valeur}
          onChange={() => {}}
          onFocus={() => declencheur.current?.focus()}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
        />
      )}

      {ouvert && (
        <ul
          role="listbox"
          className="absolute left-0 z-50 mt-1 max-h-72 w-max min-w-full max-w-[20rem] overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800"
        >
          {items.map((item, i) => {
            const selectionne = item.value === valeur;
            return (
              <li
                key={`${item.value}-${i}`}
                role="option"
                aria-selected={selectionne}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choisir(item.value)}
                onMouseEnter={() => setActif(i)}
                className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-xs ${
                  i === actif ? 'bg-navy/5 dark:bg-gold/10' : ''
                } ${selectionne ? 'font-semibold text-navy dark:text-gold' : 'text-gray-700 dark:text-gray-200'} ${
                  item.value === '' ? 'italic text-gray-400 dark:text-gray-500' : ''
                }`}
              >
                <span className="whitespace-normal break-words">{item.label}</span>
                {selectionne && <Check size={13} className="shrink-0" aria-hidden="true" />}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
