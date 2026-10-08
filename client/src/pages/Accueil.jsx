import { Link } from 'react-router-dom';
import { LogIn, UserPlus, IdCard, CalendarCheck, FileCheck2, BellRing, ShieldCheck, QrCode, ListChecks } from 'lucide-react';
import { useText } from '../context/TextContext';
import PublicHeader from '../components/layout/PublicHeader';
import Footer from '../components/layout/Footer';
import { traduire } from '../i18n';

const ICONES_FONCTIONNALITES = [IdCard, CalendarCheck, FileCheck2, BellRing];

const POINTS_CONFIANCE = [
  { icon: ShieldCheck, texte: traduire('Accès sécurisé, par rôle et par permission') },
  { icon: QrCode, texte: traduire('Documents authentifiables par QR code') },
  { icon: ListChecks, texte: traduire('Chaque action est tracée dans un journal d’audit') },
];

export default function Accueil() {
  const slogan = useText('accueil.slogan', 'Excellence • Intégrité • Innovation', 'Accueil');
  const titre = useText('accueil.titre', "Bienvenue sur l'espace RH", 'Accueil');
  const description = useText(
    'accueil.description',
    "La plateforme de gestion des ressources humaines de l'Université de Mahajanga. Un seul espace pour votre dossier, vos congés, vos documents et vos démarches administratives.",
    'Accueil'
  );
  const accrocheFonctionnalites = useText(
    'accueil.accroche_fonctionnalites',
    "Avec l'espace RH",
    'Accueil'
  );

  // Hooks non appelés dans une boucle (règle des hooks) : les 4 cartes sont dépliées
  // explicitement, puis rassemblées dans un tableau pour le rendu.
  const feature1Titre = useText('accueil.feature1_titre', 'Mon dossier administratif', 'Accueil');
  const feature1Description = useText(
    'accueil.feature1_description',
    'Carrière, contrats, informations personnelles : tout votre dossier en un seul endroit.',
    'Accueil'
  );
  const feature2Titre = useText('accueil.feature2_titre', 'Mes congés', 'Accueil');
  const feature2Description = useText(
    'accueil.feature2_description',
    'Déposez une demande, suivez le circuit de validation et consultez votre solde en temps réel.',
    'Accueil'
  );
  const feature3Titre = useText('accueil.feature3_titre', 'Mes documents', 'Accueil');
  const feature3Description = useText(
    'accueil.feature3_description',
    'Demandez vos documents administratifs, générés avec une authenticité vérifiable par QR code.',
    'Accueil'
  );
  const feature4Titre = useText('accueil.feature4_titre', 'Notifications', 'Accueil');
  const feature4Description = useText(
    'accueil.feature4_description',
    'Restez informé de l’avancement de vos démarches, à chaque étape.',
    'Accueil'
  );

  const fonctionnalites = [
    { titre: feature1Titre, description: feature1Description },
    { titre: feature2Titre, description: feature2Description },
    { titre: feature3Titre, description: feature3Description },
    { titre: feature4Titre, description: feature4Description },
  ].map((f, i) => ({ ...f, icon: ICONES_FONCTIONNALITES[i] }));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950">
      <PublicHeader />

      <section className="relative overflow-hidden bg-navy">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-16 sm:py-24 flex items-center gap-12">
          <div className="max-w-2xl">
            {slogan && <p className="text-gold text-xs font-semibold uppercase tracking-wide mb-3">{traduire(slogan)}</p>}
            <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight mb-5">{traduire(titre)}</h1>
            <p className="text-white/80 text-base sm:text-lg mb-8 max-w-xl">{traduire(description)}</p>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-gold text-navy px-6 py-3 font-semibold hover:opacity-90 transition"
              >
                <LogIn size={18} />
                {traduire('Se connecter')}
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 text-white px-6 py-3 font-semibold hover:bg-white/10 transition"
              >
                <UserPlus size={18} />
                {traduire('Créer mon compte')}
              </Link>
            </div>
          </div>

          {/* Illustration décorative (unDraw, licence libre, non attribuée) : un écran de
              gestion de personnel avec des droits d'édition/consultation par ligne — reprend
              visuellement ce que fait réellement la plateforme (liste du personnel + droits
              par rôle), masquée sur petit écran pour ne pas alourdir le bandeau d'accroche. */}
          <img
            src="/illustrations/team-permissions.svg"
            alt=""
            aria-hidden="true"
            className="hidden lg:block w-full max-w-md xl:max-w-lg shrink-0 ml-auto"
          />
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-4 sm:px-8 py-14 sm:py-20 w-full">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 text-center mb-10">
          {traduire(accrocheFonctionnalites)}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {fonctionnalites.map(({ icon: Icon, titre: titreFeature, description: descFeature }) => (
            <div key={titreFeature} className="bg-white dark:bg-gray-800 rounded-2xl shadow p-6">
              <div className="w-11 h-11 rounded-xl bg-navy/10 dark:bg-gold/10 flex items-center justify-center mb-4">
                <Icon size={20} className="text-navy dark:text-gold" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5">{traduire(titreFeature)}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{traduire(descFeature)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-navy/5 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {POINTS_CONFIANCE.map(({ icon: Icon, texte }) => (
              <div key={texte} className="flex items-center gap-3">
                <Icon size={20} className="text-navy dark:text-gold shrink-0" />
                <p className="text-sm text-gray-600 dark:text-gray-300">{texte}</p>
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
