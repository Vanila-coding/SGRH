import { useState } from 'react';

// Mémorise le choix liste/carte par écran (préférence de confort, sans effet sur les données).
export default function useVueListe(cle, defaut = 'carte') {
  const [vue, setVueState] = useState(() => {
    try {
      return localStorage.getItem(`vue-liste:${cle}`) || defaut;
    } catch {
      return defaut;
    }
  });
  const setVue = (v) => {
    setVueState(v);
    try {
      localStorage.setItem(`vue-liste:${cle}`, v);
    } catch {
      // stockage indisponible : le choix reste valable pour la session
    }
  };
  return [vue, setVue];
}

const CLASSES_CARTE = {
  3: 'grid grid-cols-1 lg:grid-cols-2 gap-3',
  4: 'grid grid-cols-1 lg:grid-cols-2 gap-4',
};
const CLASSES_LISTE = {
  3: 'flex flex-col gap-3',
  4: 'flex flex-col gap-4',
};

export const classeConteneur = (vue, espace = 4) => (
  vue === 'liste' ? CLASSES_LISTE[espace] : CLASSES_CARTE[espace]
);
