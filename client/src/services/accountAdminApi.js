const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function authHeaders() {
  const token = localStorage.getItem('rh_token');
  return { Authorization: `Bearer ${token}` };
}

export async function listAccounts() {
  const res = await fetch(`${API_URL}/account-admin`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Erreur de chargement');
  return data.accounts;
}

export async function deactivateAccount(id) {
  const res = await fetch(`${API_URL}/account-admin/${id}/deactivate`, { method: 'POST', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Échec');
  return data;
}

export async function reactivateAccount(id) {
  const res = await fetch(`${API_URL}/account-admin/${id}/reactivate`, { method: 'POST', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Échec');
  return data;
}

export async function changeAccountRole(id, role) {
  const res = await fetch(`${API_URL}/account-admin/${id}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Échec');
  return data;
}

export async function deleteAccount(id) {
  const res = await fetch(`${API_URL}/account-admin/${id}`, { method: 'DELETE', headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Échec');
  return data;
}

export async function contacterCompteParEmail(id, sujet, message) {
  const res = await fetch(`${API_URL}/account-admin/${id}/contacter-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ sujet, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Échec de l'envoi");
  return data;
}