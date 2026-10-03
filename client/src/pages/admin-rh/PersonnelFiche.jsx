import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Pencil, UserRound, TrendingUp, FileText, Hash, Briefcase,
  Building2, CalendarClock,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ModifierEmployeModal from '../../components/ModifierEmployeModal';
import { Field, InfosDossier, ParcoursCard, SyntheseDossier } from '../../components/dossier/DossierBlocs';
import { present, roleLabels, seniority } from '../../utils/dossier';
import { usePermissions } from '../../context/PermissionContext';
import { getPersonnel } from '../../services/personnelApi';
import { getCarriere } from '../../services/carriereApi';
import { getSituationsForPersonnel } from '../../services/situationAdministrativeApi';
import { getHistoriquePersonnel } from '../../services/contratApi';
import { getSuiviConges } from '../../services/congeApi';
import { Skeleton, SkeletonAvatar, SkeletonText } from '../../components/ui';
import { traduire } from '../../i18n';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const photoUrl = (photo) => (photo ? `${API_URL.replace(/\/api\/?$/, '')}${photo}` : null);

// Pastilles lisibles sur le bandeau bleu (mêmes teintes que « Mon dossier »).
const STATUT_COMPTE = {
  active: ['Compte actif', 'bg-emerald-400/20 text-emerald-300'],
  pending: ['Compte en attente', 'bg-amber-400/20 text-amber-300'],
  inactive: ['Compte inactif', 'bg-red-400/20 text-red-300'],
};
const SANS_COMPTE = ['Sans compte', 'bg-white/15 text-white/80'];

const ONGLETS = [
  { key: 'apercu', label: traduire("Vue d\'ensemble"), icon: TrendingUp },
  { key: 'dossier', label: traduire('Dossier'), icon: UserRound },
  { key: 'parcours', label: traduire('Parcours'), icon: FileText },
];

