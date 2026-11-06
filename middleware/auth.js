/*
const jwt = require('jsonwebtoken');

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'tbhs_super_secret_jwt_key_2026'
    );
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const userRole = req.user.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

module.exports = {
  authenticateUser,
  verifyToken: authenticateUser,
  authorizeRoles
};
*/

const jwt = require('jsonwebtoken');

// Define numerical permission weights
const ROLE_HIERARCHY = {
  'chief_admin': 3,
  'admin': 2,
  'teacher': 1,
  'student': 0
};

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing authentication token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret');
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

    // Direct match check (or Chief Admin bypass)
    if (userRole === 'chief_admin' || allowedRoles.includes(userRole)) {
      return next();
    }

    // Determine minimum required level among specified roles
    const requiredLevels = allowedRoles.map(role => ROLE_HIERARCHY[role] ?? 0);
    const minRequiredLevel = Math.min(...requiredLevels);
    const userLevel = ROLE_HIERARCHY[userRole] ?? 0;

    // Grant access if user level meets or exceeds the required level
    if (userLevel >= minRequiredLevel) {
      return next();
    }

    return res.status(403).json({ error: 'Access denied: Insufficient privileges.' });
  };
};

module.exports = {
  authenticateUser,
  authorizeRoles
};
