import emailjs from '@emailjs/browser';
import { format } from 'date-fns';

const PUBLIC_KEY = 'P9UuShGAcdDINNOl0';
const SERVICE_ID = 'service_fds55ah';
const LEAVE_REQUEST_TEMPLATE_ID = 'template_9z9rdbi';
const LEAVE_DECISION_TEMPLATE_ID = 'template_lxcl5rl';

// In dev, route through the Vite proxy (/api/emailjs -> https://api.emailjs.com)
// so the browser never has to resolve api.emailjs.com directly — some networks
// block that host for client-side requests, causing "TypeError: Failed to fetch".
emailjs.init({
  publicKey: PUBLIC_KEY,
  ...(import.meta.env.DEV ? { origin: '/api/emailjs' } : {}),
});

/**
 * Notify HR that an employee has submitted a new leave request.
 * Returns { success: boolean } — never throws, so a failed email
 * never blocks the leave request from being saved.
 */
export async function sendLeaveRequestNotification({
  employee_name,
  employee_email,
  leave_type,
  start_date,
  end_date,
  reason,
}) {
  try {
    await emailjs.send(SERVICE_ID, LEAVE_REQUEST_TEMPLATE_ID, {
      employee_name,
      employee_email,
      leave_type,
      start_date,
      end_date,
      reason,
      to_name: 'HR Manager',
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to send leave request notification:', err);
    return { success: false, error: err };
  }
}

/**
 * Notify an employee that HR has approved or rejected their leave request.
 * Returns { success: boolean } — never throws, so a failed email
 * never blocks the status update from being saved.
 */
export async function sendLeaveDecisionNotification({
  employee_name,
  employee_email,
  leave_type,
  start_date,
  end_date,
  decision,
  message,
}) {
  try {
    await emailjs.send(SERVICE_ID, LEAVE_DECISION_TEMPLATE_ID, {
      employee_name,
      employee_email,
      leave_type,
      start_date,
      end_date,
      decision,
      message,
      to_email: employee_email,
      to_name: employee_name,
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to send leave decision notification:', err);
    return { success: false, error: err };
  }
}

/**
 * Notify a job candidate that they have been accepted or rejected from the
 * Blind Screener. Reuses the leave-decision template (template_lxcl5rl) with
 * candidate fields mapped onto its employee_* placeholders.
 * Returns { success: boolean } — never throws, so a failed email never
 * blocks the accept/reject action.
 */
export async function sendCandidateDecisionNotification({
  candidate_name,
  candidate_email,
  role,
  decision,
  message,
}) {
  try {
    await emailjs.send(SERVICE_ID, LEAVE_DECISION_TEMPLATE_ID, {
      employee_name: candidate_name,
      employee_email: candidate_email,
      leave_type: 'Job Application',
      start_date: role,
      end_date: format(new Date(), 'yyyy-MM-dd'),
      decision,
      message,
      to_email: candidate_email,
      to_name: candidate_name,
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to send candidate decision notification:', err);
    return { success: false, error: err };
  }
}

/**
 * Email a rejected candidate their AI-generated SkillBridge learning path.
 * Reuses the leave-decision template with SkillBridge-specific fields.
 * Returns { success: boolean } — never throws, so a failed email never
 * blocks the UI.
 */
export async function sendSkillBridgeLearningPath({
  candidate_name,
  candidate_email,
  job_role,
  message,
}) {
  try {
    await emailjs.send(SERVICE_ID, LEAVE_DECISION_TEMPLATE_ID, {
      employee_name: candidate_name,
      employee_email: candidate_email,
      leave_type: 'SkillBridge',
      start_date: job_role,
      end_date: format(new Date(), 'yyyy-MM-dd'),
      decision: 'Your SkillBridge Learning Path',
      message,
      to_email: candidate_email,
      to_name: candidate_name,
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to send SkillBridge learning path:', err);
    return { success: false, error: err };
  }
}

/**
 * Email an employee their AI-generated SkillBridge career growth plan.
 * Reuses the leave-decision template with SkillBridge-specific fields.
 * Returns { success: boolean } — never throws, so a failed email never
 * blocks the UI.
 */
export async function sendSkillBridgeGrowthPlan({
  employee_name,
  employee_email,
  current_role,
  message,
}) {
  try {
    await emailjs.send(SERVICE_ID, LEAVE_DECISION_TEMPLATE_ID, {
      employee_name,
      employee_email,
      leave_type: 'SkillBridge',
      start_date: current_role,
      end_date: format(new Date(), 'yyyy-MM-dd'),
      decision: 'Your SkillBridge Growth Plan',
      message,
      to_email: employee_email,
      to_name: employee_name,
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to send SkillBridge growth plan:', err);
    return { success: false, error: err };
  }
}
