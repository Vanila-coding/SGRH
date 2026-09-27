import { Fragment, useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Building2, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Search, UserPlus, Wrench, Download, Upload } from 'lucide-react';
import { listPersonnel, exportPersonnelExcel, importPersonnelExcel } from '../../services/personnelApi';
import { getFonctionHistory } from '../../services/userApi';
import AjouterEmployeModal from '../../components/AjouterEmployeModal';
import PageHeader from '../../components/PageHeader';
import { usePermissions } from '../../context/PermissionContext';
import { toast } from '../../utils/toast';
import { SkeletonTable } from '../../components/ui';

const COLUMNS = [
  { key: 'nom', label: 'Nom' },
  { key: 'fonction', label: 'Fonction' },
  { key: 'corps', label: 'Corps' },
  { key: 'service', label: 'Service' },
  { key: 'direction', label: 'Direction' },
  { key: 'type_contrat', label: 'Contrat' },
  { key: 'statut', label: 'Statut' },
];

const PAGE_SIZE = 10;

// Page PAT (Personnel Administratif et Technique) — le tableau lui-même est inchangé
// depuis avant la séparation PE/PAT, seul le rôle « Personnel » de la sidebar est
// devenu un sous-menu avec un lien dédié PE (voir menuConfig.js) ; cette page ne montre
// donc plus que les fiches ayant le rôle PAT (`roles.includes('PAT')`, pas seulement
// l'ancien champ `role` unique, pour rester correct si une personne est aussi PE).
export default function Personnel() {
  const { can } = usePermissions();
  const [personnelBrut, setPersonnelBrut] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [history, setHistory] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef(null);

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

  useEffect(() => { load(); }, []);

  async function toggleExpand(person) {
    if (expandedId === person.id) { setExpandedId(null); return; }
    setExpandedId(person.id);
    setHistory(await getFonctionHistory(person.id).catch(() => []));
  }

  async function handleExport() {
    setExporting(true);
    try {
      await exportPersonnelExcel();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await importPersonnelExcel(file);
      setImportResult(result);
      load();
    } catch (err) {
      setImportResult({ inserted: 0, errors: [{ line: '-', reason: err.message }] });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }

  const uniqueValues = (key) => [...new Set(personnel.map((p) => p[key]).filter(Boolean))].sort();

  // Résumé du personnel PAT (toujours sur la liste PAT complète, indépendant des
  // filtres ci-dessous : c'est un effectif, pas un résultat de recherche).
  const effectifs = useMemo(() => ({
    pat: personnel.length,
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
  useEffect(() => { setPage(1); }, [search, filterFonction, filterCorps, filterService, filterDirection, filterContrat, filterStatut, sortKey, sortAsc]);

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
      <PageHeader crumbs={[{ label: 'Admin RH' }, { label: 'Personnel' }]} title="Personnel" subtitle="Recherchez, filtrez et gérez les fiches du personnel" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy dark:bg-gold/10 dark:text-gold">
            <Wrench size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs text-gray-400">Administratif et technique (PAT)</p>
            <p className="text-2xl font-bold text-navy dark:text-gray-100">{effectifs.pat}</p>
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
            Gérer les directions & services
          </Link>
        ) : <span />}
        <div className="flex gap-2">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-navy dark:text-gray-100 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <Download size={16} />
          {exporting ? 'Export en cours...' : 'Exporter en Excel'}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-navy dark:text-gray-100 rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          <Upload size={16} />
          {importing ? 'Import en cours...' : 'Importer un fichier Excel'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx"
          onChange={handleImportFile}
          className="hidden"
        />

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-navy text-white rounded-md px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          <UserPlus size={16} />
          Ajouter un employé
        </button>
        </div>
      </div>

      {importResult && (
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <p className="text-sm font-medium text-status-approved">
            {importResult.inserted} fiche(s) importée(s) avec succès.
          </p>
          {importResult.errors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-status-rejected font-medium">{importResult.errors.length} ligne(s) ignorée(s) :</p>
              <ul className="text-xs text-gray-500 list-disc list-inside mt-1">
                {importResult.errors.map((e, i) => (
                  <li key={i}>Ligne {e.line} : {e.reason}</li>
                ))}
              </ul>
            </div>
          )}
          <button onClick={() => setImportResult(null)} className="text-xs text-navy underline mt-2">
            Fermer
          </button>
        </div>
      )}

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
          <FilterSelect value={filterFonction} onChange={setFilterFonction} options={uniqueValues('fonction')} placeholder="Fonction" />
          <FilterSelect value={filterCorps} onChange={setFilterCorps} options={uniqueValues('corps')} placeholder="Corps" />
          <FilterSelect value={filterService} onChange={setFilterService} options={uniqueValues('service')} placeholder="Service" />
          <FilterSelect value={filterDirection} onChange={setFilterDirection} options={uniqueValues('direction')} placeholder="Direction" />
          <FilterSelect value={filterContrat} onChange={setFilterContrat} options={uniqueValues('type_contrat')} placeholder="Type de contrat" />
          <FilterSelect value={filterStatut} onChange={setFilterStatut} options={['present', 'en_conge']} placeholder="Statut" />
          {(search || filterFonction || filterCorps || filterService || filterDirection || filterContrat || filterStatut) && (
            <button
              onClick={() => { setSearch(''); setFilterFonction(''); setFilterCorps(''); setFilterService(''); setFilterDirection(''); setFilterContrat(''); setFilterStatut(''); }}
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
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">{p.fonction || '—'}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{p.corps || '—'}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">{p.service || '—'}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">{p.direction || '—'}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{p.type_contrat || '—'}</td>
                    <td className="px-4 py-2">
                      {p.en_conge ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-50 text-status-pending font-medium">En congé</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-50 text-status-approved font-medium">Présent</span>
                      )}
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <td colSpan={COLUMNS.length} className="px-4 py-4">
                        <div className="flex items-start justify-between">
                          <div className="grid grid-cols-3 gap-4 flex-1">
                            <div>
                              <p className="text-xs text-gray-400">Matricule</p>
                              <p className="text-sm text-navy dark:text-gray-100">{p.matricule || '—'}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Email</p>
                              <p className="text-sm text-navy dark:text-gray-100">{p.email}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Grade</p>
                              <p className="text-sm text-navy dark:text-gray-100">{p.grade || '—'}</p>
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

                        {history.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-400 mb-1">Historique des fonctions</p>
                            {history.map((h) => (
                              <p key={h.id} className="text-xs text-gray-500">
                                {new Date(h.changed_at).toLocaleDateString('fr-FR')} : {h.ancienne_fonction || 'Aucune'} → {h.nouvelle_fonction}
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