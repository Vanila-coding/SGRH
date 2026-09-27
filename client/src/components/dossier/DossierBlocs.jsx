// Blocs du dossier d'un personnel, partagés entre « Mon dossier » (le personnel lui-même) et
// « Voir la fiche » (RH / Super admin) : les deux côtés affichent exactement les mêmes
// informations, calculées de la même façon (voir utils/dossier.js).
import { Link } from 'react-router-dom';
import {
  Award, Briefcase, Building2, Calendar, CalendarCheck, CalendarClock, FileSignature, FileText,
  Globe2, GraduationCap, Hash, Heart, Home, Mail, MapPin, Phone, ShieldCheck,
  TrendingUp, UserCog, UserRound, Users,
} from 'lucide-react';
import { Badge } from '../ui';
import {
  CLASSE_LABELS, SEUIL_ECHEANCE_PROCHE_JOURS, STATUT_CONTRAT_BADGE, STATUT_CONTRAT_LABELS,
  contratActuel, dureeRestante, formatDate, formatJours, joursRestants, present, progressionContrat, roleLabels, seniority,
} from '../../utils/dossier';

export function Field({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy/5 text-navy dark:bg-gold/10 dark:text-gold">
        <Icon size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 dark:text-gray-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-slate-800 dark:text-gray-100">{present(value)}</p>
      </div>
    </div>
  );
}

