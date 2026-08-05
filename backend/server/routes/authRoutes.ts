import { Router } from "express";
import type { AuthenticatedRequest } from "../middleware/auth";
import { authenticateJwt } from "../middleware/auth";
import { forgotPassword, getUserById, loginUser, registerUser, resetPassword } from "../services/authService";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "../utils/validation";

const router = Router();

router.post("/signup", async (req, res, next) => {
  try {
    const payload = registerSchema.parse(req.body);
    const result = await registerUser(payload);
    res.status(201).json({ user: result });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const payload = loginSchema.parse(req.body);
    const result = await loginUser(payload);
    res.cookie("auth_token", result.accessToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (_req, res) => {
  res.clearCookie("auth_token", { httpOnly: true, sameSite: "lax", secure: false });
  res.json({ success: true });
});

router.post("/forgot-password", async (req, res, next) => {
  try {
    const payload = forgotPasswordSchema.parse(req.body);
    const result = await forgotPassword(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post("/reset-password", async (req, res, next) => {
  try {
    const payload = resetPasswordSchema.parse(req.body);
    const result = await resetPassword(payload);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticateJwt, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await getUserById(req.user!.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

export default router;
