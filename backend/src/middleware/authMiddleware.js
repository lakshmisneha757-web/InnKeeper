import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'innkeeper_session';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token && req.cookies?.[COOKIE_NAME]) {
    token = req.cookies[COOKIE_NAME];
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Authentication token required' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'innkeeper-super-secret-key-change-in-production';

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role || 'staff',
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}
