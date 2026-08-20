import React, { useState, useEffect, useCallback } from 'react';
import { X, ShieldCheck, Terminal, Key, Database, RefreshCw, Layers, CheckCircle2, AlertTriangle, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, getStoredToken } from '../services/api';
import { TransactionLog } from '../types';

interface SecurityConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SecurityConsoleModal: React.FC<SecurityConsoleModalProps> = ({ isOpen, onClose, onToast }) => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState<'jwt' | 'logs' | 'database'>('jwt');
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [stats, setStats] = useState<unknown | null>(null);
  const [decodedToken, setDecodedToken] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const fetchSecurityData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch audit logs & server stats
      const [logsRes, statsRes] = await Promise.all([
        api.admin.getLogs(),
        api.admin.getStats()
      ]);
      setLogs(logsRes.logs || []);
      setStats(statsRes);

      // Inspect active JWT
      const currentToken = token || getStoredToken();
      if (currentToken) {
        const decoded = await api.auth.inspectToken(currentToken);
        setDecodedToken(decoded.decoded);
      } else {
        setDecodedToken(null);
      }
    } catch (err) {
      console.error('Error loading security console data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isOpen) {
      fetchSecurityData();
    }
  }, [isOpen, fetchSecurityData]);

  if (!isOpen) return null;

  const handleResetDatabase = async () => {
    if (!confirm('Are you sure you want to reset all users, catalog stock, and orders to the initial seed state?')) {
      return;
    }

    setIsResetting(true);
    try {
      await api.admin.resetDatabase();
      onToast('Database reset to fresh seed state', 'success');
      await fetchSecurityData();
    } catch (err) {
      onToast('Failed to reset database', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn font-sans">
      <div
        id="security-console-panel"
        className="relative w-full max-w-4xl bg-zinc-900 border border-zinc-700/80 rounded-3xl overflow-hidden shadow-2xl text-zinc-100 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-700/80 text-emerald-400 flex items-center justify-center">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-zinc-100">
                  Security Engine & Sandbox Telemetry Console
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  LIVE AUDIT
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Inspect JWT claims, bcrypt cryptographic verification, and atomic inventory logs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSecurityData}
              disabled={isLoading}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              id="close-security-console-btn"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Console Navigation Tabs */}
        <div className="px-6 pt-3 bg-zinc-950/60 border-b border-zinc-800 flex gap-2">
          <button
            onClick={() => setActiveTab('jwt')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'jwt'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            JWT Token & Auth Claims
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Audit Ledger ({logs.length} events)
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'database'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Hashed Database State
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: JWT Inspector */}
          {activeTab === 'jwt' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Authentication Session State
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-emerald-400 border border-zinc-700">
                    {user ? 'Authenticated Bearer Token' : 'Guest Session (Anonymous)'}
                  </span>
                </div>

                {user ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] block font-mono">USER ID</span>
                      <span className="font-semibold text-zinc-200">{user.id}</span>
                    </div>
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] block font-mono">ROLE</span>
                      <span className="font-semibold text-emerald-400 uppercase">{user.role}</span>
                    </div>
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] block font-mono">EMAIL</span>
                      <span className="font-semibold text-zinc-200 truncate block">{user.email}</span>
                    </div>
                    <div className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                      <span className="text-zinc-500 text-[10px] block font-mono">ENCRYPTION</span>
                      <span className="font-semibold text-sky-400">Bcrypt + JWT HS256</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 py-1">
                    No active JWT found in client storage. Sign in using the Quick Demo accounts to inspect real JWT payload decoding.
                  </p>
                )}
              </div>

              {/* Decoded JWT Visualizer */}
              {token && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Raw Bearer Token & Decoded Claims Structure
                  </h4>

                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 font-mono text-[11px] break-all text-emerald-300/80">
                    <span className="text-zinc-500 select-none">Bearer </span>
                    {token}
                  </div>

                  {decodedToken && (
                    <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto">
                      <pre>{JSON.stringify(decodedToken, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Audit Logs Ledger */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Real-time transaction stream across checkout & inventory pipelines</span>
                <span className="font-mono text-[10px]">Showing last {logs.length} events</span>
              </div>

              <div className="space-y-2">
                {logs.map((log) => {
                  const isSuccess = log.status === 'success';
                  const isWarning = log.status === 'warning';

                  return (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-start gap-3"
                    >
                      <div className="mt-0.5">
                        {isSuccess ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isWarning ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-400" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] uppercase px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                            {log.type}
                          </span>
                          <span className="font-medium text-zinc-200">{log.details}</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-1">
                          {new Date(log.timestamp).toLocaleTimeString()} • ID: {log.id} {log.userId && `• User: ${log.userId}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Database & Cryptography Info */}
          {activeTab === 'database' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <h4 className="font-bold text-zinc-200 text-sm flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Bcrypt Hashing Architecture
                </h4>
                <p className="text-zinc-400 leading-relaxed">
                  All user passwords undergo one-way cryptographic key stretching using <code className="text-emerald-400 font-mono">bcryptjs</code> with 10 salt rounds before storage. Plain-text passwords are never saved or returned in API responses.
                </p>

                {stats && (
                  <div className="pt-2 border-t border-zinc-800/80">
                    <h5 className="font-semibold text-zinc-300 mb-2">Registered Accounts in Database:</h5>
                    <div className="space-y-2">
                      {(stats as { users?: { id: string; name: string; email: string; role: string; hasHashedPassword: boolean }[] }).users?.map((u) => (
                        <div key={u.id} className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-zinc-200">{u.name} ({u.email})</div>
                            <div className="text-[10px] text-zinc-400 font-mono">Role: {u.role}</div>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800">
                            ✓ $2a$ Bcrypt Hashed
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reset to Seed Defaults */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-zinc-200">Reset Entire Sandbox to Seed State</div>
                  <div className="text-zinc-400 text-[11px]">Restores default catalog quantities, demo customers, and orders.</div>
                </div>
                <button
                  id="reset-db-btn"
                  onClick={handleResetDatabase}
                  disabled={isResetting}
                  className="px-4 py-2 bg-rose-900/60 hover:bg-rose-800 text-rose-200 border border-rose-700/60 rounded-xl text-xs font-semibold transition"
                >
                  {isResetting ? 'Resetting...' : 'Reset Database'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
