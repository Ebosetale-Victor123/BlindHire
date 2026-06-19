import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, ShieldCheck, ShieldOff, CheckCircle2, XCircle, Wand2,
  ThumbsUp, ThumbsDown, MinusCircle, Info, FileText, Eye, EyeOff, AlertTriangle,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Select, Textarea } from '../../components/ui/Input';
import Toast, { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/shared/LoadingSpinner';
import SkillBridgePanel from '../../components/recruitment/SkillBridgePanel';
import { useApp } from '../../context/AppContext';
import { scoreCandidate, extractCandidateEmail, extractCandidateIdentity, isGroqConfigured } from '../../lib/groq';
import { sendCandidateDecisionNotification } from '../../lib/emailjs';
import { cn } from '../../lib/utils';

const REC_VARIANT = { Advance: 'success', Hold: 'warning', Reject: 'danger' };
const REC_ICON = { Advance: ThumbsUp, Hold: MinusCircle, Reject: ThumbsDown };

const IDENTITY_FIELDS = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'age', label: 'Age' },
  { key: 'gender', label: 'Gender' },
  { key: 'location', label: 'Nationality / Location' },
  { key: 'school', label: 'School / University' },
  { key: 'email', label: 'Email Address' },
  { key: 'phone', label: 'Phone Number' },
];

const REJECTION_REASONS = [
  'Does not meet requirements',
  'Better candidates available',
  'Role has been filled',
  'Other',
];

const acceptTemplate = (name, role) =>
  `Hi ${name}, We are pleased to inform you that your application for ${role} has been shortlisted for the next stage. We will be in touch with next steps. Regards, BlindHire HR Team`;

const rejectTemplate = (name, role) =>
  `Hi ${name}, Thank you for your interest in ${role}. After careful review we will not be moving forward with your application. We wish you the best. Regards, BlindHire HR Team`;

