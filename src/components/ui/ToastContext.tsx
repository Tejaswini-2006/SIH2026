import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'neutral';

export interface ToastMessage {
  id: string;
  type?: ToastType;
  message: string;
  undoAction?: () => void;
  undoLabel?: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (
    msgOrMessage: string | Omit<ToastMessage, 'id'>,
    type?: ToastType
  ) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (
      msgOrMessage: string | Omit<ToastMessage, 'id'>,
      type?: ToastType
    ) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      let newToast: ToastMessage;
      if (typeof msgOrMessage === 'string') {
        newToast = { id, message: msgOrMessage, type: type || 'info' };
      } else {
        newToast = { ...msgOrMessage, id };
      }

      setToasts((prev) => [...prev, newToast]);

      const duration = newToast.duration ?? 4000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-slate-900 text-white rounded-lg px-3.5 py-2.5 text-xs shadow-lg border border-slate-800 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-150"
            role="status"
          >
            <div className="flex items-center gap-2 min-w-0">
              {t.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : t.type === 'info' ? (
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="truncate text-slate-100">{t.message}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {t.undoAction && (
                <button
                  type="button"
                  onClick={() => {
                    t.undoAction?.();
                    removeToast(t.id);
                  }}
                  className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
                >
                  {t.undoLabel || 'Undo'}
                </button>
              )}
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: (
        msgOrMessage: string | Omit<ToastMessage, 'id'>,
        type?: ToastType
      ) => {
        const text = typeof msgOrMessage === 'string' ? msgOrMessage : msgOrMessage.message;
        console.log('Toast:', text, type);
      },
    };
  }
  return ctx;
};
