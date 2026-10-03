import { traduire } from '../i18n';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function authHeaders() {
  const token = localStorage.getItem('rh_token');
  return { Authorization: `Bearer ${token}` };
}

export async function fetchGrilles(regime) {
  const qs = regime ? `?regime=${encodeURIComponent(regime)}` : '';
  const res = await fetch(`${API_URL}/indiciaire/grilles${qs}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement'));
  return data.grilles;
}

export async function rechercherLignes(filtres) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(filtres).filter(([, v]) => v !== undefined && v !== null && v !== '')));
  const res = await fetch(`${API_URL}/indiciaire/recherche?${qs.toString()}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement'));
  return data.lignes;
}

// Résout un indice réglementaire à partir d'une situation (classe/échelon/...).
// Ne lève jamais côté appelant : renvoie { resolution, error } pour que l'UI
// puisse afficher un fallback "à confirmer" plutôt qu'une erreur bloquante.
export async function resolveIndice(filtres) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(filtres).filter(([, v]) => v !== undefined && v !== null && v !== '')));
  const res = await fetch(`${API_URL}/indiciaire/resolve?${qs.toString()}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) return { resolution: null, error: data.message || 'Résolution impossible' };
  return { resolution: data, error: null };
}

export async function ajouterLigneGrille(grilleId, data) {
  const res = await fetch(`${API_URL}/indiciaire/grilles/${grilleId}/lignes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Échec de l'ajout de la ligne");
  return result.ligne;
}

export async function fetchAlertesAvancement(personnelId) {
  const qs = personnelId ? `?personnel=${personnelId}` : '';
  const res = await fetch(`${API_URL}/carriere/alertes-avancement${qs}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement'));
  return data.alertes;
}

export async function traiterAlerteAvancement(id, data) {
  const res = await fetch(`${API_URL}/carriere/alertes-avancement/${id}/traiter`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || "Échec du traitement de l'alerte");
  return result;
}

export async function ignorerAlerteAvancement(id) {
  const res = await fetch(`${API_URL}/carriere/alertes-avancement/${id}/ignorer`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || "Échec de l'ignorance de l'alerte"));
  return data;
}

export const CLASSES_GRILLE = [
  { value: 'CLASSE_EXCEPTIONNELLE', label: 'Classe exceptionnelle', echelons: 2 },
  { value: 'PRINCIPALAT', label: 'Principalat', echelons: 3 },
  { value: 'PREMIERE_CLASSE', label: 'Première classe', echelons: 3 },
  { value: 'DEUXIEME_CLASSE', label: 'Deuxième classe', echelons: 3 },
];

export function formatIndiceDisplay(indice, codeGrille) {
  if (indice === null || indice === undefined) return '—';
  return codeGrille ? `${indice}-${codeGrille}` : String(indice);
}
