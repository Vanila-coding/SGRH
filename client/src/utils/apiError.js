import { traduire } from '../i18n';
// Classification centralisée des erreurs API (Phase 3). Principe : le message
// métier du backend (déjà en français, déjà spécifique) est toujours prioritaire
// quand il existe — on ne le remplace jamais par un texte générique (§2 "ne casse
// pas les messages métier existants"). Les phrases ci-dessous ne servent QUE de
// repli quand aucun message n'est disponible (erreur réseau, 500 sans corps JSON...).
const FALLBACK_BY_STATUS = {
  400: 'Requête invalide.',
  401: 'Authentification requise. Veuillez vous reconnecter.',
  403: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
  404: 'Ressource introuvable.',
  409: "Conflit : cette action n'est pas possible dans l'état actuel.",
  422: 'Certaines données sont invalides.',
  500: 'Une erreur interne est survenue. Veuillez réessayer.',
};

export class ApiError extends Error {
  constructor(message, status, rawMessage) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.rawMessage = rawMessage;
  }
}

// Ordre de priorité : message métier du backend > phrase fixe pour les codes
// couverts explicitement par la Phase 3 (401/403/404/409/500...) > fallback
// spécifique à l'appel (texte déjà utilisé par chaque service, conservé pour ne
// rien dégrader) > phrase générique en tout dernier recours.
export function getFriendlyMessage(status, backendMessage, localFallback) {
  if (backendMessage) return traduire(backendMessage);
  if (FALLBACK_BY_STATUS[status]) return traduire(FALLBACK_BY_STATUS[status]);
  return traduire(localFallback || 'Une erreur inattendue est survenue.');
}

// À appeler dans le `if (!res.ok)` d'un service, à la place de
// `throw new Error(data.message || '...')`. Garde `.message` équivalent (donc
// aucun appelant existant ne casse), mais ajoute `.status` pour permettre une
// gestion fine (ex. toast différent sur 403), sans perdre le fallback historique.
export function makeApiError(res, data, localFallback) {
  const backendMessage = data && typeof data.message === 'string' && data.message.trim() ? data.message.trim() : null;
  const friendly = getFriendlyMessage(res?.status, backendMessage, localFallback);
  if (!backendMessage) {
    // Le détail technique reste en console pour le développement, jamais montré tel quel à l'utilisateur.
    console.error(`[API ${res?.status ?? '?'}] ${res?.url ?? ''}`, data);
  }
  if (res?.status === 401) notifyUnauthorized();
  return new ApiError(friendly, res?.status, backendMessage);
}

export function makeNetworkError(originalError) {
  console.error('[API network error]', originalError);
  return new ApiError('Impossible de contacter le serveur. Vérifiez votre connexion.', 0, null);
}

// L'app ne change pas d'architecture d'authentification (JWT + localStorage) —
// ceci ne fait qu'exposer un point d'accroche pour que AuthContext puisse réagir
// (déconnexion propre + message) quand un appel migré reçoit un 401 en cours de
// session, ce qui n'était géré nulle part avant (seulement au chargement initial).
let unauthorizedHandler = null;

export function registerUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

function notifyUnauthorized() {
  unauthorizedHandler?.();
}
