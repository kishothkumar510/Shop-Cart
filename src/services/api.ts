import { AuthResponse, CartItem, Order, PaymentDetails, Product, PromoCode, ShippingAddress, TransactionLog, User } from '../types';

const TOKEN_STORAGE_KEY = 'ecommerce_jwt_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMessage = data.error || data.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    (error as unknown as { status: number; data: unknown }).status = response.status;
    (error as unknown as { status: number; data: unknown }).data = data;
    throw error;
  }

  return data as T;
}

export const api = {
  // Auth API
  auth: {
    getDemoAccounts: () => request<{ role: string; label: string; email: string; password: string; description: string }[]>('/api/auth/demo-accounts'),
    register: (payload: { name: string; email: string; password: string; phone?: string }) => 
      request<AuthResponse>('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
    login: (payload: { email: string; password: string }) => 
      request<AuthResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
    getMe: () => request<{ user: User }>('/api/auth/me'),
    updateProfile: (payload: { name?: string; phone?: string; defaultAddress?: ShippingAddress }) => 
      request<{ user: User }>('/api/auth/profile', { method: 'PUT', body: JSON.stringify(payload) }),
    inspectToken: (token: string) => 
      request<{ decoded: unknown; valid: boolean }>('/api/auth/inspect-token', { method: 'POST', body: JSON.stringify({ token }) })
  },

  // Products & Inventory API
  products: {
    getAll: (params?: { category?: string; search?: string; sort?: string }) => {
      const query = new URLSearchParams();
      if (params?.category) query.set('category', params.category);
      if (params?.search) query.set('search', params.search);
      if (params?.sort) query.set('sort', params.sort);
      return request<{ products: Product[]; total: number }>(`/api/products?${query.toString()}`);
    },
    getById: (id: string) => request<Product>(`/api/products/${id}`),
    updateStock: (id: string, payload: { stock?: number; delta?: number }) => 
      request<{ message: string; product: Product }>(`/api/products/${id}/stock`, { method: 'PUT', body: JSON.stringify(payload) }),
    getInventorySummary: () => request<{
      totalProducts: number;
      totalUnits: number;
      inventoryValue: number;
      lowStockCount: number;
      outOfStockCount: number;
      lowStockItems: Product[];
      outOfStockItems: Product[];
    }>('/api/products/inventory/summary')
  },

  // Cart State Engine API
  cart: {
    getCart: () => request<{ items: CartItem[] }>('/api/cart'),
    sync: (guestItems: { productId: string; quantity: number }[]) => 
      request<{ message: string; items: CartItem[] }>('/api/cart/sync', { method: 'POST', body: JSON.stringify({ guestItems }) }),
    addItem: (productId: string, quantity = 1) => 
      request<{ message: string; items?: CartItem[]; item?: CartItem }>('/api/cart/add', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
    updateQuantity: (productId: string, quantity: number) => 
      request<{ message: string; items?: CartItem[] }>('/api/cart/update', { method: 'PUT', body: JSON.stringify({ productId, quantity }) }),
    removeItem: (productId: string) => 
      request<{ message: string; items?: CartItem[] }>(`/api/cart/remove/${productId}`, { method: 'DELETE' }),
    clear: () => request<{ message: string; items: CartItem[] }>('/api/cart/clear', { method: 'POST' })
  },

  // Checkout & Orders API
  checkout: {
    validatePromo: (code: string, subtotal: number) => 
      request<{ valid: boolean; promo: PromoCode & { calculatedDiscount: number } }>('/api/checkout/validate-promo', {
        method: 'POST',
        body: JSON.stringify({ code, subtotal })
      }),
    processPayment: (payload: {
      items: { productId: string; quantity: number }[];
      shippingAddress: ShippingAddress;
      shippingMethod: { id: string; name: string; price: number; estimatedDelivery: string };
      paymentDetails: PaymentDetails;
      promoCode?: string;
    }) => request<{ message: string; order: Order }>('/api/checkout/process-payment', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    getOrders: () => request<{ orders: Order[] }>('/api/checkout/orders'),
    getOrderById: (id: string) => request<{ order: Order }>(`/api/checkout/orders/${id}`)
  },

  // Admin & Security Sandbox API
  admin: {
    getLogs: () => request<{ total: number; logs: TransactionLog[] }>('/api/admin/logs'),
    getStats: () => request<{
      usersCount: number;
      users: { id: string; name: string; email: string; role: string; createdAt: string; hasHashedPassword: boolean }[];
      productsCount: number;
      ordersCount: number;
      activeCartsCount: number;
      totalSalesVolume: number;
      inventoryStockUnits: number;
    }>('/api/admin/stats'),
    resetDatabase: () => request<{ message: string }>('/api/admin/reset', { method: 'POST' })
  }
};
