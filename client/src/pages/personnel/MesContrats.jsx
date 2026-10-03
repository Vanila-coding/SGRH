import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { getMesContrats, telechargerDocumentContrat } from '../../services/contratApi';
import { SkeletonCard } from '../../components/ui';

const STATUT_CONTRAT_LABELS = {
  actif: 'Actif', expire: 'Expiré', renouvele: 'Renouvelé', non_renouvele: 'Non renouvelé', resilie: 'Résilié',
};

export default function MesContrats() {
  const [contrats, setContrats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMesContrats().then(setContrats).catch((err) => setError(err.message));
  }, []);

  async function handleTelecharger(doc) {
    try {
      await telechargerDocumentContrat(doc.id, doc.filename);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !contrats) return <p className="text-status-rejected text-sm">{error}</p>;
  if (!contrats) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={3} />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <PageHeader
        crumbs={[{ label: 'Mon espace', path: '/dashboard' }, { label: 'Mes contrats' }]}
        title="Mes contrats"
        subtitle="Historique de vos contrats et documents associés"
      />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        {error && <p className="text-sm text-status-rejected mb-2">{error}</p>}
        {!contrats.contrats?.length && <p className="text-sm text-gray-400">Aucun contrat enregistré pour l'instant.</p>}
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {contrats.contrats?.map((c) => (
            <div key={c.id} className="border border-gray-100 dark:border-gray-700 rounded-md p-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-navy dark:text-gray-100">
                    {c.type_contrat}
                    {c.numero_renouvellement > 0 && ` — renouvellement n°${c.numero_renouvellement}`}
                  </p>
                  <p className="text-xs text-gray-400">
                    du {new Date(c.date_debut).toLocaleDateString('fr-FR')}
                    {c.date_fin ? ` au ${new Date(c.date_fin).toLocaleDateString('fr-FR')}` : ' (sans date de fin)'}
                  </p>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-navy/10 text-navy dark:bg-gold/10 dark:text-gold shrink-0">
                  {STATUT_CONTRAT_LABELS[c.statut] || c.statut}
                </span>
              </div>
              {c.documents?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {c.documents.map((doc) => (
                    <button
                      key={doc.id} type="button" onClick={() => handleTelecharger(doc)}
                      className="text-xs text-navy dark:text-gold underline"
                    >
                      {doc.type_document === 'avenant' ? 'Avenant' : doc.type_document === 'autre' ? 'Document' : 'Contrat'} — {doc.filename}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
