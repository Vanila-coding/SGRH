import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { listPersonnel } from '../../services/personnelApi';
import {
  getHistoriquePersonnel, importerContrat, finaliserRenouvellement,
  ajouterDocument as ajouterDocumentContrat, marquerDecision, telechargerDocumentContrat,
} from '../../services/contratApi';
import { TYPES_CONTRAT } from '../../constants/contrats';
import { SkeletonCard } from '../../components/ui';
import Modal from '../../components/ui/Modal';
import PersonnelSearchSelect from '../../components/PersonnelSearchSelect';
import { toast } from '../../utils/toast';
import SelectMenu from '../../components/ui/SelectMenu';
import { traduire } from '../../i18n';

const STATUT_CONTRAT_LABELS = {
  actif: 'Actif', expire: 'Expiré', renouvele: 'Renouvelé', non_renouvele: 'Non renouvelé', resilie: 'Résilié',
};

const emptyContratForm = { typeContrat: TYPES_CONTRAT[0], dateDebut: '', dateFin: '', referenceDecision: '', observations: '' };

// Le sélecteur natif affiche « jj/mm/aaaa » quand il est vide et ce texte n'est pas
// modifiable ; on pose donc le libellé « Début » ou « Fin » par-dessus, sans bloquer le
// clic ni l'icône du calendrier.
function ChampDate({ libelle, value, className, ...props }) {
  return (
    <div className="relative min-w-0">
      <input type="date" value={value} className={`w-full ${className}`} {...props} />
      {!value && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute inset-px right-9 flex items-center rounded-l-md bg-white px-3 text-gray-400 dark:bg-gray-700 dark:text-gray-500 ${className.includes('text-xs') ? 'text-xs' : 'text-sm'}`}
        >
          {libelle}
        </span>
      )}
    </div>
  );
}

export default function Contrats() {
  const [searchParams] = useSearchParams();
  const [personnelList, setPersonnelList] = useState([]);
  const [selectedId, setSelectedId] = useState(searchParams.get('personnel') || '');
  const [contrats, setContrats] = useState(null);
  const [loading, setLoading] = useState(false);

  const [contratForm, setContratForm] = useState(emptyContratForm);
  const [contratFile, setContratFile] = useState(null);
  const [contratStatus, setContratStatus] = useState(null);
  const [contratFeedback, setContratFeedback] = useState('');
  const [renouvelForm, setRenouvelForm] = useState(emptyContratForm);
  const [renouvelFile, setRenouvelFile] = useState(null);
  const [nonRenouvelModal, setNonRenouvelModal] = useState(null);
  const [nonRenouvelMotif, setNonRenouvelMotif] = useState('');
  const [confirmingNonRenouvellement, setConfirmingNonRenouvellement] = useState(false);
  const [avenantFile, setAvenantFile] = useState({});
  const [avenantUploadingId, setAvenantUploadingId] = useState(null);

  useEffect(() => {
    listPersonnel().then(setPersonnelList).catch(() => {});
  }, []);

  async function loadContrats(id) {
    if (!id) { setContrats(null); return; }
    setLoading(true);
    try {
      setContrats(await getHistoriquePersonnel(id));
    } catch (err) {
      setContratFeedback(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadContrats(selectedId);
    setContratForm(emptyContratForm);
    setContratFile(null);
    setRenouvelForm(emptyContratForm);
    setRenouvelFile(null);
    setNonRenouvelModal(null);
  }, [selectedId]);

  async function handleImportContrat(e) {
    e.preventDefault();
    setContratStatus('loading');
    setContratFeedback('');
    try {
      await importerContrat(selectedId, contratForm, contratFile);
      setContratStatus('success');
      setContratFeedback(traduire('Contrat importé.'));
      setContratForm(emptyContratForm);
      setContratFile(null);
      loadContrats(selectedId);
    } catch (err) {
      setContratStatus('error');
      setContratFeedback(err.message);
    }
  }

  async function handleFinaliserRenouvellement(e, contratPrecedentId) {
    e.preventDefault();
    setContratStatus('loading');
    setContratFeedback('');
    try {
      await finaliserRenouvellement(selectedId, contratPrecedentId, renouvelForm, renouvelFile);
      setContratStatus('success');
      setContratFeedback(traduire('Nouveau contrat enregistré.'));
      setRenouvelForm(emptyContratForm);
      setRenouvelFile(null);
      loadContrats(selectedId);
    } catch (err) {
      setContratStatus('error');
      setContratFeedback(err.message);
    }
  }

  async function handleDeciderRenouvellement(contratId) {
    setContratFeedback('');
    try {
      await marquerDecision(contratId, 'renouvele_renegociation');
      loadContrats(selectedId);
    } catch (err) {
      setContratFeedback(err.message);
    }
  }

  async function handleConfirmerNonRenouvellement() {
    if (!nonRenouvelMotif.trim() || confirmingNonRenouvellement) {
      if (!nonRenouvelMotif.trim()) setContratFeedback(traduire('Le motif est obligatoire.'));
      return;
    }
    setConfirmingNonRenouvellement(true);
    try {
      await marquerDecision(nonRenouvelModal, 'non_renouvele', { motif: nonRenouvelMotif });
      setNonRenouvelModal(null);
      setNonRenouvelMotif('');
      loadContrats(selectedId);
    } catch (err) {
      setContratFeedback(err.message);
    } finally {
      setConfirmingNonRenouvellement(false);
    }
  }

  async function handleAjouterAvenant(e, contratId) {
    e.preventDefault();
    const file = avenantFile[contratId];
    if (!file || avenantUploadingId) return;
    setAvenantUploadingId(contratId);
    try {
      await ajouterDocumentContrat(contratId, file, 'avenant');
      setAvenantFile((prev) => ({ ...prev, [contratId]: null }));
      toast.success(traduire('Avenant ajouté.'));
      loadContrats(selectedId);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAvenantUploadingId(null);
    }
  }

  async function handleTelecharger(doc) {
    try {
      await telechargerDocumentContrat(doc.id, doc.filename);
    } catch (err) {
      setContratFeedback(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{ label: traduire('Admin RH') }, { label: traduire('Contrats') }]} title={traduire('Contrats')} subtitle={traduire('Historique, renouvellement et documents contractuels')} />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <label htmlFor="contrats-personnel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Choisir un employé')}</label>
        <PersonnelSearchSelect
          id="contrats-personnel"
          items={personnelList}
          value={selectedId}
          onChange={setSelectedId}
          formatOption={(p) => `${p.matricule} — ${[p.prenom, p.nom].filter(Boolean).join(' ')} (${p.role})`}
          className="max-w-xl"
        />
      </div>

      {loading && (
        <div className="space-y-4">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      )}

      {contrats && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="font-semibold text-navy dark:text-gold mb-3">
            Contrats — {contrats.personnel.prenom} {contrats.personnel.nom}
          </h3>

          <form onSubmit={handleImportContrat} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
            <SelectMenu
              required value={contratForm.typeContrat}
              onChange={(e) => setContratForm((p) => ({ ...p, typeContrat: e.target.value }))}
              className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
            >
              {TYPES_CONTRAT.map((t) => <option key={t} value={t}>{t}</option>)}
            </SelectMenu>
            <ChampDate libelle={traduire('Début')}
              type="date" required value={contratForm.dateDebut}
              onChange={(e) => setContratForm((p) => ({ ...p, dateDebut: e.target.value }))}
              className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
              />
            <ChampDate libelle={traduire('Fin')}
              type="date" value={contratForm.dateFin}
              onChange={(e) => setContratForm((p) => ({ ...p, dateFin: e.target.value }))}
              className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
              />
            <input
              type="text" placeholder={traduire('Référence décision')} value={contratForm.referenceDecision}
              onChange={(e) => setContratForm((p) => ({ ...p, referenceDecision: e.target.value }))}
              className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
            />
            <input
              type="text" placeholder={traduire('Observations')} value={contratForm.observations}
              onChange={(e) => setContratForm((p) => ({ ...p, observations: e.target.value }))}
              className="sm:col-span-2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
            />
            <input
              type="file" required accept="application/pdf"
              onChange={(e) => setContratFile(e.target.files[0] || null)}
              className="sm:col-span-2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={contratStatus === 'loading'}
              className="bg-navy text-white rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {traduire('Importer un contrat (PDF)')}
            </button>
          </form>
          {contratFeedback && (
            <p className={`text-sm mb-4 ${contratStatus === 'success' ? 'text-status-approved' : 'text-status-rejected'}`}>
              {contratFeedback}
            </p>
          )}

          {!contrats.contrats?.length && <p className="text-sm text-gray-400">{traduire("Aucun contrat enregistré pour l\'instant.")}</p>}

          <div className="space-y-3">
            {contrats.contrats?.map((c) => (
              <div key={c.id} className="border border-gray-100 dark:border-gray-700 rounded-md p-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <p className="text-sm font-medium text-navy dark:text-gray-100">
                      {c.type_contrat}
                      {c.numero_renouvellement > 0 && ` — renouvellement n°${c.numero_renouvellement}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      du {new Date(c.date_debut).toLocaleDateString('fr-FR')}
                      {c.date_fin ? ` au ${new Date(c.date_fin).toLocaleDateString('fr-FR')}` : ' (sans date de fin)'}
                    </p>
                    {c.reference_decision && <p className="text-xs text-gray-400">{traduire('Réf.')} {c.reference_decision}</p>}
                    {c.observations && <p className="text-xs text-gray-400">{c.observations}</p>}
                    {c.decision === 'non_renouvele' && (
                      <p className="text-xs text-status-rejected mt-1">{traduire('Motif de non-renouvellement :')} {c.motif_non_renouvellement}</p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-navy/10 text-navy dark:bg-gold/10 dark:text-gold shrink-0">
                    {STATUT_CONTRAT_LABELS[c.statut] || c.statut}
                  </span>
                </div>

                {c.documents?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {c.documents.map((doc) => (
                      <button
                        key={doc.id} type="button" onClick={() => handleTelecharger(doc)}
                        className="text-xs text-navy dark:text-gold underline"
                      >
                        {doc.type_document === 'avenant' ? 'Avenant' : doc.type_document === 'autre' ? traduire('Document') : traduire('Contrat')} — {doc.filename}
                      </button>
                    ))}
                  </div>
                )}

                {c.statut === 'actif' && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
                    {!c.decision && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button" onClick={() => handleDeciderRenouvellement(c.id)}
                          className="text-xs px-3 py-1.5 rounded-md bg-status-approved text-white font-medium hover:opacity-90"
                        >
                          {traduire('Renouveler (renégociation)')}
                        </button>
                        <button
                          type="button" onClick={() => { setNonRenouvelModal(c.id); setNonRenouvelMotif(''); }}
                          className="text-xs px-3 py-1.5 rounded-md border border-status-rejected text-status-rejected font-medium hover:bg-red-50"
                        >
                          {traduire('Ne pas renouveler')}
                        </button>
                      </div>
                    )}

                    {c.decision === 'renouvele_renegociation' && (
                      <form onSubmit={(e) => handleFinaliserRenouvellement(e, c.id)} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <p className="sm:col-span-4 text-xs text-gray-400">
                          {traduire('Renégociation en cours — renseignez le nouveau contrat une fois signé.')}
                        </p>
                        <SelectMenu
                          required value={renouvelForm.typeContrat}
                          onChange={(e) => setRenouvelForm((p) => ({ ...p, typeContrat: e.target.value }))}
                          className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
                        >
                          {TYPES_CONTRAT.map((t) => <option key={t} value={t}>{t}</option>)}
                        </SelectMenu>
                        <ChampDate libelle={traduire('Début')}
                            type="date" required value={renouvelForm.dateDebut}
                            onChange={(e) => setRenouvelForm((p) => ({ ...p, dateDebut: e.target.value }))}
                            className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
                          />
                        <ChampDate libelle={traduire('Fin')}
                            type="date" value={renouvelForm.dateFin}
                            onChange={(e) => setRenouvelForm((p) => ({ ...p, dateFin: e.target.value }))}
                            className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
                          />
                        <input
                          type="file" required accept="application/pdf"
                          onChange={(e) => setRenouvelFile(e.target.files[0] || null)}
                          className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
                        />
                        <button
                          type="submit" disabled={contratStatus === 'loading'}
                          className="sm:col-span-4 text-xs px-3 py-1.5 rounded-md bg-navy text-white font-medium hover:opacity-90 disabled:opacity-50 w-fit"
                        >
                          {traduire('Finaliser le renouvellement')}
                        </button>
                      </form>
                    )}

                    <form onSubmit={(e) => handleAjouterAvenant(e, c.id)} className="flex items-center gap-2">
                      <input
                        type="file" accept="application/pdf"
                        onChange={(e) => setAvenantFile((prev) => ({ ...prev, [c.id]: e.target.files[0] || null }))}
                        className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
                      />
                      <button type="submit" className="text-xs px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                        {traduire('Ajouter un avenant')}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))}
          </div>

          {nonRenouvelModal && (
            <Modal onClose={() => setNonRenouvelModal(null)} title={traduire('Non-renouvellement du contrat')} maxWidth="max-w-md">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire('Motif (obligatoire)')}</label>
                <textarea
                  rows={3} value={nonRenouvelMotif}
                  onChange={(e) => setNonRenouvelMotif(e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button" onClick={() => setNonRenouvelModal(null)}
                    disabled={confirmingNonRenouvellement}
                    className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300 disabled:opacity-50"
                  >
                    {traduire('Annuler')}
                  </button>
                  <button
                    type="button" onClick={handleConfirmerNonRenouvellement}
                    disabled={!nonRenouvelMotif.trim() || confirmingNonRenouvellement}
                    className="px-4 py-2 rounded-md bg-status-rejected text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {confirmingNonRenouvellement ? 'Confirmation...' : traduire('Confirmer le non-renouvellement')}
                  </button>
                </div>
            </Modal>
          )}
        </div>
      )}
    </div>
  );
}
