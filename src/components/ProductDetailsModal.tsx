import React, { useState } from 'react';
import { X, Star, ShoppingBag, ShieldCheck, Truck, RefreshCw, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, onClose, onToast }) => {
  const { addToCart, setIsCartOpen } = useCart();
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  if (!product) return null;

  const isOutOfStock = product.stock <= 0;
  const maxSelectable = Math.max(1, Math.min(product.stock, 10));

  const handleAddToCart = async () => {
    if (isOutOfStock) return;
    setIsAdding(true);
    const res = await addToCart(product, selectedQuantity);
    setIsAdding(false);

    if (res.success) {
      onToast(res.message || `Added ${selectedQuantity} items to cart`, 'success');
      onClose();
      setIsCartOpen(true);
    } else {
      onToast(res.message || 'Could not add to cart', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div
        id="product-details-modal"
        className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-3xl overflow-hidden shadow-2xl text-zinc-100 flex flex-col md:flex-row"
      >
        {/* Close Button */}
        <button
          id="close-product-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center border border-zinc-700 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Media Column */}
        <div className="md:w-1/2 bg-zinc-950 flex flex-col items-center justify-center p-6 relative">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
            <img
              src={product.imageUrl}
              alt={product.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            {product.isFeatured && (
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-zinc-950 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Featured Item
              </span>
            )}
          </div>

          <div className="w-full mt-4 flex items-center justify-between text-xs text-zinc-400 px-1 font-mono">
            <span>SKU: {product.sku}</span>
            <span>Category: {product.category.toUpperCase()}</span>
          </div>
        </div>

        {/* Product Info Column */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto max-h-[80vh]">
          <div>
            {/* Title & Rating */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span className="font-bold">{product.rating}</span>
                <span className="text-zinc-400 text-[11px]">({product.reviewCount} reviews)</span>
              </div>

              {isOutOfStock ? (
                <span className="text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded-full">
                  Out of Stock
                </span>
              ) : (
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  {product.stock} units available
                </span>
              )}
            </div>

            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">
              {product.name}
            </h2>
            <p className="text-sm text-emerald-400/90 font-medium mt-1">
              {product.tagline}
            </p>

            {/* Price section */}
            <div className="flex items-baseline gap-3 my-4">
              <span className="text-3xl font-extrabold text-zinc-100">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.compareAtPrice && (
                <span className="text-base text-zinc-500 line-through">
                  ₹{product.compareAtPrice.toLocaleString('en-IN')}
                </span>
              )}
              {product.compareAtPrice && (
                <span className="text-xs font-bold text-rose-400 bg-rose-950/40 border border-rose-800/50 px-2 py-0.5 rounded">
                  Save ₹{(product.compareAtPrice - product.price).toLocaleString('en-IN')}
                </span>
              )}
              {product.unit && (
                <span className="text-xs font-medium text-emerald-400 bg-emerald-950/50 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                  {product.unit}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              {product.description}
            </p>

            {/* Key Features */}
            {product.features && product.features.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Key Highlights
                </h4>
                <ul className="space-y-1.5 text-xs text-zinc-300">
                  {product.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Technical Specifications */}
            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="mt-4 pt-3 border-t border-zinc-800">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                  Technical Specifications
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(product.specs).map(([key, val]) => (
                    <div key={key} className="bg-zinc-950/60 p-2 rounded-lg border border-zinc-800/60">
                      <span className="text-zinc-400 block text-[10px] uppercase font-mono">{key}</span>
                      <span className="text-zinc-200 font-medium">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quantity and Actions Bar */}
          <div className="mt-6 pt-4 border-t border-zinc-800 flex flex-col gap-3">
            {!isOutOfStock ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="modal-product-qty" className="text-xs text-zinc-400 font-medium">
                    Qty:
                  </label>
                  <select
                    id="modal-product-qty"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    {Array.from({ length: maxSelectable }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  id="modal-add-to-cart-btn"
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/60 transition active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isAdding ? 'Securing Stock...' : `Add to Cart • ₹${(product.price * selectedQuantity).toLocaleString('en-IN')}`}</span>
                </button>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Currently out of stock. Use the Inventory Simulator to replenish inventory.</span>
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] text-zinc-400">
              <div className="flex items-center gap-1.5 justify-center bg-zinc-950/40 py-1.5 rounded-lg border border-zinc-800/40">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center bg-zinc-950/40 py-1.5 rounded-lg border border-zinc-800/40">
                <Truck className="w-3.5 h-3.5 text-sky-400" />
                <span>Fast Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center bg-zinc-950/40 py-1.5 rounded-lg border border-zinc-800/40">
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>30-Day Return</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
