import { Phone, Mail, MapPin } from 'lucide-react';
import { useText } from '../context/TextContext';
import PublicHeader from '../components/layout/PublicHeader';
import PublicFooter from '../components/layout/PublicFooter';
import { traduire } from '../i18n';

// Reprend volontairement les mêmes clés que Footer.jsx (groupe « Institution ») : les
// coordonnées ne sont saisies qu'une fois par le Superadmin (Personnalisation →
// Informations institutionnelles) et apparaissent partout où elles sont utiles.
export default function Contact() {
  const nomInstitution = useText('institution.nom', 'Université de Mahajanga', 'Institution');
  const adresse = useText('institution.adresse', '', 'Institution');
  const telephone = useText('institution.telephone', '', 'Institution');
  const email = useText('institution.email', '', 'Institution');
  const intro = useText(
    'contact.intro',
    'Une question sur votre dossier, votre compte ou une démarche ? Le service des ressources humaines reste à votre disposition.',
    'Contact'
  );

  const coordonnees = [
    { icon: MapPin, valeur: adresse },
    { icon: Phone, valeur: telephone },
    { icon: Mail, valeur: email },
  ].filter((c) => c.valeur);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950">
      <PublicHeader />

      <section className="flex-1 mx-auto max-w-[1600px] w-full px-4 sm:px-8 py-14 sm:py-20 flex items-center gap-12">
        <div className="max-w-xl">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">{traduire('Contact')}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">{traduire(intro)}</p>

          {coordonnees.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 space-y-4">
              <p className="font-semibold text-navy dark:text-gold">{traduire(nomInstitution)}</p>
              {coordonnees.map(({ icon: Icon, valeur }) => (
                <div key={valeur} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <Icon size={17} className="text-navy dark:text-gold shrink-0" />
                  <span>{valeur}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {traduire('Coordonnées à venir.')}
            </p>
          )}
        </div>

        {/* Illustration décorative (unDraw, licence libre, non attribuée). */}
        <img
          src="/illustrations/contact-us.svg"
          alt=""
          aria-hidden="true"
          className="hidden lg:block w-full max-w-sm xl:max-w-md ml-auto shrink-0"
        />
      </section>

      <PublicFooter />
    </div>
  );
}
