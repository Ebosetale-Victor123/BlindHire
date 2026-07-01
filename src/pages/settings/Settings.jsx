import { useMemo, useState } from 'react';
import {
  Plus, Pencil, Trash2, Building2, UserCheck, Star, MessageSquare,
  TicketCheck, Filter, CheckCircle2, Clock, XCircle, AlertCircle,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import PageHeader from '../../components/shared/PageHeader';
import { useApp } from '../../context/AppContext';
import { sendQueryResponseNotification } from '../../lib/emailjs';
import { formatCurrency, formatDate } from '../../lib/utils';

const EMPTY_FORM = { name: '', head_of_department: '' };

const FEEDBACK_CATEGORIES = ['Work Environment', 'Management', 'Pay & Benefits', 'Career Growth', 'Team Culture', 'Other'];

const TICKET_STATUS_VARIANTS = {
  open: 'default',
  in_review: 'warning',
  resolved: 'success',
  rejected: 'danger',
};

export default function Settings() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Manage company configuration" />
      <DepartmentsSection />
      <FeedbackSection />
      <QueryInboxSection />
    </div>
  );
}

// ============================================================
// Section 1 — Departments
// ============================================================
function DepartmentsSection() {
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setErrors({}); setShowModal(true); };
  const openEdit = (dept) => { setEditing(dept); setForm({ name: dept.name, head_of_department: dept.head_of_department || '' }); setErrors({}); setShowModal(true); };
  const handleChange = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setErrors((err) => ({ ...err, [key]: undefined })); };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) {
      errs.name = 'Department name is required';
    } else if (departments.some((d) => d.name.toLowerCase() === form.name.trim().toLowerCase() && d.id !== editing?.id)) {
      errs.name = 'A department with this name already exists';
    }
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const payload = { name: form.name.trim(), head_of_department: form.head_of_department.trim() || null };
    if (editing) { await updateDepartment(editing.id, payload); } else { await addDepartment(payload); }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteDepartment(confirmDelete.id);
    setConfirmDelete(null);
  };

  return (
    <>
      <Card>
        <CardHeader
          title="Manage Departments"
          subtitle={`${departments.length} department${departments.length !== 1 ? 's' : ''} configured`}
          action={<Button variant="primary" size="sm" onClick={openAdd}><Plus size={14} /> Add Department</Button>}
        />
        {departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Building2 size={32} className="mb-2 opacity-30" />
            <p className="text-sm">No departments yet. Click "Add Department" to create one.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {departments.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between gap-4 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <Building2 size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{dept.name}</p>
                    {dept.head_of_department ? (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><UserCheck size={11} /> {dept.head_of_department}</p>
                    ) : (
                      <p className="text-xs text-slate-300 mt-0.5 italic">No head assigned</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(dept)} title="Edit department"><Pencil size={14} /></Button>
                  <Button variant="ghost" size="sm" className="text-danger-600 hover:bg-danger-50 hover:text-danger-700" onClick={() => setConfirmDelete(dept)} title="Delete department"><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? `Edit "${editing.name}"` : 'Add Department'} size="sm"
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="primary" onClick={handleSave} loading={saving}>{editing ? 'Save Changes' : 'Add Department'}</Button></>}
      >
        <div className="space-y-4">
          <Input label="Department Name" value={form.name} onChange={handleChange('name')} error={errors.name} placeholder="e.g. Product" />
          <Input label="Head of Department" value={form.head_of_department} onChange={handleChange('head_of_department')} placeholder="e.g. Adeyemi Oluwaseun" hint="Leave blank if not yet assigned" />
        </div>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Remove Department" size="sm"
        footer={<><Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete}>Remove Department</Button></>}
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to remove <strong className="text-slate-800">{confirmDelete?.name}</strong>?
          Employees currently in this department will keep their department label.
        </p>
      </Modal>
    </>
  );
}

