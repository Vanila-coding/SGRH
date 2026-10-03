import PageHeader from '../../components/PageHeader';
import { useText } from '../../context/TextContext';
import { traduire } from '../../i18n';

const DEFAUT = `Tout membre du personnel de l'Université de Mahajanga peut, selon sa situation :
- Bénéficier d'un congé annuel, de permissions et d'autorisations d'absence selon la réglementation en vigueur
- Consulter à tout moment ses informations administratives
- Être informé de toute décision concernant ses demandes
- Faire valoir ses droits en cas de désaccord avec une décision, en s'adressant au service RH

Le détail complet des droits par statut (CDI, CDD, Vacataire, Stagiaire) sera précisé prochainement par l'administration.`;

export default function VosDroits() {
  const contenu = useText('aide.vos_droits', DEFAUT, 'Aide');

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader crumbs={[{ label: traduire('Aide') }, { label: traduire('Vos droits') }]} title={traduire('Vos droits')} />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{traduire(contenu)}</p>
      </div>
    </div>
  );
}
