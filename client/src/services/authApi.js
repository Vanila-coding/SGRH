import { traduire } from '../i18n';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function loginRequest(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Échec de la connexion'));
  return data; // { token, user }
}

export async function fetchCurrentUser(token) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Session invalide');
  const data = await res.json();
  return data.user;
}

export async function changePassword(currentPassword, newPassword) {
  const token = localStorage.getItem('rh_token');
  const res = await fetch(`${API_URL}/auth/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Échec de la mise à jour'));
  return data;
}