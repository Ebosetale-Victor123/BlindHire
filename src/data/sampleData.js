import { subDays, addDays, subMonths, format, isWeekend } from 'date-fns';
import { mulberry32, calculatePayroll } from '../lib/utils';

// ============================================================
// Helpers — all "demo" dates are relative to whenever the app
// is actually opened, so the dashboard always looks current.
// ============================================================
const NOW = new Date();
const toISODate = (d) => format(d, 'yyyy-MM-dd');
const toISO = (d) => d.toISOString();

export const daysAgo = (n) => toISODate(subDays(NOW, n));
export const daysFromNow = (n) => toISODate(addDays(NOW, n));
export const isoDaysAgo = (n) => toISO(subDays(NOW, n));

// ============================================================
// Reference lists for forms / filters
// ============================================================
export const DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Marketing', 'Operations'];

export function generateDepartments() {
  return [
    { name: 'Engineering', head_of_department: 'Adeyemi Oluwaseun' },
    { name: 'HR',          head_of_department: 'Aisha Abubakar' },
    { name: 'Finance',     head_of_department: 'Tunde Adebayo' },
    { name: 'Marketing',   head_of_department: 'Ibrahim Musa' },
    { name: 'Operations',  head_of_department: null },
  ];
}
export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract'];
export const EMPLOYEE_STATUSES = ['active', 'on-leave', 'probation', 'inactive'];
export const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];
export const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Casual Leave', 'Maternity Leave', 'Compassionate Leave'];
export const NIGERIAN_BANKS = [
  'Access Bank', 'Citibank Nigeria', 'Ecobank Nigeria', 'Fidelity Bank', 'First Bank',
  'First City Monument Bank (FCMB)', 'GTBank', 'Heritage Bank', 'Keystone Bank', 'Kuda Bank',
  'Moniepoint MFB', 'Opay', 'Polaris Bank', 'Providus Bank', 'Stanbic IBTC Bank',
  'Standard Chartered Bank', 'Sterling Bank', 'UBA', 'Union Bank', 'Unity Bank',
  'Wema Bank', 'Zenith Bank',
];
export const LEAVE_ENTITLEMENT_DAYS = 20;
export const APPLICATION_STAGES = ['applied', 'screened', 'interview', 'offer', 'hired', 'rejected'];

