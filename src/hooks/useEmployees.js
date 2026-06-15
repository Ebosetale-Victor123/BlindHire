import { useMemo } from 'react';
import { useApp } from '../context/AppContext';

/**
 * Convenience hook for working with employee records and
 * derived stats used across the Dashboard and Employee pages.
 */
export function useEmployees() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, loading } = useApp();

  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter((e) => e.status === 'active').length;
    const onLeave = employees.filter((e) => e.status === 'on-leave').length;
    const probation = employees.filter((e) => e.status === 'probation').length;

    const byDepartment = employees.reduce((acc, e) => {
      acc[e.department] = (acc[e.department] || 0) + 1;
      return acc;
    }, {});

    const byEmploymentType = employees.reduce((acc, e) => {
      acc[e.employment_type] = (acc[e.employment_type] || 0) + 1;
      return acc;
    }, {});

    return { total, active, onLeave, probation, byDepartment, byEmploymentType };
  }, [employees]);

  const getEmployeeById = (id) => employees.find((e) => e.id === id);

  return { employees, stats, addEmployee, updateEmployee, deleteEmployee, getEmployeeById, loading };
}
