import { useEffect, useState } from 'react';
import { listUsers, changeFonction, getFonctionHistory } from '../../services/userApi';
import { FONCTIONS_PAR_ROLE } from '../../constants/fonctions';
import PageHeader from '../../components/PageHeader';
import PersonnelSearchSelect from '../../components/PersonnelSearchSelect';
import { Skeleton } from '../../components/ui/Skeleton';
import SelectMenu from '../../components/ui/SelectMenu';

export default function GestionFonctions() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [newFonction, setNewFonction] = useState('');
  const [history, setHistory] = useState([]);
  const [status, setStatus] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => {
    listUsers().then(setUsers).catch(() => {}).finally(() => setListLoading(false));
  }, []);

  const selectedUser = users.find((u) => u.id === Number(selectedUserId));

  useEffect(() => {
    if (selectedUserId) {
      getFonctionHistory(selectedUserId).then(setHistory).catch(() => setHistory([]));
    } else {
      setHistory([]);
    }
  }, [selectedUserId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      await changeFonction(selectedUserId, newFonction);
      setStatus('success');
      setFeedback('Fonction mise à jour');
      setUsers(await listUsers());
      setHistory(await getFonctionHistory(selectedUserId));
      setNewFonction('');
    } catch (err) {
      setStatus('error');
      setFeedback(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Admin RH' }, { label: 'Carrière' }, { label: 'Fonctions' }]}
        title="Fonctions"
        subtitle="Modifier la fonction d'un membre du personnel (avancement de grade, changement de poste...)"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-fit ${!selectedUserId ? 'lg:col-span-2' : ''}`}>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div>
            <label htmlFor="fonctions-personnel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Membre du personnel</label>
            {listLoading ? (
              <Skeleton className="h-9 w-full rounded-md" />
            ) : (
            <PersonnelSearchSelect
              id="fonctions-personnel"
              required
              items={users}
              value={selectedUserId}
              onChange={(id) => { setSelectedUserId(id); setNewFonction(''); }}
              formatOption={(u) => `${u.matricule ? `${u.matricule} — ` : ''}${[u.prenom, u.nom].filter(Boolean).join(' ') || u.email} (${u.fonction || 'aucune fonction'})`}
              formatLabel={(u) => `${u.matricule ? `${u.matricule} — ` : ''}${[u.prenom, u.nom].filter(Boolean).join(' ') || u.email}`}
            />
            )}
          </div>

          {selectedUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nouvelle fonction</label>
              <SelectMenu
                required
                value={newFonction}
                onChange={(e) => setNewFonction(e.target.value)}
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              >
                <option value="">-- Choisir --</option>
                {FONCTIONS_PAR_ROLE[selectedUser.role].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </SelectMenu>
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'loading' || !selectedUserId || !newFonction}
            className="w-full bg-navy text-white rounded-md py-2 font-medium hover:opacity-90 disabled:opacity-50"
          >
            {status === 'loading' ? 'Mise à jour...' : 'Valider le changement'}
          </button>

          {feedback && (
            <p className={`text-sm ${status === 'success' ? 'text-status-approved' : 'text-status-rejected'}`}>
              {feedback}
            </p>
          )}
        </form>
      </div>

      {selectedUserId && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 h-fit">
          <h3 className="text-sm font-semibold text-navy mb-3">Historique des changements</h3>
          {history.length === 0 && <p className="text-sm text-gray-400 dark:text-gray-400">Aucun changement enregistré.</p>}
          <div className="space-y-2">
            {history.map((h) => (
              <div key={h.id} className="text-sm border-b border-gray-200 dark:border-gray-700 last:border-0 pb-2">
                <p className="text-navy dark:text-gray-100">
                  {h.ancienne_fonction || 'Aucune'} → <span className="font-medium">{h.nouvelle_fonction}</span>
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(h.changed_at).toLocaleString('fr-FR')} par {h.changed_by_email || 'système'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
