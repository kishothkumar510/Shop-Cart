import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db, logTransaction } from '../db';
import { generateToken, hashPassword, verifyPassword, authenticateToken, AuthenticatedRequest } from '../auth';
import { User } from '../../src/types';

export const authRouter = Router();

// GET /api/auth/demo-accounts - For quick sandbox test switching
authRouter.get('/demo-accounts', (req: Request, res: Response) => {
  res.json([
    {
      role: 'customer',
      label: 'Verified Customer (Rahul Sharma)',
      email: 'rahul.sharma@example.com',
      password: 'Password123!',
      description: 'Customer with pre-saved Mumbai address & order history in ₹ INR'
    },
    {
      role: 'admin',
      label: 'Store Administrator (ShopCart Ops)',
      email: 'admin@shopcart.in',
      password: 'AdminPass123!',
      description: 'Administrator with full inventory manager & live telemetry access'
    }
  ]);
});

// POST /api/auth/register - Secure registration with bcrypt hashing & JWT issuance
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const emailKey = email.toLowerCase().trim();
    if (db.users.has(emailKey)) {
      logTransaction('auth', 'warning', `Registration attempt failed: email ${emailKey} already exists`);
      return res.status(409).json({ error: 'An account with this email address already exists' });
    }

    // Cryptographic hash with bcrypt (10 rounds salt)
    const passwordHash = await hashPassword(password);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

    const newUser: User = {
      id: userId,
      name: name.trim(),
      email: emailKey,
      role: 'customer',
      createdAt: new Date().toISOString(),
      phone: phone ? phone.trim() : undefined
    };

    db.users.set(emailKey, {
      ...newUser,
      passwordHash
    });

    const token = generateToken(newUser);
    logTransaction('auth', 'success', `New user registered: ${emailKey} (ID: ${userId}) with bcrypt hash`, userId);

    res.status(201).json({
      user: newUser,
      token,
      expiresIn: '7d'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

// POST /api/auth/login - Secure login checking bcrypt hash & issuing JWT
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailKey = email.toLowerCase().trim();
    const userRecord = db.users.get(emailKey);

    if (!userRecord) {
      logTransaction('auth', 'warning', `Failed login attempt: non-existent email ${emailKey}`);
      return res.status(401).json({ error: 'Invalid email or password credentials' });
    }

    const isValidPassword = await verifyPassword(password, userRecord.passwordHash);
    if (!isValidPassword) {
      logTransaction('auth', 'warning', `Failed login attempt: password mismatch for ${emailKey}`);
      return res.status(401).json({ error: 'Invalid email or password credentials' });
    }

    const { passwordHash: _hash, ...safeUser } = userRecord;
    const token = generateToken(safeUser);

    logTransaction('auth', 'success', `User logged in: ${emailKey} (Role: ${safeUser.role})`, safeUser.id);

    res.json({
      user: safeUser,
      token,
      expiresIn: '7d'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// GET /api/auth/me - Validate current session token and fetch profile
authRouter.get('/me', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
});

// PUT /api/auth/profile - Update profile details / default address
authRouter.put('/profile', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { name, phone, defaultAddress } = req.body;

  const emailKey = user.email.toLowerCase();
  const existingRecord = db.users.get(emailKey);

  if (!existingRecord) {
    return res.status(404).json({ error: 'User record not found' });
  }

  const updatedRecord = {
    ...existingRecord,
    name: name !== undefined ? name : existingRecord.name,
    phone: phone !== undefined ? phone : existingRecord.phone,
    defaultAddress: defaultAddress !== undefined ? defaultAddress : existingRecord.defaultAddress
  };

  db.users.set(emailKey, updatedRecord);

  const { passwordHash: _hash, ...safeUser } = updatedRecord;
  logTransaction('auth', 'success', `Profile updated for user: ${emailKey}`, safeUser.id);

  res.json({ user: safeUser });
});

// POST /api/auth/inspect-token - Diagnostic tool to view JWT payload without exposing secret
authRouter.post('/inspect-token', (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const decoded = jwt.decode(token, { complete: true });
    res.json({
      decoded,
      valid: true
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid token';
    res.status(400).json({ error: 'Failed to decode token', message });
  }
});
