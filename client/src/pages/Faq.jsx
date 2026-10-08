import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import PublicHeader from '../components/layout/PublicHeader';
import PublicFooter from '../components/layout/PublicFooter';
import { traduire } from '../i18n';

// Contenu propre à notre parcours réel (inscription par email + code de vérification +
// matricule, voir Register.jsx ; réinitialisation par lien email, voir
// MotDePasseOublie.jsx) — pas une traduction d'une FAQ d'un autre système.
const CATEGORIES = [
  { id: 'tout', label: traduire('Tout') },
  { id: 'inscription', label: traduire('Inscription') },
  { id: 'mot_de_passe', label: traduire('Mot de passe') },
];

const QUESTIONS = [
  {
    id: 'q1',
    categorie: 'inscription',
    question: traduire('Comment créer mon compte ?'),
    reponse: traduire(
      "Cliquez sur « Créer mon compte » depuis la page de connexion. Saisissez votre adresse email : vous recevrez un code de vérification à 4 chiffres. Une fois le code validé, indiquez votre matricule (6 chiffres) puis choisissez un mot de passe."
    ),
  },
  {
    id: 'q2',
    categorie: 'inscription',
    question: traduire('Où trouver mon matricule ?'),
    reponse: traduire(
      'Votre matricule à 6 chiffres figure sur vos documents administratifs (bulletin de solde, arrêté de nomination...). Si vous ne le trouvez pas, contactez le service des ressources humaines.'
    ),
  },
  {
    id: 'q3',
    categorie: 'inscription',
    question: traduire('Je ne reçois pas le code de vérification, que faire ?'),
    reponse: traduire(
      "Vérifiez d'abord vos courriers indésirables. Si le code n'arrive toujours pas après quelques minutes, revenez à l'étape précédente du formulaire pour en demander un nouveau."
    ),
  },
  {
    id: 'q4',
    categorie: 'inscription',
    question: traduire('Mon compte est créé mais je ne peux pas me connecter.'),
    reponse: traduire(
      "C'est normal : après sa création, un compte doit être validé par le service des ressources humaines avant la première connexion. Contactez la RH si l'attente vous paraît anormalement longue."
    ),
  },
  {
    id: 'q5',
    categorie: 'mot_de_passe',
    question: traduire('J’ai oublié mon mot de passe, que faire ?'),
    reponse: traduire(
      'Cliquez sur « Mot de passe oublié ? » depuis la page de connexion et saisissez votre adresse email. Un lien de réinitialisation vous sera envoyé.'
    ),
  },
  {
    id: 'q6',
    categorie: 'mot_de_passe',
    question: traduire("Je ne reçois pas l'email de réinitialisation."),
    reponse: traduire(
      "Vérifiez vos courriers indésirables et que l'adresse saisie correspond bien à celle de votre compte. Si le problème persiste, contactez le service des ressources humaines."
    ),
  },
  {
    id: 'q7',
    categorie: 'mot_de_passe',
    question: traduire('Quelles sont les règles pour mon mot de passe ?'),
    reponse: traduire('Le mot de passe doit comporter au minimum 8 caractères.'),
  },
];

export default function Faq() {
  const [categorie, setCategorie] = useState('tout');
  const [ouverts, setOuverts] = useState(() => new Set());

  function toggle(id) {
    setOuverts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const questionsFiltrees = QUESTIONS.filter((q) => categorie === 'tout' || q.categorie === categorie);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950">
      <PublicHeader />

      <section className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-8 py-14 sm:py-20">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">{traduire('Aide et FAQ')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {traduire('Trouvez rapidement la réponse à vos questions sur l’inscription ou la récupération de votre mot de passe.')}
        </p>

        <div role="group" aria-label={traduire('Filtrer les questions')} className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setCategorie(id)}
              aria-pressed={categorie === id}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                categorie === id
                  ? 'bg-navy text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-navy dark:hover:border-gold'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {questionsFiltrees.map(({ id, question, reponse }) => {
            const estOuvert = ouverts.has(id);
            const panneauId = `faq-panneau-${id}`;
            return (
              <div key={id} className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  aria-expanded={estOuvert}
                  aria-controls={panneauId}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-medium text-gray-900 dark:text-gray-100">{question}</span>
                  <ChevronDown
                    size={18}
                    aria-hidden="true"
                    className={`shrink-0 text-gray-400 transition-transform duration-200 ${estOuvert ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  id={panneauId}
                  inert={!estOuvert}
                  className={`grid transition-all duration-200 ${estOuvert ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{reponse}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
