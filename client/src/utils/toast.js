import { traduire } from '../i18n';
// API impérative `toast.success("...")` utilisable depuis n'importe quel composant
// sans passer par un hook. Le ToastProvider s'enregistre lui-même au montage ; tant
// qu'aucun provider n'est monté (ne devrait jamais arriver en usage normal, l'app
// entière est enveloppée), on retombe sur la console pour ne pas échouer en silence.
let handlers = null;

export function registerToastHandlers(nextHandlers) {
  handlers = nextHandlers;
}

function dispatch(type, message, options) {
  if (typeof message === 'string') message = traduire(message);
  if (!handlers) {
    console.warn(`[toast:${type}] (ToastProvider non monté)`, message);
    return;
  }
  return handlers.push(type, message, options);
}

export const toast = {
  success: (message, options) => dispatch('success', message, options),
  error: (message, options) => dispatch('error', message, options),
  warning: (message, options) => dispatch('warning', message, options),
  info: (message, options) => dispatch('info', message, options),
};
