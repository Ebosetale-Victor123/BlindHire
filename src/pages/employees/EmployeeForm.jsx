import { useState } from 'react';
import { Input, Select } from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import BankAccountFields from '../../components/shared/BankAccountFields';
import { DEPARTMENTS, EMPLOYMENT_TYPES, EMPLOYEE_STATUSES, NIGERIAN_BANKS } from '../../data/sampleData';

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  personal_email: '',
  phone: '',
  department: DEPARTMENTS[0],
  role: '',
  employment_type: 'full-time',
  status: 'active',
  salary: '',
  hire_date: '',
  bank_name: NIGERIAN_BANKS[0],
  account_number: '',
  next_of_kin: '',
};

export default function EmployeeForm({ initialValues, onSubmit, onCancel, submitLabel = 'Save Employee' }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initialValues });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
    if (form.personal_email && !/^\S+@\S+\.\S+$/.test(form.personal_email)) errs.personal_email = 'Enter a valid email';
    if (!form.role.trim()) errs.role = 'Role is required';
    if (!form.salary || Number(form.salary) <= 0) errs.salary = 'Enter a valid salary';
    if (!form.hire_date) errs.hire_date = 'Hire date is required';
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
    try {
      await onSubmit({ ...form, salary: Number(form.salary) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="First Name" value={form.first_name} onChange={handleChange('first_name')} error={errors.first_name} placeholder="e.g. Adeyemi" />
        <Input label="Last Name" value={form.last_name} onChange={handleChange('last_name')} error={errors.last_name} placeholder="e.g. Oluwaseun" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Email" type="email" value={form.email} onChange={handleChange('email')} error={errors.email} placeholder="name@blindhire.ng" />
        <Input label="Phone" value={form.phone} onChange={handleChange('phone')} placeholder="+234 800 000 0000" />
      </div>
      <Input
        label="Personal Email (Gmail)"
        type="email"
        value={form.personal_email}
        onChange={handleChange('personal_email')}
        error={errors.personal_email}
        placeholder="employee@gmail.com"
        hint="Used for employee portal access and notifications"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select label="Department" value={form.department} onChange={handleChange('department')}>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
        <Input label="Role / Job Title" value={form.role} onChange={handleChange('role')} error={errors.role} placeholder="e.g. Software Engineer" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select label="Employment Type" value={form.employment_type} onChange={handleChange('employment_type')}>
          {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
        </Select>
        <Select label="Status" value={form.status} onChange={handleChange('status')}>
          {EMPLOYEE_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </Select>
        <Input label="Monthly Salary (₦)" type="number" min="0" value={form.salary} onChange={handleChange('salary')} error={errors.salary} placeholder="500000" />
      </div>
      <Input label="Hire Date" type="date" value={form.hire_date} onChange={handleChange('hire_date')} error={errors.hire_date} />

      <BankAccountFields
        bankName={form.bank_name}
        accountNumber={form.account_number}
        onBankChange={(val) => setForm((f) => ({ ...f, bank_name: val }))}
        onAccountChange={(val) => setForm((f) => ({ ...f, account_number: val }))}
        bankError={errors.bank_name}
        accountError={errors.account_number}
      />
      <Input label="Next of Kin" value={form.next_of_kin} onChange={handleChange('next_of_kin')} placeholder="Name (Relationship)" />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" variant="primary" loading={submitting}>{submitLabel}</Button>
      </div>
    </form>
  );
}
