import { useState } from 'react';
import { Sparkles, RefreshCw, CheckCircle2, TrendingUp, Lightbulb, Rocket } from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { Skeleton } from '../shared/LoadingSpinner';
import CourseCard from '../shared/CourseCard';
import { sendSkillBridgeGrowthPlan } from '../../lib/emailjs';
import { cn } from '../../lib/utils';

const CAREER_PATH_SPLIT = /\s*(?:→|->)\s*/;

function buildGrowthPlanMessage(plan, employee) {
  const lines = [
    '🚀 YOUR SKILLBRIDGE GROWTH PLAN',
    '',
    `You are currently a ${employee.role} in ${employee.department}.`,
    `Your next career milestone: ${plan.next_level}`,
    `Estimated readiness: ~${plan.readiness_months} months`,
    '',
    '✅ YOUR CURRENT STRENGTHS:',
    ...plan.strengths.map((s) => `- ${s}`),
    '',
    '📈 AREAS TO DEVELOP:',
    ...plan.growth_areas.map((a) => `- ${a}`),
    '',
    '📚 RECOMMENDED COURSES:',
  ];
  plan.courses.forEach((c) => {
    lines.push(`${c.course_name} — ${c.platform} — ${c.duration} — ${c.cost}`, `Why: ${c.impact}`, '');
  });
  lines.push(plan.motivation_message);
  return lines.join('\n');
}

export default function GrowthPlanTab({ employee, plan, loading, error, onGenerate, onRegenerate, showToast }) {
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!employee.personal_email) {
      showToast?.('No personal email on file for this employee', 'error');
      return;
    }
    setSending(true);
    const message = buildGrowthPlanMessage(plan, employee);
    const result = await sendSkillBridgeGrowthPlan({
      employee_name: `${employee.first_name} ${employee.last_name}`,
      employee_email: employee.personal_email,
      current_role: employee.role,
      message,
    });
    setSending(false);
    if (result.success) {
      showToast?.(`Growth plan sent to ${employee.personal_email} ✓`, 'success');
    } else {
      showToast?.('Could not send growth plan email — please try again later', 'error');
    }
  };

  const careerSteps = plan?.career_path ? plan.career_path.split(CAREER_PATH_SPLIT).filter(Boolean) : [];

  return (
    <Card className="border-2 border-accent-200 bg-gradient-to-br from-accent-50 to-white space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-accent text-white shrink-0">
          <Rocket size={22} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-800">SkillBridge — Career Growth Plan</h3>
          <p className="text-sm text-slate-500">AI-powered career development for {employee.first_name}</p>
        </div>
      </div>

      {!plan && !loading && !error && (
        <div className="flex flex-col items-center text-center py-10 gap-3">
          <p className="text-sm text-slate-500 max-w-sm">
            Generate an AI-powered career growth plan for {employee.first_name} {employee.last_name} — readiness
            timeline, strengths, growth areas and recommended courses.
          </p>
          <Button variant="accent" onClick={onGenerate}>
            <Sparkles size={16} /> Generate Growth Plan
          </Button>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          <p className="text-center text-xs text-accent-600 animate-pulse">Generating career growth plan...</p>
          <Skeleton className="h-24 w-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-6 space-y-3">
          <p className="text-sm text-danger-600">{error}</p>
          <Button variant="outline" onClick={onRegenerate}>Try Again</Button>
        </div>
      )}

      {!loading && !error && plan && (
        <>
          <div className="rounded-xl border border-accent-100 bg-white p-4 space-y-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800">{employee.first_name} {employee.last_name}</h4>
              <p className="text-xs text-slate-500">{employee.role} · {employee.department}</p>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Journey to {plan.next_level}</span>
                <span>~{plan.readiness_months} months to next level</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${plan.readiness_percentage}%` }} />
              </div>
            </div>
            {careerSteps.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {careerSteps.map((step, i) => (
                  <span key={i} className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium',
                        i === 0 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {step}
                    </span>
                    {i < careerSteps.length - 1 && <span className="text-slate-300">→</span>}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-semibold text-success-600 mb-2">Current Strengths</h4>
              <ul className="space-y-1.5">
                {plan.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-slate-600 flex gap-2">
                    <CheckCircle2 size={16} className="text-success-600 shrink-0 mt-0.5" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-warning-600 mb-2">Growth Areas</h4>
              <ul className="space-y-1.5">
                {plan.growth_areas.map((a, i) => (
                  <li key={i} className="text-sm text-slate-600 flex gap-2">
                    <TrendingUp size={16} className="text-warning-600 shrink-0 mt-0.5" /> {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plan.courses.map((c, i) => (
              <CourseCard
                key={i}
                tag={c.growth_area}
                courseName={c.course_name}
                platform={c.platform}
                duration={c.duration}
                cost={c.cost}
                footer={c.impact}
              />
            ))}
          </div>

          {plan.manager_tip && (
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 flex gap-3">
              <Lightbulb size={18} className="text-primary-600 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-700"><span className="font-semibold">Manager Insight:</span> {plan.manager_tip}</p>
            </div>
          )}

          {plan.motivation_message && (
            <div className="bg-accent-50 border border-accent-100 rounded-lg p-4 italic text-sm text-slate-700">
              {plan.motivation_message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="primary"
              className="flex-1"
              loading={sending}
              disabled={!employee.personal_email}
              title={!employee.personal_email ? 'No personal email on file' : undefined}
              onClick={handleSend}
            >
              <Rocket size={16} /> Send Growth Plan to Employee
            </Button>
            <Button variant="secondary" className="flex-1" onClick={onRegenerate}>
              <RefreshCw size={16} /> Regenerate Plan
            </Button>
          </div>
        </>
      )}

      <p className="text-xs text-slate-400 text-center">Powered by SkillBridge AI</p>
    </Card>
  );
}
