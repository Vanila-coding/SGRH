import { useEffect, useState } from 'react';
import { listPersonnel } from '../../services/personnelApi';
import { getSuiviConges, saisirOuvertureConges } from '../../services/congeApi';
import { generateDocument } from '../../services/documentApi';
import PersonnelSearchSelect from '../../components/PersonnelSearchSelect';
import { traduire } from '../../i18n';
import DateInput from '../../components/ui/DateInput';

const nouvelleLigne = () => ({ annee: '', libellePeriode: '', droit: '', reference: '', conges: [] });
const nouveauConge = () => ({ dateDebut: '', dateFin: '', jours: '', lieuJouissance: '' });
const nombre = (n) => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 1 });
const champ = 'border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-2 py-1.5 text-sm';

// Saisie des soldes d'ouverture par année à partir des états de congé officiels
// (congés d'avant le SGRH). Le backend valide et calcule ; cet écran ne fait que transmettre.
export default function OuvertureSoldes() {
  const [personnelList, setPersonnelList] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [suivi, setSuivi] = useState(null);
  const [lignes, setLignes] = useState([nouvelleLigne()]);
  const [remplacer, setRemplacer] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [decisionEnCours, setDecisionEnCours] = useState(null);

  useEffect(() => { listPersonnel().then(setPersonnelList).catch(() => {}); }, []);

  async function charger(id) {
    setSuivi(null);
    if (!id) return;
    try {
      setSuivi(await getSuiviConges(id));
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    }
  }

  function choisir(id) {
    setSelectedId(id);
    setFeedback(null);
    setRemplacer(false);
    setLignes([nouvelleLigne()]);
    charger(id);
  }

  // Décision d'octroi établie a posteriori pour un congé déjà pris (d'avant le SGRH).
  async function genererDecision(h) {
    if (decisionEnCours) return;
    setDecisionEnCours(h.id);
    setFeedback(null);
    try {
      const document = await generateDocument(selectedId, 'decision_conge', { historiqueId: h.id });
      window.open(`/documents/${document.id}`, '_blank');
      await charger(selectedId);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setDecisionEnCours(null);
    }
  }

  const majLigne = (i, patch) => setLignes((prev) => prev.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const majConge = (i, j, patch) => majLigne(i, { conges: lignes[i].conges.map((c, k) => (k === j ? { ...c, ...patch } : c)) });

  async function enregistrer(e) {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setFeedback(null);
    try {
      await saisirOuvertureConges(selectedId, { lignes, remplacerSoldeOuverture: remplacer });
      setFeedback({ type: 'success', text: traduire("Soldes d'ouverture enregistrés.") });
      setLignes([nouvelleLigne()]);
      setRemplacer(false);
      await charger(selectedId);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-5 mt-8">
      <h3 className="font-semibold text-navy dark:text-gold">{traduire('Soldes d\'ouverture (états de congé)')}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 mb-4">
        {traduire('Saisissez, année par année, les droits et les congés déjà pris d\'après l\'état de congé officiel. Les années déjà enregistrées ne peuvent pas être remplacées.')}
      </p>

      <PersonnelSearchSelect
        id="ouverture-soldes-personnel"
        items={personnelList}
        value={selectedId}
        onChange={choisir}
        formatOption={(p) => `${p.matricule} — ${[p.prenom, p.nom].filter(Boolean).join(' ')}`}
        className="max-w-md"
      />

      {suivi && (
        <div className="mt-4 text-sm">
          <p className="text-navy dark:text-gray-100">{traduire('Solde enregistré :')}<strong>{nombre(suivi.soldeEnregistre)} {'jour(s)'}</strong></p>
          {suivi.soldeOuvertureNonVentile !== 0 && (
            <p className="text-xs text-status-pending mt-1">{traduire('Dont')} {nombre(suivi.soldeOuvertureNonVentile)} {traduire("jour(s) de solde d'ouverture non ventilé par année.")}</p>
          )}
          {suivi.historiques?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-gray-400 dark:text-gray-500">{traduire('Congés pris avant le SGRH')}</p>
              <ul className="divide-y divide-gray-100 dark:divide-gray-700 max-w-xl">
                {suivi.historiques.map((h) => (
                  <li key={h.id} className="py-1.5 flex items-center justify-between gap-3 text-xs">
                    <span>{h.annee} {traduire('— du')} {h.date_debut.split('-').reverse().join('/')} {'au'} {h.date_fin.split('-').reverse().join('/')} ({nombre(h.jours)} j){h.lieu_jouissance ? ` — ${h.lieu_jouissance}` : ''}</span>
                    {h.decisionEtablie ? (
                      <span className="text-status-approved">{traduire('Décision établie')}</span>
                    ) : (
                      <button type="button" onClick={() => genererDecision(h)} disabled={decisionEnCours !== null} className="px-2.5 py-1 rounded-md bg-navy text-white font-medium disabled:opacity-50">
                        {decisionEnCours === h.id ? 'Génération…' : traduire('Générer la décision')}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {suivi.lignes.length > 0 && (
            <div className="overflow-x-auto mt-2">
              <table className="text-xs w-full max-w-xl">
                <thead><tr className="text-left text-gray-400 dark:text-gray-500"><th>{traduire('Année')}</th><th>{traduire('Droit')}</th><th>{traduire('Pris')}</th><th>{traduire('Restant')}</th></tr></thead>
                <tbody>
                  {suivi.lignes.map((l) => (
                    <tr key={l.annee}><td>{l.libelle_periode || l.annee}</td><td>{nombre(l.droit)}</td><td>{nombre(l.pris)}</td><td>{nombre(l.restant)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedId && (
        <form onSubmit={enregistrer} className="mt-5 space-y-4">
          {lignes.map((l, i) => (
            <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-md p-3 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <input className={champ} type="number" placeholder={traduire('Année')} aria-label={traduire('Année')} required value={l.annee} onChange={(e) => majLigne(i, { annee: e.target.value })} />
                <input className={champ} type="text" placeholder={traduire('Période (ex. 2016-2017)')} aria-label={traduire('Période')} maxLength={20} value={l.libellePeriode} onChange={(e) => majLigne(i, { libellePeriode: e.target.value })} />
                <input className={champ} type="number" step="0.5" min="0" placeholder={traduire('Droit (jours)')} aria-label={traduire('Droit')} required value={l.droit} onChange={(e) => majLigne(i, { droit: e.target.value })} />
                <input className={champ} type="text" placeholder={traduire('Référence (état de congé)')} aria-label={traduire('Référence')} value={l.reference} onChange={(e) => majLigne(i, { reference: e.target.value })} />
              </div>
              {l.conges.map((c, j) => (
                <div key={j} className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
                  <DateInput className={champ}  aria-label={traduire('Début du congé pris')} required value={c.dateDebut} onChange={(e) => majConge(i, j, { dateDebut: e.target.value })} />
                  <DateInput className={champ}  aria-label={traduire('Fin du congé pris')} required value={c.dateFin} onChange={(e) => majConge(i, j, { dateFin: e.target.value })} />
                  <input className={champ} type="number" step="0.5" min="0.5" placeholder={traduire('Jours (auto)')} aria-label={traduire('Jours pris')} value={c.jours} onChange={(e) => majConge(i, j, { jours: e.target.value })} />
                  <input className={champ} type="text" maxLength={150} placeholder={traduire('Lieu de jouissance')} aria-label={traduire('Lieu de jouissance')} value={c.lieuJouissance} onChange={(e) => majConge(i, j, { lieuJouissance: e.target.value })} />
                  <button type="button" className="text-xs text-gray-400 dark:text-gray-500 hover:text-status-rejected text-left" onClick={() => majLigne(i, { conges: l.conges.filter((_, k) => k !== j) })}>{traduire('Retirer ce congé')}</button>
                </div>
              ))}
              <div className="flex gap-4 text-xs">
                <button type="button" className="text-navy dark:text-gold underline" onClick={() => majLigne(i, { conges: [...l.conges, nouveauConge()] })}>{traduire('+ Congé pris')}</button>
                {lignes.length > 1 && <button type="button" className="text-gray-400 dark:text-gray-500 hover:text-status-rejected" onClick={() => setLignes((prev) => prev.filter((_, k) => k !== i))}>{traduire("Supprimer l'année")}</button>}
              </div>
            </div>
          ))}
          <button type="button" className="text-xs text-navy dark:text-gold underline" onClick={() => setLignes((prev) => [...prev, nouvelleLigne()])}>{traduire('+ Ajouter une année')}</button>

          {suivi && suivi.soldeOuvertureNonVentile !== 0 && (
            <label className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300">
              <input type="checkbox" checked={remplacer} onChange={(e) => setRemplacer(e.target.checked)} className="mt-0.5" />
              Je confirme le remplacement du solde d'ouverture non ventilé ({nombre(suivi.soldeOuvertureNonVentile)} jour(s)) par le détail saisi ci-dessus.
            </label>
          )}

          <button type="submit" disabled={saving} className="bg-navy text-white rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {saving ? 'Enregistrement…' : traduire("Enregistrer les soldes d'ouverture")}
          </button>
        </form>
      )}

      {feedback && (
        <p role={feedback.type === 'error' ? 'alert' : 'status'} className={`mt-3 text-sm ${feedback.type === 'error' ? 'text-status-rejected' : 'text-status-approved'}`}>{feedback.text}</p>
      )}
    </div>
  );
}
