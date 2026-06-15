import { useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  EyeOff, Eye, X, GraduationCap, Sparkles, ChevronDown, MoreHorizontal,
  FileText, Mail, CheckCircle2, XCircle,
} from 'lucide-react';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Toast, { useToast } from '../../components/ui/Toast';
import { Input, Textarea } from '../../components/ui/Input';
import { useApp } from '../../context/AppContext';
import { sendCandidateDecisionNotification } from '../../lib/emailjs';
import { cn, formatDate, getInitials, avatarColor } from '../../lib/utils';
import { APPLICATION_STAGES } from '../../data/sampleData';

const COLUMNS = [
  { key: 'applied', label: 'Applied' },
  { key: 'screened', label: 'Screening' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
  { key: 'hired', label: 'Hired' },
  { key: 'rejected', label: 'Rejected' },
];

const COLUMN_LABEL = Object.fromEntries(COLUMNS.map((c) => [c.key, c.label]));

const COLUMN_ACCENT = {
  applied: 'border-t-slate-300',
  screened: 'border-t-primary',
  interview: 'border-t-accent',
  offer: 'border-t-warning',
  hired: 'border-t-success',
  rejected: 'border-t-danger',
};

const COLUMN_HEADER_TEXT = {
  applied: 'text-slate-700',
  screened: 'text-primary-600',
  interview: 'text-accent-600',
  offer: 'text-warning-600',
  hired: 'text-success-600',
  rejected: 'text-danger-600',
};

const NEXT_STAGES = {
  applied: ['screened', 'rejected'],
  screened: ['interview', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
  hired: [],
  rejected: ['applied'],
};

const EMAIL_TEMPLATES = {
  interview: (name, role) => ({
    subject: 'Interview Invitation - BlindHire',
    message: `Dear ${name},\n\nWe are pleased to let you know that you have been shortlisted for an interview for the ${role} position. Our team will be in touch shortly to schedule a time that works for you.\n\nBest regards,\nBlindHire Recruitment Team`,
  }),
  offer: (name, role) => ({
    subject: 'Job Offer - BlindHire',
    message: `Dear ${name},\n\nCongratulations! We are delighted to extend an offer for the ${role} position. Please find the details below and let us know if you have any questions.\n\nBest regards,\nBlindHire Recruitment Team`,
  }),
  default: (name, role) => ({
    subject: 'Application Update - BlindHire',
    message: `Dear ${name},\n\nWe wanted to share an update on your application for the ${role} position. Thank you for your continued interest in joining our team.\n\nBest regards,\nBlindHire Recruitment Team`,
  }),
};

export default function ApplicationTracker({ jobFilter, onClearFilter, blindMode, onToggleBlindMode }) {
  const { applications, jobs, updateApplication } = useApp();
  const [viewingCv, setViewingCv] = useState(null);
  const [emailingApplication, setEmailingApplication] = useState(null);
  const { toast, showToast, hideToast } = useToast();

  const anonMap = useMemo(() => {
    const sorted = [...applications].sort((a, b) => (a.created_at < b.created_at ? -1 : 1));
    const map = {};
    sorted.forEach((a, i) => {
      map[a.id] = i + 1;
    });
    return map;
  }, [applications]);

  const filteredApplications = useMemo(() => {
    if (!jobFilter) return applications;
    return applications.filter((a) => a.job_id === jobFilter);
  }, [applications, jobFilter]);

  const filteredJob = jobs.find((j) => j.id === jobFilter);

  const columns = useMemo(() => {
    const grouped = {};
    APPLICATION_STAGES.forEach((s) => (grouped[s] = []));
    filteredApplications.forEach((a) => {
      (grouped[a.stage] || grouped.applied).push(a);
    });
    return grouped;
  }, [filteredApplications]);

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const newStage = destination.droppableId;
    updateApplication(draggableId, { stage: newStage });
    showToast(`Candidate moved to ${COLUMN_LABEL[newStage]}`, 'success');
  };

  const handleMoveStage = (id, newStage) => {
    updateApplication(id, { stage: newStage });
    showToast(`Candidate moved to ${COLUMN_LABEL[newStage]}`, 'success');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {filteredJob && (
            <Badge variant="primary" className="gap-2">
              Filtered: {filteredJob.title}
              <button onClick={onClearFilter} className="hover:text-primary-900">
                <X size={12} />
              </button>
            </Badge>
          )}
          <p className="text-sm text-slate-500">{filteredApplications.length} candidates</p>
        </div>

        <button
          onClick={onToggleBlindMode}
          className={cn(
            'flex items-center gap-2.5 px-4 py-2 rounded-lg text-sm font-medium border transition-colors',
            blindMode
              ? 'bg-accent text-white border-accent shadow-sm'
              : 'bg-white text-slate-600 border-slate-200 hover:border-accent/50'
          )}
        >
          {blindMode ? <EyeOff size={16} /> : <Eye size={16} />}
          Blind Mode: {blindMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {COLUMNS.map((col) => (
            <div key={col.key} className="min-w-0">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className={cn('text-sm font-semibold', COLUMN_HEADER_TEXT[col.key])}>
                  {col.label}
                </h3>
                <span className="text-xs font-medium text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
                  {columns[col.key]?.length || 0}
                </span>
              </div>
              <Droppable droppableId={col.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'space-y-3 min-h-[120px] rounded-xl p-2 transition-colors',
                      snapshot.isDraggingOver ? 'bg-primary-50' : 'bg-slate-50/60'
                    )}
                  >
                    {(columns[col.key] || []).map((application, index) => (
                      <Draggable key={application.id} draggableId={application.id} index={index}>
                        {(dragProvided, dragSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                            className={cn(
                              'bg-white rounded-xl border-t-4 border border-slate-100 shadow-card p-3 cursor-grab active:cursor-grabbing',
                              COLUMN_ACCENT[col.key],
                              dragSnapshot.isDragging && 'shadow-modal ring-2 ring-primary-200'
                            )}
                          >
                            <CandidateCard
                              application={application}
                              job={jobs.find((j) => j.id === application.job_id)}
                              blindMode={blindMode}
                              anonId={anonMap[application.id]}
                              onMoveStage={(newStage) => handleMoveStage(application.id, newStage)}
                              onViewCv={() => setViewingCv(application)}
                              onSendEmail={() => setEmailingApplication(application)}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <Modal
        open={!!viewingCv}
        onClose={() => setViewingCv(null)}
        title={viewingCv ? `${viewingCv.candidate_name} — CV` : 'CV'}
        size="lg"
      >
        <pre className="whitespace-pre-wrap text-xs font-mono text-slate-600 bg-slate-50 rounded-lg p-4 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {viewingCv?.cv_text || 'No CV text available.'}
        </pre>
      </Modal>

      <SendEmailModal
        application={emailingApplication}
        job={emailingApplication ? jobs.find((j) => j.id === emailingApplication.job_id) : null}
        onClose={() => setEmailingApplication(null)}
        showToast={showToast}
      />

      <Toast message={toast?.message} variant={toast?.variant} onClose={hideToast} />
    </div>
  );
}

function MoveToMenu({ stage, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nextStages = NEXT_STAGES[stage] || [];

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  if (nextStages.length === 0) return <div />;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-primary px-2 py-1 rounded-lg border border-slate-200 hover:border-primary/50 transition-colors"
      >
        Move to <ChevronDown size={12} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 w-36 bg-white rounded-lg shadow-modal border border-slate-100 overflow-hidden py-1 z-20">
          {nextStages.map((s) => (
            <button
              key={s}
              onClick={(e) => { e.stopPropagation(); onSelect(s); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
            >
              {COLUMN_LABEL[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CardActionsMenu({ stage, onViewCv, onSendEmail, onMoveStage }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const showHiredShortcut = (NEXT_STAGES[stage] || []).includes('hired');
  const showRejectedShortcut = (NEXT_STAGES[stage] || []).includes('rejected');

  return (
    <div ref={ref} className="relative ml-auto">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-modal border border-slate-100 overflow-hidden py-1 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); onViewCv(); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <FileText size={12} /> View CV
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSendEmail(); setOpen(false); }}
            className="w-full text-left px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            <Mail size={12} /> Send Email
          </button>
          {showHiredShortcut && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveStage('hired'); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-success-600 hover:bg-success-50 transition-colors flex items-center gap-2"
            >
              <CheckCircle2 size={12} /> Move to Hired
            </button>
          )}
          {showRejectedShortcut && (
            <button
              onClick={(e) => { e.stopPropagation(); onMoveStage('rejected'); setOpen(false); }}
              className="w-full text-left px-3 py-1.5 text-xs text-danger-600 hover:bg-red-50 transition-colors flex items-center gap-2"
            >
              <XCircle size={12} /> Move to Rejected
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SendEmailModal({ application, job, onClose, showToast }) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!application) return;
    const templateFn = EMAIL_TEMPLATES[application.stage] || EMAIL_TEMPLATES.default;
    const template = templateFn(application.candidate_name, job?.title || 'the role');
    setTo(application.candidate_email || '');
    setSubject(template.subject);
    setMessage(template.message);
  }, [application, job]);

  const handleSend = async () => {
    if (!application) return;
    setSending(true);
    const result = await sendCandidateDecisionNotification({
      candidate_name: application.candidate_name,
      candidate_email: to,
      role: job?.title || '',
      decision: application.stage,
      message,
    });
    setSending(false);
    onClose();
    if (result.success) {
      showToast(`Email sent to ${application.candidate_name}`, 'success');
    } else {
      showToast('Email could not be sent', 'error');
    }
  };

  return (
    <Modal
      open={!!application}
      onClose={onClose}
      title="Send Email"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Skip — Don't Send</Button>
          <Button variant="primary" onClick={handleSend} loading={sending}>Send Email</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="To" type="email" value={to} onChange={(e) => setTo(e.target.value)} />
        <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        <Textarea label="Message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
      </div>
    </Modal>
  );
}

function CandidateCard({ application, job, blindMode, anonId, onMoveStage, onViewCv, onSendEmail }) {
  const displayName = blindMode ? `Candidate #${anonId}` : application.candidate_name;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2.5">
        {blindMode ? (
          <span className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
            <EyeOff size={14} />
          </span>
        ) : (
          <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', avatarColor(application.candidate_name))}>
            {getInitials(...application.candidate_name.split(' '))}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-800 truncate">{displayName}</p>
          {job && <p className="text-xs text-slate-400 truncate">{job.title}</p>}
        </div>
      </div>

      {!blindMode && application.candidate_school && (
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <GraduationCap size={12} /> {application.candidate_school}
        </p>
      )}

      {application.stage === 'rejected' && application.rejection_reason && (
        <Badge variant="danger" className="text-xs">{application.rejection_reason}</Badge>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-slate-400">{formatDate(application.created_at, 'MMM d')}</span>
        {application.blind_score != null && (
          <Badge variant={application.blind_score >= 75 ? 'success' : application.blind_score >= 50 ? 'warning' : 'danger'} className="gap-1">
            <Sparkles size={11} /> {application.blind_score}
          </Badge>
        )}
      </div>

      <div
        className="flex items-center gap-2 pt-2 border-t border-slate-100"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <MoveToMenu stage={application.stage} onSelect={onMoveStage} />
        <CardActionsMenu
          stage={application.stage}
          onViewCv={onViewCv}
          onSendEmail={onSendEmail}
          onMoveStage={onMoveStage}
        />
      </div>
    </div>
  );
}
