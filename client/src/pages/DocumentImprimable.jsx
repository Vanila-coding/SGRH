import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getDocument } from '../services/documentApi';
import { Skeleton, SkeletonText } from '../components/ui/Skeleton';
import { DecisionConge, EtatConge } from '../components/documents/DocumentsConge';
import { traduire } from '../i18n';

function fmt(date) {
  if (!date) return '____/____/____';
  return new Date(date).toLocaleDateString('fr-FR');
}

function EnTeteUniversite() {
  return (
    <div className="text-center mb-6 text-sm">
      <p className="text-xs">{traduire("REPOBLIKAN'I MADAGASIKARA")}</p>
      <p className="text-xs italic">{traduire('Fitiavana - Tanindrazana - Fandrosoana')}</p>
      <p className="font-semibold mt-2">{traduire("MINISTÈRE DE L'ENSEIGNEMENT SUPÉRIEUR ET DE LA RECHERCHE SCIENTIFIQUE")}</p>
      <p className="font-semibold">{traduire('UNIVERSITÉ DE MAHAJANGA')}</p>
      <p className="text-xs mt-1">{traduire('DIRECTION DES AFFAIRES ADMINISTRATIVES ET FINANCIÈRES')}</p>
      <p className="text-xs">{traduire('SERVICE PERSONNEL')}</p>
      <div className="border-t border-black mt-3" />
    </div>
  );
}

function CertificatAdministratif({ doc }) {
  const serviceOuDirection = doc.service
    ? `au ${doc.service}`
    : doc.direction ? `à la ${doc.direction}` : '';

  return (
    <>
      <p className="text-sm mb-4">N° {doc.donnees?.numero}</p>
      <h1 className="text-center font-bold underline mb-6 text-lg">{traduire('CERTIFICAT ADMINISTRATIF')}</h1>

      <p className="text-sm mb-4">
        Je soussigné(e), <strong>{doc.donnees?.nomSignataire || '..........................'}</strong>,{' '}
        {doc.donnees?.fonctionSignataire || 'Directeur des Affaires Administratives et Financières'} de l'Université de Mahajanga, certifie par le présent que :
      </p>

      <div className="space-y-1 text-sm mb-4">
        <p className="font-semibold">{doc.prenom} {doc.nom}</p>
        <p>- I.M : {doc.matricule}</p>
        <p>- {doc.categorie || '—'}</p>
        <p>- {doc.grade || '—'}</p>
        <p>- Statut : {doc.corps || '—'}</p>
        <p>- Indice : {doc.indice || '—'}</p>
        <p>- I.B : {doc.chapitre_ib || '—'}</p>
      </div>

      <p className="text-sm mb-2">
        fait partie du Personnel {doc.role === 'PE' ? 'Enseignant' : 'Administratif et Technique'} de l'Université de Mahajanga depuis le :
      </p>
      <p className="text-sm mb-4">
        <strong>{fmt(doc.date_recrutement)}</strong> jusqu'à ce jour, en qualité de{' '}
        <strong>{doc.fonction}</strong> {serviceOuDirection}.
      </p>

      <p className="text-sm">{traduire('En foi de quoi le présent Certificat lui est délivré pour servir et valoir ce que de droit.')}</p>
    </>
  );
}

function LettreConfirmation({ doc }) {
  const serviceOuDirection = doc.service
    ? `au ${doc.service}`
    : doc.direction ? `à la ${doc.direction}` : '';

  return (
    <>
      <h1 className="text-center font-bold underline mb-6 text-lg">{traduire('LETTRE DE CONFIRMATION')}</h1>

      <p className="text-sm mb-4">
        Je soussigné(e), <strong>{doc.donnees?.nomSignataire || '..........................'}</strong>,{' '}
        {doc.donnees?.fonctionSignataire || 'Directeur des Affaires Administratives et Financières'} de l'Université de Mahajanga, confirme par la présente que :
      </p>

      <p className="text-sm mb-4">
        <strong>{doc.prenom} {doc.nom}</strong> est employé(e) définitivement à l'Université de Mahajanga en tant que{' '}
        <strong>{doc.fonction}</strong> {serviceOuDirection} depuis le <strong>{fmt(doc.date_recrutement)}</strong>.
      </p>

      <p className="text-sm mb-4">
        Il/Elle renouvellera son engagement le <strong>{fmt(doc.donnees?.dateRenouvellement)}</strong> et sans suspension de solde.
      </p>

      <p className="text-sm">{traduire('En foi de quoi la présente lettre lui est délivrée pour servir et valoir ce que de droit.')}</p>
    </>
  );
}

export default function DocumentImprimable() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getDocument(id).then(setDoc).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <div className="p-8 text-status-rejected">{error}</div>;

  if (!doc) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-2xl mx-auto bg-white text-slate-800 p-10 shadow" role="status" aria-label={traduire('Chargement du document')}>
          <Skeleton className="h-3 w-2/3 rounded mx-auto mb-2" />
          <Skeleton className="h-3 w-1/2 rounded mx-auto mb-6" />
          <Skeleton className="h-5 w-1/3 rounded mx-auto mb-8" />
          <SkeletonText lines={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:bg-white print:py-0 print:pt-24 print:pb-16">
      <div className="hidden print:block fixed top-4 left-6">
        <img src="/logo-univ-mahajanga.png" alt="Université de Mahajanga" className="h-14 w-14 object-contain" />
      </div>
      <div className="hidden print:flex fixed bottom-3 left-6 right-6 items-center justify-between text-[9px] text-gray-500">
        <span className="flex items-center gap-1.5"><img src="/logo-um-hr.png" alt="UM-HR" className="h-4 w-auto" />Conçu et développé par JAOSOA Tanaël Faustin</span>
        <span>UM-HR</span>
      </div>
      <div className={`${['decision_conge', 'etat_conge'].includes(doc.type_document) ? 'max-w-3xl' : 'max-w-2xl'} mx-auto bg-white text-slate-800 p-10 shadow print:shadow-none`}>
        <div className="flex justify-end mb-6 print:hidden">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-navy text-white rounded-md text-sm font-medium hover:opacity-90"
          >
            Imprimer / Télécharger en PDF
          </button>
        </div>

        <EnTeteUniversite />

        {doc.type_document === 'certificat_administratif' && <CertificatAdministratif doc={doc} />}
        {doc.type_document === 'lettre_confirmation' && <LettreConfirmation doc={doc} />}
        {doc.type_document === 'decision_conge' && <DecisionConge doc={doc} />}
        {doc.type_document === 'etat_conge' && <EtatConge doc={doc} />}

        <p className="text-sm text-right mt-10">Mahajanga, le {fmt(doc.genere_le)}</p>
      </div>
    </div>
  );
}