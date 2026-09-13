import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const toastConfig = {
  success: {
    icon: CheckCircle2,
    bg: 'bg-white/95 border-emerald-200/90 text-slate-800 shadow-[0_12px_32px_rgba(16,185,129,0.18)]',
    iconBg: 'bg-emerald-100 text-emerald-600',
    title: 'Success',
    titleColor: 'text-emerald-950',
    accentBorder: 'border-l-4 border-l-emerald-500',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-white/95 border-rose-200/90 text-slate-800 shadow-[0_12px_32px_rgba(244,63,94,0.18)]',
    iconBg: 'bg-rose-100 text-rose-600',
    title: 'Notice',
    titleColor: 'text-rose-950',
    accentBorder: 'border-l-4 border-l-rose-500',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-white/95 border-amber-200/90 text-slate-800 shadow-[0_12px_32px_rgba(245,158,11,0.18)]',
    iconBg: 'bg-amber-100 text-amber-600',
    title: 'Warning',
    titleColor: 'text-amber-950',
    accentBorder: 'border-l-4 border-l-amber-500',
  },
  info: {
    icon: Info,
    bg: 'bg-white/95 border-blue-200/90 text-slate-800 shadow-[0_12px_32px_rgba(37,99,235,0.18)]',
    iconBg: 'bg-blue-100 text-blue-600',
    title: 'Information',
    titleColor: 'text-blue-950',
    accentBorder: 'border-l-4 border-l-blue-500',
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((options) => {
    const toastObj = typeof options === 'string'
      ? { type: 'info', message: options, duration: 4500 }
      : { type: options.type || 'info', message: options.message, duration: options.duration || 4500 };

    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, ...toastObj }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toastObj.duration);
  }, []);

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Floating Modern Toast Notification Container */}
      <div 
        className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map(t => {
          const cfg = toastConfig[t.type] || toastConfig.info;
          const IconComponent = cfg.icon;
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 animate-slide-up ${cfg.bg} ${cfg.accentBorder}`}
              role="alert"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.iconBg}`}>
                <IconComponent size={18} strokeWidth={2.2} />
              </div>
              <div className="flex-1 min-w-0 pr-1">
                <p className={`text-xs font-bold ${cfg.titleColor} tracking-tight`}>
                  {cfg.title}
                </p>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed font-medium">
                  {t.message}
                </p>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Close notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
