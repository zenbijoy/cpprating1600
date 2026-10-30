import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  SuccessStatusIcon,
  WarningStatusIcon,
  ErrorStatusIcon,
  InformationStatusIcon,
  CloseIcon,
} from './icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  show: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 3500 }: Omit<ToastMessage, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastMessage = { id, type, title, message, duration };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep at most 5

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const show = useCallback(
    (message: string, type: ToastType = 'info', title?: string) => addToast({ type, message, title }),
    [addToast]
  );
  const success = useCallback((message: string, title?: string) => addToast({ type: 'success', message, title }), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast({ type: 'error', message, title }), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast({ type: 'info', message, title }), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast({ type: 'warning', message, title }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, show, success, error, info, warning }}>
      {children}
      {/* Toast Container */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          const isInfo = toast.type === 'info';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
                isSuccess
                  ? 'bg-slate-900/95 border-emerald-500/40 text-emerald-100 shadow-emerald-950/20'
                  : isError
                  ? 'bg-slate-900/95 border-rose-500/40 text-rose-100 shadow-rose-950/20'
                  : isWarning
                  ? 'bg-slate-900/95 border-amber-500/40 text-amber-100 shadow-amber-950/20'
                  : 'bg-slate-900/95 border-indigo-500/40 text-indigo-100 shadow-indigo-950/20'
              }`}
              role="alert"
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <SuccessStatusIcon size={16} semantic="success" />}
                {isError && <ErrorStatusIcon size={16} semantic="error" />}
                {isWarning && <WarningStatusIcon size={16} semantic="warning" />}
                {isInfo && <InformationStatusIcon size={16} semantic="primary" />}
              </div>

              <div className="flex-1 min-w-0">
                {toast.title && <div className="text-xs font-bold text-slate-100 mb-0.5">{toast.title}</div>}
                <div className="text-xs text-slate-300 leading-snug break-words">{toast.message}</div>
              </div>

              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                aria-label="Dismiss toast"
              >
                <CloseIcon size={14} className="text-slate-400" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
