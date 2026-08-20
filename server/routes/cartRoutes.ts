import { Router, Response } from 'express';
import { db, logTransaction } from '../db';
import { authenticateToken, AuthenticatedRequest, optionalAuth } from '../auth';
import { CartItem, Product } from '../../src/types';

export const cartRouter = Router();

// Helper to sanitize and populate cart items with latest product data and stock validation
function enrichCartItems(rawItems: { productId: string; quantity: number }[]): CartItem[] {
  const result: CartItem[] = [];

  for (const item of rawItems) {
    const product = db.products.get(item.productId);
    if (product) {
      // Ensure quantity doesn't exceed stock if stock is > 0, or cap at stock
      const validQty = Math.max(1, Math.min(item.quantity, product.stock || 1));
      result.push({
        productId: item.productId,
        quantity: validQty,
        price: product.price,
        product
      });
    }
  }

  return result;
}

// GET /api/cart - Get current user cart (or empty if not logged in)
cartRouter.get('/', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.json({ items: [] });
  }

  const userId = req.user.id;
  const userCart = db.userCarts.get(userId) || [];
  const enriched = enrichCartItems(userCart);
  db.userCarts.set(userId, enriched);

  res.json({ items: enriched });
});

// POST /api/cart/sync - Sync/merge local storage guest cart with user's persistent database cart
cartRouter.post('/sync', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { guestItems } = req.body as { guestItems?: { productId: string; quantity: number }[] };

  const existingCart = db.userCarts.get(userId) || [];
  const mergedMap = new Map<string, number>();

  // Load existing items
  existingCart.forEach(item => {
    mergedMap.set(item.productId, item.quantity);
  });

  // Merge guest items
  if (Array.isArray(guestItems)) {
    guestItems.forEach(gItem => {
      const current = mergedMap.get(gItem.productId) || 0;
      mergedMap.set(gItem.productId, current + gItem.quantity);
    });
  }

  const itemsToEnrich = Array.from(mergedMap.entries()).map(([productId, quantity]) => ({
    productId,
    quantity
  }));

  const enriched = enrichCartItems(itemsToEnrich);
  db.userCarts.set(userId, enriched);

  logTransaction('cart_sync', 'success', `Synced ${enriched.length} cart items for user ${userId}`, userId);

  res.json({
    message: 'Cart synchronized successfully',
    items: enriched
  });
});

// POST /api/cart/add - Add item to cart with inventory check
cartRouter.post('/add', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  const product = db.products.get(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found in catalog' });
  }

  if (product.stock <= 0) {
    return res.status(400).json({
      error: `Sorry, "${product.name}" is currently out of stock.`,
      code: 'OUT_OF_STOCK'
    });
  }

  if (!req.user) {
    // Return validated item for guest cart local storage
    const addedQty = Math.min(quantity, product.stock);
    return res.json({
      message: 'Item ready for guest cart',
      item: {
        productId,
        quantity: addedQty,
        price: product.price,
        product
      }
    });
  }

  const userId = req.user.id;
  const currentCart = db.userCarts.get(userId) || [];
  const existingIndex = currentCart.findIndex(i => i.productId === productId);

  let newQuantity = quantity;
  if (existingIndex > -1) {
    newQuantity = currentCart[existingIndex].quantity + quantity;
  }

  if (newQuantity > product.stock) {
    return res.status(400).json({
      error: `Only ${product.stock} units available in inventory for "${product.name}".`,
      code: 'EXCEEDS_STOCK',
      availableStock: product.stock
    });
  }

  if (existingIndex > -1) {
    currentCart[existingIndex].quantity = newQuantity;
  } else {
    currentCart.push({
      productId,
      quantity: newQuantity,
      price: product.price,
      product
    });
  }

  db.userCarts.set(userId, currentCart);
  logTransaction('cart_sync', 'success', `Added "${product.name}" (qty: ${quantity}) to user cart`, userId);

  res.json({
    message: 'Item added to cart',
    items: currentCart
  });
});

// PUT /api/cart/update - Update quantity of cart item
cartRouter.put('/update', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { productId, quantity } = req.body;

  if (!productId || typeof quantity !== 'number') {
    return res.status(400).json({ error: 'Valid productId and quantity are required' });
  }

  const product = db.products.get(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (quantity > product.stock) {
    return res.status(400).json({
      error: `Cannot request ${quantity} units. Only ${product.stock} left in stock.`,
      code: 'EXCEEDS_STOCK',
      availableStock: product.stock
    });
  }

  if (!req.user) {
    return res.json({
      message: 'Quantity validated for guest cart',
      productId,
      quantity: Math.max(0, quantity)
    });
  }

  const userId = req.user.id;
  let currentCart = db.userCarts.get(userId) || [];

  if (quantity <= 0) {
    currentCart = currentCart.filter(i => i.productId !== productId);
  } else {
    const item = currentCart.find(i => i.productId === productId);
    if (item) {
      item.quantity = quantity;
    } else {
      currentCart.push({
        productId,
        quantity,
        price: product.price,
        product
      });
    }
  }

  db.userCarts.set(userId, currentCart);
  res.json({
    message: 'Cart updated',
    items: currentCart
  });
});

// DELETE /api/cart/remove/:productId - Remove item from persistent cart
cartRouter.delete('/remove/:productId', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;

  if (!req.user) {
    return res.json({ message: 'Removed from guest session' });
  }

  const userId = req.user.id;
  let currentCart = db.userCarts.get(userId) || [];
  currentCart = currentCart.filter(i => i.productId !== productId);
  db.userCarts.set(userId, currentCart);

  res.json({
    message: 'Item removed from cart',
    items: currentCart
  });
});

// POST /api/cart/clear - Clear all cart items
cartRouter.post('/clear', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    db.userCarts.set(req.user.id, []);
  }
  res.json({ message: 'Cart cleared', items: [] });
});
