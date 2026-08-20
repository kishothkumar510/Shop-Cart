import { Router, Response } from 'express';
import { db, logTransaction } from '../db';
import { authenticateToken, AuthenticatedRequest, optionalAuth } from '../auth';
import { Order, ShippingAddress, PaymentDetails } from '../../src/types';

export const checkoutRouter = Router();

// POST /api/checkout/validate-promo - Validate discount coupon code
checkoutRouter.post('/validate-promo', (req, res) => {
  const { code, subtotal = 0 } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Promo code is required' });
  }

  const cleanCode = code.trim().toUpperCase();
  const promo = db.promoCodes.get(cleanCode);

  if (!promo) {
    return res.status(404).json({ error: `Promo code "${cleanCode}" is invalid or expired.` });
  }

  if (promo.minSpend && subtotal < promo.minSpend) {
    return res.status(400).json({
      error: `Promo code "${cleanCode}" requires a minimum order subtotal of ₹${promo.minSpend.toLocaleString('en-IN')} (Current: ₹${subtotal.toLocaleString('en-IN')}).`
    });
  }

  let calculatedDiscount = 0;
  if (promo.discountType === 'percentage') {
    calculatedDiscount = (subtotal * promo.discountValue) / 100;
  } else {
    calculatedDiscount = promo.discountValue;
  }

  res.json({
    valid: true,
    promo: {
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      description: promo.description,
      calculatedDiscount: Math.min(calculatedDiscount, subtotal)
    }
  });
});

