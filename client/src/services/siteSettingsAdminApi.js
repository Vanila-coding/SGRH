const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function getSiteSettings() {
  const res = await fetch(`${API_URL}/site-settings`);
  const data = await res.json();
  return data.settings;
}

export async function updateSiteSetting(key, value) {
  const token = localStorage.getItem('rh_token');
  const res = await fetch(`${API_URL}/site-settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ key, value }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Échec de la mise à jour');
  return data;
}

export async function resetSiteColors() {
  const token = localStorage.getItem('rh_token');
  const res = await fetch(`${API_URL}/site-settings/reset-colors`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Échec de la réinitialisation');
  return data;
}

// 'logo' | 'favicon' | 'logo-connexion' — voir server/src/routes/siteSettings.routes.js
async function uploadSiteImage(slot, file) {
  const token = localStorage.getItem('rh_token');
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${API_URL}/site-settings/${slot}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Échec de l'envoi de l'image");
  return data;
}

export const uploadLogo = (file) => uploadSiteImage('logo', file);
export const uploadFavicon = (file) => uploadSiteImage('favicon', file);
export const uploadLogoConnexion = (file) => uploadSiteImage('logo-connexion', file);