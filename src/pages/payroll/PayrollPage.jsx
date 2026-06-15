import { useSearchParams } from 'react-router-dom';
import { LayoutDashboard, Receipt } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { cn } from '../../lib/utils';
import PayrollDashboard from './PayrollDashboard';
import PayslipGenerator from './PayslipGenerator';

const TABS = [
  { key: 'dashboard', label: 'Payroll Dashboard', icon: LayoutDashboard },
  { key: 'payslip', label: 'Payslip Generator', icon: Receipt },
];

export default function PayrollPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'dashboard';
  const action = searchParams.get('action');
  const employeeId = searchParams.get('employee');

  const setTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    next.delete('action');
    setSearchParams(next, { replace: true });
  };

  const clearAction = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('action');
    setSearchParams(next, { replace: true });
  };

  const handleViewPayslip = (id) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', 'payslip');
    next.set('employee', id);
    next.delete('action');
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Payroll" subtitle="Run monthly payroll, review department costs, and generate payslips" />

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

      {tab === 'dashboard' && <PayrollDashboard autoRun={action === 'run'} onAutoRunHandled={clearAction} onViewPayslip={handleViewPayslip} />}
      {tab === 'payslip' && <PayslipGenerator initialEmployeeId={employeeId} />}
    </div>
  );
}
