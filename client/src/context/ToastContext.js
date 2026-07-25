import { createContext, useContext, useState, useCallback } from 'react';
import { ShieldAlert, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl border shadow-2xl flex items-start gap-3 backdrop-blur-md transition-all text-xs font-medium ${
              toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/30 text-red-200'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
                : toast.type === 'warning'
                ? 'bg-amber-950/90 border-amber-500/30 text-amber-200'
                : 'bg-slate-900/90 border-slate-700 text-slate-200'
            }`}
          >
            <ToastIcon type={toast.type} />
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastIcon({ type }) {
  switch (type) {
    case 'error':
      return <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />;
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />;
    default:
      return <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />;
  }
}

export function useToast() {
  return useContext(ToastContext);
}
