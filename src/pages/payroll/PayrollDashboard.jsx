import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  PlayCircle, Wallet, Users, TrendingDown, Receipt, CheckCircle2,
  SendHorizonal, XCircle, Loader2,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import StatCard from '../../components/ui/StatCard';
import { Select } from '../../components/ui/Input';
import { useApp } from '../../context/AppContext';
import { usePayroll } from '../../hooks/usePayroll';
import { cn, formatCurrency, getInitials, avatarColor, STATUS_VARIANTS, titleCase } from '../../lib/utils';
import { maskAccountNumber } from '../../lib/paystack';

export default function PayrollDashboard({ autoRun, onAutoRunHandled, onViewPayslip }) {
  const { employees, transactions, addTransaction, updateTransaction, setPayrollRecords } = useApp();
  const { months, getRecordsFor, getSummary, getDepartmentCosts, runPayroll, payroll } = usePayroll();

  const [periodKey, setPeriodKey] = useState(null);
  const [running, setRunning] = useState(false);
  const [justRan, setJustRan] = useState(false);
  const [showDisburse, setShowDisburse] = useState(false);

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

  // True only when every record for this period has been paid
  const allPaid = useMemo(
    () => records.length > 0 && records.every((r) => r.status === 'paid'),
    [records]
  );

  // Formatted date of the latest paid_at across records (for the "Paid on …" badge)
  const paidAt = useMemo(() => {
    if (!allPaid) return null;
    const dates = records.map((r) => r.paid_at).filter(Boolean);
    if (!dates.length) return null;
    return new Date(Math.max(...dates.map((d) => new Date(d)))).toLocaleDateString('en-NG', { dateStyle: 'medium' });
  }, [records, allPaid]);

  const hasProcessed = useMemo(() => records.some((r) => r.status === 'processed'), [records]);

  // Run Payroll is available only when all existing records are still pending (or there are none yet)
  const canRun = records.length === 0 || records.every((r) => r.status === 'pending');

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                {canRun && (
                  <Button onClick={handleRun} loading={running}>
                    <PlayCircle size={16} /> Run Payroll
                  </Button>
                )}
                {hasProcessed && !allPaid && (
                  <Button variant="accent" onClick={() => setShowDisburse(true)}>
                    <SendHorizonal size={16} /> Disburse Payments
                  </Button>
                )}
                {allPaid && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success-700 bg-success-50 border border-success-200 px-2.5 py-1 rounded-full">
                    <CheckCircle2 size={12} /> {paidAt ? `Paid on ${paidAt}` : 'Paid'}
                  </span>
                )}
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
                  {hasProcessed && !allPaid && (
                    <button
                      onClick={() => setShowDisburse(true)}
                      className="ml-auto underline text-success-700 font-semibold whitespace-nowrap"
                    >
                      Disburse now →
                    </button>
                  )}
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
              {
                key: 'status',
                header: 'Status',
                render: (r) => <Badge variant={STATUS_VARIANTS[r.status] || 'default'} dot>{titleCase(r.status)}</Badge>,
              },
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

      {showDisburse && (
        <DisburseModal
          records={records}
          employeeMap={employeeMap}
          period={selected}
          transactions={transactions}
          addTransaction={addTransaction}
          updateTransaction={updateTransaction}
          setPayrollRecords={setPayrollRecords}
          onClose={() => setShowDisburse(false)}
        />
      )}
    </div>
  );
}

// ============================================================
// Disburse Modal
// ============================================================
const STEP_IDLE = 'idle';
const STEP_PROCESSING = 'processing';
const STEP_DONE = 'done';

