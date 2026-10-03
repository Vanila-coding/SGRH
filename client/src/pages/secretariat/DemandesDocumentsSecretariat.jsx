import { useMemo, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { getDemandesEnAttenteSecretariat, reviewDemandeSecretariat } from '../../services/documentApi';
import PageHeader from '../../components/PageHeader';
import { SkeletonCard } from '../../components/ui/Skeleton';
import ViewToggle from '../../components/ui/ViewToggle';
import useVueListe from '../../hooks/useVueListe';
import { traduire } from '../../i18n';

const TYPE_LABELS = { certificat_administratif: 'Certificat administratif', lettre_confirmation: 'Lettre de confirmation', etat_conge: 'État de congé' };

// Vérification formelle avant transmission au RH — même principe que
// CongesSecretariat.jsx : le secrétariat filtre, il ne génère jamais le document
// lui-même (ça reste une action RH, cf. DemandesDocuments.jsx).
export default function DemandesDocumentsSecretariat() {
  const [vue, setVue] = useVueListe('demandes-secretariat');
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [avisMap, setAvisMap] = useState({});

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return demandes;
    return demandes.filter((d) => `${d.matricule || ''} ${d.prenom || ''} ${d.nom || ''}`.toLowerCase().includes(q));
  }, [demandes, search]);

  async function load() {
    setLoading(true);
    try {
      setDemandes(await getDemandesEnAttenteSecretariat());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleReview(id, decision) {
    if (decision === 'refusee' && !(avisMap[id] || '').trim()) {
      setError(traduire('Indique un motif avant de renvoyer une demande au demandeur.'));
      return;
    }
    setError('');
    try {
      await reviewDemandeSecretariat(id, decision, avisMap[id] || '');
      setDemandes((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <PageHeader crumbs={[{ label: traduire('Secrétariat') }, { label: traduire('Demandes de documents') }]} title={traduire('Demandes de documents')} subtitle={traduire('Vérifiez les demandes avant transmission au RH')} />
      <div className="flex justify-end mb-3">
        <ViewToggle value={vue} onChange={setVue} />
      </div>

      {error && <p className="text-sm text-status-rejected mb-4">{error}</p>}
      {!loading && demandes.length === 0 && <p className="text-gray-500">{traduire('Aucune demande en attente de vérification.')}</p>}

      {!loading && demandes.length > 0 && (
        <div className="relative mb-4 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input
            type="text"
            placeholder={traduire('Rechercher par nom ou matricule…')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      ) : (
      <>
      {demandes.length > 0 && filtered.length === 0 && (
        <p className="text-sm text-gray-400">{traduire('Aucune demande ne correspond à «')} {search} ».</p>
      )}
      <div className={vue === 'liste' ? 'flex flex-col gap-4' : 'grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4'}>
        {filtered.map((d) => (
          <div key={d.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
            <div className="min-w-0 mb-3">
              <p className="font-medium text-navy dark:text-gray-100 truncate">{d.prenom} {d.nom} <span className="font-normal text-gray-400">({d.matricule})</span></p>
              <p className="text-sm text-gray-500">{TYPE_LABELS[d.type_document] || d.type_document}</p>
              {d.motif && <p className="text-xs text-gray-400 mt-1">{traduire('Motif :')} {d.motif}</p>}
              <p className="text-xs text-gray-400 mt-1">
                Demandé le {new Date(d.date_demande).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <textarea
              placeholder={traduire('Motif (obligatoire pour un renvoi)')}
              rows={2}
              value={avisMap[d.id] || ''}
              onChange={(e) => setAvisMap((prev) => ({ ...prev, [d.id]: e.target.value }))}
              className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-navy"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleReview(d.id, 'refusee')}
                className="px-4 py-2 rounded-md border border-status-rejected text-status-rejected text-sm font-medium hover:bg-red-50"
              >
                {traduire('Renvoyer au demandeur')}
              </button>
              <button
                onClick={() => handleReview(d.id, 'approuvee')}
                className="px-4 py-2 rounded-md bg-navy dark:bg-gold text-white dark:text-navy text-sm font-medium hover:opacity-90"
              >
                {traduire('Transmettre au RH')}
              </button>
            </div>
          </div>
        ))}
      </div>
      </>
      )}
    </div>
  );
}
