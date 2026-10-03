import { useState, useEffect } from 'react';
import { updatePersonnel } from '../services/personnelApi';
import { toInputDate } from '../utils/dossier';
import { fetchDirections, fetchServices } from '../services/organisationApi';
import { fetchCategories } from '../services/categorieApi';
import { fetchEtablissements } from '../services/etablissementApi';
import GrilleIndiciaireSelector from './GrilleIndiciaireSelector';
import Modal from './ui/Modal';
import SelectMenu from './ui/SelectMenu';
import { traduire } from '../i18n';

const CORPS_OPTIONS = ['EFA', 'ELD', 'Fonctionnaire'];
const TYPES_CONTRAT = ['CDI', 'CDD', 'Vacataire', 'Stagiaire'];

export default function ModifierEmployeModal({ personnel, onClose, onSuccess }) {
  const [form, setForm] = useState({
    nom: personnel.nom || '', prenom: personnel.prenom || '', email: personnel.email || '',
    roles: personnel.roles?.length > 0 ? personnel.roles : (personnel.role ? [personnel.role] : []),
    corps: personnel.corps || '', grade: personnel.grade || '', poste: personnel.poste || '',
    categorieId: personnel.categorie_id || '',
    service: personnel.service || '', direction: personnel.direction || '',
    telephone: personnel.telephone || '', typeContrat: personnel.type_contrat || '',
    dateRecrutement: toInputDate(personnel.date_recrutement),
    dateEcheanceContrat: toInputDate(personnel.date_echeance_contrat),
    contratPermanent: !!personnel.contrat_permanent,
    classe: personnel.classe || '', echelon: personnel.echelon || '', indice: personnel.indice || '',
    categorie: '', cadre: '', echelle: '',
    etablissementId: personnel.etablissement_id || '', corpsPe: personnel.corps_pe || '',
    diplome: personnel.diplome || '', specialite: personnel.specialite || '',
  });
  const [grilleResolved, setGrilleResolved] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');

  const [directions, setDirections] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedDirectionId, setSelectedDirectionId] = useState('');
  const [categories, setCategories] = useState([]);
  const [etablissements, setEtablissements] = useState([]);

  useEffect(() => {
    fetchDirections().then((list) => {
      setDirections(list);
      const current = list.find((d) => d.nom === personnel.direction);
      if (current) setSelectedDirectionId(String(current.id));
    }).catch(() => setDirections([]));
    fetchCategories().then(setCategories).catch(() => setCategories([]));
    fetchEtablissements()
      .then((list) => setEtablissements(list.filter((e) => e.statut === 'ACTIF' || e.id === personnel.etablissement_id)))
      .catch(() => setEtablissements([]));
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
      return { ...prev, roles };
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
      setMessage(traduire('Sélectionne au moins un rôle (PE ou PAT).'));
      return;
    }
    setStatus('loading');
    setMessage('');
    try {
      const payload = { ...form, categorieId: form.categorieId || null };
      if (form.corps === 'Fonctionnaire' && grilleResolved && payload.classe && payload.echelon) {
        payload.resolveFromGrille = {
          regime: 'FONCTIONNAIRE', classe: payload.classe, echelon: Number(payload.echelon),
          categorie: payload.categorie || undefined, cadre: payload.cadre || undefined, echelle: payload.echelle || undefined,
        };
      }
      delete payload.categorie; delete payload.cadre; delete payload.echelle;
      payload.peInfos = form.roles.includes('PE')
        ? { etablissementId: form.etablissementId || null, corpsPe: form.corpsPe || null, diplome: form.diplome || null, specialite: form.specialite || null }
        : undefined;
      delete payload.etablissementId; delete payload.corpsPe; delete payload.diplome; delete payload.specialite;
      await updatePersonnel(personnel.id, payload);
      setStatus('success');
      setMessage(traduire('Fiche mise à jour.'));
      setTimeout(() => onSuccess?.(), 800);
    } catch (err) {
      setStatus('error');
      setMessage(err.message);
    }
  }

  return (
    <Modal onClose={onClose} title={`Modifier ${[personnel.prenom, personnel.nom].filter(Boolean).join(' ')}`} maxWidth="max-w-2xl">
        <p className="text-xs text-gray-400 mb-4">
          Matricule {personnel.matricule} — la fonction se modifie depuis la page "Fonctions".
          Décocher un rôle retire les informations propres à ce rôle (ex. établissement pour PE).
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Nom')}</label>
            <input
              type="text" value={form.nom}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Email')}</label>
            <input
              type="email" value={form.email}
              onChange={(e) => update('email', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
            />
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
          {form.corps === 'Fonctionnaire' ? (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Situation réglementaire (grille indiciaire)')}</label>
              <GrilleIndiciaireSelector
                regime="FONCTIONNAIRE"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Classe')}</label>
                <input
                  type="text" value={form.classe}
                  onChange={(e) => update('classe', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Échelon')}</label>
                <input
                  type="text" value={form.echelon}
                  onChange={(e) => update('echelon', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Indice')}</label>
                <input
                  type="text" value={form.indice}
                  onChange={(e) => update('indice', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              </div>
            </>
          )}
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
              value={services.find((s) => s.nom === form.service)?.id || ''}
              onChange={handleServiceChange}
              disabled={!selectedDirectionId}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            >
              <option value="">--</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
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
              {traduire('Contrat permanent')}
            </label>
          </div>
          {!form.contratPermanent && (
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{traduire('Date de fin de contrat')}</label>
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
              {status === 'loading' ? 'Enregistrement...' : traduire('Enregistrer les modifications')}
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