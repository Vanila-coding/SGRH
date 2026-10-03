import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getMyPermissions } from '../services/permissionApi';
import { traduire } from '../i18n';

const PermissionContext = createContext(null);

export function PermissionProvider({ children }) {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPermissions([]);
      setLoading(false);
      return;
    }
    getMyPermissions()
      .then(setPermissions)
      .catch(() => setPermissions([]))
      .finally(() => setLoading(false));
  }, [user]);

  function can(key) {
    return permissions.includes(key);
  }

  return (
    <PermissionContext.Provider value={{ permissions, can, loading }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('usePermissions doit être utilisé dans PermissionProvider');
  return ctx;
}