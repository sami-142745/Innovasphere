import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import { getDb } from '../db.js';
import { requireRole } from '../security/rbac.js';

export const authRouter = Router();

const registerSchema = z.object({
  full_name: z.string().min(2),
  college_name: z.string().min(2),
  branch: z.string().min(2),
  year: z.number().int().min(1).max(10),
  email: z.string().email(),
  phone_number: z.string().min(6),
  password: z.string().min(8),
  referral_code: z.string().optional(),
});

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const db = getDb();
  const { full_name, college_name, branch, year, email, phone_number, password, referral_code } = parsed.data;

  const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rowCount && existing.rowCount > 0) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Note: referral logic & email verification will be implemented in later steps.
  const result = await db.query(
    `INSERT INTO users (full_name, college_name, branch, year, email, phone_number, password_hash, role)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'STUDENT')
     RETURNING id`,
    [full_name, college_name, branch, year, email, phone_number, passwordHash]
  );

  // Minimal: immediate JWT (email verification stub later)
  const userId = result.rows[0].id;
  const token = jwt.sign({ sub: String(userId), role: 'STUDENT' }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });

  return res.status(201).json({ token });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const db = getDb();
  const { email, password } = parsed.data;

  const row = await db.query('SELECT id, password_hash, role FROM users WHERE email = $1', [email]);
  if (!row.rowCount) return res.status(401).json({ error: 'Invalid credentials' });

  const user = row.rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ sub: String(user.id), role: user.role }, process.env.JWT_SECRET as string, {
    expiresIn: '7d',
  });

  return res.json({ token });
});

// Placeholder endpoints
authRouter.post('/forgot-password', async (_req, res) => res.json({ ok: true }));
authRouter.post('/reset-password', async (_req, res) => res.json({ ok: true }));
authRouter.get('/me', requireRole('STUDENT', 'ADMIN'), async (req: any, res) => {
  return res.json({ userId: req.user?.sub, role: req.user?.role });
});

