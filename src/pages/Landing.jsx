import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ArrowRight, Users, Briefcase, ClipboardList, UserPlus, Clock, DollarSign,
  EyeOff, ScanSearch, Sparkles, CheckCircle2, XCircle, FileSearch, SlidersHorizontal, Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useEmployees } from '../hooks/useEmployees';
import Button from '../components/ui/Button';
import { DEPARTMENTS } from '../data/sampleData';
import { cn, formatNumber } from '../lib/utils';

const FEATURES = [
  {
    icon: EyeOff,
    title: 'Blind Candidate Screener',
    description: 'AI strips names, photos, schools, ages, and locations from CVs before scoring against the job description — so only skills and experience are judged.',
    to: '/recruitment?tab=screener',
    star: true,
  },
  {
    icon: ScanSearch,
    title: 'Job Ad Bias Checker',
    description: 'Scans job descriptions for ageist, gendered, cultural, and exclusionary language, then suggests an instant, neutral rewrite.',
    to: '/recruitment?tab=bias-checker',
    star: true,
  },
  {
    icon: Users,
    title: 'Employee Management',
    description: 'A complete directory of your workforce with profiles, departments, roles, and employment history.',
    to: '/employees',
  },
  {
    icon: Briefcase,
    title: 'Recruitment Pipeline',
    description: 'Post jobs and track applicants through a Kanban board, from applied to hired.',
    to: '/recruitment',
  },
  {
    icon: ClipboardList,
    title: 'Onboarding Tracker',
    description: 'Guided checklists covering documentation, IT setup, orientation, and training for every new hire.',
    to: '/onboarding',
  },
  {
    icon: UserPlus,
    title: 'Employee Registration',
    description: 'A guided four-step form to add new hires and automatically generate their onboarding plan.',
    to: '/registration',
  },
  {
    icon: Clock,
    title: 'Attendance & Leave',
    description: 'Daily attendance tracking with calendar views, plus a full leave request and approval workflow.',
    to: '/attendance',
  },
  {
    icon: DollarSign,
    title: 'Payroll',
    description: 'Run monthly payroll with automatic Nigerian PAYE tax and pension calculations, and generate payslips.',
    to: '/payroll',
  },
];

