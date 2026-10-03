import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import { traduire } from '../i18n';

export default function ProtectedRoute({ children, allowedRoles = [], permission = null }) {
  const { user, loading } = useAuth();
  const { can, loading: permissionsLoading } = usePermissions();

  if (loading || permissionsLoading) return null;
  if (!user) return <Navigate to="/login" replace />;

  // Quand une route précise une permission, celle-ci est la seule autorité : un rôle
  // auquel le Superadmin a accordé cette permission (page Rôles & permissions) doit
  // réellement pouvoir accéder à la page, même si ce rôle n'était pas prévu au départ —
  // sinon la page Rôles & permissions promettrait une flexibilité qu'elle ne tient pas.
  // `allowedRoles` ne reste un verrou dur que pour les routes sans permission associée
  // (espace personnel en libre-service : /profil, /conges, /mon-equipe...), où il n'y a
  // pas de permission à faire autorité à la place du rôle.
  if (permission) {
    if (!can(permission)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
          <div className="text-center">
            <p className="text-status-rejected font-medium mb-2">{traduire('Accès non autorisé')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {traduire('Votre rôle ne dispose pas de la permission nécessaire pour accéder à cette page.')}
            </p>
          </div>
        </div>
      );
    }
    return children;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
