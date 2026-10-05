import { useCallback, useEffect, useRef, useState } from 'react';
import { registerToastHandlers } from '../utils/toast';
import ToastContainer from '../components/ui/ToastContainer';
import { ToastContext } from './ToastContext';

const DEFAULT_DURATION = { success: 4000, info: 4000, warning: 6000, error: 7000 };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, options = {}) => {
    const id = ++idRef.current;
    const duration = options.duration ?? DEFAULT_DURATION[type] ?? 5000;
    setToasts((prev) => [...prev, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss]);

  useEffect(() => {
    registerToastHandlers({ push });
    return () => registerToastHandlers(null);
  }, [push]);

  return (
    <ToastContext.Provider value={{ push, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
