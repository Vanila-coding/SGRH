import { Link } from 'react-router-dom';
import { useText } from '../../context/TextContext';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import { traduire } from '../../i18n';

const LIENS_AIDE = [
  { label: traduire('Par où commencer'), path: '/aide/commencer', permission: null },
  { label: traduire('Vos droits'), path: '/aide/droits', permission: null },
  { label: traduire('Les procédures'), path: '/aide/procedures', permission: null },
  { label: traduire('Signaler un problème'), path: '/aide/signaler', permission: 'signaler_probleme' },
];

export default function Footer() {
  const { user } = useAuth();
  const { can, loading } = usePermissions();
  const nomApplication = useText('footer.nom_application', 'Université de Mahajanga', 'Footer');
  const description = useText('footer.description', '', 'Footer');
  const copyright = useText('footer.copyright', 'Tous droits réservés', 'Footer');
  const developpeur = useText('footer.developpeur', 'JAOSOA Tanaël Faustin', 'Footer');

  const nomInstitution = useText('institution.nom', 'Université de Mahajanga', 'Institution');
  const adresse = useText('institution.adresse', '', 'Institution');
  const telephone = useText('institution.telephone', '', 'Institution');
  const email = useText('institution.email', '', 'Institution');

  const estPersonnel = user?.role === 'PE' || user?.role === 'PAT';

  // Pour l'espace personnel : rappel des informations institutionnelles déjà saisies
  // par le Superadmin (Personnalisation → Informations institutionnelles — n'affiche que
  // ce qui a été réellement renseigné, jamais un espace vide ou une valeur inventée) et
  // accès rapide aux pages d'aide depuis n'importe quel écran, pas seulement depuis Aide.
  // Pour l'admin/superadmin, le pied de page reste inchangé (juste le copyright).
  if (!estPersonnel) {
    return (
      <footer className="text-center text-xs text-gray-400 dark:text-gray-500 py-4 space-y-0.5">
        {description && <p>{traduire(description)}</p>}
        <p>
          © {new Date().getFullYear()} {traduire(nomApplication)} — {traduire(copyright)}
          {developpeur && <span className="text-gray-300 dark:text-gray-600"> {traduire('· Développé par')} {traduire(developpeur)}</span>}
        </p>
      </footer>
    );
  }

  const liensVisibles = LIENS_AIDE.filter((l) => !l.permission || loading || can(l.permission));
  const contact = [telephone, email].filter(Boolean).join(' · ');

  return (
    <footer className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-4 pb-4 text-xs text-gray-400 dark:text-gray-500">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-0.5">
          <p className="font-medium text-gray-500 dark:text-gray-400">{traduire(nomInstitution)}</p>
          {adresse && <p>{traduire(adresse)}</p>}
          {contact && <p>{contact}</p>}
        </div>

        {liensVisibles.length > 0 && (
          <nav aria-label={traduire("Liens d\'aide")} className="flex flex-wrap gap-x-4 gap-y-1 sm:justify-end">
            {liensVisibles.map((l) => (
              <Link key={l.path} to={l.path} className="hover:text-navy dark:hover:text-gold hover:underline">
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      <div className="mt-4 text-center space-y-0.5">
        {description && <p>{traduire(description)}</p>}
        <p>
          © {new Date().getFullYear()} {traduire(nomApplication)} — {traduire(copyright)}
          {developpeur && <span className="text-gray-300 dark:text-gray-600"> {traduire('· Développé par')} {traduire(developpeur)}</span>}
        </p>
      </div>
    </footer>
  );
}
