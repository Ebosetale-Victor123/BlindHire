import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, ClipboardList, UserPlus, Clock, DollarSign,
  ChevronsLeft, ChevronsRight, ShieldCheck, X, ArrowUpRight, Settings,
} from 'lucide-react';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/employees', label: 'Employees', icon: Users },
  { to: '/recruitment', label: 'Recruitment', icon: Briefcase, badge: 'AI' },
  { to: '/onboarding', label: 'Onboarding', icon: ClipboardList },
  { to: '/registration', label: 'Registration', icon: UserPlus },
  { to: '/attendance', label: 'Attendance', icon: Clock },
  { to: '/payroll', label: 'Payroll', icon: DollarSign },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onCloseMobile }) {
  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen bg-navy-900 text-white flex flex-col z-50',
          'transition-all duration-200 ease-in-out shrink-0',
          collapsed ? 'w-20' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-white/10 shrink-0">
          <Link to="/" className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
              <ShieldCheck size={20} className="text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg whitespace-nowrap">BlindHire</span>
            )}
          </Link>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1 rounded-md text-slate-300 hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-thin">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative',
                  'border-l-4',
                  isActive
                    ? 'bg-primary/20 text-white border-primary'
                    : 'text-slate-300 border-transparent hover:bg-white/5 hover:text-white'
                )
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && (
                <span className="flex-1 whitespace-nowrap">{label}</span>
              )}
              {!collapsed && badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-accent text-white tracking-wide">
                  {badge}
                </span>
              )}
              {collapsed && badge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Employee Portal link */}
        <div className="px-3 pt-2 border-t border-white/10">
          <a
            href="/employee-portal"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            title={collapsed ? 'Employee Portal' : undefined}
          >
            <ArrowUpRight size={20} className="shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">Employee Portal →</span>}
          </a>
        </div>

        {/* Collapse toggle */}
        <div className="p-3 hidden lg:block">
          <button
            onClick={onToggleCollapse}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
