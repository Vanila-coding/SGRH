import { traduire } from '../../i18n';
// Brique de base : un rectangle qui pulse. Les composants composés ci-dessous
// portent le rôle d'accessibilité (role="status") ; les briques ne le portent pas
// pour éviter d'empiler plusieurs annonces "chargement" identiques au lecteur d'écran.
export function Skeleton({ className = '', ...props }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 ${className}`} aria-hidden="true" {...props} />;
}

export function SkeletonText({ lines = 1, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 rounded ${lines > 1 && i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 48, className = '' }) {
  return <Skeleton className={`rounded-full shrink-0 ${className}`} style={{ width: size, height: size }} />;
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`} role="status" aria-label={traduire('Chargement en cours')}>
      <Skeleton className="h-4 w-1/3 rounded mb-4" />
      <SkeletonText lines={lines} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label={traduire('Chargement du tableau')}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className="h-4 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage({ cards = 2, className = '' }) {
  return (
    <div className={`space-y-6 ${className}`} role="status" aria-label={traduire('Chargement de la page')}>
      <Skeleton className="h-7 w-1/4 rounded" />
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <Skeleton className="h-4 w-1/3 rounded mb-4" />
          <SkeletonText lines={i === 0 ? 3 : 4} />
        </div>
      ))}
    </div>
  );
}
