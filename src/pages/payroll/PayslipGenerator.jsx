import { useEffect, useMemo, useState } from 'react';
import { Printer, FileText } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { useApp } from '../../context/AppContext';
import { cn, formatCurrency, getInitials, avatarColor, STATUS_VARIANTS, titleCase } from '../../lib/utils';

export default function PayslipGenerator({ initialEmployeeId }) {
  const { employees, payroll } = useApp();
  const [employeeId, setEmployeeId] = useState(initialEmployeeId || employees[0]?.id || '');
  const [periodKey, setPeriodKey] = useState(null);

  useEffect(() => {
    if (initialEmployeeId) setEmployeeId(initialEmployeeId);
  }, [initialEmployeeId]);

  const employee = employees.find((e) => e.id === employeeId);

  const records = useMemo(
    () =>
      payroll
        .filter((p) => p.employee_id === employeeId)
        .sort((a, b) => new Date(`${b.month} 1, ${b.year}`) - new Date(`${a.month} 1, ${a.year}`)),
    [payroll, employeeId]
  );

  useEffect(() => {
    if (!records.length) {
      setPeriodKey(null);
      return;
    }
    if (!records.find((r) => `${r.month}-${r.year}` === periodKey)) {
      setPeriodKey(`${records[0].month}-${records[0].year}`);
    }
  }, [records, periodKey]);

  const record = records.find((r) => `${r.month}-${r.year}` === periodKey);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Payslip Generator"
          subtitle="Select an employee and pay period to generate a printable payslip"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="w-48">
                {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
              </Select>
              <Select value={periodKey || ''} onChange={(e) => setPeriodKey(e.target.value)} className="w-36" disabled={!records.length}>
                {records.map((r) => {
                  const key = `${r.month}-${r.year}`;
                  return <option key={key} value={key}>{r.month} {r.year}</option>;
                })}
              </Select>
              <Button onClick={handlePrint} disabled={!record}>
                <Printer size={16} /> Print / Download
              </Button>
            </div>
          }
        />

        {!employee || !record ? (
          <div className="text-center py-16">
            <FileText size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-400">No payroll record found for this employee.</p>
          </div>
        ) : (
          <div id="payslip-print" className="max-w-2xl mx-auto border border-slate-100 rounded-xl p-5 sm:p-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-5 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Blind<span className="text-primary">Hire</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Payslip for {record.month} {record.year}</p>
              </div>
              <Badge variant={STATUS_VARIANTS[record.status] || 'default'} dot>{titleCase(record.status)}</Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center gap-3">
                <span className={cn('w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0', avatarColor(employee.first_name + employee.last_name))}>
                  {getInitials(employee.first_name, employee.last_name)}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">{employee.first_name} {employee.last_name}</p>
                  <p className="text-sm text-slate-500 truncate">{employee.role} · {employee.department}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{employee.employee_id}</p>
                </div>
              </div>
              <div className="sm:text-right">
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Bank Details</p>
                <p className="font-semibold text-slate-800">{employee.bank_name}</p>
                <p className="text-sm text-slate-500 font-mono">{employee.account_number}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div className="rounded-xl border border-slate-100 p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Earnings</h4>
                <dl className="space-y-2 text-sm">
                  <PayslipRow label="Basic Salary" value={record.basic_salary} />
                  <PayslipRow label="Allowances" value={record.allowances} />
                  <PayslipRow label="Gross Pay" value={record.basic_salary + record.allowances} bold />
                </dl>
              </div>
              <div className="rounded-xl border border-slate-100 p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Deductions</h4>
                <dl className="space-y-2 text-sm">
                  <PayslipRow label="Tax (PAYE Progressive)" value={record.tax} />
                  <PayslipRow label="Pension (8%)" value={record.pension} />
                  <PayslipRow label="Other Deductions" value={record.deductions} />
                  <PayslipRow label="Total Deductions" value={record.tax + record.pension + record.deductions} bold />
                </dl>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-primary-50 border border-primary-100 px-5 py-4">
              <span className="text-sm font-semibold text-primary-700">Net Pay</span>
              <span className="text-xl font-bold text-primary-700">{formatCurrency(record.net_pay)}</span>
            </div>

            <p className="text-xs text-slate-400 text-center mt-6">
              This is a computer-generated payslip and does not require a signature.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function PayslipRow({ label, value, bold }) {
  return (
    <div className={cn('flex justify-between', bold && 'pt-2 border-t border-slate-100 font-semibold text-slate-800')}>
      <dt className={cn('text-slate-500', bold && 'text-slate-800')}>{label}</dt>
      <dd className={cn(!bold && 'text-slate-700')}>{formatCurrency(value)}</dd>
    </div>
  );
}
