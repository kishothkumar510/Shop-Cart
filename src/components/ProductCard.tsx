import React, { useState } from 'react';
import { Star, Plus, Check, Eye, AlertTriangle } from 'lucide-react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onQuickView: (product: Product) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onQuickView, onToast }) => {
  const { addToCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock <= 0) return;

    setIsAdding(true);
    const result = await addToCart(product, 1);
    setIsAdding(false);

    if (result.success) {
      setJustAdded(true);
      onToast(result.message || `Added ${product.name} to cart`, 'success');
      setTimeout(() => setJustAdded(false), 1800);
    } else {
      onToast(result.message || 'Could not add to cart', 'error');
    }
  };

  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  return (
    <div
      id={`product-card-${product.id}`}
      onClick={() => onQuickView(product)}
      className="group relative flex flex-col rounded-2xl bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700 transition-all duration-200 overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-zinc-950/80"
    >
      {/* Top badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
        {product.isFeatured && (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500 text-zinc-950 shadow-md">
            Best Seller
          </span>
        )}
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/90 text-white shadow-md">
            Save ₹{(product.compareAtPrice - product.price).toLocaleString('en-IN')}
          </span>
        )}
      </div>

      {/* Stock status indicator chip on top-right */}
      <div className="absolute top-3 right-3 z-10">
        {isOutOfStock ? (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-zinc-900/90 text-rose-400 border border-rose-500/40 backdrop-blur-md">
            Sold Out
          </span>
        ) : isLowStock ? (
          <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-950/80 text-amber-300 border border-amber-500/40 backdrop-blur-md flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Only {product.stock} left
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono text-zinc-400 bg-zinc-900/80 border border-zinc-700 backdrop-blur-md">
            {product.stock} in stock
          </span>
        )}
      </div>

      {/* Image Container with hover zoom */}
      <div className="relative w-full aspect-square bg-zinc-950 overflow-hidden flex items-center justify-center">
        <img
          src={product.imageUrl}
          alt={product.name}
          referrerPolicy="no-referrer"
          className={`w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105 ${
            isOutOfStock ? 'opacity-40 grayscale' : 'opacity-90 group-hover:opacity-100'
          }`}
          loading="lazy"
        />

        {/* Hover Quick View Overlay */}
        <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            id={`quick-view-btn-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 text-zinc-100 text-xs font-medium border border-zinc-700 shadow-xl backdrop-blur-md hover:bg-zinc-800 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            Quick Inspect
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Unit */}
          <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
            <span className="capitalize font-semibold text-emerald-400">
              {product.category.replace('_', ' ')}
            </span>
            {product.unit ? (
              <span className="text-[11px] text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded font-medium">{product.unit}</span>
            ) : (
              <span className="font-mono text-[10px] text-zinc-400">{product.sku}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-zinc-100 text-base leading-snug group-hover:text-emerald-400 transition-colors line-clamp-1">
            {product.name}
          </h3>

          {/* Tagline */}
          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
            {product.tagline}
          </p>
        </div>

        {/* Rating and Price Section */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1 text-xs text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span className="font-bold">{product.rating}</span>
              <span className="text-zinc-400 text-[11px]">({product.reviewCount})</span>
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-lg font-extrabold text-zinc-100">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.compareAtPrice && (
                <span className="text-xs text-zinc-400 line-through">
                  ₹{product.compareAtPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart button */}
          <button
            id={`add-to-cart-btn-${product.id}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className={`flex items-center justify-center p-2.5 rounded-xl text-sm font-medium transition ${
              isOutOfStock
                ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed border border-zinc-700/50'
                : justAdded
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/60'
                : 'bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white border border-zinc-700 hover:border-emerald-500 shadow-md active:scale-95'
            }`}
            title={isOutOfStock ? 'Item is out of stock' : 'Add 1 to Cart'}
          >
            {justAdded ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
