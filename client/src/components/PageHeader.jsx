import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { traduire } from '../i18n';

// En-tête de page réutilisable : fil d'Ariane + titre + sous-titre, au-dessus du
// contenu de chaque page. `crumbs` est une liste de { label, path? } ; le dernier
// élément (page courante) n'a pas besoin de `path`.
export default function PageHeader({ crumbs = [], title, subtitle, actions }) {
  return (
    <div className="mb-6 space-y-3">
      {crumbs.length > 0 && (
        <nav aria-label={traduire("Fil d'Ariane")} className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-gray-400">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <span key={crumb.label} className="flex items-center gap-1.5">
                {index > 0 && <ChevronRight size={14} aria-hidden="true" />}
                {crumb.path && !isLast ? (
                  <Link to={crumb.path} className="hover:text-navy dark:hover:text-gold">{crumb.label}</Link>
                ) : (
                  <span className={isLast ? 'font-medium text-navy dark:text-gold' : ''}>{crumb.label}</span>
                )}
              </span>
            );
          })}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy dark:text-gold">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        {actions}
      </div>
    </div>
  );
}
