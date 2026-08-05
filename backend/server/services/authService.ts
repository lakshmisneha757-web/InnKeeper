import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { prisma } from "../prisma/client";

export type UserRole = "admin" | "manager" | "receptionist" | "housekeeping";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string | null;
  passwordHash: string;
  resetTokenHash?: string | null;
  resetTokenExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PublicUser = Omit<AuthUser, "passwordHash" | "resetTokenHash" | "resetTokenExpiresAt">;

export function normalizeRole(role?: string): UserRole {
  const normalized = role?.toLowerCase();
  if (normalized === "admin" || normalized === "manager" || normalized === "receptionist" || normalized === "housekeeping") {
    return normalized as UserRole;
  }
  return "receptionist";
}

export function isStrongPassword(password: string) {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
}

export function buildPublicUser(user: AuthUser): PublicUser {
  const { passwordHash, resetTokenHash, resetTokenExpiresAt, ...rest } = user;
  return rest;
}

export async function registerUser(input: { email: string; password: string; name: string; phone?: string; role?: string }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw Object.assign(new Error("Email already registered"), { status: 409 });
  }

  if (!isStrongPassword(input.password)) {
    throw Object.assign(new Error("Password must be at least 8 characters and include uppercase letters and numbers"), { status: 400 });
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name,
      phone: input.phone ?? null,
      passwordHash,
      role: normalizeRole(input.role),
    },
  });

  return buildPublicUser(user as AuthUser);
}

export async function loginUser(input: { email: string; password: string; rememberMe?: boolean }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error("Invalid credentials"), { status: 401 });
  }

  const accessToken = jwt.sign({ sub: user.id, email: user.email, role: user.role }, config.jwtSecret, { expiresIn: input.rememberMe ? "30d" : "12h" });

  return {
    user: buildPublicUser(user as AuthUser),
    accessToken,
  };
}

export async function forgotPassword(input: { email: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    return { message: "If the email exists, reset instructions were sent." };
  }

  const resetToken = crypto.randomBytes(24).toString("hex");
  const resetTokenHash = await bcrypt.hash(resetToken, 10);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetTokenHash,
      resetTokenExpiresAt: expiresAt,
    },
  });

  return { message: "If the email exists, reset instructions were sent.", resetToken };
}

export async function resetPassword(input: { email: string; token: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.resetTokenHash || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    throw Object.assign(new Error("Invalid or expired reset token"), { status: 400 });
  }

  const valid = await bcrypt.compare(input.token, user.resetTokenHash);
  if (!valid) {
    throw Object.assign(new Error("Invalid or expired reset token"), { status: 400 });
  }

  if (!isStrongPassword(input.password)) {
    throw Object.assign(new Error("Password must be at least 8 characters and include uppercase letters and numbers"), { status: 400 });
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
  });

  return { message: "Password updated successfully." };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? buildPublicUser(user as AuthUser) : null;
}
