import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, Users, ShieldCheck, ScanSearch } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { cn } from '../../lib/utils';
import JobListings from './JobListings';
import ApplicationTracker from './ApplicationTracker';
import BlindScreener from './BlindScreener';
import JobAdChecker from './JobAdChecker';

const TABS = [
  { key: 'jobs', label: 'Job Listings', icon: Briefcase },
  { key: 'tracker', label: 'Application Tracker', icon: Users },
  { key: 'screener', label: 'Blind Screener', icon: ShieldCheck },
  { key: 'bias-checker', label: 'Job Ad Checker', icon: ScanSearch },
];

export default function Recruitment() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobFilter, setJobFilter] = useState(null);
  const [blindMode, setBlindMode] = useState(true);

  const tab = searchParams.get('tab') || 'jobs';
  const action = searchParams.get('action');

  const setTab = (key) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    next.delete('action');
    setSearchParams(next, { replace: true });
  };

  const handleViewApplications = (jobId) => {
    setJobFilter(jobId);
    setTab('tracker');
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Recruitment" subtitle="Manage job postings, applications and bias-free candidate screening" />

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto scrollbar-thin">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
                tab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'jobs' && (
        <JobListings onViewApplications={handleViewApplications} autoOpenPost={action === 'post'} />
      )}

      {tab === 'tracker' && (
        <ApplicationTracker
          jobFilter={jobFilter}
          onClearFilter={() => setJobFilter(null)}
          blindMode={blindMode}
          onToggleBlindMode={() => setBlindMode((v) => !v)}
        />
      )}

      {tab === 'screener' && <BlindScreener />}

      {tab === 'bias-checker' && <JobAdChecker />}
    </div>
  );
}
