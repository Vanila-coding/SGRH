import { createContext, useContext, useEffect, useState } from 'react';
import { loginRequest, fetchCurrentUser } from '../services/authApi';
import { registerUnauthorizedHandler } from '../utils/apiError';
import { toast } from '../utils/toast';
import { traduire } from '../i18n';

const AuthContext = createContext(null);
const TOKEN_KEY = 'rh_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    fetchCurrentUser(token)
      .then(setUser)
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  // Un 401 reçu en cours de session (token expiré/révoqué) n'était géré nulle part
  // avant (seulement au chargement initial de l'app) — même mécanisme de
  // déconnexion, juste déclenché aussi pendant l'utilisation.
  useEffect(() => {
    registerUnauthorizedHandler(() => {
      if (!localStorage.getItem(TOKEN_KEY)) return;
      logout();
      toast.warning('Votre session a expiré. Veuillez vous reconnecter.');
    });
    return () => registerUnauthorizedHandler(null);
  }, []);

  async function login(email, password) {
    const { token, user } = await loginRequest(email, password);
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
    return user;
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}