// ============================================================
// Fixed UUIDs (valid hex) so foreign-key relationships work
// whether seeding to Supabase or running on local sample data
// ============================================================
const emp = (n) => `e0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const job = (n) => `f0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const app = (n) => `30000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const ob = (n) => `40000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const att = (n) => `50000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const leave = (n) => `60000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const pay = (n) => `70000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export const E = {
  ADEYEMI: emp(1), CHINONSO: emp(2), NGOZI: emp(3), AISHA: emp(4), FOLAKE: emp(5),
  TUNDE: emp(6), CHIAMAKA: emp(7), IBRAHIM: emp(8), FUNMILAYO: emp(9),
  YUSUF: emp(10), BLESSING: emp(11), EMEKA: emp(12),
};

export const J = {
  BACKEND: job(1), FRONTEND: job(2), HR_BP: job(3), FIN_ANALYST: job(4),
  MARKETING: job(5), OPS_ANALYST: job(6),
};

// ============================================================
// 1. EMPLOYEES (12) — Engineering, HR, Finance, Marketing, Operations
// ============================================================
export const employees = [
  {
    id: E.ADEYEMI, employee_id: 'BH-2021-1001', first_name: 'Adeyemi', last_name: 'Oluwaseun',
    email: 'adeyemi.oluwaseun@blindhire.ng', personal_email: 'adeyemi.oluwaseun.ng@gmail.com', phone: '+234 803 214 5566',
    department: 'Engineering', role: 'Senior Software Engineer', employment_type: 'full-time',
    status: 'active', salary: 950000, hire_date: '2021-03-15', avatar_url: null,
    bank_name: 'GTBank', account_number: '0123456789', next_of_kin: 'Bukola Oluwaseun (Spouse)',
    skills: ['Node.js', 'PostgreSQL', 'AWS', 'Docker', 'System Design', 'Microservices', 'Redis', 'CI/CD'],
    created_at: '2021-03-15T09:00:00Z',
  },
  {
    id: E.CHINONSO, employee_id: 'BH-2022-1002', first_name: 'Chinonso', last_name: 'Okonkwo',
    email: 'chinonso.okonkwo@blindhire.ng', personal_email: 'chinonso.okonkwo.ng@gmail.com', phone: '+234 805 332 1190',
    department: 'Engineering', role: 'Frontend Developer', employment_type: 'full-time',
    status: 'active', salary: 600000, hire_date: '2022-06-01', avatar_url: null,
    bank_name: 'Access Bank', account_number: '0234567891', next_of_kin: 'Adaeze Okonkwo (Sister)',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Redux', 'JavaScript', 'Figma', 'REST APIs', 'Git'],
    created_at: '2022-06-01T09:00:00Z',
  },
  {
    id: E.NGOZI, employee_id: 'BH-2022-1003', first_name: 'Ngozi', last_name: 'Eze',
    email: 'ngozi.eze@blindhire.ng', personal_email: 'ngozi.eze.ng@gmail.com', phone: '+234 706 884 2231',
    department: 'Engineering', role: 'Backend Developer', employment_type: 'full-time',
    status: 'active', salary: 650000, hire_date: '2022-09-12', avatar_url: null,
    bank_name: 'Zenith Bank', account_number: '0345678912', next_of_kin: 'Obiora Eze (Brother)',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'Docker', 'REST APIs', 'Redis', 'Git', 'Jest'],
    created_at: '2022-09-12T09:00:00Z',
  },
  {
    id: E.AISHA, employee_id: 'BH-2020-1004', first_name: 'Aisha', last_name: 'Abubakar',
    email: 'aisha.abubakar@blindhire.ng', personal_email: 'aisha.abubakar.ng@gmail.com', phone: '+234 802 119 4477',
    department: 'HR', role: 'HR Manager', employment_type: 'full-time',
    status: 'active', salary: 800000, hire_date: '2020-01-20', avatar_url: null,
    bank_name: 'First Bank', account_number: '0456789123', next_of_kin: 'Ibrahim Abubakar (Spouse)',
    skills: ['Recruitment', 'Employee Relations', 'HRIS', 'Labour Law', 'Performance Management', 'Workforce Planning'],
    created_at: '2020-01-20T09:00:00Z',
  },
  {
    id: E.FOLAKE, employee_id: 'BH-2023-1005', first_name: 'Folake', last_name: 'Balogun',
    email: 'folake.balogun@blindhire.ng', personal_email: 'folake.balogun.ng@gmail.com', phone: '+234 813 776 2204',
    department: 'HR', role: 'HR Officer', employment_type: 'contract',
    status: 'active', salary: 350000, hire_date: '2023-04-10', avatar_url: null,
    bank_name: 'UBA', account_number: '0567891234', next_of_kin: 'Tola Balogun (Mother)',
    skills: ['Onboarding', 'Employee Records', 'HRIS', 'Recruitment Coordination', 'Leave Administration'],
    created_at: '2023-04-10T09:00:00Z',
  },
  {
    id: E.TUNDE, employee_id: 'BH-2019-1006', first_name: 'Tunde', last_name: 'Adebayo',
    email: 'tunde.adebayo@blindhire.ng', personal_email: 'tunde.adebayo.ng@gmail.com', phone: '+234 701 558 9012',
    department: 'Finance', role: 'Finance Manager', employment_type: 'full-time',
    status: 'active', salary: 850000, hire_date: '2019-11-05', avatar_url: null,
    bank_name: 'Zenith Bank', account_number: '0678912345', next_of_kin: 'Yetunde Adebayo (Spouse)',
    skills: ['Financial Reporting', 'Budgeting', 'Forecasting', 'IFRS', 'Excel', 'SAP'],
    created_at: '2019-11-05T09:00:00Z',
  },
  {
    id: E.CHIAMAKA, employee_id: 'BH-2021-1007', first_name: 'Chiamaka', last_name: 'Nwosu',
    email: 'chiamaka.nwosu@blindhire.ng', personal_email: 'chiamaka.nwosu.ng@gmail.com', phone: '+234 809 442 7765',
    department: 'Finance', role: 'Accountant', employment_type: 'full-time',
    status: 'on-leave', salary: 400000, hire_date: '2021-07-19', avatar_url: null,
    bank_name: 'Fidelity Bank', account_number: '0789123456', next_of_kin: 'Emeka Nwosu (Father)',
    skills: ['Bookkeeping', 'Reconciliation', 'IFRS', 'Excel', 'Accounts Payable', 'Tax Filing'],
    created_at: '2021-07-19T09:00:00Z',
  },
  {
    id: E.IBRAHIM, employee_id: 'BH-2020-1008', first_name: 'Ibrahim', last_name: 'Musa',
    email: 'ibrahim.musa@blindhire.ng', personal_email: 'ibrahim.musa.ng@gmail.com', phone: '+234 816 220 3398',
    department: 'Marketing', role: 'Marketing Manager', employment_type: 'full-time',
    status: 'active', salary: 650000, hire_date: '2020-05-22', avatar_url: null,
    bank_name: 'Access Bank', account_number: '0891234567', next_of_kin: 'Hauwa Musa (Spouse)',
    skills: ['Brand Strategy', 'Campaign Management', 'SEO', 'Google Ads', 'Analytics', 'Budget Management'],
    created_at: '2020-05-22T09:00:00Z',
  },
  {
    id: E.FUNMILAYO, employee_id: 'BH-2023-1009', first_name: 'Funmilayo', last_name: 'Ojo',
    email: 'funmilayo.ojo@blindhire.ng', personal_email: 'funmilayo.ojo.ng@gmail.com', phone: '+234 902 661 5530',
    department: 'Marketing', role: 'Content Strategist', employment_type: 'contract',
    status: 'active', salary: 300000, hire_date: '2023-08-14', avatar_url: null,
    bank_name: 'GTBank', account_number: '0912345678', next_of_kin: 'Ade Ojo (Brother)',
    skills: ['Content Strategy', 'Copywriting', 'SEO', 'Social Media', 'Canva', 'Email Marketing'],
    created_at: '2023-08-14T09:00:00Z',
  },
  {
    id: E.YUSUF, employee_id: 'BH-2026-1010', first_name: 'Yusuf', last_name: 'Garba',
    email: 'yusuf.garba@blindhire.ng', personal_email: 'yusuf.garba.ng@gmail.com', phone: '+234 814 990 1123',
    department: 'Operations', role: 'Operations Analyst', employment_type: 'full-time',
    status: 'probation', salary: 500000, hire_date: daysAgo(9), avatar_url: null,
    bank_name: 'UBA', account_number: '1023456789', next_of_kin: 'Amina Garba (Spouse)',
    skills: ['Data Analysis', 'Excel', 'Process Improvement', 'ERP', 'Supply Chain', 'Power BI'],
    created_at: isoDaysAgo(9),
  },
  {
    id: E.BLESSING, employee_id: 'BH-2026-1011', first_name: 'Blessing', last_name: 'Chukwu',
    email: 'blessing.chukwu@blindhire.ng', personal_email: 'blessing.chukwu.ng@gmail.com', phone: '+234 705 334 8821',
    department: 'Operations', role: 'Logistics Coordinator', employment_type: 'full-time',
    status: 'probation', salary: 320000, hire_date: daysAgo(7), avatar_url: null,
    bank_name: 'Fidelity Bank', account_number: '1134567890', next_of_kin: 'Chidinma Chukwu (Sister)',
    skills: ['Logistics', 'Inventory Management', 'Vendor Management', 'ERP', 'Excel'],
    created_at: isoDaysAgo(7),
  },
  {
    id: E.EMEKA, employee_id: 'BH-2026-1012', first_name: 'Emeka', last_name: 'Okafor',
    email: 'emeka.okafor@blindhire.ng', personal_email: 'vicmanstudios@gmail.com', phone: '+234 810 776 4432',
    department: 'Engineering', role: 'DevOps Engineer', employment_type: 'part-time',
    status: 'probation', salary: 450000, hire_date: daysAgo(5), avatar_url: null,
    bank_name: 'Zenith Bank', account_number: '1245678901', next_of_kin: 'Ifeoma Okafor (Mother)',
    skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Linux', 'Monitoring'],
    created_at: isoDaysAgo(5),
  },
];

// ============================================================
// 2. JOBS (6 open positions)
// ============================================================
export const jobs = [
  {
    id: J.BACKEND, title: 'Senior Backend Engineer', department: 'Engineering',
    description: 'We are looking for a Senior Backend Engineer to design, build and scale the APIs and services that power BlindHire\'s HR platform. You will work closely with product and frontend teams to ship reliable, well-tested features.',
    requirements: '- 5+ years building production backend services\n- Strong experience with Node.js or Python\n- Solid understanding of PostgreSQL and database design\n- Experience with Docker and AWS\n- Excellent problem-solving and communication skills',
    type: 'full-time', status: 'open', salary_range: '₦900,000 - ₦1,500,000 / month', created_at: isoDaysAgo(21),
  },
  {
    id: J.FRONTEND, title: 'Frontend Developer (React)', department: 'Engineering',
    description: 'Join our product engineering team to build delightful, accessible interfaces for our HR and recruitment dashboards using React and Tailwind CSS.',
    requirements: '- 2+ years professional experience with React\n- Strong CSS / Tailwind skills\n- Familiarity with REST APIs and state management\n- Eye for detail and clean UI implementation',
    type: 'full-time', status: 'open', salary_range: '₦450,000 - ₦750,000 / month', created_at: isoDaysAgo(16),
  },
  {
    id: J.HR_BP, title: 'HR Business Partner', department: 'HR',
    description: 'Partner with department leads to drive recruitment, employee relations and performance management initiatives across the company.',
    requirements: '- 4+ years HR generalist or business partner experience\n- Strong knowledge of Nigerian labour law\n- Experience with HRIS systems\n- Excellent interpersonal and conflict-resolution skills',
    type: 'full-time', status: 'open', salary_range: '₦600,000 - ₦900,000 / month', created_at: isoDaysAgo(9),
  },
  {
    id: J.FIN_ANALYST, title: 'Financial Analyst', department: 'Finance',
    description: 'Support the Finance team with budgeting, forecasting and financial reporting to help leadership make informed decisions.',
    requirements: '- Bachelor\'s degree in Finance, Accounting or related field\n- Advanced Excel and financial modeling skills\n- Experience with SAP or similar ERP\n- Strong analytical and presentation skills',
    type: 'full-time', status: 'open', salary_range: '₦450,000 - ₦700,000 / month', created_at: isoDaysAgo(26),
  },
  {
    id: J.MARKETING, title: 'Digital Marketing Specialist', department: 'Marketing',
    description: 'Plan and execute digital campaigns across social, search and email channels to grow brand awareness and lead generation.',
    requirements: '- 2+ years digital marketing experience\n- Hands-on experience with SEO and Google Ads\n- Strong content and analytics skills\n- Creative mindset with a data-driven approach',
    type: 'contract', status: 'open', salary_range: '₦250,000 - ₦400,000 / month', created_at: isoDaysAgo(5),
  },
  {
    id: J.OPS_ANALYST, title: 'Operations Analyst', department: 'Operations',
    description: 'Analyze operational workflows, identify inefficiencies and support process improvement projects across the organization.',
    requirements: '- 3+ years in operations or supply chain analysis\n- Strong Excel / data analysis skills\n- Experience with ERP or inventory management systems\n- Process improvement mindset',
    type: 'full-time', status: 'open', salary_range: '₦400,000 - ₦650,000 / month', created_at: isoDaysAgo(13),
  },
];

// ============================================================
// 3. APPLICATIONS (15) across the 6 jobs
// ============================================================
export const applications = [
  // --- Senior Backend Engineer (4) ---
  {
    id: app(1), job_id: J.BACKEND, candidate_name: 'Tobiloba Akinwunmi',
    candidate_email: 'tobiloba.akinwunmi@gmail.com', candidate_phone: '+234 803 555 1122',
    candidate_age: 29, candidate_gender: 'Male', candidate_school: 'University of Lagos',
    cv_text: `Tobiloba Akinwunmi
