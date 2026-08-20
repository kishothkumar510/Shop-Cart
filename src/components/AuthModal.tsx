import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, ShieldCheck, KeyRound, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onToast }) => {
  const {
    isAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    closeAuthModal,
    login,
    register,
    quickLoginDemo
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      if (authModalMode === 'login') {
        const user = await login(email, password);
        onToast(`Welcome back, ${user.name}! Session authenticated via JWT.`, 'success');
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your full name');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters long');
        }
        const user = await register(name, email, password, phone);
        onToast(`Account created for ${user.name}! Authenticated with JWT.`, 'success');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      setFormError(message);
      onToast(message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: 'customer' | 'admin') => {
    setIsSubmitting(true);
    setFormError(null);
    try {
      await quickLoginDemo(role);
      onToast(`Logged in as ${role === 'admin' ? 'ShopCart Ops Admin' : 'Rahul Sharma (Customer)'}`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Demo login failed';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 sm:p-8 text-zinc-100 shadow-2xl"
      >
        {/* Close Button */}
        <button
          id="close-auth-modal-btn"
          onClick={closeAuthModal}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-xl text-zinc-100">
              {authModalMode === 'login' ? 'Sign In to Account' : 'Create Secure Account'}
            </h3>
            <p className="text-xs text-zinc-400">
              Protected by bcrypt credential hashing & Signed JWT
            </p>
          </div>
        </div>

        {/* 1-Click Sandbox Test Login Switchers */}
        <div className="mb-5 p-3 rounded-2xl bg-zinc-950/90 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-semibold text-zinc-300 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
              1-Click Demo Logins (Bcrypt Seeded):
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">JWT Ready</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              id="demo-login-customer-chip"
              type="button"
              onClick={() => handleQuickLogin('customer')}
              disabled={isSubmitting}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/80 text-left text-xs transition"
            >
              <div className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Rahul (Demo)
              </div>
              <div className="text-[10px] text-zinc-400 truncate">rahul.sharma@...</div>
              <div className="text-[9px] text-zinc-500 font-mono">Password123!</div>
            </button>

            <button
              id="demo-login-user-chip"
              type="button"
              onClick={async () => {
                setIsSubmitting(true);
                setFormError(null);
                try {
                  await login('rkishothkumar510@gmail.com', 'Password123!');
                  onToast('Logged in as Kishoth Kumar', 'success');
                } catch (err: unknown) {
                  const message = err instanceof Error ? err.message : 'Login failed';
                  setFormError(message);
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/80 text-left text-xs transition"
            >
              <div className="font-semibold text-teal-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Kishoth Kumar
              </div>
              <div className="text-[10px] text-zinc-400 truncate">rkishothkumar...</div>
              <div className="text-[9px] text-zinc-500 font-mono">Password123!</div>
            </button>

            <button
              id="demo-login-admin-chip"
              type="button"
              onClick={() => handleQuickLogin('admin')}
              disabled={isSubmitting}
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-700/80 text-left text-xs transition"
            >
              <div className="font-semibold text-amber-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Ops Admin
              </div>
              <div className="text-[10px] text-zinc-400 truncate">admin@shopcart.in</div>
              <div className="text-[9px] text-zinc-500 font-mono">AdminPass123!</div>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-xl bg-zinc-950 p-1 mb-5 border border-zinc-800">
          <button
            type="button"
            id="tab-switch-login"
            onClick={() => {
              setAuthModalMode('login');
              setFormError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              authModalMode === 'login'
                ? 'bg-zinc-800 text-zinc-100 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            id="tab-switch-register"
            onClick={() => {
              setAuthModalMode('register');
              setFormError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
              authModalMode === 'register'
                ? 'bg-zinc-800 text-zinc-100 shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error message */}
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/50 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Main Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  id="auth-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 pl-9 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                id="auth-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 pl-9 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {authModalMode === 'register' && (
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  id="auth-phone-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 pl-9 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-zinc-300">
                Password
              </label>
              {authModalMode === 'register' && (
                <span className="text-[11px] text-zinc-500">Min 8 characters</span>
              )}
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
              <input
                id="auth-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-2 pl-9 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
            {authModalMode === 'login' && (
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Demo Passwords: <code className="text-emerald-400 font-mono">Password123!</code></span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('rahul.sharma@example.com');
                    setPassword('Password123!');
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Fill Demo
                </button>
              </div>
            )}
          </div>

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-xl shadow-emerald-950/80 transition active:scale-98 disabled:opacity-60"
          >
            <span>
              {isSubmitting
                ? 'Authenticating...'
                : authModalMode === 'login'
                ? 'Sign In with JWT'
                : 'Create Account & Sign In'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Security Info Badge */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Bcrypt 10 Rounds • JWT RS256 / HS256 Token Validation</span>
        </div>
      </div>
    </div>
  );
};
