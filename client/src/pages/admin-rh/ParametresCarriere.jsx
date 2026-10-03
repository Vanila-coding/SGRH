import { useEffect, useState } from 'react';
import { fetchParametresCarriere, updateParametreCarriere } from '../../services/parametreCarriereApi';
import { fetchGrilles, rechercherLignes, ajouterLigneGrille, CLASSES_GRILLE } from '../../services/grilleIndiciaireApi';
import PageHeader from '../../components/PageHeader';
import { toast } from '../../utils/toast';
import { SkeletonCard, SkeletonTable } from '../../components/ui/Skeleton';

const inputClass = 'border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-1.5 text-sm';

const emptyLigneForm = { grilleId: '', classe: '', echelon: '', categorie: '', cadre: '', echelle: '', indice: '', sourceTexte: '', sourceArticle: '', dateDebutValidite: '' };

function OngletParametres({ params, setEdits, status, handleSave }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {params.map((p) => (
        <div key={p.cle} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-navy dark:text-gray-100">
                {p.cle}
                {p.a_valider && <span className="ml-2 text-xs px-2 py-0.5 rounded bg-amber-50 text-status-pending font-medium">À valider</span>}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{p.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              defaultValue={p.valeur}
              onChange={(e) => setEdits((prev) => ({ ...prev, [p.cle]: e.target.value }))}
              className="flex-1 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-1.5 text-sm"
            />
            <button
              onClick={() => handleSave(p.cle)}
              disabled={status[p.cle] === 'loading'}
              className="bg-navy text-white rounded-md px-3 py-1.5 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              Enregistrer
            </button>
          </div>
          {status[p.cle] === 'success' && <p className="text-xs text-status-approved mt-1">Enregistré.</p>}
        </div>
      ))}
    </div>
  );
}

