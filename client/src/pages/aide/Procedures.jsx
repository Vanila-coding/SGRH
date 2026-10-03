import PageHeader from '../../components/PageHeader';
import { useText } from '../../context/TextContext';
import { traduire } from '../../i18n';

const DEFAUT = `Demande de congé / permission
Remplissez le formulaire dans "Congés", en précisant le type, les dates et le motif. Votre demande part directement au service RH.

Suivi d'une demande
Le statut (en attente, approuvée, refusée) s'affiche dans "Mes demandes". Une notification vous informe dès qu'une décision est prise.

Fiche imprimable
Chaque demande dispose d'un lien "Voir / télécharger la fiche", reprenant le format officiel de l'université.`;

export default function Procedures() {
  const contenu = useText('aide.procedures', DEFAUT, 'Aide');

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader crumbs={[{ label: traduire('Aide') }, { label: traduire('Les procédures') }]} title={traduire('Les procédures')} />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{traduire(contenu)}</p>
      </div>
    </div>
  );
}
