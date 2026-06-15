import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Pencil, UserX, UserCheck2, Filter, Trash2 } from 'lucide-react';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast, { useToast } from '../../components/ui/Toast';
import { Select } from '../../components/ui/Input';
import PageHeader from '../../components/shared/PageHeader';
import RemoveEmployeeModal from '../../components/shared/RemoveEmployeeModal';
import { SkeletonRow } from '../../components/ui/Skeleton';
import EmployeeForm from './EmployeeForm';
import { useEmployees } from '../../hooks/useEmployees';
import { DEPARTMENTS, EMPLOYMENT_TYPES, EMPLOYEE_STATUSES } from '../../data/sampleData';
import { cn, formatCurrency, getInitials, avatarColor, STATUS_VARIANTS, titleCase } from '../../lib/utils';

export default function EmployeeList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { employees, addEmployee, updateEmployee, deleteEmployee, loading } = useEmployees();
  const { toast, showToast, hideToast } = useToast();

  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('all');
  const [status, setStatus] = useState('all');
  const [employmentType, setEmploymentType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [removingEmployee, setRemovingEmployee] = useState(null);

  useEffect(() => {
    if (location.state?.toast) {
      showToast(location.state.toast, 'success');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      const matchesSearch =
        !q ||
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
        e.employee_id.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q);
      const matchesDept = department === 'all' || e.department === department;
      const matchesStatus = status === 'all' || e.status === status;
      const matchesType = employmentType === 'all' || e.employment_type === employmentType;
      return matchesSearch && matchesDept && matchesStatus && matchesType;
    });
  }, [employees, search, department, status, employmentType]);

  const handleAddEmployee = async (data) => {
    const employee_id = `BH-${new Date().getFullYear()}-${String(1000 + employees.length + 1)}`;
    await addEmployee({ ...data, employee_id, avatar_url: null });
    setShowAddModal(false);
  };

  const handleEditEmployee = async (data) => {
    await updateEmployee(editingEmployee.id, data);
    setEditingEmployee(null);
  };

  const toggleStatus = (employee) => {
    const next = employee.status === 'inactive' ? 'active' : 'inactive';
    updateEmployee(employee.id, { status: next });
  };

  const handleRemoveConfirm = async (reason) => {
    await deleteEmployee(removingEmployee.id);
    setRemovingEmployee(null);
    showToast('Employee removed from system', 'success');
  };

  const columns = [
    {
      key: 'name',
      header: 'Employee',
      render: (e) => (
        <div className="flex items-center gap-3 min-w-[180px]">
          <span className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', avatarColor(e.first_name + e.last_name))}>
            {getInitials(e.first_name, e.last_name)}
          </span>
          <div className="min-w-0">
            <p className="font-medium text-slate-800 truncate">{e.first_name} {e.last_name}</p>
            <p className="text-xs text-slate-500 truncate">{e.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'employee_id', header: 'Employee ID', render: (e) => <span className="font-mono text-xs text-slate-600">{e.employee_id}</span> },
    { key: 'role', header: 'Role', render: (e) => <span className="text-slate-700">{e.role}</span> },
    { key: 'department', header: 'Department', render: (e) => <Badge variant="default">{e.department}</Badge> },
    { key: 'employment_type', header: 'Type', render: (e) => <span className="capitalize text-slate-600">{e.employment_type.replace('-', ' ')}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (e) => <Badge variant={STATUS_VARIANTS[e.status] || 'default'} dot>{titleCase(e.status)}</Badge>,
    },
    { key: 'salary', header: 'Salary', render: (e) => <span className="text-slate-700">{formatCurrency(e.salary)}</span> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (e) => (
        <div className="flex items-center justify-end gap-1" onClick={(ev) => ev.stopPropagation()}>
          <button
            onClick={() => setEditingEmployee(e)}
            className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary-50 transition-colors"
            title="Edit"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => toggleStatus(e)}
            className={cn(
              'p-2 rounded-lg transition-colors',
              e.status === 'inactive'
                ? 'text-slate-400 hover:text-success-600 hover:bg-success-50'
                : 'text-slate-400 hover:text-danger-600 hover:bg-danger-50'
            )}
            title={e.status === 'inactive' ? 'Activate' : 'Deactivate'}
          >
            {e.status === 'inactive' ? <UserCheck2 size={16} /> : <UserX size={16} />}
          </button>
          <button
            onClick={() => setRemovingEmployee(e)}
            className="p-2 rounded-lg text-slate-400 hover:text-danger-600 hover:bg-danger-50 transition-colors"
            title="Remove Employee"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} total employees across ${DEPARTMENTS.length} departments`}
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Employee
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col lg:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, ID, role or email..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400 hidden sm:block" />
              <Select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-40">
                <option value="all">All Departments</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </div>
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-36">
              <option value="all">All Statuses</option>
              {EMPLOYEE_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{titleCase(s)}</option>)}
            </Select>
            <Select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="w-36">
              <option value="all">All Types</option>
              {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{titleCase(t)}</option>)}
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-slate-50">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : (
          <Table
            columns={columns}
            data={filtered}
            onRowClick={(e) => navigate(`/employees/${e.id}`)}
            emptyMessage="No employees match your filters"
          />
        )}
      </Card>

      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Employee" size="lg">
        <EmployeeForm onSubmit={handleAddEmployee} onCancel={() => setShowAddModal(false)} submitLabel="Add Employee" />
      </Modal>

      <Modal open={!!editingEmployee} onClose={() => setEditingEmployee(null)} title="Edit Employee" size="lg">
        {editingEmployee && (
          <EmployeeForm
            initialValues={editingEmployee}
            onSubmit={handleEditEmployee}
            onCancel={() => setEditingEmployee(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      <RemoveEmployeeModal
        open={!!removingEmployee}
        employee={removingEmployee}
        onClose={() => setRemovingEmployee(null)}
        onConfirm={handleRemoveConfirm}
      />

      <Toast message={toast?.message} variant={toast?.variant} onClose={hideToast} />
    </div>
  );
}
