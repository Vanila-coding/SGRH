import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { signalerProbleme, getMesReclamations } from '../../services/reclamationApi';
import { SkeletonText } from '../../components/ui';

const STATUT_LABELS = {
  ouverte: { label: 'En attente', color: 'text-status-pending' },
  traitee: { label: 'Traitée', color: 'text-status-approved' },
};

export default function Reclamation() {
  const [sujet, setSujet] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [mesReclamations, setMesReclamations] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setMesReclamations(await getMesReclamations());
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setFeedback('');
    try {
      await signalerProbleme({ sujet, description });
      setSujet('');
      setDescription('');
      setStatus('success');
      setFeedback('Réclamation envoyée au Superadmin.');
      load();
    } catch (err) {
      setStatus('error');
      setFeedback(err.message);
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        crumbs={[{ label: 'Aide' }, { label: 'Signaler un problème' }]}
        title="Signaler un problème"
        subtitle="Décrivez le problème rencontré : le Superadmin est notifié dès l'envoi"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="font-semibold text-navy dark:text-gold mb-4">Nouvelle réclamation</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sujet</label>
              <input
                type="text"
                required
                maxLength={150}
                value={sujet}
                onChange={(e) => setSujet(e.target.value)}
                placeholder="Ex : Impossible de télécharger ma fiche de congé"
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez le problème rencontré, avec le plus de détails possible."
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-navy text-white rounded-md py-2 font-medium hover:opacity-90 disabled:opacity-50"
            >
              {status === 'loading' ? 'Envoi...' : 'Envoyer au Superadmin'}
            </button>
            {feedback && (
              <p className={`text-sm ${status === 'success' ? 'text-status-approved' : 'text-status-rejected'}`}>{feedback}</p>
            )}
          </form>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="font-semibold text-navy dark:text-gold mb-4">Mes réclamations</h3>
          {loading && <SkeletonText lines={4} />}
          {!loading && mesReclamations.length === 0 && (
            <p className="text-gray-400 dark:text-gray-500 text-sm">Aucune réclamation pour l'instant.</p>
          )}
          <div className="space-y-3">
            {mesReclamations.map((r) => (
              <div key={r.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-navy dark:text-gray-100">{r.sujet}</p>
                  <span className={`text-xs font-medium shrink-0 ${STATUT_LABELS[r.statut].color}`}>{STATUT_LABELS[r.statut].label}</span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  Envoyée le {new Date(r.created_at).toLocaleDateString('fr-FR')}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{r.description}</p>
                {r.statut === 'traitee' && r.reponse && (
                  <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">Réponse du Superadmin</p>
                    <p className="text-sm text-gray-700 dark:text-gray-200">{r.reponse}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
