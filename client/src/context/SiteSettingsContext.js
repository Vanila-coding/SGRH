import { createContext, useContext } from 'react';

export const SiteSettingsContext = createContext(null);

export function useSiteSettings() {
  const ctx = useContext(SiteSettingsContext);
  if (!ctx) throw new Error('useSiteSettings doit être utilisé dans SiteSettingsProvider');
  return ctx;
}
