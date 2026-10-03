import { traduire } from '../i18n';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function authHeaders() {
  const token = localStorage.getItem('rh_token');
  return { Authorization: `Bearer ${token}` };
}

export async function listUsers({ role, fonction } = {}) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (fonction) params.set('fonction', fonction);
  const res = await fetch(`${API_URL}/users?${params.toString()}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement'));
  return data.users;
}

export async function listPersonnel({ role } = {}) {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  const res = await fetch(`${API_URL}/users/personnel?${params.toString()}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement'));
  return data.personnel;
}

export async function changeFonction(id, fonction) {
  const res = await fetch(`${API_URL}/users/${id}/fonction`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ fonction }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Échec de la mise à jour'));
  return data;
}

export async function getFonctionHistory(id) {
  const res = await fetch(`${API_URL}/users/${id}/fonction-history`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement'));
  return data.history;
}