import { useState } from 'react';
import { Mail, MessageSquare, Copy } from 'lucide-react';
import Modal from './ui/Modal';
import { contacterCompteParEmail } from '../services/accountAdminApi';
import { toast } from '../utils/toast';
import { traduire } from '../i18n';

// Étape obligatoire avant de désactiver ou supprimer un compte : écrire et envoyer un
// e-mail à la personne concernée, puis un seul bouton final envoie l'e-mail ET exécute
// l'action (désactivation/suppression) — pas de suppression possible sans être passé
// par cet écran. Par e-mail uniquement : aucun fournisseur SMS n'est configuré dans ce
// projet (pas de clé Twilio/Vonage en .env) ; plutôt que de simuler un envoi, le numéro
// est affiché pour un contact manuel (appel ou SMS depuis le téléphone du RH).
export default function ContacterCompteModal({ compte, libelleBouton, sujetDefaut = '', messageDefaut = '', onClose, onConfirmerAction }) {
  const nomComplet = [compte.prenom, compte.nom].filter(Boolean).join(' ') || compte.email || `Compte #${compte.id}`;
  const [sujet, setSujet] = useState(sujetDefaut);
  const [message, setMessage] = useState(messageDefaut);
  const [envoi, setEnvoi] = useState(false);

  async function handleEnvoyerEtConfirmer(e) {
    e.preventDefault();
    setEnvoi(true);
    try {
      await contacterCompteParEmail(compte.id, sujet, message);
      await onConfirmerAction();
      toast.success(`E-mail envoyé à ${compte.email} et action effectuée.`);
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnvoi(false);
    }
  }

  async function copierNumero() {
    try {
      await navigator.clipboard.writeText(compte.telephone);
      toast.success(traduire('Numéro copié.'));
    } catch {
      toast.error(traduire('Impossible de copier le numéro.'));
    }
  }

  return (
    <Modal onClose={onClose} title={`Contacter ${nomComplet}`} maxWidth="max-w-lg">
      <form onSubmit={handleEnvoyerEtConfirmer} className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Mail size={15} className="shrink-0" aria-hidden="true" />
          {compte.email || traduire('Aucune adresse e-mail enregistrée')}
        </div>

        {compte.email ? (
          <>
            <p className="text-xs text-gray-400 -mt-2">
              {traduire("L'envoi de cet e-mail est obligatoire avant de poursuivre : relisez le message puis validez.")}
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{traduire('Sujet')}</label>
              <input
                type="text" required value={sujet} onChange={(e) => setSujet(e.target.value)}
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{traduire('Message')}</label>
              <textarea
                required rows={5} value={message} onChange={(e) => setMessage(e.target.value)}
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button" onClick={onClose}
                className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {traduire('Annuler')}
              </button>
              <button
                type="submit" disabled={envoi}
                className="flex-1 bg-status-rejected text-white rounded-md py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {envoi ? 'Envoi...' : libelleBouton}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-status-rejected">
            {traduire('Impossible de poursuivre : ce compte n\'a pas d\'adresse e-mail enregistrée, et l\'envoi d\'un message est obligatoire avant cette action.')}
          </p>
        )}

        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 min-w-0">
              <MessageSquare size={15} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{compte.telephone || traduire('Aucun numéro de téléphone enregistré')}</span>
            </div>
            {compte.telephone && (
              <button
                type="button" onClick={copierNumero}
                className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-gold shrink-0"
              >
                <Copy size={13} aria-hidden="true" /> Copier
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {traduire('Envoi de SMS indisponible : aucun fournisseur SMS n\'est configuré pour l\'instant. Utilisez le numéro ci-dessus pour un appel ou un SMS manuel.')}
          </p>
        </div>
      </form>
    </Modal>
  );
}
