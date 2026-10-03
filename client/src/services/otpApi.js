import { traduire } from '../i18n';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function requestOtp(email) {
  const res = await fetch(`${API_URL}/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || "Échec de l'envoi du code"));
  return data;
}

export async function verifyOtp(email, code) {
  const res = await fetch(`${API_URL}/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || 'Code invalide'));
  return data;
}

export async function registerWithMatricule(email, matricule, password) {
  const res = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, matricule, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(traduire(data.message || "Échec de l'inscription"));
  return data;
}