import { traduire } from '../i18n';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function authHeaders() {
  const token = localStorage.getItem('rh_token');
  return { Authorization: `Bearer ${token}` };
}

async function lireOuErreur(res, messageParDefaut) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(traduire(data.message || messageParDefaut));
  return data;
}

export async function fetchDirections({ tous = false } = {}) {
  const res = await fetch(`${API_URL}/organisation/directions${tous ? '?tous=1' : ''}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement des directions'));
  return data.directions;
}

export async function fetchServices(directionId, { tous = false } = {}) {
  const params = new URLSearchParams();
  if (directionId) params.set('directionId', directionId);
  if (tous) params.set('tous', '1');
  const query = params.toString();
  const url = `${API_URL}/organisation/services${query ? `?${query}` : ''}`;
  const res = await fetch(url, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement des services'));
  return data.services;
}

export async function createDirection(nom) {
  const res = await fetch(`${API_URL}/organisation/directions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ nom }),
  });
  const data = await lireOuErreur(res, 'Échec de la création de la direction');
  return data.direction;
}

export async function deleteDirection(id) {
  const res = await fetch(`${API_URL}/organisation/directions/${id}`, { method: 'DELETE', headers: authHeaders() });
  return lireOuErreur(res, 'Échec de la suppression de la direction');
}

export async function createService(nom, directionId) {
  const res = await fetch(`${API_URL}/organisation/services`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ nom, directionId }),
  });
  const data = await lireOuErreur(res, 'Échec de la création du service');
  return data.service;
}

export async function deleteService(id) {
  const res = await fetch(`${API_URL}/organisation/services/${id}`, { method: 'DELETE', headers: authHeaders() });
  return lireOuErreur(res, 'Échec de la suppression du service');
}

export async function updateDirection(id, changements) {
  const res = await fetch(`${API_URL}/organisation/directions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(changements),
  });
  const data = await lireOuErreur(res, 'Échec de la mise à jour de la direction');
  return data.direction;
}

export async function updateService(id, changements) {
  const res = await fetch(`${API_URL}/organisation/services/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(changements),
  });
  const data = await lireOuErreur(res, 'Échec de la mise à jour du service');
  return data.service;
}

export async function telechargerModeleOrganisation() {
  const res = await fetch(`${API_URL}/organisation/import/modele`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Échec du téléchargement du modèle');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modele-import-directions-services.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export async function importerOrganisationExcel(file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_URL}/organisation/import`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  });
  return lireOuErreur(res, "Échec de l'import");
}
