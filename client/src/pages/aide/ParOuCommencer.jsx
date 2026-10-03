import PageHeader from '../../components/PageHeader';
import { useText } from '../../context/TextContext';

const DEFAUT = `1. Consultez votre profil pour vérifier que vos informations (matricule, fonction, contrat) sont correctes.
2. Utilisez la page Congés pour soumettre une demande — vos informations personnelles se remplissent automatiquement.
3. Surveillez la cloche de notifications : vous y recevrez les décisions sur vos demandes et les annonces de l'administration.
4. En cas de question, contactez le service RH de l'université.`;

export default function ParOuCommencer() {
  const contenu = useText('aide.par_ou_commencer', DEFAUT, 'Aide');

  return (
    <div className="max-w-[1600px] mx-auto">
      <PageHeader
        crumbs={[{ label: 'Aide' }, { label: 'Par où commencer' }]}
        title="Par où commencer ?"
      />
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">{contenu}</p>
      </div>
    </div>
  );
}
