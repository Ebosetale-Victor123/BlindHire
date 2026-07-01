import { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Mail, AtSign, Phone, Building2, Briefcase, Calendar, Wallet, Landmark,
  Users as UsersIcon, Pencil, FileCheck2, FileClock, CreditCard, Receipt, Trash2, Rocket, Target,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import Toast, { useToast } from '../../components/ui/Toast';
import RemoveEmployeeModal from '../../components/shared/RemoveEmployeeModal';
import GrowthPlanTab from '../../components/employees/GrowthPlanTab';
import PerformanceTab from '../../components/employees/PerformanceTab';
import EmployeeForm from './EmployeeForm';
import { useEmployees } from '../../hooks/useEmployees';
import { useApp } from '../../context/AppContext';
import { generateGrowthPlan } from '../../lib/groq';
import {
  cn, formatCurrency, formatDate, formatTime, getInitials, avatarColor,
  STATUS_VARIANTS, titleCase, calculatePayroll,
} from '../../lib/utils';

const TABS = [
  { key: 'Profile' },
  { key: 'Attendance' },
  { key: 'Payroll' },
  { key: 'Documents' },
  { key: 'Performance', icon: Target },
  { key: 'Growth Plan', icon: Rocket },
];

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getEmployeeById, updateEmployee, deleteEmployee } = useEmployees();
  const {
    attendance, payroll, onboarding, logGrowthPlanGenerated, setPayrollRecords,
    performanceRecords, tasks, addPerformanceRecord, addTask, updateTask,
  } = useApp();
  const { toast, showToast, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState('Profile');
  const [showEdit, setShowEdit] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [growthPlan, setGrowthPlan] = useState(null);
  const [growthPlanLoading, setGrowthPlanLoading] = useState(false);
  const [growthPlanError, setGrowthPlanError] = useState(null);

  const employee = getEmployeeById(id);

  const employeeAttendance = useMemo(
    () => attendance.filter((a) => a.employee_id === id).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [attendance, id]
  );

  const employeePayroll = useMemo(
    () => payroll.filter((p) => p.employee_id === id).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [payroll, id]
  );

  const employeeOnboarding = useMemo(
    () => onboarding.filter((o) => o.employee_id === id),
    [onboarding, id]
  );

  const attendanceSummary = useMemo(() => {
    const last30 = employeeAttendance.slice(0, 30);
    return {
      present: last30.filter((a) => a.status === 'present').length,
      late: last30.filter((a) => a.status === 'late').length,
      absent: last30.filter((a) => a.status === 'absent').length,
      halfDay: last30.filter((a) => a.status === 'half-day').length,
    };
  }, [employeeAttendance]);

  if (!employee) {
    return (
      <Card className="text-center py-16">
        <p className="text-slate-500 mb-4">Employee not found.</p>
        <Button onClick={() => navigate('/employees')}>
          <ArrowLeft size={16} /> Back to Employees
        </Button>
      </Card>
    );
  }

  const documentationTasks = employeeOnboarding.filter((t) => t.category === 'Documentation');

  const runGrowthPlan = async () => {
    setGrowthPlanLoading(true);
    setGrowthPlanError(null);
    setGrowthPlan(null);
    const result = await generateGrowthPlan({ employee });
    if (!result) {
      setGrowthPlanError('Could not generate plan. Try again.');
    } else {
      setGrowthPlan(result);
      logGrowthPlanGenerated();
    }
    setGrowthPlanLoading(false);
  };

  const handleRemoveConfirm = async (reason) => {
    await deleteEmployee(employee.id);
    setShowRemoveModal(false);
    navigate('/employees', { state: { toast: 'Employee removed from system' } });
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/employees')}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} /> Back to Employees
      </button>

      {/* Profile header */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <span className={cn('w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0', avatarColor(employee.first_name + employee.last_name))}>
            {getInitials(employee.first_name, employee.last_name)}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">{employee.first_name} {employee.last_name}</h2>
              <Badge variant={STATUS_VARIANTS[employee.status] || 'default'} dot>{titleCase(employee.status)}</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">{employee.role} · {employee.department}</p>
            <p className="text-xs font-mono text-slate-400 mt-1">{employee.employee_id}</p>
          </div>
          <Button variant="secondary" onClick={() => setShowEdit(true)}>
            <Pencil size={16} /> Edit Profile
          </Button>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto scrollbar-thin">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap inline-flex items-center gap-1.5',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.icon && <tab.icon size={14} />}
            {tab.key}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {activeTab === 'Profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Contact Information" />
            <dl className="space-y-4">
              <InfoRow icon={Mail} label="Email" value={employee.email} />
              <InfoRow icon={Phone} label="Phone" value={employee.phone || '—'} />
              <InfoRow icon={AtSign} label="Personal Email (Portal Access)" value={employee.personal_email || '—'} />
            </dl>
          </Card>
          <Card>
            <CardHeader title="Employment Details" />
            <dl className="space-y-4">
              <InfoRow icon={Building2} label="Department" value={employee.department} />
              <InfoRow icon={Briefcase} label="Role" value={employee.role} />
              <InfoRow icon={Calendar} label="Hire Date" value={formatDate(employee.hire_date)} />
              <InfoRow icon={Wallet} label="Monthly Salary" value={formatCurrency(employee.salary)} />
              <InfoRow icon={Briefcase} label="Employment Type" value={titleCase(employee.employment_type)} />
            </dl>
          </Card>
          <Card>
            <CardHeader title="Bank Details" />
            <dl className="space-y-4">
              <InfoRow icon={Landmark} label="Bank Name" value={employee.bank_name || '—'} />
              <InfoRow icon={CreditCard} label="Account Number" value={employee.account_number || '—'} />
            </dl>
          </Card>
          <Card>
            <CardHeader title="Emergency Contact" />
            <dl className="space-y-4">
              <InfoRow icon={UsersIcon} label="Next of Kin" value={employee.next_of_kin || '—'} />
            </dl>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader title="Skills" />
            {(employee.skills || []).length === 0 ? (
              <p className="text-sm text-slate-400">No skills listed.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {employee.skills.map((skill) => (
                  <Badge key={skill} variant="outline">{skill}</Badge>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Attendance tab */}
      {activeTab === 'Attendance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SummaryStat label="Present" value={attendanceSummary.present} variant="success" />
            <SummaryStat label="Late" value={attendanceSummary.late} variant="warning" />
            <SummaryStat label="Half-day" value={attendanceSummary.halfDay} variant="accent" />
            <SummaryStat label="Absent" value={attendanceSummary.absent} variant="danger" />
          </div>
          <Card>
            <CardHeader title="Attendance History" subtitle="Most recent records" />
            <Table
              columns={[
                { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
                { key: 'clock_in', header: 'Clock In', render: (r) => formatTime(r.clock_in) },
                { key: 'clock_out', header: 'Clock Out', render: (r) => formatTime(r.clock_out) },
                { key: 'hours_worked', header: 'Hours', render: (r) => r.hours_worked || '—' },
                { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS_VARIANTS[r.status] || 'default'} dot>{titleCase(r.status)}</Badge> },
              ]}
              data={employeeAttendance.slice(0, 15)}
              emptyMessage="No attendance records yet"
            />
          </Card>
        </div>
      )}

      {/* Payroll tab */}
      {activeTab === 'Payroll' && (
        <Card>
          <CardHeader
            title="Payroll History"
            subtitle="Net pay across recent months"
            action={
              <Link to={`/payroll?tab=payslip&employee=${employee.id}`}>
                <Button variant="outline" size="sm"><Receipt size={14} /> View Payslips</Button>
              </Link>
            }
          />
          <Table
            columns={[
              { key: 'period', header: 'Period', render: (r) => `${r.month} ${r.year}` },
              { key: 'basic_salary', header: 'Basic', render: (r) => formatCurrency(r.basic_salary) },
              { key: 'allowances', header: 'Allowances', render: (r) => formatCurrency(r.allowances) },
              { key: 'tax', header: 'Tax (PAYE)', render: (r) => formatCurrency(r.tax) },
              { key: 'pension', header: 'Pension', render: (r) => formatCurrency(r.pension) },
              { key: 'net_pay', header: 'Net Pay', render: (r) => <span className="font-semibold text-slate-800">{formatCurrency(r.net_pay)}</span> },
              { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS_VARIANTS[r.status] || 'default'} dot>{titleCase(r.status)}</Badge> },
            ]}
            data={employeePayroll}
            emptyMessage="No payroll records yet"
          />
        </Card>
      )}

      {/* Documents tab */}
      {activeTab === 'Documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader title="Compliance Documents" subtitle="Records on file with HR" />
            <ul className="space-y-3">
              <DocumentRow label="Bank Account Details" submitted={!!employee.account_number} />
              <DocumentRow label="Next of Kin Information" submitted={!!employee.next_of_kin} />
              <DocumentRow label="Signed Offer Letter" submitted={true} />
              <DocumentRow label="Tax Identification Number (TIN)" submitted={employee.status !== 'probation'} />
              <DocumentRow label="Valid ID (NIN / Passport)" submitted={true} />
            </ul>
          </Card>
          <Card>
            <CardHeader title="Onboarding Documentation Tasks" subtitle="From the onboarding checklist" />
            {documentationTasks.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">No onboarding documentation tasks for this employee.</p>
            ) : (
              <ul className="space-y-3">
                {documentationTasks.map((task) => (
                  <DocumentRow key={task.id} label={task.task} submitted={task.completed} />
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* Performance tab */}
      {activeTab === 'Performance' && (
        <PerformanceTab
          employee={employee}
          attendance={attendance}
          tasks={tasks}
          performanceRecords={performanceRecords}
          onAddRecord={addPerformanceRecord}
          onAddTask={addTask}
          onUpdateTask={updateTask}
        />
      )}

      {/* Growth Plan tab */}
      {activeTab === 'Growth Plan' && (
        <GrowthPlanTab
          employee={employee}
          plan={growthPlan}
          loading={growthPlanLoading}
          error={growthPlanError}
          onGenerate={runGrowthPlan}
          onRegenerate={runGrowthPlan}
          showToast={showToast}
        />
      )}

      {/* Danger zone */}
      <Card className="border-danger-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Danger Zone</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Permanently remove this employee and their related records from the system.
            </p>
          </div>
          <Button variant="danger" onClick={() => setShowRemoveModal(true)}>
            <Trash2 size={16} /> Remove Employee
          </Button>
        </div>
      </Card>

      <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Edit Employee" size="lg">
        <EmployeeForm
          initialValues={employee}
          onSubmit={async (data) => {
            const salaryChanged = Number(data.salary) !== Number(employee.salary);
            await updateEmployee(employee.id, data);
            setShowEdit(false);

            if (salaryChanged) {
              const now = new Date();
              const currentMonth = now.toLocaleString('en-US', { month: 'long' });
              const currentYear = now.getFullYear();
              const currentRecord = payroll.find(
                (p) =>
                  p.employee_id === employee.id &&
                  p.month === currentMonth &&
                  String(p.year) === String(currentYear)
              );

              if (currentRecord) {
                if (currentRecord.status === 'paid') {
                  showToast(
                    `Payroll already disbursed for ${currentMonth}. Changes take effect next month.`,
                    'warning'
                  );
                } else {
                  const newSalary = Number(data.salary);
                  const allowances = Math.round(newSalary * 0.1);
                  const { tax, pension, netPay } = calculatePayroll(newSalary, allowances);
                  await setPayrollRecords([{
                    ...currentRecord,
                    basic_salary: newSalary,
                    allowances,
                    deductions: 0,
                    tax,
                    pension,
                    net_pay: netPay,
                  }]);
                  showToast(`Salary updated and payroll recalculated for ${currentMonth}`, 'success');
                }
              } else {
                showToast('Salary updated successfully', 'success');
              }
            } else {
              showToast('Employee profile updated', 'success');
            }
          }}
          onCancel={() => setShowEdit(false)}
          submitLabel="Save Changes"
        />
      </Modal>

      <RemoveEmployeeModal
        open={showRemoveModal}
        employee={employee}
        onClose={() => setShowRemoveModal(false)}
        onConfirm={handleRemoveConfirm}
      />

      <Toast message={toast?.message} variant={toast?.variant} onClose={hideToast} />
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
        <dd className="text-sm font-medium text-slate-700">{value}</dd>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, variant }) {
  const colors = {
    success: 'text-success-600 bg-success-50',
    warning: 'text-warning-600 bg-warning-50',
    danger: 'text-danger-600 bg-danger-50',
    accent: 'text-accent-600 bg-accent-50',
  };
  return (
    <Card className="text-center py-4">
      <p className={cn('text-2xl font-bold rounded-lg inline-block px-3', colors[variant])}>{value}</p>
      <p className="text-xs text-slate-500 mt-2">{label} (30d)</p>
    </Card>
  );
}

function DocumentRow({ label, submitted }) {
  return (
    <li className="flex items-center justify-between gap-3 py-1">
      <div className="flex items-center gap-2.5 min-w-0">
        {submitted ? (
          <FileCheck2 size={18} className="text-success-600 shrink-0" />
        ) : (
          <FileClock size={18} className="text-warning-600 shrink-0" />
        )}
        <span className="text-sm text-slate-700 truncate">{label}</span>
      </div>
      <Badge variant={submitted ? 'success' : 'warning'}>{submitted ? 'Submitted' : 'Pending'}</Badge>
    </li>
  );
}
