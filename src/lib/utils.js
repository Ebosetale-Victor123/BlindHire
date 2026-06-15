import { clsx } from 'clsx';
import { format, parseISO, isValid, formatDistanceToNow } from 'date-fns';

/**
 * Merge class names conditionally.
 */
export function cn(...inputs) {
  return clsx(...inputs);
}

/**
 * Format a number as Nigerian Naira currency.
 */
export function formatCurrency(amount) {
  const value = Number(amount) || 0;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with thousands separators (no currency symbol).
 */
export function formatNumber(value) {
  return new Intl.NumberFormat('en-NG').format(Number(value) || 0);
}

/**
 * Safely format a date string / Date object.
 */
export function formatDate(date, formatStr = 'MMM d, yyyy') {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return format(d, formatStr);
}

export function formatDateTime(date) {
  return formatDate(date, "MMM d, yyyy 'at' h:mm a");
}

export function timeAgo(date) {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return '—';
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatTime(timeStr) {
  if (!timeStr) return '—';
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${period}`;
}

/**
 * Get initials from a first / last name.
 */
export function getInitials(firstName = '', lastName = '') {
  const a = firstName?.charAt(0) || '';
  const b = lastName?.charAt(0) || '';
  return (a + b).toUpperCase() || '??';
}

/**
 * Generate a unique-looking employee ID in BH-YYYY-XXXX format.
 */
export function generateEmployeeId(year = new Date().getFullYear()) {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `BH-${year}-${random}`;
}

/**
 * Calculate Nigerian PAYE tax (simplified flat 7.5%) and pension (8%).
 */
export function calculatePayroll(basicSalary, allowances = 0, deductions = 0) {
  const basic = Number(basicSalary) || 0;
  const allow = Number(allowances) || 0;
  const ded = Number(deductions) || 0;
  const gross = basic + allow;
  const tax = Math.round(basic * 0.075 * 100) / 100;
  const pension = Math.round(basic * 0.08 * 100) / 100;
  const netPay = Math.round((gross - tax - pension - ded) * 100) / 100;
  return { gross, tax, pension, netPay };
}

/**
 * Deterministic color palette for avatars based on a string seed.
 */
const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-rose-100 text-rose-700',
];

export function avatarColor(seed = '') {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

/**
 * Status -> badge variant mapping used across the app.
 */
export const STATUS_VARIANTS = {
  active: 'success',
  'on-leave': 'warning',
  probation: 'accent',
  inactive: 'danger',
  present: 'success',
  absent: 'danger',
  late: 'warning',
  'half-day': 'accent',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  processed: 'success',
  open: 'success',
  closed: 'danger',
  applied: 'default',
  screened: 'accent',
  interview: 'warning',
  offer: 'success',
  hired: 'success',
  rejected_application: 'danger',
};

export function capitalize(str = '') {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function titleCase(str = '') {
  return str
    .split(/[\s_-]+/)
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Simple seeded pseudo-random number generator (mulberry32)
 * so demo data stays stable across reloads.
 */
export function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
