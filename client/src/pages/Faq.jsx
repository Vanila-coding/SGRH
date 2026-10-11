import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useText } from '../context/TextContext';
import PublicHeader from '../components/layout/PublicHeader';
import PublicFooter from '../components/layout/PublicFooter';
import EditableText, { EditPencilButton } from '../components/EditableText';
import { traduire } from '../i18n';

export default function Faq() {
  const [categorie, setCategorie] = useState('tout');
  const [ouverts, setOuverts] = useState(() => new Set());

  // Hooks non appelés dans une boucle (règle des hooks) : les 3 libellés de catégorie et
  // les 7 questions/réponses sont dépliés explicitement, puis rassemblés dans des
  // tableaux pour le rendu. Contenu propre à notre parcours réel (inscription par email +
  // code de vérification + matricule, voir Register.jsx ; réinitialisation par lien
  // email, voir MotDePasseOublie.jsx) — pas une traduction d'une FAQ d'un autre système.
  const catTout = useText('faq.cat_tout', 'Tout', 'FAQ');
  const catInscription = useText('faq.cat_inscription', 'Inscription', 'FAQ');
  const catMotDePasse = useText('faq.cat_mot_de_passe', 'Mot de passe', 'FAQ');
  const categories = [
    { id: 'tout', label: catTout },
    { id: 'inscription', label: catInscription },
    { id: 'mot_de_passe', label: catMotDePasse },
  ];

  const q1Question = useText('faq.q1_question', 'Comment créer mon compte ?', 'FAQ');
  const q1Reponse = useText(
    'faq.q1_reponse',
    "Cliquez sur « Créer mon compte » depuis la page de connexion. Saisissez votre adresse email : vous recevrez un code de vérification à 4 chiffres. Une fois le code validé, indiquez votre matricule (6 chiffres) puis choisissez un mot de passe.",
    'FAQ'
  );
  const q2Question = useText('faq.q2_question', 'Où trouver mon matricule ?', 'FAQ');
  const q2Reponse = useText(
    'faq.q2_reponse',
    'Votre matricule à 6 chiffres figure sur vos documents administratifs (bulletin de solde, arrêté de nomination...). Si vous ne le trouvez pas, contactez le service des ressources humaines.',
    'FAQ'
  );
  const q3Question = useText('faq.q3_question', 'Je ne reçois pas le code de vérification, que faire ?', 'FAQ');
  const q3Reponse = useText(
    'faq.q3_reponse',
    "Vérifiez d'abord vos courriers indésirables. Si le code n'arrive toujours pas après quelques minutes, revenez à l'étape précédente du formulaire pour en demander un nouveau.",
    'FAQ'
  );
  const q4Question = useText('faq.q4_question', 'Mon compte est créé mais je ne peux pas me connecter.', 'FAQ');
  const q4Reponse = useText(
    'faq.q4_reponse',
    "C'est normal : après sa création, un compte doit être validé par le service des ressources humaines avant la première connexion. Contactez la RH si l'attente vous paraît anormalement longue.",
    'FAQ'
  );
  const q5Question = useText('faq.q5_question', 'J’ai oublié mon mot de passe, que faire ?', 'FAQ');
  const q5Reponse = useText(
    'faq.q5_reponse',
    'Cliquez sur « Mot de passe oublié ? » depuis la page de connexion et saisissez votre adresse email. Un lien de réinitialisation vous sera envoyé.',
    'FAQ'
  );
  const q6Question = useText('faq.q6_question', "Je ne reçois pas l'email de réinitialisation.", 'FAQ');
  const q6Reponse = useText(
    'faq.q6_reponse',
    "Vérifiez vos courriers indésirables et que l'adresse saisie correspond bien à celle de votre compte. Si le problème persiste, contactez le service des ressources humaines.",
    'FAQ'
  );
  const q7Question = useText('faq.q7_question', 'Quelles sont les règles pour mon mot de passe ?', 'FAQ');
  const q7Reponse = useText('faq.q7_reponse', 'Le mot de passe doit comporter au minimum 8 caractères.', 'FAQ');

  const questions = [
    { id: 'q1', categorie: 'inscription', question: q1Question, questionKey: 'faq.q1_question', reponse: q1Reponse, reponseKey: 'faq.q1_reponse' },
    { id: 'q2', categorie: 'inscription', question: q2Question, questionKey: 'faq.q2_question', reponse: q2Reponse, reponseKey: 'faq.q2_reponse' },
    { id: 'q3', categorie: 'inscription', question: q3Question, questionKey: 'faq.q3_question', reponse: q3Reponse, reponseKey: 'faq.q3_reponse' },
    { id: 'q4', categorie: 'inscription', question: q4Question, questionKey: 'faq.q4_question', reponse: q4Reponse, reponseKey: 'faq.q4_reponse' },
    { id: 'q5', categorie: 'mot_de_passe', question: q5Question, questionKey: 'faq.q5_question', reponse: q5Reponse, reponseKey: 'faq.q5_reponse' },
    { id: 'q6', categorie: 'mot_de_passe', question: q6Question, questionKey: 'faq.q6_question', reponse: q6Reponse, reponseKey: 'faq.q6_reponse' },
    { id: 'q7', categorie: 'mot_de_passe', question: q7Question, questionKey: 'faq.q7_question', reponse: q7Reponse, reponseKey: 'faq.q7_reponse' },
  ];

  function toggle(id) {
    setOuverts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const questionsFiltrees = questions.filter((q) => categorie === 'tout' || q.categorie === categorie);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-gray-950">
      <PublicHeader />

      <section className="flex-1 mx-auto max-w-3xl w-full px-4 sm:px-8 py-14 sm:py-20">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">{traduire('Aide et FAQ')}</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {traduire('Trouvez rapidement la réponse à vos questions sur l’inscription ou la récupération de votre mot de passe.')}
        </p>

        {/* Libellés des catégories résolus via useText (donc modifiables depuis
            Personnalisation), mais sans crayon ici : un <button> ne peut pas contenir un
            autre <button> (HTML invalide) — ces pastilles de filtre restent sans crayon,
            à éditer depuis la liste générale de Personnalisation si besoin. */}
        <div role="group" aria-label={traduire('Filtrer les questions')} className="flex flex-wrap gap-2 mb-8">
          {categories.map(({ id, label }) => (
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
              {traduire(label)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {questionsFiltrees.map(({ id, question, questionKey, reponse, reponseKey }) => {
            const estOuvert = ouverts.has(id);
            const panneauId = `faq-panneau-${id}`;
            return (
              <div key={id} className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    aria-expanded={estOuvert}
                    aria-controls={panneauId}
                    className="flex-1 flex items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-medium text-gray-900 dark:text-gray-100">{traduire(question)}</span>
                    <ChevronDown
                      size={18}
                      aria-hidden="true"
                      className={`shrink-0 text-gray-400 transition-transform duration-200 ${estOuvert ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {/* Crayon hors du bouton d'accordéon (frère, pas enfant) : voir le
                      commentaire d'EditPencilButton. */}
                  <EditPencilButton textKey={questionKey} current={traduire(question)} />
                </div>
                <div
                  id={panneauId}
                  inert={!estOuvert}
                  className={`grid transition-all duration-200 ${estOuvert ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                      <EditableText value={traduire(reponse)} textKey={reponseKey} multiline />
                    </p>
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
