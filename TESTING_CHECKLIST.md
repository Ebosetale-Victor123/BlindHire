# BlindHire — Manual Testing Checklist

Use this before a demo/submission to make sure every module works end-to-end.
Check items off as you go. Items marked **(AI)** call Groq and can take
**10–20 seconds** — wait for the loading hint before judging a "fail".

---

## 0. Setup

- [ ] `.env` has valid `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_GROQ_API_KEY`
- [ ] Dev server running (`npm run dev`), open `http://localhost:5174`
- [ ] Open browser DevTools → Console tab, keep it visible throughout — flag any red errors

---

## 1. Landing Page (`/`) — public

- [ ] Loads without login, hero/stats/feature sections render
- [ ] Stats (Employees Managed, Open Positions, etc.) show real numbers (not 0/blank)
- [ ] "Launch Dashboard" button → if logged out, sends you to `/login`; if logged in, opens `/dashboard`
- [ ] "Try the Blind Screener" button works the same way

## 2. Authentication

- [ ] Visiting `/dashboard` (or any other app page) while logged out redirects to `/login`
- [ ] **Sign up** with a brand-new email → either logs straight in, or shows
      "Account created. Check your email to confirm it..." (depends on Supabase
      email-confirmation setting — both are correct, not a bug)
- [ ] **Sign in** with correct email/password → redirects to `/dashboard`
- [ ] **Sign in** with wrong password → shows a visible error message, stays on `/login`
- [ ] Refresh the page while logged in → session persists, still on dashboard (no redirect to login)
- [ ] Header shows your real email-derived name/initials (not "Admin"/"AD")
- [ ] **Logout** (top-right avatar → Logout) → redirects to `/login`, and `/dashboard` is no longer accessible until you sign in again

## 3. Header (visible on every app page)

- [ ] Global search box: typing an employee name/role/department shows matching results
- [ ] Clicking a search result navigates to that employee's detail page
- [ ] Notification bell opens a dropdown with sample notifications
- [ ] Avatar menu → **Profile** opens "My Account" modal showing your real email, sign-in method, account-created date, last sign-in
- [ ] Avatar menu → **Settings** opens the same modal on the password tab; changing password (≥6 chars, matching confirm) shows a success message
- [ ] Mobile width (resize browser <1024px): hamburger icon opens the sidebar as an overlay

## 4. Dashboard (`/dashboard`)

- [ ] 4 stat cards show non-zero values: Total Employees, Open Positions, Present Today, Pending Payroll
- [ ] "Headcount by Department" bar chart renders with bars per department
- [ ] "Employment Type" donut chart renders with legend (Full Time / Part Time / Contract)
- [ ] "Attendance Trend" line chart renders (Present/Late/Absent lines)
- [ ] "Recent Activity" feed shows recent items with relative timestamps
- [ ] "Add Employee" → goes to `/registration`
- [ ] "Post Job" → goes to Recruitment > Job Listings with the post form open
- [ ] "Run Payroll" → goes to Payroll dashboard and triggers a payroll run

## 5. Employees (`/employees`)

- [ ] Employee list/table loads with real records (not empty)
- [ ] Search/filter (if present) narrows the list
- [ ] Clicking a row opens `/employees/:id`

### Employee Detail (`/employees/:id`)

- [ ] **Profile** tab: contact info, department/role, employment details all populated
- [ ] **Attendance** tab: shows present/late/absent/half-day summary + log
- [ ] **Payroll** tab: shows payroll history table with NET PAY / BASIC etc.
- [ ] **Documents** tab: renders without errors
- [ ] Edit button opens the employee edit form and saves changes

## 6. Recruitment (`/recruitment`)

### Job Listings (`?tab=jobs`)
- [ ] Job postings list renders with status badges (open/closed)
- [ ] "Post a Job" form opens, can submit a new job
- [ ] "View Applications" on a job → jumps to Application Tracker filtered to that job

