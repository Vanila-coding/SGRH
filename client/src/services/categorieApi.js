import { traduire } from '../i18n';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function fetchCategories() {
  const token = localStorage.getItem('rh_token');
  const res = await fetch(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement des catégories'));
  return data.categories;
}