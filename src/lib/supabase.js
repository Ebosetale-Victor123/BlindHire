import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Whether real Supabase credentials have been provided.
 * When false, the app falls back to local sample data so the
 * product remains fully demo-able without any setup.
 */
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('your_supabase') &&
    !SUPABASE_ANON_KEY.includes('your_supabase')
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

/**
 * List of all tables managed by BlindHire, in dependency order
 * (parents before children) for seeding purposes.
 */
export const TABLES = [
  'employees',
  'jobs',
  'applications',
  'onboarding',
  'attendance',
  'leave_requests',
  'payroll',
];

/**
 * Seed Supabase with sample data if a table is empty.
 * Safe to call multiple times — it's a no-op once data exists.
 */
export async function seedTableIfEmpty(table, rows) {
  if (!isSupabaseConfigured || !rows?.length) return false;
  try {
    const { count, error: countError } = await supabase
      .from(table)
      .select('id', { count: 'exact', head: true });

    if (countError) throw countError;
    if (count && count > 0) return false;

    const { error: insertError } = await supabase.from(table).insert(rows);
    if (insertError) throw insertError;
    return true;
  } catch (err) {
    console.error(`Failed to seed table "${table}":`, err.message);
    return false;
  }
}

/**
 * Fetch all rows from a table. Returns null on failure so callers
 * can fall back to sample data. `columns` lets callers request only
 * the fields they need to cut down on payload size for large tables.
 */
export async function fetchAll(table, orderBy = 'created_at', columns = '*') {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(orderBy, { ascending: true });
    if (error) throw error;
    return data;
  } catch (err) {
    console.error(`Failed to fetch table "${table}":`, err.message);
    return null;
  }
}
