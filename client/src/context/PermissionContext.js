import { createContext, useContext } from 'react';

export const PermissionContext = createContext(null);

export function usePermissions() {
  const ctx = useContext(PermissionContext);
  if (!ctx) throw new Error('usePermissions doit être utilisé dans PermissionProvider');
  return ctx;
}
