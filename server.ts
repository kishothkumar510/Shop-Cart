import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { initializeDatabase } from './server/db';
import { authRouter } from './server/routes/authRoutes';
import { productRouter } from './server/routes/productRoutes';
import { cartRouter } from './server/routes/cartRoutes';
import { checkoutRouter } from './server/routes/checkoutRoutes';
import { adminRouter } from './server/routes/adminRoutes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  // Initialize backend DB with bcrypt hashes, seeded catalog, and sample orders
  await initializeDatabase();

  const app = express();
  // Server port configuration:
  // - In Google AI Studio live preview, port 3000 is required by the container reverse proxy.
  // - When running locally on your own computer, you can set APP_PORT=5000 in .env to run on http://localhost:5000.
  const PORT = process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : 3000;

  // JSON and URL-encoded body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Route Mounts
  app.use('/api/auth', authRouter);
  app.use('/api/products', productRouter);
  app.use('/api/cart', cartRouter);
  app.use('/api/checkout', checkoutRouter);
  app.use('/api/admin', adminRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      engine: 'Secure E-Commerce Engine v2.4',
      time: new Date().toISOString()
    });
  });

  // Vite middleware for development or static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[E-Commerce Engine] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
