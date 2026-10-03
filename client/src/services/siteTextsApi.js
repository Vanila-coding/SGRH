import { traduire } from '../i18n';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function getAllTexts() {
  const res = await fetch(`${API_URL}/site-texts`);
  const data = await res.json();
  return data;
}

export async function ensureDefaultText(key, defaultValue, category) {
  await fetch(`${API_URL}/site-texts/ensure-default`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, defaultValue, category }),
  });
}

export async function updateText(key, value) {
  const token = localStorage.getItem('rh_token');
  const res = await fetch(`${API_URL}/site-texts`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ key, value }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Échec de la mise à jour'));
  return data;
}

export async function updateTextAdmin(key, value) {
  return updateText(key, value);
}