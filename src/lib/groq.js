const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = 'llama-3.3-70b-versatile';

export const isGroqConfigured = Boolean(
  GROQ_API_KEY && !GROQ_API_KEY.includes('your_groq')
);

// All Groq calls go through same-origin /api/groq — a Vite proxy in dev
// (vite.config.js) and a Vercel serverless function in production
// (api/groq.js) — so the browser never calls api.groq.com directly and the
// real API key never reaches client code.
async function callGroq({ messages, temperature = 0.3, response_format }) {
  const res = await fetch('/api/groq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, temperature, response_format }),
  });
  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
  return res.json();
}

// ============================================================
// Personal identifier stripping (Blind Mode)
// ============================================================

const NIGERIAN_NAME_PARTS = [
  // Yoruba
  'Adeyemi', 'Adebayo', 'Oluwaseun', 'Folake', 'Balogun', 'Ojo', 'Adewale',
  'Olamide', 'Bisi', 'Tunde', 'Funmilayo', 'Akinola', 'Ayodele', 'Oyinlola',
  // Igbo
  'Okonkwo', 'Chinonso', 'Ngozi', 'Eze', 'Chiamaka', 'Nwosu', 'Emeka',
  'Okafor', 'Chukwu', 'Adaeze', 'Obiora', 'Ifeoma', 'Chidinma', 'Uche',
  // Hausa
  'Abubakar', 'Aisha', 'Musa', 'Ibrahim', 'Yusuf', 'Garba', 'Bello',
  'Hauwa', 'Suleiman', 'Amina', 'Fatima', 'Sani', 'Maryam',
];

const NIGERIAN_INSTITUTIONS = [
  'University of Lagos', 'Ahmadu Bello University', 'University of Nigeria Nsukka',
  'Obafemi Awolowo University', 'Covenant University', 'University of Ibadan',
  'Lagos State University', 'Federal University of Technology Akure',
  'University of Benin', 'Bayero University Kano', 'University of Port Harcourt',
  'Yaba College of Technology', 'Federal Polytechnic Nekede',
  'Babcock University', 'Nile University', 'Pan-Atlantic University',
];

const NIGERIAN_LOCATIONS = [
  'Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Enugu', 'Kaduna',
  'Benin City', 'Owerri', 'Abeokuta', 'Calabar', 'Jos', 'Maiduguri',
  'Sokoto', 'Onitsha', 'Warri', 'Uyo', 'Ilorin', 'Akure', 'Yola',
  'Nigeria', 'Nigerian',
];

/**
 * Removes / masks personal identifiers from CV text so the AI can
 * evaluate skills and experience without bias.
 *
 * Combines deterministic regex matching (names, age, gender, schools,
 * locations) which works fully offline, so Blind Mode is reliable
 * even without an AI call.
 */
export function stripPersonalIdentifiers(text = '') {
  if (!text) return text;
  let result = text;

  // Email addresses
  result = result.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/gi, '[EMAIL REDACTED]');

  // Phone numbers (Nigerian + general formats)
  result = result.replace(/(\+?\d[\d\s-]{8,14}\d)/g, '[PHONE REDACTED]');

  // Explicit "Name:" / "Full Name:" labeled fields
  result = result.replace(/^(full\s*name|name|candidate)\s*:\s*.*/gim, '[NAME REDACTED]');

  // First non-empty line that looks like "John Doe" or "Adeyemi Oluwaseun Bello"
  result = result.replace(/^\s*([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){1,3})\s*$/m, (match, _name, offset) => {
    return offset < 5 ? '[NAME REDACTED]' : match;
  });

  // Age mentions e.g. "Age: 32", "32 years old", "32-year-old"
  result = result.replace(/\bage\s*[:\-]?\s*\d{1,2}\b/gi, 'Age: [REDACTED]');
  result = result.replace(/\b\d{1,2}[\s-]?(year|yr)s?[\s-]?old\b/gi, '[AGE REDACTED]');
  result = result.replace(/\b(date of birth|d\.?o\.?b\.?)\s*[:\-]?\s*[\d/.\-a-zA-Z]+/gi, '[DOB REDACTED]');

  // Gender mentions
  result = result.replace(/\bgender\s*[:\-]?\s*(male|female|m|f|non-binary)\b/gi, 'Gender: [REDACTED]');
  result = result.replace(/\b(mr|mrs|miss|ms|mx)\.?\s+/gi, '');
  result = result.replace(/\b(he|him|his|she|her|hers)\b/gi, 'they');
  result = result.replace(/\b(himself|herself)\b/gi, 'themself');

  // Tribal / ethnic name fragments
  NIGERIAN_NAME_PARTS.forEach((name) => {
    const re = new RegExp(`\\b${name}\\b`, 'gi');
    result = result.replace(re, '[NAME REDACTED]');
  });

  // Schools / institutions
  NIGERIAN_INSTITUTIONS.forEach((school) => {
    const re = new RegExp(school.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(re, '[INSTITUTION REDACTED]');
  });
  result = result.replace(/\b[A-Z][a-zA-Z]*\s(University|Polytechnic|College)\b/g, '[INSTITUTION REDACTED]');
  result = result.replace(/\bUniversity of [A-Z][a-zA-Z]*\b/g, '[INSTITUTION REDACTED]');

  // Locations / nationality hints
  NIGERIAN_LOCATIONS.forEach((loc) => {
    const re = new RegExp(`\\b${loc}\\b`, 'gi');
    result = result.replace(re, '[LOCATION REDACTED]');
  });

  // Collapse repeated redaction tags & whitespace
  result = result.replace(/(\[NAME REDACTED\]\s*){2,}/g, '[NAME REDACTED] ');
  result = result.replace(/[ \t]{2,}/g, ' ');

  return result.trim();
}

