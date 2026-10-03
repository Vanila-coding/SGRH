import { makeApiError } from '../utils/apiError';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function authHeaders() {
  const token = localStorage.getItem('rh_token');
  return { Authorization: `Bearer ${token}` };
}

export async function createPersonnel(data) {
  const res = await fetch(`${API_URL}/personnel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw makeApiError(res, result, 'Échec de la création');
  return result;
}

export async function updatePersonnel(id, data) {
  const res = await fetch(`${API_URL}/personnel/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(data),
  });
  const result = await res.json();
  if (!res.ok) throw makeApiError(res, result, 'Échec de la modification');
  return result;
}

// Fiche d'un personnel (vue RH « Voir la fiche »).
export async function getPersonnel(id) {
  const res = await fetch(`${API_URL}/personnel/${id}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Erreur de chargement');
  return data.personnel;
}

export async function listPersonnel() {
  const res = await fetch(`${API_URL}/personnel`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Erreur de chargement');
  return data.personnel;
}

export async function listPersonnelWithoutAccount() {
  const res = await fetch(`${API_URL}/personnel/sans-compte`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Erreur de chargement');
  return data.personnel;
}

export async function sendRegistrationLink(id) {
  const res = await fetch(`${API_URL}/personnel/${id}/envoyer-lien`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, "Échec de l'envoi");
  return data;
}

export async function getMyPersonnel() {
  const res = await fetch(`${API_URL}/personnel/me`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Erreur de chargement');
  return data.personnel;
}

export async function updateMyProfilePhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);

  const res = await fetch(`${API_URL}/personnel/me/photo`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, "Échec de l'enregistrement de la photo");
  return data.personnel;
}

export async function getMonEquipe() {
  const res = await fetch(`${API_URL}/personnel/mon-equipe`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Erreur de chargement');
  return data;
}

async function telechargerFichier(chemin, nomFichier, messageErreur) {
  const token = localStorage.getItem('rh_token');
  const res = await fetch(`${API_URL}${chemin}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw makeApiError(res, null, messageErreur);

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomFichier;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}

export function exportPersonnelExcel(role) {
  const query = role ? `?role=${role}` : '';
  return telechargerFichier(`/personnel/export${query}`, role ? `personnel-${role}.xlsx` : 'personnel.xlsx', "Échec de l'export");
}

export function telechargerModeleImport(role) {
  return telechargerFichier(`/personnel/import/modele?role=${role}`, `modele-import-personnel-${role}.xlsx`, 'Échec du téléchargement du modèle');
}

export async function importPersonnelExcel(file) {
  const token = localStorage.getItem('rh_token');
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_URL}/personnel/import`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, "Échec de l'import");
  return data;
}

export async function getPendingAccounts() {
  const res = await fetch(`${API_URL}/pending-accounts`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Erreur de chargement');
  return data.accounts;
}

export async function approvePendingAccount(id) {
  const res = await fetch(`${API_URL}/pending-accounts/${id}/approve`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Échec de la validation');
  return data;
}

export async function rejectPendingAccount(id) {
  const res = await fetch(`${API_URL}/pending-accounts/${id}/reject`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Échec du refus');
  return data;
}

export async function updateMesInfos({ telephone, adresse, situationFamiliale, dateNaissance, sexe, lieuNaissance, nationalite, datePriseFonction }) {
  const token = localStorage.getItem('rh_token');
  const res = await fetch(`${API_URL}/personnel/me`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ telephone, adresse, situationFamiliale, dateNaissance, sexe, lieuNaissance, nationalite, datePriseFonction }),
  });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Échec de la mise à jour');
  return data.personnel;
}