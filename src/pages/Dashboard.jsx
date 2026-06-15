import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Users, Briefcase, UserCheck, Wallet, UserPlus, FilePlus2, PlayCircle,
  ClipboardCheck, CalendarCheck, DollarSign, ArrowUpRight, CheckCircle2, XCircle,
  GraduationCap,
} from 'lucide-react';
import Card, { CardHeader } from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import { SkeletonCard } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import PageHeader from '../components/shared/PageHeader';
import { useApp } from '../context/AppContext';
import { useEmployees } from '../hooks/useEmployees';
import { useAttendance } from '../hooks/useAttendance';
import { formatCurrency, timeAgo } from '../lib/utils';

const ACTIVITY_ICONS = {
  UserPlus, ClipboardCheck, CalendarCheck, DollarSign, Briefcase,
};

const PIE_COLORS = {
  'full-time': '#2563EB',
  'part-time': '#7C3AED',
  contract: '#D97706',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { jobs, payroll, applications, recentActivity, skillBridgeStats, loading } = useApp();
  const { stats } = useEmployees();
  const { todayStats, trend } = useAttendance();

  const openPositions = useMemo(() => jobs.filter((j) => j.status === 'open').length, [jobs]);

  const hiredCandidates = useMemo(() => applications.filter((a) => a.stage === 'hired').length, [applications]);
  const rejectedCandidates = useMemo(() => applications.filter((a) => a.stage === 'rejected').length, [applications]);

  const pendingPayroll = useMemo(() => {
    const pending = payroll.filter((p) => p.status === 'pending');
    return pending.reduce((sum, p) => sum + (Number(p.net_pay) || 0), 0);
  }, [payroll]);

  const departmentData = useMemo(
    () => Object.entries(stats.byDepartment).map(([department, count]) => ({ department, count })),
    [stats.byDepartment]
  );

  const employmentTypeData = useMemo(
    () =>
      Object.entries(stats.byEmploymentType).map(([name, value]) => ({
        name: name.replace('-', ' '),
        rawName: name,
        value,
      })),
    [stats.byEmploymentType]
  );

  const attendanceTrend = useMemo(() => trend.slice(-30), [trend]);

  const topSkillGaps = useMemo(() => {
    const counts = {};
    skillBridgeStats.skillGaps.forEach((gap) => {
      counts[gap] = (counts[gap] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [skillBridgeStats.skillGaps]);

  const maxSkillGapCount = topSkillGaps[0]?.[1] || 1;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening at BlindHire today."
        actions={
          <>
            <Button variant="secondary" onClick={() => navigate('/registration')}>
              <UserPlus size={16} /> Add Employee
            </Button>
            <Button variant="outline" onClick={() => navigate('/recruitment?tab=jobs&action=post')}>
              <FilePlus2 size={16} /> Post Job
            </Button>
            <Button variant="primary" onClick={() => navigate('/payroll?tab=dashboard&action=run')}>
              <PlayCircle size={16} /> Run Payroll
            </Button>
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard icon={Users} label="Total Employees" value={stats.total} color="primary" />
            <StatCard icon={Briefcase} label="Open Positions" value={openPositions} color="accent" />
            <StatCard icon={UserCheck} label="Present Today" value={`${todayStats.present + todayStats.late}/${todayStats.total}`} color="success" />
            <StatCard icon={Wallet} label="Pending Payroll" value={formatCurrency(pendingPayroll)} color="warning" />
            <StatCard icon={CheckCircle2} label="Hired Candidates" value={hiredCandidates} color="success" />
            <StatCard icon={XCircle} label="Rejected Candidates" value={rejectedCandidates} color="danger" />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Headcount by Department" subtitle="Active workforce distribution" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={departmentData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="department" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 13 }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="count" name="Employees" fill="#2563EB" radius={[8, 8, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Employment Type" subtitle="Workforce composition" />
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={employmentTypeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {employmentTypeData.map((entry) => (
                  <Cell key={entry.rawName} fill={PIE_COLORS[entry.rawName] || '#94A3B8'} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 13 }} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span className="text-xs text-slate-600 capitalize">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Attendance trend + activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Attendance Trend" subtitle="Last 30 days" />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={attendanceTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 13 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="present" name="Present" stroke="#16A34A" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="late" name="Late" stroke="#D97706" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="absent" name="Absent" stroke="#DC2626" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <CardHeader title="Recent Activity" subtitle="Latest updates" />
          <div className="space-y-4">
            {recentActivity.slice(0, 5).map((activity) => {
              const Icon = ACTIVITY_ICONS[activity.icon] || ArrowUpRight;
              return (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary-50 text-primary-600 shrink-0">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 leading-snug">{activity.text}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{timeAgo(activity.time)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* SkillBridge Activity */}
      <Card className="border-2 border-accent-200 bg-gradient-to-br from-accent-50 to-white">
        <CardHeader
          title={
            <span className="inline-flex items-center gap-2">
              <GraduationCap size={18} className="text-accent" /> SkillBridge Activity
            </span>
          }
          subtitle="AI-powered talent development this session"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border border-accent-100 p-4">
            <p className="text-sm text-slate-500">Learning Paths Sent</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{skillBridgeStats.learningPathsSent}</p>
          </div>
          <div className="rounded-xl bg-white border border-accent-100 p-4">
            <p className="text-sm text-slate-500">Growth Plans Generated</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{skillBridgeStats.growthPlansGenerated}</p>
          </div>
          <div className="rounded-xl bg-white border border-accent-100 p-4 sm:col-span-2 lg:col-span-1">
            <p className="text-sm text-slate-500 mb-2">Most Common Skill Gaps</p>
            {topSkillGaps.length === 0 ? (
              <p className="text-sm text-slate-400">No data yet</p>
            ) : (
              <div className="space-y-2">
                {topSkillGaps.map(([gap, count]) => (
                  <div key={gap}>
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1 gap-2">
                      <span className="truncate">{gap}</span>
                      <span className="font-medium shrink-0">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${(count / maxSkillGapCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 text-center mt-4">Powered by SkillBridge AI</p>
      </Card>
    </div>
  );
}
