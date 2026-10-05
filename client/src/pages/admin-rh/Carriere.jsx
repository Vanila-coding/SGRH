import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { usePermissions } from '../../context/PermissionContext';
import { listPersonnel } from '../../services/personnelApi';
import {
  getCarriere, addEvenement, updateEvenement, deleteEvenement, addDiplome, deleteDiplome,
  telechargerJustificatifEvenement, telechargerDocumentDiplome,
} from '../../services/carriereApi';
import {
  fetchTypesSituation, getSituationsForPersonnel, addSituation,
  updateSituation, deleteSituation,
} from '../../services/situationAdministrativeApi';
import {
  fetchAlertesAvancement, traiterAlerteAvancement, ignorerAlerteAvancement, formatIndiceDisplay,
} from '../../services/grilleIndiciaireApi';
import GrilleIndiciaireSelector from '../../components/GrilleIndiciaireSelector';
import PersonnelSearchSelect from '../../components/PersonnelSearchSelect';
import { SkeletonPage } from '../../components/ui';
import SelectMenu from '../../components/ui/SelectMenu';
import ViewToggle from '../../components/ui/ViewToggle';
import useVueListe from '../../hooks/useVueListe';
import { traduire } from '../../i18n';
import DateInput from '../../components/ui/DateInput';

const TYPES_EVENEMENT = [
  'Recrutement', 'Stage', 'Titularisation', 'Prolongation de stage', "Avancement d'échelon",
  'Avancement de grade', 'Reclassement', 'Changement de fonction', "Changement d'affectation",
  'Changement de service', 'Mise à disposition', 'Détachement', 'Disponibilité',
  'Formation ou diplôme', 'Changement de qualification', 'Avenant au contrat', 'Renouvellement de contrat',
  'Suspension ou événement disciplinaire', 'Retraite', 'Fin de contrat', 'Cessation définitive de fonctions',
  'Réintégration', 'Autre',
];

const emptyForm = {
  typeEvenement: TYPES_EVENEMENT[0], dateEvenement: '', dateEffet: '', description: '',
  corps: '', grade: '', classe: '', echelon: '', indice: '', categorie: '', cadre: '', echelle: '',
  fonction: '', affectation: '',
  motif: '', referenceDecision: '', autoriteDecision: '', observations: '',
};

