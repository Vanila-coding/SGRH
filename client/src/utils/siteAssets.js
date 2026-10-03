const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const ORIGINE_API = API_URL.replace(/\/api\/?$/, '');

// Les fichiers téléversés (logo, favicon) sont servis par l'API, pas par le serveur Vite.
export const urlFichierSite = (chemin) => {
  if (!chemin) return null;
  return chemin.startsWith('/uploads/') ? `${ORIGINE_API}${chemin}` : chemin;
};
