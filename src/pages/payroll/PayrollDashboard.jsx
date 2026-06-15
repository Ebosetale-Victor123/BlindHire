import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PlayCircle, Wallet, Users, TrendingDown, Receipt, CheckCircle2 } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';
import { Select } from '../../components/ui/Input';
import { useApp } from '../../context/AppContext';
import { usePayroll } from '../../hooks/usePayroll';
import { cn, formatCurrency, getInitials, avatarColor, STATUS_VARIANTS, titleCase } from '../../lib/utils';

export default function PayrollDashboard({ autoRun, onAutoRunHandled, onViewPayslip }) {
  const { employees } = useApp();
  const { months, getRecordsFor, getSummary, getDepartmentCosts, runPayroll } = usePayroll();

  const [periodKey, setPeriodKey] = useState(null);
  const [running, setRunning] = useState(false);
  const [justRan, setJustRan] = useState(false);

  useEffect(() => {
    if (!periodKey && months.length) setPeriodKey(`${months[0].month}-${months[0].year}`);
  }, [months, periodKey]);

  const selected = useMemo(() => {
    if (periodKey) {
      const [month, year] = periodKey.split('-');
      const match = months.find((m) => m.month === month && String(m.year) === year);
      if (match) return match;
    }
    return months[0] || null;
  }, [periodKey, months]);

  const employeeMap = useMemo(() => {
    const m = {};
    employees.forEach((e) => { m[e.id] = e; });
    return m;
  }, [employees]);

  const records = selected ? getRecordsFor(selected.month, selected.year) : [];
  const summary = selected ? getSummary(selected.month, selected.year) : { gross: 0, deductions: 0, net: 0 };
  const deptCosts = selected ? getDepartmentCosts(selected.month, selected.year) : [];

  const handleRun = async () => {
    if (!selected) return;
    setRunning(true);
    try {
      await runPayroll(selected.month, selected.year);
      setJustRan(true);
      setTimeout(() => setJustRan(false), 3000);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    if (autoRun && selected) {
      handleRun();
      onAutoRunHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRun, selected]);

  if (!selected) {
    return (
      <Card className="text-center py-16">
        <Wallet size={36} className="mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500">No payroll records yet.</p>
      </Card>
    );
  }

  const sortedRecords = [...records].sort((a, b) => (b.net_pay || 0) - (a.net_pay || 0));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Gross Pay" value={formatCurrency(summary.gross)} color="primary" />
        <StatCard icon={TrendingDown} label="Deductions" value={formatCurrency(summary.deductions)} color="warning" />
        <StatCard icon={Receipt} label="Net Pay" value={formatCurrency(summary.net)} color="success" />
        <StatCard icon={Users} label="Employees Paid" value={records.length} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Payroll Records"
            subtitle={`${selected.month} ${selected.year}`}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Select value={periodKey || ''} onChange={(e) => setPeriodKey(e.target.value)} className="w-40">
                  {months.map((m) => {
                    const key = `${m.month}-${m.year}`;
                    return <option key={key} value={key}>{m.month} {m.year}</option>;
                  })}
                </Select>
                <Button onClick={handleRun} loading={running}>
                  <PlayCircle size={16} /> Run Payroll
                </Button>
              </div>
            }
          />
          <AnimatePresence>
            {justRan && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg bg-success-50 text-success-700 text-sm font-medium">
                  <CheckCircle2 size={16} className="shrink-0" />
                  Payroll for {selected.month} {selected.year} processed for {records.length} employees.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <Table
            columns={[
              {
                key: 'employee',
                header: 'Employee',
                render: (r) => {
                  const emp = employeeMap[r.employee_id];
                  if (!emp) return '—';
                  return (
                    <div className="flex items-center gap-2.5 min-w-[170px]">
                      <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', avatarColor(emp.first_name + emp.last_name))}>
                        {getInitials(emp.first_name, emp.last_name)}
                      </span>
                      <div className="min-w-0">
                        <p className="text-slate-700 font-medium truncate">{emp.first_name} {emp.last_name}</p>
                        <p className="text-xs text-slate-400 truncate">{emp.department}</p>
                      </div>
                    </div>
                  );
                },
              },
              { key: 'basic_salary', header: 'Basic', render: (r) => formatCurrency(r.basic_salary) },
              { key: 'allowances', header: 'Allowances', render: (r) => formatCurrency(r.allowances) },
              { key: 'tax', header: 'Tax (PAYE)', render: (r) => formatCurrency(r.tax) },
              { key: 'pension', header: 'Pension', render: (r) => formatCurrency(r.pension) },
              { key: 'net_pay', header: 'Net Pay', render: (r) => <span className="font-semibold text-slate-800">{formatCurrency(r.net_pay)}</span> },
              { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS_VARIANTS[r.status] || 'default'} dot>{titleCase(r.status)}</Badge> },
              {
                key: 'actions',
                header: '',
                headerClassName: 'text-right',
                className: 'text-right',
                render: (r) => (
                  <button onClick={() => onViewPayslip?.(r.employee_id)} className="text-primary text-xs font-semibold hover:underline whitespace-nowrap">
                    View Payslip
                  </button>
                ),
              },
            ]}
            data={sortedRecords}
            emptyMessage="No payroll records for this period"
          />
        </Card>

        <Card>
          <CardHeader title="Cost by Department" subtitle={`${selected.month} ${selected.year}`} />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={deptCosts} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="department" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={88} />
              <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 13 }} />
              <Bar dataKey="total" name="Net Pay" fill="#7C3AED" radius={[0, 8, 8, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
