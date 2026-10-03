import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPendingSecretariat, reviewSecretariat, telechargerJustificatifConge } from '../../services/congeApi';
import PageHeader from '../../components/PageHeader';
import { JUSTIFICATIF_OBLIGATOIRE } from '../../constants/conges';
import { SkeletonCard, EmptyState } from '../../components/ui';
import ViewToggle from '../../components/ui/ViewToggle';
import useVueListe, { classeConteneur } from '../../hooks/useVueListe';
import { traduire } from '../../i18n';

// Vérification formelle avant transmission au RH : le secrétariat contrôle les
// pièces et la cohérence, il ne décide pas d'accorder ou refuser le congé sur le
// fond (ça reste au RH, après l'avis éventuel du chef de service) — d'où un
// vocabulaire différent de CongesAdmin.jsx (« Transmettre »/« Renvoyer », pas
// « Approuver »/« Refuser »).
export default function CongesSecretariat() {
  const [vue, setVue] = useVueListe('conges-secretariat');
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [avisMap, setAvisMap] = useState({});
  const [reviewingId, setReviewingId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setDemandes(await getPendingSecretariat());
    } catch (err) {
      setActionError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleReview(id, decision) {
    if (reviewingId) return;
    if (decision === 'refusee' && !(avisMap[id] || '').trim()) {
      setActionError(traduire('Indique un motif avant de renvoyer une demande au demandeur.'));
      return;
    }
    setActionError('');
    setReviewingId(id);
    try {
      await reviewSecretariat(id, decision, avisMap[id] || '');
      setDemandes((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div>
      <PageHeader crumbs={[{ label: traduire('Secrétariat') }, { label: traduire('Congés à vérifier') }]} title={traduire('Congés à vérifier')} subtitle={traduire('Vérifiez les pièces et la cohérence avant transmission au RH')} />
      <div className="flex justify-end mb-3">
        <ViewToggle value={vue} onChange={setVue} />
      </div>

      {actionError && <p className="text-sm text-status-rejected mb-4">{actionError}</p>}
      {loading && (
        <div className={classeConteneur(vue, 4)}>
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      )}
      {!loading && demandes.length === 0 && <EmptyState title={traduire('Aucune demande en attente de vérification.')} />}

      <div className={classeConteneur(vue, 4)}>
        {demandes.map((d) => (
          <div key={d.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
            <div className="mb-3">
              <p className="font-medium text-navy dark:text-gray-100">{d.prenom} {d.nom} <span className="text-xs text-gray-400 dark:text-gray-500">({d.role})</span></p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{d.type_conge} — {d.email}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Du {new Date(d.date_debut).toLocaleDateString('fr-FR')} au {new Date(d.date_fin).toLocaleDateString('fr-FR')}
              </p>
              {d.lieu_jouissance && <p className="text-xs text-gray-400 dark:text-gray-500">{traduire('Lieu :')} {d.lieu_jouissance}</p>}
              {d.remplacant && <p className="text-xs text-gray-400 dark:text-gray-500">{traduire('Remplaçant :')} {d.remplacant}</p>}
              {d.motif && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{traduire('Motif :')} {d.motif}</p>}
            </div>

            <div className="flex items-center gap-3 mb-3">
              <Link to={`/demandes/${d.id}/fiche`} className="text-xs text-navy dark:text-gold underline inline-block">
                {traduire('Voir / télécharger la fiche')}
              </Link>
              {d.justificatif_path ? (
                <button
                  type="button"
                  onClick={() => telechargerJustificatifConge(d.id, d.justificatif_filename)}
                  className="text-xs text-navy dark:text-gold underline inline-block"
                >
                  {traduire('Voir le justificatif')}
                </button>
              ) : JUSTIFICATIF_OBLIGATOIRE.includes(d.type_conge) && (
                <span className="text-xs text-status-pending">{traduire('Aucun justificatif fourni')}</span>
              )}
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
                disabled={reviewingId !== null}
                className="px-4 py-2 rounded-md border border-status-rejected text-status-rejected text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reviewingId === d.id ? '...' : traduire('Renvoyer au demandeur')}
              </button>
              <button
                onClick={() => handleReview(d.id, 'approuvee')}
                disabled={reviewingId !== null}
                className="px-4 py-2 rounded-md bg-navy dark:bg-gold text-white dark:text-navy text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reviewingId === d.id ? '...' : traduire('Transmettre au RH')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
