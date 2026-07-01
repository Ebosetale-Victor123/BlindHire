import { useState } from 'react';
import { Plus, Pencil, Trash2, Building2, UserCheck } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import PageHeader from '../../components/shared/PageHeader';
import { useApp } from '../../context/AppContext';

const EMPTY_FORM = { name: '', head_of_department: '' };

export default function Settings() {
  const { departments, addDepartment, updateDepartment, deleteDepartment } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({ name: dept.name, head_of_department: dept.head_of_department || '' });
    setErrors({});
    setShowModal(true);
  };

  const handleChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) {
      errs.name = 'Department name is required';
    } else if (
      departments.some(
        (d) => d.name.toLowerCase() === form.name.trim().toLowerCase() && d.id !== editing?.id
      )
    ) {
      errs.name = 'A department with this name already exists';
    }
    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      head_of_department: form.head_of_department.trim() || null,
    };
    if (editing) {
      await updateDepartment(editing.id, payload);
    } else {
      await addDepartment(payload);
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteDepartment(confirmDelete.id);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage company configuration"
      />

      <Card>
        <CardHeader
          title="Manage Departments"
          subtitle={`${departments.length} department${departments.length !== 1 ? 's' : ''} configured`}
          action={
            <Button variant="primary" size="sm" onClick={openAdd}>
              <Plus size={14} /> Add Department
            </Button>
          }
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
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <UserCheck size={11} /> {dept.head_of_department}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-300 mt-0.5 italic">No head assigned</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(dept)} title="Edit department">
                    <Pencil size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger-600 hover:bg-danger-50 hover:text-danger-700"
                    onClick={() => setConfirmDelete(dept)}
                    title="Delete department"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add / Edit modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? `Edit "${editing.name}"` : 'Add Department'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editing ? 'Save Changes' : 'Add Department'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Department Name"
            value={form.name}
            onChange={handleChange('name')}
            error={errors.name}
            placeholder="e.g. Product"
          />
          <Input
            label="Head of Department"
            value={form.head_of_department}
            onChange={handleChange('head_of_department')}
            placeholder="e.g. Adeyemi Oluwaseun"
            hint="Leave blank if not yet assigned"
          />
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Remove Department"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Remove Department</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Are you sure you want to remove <strong className="text-slate-800">{confirmDelete?.name}</strong>?
          Employees currently in this department will keep their department label — you can reassign
          them individually from the Employees page.
        </p>
      </Modal>
    </div>
  );
}