Phone: +234 803 555 1122 | Email: tobiloba.akinwunmi@gmail.com
Age: 29 | Gender: Male | University of Lagos

Professional Summary:
Backend engineer with 6 years of experience designing and scaling APIs and microservices for high-volume fintech platforms. Passionate about clean architecture, observability and mentoring junior developers.

Skills: Node.js, PostgreSQL, AWS, Docker, Python, Redis, System Design, CI/CD, REST APIs, Kafka

Experience:
Senior Backend Developer, Paystack (2021 - Present)
- Built and maintained payment processing services handling 2M+ transactions monthly across NGN, USD and GHS corridors.
- Migrated legacy services to Docker containers on AWS ECS, cutting deployment time by 60% and on-call incidents by a third.
- Introduced Redis-based rate limiting that reduced downstream API errors during peak traffic by 45%.

Backend Developer, Andela (2018 - 2021)
- Developed REST APIs for partner client projects using Node.js and PostgreSQL, supporting clients across Nigeria and the US.
- Wrote integration tests and CI pipelines that raised test coverage from 40% to 85%.

Education: B.Sc. Computer Science, University of Lagos (2014 - 2018)
Certifications: AWS Certified Solutions Architect – Associate`,
    skills: ['Node.js', 'PostgreSQL', 'AWS', 'Docker', 'Python', 'Redis', 'System Design', 'CI/CD'],
    stage: 'interview', blind_score: 88,
    ai_summary: 'Strong backend fundamentals with direct experience scaling production APIs on AWS. Excellent fit for the Senior Backend Engineer role.',
    is_blinded: true, created_at: isoDaysAgo(18),
  },
  {
    id: app(2), job_id: J.BACKEND, candidate_name: 'Grace Effiong',
    candidate_email: 'grace.effiong@gmail.com', candidate_phone: '+234 807 221 9034',
    candidate_age: 31, candidate_gender: 'Female', candidate_school: 'University of Benin',
    cv_text: `Grace Effiong
Phone: +234 807 221 9034 | Email: grace.effiong@gmail.com
Age: 31 | Gender: Female | University of Benin

Professional Summary:
Backend engineer with 7 years of experience designing and scaling APIs and microservices for high-volume banking platforms. Focused on reliable architecture, performance tuning and developer productivity.

Skills: Node.js, PostgreSQL, AWS, Docker, Python, Redis, System Design, CI/CD, REST APIs, Kafka

Experience:
Senior Backend Engineer, Access Bank – Digital Banking Group (2021 - Present)
- Designed and scaled core banking APIs handling 2.5M+ transactions monthly across the bank's mobile and internet banking channels.
- Migrated key services to Docker containers on AWS, cutting deployment time by over half and improving release frequency.
- Implemented Redis-based caching that reduced average API response time by 40% during peak hours.

Backend Developer, Zenith Bank – Technology Innovation Team (2017 - 2021)
- Built REST APIs powering the bank's mobile banking app, supporting millions of active users.
- Set up CI pipelines and automated testing, raising test coverage from 35% to 80%.

Education: B.Sc. Computer Science, University of Benin (2012 - 2016)
Certifications: AWS Certified Solutions Architect – Associate`,
    skills: ['Node.js', 'PostgreSQL', 'AWS', 'Docker', 'Python', 'Redis', 'System Design', 'CI/CD'],
    stage: 'offer', blind_score: 90,
    ai_summary: 'Strong backend fundamentals with direct experience scaling production APIs on AWS for a high-volume banking platform. Excellent fit for the Senior Backend Engineer role.',
    is_blinded: true, created_at: isoDaysAgo(20),
  },
  {
    id: app(3), job_id: J.BACKEND, candidate_name: 'Daniel Okoro',
    candidate_email: 'daniel.okoro@yahoo.com', candidate_phone: '+234 812 904 5567',
    candidate_age: 26, candidate_gender: 'Male', candidate_school: 'Federal University of Technology Akure',
    cv_text: `Daniel Okoro
Phone: +234 812 904 5567 | Email: daniel.okoro@yahoo.com
Age: 26 | Gender: Male | Federal University of Technology Akure

Professional Summary:
Backend developer with 3 years of experience building Python web applications, internal tools and reporting APIs for fintech products.

Skills: Python, Django, PostgreSQL, Redis, Celery, REST APIs, Docker, Git

Experience:
Backend Developer, Flutterwave (2022 - Present)
- Built internal admin tools and reporting APIs using Django and PostgreSQL, used daily by the finance and support teams.
- Set up Celery task queues for async settlement reports, cutting report generation time from 10 minutes to under 1 minute.
- Containerized services with Docker for consistent staging and production environments.

Junior Developer, Decagon (2021 - 2022)
- Built a savings app backend (Python/Django) as part of a fintech bootcamp capstone, including wallet, transactions and notification modules.

Education: B.Tech Computer Engineering, Federal University of Technology Akure (2017 - 2021)`,
    skills: ['Python', 'Django', 'PostgreSQL', 'Redis', 'Celery', 'REST APIs', 'Docker', 'Git'],
    stage: 'applied', blind_score: null,
    ai_summary: null, is_blinded: false, created_at: isoDaysAgo(2),
  },
  {
    id: app(4), job_id: J.BACKEND, candidate_name: 'Abdullahi Sani',
    candidate_email: 'abdullahi.sani@outlook.com', candidate_phone: '+234 816 332 7741',
    candidate_age: 31, candidate_gender: 'Male', candidate_school: 'Bayero University Kano',
    cv_text: `Abdullahi Sani
Phone: +234 816 332 7741 | Email: abdullahi.sani@outlook.com
Age: 31 | Gender: Male | Bayero University Kano

Professional Summary:
Backend developer with 5 years of experience building Node.js services and containerized deployments for logistics and e-commerce platforms.

Skills: Node.js, Express, MongoDB, Docker, CI/CD, GraphQL, Microservices, Git

Experience:
Backend Developer, Kobo360 (2020 - Present)
- Built logistics tracking APIs in Node.js and MongoDB used by drivers, shippers and the operations dashboard.
- Deployed services via Docker on Azure with CI/CD pipelines, reducing release cycles from weekly to daily.
- Introduced a GraphQL gateway that consolidated 6 REST endpoints into a single API for the mobile app team.

