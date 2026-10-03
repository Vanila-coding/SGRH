import { traduire } from '../i18n';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function authHeaders() {
  const token = localStorage.getItem('rh_token');
  return { Authorization: `Bearer ${token}` };
}

export async function getMyPermissions() {
  const res = await fetch(`${API_URL}/permissions/me`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement'));
  return data.permissions;
}

export async function listAllPermissions() {
  const res = await fetch(`${API_URL}/permissions`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement'));
  return data.permissions;
}

export async function updatePermission(role, permissionId, enabled) {
  const res = await fetch(`${API_URL}/permissions`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ role, permissionId, enabled }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Échec de la mise à jour'));
  return data;
}