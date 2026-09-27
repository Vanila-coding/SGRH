const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function authHeaders() {
  const token = localStorage.getItem('rh_token');
  return { Authorization: `Bearer ${token}` };
}

async function lireOuErreur(res, messageParDefaut) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || messageParDefaut);
  return data;
}

export async function fetchEtablissements() {
  const res = await fetch(`${API_URL}/etablissements`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur de chargement des établissements');
  return data.etablissements;
}

export async function createEtablissement(nom) {
  const res = await fetch(`${API_URL}/etablissements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ nom }),
  });
  const data = await lireOuErreur(res, "Échec de la création de l'établissement");
  return data.etablissement;
}

export async function desactiverEtablissement(id) {
  const res = await fetch(`${API_URL}/etablissements/${id}/desactiver`, { method: 'PATCH', headers: authHeaders() });
  return lireOuErreur(res, "Échec de la désactivation de l'établissement");
}

export async function reactiverEtablissement(id) {
  const res = await fetch(`${API_URL}/etablissements/${id}/reactiver`, { method: 'PATCH', headers: authHeaders() });
  return lireOuErreur(res, "Échec de la réactivation de l'établissement");
}
