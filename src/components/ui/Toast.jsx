import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES = {
  success: 'bg-success-50 border-success-200 text-success-700',
  error: 'bg-danger-50 border-danger-200 text-danger-700',
  info: 'bg-primary-50 border-primary-200 text-primary-700',
  warning: 'bg-warning-50 border-warning-200 text-warning-700',
};

export default function Toast({ message, variant = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const Icon = ICONS[variant] || Info;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className={cn('flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg', STYLES[variant])}>
        <Icon size={18} className="shrink-0" />
        <p className="text-sm font-medium">{message}</p>
        <button onClick={onClose} className="ml-2 text-current opacity-60 hover:opacity-100 transition-opacity">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = (message, variant = 'success') => setToast({ message, variant });
  const hideToast = () => setToast(null);

  return { toast, showToast, hideToast };
}
