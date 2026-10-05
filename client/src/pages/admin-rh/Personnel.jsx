import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronDown, ChevronUp, Info, Pencil, Search, UserPlus, Wrench } from 'lucide-react';
import { listPersonnel } from '../../services/personnelApi';
import ImportExportPersonnel from '../../components/personnel/ImportExportPersonnel';
import { getFonctionHistory } from '../../services/userApi';
import AjouterEmployeModal from '../../components/AjouterEmployeModal';
import PageHeader from '../../components/PageHeader';
import { usePermissions } from '../../context/PermissionContext';
import { SkeletonTable } from '../../components/ui';
import SelectMenu from '../../components/ui/SelectMenu';
import { PersonnelAvatar, StatusPill, TableFooter } from '../../components/personnel/PersonnelTableParts';
import ViewToggle from '../../components/ui/ViewToggle';
import useVueListe from '../../hooks/useVueListe';
import { traduire } from '../../i18n';

const COLUMNS = [
  { key: 'nom', label: traduire('Nom') },
  { key: 'fonction', label: traduire('Fonction') },
  { key: 'corps', label: traduire('Corps') },
  { key: 'service', label: traduire('Service') },
  { key: 'direction', label: traduire('Direction') },
  { key: 'type_contrat', label: traduire('Contrat') },
  { key: 'statut', label: traduire('Statut') },
];

const PAGE_SIZE = 10;

function FilterSelect({ value, onChange, options, placeholder }) {
  return <SelectMenu value={value} onChange={(e) => onChange(e.target.value)} options={options} placeholder={placeholder} className="w-44 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-navy dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" ariaLabel={placeholder} />;
}

