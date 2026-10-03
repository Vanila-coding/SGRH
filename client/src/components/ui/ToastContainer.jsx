import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { traduire } from '../../i18n';

const STYLES = {
  success: { icon: CheckCircle2, className: 'bg-white dark:bg-gray-800 border-status-approved/30 text-status-approved' },
  error: { icon: XCircle, className: 'bg-white dark:bg-gray-800 border-status-rejected/30 text-status-rejected' },
  warning: { icon: AlertTriangle, className: 'bg-white dark:bg-gray-800 border-status-pending/30 text-status-pending' },
  info: { icon: Info, className: 'bg-white dark:bg-gray-800 border-navy/20 text-navy dark:text-gold' },
};

// Empilement vertical en haut à droite, chaque toast se ferme indépendamment.
// aria-live="polite" sur le conteneur : un lecteur d'écran annonce les nouveaux
// toasts sans interrompre ce que l'utilisateur était en train de lire.
export default function ToastContainer({ toasts, onDismiss }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((t) => {
        const { icon: Icon, className } = STYLES[t.type] || STYLES.info;
        return (
          <div
            key={t.id}
            role={t.type === 'error' || t.type === 'warning' ? 'alert' : 'status'}
            className={`flex items-start gap-2 border rounded-lg shadow-lg px-4 py-3 text-sm ${className}`}
          >
            <Icon size={18} className="shrink-0 mt-0.5" aria-hidden="true" />
            <p className="flex-1 text-gray-700 dark:text-gray-200">{t.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label={traduire('Fermer la notification')}
              className="text-gray-400 hover:text-gray-600 shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
