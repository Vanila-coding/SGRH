import { makeApiError } from '../utils/apiError';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function authHeaders() {
  const token = localStorage.getItem('rh_token');
  return { Authorization: `Bearer ${token}` };
}

export async function generateDocument(personnelId, typeDocument, donnees = {}) {
  const res = await fetch(`${API_URL}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ personnelId, typeDocument, donnees }),
  });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Échec de la génération');
  return data.document;
}

export async function getDocument(id) {
  const res = await fetch(`${API_URL}/documents/${id}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Erreur de chargement');
  return data.document;
}

export async function getHistoriquePersonnel(personnelId) {
  const res = await fetch(`${API_URL}/documents/personnel/${personnelId}`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Erreur de chargement');
  return data.historique;
}

export async function getMesDocuments() {
  const res = await fetch(`${API_URL}/documents/me`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Erreur de chargement');
  return data.historique;
}

export async function demanderDocument(typeDocument, motif) {
  const res = await fetch(`${API_URL}/documents/demandes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ typeDocument, motif }),
  });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, "Échec de l'envoi");
  return data.demande;
}

export async function getMesDemandesDocuments() {
  const res = await fetch(`${API_URL}/documents/demandes/me`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Erreur de chargement');
  return data.demandes;
}

export async function getDemandesEnAttente() {
  const res = await fetch(`${API_URL}/documents/demandes/en-attente`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Erreur de chargement');
  return data.demandes;
}

export async function getDemandesEnAttenteSecretariat() {
  const res = await fetch(`${API_URL}/documents/demandes/en-attente-secretariat`, { headers: authHeaders() });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Erreur de chargement');
  return data.demandes;
}

export async function reviewDemandeSecretariat(id, decision, avis) {
  const res = await fetch(`${API_URL}/documents/demandes/${id}/review-secretariat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ decision, avis }),
  });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Échec');
  return data;
}

export async function traiterDemande(id, donnees = {}) {
  const res = await fetch(`${API_URL}/documents/demandes/${id}/traiter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ donnees }),
  });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Échec du traitement');
  return data.document;
}

export async function refuserDemande(id) {
  const res = await fetch(`${API_URL}/documents/demandes/${id}/refuser`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw makeApiError(res, data, 'Échec du refus');
  return data;
}