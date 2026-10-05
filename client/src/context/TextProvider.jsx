import { useCallback, useEffect, useRef, useState } from 'react';
import { getAllTexts, ensureDefaultText } from '../services/siteTextsApi';
import { TextContext } from './TextContext';

export function TextProvider({ children }) {
  const [texts, setTexts] = useState({});
  const [loaded, setLoaded] = useState(false);
  const registeredKeys = useRef(new Set());

  const reload = useCallback(() => getAllTexts().then((data) => {
    setTexts(data.texts || {});
    setLoaded(true);
  }), []);

  useEffect(() => { reload(); }, [reload]);

  const registerKey = useCallback((key, defaultValue, category) => {
    if (registeredKeys.current.has(key)) return;
    if (texts[key] !== undefined) return;
    registeredKeys.current.add(key);
    ensureDefaultText(key, defaultValue, category);
  }, [texts]);

  return (
    <TextContext.Provider value={{ texts, loaded, registerKey, reload }}>
      {children}
    </TextContext.Provider>
  );
}
