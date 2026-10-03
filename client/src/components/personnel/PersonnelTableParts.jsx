const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const photoUrl = (photo) => (photo ? `${API_URL.replace(/\/api\/?$/, '')}${photo}` : null);

const TONES = {
  approved: 'text-status-approved bg-green-50 dark:bg-green-900/20',
  pending: 'text-status-pending bg-amber-50 dark:bg-amber-900/20',
  rejected: 'text-status-rejected bg-red-50 dark:bg-red-900/20',
  neutral: 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700',
};

const DOTS = {
  approved: 'bg-status-approved',
  pending: 'bg-status-pending',
  rejected: 'bg-status-rejected',
  neutral: 'bg-gray-400',
};

export function StatusPill({ tone, children }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full ${TONES[tone]}`}>
      <span className={`w-2 h-2 rounded-full ${DOTS[tone]}`} aria-hidden="true" />
      {children}
    </span>
  );
}

export function PersonnelAvatar({ personnel }) {
  const initiales = [personnel.prenom, personnel.nom]
    .filter(Boolean)
    .map((s) => s[0].toUpperCase())
    .join('')
    .slice(0, 2) || '?';
  const photo = photoUrl(personnel.photo_profil);
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy/10 text-xs font-semibold text-navy dark:bg-gold/10 dark:text-gold">
      {photo ? <img src={photo} alt="" className="h-full w-full object-cover" /> : initiales}
    </span>
  );
}

export function TableFooter({ page, totalPages, total, pageSize, onPage }) {
  const debut = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const fin = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const btn = 'min-w-8 h-8 px-2 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed';
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t dark:border-gray-700">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Affichage de {debut} à {fin} sur {total} personnel
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onPage(page - 1)} disabled={page === 1} className={btn} aria-label="Page précédente">‹</button>
          {pages.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPage(n)}
              aria-current={n === page ? 'page' : undefined}
              className={n === page ? 'min-w-8 h-8 px-2 rounded-md text-xs font-medium bg-navy text-white' : btn}
            >
              {n}
            </button>
          ))}
          <button type="button" onClick={() => onPage(page + 1)} disabled={page === totalPages} className={btn} aria-label="Page suivante">›</button>
        </div>
      )}
    </div>
  );
}
