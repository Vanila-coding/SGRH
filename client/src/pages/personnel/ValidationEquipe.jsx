import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { getPendingEquipe, reviewIntermediaire } from '../../services/congeApi';
import { SkeletonCard, EmptyState } from '../../components/ui';
import ViewToggle from '../../components/ui/ViewToggle';
import useVueListe from '../../hooks/useVueListe';
import { traduire } from '../../i18n';

export default function ValidationEquipe() {
  const [vue, setVue] = useVueListe('validation-equipe');
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avisMap, setAvisMap] = useState({});
  const [reviewingId, setReviewingId] = useState(null);

  useEffect(() => {
    getPendingEquipe()
      .then(setDemandes)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleReview(id, decision) {
    if (reviewingId) return;
    setError('');
    setReviewingId(id);
    try {
      await reviewIntermediaire(id, decision, avisMap[id] || '');
      setDemandes((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setReviewingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        crumbs={[{ label: traduire('Mon espace'), path: '/dashboard' }, { label: traduire('Validation équipe') }]}
        title={traduire('Validation équipe')}
        subtitle={traduire("Demandes de votre équipe en attente de votre avis, avant transmission à l'Admin RH")}
      />
      <div className="flex justify-end mb-3">
        <ViewToggle value={vue} onChange={setVue} />
      </div>

      {error && <p className="text-sm text-status-rejected mb-4">{error}</p>}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      )}
      {!loading && demandes.length === 0 && <EmptyState title={traduire('Aucune demande en attente.')} />}

      <div className={vue === 'liste' ? 'flex flex-col gap-4' : 'grid grid-cols-1 gap-4 lg:grid-cols-2'}>
        {demandes.map((d) => (
          <div key={d.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-medium text-navy dark:text-gray-100">{d.prenom} {d.nom}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{d.type_conge}</p>
                <p className="text-xs text-gray-400">
                  Du {new Date(d.date_debut).toLocaleDateString('fr-FR')} au {new Date(d.date_fin).toLocaleDateString('fr-FR')}
                </p>
                {d.motif && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{traduire('Motif :')} {d.motif}</p>}
              </div>
            </div>

            <Link to={`/demandes/${d.id}/fiche`} className="text-xs text-navy dark:text-gold underline mb-3 inline-block">
              {traduire('Voir / télécharger la fiche')}
            </Link>

            <textarea
              placeholder={traduire('Votre avis (optionnel)')}
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
                {reviewingId === d.id ? 'Refus...' : traduire('Refuser')}
              </button>
              <button
                onClick={() => handleReview(d.id, 'approuvee')}
                disabled={reviewingId !== null}
                className="px-4 py-2 rounded-md bg-navy text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reviewingId === d.id ? 'Approbation...' : traduire('Approuver')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
