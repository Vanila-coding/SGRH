import { createContext, useContext } from 'react';

export const ToastContext = createContext(null);

// Alternative "React-idiomatique" à l'API impérative `toast.success(...)` — les deux
// pointent vers le même état, à utiliser selon la préférence du composant appelant.
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans un ToastProvider');
  return {
    success: (message, options) => ctx.push('success', message, options),
    error: (message, options) => ctx.push('error', message, options),
    warning: (message, options) => ctx.push('warning', message, options),
    info: (message, options) => ctx.push('info', message, options),
    dismiss: ctx.dismiss,
  };
}
