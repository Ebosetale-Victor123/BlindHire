import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, getDay,
  differenceInDays, parseISO,
} from 'date-fns';
import {
  ShieldCheck, ArrowRight, Mail, Briefcase, Building2, CalendarDays, UserCheck,
  Clock, UserX, Printer, FileText, LogOut, CheckCircle2, User, Banknote, AlertCircle,
  CheckSquare, Square, Calendar, ClipboardList, Star, Send, MessageSquare,
  TicketCheck, ChevronRight, Filter,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Table from '../../components/ui/Table';
import StatCard from '../../components/ui/StatCard';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { useApp } from '../../context/AppContext';
import { sendLeaveRequestNotification } from '../../lib/emailjs';
import { maskAccountNumber } from '../../lib/paystack';
import { LEAVE_ENTITLEMENT_DAYS } from '../../data/sampleData';
import {
  cn, formatCurrency, formatDate, getInitials, avatarColor, STATUS_VARIANTS, titleCase,
} from '../../lib/utils';

const SICK_LEAVE_ENTITLEMENT_DAYS = 10;
const PORTAL_LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Maternity/Paternity Leave', 'Emergency Leave', 'Unpaid Leave'];
const TABS = ['My Profile', 'My Attendance', 'Leave Request', 'My Payslip', 'My Tasks', '📣 Feedback', '📣 Voice Centre'];
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const dayCount = (start, end) => differenceInDays(parseISO(end), parseISO(start)) + 1;

export default function EmployeePortal() {
  const { employees } = useApp();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [employee, setEmployee] = useState(null);

  const handleAccess = (e) => {
    e.preventDefault();
    const match = employees.find((emp) => emp.personal_email?.toLowerCase() === email.trim().toLowerCase());
    if (match) {
      setEmployee(match);
      setError('');
    } else {
      setError('Gmail not found. Contact HR to ensure your personal email is registered.');
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg text-slate-800">
              BlindHire <span className="text-slate-400 font-medium">Employee Portal</span>
            </span>
          </Link>
          {employee && (
            <Button variant="secondary" size="sm" onClick={() => { setEmployee(null); setEmail(''); }}>
              <LogOut size={14} /> Switch Account
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {!employee ? (
          <EntryScreen email={email} setEmail={setEmail} error={error} onSubmit={handleAccess} />
        ) : (
          <EmployeeDashboard employee={employee} />
        )}
      </main>
    </div>
  );
}

function EntryScreen({ email, setEmail, error, onSubmit }) {
  return (
    <div className="max-w-md mx-auto mt-8 sm:mt-16">
      <Card className="text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
          <ShieldCheck size={28} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Employee Self-Service Portal</h1>
        <p className="text-sm text-slate-500 mt-1.5 mb-6">Enter your personal Gmail to access your portal</p>
        <form onSubmit={onSubmit} className="space-y-4 text-left">
          <Input
            label="Enter your personal Gmail to access your portal"
            type="email"
            placeholder="yourname@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            required
          />
          <Button type="submit" className="w-full">
            Access Portal <ArrowRight size={16} />
          </Button>
        </form>
      </Card>
    </div>
  );
}

function EmployeeDashboard({ employee }) {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <div className="space-y-6">
      <Card className="flex flex-col sm:flex-row sm:items-center gap-5">
        <span className={cn('w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0', avatarColor(employee.first_name + employee.last_name))}>
          {getInitials(employee.first_name, employee.last_name)}
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-800">Welcome, {employee.first_name}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{employee.role} · {employee.department}</p>
        </div>
      </Card>

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto scrollbar-thin">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'My Profile' && <ProfileTab employee={employee} />}
      {activeTab === 'My Attendance' && <AttendanceTab employee={employee} />}
      {activeTab === 'Leave Request' && <LeaveRequestTab employee={employee} />}
      {activeTab === 'My Payslip' && <PayslipTab employee={employee} />}
      {activeTab === 'My Tasks' && <MyTasksTab employee={employee} />}
      {activeTab === '📣 Feedback' && <FeedbackTab />}
      {activeTab === '📣 Voice Centre' && <VoiceCentreTab employee={employee} />}
    </div>
  );
}

// ============================================================
// Tab 1 — My Profile
// ============================================================
function ProfileTab({ employee }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="My Profile" subtitle="Your employee record on file with HR" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <InfoRow icon={User} label="Full Name" value={`${employee.first_name} ${employee.last_name}`} />
          <InfoRow icon={FileText} label="Employee ID" value={employee.employee_id} />
          <InfoRow icon={Mail} label="Email" value={employee.email} />
          <InfoRow icon={Building2} label="Department" value={employee.department} />
          <InfoRow icon={Briefcase} label="Role" value={employee.role} />
          <InfoRow icon={Briefcase} label="Employment Type" value={titleCase(employee.employment_type)} />
          <InfoRow icon={UserCheck} label="Status" value={<Badge variant={STATUS_VARIANTS[employee.status] || 'default'} dot>{titleCase(employee.status)}</Badge>} />
          <InfoRow icon={CalendarDays} label="Hire Date" value={formatDate(employee.hire_date)} />
        </div>
      </Card>
      <p className="text-sm text-slate-400 text-center">To update your information, contact HR.</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-slate-50 text-slate-400 shrink-0">
        <Icon size={16} />
      </div>
      <div>
        <dt className="text-xs text-slate-400">{label}</dt>
        <dd className="text-sm font-medium text-slate-700 mt-0.5">{value}</dd>
      </div>
    </div>
  );
}

// ============================================================
// Tab 2 — My Attendance
// ============================================================
const ATTENDANCE_COLORS = {
  present: 'bg-success-50 text-success-700',
  late: 'bg-warning-50 text-warning-700',
  absent: 'bg-danger-50 text-danger-700',
  'half-day': 'bg-accent-50 text-accent-700',
};

function AttendanceTab({ employee }) {
  const { attendance, leaveRequests } = useApp();
  const month = useMemo(() => new Date(), []);

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const employeeAttendance = useMemo(
    () => attendance.filter((a) => a.employee_id === employee.id),
    [attendance, employee.id]
  );

  const byDate = useMemo(() => {
    const map = {};
    employeeAttendance.forEach((a) => { map[a.date] = a.status; });
    return map;
  }, [employeeAttendance]);

  const monthRecords = useMemo(() => {
    const prefix = format(month, 'yyyy-MM');
    return employeeAttendance.filter((a) => a.date.startsWith(prefix));
  }, [employeeAttendance, month]);

  const summary = {
    present: monthRecords.filter((a) => a.status === 'present').length,
    late: monthRecords.filter((a) => a.status === 'late').length,
    absent: monthRecords.filter((a) => a.status === 'absent').length,
  };

  const usedAnnual = useMemo(
    () => leaveRequests
      .filter((l) => l.employee_id === employee.id && l.status === 'approved' && l.leave_type === 'Annual Leave')
      .reduce((sum, l) => sum + dayCount(l.start_date, l.end_date), 0),
    [leaveRequests, employee.id]
  );

  const usedSick = useMemo(
    () => leaveRequests
      .filter((l) => l.employee_id === employee.id && l.status === 'approved' && l.leave_type === 'Sick Leave')
      .reduce((sum, l) => sum + dayCount(l.start_date, l.end_date), 0),
    [leaveRequests, employee.id]
  );

  const remainingAnnual = Math.max(0, LEAVE_ENTITLEMENT_DAYS - usedAnnual);
  const remainingSick = Math.max(0, SICK_LEAVE_ENTITLEMENT_DAYS - usedSick);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={UserCheck} label="Days Present" value={summary.present} color="success" />
        <StatCard icon={Clock} label="Days Late" value={summary.late} color="warning" />
        <StatCard icon={UserX} label="Days Absent" value={summary.absent} color="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title={format(month, 'MMMM yyyy')} subtitle="Your attendance this month" />
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-2">
            {WEEKDAY_LABELS.map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: getDay(startOfMonth(month)) }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const status = byDate[dateStr];
              return (
                <div
                  key={dateStr}
                  className={cn(
                    'aspect-square rounded-lg text-xs font-medium flex items-center justify-center',
                    status ? ATTENDANCE_COLORS[status] : 'text-slate-300',
                    isToday(day) && 'border-2 border-primary'
                  )}
                >
                  {format(day, 'd')}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success-50 border border-success-200" /> Present</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning-50 border border-warning-200" /> Late</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-danger-50 border border-danger-200" /> Absent</span>
          </div>
        </Card>

        <Card>
          <CardHeader title="Leave Balance" subtitle="Based on your approved leave requests" />
          <div className="space-y-5">
            <LeaveBalanceRow label="Annual Leave" total={LEAVE_ENTITLEMENT_DAYS} remaining={remainingAnnual} />
            <LeaveBalanceRow label="Sick Leave" total={SICK_LEAVE_ENTITLEMENT_DAYS} remaining={remainingSick} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function LeaveBalanceRow({ label, total, remaining }) {
  const used = total - remaining;
  const pct = Math.min(100, Math.round((used / total) * 100));
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm text-slate-500">{remaining}/{total} days remaining</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', pct >= 80 ? 'bg-danger' : pct >= 50 ? 'bg-warning' : 'bg-success')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// Tab 3 — Leave Request
// ============================================================
const EMPTY_LEAVE_FORM = { leave_type: PORTAL_LEAVE_TYPES[0], start_date: '', end_date: '', reason: '' };

function LeaveRequestTab({ employee }) {
  const { leaveRequests, addLeaveRequest } = useApp();
  const [form, setForm] = useState(EMPTY_LEAVE_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const myRequests = useMemo(
    () => leaveRequests
      .filter((l) => l.employee_id === employee.id)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [leaveRequests, employee.id]
  );

  const handleChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.start_date) errs.start_date = 'Start date is required';
    if (!form.end_date) errs.end_date = 'End date is required';
    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      errs.end_date = 'End date must be on or after start date';
    }
    if (!form.reason.trim()) errs.reason = 'Reason is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');
    try {
      await addLeaveRequest({
        employee_id: employee.id,
        leave_type: form.leave_type,
        start_date: form.start_date,
        end_date: form.end_date,
        reason: form.reason,
        status: 'pending',
      });

      if (employee.personal_email) {
        await sendLeaveRequestNotification({
          employee_name: `${employee.first_name} ${employee.last_name}`,
          employee_email: employee.personal_email,
          leave_type: form.leave_type,
          start_date: form.start_date,
          end_date: form.end_date,
          reason: form.reason,
        });
      }

      setForm(EMPTY_LEAVE_FORM);
      setSuccessMessage('Your leave request has been submitted. HR will review and notify you by email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Submit a Leave Request" subtitle="Fill in the details below" />
        {successMessage && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-success-50 border border-success-100 text-success-700 text-sm px-4 py-3">
            <CheckCircle2 size={16} className="shrink-0" /> {successMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Leave Type" value={form.leave_type} onChange={handleChange('leave_type')}>
            {PORTAL_LEAVE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={form.start_date} onChange={handleChange('start_date')} error={errors.start_date} />
            <Input label="End Date" type="date" value={form.end_date} onChange={handleChange('end_date')} error={errors.end_date} />
          </div>
          <Textarea label="Reason" rows={3} value={form.reason} onChange={handleChange('reason')} error={errors.reason} placeholder="Briefly describe the reason for leave..." />
          <div className="flex justify-end">
            <Button type="submit" loading={submitting}>Submit Leave Request</Button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="My Leave Requests" subtitle="History of all your leave requests" />
        <Table
          columns={[
            { key: 'leave_type', header: 'Type', render: (r) => <Badge variant="default">{r.leave_type}</Badge> },
            { key: 'start_date', header: 'From', render: (r) => formatDate(r.start_date) },
            { key: 'end_date', header: 'To', render: (r) => formatDate(r.end_date) },
            { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS_VARIANTS[r.status] || 'default'} dot>{titleCase(r.status)}</Badge> },
            { key: 'created_at', header: 'Date Submitted', render: (r) => formatDate(r.created_at) },
          ]}
          data={myRequests}
          emptyMessage="You haven't submitted any leave requests yet"
        />
      </Card>
    </div>
  );
}

// ============================================================
// Tab 4 — My Payslip
// ============================================================
function PayslipTab({ employee }) {
  const { payroll, transactions } = useApp();
  const [periodKey, setPeriodKey] = useState(null);

  const records = useMemo(
    () => payroll
      .filter((p) => p.employee_id === employee.id)
      .sort((a, b) => new Date(`${b.month} 1, ${b.year}`) - new Date(`${a.month} 1, ${a.year}`)),
    [payroll, employee.id]
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

  const paymentTx = useMemo(() => {
    if (!record) return null;
    return transactions.find((t) => t.payroll_id === record.id && t.employee_id === employee.id) || null;
  }, [record, transactions, employee.id]);

  const handlePrint = () => window.print();

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader
          title="My Payslip"
          subtitle="Select a pay period to view your payslip"
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Select value={periodKey || ''} onChange={(e) => setPeriodKey(e.target.value)} className="w-36" disabled={!records.length}>
                {records.map((r) => {
                  const key = `${r.month}-${r.year}`;
                  return <option key={key} value={key}>{r.month} {r.year}</option>;
                })}
              </Select>
              <Button onClick={handlePrint} disabled={!record}>
                <Printer size={16} /> Print
              </Button>
            </div>
          }
        />

        {!record ? (
          <div className="text-center py-16">
            <FileText size={36} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-400">No payslip available for this period.</p>
          </div>
        ) : (
          <div id="payslip-print" className="max-w-2xl mx-auto border border-slate-100 rounded-xl p-5 sm:p-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-5 mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Blind<span className="text-primary">Hire</span> Ltd
                </h2>
                <p className="text-xs text-slate-400 mt-1">HR Management System</p>
                <p className="text-xs text-slate-400 mt-1">Payslip for {record.month} {record.year}</p>
              </div>
              <Badge variant={STATUS_VARIANTS[record.status] || 'default'} dot>{titleCase(record.status)}</Badge>
            </div>

            <div className="flex items-center gap-3 mb-6">
              <span className={cn('w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold shrink-0', avatarColor(employee.first_name + employee.last_name))}>
                {getInitials(employee.first_name, employee.last_name)}
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">{employee.first_name} {employee.last_name}</p>
                <p className="text-sm text-slate-500 truncate">{employee.role} · {employee.department}</p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{employee.employee_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
              <div className="rounded-xl border border-slate-100 p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Earnings</h4>
                <dl className="space-y-2 text-sm">
                  <PayslipRow label="Basic Salary" value={record.basic_salary} />
                  <PayslipRow label="Allowances (10%)" value={record.allowances} />
                  <PayslipRow label="Gross Pay" value={record.basic_salary + record.allowances} bold />
                </dl>
              </div>
              <div className="rounded-xl border border-slate-100 p-4">
                <h4 className="text-sm font-semibold text-slate-700 mb-3">Deductions</h4>
                <dl className="space-y-2 text-sm">
                  <PayslipRow label="PAYE Tax (Progressive)" value={record.tax} />
                  <PayslipRow label="Pension (8%)" value={record.pension} />
                  {record.deductions > 0 && <PayslipRow label="Other Deductions" value={record.deductions} />}
                  <PayslipRow label="Total Deductions" value={record.tax + record.pension + (record.deductions || 0)} bold />
                </dl>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-success-50 border border-success-100 px-5 py-4">
              <span className="text-sm font-semibold text-success-700">Net Pay</span>
              <span className="text-2xl font-bold text-success-700">{formatCurrency(record.net_pay)}</span>
            </div>

            {/* Payment status */}
            <div className={cn(
              'mt-4 flex items-start gap-3 rounded-xl px-4 py-3 text-sm',
              record.status === 'paid' ? 'bg-success-50 border border-success-100 text-success-800'
              : paymentTx?.status === 'failed' ? 'bg-danger-50 border border-danger-100 text-danger-800'
              : 'bg-slate-50 border border-slate-100 text-slate-600'
            )}>
              {record.status === 'paid' ? (
                <>
                  <Banknote size={18} className="shrink-0 mt-0.5 text-success-600" />
                  <div>
                    <p className="font-semibold">Payment Sent</p>
                    <p className="text-xs mt-0.5">
                      Transferred to {employee.bank_name} · {maskAccountNumber(employee.account_number)}
                      {record.paid_at && ` on ${new Date(record.paid_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })}`}
                    </p>
                  </div>
                </>
              ) : paymentTx?.status === 'failed' ? (
                <>
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-danger-600" />
                  <div>
                    <p className="font-semibold">Transfer Failed</p>
                    <p className="text-xs mt-0.5">{paymentTx.error_message || 'Contact HR for details.'}</p>
                  </div>
                </>
              ) : (
                <>
                  <Clock size={18} className="shrink-0 mt-0.5 text-slate-400" />
                  <div>
                    <p className="font-semibold">Awaiting Disbursement</p>
                    <p className="text-xs mt-0.5">HR has not yet disbursed this payroll cycle.</p>
                  </div>
                </>
              )}
            </div>

            <p className="text-xs text-slate-400 text-center mt-6">
              This is a computer-generated payslip.
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

// ============================================================
// Tab 5 — My Tasks
// ============================================================
function MyTasksTab({ employee }) {
  const { tasks, updateTask, refreshTasks } = useApp();

  useEffect(() => { refreshTasks?.(); }, []);

  const myTasks = useMemo(
    () => tasks
      .filter((t) => t.employee_id === employee.id)
      .sort((a, b) => {
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        if (a.due_date && b.due_date) return a.due_date < b.due_date ? -1 : 1;
        return 0;
      }),
    [tasks, employee.id]
  );

  const doneCount = myTasks.filter((t) => t.status === 'completed').length;

  const handleToggle = async (task) => {
    await updateTask(task.id, {
      status: task.status === 'completed' ? 'pending' : 'completed',
      completed_at: task.status === 'completed' ? null : new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={ClipboardList} label="Total Tasks" value={myTasks.length} color="primary" />
        <StatCard icon={CheckSquare} label="Completed" value={doneCount} color="success" />
        <StatCard icon={Clock} label="Pending" value={myTasks.length - doneCount} color="warning" />
      </div>

      <Card>
        <CardHeader
          title="My Tasks"
          subtitle={`${doneCount} of ${myTasks.length} completed — tap a task to mark it done`}
        />
        {myTasks.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <ClipboardList size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No tasks assigned yet. Contact HR or your manager.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {myTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 py-3 border-b border-slate-50 last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handleToggle(task)}
                    className={cn(
                      'shrink-0 transition-colors',
                      task.status === 'completed'
                        ? 'text-success-600'
                        : 'text-slate-300 hover:text-slate-500'
                    )}
                  >
                    {task.status === 'completed' ? <CheckSquare size={20} /> : <Square size={20} />}
                  </button>
                  <div className="min-w-0">
                    <p className={cn(
                      'text-sm text-slate-700 truncate',
                      task.status === 'completed' && 'line-through text-slate-400'
                    )}>
                      {task.title}
                    </p>
                    {task.completed_at ? (
                      <p className="text-xs text-success-600 flex items-center gap-1 mt-0.5">
                        <CheckSquare size={11} />
                        {`Completed on ${new Date(task.completed_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })} at ${new Date(task.completed_at).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                      </p>
                    ) : task.due_date ? (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={11} /> Due {formatDate(task.due_date)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <Badge
                  variant={task.status === 'completed' ? 'success' : 'default'}
                  className="shrink-0 capitalize"
                >
                  {task.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ============================================================
// Tab 6 — Anonymous Feedback
// ============================================================
const FEEDBACK_CATEGORIES = ['Work Environment', 'Management', 'Pay & Benefits', 'Career Growth', 'Team Culture', 'Other'];

function FeedbackTab() {
  const { addFeedback } = useApp();
  const [category, setCategory] = useState(FEEDBACK_CATEGORIES[0]);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return;
    setSubmitting(true);
    await addFeedback({ category, rating, message: message.trim() });
    setSubmitted(true);
    setCategory(FEEDBACK_CATEGORIES[0]);
    setRating(0);
    setMessage('');
    setSubmitting(false);
  };

  return (
    <div className="max-w-lg mx-auto">
      <Card>
        <CardHeader
          title="Share Your Thoughts"
          subtitle="Your feedback is completely anonymous. Your identity is never stored."
        />
        {submitted && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-success-50 border border-success-100 text-success-700 text-sm px-4 py-3">
            <CheckCircle2 size={16} className="shrink-0" />
            Thank you. Your feedback has been submitted anonymously.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            label="Category"
            value={category}
            onChange={(e) => { setCategory(e.target.value); setSubmitted(false); }}
          >
            {FEEDBACK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Rating</p>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setRating(s); setSubmitted(false); }}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={cn(s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200')}
                  />
                </button>
              ))}
              {rating > 0 && <span className="ml-2 text-sm text-slate-500">{rating}/5</span>}
            </div>
            {!rating && <p className="text-xs text-danger-600 mt-1">Please select a rating</p>}
          </div>

          <Textarea
            label="Message (optional)"
            rows={4}
            value={message}
            onChange={(e) => { setMessage(e.target.value.slice(0, 500)); setSubmitted(false); }}
            placeholder="Share your thoughts, suggestions, or concerns..."
            hint={`${message.length}/500 characters`}
          />

          <Button type="submit" loading={submitting} disabled={!rating} className="w-full">
            <Send size={15} /> Submit Anonymously
          </Button>
        </form>
        <p className="text-xs text-slate-400 text-center mt-4">
          No name, email or employee ID is ever attached to this response.
        </p>
      </Card>
    </div>
  );
}

// ============================================================
// Tab 7 — Voice Centre (Queries & Claims)
// ============================================================
const QUERY_CATEGORIES = ['Payslip Issue', 'Attendance Dispute', 'Leave Issue', 'Policy Question', 'Other'];
const CLAIM_CATEGORIES = ['Transport', 'Meals', 'Equipment', 'Training', 'Medical', 'Other'];

const STATUS_COLORS = {
  open: 'default',
  in_review: 'warning',
  resolved: 'success',
  rejected: 'danger',
};

function VoiceCentreTab({ employee }) {
  const { queries, addQuery } = useApp();
  const [mode, setMode] = useState('query'); // 'query' | 'claim'
  const [form, setForm] = useState({ category: QUERY_CATEGORIES[0], subject: '', message: '', amount: '', receipt_note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const myTickets = useMemo(
    () => queries
      .filter((q) => q.employee_id === employee.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [queries, employee.id]
  );

  const categories = mode === 'query' ? QUERY_CATEGORIES : CLAIM_CATEGORIES;

  const handleModeChange = (m) => {
    setMode(m);
    setForm({ category: (m === 'query' ? QUERY_CATEGORIES : CLAIM_CATEGORIES)[0], subject: '', message: '', amount: '', receipt_note: '' });
    setSuccessMsg('');
  };

  const handleChange = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) return;
    setSubmitting(true);
    const suffix = Date.now().toString().slice(-4);
    const ticket_number = mode === 'query' ? `BH-Q-${suffix}` : `BH-C-${suffix}`;
    await addQuery({
      employee_id: employee.id,
      ticket_number,
      type: mode,
      category: form.category,
      subject: form.subject.trim(),
      message: form.message.trim(),
      amount: mode === 'claim' && form.amount ? Number(form.amount) : null,
      receipt_note: mode === 'claim' ? form.receipt_note.trim() || null : null,
      status: 'open',
      hr_response: null,
      resolved_at: null,
    });
    const label = mode === 'query' ? 'Query' : 'Claim';
    const days = mode === 'query' ? '24 hours' : '48 hours';
    setSuccessMsg(`✅ ${label} submitted. Ticket: ${ticket_number}. HR will respond within ${days}.`);
    setForm({ category: categories[0], subject: '', message: '', amount: '', receipt_note: '' });
    setSubmitting(false);
  };

  return (
    <div className="space-y-5">
      {/* Submit form */}
      <Card>
        <CardHeader title="Submit a Query or Claim" subtitle="HR will review and respond to your ticket" />

        {/* Mode toggle */}
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => handleModeChange('query')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors',
              mode === 'query'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
            )}
          >
            📋 Raise a Query
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('claim')}
            className={cn(
              'flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors',
              mode === 'claim'
                ? 'bg-success text-white border-success'
                : 'bg-white text-slate-600 border-slate-200 hover:border-success hover:text-success-700'
            )}
          >
            💰 Submit a Claim
          </button>
        </div>

        {successMsg && (
          <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-success-50 border border-success-100 text-success-700 text-sm px-4 py-3">
            <CheckCircle2 size={16} className="shrink-0" /> {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label="Category" value={form.category} onChange={handleChange('category')}>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input
            label="Subject"
            value={form.subject}
            onChange={handleChange('subject')}
            placeholder={mode === 'query' ? 'e.g. June payslip discrepancy' : 'e.g. Transport to client site'}
            required
          />
          {mode === 'claim' && (
            <Input
              label="Amount (₦)"
              type="number"
              min="0"
              value={form.amount}
              onChange={handleChange('amount')}
              placeholder="15000"
            />
          )}
          <Textarea
            label={mode === 'query' ? 'Message' : 'Description'}
            rows={4}
            value={form.message}
            onChange={handleChange('message')}
            placeholder={mode === 'query'
              ? 'Describe your issue in detail...'
              : 'Describe the expense and reason for the claim...'}
            required
          />
          {mode === 'claim' && (
            <Input
              label="Receipt Note (optional)"
              value={form.receipt_note}
              onChange={handleChange('receipt_note')}
              placeholder="e.g. Uber receipt — submitted to Admin"
            />
          )}
          <div className="flex justify-end">
            <Button type="submit" loading={submitting} disabled={!form.subject.trim() || !form.message.trim()}>
              <Send size={14} /> {mode === 'query' ? 'Submit Query' : 'Submit Claim'}
            </Button>
          </div>
        </form>
      </Card>

      {/* My Tickets */}
      <Card>
        <CardHeader
          title="My Tickets"
          subtitle={`${myTickets.length} ticket${myTickets.length !== 1 ? 's' : ''} submitted`}
        />
        {myTickets.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <TicketCheck size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No tickets yet. Use the form above to raise a query or claim.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {ticket.ticket_number}
                    </span>
                    <Badge variant={ticket.type === 'claim' ? 'success' : 'primary'} className="capitalize">
                      {ticket.type}
                    </Badge>
                    <Badge variant={STATUS_COLORS[ticket.status] || 'default'} dot className="capitalize">
                      {ticket.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{formatDate(ticket.created_at)}</span>
                </div>
                <p className="text-xs text-slate-400 mb-0.5">{ticket.category}</p>
                <p className="text-sm font-medium text-slate-700">{ticket.subject}</p>
                {ticket.type === 'claim' && ticket.amount && (
                  <p className="text-sm text-success-700 font-semibold mt-1">{formatCurrency(ticket.amount)}</p>
                )}
                {ticket.hr_response && (
                  <div className="mt-3 bg-primary-50 border border-primary-100 rounded-lg px-3 py-2">
                    <p className="text-xs font-semibold text-primary-700 mb-1">HR Response</p>
                    <p className="text-sm text-slate-700">{ticket.hr_response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
