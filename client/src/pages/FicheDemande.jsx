import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDemandeDetails } from '../services/congeApi';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';

const STATUS_LABELS = { en_attente: 'En attente', approuvee: 'Approuvée', refusee: 'Refusée' };

function fmt(date) {
  if (!date) return '____/____/____';
  return new Date(date).toLocaleDateString('fr-FR');
}

function jours(n) {
  if (n === null || n === undefined) return '—';
  return `${Number(n).toLocaleString('fr-FR')} jour(s)`;
}

// Vérification du secrétariat (pièces, cohérence) : une étape purement formelle, avant
// même l'avis du chef de service — pas de QR ici, ce n'est pas une décision.
function AvisSecretariat({ demande }) {
  if (demande.decision_secretariat === 'approuvee') {
    return (
      <p className="text-xs">
        <span className="font-semibold">Vérifié par le secrétariat</span>
        {demande.decision_secretariat_le ? ` — le ${fmt(demande.decision_secretariat_le)}` : ''}
        {demande.avis_secretariat ? ` (${demande.avis_secretariat})` : ''}
      </p>
    );
  }
  if (demande.decision_secretariat === 'refusee') {
    return <p className="text-xs">Renvoyée par le secrétariat : {demande.avis_secretariat || 'motif non précisé'}</p>;
  }
  return <p className="text-xs">En attente de vérification par le secrétariat.</p>;
}

// Avis du chef de service : le QR (authentifiant, vérifiable publiquement) remplace la
// signature quand l'avis est favorable ; en cas de refus, le motif le remplace.
function AvisChefService({ demande }) {
  if (demande.decision_intermediaire === 'approuvee' && !demande.avis_qr) {
    // Avis favorable sans QR (clé de signature absente côté serveur) : avis en texte.
    return (
      <div>
        <p className="font-semibold">Avis favorable</p>
        <p className="text-xs">
          {[demande.validateur_prenom, demande.validateur_nom].filter(Boolean).join(' ')}
          {demande.validateur_fonction ? `, ${demande.validateur_fonction}` : ''}
          {demande.decision_intermediaire_le ? ` — le ${fmt(demande.decision_intermediaire_le)}` : ''}
        </p>
        {demande.avis_chef_service && <p className="text-xs mt-1">{demande.avis_chef_service}</p>}
        <p className="text-[10px] text-gray-500 mt-1 print:text-gray-600">Vérification par QR code momentanément indisponible.</p>
      </div>
    );
  }
  if (demande.decision_intermediaire === 'approuvee' && demande.avis_qr) {
    return (
      <div>
        <img src={demande.avis_qr.dataUrl} alt="QR code de vérification de l'avis du chef de service" className="w-28 h-28" />
        <p className="mt-1 font-semibold">Avis favorable</p>
        <p className="text-xs">
          {[demande.validateur_prenom, demande.validateur_nom].filter(Boolean).join(' ')}
          {demande.validateur_fonction ? `, ${demande.validateur_fonction}` : ''}
          {demande.decision_intermediaire_le ? ` — le ${fmt(demande.decision_intermediaire_le)}` : ''}
        </p>
        {demande.avis_chef_service && <p className="text-xs mt-1">{demande.avis_chef_service}</p>}
        <p className="text-[10px] text-gray-500 mt-1 print:text-gray-600">Scanner le QR code pour vérifier l'authenticité de cet avis.</p>
      </div>
    );
  }
  if (demande.decision_intermediaire === 'refusee') {
    return (
      <div>
        <p className="font-semibold">Avis défavorable</p>
        <p>Motif : {demande.avis_chef_service || 'non précisé'}</p>
      </div>
    );
  }
  if (demande.decision_intermediaire === 'en_attente') return <p>En attente de l'avis du chef de service.</p>;
  return <p>Aucun chef de service désigné : demande transmise directement au Service du Personnel.</p>;
}

