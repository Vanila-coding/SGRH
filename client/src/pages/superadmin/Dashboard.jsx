import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCheck, ShieldCheck, KeyRound, Trash2,
  History, Lock, Settings, ArrowRight, MessageSquareWarning,
} from 'lucide-react';
import { listAccounts } from '../../services/accountAdminApi';
import { listAllPermissions } from '../../services/permissionApi';
import { getActivityLog } from '../../services/activityLogApi';
import { listCorbeille } from '../../services/corbeilleApi';
import { getToutesReclamations } from '../../services/reclamationApi';
import { getAdminDashboardStats } from '../../services/statsApi';
import { Card, Badge, Skeleton, SkeletonText } from '../../components/ui';
import PageHeader from '../../components/PageHeader';
import { ACTION_LABELS } from '../../constants/activityLabels';
import SelectMenu from '../../components/ui/SelectMenu';
import { traduire } from '../../i18n';
import { traduireJournal } from '../../i18n/journal';

// Les 6 rôles réels de l'app (Secrétaire PE/PAT ajoutés cette session) — une liste
// restée à 4 aurait sous-compté "Rôles" et caché deux lignes dans la répartition.
const ROLES = ['SUPERADMIN', 'ADMIN_RH', 'PE', 'PAT', 'SECRETAIRE_PE', 'SECRETAIRE_PAT'];
const ROLE_LABELS = {
  SUPERADMIN: 'Superadmin', ADMIN_RH: 'Admin RH', PE: 'PE', PAT: 'PAT',
  SECRETAIRE_PE: 'Secrétaire PE', SECRETAIRE_PAT: 'Secrétaire PAT',
};
const CORBEILLE_TYPE_LABELS = { compte: 'Compte utilisateur' };

const QUICK_ACTIONS = [
  { label: traduire('Gérer les comptes'), to: '/superadmin/comptes', icon: ShieldCheck },
  { label: traduire('Comptes en attente'), to: '/admin/comptes-attente', icon: UserCheck },
  { label: traduire('Gérer les permissions'), to: '/superadmin/permissions', icon: KeyRound },
  { label: traduire("Consulter l\'activité"), to: '/admin/historique', icon: History },
  { label: traduire('Ouvrir la corbeille'), to: '/superadmin/corbeille', icon: Trash2 },
  { label: traduire('Réclamations'), to: '/superadmin/reclamations', icon: MessageSquareWarning },
  { label: traduire('Paramètres'), to: '/parametres', icon: Settings },
];

// Pas de pastille d'icône : même choix que les tableaux de bord Admin RH et personnel
// (le chiffre porte déjà l'information). `to` optionnel rend la carte cliquable.
function StatCard({ label, value, to }) {
  const contenu = (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy dark:text-gray-100">{value}</p>
    </div>
  );
  return to ? (
    <Card as={Link} to={to} padding="p-5" className="block transition hover:shadow-md hover:ring-1 hover:ring-navy/20 dark:hover:ring-gold/20">
      {contenu}
    </Card>
  ) : (
    <Card padding="p-5">{contenu}</Card>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="font-semibold text-navy dark:text-gold mb-3 flex items-center gap-2">
      <Icon size={18} /> {children}
    </h3>
  );
}

function ShortcutLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 text-xs font-medium text-navy dark:text-gold hover:underline mt-3"
    >
      {children} <ArrowRight size={12} />
    </Link>
  );
}