export function Card({ icon: Icon, title, action, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold text-navy dark:text-gold">
          <Icon size={18} aria-hidden="true" /> {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}


// Informations personnelles et administratives.
export function InfosDossier({ personnel }) {
  const contractStatus = personnel.contrat_permanent ? 'Permanent' : personnel.type_contrat;
  // `roles` (personnel_roles, 0 à 2 valeurs) fait foi ; à défaut (fiches pas encore
  // migrées), on retombe sur l'ancien champ `role` unique pour ne rien casser.
  const roles = personnel.roles?.length > 0 ? personnel.roles : (personnel.role ? [personnel.role] : []);
  const typePersonnelLabel = roles.map((r) => roleLabels[r] || r).join(' + ') || null;
  return (
    <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card icon={Users} title="Informations personnelles">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <Field icon={UserRound} label="Nom" value={personnel.nom} />
              <Field icon={UserRound} label="Prénom" value={personnel.prenom} />
              <Field icon={Mail} label="E-mail" value={personnel.email} />
              <Field icon={Users} label="Sexe" value={personnel.sexe} />
              <Field icon={Calendar} label="Date de naissance" value={formatDate(personnel.date_naissance)} />
              <Field icon={MapPin} label="Lieu de naissance" value={personnel.lieu_naissance} />
              <Field icon={Globe2} label="Nationalité" value={personnel.nationalite} />
              <Field icon={Heart} label="Situation familiale" value={personnel.situation_familiale} />
              <Field icon={Phone} label="Téléphone" value={personnel.telephone} />
              <Field icon={Home} label="Adresse" value={personnel.adresse} />
            </div>
          </Card>

          <Card icon={Briefcase} title="Informations administratives">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <Field icon={Hash} label="Matricule" value={personnel.matricule} />
              <Field icon={Users} label="Type de personnel" value={typePersonnelLabel} />
              <Field icon={ShieldCheck} label="Type de contrat" value={contractStatus} />
              <Field icon={Briefcase} label="Fonction" value={personnel.fonction} />
              <Field icon={Briefcase} label="Poste" value={personnel.poste} />
              <Field icon={Building2} label="Service" value={personnel.service} />
              <Field icon={Building2} label="Direction" value={personnel.direction} />
              <Field icon={UserRound} label="Supérieur hiérarchique" value={personnel.responsable_hierarchique} />
              <Field icon={CalendarClock} label="Date de prise de fonction" value={formatDate(personnel.date_prise_fonction)} />
              <Field icon={CalendarClock} label="Ancienneté" value={seniority(personnel.date_recrutement)} />
            </div>
          </Card>
        </div>

        {roles.includes('PE') && (
          <Card icon={GraduationCap} title="Informations enseignant (PE)">
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
              <Field icon={Building2} label="Établissement" value={personnel.etablissement_nom} />
              <Field icon={ShieldCheck} label="Corps" value={personnel.corps_pe} />
              <Field icon={Award} label="Diplôme" value={personnel.diplome} />
              <Field icon={GraduationCap} label="Spécialité" value={personnel.specialite} />
            </div>
          </Card>
        )}
    </div>
  );
}

const LIENS_PERSONNEL = { carriere: '/carriere', conges: '/conges', contrats: '/mes-contrats' };

// État de carrière, congé restant, durée de contrat restante. `solde` : GET /conges/solde
// (côté personnel) ou GET /conges/suivi/:id (côté RH) — mêmes champs, même calcul backend.
export function SyntheseDossier({ personnel, situations, contrats, timeline, solde, liens = LIENS_PERSONNEL }) {
  const situationActuelle = situations?.actuelle || null;
  const derniereEvolution = timeline[0] || null;
  const indice = personnel.indice || (personnel.indice_num ? String(personnel.indice_num) : null);
  const classeEchelon = [CLASSE_LABELS[personnel.classe] || personnel.classe, personnel.echelon ? `échelon ${personnel.echelon}` : null]
    .filter(Boolean).join(', ');
  const categorie = personnel.categorie_appellation
    ? `${personnel.categorie_appellation}${personnel.categorie_code ? ` (${personnel.categorie_code})` : ''}`
    : null;

  // Contrat : les contrats enregistrés font foi ; à défaut, les champs historiques de la fiche.
  const contratEnregistre = contratActuel(contrats);
  const contratInfo = contratEnregistre
    ? {
      type: contratEnregistre.type_contrat, statut: contratEnregistre.statut, dateDebut: contratEnregistre.date_debut,
      dateFin: contratEnregistre.date_fin, renouvellements: contratEnregistre.numero_renouvellement, permanent: false,
    }
    : (personnel.contrat_permanent || personnel.type_contrat || personnel.date_echeance_contrat)
      ? { type: personnel.type_contrat, statut: null, dateDebut: null, dateFin: personnel.date_echeance_contrat, renouvellements: 0, permanent: !!personnel.contrat_permanent }
      : null;
  const joursContrat = contratInfo?.dateFin ? joursRestants(contratInfo.dateFin) : null;
  const progression = contratInfo ? progressionContrat(contratInfo.dateDebut, contratInfo.dateFin) : null;

  // Synthèse : état de carrière, congé restant, durée de contrat restante.
  return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3" data-testid="synthese-dossier">
        <Card icon={TrendingUp} title="État de carrière" action={<Link to={liens.carriere} className="text-xs font-medium text-navy underline dark:text-gold">Détail</Link>}>
          <div className="space-y-4">
            <Field icon={ShieldCheck} label="Statut" value={personnel.corps} />
            <Field icon={GraduationCap} label="Catégorie professionnelle" value={categorie} />
            <Field icon={Award} label="Grade" value={personnel.grade} />
            {classeEchelon && <Field icon={Award} label="Classe et échelon" value={classeEchelon} />}
            <Field icon={Hash} label="Indice" value={indice} />
            <Field icon={UserCog} label="Situation administrative actuelle"
              value={situationActuelle ? `${situationActuelle.libelle} (depuis le ${formatDate(situationActuelle.date_debut)})` : (situations ? null : 'Non disponible')} />
            <Field icon={FileText} label="Dernière évolution de carrière"
              value={derniereEvolution ? `${derniereEvolution.type} — ${formatDate(derniereEvolution.date)}` : null} />
          </div>
        </Card>

        <Card icon={CalendarCheck} title="Congés" action={<Link to={liens.conges} className="text-xs font-medium text-navy underline dark:text-gold">Mes congés</Link>}>
          {solde ? (
            <div>
              <p className="text-xs text-slate-500 dark:text-gray-400">Congé annuel restant</p>
              <p className="mt-1 text-3xl font-bold text-navy dark:text-gold" data-testid="solde-restant">{formatJours(solde.soldeDisponible)}</p>
              {solde.dateRecrutementConnue ? (
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-slate-500 dark:text-gray-400">Droits acquis en {solde.annee}</dt><dd className="whitespace-nowrap font-semibold text-slate-800 dark:text-gray-100">{formatJours(solde.droitsAnnee)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500 dark:text-gray-400">Reliquat des années précédentes</dt><dd className="whitespace-nowrap font-semibold text-slate-800 dark:text-gray-100">{formatJours(solde.reliquat)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-slate-500 dark:text-gray-400">Déjà posés en {solde.annee}</dt><dd className="whitespace-nowrap font-semibold text-slate-800 dark:text-gray-100">{formatJours(solde.joursPrisAnnee)}</dd></div>
                </dl>
              ) : (
                <p className="mt-3 text-xs text-slate-500 dark:text-gray-400">
                  Date de recrutement non renseignée : les droits de l'année ne peuvent pas être calculés automatiquement. Votre solde actuel est conservé comme solde d'ouverture.
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-gray-400">Solde de congés non disponible.</p>
          )}
        </Card>

        <Card icon={FileSignature} title="Contrat" action={<Link to={liens.contrats} className="text-xs font-medium text-navy underline dark:text-gold">Mes contrats</Link>}>
          {!contratInfo ? (
            <p className="text-sm text-slate-500 dark:text-gray-400">Aucun contrat enregistré.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-lg font-bold text-navy dark:text-gray-100">{present(contratInfo.type)}{contratInfo.permanent ? ' — permanent' : ''}</p>
                {contratInfo.statut && (
                  <Badge variant={STATUT_CONTRAT_BADGE[contratInfo.statut] || 'neutral'}>{STATUT_CONTRAT_LABELS[contratInfo.statut] || contratInfo.statut}</Badge>
                )}
              </div>
              {contratInfo.dateDebut && <Field icon={CalendarClock} label="Début du contrat" value={formatDate(contratInfo.dateDebut)} />}
              {contratInfo.renouvellements > 0 && (
                <Field icon={FileSignature} label="Renouvellements" value={`${contratInfo.renouvellements} renouvellement${contratInfo.renouvellements > 1 ? 's' : ''}`} />
              )}
              {contratInfo.permanent || !contratInfo.dateFin ? (
                <Field icon={CalendarClock} label="Durée restante" value="Aucune échéance (sans date de fin)" />
              ) : joursContrat < 0 ? (
                <div>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Échéance</p>
                  <p className="mt-0.5 text-sm font-semibold text-status-rejected">Contrat expiré le {formatDate(contratInfo.dateFin)}</p>
                </div>
              ) : (
                <div data-testid="duree-contrat-restante">
                  <p className="text-xs text-slate-500 dark:text-gray-400">Durée restante avant le {formatDate(contratInfo.dateFin)}</p>
                  <p className="mt-0.5 text-lg font-bold text-navy dark:text-gold">{dureeRestante(contratInfo.dateFin) || "Dernier jour aujourd'hui"}</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">soit {joursContrat} jour{joursContrat > 1 ? 's' : ''}</p>
                  {joursContrat <= SEUIL_ECHEANCE_PROCHE_JOURS && (
                    <Badge variant="pending" className="mt-2">Échéance dans moins de 6 mois</Badge>
                  )}
                  {progression !== null && (
                    <div className="mt-3" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progression} aria-label="Part du contrat écoulée">
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-gray-700">
                        <div className="h-full rounded-full bg-gold" style={{ width: `${progression}%` }} />
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500 dark:text-gray-400">{progression} % du contrat écoulé</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
  );
}

export function ParcoursCard({ timeline, dateRecrutement }) {
  return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold tracking-wide text-navy dark:border-gray-700 dark:bg-gray-800 dark:text-gold sm:px-6">
          <FileText size={18} aria-hidden="true" /> Parcours professionnel
        </h2>
        <div className="p-5 sm:p-6">
          {timeline.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-gray-400">Aucune information de carrière n'est actuellement enregistrée.</p>
          ) : (
            <ol className="space-y-4 border-l-2 border-slate-200 pl-5 dark:border-gray-700">
              {timeline.map((item, index) => (
                <li key={`${item.source}-${item.date}-${index}`} className="relative">
                  <span className="absolute -left-[30px] top-1 h-3 w-3 rounded-full bg-gold ring-4 ring-white dark:ring-gray-800" />
                  <p className="text-xs text-slate-500 dark:text-gray-400">{formatDate(item.date)}</p>
                  <p className="mt-0.5 text-sm font-semibold text-navy dark:text-gray-100">{item.type}</p>
                  {item.description && <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">{item.description}</p>}
                </li>
              ))}
            </ol>
          )}
          <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-600 dark:border-gray-700 dark:text-gray-300">
            <FileText size={17} className="text-gold" aria-hidden="true" /> Date de recrutement : <span className="font-medium">{formatDate(dateRecrutement)}</span>
          </div>
        </div>
      </section>
  );
}