// ============================================================
// Section 2 — Employee Feedback (anonymous)
// ============================================================
function StarDisplay({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={13} className={s <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'} />
      ))}
    </div>
  );
}

function FeedbackSection() {
  const { feedback } = useApp();
  const [catFilter, setCatFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');

  const filtered = useMemo(() => {
    let list = [...feedback].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (catFilter !== 'All') list = list.filter((f) => f.category === catFilter);
    if (ratingFilter !== 'All') list = list.filter((f) => f.rating === Number(ratingFilter));
    return list;
  }, [feedback, catFilter, ratingFilter]);

  const avgRating = useMemo(() => {
    if (!feedback.length) return 0;
    return (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1);
  }, [feedback]);

  const mostCommon = useMemo(() => {
    if (!feedback.length) return '—';
    const counts = {};
    feedback.forEach((f) => { counts[f.category] = (counts[f.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  }, [feedback]);

  return (
    <Card>
      <CardHeader
        title={<span className="flex items-center gap-2"><MessageSquare size={16} className="text-accent" /> Employee Feedback</span>}
        subtitle="Anonymous responses submitted through the Employee Portal"
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Total Responses</p>
          <p className="text-2xl font-bold text-slate-800">{feedback.length}</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Avg Rating</p>
          <p className="text-2xl font-bold text-amber-500">{avgRating}/5</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
          <p className="text-xs text-slate-500 mb-1">Most Common Topic</p>
          <p className="text-sm font-semibold text-slate-700 mt-1">{mostCommon}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Filter size={14} className="text-slate-400" />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="All">All Categories</option>
          {FEEDBACK_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        >
          <option value="All">All Ratings</option>
          {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>)}
        </select>
        {(catFilter !== 'All' || ratingFilter !== 'All') && (
          <button onClick={() => { setCatFilter('All'); setRatingFilter('All'); }} className="text-xs text-primary hover:underline">
            Clear filters
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400">
          <MessageSquare size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No feedback yet{catFilter !== 'All' || ratingFilter !== 'All' ? ' matching these filters' : ''}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((f) => (
            <div key={f.id} className="rounded-xl border border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="primary">{f.category}</Badge>
                  <StarDisplay rating={f.rating} />
                </div>
                <span className="text-xs text-slate-400 shrink-0">{formatDate(f.created_at)}</span>
              </div>
              {f.message && <p className="text-sm text-slate-600 leading-relaxed">{f.message}</p>}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ============================================================
// Section 3 — Query Inbox (Queries & Claims)
// ============================================================
function QueryInboxSection() {
  const { queries, employees, updateQuery } = useApp();
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [responding, setResponding] = useState(null); // ticket being responded to
  const [hrResponse, setHrResponse] = useState('');
  const [newStatus, setNewStatus] = useState('open');
  const [saving, setSaving] = useState(false);

  const empMap = useMemo(() => {
    const m = {};
    employees.forEach((e) => { m[e.id] = e; });
    return m;
  }, [employees]);

  const filtered = useMemo(() => {
    let list = [...queries].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (typeFilter !== 'All') list = list.filter((q) => q.type === typeFilter);
    if (statusFilter !== 'All') list = list.filter((q) => q.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => {
        const emp = empMap[t.employee_id];
        const name = emp ? `${emp.first_name} ${emp.last_name}`.toLowerCase() : '';
        return name.includes(q) || t.subject.toLowerCase().includes(q) || t.ticket_number.toLowerCase().includes(q);
      });
    }
    return list;
  }, [queries, typeFilter, statusFilter, search, empMap]);

  // Stats
  const openCount = queries.filter((q) => q.status === 'open').length;
  const inReviewCount = queries.filter((q) => q.status === 'in_review').length;
  const resolvedCount = queries.filter((q) => q.status === 'resolved').length;
  const pendingClaimsTotal = queries
    .filter((q) => q.type === 'claim' && q.status !== 'resolved' && q.status !== 'rejected' && q.amount)
    .reduce((s, q) => s + Number(q.amount), 0);

  // Analytics
  const avgResolutionDays = useMemo(() => {
    const resolved = queries.filter((q) => q.resolved_at && q.created_at);
    if (!resolved.length) return null;
    const total = resolved.reduce((s, q) => {
      return s + (new Date(q.resolved_at) - new Date(q.created_at)) / (1000 * 60 * 60 * 24);
    }, 0);
    return (total / resolved.length).toFixed(1);
  }, [queries]);

  const mostCommonCategory = useMemo(() => {
    if (!queries.length) return '—';
    const counts = {};
    queries.forEach((q) => { counts[q.category] = (counts[q.category] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
  }, [queries]);

  const openModal = (ticket) => {
    setResponding(ticket);
    setHrResponse(ticket.hr_response || '');
    setNewStatus(ticket.status);
  };

  const handleSave = async () => {
    if (!responding) return;
    setSaving(true);
    const updates = {
      status: newStatus,
      hr_response: hrResponse.trim() || null,
      resolved_at: newStatus === 'resolved' ? new Date().toISOString() : (responding.resolved_at || null),
    };
    await updateQuery(responding.id, updates);

    // Send email notification if employee has a personal_email
    const emp = empMap[responding.employee_id];
    if (emp?.personal_email && hrResponse.trim()) {
      await sendQueryResponseNotification({
        employee_name: `${emp.first_name} ${emp.last_name}`,
        employee_email: emp.personal_email,
        ticket_number: responding.ticket_number,
        ticket_type: responding.type,
        status: newStatus,
        hr_response: hrResponse.trim(),
      });
    }

    setSaving(false);
    setResponding(null);
  };

  return (
    <>
      <Card>
        <CardHeader
          title={<span className="flex items-center gap-2"><TicketCheck size={16} className="text-primary" /> Query Inbox</span>}
          subtitle="Employee queries and expense claims requiring HR attention"
        />

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <StatChip label="Open" value={openCount} color="text-danger-600 bg-danger-50 border-danger-100" />
          <StatChip label="In Review" value={inReviewCount} color="text-warning-700 bg-warning-50 border-warning-100" />
          <StatChip label="Resolved" value={resolvedCount} color="text-success-700 bg-success-50 border-success-100" />
          <StatChip label="Pending Claims" value={formatCurrency(pendingClaimsTotal)} color="text-primary bg-primary-50 border-primary-100" />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="All">All Types</option>
            <option value="query">Queries</option>
            <option value="claim">Claims</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="All">All Statuses</option>
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee, ticket..."
            className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary w-48"
          />
          {(typeFilter !== 'All' || statusFilter !== 'All' || search) && (
            <button onClick={() => { setTypeFilter('All'); setStatusFilter('All'); setSearch(''); }} className="text-xs text-primary hover:underline">
              Clear filters
            </button>
          )}
        </div>

        {/* Table */}
        <Table
          columns={[
            {
              key: 'ticket_number',
              header: 'Ticket',
              render: (r) => (
                <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {r.ticket_number}
                </span>
              ),
            },
            {
              key: 'employee_id',
              header: 'Employee',
              render: (r) => {
                const emp = empMap[r.employee_id];
                return emp ? (
                  <div>
                    <p className="text-sm font-medium text-slate-700">{emp.first_name} {emp.last_name}</p>
                    <p className="text-xs text-slate-400">{emp.department}</p>
                  </div>
                ) : <span className="text-slate-400 text-xs">Unknown</span>;
              },
            },
            {
              key: 'type',
              header: 'Type',
              render: (r) => <Badge variant={r.type === 'claim' ? 'success' : 'primary'} className="capitalize">{r.type}</Badge>,
            },
            { key: 'category', header: 'Category', render: (r) => <span className="text-sm text-slate-600">{r.category}</span> },
            {
              key: 'subject',
              header: 'Subject',
              render: (r) => <span className="text-sm text-slate-700 max-w-xs truncate block">{r.subject}</span>,
            },
            {
              key: 'amount',
              header: 'Amount',
              render: (r) => r.amount ? <span className="text-sm font-semibold text-success-700">{formatCurrency(r.amount)}</span> : <span className="text-slate-300">—</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (r) => (
                <Badge variant={TICKET_STATUS_VARIANTS[r.status] || 'default'} dot className="capitalize">
                  {r.status.replace('_', ' ')}
                </Badge>
              ),
            },
            { key: 'created_at', header: 'Date', render: (r) => <span className="text-xs text-slate-400">{formatDate(r.created_at)}</span> },
            {
              key: 'actions',
              header: 'Actions',
              render: (r) => (
                <Button size="sm" variant="outline" onClick={() => openModal(r)}>
                  View &amp; Respond
                </Button>
              ),
            },
          ]}
          data={filtered}
          emptyMessage="No tickets found matching your filters"
        />

        {/* Analytics */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <AnalyticChip label="Avg Resolution Time" value={avgResolutionDays !== null ? `${avgResolutionDays} days` : '—'} />
          <AnalyticChip label="Most Common Category" value={mostCommonCategory} />
          <AnalyticChip
            label="Claims Approved This Month"
            value={formatCurrency(queries.filter((q) => {
              if (q.type !== 'claim' || q.status !== 'resolved' || !q.resolved_at || !q.amount) return false;
              const d = new Date(q.resolved_at);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).reduce((s, q) => s + Number(q.amount), 0))}
          />
          <AnalyticChip label="Total Claims Pending" value={formatCurrency(pendingClaimsTotal)} />
        </div>
      </Card>

      {/* Respond Modal */}
      <Modal
        open={!!responding}
        onClose={() => setResponding(null)}
        title={`Ticket ${responding?.ticket_number}`}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResponding(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>Save Response</Button>
          </>
        }
      >
        {responding && (() => {
          const emp = empMap[responding.employee_id];
          return (
            <div className="space-y-4">
              {/* Employee info */}
              {emp && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                    {emp.first_name[0]}{emp.last_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{emp.first_name} {emp.last_name}</p>
                    <p className="text-xs text-slate-500">{emp.role} · {emp.department}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-2">
                    <Badge variant={responding.type === 'claim' ? 'success' : 'primary'} className="capitalize">{responding.type}</Badge>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">{responding.ticket_number}</span>
                  </div>
                </div>
              )}

              {/* Ticket details */}
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{responding.category}</p>
                <p className="text-sm font-semibold text-slate-800 mb-2">{responding.subject}</p>
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed">{responding.message}</p>
              </div>

              {responding.type === 'claim' && responding.amount && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">Claimed Amount:</span>
                  <span className="text-sm font-bold text-success-700">{formatCurrency(responding.amount)}</span>
                  {responding.receipt_note && <span className="text-xs text-slate-400">· {responding.receipt_note}</span>}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Update Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="open">Open</option>
                    <option value="in_review">In Review</option>
                    <option value="resolved">Resolved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <p className="text-xs text-slate-400">
                    {emp?.personal_email
                      ? `Email notification will be sent to ${emp.personal_email}`
                      : 'No personal email on file — no notification will be sent'}
                  </p>
                </div>
              </div>

              <Textarea
                label="HR Response (optional)"
                rows={3}
                value={hrResponse}
                onChange={(e) => setHrResponse(e.target.value)}
                placeholder="Write a response to the employee..."
              />
            </div>
          );
        })()}
      </Modal>
    </>
  );
}

function StatChip({ label, value, color }) {
  return (
    <div className={`rounded-xl border p-3 text-center ${color}`}>
      <p className="text-xs opacity-70 mb-1">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function AnalyticChip({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}
