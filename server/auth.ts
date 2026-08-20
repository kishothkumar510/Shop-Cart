import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db, logTransaction } from './db';
import { User } from '../src/types';

const JWT_SECRET = process.env.JWT_SECRET || 'ecommerce_secure_jwt_secret_key_2026';
const TOKEN_EXPIRY = '7d';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainText, salt);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

// Middleware to authenticate JWT token from Authorization header
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) {
    return res.status(401).json({
      error: 'Authentication token is required',
      code: 'AUTH_TOKEN_MISSING'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      logTransaction('auth', 'error', `JWT verification failed: ${err.message}`);
      return res.status(403).json({
        error: 'Invalid or expired token',
        code: 'AUTH_TOKEN_INVALID'
      });
    }

    const payload = decodedUser as { id: string; email: string };
    const userRecord = db.users.get(payload.email.toLowerCase());

    if (!userRecord) {
      return res.status(404).json({
        error: 'User not found in system',
        code: 'USER_NOT_FOUND'
      });
    }

    // Strip passwordHash before attaching
    const { passwordHash: _hash, ...safeUser } = userRecord;
    req.user = safeUser;
    next();
  });
}

// Optional auth middleware (for endpoints that work both guest and logged in)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (!err && decodedUser) {
      const payload = decodedUser as { id: string; email: string };
      const userRecord = db.users.get(payload.email.toLowerCase());
      if (userRecord) {
        const { passwordHash: _hash, ...safeUser } = userRecord;
        req.user = safeUser;
      }
    }
    next();
  });
}