export default function SuperadminDashboard() {
  const [accounts, setAccounts] = useState(null);
  const [permissionRows, setPermissionRows] = useState(null);
  const [activity, setActivity] = useState(null);
  const [activityLimit, setActivityLimit] = useState(5);
  const [corbeille, setCorbeille] = useState(null);
  const [reclamations, setReclamations] = useState(null);
  const [rhStats, setRhStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      listAccounts(),
      listAllPermissions(),
      listCorbeille(),
      getToutesReclamations(),
      getAdminDashboardStats(),
    ])
      .then(([acc, perms, corb, reclam, rh]) => {
        setAccounts(acc);
        setPermissionRows(perms);
        setCorbeille(corb);
        setReclamations(reclam);
        setRhStats(rh);
      })
      .catch((err) => setError(err.message));
  }, []);

  // Séparé du chargement initial : changer le nombre d'entrées affichées (dropdown)
  // ne recharge que l'activité, pas tout le tableau de bord.
  useEffect(() => {
    getActivityLog(activityLimit, ['connexion'])
      .then(setActivity)
      .catch((err) => setError(err.message));
  }, [activityLimit]);

  if (error) {
    return (
      <div>
        <PageHeader crumbs={[{ label: traduire('Administration') }]} title={traduire('Tableau de bord')} subtitle={traduire("Vue d\'ensemble administrative et technique du SGRH")} />
        <p className="text-status-rejected text-sm">{error}</p>
      </div>
    );
  }

  const loading = accounts === null;

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label={traduire('Chargement du tableau de bord')}>
        <PageHeader crumbs={[{ label: traduire('Administration') }]} title={traduire('Tableau de bord')} subtitle={traduire("Vue d\'ensemble administrative et technique du SGRH")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="p-5">
              <Skeleton className="h-3 w-2/3 rounded mb-2" />
              <Skeleton className="h-5 w-1/3 rounded" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="p-5">
              <Skeleton className="h-3 w-2/3 rounded mb-2" />
              <Skeleton className="h-5 w-1/3 rounded" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <Skeleton className="h-4 w-1/3 rounded mb-4" />
            <SkeletonText lines={5} />
          </Card>
          <Card>
            <Skeleton className="h-4 w-1/2 rounded mb-4" />
            <SkeletonText lines={4} />
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-4 w-1/2 rounded mb-4" />
              <SkeletonText lines={3} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalComptes = accounts.length;
  const actifs = accounts.filter((a) => a.status === 'active').length;
  const enAttente = accounts.filter((a) => a.status === 'pending').length;
  const inactifs = accounts.filter((a) => a.status === 'inactive').length;

  const nbPermissions = new Set(permissionRows.map((r) => r.key)).size;
  const nbAffectations = permissionRows.filter((r) => r.enabled).length;
  const affectationsParRole = ROLES.map((role) => ({
    role,
    count: permissionRows.filter((r) => r.role === role && r.enabled).length,
  }));

  const corbeilleParType = corbeille.reduce((acc, item) => {
    acc[item.type_element] = (acc[item.type_element] || 0) + 1;
    return acc;
  }, {});

  const reclamationsOuvertes = reclamations.filter((r) => r.statut === 'ouverte').length;
  const derniereActivite = activity?.[0];

  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{ label: traduire('Administration') }]} title={traduire('Tableau de bord')} subtitle={traduire("Vue d\'ensemble administrative et technique du SGRH")} />

      {/* Ligne 1 — Comptes utilisateurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={traduire('Comptes total')} value={totalComptes} to="/superadmin/comptes" />
        <StatCard label={traduire('Comptes actifs')} value={actifs} to="/superadmin/comptes" />
        <StatCard label={traduire('En attente')} value={enAttente} to="/admin/comptes-attente" />
        <StatCard label={traduire('Inactifs / désactivés')} value={inactifs} to="/superadmin/comptes" />
      </div>

      {/* Ligne 2 — Aperçu RH : le Superadmin hérite des permissions Admin RH mais n'a pas
          son propre tableau de bord (son lien "Tableau de bord" remplace celui d'Admin RH
          dans son menu) — sans cette ligne, il n'avait aucune visibilité sur les files
          d'attente congés/documents/secrétariat que l'Admin RH voit, lui, au quotidien. */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{traduire('Aperçu RH')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label={traduire('Personnel (PE + PAT)')} value={rhStats.totalPersonnel} to="/admin/personnel/pe" />
          <StatCard label={traduire('Congés en attente')} value={rhStats.congesEnAttente} to="/admin/conges" />
          <StatCard label={traduire('Documents en attente')} value={rhStats.documentsEnAttente} to="/admin/demandes-documents" />
          <StatCard label={traduire('En attente au secrétariat')} value={rhStats.secretariatEnAttente} />
        </div>
      </div>

      {/* Ligne 3 — Activité récente + Rôles & permissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3 mb-1">
            <SectionTitle icon={History}>{traduire('Activité récente')}</SectionTitle>
            <SelectMenu
              value={activityLimit}
              onChange={(e) => setActivityLimit(Number(e.target.value))}
              className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md pl-2 pr-6 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-navy shrink-0"
            >
              <option value={5}>5 dernières</option>
              <option value={10}>10 dernières</option>
              <option value={20}>20 dernières</option>
            </SelectMenu>
          </div>
          <p className="text-xs text-gray-400 mb-3">{traduire('Activité du personnel (congés, documents, carrière...), hors connexions.')}</p>
          {activity === null ? (
            <p className="text-sm text-gray-400">{traduire('Chargement...')}</p>
          ) : activity.length === 0 ? (
            <p className="text-sm text-gray-400">{traduire('Aucune activité enregistrée.')}</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {activity.map((log) => {
                const meta = ACTION_LABELS[log.action_type] || { label: log.action_type, color: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={log.id} className="flex items-start justify-between gap-3 border-b last:border-0 border-gray-100 dark:border-gray-700 pb-2">
                    <div className="min-w-0">
                      <p className="text-sm text-navy dark:text-gray-100 truncate">{traduireJournal(log.description)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {log.email ? `${log.prenom || ''} ${log.nom || log.email}`.trim() : traduire('Système')}
                        {' — '}
                        {new Date(log.created_at).toLocaleString('fr-FR')}
                      </p>
                    </div>
                    <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap ${meta.color}`}>{meta.label}</span>
                  </div>
                );
              })}
            </div>
          )}
          <ShortcutLink to="/admin/historique">{traduire('Voir le journal complet')}</ShortcutLink>
        </Card>

        <Card>
          <SectionTitle icon={KeyRound}>{traduire('Rôles & permissions')}</SectionTitle>
          <div className="grid grid-cols-3 gap-2 mb-4 text-center">
            <div>
              <p className="text-xl font-bold text-navy dark:text-gray-100">{ROLES.length}</p>
              <p className="text-[11px] text-gray-400">{traduire('Rôles')}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-navy dark:text-gray-100">{nbPermissions}</p>
              <p className="text-[11px] text-gray-400">{traduire('Permissions')}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-navy dark:text-gray-100">{nbAffectations}</p>
              <p className="text-[11px] text-gray-400">{traduire('Affectations')}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {affectationsParRole.map(({ role, count }) => (
              <div key={role} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">{ROLE_LABELS[role]}</span>
                <Badge variant="neutral">{count} permission{count > 1 ? 's' : ''}</Badge>
              </div>
            ))}
          </div>
          <ShortcutLink to="/superadmin/permissions">{traduire('Gérer les permissions')}</ShortcutLink>
        </Card>
      </div>

      {/* Ligne 4 — Corbeille / Sécurité & système / Actions rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card>
          <SectionTitle icon={Trash2}>{traduire('Corbeille')}</SectionTitle>
          <p className="text-3xl font-bold text-navy dark:text-gray-100">{corbeille.length}</p>
          <p className="text-xs text-gray-400 mb-3">élément{corbeille.length > 1 ? 's' : ''} actuellement dans la corbeille</p>
          {corbeille.length > 0 && (
            <div className="space-y-1 mb-1">
              {Object.entries(corbeilleParType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{CORBEILLE_TYPE_LABELS[type] || type}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          )}
          <ShortcutLink to="/superadmin/corbeille">{traduire('Ouvrir la corbeille')}</ShortcutLink>
        </Card>

        <Card>
          <SectionTitle icon={Lock}>{traduire('Sécurité & système')}</SectionTitle>
          <ul className="space-y-2.5 text-sm text-gray-600 dark:text-gray-300">
            <li>
              <span className="block text-xs text-gray-400 mb-0.5">{traduire('Dernière activité')}</span>
              {derniereActivite ? (
                <>
                  {traduireJournal(derniereActivite.description)}
                  <span className="block text-xs text-gray-400 mt-0.5">
                    {new Date(derniereActivite.created_at).toLocaleString('fr-FR')}
                  </span>
                </>
              ) : 'Aucune activité enregistrée.'}
            </li>
            <li className="flex items-center justify-between">
              <span>{traduire('Comptes en attente de validation')}</span>
              <Badge variant={enAttente > 0 ? 'pending' : 'approved'}>{enAttente}</Badge>
            </li>
            <li className="flex items-center justify-between">
              <span>{traduire('Éléments dans la corbeille')}</span>
              <Badge variant={corbeille.length > 0 ? 'pending' : 'neutral'}>{corbeille.length}</Badge>
            </li>
            <li className="flex items-center justify-between">
              <Link to="/superadmin/reclamations" className="hover:underline">{traduire('Réclamations ouvertes')}</Link>
              <Badge variant={reclamationsOuvertes > 0 ? 'pending' : 'approved'}>{reclamationsOuvertes}</Badge>
            </li>
          </ul>
          <ShortcutLink to="/admin/historique">{traduire("Consulter l\'audit complet")}</ShortcutLink>
        </Card>

        <Card>
          <SectionTitle icon={Settings}>{traduire('Actions rapides')}</SectionTitle>
          <div className="space-y-1">
            {QUICK_ACTIONS.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <Icon size={16} className="text-navy dark:text-gold shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
