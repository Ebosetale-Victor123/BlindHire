import { useSearchParams } from 'react-router-dom';
import { CalendarClock, ClipboardCheck } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { cn } from '../../lib/utils';
import AttendanceLog from './AttendanceLog';
import LeaveManagement from './LeaveManagement';

const TABS = [
  { key: 'log', label: 'Attendance Log', icon: CalendarClock },
  { key: 'leave', label: 'Leave Management', icon: ClipboardCheck },
];

export default function AttendancePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'log';

  const setTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance & Time" subtitle="Track daily attendance, monitor trends, and manage leave requests" />

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto scrollbar-thin">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                active ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'log' && <AttendanceLog />}
      {tab === 'leave' && <LeaveManagement />}
    </div>
  );
}
