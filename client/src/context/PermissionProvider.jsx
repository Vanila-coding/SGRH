import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getMyPermissions } from '../services/permissionApi';
import { PermissionContext } from './PermissionContext';

export function PermissionProvider({ children }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sans utilisateur, aucune permission : on n'a rien à charger (valeur dérivée au rendu).
    if (!user) return;
    getMyPermissions()
      .then(setPermissions)
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false));
  }, [user]);

  const effectives = user ? permissions : [];

  function can(key) {
    return effectives.includes(key);
  }

  return (
    <PermissionContext.Provider value={{ permissions: effectives, can, loading: user ? loading : false }}>
      {children}
    </PermissionContext.Provider>
  );
}
