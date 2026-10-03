import { traduire } from '../i18n';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function authHeaders() {
  const token = localStorage.getItem('rh_token');
  return { Authorization: `Bearer ${token}` };
}

export async function sendInvitation(email, role, fonction, matricule) {
  const res = await fetch(`${API_URL}/invitations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ email, role, fonction, matricule }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || "Échec de l'envoi"));
  return data;
}

export async function getInvitationByToken(token) {
  const res = await fetch(`${API_URL}/invitations/${token}`);
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Invitation invalide'));
  return data;
}

export async function submitInvitationForm(token, formData) {
  const res = await fetch(`${API_URL}/invitations/${token}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Échec de la soumission'));
  return data;
}

export async function getPendingInvitations() {
  const res = await fetch(`${API_URL}/invitations/pending`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Erreur de chargement'));
  return data.invitations;
}

export async function confirmInvitation(id, fonction, typeContrat) {
  const res = await fetch(`${API_URL}/invitations/${id}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ fonction, typeContrat }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Échec de la confirmation'));
  return data;
}

export async function rejectInvitation(id) {
  const res = await fetch(`${API_URL}/invitations/${id}/reject`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Échec du refus'));
  return data;
}