Software Developer, Konga (2018 - 2020)
- Maintained product catalog and pricing services for the e-commerce platform.

Education: B.Sc. Computer Science, Bayero University Kano (2013 - 2017)`,
    skills: ['Node.js', 'Express', 'MongoDB', 'Docker', 'CI/CD', 'GraphQL', 'Microservices', 'Git'],
    stage: 'screened', blind_score: 76,
    ai_summary: 'Solid Node.js experience but limited exposure to PostgreSQL and AWS specified in the job description.',
    is_blinded: true, created_at: isoDaysAgo(12),
  },

  // --- Frontend Developer (React) (3) ---
  {
    id: app(5), job_id: J.FRONTEND, candidate_name: 'Chiamaka Obi',
    candidate_email: 'chiamaka.obi@gmail.com', candidate_phone: '+234 909 112 4456',
    candidate_age: 24, candidate_gender: 'Female', candidate_school: 'Covenant University',
    cv_text: `Chiamaka Obi
Phone: +234 909 112 4456 | Email: chiamaka.obi@gmail.com
Age: 24 | Gender: Female | Covenant University

Professional Summary:
Frontend developer with 2 years of experience building responsive, accessible React applications for fintech dashboards.

Skills: React, JavaScript, TypeScript, Redux, Tailwind CSS, Figma, REST APIs, Git

Experience:
Frontend Developer, Carbon (2023 - Present)
- Built customer-facing loan and savings dashboards using React and TypeScript, improving page load times by 30%.
- Collaborated with designers in Figma to implement a new component library adopted across 4 product teams.
- Integrated REST APIs for real-time account balances and transaction history.

Intern Frontend Developer, Semicolon Africa (2022 - 2023)
- Built reusable UI components in React for a fellowship cohort project, following Tailwind CSS design guidelines.

Education: B.Sc. Computer Science, Covenant University (2018 - 2022)`,
    skills: ['React', 'JavaScript', 'TypeScript', 'Redux', 'Tailwind CSS', 'Figma', 'REST APIs', 'Git'],
    stage: 'interview', blind_score: 85,
    ai_summary: 'Strong React and TypeScript skills with relevant production experience building dashboards.',
    is_blinded: true, created_at: isoDaysAgo(14),
  },
  {
    id: app(6), job_id: J.FRONTEND, candidate_name: 'Samuel Adeniran',
    candidate_email: 'samuel.adeniran@gmail.com', candidate_phone: '+234 803 778 2210',
    candidate_age: 27, candidate_gender: 'Male', candidate_school: 'Lagos State University',
    cv_text: `Samuel Adeniran
Phone: +234 803 778 2210 | Email: samuel.adeniran@gmail.com
Age: 27 | Gender: Male | Lagos State University

Professional Summary:
Frontend developer with 3 years of experience focused on design systems and component-driven development with React.

Skills: React, JavaScript, Redux, Figma, CSS, Tailwind CSS, REST APIs, Git

Experience:
Frontend Developer, Piggyvest (2021 - Present)
- Maintain the company design system in Figma and build new savings and investment product UIs in React and Tailwind CSS.
- Refactored the onboarding flow, reducing drop-off by 18% through improved form validation and microcopy.

Frontend Developer, MTN Nigeria – Digital Self-Service Team (2019 - 2021)
- Built customer self-service portal screens in React, integrating REST APIs for airtime, data and billing.
- Worked with QA to set up component-level testing with Jest and React Testing Library.

Education: HND Computer Science, Lagos State University (2016 - 2019)`,
    skills: ['React', 'JavaScript', 'Redux', 'Figma', 'CSS', 'Tailwind CSS', 'REST APIs', 'Git'],
    stage: 'applied', blind_score: null,
    ai_summary: null, is_blinded: false, created_at: isoDaysAgo(3),
  },
  {
    id: app(7), job_id: J.FRONTEND, candidate_name: 'Patience Etim',
    candidate_email: 'patience.etim@yahoo.com', candidate_phone: '+234 802 556 9981',
    candidate_age: 23, candidate_gender: 'Female', candidate_school: 'University of Uyo',
    cv_text: `Patience Etim
Phone: +234 802 556 9981 | Email: patience.etim@yahoo.com
Age: 23 | Gender: Female | University of Uyo

Professional Summary:
Junior frontend developer with 1 year of experience building marketing websites with HTML, CSS, Bootstrap and Vue.js.

Skills: HTML, CSS, JavaScript, Vue.js, Bootstrap, Git

Experience:
Frontend Developer, Local Web Agency (2023 - Present)
- Built and maintained marketing websites for small businesses using Vue.js and Bootstrap.
- Improved mobile responsiveness across 10+ client sites, raising mobile usability scores from around 60 to 90+.

Education: B.Sc. Computer Science, University of Uyo (2019 - 2023)`,
    skills: ['HTML', 'CSS', 'JavaScript', 'Vue.js', 'Bootstrap', 'Git'],
    stage: 'screened', blind_score: 64,
    ai_summary: 'Promising junior candidate but lacks direct React experience required for this role.',
    is_blinded: true, created_at: isoDaysAgo(11),
  },

  // --- HR Business Partner (2) ---
  {
    id: app(8), job_id: J.HR_BP, candidate_name: 'Halima Yakubu',
    candidate_email: 'halima.yakubu@gmail.com', candidate_phone: '+234 806 223 4471',
    candidate_age: 35, candidate_gender: 'Female', candidate_school: 'Ahmadu Bello University',
    cv_text: `Halima Yakubu
Phone: +234 806 223 4471 | Email: halima.yakubu@gmail.com
Age: 35 | Gender: Female | Ahmadu Bello University

Professional Summary:
HR professional with 10 years of experience in recruitment, employee relations and HRIS administration across the banking and technology sectors.

Skills: Recruitment, Employee Relations, HRIS, Labour Law, Performance Management, Workforce Planning

Experience:
Senior HR Business Partner, Sterling Bank (2018 - Present)
- Partner with department heads on workforce planning for 5 business units totalling 600+ staff.
- Manage disciplinary processes and grievance resolution in line with Nigerian labour law, reducing escalations to legal by 50%.
- Led the HRIS migration to a cloud platform, training 40+ HR staff on the new system.

HR Officer, Union Bank (2014 - 2018)
- Managed recruitment pipelines and onboarding for over 200 hires across branches nationwide.

Education: B.Sc. Industrial Relations & Personnel Management, Ahmadu Bello University (2009 - 2013)
Certifications: CIPM (Chartered Institute of Personnel Management of Nigeria)`,
    skills: ['Recruitment', 'Employee Relations', 'HRIS', 'Labour Law', 'Performance Management', 'Workforce Planning'],
    stage: 'hired', blind_score: 90,
    ai_summary: 'Extensive HR business partner experience with strong labour law knowledge. Excellent fit, recommended for hire.',
    is_blinded: true, created_at: isoDaysAgo(25),
  },
  {
    id: app(9), job_id: J.HR_BP, candidate_name: 'Victor Nnamdi',
    candidate_email: 'victor.nnamdi@gmail.com', candidate_phone: '+234 813 990 2245',
    candidate_age: 30, candidate_gender: 'Male', candidate_school: 'University of Nigeria Nsukka',
    cv_text: `Victor Nnamdi
Phone: +234 813 990 2245 | Email: victor.nnamdi@gmail.com
Age: 30 | Gender: Male | University of Nigeria Nsukka

