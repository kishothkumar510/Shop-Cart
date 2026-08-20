import { Router, Request, Response } from 'express';
import { db, logTransaction } from '../db';
import { Product } from '../../src/types';

export const productRouter = Router();

// GET /api/products - Get all products with filtering, search, and sort
productRouter.get('/', (req: Request, res: Response) => {
  const { category, search, sort } = req.query;
  let products = Array.from(db.products.values());

  if (category && category !== 'all') {
    products = products.filter(p => p.category === category);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const q = search.toLowerCase().trim();
    products = products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  }

  if (sort) {
    if (sort === 'price_asc') {
      products.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      products.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      products.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'stock') {
      products.sort((a, b) => a.stock - b.stock);
    }
  }

  res.json({
    products,
    total: products.length
  });
});

// GET /api/products/inventory/summary - Inventory overview & metrics
productRouter.get('/inventory/summary', (req: Request, res: Response) => {
  const products = Array.from(db.products.values());
  const lowStockThreshold = 5;

  const lowStock = products.filter(p => p.stock > 0 && p.stock <= lowStockThreshold);
  const outOfStock = products.filter(p => p.stock === 0);
  const totalUnits = products.reduce((acc, p) => acc + p.stock, 0);
  const inventoryValue = products.reduce((acc, p) => acc + p.price * p.stock, 0);

  res.json({
    totalProducts: products.length,
    totalUnits,
    inventoryValue,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    lowStockItems: lowStock,
    outOfStockItems: outOfStock
  });
});

// GET /api/products/:id - Single product details
productRouter.get('/:id', (req: Request, res: Response) => {
  const product = db.products.get(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// PUT /api/products/:id/stock - Real-time stock adjuster (for sandbox test scenarios)
productRouter.put('/:id/stock', (req: Request, res: Response) => {
  const { id } = req.params;
  const { stock, delta } = req.body;

  const product = db.products.get(id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  let newStock = product.stock;
  if (typeof stock === 'number') {
    newStock = Math.max(0, Math.floor(stock));
  } else if (typeof delta === 'number') {
    newStock = Math.max(0, product.stock + Math.floor(delta));
  }

  const updatedProduct: Product = {
    ...product,
    stock: newStock
  };

  db.products.set(id, updatedProduct);

  logTransaction(
    'inventory_decrement',
    'success',
    `Admin/Sandbox stock adjusted for ${product.name} (${product.sku}): ${product.stock} -> ${newStock}`,
    'admin',
    { productId: id, previousStock: product.stock, newStock }
  );

  res.json({
    message: 'Stock updated successfully',
    product: updatedProduct
  });
});
