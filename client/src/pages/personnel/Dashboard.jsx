import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserRound, FileSignature, CalendarClock, Award, FileStack,
  MessageCircleQuestion, ArrowRight,
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import { getMyPersonnel } from '../../services/personnelApi';
import { getMesContrats } from '../../services/contratApi';
import { getMesSituations } from '../../services/situationAdministrativeApi';
import { getMaCarriere } from '../../services/carriereApi';
import { getMyDemandes, getSoldeConges } from '../../services/congeApi';
import { getMesDocuments } from '../../services/documentApi';
import { getMyNotifications } from '../../services/notificationApi';
import { Card, Badge, Skeleton, SkeletonText, EmptyState } from '../../components/ui';
import { RH_ASSISTANT_QUESTIONS, answerRhQuestion } from '../../utils/rhAssistant';
import { STATUT_CONTRAT_BADGE, STATUT_CONTRAT_LABELS, contratActuel, joursRestants, formatJours } from '../../utils/dossier';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
function photoUrl(photo) {
  if (!photo) return null;
  return `${API_URL.replace(/\/api\/?$/, '')}${photo}`;
}

const CONGE_STATUS_LABELS = { en_attente: 'En attente', approuvee: 'Approuvée', refusee: 'Refusée' };
const DOCUMENT_TYPE_LABELS = { certificat_administratif: 'Certificat administratif', lettre_confirmation: 'Lettre de confirmation', etat_conge: 'État de congé', decision_conge: "Décision d'octroi de congé" };

const QUICK_LINKS = [
  { label: 'Mon profil', to: '/profil', icon: UserRound },
  { label: 'Ma carrière', to: '/carriere', icon: Award },
  { label: 'Mes contrats', to: '/mes-contrats', icon: FileSignature },
  { label: 'Mes congés', to: '/conges', icon: CalendarClock },
  { label: 'Mes documents', to: '/mes-documents', icon: FileStack },
];

