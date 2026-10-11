import { createContext, useContext } from 'react';

export const EditModeContext = createContext(null);

export function useEditMode() {
  const ctx = useContext(EditModeContext);
  if (!ctx) throw new Error('useEditMode doit être utilisé dans EditModeProvider');
  return ctx;
}
