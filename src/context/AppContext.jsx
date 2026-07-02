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
  generateDepartments,
  generateSampleFeedback,
  generateSampleQueries,
  recentActivity,
} from '../data/sampleData';

const AppContext = createContext(null);

// ----------------------------------------------------------
// Local cache: lets repeat visits render instantly with the last
// known data while a fresh copy is fetched in the background.
// ----------------------------------------------------------
const CACHE_KEY = 'blindhire_cache';
const SEED_FLAG = 'blindhire_seeded_v1';
const VICTOR_FLAG = 'blindhire_victor_v1';

function getCachedData() {
  // Always return cached data regardless of age — fresh data is always fetched
  // in the background, so stale cache is better than a blank skeleton screen.
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw).data ?? null;
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

function hasSeeded() {
  try { return !!localStorage.getItem(SEED_FLAG); } catch { return false; }
}
function markSeeded() {
  try { localStorage.setItem(SEED_FLAG, '1'); } catch {}
}
function hasVictorData() {
  try { return !!localStorage.getItem(VICTOR_FLAG); } catch { return false; }
}
function markVictorData() {
  try { localStorage.setItem(VICTOR_FLAG, '1'); } catch {}
}

export function clearAppCache() {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(SEED_FLAG);
    localStorage.removeItem(VICTOR_FLAG);
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
  const [departments, setDepartments] = useState(() =>
    cached?.departments ?? generateDepartments().map((d) => ({ ...d, id: crypto.randomUUID() }))
  );
  const [feedback, setFeedback] = useState(() => cached?.feedback ?? generateSampleFeedback());
  const [queries, setQueries] = useState(() => cached?.queries ?? generateSampleQueries());
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
        // Only seed on first-ever load — localStorage flag skips all 12 seed
        // checks on every subsequent visit, cutting ~13 Supabase calls to 0.
        if (!hasSeeded()) {
          await seedTableIfEmpty('employees', sampleEmployees);
          await seedTableIfEmpty('jobs', sampleJobs);
          await seedTableIfEmpty('applications', sampleApplications);
          await seedTableIfEmpty('onboarding', sampleOnboarding);
          await seedTableIfEmpty('attendance', generateAttendanceRecords());
          await seedTableIfEmpty('leave_requests', sampleLeaveRequests);
          await seedTableIfEmpty('payroll', generatePayrollRecords());
          // Fetch actual employee IDs so performance_records FK uses real UUIDs.
          const { data: actualEmps } = await supabase
            .from('employees')
            .select('id')
            .order('created_at', { ascending: true });
          await seedTableIfEmpty('performance_records', generatePerformanceRecords(actualEmps?.map((e) => e.id)));
          await seedTableIfEmpty('tasks', generateTasks());
          await seedTableIfEmpty('departments', generateDepartments());
          await seedTableIfEmpty('feedback', generateSampleFeedback());
          await seedTableIfEmpty('queries', generateSampleQueries(actualEmps?.map((e) => e.id)));
          markSeeded();
        }

        // Ensure Victor Iguisi (personal_email: vicmanstudios@gmail.com) has
        // attendance and performance data. Runs once per device via flag.
        if (!hasVictorData()) {
          try {
            const { data: victor } = await supabase
              .from('employees')
              .select('id')
              .eq('personal_email', 'vicmanstudios@gmail.com')
              .maybeSingle();

            if (victor?.id) {
              const vid = victor.id;
              const { count: attCount } = await supabase
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .eq('employee_id', vid)
                .gte('date', '2026-06-01')
                .lte('date', '2026-06-30');

              if (!attCount) {
                const mkRec = (date, status, clock_in, clock_out, hours) => ({
                  id: crypto.randomUUID(),
                  employee_id: vid,
                  date,
                  status,
                  clock_in: clock_in ?? null,
                  clock_out: clock_out ?? null,
                  hours_worked: hours ?? null,
                  created_at: new Date().toISOString(),
                });
                const juneRecs = [
                  mkRec('2026-06-02', 'present', '08:08', '17:10', 9.0),
                  mkRec('2026-06-03', 'present', '08:02', '17:20', 9.3),
                  mkRec('2026-06-04', 'present', '08:12', '17:05', 8.9),
                  mkRec('2026-06-05', 'late',    '09:15', '17:30', 8.25),
                  mkRec('2026-06-06', 'present', '08:05', '17:00', 8.9),
                  mkRec('2026-06-09', 'present', '08:10', '17:15', 9.1),
                  mkRec('2026-06-10', 'present', '08:00', '17:20', 9.3),
                  mkRec('2026-06-11', 'late',    '09:05', '18:00', 8.9),
                  mkRec('2026-06-12', 'present', '08:08', '17:10', 9.0),
                  mkRec('2026-06-13', 'present', '08:15', '17:00', 8.75),
                  mkRec('2026-06-16', 'present', '08:03', '17:15', 9.2),
                  mkRec('2026-06-17', 'present', '08:10', '17:05', 8.9),
                  mkRec('2026-06-18', 'late',    '09:25', '17:30', 8.1),
                  mkRec('2026-06-19', 'present', '08:07', '17:00', 8.9),
                  mkRec('2026-06-20', 'half-day','08:05', '13:00', 4.9),
                  mkRec('2026-06-23', 'present', '08:12', '17:10', 9.0),
                  mkRec('2026-06-24', 'present', '08:00', '17:25', 9.4),
                  mkRec('2026-06-25', 'half-day','08:10', '13:00', 4.8),
                  mkRec('2026-06-26', 'absent',  null,    null,    0),
                  mkRec('2026-06-27', 'present', '08:06', '17:15', 9.2),
                  // July records so current-month calendar shows data
                  mkRec('2026-07-01', 'present', '08:05', '17:10', 9.1),
                  mkRec('2026-07-02', 'present', '08:08', '17:05', 9.0),
                ];
                await supabase.from('attendance').insert(juneRecs);
              }

              // Insert or update June 2026 performance record
              const { data: existingPerf } = await supabase
                .from('performance_records')
                .select('id')
                .eq('employee_id', vid)
                .eq('month', 'June')
                .eq('year', 2026)
                .maybeSingle();

              const perfPayload = {
                employee_id: vid,
                month: 'June',
                year: 2026,
                attendance_score: 86,
                task_completion_score: 100,
                manager_rating: 4.0,
                overall_score: 90,
                notes: 'Strong technical delivery. Completed all assigned engineering tasks ahead of schedule. Recommended for senior role consideration.',
              };
              if (existingPerf) {
                await supabase.from('performance_records').update(perfPayload).eq('id', existingPerf.id);
              } else {
                await supabase.from('performance_records').insert({ ...perfPayload, id: crypto.randomUUID(), created_at: new Date().toISOString() });
              }

              markVictorData();
            }
          } catch (err) {
            console.error('Failed to seed Victor attendance:', err.message);
          }
        }

        const [emp, jb, ap, ob, at, lv, pr, tx, perf, tsk, depts, fb, qrs] = await Promise.all([
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
          fetchAll('departments'),
          fetchAll('feedback'),
          fetchAll('queries'),
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
        if (perf?.length)  { setPerformanceRecords(perf);   fresh.performanceRecords = perf; }
        if (tsk?.length)   { setTasks(tsk);                 fresh.tasks = tsk; }
        if (depts?.length) { setDepartments(depts);         fresh.departments = depts; }
        if (fb?.length)    { setFeedback(fb);               fresh.feedback = fb; }
        if (qrs?.length)   { setQueries(qrs);               fresh.queries = qrs; }

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
  // Departments
  // ----------------------------------------------------------
  const addDepartment = useCallback(async (deptData) => {
    const localRecord = { ...deptData, id: deptData.id || crypto.randomUUID(), created_at: new Date().toISOString() };
    setDepartments((prev) => [...prev, localRecord]);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('departments').insert(deptData).select().single();
        if (error) throw error;
        if (data) setDepartments((prev) => prev.map((d) => (d.id === localRecord.id ? data : d)));
        return data;
      } catch (err) {
        console.error('Failed to add department to Supabase:', err.message);
      }
    }
    return localRecord;
  }, []);

  const updateDepartment = useCallback(async (id, updates) => {
    setDepartments((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('departments').update(updates).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update department in Supabase:', err.message);
      }
    }
  }, []);

  const deleteDepartment = useCallback(async (id) => {
    setDepartments((prev) => prev.filter((d) => d.id !== id));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('departments').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to delete department from Supabase:', err.message);
      }
    }
  }, []);

  const refreshTasks = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const data = await fetchAll('tasks');
      if (data?.length) setTasks(data);
    } catch (err) {
      console.error('Failed to refresh tasks:', err.message);
    }
  }, []);

  // ----------------------------------------------------------
  // Feedback (anonymous — no employee_id)
  // ----------------------------------------------------------
  const addFeedback = useCallback(async (entry) => {
    const localRecord = { ...entry, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setFeedback((prev) => [localRecord, ...prev]);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('feedback').insert(entry).select().single();
        if (error) throw error;
        setFeedback((prev) => prev.map((f) => (f.id === localRecord.id ? data : f)));
      } catch (err) {
        console.error('Failed to add feedback to Supabase:', err.message);
      }
    }
    return localRecord;
  }, []);

  // ----------------------------------------------------------
  // Queries / Claims (Voice Centre)
  // ----------------------------------------------------------
  const addQuery = useCallback(async (queryData) => {
    const localRecord = { ...queryData, id: crypto.randomUUID(), created_at: new Date().toISOString() };
    setQueries((prev) => [localRecord, ...prev]);
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('queries').insert(queryData).select().single();
        if (error) throw error;
        setQueries((prev) => prev.map((q) => (q.id === localRecord.id ? data : q)));
        return data;
      } catch (err) {
        console.error('Failed to add query to Supabase:', err.message);
      }
    }
    return localRecord;
  }, []);

  const updateQuery = useCallback(async (id, updates) => {
    setQueries((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('queries').update(updates).eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('Failed to update query in Supabase:', err.message);
      }
    }
  }, []);

  // Keep transactions in localStorage cache so they survive page reloads even when
  // the Supabase insert silently fails (e.g. schema mismatch on payroll_id).
  useEffect(() => {
    if (!transactions.length) return;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ...parsed, data: { ...parsed.data, transactions } })
      );
    } catch {
      // ignore
    }
  }, [transactions]);

  const refreshTransactions = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const data = await fetchAll('transactions');
      if (data?.length) setTransactions(data);
    } catch (err) {
      console.error('Failed to refresh transactions:', err.message);
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
      departments,
      feedback,
      queries,
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
      refreshTransactions,
      addPerformanceRecord,
      addTask,
      updateTask,
      refreshTasks,
      addFeedback,
      addQuery,
      updateQuery,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      logLearningPathSent,
      logGrowthPlanGenerated,
      logSkillGaps,
    }),
    [
      loading, employees, jobs, applications, onboarding, attendance, leaveRequests, payroll,
      transactions, performanceRecords, tasks, departments, feedback, queries, skillBridgeStats,
      addEmployee, updateEmployee, deleteEmployee, addJob, updateJob, addApplication, updateApplication,
      addOnboardingTasks, toggleOnboardingTask, addAttendanceRecord, addLeaveRequest,
      updateLeaveRequest, setPayrollRecords, addTransaction, updateTransaction, refreshTransactions,
      addPerformanceRecord, addTask, updateTask, refreshTasks,
      addFeedback, addQuery, updateQuery,
      addDepartment, updateDepartment, deleteDepartment,
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