const CATEGORY_ICONS = { 'Contrat': FileSignature, 'Congés': CalendarClock, 'Situation / carrière': Award, 'Documents': FileStack };

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Chargement du tableau de bord">
      <PageHeader crumbs={[{ label: 'Mon espace' }]} title="Tableau de bord" subtitle="Vue d'ensemble de votre espace personnel" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-28 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} padding="p-5">
            <Skeleton className="h-3 w-1/2 rounded mb-3" />
            <Skeleton className="h-5 w-2/3 rounded" />
          </Card>
        ))}
      </div>
      <Card>
        <Skeleton className="h-4 w-1/4 rounded mb-4" />
        <SkeletonText lines={3} />
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <Skeleton className="h-4 w-1/3 rounded mb-4" />
          <SkeletonText lines={4} />
        </Card>
        <Card>
          <Skeleton className="h-4 w-1/2 rounded mb-4" />
          <SkeletonText lines={3} />
        </Card>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [assistantKey, setAssistantKey] = useState(null);

  useEffect(() => {
    Promise.all([
      getMyPersonnel(),
      getMesContrats(),
      getMesSituations(),
      getMaCarriere(),
      getMyDemandes(),
      getMesDocuments(),
      getMyNotifications(),
      getSoldeConges().catch(() => null),
    ])
      .then(([personnel, contratsRes, situations, carriere, demandes, documents, notifications, solde]) => {
        setData({
          personnel,
          contrats: contratsRes?.contrats || [],
          situations,
          carriere,
          demandes: demandes || [],
          documents: documents || [],
          notifications: notifications || [],
          solde,
        });
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div>
        <PageHeader crumbs={[{ label: 'Mon espace' }]} title="Tableau de bord" subtitle="Vue d'ensemble de votre espace personnel" />
        <p className="text-status-rejected text-sm">{error}</p>
      </div>
    );
  }

  if (!data) return <DashboardSkeleton />;

  const { personnel, contrats, situations, carriere, demandes, documents, notifications, solde } = data;

  if (!personnel) {
    return (
      <div>
        <PageHeader crumbs={[{ label: 'Mon espace' }]} title="Tableau de bord" subtitle="Vue d'ensemble de votre espace personnel" />
        <EmptyState title="Aucune fiche personnel associée à votre compte." description="Contactez le service RH si cela vous semble anormal." />
      </div>
    );
  }

  const contrat = contratActuel(contrats);
  const jours = contrat?.date_fin ? joursRestants(contrat.date_fin) : null;
  const indice = personnel.indice || (personnel.indice_num ? String(personnel.indice_num) : null);
  const demandesEnCours = demandes.filter((d) => d.status === 'en_attente').length
    + documents.filter((d) => d.statut === 'en_attente').length;
  const progressionSolde = solde?.dateRecrutementConnue && solde.droitsAnnee > 0
    ? Math.max(0, Math.min(100, Math.round((solde.joursPrisAnnee / solde.droitsAnnee) * 100)))
    : null;

  const activite = [
    situations?.actuelle && {
      key: 'situation', to: '/carriere', date: situations.actuelle.date_debut,
      label: `Situation administrative : ${situations.actuelle.libelle}`,
    },
    carriere?.timeline?.[0] && {
      key: 'carriere', to: '/carriere', date: carriere.timeline[0].date,
      label: `Carrière : ${carriere.timeline[0].type}`,
    },
    demandes[0] && {
      key: 'conge', to: '/conges', date: demandes[0].created_at || demandes[0].date_debut,
      label: `Congé ${demandes[0].type_conge} — ${CONGE_STATUS_LABELS[demandes[0].status] || demandes[0].status}`,
    },
    documents[0] && {
      key: 'document', to: `/documents/${documents[0].id}`, date: documents[0].genere_le,
      label: `Document généré : ${DOCUMENT_TYPE_LABELS[documents[0].type_document] || documents[0].type_document}`,
    },
    notifications[0] && {
      key: 'notification', to: '/notifications', date: notifications[0].created_at,
      label: notifications[0].title,
    },
  ].filter(Boolean).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader crumbs={[{ label: 'Mon espace' }]} title="Tableau de bord" subtitle="Vue d'ensemble de votre espace personnel" />

      {/* En-tête personnel */}
      <div className="bg-navy rounded-xl p-6 text-white">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-xl font-bold shrink-0">
            {personnel.photo_profil ? (
              <img src={photoUrl(personnel.photo_profil)} alt="" className="w-full h-full object-cover" />
            ) : (
              (personnel.prenom?.[0] || personnel.email?.[0] || '?').toUpperCase()
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold">Bonjour, {personnel.prenom || personnel.email}</h2>
            <p className="text-sm text-white/70 mt-1">Voici un aperçu de votre situation administrative.</p>
          </div>
        </div>
      </div>

      {/* Chiffre-clé : le solde de congé est l'information la plus consultée côté
          personnel — elle était calculée (getSoldeConges) mais jamais affichée ici. */}
      <Card as={Link} to="/conges" className="block transition hover:shadow-md hover:ring-1 hover:ring-navy/20 dark:hover:ring-gold/20" padding="p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Solde de congés disponible</p>
            {solde ? (
              <p className="mt-1 text-4xl font-bold text-navy dark:text-gold">{formatJours(solde.soldeDisponible)}</p>
            ) : (
              <p className="mt-1 text-sm text-gray-400">Non disponible</p>
            )}
          </div>
          {solde?.dateRecrutementConnue && (
            <div className="flex gap-6 text-sm sm:border-l sm:border-gray-100 sm:pl-6 sm:dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Droits acquis en {solde.annee}</p>
                <p className="font-semibold text-navy dark:text-gray-100">{formatJours(solde.droitsAnnee)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Reliquat</p>
                <p className="font-semibold text-navy dark:text-gray-100">{formatJours(solde.reliquat)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-500">Déjà posés en {solde.annee}</p>
                <p className="font-semibold text-navy dark:text-gray-100">{formatJours(solde.joursPrisAnnee)}</p>
              </div>
            </div>
          )}
        </div>
        {progressionSolde !== null && (
          <div className="mt-4" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressionSolde} aria-label="Part des droits annuels déjà posée">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-gray-700">
              <div className="h-full rounded-full bg-gold" style={{ width: `${progressionSolde}%` }} />
            </div>
          </div>
        )}
      </Card>

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card as={Link} to="/carriere" className="block transition hover:shadow-md hover:ring-1 hover:ring-navy/20 dark:hover:ring-gold/20" padding="p-5">
          <p className="text-xs text-gray-400 mb-1">Situation administrative</p>
          {situations?.actuelle ? (
            <>
              <p className="text-lg font-bold text-navy dark:text-gray-100 truncate">{situations.actuelle.libelle}</p>
              <p className="text-xs text-gray-400 mt-1">
                Depuis le {new Date(situations.actuelle.date_debut).toLocaleDateString('fr-FR')}
              </p>
            </>
          ) : (
            <p className="text-sm text-gray-400">Aucune situation enregistrée</p>
          )}
        </Card>

        <Card as={Link} to="/mes-contrats" className="block transition hover:shadow-md hover:ring-1 hover:ring-navy/20 dark:hover:ring-gold/20" padding="p-5">
          <p className="text-xs text-gray-400 mb-1">Contrat actuel</p>
          {contrat ? (
            <>
              <p className="text-lg font-bold text-navy dark:text-gray-100 truncate">{contrat.type_contrat}</p>
              <Badge variant={STATUT_CONTRAT_BADGE[contrat.statut] || 'neutral'} className="mt-1.5">
                {STATUT_CONTRAT_LABELS[contrat.statut] || contrat.statut}
              </Badge>
            </>
          ) : (
            <p className="text-sm text-gray-400">Aucun contrat enregistré</p>
          )}
        </Card>

        <Card as={Link} to="/mes-contrats" className="block transition hover:shadow-md hover:ring-1 hover:ring-navy/20 dark:hover:ring-gold/20" padding="p-5">
          <p className="text-xs text-gray-400 mb-1">Échéance</p>
          {!contrat ? (
            <p className="text-sm text-gray-400">Aucun contrat enregistré</p>
          ) : !contrat.date_fin ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Sans date d'échéance</p>
          ) : jours < 0 ? (
            <>
              <p className="text-lg font-bold text-status-rejected">{new Date(contrat.date_fin).toLocaleDateString('fr-FR')}</p>
              <p className="text-xs text-status-rejected mt-1">Contrat expiré</p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-navy dark:text-gray-100">{new Date(contrat.date_fin).toLocaleDateString('fr-FR')}</p>
              <p className="text-xs text-gray-400 mt-1">{jours} jour{jours > 1 ? 's' : ''} restant{jours > 1 ? 's' : ''}</p>
            </>
          )}
        </Card>

        <Card as={Link} to="/carriere" className="block transition hover:shadow-md hover:ring-1 hover:ring-navy/20 dark:hover:ring-gold/20" padding="p-5">
          <p className="text-xs text-gray-400 mb-1">Indice actuel</p>
          {indice ? (
            <p className="text-lg font-bold text-navy dark:text-gray-100">{indice}</p>
          ) : (
            <p className="text-sm text-gray-400">Non renseigné</p>
          )}
        </Card>

        <Card as={Link} to="/conges" className="block transition hover:shadow-md hover:ring-1 hover:ring-navy/20 dark:hover:ring-gold/20" padding="p-5">
          <p className="text-xs text-gray-400 mb-1">Demandes en cours</p>
          <p className="text-lg font-bold text-navy dark:text-gray-100">{demandesEnCours}</p>
          <p className="text-xs text-gray-400 mt-1">Congés + documents en attente</p>
        </Card>
      </div>

      {/* Assistant RH : une grille compacte de petites cartes-questions (icône par
          catégorie) plutôt qu'un mur de boutons ou un select caché — la liste reste
          visible et scannable, sans prendre plus de deux rangées. */}
      <Card padding="p-5">
        <div className="flex items-center gap-2 mb-3">
          <MessageCircleQuestion size={18} className="text-navy dark:text-gold shrink-0" />
          <h3 className="font-semibold text-navy dark:text-gold">Assistant RH</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {RH_ASSISTANT_QUESTIONS.map((q) => {
            const Icon = CATEGORY_ICONS[q.category] || MessageCircleQuestion;
            const active = assistantKey === q.key;
            return (
              <button
                key={q.key}
                type="button"
                onClick={() => setAssistantKey(active ? null : q.key)}
                aria-pressed={active}
                className={`flex flex-col items-start gap-1.5 rounded-lg border p-3 text-left transition ${
                  active
                    ? 'border-navy bg-navy/5 dark:border-gold dark:bg-gold/10'
                    : 'border-gray-200 dark:border-gray-600 hover:border-navy/40 dark:hover:border-gold/40'
                }`}
              >
                <Icon size={16} className="text-navy dark:text-gold shrink-0" aria-hidden="true" />
                <span className="text-xs font-medium leading-snug text-gray-700 dark:text-gray-200 line-clamp-2">{q.label}</span>
              </button>
            );
          })}
        </div>

        {assistantKey && (
          <div className="mt-3 bg-navy/5 dark:bg-gold/5 rounded-md p-4" role="status">
            <p className="text-sm text-navy dark:text-gray-100">
              {answerRhQuestion(assistantKey, data)}
            </p>
          </div>
        )}
      </Card>

      {/* Activité récente + Accès rapides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2">
          <h3 className="font-semibold text-navy dark:text-gold mb-3">Activité récente</h3>
          {activite.length === 0 ? (
            <EmptyState title="Aucune activité récente." />
          ) : (
            <div className="space-y-1">
              {activite.map((item) => (
                <Link
                  key={item.key}
                  to={item.to}
                  className="flex items-center justify-between gap-3 px-2 -mx-2 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/40 transition"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-navy dark:text-gray-100 truncate">{item.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{new Date(item.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-semibold text-navy dark:text-gold mb-3">Accès rapides</h3>
          <div className="space-y-1">
            {QUICK_LINKS.map(({ label, to, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <Icon size={16} className="text-navy dark:text-gold shrink-0" />
                {label}
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
