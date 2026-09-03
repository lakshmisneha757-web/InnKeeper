import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'innkeeper-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

const COOKIE_NAME = 'innkeeper_session';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  secure: process.env.NODE_ENV === 'production',
};

// Simple in-memory reset tokens store (use Redis/DB in production)
const resetTokens = new Map();

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export async function signup(req, res) {
  try {
    const { name, email, phone, password, confirmPassword, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone: phone || null,
        password: hashed,
        role: role || 'receptionist',
      },
    });

    const token = generateToken(user);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error during signup.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(user);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during login.' });
  }
}

export async function me(req, res) {
  try {
    // Accept token from Authorization header OR cookie
    const authHeader = req.headers.authorization;
    let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token && req.cookies?.[COOKIE_NAME]) {
      token = req.cookies[COOKIE_NAME];
    }
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }

    const payload = jwt.verify(token, JWT_SECRET);

    const user = await prisma.user.findUnique({ where: { id: Number(payload.id) } });
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }

    return res.status(200).json({
      user: {
        id: String(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export async function logout(req, res) {
  res.clearCookie(COOKIE_NAME);
  return res.status(200).json({ message: 'Logged out successfully.' });
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Security: don't reveal whether the email exists
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    resetTokens.set(resetToken, { userId: user.id, email, expiresAt: Date.now() + 3600_000 });

    return res.status(200).json({
      message: 'If that email exists, a reset link has been sent.',
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

export async function resetPassword(req, res) {
  try {
    const { email, password, confirmPassword } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
    if (password !== confirmPassword) return res.status(400).json({ error: 'Passwords do not match.' });

    const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (!user) {
      return res.status(404).json({ error: 'No account found with this email address.' });
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    return res.status(200).json({ message: 'Password reset successfully. Please log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}
