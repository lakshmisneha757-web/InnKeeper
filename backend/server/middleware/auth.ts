import type { Request, Response, NextFunction } from "express";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { config } from "../config/env";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const cookieHeader = req.headers.cookie ?? "";
  const cookies = parse(cookieHeader);
  const tokenFromCookie = cookies.auth_token;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : tokenFromCookie;

  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub: string; email: string; role: string };
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  };
}