function OngletGrilles() {
  const [grilles, setGrilles] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [ligneForm, setLigneForm] = useState(emptyLigneForm);
  const [formStatus, setFormStatus] = useState(null);
  const [formFeedback, setFormFeedback] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [g, l] = await Promise.all([fetchGrilles(), rechercherLignes({})]);
    setGrilles(g);
    setLignes(l);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function updateLigneForm(field, value) {
    setLigneForm((prev) => ({ ...prev, [field]: value, ...(field === 'classe' ? { echelon: '' } : {}) }));
  }

  const classeInfo = CLASSES_GRILLE.find((c) => c.value === ligneForm.classe);
  const echelons = classeInfo ? Array.from({ length: classeInfo.echelons }, (_, i) => i + 1) : [];

  async function handleAjouterLigne(e) {
    e.preventDefault();
    setFormStatus('loading');
    setFormFeedback('');
    try {
      await ajouterLigneGrille(ligneForm.grilleId, {
        classe: ligneForm.classe, echelon: Number(ligneForm.echelon), indice: Number(ligneForm.indice),
        categorie: ligneForm.categorie || null, cadre: ligneForm.cadre || null, echelle: ligneForm.echelle || null,
        sourceTexte: ligneForm.sourceTexte, sourceArticle: ligneForm.sourceArticle || null,
        dateDebutValidite: ligneForm.dateDebutValidite,
      });
      setFormStatus('success');
      setFormFeedback('Ligne ajoutée.');
      setLigneForm(emptyLigneForm);
      load();
    } catch (err) {
      setFormStatus('error');
      setFormFeedback(err.message);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={3} />
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <SkeletonTable rows={5} columns={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-navy dark:text-gold mb-2">Grilles indiciaires réglementaires</h3>
        {grilles.length === 0 && <p className="text-sm text-gray-400">Aucune grille enregistrée.</p>}
        <div className="space-y-3">
          {grilles.map((g) => (
            <div key={g.id} className="border-b border-gray-100 dark:border-gray-700 pb-3 last:border-0">
              <p className="text-sm font-medium text-navy dark:text-gray-100">{g.nom} <span className="text-xs text-gray-400">({g.regime})</span></p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{g.description}</p>
              <p className="text-xs text-gray-400 mt-0.5">Source : {g.texte_source_principal}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-navy dark:text-gold">Lignes de grille ({lignes.length})</h3>
          <button onClick={() => setShowForm((s) => !s)} className="text-sm text-navy dark:text-gold underline">
            {showForm ? 'Fermer' : 'Ajouter une ligne'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAjouterLigne} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 p-3 bg-navy/5 rounded-md">
            <select required value={ligneForm.grilleId} onChange={(e) => updateLigneForm('grilleId', e.target.value)} className={inputClass}>
              <option value="">-- Grille --</option>
              {grilles.map((g) => <option key={g.id} value={g.id}>{g.nom}</option>)}
            </select>
            <select required value={ligneForm.classe} onChange={(e) => updateLigneForm('classe', e.target.value)} className={inputClass}>
              <option value="">-- Classe --</option>
              {CLASSES_GRILLE.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <select required value={ligneForm.echelon} onChange={(e) => updateLigneForm('echelon', e.target.value)} className={inputClass} disabled={!classeInfo}>
              <option value="">-- Échelon --</option>
              {echelons.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <input required type="number" placeholder="Indice" value={ligneForm.indice} onChange={(e) => updateLigneForm('indice', e.target.value)} className={inputClass} />
            <input type="text" placeholder="Catégorie (I-X, si applicable)" value={ligneForm.categorie} onChange={(e) => updateLigneForm('categorie', e.target.value)} className={inputClass} />
            <input type="text" placeholder="Cadre (A-D, si applicable)" value={ligneForm.cadre} onChange={(e) => updateLigneForm('cadre', e.target.value)} className={inputClass} />
            <input type="text" placeholder="Échelle (si applicable)" value={ligneForm.echelle} onChange={(e) => updateLigneForm('echelle', e.target.value)} className={inputClass} />
            <input required type="date" value={ligneForm.dateDebutValidite} onChange={(e) => updateLigneForm('dateDebutValidite', e.target.value)} className={inputClass} />
            <input required type="text" placeholder="Texte source (obligatoire)" value={ligneForm.sourceTexte} onChange={(e) => updateLigneForm('sourceTexte', e.target.value)} className={`${inputClass} sm:col-span-2`} />
            <input type="text" placeholder="Article / référence" value={ligneForm.sourceArticle} onChange={(e) => updateLigneForm('sourceArticle', e.target.value)} className={`${inputClass} sm:col-span-2`} />
            <div className="col-span-2 sm:col-span-4">
              <button type="submit" disabled={formStatus === 'loading'} className="bg-navy text-white rounded-md px-4 py-1.5 text-sm font-medium disabled:opacity-50">Enregistrer</button>
              {formFeedback && <span className={`ml-3 text-xs ${formStatus === 'success' ? 'text-status-approved' : 'text-status-rejected'}`}>{formFeedback}</span>}
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th className="pb-2 pr-3">Classe</th><th className="pb-2 pr-3">Échelon</th><th className="pb-2 pr-3">Catégorie</th>
                <th className="pb-2 pr-3">Cadre/Échelle</th><th className="pb-2 pr-3">Indice</th><th className="pb-2">Source</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr key={l.id} className="border-b border-gray-50 dark:border-gray-800">
                  <td className="py-1.5 pr-3 text-navy dark:text-gray-200">{l.classe}</td>
                  <td className="py-1.5 pr-3">{l.echelon}</td>
                  <td className="py-1.5 pr-3">{l.categorie || '—'}</td>
                  <td className="py-1.5 pr-3">{[l.cadre, l.echelle].filter(Boolean).join('/') || '—'}</td>
                  <td className="py-1.5 pr-3 font-medium">{l.indice}{l.code_grille_affichage ? `-${l.code_grille_affichage}` : ''}</td>
                  <td className="py-1.5 text-gray-400">{l.source_texte}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ParametresCarriere() {
  const [onglet, setOnglet] = useState('parametres');
  const [params, setParams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState({});
  const [status, setStatus] = useState({});

  async function load() {
    setLoading(true);
    try {
      setParams(await fetchParametresCarriere());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave(cle) {
    setStatus((s) => ({ ...s, [cle]: 'loading' }));
    try {
      await updateParametreCarriere(cle, edits[cle]);
      setStatus((s) => ({ ...s, [cle]: 'success' }));
      load();
    } catch (err) {
      setStatus((s) => ({ ...s, [cle]: 'error' }));
      toast.error(err.message);
    }
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        crumbs={[{ label: 'Admin RH' }, { label: 'Carrière' }, { label: 'Paramètres carrière' }]}
        title="Paramètres carrière"
        subtitle="Règles de progression de carrière et grilles indiciaires réglementaires"
      />

      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        {[{ key: 'parametres', label: 'Paramètres' }, { key: 'grilles', label: 'Grilles indiciaires' }].map((t) => (
          <button
            key={t.key}
            onClick={() => setOnglet(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${onglet === t.key ? 'border-navy text-navy dark:text-gold dark:border-gold' : 'border-transparent text-gray-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {onglet === 'parametres' && (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Les paramètres marqués <span className="text-status-pending font-medium">à valider</span> sont
            issus d'informations recueillies mais non encore confirmées officiellement par la RH — modifie-les dès que la règle définitive est connue.
          </p>
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <SkeletonCard lines={1} />
              <SkeletonCard lines={1} />
              <SkeletonCard lines={1} />
              <SkeletonCard lines={1} />
            </div>
          ) : (
            <OngletParametres params={params} setEdits={setEdits} status={status} handleSave={handleSave} />
          )}
        </>
      )}

      {onglet === 'grilles' && <OngletGrilles />}
    </div>
  );
}
