import { cn } from '../../lib/utils';

export function Input({ label, error, hint, className, id, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-800 placeholder:text-slate-400',
          'focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary transition-colors',
          error ? 'border-danger' : 'border-slate-200',
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs text-danger-600">{error}</span> : hint && <span className="text-xs text-slate-400">{hint}</span>}
    </div>
  );
}

export function Select({ label, error, className, id, children, ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-800',
          'focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary transition-colors',
          error ? 'border-danger' : 'border-slate-200',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <span className="text-xs text-danger-600">{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, className, id, ...props }) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'w-full px-3 py-2 text-sm border rounded-lg bg-white text-slate-800 placeholder:text-slate-400',
          'focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary transition-colors resize-y',
          error ? 'border-danger' : 'border-slate-200',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-danger-600">{error}</span>}
    </div>
  );
}

export default Input;
