import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { traduire } from '../../i18n';

// Modale accessible partagée : Echap pour fermer, clic sur le fond pour fermer,
// focus posé sur le premier champ à l'ouverture et restauré à la fermeture —
// aucune des modales existantes de l'app ne le faisait avant.
export default function Modal({ open = true, onClose, title, maxWidth = 'max-w-2xl', closeOnBackdrop = true, children }) {
  const dialogRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose?.();
    }
    document.addEventListener('keydown', handleKeyDown);

    const previouslyFocused = document.activeElement;
    // Cherche dans le contenu (pas l'en-tête) pour ne pas focus le bouton "Fermer" en premier.
    const firstField = contentRef.current?.querySelector('input, select, textarea, button, [tabindex]');
    firstField?.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={closeOnBackdrop ? () => onClose?.() : undefined}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-navy dark:text-gold">{title}</h3>
            <button type="button" onClick={onClose} aria-label={traduire('Fermer')} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
        )}
        <div ref={contentRef}>{children}</div>
      </div>
    </div>
  );
}
