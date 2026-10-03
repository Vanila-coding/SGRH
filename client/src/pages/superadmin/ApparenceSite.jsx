import { useEffect, useState } from 'react';
import { getAllTexts, updateText } from '../../services/siteTextsApi';
import { updateSiteSetting, resetSiteColors, uploadLogo, uploadFavicon, uploadLogoConnexion } from '../../services/siteSettingsAdminApi';
import { useTextContext } from '../../context/TextContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import PageHeader from '../../components/PageHeader';
import { toast } from '../../utils/toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { ConfirmDialog } from '../../components/ui';
import { Moon, RotateCcw } from 'lucide-react';

const COLOR_LABELS = {
  color_navy: 'Couleur principale (boutons, accents, sidebar)',
  color_gold: 'Couleur secondaire (élément actif de la sidebar, mise en valeur)',
  color_status_pending: 'Statut — en attente',
  color_status_approved: 'Statut — approuvé',
  color_status_rejected: 'Statut — refusé',
};

// Champs de contenu proposés à la personnalisation : une liste fixe, choisie dans le
// code, jamais une création libre de clé par le Superadmin (cohérent avec les libellés
// de menu — voir Sidebar.jsx/TopBar.jsx). Chaque entrée s'enregistre elle-même dans
// site_texts via useText, exactement comme les pages qui les consomment réellement
// (Login, Footer, Sidebar, TopBar, authService côté serveur).
const CHAMPS_CONNEXION = [
  { key: 'login.titre_bienvenue', label: 'Titre', defaut: "Bienvenue sur l'espace RH" },
  { key: 'login.slogan', label: 'Sous-titre', defaut: 'Excellence • Intégrité • Innovation' },
  { key: 'login.description_bienvenue', label: "Message d'accueil", defaut: "Université de Mahajanga — Plateforme de gestion des ressources humaines. Consultez votre dossier, vos congés et vos notifications en un seul endroit.", multiligne: true },
];
const CHAMPS_FOOTER = [
  { key: 'footer.nom_application', label: "Nom de l'application", defaut: 'Université de Mahajanga' },
  { key: 'footer.description', label: 'Description (optionnelle)', defaut: '' },
  { key: 'footer.copyright', label: 'Mention de copyright', defaut: 'Tous droits réservés' },
  { key: 'footer.developpeur', label: 'Développé par (laisser vide pour masquer)', defaut: 'JAOSOA Tanaël Faustin' },
];
const CHAMPS_SYSTEME = [
  { key: 'systeme.message_compte_attente', label: 'Message — compte en attente', defaut: "Votre compte est en attente de validation par l'administration RH.", multiligne: true },
  { key: 'systeme.message_compte_desactive', label: 'Message — compte désactivé', defaut: "Votre compte a été désactivé. Contactez l'administration RH pour plus d'informations.", multiligne: true },
];
const CHAMPS_MENU = [
  { key: 'menu.libelle_tableau_de_bord', label: 'Dashboard / Tableau de bord', defaut: 'Tableau de bord' },
  { key: 'menu.libelle_personnel', label: 'Personnel', defaut: 'Personnel' },
  { key: 'menu.libelle_carriere', label: 'Carrière', defaut: 'Carrière' },
  { key: 'menu.libelle_conges', label: 'Congés', defaut: 'Congés & absences' },
  { key: 'menu.libelle_documents', label: 'Documents', defaut: 'Documents' },
  { key: 'menu.libelle_parametres', label: 'Paramètres', defaut: 'Paramètres' },
];
const CHAMPS_INSTITUTION = [
  { key: 'institution.nom', label: "Nom de l'université", defaut: 'Université de Mahajanga' },
  { key: 'institution.nom_court', label: 'Nom court / sigle', defaut: '' },
  { key: 'institution.adresse', label: 'Adresse', defaut: '' },
  { key: 'institution.telephone', label: 'Téléphone', defaut: '' },
  { key: 'institution.email', label: 'Email institutionnel', defaut: '' },
  { key: 'institution.site_officiel', label: 'Site officiel', defaut: '' },
];
// Contenu des 3 pages "Aide" du personnel (client/src/pages/aide/*.jsx) : texte brut
// avec retours à la ligne (affiché en `whitespace-pre-line`), pas de mise en forme HTML
// à gérer ici — reste simple à éditer pour le Superadmin.
const CHAMPS_AIDE = [
  {
    key: 'aide.par_ou_commencer', label: '« Par où commencer ? »', multiligne: true, rows: 6,
    defaut: `1. Consultez votre profil pour vérifier que vos informations (matricule, fonction, contrat) sont correctes.
2. Utilisez la page Congés pour soumettre une demande — vos informations personnelles se remplissent automatiquement.
3. Surveillez la cloche de notifications : vous y recevrez les décisions sur vos demandes et les annonces de l'administration.
4. En cas de question, contactez le service RH de l'université.`,
  },
  {
    key: 'aide.vos_droits', label: '« Vos droits »', multiligne: true, rows: 8,
    defaut: `Tout membre du personnel de l'Université de Mahajanga peut, selon sa situation :
- Bénéficier d'un congé annuel, de permissions et d'autorisations d'absence selon la réglementation en vigueur
- Consulter à tout moment ses informations administratives
- Être informé de toute décision concernant ses demandes
- Faire valoir ses droits en cas de désaccord avec une décision, en s'adressant au service RH

Le détail complet des droits par statut (CDI, CDD, Vacataire, Stagiaire) sera précisé prochainement par l'administration.`,
  },
  {
    key: 'aide.procedures', label: '« Les procédures »', multiligne: true, rows: 8,
    defaut: `Demande de congé / permission
Remplissez le formulaire dans "Congés", en précisant le type, les dates et le motif. Votre demande part directement au service RH.

Suivi d'une demande
Le statut (en attente, approuvée, refusée) s'affiche dans "Mes demandes". Une notification vous informe dès qu'une décision est prise.

Fiche imprimable
Chaque demande dispose d'un lien "Voir / télécharger la fiche", reprenant le format officiel de l'université.`,
  },
];
const TOUTES_LES_CLES_CURATED = new Set([
  ...CHAMPS_CONNEXION, ...CHAMPS_FOOTER, ...CHAMPS_SYSTEME, ...CHAMPS_MENU, ...CHAMPS_INSTITUTION, ...CHAMPS_AIDE,
].map((c) => c.key));

