import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, ExternalLink } from 'lucide-react';
import { useText } from '../../context/TextContext';
import { traduire } from '../../i18n';

// Pied de page des pages publiques (Accueil, À propos, Contact, FAQ) uniquement : un
// composant séparé plutôt qu'un enrichissement de Footer.jsx, pour ne rien changer au
// pied de page de Login/Register ni à celui des tableaux de bord ADMIN_RH/SUPERADMIN,
// qui partagent ce même Footer.jsx. Reprend les mêmes clés de texte que Footer.jsx et
// Contact.jsx (catégories « Footer » et « Institution ») : une seule saisie côté
// Personnalisation pour toutes les pages qui en ont besoin.
export default function PublicFooter() {
  const nomApplication = useText('footer.nom_application', 'Université de Mahajanga', 'Footer');
  const description = useText('footer.description', '', 'Footer');
  const copyright = useText('footer.copyright', 'Tous droits réservés', 'Footer');
  const developpeur = useText('footer.developpeur', 'JAOSOA Tanaël Faustin', 'Footer');

  const nomInstitution = useText('institution.nom', 'Université de Mahajanga', 'Institution');
  const adresse = useText('institution.adresse', '', 'Institution');
  const telephone = useText('institution.telephone', '', 'Institution');
  const email = useText('institution.email', '', 'Institution');
  const siteOfficiel = useText('institution.site_officiel', 'https://mahajanga-univ.mg', 'Institution');
  const siteMesupres = useText('footer.lien_mesupres', 'https://mesupres.mg', 'Footer');

  const coordonnees = [
    { icon: MapPin, valeur: adresse },
    { icon: Phone, valeur: telephone },
    { icon: Mail, valeur: email },
  ].filter((c) => c.valeur);

  const liensInstitutionnels = [
    siteOfficiel && { label: traduire('Site de l’Université de Mahajanga'), href: siteOfficiel },
    siteMesupres && { label: traduire('Site MESUPRES'), href: siteMesupres },
  ].filter(Boolean);

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8">
          <div>
            <p className="font-semibold text-navy dark:text-gold mb-1">{traduire(nomInstitution)}</p>
            {description && <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">{traduire(description)}</p>}
          </div>

          {coordonnees.length > 0 && (
            <div className="space-y-1.5">
              {coordonnees.map(({ icon: Icon, valeur }) => (
                <div key={valeur} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Icon size={15} className="text-navy dark:text-gold shrink-0" />
                  <span>{valeur}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} {traduire(nomApplication)} — {traduire(copyright)}
            {developpeur && <span className="text-gray-300 dark:text-gray-600"> {traduire('· Développé par')} {traduire(developpeur)}</span>}
          </p>

          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {liensInstitutionnels.map(({ label, href }) => (
              <a
                key={href}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-gold hover:underline"
              >
                {label}
                <ExternalLink size={11} />
              </a>
            ))}
            <Link to="/mentions-legales" className="text-gray-500 dark:text-gray-400 hover:text-navy dark:hover:text-gold hover:underline">
              {traduire('Mentions légales')}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
