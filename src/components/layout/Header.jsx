import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, User, Settings, LogOut, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials, avatarColor, formatDateTime } from '../../lib/utils';
import AccountModal from './AccountModal';

const ROUTE_TITLES = [
  { match: /^\/dashboard$/, title: 'Dashboard', subtitle: 'Welcome back! Here\'s what\'s happening today.' },
  { match: /^\/employees\/new/, title: 'Add Employee', subtitle: 'Create a new employee record' },
  { match: /^\/employees\/[^/]+$/, title: 'Employee Profile', subtitle: 'View and manage employee details' },
  { match: /^\/employees/, title: 'Employees', subtitle: 'Manage your workforce' },
  { match: /^\/recruitment/, title: 'Recruitment', subtitle: 'Bias-free hiring, powered by AI' },
  { match: /^\/onboarding/, title: 'Onboarding', subtitle: 'Track new hire progress' },
  { match: /^\/registration/, title: 'Employee Registration', subtitle: 'Add a new employee to BlindHire' },
  { match: /^\/attendance/, title: 'Attendance & Time', subtitle: 'Track attendance and manage leave' },
  { match: /^\/payroll/, title: 'Payroll Management', subtitle: 'Run payroll and generate payslips' },
];

const NOTIFICATIONS = [
  { id: 1, text: 'New application received for Senior Backend Engineer', time: '2h ago' },
  { id: 2, text: 'Leave request from Funmilayo Ojo is pending approval', time: '5h ago' },
  { id: 3, text: 'Onboarding checklist updated for Yusuf Garba', time: '1d ago' },
  { id: 4, text: 'Payroll for this month is ready to run', time: '2d ago' },
];

export default function Header({ onOpenMobileSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { employees } = useApp();
  const { user, signOut, isAuthEnabled } = useAuth();

  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [accountModalTab, setAccountModalTab] = useState(null);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const userEmail = user?.email || 'demo@blindhire.ng';
  const userHandle = userEmail.split('@')[0] || 'demo';
  const userName = user ? userHandle.charAt(0).toUpperCase() + userHandle.slice(1) : 'Demo User';
  const userInitials = (user ? userHandle.slice(0, 2) : 'DM').toUpperCase();

  const handleLogout = async () => {
    setShowProfile(false);
    try {
      if (isAuthEnabled) await signOut();
    } catch (err) {
      console.error('Sign out failed:', err.message);
    }
    navigate('/login', { replace: true });
  };

  const { title, subtitle } = useMemo(() => {
    const found = ROUTE_TITLES.find((r) => r.match.test(location.pathname));
    return found || { title: 'BlindHire', subtitle: '' };
  }, [location.pathname]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return employees
      .filter(
        (e) =>
          `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
          e.employee_id.toLowerCase().includes(q) ||
          e.role.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [search, employees]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center justify-between gap-4 px-4 sm:px-6 h-16">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <Menu size={20} />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-slate-800 truncate">{title}</h1>
            {subtitle && <p className="text-xs text-slate-500 truncate hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Global search */}
          <div ref={searchRef} className="relative hidden md:block">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="Search employees, roles, departments..."
              className="w-56 lg:w-72 pl-9 pr-8 py-2 text-sm bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary focus:bg-white transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}

            {showResults && search.trim() && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-modal border border-slate-100 overflow-hidden">
                {searchResults.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-center text-slate-400">No results for "{search}"</p>
                ) : (
                  searchResults.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        navigate(`/employees/${e.id}`);
                        setSearch('');
                        setShowResults(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-left transition-colors"
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor(e.first_name + e.last_name)}`}>
                        {getInitials(e.first_name, e.last_name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-slate-800 truncate">{e.first_name} {e.last_name}</span>
                        <span className="block text-xs text-slate-500 truncate">{e.role} · {e.department}</span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full ring-2 ring-white" />
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-modal border border-slate-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800">Notifications</span>
                  <span className="text-xs font-medium text-primary bg-primary-50 px-2 py-0.5 rounded-full">{NOTIFICATIONS.length} new</span>
                </div>
                <div className="max-h-72 overflow-y-auto scrollbar-thin">
                  {NOTIFICATIONS.map((n) => (
                    <div key={n.id} className="px-4 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0">
                      <p className="text-sm text-slate-700">{n.text}</p>
                      <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div ref={profileRef} className="relative">
            <button
              onClick={() => setShowProfile((v) => !v)}
              className="flex items-center gap-2 p-1 pr-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-semibold">
                {userInitials}
              </span>
              <span className="hidden sm:block text-sm font-medium text-slate-700">{userName}</span>
              <ChevronDown size={14} className="hidden sm:block text-slate-400" />
            </button>
            {showProfile && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-modal border border-slate-100 overflow-hidden py-1">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-semibold text-slate-800">{userName}</p>
                  <p className="text-xs text-slate-500">{userEmail}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDateTime(new Date())}</p>
                </div>
                <button
                  onClick={() => { setShowProfile(false); setAccountModalTab('profile'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <User size={16} /> Profile
                </button>
                <button
                  onClick={() => { setShowProfile(false); setAccountModalTab('settings'); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Settings size={16} /> Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-danger-600 hover:bg-red-50 transition-colors border-t border-slate-100 mt-1"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <AccountModal
        open={accountModalTab !== null}
        onClose={() => setAccountModalTab(null)}
        initialTab={accountModalTab || 'profile'}
      />
    </header>
  );
}
