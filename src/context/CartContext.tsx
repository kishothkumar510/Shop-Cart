import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CartItem, Product, PromoCode } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  appliedPromo: (PromoCode & { calculatedDiscount: number }) | null;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isCheckingOut: boolean;
  setIsCheckingOut: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => Promise<{ success: boolean; message?: string }>;
  updateQuantity: (productId: string, quantity: number) => Promise<{ success: boolean; message?: string }>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyPromoCode: (code: string) => Promise<{ success: boolean; message?: string }>;
  removePromoCode: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_CART_KEY = 'ecommerce_guest_cart';

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<(PromoCode & { calculatedDiscount: number }) | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Load persistent cart from backend or local storage
  const refreshCart = useCallback(async () => {
    if (isAuthenticated) {
      try {
        // If there were guest cart items in localStorage, sync them into the user DB
        const storedGuest = localStorage.getItem(LOCAL_CART_KEY);
        if (storedGuest) {
          try {
            const guestItems = JSON.parse(storedGuest) as { productId: string; quantity: number }[];
            if (guestItems.length > 0) {
              const syncRes = await api.cart.sync(guestItems);
              setItems(syncRes.items);
              localStorage.removeItem(LOCAL_CART_KEY);
              return;
            }
          } catch {
            localStorage.removeItem(LOCAL_CART_KEY);
          }
        }

        const res = await api.cart.getCart();
        setItems(res.items || []);
      } catch (err) {
        console.error('Failed to fetch user cart:', err);
      }
    } else {
      // Guest cart from localStorage
      const stored = localStorage.getItem(LOCAL_CART_KEY);
      if (stored) {
        try {
          const guestItems = JSON.parse(stored) as CartItem[];
          setItems(guestItems);
        } catch {
          setItems([]);
        }
      } else {
        setItems([]);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart, user?.id]);

  // Save guest cart changes to localStorage when not authenticated
  const saveGuestCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(newItems));
  };

  const addToCart = async (product: Product, quantity = 1): Promise<{ success: boolean; message?: string }> => {
    if (product.stock <= 0) {
      return { success: false, message: `"${product.name}" is currently out of stock.` };
    }

    if (isAuthenticated) {
      try {
        const res = await api.cart.addItem(product.id, quantity);
        if (res.items) {
          setItems(res.items);
        } else {
          await refreshCart();
        }
        return { success: true, message: `Added ${quantity}x ${product.name} to cart` };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not add item to cart';
        return { success: false, message };
      }
    } else {
      // Guest mode
      const existing = items.find(i => i.productId === product.id);
      const currentQty = existing ? existing.quantity : 0;
      const targetQty = currentQty + quantity;

      if (targetQty > product.stock) {
        return {
          success: false,
          message: `Only ${product.stock} units available in stock.`
        };
      }

      let updated: CartItem[];
      if (existing) {
        updated = items.map(i => i.productId === product.id ? { ...i, quantity: targetQty } : i);
      } else {
        updated = [...items, { productId: product.id, quantity, price: product.price, product }];
      }

      saveGuestCart(updated);
      return { success: true, message: `Added ${quantity}x ${product.name} to cart` };
    }
  };

  const updateQuantity = async (productId: string, quantity: number): Promise<{ success: boolean; message?: string }> => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return { success: true };
    }

    if (isAuthenticated) {
      try {
        const res = await api.cart.updateQuantity(productId, quantity);
        if (res.items) {
          setItems(res.items);
        }
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Could not update quantity';
        return { success: false, message };
      }
    } else {
      const item = items.find(i => i.productId === productId);
      if (item && quantity > item.product.stock) {
        return { success: false, message: `Max available stock is ${item.product.stock}` };
      }
      const updated = items.map(i => i.productId === productId ? { ...i, quantity } : i);
      saveGuestCart(updated);
      return { success: true };
    }
  };

  const removeFromCart = async (productId: string) => {
    if (isAuthenticated) {
      try {
        const res = await api.cart.removeItem(productId);
        if (res.items) {
          setItems(res.items);
        }
      } catch (err) {
        console.error('Error removing item:', err);
      }
    } else {
      const updated = items.filter(i => i.productId !== productId);
      saveGuestCart(updated);
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await api.cart.clear();
        setItems([]);
      } catch (err) {
        console.error('Error clearing cart:', err);
      }
    } else {
      saveGuestCart([]);
    }
    setAppliedPromo(null);
  };

  const applyPromoCode = async (code: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await api.checkout.validatePromo(code, subtotal);
      if (res.valid) {
        setAppliedPromo(res.promo);
        return { success: true, message: `Promo code "${res.promo.code}" applied: ${res.promo.description}` };
      }
      return { success: false, message: 'Invalid promo code' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to validate promo code';
      return { success: false, message };
    }
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
  };

  // Pricing calculations
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  let discount = 0;
  if (appliedPromo) {
    if (appliedPromo.discountType === 'percentage') {
      discount = (subtotal * appliedPromo.discountValue) / 100;
    } else {
      discount = appliedPromo.discountValue;
    }
    discount = Math.min(discount, subtotal);
  }

  // Free shipping over $150
  const shipping = subtotal === 0 || subtotal >= 150 ? 0 : 12.00;
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = Math.round(taxableAmount * 0.0825 * 100) / 100;
  const total = Math.max(0, Math.round((taxableAmount + shipping + tax) * 100) / 100);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        appliedPromo,
        isCartOpen,
        setIsCartOpen,
        isCheckingOut,
        setIsCheckingOut,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        applyPromoCode,
        removePromoCode,
        refreshCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
