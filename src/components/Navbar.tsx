import React, { useState } from 'react';
import { ShoppingBag, ShieldCheck, User as UserIcon, Package, Terminal, SlidersHorizontal, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  onOpenSecurityConsole: () => void;
  onOpenInventoryManager: () => void;
  onOpenOrders: () => void;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenSecurityConsole,
  onOpenInventoryManager,
  onOpenOrders,
  activeCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange
}) => {
  const { user, isAuthenticated, logout, openAuthModal, quickLoginDemo } = useAuth();
  const { itemCount, setIsCartOpen } = useCart();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'appliances', label: '🏠 Home Appliances' },
    { id: 'grocery', label: '🛒 Daily Groceries' },
    { id: 'kitchen', label: '🍳 Kitchen Essentials' },
    { id: 'electronics', label: '📺 Smart Electronics' },
    { id: 'daily_essentials', label: '🌶️ Spices & Staples' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 text-zinc-100">
      {/* Top Utility Ribbon with Sandbox & Security Indicators */}
      <div className="bg-zinc-900 border-b border-zinc-800/80 px-4 py-1.5 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              JWT Auth + Bcrypt Hashed DB Engine
            </span>
            <span className="hidden sm:inline text-zinc-500">|</span>
            <span className="hidden sm:inline text-zinc-400">
              Stripe Payment Sandbox & Atomic Inventory Engine
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="nav-security-console-btn"
              onClick={onOpenSecurityConsole}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Security & Audit Console</span>
            </button>
            <span className="text-zinc-700">/</span>
            <button
              id="nav-inventory-manager-btn"
              onClick={onOpenInventoryManager}
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-medium hover:underline transition"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Inventory Simulator</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-950/50">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-zinc-100 via-emerald-200 to-teal-300 bg-clip-text text-transparent">
                  ShopCart
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  ₹ INR
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 tracking-tight leading-none hidden sm:block">
                Home Appliances & Daily Groceries
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <input
                id="search-products-input"
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search AC, Mixer Grinder, Basmati Rice, Ghee, TV..."
                className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-lg px-3.5 py-2 pl-9 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <svg
                className="w-4 h-4 text-zinc-500 absolute left-3 top-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-2.5 top-2.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Navigation Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Orders Dashboard Button */}
            <button
              id="nav-orders-btn"
              onClick={onOpenOrders}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition"
            >
              <Package className="w-4 h-4 text-zinc-400" />
              <span className="hidden sm:inline">Orders</span>
            </button>

            {/* Auth Dropdown / Button */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  id="user-menu-toggle-btn"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-lg text-sm transition"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden lg:inline text-zinc-200 font-medium max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                </button>

                {isUserMenuOpen && (
                  <div
                    id="user-dropdown-menu"
                    className="absolute right-0 mt-2 w-64 rounded-xl bg-zinc-900 border border-zinc-700 shadow-2xl p-2 z-50 text-sm"
                    onMouseLeave={() => setIsUserMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-zinc-800">
                      <p className="font-semibold text-zinc-100">{user.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded">
                          {user.role}
                        </span>
                        <span className="text-[10px] text-zinc-500">JWT Verified</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenOrders();
                        }}
                        className="w-full text-left px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg flex items-center gap-2"
                      >
                        <Package className="w-4 h-4 text-zinc-400" />
                        My Order History
                      </button>
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenSecurityConsole();
                        }}
                        className="w-full text-left px-3 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg flex items-center gap-2"
                      >
                        <Terminal className="w-4 h-4 text-emerald-400" />
                        JWT Token Inspector
                      </button>
                    </div>

                    <div className="pt-1 border-t border-zinc-800">
                      <button
                        id="logout-btn"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-rose-400 hover:bg-rose-950/40 rounded-lg flex items-center gap-2 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  id="nav-login-btn"
                  onClick={() => openAuthModal('login')}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition"
                >
                  <UserIcon className="w-4 h-4 text-zinc-400" />
                  <span>Sign In</span>
                </button>
                <button
                  id="nav-demo-customer-btn"
                  onClick={() => quickLoginDemo('customer')}
                  className="hidden md:inline-flex items-center px-2.5 py-2 text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 hover:bg-emerald-950/60 border border-emerald-800/60 rounded-lg transition"
                  title="Instant Test Login with Demo Account"
                >
                  ⚡ Demo User
                </button>
              </div>
            )}

            {/* Shopping Cart Button with live count */}
            <button
              id="nav-cart-btn"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm rounded-lg shadow-lg shadow-emerald-950/50 transition active:scale-95"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              {itemCount > 0 && (
                <span
                  id="cart-item-count-badge"
                  className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold bg-zinc-950 text-emerald-300 rounded-full border border-emerald-400/40"
                >
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`cat-filter-${cat.id}`}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                activeCategory === cat.id
                  ? 'bg-zinc-100 text-zinc-950 font-semibold shadow-sm'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
