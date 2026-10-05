import { useState, useEffect } from 'react';
import { createPersonnel } from '../services/personnelApi';
import { fetchDirections, fetchServices } from '../services/organisationApi';
import { fetchCategories } from '../services/categorieApi';
import { fetchEtablissements } from '../services/etablissementApi';
import Modal from './ui/Modal';
import SelectMenu from './ui/SelectMenu';
import { traduire } from '../i18n';
import DateInput from './ui/DateInput';
import GrilleIndiciaireSelector from './GrilleIndiciaireSelector';

const FONCTIONS_PAR_ROLE = {
  PE: ['Enseignant', 'Enseignant Chercheur', 'Maître de Conférences', 'Professeur'],
  PAT: ['Agent', 'Chef de service', 'Responsable/Directeur'],
};
const CORPS_OPTIONS = ['EFA', 'ELD', 'Fonctionnaire'];
const TYPES_CONTRAT = ['CDI', 'CDD', 'Vacataire', 'Stagiaire'];

const empty = {
  matricule: '', nom: '', prenom: '', email: '', roles: ['PE'], fonction: '',
  corps: '', grade: '', poste: '', categorieId: '', service: '', direction: '', telephone: '', typeContrat: '',
  dateRecrutement: '', dateEcheanceContrat: '', contratPermanent: false,
  etablissementId: '', corpsPe: '', diplome: '', specialite: '', secretariatRole: '',
  classe: '', echelon: '', categorie: '', cadre: '', echelle: '', indice: '',
};

