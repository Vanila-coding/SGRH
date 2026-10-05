import { createContext, useContext } from 'react';

export const SettingsPreferencesContext = createContext(null);

export function useSettingsPreferences() {
  const ctx = useContext(SettingsPreferencesContext);
  if (!ctx) throw new Error('useSettingsPreferences doit être utilisé dans SettingsPreferencesProvider');
  return ctx;
}