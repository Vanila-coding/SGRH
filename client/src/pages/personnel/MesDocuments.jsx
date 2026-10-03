import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { demanderDocument, getMesDemandesDocuments } from '../../services/documentApi';
import { SkeletonText } from '../../components/ui';
import SelectMenu from '../../components/ui/SelectMenu';
import ViewToggle from '../../components/ui/ViewToggle';
import useVueListe from '../../hooks/useVueListe';

const TYPES_DOCUMENT = [
  { value: 'certificat_administratif', label: 'Certificat administratif' },
  { value: 'lettre_confirmation', label: 'Lettre de confirmation' },
  { value: 'etat_conge', label: 'État de congé' },
];

const STATUT_LABELS = {
  en_attente: { label: 'En attente', color: 'text-status-pending' },
  traitee: { label: 'Prêt', color: 'text-status-approved' },
  refusee: { label: 'Refusée', color: 'text-status-rejected' },
};

export default function MesDocuments() {
  const [vue, setVue] = useVueListe('mes-documents');
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeDocument, setTypeDocument] = useState(TYPES_DOCUMENT[0].value);
  const [motif, setMotif] = useState('');
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try {
      setDemandes(await getMesDemandesDocuments());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      await demanderDocument(typeDocument, motif);
      setStatus('success');
      setMessage('Demande envoyée au service RH.');
      setMotif('');
      load();
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  return (
    <div>
      <PageHeader
        crumbs={[{ label: 'Mon espace', path: '/dashboard' }, { label: 'Mes documents' }]}
        title="Mes documents"
        subtitle="Demandez un document administratif et suivez son traitement"
      />
      <div className="flex justify-end mb-3">
        <ViewToggle value={vue} onChange={setVue} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-navy dark:text-gold mb-4">Demander un document</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de document</label>
            <SelectMenu
              value={typeDocument}
              onChange={(e) => setTypeDocument(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            >
              {TYPES_DOCUMENT.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </SelectMenu>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Motif (optionnel)</label>
            <textarea
              rows={2} value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-navy text-white rounded-md py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {status === 'loading' ? 'Envoi...' : 'Envoyer la demande'}
          </button>
          {message && (
            <p className={`text-sm ${status === 'success' ? 'text-status-approved' : 'text-status-rejected'}`}>
              {message}
            </p>
          )}
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-navy dark:text-gold mb-4">Mes demandes</h3>
        {loading && <SkeletonText lines={3} />}
        {!loading && demandes.length === 0 && <p className="text-sm text-gray-400">Aucune demande pour l'instant.</p>}
        <div className={vue === 'liste' ? 'space-y-3' : 'grid grid-cols-1 lg:grid-cols-2 gap-3'}>
          {demandes.map((d) => (
            <div key={d.id} className="border-b last:border-0 dark:border-gray-700 pb-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-navy dark:text-gray-100">
                  {TYPES_DOCUMENT.find((t) => t.value === d.type_document)?.label || (d.type_document === 'decision_conge' ? "Décision d'octroi de congé" : d.type_document)}
                </p>
                <span className={`text-xs font-medium ${STATUT_LABELS[d.statut].color}`}>
                  {STATUT_LABELS[d.statut].label}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Demandé le {new Date(d.date_demande).toLocaleDateString('fr-FR')}
              </p>
              {d.statut === 'traitee' && d.document_id && (
                <Link to={`/documents/${d.document_id}`} target="_blank" className="text-xs text-navy underline mt-1 inline-block">
                  Voir / télécharger le document
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}