Professional Summary:
HR generalist with 5 years of experience supporting talent acquisition, payroll operations and employee engagement initiatives.

Skills: Talent Acquisition, Performance Management, Payroll, Onboarding, HRIS, Employee Engagement

Experience:
HR Generalist, Jumia Nigeria (2020 - Present)
- Manage end-to-end recruitment for tech and operations roles, reducing average time-to-hire from 35 to 22 days.
- Support monthly payroll processing for 150+ staff and resolve payroll queries.
- Run quarterly employee engagement surveys and present findings to leadership.

HR Assistant, Konga (2018 - 2020)
- Coordinated new hire onboarding, documentation and ID issuance for incoming staff.

Education: B.Sc. Business Administration, University of Nigeria Nsukka (2014 - 2018)`,
    skills: ['Talent Acquisition', 'Performance Management', 'Payroll', 'Onboarding', 'HRIS', 'Employee Engagement'],
    stage: 'applied', blind_score: null,
    ai_summary: null, is_blinded: false, created_at: isoDaysAgo(1),
  },

  // --- Financial Analyst (2) ---
  {
    id: app(10), job_id: J.FIN_ANALYST, candidate_name: 'Esther Babalola',
    candidate_email: 'esther.babalola@gmail.com', candidate_phone: '+234 805 661 7723',
    candidate_age: 28, candidate_gender: 'Female', candidate_school: 'Obafemi Awolowo University',
    cv_text: `Esther Babalola
Phone: +234 805 661 7723 | Email: esther.babalola@gmail.com
Age: 28 | Gender: Female | Obafemi Awolowo University

Professional Summary:
Financial analyst with 4 years of experience in budgeting, forecasting and financial modeling within the FMCG sector.

Skills: Excel, Financial Modeling, SAP, Forecasting, Variance Analysis, Power BI

Experience:
Financial Analyst, Nestle Nigeria (2021 - Present)
- Build monthly forecasting models and variance reports for the supply chain division using SAP and advanced Excel.
- Developed a Power BI dashboard that cut month-end reporting time from 5 days to 2 days.
- Partner with procurement to track raw material cost variances against budget.

Finance Associate, PwC Nigeria (2019 - 2021)
- Supported audit engagements for manufacturing and consumer goods clients, reviewing financial statements for IFRS compliance.

Education: B.Sc. Accounting, Obafemi Awolowo University (2014 - 2018)
Certifications: ACA (in view) – Institute of Chartered Accountants of Nigeria`,
    skills: ['Excel', 'Financial Modeling', 'SAP', 'Forecasting', 'Variance Analysis', 'Power BI'],
    stage: 'screened', blind_score: 81,
    ai_summary: 'Strong financial modeling background with relevant SAP experience. Good match for the role.',
    is_blinded: true, created_at: isoDaysAgo(15),
  },
  {
    id: app(11), job_id: J.FIN_ANALYST, candidate_name: 'Michael Etuk',
    candidate_email: 'michael.etuk@gmail.com', candidate_phone: '+234 807 332 8841',
    candidate_age: 33, candidate_gender: 'Male', candidate_school: 'University of Calabar',
    cv_text: `Michael Etuk
Phone: +234 807 332 8841 | Email: michael.etuk@gmail.com
Age: 33 | Gender: Male | University of Calabar

Professional Summary:
Accountant with 7 years of experience in financial reporting, budgeting and reconciliations for a large manufacturing group.

Skills: Accounting, IFRS, Budgeting, Excel, Reconciliation, SAP

Experience:
Senior Accountant, Dangote Group (2017 - Present)
- Prepare monthly management accounts and lead budget consolidation for two business units with combined revenue of over ₦8 billion.
- Manage bank and intercompany reconciliations across 6 subsidiary accounts.
- Support year-end audits and ensure compliance with IFRS reporting standards.

Education: B.Sc. Accounting, University of Calabar (2010 - 2014)
Certifications: ACCA Part Qualified`,
    skills: ['Accounting', 'IFRS', 'Budgeting', 'Excel', 'Reconciliation', 'SAP'],
    stage: 'applied', blind_score: null,
    ai_summary: null, is_blinded: false, created_at: isoDaysAgo(4),
  },

  // --- Digital Marketing Specialist (2) ---
  {
    id: app(12), job_id: J.MARKETING, candidate_name: 'Zainab Lawal',
    candidate_email: 'zainab.lawal@gmail.com', candidate_phone: '+234 816 224 5590',
    candidate_age: 25, candidate_gender: 'Female', candidate_school: 'Bayero University Kano',
    cv_text: `Zainab Lawal
Phone: +234 816 224 5590 | Email: zainab.lawal@gmail.com
Age: 25 | Gender: Female | Bayero University Kano

Professional Summary:
Digital marketer with 3 years of experience running paid search, social and email campaigns for e-commerce brands.

Skills: SEO, Google Ads, Content Strategy, Analytics, Social Media, Email Marketing

Experience:
Digital Marketing Executive, Jumia (2022 - Present)
- Manage Google Ads campaigns with monthly budgets of ₦5M+, improving ROAS by 35% over 6 months.
- Run weekly email campaigns to a 200k+ subscriber list, growing open rates from 18% to 27%.
- Build monthly performance reports using Google Analytics and Looker Studio.

Marketing Intern, Cars45 (2021 - 2022)
- Supported the social media content calendar and conducted SEO audits for the company blog.

Education: B.Sc. Mass Communication, Bayero University Kano (2017 - 2021)`,
    skills: ['SEO', 'Google Ads', 'Content Strategy', 'Analytics', 'Social Media', 'Email Marketing'],
    stage: 'interview', blind_score: 79,
    ai_summary: 'Solid hands-on paid media experience with measurable results. Good fit for the contract role.',
    is_blinded: true, created_at: isoDaysAgo(8),
  },
  {
    id: app(13), job_id: J.MARKETING, candidate_name: 'Kelechi Anyanwu',
    candidate_email: 'kelechi.anyanwu@gmail.com', candidate_phone: '+234 803 110 6678',
    candidate_age: 29, candidate_gender: 'Male', candidate_school: 'Imo State University',
    cv_text: `Kelechi Anyanwu
Phone: +234 803 110 6678 | Email: kelechi.anyanwu@gmail.com
Age: 29 | Gender: Male | Imo State University

Professional Summary:
Social media manager with 4 years of experience growing brand audiences across Instagram, TikTok and X for financial services and SME clients.

Skills: Social Media Marketing, Branding, Canva, SEO, Copywriting, Content Strategy

Experience:
Social Media Manager, GTBank (2021 - Present)
- Grew Instagram following from 50k to 250k through campaign storytelling and influencer partnerships.
- Plan and execute a monthly content calendar across 4 platforms, increasing average engagement rate by 22%.
- Write copy for product launch campaigns in collaboration with the brand team.

Content Creator, Freelance (2019 - 2021)
- Produced branded content (graphics, captions, short videos) for SME clients across retail and hospitality.

Education: B.A. English, Imo State University (2014 - 2018)`,
    skills: ['Social Media Marketing', 'Branding', 'Canva', 'SEO', 'Copywriting', 'Content Strategy'],
    stage: 'applied', blind_score: null,
    ai_summary: null, is_blinded: false, created_at: isoDaysAgo(1),
  },

  // --- Operations Analyst (2) ---
  {
    id: app(14), job_id: J.OPS_ANALYST, candidate_name: 'Rasheed Adekunle',
    candidate_email: 'rasheed.adekunle@gmail.com', candidate_phone: '+234 805 778 9912',
    candidate_age: 32, candidate_gender: 'Male', candidate_school: 'University of Ibadan',
    cv_text: `Rasheed Adekunle
