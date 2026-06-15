import { useEffect, useState } from 'react';
import { Mail, Calendar, Clock, Shield, KeyRound, AlertCircle, CheckCircle2, User as UserIcon, Settings as SettingsIcon } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { cn, formatDateTime, capitalize } from '../../lib/utils';

const TABS = [
  { key: 'profile', label: 'Profile', icon: UserIcon },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
];

export default function AccountModal({ open, onClose, initialTab = 'profile' }) {
  const { user, updatePassword } = useAuth();
  const [tab, setTab] = useState(initialTab);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwSubmitting, setPwSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setPwError('');
      setPwSuccess('');
      setNewPassword('');
      setConfirmPassword('');
    }
  }, [open, initialTab]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    if (newPassword.length < 6) {
      setPwError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.');
      return;
    }
    setPwSubmitting(true);
    try {
      await updatePassword(newPassword);
      setPwSuccess('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.message || 'Failed to update password.');
    } finally {
      setPwSubmitting(false);
    }
  };

  const provider = user?.app_metadata?.provider ? capitalize(user.app_metadata.provider) : '—';

  return (
    <Modal open={open} onClose={onClose} title="My Account" size="sm">
      <div className="flex gap-1 p-1 mb-4 rounded-lg bg-slate-100">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
              tab === key ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === 'profile' ? (
        <div className="divide-y divide-slate-50">
          <InfoRow icon={Mail} label="Email" value={user?.email || '—'} />
          <InfoRow icon={Shield} label="Sign-in method" value={provider} />
          <InfoRow icon={Calendar} label="Account created" value={user?.created_at ? formatDateTime(user.created_at) : '—'} />
          <InfoRow icon={Clock} label="Last sign in" value={user?.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : '—'} />
        </div>
      ) : (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {pwError && (
            <div className="flex items-start gap-2 rounded-lg bg-danger-50 border border-danger-100 px-3 py-2.5 text-sm text-danger-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{pwError}</span>
            </div>
          )}
          {pwSuccess && (
            <div className="flex items-start gap-2 rounded-lg bg-success-50 border border-success-100 px-3 py-2.5 text-sm text-success-700">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>{pwSuccess}</span>
            </div>
          )}
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            required
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            required
          />
          <Button type="submit" className="w-full" loading={pwSubmitting}>
            <KeyRound size={16} /> Update password
          </Button>
        </form>
      )}
    </Modal>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
        <Icon size={15} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-700 truncate">{value}</p>
      </div>
    </div>
  );
}
