import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { X, ChevronDown } from 'lucide-react';
import { menuConfig } from '../../config/menuConfig';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import { useText } from '../../context/TextContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const estActif = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`);

const classeLien = ({ isActive }) =>
  `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
    isActive ? 'bg-gold text-navy' : 'text-white/80 hover:bg-white/10'
  }`;

export default function Sidebar({ open = false, onClose = () => {} }) {
  const { user } = useAuth();
  const { can, loading } = usePermissions();
  const { pathname } = useLocation();
  const { settings } = useSiteSettings();
  // Choix explicite de l'utilisateur, valable pour la page courante seulement : dès
  // qu'on navigue, la catégorie de la page active se rouvre (les autres se replient).
  const [choix, setChoix] = useState({ chemin: null, cle: null });

  // Libellés personnalisables par le Superadmin (Paramètres → Personnalisation → Contenu) :
  // un nombre fixe de clés, jamais de libellé arbitraire créé à la volée — la structure
  // de navigation (menuConfig ci-dessus) reste, elle, entièrement définie par le code.
  const libellesMenu = {
    'Tableau de bord': useText('menu.libelle_tableau_de_bord', 'Tableau de bord', 'Menu'),
    'Personnel': useText('menu.libelle_personnel', 'Personnel', 'Menu'),
    'Carrière': useText('menu.libelle_carriere', 'Carrière', 'Menu'),
    'Congés & absences': useText('menu.libelle_conges', 'Congés & absences', 'Menu'),
    'Documents': useText('menu.libelle_documents', 'Documents', 'Menu'),
  };

  // SUPERADMIN voit le menu ADMIN_RH complet, en plus de son propre menu
  // "Administration" — cohérent avec la règle SUPERADMIN = ADMIN_RH + plus.
  // Le lien "Tableau de bord" pointe vers le dashboard dédié SUPERADMIN
  // (/superadmin/dashboard) plutôt que celui d'ADMIN_RH — même position dans le
  // menu, même libellé, pas d'entrée en double.
  const intrinseque = user?.role === 'SUPERADMIN'
    ? [
        ...(menuConfig.ADMIN_RH || []).map((group) => ({
          ...group,
          items: group.items.map((item) =>
            item.path === '/admin/dashboard' ? { ...item, path: '/superadmin/dashboard' } : item
          ),
        })),
        ...(menuConfig.SUPERADMIN || []),
      ]
    : menuConfig[user?.role] || [];

  // Rôles & permissions (page Superadmin) permet d'accorder n'importe quelle permission
  // à n'importe quel rôle — ex. "supprimer un compte" donné à un PAT. Sans ce bloc, la
  // permission serait bien active côté API mais resterait invisible : ce rôle n'aurait
  // jamais eu l'entrée de menu correspondante, puisque chaque rôle n'affichait que son
  // propre menu figé. Ce complément ne joue que dans un sens : PE/PAT peuvent se voir
  // ajouter des pages ADMIN_RH/SUPERADMIN auxquelles une permission leur donne accès.
  // L'inverse n'a pas de sens et n'est pas ajouté : les pages personnelles en libre-service
  // (Mon dossier, Mes congés...) lisent le dossier du COMPTE CONNECTÉ lui-même — un compte
  // ADMIN_RH/SUPERADMIN n'a pas de fiche personnel associée, quelle que soit la permission
  // qu'on lui accorderait, les afficher pour lui n'aurait jamais rien de cohérent à montrer.
  const ROLES_ESPACE_PERSONNEL = ['PE', 'PAT', 'SECRETAIRE_PE', 'SECRETAIRE_PAT'];
  const estPersonnel = ROLES_ESPACE_PERSONNEL.includes(user?.role);
  const cheminsIntrinseques = new Set(intrinseque.flatMap((g) => g.items.map((i) => i.path)));
  const itemsSupplementaires = !estPersonnel || loading ? [] : Object.entries(menuConfig)
    .filter(([role]) => !ROLES_ESPACE_PERSONNEL.includes(role))
    .flatMap(([, groupes]) => groupes.flatMap((g) => g.items))
    .filter((item, index, tous) => (
      item.permission
      && !cheminsIntrinseques.has(item.path)
      && can(item.permission)
      && tous.findIndex((i) => i.path === item.path) === index // dédoublonne ADMIN_RH/SUPERADMIN (chevauchement du tableau de bord)
    ));

  const groups = itemsSupplementaires.length > 0
    ? [...intrinseque, { title: 'Accès supplémentaires', items: itemsSupplementaires }]
    : intrinseque;

  return (
    <>
      {/* Sous lg : la sidebar est un tiroir superposé, fermé par défaut. À partir de
          lg, elle redevient statique (comportement historique inchangé). */}
      {open && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={onClose} aria-hidden="true" />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full w-64 shrink-0 flex-col overflow-hidden bg-navy dark:bg-gray-950 text-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-start justify-between gap-2 p-6 border-b border-white/10">
          <div className="flex min-w-0 items-center gap-3">
            {/* Logo sur pastille blanche : le fichier a un fond blanc et le bleu du logo
                se lirait mal directement sur le fond navy. Décoratif (le nom est juste à côté). */}
            <img
              src={settings.logo_principal_url || '/logo-univ-mahajanga.png'}
              alt=""
              aria-hidden="true"
              width="44"
              height="44"
              className="h-11 w-11 shrink-0 rounded-lg bg-white object-contain p-0.5"
            />
            <div className="min-w-0">
              <p className="font-bold leading-tight">UNIVERSITÉ</p>
              <p className="font-bold leading-tight">DE MAHAJANGA</p>
              <p className="text-xs text-white/60 mt-1">Gestion des Ressources Humaines</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="shrink-0 rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Navigation principale">
          {(() => {
            // Mêmes règles de visibilité qu'avant (permissions, showIf) : seule la
            // présentation change.
            const visibles = groups
              .map((group) => ({
                ...group,
                items: group.items.filter((item) => {
                  const permOk = item.permission === null || loading || can(item.permission);
                  const conditionOk = !item.showIf || item.showIf(user);
                  return permOk && conditionOk;
                }),
              }))
              .filter((group) => group.items.length > 0);

            // Catégorie ouverte : une seule à la fois ; par défaut celle de la page active.
            const groupeActif = visibles.find((g) => g.title && g.items.length > 1 && g.items.some((i) => estActif(pathname, i.path)));
            const cleParDefaut = groupeActif ? groupeActif.title : null;
            const ouvert = choix.chemin === pathname ? choix.cle : cleParDefaut;

            return visibles.map((group, groupIndex) => {
              // Une entrée seule (avec ou sans titre) reste un lien direct : replier un
              // groupe d'un seul élément n'apporterait rien.
              if (!group.title || group.items.length === 1) {
                const { label, path, icon: Icon } = group.items[0];
                return (
                  <NavLink key={`${groupIndex}-${path}`} to={path} end onClick={onClose} className={classeLien}>
                    <Icon size={18} />
                    {libellesMenu[label] || label}
                  </NavLink>
                );
              }

              const estOuvert = ouvert === group.title;
              const contientActif = group.items.some((i) => estActif(pathname, i.path));
              const panneauId = `nav-groupe-${groupIndex}`;
              return (
                <div key={group.title}>
                  <button
                    type="button"
                    onClick={() => setChoix({ chemin: pathname, cle: estOuvert ? null : group.title })}
                    aria-expanded={estOuvert}
                    aria-controls={panneauId}
                    className={`flex min-h-10 w-full items-center justify-between gap-2 px-3 py-2 rounded-md text-left text-[11px] font-semibold uppercase tracking-wide transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
                      contientActif ? 'text-gold' : 'text-white/60'
                    }`}
                  >
                    <span>{libellesMenu[group.title] || group.title}</span>
                    <ChevronDown size={16} aria-hidden="true" className={`shrink-0 transition-transform duration-200 ${estOuvert ? 'rotate-180' : ''}`} />
                  </button>
                  {/* Panneau animé (hauteur 0 -> auto) ; `inert` retire les liens repliés
                      de l'ordre de tabulation et des lecteurs d'écran. */}
                  <div
                    id={panneauId}
                    inert={!estOuvert}
                    className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${estOuvert ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                  >
                    <div className="min-h-0 overflow-hidden">
                      <div className="space-y-1 pt-1 pb-1">
                        {group.items.map(({ label, path, icon: Icon }) => (
                          <NavLink key={path} to={path} end onClick={onClose} className={classeLien}>
                            <Icon size={18} />
                            {libellesMenu[label] || label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
        </nav>
      </aside>
    </>
  );
}