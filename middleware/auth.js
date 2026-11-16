const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tbhs_super_secret_jwt_key_2026';

// Define numerical permission weights
const ROLE_HIERARCHY = {
  chief_admin: 3,
  admin: 2,
  teacher: 1,
  student: 0
};

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid.' });
  }
};

// Hierarchical Role Authorization
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Access denied: User role not found.' });
    }

    const userRole = req.user.role;

    if (userRole === 'chief_admin' || allowedRoles.includes(userRole)) {
      return next();
    }

    const requiredLevels = allowedRoles.map(role => ROLE_HIERARCHY[role] ?? 0);
    const minRequiredLevel = Math.min(...requiredLevels);
    const userLevel = ROLE_HIERARCHY[userRole] ?? 0;

    if (userLevel >= minRequiredLevel) {
      return next();
    }

    return res.status(403).json({ error: 'Access denied: Insufficient privileges.' });
  };
};

module.exports = {
  authenticateUser,
  verifyToken: authenticateUser,
  authorizeRoles
};