Phone: +234 805 778 9912 | Email: rasheed.adekunle@gmail.com
Age: 32 | Gender: Male | University of Ibadan

Professional Summary:
Operations analyst with 6 years of experience in supply chain process improvement for logistics and delivery companies.

Skills: Supply Chain, Process Improvement, Excel, Data Analysis, ERP, Project Management

Experience:
Operations Analyst, GIG Logistics (2019 - Present)
- Led process improvement projects that reduced delivery turnaround time by 22% across 3 regional hubs.
- Built Excel dashboards for daily operations tracking used by over 50 dispatch staff.
- Managed an ERP rollout for hub inventory tracking, training 30 staff on the new system.

Operations Associate, DHL Nigeria (2016 - 2019)
- Coordinated warehouse inventory processes and cycle counts for the Lagos hub.

Education: B.Sc. Industrial Engineering, University of Ibadan (2011 - 2015)`,
    skills: ['Supply Chain', 'Process Improvement', 'Excel', 'Data Analysis', 'ERP', 'Project Management'],
    stage: 'offer', blind_score: 87,
    ai_summary: 'Strong process improvement track record with measurable operational impact. Recommended to advance to offer.',
    is_blinded: true, created_at: isoDaysAgo(17),
  },
  {
    id: app(15), job_id: J.OPS_ANALYST, candidate_name: 'Joy Mbakwe',
    candidate_email: 'joy.mbakwe@gmail.com', candidate_phone: '+234 902 445 1187',
    candidate_age: 27, candidate_gender: 'Female', candidate_school: 'Federal University of Technology Owerri',
    cv_text: `Joy Mbakwe
Phone: +234 902 445 1187 | Email: joy.mbakwe@gmail.com
Age: 27 | Gender: Female | Federal University of Technology Owerri

Professional Summary:
Logistics coordinator with 3 years of experience in inventory management, vendor coordination and ERP systems for last-mile delivery operations.

Skills: Logistics, Inventory Management, ERP, Excel, Vendor Management, Data Analysis

Experience:
Logistics Coordinator, Kobo360 (2022 - Present)
- Manage relationships with 25+ haulage vendors and track fleet inventory using an ERP system.
- Built Excel trackers that reduced vehicle idle time by 15% across the Lagos corridor.

Inventory Officer, Sundry Foods (2020 - 2022)
- Maintained stock records across 3 warehouse locations and reconciled monthly stock counts.

