import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, GraduationCap, Search, UserPlus } from 'lucide-react';
import { listPersonnel } from '../../services/personnelApi';
import AjouterEmployeModal from '../../components/AjouterEmployeModal';
import PageHeader from '../../components/PageHeader';
import { SkeletonTable } from '../../components/ui';

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

// Page PE (Personnel Enseignant) — même liste que la page PAT (`listPersonnel()`),
// filtrée côté client sur `roles.includes('PE')` pour rester correcte si une personne
// est aussi PAT (elle apparaît alors sur les deux pages, ce qui est le comportement
// attendu : une même fiche, deux vues selon le rôle consulté).
export default function PersonnelPE() {
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

  function FilterSelect({ value, onChange, options, placeholder }) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-[9.5rem] border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-navy"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
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
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-end items-center gap-2 mb-2">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-navy text-white rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          <UserPlus size={16} />
          Ajouter un employé
        </button>
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
        </div>

        <p className="text-xs text-gray-400">{filtered.length} résultat(s) sur {personnel.length}</p>
      </div>

      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <SkeletonTable rows={8} columns={COLUMNS.length} />
        </div>
      )}

      {!loading && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="text-left px-4 py-2 font-medium text-gray-500 cursor-pointer select-none whitespace-nowrap"
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortKey === col.key && (sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <Fragment key={p.id}>
                  <tr
                    onClick={() => toggleExpand(p)}
                    className="border-b last:border-0 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <td className="px-4 py-2 text-navy dark:text-gray-100 font-medium whitespace-nowrap">
                      {p.nom ? [p.prenom, p.nom].filter(Boolean).join(' ') : p.email}
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">{p.matricule || '—'}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{p.etablissement_nom || '—'}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{p.corps_pe || p.categorie_libelle || '—'}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">{p.diplome || '—'}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{p.specialite || '—'}</td>
                    <td className="px-4 py-2">
                      {p.a_un_compte ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-status-approved font-medium">Actif</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-medium">Sans compte</span>
                      )}
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <td colSpan={COLUMNS.length} className="px-4 py-4">
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
                          <Link
                            to={`/admin/personnel/${p.id}/fiche`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs text-navy underline shrink-0 ml-4"
                          >
                            Voir la fiche
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-8 text-center text-gray-400">
                    Aucun résultat pour ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={14} /> Précédent
              </button>
              <p className="text-xs text-gray-400">Page {page} sur {totalPages}</p>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Suivant <ChevronRight size={14} />
              </button>
            </div>
          )}
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
