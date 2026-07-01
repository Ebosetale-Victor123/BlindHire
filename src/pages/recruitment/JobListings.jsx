import { useEffect, useMemo, useState } from 'react';
import { differenceInDays } from 'date-fns';
import { Plus, Briefcase, Users, Clock, ArrowRight } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select, Textarea } from '../../components/ui/Input';
import { useApp } from '../../context/AppContext';
import { titleCase } from '../../lib/utils';

const EMPTY_JOB = {
  title: '',
  department: 'Engineering',
  type: 'full-time',
  description: '',
  requirements: '',
};

export default function JobListings({ onViewApplications, autoOpenPost }) {
  const { jobs, applications, addJob, departments } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_JOB);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (autoOpenPost) setShowModal(true);
  }, [autoOpenPost]);

  const applicantCounts = useMemo(() => {
    const counts = {};
    applications.forEach((a) => {
      counts[a.job_id] = (counts[a.job_id] || 0) + 1;
    });
    return counts;
  }, [applications]);

  const handleChange = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((err) => ({ ...err, [key]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Job title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
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
      await addJob({ ...form, status: 'open' });
      setForm(EMPTY_JOB);
      setShowModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  const openJobs = jobs.filter((j) => j.status === 'open');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{openJobs.length} open positions</p>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={16} /> Post New Job
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {openJobs.map((job) => {
          const daysOpen = Math.max(0, differenceInDays(new Date(), new Date(job.created_at)));
          return (
            <Card key={job.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="p-2.5 rounded-xl bg-primary-50 text-primary-600">
                  <Briefcase size={20} />
                </div>
                <Badge variant="success" dot>Open</Badge>
              </div>
              <h3 className="font-semibold text-slate-800 leading-snug">{job.title}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{job.department} · {titleCase(job.type)}</p>
              {job.salary_range && (
                <p className="text-xs font-semibold text-primary-600 mt-1.5">{job.salary_range}</p>
              )}
              <p className="text-sm text-slate-600 mt-3 line-clamp-3 flex-1">{job.description}</p>

              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Users size={14} /> {applicantCounts[job.id] || 0} applicants
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> {daysOpen === 0 ? 'Posted today' : `${daysOpen} days open`}
                </span>
              </div>

              <Button
                variant="secondary"
                className="mt-4 w-full"
                onClick={() => onViewApplications?.(job.id)}
              >
                View Applications <ArrowRight size={14} />
              </Button>
            </Card>
          );
        })}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Post New Job" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Job Title" value={form.title} onChange={handleChange('title')} error={errors.title} placeholder="e.g. Senior Backend Engineer" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Department" value={form.department} onChange={handleChange('department')}>
              {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
            </Select>
            <Select label="Employment Type" value={form.type} onChange={handleChange('type')}>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
            </Select>
          </div>
          <Textarea label="Description" rows={3} value={form.description} onChange={handleChange('description')} error={errors.description} placeholder="Brief overview of the role..." />
          <Textarea label="Requirements" rows={4} value={form.requirements} onChange={handleChange('requirements')} placeholder="- 3+ years experience...&#10;- Strong communication skills..." />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" loading={submitting}>Post Job</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
