import { useEffect, useState } from 'react';
import { sendNotification } from '../../services/notificationApi';
import { listUsers } from '../../services/userApi';
import PageHeader from '../../components/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import SelectMenu from '../../components/ui/SelectMenu';

const FONCTIONS = [
  'Enseignant', 'Enseignant Chercheur', 'Maître de Conférences', 'Professeur',
  'Agent', 'Chef de service', 'Responsable/Directeur',
];

// Destinations réellement existantes dans l'app (self-service PE/PAT), mêmes
// routes que celles utilisées par les notifications automatiques — jamais de
// saisie libre d'URL. Doit rester synchronisé avec ALLOWED_LIENS côté backend
// (notificationController.js).
const DESTINATIONS = [
  { value: '/profil', label: 'Mon profil' },
  { value: '/carriere', label: 'Ma carrière' },
  { value: '/mes-contrats', label: 'Mes contrats' },
  { value: '/conges', label: 'Mes congés' },
  { value: '/mes-documents', label: 'Mes documents' },
  { value: '/notifications', label: 'Notifications' },
];

export default function EnvoyerNotification() {
  const [ciblage, setCiblage] = useState('role'); // 'role' | 'fonction' | 'individual'
  const [role, setRole] = useState('PE');
  const [fonction, setFonction] = useState(FONCTIONS[0]);
  const [individuals, setIndividuals] = useState([]);
  const [selectedIndividual, setSelectedIndividual] = useState('');
  const [individualsLoading, setIndividualsLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [lien, setLien] = useState('');
  const [status, setStatus] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (ciblage === 'individual') {
      setIndividualsLoading(true);
      listUsers().then(setIndividuals).catch(() => {}).finally(() => setIndividualsLoading(false));
    }
  }, [ciblage]);

  function buildTarget() {
    if (ciblage === 'role') return { type: 'role', role };
    if (ciblage === 'fonction') return { type: 'fonction', fonction };
    return { type: 'individual', recipientIds: [Number(selectedIndividual)] };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    try {
      const result = await sendNotification(buildTarget(), title, message, type, lien || null);
      setStatus('success');
      setFeedback(`Notification envoyée à ${result.count} personne(s)`);
      setTitle('');
      setMessage('');
      setLien('');
    } catch (err) {
      setStatus('error');
      setFeedback(err.message);
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader crumbs={[{ label: 'Admin RH' }, { label: 'Envoyer une notification' }]} title="Envoyer une notification" subtitle="Ciblez un groupe, une fonction ou une personne précise" />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sm:p-8 w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destinataires</label>
            <SelectMenu
              value={ciblage}
              onChange={(e) => setCiblage(e.target.value)}
              className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="role">Tout un groupe (PE ou PAT)</option>
              <option value="fonction">Une fonction précise (ex: chefs de service)</option>
              <option value="individual">Une personne précise</option>
            </SelectMenu>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {ciblage === 'role' ? 'Groupe' : ciblage === 'fonction' ? 'Fonction' : 'Personne'}
            </label>
            {ciblage === 'role' && (
              <SelectMenu
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              >
                <option value="PE">Tous les PE</option>
                <option value="PAT">Tous les PAT</option>
              </SelectMenu>
            )}

            {ciblage === 'fonction' && (
              <SelectMenu
                value={fonction}
                onChange={(e) => setFonction(e.target.value)}
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              >
                {FONCTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </SelectMenu>
            )}

            {ciblage === 'individual' && (
              individualsLoading ? (
                <Skeleton className="h-9 w-full rounded-md" />
              ) : (
              <SelectMenu
                required
                value={selectedIndividual}
                onChange={(e) => setSelectedIndividual(e.target.value)}
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              >
                <option value="">-- Choisir une personne --</option>
                {individuals.map((u) => (
                  <option key={u.id} value={u.id}>{u.email} ({u.role}{u.fonction ? ` - ${u.fonction}` : ''})</option>
                ))}
              </SelectMenu>
              )
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <SelectMenu
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="info">Information</option>
              <option value="reunion">Réunion</option>
              <option value="echeance">Échéance de contrat</option>
            </SelectMenu>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Titre</label>
            <input
              type="text"
              required
              placeholder="Titre"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Destination (facultatif)</label>
          <SelectMenu
            value={lien}
            onChange={(e) => setLien(e.target.value)}
            className="w-full sm:w-1/2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
          >
            <option value="">Aucune</option>
            {DESTINATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </SelectMenu>
          <p className="text-xs text-gray-400 mt-1">Si une destination est choisie, la notification sera cliquable et renverra vers cette page.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
          <textarea
            required
            rows={4}
            placeholder="Message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
          />
        </div>

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full sm:w-auto bg-navy text-white rounded-md px-8 py-2 font-medium hover:opacity-90 disabled:opacity-50"
        >
          {status === 'loading' ? 'Envoi...' : 'Envoyer'}
        </button>

        {feedback && (
          <p className={`text-sm ${status === 'success' ? 'text-status-approved' : 'text-status-rejected'}`}>
            {feedback}
          </p>
        )}
      </form>
      </div>
    </div>
  );
}
