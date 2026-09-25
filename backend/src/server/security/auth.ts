import jwt from 'jsonwebtoken';
import type { Request } from 'express';

export type JwtPayload = {
  sub: string;
  role: 'STUDENT' | 'ADMIN';
};

export function authenticate(req: Request & { user?: JwtPayload }) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return false;

  const token = auth.slice('Bearer '.length);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = decoded;
    return true;
  } catch {
    return false;
  }
}

