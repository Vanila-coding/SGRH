import { useEffect, useState } from 'react';
import { getToutesReclamations, traiterReclamation } from '../../services/reclamationApi';
import PageHeader from '../../components/PageHeader';
import { SkeletonCard } from '../../components/ui/Skeleton';

const STATUT_LABELS = {
  ouverte: { label: 'En attente', color: 'bg-amber-50 text-status-pending' },
  traitee: { label: 'Traitée', color: 'bg-green-50 text-status-approved' },
};

function nomAuteur(r) {
  const nomComplet = `${r.auteur_prenom || ''} ${r.auteur_nom || ''}`.trim();
  return nomComplet || r.auteur_email || 'Auteur supprimé';
}

export default function Reclamations() {
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reponses, setReponses] = useState({});
  const [ouvertId, setOuvertId] = useState(null);
  const [saving, setSaving] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setReclamations(await getToutesReclamations());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleTraiter(id) {
    setError('');
    setSaving(id);
    try {
      await traiterReclamation(id, reponses[id] || '');
      setOuvertId(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  }

  const ouvertes = reclamations.filter((r) => r.statut === 'ouverte');
  const traitees = reclamations.filter((r) => r.statut === 'traitee');

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader crumbs={[{ label: 'Administration' }, { label: 'Réclamations' }]} title="Réclamations" subtitle="Problèmes signalés par le personnel" />

      {error && <p className="text-sm text-status-rejected mb-4">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      ) : (
        <>
          {reclamations.length === 0 && <p className="text-gray-500 dark:text-gray-400">Aucune réclamation.</p>}

          {ouvertes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-navy dark:text-gold mb-3">En attente ({ouvertes.length})</h3>
              <div className="space-y-3">
                {ouvertes.map((r) => (
                  <div key={r.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy dark:text-gray-100">{r.sujet}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {nomAuteur(r)} — {new Date(r.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${STATUT_LABELS[r.statut].color}`}>{STATUT_LABELS[r.statut].label}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{r.description}</p>

                    {ouvertId === r.id ? (
                      <div className="mt-3 space-y-2">
                        <textarea
                          rows={3}
                          value={reponses[r.id] || ''}
                          onChange={(e) => setReponses((prev) => ({ ...prev, [r.id]: e.target.value }))}
                          placeholder="Votre réponse..."
                          className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleTraiter(r.id)}
                            disabled={saving === r.id || !(reponses[r.id] || '').trim()}
                            className="px-3 py-1.5 rounded-md text-xs font-medium bg-status-approved text-white disabled:opacity-50"
                          >
                            {saving === r.id ? '...' : 'Marquer traitée'}
                          </button>
                          <button
                            onClick={() => setOuvertId(null)}
                            className="px-3 py-1.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setOuvertId(r.id)}
                        className="mt-3 px-3 py-1.5 rounded-md text-xs font-medium border border-navy text-navy dark:border-gold dark:text-gold hover:bg-navy/5 dark:hover:bg-gold/10"
                      >
                        Répondre
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {traitees.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-navy dark:text-gold mb-3">Traitées ({traitees.length})</h3>
              <div className="space-y-3">
                {traitees.map((r) => (
                  <div key={r.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 opacity-75">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy dark:text-gray-100">{r.sujet}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          {nomAuteur(r)} — {new Date(r.created_at).toLocaleString('fr-FR')}
                        </p>
                      </div>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${STATUT_LABELS[r.statut].color}`}>{STATUT_LABELS[r.statut].label}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{r.description}</p>
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Réponse</p>
                      <p className="text-sm text-gray-700 dark:text-gray-200">{r.reponse}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
