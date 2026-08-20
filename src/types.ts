export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  createdAt: string;
  phone?: string;
  defaultAddress?: ShippingAddress;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: string;
}

export interface Product {
  id: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  category: 'appliances' | 'grocery' | 'kitchen' | 'electronics' | 'daily_essentials';
  stock: number;
  sku: string;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  features: string[];
  specs: Record<string, string>;
  isFeatured?: boolean;
  unit?: string; // e.g. "1 kg", "5 Litres", "1 Unit", "Pack of 2"
}

export interface CartItem {
  productId: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  estimatedTax: number;
  total: number;
  appliedPromo?: PromoCode;
}

export interface PromoCode {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minSpend?: number;
  description: string;
}

export interface ShippingAddress {
  fullName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface PaymentDetails {
  method: 'card' | 'stripe_sandbox';
  cardNumber: string;
  cardExp: string;
  cardCvc: string;
  cardholderName: string;
  saveCard?: boolean;
  simulateScenario?: 'success' | 'decline' | 'insufficient_funds' | 'expired_card';
}

export interface Order {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: {
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    price: number;
    imageUrl: string;
  }[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  promoCode?: string;
  shippingAddress: ShippingAddress;
  shippingMethod: {
    id: string;
    name: string;
    price: number;
    estimatedDelivery: string;
  };
  payment: {
    transactionId: string;
    paymentMethod: string;
    cardLast4: string;
    status: 'succeeded' | 'failed' | 'refunded';
    paidAt: string;
    gateway: 'Stripe Sandbox Engine v2.4';
    fingerprint: string;
  };
  status: 'confirmed' | 'processing' | 'shipped' | 'delivered';
  trackingNumber: string;
  createdAt: string;
}

export interface TransactionLog {
  id: string;
  timestamp: string;
  type: 'auth' | 'cart_sync' | 'inventory_lock' | 'payment_intent' | 'inventory_decrement' | 'order_created';
  status: 'success' | 'warning' | 'error';
  userId?: string;
  details: string;
  metadata?: Record<string, unknown>;
}
