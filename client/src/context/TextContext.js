import { createContext, useContext, useEffect } from 'react';

export const TextContext = createContext(null);

export function useTextContext() {
  const ctx = useContext(TextContext);
  if (!ctx) throw new Error('useTextContext doit être utilisé dans TextProvider');
  return ctx;
}

export function useText(key, defaultValue, category = 'Général') {
  const { texts, loaded, registerKey } = useTextContext();

  useEffect(() => {
    if (!loaded) return;
    registerKey(key, defaultValue, category);
  }, [key, loaded, registerKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return texts[key] !== undefined ? texts[key] : defaultValue;
}
