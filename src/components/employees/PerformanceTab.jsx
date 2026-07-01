import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Star, TrendingUp, Plus, CheckSquare, Square, ClipboardList, Calendar,
} from 'lucide-react';
import Card, { CardHeader } from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import { Input, Textarea } from '../ui/Input';
import { cn, formatDate } from '../../lib/utils';

function scoreBadge(score) {
  if (score >= 90) return { label: 'Excellent', variant: 'success' };
  if (score >= 70) return { label: 'Good', variant: 'primary' };
  if (score >= 50) return { label: 'Needs Improvement', variant: 'warning' };
  return { label: 'At Risk', variant: 'danger' };
}

function scoreColor(variant) {
  return variant === 'success' ? 'text-success-600'
    : variant === 'primary' ? 'text-primary'
    : variant === 'warning' ? 'text-warning-600'
    : 'text-danger-600';
}

export default function PerformanceTab({
  employee, attendance, tasks, performanceRecords,
  onAddRecord, onAddTask, onUpdateTask,
}) {
  const now = new Date();
  const [showAddNote, setShowAddNote] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [rating, setRating] = useState(3);
  const [notes, setNotes] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [saving, setSaving] = useState(false);

  const empAttendance = useMemo(
    () => attendance.filter((a) => a.employee_id === employee.id),
    [attendance, employee.id]
  );
  const empTasks = useMemo(
    () => tasks.filter((t) => t.employee_id === employee.id),
    [tasks, employee.id]
  );
  const empRecords = useMemo(
    () => [...performanceRecords.filter((r) => r.employee_id === employee.id)]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [performanceRecords, employee.id]
  );

  // Live attendance score for current month
  const attendanceScore = useMemo(() => {
    const thisMonth = empAttendance.filter((a) => {
      const d = new Date(a.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    if (!thisMonth.length) return 0;
    const present = thisMonth.filter((a) => a.status === 'present' || a.status === 'late').length;
    const half = thisMonth.filter((a) => a.status === 'half-day').length;
    return Math.round(((present + half * 0.5) / thisMonth.length) * 100);
  }, [empAttendance, now]);

  // Live task completion score
  const taskScore = useMemo(() => {
    if (!empTasks.length) return 0;
    const done = empTasks.filter((t) => t.status === 'completed').length;
    return Math.round((done / empTasks.length) * 100);
  }, [empTasks]);

  // Latest saved manager rating
  const latestRecord = empRecords[empRecords.length - 1];
  const managerRating = latestRecord?.manager_rating ?? 3;
  const overallScore = Math.round(attendanceScore * 0.3 + taskScore * 0.4 + managerRating * 20 * 0.3);
  const badge = scoreBadge(overallScore);

  const chartData = empRecords.slice(-6).map((r) => ({
    label: `${r.month.slice(0, 3)} ${r.year}`,
    score: r.overall_score,
  }));

  const handleSaveNote = async () => {
    setSaving(true);
    const overall = Math.round(attendanceScore * 0.3 + taskScore * 0.4 + rating * 20 * 0.3);
    await onAddRecord({
      employee_id: employee.id,
      month: format(now, 'MMMM'),
      year: now.getFullYear(),
      attendance_score: attendanceScore,
      task_completion_score: taskScore,
      manager_rating: rating,
      overall_score: overall,
      notes,
    });
    setNotes('');
    setRating(3);
    setShowAddNote(false);
    setSaving(false);
  };

  const handleSaveTask = async () => {
    if (!taskTitle.trim()) return;
    setSaving(true);
    await onAddTask({
      employee_id: employee.id,
      title: taskTitle.trim(),
      status: 'pending',
      due_date: taskDue || null,
    });
    setTaskTitle('');
    setTaskDue('');
    setShowAddTask(false);
    setSaving(false);
  };

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreStat label="Attendance" value={attendanceScore} suffix="%" />
        <ScoreStat label="Task Completion" value={taskScore} suffix="%" />
        <ScoreStat label="Manager Rating" value={typeof managerRating === 'number' ? managerRating.toFixed(1) : '3.0'} suffix="/5" />
        <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-4 flex flex-col items-center justify-center text-center gap-1">
          <p className="text-xs text-slate-500">Overall Score</p>
          <p className={cn('text-3xl font-bold', scoreColor(badge.variant))}>{overallScore}</p>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>
      </div>

      {/* Trend chart + latest breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Performance Trend"
            subtitle="Overall score over saved review periods"
            action={
              <Button size="sm" variant="outline" onClick={() => setShowAddNote(true)}>
                <Plus size={14} /> Add Review
              </Button>
            }
          />
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <TrendingUp size={32} className="mb-2 opacity-30" />
              <p className="text-sm">No saved reviews yet.</p>
              <p className="text-xs mt-1">Click "Add Review" to record the first score.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(v) => [v, 'Overall Score']}
                  contentStyle={{ borderRadius: 12, border: '1px solid #f1f5f9', fontSize: 13 }}
                />
                <Line
                  type="monotone" dataKey="score" name="Score"
                  stroke="#2563EB" strokeWidth={2.5}
                  dot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Latest Review"
            subtitle={latestRecord ? `${latestRecord.month} ${latestRecord.year}` : 'No reviews saved'}
          />
          {latestRecord ? (
            <div className="space-y-3">
              <ScoreBar label="Attendance" value={latestRecord.attendance_score} color="bg-success" />
              <ScoreBar label="Task Completion" value={latestRecord.task_completion_score} color="bg-primary" />
              <ScoreBar label="Manager Rating" value={Math.round(latestRecord.manager_rating * 20)} color="bg-accent" />
              {latestRecord.notes && (
                <p className="text-xs text-slate-500 italic mt-2 pt-2 border-t border-slate-100">
                  "{latestRecord.notes}"
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">No reviews saved yet</p>
          )}
        </Card>
      </div>

      {/* Task list */}
      <Card>
        <CardHeader
          title={
            <span className="flex items-center gap-2">
              <ClipboardList size={16} /> Assigned Tasks
            </span>
          }
          subtitle={`${empTasks.filter((t) => t.status === 'completed').length} of ${empTasks.length} completed`}
          action={
            <Button size="sm" variant="outline" onClick={() => setShowAddTask(true)}>
              <Plus size={14} /> Assign Task
            </Button>
          }
        />
        {empTasks.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">
            No tasks assigned yet. Click "Assign Task" to add one.
          </p>
        ) : (
          <ul className="space-y-1">
            {empTasks.map((task) => (
              <li key={task.id} className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => onUpdateTask(task.id, {
                      status: task.status === 'completed' ? 'pending' : 'completed',
                      completed_at: task.status === 'completed' ? null : new Date().toISOString(),
                    })}
                    className={cn(
                      'shrink-0 transition-colors',
                      task.status === 'completed' ? 'text-success-600' : 'text-slate-300 hover:text-slate-500'
                    )}
                  >
                    {task.status === 'completed' ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                  <div className="min-w-0">
                    <p className={cn('text-sm text-slate-700 truncate', task.status === 'completed' && 'line-through text-slate-400')}>
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={11} /> Due {formatDate(task.due_date)}
                      </p>
                    )}
                  </div>
                </div>
                <Badge variant={task.status === 'completed' ? 'success' : 'default'} className="shrink-0 capitalize">
                  {task.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Add Review Modal */}
      <Modal
        open={showAddNote}
        onClose={() => setShowAddNote(false)}
        title="Add Performance Review"
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddNote(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveNote} loading={saving}>Save Review</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <ReadOnlyStat label="Attendance" value={`${attendanceScore}%`} />
            <ReadOnlyStat label="Task Completion" value={`${taskScore}%`} />
            <ReadOnlyStat
              label="Overall"
              value={Math.round(attendanceScore * 0.3 + taskScore * 0.4 + rating * 20 * 0.3)}
            />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Manager Rating</p>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <Textarea
            label="Notes (optional)"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add comments about this review period..."
          />
        </div>
      </Modal>

      {/* Assign Task Modal */}
      <Modal
        open={showAddTask}
        onClose={() => setShowAddTask(false)}
        title="Assign Task"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAddTask(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveTask} loading={saving} disabled={!taskTitle.trim()}>
              Assign Task
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Task Title"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="e.g. Complete Q3 budget report"
          />
          <Input
            label="Due Date"
            type="date"
            value={taskDue}
            onChange={(e) => setTaskDue(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

function ScoreStat({ label, value, suffix }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-card p-4 text-center">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-800">
        {value}<span className="text-sm font-medium text-slate-400">{suffix}</span>
      </p>
    </div>
  );
}

function ScoreBar({ label, value, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-600 mb-1">
        <span>{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${Math.min(Number(value) || 0, 100)}%` }} />
      </div>
    </div>
  );
}

function ReadOnlyStat({ label, value }) {
  return (
    <div className="text-center p-3 bg-slate-50 rounded-lg">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-bold text-slate-800 mt-0.5">{value}</p>
    </div>
  );
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            size={28}
            className={cn(
              star <= value ? 'text-amber-400 fill-amber-400' : 'text-slate-200 fill-slate-200'
            )}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-slate-600">{value} / 5</span>
    </div>
  );
}
