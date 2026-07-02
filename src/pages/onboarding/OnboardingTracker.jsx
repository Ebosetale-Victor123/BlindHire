import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { differenceInDays, parseISO } from 'date-fns';
import {
  CheckCircle2, Circle, AlertCircle, ClipboardList, FileText, Laptop,
  Users as UsersIcon, GraduationCap,
} from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/shared/PageHeader';
import { useApp } from '../../context/AppContext';
import { cn, formatDate, getInitials, avatarColor } from '../../lib/utils';

const CATEGORY_ICONS = {
  Documentation: FileText,
  'IT Setup': Laptop,
  Orientation: UsersIcon,
  Training: GraduationCap,
};

const CATEGORY_ORDER = ['Documentation', 'IT Setup', 'Orientation', 'Training'];

export default function OnboardingTracker() {
  const { employees, onboarding, refreshOnboarding } = useApp();

  // Fetch fresh onboarding state every time HR visits this page
  useEffect(() => { refreshOnboarding(); }, []);

  const groups = useMemo(() => {
    const map = {};
    onboarding.forEach((t) => {
      if (!map[t.employee_id]) map[t.employee_id] = [];
      map[t.employee_id].push(t);
    });
    return Object.entries(map)
      .map(([employeeId, tasks]) => {
        const employee = employees.find((e) => e.id === employeeId);
        const completed = tasks.filter((t) => t.completed).length;
        return {
          employee,
          tasks,
          completed,
          total: tasks.length,
          progress: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
        };
      })
      .filter((g) => g.employee)
      .sort((a, b) => new Date(b.employee.hire_date) - new Date(a.employee.hire_date));
  }, [onboarding, employees]);

  const [selectedId, setSelectedId] = useState(groups[0]?.employee.id || null);
  const selected = groups.find((g) => g.employee.id === selectedId) || groups[0];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Onboarding"
        subtitle="Track new hire progress through documentation, IT setup, orientation and training"
      />

      {groups.length === 0 ? (
        <Card className="text-center py-16">
          <ClipboardList size={36} className="mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No active onboarding checklists.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {groups.map((g) => {
              const isActive = selected?.employee.id === g.employee.id;
              const dayNumber = Math.max(1, differenceInDays(new Date(), parseISO(g.employee.hire_date)) + 1);
              return (
                <button key={g.employee.id} onClick={() => setSelectedId(g.employee.id)} className="text-left">
                  <Card className={cn('transition-all', isActive ? 'ring-2 ring-primary border-primary' : 'hover:shadow-modal')}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={cn('w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold shrink-0', avatarColor(g.employee.first_name + g.employee.last_name))}>
                        {getInitials(g.employee.first_name, g.employee.last_name)}
                      </span>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{g.employee.first_name} {g.employee.last_name}</p>
                        <p className="text-xs text-slate-500 truncate">{g.employee.role} · {g.employee.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span>{g.completed} of {g.total} tasks</span>
                      <span className="font-semibold text-slate-700">{g.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${g.progress}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={cn('h-full rounded-full', g.progress >= 75 ? 'bg-success' : g.progress >= 40 ? 'bg-warning' : 'bg-danger')}
                      />
                    </div>
                    {g.progress === 100 ? (
                      <Badge variant="success" className="mt-2 text-xs">✓ Onboarding Complete</Badge>
                    ) : (
                      <p className="text-xs text-slate-400 mt-2">
                        Started {formatDate(g.employee.hire_date)} · Day {dayNumber}
                      </p>
                    )}
                  </Card>
                </button>
              );
            })}
          </div>

          {selected && (
            <Card>
              <CardHeader
                title={`${selected.employee.first_name} ${selected.employee.last_name}'s Checklist`}
                subtitle={selected.progress === 100 ? 'All tasks completed — onboarding finished!' : `${selected.completed} of ${selected.total} tasks complete · employees tick these in their portal`}
                action={selected.progress === 100 && (
                  <Badge variant="success" className="flex items-center gap-1">
                    <CheckCircle2 size={13} /> Onboarding Complete
                  </Badge>
                )}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-5">
                {CATEGORY_ORDER.map((category) => {
                  const tasks = selected.tasks.filter((t) => t.category === category);
                  if (!tasks.length) return null;
                  const Icon = CATEGORY_ICONS[category];
                  return (
                    <div key={category}>
                      <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                        <Icon size={16} className="text-primary" /> {category}
                      </h4>
                      <ul className="space-y-2">
                        {tasks.map((task) => {
                          const overdue = !task.completed && task.due_date < today;
                          return (
                            <li
                              key={task.id}
                              className={cn(
                                'flex items-start gap-3 p-2.5 rounded-lg',
                                overdue ? 'bg-danger-50' : ''
                              )}
                            >
                              {task.completed ? (
                                <CheckCircle2 size={18} className="text-success-600 shrink-0 mt-0.5" />
                              ) : (
                                <Circle size={18} className={cn('shrink-0 mt-0.5', overdue ? 'text-danger-500' : 'text-slate-300')} />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className={cn('text-sm', task.completed ? 'text-slate-400 line-through' : 'text-slate-700')}>
                                  {task.task}
                                </p>
                                <p className={cn('text-xs mt-0.5', overdue ? 'text-danger-600 font-medium' : 'text-slate-400')}>
                                  Due {formatDate(task.due_date)}
                                </p>
                              </div>
                              {overdue && (
                                <Badge variant="danger" className="shrink-0 gap-1">
                                  <AlertCircle size={11} /> Overdue
                                </Badge>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
