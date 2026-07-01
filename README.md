# BlindHire — Bias-Free HR Management Platform

> An end-to-end HR management system that pairs everyday workforce tools with AI that strips bias out of recruitment before it ever reaches a human reviewer.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Typography](#typography)
4. [Color System](#color-system)
5. [Animations & Motion](#animations--motion)
6. [Project Structure](#project-structure)
7. [Pages & Routes](#pages--routes)
8. [Modules & Features](#modules--features)
9. [AI Engine — Groq](#ai-engine--groq)
10. [Email System — EmailJS](#email-system--emailjs)
11. [Database — Supabase](#database--supabase)
12. [State Management](#state-management)
13. [Component Library](#component-library)
14. [Build & Deployment](#build--deployment)
15. [Environment Variables](#environment-variables)
16. [Local Development](#local-development)

---

## Overview

BlindHire is a React single-page application built for Nigerian HR teams. It combines a full employee lifecycle management suite (employees, onboarding, attendance, payroll) with two AI-powered bias-elimination tools: a **Blind Candidate Screener** that redacts identity signals from CVs before AI scoring, and a **Job Ad Bias Checker** that rewrites exclusionary job descriptions. The platform also includes **SkillBridge**, an AI career-development add-on that generates personalised learning paths for rejected candidates and growth plans for existing employees.

---

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| `react` | 18.3.1 | UI framework (StrictMode enabled) |
| `react-dom` | 18.3.1 | DOM rendering |
| `react-router-dom` | 6.27.0 | Client-side routing (BrowserRouter) |
| `framer-motion` | 11.11.9 | Page transitions and component animations |
| `lucide-react` | 0.451.0 | Icon library (SVG icons) |
| `recharts` | 2.12.7 | Bar, Line, and Pie charts |
| `@hello-pangea/dnd` | 16.6.0 | Drag-and-drop Kanban board |
| `canvas-confetti` | 1.9.3 | Confetti animation on payroll run |
| `clsx` | 2.1.1 | Conditional className utility |
| `date-fns` | 3.6.0 | Date formatting and arithmetic |
| `axios` | 1.7.7 | HTTP client (used for specific API calls) |

### Styling
| Package | Version | Purpose |
|---|---|---|
| `tailwindcss` | 3.4.13 | Utility-first CSS framework |
| `autoprefixer` | 10.4.20 | PostCSS vendor prefix automation |
| `postcss` | 8.4.47 | CSS pipeline processor |

### Backend & Services
| Package | Version | Purpose |
|---|---|---|
| `@supabase/supabase-js` | 2.45.4 | PostgreSQL database + auth client |
| `groq-sdk` | 0.7.0 | Groq AI API (via server-side proxy) |
| `@emailjs/browser` | 4.4.1 | Client-side transactional email |

### Build Tools
| Package | Version | Purpose |
|---|---|---|
| `vite` | 5.4.9 | Dev server + production bundler |
| `@vitejs/plugin-react` | 4.3.3 | React Fast Refresh + JSX transform |
| `terser` | 5.48.0 | Production JS minification |
| `cross-env` | 10.1.0 | Cross-platform environment variable injection |

---

## Typography

**Font family:** `Inter` (Google Fonts)

Loaded via `<link>` in `index.html` with preconnect for zero-FOUT loading:

```
https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap
```

| Weight | Value | Usage |
|---|---|---|
| Regular | 400 | Body text, table cells, paragraph text |
| Medium | 500 | Labels, secondary buttons, nav links |
| SemiBold | 600 | Card titles, form labels, sub-headings |
| Bold | 700 | Page headings, stat values, modal titles |
| ExtraBold | 800 | Hero headline, landing page title |

Defined in `tailwind.config.js`:
```js
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
}
```

---

## Color System

All colors are defined in `tailwind.config.js` under `theme.extend.colors`.

### Primary — Blue (Action / Interactive)
| Token | Hex | Usage |
|---|---|---|
| `primary` / `primary-600` | `#2563EB` | Buttons, links, active nav, focus rings |
| `primary-50` | `#EFF6FF` | Hover backgrounds, icon containers |
| `primary-100` | `#DBEAFE` | Light hover states |
| `primary-200` | `#BFDBFE` | Borders on hover |
| `primary-300` | `#93C5FD` | Disabled states |
| `primary-400` | `#60A5FA` | Mid-range accents |
| `primary-500` | `#3B82F6` | Alternate primary shade |
| `primary-700` | `#1D4ED8` | Button hover state |
| `primary-800` | `#1E40AF` | Deep hover |
| `primary-900` | `#1E3A8A` | Deepest shade |

### Accent — Purple (SkillBridge / Blind Mode)
| Token | Hex | Usage |
|---|---|---|
| `accent` / `accent-600` | `#7C3AED` | SkillBridge branding, Blind Mode badge, Growth Plan tab |
| `accent-50` | `#F5F3FF` | SkillBridge card backgrounds |
| `accent-100` | `#EDE9FE` | Light accent surfaces |
| `accent-200` | `#DDD6FE` | Accent borders |
| `accent-300` | `#C4B5FD` | Lighter accent tints |
| `accent-400` | `#A78BFA` | Mid accent |
| `accent-500` | `#8B5CF6` | Alternate accent |
| `accent-700` | `#6D28D9` | Accent hover state |

### Success — Green (Positive states)
| Token | Hex | Usage |
|---|---|---|
| `success` / `success-600` | `#16A34A` | Active status badges, present attendance, hired count |
| `success-50` | `#F0FDF4` | Success alert backgrounds |
| `success-100` | `#DCFCE7` | Success badge backgrounds |

### Warning — Amber (Cautionary states)
| Token | Hex | Usage |
|---|---|---|
| `warning` / `warning-600` | `#D97706` | Pending payroll, late attendance, medium bias score |
| `warning-50` | `#FFFBEB` | Warning alert backgrounds |
| `warning-100` | `#FEF3C7` | Warning badge backgrounds |

### Danger — Red (Destructive / Error states)
| Token | Hex | Usage |
|---|---|---|
| `danger` / `danger-600` | `#DC2626` | Delete actions, rejected candidates, absent attendance, validation errors |
| `danger-50` | `#FEF2F2` | Danger alert backgrounds |
| `danger-100` | `#FEE2E2` | Danger badge backgrounds |

### Navy (Sidebar & Hero)
| Token | Hex | Usage |
|---|---|---|
| `navy` / `navy-900` | `#0F172A` | Sidebar background, hero section background |
| `navy-800` | `#1E293B` | Sidebar hover states |

### Surface
| Token | Hex | Usage |
|---|---|---|
| `surface` | `#F8FAFC` | App page background, features section background |

### Shadows
```js
card:  '0 1px 2px 0 rgba(0,0,0,0.05)'                                          // Cards, stat tiles
modal: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)'     // Modals, dropdowns
```

---

## Animations & Motion

### Custom Tailwind Keyframes

| Name | Effect | Duration | Usage |
|---|---|---|---|
| `fade-in` | Opacity 0 → 1 | 0.4s ease-in-out | Initial content reveals |
| `slide-up` | Opacity 0→1 + translateY(12px→0) | 0.4s ease-out | Cards entering view |
| `dissolve` | Opacity 1→0 + blur(0→6px) | 0.6s ease-in-out | Blind Mode identity fade-out transition |

### Framer Motion
Used throughout the app for:
- **Page transitions** — `opacity 0→1, y: 8→0` on every route change (0.25s ease-out), managed by `AnimatePresence` in `Layout.jsx`
- **Landing hero** — initial load animation on headline and CTA buttons
- **Feature cards** — `whileInView` staggered entrance with 0.06s delay per card (4 columns)
- **How-it-works steps** — `whileInView` staggered 0.1s delay per step
- **SkillBridge panel** — `initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}` slide-in after candidate rejection

---

## Project Structure

```
BlindHire/
├── api/
│   └── groq.js                        # Vercel serverless function — Groq API proxy
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── employees/
│   │   │   └── GrowthPlanTab.jsx      # SkillBridge employee growth plan tab
│   │   ├── layout/
│   │   │   ├── Layout.jsx             # App shell (sidebar + header + <Outlet />)
│   │   │   ├── Sidebar.jsx            # Off-canvas navigation sidebar
│   │   │   ├── Header.jsx             # Sticky header (search, notifications, user menu)
│   │   │   └── AccountModal.jsx       # Profile / settings modal
│   │   ├── recruitment/
│   │   │   └── SkillBridgePanel.jsx   # AI learning path panel shown after rejection
│   │   ├── shared/
│   │   │   ├── PageHeader.jsx         # Page title + action buttons row
│   │   │   ├── RemoveEmployeeModal.jsx
│   │   │   └── CourseCard.jsx         # Reusable course card (SkillBridge)
│   │   └── ui/
│   │       ├── Badge.jsx
│   │       ├── Button.jsx
│   │       ├── Card.jsx
│   │       ├── Input.jsx              # Input, Select, Textarea
│   │       ├── Modal.jsx
│   │       ├── Skeleton.jsx           # SkeletonCard, SkeletonRow
│   │       ├── StatCard.jsx
│   │       ├── Table.jsx
│   │       └── Toast.jsx              # Toast + useToast hook
│   ├── context/
│   │   ├── AppContext.jsx             # Global state + Supabase sync + localStorage cache
│   │   └── AuthContext.jsx            # Supabase auth + demo fallback
│   ├── data/
│   │   └── sampleData.js              # 12 sample employees + fixtures for all 7 tables
│   ├── hooks/
│   │   ├── useAttendance.js           # Attendance stats, daily totals, 30-day trend
│   │   └── useEmployees.js            # Employee list + derived stats
│   ├── lib/
│   │   ├── emailjs.js                 # EmailJS wrappers (5 email functions)
│   │   ├── groq.js                    # Groq AI functions (7 exports)
│   │   ├── supabase.js                # Supabase client + seedTableIfEmpty + fetchAll
│   │   └── utils.js                   # formatCurrency, cn, avatarColor, mulberry32, etc.
│   ├── pages/
│   │   ├── Landing.jsx                # Public marketing page
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── attendance/
│   │   │   └── AttendanceLog.jsx
│   │   ├── employee/
│   │   │   └── EmployeePortal.jsx     # Self-service portal
│   │   ├── employees/
│   │   │   ├── EmployeeDetail.jsx     # 5-tab employee profile
│   │   │   ├── EmployeeForm.jsx
│   │   │   └── EmployeeList.jsx
│   │   ├── onboarding/
│   │   │   └── Onboarding.jsx
│   │   ├── payroll/
│   │   │   ├── PayrollDashboard.jsx
│   │   │   └── Payslip.jsx
│   │   ├── recruitment/
│   │   │   ├── ApplicationTracker.jsx
│   │   │   ├── BiasChecker.jsx
│   │   │   ├── BlindScreener.jsx
│   │   │   ├── JobListings.jsx
│   │   │   └── Recruitment.jsx        # Tab shell
│   │   └── registration/
│   │       └── Registration.jsx       # 4-step registration wizard
│   ├── App.jsx                        # Route definitions
│   ├── index.css                      # Global styles + Tailwind directives
│   └── main.jsx                       # Entry point
├── supabase/
│   └── schema.sql                     # PostgreSQL schema + RLS policies
├── index.html                         # HTML shell + font preconnect
├── tailwind.config.js                 # Design tokens
├── vite.config.js                     # Dev proxy + production chunking
├── vercel.json                        # SPA rewrite + cache headers
└── package.json
```

---

## Pages & Routes

| Path | Component | Description |
|---|---|---|
| `/` | `Landing.jsx` | Public marketing page — hero, live stats, how-it-works, feature grid, CTA |
| `/login` | `Login.jsx` | Email/password login or one-click demo access |
| `/dashboard` | `Dashboard.jsx` | KPI cards, bar/pie/line charts, activity feed, SkillBridge session stats |
| `/employees` | `EmployeeList.jsx` | Searchable, filterable directory with add / edit / deactivate / delete |
| `/employees/:id` | `EmployeeDetail.jsx` | 5-tab profile: Profile, Attendance, Payroll, Documents, Growth Plan |
| `/recruitment` | `Recruitment.jsx` | Tab shell routing to 4 sub-pages |
| `/recruitment?tab=jobs` | `JobListings.jsx` | Create and manage open job postings |
| `/recruitment?tab=tracker` | `ApplicationTracker.jsx` | Drag-and-drop Kanban through 6 hiring stages |
| `/recruitment?tab=screener` | `BlindScreener.jsx` | CV scoring with optional identity redaction + SkillBridge |
| `/recruitment?tab=bias-checker` | `BiasChecker.jsx` | Job description bias scan + neutral AI rewrite |
| `/onboarding` | `Onboarding.jsx` | Per-employee checklist onboarding tracker |
| `/registration` | `Registration.jsx` | 4-step new-hire wizard with auto-generated onboarding plan |
| `/attendance` | `AttendanceLog.jsx` | Daily log, calendar heatmap, leave request workflow |
| `/payroll` | `PayrollDashboard.jsx` | Monthly payroll runner, PAYE + pension auto-calc, payslip export |
| `/employee-portal` | `EmployeePortal.jsx` | Self-service: view payslips, submit leave, check attendance |

---

## Modules & Features

### Dashboard
- Six KPI stat cards: Total Employees, Open Positions, Present Today, Pending Payroll, Hired Candidates, Rejected Candidates
- **Headcount by Department** — vertical bar chart (Recharts `BarChart`)
- **Employment Type** — donut chart (Recharts `PieChart`) with three slices (full-time blue, part-time purple, contract amber)
- **Attendance Trend** — 30-day three-line chart (present green, late amber, absent red)
- **Recent Activity** — timestamped feed of the last 5 HR actions
- **SkillBridge Activity** — session-only panel showing learning paths sent, growth plans generated, and a proportional bar chart of the top 5 skill gaps logged this session

### Employee Management
- Full CRUD — add, view, edit, deactivate / reactivate, remove
- Real-time search across name, employee ID, role, and email
- Filters: Department (7 options), Status (active / inactive / on-leave / probation), Employment Type (full-time / part-time / contract)
- `employee_id` format: `BH-{YEAR}-{N}` where N = max existing numeric suffix + 1 (collision-safe)
- Optimistic UI — changes appear instantly; rolled back with an error toast if Supabase write fails
- Avatar colours: deterministic per-name colour from `mulberry32` seeded PRNG (no photos stored)

### Employee Detail — 5 Tabs
- **Profile** — personal info, bank details, next of kin, employment info with inline edit
- **Attendance** — individual attendance history with status breakdown
- **Payroll** — historical payroll records for this employee
- **Documents** — document management section
- **Growth Plan** (SkillBridge) — generate / view / regenerate / email an AI career growth plan

### Blind Screener
- Load a sample application from dropdown or paste any CV text
- **Blind Mode OFF** — shows an **Identity Card** (name, age, gender, school, location extracted by Groq AI) alongside the AI score
- **Blind Mode ON** — identity card fields display as `[REDACTED]`; a "Score based on skills only" banner appears; the CV is stripped of all personal identifiers before the AI sees it
- AI analysis panel: fit score (0–100), skills match checklist (matched ✓ / missing ✗), list of strengths, list of gaps, recommendation (Advance / Hold / Reject)
- **Reveal Section** (Blind Mode ON only) — side-by-side score comparison with green "Scores match" or amber "Score difference detected" banner and delta value
- **Accept flow** — pre-filled offer email modal → candidate moves to "Offer" stage in Kanban → "Accepted Candidates" section appears below
- **Reject flow** — rejection reason picker → candidate moves to "Rejected" column → "Rejected Candidates Archive" table → SkillBridge Panel slides in below
- **SkillBridge Panel** — AI generates a personalised learning path (candidate level, career trajectory, up to 4 courses, encouragement message); "Email Learning Path" button sends via EmailJS; "Skip — Don't Send" dismisses cleanly

### Job Ad Bias Checker
- Paste any job description and click Scan
- AI returns: bias severity (Low / Medium / High), list of biased phrases with category and suggested neutral replacement, and a complete neutral rewrite of the full JD
- Offline deterministic fallback scans for 19 hardcoded bias patterns across 4 categories when Groq is unavailable

### Application Tracker (Kanban)
- 6 stage columns: Applied → Screening → Interview → Offer → Hired → Rejected
- Drag-and-drop between columns via `@hello-pangea/dnd`
- "Accepted Candidates — Pending Next Stage" section appears when any candidate is marked hired
- Collapsible "Rejected Candidates Archive" table with rejection reasons and timestamps

### Onboarding Tracker
- Per-employee checklists with 4 categories: Documentation, IT Setup, Orientation, Training
- Toggle tasks complete / incomplete (synced to Supabase in real time)
- Checklists are auto-generated when a new employee is registered

### Employee Registration — 4-Step Wizard
- Step 1: Personal information (name, contact details, date of birth, gender)
- Step 2: Job information (department, role, employment type, salary, hire date)
- Step 3: Bank details + next of kin
- Step 4: Review all details + confirm — creates the employee record and seeds their onboarding checklist

### Attendance & Leave
- Daily attendance log with clock-in, clock-out, hours worked, and status (present / late / absent / on-leave)
- 30-day attendance calendar heatmap per employee
- Leave request form (type, date range, reason) with EmailJS notification to HR on submission
- HR approve / reject workflow with EmailJS decision email to the employee

### Payroll
- Monthly payroll run with automatic Nigerian PAYE (Pay As You Earn) tax and pension calculations
- Per-employee records: gross pay, allowances, deductions, tax, pension, net pay, status (pending / paid)
- Printable / downloadable payslip generation
- Pending payroll total surfaced on the Dashboard KPI card
- Confetti animation on successful payroll run

### SkillBridge — AI Career Development
**For rejected candidates (Blind Screener):**
Groq generates: candidate level (Junior / Mid-level / Senior), one-line career trajectory, up to 4 gap-targeted courses (platform, duration, cost, priority), and a warm encouragement message. Courses prioritise free Nigerian platforms (AltSchool Africa, SideHustle, Stutern) then Google / Microsoft free certificates, then paid options as a last resort.

**For existing employees (Employee Detail → Growth Plan tab):**
Groq generates: current level, next career milestone, readiness percentage (progress bar) and months estimate, 3 strengths, 3 growth areas, career path string (e.g. "Junior Dev → Mid → Senior → Tech Lead"), 4 targeted courses, a manager tip, and a motivational message to the employee. Send to employee via EmailJS using their `personal_email`.

SkillBridge session stats (learning paths sent, growth plans generated, skill gaps logged) are tracked in `AppContext` state and displayed on the Dashboard. They reset on page refresh (not persisted).

### Employee Portal (Self-Service)
Separate view for individual employees — not the HR admin interface. Allows employees to view their own payslips, submit leave requests, and review their personal attendance record.

---

## AI Engine — Groq

**Model:** `llama-3.3-70b-versatile`

All Groq calls route through a same-origin proxy (`/api/groq`) — a Vite reverse proxy in development and a Vercel serverless function in production. The real API key never reaches the browser.

All AI functions use `response_format: { type: 'json_object' }` and a normalisation layer that validates and clamps every value before it reaches the UI. Every function (except SkillBridge) has a deterministic offline fallback that works with no network connection.

| Function | Input | Output | Offline fallback |
|---|---|---|---|
| `stripPersonalIdentifiers(text)` | Raw CV text | Redacted CV text | Pure regex — always offline |
| `extractCandidateEmail(text)` | Raw CV text | Email string or null | Pure regex — always offline |
| `extractCandidateIdentity(text)` | Raw CV text | `{ full_name, age, gender, location, school, email, phone }` | Regex + Nigerian name/location lists |
| `scoreCandidate(cv, jd, blindMode)` | CV, JD, blind flag | `{ score, skills_match[], strengths[], gaps[], recommendation, processedCv }` | Keyword-overlap scorer (40–98 range) |
| `checkJobAdBias(jd)` | Job description | `{ bias_score, biased_phrases[], rewritten_jd }` | 19 hardcoded bias pattern matchers |
| `generateLearningPath({ jobRole, score, gaps })` | Role, score, gap list | `{ candidate_level, career_path, job_specific_courses[], encouragement_message }` | `null` — shows "Try Again" |
| `generateGrowthPlan({ employee })` | Employee record | `{ current_level, next_level, readiness_months, readiness_percentage, strengths[], growth_areas[], career_path, courses[], manager_tip, motivation_message }` | `null` — shows "Try Again" |

### Bias Redaction — `stripPersonalIdentifiers`
Multi-pass deterministic regex. Strips and replaces:
- Email addresses → `[EMAIL REDACTED]`
- Phone numbers (Nigerian + international formats) → `[PHONE REDACTED]`
- Labeled name fields ("Name:", "Full Name:") → `[NAME REDACTED]`
- First capitalised line matching a "First Last" name pattern → `[NAME REDACTED]`
- Age mentions in all formats ("Age: 32", "32 years old", "32-year-old", DOB) → `[AGE REDACTED]`
- Gender field + gendered pronouns (he/she/him/her → they/them, himself/herself → themself)
- Salutation prefixes (Mr., Mrs., Miss, Ms., Mx.) → removed
- 40+ Nigerian name fragments across Yoruba, Igbo, and Hausa → `[NAME REDACTED]`
- 16 known Nigerian universities and polytechnics → `[INSTITUTION REDACTED]`
- Generic "X University / X College" patterns → `[INSTITUTION REDACTED]`
- 21 Nigerian city/state names + "Nigeria" / "Nigerian" → `[LOCATION REDACTED]`

---

## Email System — EmailJS

**Service ID:** `service_fds55ah`
**Public Key:** `P9UuShGAcdDINNOl0`

In development, EmailJS is proxied through Vite (`/api/emailjs → https://api.emailjs.com`) to avoid network-level resolution blocks. No changes needed in production — Vercel serves the real domain directly.

| Function | Template | Triggered by | Recipient |
|---|---|---|---|
| `sendLeaveRequestNotification` | `template_9z9rdbi` | Employee submits leave request | HR Manager |
| `sendLeaveDecisionNotification` | `template_lxcl5rl` | HR approves or rejects leave | Employee |
| `sendCandidateDecisionNotification` | `template_lxcl5rl` | Blind Screener Accept or Reject | Candidate |
| `sendSkillBridgeLearningPath` | `template_lxcl5rl` | HR clicks "Email Learning Path to Candidate" | Candidate |
| `sendSkillBridgeGrowthPlan` | `template_lxcl5rl` | HR clicks "Send Growth Plan to Employee" | Employee (personal_email) |

All functions return `{ success: boolean }` and never throw — a failed email never blocks the underlying HR action from completing.

---

## Database — Supabase

**Project:** `cpdsigohnveigjjuhkzh.supabase.co`
**Engine:** PostgreSQL hosted on Supabase with Row Level Security enabled on all tables.

### Tables

#### `employees`
| Column | Type | Constraint |
|---|---|---|
| `id` | UUID | PK, `gen_random_uuid()` |
| `employee_id` | TEXT | UNIQUE NOT NULL |
| `first_name` | TEXT | NOT NULL |
| `last_name` | TEXT | NOT NULL |
| `email` | TEXT | UNIQUE NOT NULL |
| `phone` | TEXT | |
| `date_of_birth` | DATE | |
| `gender` | TEXT | |
| `department` | TEXT | NOT NULL |
| `role` | TEXT | NOT NULL |
| `employment_type` | TEXT | Default `'full-time'` |
| `status` | TEXT | Default `'active'` |
| `salary` | NUMERIC | |
| `hire_date` | DATE | |
| `avatar_url` | TEXT | |
| `bank_name` | TEXT | |
| `account_number` | TEXT | |
| `next_of_kin` | TEXT | |
| `personal_email` | TEXT | Used for SkillBridge growth plan emails |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

#### `jobs`
`id`, `title`, `department`, `description`, `requirements`, `type`, `status` (default `open`), `created_at`

#### `applications`
`id`, `job_id` (FK→jobs, CASCADE), `candidate_name`, `candidate_email`, `candidate_phone`, `candidate_age`, `candidate_gender`, `candidate_school`, `cv_text`, `skills TEXT[]`, `stage`, `blind_score`, `ai_summary`, `is_blinded`, `status`, `rejection_reason`, `decided_at`, `created_at`

#### `onboarding`
`id`, `employee_id` (FK→employees, CASCADE), `task`, `category`, `completed`, `due_date`, `created_at`

#### `attendance`
`id`, `employee_id` (FK→employees, CASCADE), `date`, `clock_in`, `clock_out`, `status`, `hours_worked`, `created_at`

#### `leave_requests`
`id`, `employee_id` (FK→employees, CASCADE), `leave_type`, `start_date`, `end_date`, `reason`, `status` (default `pending`), `created_at`

#### `payroll`
`id`, `employee_id` (FK→employees, CASCADE), `month`, `year`, `basic_salary`, `allowances`, `deductions`, `tax`, `pension`, `net_pay`, `status` (default `pending`), `created_at`

### Row Level Security
RLS is enabled on all 7 tables. For demo purposes, every operation (SELECT, INSERT, UPDATE, DELETE) is open to the `anon` role via `USING (true) WITH CHECK (true)` policies. Tighten these before production.

### Seeding
`seedTableIfEmpty(table, rows)` in `src/lib/supabase.js` runs on app mount for each of the 7 tables. It checks `.select('id').limit(1)` first — if any row exists, it skips entirely. The sample dataset includes 12 employees across 7 departments, 6 open jobs, 20+ applications, 90 days of attendance records, leave requests, and 3 months of payroll history.

---

## State Management

### AppContext (`src/context/AppContext.jsx`)

Single global context for all 7 data domains. Architecture:

1. **Instant first paint** — state initialises from `localStorage` (key `blindhire_cache`, TTL 5 minutes). If valid cache exists, `loading` starts as `false` and the full UI renders immediately with no skeleton screens.
2. **Background sync** — on every mount, seeds empty tables then fetches fresh data from Supabase and updates both React state and the cache silently in the background.
3. **Optimistic mutations** — all writes apply the change to local state immediately, sync to Supabase, and roll back with a toast on failure.

| State slice | Exposed write actions |
|---|---|
| `employees` | `addEmployee`, `updateEmployee`, `deleteEmployee` |
| `jobs` | `addJob`, `updateJob` |
| `applications` | `addApplication`, `updateApplication` |
| `onboarding` | `addOnboardingTasks`, `toggleOnboardingTask` |
| `attendance` | `addAttendanceRecord` |
| `leaveRequests` | `addLeaveRequest`, `updateLeaveRequest` |
| `payroll` | `setPayrollRecords` |
| `skillBridgeStats` | `logLearningPathSent`, `logGrowthPlanGenerated`, `logSkillGaps` |

`skillBridgeStats` is session-only — not persisted to Supabase or cache. Resets on page refresh.

### AuthContext (`src/context/AuthContext.jsx`)
Wraps Supabase email/password auth. When Supabase is not configured (no credentials in `.env`), falls through to demo mode — all routes are accessible without authentication.

---

## Component Library

All components are in `src/components/ui/`.

### Button
**Variants:** `primary` (blue), `secondary` (white + border), `accent` (purple), `success` (green), `danger` (red), `ghost` (transparent), `outline` (primary border + transparent fill)
**Sizes:** `sm` (`px-3 py-1.5 text-xs`), `md` default (`px-4 py-2 text-sm`), `lg` (`px-5 py-2.5 text-base`), `icon` (`p-2`)
Built-in animated loading spinner via `loading` prop.

### Card / CardHeader
White rounded card with `shadow-card`. `CardHeader` accepts `title` and optional `subtitle`.

### Input / Select / Textarea
Uniform label, placeholder, error (red border + message below), and hint text styling. All use `focus:ring-4 focus:ring-primary-100` for consistent focus feedback.

### Badge
Coloured pill. Variants: `default` (slate), `primary` (blue), `accent` (purple), `success` (green), `warning` (amber), `danger` (red). Optional `dot` prop adds a coloured status dot before the label.

### StatCard
Icon container (colour-coded) + label text + bold value. Used on the Dashboard and all module summary rows.

### Table
Column-configurable with a `render` function per column, `onRowClick` handler, sort indicators, and an empty state message prop.

### Modal
Accessible overlay. Size variants: `sm`, `md`, `lg`, `xl`. Closes on backdrop click and Escape key.

### Toast / useToast
`useToast()` hook returns `{ toast, showToast, hideToast }`. Variants: `success`, `error`, `warning`. Auto-dismisses after 4 seconds.

### Skeleton / SkeletonCard / SkeletonRow
Pulse-animated grey placeholders — `SkeletonCard` matches the dimensions of a `StatCard`, `SkeletonRow` matches a table row.

### CourseCard
Shared between `SkillBridgePanel` and `GrowthPlanTab`. Props: `tag` (skill_gap or growth_area), `courseName`, `platform`, `duration`, `cost`, `priority` (optional, candidate panel only), `footer` (optional, employee panel only).
- Cost badge logic: `"Free"` → green badge; starts with `"Free Certificate"` → blue badge; anything else → amber badge with raw cost string.
- Platform icon: YouTube icon if platform contains "youtube", Globe icon otherwise.

---

## Build & Deployment

### Build Command
```bash
npm run build
# Runs: cross-env NODE_OPTIONS=--max-old-space-size=4096 vite build
```
Terser minification strips all `console.log` and `debugger` statements from the production output.

### Code Splitting (Manual Chunks)
| Chunk filename | Contents |
|---|---|
| `react-vendor` | react, react-dom, react-router-dom |
| `supabase` | @supabase/supabase-js |
| `charts` | recharts |
| `ui` | lucide-react, framer-motion |
| `dnd` | @hello-pangea/dnd |

### Vercel Deployment (`vercel.json`)
- **SPA rewrite** — all paths `/*` rewrite to `/index.html` so React Router handles navigation without 404s
- **Asset cache** — `/assets/*` (content-hashed filenames): `Cache-Control: public, max-age=31536000, immutable` (1 year)
- **HTML cache** — all other routes: `Cache-Control: public, max-age=0, must-revalidate`

### Vercel Serverless Function (`api/groq.js`)
Proxies all Groq AI calls server-side. Accepts the same request body the browser sends to `/api/groq`, forwards it to `https://api.groq.com/openai/v1/chat/completions` with the real API key injected from a Vercel environment variable, and streams the response back. The API key is never sent to the client.

---

## Environment Variables

Create a `.env` file in the project root (never commit this file):

```env
# Supabase — https://app.supabase.com → Project Settings → API
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Groq AI — https://console.groq.com/keys
VITE_GROQ_API_KEY=your_groq_api_key
```

The app runs fully without any of these values — it falls back to 12 hardcoded sample employees and a deterministic offline AI scorer with no network calls required.

---

## Local Development

### Prerequisites
- Node.js 18+
- npm 9+

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Add environment variables
cp .env.example .env
# Fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GROQ_API_KEY

# 3. Apply the database schema (one-time)
# Open your Supabase project → SQL Editor → paste contents of supabase/schema.sql → Run

# 4. Start the dev server
npm run dev
# → http://localhost:5173
```

The Vite dev server proxies:
- `/api/groq` → `https://api.groq.com/openai/v1/chat/completions` (Groq AI)
- `/api/emailjs` → `https://api.emailjs.com` (EmailJS)

Both integrations behave identically in development and production.

### Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server on port 5173 with Hot Module Replacement |
| `npm run build` | Production build with terser minification and code splitting |
| `npm run preview` | Serve the production build locally for final checks |
| `npm run lint` | Run ESLint across all source files |

---

## Departments

Seven departments configured across the platform:
`Engineering` · `Product` · `Design` · `Marketing` · `Finance` · `Operations` · `Human Resources`

## Nigerian Localisation

- **Currency** — all monetary values formatted as `₦` (Naira) via `formatCurrency()` in `utils.js`
- **Payroll** — automatic PAYE (Pay As You Earn) tax and Nigerian Pension Act deductions
- **AI prompts** — Groq prompts are Nigerian-market-aware (salary bands, career paths, institutions)
- **Bias redaction** — covers Yoruba, Igbo, and Hausa name fragments; 16 Nigerian universities; 21 Nigerian cities and states
- **SkillBridge courses** — AltSchool Africa, SideHustle, and Stutern prioritised before international platforms; all course recommendations account for low-data accessibility from Nigeria

---

*Built by Ebosetale Victor — BlindHire, 2026*
