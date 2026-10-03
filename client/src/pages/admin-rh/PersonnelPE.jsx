import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, GraduationCap, Info, Pencil, School, Search, UserPlus } from 'lucide-react';
import { listPersonnel } from '../../services/personnelApi';
import ImportExportPersonnel from '../../components/personnel/ImportExportPersonnel';
import AjouterEmployeModal from '../../components/AjouterEmployeModal';
import PageHeader from '../../components/PageHeader';
import { SkeletonTable } from '../../components/ui';
import SelectMenu from '../../components/ui/SelectMenu';
import { PersonnelAvatar, StatusPill, TableFooter } from '../../components/personnel/PersonnelTableParts';
import ViewToggle from '../../components/ui/ViewToggle';
import useVueListe from '../../hooks/useVueListe';

const COLUMNS = [
  { key: 'nom', label: 'Nom' },
  { key: 'matricule', label: 'Matricule' },
  { key: 'etablissement_nom', label: 'Établissement' },
  { key: 'corps_pe', label: 'Corps / Catégorie' },
  { key: 'diplome', label: 'Diplôme' },
  { key: 'specialite', label: 'Spécialité' },
  { key: 'a_un_compte', label: 'Compte' },
];

const PAGE_SIZE = 10;

function FilterSelect({ value, onChange, options, placeholder }) {
  return <SelectMenu value={value} onChange={(e) => onChange(e.target.value)} options={options} placeholder={placeholder} className="w-44 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-navy dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100" ariaLabel={placeholder} />;
}

