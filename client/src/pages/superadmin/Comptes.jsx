import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { listAccounts, deactivateAccount, reactivateAccount, changeAccountRole, deleteAccount } from '../../services/accountAdminApi';
import PageHeader from '../../components/PageHeader';
import { SkeletonCard } from '../../components/ui/Skeleton';
import ContacterCompteModal from '../../components/ContacterCompteModal';
import ViewToggle from '../../components/ui/ViewToggle';
import useVueListe, { classeConteneur } from '../../hooks/useVueListe';
import { traduire } from '../../i18n';

// Textes par défaut proposés dans la fenêtre de contact obligatoire, modifiables par
// le Superadmin avant l'envoi — jamais envoyés tels quels sans relecture.
const TEXTES_ACTION = {
  desactiver: {
    libelleBouton: traduire('Envoyer et désactiver'),
    sujetDefaut: traduire('Votre compte va être désactivé'),
    messageDefaut: traduire('Bonjour,\n\nNous vous informons que votre compte sur la plateforme de gestion RH de l\'Université de Mahajanga va être désactivé.\n\nPour toute question, contactez l\'administration RH.'),
  },
  supprimer: {
    libelleBouton: traduire('Envoyer et supprimer'),
    sujetDefaut: traduire('Votre compte va être supprimé'),
    messageDefaut: traduire('Bonjour,\n\nNous vous informons que votre compte sur la plateforme de gestion RH de l\'Université de Mahajanga va être supprimé.\n\nPour toute question, contactez l\'administration RH.'),
  },
};

const ROLE_LABELS = {
  ADMIN_RH: 'Admin RH', SUPERADMIN: 'Superadmin', PE: 'Personnel PE', PAT: 'Personnel PAT',
  SECRETAIRE_PE: 'Secrétaire PE', SECRETAIRE_PAT: 'Secrétaire PAT',
};
// Promotion réversible : seul un compte PAT peut être désigné secrétaire (un PE n'est
// jamais secrétaire), avec le choix de la catégorie affectée (PE ou PAT) puisque c'est
// une fonction administrative, pas liée à sa propre catégorie. Le retrait ramène
// toujours à PAT. Mêmes transitions que accountAdminController.changeRole côté backend.
// Mêmes rôles protégés que accountAdminController (backend) — masquer les boutons ici
// évite un aller-retour pour rien, mais le vrai verrou est côté serveur.
const ROLES_PROTEGES = ['ADMIN_RH', 'SUPERADMIN'];

