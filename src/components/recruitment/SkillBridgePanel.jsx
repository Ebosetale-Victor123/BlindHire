import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, Mail } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Input } from '../ui/Input';
import { Skeleton } from '../shared/LoadingSpinner';
import CourseCard from '../shared/CourseCard';
import { useApp } from '../../context/AppContext';
import { generateLearningPath } from '../../lib/groq';
import { sendSkillBridgeLearningPath } from '../../lib/emailjs';

function buildLearningPathMessage(plan) {
  const lines = ['🎯 YOUR SKILLBRIDGE LEARNING PATH', `Career Direction: ${plan.career_path}`, ''];
  plan.job_specific_courses.forEach((c) => {
    lines.push(`📚 ${c.course_name}`, `Platform: ${c.platform}`, `Duration: ${c.duration}`, `Cost: ${c.cost}`, `Focus: ${c.skill_gap}`, '');
  });
  lines.push(plan.encouragement_message);
  return lines.join('\n');
}

function buildFullEmailPreview({ candidateName, jobRole, plan }) {
  const coursesText = plan.job_specific_courses
    .map((c) => `📚 ${c.course_name}\nPlatform: ${c.platform}\nDuration: ${c.duration}\nCost: ${c.cost}\nFocus: ${c.skill_gap}`)
    .join('\n\n');

  return `Hi ${candidateName},

Thank you for your interest in the ${jobRole} position.

Our AI has put together a personalized learning path based on your profile to help you grow in your career:

🎯 YOUR SKILLBRIDGE LEARNING PATH
Career Direction: ${plan.career_path}

${coursesText}

${plan.encouragement_message}

We encourage you to keep building your skills. Strong candidates are always welcome to reapply.

Regards,
BlindHire HR Team`;
}

export default function SkillBridgePanel({ jobRole, score, gaps = [], candidateName, candidateEmail, showToast }) {
  const { logSkillGaps, logLearningPathSent } = useApp();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [toEmail, setToEmail] = useState(candidateEmail || '');
  const [sending, setSending] = useState(false);

  const runGenerate = async () => {
    setLoading(true);
    setError(null);
    const result = await generateLearningPath({ jobRole, score, gaps });
    if (!result) {
      setError('Could not generate plan. Try again.');
      setPlan(null);
    } else {
      setPlan(result);
      logSkillGaps(gaps);
    }
    setLoading(false);
  };

  useEffect(() => {
    runGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setToEmail(candidateEmail || '');
  }, [candidateEmail]);

  const handleSendEmail = async () => {
    setSending(true);
    const message = buildLearningPathMessage(plan);
    const result = await sendSkillBridgeLearningPath({
      candidate_name: candidateName,
      candidate_email: toEmail,
      job_role: jobRole,
      message,
    });
    setSending(false);
    setEmailModalOpen(false);
    if (result.success) {
      logLearningPathSent();
      showToast?.(`Learning path sent to ${toEmail} ✓`, 'success');
    } else {
      showToast?.('Could not send learning path email — please try again later', 'error');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="border-2 border-accent-200 bg-gradient-to-br from-accent-50 to-white space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent text-white shrink-0">
            <GraduationCap size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">SkillBridge — Personalized Learning Path</h3>
            <p className="text-sm text-slate-500">Help this candidate grow and reapply stronger</p>
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            <p className="text-center text-xs text-accent-600 animate-pulse">
              Generating your personalized learning path...
            </p>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-36 w-full" />
              ))}
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-6 space-y-3">
            <p className="text-sm text-danger-600">{error}</p>
            <Button variant="outline" onClick={runGenerate}>Try Again</Button>
          </div>
        )}

        {!loading && !error && plan && (
          <>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="accent">{plan.candidate_level}</Badge>
              {plan.career_path && <p className="text-sm text-slate-500 italic">{plan.career_path}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {plan.job_specific_courses.map((c, i) => (
                <CourseCard
                  key={i}
                  tag={c.skill_gap}
                  courseName={c.course_name}
                  platform={c.platform}
                  duration={c.duration}
                  cost={c.cost}
                  priority={c.priority}
                />
              ))}
            </div>

            {plan.encouragement_message && (
              <div className="bg-accent-50 border border-accent-100 rounded-lg p-4 italic text-sm text-slate-700">
                {plan.encouragement_message}
              </div>
            )}

            {!dismissed ? (
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  className="flex-1"
                  disabled={!candidateEmail}
                  title={!candidateEmail ? 'No email found in CV' : undefined}
                  onClick={() => setEmailModalOpen(true)}
                >
                  <Mail size={16} /> Email Learning Path to Candidate
                </Button>
                <Button variant="secondary" className="flex-1" onClick={() => setDismissed(true)}>
                  Skip — Don't Send
                </Button>
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center">No email sent.</p>
            )}
          </>
        )}

        <p className="text-xs text-slate-400 text-center">Powered by SkillBridge AI</p>
      </Card>

      {plan && (
        <EmailPreviewModal
          open={emailModalOpen}
          onClose={() => setEmailModalOpen(false)}
          candidateName={candidateName}
          jobRole={jobRole}
          plan={plan}
          toEmail={toEmail}
          setToEmail={setToEmail}
          sending={sending}
          onSend={handleSendEmail}
        />
      )}
    </motion.div>
  );
}

function EmailPreviewModal({ open, onClose, candidateName, jobRole, plan, toEmail, setToEmail, sending, onSend }) {
  const preview = buildFullEmailPreview({ candidateName, jobRole, plan });
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Send Learning Path to ${candidateName}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={sending}>Cancel</Button>
          <Button variant="primary" onClick={onSend} loading={sending}>Send Email</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="To" value={toEmail} onChange={(e) => setToEmail(e.target.value)} />
        <div>
          <p className="text-sm font-medium text-slate-700 mb-1.5">Preview</p>
          <p className="text-xs text-slate-500 mb-2">Subject: Your Personalized Learning Path — BlindHire</p>
          <pre className="whitespace-pre-wrap text-xs font-mono bg-slate-50 border border-slate-100 rounded-lg p-3 max-h-80 overflow-y-auto">
            {preview}
          </pre>
        </div>
      </div>
    </Modal>
  );
}
