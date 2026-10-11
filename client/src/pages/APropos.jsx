import { ShieldCheck, QrCode, Clock, MapPinOff, ListChecks } from 'lucide-react';
import { useText } from '../context/TextContext';
import PublicHeader from '../components/layout/PublicHeader';
import PublicFooter from '../components/layout/PublicFooter';
import EditableText from '../components/EditableText';
import { traduire } from '../i18n';

const ICONES_BREF = [Clock, MapPinOff, ListChecks, QrCode];

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

  // Hooks non appelés dans une boucle (règle des hooks) : les 4 points « En bref » sont
  // dépliés explicitement, puis rassemblés dans un tableau pour le rendu.
  const bref1 = useText('apropos.bref1', 'Un accès centralisé, disponible à tout moment', 'À propos');
  const bref2 = useText('apropos.bref2', 'Moins de déplacements pour les démarches administratives', 'À propos');
  const bref3 = useText('apropos.bref3', 'Une meilleure traçabilité des décisions et des actions', 'À propos');
  const bref4 = useText('apropos.bref4', 'Des documents authentifiables, pour plus de confiance', 'À propos');

  const pointsBref = [
    { texte: bref1, textKey: 'apropos.bref1' },
    { texte: bref2, textKey: 'apropos.bref2' },
    { texte: bref3, textKey: 'apropos.bref3' },
    { texte: bref4, textKey: 'apropos.bref4' },
  ].map((p, i) => ({ ...p, icon: ICONES_BREF[i] }));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950">
      <PublicHeader />

      <section className="mx-auto max-w-[1600px] w-full px-4 sm:px-8 py-14 sm:py-20">
        <div className="flex items-center gap-12 mb-12">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              <EditableText value={traduire(titre)} textKey="apropos.titre" />
            </h1>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
              <EditableText value={traduire(intro)} textKey="apropos.intro" multiline />
            </p>
            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
              <EditableText value={traduire(description)} textKey="apropos.description" multiline />
            </p>
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
            <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-1.5">
              <EditableText value={traduire(securiteTitre)} textKey="apropos.securite_titre" />
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              <EditableText value={traduire(securiteTexte)} textKey="apropos.securite_texte" multiline />
            </p>
          </div>
        </div>

        <div className="bg-navy rounded-2xl p-6 sm:p-8">
          <h2 className="text-white font-semibold mb-5">
            <EditableText value={traduire(brefTitre)} textKey="apropos.bref_titre" />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pointsBref.map(({ icon: Icon, texte, textKey }) => (
              <div key={textKey} className="flex items-center gap-3">
                <Icon size={18} className="text-gold shrink-0" />
                <p className="text-sm text-white/80">
                  <EditableText value={traduire(texte)} textKey={textKey} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-auto">
        <PublicFooter />
      </div>
    </div>
  );
}