export default function FicheDemande() {
  const { id } = useParams();
  const [demande, setDemande] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDemandeDetails(id).then(setDemande).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="p-8 text-status-rejected">{error}</div>;

  if (!demande) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-2xl mx-auto bg-white p-10 shadow" role="status" aria-label="Chargement de la demande">
          <Skeleton className="h-3 w-2/3 rounded mx-auto mb-2" />
          <Skeleton className="h-3 w-1/2 rounded mx-auto mb-6" />
          <Skeleton className="h-5 w-1/3 rounded mx-auto mb-8" />
          <SkeletonText lines={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto bg-white p-10 shadow print:shadow-none">
        <div className="flex justify-end mb-6 print:hidden">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-navy text-white rounded-md text-sm font-medium hover:opacity-90"
          >
            Imprimer / Télécharger en PDF
          </button>
        </div>

        <div className="text-center mb-6">
          <p className="text-xs">REPOBLIKAN'I MADAGASIKARA</p>
          <p className="text-xs italic">Fitiavana - Tanindrazana - Fandrosoana</p>
          <p className="text-sm font-semibold mt-2">MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR ET DE LA RECHERCHE SCIENTIFIQUE</p>
          <p className="text-sm font-semibold">UNIVERSITÉ DE MAHAJANGA</p>
          {(demande.service || demande.direction) && <p className="text-xs mt-1">{demande.service || demande.direction}</p>}
        </div>

        <h1 className="text-center font-bold underline mb-6">
          DEMANDE DE : {demande.type_conge.toUpperCase()}
        </h1>

        <div className="space-y-2 text-sm">
          <p><span className="font-semibold underline">MATRICULE</span> : {demande.matricule}</p>
          <p><span className="font-semibold underline">NOM ET PRÉNOM(S)</span> : {demande.nom} {demande.prenom}</p>
          <p><span className="font-semibold underline">FONCTION</span> : {demande.fonction || '—'}</p>
          {/* Corps = catégorie professionnelle ; Statut = EFA / ELD / Fonctionnaire (champ personnel.corps) */}
          <p><span className="font-semibold underline">CORPS ET GRADE</span> : {[demande.categorie, demande.grade].filter(Boolean).join(' ; ') || '—'}</p>
          <p><span className="font-semibold underline">STATUT</span> : {demande.corps || '—'}</p>
          <p><span className="font-semibold underline">MOTIF</span> : {demande.motif || '—'}</p>
          <p><span className="font-semibold underline">LIEU DE JOUISSANCE</span> : {demande.lieu_jouissance || '—'}</p>
          <p><span className="font-semibold underline">A COMPTER DU</span> : {fmt(demande.date_debut)} au {fmt(demande.date_fin)}</p>
          <p><span className="font-semibold underline">NOMBRE DE JOURS DEMANDÉ</span> : {demande.nombre_jours} jour(s)</p>
          <p><span className="font-semibold underline">DATE DE REPRISE DE SERVICE</span> : {fmt(demande.date_reprise_service)}</p>
          <p><span className="font-semibold underline">REMPLAÇANT(E)</span> : {demande.remplacant || '—'}</p>
        </div>

        <div className="mt-10 text-sm">
          <AvisSecretariat demande={demande} />
        </div>

        <div className="grid grid-cols-2 gap-6 mt-4 text-sm">
          <div>
            <p className="font-semibold underline mb-8">AVIS DU CHEF DE SERVICE</p>
            <AvisChefService demande={demande} />
          </div>
          <div className="text-right">
            <p>Mahajanga, le {fmt(demande.created_at)}</p>
            <p className="mt-8">L'intéressé</p>
            <p className="mt-6">{demande.prenom} {demande.nom}</p>
          </div>
        </div>

        {/* Renseigné automatiquement par le système à la date de la demande (Service du Personnel). */}
        <div className="mt-8 pt-4 border-t text-sm" data-testid="bloc-service-personnel">
          <p className="font-semibold underline mb-2">A REMPLIR PAR LE SERVICE DU PERSONNEL</p>
          <p>
            SITUATION DE(S) CONGÉ(S) AU TITRE DE(S) L'ANNÉE(S) :{' '}
            {demande.type_conge !== 'Congé annuel'
              ? 'sans imputation sur le congé annuel'
              : (demande.imputations || []).length === 0
                ? '—'
                : demande.imputations.map((i) => `${i.annee ?? "solde d'ouverture antérieur"} (${jours(i.jours)})`).join(', ')}
          </p>
          <p className="mt-2">A encore droit : <strong>{jours(demande.solde_avant)}</strong></p>
          <p>Nombre de jours demandé : <strong>{jours(demande.nombre_jours)}</strong></p>
          <p>Nombre de jours restant à la date de la demande : <strong>{jours(demande.solde_apres)}</strong></p>
        </div>

        <div className="mt-6 pt-4 border-t text-sm">
          <p className="font-semibold">
            Statut : <span className={
              demande.status === 'approuvee' ? 'text-status-approved' :
              demande.status === 'refusee' ? 'text-status-rejected' : 'text-status-pending'
            }>{STATUS_LABELS[demande.status]}</span>
          </p>
        </div>
      </div>
    </div>
  );
}