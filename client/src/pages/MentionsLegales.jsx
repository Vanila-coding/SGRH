import { useText } from '../context/TextContext';
import PublicHeader from '../components/layout/PublicHeader';
import PublicFooter from '../components/layout/PublicFooter';
import EditableText from '../components/EditableText';
import { traduire } from '../i18n';

// Contenu volontairement minimal et honnête à l'origine : responsable de publication et
// hébergement étaient marqués « à compléter » plutôt qu'inventés. Ces deux champs sont
// désormais des textes éditables (comme le reste) : le crayon permet au Superadmin de les
// compléter directement, sans attendre une future session.
export default function MentionsLegales() {
  const nomInstitution = useText('institution.nom', 'Université de Mahajanga', 'Institution');
  const adresse = useText('institution.adresse', '', 'Institution');
  const telephone = useText('institution.telephone', '', 'Institution');
  const email = useText('institution.email', '', 'Institution');

  const responsablePublication = useText('mentions.responsable_publication', 'À compléter.', 'Mentions légales');
  const hebergement = useText('mentions.hebergement', 'À compléter.', 'Mentions légales');
  const proprieteIntellectuelle = useText(
    'mentions.propriete_intellectuelle',
    "L'ensemble des contenus de ce site (textes, structure, logo) est protégé. Toute reproduction ou représentation, totale ou partielle, sans autorisation est interdite.",
    'Mentions légales'
  );
  const donneesPersonnelles = useText(
    'mentions.donnees_personnelles',
    "Les informations saisies sur cette plateforme (dossier administratif, congés, documents) sont réservées à la gestion des ressources humaines de l'institution et ne sont accessibles qu'aux personnes autorisées, selon leur rôle.",
    'Mentions légales'
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950">
      <PublicHeader />

      <section className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-8 py-14 sm:py-20">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">{traduire('Mentions légales')}</h1>

        <div className="space-y-8 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{traduire('Éditeur du site')}</h2>
            <p><EditableText value={traduire(nomInstitution)} textKey="institution.nom" /></p>
            {adresse && <p><EditableText value={adresse} textKey="institution.adresse" /></p>}
            {(telephone || email) && (
              <p>{[telephone, email].filter(Boolean).join(' · ')}</p>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{traduire('Responsable de publication')}</h2>
            <p className="text-gray-400 dark:text-gray-500">
              <EditableText value={traduire(responsablePublication)} textKey="mentions.responsable_publication" />
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{traduire('Hébergement')}</h2>
            <p className="text-gray-400 dark:text-gray-500">
              <EditableText value={traduire(hebergement)} textKey="mentions.hebergement" />
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{traduire('Propriété intellectuelle')}</h2>
            <p>
              <EditableText value={traduire(proprieteIntellectuelle)} textKey="mentions.propriete_intellectuelle" multiline />
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{traduire('Données personnelles')}</h2>
            <p>
              <EditableText value={traduire(donneesPersonnelles)} textKey="mentions.donnees_personnelles" multiline />
            </p>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
