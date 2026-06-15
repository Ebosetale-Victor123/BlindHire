import { useMemo, useState } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Select, Textarea } from '../../components/ui/Input';
import Toast, { useToast } from '../../components/ui/Toast';
import { useApp } from '../../context/AppContext';
import { useAttendance } from '../../hooks/useAttendance';
import { sendLeaveDecisionNotification } from '../../lib/emailjs';
import { LEAVE_ENTITLEMENT_DAYS } from '../../data/sampleData';
import { cn, formatDate, getInitials, avatarColor, STATUS_VARIANTS, titleCase } from '../../lib/utils';

const dayCount = (start, end) => differenceInDays(parseISO(end), parseISO(start)) + 1;

export default function LeaveManagement() {
  const { employees } = useApp();
  const { leaveRequests, updateLeaveRequest } = useAttendance();
  const { toast, showToast, hideToast } = useToast();
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingId, setProcessingId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const employeeMap = useMemo(() => {
    const m = {};
    employees.forEach((e) => { m[e.id] = e; });
    return m;
  }, [employees]);

  const sortedRequests = useMemo(() => {
    let reqs = [...leaveRequests];
    if (statusFilter !== 'all') reqs = reqs.filter((r) => r.status === statusFilter);
    return reqs.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  }, [leaveRequests, statusFilter]);

  const balances = useMemo(() => {
    return employees
      .map((e) => {
        const used = leaveRequests
          .filter((l) => l.employee_id === e.id && l.status === 'approved')
          .reduce((sum, l) => sum + dayCount(l.start_date, l.end_date), 0);
        return { employee: e, used, remaining: Math.max(0, LEAVE_ENTITLEMENT_DAYS - used) };
      })
      .sort((a, b) => b.used - a.used);
  }, [employees, leaveRequests]);

  const pendingCount = leaveRequests.filter((r) => r.status === 'pending').length;

  const handleApprove = async (request) => {
    setProcessingId(request.id);
    try {
      const emp = employeeMap[request.employee_id];
      await updateLeaveRequest(request.id, { status: 'approved' });
      if (emp?.personal_email) {
        await sendLeaveDecisionNotification({
          employee_name: emp ? `${emp.first_name} ${emp.last_name}` : '',
          employee_email: emp.personal_email,
          leave_type: request.leave_type,
          start_date: request.start_date,
          end_date: request.end_date,
          decision: 'APPROVED',
          message: 'Your leave has been approved. Enjoy your time off.',
        });
        showToast('Leave approved and employee notified by email', 'success');
      } else {
        showToast('Leave approved. No personal email on file — employee not notified', 'warning');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request, reason) => {
    const emp = employeeMap[request.employee_id];
    await updateLeaveRequest(request.id, { status: 'rejected' });
    if (emp?.personal_email) {
      await sendLeaveDecisionNotification({
        employee_name: emp ? `${emp.first_name} ${emp.last_name}` : '',
        employee_email: emp.personal_email,
        leave_type: request.leave_type,
        start_date: request.start_date,
        end_date: request.end_date,
        decision: 'REJECTED',
        message: reason,
      });
      showToast('Leave rejected and employee notified by email', 'success');
    } else {
      showToast('Leave rejected. No personal email on file — employee not notified', 'warning');
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="Leave Requests"
          subtitle={`${pendingCount} pending approval`}
          action={
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </Select>
          }
        />
        <Table
          columns={[
            {
              key: 'employee',
              header: 'Employee Name',
              render: (r) => {
                const emp = employeeMap[r.employee_id];
                if (!emp) return '—';
                return (
                  <div className="flex items-center gap-2.5 min-w-[150px]">
                    <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', avatarColor(emp.first_name + emp.last_name))}>
                      {getInitials(emp.first_name, emp.last_name)}
                    </span>
                    <div className="min-w-0">
                      <span className="text-slate-700 font-medium truncate block">{emp.first_name} {emp.last_name}</span>
                      <span
                        className="text-xs text-slate-400 truncate block"
                        title={emp.personal_email ? `Notifications sent to ${emp.personal_email}` : 'No personal email on file'}
                      >
                        {emp.personal_email || 'No personal email on file'}
                      </span>
                    </div>
                  </div>
                );
              },
            },
            { key: 'department', header: 'Department', render: (r) => employeeMap[r.employee_id]?.department || '—' },
            { key: 'leave_type', header: 'Leave Type', render: (r) => <Badge variant="default">{r.leave_type}</Badge> },
            { key: 'start_date', header: 'From', render: (r) => formatDate(r.start_date) },
            { key: 'end_date', header: 'To', render: (r) => formatDate(r.end_date) },
            { key: 'reason', header: 'Reason', render: (r) => <span className="text-slate-500 line-clamp-1 max-w-[180px] block">{r.reason}</span> },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS_VARIANTS[r.status] || 'default'} dot>{titleCase(r.status)}</Badge> },
            { key: 'created_at', header: 'Date Submitted', render: (r) => formatDate(r.created_at) },
            {
              key: 'actions',
              header: '',
              headerClassName: 'text-right',
              className: 'text-right',
              render: (r) =>
                r.status === 'pending' ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="success" loading={processingId === r.id} onClick={() => handleApprove(r)}>
                      Approve
                    </Button>
                    <Button size="sm" variant="danger" disabled={processingId === r.id} onClick={() => setRejectTarget(r)}>
                      Reject
                    </Button>
                  </div>
                ) : (
                  <span className="text-slate-300 text-xs">—</span>
                ),
            },
          ]}
          data={sortedRequests}
          emptyMessage="No leave requests"
        />
      </Card>

      <Card>
        <CardHeader title="Leave Balances" subtitle={`${LEAVE_ENTITLEMENT_DAYS} days annual entitlement`} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {balances.map(({ employee, used, remaining }) => {
            const pct = Math.min(100, Math.round((used / LEAVE_ENTITLEMENT_DAYS) * 100));
            return (
              <div key={employee.id}>
                <div className="flex items-center justify-between mb-1 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', avatarColor(employee.first_name + employee.last_name))}>
                      {getInitials(employee.first_name, employee.last_name)}
                    </span>
                    <span className="text-sm text-slate-700 truncate">{employee.first_name} {employee.last_name}</span>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">{remaining}/{LEAVE_ENTITLEMENT_DAYS} left</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', pct >= 80 ? 'bg-danger' : pct >= 50 ? 'bg-warning' : 'bg-success')}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <RejectModal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onSubmit={async (reason) => {
          await handleReject(rejectTarget, reason);
          setRejectTarget(null);
        }}
      />

      <Toast message={toast?.message} variant={toast?.variant} onClose={hideToast} />
    </div>
  );
}

function RejectModal({ open, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await onSubmit(reason.trim());
      setReason('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Reject Leave Request" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          label="Reason for rejection"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Let the employee know why this request is being rejected..."
        />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" loading={submitting} disabled={!reason.trim()}>Reject & Notify</Button>
        </div>
      </form>
    </Modal>
  );
}
