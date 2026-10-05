import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { createDemande, getMyDemandes, getSoldeConges, uploadJustificatif, telechargerJustificatifConge } from '../../services/congeApi';
import { getMyPersonnel } from '../../services/personnelApi';
import { TYPES_CONGE, JUSTIFICATIF_OBLIGATOIRE, STATUS_LABELS } from '../../constants/conges';
import { SkeletonText } from '../../components/ui';
import SelectMenu from '../../components/ui/SelectMenu';
import { traduire } from '../../i18n';
import DateInput from '../../components/ui/DateInput';

function formatJours(n) {
  if (n === null || n === undefined) return '—';
  return `${Number(n).toLocaleString('fr-FR')} jour${Number(n) > 1 ? 's' : ''}`;
}

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-sm font-medium text-navy dark:text-gray-100">{value || '—'}</p>
    </div>
  );
}

export default function Conges() {
  const [personnel, setPersonnel] = useState(null);
  const [demandes, setDemandes] = useState([]);
  const [solde, setSolde] = useState(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState('form'); // 'form' | 'justificatif'
  const [createdDemandeId, setCreatedDemandeId] = useState(null);
  const [createdType, setCreatedType] = useState('');
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadFeedback, setUploadFeedback] = useState('');

  const [typeConge, setTypeConge] = useState(TYPES_CONGE[0]);
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [motif, setMotif] = useState('');
  const [lieuJouissance, setLieuJouissance] = useState('');
  const [dateRepriseService, setDateRepriseService] = useState('');
  const [remplacant, setRemplacant] = useState('');
  const [status, setStatus] = useState(null);
  const [feedback, setFeedback] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [p, d, s] = await Promise.all([getMyPersonnel(), getMyDemandes(), getSoldeConges()]);
      setPersonnel(p);
      setDemandes(d);
      setSolde(s);
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    Promise.all([getMyPersonnel(), getMyDemandes(), getSoldeConges()])
      .then(([p, d, s]) => {
        setPersonnel(p);
        setDemandes(d);
        setSolde(s);
      })
      .catch((err) => setFeedback(err.message))
      .finally(() => setLoading(false));
  }, []);

  function resetForm() {
    setDateDebut(''); setDateFin(''); setMotif('');
    setLieuJouissance(''); setDateRepriseService(''); setRemplacant('');
  }

  function finishFlow(message) {
    setStep('form');
    setFile(null);
    setUploadStatus(null);
    setUploadFeedback('');
    resetForm();
    setStatus('success');
    setFeedback(message);
    load();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setFeedback('');
    try {
      const result = await createDemande({
        typeConge, dateDebut, dateFin, motif,
        lieuJouissance, dateRepriseService, remplacant,
      });
      setCreatedDemandeId(result.demande.id);
      setCreatedType(typeConge);
      setStep('justificatif');
    } catch (err) {
      setStatus('error');
      setFeedback(err.message);
    }
  }

  async function handleUploadJustificatif() {
    setUploadStatus('loading');
    setUploadFeedback('');
    try {
      await uploadJustificatif(createdDemandeId, file);
      finishFlow('Demande envoyée avec justificatif.');
    } catch (err) {
      setUploadStatus('error');
      setUploadFeedback(err.message);
    }
  }

  const obligatoire = JUSTIFICATIF_OBLIGATOIRE.includes(createdType);

  return (
    <div>
      <PageHeader
        crumbs={[{ label: traduire('Mon espace'), path: '/dashboard' }, { label: traduire('Mes congés & absences') }]}
        title={traduire('Mes congés & absences')}
        subtitle={traduire('Déposez une demande et suivez son traitement')}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-navy dark:text-gold mb-4">{traduire('Nouvelle demande')}</h3>

        {personnel && (
          <div className="grid grid-cols-2 gap-3 mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <ReadOnlyField label={traduire('Matricule')} value={personnel.matricule} />
            <ReadOnlyField label={traduire('Nom et prénom')} value={[personnel.prenom, personnel.nom].filter(Boolean).join(' ')} />
            <ReadOnlyField label={traduire('Fonction')} value={personnel.fonction} />
            <ReadOnlyField label={traduire('Corps / Grade')} value={[personnel.corps, personnel.grade].filter(Boolean).join(' / ')} />
          </div>
        )}

        {solde && (
          <div className="mb-5 p-3 bg-navy/5 dark:bg-gold/10 rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-sm text-navy dark:text-gray-100 font-medium">{traduire('Solde de congé annuel disponible')}</span>
              <span className="text-xl font-bold text-navy dark:text-gold">{formatJours(solde.soldeDisponible)}</span>
            </div>
            {solde.dateRecrutementConnue ? (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Droits acquis en {solde.annee} : {formatJours(solde.droitsAnnee)} · Reliquat des années précédentes : {formatJours(solde.reliquat)} · Déjà posés en {solde.annee} : {formatJours(solde.joursPrisAnnee)}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {traduire('Date de recrutement non renseignée : les droits de l\'année ne peuvent pas être calculés automatiquement. Votre solde actuel est conservé comme solde d\'ouverture.')}
              </p>
            )}
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Type de demande')}</label>
              <SelectMenu
                value={typeConge}
                onChange={(e) => setTypeConge(e.target.value)}
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              >
                {TYPES_CONGE.map((t) => <option key={t} value={t}>{t}</option>)}
              </SelectMenu>
              {typeConge === 'Congé annuel' && (
                <p className="text-xs text-gray-400 mt-1">
                  {traduire('Minimum 15 jours pour votre première demande de congé annuel de l\'année (ou votre solde disponible s\'il est inférieur).')}
                </p>
              )}
              {typeConge === 'Congé de paternité' && (
                <p className="text-xs text-gray-400 mt-1">
                  {traduire('Le congé de paternité est limité à 15 jours maximum.')}
                </p>
              )}
              {typeConge === 'Congé de maternité' && (
                <p className="text-xs text-gray-400 mt-1">
                  {traduire('Durée indicative : environ 3 mois.')}
                </p>
              )}
              {JUSTIFICATIF_OBLIGATOIRE.includes(typeConge) && (
                <p className="text-xs text-status-pending mt-1">
                  {traduire("Un justificatif sera demandé à l'étape suivante pour ce type de congé.")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Date de début')}</label>
                <DateInput
                   required value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Date de fin')}</label>
                <DateInput
                   required value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Lieu de jouissance')}</label>
              <input
                type="text" value={lieuJouissance}
                onChange={(e) => setLieuJouissance(e.target.value)}
                placeholder={traduire('Ex : Mahajanga')}
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Date de reprise de service')}</label>
              <DateInput
                 value={dateRepriseService}
                onChange={(e) => setDateRepriseService(e.target.value)}
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Remplaçant(e) (optionnel)')}</label>
              <input
                type="text" value={remplacant}
                onChange={(e) => setRemplacant(e.target.value)}
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Motif')}</label>
              <textarea
                rows={2} value={motif}
                onChange={(e) => setMotif(e.target.value)}
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>

            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-navy text-white rounded-md py-2 font-medium hover:opacity-90 disabled:opacity-50"
            >
              {status === 'loading' ? 'Envoi...' : traduire('Envoyer la demande')}
            </button>

            {feedback && (
              <p className={`text-sm ${status === 'success' ? 'text-status-approved' : 'text-status-rejected'}`}>
                {feedback}
              </p>
            )}
          </form>
        )}

        {step === 'justificatif' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Demande envoyée. {obligatoire
                ? 'Un justificatif est obligatoire pour ce type de congé.'
                : 'Vous pouvez joindre un justificatif (optionnel).'}
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Justificatif (PDF, JPG ou PNG)')}</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files[0] || null)}
                className="w-full border border-gray-300 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleUploadJustificatif}
                disabled={uploadStatus === 'loading' || (obligatoire && !file)}
                className="flex-1 bg-navy text-white rounded-md py-2 font-medium hover:opacity-90 disabled:opacity-50"
              >
                {uploadStatus === 'loading' ? 'Envoi...' : traduire('Envoyer le justificatif')}
              </button>
              {!obligatoire && (
                <button
                  onClick={() => finishFlow('Demande envoyée sans justificatif.')}
                  className="px-4 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {traduire('Passer')}
                </button>
              )}
            </div>
            {uploadFeedback && <p className="text-sm text-status-rejected">{uploadFeedback}</p>}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-navy dark:text-gold mb-4">{traduire('Mes demandes')}</h3>
        {loading && <SkeletonText lines={4} />}
        {!loading && demandes.length === 0 && (
          <p className="text-gray-400 dark:text-gray-500 text-sm">{traduire("Aucune demande pour l'instant.")}</p>
        )}
        <div className="space-y-3">
          {demandes.map((d) => (
            <div key={d.id} className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-navy dark:text-gray-100">{d.type_conge}</p>
                <span className={`text-xs font-medium ${STATUS_LABELS[d.status].color}`}>
                  {STATUS_LABELS[d.status].label}
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Du {new Date(d.date_debut).toLocaleDateString('fr-FR')} au {new Date(d.date_fin).toLocaleDateString('fr-FR')}
              </p>
              {d.decision_intermediaire === 'en_attente' && (
                <p className="text-xs text-status-pending mt-1">{traduire("En attente de l'avis du responsable direct")}</p>
              )}
              {d.lieu_jouissance && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{traduire('Lieu :')} {d.lieu_jouissance}</p>}
              {d.avis_chef_service && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{traduire('Avis :')} {d.avis_chef_service}</p>
              )}
              {d.justificatif_path && (
                <button
                  type="button"
                  onClick={() => telechargerJustificatifConge(d.id, d.justificatif_filename)}
                  className="text-xs text-navy dark:text-gold underline mt-1 inline-block mr-3"
                >
                  {traduire('Voir le justificatif')}
                </button>
              )}
              <Link to={`/demandes/${d.id}/fiche`} className="text-xs text-navy dark:text-gold underline mt-1 inline-block">
                {traduire('Voir / télécharger la fiche')}
              </Link>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}