export default function BlindScreener() {
  const { jobs, applications, addApplication, updateApplication } = useApp();
  const { toast, showToast, hideToast } = useToast();
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || '');
  const [cvText, setCvText] = useState(applications[0]?.cv_text || '');
  const [blindMode, setBlindMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ blind: null, standard: null });
  const [error, setError] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(applications[0] || null);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [rejectedCandidate, setRejectedCandidate] = useState(null);

  const selectedJob = jobs.find((j) => j.id === selectedJobId);
  const jobDescription = selectedJob
    ? `${selectedJob.title} (${selectedJob.department})\n\n${selectedJob.description}\n\nRequirements:\n${selectedJob.requirements}`
    : '';

  const currentResult = blindMode ? results.blind : results.standard;
  const extractedEmail = useMemo(() => extractCandidateEmail(cvText), [cvText]);

  useEffect(() => {
    setResults({ blind: null, standard: null });
  }, [selectedJobId]);

  const handleAnalyze = async () => {
    if (!cvText.trim() || !selectedJob) return;
    setLoading(true);
    setError(null);
    setRejectedCandidate(null);
    try {
      if (blindMode) {
        const result = await scoreCandidate(cvText, jobDescription, blindMode);
        setResults((prev) => ({ ...prev, blind: result }));
      } else {
        const [result, identity] = await Promise.all([
          scoreCandidate(cvText, jobDescription, blindMode),
          extractCandidateIdentity(cvText),
        ]);
        setResults((prev) => ({ ...prev, standard: { ...result, identity } }));
      }
    } catch {
      setError('Something went wrong analyzing this CV. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = (e) => {
    const application = applications.find((a) => a.id === e.target.value);
    if (application) {
      setCvText(application.cv_text);
      setSelectedJobId(application.job_id);
      setResults({ blind: null, standard: null });
      setSelectedApplication(application);
      setRejectedCandidate(null);
    }
  };

  const handleCvChange = (e) => {
    setCvText(e.target.value);
    setSelectedApplication(null);
    setRejectedCandidate(null);
  };

  // The candidate's real name — used for emails and records regardless of
  // whether the reviewer's view currently has identity hidden.
  const realCandidateName =
    (results.standard?.identity?.full_name && results.standard.identity.full_name !== 'Not specified' && results.standard.identity.full_name) ||
    selectedApplication?.candidate_name ||
    'there';

  // What the Accept/Reject modals display — masked while Blind Mode is ON.
  const candidateDisplayName = blindMode ? 'This Candidate' : realCandidateName;

  const buildNewApplicationRecord = (extra) => {
    const identity = results.standard?.identity;
    const matchedSkills = (currentResult?.skills_match || []).filter((s) => s.matched).map((s) => s.skill);
    const cleanField = (v) => (v && v !== 'Not specified' ? v : null);
    const age = cleanField(identity?.age);
    return {
      job_id: selectedJobId,
      candidate_name: cleanField(identity?.full_name) || 'Unknown Candidate',
      candidate_email: extractedEmail || '',
      candidate_phone: cleanField(identity?.phone),
      candidate_age: age && !Number.isNaN(Number(age)) ? Number(age) : null,
      candidate_gender: cleanField(identity?.gender),
      candidate_school: cleanField(identity?.school),
      cv_text: cvText,
      skills: matchedSkills,
      blind_score: currentResult?.score ?? null,
      ai_summary: currentResult?.strengths?.[0] || null,
      is_blinded: blindMode,
      ...extra,
    };
  };

  // Finds the application this CV corresponds to, so a decision made here
  // updates the same record shown in the Application Tracker kanban.
  const findMatchingApplication = () => {
    if (selectedApplication) return selectedApplication;
    const trimmedCv = cvText.trim();
    let match = applications.find((a) => a.cv_text?.trim() === trimmedCv);
    if (!match && !blindMode) {
      const name = results.standard?.identity?.full_name;
      if (name && name !== 'Not specified') {
        match = applications.find((a) => a.candidate_name === name);
      }
    }
    return match || null;
  };

  const NOT_FOUND_MESSAGE = 'Decision saved. Candidate not found in application tracker — they may have applied externally.';

  const handleAcceptConfirm = async ({ sendEmail, message }) => {
    setDeciding(true);
    try {
      const updates = { stage: 'interview', decided_at: new Date().toISOString() };
      const matched = findMatchingApplication();
      if (matched) {
        await updateApplication(matched.id, updates);
        setSelectedApplication(matched);
      } else {
        const created = await addApplication(buildNewApplicationRecord(updates));
        setSelectedApplication(created);
      }

      if (sendEmail && extractedEmail) {
        await sendCandidateDecisionNotification({
          candidate_name: realCandidateName === 'there' ? 'Candidate' : realCandidateName,
          candidate_email: extractedEmail,
          role: selectedJob?.title || '',
          decision: 'ACCEPTED',
          message,
        });
      }

      showToast(
        matched ? 'Candidate moved to Interview stage in Application Tracker' : NOT_FOUND_MESSAGE,
        matched ? 'success' : 'info'
      );
      setAcceptOpen(false);
      setRejectedCandidate(null);
    } finally {
      setDeciding(false);
    }
  };

  const handleRejectConfirm = async ({ sendEmail, message, reason }) => {
    setDeciding(true);
    try {
      const updates = { stage: 'rejected', rejection_reason: reason, decided_at: new Date().toISOString() };
      const matched = findMatchingApplication();
      if (matched) {
        await updateApplication(matched.id, updates);
        setSelectedApplication(matched);
      } else {
        const created = await addApplication(buildNewApplicationRecord(updates));
        setSelectedApplication(created);
      }

      if (sendEmail && extractedEmail) {
        await sendCandidateDecisionNotification({
          candidate_name: realCandidateName === 'there' ? 'Candidate' : realCandidateName,
          candidate_email: extractedEmail,
          role: selectedJob?.title || '',
          decision: 'REJECTED',
          message,
        });
      }

      showToast(
        matched ? 'Candidate moved to Rejected' : NOT_FOUND_MESSAGE,
        matched ? 'success' : 'info'
      );
      setRejectOpen(false);
      setRejectedCandidate({
        id: crypto.randomUUID(),
        jobRole: selectedJob?.title || '',
        score: currentResult?.score ?? 0,
        gaps: currentResult?.gaps || [],
        candidateName: realCandidateName === 'there' ? 'Candidate' : realCandidateName,
        candidateEmail: extractedEmail,
      });
    } finally {
      setDeciding(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* BIG Blind Mode toggle */}
      <Card
        className={cn(
          'border-2 transition-colors',
          blindMode ? 'border-accent-300 bg-gradient-to-r from-accent-50 to-primary-50' : 'border-slate-200'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn('p-3 rounded-xl', blindMode ? 'bg-accent text-white' : 'bg-slate-100 text-slate-400')}>
              {blindMode ? <ShieldCheck size={24} /> : <ShieldOff size={24} />}
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">
                BLIND MODE — {blindMode ? 'ON' : 'OFF'}
              </p>
              <p className="text-sm text-slate-500">
                {blindMode
                  ? 'Names, age, gender, school and location are stripped before AI evaluation.'
                  : 'Full CV — including personal identifiers — is sent to the AI for evaluation.'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setBlindMode((v) => !v)}
            className={cn(
              'relative w-16 h-9 rounded-full transition-colors shrink-0',
              blindMode ? 'bg-accent' : 'bg-slate-300'
            )}
          >
            <motion.span
              layout
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 left-1 w-7 h-7 bg-white rounded-full shadow-md"
              style={{ x: blindMode ? 28 : 0 }}
            />
          </button>
        </div>
      </Card>

      {!isGroqConfigured && (
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
          <Info size={14} className="shrink-0" />
          Demo mode: using an offline scoring engine. Add <code className="font-mono">VITE_GROQ_API_KEY</code> to enable live LLaMA 3.3 70B analysis.
        </div>
      )}

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: input */}
        <Card className="space-y-4">
          <CardHeader title="Candidate CV" subtitle="Paste a CV and select the role to evaluate against" />

          <div>
            <p className="text-xs text-slate-500 mb-1.5">
              Select a candidate to screen — identity will be revealed or hidden based on Blind Mode setting
            </p>
            <Select label="Load Sample Application" onChange={handleLoadSample} defaultValue="">
              <option value="" disabled>Choose a sample candidate...</option>
              {applications.map((a) => (
                <option key={a.id} value={a.id}>{a.candidate_name} — {jobs.find((j) => j.id === a.job_id)?.title}</option>
              ))}
            </Select>
          </div>

          <Select label="Job Role" value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
            ))}
          </Select>

          <Textarea
            label="CV / Resume Text"
            rows={14}
            value={cvText}
            onChange={handleCvChange}
            placeholder="Paste the candidate's CV text here..."
            className="font-mono text-xs"
          />

          <Button onClick={handleAnalyze} disabled={!cvText.trim() || !selectedJob} loading={loading} className="w-full">
            <Wand2 size={16} /> {loading ? 'Analyzing...' : `Analyze (Blind Mode ${blindMode ? 'ON' : 'OFF'})`}
          </Button>
          {error && <p className="text-sm text-danger-600">{error}</p>}
        </Card>

        {/* Right: result */}
        <Card>
          <CardHeader
            title="AI Analysis"
            subtitle={selectedJob ? `Evaluating against: ${selectedJob.title}` : 'Select a job role'}
          />

          {loading ? (
            <div className="space-y-4">
              <div className="flex justify-center py-2">
                <Skeleton className="w-36 h-36 rounded-full" />
              </div>
              {isGroqConfigured && (
                <p className="text-center text-xs text-slate-400 animate-pulse">
                  Calling Groq LLaMA 3.3 70B — this can take up to 15-20 seconds...
                </p>
              )}
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ) : currentResult ? (
            <ResultPanel
              result={currentResult}
              blindMode={blindMode}
              onAccept={() => setAcceptOpen(true)}
              onReject={() => setRejectOpen(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <FileText size={36} className="mb-3" />
              <p className="text-sm">Run an analysis to see the candidate's fit score, skills match and recommendation.</p>
            </div>
          )}
        </Card>
      </div>

      {rejectedCandidate && (
        <SkillBridgePanel key={rejectedCandidate.id} {...rejectedCandidate} showToast={showToast} />
      )}

      {/* Reveal comparison */}
      {results.blind && results.standard && (
        <RevealSection blind={results.blind} standard={results.standard} />
      )}

      <AcceptModal
        open={acceptOpen}
        onClose={() => setAcceptOpen(false)}
        candidateName={candidateDisplayName}
        emailName={realCandidateName}
        jobTitle={selectedJob?.title || ''}
        extractedEmail={extractedEmail}
        blindMode={blindMode}
        onConfirm={handleAcceptConfirm}
        submitting={deciding}
      />

      <RejectModal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        candidateName={candidateDisplayName}
        emailName={realCandidateName}
        jobTitle={selectedJob?.title || ''}
        extractedEmail={extractedEmail}
        blindMode={blindMode}
        onConfirm={handleRejectConfirm}
        submitting={deciding}
      />

      <Toast message={toast?.message} variant={toast?.variant} onClose={hideToast} />
    </div>
  );
}

function ResultPanel({ result, blindMode, onAccept, onReject }) {
  const RecIcon = REC_ICON[result.recommendation] || MinusCircle;
  return (
    <div className="space-y-6">
      <IdentityCard identity={result.identity} blindMode={blindMode} />

      {blindMode && (
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-accent-700 bg-accent-50 border border-accent-100 rounded-lg px-3 py-2">
          <ShieldCheck size={14} /> Score based on skills only
        </div>
      )}

      <div className="flex flex-col items-center">
        <ScoreRing score={result.score} />
        <div className="mt-3 flex items-center gap-2">
          <Badge variant={REC_VARIANT[result.recommendation] || 'default'} className="gap-1.5 text-sm px-3 py-1.5">
            <RecIcon size={14} /> {result.recommendation}
          </Badge>
          {blindMode && (
            <Badge variant="accent" className="gap-1"><ShieldCheck size={12} /> Blind Evaluated</Badge>
          )}
        </div>
      </div>

      {result.skills_match?.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-2">Skills Match</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            {result.skills_match.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                {s.matched ? (
                  <CheckCircle2 size={16} className="text-success-600 shrink-0" />
                ) : (
                  <XCircle size={16} className="text-danger-600 shrink-0" />
                )}
                <span className={cn('capitalize truncate', s.matched ? 'text-slate-700' : 'text-slate-400')}>{s.skill}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-semibold text-success-600 mb-2">Strengths</h4>
          <ul className="space-y-1.5">
            {result.strengths?.map((s, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
                <span className="text-success-600 mt-0.5">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-danger-600 mb-2">Gaps</h4>
          <ul className="space-y-1.5">
            {result.gaps?.map((s, i) => (
              <li key={i} className="text-sm text-slate-600 flex gap-2">
                <span className="text-danger-600 mt-0.5">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <DecisionButtons onAccept={onAccept} onReject={onReject} />
    </div>
  );
}

function IdentityCard({ identity, blindMode }) {
  if (blindMode) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-slate-200 text-slate-500">
            <EyeOff size={16} />
          </div>
          <h4 className="text-sm font-bold text-slate-600">Identity Hidden from Reviewer</h4>
        </div>
        <dl className="space-y-2">
          {IDENTITY_FIELDS.map((f) => (
            <div key={f.key} className="flex items-center justify-between text-sm">
              <dt className="text-slate-400">{f.label}</dt>
              <dd className="font-mono text-slate-400">[REDACTED]</dd>
            </div>
          ))}
        </dl>
        <p className="text-xs text-slate-400 mt-3">Personal details stripped before AI evaluation</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50/60 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-primary-100 text-primary-600">
          <Eye size={16} />
        </div>
        <h4 className="text-sm font-bold text-primary-700">Identity Information (Visible to Reviewer)</h4>
      </div>
      <dl className="space-y-2">
        {IDENTITY_FIELDS.map((f) => (
          <div key={f.key} className="flex items-center justify-between gap-3 text-sm">
            <dt className="text-slate-500 shrink-0">{f.label}</dt>
            <dd className="font-medium text-slate-800 text-right truncate">{identity?.[f.key] || 'Not specified'}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-warning-600 mt-3 flex items-start gap-1.5">
        <AlertTriangle size={12} className="shrink-0 mt-0.5" /> This information may introduce unconscious bias
      </p>
    </div>
  );
}

function DecisionButtons({ onAccept, onReject }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
      <Button variant="success" className="flex-1" onClick={onAccept}>
        <CheckCircle2 size={16} /> Accept Candidate
      </Button>
      <Button variant="danger" className="flex-1" onClick={onReject}>
        <XCircle size={16} /> Reject Candidate
      </Button>
    </div>
  );
}

function AcceptModal({ open, onClose, candidateName, emailName, jobTitle, extractedEmail, blindMode, onConfirm, submitting }) {
  const canEmail = !!extractedEmail;
  const [sendEmail, setSendEmail] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      setSendEmail(false);
      setMessage(acceptTemplate(emailName, jobTitle || 'this role'));
    }
  }, [open, canEmail, emailName, jobTitle]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Accept Candidate"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="success" onClick={() => onConfirm({ sendEmail: sendEmail && canEmail, message })} loading={submitting}>
            Confirm Accept
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-success-50 border border-success-100 p-3 text-sm text-slate-700">
          <p><span className="font-semibold">{candidateName}</span> will be marked as <span className="font-semibold text-success-600">Accepted</span> and moved to the Interview stage.</p>
          <p className="mt-1 text-slate-500">Role: <span className="font-medium text-slate-700">{jobTitle || '—'}</span></p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={sendEmail && canEmail}
            disabled={!canEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-success focus:outline-none focus:ring-4 focus:ring-primary-100"
          />
          <span className="text-sm font-medium text-slate-700">Send notification email to candidate (optional)</span>
        </label>
        {!canEmail && (
          <p className="text-xs text-slate-400">
            {blindMode ? 'Reveal candidate identity to access email' : 'No email address found in this CV'}
          </p>
        )}

        {sendEmail && canEmail && (
          <Textarea label="Email message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
        )}
      </div>
    </Modal>
  );
}

function RejectModal({ open, onClose, candidateName, emailName, jobTitle, extractedEmail, blindMode, onConfirm, submitting }) {
  const canEmail = !!extractedEmail;
  const [reason, setReason] = useState(REJECTION_REASONS[0]);
  const [sendEmail, setSendEmail] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (open) {
      setReason(REJECTION_REASONS[0]);
      setSendEmail(false);
      setMessage(rejectTemplate(emailName, jobTitle || 'this role'));
    }
  }, [open, canEmail, emailName, jobTitle]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reject Candidate"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button variant="danger" onClick={() => onConfirm({ sendEmail: sendEmail && canEmail, message, reason })} loading={submitting}>
            Confirm Reject
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg bg-danger-50 border border-danger-100 p-3 text-sm text-slate-700">
          <p><span className="font-semibold">{candidateName}</span> will be marked as <span className="font-semibold text-danger-600">Rejected</span>.</p>
          <p className="mt-1 text-slate-500">Role: <span className="font-medium text-slate-700">{jobTitle || '—'}</span></p>
        </div>

        <Select label="Rejection Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
          {REJECTION_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </Select>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={sendEmail && canEmail}
            disabled={!canEmail}
            onChange={(e) => setSendEmail(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-danger focus:outline-none focus:ring-4 focus:ring-primary-100"
          />
          <span className="text-sm font-medium text-slate-700">Send notification email to candidate (optional)</span>
        </label>
        {!canEmail && (
          <p className="text-xs text-slate-400">
            {blindMode ? 'Reveal candidate identity to access email' : 'No email address found in this CV'}
          </p>
        )}

        {sendEmail && canEmail && (
          <Textarea label="Email message" rows={6} value={message} onChange={(e) => setMessage(e.target.value)} />
        )}
      </div>
    </Modal>
  );
}

export function ScoreRing({ score = 0, size = 140 }) {
  const [animated, setAnimated] = useState(0);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    let raf;
    let start;
    const duration = 1100;
    function step(ts) {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setAnimated(Math.round(progress * score));
      if (progress < 1) raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const offset = circumference - (animated / 100) * circumference;
  const color = score >= 75 ? '#16A34A' : score >= 50 ? '#D97706' : '#DC2626';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#E2E8F0" strokeWidth="10" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth="10" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-slate-800">{animated}</span>
        <span className="text-xs text-slate-400">Fit Score</span>
      </div>
    </div>
  );
}

function RedactedText({ text }) {
  const parts = text.split(/(\[[A-Z\s]+\])/g);
  return (
    <p className="whitespace-pre-wrap text-sm text-slate-600 leading-relaxed font-mono text-xs">
      {parts.map((part, i) =>
        /^\[[A-Z\s]+\]$/.test(part) ? (
          <motion.span
            key={i}
            initial={{ backgroundColor: 'rgba(124,58,237,0.35)', filter: 'blur(3px)', opacity: 0.5 }}
            animate={{ backgroundColor: 'rgba(124,58,237,0.12)', filter: 'blur(0px)', opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="inline-block px-1.5 py-0.5 rounded text-accent-700 font-semibold mx-0.5 my-0.5"
          >
            {part}
          </motion.span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </p>
  );
}

const revealContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const revealItem = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function RevealSection({ blind, standard }) {
  const diff = Math.abs(blind.score - standard.score);
  const matched = diff <= 5;

  return (
    <motion.div initial="hidden" animate="show" variants={revealContainer}>
      <Card className="border-2 border-accent-200 bg-gradient-to-br from-accent-50 via-white to-primary-50">
        <motion.div variants={revealItem} className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-white shadow-card mb-3">
            <Sparkles className="text-accent" size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">The Bias Reveal</h3>
          <p className="text-sm text-slate-500 max-w-lg mx-auto mt-1">
            Same candidate, same skills and experience — here's what changes when personal identity is removed from the evaluation.
          </p>
        </motion.div>

        <motion.div variants={revealItem} className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <div className="text-center">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Standard Review</p>
            <ScoreRing score={standard.score} size={120} />
            <Badge className="mt-3" variant={REC_VARIANT[standard.recommendation] || 'default'}>{standard.recommendation}</Badge>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-accent-600 uppercase tracking-wide mb-3 flex items-center justify-center gap-1.5">
              <ShieldCheck size={14} /> Blind Review
            </p>
            <ScoreRing score={blind.score} size={120} />
            <Badge className="mt-3" variant={REC_VARIANT[blind.recommendation] || 'default'}>{blind.recommendation}</Badge>
          </div>
        </motion.div>

        <motion.div variants={revealItem} className="mb-6">
          <motion.div
            initial={{ scale: 0.92 }}
            animate={{ scale: [0.92, 1.05, 1] }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className={cn(
              'rounded-xl p-4 text-center shadow-sm ring-2',
              matched ? 'bg-success-50 text-success-600 ring-success-100' : 'bg-warning-50 text-warning-600 ring-warning-100'
            )}
          >
            <p className="text-lg font-bold flex items-center justify-center gap-2">
              {matched ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              {matched ? 'Scores match — bias was not a factor' : 'Score difference detected'}
            </p>
            <p className="text-sm font-medium mt-1 opacity-80">
              {matched
                ? `Only a ${diff}-point difference between the standard and blind reviews.`
                : `A ${diff}-point gap between the standard and blind reviews — personal identifiers may have influenced the standard evaluation.`}
            </p>
          </motion.div>
        </motion.div>

        <motion.div variants={revealItem}>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">What the AI saw in Blind Mode</p>
          <div className="bg-white rounded-lg border border-slate-100 p-4 max-h-64 overflow-y-auto scrollbar-thin">
            <RedactedText text={blind.processedCv} />
          </div>
        </motion.div>
      </Card>
    </motion.div>
  );
}
