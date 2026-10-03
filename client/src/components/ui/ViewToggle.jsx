import { LayoutGrid, List } from 'lucide-react';

const OPTIONS = [
  { value: 'liste', label: 'Affichage en liste', Icone: List },
  { value: 'carte', label: 'Affichage en cartes', Icone: LayoutGrid },
];

export default function ViewToggle({ value, onChange, className = '' }) {
  return (
    <div role="group" aria-label="Mode d'affichage" className={`inline-flex rounded-md border border-gray-300 dark:border-gray-600 overflow-hidden ${className}`}>
      {OPTIONS.map(({ value: v, label, Icone }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-label={label}
          aria-pressed={value === v}
          title={label}
          className={`flex h-8 w-9 items-center justify-center ${value === v ? 'bg-navy text-white dark:bg-gold dark:text-navy' : 'bg-white text-gray-500 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'}`}
        >
          <Icone size={15} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
