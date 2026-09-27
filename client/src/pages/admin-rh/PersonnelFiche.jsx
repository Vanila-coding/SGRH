import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, UserRound } from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import ModifierEmployeModal from '../../components/ModifierEmployeModal';
import { InfosDossier, ParcoursCard, SyntheseDossier } from '../../components/dossier/DossierBlocs';
import { usePermissions } from '../../context/PermissionContext';
import { getPersonnel } from '../../services/personnelApi';
import { getCarriere } from '../../services/carriereApi';
import { getSituationsForPersonnel } from '../../services/situationAdministrativeApi';
import { getHistoriquePersonnel } from '../../services/contratApi';
import { getSuiviConges } from '../../services/congeApi';
import { present } from '../../utils/dossier';
import { Skeleton, SkeletonAvatar, SkeletonText } from '../../components/ui';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const photoUrl = (photo) => (photo ? `${API_URL.replace(/\/api\/?$/, '')}${photo}` : null);

// Pastilles lisibles sur le bandeau bleu (mêmes teintes que « Mon dossier »).
const STATUT_COMPTE = {
  active: ['Compte actif', 'bg-emerald-400/20 text-emerald-300'],
  pending: ['Compte en attente', 'bg-amber-400/20 text-amber-300'],
  inactive: ['Compte inactif', 'bg-red-400/20 text-red-300'],
};
const SANS_COMPTE = ['Sans compte', 'bg-white/15 text-white/80'];

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
      <div className="mx-auto max-w-6xl space-y-4">
        <PageHeader crumbs={[{ label: 'Admin RH' }, { label: 'Personnel', path: '/admin/personnel' }, { label: 'Fiche' }]} title="Fiche du personnel" />
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-status-rejected dark:border-red-900 dark:bg-red-950/30">{error}</p>
        <div>{retour}</div>
      </div>
    );
  }

  if (!personnel) {
    return (
      <div className="mx-auto max-w-6xl space-y-6" role="status" aria-label="Chargement de la fiche">
        <Skeleton className="h-8 w-64 rounded" />
        <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-navy/80 p-7">
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

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-2">
      <PageHeader
        crumbs={[{ label: 'Admin RH' }, { label: 'Personnel', path: '/admin/personnel' }, { label: nomComplet }]}
        title="Fiche du personnel"
        subtitle="Dossier, état de carrière, congés et contrat"
      />

      <div className="flex flex-wrap items-center gap-3">
        {retour}
        {can('create_personnel') && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 rounded-md bg-navy px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Pencil size={16} aria-hidden="true" /> Modifier la fiche
          </button>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-navy to-navy/80 shadow-sm">
        <div className="flex flex-col items-center gap-4 p-5 text-center text-white sm:flex-row sm:p-7 sm:text-left">
          {photo ? (
            <img src={photo} alt={`Photo de ${nomComplet}`} className="h-24 w-24 shrink-0 rounded-full border-4 border-white/20 object-cover" />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white/20 bg-white/10" aria-label="Aucune photo de profil">
              <UserRound size={44} aria-hidden="true" />
            </div>
          )}
          <div className="min-w-0">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statutClasses}`}>{statutLabel}</span>
            <h2 className="mt-1.5 break-words text-xl font-bold">{nomComplet}</h2>
            <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-white/80 sm:justify-start">
              <span>Matricule : {present(personnel.matricule)}</span>
              <span>Fonction : {present(personnel.fonction)}</span>
              <span>Catégorie : {present((personnel.roles?.length > 0 ? personnel.roles : [personnel.role].filter(Boolean)).join(' + '))}</span>
            </div>
          </div>
        </div>
      </div>

      <InfosDossier personnel={personnel} />
      <SyntheseDossier
        personnel={personnel} situations={synthese.situations} contrats={synthese.contrats}
        timeline={timeline} solde={synthese.solde} liens={liens}
      />
      <ParcoursCard timeline={timeline} dateRecrutement={personnel.date_recrutement} />

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