// Page PAT (Personnel Administratif et Technique) — le tableau lui-même est inchangé
// depuis avant la séparation PE/PAT, seul le rôle « Personnel » de la sidebar est
// devenu un sous-menu avec un lien dédié PE (voir menuConfig.js) ; cette page ne montre
// donc plus que les fiches ayant le rôle PAT (`roles.includes('PAT')`, pas seulement
// l'ancien champ `role` unique, pour rester correct si une personne est aussi PE).
export default function Personnel() {
  const [vue, setVue] = useVueListe('personnel-pat', 'liste');
  const { can } = usePermissions();
  const [personnelBrut, setPersonnelBrut] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);

  const [search, setSearch] = useState('');
  const [filterFonction, setFilterFonction] = useState('');
  const [filterCorps, setFilterCorps] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const [filterContrat, setFilterContrat] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [sortKey, setSortKey] = useState('nom');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    try {
      setPersonnelBrut(await listPersonnel());
    } finally {
      setLoading(false);
    }
  }

  const personnel = useMemo(
    () => personnelBrut.filter((p) => (p.roles || []).includes('PAT')),
    [personnelBrut]
  );

  useEffect(() => {
    listPersonnel()
      .then(setPersonnelBrut)
      .finally(() => setLoading(false));
  }, []);

  async function toggleExpand(person) {
    if (expandedId === person.id) { setExpandedId(null); return; }
    setExpandedId(person.id);
    setHistory(await getFonctionHistory(person.id).catch(() => []));
  }

  const uniqueValues = (key) => [...new Set(personnel.map((p) => p[key]).filter(Boolean))].sort();

  // Résumé du personnel PAT (toujours sur la liste PAT complète, indépendant des
  // filtres ci-dessous : c'est un effectif, pas un résultat de recherche).
  const effectifs = useMemo(() => ({
    pat: personnel.length,
    actifs: personnel.filter((p) => p.statut_compte === 'active').length,
    enAttente: personnel.filter((p) => p.statut_compte === 'pending').length,
  }), [personnel]);

  const filtered = useMemo(() => {
    let list = personnel.filter((p) => {
      const fullName = `${p.prenom || ''} ${p.nom || ''} ${p.matricule || ''}`.toLowerCase();
      if (search && !fullName.includes(search.toLowerCase())) return false;
      if (filterFonction && p.fonction !== filterFonction) return false;
      if (filterCorps && p.corps !== filterCorps) return false;
      if (filterService && p.service !== filterService) return false;
      if (filterDirection && p.direction !== filterDirection) return false;
      if (filterContrat && p.type_contrat !== filterContrat) return false;
      if (filterStatut === 'en_conge' && !p.en_conge) return false;
      if (filterStatut === 'present' && p.en_conge) return false;
      return true;
    });

    list.sort((a, b) => {
      let valA, valB;
      if (sortKey === 'nom') { valA = a.nom || ''; valB = b.nom || ''; }
      else if (sortKey === 'statut') { valA = a.en_conge ? 1 : 0; valB = b.en_conge ? 1 : 0; }
      else { valA = a[sortKey] || ''; valB = b[sortKey] || ''; }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [personnel, search, filterFonction, filterCorps, filterService, filterDirection, filterContrat, filterStatut, sortKey, sortAsc]);

  // Revenir à la première page dès que la recherche, un filtre ou le tri change,
  // pour ne jamais se retrouver sur une page vide (ex. filtré à 3 résultats depuis la page 5).
  // Remise à la page 1 pendant le rendu (pas d'effet) quand un critère change.
  const signatureFiltres = [search, filterFonction, filterCorps, filterService, filterDirection, filterContrat, filterStatut, sortKey, sortAsc].join('|');
  const [signatureVue, setSignatureVue] = useState(signatureFiltres);
  if (signatureVue !== signatureFiltres) {
    setSignatureVue(signatureFiltres);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  function handleSort(key) {
    if (sortKey === key) setSortAsc((prev) => !prev);
    else { setSortKey(key); setSortAsc(true); }
  }


  return (
    <div>
      <PageHeader crumbs={[{ label: traduire('Admin RH') }, { label: traduire('Personnel') }]} title={traduire('Personnel')} subtitle={traduire('Recherchez, filtrez et gérez les fiches du personnel')} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy dark:bg-gold/10 dark:text-gold">
            <Wrench size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs text-gray-400">{traduire('Administratif et technique (PAT)')}</p>
            <p className="text-2xl font-bold text-navy dark:text-gray-100">{effectifs.pat}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{effectifs.actifs} {traduire('personnel ayant un compte activé ·')} {effectifs.enAttente} {'en attente'}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
        {can('manage_organisation') ? (
          <Link
            to="/admin/organisation"
            className="flex items-center gap-2 text-sm font-medium text-navy dark:text-gold underline underline-offset-2"
          >
            <Building2 size={16} aria-hidden="true" />
            {traduire('Gérer les directions & services')}
          </Link>
        ) : <span />}
        <div className="flex gap-2">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-navy text-white rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          <UserPlus size={16} />
          {traduire('Ajouter un employé')}
        </button>
        </div>
      </div>

      <div className="mb-4">
        <ImportExportPersonnel role="PAT" onImported={load} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={traduire('Rechercher par nom, prénom ou matricule...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterSelect value={filterFonction} onChange={setFilterFonction} options={uniqueValues('fonction')} placeholder={traduire('Fonction')} />
          <FilterSelect value={filterCorps} onChange={setFilterCorps} options={uniqueValues('corps')} placeholder={traduire('Corps')} />
          <FilterSelect value={filterService} onChange={setFilterService} options={uniqueValues('service')} placeholder={traduire('Service')} />
          <FilterSelect value={filterDirection} onChange={setFilterDirection} options={uniqueValues('direction')} placeholder={traduire('Direction')} />
          <FilterSelect value={filterContrat} onChange={setFilterContrat} options={uniqueValues('type_contrat')} placeholder={traduire('Type de contrat')} />
          <FilterSelect value={filterStatut} onChange={setFilterStatut} options={['present', 'en_conge']} placeholder={traduire('Statut')} />
          {(search || filterFonction || filterCorps || filterService || filterDirection || filterContrat || filterStatut) && (
            <button
              onClick={() => { setSearch(''); setFilterFonction(''); setFilterCorps(''); setFilterService(''); setFilterDirection(''); setFilterContrat(''); setFilterStatut(''); }}
              className="text-xs text-navy underline"
            >
              {traduire('Réinitialiser')}
            </button>
          )}
          <ViewToggle value={vue} onChange={setVue} className="ml-auto" />
        </div>

        <p className="text-xs text-gray-400">{filtered.length} {traduire('résultat(s) sur')} {personnel.length}</p>
      </div>

      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <SkeletonTable rows={8} columns={COLUMNS.length} />
        </div>
      )}

      {!loading && vue === 'carte' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {paginated.map((p) => (
              <Link
                key={p.id}
                to={`/admin/personnel/${p.id}/fiche`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex flex-col gap-3 hover:shadow-md"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <PersonnelAvatar personnel={p} />
                  <div className="min-w-0">
                    <p className="font-medium text-navy dark:text-gray-100 truncate">
                      {p.nom ? [p.prenom, p.nom].filter(Boolean).join(' ') : p.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.email}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <dt className="text-gray-400">{traduire('Fonction')}</dt>
                  <dd className="text-gray-700 dark:text-gray-200 truncate">{p.fonction || '—'}</dd>
                  <dt className="text-gray-400">{traduire('Corps')}</dt>
                  <dd className="text-gray-700 dark:text-gray-200 truncate">{p.corps || '—'}</dd>
                  <dt className="text-gray-400">{traduire('Service')}</dt>
                  <dd className="text-gray-700 dark:text-gray-200 truncate">{p.service || '—'}</dd>
                  <dt className="text-gray-400">{traduire('Direction')}</dt>
                  <dd className="text-gray-700 dark:text-gray-200 truncate">{p.direction || '—'}</dd>
                </dl>
                <div className="mt-auto flex items-center justify-between gap-2">
                  {p.en_conge ? <StatusPill tone="pending">{traduire('En congé')}</StatusPill> : <StatusPill tone="approved">{traduire('Présent')}</StatusPill>}
                  <span className="text-xs font-medium text-navy dark:text-gold">{traduire('Voir la fiche →')}</span>
                </div>
              </Link>
            ))}
          </div>
          {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{traduire('Aucun résultat pour ces critères.')}</p>}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mt-3">
            <TableFooter page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
          </div>
        </>
      )}

      {!loading && vue === 'liste' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <th className="w-12 px-4 py-3" aria-label={traduire('Détails')} />
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left px-4 py-3 font-semibold text-navy dark:text-gray-100 cursor-pointer select-none whitespace-nowrap"
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3" aria-label={traduire('Actions')} />
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <Fragment key={p.id}>
                  <tr
                    onClick={() => toggleExpand(p)}
                    className="border-b last:border-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`flex h-8 w-8 items-center justify-center rounded-md border transition-colors ${expandedId === p.id ? 'border-navy bg-navy text-white' : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400'}`}
                        aria-hidden="true"
                      >
                        <Info size={15} />
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <PersonnelAvatar personnel={p} />
                        <div className="min-w-0">
                          <p className="font-medium text-navy dark:text-gray-100 whitespace-nowrap">
                            {p.nom ? [p.prenom, p.nom].filter(Boolean).join(' ') : p.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{p.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{p.fonction || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.corps || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{p.service || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{p.direction || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.type_contrat || '—'}</td>
                    <td className="px-4 py-3">
                      {p.en_conge ? <StatusPill tone="pending">{traduire('En congé')}</StatusPill> : <StatusPill tone="approved">{traduire('Présent')}</StatusPill>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/personnel/${p.id}/fiche`}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={traduire('Voir la fiche')}
                        title={traduire('Voir la fiche')}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 text-navy dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Pencil size={14} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <td colSpan={COLUMNS.length + 2} className="px-4 py-4">
                        <div className="flex items-start justify-between">
                          <div className="grid grid-cols-3 gap-4 flex-1">
                            <div>
                              <p className="text-xs text-gray-400">{traduire('Matricule')}</p>
                              <p className="text-sm text-navy dark:text-gray-100">{p.matricule || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">{traduire('Email')}</p>
                              <p className="text-sm text-navy dark:text-gray-100">{p.email}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">{traduire('Grade')}</p>
                              <p className="text-sm text-navy dark:text-gray-100">{p.grade || '—'}</p>
                            </div>
                          </div>
                        </div>

                        {history.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-400 mb-1">{traduire('Historique des fonctions')}</p>
                            {history.map((h) => (
                              <p key={h.id} className="text-xs text-gray-500">
                                {new Date(h.changed_at).toLocaleDateString('fr-FR')} : {h.ancienne_fonction || traduire('Aucune')} → {h.nouvelle_fonction}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 2} className="px-4 py-8 text-center text-gray-400">
                    {traduire('Aucun résultat pour ces critères.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <TableFooter page={page} totalPages={totalPages} total={filtered.length} pageSize={PAGE_SIZE} onPage={setPage} />
        </div>
      )}

      {showAddModal && (
        <AjouterEmployeModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); load(); }}
        />
      )}
    </div>
  );
}