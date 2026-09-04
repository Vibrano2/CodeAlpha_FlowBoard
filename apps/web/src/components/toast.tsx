import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type ToastTone = "success" | "error" | "info";

interface ToastInput {
  title: string;
  message?: string;
  tone?: ToastTone;
}

interface ToastRecord extends ToastInput {
  id: number;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastStyles: Record<ToastTone, string> = {
  success: "border-emerald-200 text-emerald-700",
  error: "border-red-200 text-red-700",
  info: "border-brand-200 text-brand-700",
};

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const ToastItem = ({ toast, onDismiss }: { toast: ToastRecord; onDismiss: (id: number) => void }) => {
  const Icon = toastIcons[toast.tone];

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.tone === "error" ? 7_000 : 4_500);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.id, toast.tone]);

  return (
    <div
      className={`pointer-events-auto flex w-full items-start gap-3 rounded-2xl border bg-white p-4 shadow-lg ${toastStyles[toast.tone]}`}
      role={toast.tone === "error" ? "alert" : "status"}
    >
      <Icon className="mt-0.5 shrink-0" aria-hidden="true" size={19} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900">{toast.title}</p>
        {toast.message ? <p className="mt-1 text-sm leading-5 text-slate-600">{toast.message}</p> : null}
      </div>
      <button
        className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label={`Dismiss ${toast.title} notification`}
      >
        <X aria-hidden="true" size={16} />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const nextId = useRef(1);

  const showToast = useCallback((input: ToastInput) => {
    const id = nextId.current;
    nextId.current += 1;
    setToasts((current) => [
      ...current.slice(-3),
      { ...input, id, tone: input.tone ?? "success" },
    ]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col gap-3 sm:left-auto sm:right-6 sm:w-full sm:max-w-sm"
        aria-label="Application notifications"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider.");
  return context;
};
