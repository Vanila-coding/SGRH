import { useState, useEffect } from 'react';
import { createPersonnel } from '../services/personnelApi';
import { fetchDirections, fetchServices } from '../services/organisationApi';
import { fetchCategories } from '../services/categorieApi';
import { fetchEtablissements } from '../services/etablissementApi';
import Modal from './ui/Modal';

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
  etablissementId: '', corpsPe: '', diplome: '', specialite: '',
};

export default function AjouterEmployeModal({ onClose, onSuccess }) {
  const [form, setForm] = useState(empty);
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
    if (!selectedDirectionId) { setServices([]); return; }
    fetchServices(selectedDirectionId).then(setServices).catch(() => setServices([]));
  }, [selectedDirectionId]);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleRole(role) {
    setForm((prev) => {
      const has = prev.roles.includes(role);
      const roles = has ? prev.roles.filter((r) => r !== role) : [...prev.roles, role];
      return { ...prev, roles, fonction: '' };
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
    const svc = services.find((s) => String(s.id) === id);
    update('service', svc ? svc.nom : '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.roles.length === 0) {
      setStatus('error');
      setMessage('Sélectionne au moins un rôle (PE ou PAT).');
      return;
    }
    if (!/^[0-9]{6}$/.test(form.matricule)) {
      setStatus('error');
      setMessage('Le matricule doit contenir exactement 6 chiffres.');
      return;
    }
    if (!form.contratPermanent && !form.dateEcheanceContrat && ['CDD', 'Vacataire', 'Stagiaire'].includes(form.typeContrat)) {
      setStatus('error');
      setMessage('Indique une date de fin de contrat, ou coche "Contrat permanent".');
      return;
    }
    setStatus('loading');
    setMessage('');
    const { etablissementId, corpsPe, diplome, specialite, ...rest } = form;
    const peInfos = form.roles.includes('PE')
      ? { etablissementId: etablissementId || null, corpsPe: corpsPe || null, diplome: diplome || null, specialite: specialite || null }
      : undefined;
    try {
      await createPersonnel({ ...rest, categorieId: form.categorieId || null, peInfos });
      setStatus('success');
      setMessage('Fiche personnel créée.');
      setTimeout(() => onSuccess?.(), 800);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  return (
    <Modal onClose={onClose} title="Ajouter un employé" maxWidth="max-w-2xl">
        <p className="text-sm text-gray-500 mb-4">Les champs marqués * sont obligatoires.</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Matricule (6 chiffres) *</label>
            <input
              type="text" required maxLength={6} value={form.matricule}
              onChange={(e) => update('matricule', e.target.value.replace(/\D/g, ''))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
            <input
              type="email" required value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
            <input
              type="text" required value={form.nom}
              onChange={(e) => update('nom', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom</label>
            <input
              type="text" value={form.prenom}
              onChange={(e) => update('prenom', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rôle(s) *</label>
            <div className="flex items-center gap-4 h-[42px]">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.roles.includes('PE')} onChange={() => toggleRole('PE')} className="w-4 h-4 accent-navy" />
                PE
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={form.roles.includes('PAT')} onChange={() => toggleRole('PAT')} className="w-4 h-4 accent-navy" />
                PAT
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fonction</label>
            <select
              value={form.fonction}
              onChange={(e) => update('fonction', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">--</option>
              {fonctionOptions.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Corps</label>
            <select
              value={form.corps}
              onChange={(e) => update('corps', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">--</option>
              {CORPS_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Grade</label>
            <input
              type="text" value={form.grade}
              onChange={(e) => update('grade', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Poste</label>
            <input
              type="text" value={form.poste}
              onChange={(e) => update('poste', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie professionnelle</label>
            <select
              value={form.categorieId}
              onChange={(e) => update('categorieId', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">--</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.appellation}</option>)}
            </select>
          </div>
          {form.roles.includes('PE') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Établissement (PE)</label>
                <select
                  value={form.etablissementId}
                  onChange={(e) => update('etablissementId', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                >
                  <option value="">--</option>
                  {etablissements.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Corps académique (PE)</label>
                <input
                  type="text" value={form.corpsPe}
                  onChange={(e) => update('corpsPe', e.target.value)}
                  placeholder="Ex. AES, MC, PT..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diplôme (PE)</label>
                <input
                  type="text" value={form.diplome}
                  onChange={(e) => update('diplome', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Spécialité (PE)</label>
                <input
                  type="text" value={form.specialite}
                  onChange={(e) => update('specialite', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Direction</label>
            <select
              value={selectedDirectionId}
              onChange={handleDirectionChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">--</option>
              {directions.map((d) => <option key={d.id} value={d.id}>{d.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Service</label>
            <select
              value={services.find((s) => s.nom === form.service)?.id || ''}
              onChange={handleServiceChange}
              disabled={!selectedDirectionId}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            >
              <option value="">--</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
            <input
              type="text" value={form.telephone}
              onChange={(e) => update('telephone', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type de contrat</label>
            <select
              value={form.typeContrat}
              onChange={(e) => update('typeContrat', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            >
              <option value="">--</option>
              {TYPES_CONTRAT.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de recrutement</label>
            <input
              type="date" value={form.dateRecrutement}
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
              Contrat permanent (pas de date de fin)
            </label>
          </div>

          {!form.contratPermanent && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date de fin de contrat</label>
              <input
                type="date" value={form.dateEcheanceContrat}
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
              {status === 'loading' ? 'Enregistrement...' : "Enregistrer l'employé"}
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