function DisburseModal({ records, employeeMap, period, transactions, addTransaction, updateTransaction, setPayrollRecords, onClose }) {
  const [step, setStep] = useState(STEP_IDLE);
  const [progress, setProgress] = useState([]); // { employeeId, name, amount, status, error }
  const [summary, setSummary] = useState({ success: 0, failed: 0, total: 0 });

  const eligibleRecords = useMemo(
    () => records.filter((r) => r.status === 'processed'),
    [records]
  );

  const handleDisburse = useCallback(async () => {
    setStep(STEP_PROCESSING);

    const initProgress = eligibleRecords.map((r) => {
      const emp = employeeMap[r.employee_id];
      return {
        employeeId: r.employee_id,
        payrollId: r.id,
        name: emp ? `${emp.first_name} ${emp.last_name}` : 'Unknown',
        amount: r.net_pay,
        bankName: emp?.bank_name || '',
        accountNumber: emp?.account_number || '',
        status: 'pending',
        error: null,
      };
    });
    setProgress(initProgress);

    let successCount = 0;
    let failedCount = 0;

    for (let i = 0; i < eligibleRecords.length; i++) {
      const record = eligibleRecords[i];
      const emp = employeeMap[record.employee_id];

      const updateRow = (patch) => {
        setProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, ...patch } : p));
      };

      if (!emp?.bank_name || !emp?.account_number) {
        updateRow({ status: 'failed', error: 'Missing bank details' });
        failedCount++;
        continue;
      }

      updateRow({ status: 'processing' });

      const reference = `BH-PAY-${record.employee_id.slice(0, 8)}-${Date.now()}`;

      // Save to Supabase BEFORE the transfer — guarantees an audit record even if transfer fails
      let txRecord;
      try {
        txRecord = await addTransaction({
          employee_id: record.employee_id,
          payroll_id: record.id,
          reference,
          amount: Math.round(record.net_pay * 100), // store in kobo
          status: 'pending',
        });
      } catch (err) {
        updateRow({ status: 'failed', error: 'Failed to save transaction record' });
        failedCount++;
        continue;
      }

      try {
        // NOTE: Transfer is simulated because sample employees have fictional bank account numbers
        // that cannot resolve against Paystack's live NUBAN registry. The real Paystack integration
        // is fully built and functional — see /api/paystack-verify-account.js, /api/paystack-create-recipient.js,
        // /api/paystack-transfer.js, and /api/paystack-verify-transfer.js. Switch to those API calls
        // when real employee bank accounts are in use.
        await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 700));

        // 98% success, 2% random failure to simulate realistic payment gateway behaviour
        const isSuccess = Math.random() > 0.02;

        if (isSuccess) {
          const transferCode = `TRF_${Math.random().toString(36).slice(2, 11).toUpperCase()}`;
          await updateTransaction(txRecord.id, { status: 'success', transfer_code: transferCode });
          await setPayrollRecords([{ ...record, status: 'paid', paid_at: new Date().toISOString(), transaction_id: txRecord.id }]);
          updateRow({ status: 'success' });
          successCount++;
        } else {
          await updateTransaction(txRecord.id, { status: 'failed', error_message: 'Insufficient balance in source account' });
          updateRow({ status: 'failed', error: 'Insufficient balance in source account' });
          failedCount++;
        }
      } catch (err) {
        if (txRecord?.id) {
          await updateTransaction(txRecord.id, { status: 'failed', error_message: err.message });
        }
        updateRow({ status: 'failed', error: err.message });
        failedCount++;
      }
    }

    setSummary({ success: successCount, failed: failedCount, total: eligibleRecords.length });
    setStep(STEP_DONE);
  }, [eligibleRecords, employeeMap, period, addTransaction, updateTransaction, setPayrollRecords]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Disburse Payroll</h2>
            <p className="text-sm text-slate-500 mt-0.5">{period.month} {period.year} — {eligibleRecords.length} employees</p>
          </div>
          {step !== STEP_PROCESSING && (
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <XCircle size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {step === STEP_IDLE && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="pb-2 font-medium text-slate-500">Employee</th>
                    <th className="pb-2 font-medium text-slate-500">Bank</th>
                    <th className="pb-2 font-medium text-slate-500">Account</th>
                    <th className="pb-2 font-medium text-slate-500 text-right">Amount</th>
                    <th className="pb-2 font-medium text-slate-500 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {eligibleRecords.map((r) => {
                    const emp = employeeMap[r.employee_id];
                    return (
                      <tr key={r.id} className="border-b border-slate-50">
                        <td className="py-2.5 font-medium text-slate-700">
                          {emp ? `${emp.first_name} ${emp.last_name}` : '—'}
                        </td>
                        <td className="py-2.5 text-slate-500">{emp?.bank_name || '—'}</td>
                        <td className="py-2.5 font-mono text-slate-500">{maskAccountNumber(emp?.account_number)}</td>
                        <td className="py-2.5 text-right font-semibold text-slate-800">{formatCurrency(r.net_pay)}</td>
                        <td className="py-2.5 text-right">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-success-700">
                            <CheckCircle2 size={12} /> Ready
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="pt-3 font-semibold text-slate-700">Total</td>
                    <td className="pt-3 text-right font-bold text-slate-800">
                      {formatCurrency(eligibleRecords.reduce((s, r) => s + (r.net_pay || 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
              </div>
            </div>
          )}

          {step === STEP_PROCESSING && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-4">Processing transfers — do not close this window.</p>
              {progress.map((p) => (
                <div key={p.employeeId} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusIcon status={p.status} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{maskAccountNumber(p.accountNumber)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-800">{formatCurrency(p.amount)}</p>
                    {p.error && <p className="text-xs text-danger-600 truncate max-w-[160px]">{p.error}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === STEP_DONE && (
            <div className="space-y-4">
              <div className={cn(
                'p-5 rounded-xl text-center',
                summary.failed === 0 ? 'bg-success-50 border border-success-100' : 'bg-warning-50 border border-warning-100'
              )}>
                <p className="text-2xl font-bold text-slate-800 mb-1">
                  {summary.success}/{summary.total} Transfers Sent
                </p>
                {summary.failed > 0 && (
                  <p className="text-sm text-warning-700">{summary.failed} transfer(s) failed — see details below</p>
                )}
              </div>
              {progress.map((p) => (
                <div key={p.employeeId} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <StatusIcon status={p.status} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{p.name}</p>
                      {p.error && <p className="text-xs text-danger-600">{p.error}</p>}
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-slate-800 shrink-0">{formatCurrency(p.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center gap-3">
          {step === STEP_IDLE && (
            <>
              <Button variant="secondary" onClick={onClose}>Cancel</Button>
              <Button variant="accent" onClick={handleDisburse}>
                <SendHorizonal size={16} /> Confirm & Send {eligibleRecords.length} Transfers
              </Button>
            </>
          )}
          {step === STEP_PROCESSING && (
            <div className="flex items-center gap-2 text-sm text-slate-500 w-full justify-center">
              <Loader2 size={16} className="animate-spin" /> Processing transfers…
            </div>
          )}
          {step === STEP_DONE && (
            <Button className="ml-auto" onClick={onClose}>
              <CheckCircle2 size={16} /> Done
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === 'success') return <CheckCircle2 size={18} className="text-success-600 shrink-0" />;
  if (status === 'failed') return <XCircle size={18} className="text-danger-600 shrink-0" />;
  if (status === 'processing') return <Loader2 size={18} className="animate-spin text-primary shrink-0" />;
  return <div className="w-4.5 h-4.5 rounded-full border-2 border-slate-200 shrink-0" />;
}
