import { traduire } from '../i18n';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function getActivityLog(limit = 50, exclude = []) {
  const token = localStorage.getItem('rh_token');
  const params = new URLSearchParams({ limit: String(limit) });
  if (exclude.length > 0) params.set('exclude', exclude.join(','));
  const res = await fetch(`${API_URL}/activity-log?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement'));
  return data.logs;
}