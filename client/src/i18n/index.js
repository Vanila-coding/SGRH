import { DICTIONNAIRE_EN } from './dictionnaires';

// La langue est lue dès le chargement du module, avant l'évaluation des constantes des
// pages : un changement de langue recharge l'application pour retraduire ces constantes.
const CLE_PREFERENCES = 'rh_settings_prefs';

function langueEnregistree() {
  try {
    const prefs = JSON.parse(localStorage.getItem(CLE_PREFERENCES) || '{}');
    return prefs.langue === 'en' ? 'en' : 'fr';
  } catch {
    return 'fr';
  }
}

let langueCourante = langueEnregistree();

export function langue() {
  return langueCourante;
}

export function definirLangue(nouvelle) {
  langueCourante = nouvelle === 'en' ? 'en' : 'fr';
}

export function traduire(texte) {
  if (typeof texte !== 'string') return texte;
  return (langueCourante === 'en' && DICTIONNAIRE_EN[texte]) || texte;
}