const STEPS = [
  {
    icon: FileSearch,
    title: 'Submit a CV',
    description: 'A candidate applies to one of your open roles, just like normal.',
  },
  {
    icon: SlidersHorizontal,
    title: 'AI redacts identity signals',
    description: 'Names, photos, schools, ages, and locations are automatically replaced with neutral tags before review.',
  },
  {
    icon: Award,
    title: 'Score on merit alone',
    description: 'The AI scores the redacted CV against the job description — and you can compare it side-by-side with the standard score.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { jobs, applications } = useApp();
  const { stats } = useEmployees();

  const openPositions = jobs.filter((j) => j.status === 'open').length;

  const STATS = [
    { label: 'Employees Managed', value: stats.total },
    { label: 'Open Positions', value: openPositions },
    { label: 'Applications in Pipeline', value: applications.length },
    { label: 'Departments', value: DEPARTMENTS.length },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 px-4 sm:px-6 h-16">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <span className="font-bold text-base sm:text-lg truncate">BlindHire</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Button variant="outline" size="sm" className="sm:px-4 sm:py-2 sm:text-sm" onClick={() => navigate('/employee-portal')}>
              <span className="hidden sm:inline">Employee Portal</span>
              <span className="sm:hidden">Portal</span>
              <ArrowRight size={14} className="hidden sm:inline" />
            </Button>
            <Button size="sm" className="sm:px-4 sm:py-2 sm:text-sm" onClick={() => navigate('/dashboard')}>
              <span className="hidden sm:inline">Launch Dashboard</span>
              <span className="sm:hidden">Dashboard</span>
              <ArrowRight size={14} className="hidden sm:inline" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-navy-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-navy-900 to-accent/20" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-slate-200 mb-6">
              <Sparkles size={14} className="text-accent-300" /> AI-Powered, Bias-Free Hiring
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Hire on merit.<br className="hidden sm:block" />{' '}
              <span className="bg-gradient-to-r from-primary-400 to-accent-300 bg-clip-text text-transparent">
                Not on bias.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl mx-auto text-base sm:text-lg text-slate-300">
              BlindHire is an end-to-end HR management platform that pairs everyday workforce
              tools — employees, onboarding, attendance, payroll — with AI that strips bias out
              of recruitment before it ever reaches a human reviewer.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate('/dashboard')}>
                Launch Dashboard <ArrowRight size={16} />
              </Button>
              <button
                onClick={() => navigate('/recruitment?tab=screener')}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-base font-medium border border-white/30 text-white hover:bg-white/10 transition-colors"
              >
                <EyeOff size={16} /> Try the Blind Screener
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-slate-800">{formatNumber(s.value)}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Unconscious bias creeps in before the interview ever happens
          </h2>
          <p className="mt-3 text-slate-500">
            Names, schools, ages, and photos on a CV trigger split-second judgments — long
            before a recruiter reads a single line about skills or experience.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-danger-100 bg-danger-50/50 p-6">
            <h3 className="font-semibold text-danger-700 flex items-center gap-2 mb-4">
              <XCircle size={18} /> Without BlindHire
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>Names signal gender, ethnicity, and religion before a CV is even read.</li>
              <li>University names create unconscious prestige bias.</li>
              <li>Photos and ages can trigger age or appearance-based discrimination.</li>
              <li>Job ads use coded language that quietly discourages diverse applicants.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-success-100 bg-success-50/50 p-6">
            <h3 className="font-semibold text-success-700 flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} /> With BlindHire
            </h3>
            <ul className="space-y-3 text-sm text-slate-600">
              <li>AI redacts names, photos, schools, ages, and locations from every CV.</li>
              <li>Candidates are scored purely on skills, experience, and job fit.</li>
              <li>The Job Ad Bias Checker flags ageist, gendered & exclusionary language.</li>
              <li>A side-by-side "bias reveal" shows the score difference in real time.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-navy-900 text-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold">How the Blind Screener works</h2>
            <p className="mt-3 text-slate-300">Three steps from application to an unbiased score.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-2xl bg-white/5 border border-white/10 p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
                    <s.icon size={18} className="text-white" />
                  </span>
                  <span className="text-xs font-mono text-slate-400">STEP {i + 1}</span>
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-slate-300 mt-1.5">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="bg-surface py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
              Everything your HR team needs, in one place
            </h2>
            <p className="mt-3 text-slate-500">Eight connected modules covering the full employee lifecycle.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <motion.button
                key={f.title}
                onClick={() => navigate(f.to)}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 4) * 0.06 }}
                className="text-left rounded-xl bg-white border border-slate-100 p-5 shadow-card hover:shadow-modal hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={cn('inline-flex p-2.5 rounded-lg', f.star ? 'bg-accent-50 text-accent-600' : 'bg-primary-50 text-primary-600')}>
                    <f.icon size={20} />
                  </div>
                  {f.star && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-accent text-white tracking-wide">
                      AI
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-800">{f.title}</h3>
                <p className="text-sm text-slate-500 mt-1.5">{f.description}</p>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Ready to see it in action?</h2>
        <p className="mt-3 text-slate-500 max-w-xl mx-auto">
          Jump into the dashboard — it's pre-loaded with realistic sample data, so every module
          works out of the box.
        </p>
        <Button size="lg" className="mt-6" onClick={() => navigate('/dashboard')}>
          Launch Dashboard <ArrowRight size={16} />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <span>© {new Date().getFullYear()} BlindHire. Built for demonstration purposes.</span>
          <span>React · Supabase · Groq AI</span>
        </div>
      </footer>
    </div>
  );
}
