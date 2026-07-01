import { cn } from '../../lib/utils';
import Card from './Card';

const COLORS = {
  primary: 'bg-primary-50 text-primary-600',
  accent: 'bg-accent-50 text-accent-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
};

export default function StatCard({ icon: Icon, label, value, change, color = 'primary', className }) {
  return (
    <Card className={cn('flex items-center gap-3 sm:gap-4', className)}>
      <div className={cn('p-2.5 sm:p-3 rounded-xl shrink-0', COLORS[color] || COLORS.primary)}>
        {Icon && <Icon size={20} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm text-slate-500 leading-snug truncate">{label}</p>
        <div className="flex items-baseline gap-2 flex-wrap">
          <p className="text-lg sm:text-2xl font-bold text-slate-800 min-w-0 break-words">{value}</p>
          {change && (
            <span
              className={cn(
                'text-xs font-medium shrink-0',
                change.startsWith('-') ? 'text-danger-600' : 'text-success-600'
              )}
            >
              {change}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
