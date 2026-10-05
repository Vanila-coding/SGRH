import { useEffect, useState } from 'react';
import { sendNotification } from '../../services/notificationApi';
import { listUsers } from '../../services/userApi';
import PageHeader from '../../components/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import SelectMenu from '../../components/ui/SelectMenu';
import { traduire } from '../../i18n';

const FONCTIONS = [
  'Enseignant', 'Enseignant Chercheur', 'Maître de Conférences', 'Professeur',
  'Agent', 'Chef de service', 'Responsable/Directeur',
];

// Destinations réellement existantes dans l'app (self-service PE/PAT), mêmes
// routes que celles utilisées par les notifications automatiques — jamais de
// saisie libre d'URL. Doit rester synchronisé avec ALLOWED_LIENS côté backend
// (notificationController.js).
const DESTINATIONS = [
  { value: '/profil', label: traduire('Mon profil') },
  { value: '/carriere', label: traduire('Ma carrière') },
  { value: '/mes-contrats', label: traduire('Mes contrats') },
  { value: '/conges', label: traduire('Mes congés') },
  { value: '/mes-documents', label: traduire('Mes documents') },
  { value: '/notifications', label: traduire('Notifications') },
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
    if (ciblage !== 'individual') return;
    listUsers().then(setIndividuals).catch(() => {}).finally(() => setIndividualsLoading(false));
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
      <PageHeader crumbs={[{ label: traduire('Admin RH') }, { label: traduire('Envoyer une notification') }]} title={traduire('Envoyer une notification')} subtitle={traduire('Ciblez un groupe, une fonction ou une personne précise')} />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sm:p-8 w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Destinataires')}</label>
            <SelectMenu
              value={ciblage}
              onChange={(e) => { setCiblage(e.target.value); if (e.target.value === 'individual') setIndividualsLoading(true); }}
              className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="role">{traduire('Tout un groupe (PE ou PAT)')}</option>
              <option value="fonction">{traduire('Une fonction précise (ex: chefs de service)')}</option>
              <option value="individual">{traduire('Une personne précise')}</option>
            </SelectMenu>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {ciblage === 'role' ? 'Groupe' : ciblage === 'fonction' ? traduire('Fonction') : traduire('Personne')}
            </label>
            {ciblage === 'role' && (
              <SelectMenu
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              >
                <option value="PE">{traduire('Tous les PE')}</option>
                <option value="PAT">{traduire('Tous les PAT')}</option>
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
                <option value="">{traduire('-- Choisir une personne --')}</option>
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Type')}</label>
            <SelectMenu
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="info">{traduire('Information')}</option>
              <option value="reunion">{traduire('Réunion')}</option>
              <option value="echeance">{traduire('Échéance de contrat')}</option>
            </SelectMenu>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Titre')}</label>
            <input
              type="text"
              required
              placeholder={traduire('Titre')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Destination (facultatif)')}</label>
          <SelectMenu
            value={lien}
            onChange={(e) => setLien(e.target.value)}
            className="w-full sm:w-1/2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
          >
            <option value="">{traduire('Aucune')}</option>
            {DESTINATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </SelectMenu>
          <p className="text-xs text-gray-400 mt-1">{traduire('Si une destination est choisie, la notification sera cliquable et renverra vers cette page.')}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Message')}</label>
          <textarea
            required
            rows={4}
            placeholder={traduire('Message')}
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
          {status === 'loading' ? 'Envoi...' : traduire('Envoyer')}
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
