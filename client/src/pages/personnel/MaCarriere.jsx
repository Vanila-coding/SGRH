import { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { getMaCarriere, telechargerJustificatifEvenement, telechargerDocumentDiplome } from '../../services/carriereApi';
import { getMesSituations } from '../../services/situationAdministrativeApi';
import { formatIndiceDisplay } from '../../services/grilleIndiciaireApi';
import { SkeletonPage } from '../../components/ui';

export default function MaCarriere() {
  const [data, setData] = useState(null);
  const [situations, setSituations] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getMaCarriere().then(setData).catch((err) => setError(err.message));
    getMesSituations().then(setSituations).catch(() => {});
  }, []);

  if (error) return <p className="text-status-rejected text-sm">{error}</p>;
  if (!data) return <SkeletonPage cards={3} />;

  const estPE = data.personnel.roles?.length > 0 ? data.personnel.roles.includes('PE') : data.personnel.role === 'PE';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        crumbs={[{ label: 'Mon espace', path: '/dashboard' }, { label: 'Ma carrière' }]}
        title="Ma carrière"
        subtitle="Situation administrative, parcours et diplômes"
      />

      {(situations?.actuelle || estPE) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {situations?.actuelle && (
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${!estPE ? 'lg:col-span-2' : ''}`}>
              <h3 className="font-semibold text-navy dark:text-gold mb-2">Situation administrative</h3>
              <p className="text-sm text-navy dark:text-gray-100 font-medium">{situations.actuelle.libelle}</p>
              <p className="text-xs text-gray-400">Depuis le {new Date(situations.actuelle.date_debut).toLocaleDateString('fr-FR')}</p>
              {situations.actuelle.motif && <p className="text-xs text-gray-400">Motif : {situations.actuelle.motif}</p>}
              {(data.personnel.classe || data.personnel.echelon || data.personnel.indice) && (
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                  {data.personnel.classe && <p>Classe : {data.personnel.classe} {data.personnel.echelon && `— échelon ${data.personnel.echelon}`}</p>}
                  {data.personnel.indice && (
                    <p>
                      Indice : <span className="font-medium text-navy dark:text-gray-200">{data.personnel.indice}</span>
                      {data.personnel.indice_source === 'A_CONFIRMER' && <span className="ml-1 text-amber-600 dark:text-amber-400">(à confirmer)</span>}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {estPE && (
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${!situations?.actuelle ? 'lg:col-span-2' : ''}`}>
              <h3 className="font-semibold text-navy dark:text-gold mb-3">Diplômes et qualifications</h3>
              {data.diplomes.length === 0 && <p className="text-sm text-gray-400">Aucun diplôme enregistré.</p>}
              <div className="space-y-2">
                {data.diplomes.map((d) => (
                  <div key={d.id} className="border-b border-gray-100 dark:border-gray-700 pb-2 last:border-0">
                    <p className="text-sm font-medium text-navy dark:text-gray-100">{d.intitule}</p>
                    <p className="text-xs text-gray-400">{[d.etablissement, d.annee_obtention].filter(Boolean).join(' — ')}</p>
                    {d.document_path && (
                      <button
                        type="button"
                        onClick={() => telechargerDocumentDiplome(d.id, d.document_filename)}
                        className="text-xs text-navy underline"
                      >
                        Voir le document
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="font-semibold text-navy dark:text-gold mb-4">Ma carrière</h3>
        {data.timeline.length === 0 && <p className="text-sm text-gray-400">Aucun événement enregistré pour l'instant.</p>}
        <div className="relative border-l-2 border-gray-200 dark:border-gray-700 pl-4 space-y-4">
          {data.timeline.map((item, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-navy dark:bg-gold" />
              <p className="text-xs text-gray-400">
                {new Date(item.date).toLocaleDateString('fr-FR')}
                {item.dateEffet && ` — effet au ${new Date(item.dateEffet).toLocaleDateString('fr-FR')}`}
              </p>
              <p className="text-sm font-medium text-navy dark:text-gray-100">{item.type}</p>
              {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
              {(item.corps || item.grade || item.classe || item.echelon || item.indice) && (
                <p className="text-xs text-gray-400 mt-0.5">
                  {[item.corps, item.grade, item.classe && `classe ${item.classe}`, item.echelon && `échelon ${item.echelon}`,
                    item.indice && `indice ${formatIndiceDisplay(item.indiceNum ?? item.indice, item.codeGrille)}`].filter(Boolean).join(' · ')}
                </p>
              )}
              {item.indiceSourceTexte && (
                <p className="text-[11px] text-gray-400">Source : {item.indiceSourceTexte}</p>
              )}
              {item.justificatifPath && (
                <button
                  type="button"
                  onClick={() => telechargerJustificatifEvenement(item.id, item.justificatifFilename)}
                  className="text-xs text-navy underline"
                >
                  Voir le justificatif
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}