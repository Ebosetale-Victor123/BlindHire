-- ============================================================
-- BlindHire — HR Management System
-- Supabase PostgreSQL Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Employees table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  department TEXT NOT NULL,
  role TEXT NOT NULL,
  employment_type TEXT DEFAULT 'full-time',
  status TEXT DEFAULT 'active',
  salary NUMERIC,
  hire_date DATE,
  avatar_url TEXT,
  bank_name TEXT,
  account_number TEXT,
  next_of_kin TEXT,
  personal_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns for existing databases created before this field was added
ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS personal_email TEXT;

-- ------------------------------------------------------------
-- Transactions table (Paystack disbursement records)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  payroll_id UUID REFERENCES payroll(id) ON DELETE CASCADE,
  reference TEXT UNIQUE NOT NULL,
  amount BIGINT NOT NULL,
  status TEXT DEFAULT 'pending',
  recipient_code TEXT,
  transfer_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_employee_id ON transactions(employee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon - transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- Jobs table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  type TEXT DEFAULT 'full-time',
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Applications table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  candidate_phone TEXT,
  candidate_age INTEGER,
  candidate_gender TEXT,
  candidate_school TEXT,
  cv_text TEXT,
  skills TEXT[],
  stage TEXT DEFAULT 'applied',
  blind_score NUMERIC,
  ai_summary TEXT,
  is_blinded BOOLEAN DEFAULT false,
  status TEXT,
  rejection_reason TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns for existing databases created before these fields were added
ALTER TABLE applications ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ;

-- ------------------------------------------------------------
-- Onboarding table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS onboarding (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  category TEXT,
  completed BOOLEAN DEFAULT false,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Attendance table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in TIME,
  clock_out TIME,
  status TEXT DEFAULT 'present',
  hours_worked NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Leave requests table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- Payroll table
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payroll (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  basic_salary NUMERIC,
  allowances NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  tax NUMERIC DEFAULT 0,
  pension NUMERIC DEFAULT 0,
  net_pay NUMERIC,
  status TEXT DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  transaction_id UUID REFERENCES transactions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns for existing payroll tables
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE payroll ADD COLUMN IF NOT EXISTS transaction_id UUID;

-- ------------------------------------------------------------
-- Indexes for common lookups
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_employee_id ON onboarding(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_month_year ON payroll(month, year);

-- ------------------------------------------------------------
-- Row Level Security
-- For demo purposes we enable RLS but allow all operations via
-- the anon key so the app works out of the box. Tighten these
-- policies before going to production.
-- ------------------------------------------------------------
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon - employees" ON employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon - jobs" ON jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon - applications" ON applications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon - onboarding" ON onboarding FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon - attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon - leave_requests" ON leave_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon - payroll" ON payroll FOR ALL USING (true) WITH CHECK (true);
