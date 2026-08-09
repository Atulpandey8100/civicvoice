import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info
};

let seed = 0;

function ToastView({ toast, onClose }) {
  const Icon = ICONS[toast.variant] || Info;
  const styles = {
    success: 'text-success',
    error: 'text-danger',
    info: 'text-info'
  };

  return (
    <div
      role="status"
      className="animate-toast-in pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-pop"
    >
      <Icon size={18} className={`mt-0.5 shrink-0 ${styles[toast.variant] || styles.info}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {toast.title && <p className="text-sm font-semibold text-ink">{toast.title}</p>}
        {toast.description && <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{toast.description}</p>}
      </div>
      <button
        onClick={onClose}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-md p-1 text-ink-faint transition-colors hover:bg-surface-3 hover:text-ink"
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach(clearTimeout);
      timers.clear();
    };
  }, []);

  const dismiss = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(({ variant = 'info', title, description, duration = 4000 }) => {
    const id = ++seed;
    setToasts((prev) => [...prev.slice(-3), { id, variant, title, description }]);
    if (duration > 0) {
      timersRef.current.set(id, setTimeout(() => dismiss(id), duration));
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[2000] flex flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <ToastView key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
