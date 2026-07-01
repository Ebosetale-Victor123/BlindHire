import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  isSupabaseConfigured,
  supabase,
  fetchAll,
  seedTableIfEmpty,
} from '../lib/supabase';
import {
  employees as sampleEmployees,
  jobs as sampleJobs,
  applications as sampleApplications,
  onboardingTasks as sampleOnboarding,
  leaveRequests as sampleLeaveRequests,
  generateAttendanceRecords,
  generatePayrollRecords,
  generatePerformanceRecords,
  generateTasks,
  recentActivity,
} from '../data/sampleData';

const AppContext = createContext(null);

// ----------------------------------------------------------
// Local cache: lets repeat visits render instantly with the last
// known data while a fresh copy is fetched in the background.
// ----------------------------------------------------------
const CACHE_KEY = 'blindhire_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCachedData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > CACHE_DURATION) return null;
    return data;
  } catch {
    return null;
  }
}

function setCachedData(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Fail silently if storage is full or unavailable
  }
}

export function clearAppCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
}

export function AppProvider({ children }) {
  const initialCacheRef = useRef(getCachedData());
  const cached = initialCacheRef.current;

  const [employees, setEmployees] = useState(() => cached?.employees ?? sampleEmployees);
  const [jobs, setJobs] = useState(() => cached?.jobs ?? sampleJobs);
  const [applications, setApplications] = useState(() => cached?.applications ?? sampleApplications);
  const [onboarding, setOnboarding] = useState(() => cached?.onboarding ?? sampleOnboarding);
  const [attendance, setAttendance] = useState(() => cached?.attendance ?? generateAttendanceRecords());
  const [leaveRequests, setLeaveRequests] = useState(() => cached?.leaveRequests ?? sampleLeaveRequests);
  const [payroll, setPayroll] = useState(() => cached?.payroll ?? generatePayrollRecords());
  const [transactions, setTransactions] = useState(() => cached?.transactions ?? []);
  const [performanceRecords, setPerformanceRecords] = useState(() => cached?.performanceRecords ?? generatePerformanceRecords());
  const [tasks, setTasks] = useState(() => cached?.tasks ?? generateTasks());
  const [loading, setLoading] = useState(() => !cached);
  const [skillBridgeStats, setSkillBridgeStats] = useState({
    learningPathsSent: 0,
    growthPlansGenerated: 0,
    skillGaps: [],
  });

  // ----------------------------------------------------------
  // Initial load: seed Supabase (if configured) then hydrate
  // state from the database. Falls back to sample/cached data.
  // Runs in the background — if cached data exists it's already
  // on screen, so this just refreshes it once the network responds.
  // ----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!isSupabaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        await seedTableIfEmpty('employees', sampleEmployees);
        await seedTableIfEmpty('jobs', sampleJobs);
        await seedTableIfEmpty('applications', sampleApplications);
        await seedTableIfEmpty('onboarding', sampleOnboarding);
        await seedTableIfEmpty('attendance', generateAttendanceRecords());
        await seedTableIfEmpty('leave_requests', sampleLeaveRequests);
        await seedTableIfEmpty('payroll', generatePayrollRecords());
        await seedTableIfEmpty('performance_records', generatePerformanceRecords());
        await seedTableIfEmpty('tasks', generateTasks());

        const [emp, jb, ap, ob, at, lv, pr, tx, perf, tsk] = await Promise.all([
          fetchAll('employees'),
          fetchAll('jobs'),
          fetchAll('applications'),
          fetchAll('onboarding'),
          fetchAll('attendance', 'created_at', 'id, employee_id, date, clock_in, clock_out, status, hours_worked'),
          fetchAll('leave_requests'),
          fetchAll('payroll'),
          fetchAll('transactions'),
          fetchAll('performance_records'),
          fetchAll('tasks'),
        ]);

        if (cancelled) return;

        const fresh = {};
        if (emp?.length)  { setEmployees(emp);            fresh.employees = emp; }
        if (jb?.length)   { setJobs(jb);                  fresh.jobs = jb; }
        if (ap?.length)   { setApplications(ap);           fresh.applications = ap; }
        if (ob?.length)   { setOnboarding(ob);             fresh.onboarding = ob; }
        if (at?.length)   { setAttendance(at);             fresh.attendance = at; }
        if (lv?.length)   { setLeaveRequests(lv);          fresh.leaveRequests = lv; }
        if (pr?.length)   { setPayroll(pr);                fresh.payroll = pr; }
        if (tx?.length)   { setTransactions(tx);           fresh.transactions = tx; }
        if (perf?.length) { setPerformanceRecords(perf);   fresh.performanceRecords = perf; }
        if (tsk?.length)  { setTasks(tsk);                 fresh.tasks = tsk; }

        if (Object.keys(fresh).length) {
          setCachedData({ ...cached, ...fresh });
        }
      } catch (err) {
        console.error('Failed to initialize data from Supabase:', err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // ----------------------------------------------------------
  // Employees
  // ----------------------------------------------------------
  const addEmployee = useCallback(async (employee) => {
    const localRecord = { ...employee, id: employee.id || crypto.randomUUID() };
    setEmployees((prev) => [...prev, localRecord]);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('employees').insert(employee).select().single();
        if (error) throw error;
        setEmployees((prev) => prev.map((e) => (e.id === localRecord.id ? data : e)));
        return data;
      } catch (err) {
        console.error('Failed to add employee to Supabase:', err.message);
        setEmployees((prev) => prev.filter((e) => e.id !== localRecord.id));
        return null;
      }
    }
    return localRecord;
  }, []);

  const updateEmployee = useCallback(async (id, updates) => {
    setEmployees((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('employees').update(updates).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update employee in Supabase:', err.message);
      }
    }
  }, []);

  const deleteEmployee = useCallback(async (id) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setAttendance((prev) => prev.filter((a) => a.employee_id !== id));
    setPayroll((prev) => prev.filter((p) => p.employee_id !== id));
    setOnboarding((prev) => prev.filter((o) => o.employee_id !== id));
    setPerformanceRecords((prev) => prev.filter((r) => r.employee_id !== id));
    setTasks((prev) => prev.filter((t) => t.employee_id !== id));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('employees').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to delete employee from Supabase:', err.message);
      }
    }
  }, []);

  // ----------------------------------------------------------
  // Jobs
  // ----------------------------------------------------------
  const addJob = useCallback(async (jobData) => {
    const localRecord = { ...jobData, id: jobData.id || crypto.randomUUID(), created_at: new Date().toISOString() };
    setJobs((prev) => [localRecord, ...prev]);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('jobs').insert(jobData).select().single();
        if (error) throw error;
        setJobs((prev) => prev.map((j) => (j.id === localRecord.id ? data : j)));
        return data;
      } catch (err) {
        console.error('Failed to add job to Supabase:', err.message);
      }
    }
    return localRecord;
  }, []);

  const updateJob = useCallback(async (id, updates) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...updates } : j)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('jobs').update(updates).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update job in Supabase:', err.message);
      }
    }
  }, []);

  // ----------------------------------------------------------
  // Applications
  // ----------------------------------------------------------
  const addApplication = useCallback(async (applicationData) => {
    const localRecord = { ...applicationData, id: applicationData.id || crypto.randomUUID(), created_at: new Date().toISOString() };
    setApplications((prev) => [localRecord, ...prev]);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('applications').insert(applicationData).select().single();
        if (error) throw error;
        setApplications((prev) => prev.map((a) => (a.id === localRecord.id ? data : a)));
        return data;
      } catch (err) {
        console.error('Failed to add application to Supabase:', err.message);
      }
    }
    return localRecord;
  }, []);

  const updateApplication = useCallback(async (id, updates) => {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('applications').update(updates).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update application in Supabase:', err.message);
      }
    }
  }, []);

  // ----------------------------------------------------------
  // Onboarding
  // ----------------------------------------------------------
  const addOnboardingTasks = useCallback(async (tasks) => {
    const localRecords = tasks.map((t) => ({ ...t, id: t.id || crypto.randomUUID() }));
    setOnboarding((prev) => [...prev, ...localRecords]);

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('onboarding').insert(tasks).select();
        if (error) throw error;
        if (data?.length) {
          setOnboarding((prev) => [
            ...prev.filter((t) => !localRecords.some((l) => l.id === t.id)),
            ...data,
          ]);
        }
      } catch (err) {
        console.error('Failed to add onboarding tasks to Supabase:', err.message);
      }
    }
    return localRecords;
  }, []);

  const toggleOnboardingTask = useCallback(async (id, completed) => {
    setOnboarding((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('onboarding').update({ completed }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update onboarding task in Supabase:', err.message);
      }
    }
  }, []);

  // ----------------------------------------------------------
  // Attendance
  // ----------------------------------------------------------
  const addAttendanceRecord = useCallback(async (record) => {
    const localRecord = { ...record, id: record.id || crypto.randomUUID() };
    setAttendance((prev) => [...prev, localRecord]);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('attendance').insert(record).select().single();
        if (error) throw error;
        setAttendance((prev) => prev.map((a) => (a.id === localRecord.id ? data : a)));
      } catch (err) {
        console.error('Failed to add attendance record to Supabase:', err.message);
      }
    }
  }, []);

  // ----------------------------------------------------------
  // Leave requests
  // ----------------------------------------------------------
  const addLeaveRequest = useCallback(async (leaveData) => {
    const localRecord = { ...leaveData, id: leaveData.id || crypto.randomUUID(), created_at: new Date().toISOString() };
    setLeaveRequests((prev) => [localRecord, ...prev]);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('leave_requests').insert(leaveData).select().single();
        if (error) throw error;
        setLeaveRequests((prev) => prev.map((l) => (l.id === localRecord.id ? data : l)));
      } catch (err) {
        console.error('Failed to add leave request to Supabase:', err.message);
      }
    }
    return localRecord;
  }, []);

  const updateLeaveRequest = useCallback(async (id, updates) => {
    setLeaveRequests((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('leave_requests').update(updates).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update leave request in Supabase:', err.message);
      }
    }
  }, []);

  // ----------------------------------------------------------
  // Payroll
  // ----------------------------------------------------------
  const setPayrollRecords = useCallback(async (records) => {
    setPayroll((prev) => {
      const ids = new Set(records.map((r) => r.id));
      return [...prev.filter((p) => !ids.has(p.id)), ...records];
    });

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('payroll').upsert(records);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to upsert payroll records in Supabase:', err.message);
      }
    }
  }, []);

  // ----------------------------------------------------------
  // Transactions (Paystack disbursement records)
  // ----------------------------------------------------------
  const addTransaction = useCallback(async (tx) => {
    const localRecord = { ...tx, id: tx.id || crypto.randomUUID(), created_at: new Date().toISOString() };
    setTransactions((prev) => [...prev, localRecord]);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('transactions').insert(tx).select().single();
        if (error) throw error;
        setTransactions((prev) => prev.map((t) => (t.id === localRecord.id ? data : t)));
        return data;
      } catch (err) {
        console.error('Failed to add transaction to Supabase:', err.message);
        return localRecord;
      }
    }
    return localRecord;
  }, []);

  const updateTransaction = useCallback(async (id, updates) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('transactions').update(updates).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update transaction in Supabase:', err.message);
      }
    }
  }, []);

  // ----------------------------------------------------------
  // Performance Records
  // ----------------------------------------------------------
  const addPerformanceRecord = useCallback(async (record) => {
    const localRecord = { ...record, id: record.id || crypto.randomUUID(), created_at: new Date().toISOString() };
    setPerformanceRecords((prev) => [...prev, localRecord]);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('performance_records').insert(record).select().single();
        if (error) throw error;
        setPerformanceRecords((prev) => prev.map((r) => (r.id === localRecord.id ? data : r)));
        return data;
      } catch (err) {
        console.error('Failed to add performance record to Supabase:', err.message);
        return localRecord;
      }
    }
    return localRecord;
  }, []);

  // ----------------------------------------------------------
  // Tasks
  // ----------------------------------------------------------
  const addTask = useCallback(async (task) => {
    const localRecord = { ...task, id: task.id || crypto.randomUUID(), status: 'pending', created_at: new Date().toISOString() };
    setTasks((prev) => [...prev, localRecord]);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('tasks').insert(task).select().single();
        if (error) throw error;
        setTasks((prev) => prev.map((t) => (t.id === localRecord.id ? data : t)));
        return data;
      } catch (err) {
        console.error('Failed to add task to Supabase:', err.message);
        return localRecord;
      }
    }
    return localRecord;
  }, []);

  const updateTask = useCallback(async (id, updates) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('tasks').update(updates).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update task in Supabase:', err.message);
      }
    }
  }, []);

  // ----------------------------------------------------------
  // SkillBridge (local-only session stats)
  // ----------------------------------------------------------
  const logLearningPathSent = useCallback(() => {
    setSkillBridgeStats((s) => ({ ...s, learningPathsSent: s.learningPathsSent + 1 }));
  }, []);

  const logGrowthPlanGenerated = useCallback(() => {
    setSkillBridgeStats((s) => ({ ...s, growthPlansGenerated: s.growthPlansGenerated + 1 }));
  }, []);

  const logSkillGaps = useCallback((gaps = []) => {
    if (!gaps.length) return;
    setSkillBridgeStats((s) => ({ ...s, skillGaps: [...s.skillGaps, ...gaps] }));
  }, []);

  const value = useMemo(
    () => ({
      loading,
      employees,
      jobs,
      applications,
      onboarding,
      attendance,
      leaveRequests,
      payroll,
      transactions,
      performanceRecords,
      tasks,
      recentActivity,
      skillBridgeStats,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      addJob,
      updateJob,
      addApplication,
      updateApplication,
      addOnboardingTasks,
      toggleOnboardingTask,
      addAttendanceRecord,
      addLeaveRequest,
      updateLeaveRequest,
      setPayrollRecords,
      addTransaction,
      updateTransaction,
      addPerformanceRecord,
      addTask,
      updateTask,
      logLearningPathSent,
      logGrowthPlanGenerated,
      logSkillGaps,
    }),
    [
      loading, employees, jobs, applications, onboarding, attendance, leaveRequests, payroll,
      transactions, performanceRecords, tasks, skillBridgeStats,
      addEmployee, updateEmployee, deleteEmployee, addJob, updateJob, addApplication, updateApplication,
      addOnboardingTasks, toggleOnboardingTask, addAttendanceRecord, addLeaveRequest,
      updateLeaveRequest, setPayrollRecords, addTransaction, updateTransaction,
      addPerformanceRecord, addTask, updateTask,
      logLearningPathSent, logGrowthPlanGenerated, logSkillGaps,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within an AppProvider');
  return ctx;
}