// POST /api/checkout/process-payment - Secure Checkout Engine & Stripe Sandbox Pipeline
checkoutRouter.post('/process-payment', optionalAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      items,
      shippingAddress,
      shippingMethod,
      paymentDetails,
      promoCode
    } = req.body as {
      items: { productId: string; quantity: number }[];
      shippingAddress: ShippingAddress;
      shippingMethod: { id: string; name: string; price: number; estimatedDelivery: string };
      paymentDetails: PaymentDetails;
      promoCode?: string;
    };

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Cart is empty. Please add items to checkout.' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.street || !shippingAddress.city || !shippingAddress.zipCode) {
      return res.status(400).json({ error: 'Complete shipping address is required.' });
    }

    if (!paymentDetails || !paymentDetails.cardNumber) {
      return res.status(400).json({ error: 'Payment card details are required.' });
    }

    // Step 1: Inventory Lock & Stock Availability Verification
    const orderItems: Order['items'] = [];
    let calculatedSubtotal = 0;
    const inventoryErrors: string[] = [];

    for (const item of items) {
      const product = db.products.get(item.productId);
      if (!product) {
        inventoryErrors.push(`Product ID ${item.productId} does not exist.`);
        continue;
      }

      if (product.stock < item.quantity) {
        inventoryErrors.push(`Insufficient inventory for "${product.name}". Requested: ${item.quantity}, Available: ${product.stock}`);
      } else {
        calculatedSubtotal += product.price * item.quantity;
        orderItems.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          quantity: item.quantity,
          price: product.price,
          imageUrl: product.imageUrl
        });
      }
    }

    if (inventoryErrors.length > 0) {
      logTransaction('inventory_lock', 'error', `Checkout stock verification failed: ${inventoryErrors.join('; ')}`, req.user?.id);
      return res.status(409).json({
        error: 'Inventory check failed',
        details: inventoryErrors,
        code: 'INVENTORY_UNAVAILABLE'
      });
    }

    // Step 2: Calculate Discounts, Tax, and Final Total
    let discount = 0;
    if (promoCode) {
      const cleanCode = promoCode.trim().toUpperCase();
      const promo = db.promoCodes.get(cleanCode);
      if (promo) {
        if (!promo.minSpend || calculatedSubtotal >= promo.minSpend) {
          if (promo.discountType === 'percentage') {
            discount = (calculatedSubtotal * promo.discountValue) / 100;
          } else {
            discount = promo.discountValue;
          }
        }
      }
    }

    const shippingPrice = shippingMethod?.price || 0;
    const taxableAmount = Math.max(0, calculatedSubtotal - discount);
    const taxRate = 0.05; // 5% GST on grocery & essentials average
    const estimatedTax = Math.round(taxableAmount * taxRate * 100) / 100;
    const finalTotal = Math.max(0, taxableAmount + shippingPrice + estimatedTax);

    // Step 3: Payment Sandbox Validation & Gateways
    const cleanCard = paymentDetails.cardNumber.replace(/\s+/g, '');
    const last4 = cleanCard.slice(-4) || '4242';

    // Simulate Sandbox Scenarios
    if (paymentDetails.simulateScenario === 'decline' || cleanCard.endsWith('0002')) {
      logTransaction('payment_intent', 'error', `Stripe Sandbox Card Declined for card ending in ${last4}`, req.user?.id);
      return res.status(402).json({
        error: 'Sandbox Card Declined: The test card was declined by the simulated card issuer.',
        code: 'CARD_DECLINED'
      });
    }

    if (paymentDetails.simulateScenario === 'insufficient_funds' || cleanCard.endsWith('0003')) {
      logTransaction('payment_intent', 'error', `Stripe Sandbox Insufficient Funds for card ending in ${last4}`, req.user?.id);
      return res.status(402).json({
        error: 'Sandbox Insufficient Funds: The payment account has insufficient balance.',
        code: 'INSUFFICIENT_FUNDS'
      });
    }

    if (paymentDetails.simulateScenario === 'expired_card' || cleanCard.endsWith('0004')) {
      logTransaction('payment_intent', 'error', `Stripe Sandbox Expired Card for card ending in ${last4}`, req.user?.id);
      return res.status(400).json({
        error: 'Sandbox Card Expired: The expiration date provided is in the past.',
        code: 'EXPIRED_CARD'
      });
    }

    // Step 4: Successful Sandbox Payment Execution
    const transactionId = `txn_sbx_in_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    const fingerprint = `fp_sim_in_${Math.random().toString(36).substr(2, 12)}`;

    logTransaction(
      'payment_intent',
      'success',
      `Payment of ₹${finalTotal.toLocaleString('en-IN')} authorized successfully via Stripe Sandbox (Txn: ${transactionId})`,
      req.user?.id,
      { amount: finalTotal, last4, transactionId }
    );

    // Step 5: Atomic Inventory Decrement Path
    for (const item of orderItems) {
      const product = db.products.get(item.productId)!;
      const previousStock = product.stock;
      product.stock = Math.max(0, product.stock - item.quantity);
      db.products.set(product.id, product);

      logTransaction(
        'inventory_decrement',
        'success',
        `Inventory deducted for "${product.name}" (${product.sku}): ${previousStock} -> ${product.stock} (Deducted: ${item.quantity})`,
        req.user?.id,
        { productId: product.id, deducted: item.quantity, remaining: product.stock }
      );
    }

    // Step 6: Create and Save Order
    const orderId = `ORD-IN-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const trackingNumber = `DELHIVERY-IN-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

    const newOrder: Order = {
      id: orderId,
      userId: req.user ? req.user.id : `guest_${Date.now()}`,
      userEmail: req.user ? req.user.email : shippingAddress.fullName.toLowerCase().replace(/\s+/g, '.') + '@shopcart-sandbox.in',
      userName: req.user ? req.user.name : shippingAddress.fullName,
      items: orderItems,
      subtotal: Math.round(calculatedSubtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      shipping: shippingPrice,
      tax: estimatedTax,
      total: Math.round(finalTotal * 100) / 100,
      promoCode: promoCode || undefined,
      shippingAddress,
      shippingMethod: shippingMethod || {
        id: 'ship_standard',
        name: 'Standard Express Ground',
        price: 0,
        estimatedDelivery: '2-4 Business Days'
      },
      payment: {
        transactionId,
        paymentMethod: `RuPay / Card (•••• ${last4})`,
        cardLast4: last4,
        status: 'succeeded',
        paidAt: new Date().toISOString(),
        gateway: 'Stripe Sandbox Engine v2.4',
        fingerprint
      },
      status: 'confirmed',
      trackingNumber,
      createdAt: new Date().toISOString()
    };

    db.orders.set(orderId, newOrder);

    // Step 7: Clear user's persistent cart if authenticated
    if (req.user) {
      db.userCarts.set(req.user.id, []);
      // If user chose to save address, update user profile defaultAddress
      const userRecord = db.users.get(req.user.email.toLowerCase());
      if (userRecord && !userRecord.defaultAddress) {
        userRecord.defaultAddress = shippingAddress;
        db.users.set(req.user.email.toLowerCase(), userRecord);
      }
    }

    logTransaction(
      'order_created',
      'success',
      `Order ${orderId} created successfully for ${newOrder.userName} (₹${finalTotal.toLocaleString('en-IN')})`,
      req.user?.id,
      { orderId, total: finalTotal, itemsCount: orderItems.length }
    );

    res.status(201).json({
      message: 'Transaction completed successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Checkout processing error:', error);
    res.status(500).json({ error: 'Internal server error while processing checkout' });
  }
});

// GET /api/orders - Get user's orders (or all if admin)
checkoutRouter.get('/orders', authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const allOrders = Array.from(db.orders.values());

  let userOrders: Order[];
  if (user.role === 'admin') {
    userOrders = allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    userOrders = allOrders
      .filter(o => o.userId === user.id || o.userEmail.toLowerCase() === user.email.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  res.json({ orders: userOrders });
});

// GET /api/orders/:id - Get specific order by ID
checkoutRouter.get('/orders/:id', optionalAuth, (req: AuthenticatedRequest, res: Response) => {
  const order = db.orders.get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ order });
});
