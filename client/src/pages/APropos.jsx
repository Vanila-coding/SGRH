import { ShieldCheck, QrCode, Clock, MapPinOff, ListChecks } from 'lucide-react';
import { useText } from '../context/TextContext';
import PublicHeader from '../components/layout/PublicHeader';
import Footer from '../components/layout/Footer';
import { traduire } from '../i18n';

const POINTS_BREF = [
  { icon: Clock, texte: traduire('Un accès centralisé, disponible à tout moment') },
  { icon: MapPinOff, texte: traduire('Moins de déplacements pour les démarches administratives') },
  { icon: ListChecks, texte: traduire('Une meilleure traçabilité des décisions et des actions') },
  { icon: QrCode, texte: traduire('Des documents authentifiables, pour plus de confiance') },
];

export default function APropos() {
  const titre = useText('apropos.titre', "À propos de l'espace RH", 'À propos');
  const intro = useText(
    'apropos.intro',
    "Dans un contexte de transformation numérique des services publics, l'Université de Mahajanga a mis en place cette plateforme pour centraliser, sécuriser et simplifier la gestion administrative de son personnel.",
    'À propos'
  );
  const description = useText(
    'apropos.description',
    "L'espace RH regroupe en un seul endroit les informations du personnel enseignant (PE) et du personnel administratif et technique (PAT) : dossier individuel, carrière, contrats, congés et documents administratifs. Chaque utilisateur n'accède qu'aux informations et fonctionnalités correspondant à son rôle.",
    'À propos'
  );
  const securiteTitre = useText('apropos.securite_titre', 'Une plateforme sécurisée', 'À propos');
  const securiteTexte = useText(
    'apropos.securite_texte',
    "L'accès est protégé par un système d'authentification et une gestion fine des permissions, par rôle. Les documents administratifs générés par la plateforme peuvent être authentifiés grâce à un QR code, pour en garantir l'origine.",
    'À propos'
  );
  const brefTitre = useText('apropos.bref_titre', 'En bref', 'À propos');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950">
      <PublicHeader />

      <section className="mx-auto max-w-[1600px] w-full px-4 sm:px-8 py-14 sm:py-20">
        <div className="flex items-center gap-12 mb-12">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">{traduire(titre)}</h1>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{traduire(intro)}</p>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{traduire(description)}</p>
          </div>

          {/* Illustration décorative (unDraw, licence libre, non attribuée). */}
          <img
            src="/illustrations/about-us-page.svg"
            alt=""
            aria-hidden="true"
            className="hidden lg:block w-full max-w-sm xl:max-w-md ml-auto shrink-0 rounded-xl shadow"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6 sm:p-8 max-w-2xl flex gap-4 items-start mb-12">
          <div className="w-11 h-11 rounded-xl bg-navy/10 dark:bg-gold/10 flex items-center justify-center shrink-0">
            <ShieldCheck size={20} className="text-navy dark:text-gold" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{traduire(securiteTitre)}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{traduire(securiteTexte)}</p>
          </div>
        </div>

        <div className="bg-navy rounded-2xl p-6 sm:p-8">
          <h2 className="text-white font-semibold mb-5">{traduire(brefTitre)}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {POINTS_BREF.map(({ icon: Icon, texte }) => (
              <div key={texte} className="flex items-center gap-3">
                <Icon size={18} className="text-gold shrink-0" />
                <p className="text-sm text-white/80">{texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
}