// ============================================================
// Helpers
// ============================================================

function extractJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'a', 'an', 'to', 'of', 'in', 'on', 'is',
  'are', 'will', 'you', 'your', 'we', 'our', 'as', 'be', 'or', 'this',
  'that', 'have', 'has', 'role', 'job', 'work', 'team', 'years', 'year',
  'experience', 'skills', 'ability', 'strong', 'including', 'must', 'who',
  'their', 'they', 'them', 'from', 'into', 'such', 'all', 'can', 'able',
]);

function extractKeywords(text = '') {
  return [...new Set(
    (text.toLowerCase().match(/[a-z][a-z0-9+#.]{2,}/g) || [])
      .filter((w) => !STOPWORDS.has(w))
  )];
}

// ============================================================
// 1. scoreCandidate — Blind Screener AI scoring
// ============================================================

export async function scoreCandidate(cvText, jobDescription, blindMode = true) {
  const processedCv = blindMode ? stripPersonalIdentifiers(cvText) : cvText;

  if (!isGroqConfigured) {
    await new Promise((r) => setTimeout(r, 900));
    return { ...mockScoreCandidate(processedCv, jobDescription), processedCv };
  }

  try {
    const completion = await callGroq({
      temperature: 0.3,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are an unbiased technical recruiter assistant for BlindHire. ' +
            'Evaluate a candidate CV strictly against a job description, focusing only ' +
            'on skills, experience and qualifications. Respond ONLY with a valid JSON object ' +
            'matching this schema: { "score": number (0-100), ' +
            '"skills_match": [{ "skill": string, "matched": boolean }], ' +
            '"strengths": [string], "gaps": [string], ' +
            '"recommendation": "Advance" | "Hold" | "Reject" }. ' +
            'Do not include any text outside the JSON object.',
        },
        {
          role: 'user',
          content: `JOB DESCRIPTION:\n${jobDescription}\n\nCANDIDATE CV:\n${processedCv}\n\nReturn the JSON evaluation now.`,
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || '';
    const parsed = extractJson(raw);
    if (!parsed) throw new Error('Could not parse AI response');

    return { ...normalizeScoreResult(parsed), processedCv };
  } catch (err) {
    console.error('Groq scoreCandidate failed, using fallback scorer:', err.message);
    return { ...mockScoreCandidate(processedCv, jobDescription), processedCv };
  }
}

function normalizeScoreResult(parsed) {
  return {
    score: Math.max(0, Math.min(100, Math.round(Number(parsed.score) || 0))),
    skills_match: Array.isArray(parsed.skills_match) ? parsed.skills_match : [],
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
    recommendation: ['Advance', 'Hold', 'Reject'].includes(parsed.recommendation)
      ? parsed.recommendation
      : 'Hold',
  };
}

/**
 * Deterministic offline scorer used when Groq is not configured.
 * Compares keyword overlap between the JD and the (possibly redacted) CV.
 */
function mockScoreCandidate(cvText, jobDescription) {
  const jdKeywords = extractKeywords(jobDescription).slice(0, 14);
  const cvLower = cvText.toLowerCase();

  const skills_match = jdKeywords.map((skill) => ({
    skill,
    matched: cvLower.includes(skill),
  }));

  const matchedCount = skills_match.filter((s) => s.matched).length;
  const ratio = jdKeywords.length ? matchedCount / jdKeywords.length : 0.5;
  const score = Math.round(40 + ratio * 58);

  const strengths = skills_match
    .filter((s) => s.matched)
    .slice(0, 5)
    .map((s) => `Demonstrated experience with ${s.skill}`);

  const gaps = skills_match
    .filter((s) => !s.matched)
    .slice(0, 4)
    .map((s) => `No clear evidence of ${s.skill} experience`);

  let recommendation = 'Hold';
  if (score >= 75) recommendation = 'Advance';
  else if (score < 50) recommendation = 'Reject';

  return {
    score,
    skills_match,
    strengths: strengths.length ? strengths : ['Relevant professional background for this role'],
    gaps: gaps.length ? gaps : ['No major gaps identified'],
    recommendation,
  };
}

// ============================================================
// 2. extractCandidateEmail / extractCandidateIdentity — Identity extraction
// ============================================================

const NOT_SPECIFIED = 'Not specified';

/**
 * Pure-regex email extraction so a candidate's email is available for the
 * Accept/Reject email send before (and regardless of) the AI analysis runs.
 */
export function extractCandidateEmail(cvText = '') {
  const match = (cvText || '').match(/[\w.+-]+@[\w-]+\.[\w.-]+/i);
  return match ? match[0] : null;
}

/**
 * Extracts identity fields from a CV for the "Identity Information" card
 * shown when Blind Mode is OFF. Uses Groq when configured, falling back to
 * deterministic regex/list-based extraction (the inverse of
 * stripPersonalIdentifiers) so the card still works offline.
 */
export async function extractCandidateIdentity(cvText) {
  if (!isGroqConfigured) {
    await new Promise((r) => setTimeout(r, 500));
    return offlineExtractIdentity(cvText);
  }

  try {
    const completion = await callGroq({
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You extract identity information from a candidate CV for an HR system. ' +
            'Respond ONLY with a valid JSON object matching this schema: ' +
            '{ "full_name": string, "age": string, "gender": string, "location": string, ' +
            '"school": string, "email": string, "phone": string }. ' +
            `Use "${NOT_SPECIFIED}" for any field that cannot be found in the CV. ` +
            'Do not include any text outside the JSON object.',
        },
        {
          role: 'user',
          content: `CANDIDATE CV:\n${cvText}\n\nReturn the JSON identity extraction now.`,
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || '';
    const parsed = extractJson(raw);
    if (!parsed) throw new Error('Could not parse AI response');

    return normalizeIdentity(parsed, cvText);
  } catch (err) {
    console.error('Groq extractCandidateIdentity failed, using fallback extractor:', err.message);
    return offlineExtractIdentity(cvText);
  }
}

function normalizeIdentity(parsed, cvText) {
  const fallback = offlineExtractIdentity(cvText);
  const clean = (v) => (typeof v === 'string' && v.trim() && v.trim().toLowerCase() !== NOT_SPECIFIED.toLowerCase() ? v.trim() : null);
  return {
    full_name: clean(parsed.full_name) || fallback.full_name,
    age: clean(parsed.age) || fallback.age,
    gender: clean(parsed.gender) || fallback.gender,
    location: clean(parsed.location) || fallback.location,
    school: clean(parsed.school) || fallback.school,
    email: clean(parsed.email) || fallback.email,
    phone: clean(parsed.phone) || fallback.phone,
  };
}

/**
 * Deterministic offline identity extractor — mirrors the inverse of
 * stripPersonalIdentifiers using the same name/institution/location lists,
 * so the Identity card has sensible values even without an AI call.
 */
function offlineExtractIdentity(cvText = '') {
  const text = cvText || '';

  let full_name = NOT_SPECIFIED;
  const nameLabelMatch = text.match(/^(?:full\s*name|name|candidate)\s*:\s*(.+)$/im);
  if (nameLabelMatch) {
    full_name = nameLabelMatch[1].trim();
  } else {
    const firstLineMatch = text.match(/^\s*([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+){1,3})\s*$/m);
    if (firstLineMatch) {
      full_name = firstLineMatch[1].trim();
    } else {
      const firstChunk = text.split('\n').slice(0, 5).join(' ');
      const found = NIGERIAN_NAME_PARTS.filter((n) => new RegExp(`\\b${n}\\b`, 'i').test(firstChunk));
      if (found.length) full_name = found.slice(0, 3).join(' ');
    }
  }

  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/i);
  const email = emailMatch ? emailMatch[0] : NOT_SPECIFIED;

  const phoneMatch = text.match(/(\+?\d[\d\s-]{8,14}\d)/);
  const phone = phoneMatch ? phoneMatch[0].trim() : NOT_SPECIFIED;

  let age = NOT_SPECIFIED;
  const ageLabelMatch = text.match(/\bage\s*[:\-]?\s*(\d{1,2})\b/i);
  const ageYearsMatch = text.match(/\b(\d{1,2})[\s-]?(?:year|yr)s?[\s-]?old\b/i);
  if (ageLabelMatch) age = ageLabelMatch[1];
  else if (ageYearsMatch) age = ageYearsMatch[1];

  let gender = NOT_SPECIFIED;
  const genderMatch = text.match(/\bgender\s*[:\-]?\s*(male|female|m|f|non-binary)\b/i);
  if (genderMatch) {
    const g = genderMatch[1].toLowerCase();
    gender = g === 'm' ? 'Male' : g === 'f' ? 'Female' : g.charAt(0).toUpperCase() + g.slice(1);
  } else if (/\b(he|him|his|himself|mr)\b\.?/i.test(text)) {
    gender = 'Male';
  } else if (/\b(she|her|hers|herself|mrs|miss|ms)\b\.?/i.test(text)) {
    gender = 'Female';
  }

  let school = NOT_SPECIFIED;
  const knownSchool = NIGERIAN_INSTITUTIONS.find((s) => text.toLowerCase().includes(s.toLowerCase()));
  if (knownSchool) {
    school = knownSchool;
  } else {
    const schoolMatch = text.match(/\b[A-Z][a-zA-Z]*\s(?:University|Polytechnic|College)\b/);
    const ofMatch = text.match(/\bUniversity of [A-Z][a-zA-Z]*\b/);
    if (ofMatch) school = ofMatch[0];
    else if (schoolMatch) school = schoolMatch[0];
  }

  let location = NOT_SPECIFIED;
  const knownLocation = NIGERIAN_LOCATIONS.find((loc) => new RegExp(`\\b${loc}\\b`, 'i').test(text));
  if (knownLocation) location = knownLocation;

  return { full_name, age, gender, location, school, email, phone };
}

// ============================================================
// 3. checkJobAdBias — Job Ad Bias Checker
// ============================================================

const BIAS_PATTERNS = [
  { regex: /\byoung and energetic\b/gi, category: 'Ageist', suggestion: 'motivated and proactive' },
  { regex: /\byoung,?\s*dynamic\b/gi, category: 'Ageist', suggestion: 'dynamic' },
  { regex: /\bdigital nativ(e|es)\b/gi, category: 'Ageist', suggestion: 'comfortable with digital tools' },
  { regex: /\b(recent|fresh)\s+graduate(s)?\b/gi, category: 'Ageist', suggestion: 'candidate with relevant qualifications' },
  { regex: /\bunder\s*\d{2}\s*years?\s*old\b/gi, category: 'Ageist', suggestion: '(remove age requirement)' },
  { regex: /\bhe\/she\b|\bhe or she\b|\bhis\/her\b|\bhimself\/herself\b/gi, category: 'Gendered', suggestion: 'they / them / their' },
  { regex: /\bchairman\b/gi, category: 'Gendered', suggestion: 'chairperson' },
  { regex: /\bsalesman\b/gi, category: 'Gendered', suggestion: 'salesperson' },
  { regex: /\bmanpower\b/gi, category: 'Gendered', suggestion: 'workforce' },
  { regex: /\bman\s*the\s*(front\s*desk|desk|office)\b/gi, category: 'Gendered', suggestion: 'staff the desk' },
  { regex: /\brock\s*star\b/gi, category: 'Cultural', suggestion: 'high performer' },
  { regex: /\bninja\b/gi, category: 'Cultural', suggestion: 'expert' },
  { regex: /\bguru\b/gi, category: 'Cultural', suggestion: 'specialist' },
  { regex: /\bwork hard,?\s*play hard\b/gi, category: 'Cultural', suggestion: 'collaborative and results-driven' },
  { regex: /\bnative english speaker\b/gi, category: 'Exclusionary', suggestion: 'fluent in English' },
  { regex: /\bnative speaker\b/gi, category: 'Exclusionary', suggestion: 'fluent speaker' },
  { regex: /\bculture fit\b/gi, category: 'Exclusionary', suggestion: 'alignment with company values' },
  { regex: /\bable[\s-]bodied\b/gi, category: 'Exclusionary', suggestion: 'able to perform job duties with or without reasonable accommodation' },
  { regex: /\bstrong\s+command\s+of\s+english\b/gi, category: 'Exclusionary', suggestion: 'strong written and verbal communication skills' },
  { regex: /\brecent university graduate\b/gi, category: 'Ageist', suggestion: 'candidate early in their career' },
];

export async function checkJobAdBias(jobDescription) {
  if (!isGroqConfigured) {
    await new Promise((r) => setTimeout(r, 900));
    return mockCheckJobAdBias(jobDescription);
  }

  try {
    const completion = await callGroq({
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are a DEI (Diversity, Equity & Inclusion) expert reviewing job descriptions ' +
            'for biased or exclusionary language. Identify phrases that may discourage ' +
            'applicants based on age, gender, culture, or background. ' +
            'Respond ONLY with a valid JSON object matching this schema: ' +
            '{ "bias_score": "Low" | "Medium" | "High", ' +
            '"biased_phrases": [{ "phrase": string, "category": "Ageist" | "Gendered" | "Exclusionary" | "Cultural", "suggestion": string }], ' +
            '"rewritten_jd": string }. ' +
            'The "phrase" field must be an exact substring copied from the original text. ' +
            'The "rewritten_jd" must be a full neutral rewrite of the entire job description. ' +
            'Do not include any text outside the JSON object.',
        },
        {
          role: 'user',
          content: `JOB DESCRIPTION:\n${jobDescription}\n\nReturn the JSON bias analysis now.`,
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || '';
    const parsed = extractJson(raw);
    if (!parsed) throw new Error('Could not parse AI response');

    return normalizeBiasResult(parsed, jobDescription);
  } catch (err) {
    console.error('Groq checkJobAdBias failed, using fallback checker:', err.message);
    return mockCheckJobAdBias(jobDescription);
  }
}

function normalizeBiasResult(parsed, original) {
  const biased_phrases = Array.isArray(parsed.biased_phrases)
    ? parsed.biased_phrases.filter((p) => p?.phrase && original.toLowerCase().includes(p.phrase.toLowerCase()))
    : [];

  return {
    bias_score: ['Low', 'Medium', 'High'].includes(parsed.bias_score) ? parsed.bias_score : 'Low',
    biased_phrases: biased_phrases.map((p) => ({
      phrase: p.phrase,
      category: ['Ageist', 'Gendered', 'Exclusionary', 'Cultural'].includes(p.category) ? p.category : 'Cultural',
      suggestion: p.suggestion || '',
    })),
    rewritten_jd: parsed.rewritten_jd || original,
  };
}

/**
 * Deterministic offline bias checker used when Groq is not configured.
 * Scans the text for a curated list of common biased phrases.
 */
function mockCheckJobAdBias(jobDescription) {
  const found = [];
  let rewritten = jobDescription;

  BIAS_PATTERNS.forEach(({ regex, category, suggestion }) => {
    const matches = jobDescription.match(regex);
    if (matches) {
      matches.forEach((m) => {
        if (!found.some((f) => f.phrase.toLowerCase() === m.toLowerCase())) {
          found.push({ phrase: m, category, suggestion });
        }
      });
      rewritten = rewritten.replace(regex, suggestion);
    }
  });

  let bias_score = 'Low';
  if (found.length >= 5) bias_score = 'High';
  else if (found.length >= 2) bias_score = 'Medium';

  return { bias_score, biased_phrases: found, rewritten_jd: rewritten };
}

// ============================================================
// 4. generateLearningPath — SkillBridge candidate learning path
// ============================================================

const PRIORITY_LEVELS = ['High', 'Medium', 'Low'];

/**
 * Generates a personalized learning path for a candidate who was just
 * rejected in the Blind Screener. No offline fallback — SkillBridge content
 * is purely AI-generated, so an unconfigured Groq client or an unparseable
 * response simply returns null and the UI shows a "try again" state.
 */
export async function generateLearningPath({ jobRole, score, gaps = [] }) {
  if (!isGroqConfigured) return null;

  try {
    const completion = await callGroq({
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are SkillBridge, a career development AI inside the BlindHire HR platform. ' +
            'A candidate just applied for a role and was rejected. Generate a personalized ' +
            'learning path for this candidate. Respond ONLY with a valid JSON object matching ' +
            'this schema: { "candidate_level": "Junior" | "Mid-level" | "Senior", ' +
            '"career_path": string (their likely career trajectory in one line), ' +
            '"job_specific_courses": [{ "skill_gap": string, "course_name": string, ' +
            '"platform": "Coursera" | "Udemy" | "Alison" | "Google" | "Microsoft" | "AltSchool" | "SideHustle" | "Stutern" | "YouTube", ' +
            '"duration": string, "cost": string, "url_hint": string, "priority": "High" | "Medium" | "Low" }], ' +
            '"encouragement_message": string }. ' +
            'The encouragement_message must be a warm, honest, encouraging 2-sentence message to the ' +
            'candidate about their potential, written in second person ("You"), Nigerian context aware, ' +
            'and must not mention the rejection directly. ' +
            'Rules for course recommendations: maximum 4 courses; prioritize FREE options first; ' +
            'prioritize Nigerian platforms (AltSchool, SideHustle, Stutern) before international ones; ' +
            'then Google/Microsoft/Meta free certificates; only suggest paid courses if no free ' +
            'alternative exists; all must be accessible from Nigeria with low data needs; match courses ' +
            'SPECIFICALLY to the given skill gaps, not generic recommendations. ' +
            'Do not include any text outside the JSON object.',
        },
        {
          role: 'user',
          content:
            `A candidate applied for ${jobRole || 'a role'} and was rejected with a fit score of ${score}%.\n\n` +
            `Their identified skill gaps were:\n${(gaps || []).map((g) => `- ${g}`).join('\n') || '- None specified'}\n\n` +
            'Return the JSON learning path now.',
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || '';
    const parsed = extractJson(raw);
    if (!parsed) return null;

    return normalizeLearningPath(parsed);
  } catch (err) {
    console.error('Groq generateLearningPath failed:', err.message);
    return null;
  }
}

function normalizeLearningPath(parsed) {
  const courses = Array.isArray(parsed.job_specific_courses) ? parsed.job_specific_courses : [];
  return {
    candidate_level: typeof parsed.candidate_level === 'string' && parsed.candidate_level ? parsed.candidate_level : 'Mid-level',
    career_path: typeof parsed.career_path === 'string' ? parsed.career_path : '',
    job_specific_courses: courses.slice(0, 4).map((c) => ({
      skill_gap: c?.skill_gap || '',
      course_name: c?.course_name || '',
      platform: c?.platform || '',
      duration: c?.duration || '',
      cost: c?.cost || '',
      url_hint: c?.url_hint || '',
      priority: PRIORITY_LEVELS.includes(c?.priority) ? c.priority : 'Medium',
    })),
    encouragement_message: typeof parsed.encouragement_message === 'string' ? parsed.encouragement_message : '',
  };
}

// ============================================================
// 5. generateGrowthPlan — SkillBridge employee growth plan
// ============================================================

const GROWTH_LEVELS = ['Junior', 'Mid-level', 'Senior', 'Lead', 'Manager'];

/**
 * Returns how long an employee has been at the company as a short phrase
 * (e.g. "2 years 3 months"), used in the growth plan prompt.
 */
function timeAtCompany(hireDate) {
  if (!hireDate) return 'Less than a month';
  const start = new Date(hireDate);
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  months = Math.max(0, months);

  const years = Math.floor(months / 12);
  const remMonths = months % 12;

  if (years === 0 && remMonths === 0) return 'Less than a month';
  const parts = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (remMonths > 0) parts.push(`${remMonths} month${remMonths > 1 ? 's' : ''}`);
  return parts.join(' ');
}

/**
 * Generates a personalized career growth plan for an existing employee.
 * No offline fallback — SkillBridge content is purely AI-generated, so an
 * unconfigured Groq client or an unparseable response returns null and the
 * UI shows a "try again" state.
 */
export async function generateGrowthPlan({ employee }) {
  if (!isGroqConfigured) return null;

  try {
    const completion = await callGroq({
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'You are SkillBridge, a career development AI inside the BlindHire HR platform. ' +
            'Analyse the given employee and generate their personalized career growth plan. ' +
            'Respond ONLY with a valid JSON object matching this schema: ' +
            '{ "current_level": "Junior" | "Mid-level" | "Senior" | "Lead" | "Manager", ' +
            '"next_level": string, "readiness_months": number (2-18), "readiness_percentage": number (20-85), ' +
            '"strengths": [string, string, string], "growth_areas": [string, string, string], ' +
            '"career_path": string, ' +
            '"courses": [{ "growth_area": string, "course_name": string, "platform": string, ' +
            '"duration": string, "cost": string, "impact": string }], ' +
            '"manager_tip": string, "motivation_message": string }. ' +
            'next_level is the employee\'s next career milestone title. career_path is one sentence ' +
            'describing their trajectory, e.g. "Junior Dev -> Mid -> Senior -> Tech Lead -> CTO". ' +
            'manager_tip is one actionable tip for the HR manager on how to support this employee, 2 ' +
            'sentences max. motivation_message is a direct, warm message to the employee about their ' +
            'growth potential, 2-3 sentences, Nigerian context aware, second person ("You"). ' +
            'Rules: maximum 4 courses; prioritize FREE Nigerian platforms first; readiness_months should ' +
            'reflect role seniority and time at company (someone 3 years in is more ready than someone ' +
            '6 months in); strengths and growth areas must be realistic for their department and role; ' +
            'the career path must be realistic for the Nigerian market. ' +
            'Do not include any text outside the JSON object.',
        },
        {
          role: 'user',
          content:
            'Employee Details:\n' +
            `- Name: ${employee.first_name} ${employee.last_name}\n` +
            `- Current Role: ${employee.role}\n` +
            `- Department: ${employee.department}\n` +
            `- Employment Type: ${employee.employment_type}\n` +
            `- Time at Company: ${timeAtCompany(employee.hire_date)}\n` +
            `- Current Salary: ₦${Number(employee.salary || 0).toLocaleString('en-NG')}\n\n` +
            'Return the JSON career growth plan now.',
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || '';
    const parsed = extractJson(raw);
    if (!parsed) return null;

    return normalizeGrowthPlan(parsed);
  } catch (err) {
    console.error('Groq generateGrowthPlan failed:', err.message);
    return null;
  }
}

function normalizeGrowthPlan(parsed) {
  const courses = Array.isArray(parsed.courses) ? parsed.courses : [];
  const clamp = (n, min, max) => Math.max(min, Math.min(max, Math.round(Number(n)) || min));
  return {
    current_level: GROWTH_LEVELS.includes(parsed.current_level) ? parsed.current_level : 'Mid-level',
    next_level: typeof parsed.next_level === 'string' ? parsed.next_level : '',
    readiness_months: clamp(parsed.readiness_months, 2, 18),
    readiness_percentage: clamp(parsed.readiness_percentage, 20, 85),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((s) => typeof s === 'string') : [],
    growth_areas: Array.isArray(parsed.growth_areas) ? parsed.growth_areas.filter((s) => typeof s === 'string') : [],
    career_path: typeof parsed.career_path === 'string' ? parsed.career_path : '',
    courses: courses.slice(0, 4).map((c) => ({
      growth_area: c?.growth_area || '',
      course_name: c?.course_name || '',
      platform: c?.platform || '',
      duration: c?.duration || '',
      cost: c?.cost || '',
      impact: c?.impact || '',
    })),
    manager_tip: typeof parsed.manager_tip === 'string' ? parsed.manager_tip : '',
    motivation_message: typeof parsed.motivation_message === 'string' ? parsed.motivation_message : '',
  };
}