export default function AjouterEmployeModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(empty);
  const [grilleResolved, setGrilleResolved] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  const [directions, setDirections] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDirectionId, setSelectedDirectionId] = useState('');
  const [categories, setCategories] = useState([]);
  const [etablissements, setEtablissements] = useState([]);

  const fonctionOptions = [...new Set([
    ...(form.roles.includes('PE') ? FONCTIONS_PAR_ROLE.PE : []),
    ...(form.roles.includes('PAT') ? FONCTIONS_PAR_ROLE.PAT : []),
  ])];

  useEffect(() => {
    fetchDirections().then(setDirections).catch(() => setDirections([]));
    fetchCategories().then(setCategories).catch(() => setCategories([]));
    fetchEtablissements().then((list) => setEtablissements(list.filter((e) => e.statut === 'ACTIF'))).catch(() => setEtablissements([]));
  }, []);

  useEffect(() => {
    if (!selectedDirectionId) return;
    fetchServices(selectedDirectionId).then(setServices).catch(() => setServices([]));
  }, [selectedDirectionId]);

  // Services de la direction choisie : vide tant qu'aucune direction n'est sélectionnée.
  const servicesAffiches = selectedDirectionId ? services : [];

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleRole(role) {
    setForm((prev) => {
      const has = prev.roles.includes(role);
      const roles = has ? prev.roles.filter((r) => r !== role) : [...prev.roles, role];
      // Un PE n'est jamais secrétaire : si PAT est décoché, la désignation retombe.
      const secretariatRole = roles.includes('PAT') ? prev.secretariatRole : '';
      return { ...prev, roles, fonction: '', secretariatRole };
    });
  }

  function handleDirectionChange(e) {
    const id = e.target.value;
    setSelectedDirectionId(id);
    const dir = directions.find((d) => String(d.id) === id);
    update('direction', dir ? dir.nom : '');
    update('service', '');
  }

  function handleServiceChange(e) {
    const id = e.target.value;
    const svc = servicesAffiches.find((s) => String(s.id) === id);
    update('service', svc ? svc.nom : '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.roles.length === 0) {
      setStatus('error');
      setMessage(traduire('Sélectionne au moins un rôle (PE ou PAT).'));
      return;
    }
    if (!/^[0-9]{6}$/.test(form.matricule)) {
      setStatus('error');
      setMessage(traduire('Le matricule doit contenir exactement 6 chiffres.'));
      return;
    }
    if (!form.contratPermanent && !form.dateEcheanceContrat && ['CDD', 'Vacataire', 'Stagiaire'].includes(form.typeContrat)) {
      setStatus('error');
      setMessage('Indique une date de fin de contrat, ou coche "Contrat permanent".');
      return;
    }
    setStatus('loading');
    setMessage('');
    const { etablissementId, corpsPe, diplome, specialite, classe, echelon, indice, categorie, cadre, echelle, ...rest } = form;
    const peInfos = form.roles.includes('PE')
      ? { etablissementId: etablissementId || null, corpsPe: corpsPe || null, diplome: diplome || null, specialite: specialite || null }
      : undefined;
    // Fonctionnaire avec une combinaison résolue dans la grille : le serveur fixe l'indice.
    const resolveFromGrille = form.corps === 'Fonctionnaire' && grilleResolved && classe && echelon
      ? { classe, echelon: Number(echelon), categorie: categorie || undefined, cadre: cadre || undefined, echelle: echelle || undefined }
      : undefined;
    try {
      await createPersonnel({
        ...rest, categorieId: form.categorieId || null, peInfos,
        classe: classe || null, echelon: echelon || null, indice: indice || null, resolveFromGrille,
      });
      setStatus('success');
      setMessage(traduire('Fiche personnel créée.'));
      setTimeout(() => onSuccess?.(), 800);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  return (
    <Modal onClose={onClose} title={traduire('Ajouter un employé')} maxWidth="max-w-2xl">
        <p className="text-sm text-gray-500 mb-4">{traduire('Les champs marqués * sont obligatoires.')}</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Matricule (6 chiffres) *')}</label>
            <input
              type="text" required maxLength={6} value={form.matricule}
              onChange={(e) => update('matricule', e.target.value.replace(/\D/g, ''))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Email *')}</label>
            <input
              type="email" required value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Nom *')}</label>
            <input
              type="text" required value={form.nom}
              onChange={(e) => update('nom', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Prénom')}</label>
            <input
              type="text" value={form.prenom}
              onChange={(e) => update('prenom', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Rôle(s) *')}</label>
            <div className="flex items-center gap-4 h-[42px]">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.roles.includes('PE')} onChange={() => toggleRole('PE')} className="w-4 h-4 accent-navy" />
                {traduire('PE')}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.roles.includes('PAT')} onChange={() => toggleRole('PAT')} className="w-4 h-4 accent-navy" />
                {traduire('PAT')}
              </label>
            </div>
          </div>
          {form.roles.includes('PAT') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Secrétariat')}</label>
              <SelectMenu
                value={form.secretariatRole}
                onChange={(e) => update('secretariatRole', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              >
                <option value="">{traduire('Aucun')}</option>
                <option value="SECRETAIRE_PE">{traduire('Secrétaire PE')}</option>
                <option value="SECRETAIRE_PAT">{traduire('Secrétaire PAT')}</option>
              </SelectMenu>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Fonction')}</label>
            <SelectMenu
              value={form.fonction}
              onChange={(e) => update('fonction', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">--</option>
              {fonctionOptions.map((f) => <option key={f} value={f}>{f}</option>)}
            </SelectMenu>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Corps')}</label>
            <SelectMenu
              value={form.corps}
              onChange={(e) => update('corps', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">--</option>
              {CORPS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectMenu>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Classe et échelon (grille indiciaire)')}</label>
            <GrilleIndiciaireSelector
              regime={form.corps === 'Fonctionnaire' ? 'FONCTIONNAIRE' : null}
              value={{ classe: form.classe, echelon: form.echelon, categorie: form.categorie, cadre: form.cadre, echelle: form.echelle, indice: form.indice }}
              onChange={(next, resolution) => {
                setForm((prev) => ({ ...prev, ...next }));
                setGrilleResolved(!!resolution);
              }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Grade')}</label>
            <input
              type="text" value={form.grade}
              onChange={(e) => update('grade', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Poste')}</label>
            <input
              type="text" value={form.poste}
              onChange={(e) => update('poste', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Catégorie professionnelle')}</label>
            <SelectMenu
              value={form.categorieId}
              onChange={(e) => update('categorieId', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">--</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.appellation}</option>)}
            </SelectMenu>
          </div>
          {form.roles.includes('PE') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Établissement (PE)')}</label>
                <SelectMenu
                  value={form.etablissementId}
                  onChange={(e) => update('etablissementId', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                >
                  <option value="">--</option>
                  {etablissements.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
                </SelectMenu>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Corps académique (PE)')}</label>
                <input
                  type="text" value={form.corpsPe}
                  onChange={(e) => update('corpsPe', e.target.value)}
                  placeholder={traduire('Ex. AES, MC, PT...')}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Diplôme (PE)')}</label>
                <input
                  type="text" value={form.diplome}
                  onChange={(e) => update('diplome', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Spécialité (PE)')}</label>
                <input
                  type="text" value={form.specialite}
                  onChange={(e) => update('specialite', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Direction')}</label>
            <SelectMenu
              value={selectedDirectionId}
              onChange={handleDirectionChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">--</option>
              {directions.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </SelectMenu>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Service')}</label>
            <SelectMenu
              value={servicesAffiches.find((s) => s.nom === form.service)?.id || ''}
              onChange={handleServiceChange}
              disabled={!selectedDirectionId}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            >
              <option value="">--</option>
              {servicesAffiches.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </SelectMenu>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Téléphone')}</label>
            <input
              type="text" value={form.telephone}
              onChange={(e) => update('telephone', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Type de contrat')}</label>
            <SelectMenu
              value={form.typeContrat}
              onChange={(e) => update('typeContrat', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">--</option>
              {TYPES_CONTRAT.map((t) => <option key={t} value={t}>{t}</option>)}
            </SelectMenu>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Date de recrutement')}</label>
            <DateInput
               value={form.dateRecrutement}
              onChange={(e) => update('dateRecrutement', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>

          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.contratPermanent}
                onChange={(e) => update('contratPermanent', e.target.checked)}
                className="w-4 h-4 accent-navy"
              />
              {traduire('Contrat permanent (pas de date de fin)')}
            </label>
          </div>

          {!form.contratPermanent && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Date de fin de contrat')}</label>
              <DateInput
                 value={form.dateEcheanceContrat}
                onChange={(e) => update('dateEcheanceContrat', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
              />
            </div>
          )}

          <div className="col-span-2">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="w-full bg-navy text-white rounded-md py-2 font-medium hover:opacity-90 disabled:opacity-50"
            >
              {status === 'loading' ? 'Enregistrement...' : traduire("Enregistrer l'employé")}
            </button>
            {message && (
              <p className={`text-sm mt-2 ${status === 'success' ? 'text-status-approved' : 'text-status-rejected'}`}>
                {message}
              </p>
            )}
          </div>
        </form>
    </Modal>
  );
}