function Section({ title, description, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <h3 className="text-sm font-semibold text-navy dark:text-gold mb-1">{title}</h3>
      {description && <p className="text-xs text-gray-400 mb-4">{description}</p>}
      {!description && <div className="mb-4" />}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

// Un champ de texte personnalisable : lit la valeur actuelle (ou le défaut, qui s'enregistre
// automatiquement au premier affichage) via useText, propose un brouillon local édité, et
// enregistre via l'API existante site-texts en rechargeant TextContext pour que le
// changement soit immédiatement visible partout ailleurs dans l'app (Sidebar, Footer...).
function ChampTexte({ champ }) {
  const { texts, reload } = useTextContext();
  const valeurActuelle = texts[champ.key] !== undefined ? texts[champ.key] : champ.defaut;
  const [valeur, setValeur] = useState(valeurActuelle);
  const [saving, setSaving] = useState(false);
  const modifie = valeur !== valeurActuelle;

  async function handleSave() {
    setSaving(true);
    try {
      await updateText(champ.key, valeur);
      await reload();
      toast.success('Texte enregistré.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const Champ = champ.multiligne ? 'textarea' : 'input';

  return (
    <div className={champ.multiligne ? 'max-w-3xl' : 'max-w-xl'}>
      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{champ.label}</label>
      <div className="flex gap-2 items-start">
        <Champ
          type={champ.multiligne ? undefined : 'text'}
          rows={champ.multiligne ? (champ.rows || 2) : undefined}
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          placeholder={champ.defaut || undefined}
          className="flex-1 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
        />
        <button
          onClick={handleSave}
          disabled={saving || !modifie}
          className="px-3 py-2 rounded-md text-xs font-medium bg-navy text-white hover:opacity-90 disabled:opacity-40 whitespace-nowrap shrink-0"
        >
          {saving ? '...' : 'Enregistrer'}
        </button>
        {modifie && (
          <button
            onClick={() => setValeur(valeurActuelle)}
            disabled={saving}
            className="px-3 py-2 rounded-md text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap shrink-0"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}

// Logo principal / favicon / logo de connexion : un chemin de fichier stocké dans
// site_settings (même table que les couleurs), pas un texte — upload dédié avec aperçu.
function ChampImage({ label, hint, valeurActuelle, onUpload }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      await onUpload(file);
      toast.success('Image mise à jour.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  }

  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');
  const src = preview || (valeurActuelle ? `${API_URL}${valeurActuelle}` : null);

  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 shrink-0 rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
        {src ? <img src={src} alt="" className="h-full w-full object-contain" /> : <span className="text-[10px] text-gray-400 text-center px-1">Aucune image</span>}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-navy dark:text-gray-100">{label}</p>
        {hint && <p className="text-xs text-gray-400 mb-2">{hint}</p>}
        <label className="inline-block px-3 py-1.5 rounded-md text-xs font-medium bg-navy text-white hover:opacity-90 cursor-pointer">
          {uploading ? 'Envoi...' : 'Choisir une image'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={handleFile} />
        </label>
      </div>
    </div>
  );
}

export default function ApparenceSite() {
  const [tab, setTab] = useState('apparence'); // 'apparence' | 'contenu' | 'institution'
  const [colorEdits, setColorEdits] = useState({});
  const [allTexts, setAllTexts] = useState([]);
  const [search, setSearch] = useState('');
  const [savingKey, setSavingKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autresOuvert, setAutresOuvert] = useState(false);
  const [autresEdits, setAutresEdits] = useState({});
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const { reload: reloadSettings, settings } = useSiteSettings();
  const { loaded: textsLoaded } = useTextContext();

  useEffect(() => {
    Promise.all([
      reloadSettings().then(() => {}),
      getAllTexts().then((data) => setAllTexts(data.list || [])),
    ]).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleColorSave(key, value) {
    setSavingKey(key);
    try {
      await updateSiteSetting(key, value);
      await reloadSettings();
      setColorEdits((prev) => { const next = { ...prev }; delete next[key]; return next; });
      toast.success('Couleur enregistrée.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingKey(null);
    }
  }

  async function handleResetColors() {
    setResetting(true);
    try {
      await resetSiteColors();
      await reloadSettings();
      setColorEdits({});
      toast.success('Couleurs réinitialisées à la palette par défaut.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResetting(false);
      setConfirmReset(false);
    }
  }

  const autresTextes = allTexts.filter((t) => !TOUTES_LES_CLES_CURATED.has(t.key));
  const autresFiltres = autresTextes.filter(
    (t) => !search || t.key.toLowerCase().includes(search.toLowerCase()) || t.value.toLowerCase().includes(search.toLowerCase())
  );
  const groupedAutres = {};
  autresFiltres.forEach((t) => {
    if (!groupedAutres[t.category]) groupedAutres[t.category] = [];
    groupedAutres[t.category].push(t);
  });

  async function handleAutreTextSave(key, value) {
    setSavingKey(key);
    try {
      await updateText(key, value);
      setAllTexts((prev) => prev.map((t) => (t.key === key ? { ...t, value } : t)));
      setAutresEdits((prev) => { const next = { ...prev }; delete next[key]; return next; });
      toast.success('Texte enregistré.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingKey(null);
    }
  }

  const enChargement = loading || !textsLoaded;

  return (
    <div className="mx-auto max-w-[1600px]">
      <PageHeader crumbs={[{ label: 'Administration' }, { label: 'Personnalisation' }]} title="Personnalisation" subtitle="Apparence, contenu et informations institutionnelles du site" />
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          ['apparence', 'Apparence'],
          ['contenu', 'Contenu'],
          ['institution', 'Informations institutionnelles'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === id ? 'bg-navy text-white' : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {enChargement && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 grid grid-cols-1 sm:grid-cols-2 gap-4" role="status" aria-label="Chargement">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-32 rounded" />
                <Skeleton className="h-2.5 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!enChargement && tab === 'apparence' && (
        <>
          <Section title="Logo et favicon">
            <ChampImage label="Logo principal" hint="Utilisé dans la sidebar et par défaut sur la page de connexion." valeurActuelle={settings.logo_principal_url} onUpload={async (f) => { await uploadLogo(f); await reloadSettings(); }} />
            <ChampImage label="Favicon" hint="Icône affichée dans l'onglet du navigateur." valeurActuelle={settings.favicon_url} onUpload={async (f) => { await uploadFavicon(f); await reloadSettings(); }} />
            <ChampImage label="Logo — page de connexion (optionnel)" hint="Si vide, le logo principal est utilisé." valeurActuelle={settings.logo_connexion_url} onUpload={async (f) => { await uploadLogoConnexion(f); await reloadSettings(); }} />
          </Section>

          <Section title="Couleurs" description="La couleur de base (bleu marine institutionnel, en référence au logo) est restaurable à tout moment.">
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-gold"
              >
                <RotateCcw size={13} aria-hidden="true" /> Réinitialiser à la couleur de base
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.entries(settings).filter(([key]) => key.startsWith('color_')).map(([key, storedValue]) => {
                const value = colorEdits[key] ?? storedValue;
                return (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => setColorEdits((prev) => ({ ...prev, [key]: e.target.value }))}
                        className="w-10 h-10 rounded border border-gray-200 dark:border-gray-700 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-navy dark:text-gray-100">{COLOR_LABELS[key] || key}</p>
                        <p className="text-xs text-gray-400">{value}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleColorSave(key, value)}
                      disabled={savingKey === key}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-navy text-white hover:opacity-90 disabled:opacity-50 shrink-0"
                    >
                      {savingKey === key ? '...' : 'Enregistrer'}
                    </button>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section title="Mode clair / sombre">
            <div className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400">
              <Moon size={18} className="shrink-0 mt-0.5" />
              <p>
                Le mode sombre est déjà disponible pour chaque utilisateur individuellement, via l'icône
                lune/soleil dans la barre supérieure. C'est une préférence personnelle (mémorisée sur
                l'appareil de chacun), il n'y a pas de bascule globale à configurer ici.
              </p>
            </div>
          </Section>
        </>
      )}

      {!enChargement && tab === 'contenu' && (
        <>
          <Section title="Page de connexion">
            {CHAMPS_CONNEXION.map((c) => <ChampTexte key={c.key} champ={c} />)}
          </Section>
          <Section title="Pied de page">
            {CHAMPS_FOOTER.map((c) => <ChampTexte key={c.key} champ={c} />)}
          </Section>
          <Section title="Messages système" description="Affichés à la connexion selon l'état du compte. Le mode maintenance n'existe pas dans l'application actuelle — rien à personnaliser pour cet élément.">
            {CHAMPS_SYSTEME.map((c) => <ChampTexte key={c.key} champ={c} />)}
          </Section>
          <Section title="Libellés de navigation" description="Ces libellés remplacent le texte affiché pour ces éléments dans le menu ; la structure du menu elle-même n'est pas modifiable ici.">
            {CHAMPS_MENU.map((c) => <ChampTexte key={c.key} champ={c} />)}
          </Section>
          <Section title="Aide (personnel)" description="Contenu des 3 pages d'aide affichées au personnel (PE/PAT) dans le menu Aide.">
            {CHAMPS_AIDE.map((c) => <ChampTexte key={c.key} champ={c} />)}
          </Section>

          <div className="mb-4">
            <button
              onClick={() => setAutresOuvert((v) => !v)}
              className="text-xs font-medium text-navy dark:text-gold hover:underline"
            >
              {autresOuvert ? 'Masquer' : 'Afficher'} les autres textes de l'application ({autresTextes.length})
            </button>
          </div>

          {autresOuvert && (
            <div className="max-w-3xl">
              <input
                type="text"
                placeholder="Rechercher un texte..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-navy"
              />
              {Object.entries(groupedAutres).map(([category, items]) => (
                <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow mb-4 overflow-hidden">
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 font-semibold text-navy dark:text-gold text-sm">{category}</div>
                  <div className="divide-y dark:divide-gray-700">
                    {items.map((t) => (
                      <div key={t.key} className="p-4">
                        <p className="text-xs text-gray-400 mb-1 font-mono">{t.key}</p>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={autresEdits[t.key] ?? t.value}
                            onChange={(e) => setAutresEdits((prev) => ({ ...prev, [t.key]: e.target.value }))}
                            className="flex-1 border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
                          />
                          <button
                            onClick={() => handleAutreTextSave(t.key, autresEdits[t.key] ?? t.value)}
                            disabled={savingKey === t.key}
                            className="px-3 py-2 rounded-md text-xs font-medium bg-navy text-white hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                          >
                            {savingKey === t.key ? '...' : 'Enregistrer'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {autresFiltres.length === 0 && <p className="text-sm text-gray-400">Aucun autre texte trouvé.</p>}
            </div>
          )}
        </>
      )}

      {!enChargement && tab === 'institution' && (
        <Section title="Informations institutionnelles" description="Réutilisées dans les endroits prévus de l'application (ex. pied de page). Laisser vide si l'information n'est pas confirmée.">
          {CHAMPS_INSTITUTION.map((c) => <ChampTexte key={c.key} champ={c} />)}
        </Section>
      )}

      <ConfirmDialog
        open={confirmReset}
        title="Réinitialiser les couleurs"
        message="Les 5 couleurs personnalisées seront remplacées par la palette de base (bleu marine institutionnel et or, en référence au logo). Cette action s'applique immédiatement sur tout le site, y compris les pages de connexion et d'inscription."
        confirmLabel="Réinitialiser"
        loading={resetting}
        onConfirm={handleResetColors}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
