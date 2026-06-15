import { Clock, Globe, Youtube, Circle } from 'lucide-react';
import Badge from '../ui/Badge';
import { cn } from '../../lib/utils';

const PRIORITY_COLORS = {
  High: 'text-danger-500',
  Medium: 'text-warning-500',
  Low: 'text-success-500',
};

function CostBadge({ cost }) {
  if (!cost) return null;
  if (cost.trim().toLowerCase() === 'free') {
    return <Badge variant="success">Free</Badge>;
  }
  if (cost.toLowerCase().startsWith('free certificate')) {
    return <Badge variant="primary">{cost}</Badge>;
  }
  return <Badge variant="warning">{cost}</Badge>;
}

export default function CourseCard({ tag, courseName, platform, duration, cost, priority, footer }) {
  const PlatformIcon = platform?.toLowerCase().includes('youtube') ? Youtube : Globe;

  return (
    <div className="rounded-xl border border-slate-200 p-4 space-y-2 bg-white h-full flex flex-col">
      {tag && (
        <Badge variant="primary" className="self-start">
          {tag}
        </Badge>
      )}
      <p className="font-semibold text-slate-800 text-sm">{courseName}</p>
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <PlatformIcon size={14} />
        <span>{platform}</span>
      </div>
      {duration && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Clock size={14} />
          <span>{duration}</span>
        </div>
      )}
      <div className={cn('flex items-center gap-2 flex-wrap', footer ? '' : 'mt-auto')}>
        <CostBadge cost={cost} />
        {priority && (
          <span className="text-xs text-slate-600 inline-flex items-center gap-1.5">
            <Circle size={8} className={cn('fill-current', PRIORITY_COLORS[priority] || 'text-slate-400')} />
            {priority}
          </span>
        )}
      </div>
      {footer && (
        <p className="text-xs text-slate-500 italic border-t border-slate-100 pt-2 mt-auto">{footer}</p>
      )}
    </div>
  );
}
