import React, { useState, useEffect, useCallback } from 'react';
import { X, SlidersHorizontal, Plus, Minus, AlertTriangle, CheckCircle, Package, RefreshCw } from 'lucide-react';
import { Product } from '../types';
import { api } from '../services/api';

interface InventoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInventoryChanged: () => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const InventoryManagerModal: React.FC<InventoryManagerModalProps> = ({
  isOpen,
  onClose,
  onInventoryChanged,
  onToast
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.products.getAll();
      setProducts(res.products || []);
    } catch (err) {
      console.error('Failed to load products for inventory simulator:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen, fetchProducts]);

  if (!isOpen) return null;

  const handleAdjustStock = async (productId: string, newStock: number) => {
    setUpdatingId(productId);
    try {
      const res = await api.products.updateStock(productId, { stock: Math.max(0, newStock) });
      setProducts(prev => prev.map(p => p.id === productId ? res.product : p));
      onInventoryChanged();
      onToast(`Updated stock for ${res.product.name} to ${res.product.stock} units`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update stock';
      onToast(message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSetStockPreset = (productId: string, preset: 'zero' | 'low' | 'high') => {
    if (preset === 'zero') handleAdjustStock(productId, 0);
    if (preset === 'low') handleAdjustStock(productId, 2);
    if (preset === 'high') handleAdjustStock(productId, 25);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-sans">
      <div
        id="inventory-manager-panel"
        className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-3xl overflow-hidden shadow-2xl text-zinc-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-950/70 border border-amber-700/80 text-amber-400 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-100">
                  Real-time Inventory & Stock Simulator
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                  MUTEX LOCK ENGINE
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Adjust stock levels dynamically to test out-of-stock guards, cart limits, and atomic checkout locks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchProducts}
              disabled={isLoading}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="Refresh Inventory"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-inventory-manager-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Inventory Item Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {products.map((product) => {
            const isOut = product.stock <= 0;
            const isLow = product.stock > 0 && product.stock <= 5;
            const isUpdating = updatingId === product.id;

            return (
              <div
                key={product.id}
                id={`inventory-row-${product.id}`}
                className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                {/* Product Meta */}
                <div className="flex items-center gap-3">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-cover rounded-xl border border-zinc-800 shrink-0"
                  />
                  <div>
                    <div className="font-semibold text-zinc-100 text-sm">{product.name}</div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                      <span className="font-mono text-[11px] text-zinc-500">{product.sku}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">₹{product.price.toLocaleString('en-IN')}</span>
                      {product.unit && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-400 text-[11px]">{product.unit}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stock Controls & Test Scenarios */}
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Status badge */}
                  <div>
                    {isOut ? (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Out of Stock (0)
                      </span>
                    ) : isLow ? (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Low Stock ({product.stock})
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> In Stock ({product.stock})
                      </span>
                    )}
                  </div>

                  {/* Increment/Decrement Buttons */}
                  <div className="flex items-center border border-zinc-700 bg-zinc-900 rounded-xl overflow-hidden">
                    <button
                      id={`inventory-dec-${product.id}`}
                      disabled={product.stock <= 0 || isUpdating}
                      onClick={() => handleAdjustStock(product.id, product.stock - 1)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition disabled:opacity-30"
                      title="Decrement stock by 1"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-3 text-xs font-mono font-bold text-zinc-100 min-w-[36px] text-center">
                      {product.stock}
                    </span>
                    <button
                      id={`inventory-inc-${product.id}`}
                      disabled={isUpdating}
                      onClick={() => handleAdjustStock(product.id, product.stock + 1)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
                      title="Increment stock by 1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSetStockPreset(product.id, 'zero')}
                      disabled={isUpdating}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-900 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-800 transition"
                      title="Simulate Out of Stock"
                    >
                      Set 0
                    </button>
                    <button
                      onClick={() => handleSetStockPreset(product.id, 'low')}
                      disabled={isUpdating}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-900 hover:bg-amber-950/80 text-zinc-400 hover:text-amber-300 border border-zinc-800 hover:border-amber-800 transition"
                      title="Simulate Low Stock"
                    >
                      Set 2
                    </button>
                    <button
                      onClick={() => handleSetStockPreset(product.id, 'high')}
                      disabled={isUpdating}
                      className="px-2 py-1 rounded-lg text-[10px] font-semibold bg-zinc-900 hover:bg-emerald-950/80 text-zinc-400 hover:text-emerald-300 border border-zinc-800 hover:border-emerald-800 transition"
                      title="Replenish stock"
                    >
                      Set 25
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
