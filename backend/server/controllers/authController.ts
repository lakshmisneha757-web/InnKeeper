import type { Request, Response, NextFunction } from "express";
import { loginUser, registerUser, getUserById } from "../services/authService";
import { authenticateJwt } from "../middleware/auth";

export async function loginController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function registerController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function profileController(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getUserById((req as any).user?.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
}
