import { Fragment, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, addDays } from 'date-fns';
import confetti from 'canvas-confetti';
import { Check, ChevronLeft, ChevronRight, PartyPopper, UserPlus, ClipboardList } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import PageHeader from '../../components/shared/PageHeader';
import BankAccountFields from '../../components/shared/BankAccountFields';
import { useApp } from '../../context/AppContext';
import { DEPARTMENTS, EMPLOYMENT_TYPES, GENDERS, NIGERIAN_BANKS, ONBOARDING_TEMPLATE } from '../../data/sampleData';
import { cn, formatCurrency, formatDate, generateEmployeeId } from '../../lib/utils';

const STEPS = ['Personal Info', 'Job Info', 'Bank & Next of Kin', 'Review & Submit'];

const EMPTY_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  personal_email: '',
  phone: '',
  date_of_birth: '',
  gender: GENDERS[0],
  department: DEPARTMENTS[0],
  role: '',
  employment_type: 'full-time',
  salary: '',
  hire_date: format(new Date(), 'yyyy-MM-dd'),
  bank_name: NIGERIAN_BANKS[0],
  account_number: '',
  next_of_kin: '',
};

export default function EmployeeRegistration() {
  const navigate = useNavigate();
  const { addEmployee, addOnboardingTasks } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
  };

  const validateStep = (s) => {
    const errs = {};
    if (s === 0) {
      if (!form.first_name.trim()) errs.first_name = 'First name is required';
      if (!form.last_name.trim()) errs.last_name = 'Last name is required';
      if (!form.email.trim()) errs.email = 'Email is required';
      else if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email';
      if (!form.personal_email.trim()) errs.personal_email = 'Personal email is required';
      else if (!/^\S+@\S+\.\S+$/.test(form.personal_email)) errs.personal_email = 'Enter a valid email';
    }
    if (s === 1) {
      if (!form.role.trim()) errs.role = 'Role is required';
      if (!form.salary || Number(form.salary) <= 0) errs.salary = 'Enter a valid salary';
      if (!form.hire_date) errs.hire_date = 'Hire date is required';
    }
    if (s === 2) {
      if (!/^\d{10}$/.test(form.account_number)) errs.account_number = 'Enter a valid 10-digit account number';
      if (!form.next_of_kin.trim()) errs.next_of_kin = 'Next of kin is required';
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const employee_id = generateEmployeeId();
      const newEmployee = await addEmployee({
        ...form,
        salary: Number(form.salary),
        employee_id,
        status: 'probation',
        avatar_url: null,
        created_at: new Date().toISOString(),
      });

      const tasks = ONBOARDING_TEMPLATE.map((t, i) => ({
        employee_id: newEmployee.id,
        task: t.task,
        category: t.category,
        completed: false,
        due_date: format(addDays(new Date(), Math.floor(i / 4) + 1), 'yyyy-MM-dd'),
        created_at: new Date().toISOString(),
      }));
      await addOnboardingTasks(tasks);

      setResult({ employee_id });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setStep(0);
    setResult(null);
  };

  useEffect(() => {
    if (!result) return;
    const colors = ['#2563EB', '#7C3AED', '#16A34A', '#D97706'];
    const end = Date.now() + 1200;
    (function frame() {
      confetti({ particleCount: 4, angle: 60, spread: 60, startVelocity: 45, origin: { x: 0, y: 0.6 }, colors });
      confetti({ particleCount: 4, angle: 120, spread: 60, startVelocity: 45, origin: { x: 1, y: 0.6 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.4 }, colors });
  }, [result]);

  if (result) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <Card className="text-center py-12">
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12 }}
            className="inline-flex p-4 rounded-full bg-success-50 text-success-600 mb-4"
          >
            <PartyPopper size={36} />
          </motion.div>
          <h2 className="text-xl font-bold text-slate-800">Welcome aboard, {form.first_name}!</h2>
          <p className="text-slate-500 mt-2">{form.first_name} {form.last_name} has been successfully registered.</p>

          <div className="mt-6 inline-flex flex-col items-center gap-1 px-6 py-4 rounded-xl bg-slate-50 border border-slate-100">
            <span className="text-xs text-slate-400 uppercase tracking-wide">Employee ID</span>
            <span className="text-2xl font-mono font-bold text-primary">{result.employee_id}</span>
          </div>

          <p className="flex items-center justify-center gap-2 text-sm text-slate-400 mt-4">
            <ClipboardList size={14} /> A {ONBOARDING_TEMPLATE.length}-task onboarding checklist has been created
          </p>

          <div className="flex items-center justify-center gap-3 mt-8">
            <Button variant="secondary" onClick={handleReset}>
              <UserPlus size={16} /> Register Another
            </Button>
            <Button onClick={() => navigate('/onboarding')}>View Onboarding</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Employee Registration" subtitle="Add a new hire to BlindHire in four simple steps" />

      {/* Progress indicator */}
      <div className="flex items-start">
        {STEPS.map((label, i) => (
          <Fragment key={label}>
            <div className="flex flex-col items-center gap-2 shrink-0 w-20 sm:w-28">
              <div
                className={cn(
                  'w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                  i < step
                    ? 'bg-success border-success text-white'
                    : i === step
                    ? 'border-primary text-primary bg-primary-50'
                    : 'border-slate-200 text-slate-400'
                )}
              >
                {i < step ? <Check size={16} /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium text-center', i === step ? 'text-primary' : 'text-slate-400')}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('flex-1 h-0.5 mt-[18px] mx-1 sm:mx-2', i < step ? 'bg-success' : 'bg-slate-200')} />
            )}
          </Fragment>
        ))}
      </div>

      <Card>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <div className="space-y-4">
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
                  placeholder="yourname@gmail.com"
                  hint="Used for portal access and HR notifications"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={handleChange('date_of_birth')} error={errors.date_of_birth} />
                  <Select label="Gender" value={form.gender} onChange={handleChange('gender')}>
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </Select>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
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
                  <Input label="Monthly Salary (₦)" type="number" min="0" value={form.salary} onChange={handleChange('salary')} error={errors.salary} placeholder="500000" />
                  <Input label="Hire Date" type="date" value={form.hire_date} onChange={handleChange('hire_date')} error={errors.hire_date} />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <BankAccountFields
                  bankName={form.bank_name}
                  accountNumber={form.account_number}
                  onBankChange={(val) => { setForm((f) => ({ ...f, bank_name: val })); setErrors((e) => ({ ...e, bank_name: undefined })); }}
                  onAccountChange={(val) => { setForm((f) => ({ ...f, account_number: val })); setErrors((e) => ({ ...e, account_number: undefined })); }}
                  bankError={errors.bank_name}
                  accountError={errors.account_number}
                />
                <Input label="Next of Kin" value={form.next_of_kin} onChange={handleChange('next_of_kin')} error={errors.next_of_kin} placeholder="Name (Relationship)" />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <ReviewSection
                  title="Personal Info"
                  items={[
                    ['Full Name', `${form.first_name} ${form.last_name}`],
                    ['Email', form.email],
                    ['Personal Email', form.personal_email],
                    ['Phone', form.phone || '—'],
                    ['Date of Birth', form.date_of_birth ? formatDate(form.date_of_birth) : '—'],
                    ['Gender', form.gender],
                  ]}
                />
                <ReviewSection
                  title="Job Info"
                  items={[
                    ['Department', form.department],
                    ['Role', form.role],
                    ['Employment Type', form.employment_type],
                    ['Monthly Salary', formatCurrency(form.salary)],
                    ['Hire Date', formatDate(form.hire_date)],
                  ]}
                />
                <ReviewSection
                  title="Bank & Next of Kin"
                  items={[
                    ['Bank', form.bank_name],
                    ['Account Number', form.account_number],
                    ['Next of Kin', form.next_of_kin],
                  ]}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between pt-6 mt-6 border-t border-slate-100">
          <Button variant="secondary" onClick={handleBack} disabled={step === 0}>
            <ChevronLeft size={16} /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={handleNext}>Next <ChevronRight size={16} /></Button>
          ) : (
            <Button onClick={handleSubmit} loading={submitting}>
              <Check size={16} /> Submit Registration
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function ReviewSection({ title, items }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-700 mb-2">{title}</h4>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 rounded-lg p-4">
        {items.map(([label, value]) => (
          <div key={label} className="flex justify-between sm:block">
            <dt className="text-xs text-slate-400">{label}</dt>
            <dd className="text-sm font-medium text-slate-700">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
