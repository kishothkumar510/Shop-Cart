import React from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-2xl border shadow-2xl flex items-start gap-3 text-xs animate-slideIn transition backdrop-blur-md ${
              isSuccess
                ? 'bg-emerald-950/90 border-emerald-700 text-emerald-100'
                : isError
                ? 'bg-rose-950/90 border-rose-700 text-rose-100'
                : 'bg-zinc-900/90 border-zinc-700 text-zinc-100'
            }`}
          >
            <div className="mt-0.5">
              {isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : isError ? (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              ) : (
                <Info className="w-4 h-4 text-sky-400" />
              )}
            </div>

            <div className="flex-1 min-w-0 font-medium leading-relaxed">
              {toast.message}
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="text-zinc-400 hover:text-white p-0.5 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
