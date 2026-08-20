import { Router, Request, Response } from 'express';
import { db, logTransaction, initializeDatabase } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../auth';

export const adminRouter = Router();

// GET /api/admin/logs - Security Audit Trail & Sandbox Telemetry
adminRouter.get('/logs', (req: Request, res: Response) => {
  res.json({
    total: db.logs.length,
    logs: db.logs
  });
});

// GET /api/admin/stats - Server-side architecture stats
adminRouter.get('/stats', (req: Request, res: Response) => {
  const users = Array.from(db.users.values()).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    hasHashedPassword: Boolean(u.passwordHash && u.passwordHash.startsWith('$2'))
  }));

  const products = Array.from(db.products.values());
  const orders = Array.from(db.orders.values());
  const activeCartsCount = Array.from(db.userCarts.values()).filter(c => c.length > 0).length;

  res.json({
    usersCount: users.length,
    users,
    productsCount: products.length,
    ordersCount: orders.length,
    activeCartsCount,
    totalSalesVolume: orders.reduce((sum, o) => sum + o.total, 0),
    inventoryStockUnits: products.reduce((sum, p) => sum + p.stock, 0)
  });
});

// POST /api/admin/reset - Reset database to pristine seeded state
adminRouter.post('/reset', async (req: Request, res: Response) => {
  try {
    await initializeDatabase();
    logTransaction('auth', 'success', 'Database reset to initial demo seeds by admin request', 'admin');
    res.json({ message: 'Database reset successfully to seed state' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset database' });
  }
});
