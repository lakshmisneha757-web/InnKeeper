/**
 * Role-Based Access Control (RBAC) Middleware
 * Verifies that the authenticated user has one of the required roles.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // If no user is attached to request or auth failed
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: Authentication token required" });
    }

    const userRole = (req.user.role || "staff").toLowerCase();
    const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

    // Admin role has unrestricted access across all system endpoints
    if (userRole === "admin" || userRole === "manager") {
      return next();
    }

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        error: `Forbidden: Access denied for role '${req.user.role}'. Required role: ${allowedRoles.join(" or ")}`,
      });
    }

    next();
  };
}

module.exports = { requireRole };
