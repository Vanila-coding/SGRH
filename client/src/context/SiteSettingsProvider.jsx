import { useCallback, useEffect, useState } from 'react';
import { getSiteSettings } from '../services/siteSettingsAdminApi';
import { urlFichierSite } from '../utils/siteAssets';
import { SiteSettingsContext } from './SiteSettingsContext';

// Correspondance clé site_settings -> variable CSS définie dans index.css (@theme).
// Couleur principale et couleur des boutons pointent toutes deux vers --color-navy,
// couleur secondaire et couleur active de la sidebar vers --color-gold : dans ce projet,
// il n'existe que ces 2 variables d'accent, déjà utilisées partout (boutons, sidebar) —
// il n'y a pas 4 couleurs indépendantes à faire varier séparément.
const COLOR_VARS = {
  color_navy: '--color-navy',
  color_gold: '--color-gold',
  color_status_pending: '--color-status-pending',
  color_status_approved: '--color-status-approved',
  color_status_rejected: '--color-status-rejected',
};

function applyColors(settings) {
  Object.entries(COLOR_VARS).forEach(([key, cssVar]) => {
    if (settings[key]) document.documentElement.style.setProperty(cssVar, settings[key]);
  });
}

function applyFavicon(settings) {
  if (!settings.favicon_url) return;
  const link = document.querySelector("link[rel~='icon']");
  if (link) link.href = urlFichierSite(settings.favicon_url);
}

// Applique les couleurs et le favicon personnalisés à chaque démarrage de l'application
// (pas seulement dans l'onglet Apparence où ils sont modifiés) : avant cette mise en
// place, un changement de couleur n'était appliqué que localement, en mémoire, sur la
// page d'où il avait été enregistré, et disparaissait au rechargement.
export function SiteSettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => getSiteSettings().then((data) => {
    setSettings(data || {});
    applyColors(data || {});
    applyFavicon(data || {});
    setLoaded(true);
  }), []);

  useEffect(() => { reload(); }, [reload]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loaded, reload }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}