export default function Carriere() {
  const [vue, setVue] = useVueListe('carriere-situations');
  const { can } = usePermissions();
  const [personnelList, setPersonnelList] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [grilleResolved, setGrilleResolved] = useState(false);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const [diplomeForm, setDiplomeForm] = useState({ intitule: '', etablissement: '', anneeObtention: '' });
  const [diplomeFile, setDiplomeFile] = useState(null);
  const [diplomeStatus, setDiplomeStatus] = useState(null);

  const [typesSituation, setTypesSituation] = useState([]);
  const [situations, setSituations] = useState(null);
  const [situationForm, setSituationForm] = useState({ typeSituationId: '', dateDebut: '', referenceDecision: '', observations: '', motif: '' });
  const [situationFile, setSituationFile] = useState(null);
  const [situationStatus, setSituationStatus] = useState(null);
  const [editingSituationId, setEditingSituationId] = useState(null);
  const [situationEditForm, setSituationEditForm] = useState({ referenceDecision: '', observations: '', motif: '' });
  const [situationEditSaving, setSituationEditSaving] = useState(false);
  const [confirmDeleteSituationId, setConfirmDeleteSituationId] = useState(null);

  const [alertes, setAlertes] = useState([]);
  const [traiterAlerteId, setTraiterAlerteId] = useState(null);
  const [traiterForm, setTraiterForm] = useState({ categorie: '', dateEffet: '', referenceDecision: '', autoriteDecision: '' });
  const [traiterStatus, setTraiterStatus] = useState(null);

  useEffect(() => {
    listPersonnel().then(setPersonnelList).catch(() => {});
    fetchTypesSituation().then(setTypesSituation).catch(() => setTypesSituation([]));
  }, []);

  async function loadCarriere(id) {
    if (!id) { setData(null); return; }
    setLoading(true);
    try {
      setData(await getCarriere(id));
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadSituations(id) {
    if (!id) { setSituations(null); return; }
    try {
      setSituations(await getSituationsForPersonnel(id));
    } catch (err) {
      setFeedback(err.message);
    }
  }

  async function loadAlertes(id) {
    if (!id) { setAlertes([]); return; }
    try {
      setAlertes(await fetchAlertesAvancement(id));
    } catch {
      setAlertes([]);
    }
  }

  useEffect(() => {
    if (!selectedId) return;
    getCarriere(selectedId).then(setData).catch((err) => setFeedback(err.message)).finally(() => setLoading(false));
    getSituationsForPersonnel(selectedId).then(setSituations).catch((err) => setFeedback(err.message));
    fetchAlertesAvancement(selectedId).then(setAlertes).catch(() => setAlertes([]));
  }, [selectedId]);

  function ouvrirTraitementAlerte(alerte) {
    setTraiterAlerteId(alerte.id);
    setTraiterForm({ categorie: '', dateEffet: new Date().toISOString().slice(0, 10), referenceDecision: '', autoriteDecision: '' });
    setTraiterStatus(null);
  }

  async function handleTraiterAlerte(e) {
    e.preventDefault();
    setTraiterStatus('loading');
    try {
      await traiterAlerteAvancement(traiterAlerteId, traiterForm);
      setTraiterStatus('success');
      setTraiterAlerteId(null);
      loadAlertes(selectedId);
      loadCarriere(selectedId);
    } catch (err) {
      setTraiterStatus('error');
      setFeedback(err.message);
    }
  }

  async function handleIgnorerAlerte(id) {
    try {
      await ignorerAlerteAvancement(id);
      loadAlertes(selectedId);
    } catch (err) {
      setFeedback(err.message);
    }
  }

  function updateForm(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setGrilleResolved(false);
    setFile(null);
    setEditingId(null);
  }

  function startEdit(item) {
    if (item.source !== 'evenement') return;
    setEditingId(item.id);
    setForm({
      typeEvenement: item.type, dateEvenement: item.date?.slice(0, 10) || '',
      dateEffet: item.dateEffet?.slice(0, 10) || '', description: item.description || '',
      corps: item.corps || '', grade: item.grade || '', classe: item.classe || '', echelon: item.echelon || '',
      indice: item.indice || '', categorie: '', cadre: '', echelle: '',
      fonction: item.fonction || '', affectation: item.affectation || '',
      motif: item.motif || '', referenceDecision: item.referenceDecision || '', autoriteDecision: item.autoriteDecision || '',
      observations: item.observations || '',
    });
    // On repart d'une saisie libre en édition : l'événement existant garde sa
    // traçabilité de grille (ligne_grille_id) tant qu'on ne rechoisit pas classe/échelon.
    setGrilleResolved(false);
    setFile(null);
  }

  const regimeFonctionnaire = data?.personnel?.corps === 'Fonctionnaire';

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('loading');
    setFeedback('');
    try {
      const payload = { ...form };
      if (regimeFonctionnaire && grilleResolved && payload.classe && payload.echelon) {
        payload.resolveFromGrille = JSON.stringify({
          regime: 'FONCTIONNAIRE', classe: payload.classe, echelon: Number(payload.echelon),
          categorie: payload.categorie || undefined, cadre: payload.cadre || undefined, echelle: payload.echelle || undefined,
        });
      }
      delete payload.categorie; delete payload.cadre; delete payload.echelle;

      if (editingId) {
        await updateEvenement(editingId, payload, file);
        setFeedback(traduire('Événement modifié.'));
      } else {
        await addEvenement(selectedId, payload, file);
        setFeedback(traduire('Événement ajouté.'));
      }
      setStatus('success');
      resetForm();
      loadCarriere(selectedId);
    } catch (err) {
      setStatus('error');
      setFeedback(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteEvenement(id);
      setConfirmDeleteId(null);
      loadCarriere(selectedId);
    } catch (err) {
      setFeedback(err.message);
    }
  }

  async function handleAddDiplome(e) {
    e.preventDefault();
    setDiplomeStatus('loading');
    try {
      await addDiplome(selectedId, diplomeForm, diplomeFile);
      setDiplomeStatus('success');
      setDiplomeForm({ intitule: '', etablissement: '', anneeObtention: '' });
      setDiplomeFile(null);
      loadCarriere(selectedId);
    } catch (err) {
      setDiplomeStatus('error');
      setFeedback(err.message);
    }
  }

  async function handleDeleteDiplome(id) {
    try {
      await deleteDiplome(id);
      loadCarriere(selectedId);
    } catch (err) {
      setFeedback(err.message);
    }
  }

  async function handleAddSituation(e) {
    e.preventDefault();
    setSituationStatus('loading');
    try {
      await addSituation(selectedId, situationForm, situationFile);
      setSituationStatus('success');
      setSituationForm({ typeSituationId: '', dateDebut: '', referenceDecision: '', observations: '', motif: '' });
      setSituationFile(null);
      loadSituations(selectedId);
    } catch (err) {
      setSituationStatus('error');
      setFeedback(err.message);
    }
  }

  function startEditSituation(s) {
    setEditingSituationId(s.id);
    setSituationEditForm({
      referenceDecision: s.reference_decision || '', observations: s.observations || '', motif: s.motif || '',
    });
  }

  async function handleUpdateSituation(e) {
    e.preventDefault();
    if (situationEditSaving) return;
    setSituationEditSaving(true);
    try {
      await updateSituation(editingSituationId, situationEditForm);
      setEditingSituationId(null);
      loadSituations(selectedId);
    } catch (err) {
      setFeedback(err.message);
    } finally {
      setSituationEditSaving(false);
    }
  }

  async function handleDeleteSituation(id) {
    try {
      await deleteSituation(id);
      setConfirmDeleteSituationId(null);
      loadSituations(selectedId);
    } catch (err) {
      setFeedback(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{ label: traduire('Admin RH') }, { label: traduire('Carrière') }]} title={traduire('Carrière')} subtitle={traduire('Situation administrative, événements de carrière et diplômes')} />
      <div className="flex justify-end mb-3">
        <ViewToggle value={vue} onChange={setVue} />
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <label htmlFor="carriere-personnel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Choisir un employé')}</label>
        <PersonnelSearchSelect
          id="carriere-personnel"
          items={personnelList}
          value={selectedId}
          onChange={(id) => { setSelectedId(id); resetForm(); if (!id) { setData(null); setSituations(null); setAlertes([]); } }}
          formatOption={(p) => `${p.matricule} — ${[p.prenom, p.nom].filter(Boolean).join(' ')} (${p.role})`}
          className="max-w-xl"
        />
      </div>

      {loading && <SkeletonPage cards={3} />}

      {data && (() => {
        const estPE = data.personnel.roles?.length > 0 ? data.personnel.roles.includes('PE') : data.personnel.role === 'PE';
        return (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-semibold text-navy dark:text-gold mb-3">{traduire('Situation administrative')}</h3>

            {situations?.actuelle && (
              <div className="mb-4 p-3 bg-navy/5 rounded-md">
                <p className="text-sm text-navy dark:text-gray-100 font-medium">
                  Situation actuelle : {situations.actuelle.libelle}
                </p>
                <p className="text-xs text-gray-400">
                  Depuis le {new Date(situations.actuelle.date_debut).toLocaleDateString('fr-FR')}
                </p>
              </div>
            )}
            {!situations?.actuelle && situations && (
              <p className="text-sm text-gray-400 mb-4">{traduire("Aucune situation administrative enregistrée pour l'instant.")}</p>
            )}

            <form onSubmit={handleAddSituation} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
              <SelectMenu
                required value={situationForm.typeSituationId}
                onChange={(e) => setSituationForm((p) => ({ ...p, typeSituationId: e.target.value }))}
                className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm sm:col-span-2"
              >
                <option value="">{traduire('-- Nouvelle situation --')}</option>
                {typesSituation.map((t) => (
                  <option key={t.id} value={t.id}>{t.libelle}{t.categories_concernees ? ` (${t.categories_concernees})` : ''}</option>
                ))}
              </SelectMenu>
              <DateInput
                 required value={situationForm.dateDebut}
                onChange={(e) => setSituationForm((p) => ({ ...p, dateDebut: e.target.value }))}
                className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
              />
              <input
                type="text" placeholder={traduire('Référence décision')} value={situationForm.referenceDecision}
                onChange={(e) => setSituationForm((p) => ({ ...p, referenceDecision: e.target.value }))}
                className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
              />
              <input
                type="text" placeholder={traduire('Observations')} value={situationForm.observations}
                onChange={(e) => setSituationForm((p) => ({ ...p, observations: e.target.value }))}
                className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
              />
              <input
                type="text" placeholder={traduire('Motif du changement')} value={situationForm.motif}
                onChange={(e) => setSituationForm((p) => ({ ...p, motif: e.target.value }))}
                className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
              />
              <input
                type="file" accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setSituationFile(e.target.files[0] || null)}
                className="sm:col-span-2 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={situationStatus === 'loading'}
                className="bg-navy text-white rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {traduire('Enregistrer')}
              </button>
            </form>

            {situations?.historique?.length > 0 && (
              <div className={vue === 'liste' ? 'space-y-2' : 'grid grid-cols-1 lg:grid-cols-2 gap-2'}>
                <p className="text-xs text-gray-400 font-medium">{traduire('Historique des situations')}</p>
                {situations.historique.map((s) => (
                  <div key={s.id} className="border-b border-gray-100 dark:border-gray-700 pb-2">
                    {editingSituationId === s.id ? (
                      <form onSubmit={handleUpdateSituation} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text" placeholder={traduire('Référence décision')} value={situationEditForm.referenceDecision}
                          onChange={(e) => setSituationEditForm((p) => ({ ...p, referenceDecision: e.target.value }))}
                          className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
                        />
                        <input
                          type="text" placeholder={traduire('Observations')} value={situationEditForm.observations}
                          onChange={(e) => setSituationEditForm((p) => ({ ...p, observations: e.target.value }))}
                          className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
                        />
                        <input
                          type="text" placeholder={traduire('Motif')} value={situationEditForm.motif}
                          onChange={(e) => setSituationEditForm((p) => ({ ...p, motif: e.target.value }))}
                          className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
                        />
                        <div className="sm:col-span-3 flex gap-2">
                          <button type="submit" disabled={situationEditSaving} className="text-xs px-3 py-1 rounded-md bg-navy text-white font-medium disabled:opacity-50">
                            {situationEditSaving ? 'Enregistrement...' : traduire('Enregistrer')}
                          </button>
                          <button type="button" onClick={() => setEditingSituationId(null)} disabled={situationEditSaving} className="text-xs px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-50">{traduire('Annuler')}</button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs text-gray-500">
                          <p>
                            {s.libelle} — du {new Date(s.date_debut).toLocaleDateString('fr-FR')}
                            {s.date_fin ? ` au ${new Date(s.date_fin).toLocaleDateString('fr-FR')}` : ' (en cours)'}
                            {s.reference_decision && ` — réf. ${s.reference_decision}`}
                          </p>
                          {s.motif && <p className="text-gray-400">{traduire('Motif :')} {s.motif}</p>}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => startEditSituation(s)} className="text-xs text-navy dark:text-gold underline">{traduire('Modifier')}</button>
                          {!s.date_fin && (
                            confirmDeleteSituationId === s.id ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleDeleteSituation(s.id)} className="text-xs text-status-rejected font-medium">{traduire('Confirmer')}</button>
                                <button onClick={() => setConfirmDeleteSituationId(null)} className="text-xs text-gray-400">{traduire('Annuler')}</button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirmDeleteSituationId(s.id)} className="text-xs text-gray-400 hover:text-status-rejected">{traduire('Supprimer')}</button>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {alertes.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border-l-4 border-amber-400">
              <h3 className="font-semibold text-navy dark:text-gold mb-3">{traduire('Alertes avancement')}</h3>
              <div className="space-y-3">
                {alertes.map((a) => (
                  <div key={a.id} className="border border-amber-200 dark:border-amber-800 rounded-md p-3">
                    <p className="text-sm text-navy dark:text-gray-100">
                      Échéance théorique d'avancement d'échelon atteinte le {new Date(a.date_echeance_theorique).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-xs text-gray-400">
                      Situation actuelle : {a.details?.classeActuelle} — échelon {a.details?.echelonActuel}
                      {a.details?.sourceDate?.includes('à confirmer') && ' (date d\'entrée en échelon estimée — à confirmer)'}
                    </p>
                    {traiterAlerteId === a.id ? (
                      <form onSubmit={handleTraiterAlerte} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                        <SelectMenu
                          required value={traiterForm.categorie}
                          onChange={(e) => setTraiterForm((p) => ({ ...p, categorie: e.target.value }))}
                          className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
                        >
                          <option value="">{traduire('-- Catégorie --')}</option>
                          {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].map((c) => <option key={c} value={c}>{c}</option>)}
                        </SelectMenu>
                        <DateInput
                           required value={traiterForm.dateEffet}
                          onChange={(e) => setTraiterForm((p) => ({ ...p, dateEffet: e.target.value }))}
                          className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
                        />
                        <input
                          type="text" placeholder={traduire('Réf. décision')} value={traiterForm.referenceDecision}
                          onChange={(e) => setTraiterForm((p) => ({ ...p, referenceDecision: e.target.value }))}
                          className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
                        />
                        <input
                          type="text" placeholder={traduire('Autorité')} value={traiterForm.autoriteDecision}
                          onChange={(e) => setTraiterForm((p) => ({ ...p, autoriteDecision: e.target.value }))}
                          className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-2 py-1.5 text-xs"
                        />
                        <div className="col-span-2 sm:col-span-4 flex gap-2">
                          <button type="submit" disabled={traiterStatus === 'loading'} className="text-xs px-3 py-1 rounded-md bg-navy text-white font-medium disabled:opacity-50">{traduire("Valider l'avancement")}</button>
                          <button type="button" onClick={() => setTraiterAlerteId(null)} className="text-xs px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300">{traduire('Annuler')}</button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex gap-3 mt-2">
                        <button onClick={() => ouvrirTraitementAlerte(a)} className="text-xs text-navy dark:text-gold underline">{traduire('Traiter')}</button>
                        <button onClick={() => handleIgnorerAlerte(a.id)} className="text-xs text-gray-400 hover:text-status-rejected">{traduire('Ignorer')}</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-semibold text-navy dark:text-gold mb-3">
              {editingId ? "Modifier l'événement" : traduire('Ajouter un événement')}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SelectMenu
                value={form.typeEvenement}
                onChange={(e) => updateForm('typeEvenement', e.target.value)}
                className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy sm:col-span-3"
              >
                {TYPES_EVENEMENT.map((t) => <option key={t} value={t}>{t}</option>)}
              </SelectMenu>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire("Date de l'événement *")}</label>
                <DateInput
                   required value={form.dateEvenement}
                  onChange={(e) => updateForm('dateEvenement', e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire("Date d'effet")}</label>
                <DateInput
                   value={form.dateEffet}
                  onChange={(e) => updateForm('dateEffet', e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire('Référence de la décision')}</label>
                <input
                  type="text" value={form.referenceDecision}
                  onChange={(e) => updateForm('referenceDecision', e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire('Corps')}</label>
                <input
                  type="text" value={form.corps}
                  onChange={(e) => updateForm('corps', e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire('Grade')}</label>
                <input
                  type="text" value={form.grade}
                  onChange={(e) => updateForm('grade', e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              {regimeFonctionnaire ? (
                <div className="sm:col-span-3">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire('Situation réglementaire (grille indiciaire)')}</label>
                  <GrilleIndiciaireSelector
                    regime="FONCTIONNAIRE"
                    dateEffet={form.dateEffet || form.dateEvenement || undefined}
                    value={{ classe: form.classe, echelon: form.echelon, categorie: form.categorie, cadre: form.cadre, echelle: form.echelle, indice: form.indice }}
                    onChange={(next, resolution) => {
                      setForm((prev) => ({ ...prev, ...next }));
                      setGrilleResolved(!!resolution);
                    }}
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire('Classe')}</label>
                    <input
                      type="text" value={form.classe}
                      onChange={(e) => updateForm('classe', e.target.value)}
                      className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire('Échelon')}</label>
                    <input
                      type="text" value={form.echelon}
                      onChange={(e) => updateForm('echelon', e.target.value)}
                      className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire('Indice')}</label>
                    <input
                      type="text" value={form.indice}
                      onChange={(e) => updateForm('indice', e.target.value)}
                      className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire('Fonction')}</label>
                <input
                  type="text" value={form.fonction}
                  onChange={(e) => updateForm('fonction', e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire('Affectation')}</label>
                <input
                  type="text" value={form.affectation}
                  onChange={(e) => updateForm('affectation', e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire('Autorité ayant pris la décision')}</label>
                <input
                  type="text" value={form.autoriteDecision}
                  onChange={(e) => updateForm('autoriteDecision', e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire('Motif')}</label>
                <textarea
                  rows={2} value={form.motif}
                  onChange={(e) => updateForm('motif', e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire('Description / observations')}</label>
                <textarea
                  rows={2} value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{traduire('Document justificatif (PDF, JPG, PNG)')}</label>
                <input
                  type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                  className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
                />
              </div>

              <div className="sm:col-span-3 flex gap-2">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="bg-navy text-white rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {editingId ? 'Enregistrer les modifications' : traduire('Ajouter')}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-300"
                  >
                    {traduire('Annuler la modification')}
                  </button>
                )}
              </div>
            </form>
            {feedback && (
              <p className={`text-sm mt-2 ${status === 'success' ? 'text-status-approved' : 'text-status-rejected'}`}>
                {feedback}
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="font-semibold text-navy dark:text-gold mb-4">
              Timeline — {data.personnel.prenom} {data.personnel.nom}
              <span className="ml-2 text-xs font-normal text-gray-400">
                ({estPE ? 'Enseignant-chercheur' : traduire('PATS')} — {data.personnel.corps || traduire('statut non renseigné')})
              </span>
            </h3>
            {data.timeline.length === 0 && <p className="text-sm text-gray-400">{traduire('Aucun événement enregistré.')}</p>}
            <div className="relative border-l-2 border-gray-200 dark:border-gray-700 pl-4 space-y-4">
              {data.timeline.map((item, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-navy dark:bg-gold" />
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-400">
                        {new Date(item.date).toLocaleDateString('fr-FR')}
                        {item.dateEffet && ` — effet au ${new Date(item.dateEffet).toLocaleDateString('fr-FR')}`}
                      </p>
                      <p className="text-sm font-medium text-navy dark:text-gray-100">{item.type}</p>
                      {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                      {(item.corps || item.grade || item.classe || item.echelon || item.indice) && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {[item.corps, item.grade, item.classe && `classe ${item.classe}`, item.echelon && `échelon ${item.echelon}`,
                            item.indice && `indice ${formatIndiceDisplay(item.indiceNum ?? item.indice, item.codeGrille)}`].filter(Boolean).join(' · ')}
                          {item.indiceSource === 'REGLEMENTAIRE' && (
                            <span className="ml-1 inline-block px-1.5 py-0.5 rounded bg-status-approved/10 text-status-approved text-[10px] font-medium align-middle">{traduire('réglementaire')}</span>
                          )}
                          {item.indiceSource === 'A_CONFIRMER' && item.indice && (
                            <span className="ml-1 inline-block px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-medium align-middle">{traduire('à confirmer')}</span>
                          )}
                        </p>
                      )}
                      {item.indiceSourceTexte && (
                        <p className="text-[11px] text-gray-400" title={item.indiceSourceArticle || ''}>{traduire('Source :')} {item.indiceSourceTexte}</p>
                      )}
                      {item.referenceDecision && <p className="text-xs text-gray-400">{traduire('Réf. décision :')} {item.referenceDecision}</p>}
                      {item.autoriteDecision && <p className="text-xs text-gray-400">{traduire('Autorité :')} {item.autoriteDecision}</p>}
                      {item.justificatifPath && (
                        <button
                          type="button"
                          onClick={() => telechargerJustificatifEvenement(item.id, item.justificatifFilename)}
                          className="text-xs text-navy underline"
                        >
                          {traduire('Voir le justificatif')}
                        </button>
                      )}
                    </div>
                    {item.source === 'evenement' && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => startEdit(item)} className="text-xs text-navy underline">{traduire('Modifier')}</button>
                        {can('delete_carriere_evenement') && (
                          confirmDeleteId === item.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleDelete(item.id)} className="text-xs text-status-rejected font-medium">{traduire('Confirmer')}</button>
                              <button onClick={() => setConfirmDeleteId(null)} className="text-xs text-gray-400">{traduire('Annuler')}</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteId(item.id)} className="text-xs text-gray-400 hover:text-status-rejected">{traduire('Supprimer')}</button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {estPE && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-semibold text-navy dark:text-gold mb-3">{traduire('Diplômes et qualifications')}</h3>
              <form onSubmit={handleAddDiplome} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
                <input
                  type="text" required placeholder={traduire('Intitulé')} value={diplomeForm.intitule}
                  onChange={(e) => setDiplomeForm((p) => ({ ...p, intitule: e.target.value }))}
                  className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm sm:col-span-2"
                />
                <input
                  type="text" placeholder={traduire('Établissement')} value={diplomeForm.etablissement}
                  onChange={(e) => setDiplomeForm((p) => ({ ...p, etablissement: e.target.value }))}
                  className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
                />
                <input
                  type="number" placeholder={traduire('Année')} value={diplomeForm.anneeObtention}
                  onChange={(e) => setDiplomeForm((p) => ({ ...p, anneeObtention: e.target.value }))}
                  className="border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
                />
                <input
                  type="file" accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setDiplomeFile(e.target.files[0] || null)}
                  className="sm:col-span-3 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={diplomeStatus === 'loading'}
                  className="bg-navy text-white rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {traduire('Ajouter')}
                </button>
              </form>
              {data.diplomes.length === 0 && <p className="text-sm text-gray-400">{traduire('Aucun diplôme enregistré.')}</p>}
              <div className={vue === 'liste' ? 'space-y-2' : 'grid grid-cols-1 lg:grid-cols-2 gap-2'}>
                {data.diplomes.map((d) => (
                  <div key={d.id} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-2">
                    <div>
                      <p className="text-sm font-medium text-navy dark:text-gray-100">{d.intitule}</p>
                      <p className="text-xs text-gray-400">
                        {[d.etablissement, d.annee_obtention].filter(Boolean).join(' — ')}
                      </p>
                      {d.document_path && (
                        <button
                          type="button"
                          onClick={() => telechargerDocumentDiplome(d.id, d.document_filename)}
                          className="text-xs text-navy underline"
                        >
                          {traduire('Voir le document')}
                        </button>
                      )}
                    </div>
                    <button onClick={() => handleDeleteDiplome(d.id)} className="text-xs text-gray-400 hover:text-status-rejected">{traduire('Supprimer')}</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
        );
      })()}
    </div>
  );
}