export default function Comptes() {
  const [vue, setVue] = useVueListe('comptes-superadmin');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState('');
  const [recherche, setRecherche] = useState('');
  const [error, setError] = useState('');
  // { compte, type: 'desactiver' | 'supprimer' } | null — ouvre directement la fenêtre
  // de contact obligatoire, qui exécute l'action elle-même une fois l'e-mail envoyé.
  const [actionEnCours, setActionEnCours] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setAccounts(await listAccounts());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    listAccounts()
      .then(setAccounts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleReactivate(account) {
    setError('');
    try {
      await reactivateAccount(account.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleChangeRole(account, nouveauRole) {
    setError('');
    try {
      await changeAccountRole(account.id, nouveauRole);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  // Appelée par ContacterCompteModal une fois l'e-mail envoyé avec succès — l'action
  // (désactivation ou suppression) n'a jamais lieu sans être passée par cette étape.
  async function executerActionEnCours() {
    if (actionEnCours.type === 'desactiver') await deactivateAccount(actionEnCours.compte.id);
    else await deleteAccount(actionEnCours.compte.id);
    await load();
  }

  const filtered = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return accounts.filter((a) => {
      const matchRole = !filterRole || a.role === filterRole;
      const matchRecherche = !terme || [a.nom, a.prenom, a.email, a.matricule]
        .some((champ) => champ && champ.toLowerCase().includes(terme));
      return matchRole && matchRecherche;
    });
  }, [accounts, filterRole, recherche]);

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader crumbs={[{ label: traduire('Administration') }, { label: traduire('Gestion des comptes') }]} title={traduire('Gestion des comptes')} subtitle={traduire('Activer, désactiver ou supprimer un compte utilisateur')} />
      <div className="flex justify-end mb-3">
        <ViewToggle value={vue} onChange={setVue} />
      </div>

      <div className="relative mb-4 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={traduire('Rechercher par nom, email ou matricule...')}
          className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
        />
      </div>

      <div className="flex items-center gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilterRole('')}
          className={`px-3 py-1.5 rounded-md text-xs font-medium ${filterRole === '' ? 'bg-navy text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}
        >
          Tous ({accounts.length})
        </button>
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium ${filterRole === role ? 'bg-navy text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}
          >
            {label} ({accounts.filter((a) => a.role === role).length})
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-status-rejected mb-4">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-gray-400 px-1">
          {accounts.length === 0 ? 'Aucun compte enregistré.' : traduire('Aucun compte ne correspond à cette recherche.')}
        </p>
      ) : (
      <div className={classeConteneur(vue, 3)}>
        {filtered.map((a) => (
          <div key={a.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-navy dark:text-gray-100 truncate">
                  {a.nom ? [a.prenom, a.nom].filter(Boolean).join(' ') : (a.email || `Compte #${a.id}`)}
                </p>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shrink-0">{ROLE_LABELS[a.role]}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-medium shrink-0 ${
                  a.status === 'active' ? 'bg-green-50 text-status-approved' :
                  a.status === 'pending' ? 'bg-amber-50 text-status-pending' : 'bg-red-50 text-status-rejected'
                }`}>
                  {a.status === 'active' ? 'Actif' : a.status === 'pending' ? traduire('En attente') : traduire('Désactivé')}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 truncate">
                {a.email} {a.matricule && `${traduire('— Matricule')} ${a.matricule}`}
              </p>
            </div>

            <div className="flex flex-wrap justify-end gap-2 shrink-0">
              {a.role === 'PAT' && (
                <>
                  <button
                    onClick={() => handleChangeRole(a, 'SECRETAIRE_PE')}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {traduire('Désigner secrétaire PE')}
                  </button>
                  <button
                    onClick={() => handleChangeRole(a, 'SECRETAIRE_PAT')}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {traduire('Désigner secrétaire PAT')}
                  </button>
                </>
              )}
              {(a.role === 'SECRETAIRE_PE' || a.role === 'SECRETAIRE_PAT') && (
                <button
                  onClick={() => handleChangeRole(a, 'PAT')}
                  className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {traduire('Retirer le secrétariat')}
                </button>
              )}
              {ROLES_PROTEGES.includes(a.role) ? (
                <span className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 dark:text-gray-500" title={traduire('Les comptes Admin RH et Superadmin ne peuvent pas être désactivés ou supprimés.')}>
                  {traduire('Protégé')}
                </span>
              ) : (
                <>
                  {a.status !== 'active' ? (
                    <button
                      onClick={() => handleReactivate(a)}
                      className="px-3 py-1.5 rounded-md text-xs font-medium border border-status-approved text-status-approved hover:bg-green-50"
                    >
                      {traduire('Activer')}
                    </button>
                  ) : (
                    <button
                      onClick={() => setActionEnCours({ compte: a, type: 'desactiver' })}
                      className="px-3 py-1.5 rounded-md text-xs font-medium border border-status-rejected text-status-rejected hover:bg-red-50"
                    >
                      {traduire('Désactiver')}
                    </button>
                  )}

                  <button
                    onClick={() => setActionEnCours({ compte: a, type: 'supprimer' })}
                    className="px-3 py-1.5 rounded-md text-xs font-medium text-gray-400 hover:text-status-rejected"
                  >
                    {traduire('Supprimer')}
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      )}

      {actionEnCours && (
        <ContacterCompteModal
          compte={actionEnCours.compte}
          onClose={() => setActionEnCours(null)}
          onConfirmerAction={executerActionEnCours}
          {...TEXTES_ACTION[actionEnCours.type]}
        />
      )}
    </div>
  );
}
