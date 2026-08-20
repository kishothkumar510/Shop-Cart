import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider, useCart } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ProductCard } from './components/ProductCard';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrdersView } from './components/OrdersView';
import { SecurityConsoleModal } from './components/SecurityConsoleModal';
import { InventoryManagerModal } from './components/InventoryManagerModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Product, Order } from './types';
import { api } from './services/api';
import { Filter, ArrowUpDown, RefreshCw, ShieldCheck, Lock, Sparkles } from 'lucide-react';

function StorefrontContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('featured');

  // Modal States
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.products.getAll({
        category: activeCategory,
        search: searchQuery,
        sort: sortOption
      });
      setProducts(res.products || []);
    } catch (err) {
      console.error('Failed to load products:', err);
      addToast('Error connecting to products catalog API', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [activeCategory, searchQuery, sortOption]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* Top Navbar */}
      <Navbar
        onOpenSecurityConsole={() => setIsSecurityOpen(true)}
        onOpenInventoryManager={() => setIsInventoryOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Hero Banner with Security & Architecture Highlights */}
        <HeroBanner
          onOpenSecurityConsole={() => setIsSecurityOpen(true)}
          onOpenInventorySimulator={() => setIsInventoryOpen(true)}
        />

        {/* Product Filter & Control Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-200">Catalog Collection</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono">
              {products.length} {products.length === 1 ? 'product' : 'products'} available
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
              <span>Sort by:</span>
              <select
                id="sort-products-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="featured">Featured First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="stock">Stock Availability</option>
              </select>
            </div>

            <button
              onClick={fetchProducts}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition"
              title="Refresh Catalog"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Product Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-12">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl bg-zinc-900/60 border border-zinc-800 p-4 h-80 animate-pulse flex flex-col justify-between"
              >
                <div className="w-full aspect-square bg-zinc-800 rounded-xl mb-4" />
                <div className="space-y-2">
                  <div className="h-4 bg-zinc-800 rounded w-3/4" />
                  <div className="h-3 bg-zinc-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Filter className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-200">No matching products found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Try adjusting your search query or reset category filter to "All Products".
            </p>
            <button
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950 transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onQuickView={(p) => setQuickViewProduct(p)}
                onToast={addToast}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer with Security Architecture Overview */}
      <footer className="mt-16 border-t border-zinc-800/80 bg-zinc-950 text-xs text-zinc-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-zinc-100 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>NEXUS SECURE STORE</span>
              </div>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Full-stack architecture featuring persistent user state, signed JWT authorization headers, bcrypt password stretching, and atomic transaction handling.
              </p>
            </div>

            <div>
              <h5 className="font-bold text-zinc-200 mb-2.5 text-xs uppercase tracking-wider">
                Auth & Security
              </h5>
              <ul className="space-y-1.5 text-[11px] text-zinc-400">
                <li>• JSON Web Token (JWT) Bearer Protocol</li>
                <li>• Bcrypt (10 Salt Rounds) Credential Hashing</li>
                <li>• Real-Time Token Claims Inspection</li>
                <li>• Stateless Session Re-validation</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-zinc-200 mb-2.5 text-xs uppercase tracking-wider">
                Cart & Checkout Pipeline
              </h5>
              <ul className="space-y-1.5 text-[11px] text-zinc-400">
                <li>• Persistent Database Shopping Cart Engine</li>
                <li>• Stripe Sandbox Payment Processing</li>
                <li>• Atomic Stock Decrement Logic</li>
                <li>• Real-time Inventory Mutex Locks</li>
              </ul>
            </div>

            <div>
              <h5 className="font-bold text-zinc-200 mb-2.5 text-xs uppercase tracking-wider">
                Sandbox Simulator
              </h5>
              <div className="space-y-2">
                <button
                  onClick={() => setIsSecurityOpen(true)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] text-emerald-400 font-medium transition"
                >
                  ⚡ Open JWT & Audit Console
                </button>
                <button
                  onClick={() => setIsInventoryOpen(true)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-[11px] text-amber-400 font-medium transition"
                >
                  ⚡ Adjust Live Stock Counts
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-zinc-500">
            <div>
              © 2026 Nexus Vault Store • Secure E-Commerce Engine & Stripe Sandbox Module
            </div>
            <div className="flex items-center gap-4">
              <span>Express REST API</span>
              <span>•</span>
              <span>React 19 + TypeScript</span>
              <span>•</span>
              <span>Tailwind CSS</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals and Drawers */}
      <ProductDetailsModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onToast={addToast}
      />

      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
        onToast={addToast}
      />

      <AuthModal onToast={addToast} />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(order) => setConfirmedOrder(order)}
        onToast={addToast}
      />

      <OrderConfirmationModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
        onViewOrders={() => {
          setConfirmedOrder(null);
          setIsOrdersOpen(true);
        }}
      />

      <OrdersView
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        onToast={addToast}
      />

      <SecurityConsoleModal
        isOpen={isSecurityOpen}
        onClose={() => setIsSecurityOpen(false)}
        onToast={addToast}
      />

      <InventoryManagerModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        onInventoryChanged={fetchProducts}
        onToast={addToast}
      />

      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StorefrontContent />
      </CartProvider>
    </AuthProvider>
  );
}
