import { traduire } from './index';

// Modèles des descriptions du journal, générées côté serveur : chaque entrée capture les
// valeurs variables (nom, email, date...) et renvoie la phrase traduite.
const MODELES = [
  [/^Connexion \((.+)\)$/, (m) => `${traduire('Connexion')} (${m[1]})`],
  [/^Connexion de (.+) \((.+)\)$/, (m) => `${traduire('Connexion')} ${m[1]} (${m[2]})`],
  [/^Événement "(.+)" ajouté à la carrière \((.+)\)$/, (m) => `${traduire('Événement de carrière')} "${traduire(m[1])}" ${traduire('ajouté')} (${m[2]})`],
  [/^Demande de "(.+)" soumise \((.+)\)$/, (m) => `${traduire('Demande de congé')} "${traduire(m[1])}" ${traduire('soumise')} (${m[2]})`],
  [/^Import Excel : (\d+) fiche\(s\) créée\(s\), (\d+) erreur\(s\)$/, (m) => `${traduire('Personnel importé')} : ${m[1]} ${traduire('fiche(s) importée(s) avec succès.')}, ${m[2]} ${traduire('ligne(s) ignorée(s) :')}`],
  [/^Soldes d'ouverture saisis pour la fiche #(\d+) \((.+)\) : solde (\d+) -> (\d+)$/, (m) => `${traduire("Soldes d'ouverture enregistrés.")} #${m[1]} (${m[2]}) : ${m[3]} -> ${m[4]}`],
  [/^Compte #(\d+) déplacé dans la corbeille$/, (m) => `${traduire('Compte déplacé dans la corbeille')} #${m[1]}`],
  [/^Fiche personnel #(\d+) modifiée par le RH$/, (m) => `${traduire('Fiche modifiée par la RH')} #${m[1]}`],
  [/^Fiche personnel créée : (\d+) — (.+)$/, (m) => `${traduire('Fiche personnel créée')} : ${m[1]} — ${m[2]}`],
  [/^Compte \((.+)\) confirmé pour l'utilisateur #(\d+)$/, (m) => `${traduire('Compte confirmé')} (${m[1]}) #${m[2]}`],
  [/^Document "(.+)" \((.+)\) généré pour (.+)$/, (m) => `${traduire('Document généré')} "${m[1]}" (${m[2]}) — ${m[3]}`],
  [/^Lien d'inscription envoyé à (.+) \((.+)\)$/, (m) => `${traduire("Lien d'inscription envoyé")} → ${m[1]} (${m[2]})`],
  [/^Invitation envoyée à (.+) \((.+)\)$/, (m) => `${traduire('Invitation envoyée')} → ${m[1]} (${m[2]})`],
  [/^Invitation refusée pour (.+)$/, (m) => `${traduire('Invitation refusée')} — ${m[1]}`],
  [/^Mot de passe réinitialisé à la demande de l'utilisateur \((.+)\)$/, (m) => `${traduire('Mot de passe réinitialisé')} (${m[1]})`],
  [/^Mot de passe réinitialisé via lien de récupération$/, () => traduire('Mot de passe réinitialisé via lien de récupération')],
  [/^Contrat importé pour (.+) \((.+)\)$/, (m) => `${traduire('Contrat importé')} — ${m[1]} (${m[2]})`],
  [/^Établissement créé : (.+)$/, (m) => `${traduire('Établissement créé')} : ${m[1]}`],
  [/^Demande de congé #(\d+) approuvée$/, (m) => `${traduire('Demande de congé')} #${m[1]} — ${traduire('Approuvée')}`],
  [/^Demande de document #(\d+) traitée$/, (m) => `${traduire('Demande de document')} #${m[1]} — ${traduire('traitée')}`],
  [/^Notification "(.+)" envoyée à (\d+) personne\(s\)$/, (m) => `${traduire('Notification')} "${traduire(m[1])}" → ${m[2]}`],
  [/^Permission "(.+)" (activée|désactivée) pour le rôle (.+)$/, (m) => `${traduire('Permission modifiée')} "${m[1]}" ${m[2] === 'activée' ? traduire('activée') : traduire('désactivée')} — ${m[3]}`],
  [/^compte restauré depuis la corbeille$/, () => traduire('Élément restauré')],
  [/^Texte "(.+)" mis à jour$/, (m) => `${traduire('Texte modifié')} "${m[1]}"`],
  [/^Couleur "(.+)" changée en (.+)$/, (m) => `${traduire('Couleur mise à jour')} "${m[1]}" → ${m[2]}`],
  [/^Image "(.+)" mise à jour$/, (m) => `${traduire('Image mise à jour')} "${m[1]}"`],
  [/^Compte #(\d+) désigné secrétaire \((.+)\)$/, (m) => `${traduire('Compte désigné secrétaire')} #${m[1]} (${m[2]})`],
  [/^Compte #(\d+) retiré du secrétariat \((.+)\)$/, (m) => `${traduire('Rôle de secrétaire retiré')} #${m[1]} (${m[2]})`],
  [/^E-mail envoyé à (.+) — sujet : "(.+)"$/, (m) => `${traduire('E-mail envoyé')} → ${m[1]} — "${m[2]}"`],
];

export function traduireJournal(description) {
  if (!description) return description;
  for (const [motif, rendu] of MODELES) {
    const m = description.match(motif);
    if (m) return rendu(m);
  }
  return description;
}