// Page PE (Personnel Enseignant) — même liste que la page PAT (`listPersonnel()`),
// filtrée côté client sur `roles.includes('PE')` pour rester correcte si une personne
// est aussi PAT (elle apparaît alors sur les deux pages, ce qui est le comportement
// attendu : une même fiche, deux vues selon le rôle consulté).
export default function PersonnelPE() {
  const [vue, setVue] = useVueListe('personnel-pe', 'liste');
  const [personnelBrut, setPersonnelBrut] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterEtablissement, setFilterEtablissement] = useState('');
  const [filterCorps, setFilterCorps] = useState('');
  const [filterDiplome, setFilterDiplome] = useState('');
  const [filterCompte, setFilterCompte] = useState('');
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
    () => personnelBrut.filter((p) => (p.roles || []).includes('PE')),
    [personnelBrut]
  );

  useEffect(() => { load(); }, []);

  function toggleExpand(person) {
    setExpandedId((prev) => (prev === person.id ? null : person.id));
  }

  const uniqueValues = (key) => [...new Set(personnel.map((p) => p[key]).filter(Boolean))].sort();

  const filtered = useMemo(() => {
    let list = personnel.filter((p) => {
      const fullName = `${p.prenom || ''} ${p.nom || ''} ${p.matricule || ''}`.toLowerCase();
      if (search && !fullName.includes(search.toLowerCase())) return false;
      if (filterEtablissement && p.etablissement_nom !== filterEtablissement) return false;
      if (filterCorps && p.corps_pe !== filterCorps) return false;
      if (filterDiplome && p.diplome !== filterDiplome) return false;
      if (filterCompte === 'Avec compte' && !p.a_un_compte) return false;
      if (filterCompte === 'Sans compte' && p.a_un_compte) return false;
      return true;
    });

    list.sort((a, b) => {
      let valA, valB;
      if (sortKey === 'a_un_compte') { valA = a.a_un_compte ? 1 : 0; valB = b.a_un_compte ? 1 : 0; }
      else { valA = a[sortKey] || ''; valB = b[sortKey] || ''; }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return list;
  }, [personnel, search, filterEtablissement, filterCorps, filterDiplome, filterCompte, sortKey, sortAsc]);

  // Revenir à la première page dès que la recherche, un filtre ou le tri change,
  // pour ne jamais se retrouver sur une page vide.
  useEffect(() => { setPage(1); }, [search, filterEtablissement, filterCorps, filterDiplome, filterCompte, sortKey, sortAsc]);

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
      <PageHeader crumbs={[{ label: 'Admin RH' }, { label: 'Personnel' }]} title="Personnel enseignant (PE)" subtitle="Recherchez et gérez les fiches des enseignants" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy dark:bg-gold/10 dark:text-gold">
            <GraduationCap size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs text-gray-400">Enseignants (PE)</p>
            <p className="text-2xl font-bold text-navy dark:text-gray-100">{personnel.length}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {personnel.filter((p) => p.statut_compte === 'active').length} personnel ayant un compte activé · {personnel.filter((p) => p.statut_compte === 'pending').length} en attente
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
        <Link
          to="/admin/personnel/etablissements"
          className="flex items-center gap-2 text-sm font-medium text-navy dark:text-gold underline underline-offset-2"
        >
          <School size={16} aria-hidden="true" />
          Gérer les établissements
        </Link>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-navy text-white rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          <UserPlus size={16} />
          Ajouter un employé
        </button>
      </div>

      <div className="mb-4">
        <ImportExportPersonnel role="PE" onImported={load} />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou matricule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <FilterSelect value={filterEtablissement} onChange={setFilterEtablissement} options={uniqueValues('etablissement_nom')} placeholder="Établissement" />
          <FilterSelect value={filterCorps} onChange={setFilterCorps} options={uniqueValues('corps_pe')} placeholder="Corps" />
          <FilterSelect value={filterDiplome} onChange={setFilterDiplome} options={uniqueValues('diplome')} placeholder="Diplôme" />
          <FilterSelect value={filterCompte} onChange={setFilterCompte} options={['Avec compte', 'Sans compte']} placeholder="Compte" />
          {(search || filterEtablissement || filterCorps || filterDiplome || filterCompte) && (
            <button
              onClick={() => { setSearch(''); setFilterEtablissement(''); setFilterCorps(''); setFilterDiplome(''); setFilterCompte(''); }}
              className="text-xs text-navy underline"
            >
              Réinitialiser
            </button>
          )}
          <ViewToggle value={vue} onChange={setVue} className="ml-auto" />
        </div>

        <p className="text-xs text-gray-400">{filtered.length} résultat(s) sur {personnel.length}</p>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Matricule {p.matricule || '—'}</p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <dt className="text-gray-400">Établissement</dt>
                  <dd className="text-gray-700 dark:text-gray-200 truncate">{p.etablissement_nom || '—'}</dd>
                  <dt className="text-gray-400">Corps / Catégorie</dt>
                  <dd className="text-gray-700 dark:text-gray-200 truncate">{p.corps_pe || p.categorie_libelle || '—'}</dd>
                  <dt className="text-gray-400">Diplôme</dt>
                  <dd className="text-gray-700 dark:text-gray-200 truncate">{p.diplome || '—'}</dd>
                  <dt className="text-gray-400">Spécialité</dt>
                  <dd className="text-gray-700 dark:text-gray-200 truncate">{p.specialite || '—'}</dd>
                </dl>
                <div className="mt-auto flex items-center justify-between gap-2">
                  {p.statut_compte === 'active' && <StatusPill tone="approved">Compte activé</StatusPill>}
                  {p.statut_compte === 'pending' && <StatusPill tone="pending">En attente</StatusPill>}
                  {p.statut_compte === 'inactive' && <StatusPill tone="rejected">Désactivé</StatusPill>}
                  {!p.a_un_compte && <StatusPill tone="neutral">Sans compte</StatusPill>}
                  <span className="text-xs font-medium text-navy dark:text-gold">Voir la fiche →</span>
                </div>
              </Link>
            ))}
          </div>
          {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Aucun résultat pour ces critères.</p>}
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
                <th className="w-12 px-4 py-3" aria-label="Détails" />
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
                <th className="px-4 py-3" aria-label="Actions" />
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
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{p.matricule || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.etablissement_nom || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.corps_pe || p.categorie_libelle || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{p.diplome || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.specialite || '—'}</td>
                    <td className="px-4 py-3">
                      {p.statut_compte === 'active' && <StatusPill tone="approved">Compte activé</StatusPill>}
                      {p.statut_compte === 'pending' && <StatusPill tone="pending">En attente</StatusPill>}
                      {p.statut_compte === 'inactive' && <StatusPill tone="rejected">Désactivé</StatusPill>}
                      {!p.a_un_compte && <StatusPill tone="neutral">Sans compte</StatusPill>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/personnel/${p.id}/fiche`}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Voir la fiche"
                        title="Voir la fiche"
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
                              <p className="text-xs text-gray-400">Email</p>
                              <p className="text-sm text-navy dark:text-gray-100">{p.email}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Rôle(s)</p>
                              <p className="text-sm text-navy dark:text-gray-100">{(p.roles || []).join(' + ') || '—'}</p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length + 2} className="px-4 py-8 text-center text-gray-400">
                    Aucun résultat pour ces critères.
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