// « Voir la fiche » (ADMIN_RH / SUPERADMIN) : le dossier d'un personnel, lecture seule, avec
// exactement les mêmes blocs que « Mon dossier » (voir components/dossier). Le solde de
// congé vient du même calcul backend que celui que la personne voit.
export default function PersonnelFiche() {
  const { id } = useParams();
  const { can } = usePermissions();
  const [personnel, setPersonnel] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [synthese, setSynthese] = useState({ situations: null, contrats: null, solde: null });
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [onglet, setOnglet] = useState('apercu');

  const load = useCallback(() => {
    let active = true;
    Promise.all([
      getPersonnel(id),
      getCarriere(id).catch(() => null),
      getSituationsForPersonnel(id).catch(() => null),
      getHistoriquePersonnel(id).catch(() => null),
      getSuiviConges(id).catch(() => null),
    ])
      .then(([fiche, carriere, situations, contratsRes, suivi]) => {
        if (!active) return;
        setError('');
        setPersonnel(fiche);
        setTimeline(carriere?.timeline || []);
        setSynthese({ situations, contrats: contratsRes?.contrats || null, solde: suivi });
      })
      .catch((err) => active && setError(err.message));
    return () => { active = false; };
  }, [id]);

  useEffect(() => load(), [load]);

  const retour = (
    <Link to="/admin/personnel" className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-navy hover:bg-gray-50 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-700">
      <ArrowLeft size={16} aria-hidden="true" /> Retour à la liste
    </Link>
  );

  if (error) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-4">
        <PageHeader crumbs={[{ label: traduire('Admin RH') }, { label: traduire('Personnel'), path: '/admin/personnel' }, { label: traduire('Fiche') }]} title={traduire('Fiche du personnel')} />
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-status-rejected dark:border-red-900 dark:bg-red-950/30">{error}</p>
        <div>{retour}</div>
      </div>
    );
  }

  if (!personnel) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-6" role="status" aria-label={traduire('Chargement de la fiche')}>
        <Skeleton className="h-8 w-64 rounded" />
        <div className="overflow-hidden rounded-2xl bg-navy p-7">
          <div className="flex items-center gap-5">
            <SkeletonAvatar size={96} className="bg-white/20" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-48 rounded bg-white/20" />
              <Skeleton className="h-3 w-32 rounded bg-white/20" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
              <Skeleton className="mb-4 h-4 w-1/3 rounded" />
              <SkeletonText lines={4} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const nomComplet = [personnel.prenom, personnel.nom].filter(Boolean).join(' ') || personnel.email;
  const photo = photoUrl(personnel.photo_profil);
  const [statutLabel, statutClasses] = personnel.a_un_compte
    ? (STATUT_COMPTE[personnel.statut_compte] || [personnel.statut_compte, SANS_COMPTE[1]])
    : SANS_COMPTE;
  const liens = { carriere: '/admin/carriere', conges: '/admin/conges', contrats: `/admin/contrats?personnel=${personnel.id}` };
  const roles = personnel.roles?.length > 0 ? personnel.roles : (personnel.role ? [personnel.role] : []);
  const typePersonnelLabel = roles.map((r) => roleLabels[r] || r).join(' + ') || null;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-2">
      <PageHeader
        crumbs={[{ label: traduire('Admin RH') }, { label: traduire('Personnel'), path: '/admin/personnel' }, { label: nomComplet }]}
        title={traduire('Fiche du personnel')}
        subtitle={traduire('Dossier, état de carrière, congés et contrat')}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Colonne identité : photo, statut, actions rapides, informations clés — reste
            visible quel que soit l'onglet choisi à droite, comme un panneau de fiche
            client (nom/contact/actions à gauche, contenu détaillé à droite). */}
        <div className="w-full shrink-0 space-y-4 lg:w-80">
          <div className="overflow-hidden rounded-2xl bg-navy shadow-sm">
            <div className="flex flex-col items-center gap-3 p-6 text-center text-white">
              {photo ? (
                <img src={photo} alt={`Photo de ${nomComplet}`} className="h-20 w-20 shrink-0 rounded-full border-4 border-white/20 object-cover" />
              ) : (
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white/20 bg-white/10" aria-label={traduire('Aucune photo de profil')}>
                  <UserRound size={36} aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statutClasses}`}>{statutLabel}</span>
                <h2 className="mt-1.5 break-words text-lg font-bold">{nomComplet}</h2>
                <p className="mt-0.5 text-sm text-white/70">{present(typePersonnelLabel)}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {can('create_personnel') && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-navy px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
              >
                <Pencil size={16} aria-hidden="true" /> Modifier
              </button>
            )}
            {retour}
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-gray-500">{traduire('Informations clés')}</h3>
            <div className="space-y-4">
              <Field icon={Hash} label={traduire('Matricule')} value={personnel.matricule} />
              <Field icon={Briefcase} label={traduire('Fonction')} value={personnel.fonction} />
              <Field icon={Building2} label={traduire('Service')} value={personnel.service} />
              <Field icon={Building2} label={traduire('Direction')} value={personnel.direction} />
              <Field icon={CalendarClock} label={traduire('Date de recrutement')} value={personnel.date_recrutement ? new Date(personnel.date_recrutement).toLocaleDateString('fr-FR') : null} />
              <Field icon={CalendarClock} label={traduire('Ancienneté')} value={seniority(personnel.date_recrutement)} />
            </div>
          </section>
        </div>

        {/* Colonne contenu : un onglet à la fois plutôt qu'un long empilement de cartes —
            même quantité d'information que l'ancienne mise en page, juste moins de
            défilement à la fois. */}
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800" role="tablist" aria-label={traduire('Sections de la fiche')}>
            {ONGLETS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={onglet === key}
                onClick={() => setOnglet(key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  onglet === key ? 'bg-navy text-white dark:bg-gold dark:text-navy' : 'text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={15} aria-hidden="true" /> {label}
              </button>
            ))}
          </div>

          {onglet === 'apercu' && (
            <SyntheseDossier
              personnel={personnel} situations={synthese.situations} contrats={synthese.contrats}
              timeline={timeline} solde={synthese.solde} liens={liens}
            />
          )}
          {onglet === 'dossier' && <InfosDossier personnel={personnel} />}
          {onglet === 'parcours' && <ParcoursCard timeline={timeline} dateRecrutement={personnel.date_recrutement} />}
        </div>
      </div>

      {editing && (
        <ModifierEmployeModal
          personnel={personnel}
          onClose={() => setEditing(false)}
          onSuccess={() => { setEditing(false); load(); }}
        />
      )}
    </div>
  );
}
