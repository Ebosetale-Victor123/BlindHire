import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import EmployeeList from './pages/employees/EmployeeList';
import EmployeeDetail from './pages/employees/EmployeeDetail';

import Recruitment from './pages/recruitment/Recruitment';

import OnboardingTracker from './pages/onboarding/OnboardingTracker';
import EmployeeRegistration from './pages/registration/EmployeeRegistration';

import AttendancePage from './pages/attendance/AttendancePage';
import PayrollPage from './pages/payroll/PayrollPage';

import EmployeePortal from './pages/employee/EmployeePortal';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/employee-portal" element={<EmployeePortal />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/employees/:id" element={<EmployeeDetail />} />

          <Route path="/recruitment" element={<Recruitment />} />

          <Route path="/onboarding" element={<OnboardingTracker />} />

          <Route path="/registration" element={<EmployeeRegistration />} />

          <Route path="/attendance" element={<AttendancePage />} />

          <Route path="/payroll" element={<PayrollPage />} />

          <Route path="*" element={<Dashboard />} />
        </Route>
      </Route>
    </Routes>
  );
}