Education: B.Eng. Industrial Engineering, Federal University of Technology Owerri (2015 - 2019)`,
    skills: ['Logistics', 'Inventory Management', 'ERP', 'Excel', 'Vendor Management', 'Data Analysis'],
    stage: 'applied', blind_score: null,
    ai_summary: null, is_blinded: false, created_at: isoDaysAgo(2),
  },
];

// ============================================================
// 4. ONBOARDING TASKS for the 3 newest hires
// ============================================================
export const ONBOARDING_TEMPLATE = [
  // Documentation
  { task: 'Submit valid ID (NIN or Passport)', category: 'Documentation' },
  { task: 'Submit signed offer letter', category: 'Documentation' },
  { task: 'Provide bank account details', category: 'Documentation' },
  { task: 'Complete tax registration (TIN) form', category: 'Documentation' },
  { task: 'Submit next of kin information', category: 'Documentation' },
  // IT Setup
  { task: 'Create company email account', category: 'IT Setup' },
  { task: 'Issue laptop and equipment', category: 'IT Setup' },
  { task: 'Grant HR portal & Slack access', category: 'IT Setup' },
  { task: 'Set up VPN and security access', category: 'IT Setup' },
  // Orientation
  { task: 'Meet your team and manager', category: 'Orientation' },
  { task: 'Office tour', category: 'Orientation' },
  { task: 'Read employee handbook', category: 'Orientation' },
  { task: 'HR policy briefing', category: 'Orientation' },
  // Training
  { task: 'Complete compliance training module', category: 'Training' },
  { task: 'Department-specific onboarding training', category: 'Training' },
  { task: 'Shadow a colleague for first week', category: 'Training' },
  { task: 'Review 30/60/90 day plan with manager', category: 'Training' },
];

function buildOnboarding(employeeId, hireDaysAgo, completedCount, idStart) {
  return ONBOARDING_TEMPLATE.map((t, i) => ({
    id: ob(idStart + i),
    employee_id: employeeId,
    task: t.task,
    category: t.category,
    completed: i < completedCount,
    due_date: daysAgo(hireDaysAgo - (i + 2)), // due dates spread shortly after hire
    created_at: isoDaysAgo(hireDaysAgo),
  }));
}

export const onboardingTasks = [
  ...buildOnboarding(E.YUSUF, 9, 13, 1),     // ~76% complete
  ...buildOnboarding(E.BLESSING, 7, 8, 100), // ~47% complete
  ...buildOnboarding(E.EMEKA, 5, 3, 200),    // ~18% complete
];

// ============================================================
// 5. LEAVE REQUESTS
// ============================================================
export const leaveRequests = [
  {
    id: leave(1), employee_id: E.CHIAMAKA, leave_type: 'Annual Leave',
    start_date: daysAgo(2), end_date: daysFromNow(3),
    reason: 'Family vacation', status: 'approved', created_at: isoDaysAgo(6),
  },
  {
    id: leave(2), employee_id: E.CHINONSO, leave_type: 'Sick Leave',
    start_date: daysAgo(10), end_date: daysAgo(8),
    reason: 'Recovering from malaria', status: 'approved', created_at: isoDaysAgo(11),
  },
  {
    id: leave(3), employee_id: E.FUNMILAYO, leave_type: 'Casual Leave',
    start_date: daysFromNow(5), end_date: daysFromNow(6),
    reason: 'Personal errand', status: 'pending', created_at: isoDaysAgo(1),
  },
  {
    id: leave(4), employee_id: E.TUNDE, leave_type: 'Annual Leave',
    start_date: daysFromNow(10), end_date: daysFromNow(14),
    reason: 'Annual family trip', status: 'pending', created_at: isoDaysAgo(2),
  },
  {
    id: leave(5), employee_id: E.IBRAHIM, leave_type: 'Annual Leave',
    start_date: daysAgo(20), end_date: daysAgo(15),
    reason: 'Eid celebration with family', status: 'approved', created_at: isoDaysAgo(25),
  },
  {
    id: leave(6), employee_id: E.NGOZI, leave_type: 'Compassionate Leave',
    start_date: daysAgo(30), end_date: daysAgo(28),
    reason: 'Bereavement in the family', status: 'rejected', created_at: isoDaysAgo(31),
  },
  {
    id: leave(7), employee_id: E.FOLAKE, leave_type: 'Sick Leave',
    start_date: daysAgo(3), end_date: daysAgo(2),
    reason: 'Flu and fever', status: 'approved', created_at: isoDaysAgo(4),
  },
  {
    id: leave(8), employee_id: E.ADEYEMI, leave_type: 'Annual Leave',
    start_date: daysFromNow(20), end_date: daysFromNow(25),
    reason: 'End of year travel', status: 'pending', created_at: isoDaysAgo(1),
  },
  {
    id: leave(9), employee_id: E.CHINONSO, leave_type: 'Emergency Leave',
    start_date: daysAgo(15), end_date: daysAgo(14),
    reason: 'Family emergency out of state', status: 'rejected', created_at: isoDaysAgo(16),
  },
];

// ============================================================
// 6. ATTENDANCE — last 30 days, weekdays only, per employee
// ============================================================
export function generateAttendanceRecords() {
  const rand = mulberry32(20260610);
  const records = [];
  let counter = 1;

  employees.forEach((employee) => {
    const hireDate = new Date(employee.hire_date);

    for (let i = 29; i >= 0; i--) {
      const date = subDays(NOW, i);
      if (isWeekend(date)) continue;
      if (date < hireDate) continue;

      const dateStr = toISODate(date);
      const r = rand();
      let status, clock_in, clock_out, hours_worked;

      if (r < 0.78) {
        status = 'present';
        clock_in = `08:0${Math.floor(rand() * 9)}:00`;
        clock_out = `17:0${Math.floor(rand() * 9)}:00`;
        hours_worked = 8.5 + Math.round(rand() * 5) / 10;
      } else if (r < 0.88) {
        status = 'late';
        clock_in = `09:${20 + Math.floor(rand() * 30)}:00`;
        clock_out = `17:0${Math.floor(rand() * 9)}:00`;
        hours_worked = 7.5 + Math.round(rand() * 5) / 10;
      } else if (r < 0.95) {
        status = 'half-day';
        clock_in = `08:0${Math.floor(rand() * 9)}:00`;
        clock_out = `13:0${Math.floor(rand() * 9)}:00`;
        hours_worked = 4.5 + Math.round(rand() * 5) / 10;
      } else {
        status = 'absent';
        clock_in = null;
        clock_out = null;
        hours_worked = 0;
      }

      records.push({
        id: att(counter++),
        employee_id: employee.id,
        date: dateStr,
        clock_in,
        clock_out,
        status,
        hours_worked,
        created_at: toISO(date),
      });
    }
  });

  return records;
}

// ============================================================
// 7. PAYROLL — last 3 months
// ============================================================
export function generatePayrollRecords() {
  const records = [];
  let counter = 1;

  for (let m = 2; m >= 0; m--) {
    const monthDate = subMonths(NOW, m);
    const monthName = format(monthDate, 'MMMM');
    const year = monthDate.getFullYear();
    const isCurrentMonth = m === 0;
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    employees.forEach((employee) => {
      const hireDate = new Date(employee.hire_date);
      if (hireDate > monthEnd) return; // not yet hired in this month

      const basic = employee.salary;
      const allowances = Math.round(basic * 0.10);
      const { gross, tax, pension, netPay: net_pay } = calculatePayroll(basic, allowances);

      records.push({
        id: pay(counter++),
        employee_id: employee.id,
        month: monthName,
        year,
        basic_salary: basic,
        allowances,
        deductions: 0,
        tax,
        pension,
        net_pay,
        status: isCurrentMonth ? 'pending' : 'processed',
        created_at: toISO(monthDate),
      });
    });
  }

  return records;
}

// ============================================================
// 9. PERFORMANCE RECORDS — last 3 months, all 12 employees
// ============================================================
const perf = (n) => `80000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const tsk  = (n) => `90000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// Accepts optional actualEmpIds (ordered by created_at) fetched from Supabase
// to avoid FK violations when Supabase UUIDs differ from our fixed demo IDs.
export function generatePerformanceRecords(actualEmpIds = null) {
  const months = [3, 2, 1].map((n) => {
    const d = subMonths(NOW, n);
    return { month: format(d, 'MMMM'), year: d.getFullYear(), date: d };
  });

  // Ordered array: [attendance_score, task_completion_score, manager_rating] × 3 months (oldest → newest)
  const profileData = [
    { defaultId: E.ADEYEMI,   scores: [[88, 88, 4.2], [89, 90, 4.3], [91, 90, 4.5]] },
    { defaultId: E.CHINONSO,  scores: [[62, 65, 3.0], [72, 74, 3.5], [83, 85, 4.0]] },
    { defaultId: E.NGOZI,     scores: [[78, 80, 3.8], [80, 82, 3.9], [82, 83, 4.0]] },
    { defaultId: E.AISHA,     scores: [[88, 90, 4.5], [90, 92, 4.5], [92, 93, 4.8]] },
    { defaultId: E.FOLAKE,    scores: [[55, 60, 2.8], [65, 70, 3.2], [74, 78, 3.7]] },
    { defaultId: E.TUNDE,     scores: [[82, 84, 4.0], [85, 86, 4.2], [88, 88, 4.4]] },
    { defaultId: E.CHIAMAKA,  scores: [[68, 65, 3.2], [60, 58, 3.0], [55, 52, 2.8]] },
    { defaultId: E.IBRAHIM,   scores: [[72, 75, 3.6], [76, 78, 3.8], [80, 82, 4.0]] },
    { defaultId: E.FUNMILAYO, scores: [[60, 65, 3.0], [70, 73, 3.5], [80, 82, 4.0]] },
    { defaultId: E.YUSUF,     scores: [[65, 68, 3.2], [68, 70, 3.3], [70, 72, 3.5]] },
    { defaultId: E.BLESSING,  scores: [[58, 60, 2.8], [62, 65, 3.0], [68, 72, 3.3]] },
    { defaultId: E.EMEKA,     scores: [[88, 90, 4.5], [76, 78, 3.8], [65, 68, 3.2]] },
  ];

  const records = [];
  let counter = 1;
  profileData.forEach(({ defaultId, scores }, empIdx) => {
    const employeeId = actualEmpIds?.[empIdx] ?? defaultId;
    scores.forEach(([att, task, rating], idx) => {
      const { month, year, date } = months[idx];
      const overall = Math.round(att * 0.3 + task * 0.4 + rating * 20 * 0.3);
      records.push({
        id: perf(counter++),
        employee_id: employeeId,
        month, year,
        attendance_score: att,
        task_completion_score: task,
        manager_rating: rating,
        overall_score: overall,
        notes: '',
        created_at: toISO(date),
      });
    });
  });
  return records;
}

// ============================================================
// 10. TASKS — per employee
// ============================================================
export function generateTasks() {
  const defs = [
    // [employee_id, title, status, due_days_from_now (null = completed)]
    [E.ADEYEMI, 'Complete API documentation for authentication module', 'completed', null],
    [E.ADEYEMI, 'Code review for payment integration pull request', 'completed', null],
    [E.ADEYEMI, 'Set up monitoring alerts for production services', 'completed', null],
    [E.ADEYEMI, 'Optimise slow database queries in reports module', 'pending', 7],

    [E.CHINONSO, 'Build reusable data table component', 'completed', null],
    [E.CHINONSO, 'Fix responsive layout issues on mobile dashboard', 'completed', null],
    [E.CHINONSO, 'Write unit tests for payroll UI components', 'pending', 5],
    [E.CHINONSO, 'Integrate new design system tokens', 'pending', 14],

    [E.NGOZI, 'Implement Redis caching for employee search endpoint', 'completed', null],
    [E.NGOZI, 'Write integration tests for leave request module', 'completed', null],
    [E.NGOZI, 'Refactor attendance service to use async/await', 'completed', null],
    [E.NGOZI, 'Upgrade Node.js version across backend services', 'pending', 10],

    [E.AISHA, 'Complete Q2 performance review cycle for all departments', 'completed', null],
    [E.AISHA, 'Update employee handbook with revised leave policy', 'completed', null],
    [E.AISHA, 'Conduct exit interview for departing employee', 'completed', null],
    [E.AISHA, 'Prepare Q3 headcount plan for leadership review', 'pending', 7],

    [E.FOLAKE, 'Process onboarding documents for three new hires', 'completed', null],
    [E.FOLAKE, 'Update HRIS records for June salary adjustments', 'completed', null],
    [E.FOLAKE, 'Schedule Q2 appraisal meetings for Engineering team', 'pending', 3],
    [E.FOLAKE, 'Archive leave request documentation for Q2', 'pending', 5],

    [E.TUNDE, 'Complete Q2 financial close and management reporting', 'completed', null],
    [E.TUNDE, 'Review and approve June payroll reconciliation', 'completed', null],
    [E.TUNDE, 'Prepare budget variance analysis for board presentation', 'completed', null],
    [E.TUNDE, 'Submit IFRS compliance report to regulatory body', 'pending', 14],

    [E.CHIAMAKA, 'File May VAT returns with FIRS', 'completed', null],
    [E.CHIAMAKA, 'Reconcile June accounts payable ledger', 'pending', 5],
    [E.CHIAMAKA, 'Update petty cash log and reimbursements for Q2', 'pending', 7],

    [E.IBRAHIM, 'Launch Q3 digital marketing campaign across channels', 'completed', null],
    [E.IBRAHIM, 'Review agency performance reports for June', 'completed', null],
    [E.IBRAHIM, 'Approve July social media content calendar', 'completed', null],
    [E.IBRAHIM, 'Present Q2 campaign ROI report to leadership team', 'pending', 4],

    [E.FUNMILAYO, 'Write four long-form blog articles for July content plan', 'completed', null],
    [E.FUNMILAYO, 'Revamp company LinkedIn page copy and banners', 'completed', null],
    [E.FUNMILAYO, 'Develop SEO keyword strategy for Q3', 'pending', 7],
    [E.FUNMILAYO, 'Design email newsletter template for product updates', 'pending', 10],

    [E.YUSUF, 'Map current procurement and operations workflow', 'completed', null],
    [E.YUSUF, 'Shadow senior analyst for ERP onboarding training', 'completed', null],
    [E.YUSUF, 'Submit first weekly operations summary report', 'pending', 2],

    [E.BLESSING, 'Complete vendor contact and capacity database', 'completed', null],
    [E.BLESSING, 'Shadow warehouse team for induction week', 'completed', null],
    [E.BLESSING, 'Build vendor tracking and schedule spreadsheet', 'pending', 3],

    [E.EMEKA, 'Set up CI/CD pipeline for authentication service', 'completed', null],
    [E.EMEKA, 'Document current infrastructure and service map', 'pending', 5],
    [E.EMEKA, 'Migrate staging environment to Kubernetes cluster', 'pending', 14],
    [E.EMEKA, 'Investigate and resolve monitoring alert fatigue', 'pending', 7],
  ];

  return defs.map(([employee_id, title, status, dueDays], i) => ({
    id: tsk(i + 1),
    employee_id,
    title,
    status,
    due_date: status === 'completed' ? daysAgo(5 + (i % 20)) : daysFromNow(dueDays || 7),
    completed_at: status === 'completed' ? isoDaysAgo(3 + (i % 10)) : null,
    created_at: isoDaysAgo(30),
  }));
}

// ============================================================
// 11. ANONYMOUS FEEDBACK
// ============================================================
const feedbk = (n) => `b0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export function generateSampleFeedback() {
  return [
    {
      id: feedbk(1),
      category: 'Work Environment',
      rating: 4,
      message: 'The office environment is comfortable and collaborative. Would love to see more quiet spaces for focused deep work.',
      created_at: isoDaysAgo(15),
    },
    {
      id: feedbk(2),
      category: 'Pay & Benefits',
      rating: 3,
      message: 'Salaries are competitive but the benefits package could be improved, especially health insurance coverage for dependants.',
      created_at: isoDaysAgo(7),
    },
    {
      id: feedbk(3),
      category: 'Career Growth',
      rating: 5,
      message: 'Excellent learning opportunities and clear paths for advancement. Leadership is highly supportive of skill development.',
      created_at: isoDaysAgo(2),
    },
  ];
}

