import { traduire } from '../i18n';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function authHeaders() {
  const token = localStorage.getItem('rh_token');
  return { Authorization: `Bearer ${token}` };
}

export async function signalerProbleme({ sujet, description }) {
  const res = await fetch(`${API_URL}/reclamations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ sujet, description }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || "Échec de l'envoi de la réclamation"));
  return data.reclamation;
}

export async function getMesReclamations() {
  const res = await fetch(`${API_URL}/reclamations/me`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement'));
  return data.reclamations;
}

export async function getToutesReclamations() {
  const res = await fetch(`${API_URL}/reclamations`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement'));
  return data.reclamations;
}

export async function traiterReclamation(id, reponse) {
  const res = await fetch(`${API_URL}/reclamations/${id}/traiter`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ reponse }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Échec du traitement'));
  return data.reclamation;
}
