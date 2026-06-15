import { lazy, Suspense, useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/auth/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const EmployeeList = lazy(() => import('./pages/employees/EmployeeList'));
const EmployeeDetail = lazy(() => import('./pages/employees/EmployeeDetail'));

const Recruitment = lazy(() => import('./pages/recruitment/Recruitment'));

const OnboardingTracker = lazy(() => import('./pages/onboarding/OnboardingTracker'));
const EmployeeRegistration = lazy(() => import('./pages/registration/EmployeeRegistration'));

const AttendancePage = lazy(() => import('./pages/attendance/AttendancePage'));
const PayrollPage = lazy(() => import('./pages/payroll/PayrollPage'));

const EmployeePortal = lazy(() => import('./pages/employee/EmployeePortal'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-3" />
        <p className="text-slate-500 text-sm">Loading...</p>
      </div>
    </div>
  );
}

function OfflineBanner() {
  return (
    <div className="bg-amber-500 text-white text-center py-2 text-sm font-medium">
      ⚠️ No internet connection — some features may not work until you reconnect
    </div>
  );
}

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {!isOnline && <OfflineBanner />}
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </>
  );
}
