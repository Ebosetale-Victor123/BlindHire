import { cn } from '../../lib/utils';

const VARIANTS = {
  default: 'bg-slate-100 text-slate-700',
  primary: 'bg-blue-50 text-primary-700',
  accent: 'bg-accent-50 text-accent-700',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  outline: 'bg-transparent border border-slate-200 text-slate-600',
};

export default function Badge({ children, variant = 'default', className, dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap',
        VARIANTS[variant] || VARIANTS.default,
        className
      )}
    >
      {dot && (
        <span
          className={cn('w-1.5 h-1.5 rounded-full', {
            'bg-slate-400': variant === 'default' || variant === 'outline',
            'bg-primary-600': variant === 'primary',
            'bg-accent-600': variant === 'accent',
            'bg-success-600': variant === 'success',
            'bg-warning-600': variant === 'warning',
            'bg-danger-600': variant === 'danger',
          })}
        />
      )}
      {children}
    </span>
  );
}
