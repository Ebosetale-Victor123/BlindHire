import { cn } from '../../lib/utils';

export default function LoadingSpinner({ size = 24, className, label }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 text-slate-400', className)}>
      <svg
        className="animate-spin text-primary"
        style={{ width: size, height: size }}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

export function Skeleton({ className }) {
  return <div className={cn('animate-pulse bg-slate-200 rounded-lg', className)} />;
}
