import { useMemo, useState } from 'react';
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, getDay, addMonths, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, X, UserCheck, UserX, Clock, Users } from 'lucide-react';
import Card, { CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Table from '../../components/ui/Table';
import StatCard from '../../components/ui/StatCard';
import { Select } from '../../components/ui/Input';
import { useApp } from '../../context/AppContext';
import { useAttendance } from '../../hooks/useAttendance';
import { cn, formatDate, formatTime, getInitials, avatarColor, STATUS_VARIANTS, titleCase } from '../../lib/utils';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function AttendanceLog() {
  const { employees } = useApp();
  const { attendance, todayStats } = useAttendance();
  const [month, setMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [employeeFilter, setEmployeeFilter] = useState('all');

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const byDate = useMemo(() => {
    const map = {};
    attendance.forEach((a) => {
      if (!map[a.date]) map[a.date] = { present: 0, late: 0, absent: 0, halfDay: 0, total: 0 };
      map[a.date].total += 1;
      if (a.status === 'present') map[a.date].present += 1;
      else if (a.status === 'late') map[a.date].late += 1;
      else if (a.status === 'absent') map[a.date].absent += 1;
      else if (a.status === 'half-day') map[a.date].halfDay += 1;
    });
    return map;
  }, [attendance]);

  const employeeMap = useMemo(() => {
    const m = {};
    employees.forEach((e) => { m[e.id] = e; });
    return m;
  }, [employees]);

  const tableData = useMemo(() => {
    let records = [...attendance];
    if (selectedDate) records = records.filter((a) => a.date === selectedDate);
    if (employeeFilter !== 'all') records = records.filter((a) => a.employee_id === employeeFilter);
    return records
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, selectedDate ? 100 : 20);
  }, [attendance, selectedDate, employeeFilter]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UserCheck} label="Present Today" value={todayStats.present} color="success" />
        <StatCard icon={Clock} label="Late Today" value={todayStats.late} color="warning" />
        <StatCard icon={UserX} label="Absent Today" value={todayStats.absent} color="danger" />
        <StatCard icon={Users} label="On Leave Today" value={todayStats.onLeave} color="accent" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <Card className="lg:col-span-1">
          <CardHeader
            title={format(month, 'MMMM yyyy')}
            action={
              <div className="flex gap-1">
                <button onClick={() => setMonth((m) => subMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <button onClick={() => setMonth((m) => addMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
            }
          />
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-400 mb-2">
            {WEEKDAY_LABELS.map((d, i) => <div key={i}>{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: getDay(startOfMonth(month)) }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const stats = byDate[dateStr];
              const rate = stats ? stats.present / stats.total : null;
              const isSelected = selectedDate === dateStr;
              return (
                <button
                  key={dateStr}
                  disabled={!stats}
                  onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                  className={cn(
                    'aspect-square rounded-lg text-xs font-medium flex flex-col items-center justify-center gap-0.5 transition-colors',
                    !stats && 'text-slate-300 cursor-default',
                    stats && 'cursor-pointer hover:ring-2 hover:ring-primary-200',
                    isSelected && 'ring-2 ring-primary',
                    stats && rate >= 0.9 && 'bg-success-50 text-success-700',
                    stats && rate < 0.9 && rate >= 0.75 && 'bg-warning-50 text-warning-700',
                    stats && rate < 0.75 && 'bg-danger-50 text-danger-700',
                    isToday(day) && 'border-2 border-primary'
                  )}
                >
                  <span>{format(day, 'd')}</span>
                  {stats && <span className="text-[10px] opacity-70">{stats.present}/{stats.total}</span>}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success-50 border border-success-200" /> ≥90% present</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning-50 border border-warning-200" /> 75–89%</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-danger-50 border border-danger-200" /> &lt;75%</span>
          </div>
        </Card>

        {/* Table */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Attendance Records"
            subtitle={selectedDate ? `Showing records for ${formatDate(selectedDate)}` : 'Most recent records across all employees'}
            action={
              <div className="flex flex-wrap items-center gap-2">
                {selectedDate && (
                  <Badge variant="primary" className="gap-2">
                    {formatDate(selectedDate, 'MMM d')}
                    <button onClick={() => setSelectedDate(null)}><X size={12} /></button>
                  </Badge>
                )}
                <Select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="w-44">
                  <option value="all">All Employees</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </Select>
              </div>
            }
          />
          <Table
            columns={[
              {
                key: 'employee',
                header: 'Employee',
                render: (r) => {
                  const emp = employeeMap[r.employee_id];
                  if (!emp) return '—';
                  return (
                    <div className="flex items-center gap-2.5 min-w-[160px]">
                      <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0', avatarColor(emp.first_name + emp.last_name))}>
                        {getInitials(emp.first_name, emp.last_name)}
                      </span>
                      <span className="text-slate-700 font-medium truncate">{emp.first_name} {emp.last_name}</span>
                    </div>
                  );
                },
              },
              { key: 'date', header: 'Date', render: (r) => formatDate(r.date) },
              { key: 'clock_in', header: 'Clock In', render: (r) => formatTime(r.clock_in) },
              { key: 'clock_out', header: 'Clock Out', render: (r) => formatTime(r.clock_out) },
              { key: 'hours_worked', header: 'Hours', render: (r) => r.hours_worked || '—' },
              { key: 'status', header: 'Status', render: (r) => <Badge variant={STATUS_VARIANTS[r.status] || 'default'} dot>{titleCase(r.status)}</Badge> },
            ]}
            data={tableData}
            emptyMessage="No attendance records found"
          />
        </Card>
      </div>
    </div>
  );
}
