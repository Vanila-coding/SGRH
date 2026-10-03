import { createContext, useContext, useEffect, useState } from 'react';

const KEY = 'rh_settings_prefs';

const DEFAULTS = {
  density: 'normal',       // 'compact' | 'normal' | 'comfortable'
  textSize: 'normal',      // 'small' | 'normal' | 'large'
  sidebarMode: 'expanded', // 'expanded' | 'collapsed'
  animations: true,
  highContrast: false,
  reduceMotion: false,
  keyboardHighlight: false,
  langue: 'fr',
  dateFormat: 'dd/mm/yyyy',
  timeFormat: '24h',
  notifications: {
    app: {
      nouvelles_demandes: true, modification_profil: true, documents_disponibles: true,
      validation_demande: true, refus_demande: true, messages_administratifs: true, alertes_importantes: true,
    },
    email: {
      notifications_importantes: true, nouvelles_demandes: false, documents: false,
      rappels: true, informations_administratives: false,
    },
  },
  table: { pageSize: 25, rememberFilters: true, rememberSort: true, showExtraColumns: false },
  documents: { autoPreview: true, autoDownload: false, preferredFormat: 'pdf' },
};

function loadPrefs() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULTS,
      ...parsed,
      notifications: {
        app: { ...DEFAULTS.notifications.app, ...(parsed.notifications?.app || {}) },
        email: { ...DEFAULTS.notifications.email, ...(parsed.notifications?.email || {}) },
      },
      table: { ...DEFAULTS.table, ...(parsed.table || {}) },
      documents: { ...DEFAULTS.documents, ...(parsed.documents || {}) },
    };
  } catch {
    return DEFAULTS;
  }
}

const SettingsPreferencesContext = createContext(null);

export function SettingsPreferencesProvider({ children }) {
  const [prefs, setPrefs] = useState(loadPrefs);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(prefs));
    const root = document.documentElement;
    root.setAttribute('data-density', prefs.density);
    root.lang = prefs.langue === 'en' ? 'en' : 'fr';
    root.setAttribute('data-text-size', prefs.textSize);
    root.classList.toggle('reduce-motion', prefs.reduceMotion || !prefs.animations);
    root.classList.toggle('high-contrast', prefs.highContrast);
    root.classList.toggle('keyboard-highlight', prefs.keyboardHighlight);
  }, [prefs]);

  function update(key, value) {
    if (key === 'langue' && value !== prefs.langue) {
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...prefs, langue: value }));
      } catch {
        // stockage indisponible : le changement reste appliqué jusqu'au rechargement
      }
      window.location.reload();
      return;
    }
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  function updateNested(section, key, value) {
    setPrefs((prev) => ({ ...prev, [section]: { ...prev[section], [key]: value } }));
  }

  return (
    <SettingsPreferencesContext.Provider value={{ prefs, update, updateNested }}>
      <div key={prefs.langue} className="contents">{children}</div>
    </SettingsPreferencesContext.Provider>
  );
}

export function useSettingsPreferences() {
  const ctx = useContext(SettingsPreferencesContext);
  if (!ctx) throw new Error('useSettingsPreferences doit être utilisé dans SettingsPreferencesProvider');
  return ctx;
}