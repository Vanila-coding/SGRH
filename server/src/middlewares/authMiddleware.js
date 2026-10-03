const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET;

async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentification requise' });
  }

  try {
    const payload = jwt.verify(header.split(' ')[1], JWT_SECRET);
    const user = await userRepository.findById(payload.sub);
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });
    // Un token émis pendant que le compte était actif reste sinon valide jusqu'à son
    // expiration (8h) même après désactivation — login() bloque déjà pending/inactive
    // à la connexion, donc seul un compte désactivé EN COURS de session peut arriver ici.
    if (user.status !== 'active') return res.status(401).json({ message: 'Compte inactif' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide ou expiré' });
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Accès refusé pour ce rôle' });
    }
    next();
  };
}

const permissionRepository = require('../repositories/permissionRepository');

function requirePermission(key) {
  return async (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentification requise' });

    const allowed = await permissionRepository.isRoleAllowed(req.user.role, key);
    if (!allowed) {
      return res.status(403).json({ message: 'Accès refusé (permission manquante)' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole, requirePermission };