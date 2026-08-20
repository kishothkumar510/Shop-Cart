import React from 'react';
import { ShieldCheck, Lock, CreditCard, Sparkles, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeroBannerProps {
  onOpenSecurityConsole: () => void;
  onOpenInventorySimulator: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onOpenSecurityConsole,
  onOpenInventorySimulator
}) => {
  const { user, isAuthenticated, quickLoginDemo } = useAuth();

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 sm:p-10 mb-8 shadow-2xl">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-emerald-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 rounded-full bg-teal-600/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/70 text-xs font-semibold text-emerald-300 mb-4 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secure E-Commerce Architecture & Sandbox Engine</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-100 leading-tight">
          Home Appliances & Daily Groceries with{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
            Secure Rupee (₹) Checkout.
          </span>
        </h1>

        {/* Description */}
        <p className="mt-3 text-sm sm:text-base text-zinc-400 leading-relaxed max-w-2xl">
          Shop smart electronics, kitchen essentials, and pantry staples in Indian Rupees. Powered by JWT tokens, bcrypt-hashed credentials, 5% GST calculation, Stripe test sandbox, and atomic inventory locks.
        </p>

        {/* Interactive Sandbox Action Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {!isAuthenticated && (
            <button
              id="hero-quick-login-btn"
              onClick={() => quickLoginDemo('customer')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 transition active:scale-95"
            >
              <KeyRound className="w-4 h-4" />
              <span>⚡ One-Click Demo Sign In</span>
            </button>
          )}

          <button
            id="hero-security-console-btn"
            onClick={onOpenSecurityConsole}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Audit JWT & Hashed DB</span>
          </button>

          <button
            id="hero-inventory-simulator-btn"
            onClick={onOpenInventorySimulator}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
          >
            <CreditCard className="w-4 h-4 text-amber-400" />
            <span>Test Stock Adjustments</span>
          </button>
        </div>

        {/* Architecture Badges */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-zinc-200">JWT Token Auth</div>
              <div className="text-[11px] text-zinc-500">7-Day Signed Payload</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <div className="font-bold text-zinc-200">Bcrypt Hashing</div>
              <div className="text-[11px] text-zinc-500">10 Salt Rounds</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-300">
            <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <div className="font-bold text-zinc-200">Stripe Sandbox</div>
              <div className="text-[11px] text-zinc-500">Card Simulation Flows</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-zinc-300">
            <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
            <div>
              <div className="font-bold text-zinc-200">Atomic Stock</div>
              <div className="text-[11px] text-zinc-500">Real-time Decrement</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
