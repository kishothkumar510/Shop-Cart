import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Tag, ShoppingBag, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout, onToast }) => {
  const {
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
    updateQuantity,
    removeFromCart,
    clearCart,
    applyPromoCode,
    removePromoCode
  } = useCart();

  const { isAuthenticated } = useAuth();
  const [promoInput, setPromoInput] = useState('');
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  if (!isCartOpen) return null;

  const handleApplyPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;

    setIsApplyingPromo(true);
    const res = await applyPromoCode(promoInput.trim());
    setIsApplyingPromo(false);

    if (res.success) {
      onToast(res.message || 'Promo code applied!', 'success');
      setPromoInput('');
    } else {
      onToast(res.message || 'Invalid promo code', 'error');
    }
  };

  const freeShippingThreshold = 499;
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={() => setIsCartOpen(false)} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          id="cart-drawer-panel"
          className="w-screen max-w-md bg-zinc-900 border-l border-zinc-800 text-zinc-100 flex flex-col shadow-2xl relative"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
            <div className="flex items-center gap-2.5">
              <ShoppingBag className="w-5 h-5 text-emerald-400" />
              <h2 className="font-bold text-lg text-zinc-100">Shopping Cart</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {items.length > 0 && (
                <button
                  id="clear-cart-btn"
                  onClick={clearCart}
                  className="text-xs text-zinc-400 hover:text-rose-400 transition mr-2"
                >
                  Clear
                </button>
              )}
              <button
                id="close-cart-drawer-btn"
                onClick={() => setIsCartOpen(false)}
                className="w-8 h-8 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sync Status Banner */}
          <div className="px-4 py-1.5 bg-zinc-950/70 border-b border-zinc-800/60 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>
              {isAuthenticated ? '⚡ Synced to persistent user database' : '💾 Guest Cart (Saved locally)'}
            </span>
            <span className="font-mono text-emerald-400/90 text-[10px]">Real-time Inventory</span>
          </div>

          {/* Free Shipping Progress Indicator */}
          {subtotal > 0 && (
            <div className="p-3 bg-zinc-950/40 border-b border-zinc-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-zinc-300 font-medium">
                  {amountNeededForFreeShipping === 0
                    ? '🎉 You unlocked Free Express Delivery!'
                    : `Add ₹${amountNeededForFreeShipping.toLocaleString('en-IN')} more for Free Delivery`}
                </span>
                <span className="text-zinc-400 font-mono text-[11px]">
                  ₹{subtotal.toLocaleString('en-IN')}/₹{freeShippingThreshold}
                </span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-400">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-500 mb-4 border border-zinc-700">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-zinc-200 text-lg">Your cart is empty</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs">
                  Explore our premium home appliances, kitchen tools, and daily grocery collection.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition"
                >
                  Explore ShopCart
                </button>
              </div>
            ) : (
              items.map((item) => {
                const isMaxStock = item.quantity >= item.product.stock;
                return (
                  <div
                    key={item.productId}
                    id={`cart-item-${item.productId}`}
                    className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl flex gap-3 items-center group transition"
                  >
                    {/* Item Thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-zinc-100 text-sm truncate">
                        {item.product.name}
                      </h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs font-bold text-emerald-400">
                          ₹{item.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          Stock: {item.product.stock}
                        </span>
                      </div>

                      {/* Quantity selector */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center border border-zinc-700 bg-zinc-900 rounded-lg overflow-hidden">
                          <button
                            id={`decrease-qty-${item.productId}`}
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold text-zinc-200">
                            {item.quantity}
                          </span>
                          <button
                            id={`increase-qty-${item.productId}`}
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            disabled={isMaxStock}
                            className={`p-1 transition ${
                              isMaxStock
                                ? 'text-zinc-600 cursor-not-allowed'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            }`}
                            title={isMaxStock ? 'Max available stock reached' : 'Increase quantity'}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {isMaxStock && (
                          <span className="text-[10px] text-amber-400 font-medium">
                            Max stock reached
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Total & Remove */}
                    <div className="flex flex-col items-end justify-between h-full py-1">
                      <span className="text-sm font-bold text-zinc-100">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </span>
                      <button
                        id={`remove-item-${item.productId}`}
                        onClick={() => removeFromCart(item.productId)}
                        className="text-zinc-500 hover:text-rose-400 p-1 transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer & Checkout calculation */}
          {items.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 space-y-3">
              {/* Promo Code Input */}
              <form onSubmit={handleApplyPromo} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    id="promo-code-input"
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                    placeholder="Promo (SHOP200, GROCERY15...)"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 pl-8 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 uppercase font-mono"
                  />
                </div>
                <button
                  id="apply-promo-btn"
                  type="submit"
                  disabled={isApplyingPromo || !promoInput.trim()}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition disabled:opacity-50"
                >
                  {isApplyingPromo ? 'Checking...' : 'Apply'}
                </button>
              </form>

              {/* Promo active pill */}
              {appliedPromo && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <Tag className="w-3.5 h-3.5" />
                    <span className="font-mono font-bold">{appliedPromo.code}</span>
                    <span className="text-[11px] text-zinc-400">({appliedPromo.description})</span>
                  </div>
                  <button
                    onClick={removePromoCode}
                    className="text-zinc-400 hover:text-rose-400 text-xs font-bold px-1"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Price Calculation Breakdown */}
              <div className="space-y-1.5 text-xs text-zinc-400 pt-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-zinc-200">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount</span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Delivery</span>
                  <span className="font-medium text-zinc-200">
                    {shipping === 0 ? <span className="text-emerald-400">Free</span> : `₹${shipping.toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated GST (5%)</span>
                  <span className="font-medium text-zinc-200">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-zinc-100 pt-2 border-t border-zinc-800">
                  <span>Final Order Total</span>
                  <span className="text-emerald-400 text-base font-extrabold">₹{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                id="proceed-to-checkout-btn"
                onClick={() => {
                  setIsCartOpen(false);
                  onProceedToCheckout();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-xl shadow-emerald-950/80 transition active:scale-98"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Stripe Sandbox Simulation • Atomic Stock Locking</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
