import { useEffect, useMemo } from 'react';
import { ArrowLeftRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import { useApp } from '../../context/AppContext';
import { formatCurrency, cn } from '../../lib/utils';
import { maskAccountNumber } from '../../lib/paystack';

const STATUS_MAP = {
  success: { variant: 'success', icon: CheckCircle2 },
  failed: { variant: 'danger', icon: XCircle },
  pending: { variant: 'warning', icon: Clock },
};

export default function TransactionLog() {
  const { transactions, employees, refreshTransactions } = useApp();

  useEffect(() => {
    refreshTransactions?.();
  }, []);

  const employeeMap = useMemo(() => {
    const m = {};
    employees.forEach((e) => { m[e.id] = e; });
    return m;
  }, [employees]);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [transactions]
  );

  return (
    <Card>
      <CardHeader
        title="Transaction Log"
        subtitle="All Paystack disbursement records"
      />

      {sorted.length === 0 ? (
        <div className="text-center py-16">
          <ArrowLeftRight size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-400">No disbursements yet. Run payroll and use Disburse to send payments.</p>
        </div>
      ) : (
        <Table
          columns={[
            {
              key: 'employee',
              header: 'Employee',
              render: (r) => {
                const emp = employeeMap[r.employee_id];
                return emp ? `${emp.first_name} ${emp.last_name}` : '—';
              },
            },
            {
              key: 'bank',
              header: 'Bank Account',
              render: (r) => {
                const emp = employeeMap[r.employee_id];
                if (!emp) return '—';
                return (
                  <span className="font-mono text-sm">
                    {emp.bank_name} · {maskAccountNumber(emp.account_number)}
                  </span>
                );
              },
            },
            {
              key: 'amount',
              header: 'Amount',
              render: (r) => <span className="font-semibold">{formatCurrency(r.amount / 100)}</span>,
            },
            { key: 'reference', header: 'Reference', render: (r) => <span className="font-mono text-xs text-slate-500">{r.reference}</span> },
            {
              key: 'status',
              header: 'Status',
              render: (r) => {
                const s = STATUS_MAP[r.status] || STATUS_MAP.pending;
                const Icon = s.icon;
                return (
                  <Badge variant={s.variant} dot>
                    <Icon size={12} className="mr-1" />
                    {r.status}
                  </Badge>
                );
              },
            },
            {
              key: 'created_at',
              header: 'Date',
              render: (r) => new Date(r.created_at).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' }),
            },
          ]}
          data={sorted}
          emptyMessage="No transactions found"
        />
      )}
    </Card>
  );
}
