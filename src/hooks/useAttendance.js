import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../lib/utils';

/**
 * Convenience hook for attendance + leave data with derived
 * "today" stats used on the Dashboard and Attendance pages.
 */
export function useAttendance() {
  const { attendance, leaveRequests, employees, addAttendanceRecord, addLeaveRequest, updateLeaveRequest } = useApp();

  const today = formatDate(new Date(), 'yyyy-MM-dd');

  const todayStats = useMemo(() => {
    const todaysRecords = attendance.filter((a) => a.date === today);
    const onLeaveToday = leaveRequests.filter(
      (l) => l.status === 'approved' && l.start_date <= today && l.end_date >= today
    ).length;

    return {
      present: todaysRecords.filter((a) => a.status === 'present').length,
      absent: todaysRecords.filter((a) => a.status === 'absent').length,
      late: todaysRecords.filter((a) => a.status === 'late').length,
      halfDay: todaysRecords.filter((a) => a.status === 'half-day').length,
      onLeave: onLeaveToday,
      total: employees.length,
    };
  }, [attendance, leaveRequests, employees, today]);

  const trend = useMemo(() => {
    const byDate = {};
    attendance.forEach((a) => {
      if (!byDate[a.date]) byDate[a.date] = { date: a.date, present: 0, absent: 0, late: 0 };
      if (a.status === 'present') byDate[a.date].present += 1;
      else if (a.status === 'absent') byDate[a.date].absent += 1;
      else if (a.status === 'late') byDate[a.date].late += 1;
      else if (a.status === 'half-day') byDate[a.date].present += 1;
    });
    return Object.values(byDate)
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .map((d) => ({ ...d, label: formatDate(d.date, 'MMM d') }));
  }, [attendance]);

  return {
    attendance,
    leaveRequests,
    todayStats,
    trend,
    addAttendanceRecord,
    addLeaveRequest,
    updateLeaveRequest,
  };
}