### Application Tracker (`?tab=tracker`)
- [ ] Kanban board renders 5 columns: Applied, Screened, Interview, Offer, Hired, each with candidate cards
- [ ] **Blind Mode toggle (ON)**: candidates show as "Candidate #N" with a generic icon (no names/schools)
- [ ] **Blind Mode toggle (OFF)**: candidates show real names, avatars, schools
- [ ] Drag a card from one column to another → it moves and stays after a page refresh

### Blind Screener (`?tab=screener`) — **(AI)**
- [ ] Paste/select a CV and a job description, click **Analyze**
- [ ] Loading state shows the "Calling Groq LLaMA 3.3 70B..." hint
- [ ] Result panel shows: animated Fit Score (0 → final number), Skills Match, Strengths, Gaps, Recommendation
- [ ] Toggle **Blind Mode** → shows side-by-side "Bias Reveal": Standard score vs Blind score, with `[XXX REDACTED]` tags on identity info in the blind version

### Job Ad Checker (`?tab=bias-checker`) — **(AI)**
- [ ] Paste/select a job description, click **Scan for Bias**
- [ ] Loading state shows the Groq hint
- [ ] Result shows a Bias Risk rating/badge
- [ ] Biased phrases are highlighted inline; hovering shows a category tooltip + suggested fix
- [ ] "Suggested Neutral Rewrite" section shows a rewritten JD

## 7. Onboarding (`/onboarding`)

- [ ] Onboarding tracker lists new hires with checklist progress
- [ ] Checking/unchecking a checklist item updates the progress indicator
- [ ] Changes persist after refresh

## 8. Employee Registration (`/registration`)

4-step wizard:
- [ ] **Step 1 — Personal Info**: First/Last name, Email, Phone, **Date of Birth**, **Gender**, Department all present and fillable
- [ ] **Step 2 — Employment Details**: role, employment type, salary, etc.
- [ ] **Step 3/Review**: shows a summary including the entered DOB and Gender
- [ ] Submit → new employee appears in `/employees` list and gets an auto-generated onboarding checklist in `/onboarding`
- [ ] Required-field validation blocks submission with empty required fields

## 9. Attendance (`/attendance`)

### Attendance Log (`?tab=log`)
- [ ] Calendar/table view of daily attendance renders with present/late/absent/half-day statuses

### Leave Management (`?tab=leave`)
- [ ] Leave requests list renders with employee, dates, type, status
- [ ] Leave balances shown per employee
- [ ] **Approve** a pending request → status updates to approved
- [ ] **Reject** a pending request → status updates to rejected
- [ ] Status changes persist after refresh

## 10. Payroll (`/payroll`)

### Payroll Dashboard (`?tab=dashboard`)
- [ ] Shows payroll summary (total cost, department breakdown, etc.)
- [ ] "Run Payroll" generates/updates payroll records for the period

### Payslip Generator (`?tab=payslip`)
- [ ] Select an employee → payslip renders with Earnings, Deductions, **Net Pay**
- [ ] "View Payslip" link from Payroll Dashboard pre-selects the right employee

---

## 11. Cross-cutting checks

- [ ] No uncaught console errors on any page (check after each major action)
- [ ] All data survives a full page refresh (confirms Supabase persistence, not just local state)
- [ ] App is usable at mobile width (375px) and tablet width (768px) — sidebar collapses, tables scroll horizontally instead of overflowing
- [ ] Sidebar "Collapse" toggle works and persists icons-only view
- [ ] Direct URL access to a deep route while logged in (e.g. paste `/payroll?tab=payslip`) loads correctly without a forced redirect to dashboard

---

## Known non-bugs (don't flag these)

- AI features (Blind Screener, Job Ad Checker) take **10–20 seconds** per call — this is real Groq latency, not a hang
- New sign-ups may require email confirmation before first login — this is a Supabase project setting, not broken auth
- If Supabase env vars are missing, the app falls back to local sample data and skips the login gate entirely — fine for offline demos, but for the competition make sure `.env` is configured so auth and persistence are real
