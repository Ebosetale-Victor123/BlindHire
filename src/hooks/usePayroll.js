import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { calculatePayroll } from '../lib/utils';

/**
 * Convenience hook for payroll records, plus helpers to compute
 * and run a new payroll cycle for a given month/year.
 */
export function usePayroll() {
  const { payroll, employees, setPayrollRecords } = useApp();

  const months = useMemo(() => {
    const set = new Map();
    payroll.forEach((p) => {
      const key = `${p.month}-${p.year}`;
      if (!set.has(key)) set.set(key, { month: p.month, year: p.year });
    });
    return Array.from(set.values()).sort(
      (a, b) => new Date(`${b.month} 1, ${b.year}`) - new Date(`${a.month} 1, ${a.year}`)
    );
  }, [payroll]);

  const getRecordsFor = (month, year) =>
    payroll.filter((p) => p.month === month && p.year === year);

  const getSummary = (month, year) => {
    const records = getRecordsFor(month, year);
    return records.reduce(
      (acc, r) => {
        acc.gross += (Number(r.basic_salary) || 0) + (Number(r.allowances) || 0);
        acc.deductions += (Number(r.tax) || 0) + (Number(r.pension) || 0) + (Number(r.deductions) || 0);
        acc.net += Number(r.net_pay) || 0;
        return acc;
      },
      { gross: 0, deductions: 0, net: 0 }
    );
  };

  const getDepartmentCosts = (month, year) => {
    const records = getRecordsFor(month, year);
    const byDept = {};
    records.forEach((r) => {
      const employee = employees.find((e) => e.id === r.employee_id);
      const dept = employee?.department || 'Other';
      byDept[dept] = (byDept[dept] || 0) + (Number(r.net_pay) || 0);
    });
    return Object.entries(byDept).map(([department, total]) => ({ department, total }));
  };

  const runPayroll = async (month, year) => {
    // Always recalculate from current employee salary — skip already-paid records
    const records = employees
      .filter((employee) => {
        const existing = payroll.find(
          (p) => p.employee_id === employee.id && p.month === month && String(p.year) === String(year)
        );
        return !existing || existing.status !== 'paid';
      })
      .map((employee) => {
        const existing = payroll.find(
          (p) => p.employee_id === employee.id && p.month === month && String(p.year) === String(year)
        );
        const allowances = Math.round(Number(employee.salary) * 0.1);
        const { tax, pension, netPay } = calculatePayroll(employee.salary, allowances);
        return {
          id: existing?.id || crypto.randomUUID(),
          employee_id: employee.id,
          month,
          year,
          basic_salary: Number(employee.salary),
          allowances,
          deductions: 0,
          tax,
          pension,
          net_pay: netPay,
          status: 'processed',
          created_at: existing?.created_at || new Date().toISOString(),
        };
      });

    await setPayrollRecords(records);
    return records;
  };

  return { payroll, months, getRecordsFor, getSummary, getDepartmentCosts, runPayroll };
}