// ============================================================
// 12. QUERIES & CLAIMS (Voice Centre)
// actualEmpIds: ordered list of real Supabase employee IDs
// ============================================================
const qry = (n) => `c0000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

export function generateSampleQueries(actualEmpIds = null) {
  const ids = actualEmpIds?.length >= 9 ? actualEmpIds : [
    E.ADEYEMI, E.CHINONSO, E.NGOZI, E.AISHA, E.FOLAKE,
    E.TUNDE, E.CHIAMAKA, E.IBRAHIM, E.FUNMILAYO,
  ];
  return [
    {
      id: qry(1),
      employee_id: ids[0],
      ticket_number: 'BH-Q-1001',
      type: 'query',
      category: 'Payslip Issue',
      subject: 'Incorrect basic salary for June 2026',
      message: 'My June payslip shows a lower basic salary than my offer letter. Please review and correct.',
      amount: null,
      receipt_note: null,
      status: 'open',
      hr_response: null,
      resolved_at: null,
      created_at: isoDaysAgo(5),
    },
    {
      id: qry(2),
      employee_id: ids[7],
      ticket_number: 'BH-C-1002',
      type: 'claim',
      category: 'Transport',
      subject: 'Transport reimbursement — Client visit Lagos Island, June 15',
      message: 'Requesting reimbursement for transportation to client site on June 15, 2026. Uber receipt available.',
      amount: 15000,
      receipt_note: 'Uber receipt — physical copy submitted to Admin',
      status: 'in_review',
      hr_response: null,
      resolved_at: null,
      created_at: isoDaysAgo(8),
    },
    {
      id: qry(3),
      employee_id: ids[2],
      ticket_number: 'BH-Q-1003',
      type: 'query',
      category: 'Attendance Dispute',
      subject: 'June 20 marked absent — I was present',
      message: 'The system shows me as absent on June 20 but I was physically present. I have my access card log as proof.',
      amount: null,
      receipt_note: null,
      status: 'resolved',
      hr_response: 'We reviewed the access card log and have corrected your attendance for June 20 to Present. Apologies for the inconvenience.',
      resolved_at: isoDaysAgo(2),
      created_at: isoDaysAgo(10),
    },
    {
      id: qry(4),
      employee_id: ids[4],
      ticket_number: 'BH-C-1004',
      type: 'claim',
      category: 'Equipment',
      subject: 'Laptop charger replacement request',
      message: 'My company-issued laptop charger has stopped working. Requesting approval for a replacement purchase.',
      amount: 45000,
      receipt_note: null,
      status: 'open',
      hr_response: null,
      resolved_at: null,
      created_at: isoDaysAgo(3),
    },
  ];
}

// ============================================================
// 8. RECENT ACTIVITY FEED (Dashboard)
// ============================================================
export const recentActivity = [
  {
    id: 1,
    icon: 'UserPlus',
    text: 'New application received for Senior Backend Engineer',
    time: isoDaysAgo(0),
  },
  {
    id: 2,
    icon: 'ClipboardCheck',
    text: 'Yusuf Garba completed IT Setup onboarding tasks',
    time: isoDaysAgo(1),
  },
  {
    id: 3,
    icon: 'CalendarCheck',
    text: 'Leave request approved for Chiamaka Nwosu',
    time: isoDaysAgo(2),
  },
  {
    id: 4,
    icon: 'DollarSign',
    text: `Payroll processed for ${format(subMonths(NOW, 1), 'MMMM yyyy')}`,
    time: isoDaysAgo(3),
  },
  {
    id: 5,
    icon: 'Briefcase',
    text: 'New job posted: Digital Marketing Specialist',
    time: isoDaysAgo(5),
  },
];
