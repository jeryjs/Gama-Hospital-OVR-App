import { db } from '@/db';
import { ovrReports, users } from '@/db/schema';
import { APP_ROLES, type AppRole } from '@/lib/constants';
import { eq, inArray } from 'drizzle-orm';
import type { Session } from 'next-auth';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

const GRAPH_SEND_MAIL_URL = 'https://graph.microsoft.com/v1.0/me/sendMail';
const MAIL_SUBJECT_PREFIX = process.env.MAIL_SUBJECT_PREFIX || '[OVR]';
const MAIL_ENABLED = process.env.MAIL_NOTIFICATIONS_ENABLED !== 'false';

const QI_NOTIFICATION_ROLES: AppRole[] = [
  APP_ROLES.SUPER_ADMIN,
  APP_ROLES.QUALITY_MANAGER,
  APP_ROLES.QUALITY_ANALYST,
  APP_ROLES.DEVELOPER,
];

type Actor = Pick<Session['user'], 'id' | 'name' | 'email'>;

export type WorkflowMailEvent =
  | 'incident_submitted'
  | 'incident_reviewed'
  | 'investigation_created'
  | 'shared_access_invited'
  | 'investigation_submitted'
  | 'corrective_action_created'
  | 'corrective_action_closed'
  | 'incident_closed';

interface WorkflowMailPayloadMap {
  incident_submitted: {
    incidentId: string;
  };
  incident_reviewed: {
    incidentId: string;
    decision: 'approve' | 'reject';
    rejectionReason?: string | null;
    reporterEmail?: string | null;
  };
  investigation_created: {
    incidentId: string;
    investigationId: number;
    investigatorIds: number[];
  };
  shared_access_invited: {
    incidentId: string;
    resourceType: 'investigation' | 'corrective_action';
    resourceId: number;
    inviteeEmail: string;
    role: 'investigator' | 'action_handler' | 'viewer';
    accessUrl: string;
  };
  investigation_submitted: {
    incidentId: string;
    investigationId: number;
    reporterEmail?: string | null;
  };
  corrective_action_created: {
    incidentId: string;
    actionId: number;
    title: string;
    assigneeIds: number[];
  };
  corrective_action_closed: {
    incidentId: string;
    actionId: number;
    title: string;
    reporterEmail?: string | null;
  };
  incident_closed: {
    incidentId: string;
    reporterEmail?: string | null;
  };
}

interface MailEnvelope {
  to: string[];
  subject: string;
  html: string;
  text: string;
}

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;

  const normalized = email.trim().toLowerCase();
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

function dedupeEmails(emails: Array<string | null | undefined>): string[] {
  const normalized = emails
    .map((email) => normalizeEmail(email))
    .filter((email): email is string => Boolean(email));

  return [...new Set(normalized)];
}

function appUrl(path: string): string {
  const base = process.env.NEXTAUTH_URL || 'http://localhost:3005';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

function incidentUrl(incidentId: string): string {
  return appUrl(`/incidents/view/${incidentId}`);
}

function investigationUrl(investigationId: number): string {
  return appUrl(`/incidents/investigations/${investigationId}`);
}

function correctiveActionUrl(actionId: number): string {
  return appUrl(`/incidents/corrective-actions/${actionId}`);
}

async function getQIEmails(excludeEmail?: string): Promise<string[]> {
  const allUsers = await db
    .select({
      email: users.email,
      roles: users.roles,
      isActive: users.isActive,
    })
    .from(users);

  const excluded = normalizeEmail(excludeEmail);

  return dedupeEmails(
    allUsers
      .filter((user) => user.isActive && user.roles?.some((role) => QI_NOTIFICATION_ROLES.includes(role as AppRole)))
      .map((user) => user.email)
      .filter((email) => normalizeEmail(email) !== excluded)
  );
}

async function getEmailsByUserIds(userIds: number[], excludeEmail?: string): Promise<string[]> {
  const uniqueIds = [...new Set(userIds.filter((id) => Number.isInteger(id) && id > 0))];

  if (!uniqueIds.length) {
    return [];
  }

  const matched = await db
    .select({
      email: users.email,
      isActive: users.isActive,
    })
    .from(users)
    .where(inArray(users.id, uniqueIds));

  const excluded = normalizeEmail(excludeEmail);

  return dedupeEmails(
    matched
      .filter((user) => user.isActive)
      .map((user) => user.email)
      .filter((email) => normalizeEmail(email) !== excluded)
  );
}

async function getReporterEmail(incidentId: string): Promise<string | null> {
  const [report] = await db
    .select({ reporterId: ovrReports.reporterId })
    .from(ovrReports)
    .where(eq(ovrReports.id, incidentId))
    .limit(1);

  if (!report?.reporterId) {
    return null;
  }

  const [reporter] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, report.reporterId))
    .limit(1);

  return normalizeEmail(reporter?.email);
}

function buildMessage(
  title: string,
  intro: string,
  actor: Actor,
  linkLabel: string,
  linkUrl: string,
  details?: string
): { html: string; text: string } {
  const actorLabel = actor.name?.trim() || actor.email;
  const detailsHtml = details ? `<p style="margin:0 0 12px;">${details}</p>` : '';
  const detailsText = details ? `${details}\n\n` : '';

  const html = `
    <div style="font-family:Segoe UI,Arial,sans-serif;line-height:1.5;color:#111827;">
      <h2 style="margin:0 0 12px;">${title}</h2>
      <p style="margin:0 0 12px;">${intro}</p>
      ${detailsHtml}
      <p style="margin:0 0 16px;">Triggered by: <strong>${actorLabel}</strong></p>
      <p style="margin:0 0 16px;">
        <a href="${linkUrl}" style="background:#2563eb;color:#fff;text-decoration:none;padding:10px 14px;border-radius:6px;display:inline-block;">${linkLabel}</a>
      </p>
      <p style="margin:0;color:#6b7280;font-size:12px;">Automated notification from OVR App</p>
    </div>
  `;

  const text = `${title}\n\n${intro}\n\n${detailsText}Triggered by: ${actorLabel}\n${linkLabel}: ${linkUrl}\n\nAutomated notification from OVR App`;

  return { html, text };
}

async function buildEnvelope<T extends WorkflowMailEvent>(
  event: T,
  payload: WorkflowMailPayloadMap[T],
  actor: Actor
): Promise<MailEnvelope | null> {
  switch (event) {
    case 'incident_submitted': {
      const { incidentId } = payload as WorkflowMailPayloadMap['incident_submitted'];
      const recipients = await getQIEmails(actor.email);

      if (!recipients.length) {
        return null;
      }

      const { html, text } = buildMessage(
        'New Incident Submitted',
        `Incident ${incidentId} has been submitted and is awaiting QI review.`,
        actor,
        'Open Incident',
        incidentUrl(incidentId)
      );

      return {
        to: recipients,
        subject: `${MAIL_SUBJECT_PREFIX} Incident ${incidentId} submitted`,
        html,
        text,
      };
    }

    case 'incident_reviewed': {
      const { incidentId, decision, rejectionReason, reporterEmail } = payload as WorkflowMailPayloadMap['incident_reviewed'];
      const resolvedReporter = normalizeEmail(reporterEmail) || (await getReporterEmail(incidentId));

      if (!resolvedReporter) {
        return null;
      }

      const isApproved = decision === 'approve';
      const details = isApproved
        ? 'Your report has been reviewed by QI and moved forward in the workflow.'
        : `Your report requires updates before it can proceed.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`;

      const { html, text } = buildMessage(
        isApproved ? 'Incident Approved by QI' : 'Incident Returned by QI',
        `Incident ${incidentId} has been ${isApproved ? 'approved' : 'reviewed with requested changes'}.`,
        actor,
        'Review Incident',
        incidentUrl(incidentId),
        details
      );

      return {
        to: [resolvedReporter],
        subject: `${MAIL_SUBJECT_PREFIX} Incident ${incidentId} ${isApproved ? 'approved' : 'needs updates'}`,
        html,
        text,
      };
    }

    case 'investigation_created': {
      const { incidentId, investigationId, investigatorIds } = payload as WorkflowMailPayloadMap['investigation_created'];
      const recipients = await getEmailsByUserIds(investigatorIds, actor.email);

      if (!recipients.length) {
        return null;
      }

      const { html, text } = buildMessage(
        'You have been assigned to an investigation',
        `Investigation INV-${investigationId} for incident ${incidentId} has been assigned to you.`,
        actor,
        'Open Investigation',
        investigationUrl(investigationId)
      );

      return {
        to: recipients,
        subject: `${MAIL_SUBJECT_PREFIX} Investigation INV-${investigationId} assigned`,
        html,
        text,
      };
    }

    case 'shared_access_invited': {
      const {
        incidentId,
        resourceType,
        resourceId,
        inviteeEmail,
        role,
        accessUrl,
      } = payload as WorkflowMailPayloadMap['shared_access_invited'];

      const recipient = normalizeEmail(inviteeEmail);
      if (!recipient || recipient === normalizeEmail(actor.email)) {
        return null;
      }

      const readableType = resourceType === 'investigation' ? 'investigation' : 'corrective action';
      const readableRole = role === 'investigator'
        ? 'investigator'
        : role === 'action_handler'
          ? 'action handler'
          : 'viewer';

      const { html, text } = buildMessage(
        'You have been invited to OVR shared access',
        `You were invited as ${readableRole} for ${readableType} #${resourceId} on incident ${incidentId}.`,
        actor,
        'Open Shared Link',
        accessUrl,
        'Use the link below to access the assigned work directly.'
      );

      return {
        to: [recipient],
        subject: `${MAIL_SUBJECT_PREFIX} Shared access invitation for incident ${incidentId}`,
        html,
        text,
      };
    }

    case 'investigation_submitted': {
      const { incidentId, investigationId, reporterEmail } = payload as WorkflowMailPayloadMap['investigation_submitted'];

      const qiRecipients = await getQIEmails(actor.email);
      const resolvedReporter = normalizeEmail(reporterEmail) || (await getReporterEmail(incidentId));
      const recipients = dedupeEmails([...qiRecipients, resolvedReporter]);

      if (!recipients.length) {
        return null;
      }

      const { html, text } = buildMessage(
        'Investigation submitted',
        `Investigation INV-${investigationId} for incident ${incidentId} has been submitted.`,
        actor,
        'Open Investigation',
        investigationUrl(investigationId)
      );

      return {
        to: recipients,
        subject: `${MAIL_SUBJECT_PREFIX} Investigation INV-${investigationId} submitted`,
        html,
        text,
      };
    }

    case 'corrective_action_created': {
      const { incidentId, actionId, title, assigneeIds } = payload as WorkflowMailPayloadMap['corrective_action_created'];
      const recipients = await getEmailsByUserIds(assigneeIds, actor.email);

      if (!recipients.length) {
        return null;
      }

      const { html, text } = buildMessage(
        'You have been assigned a corrective action',
        `Corrective action #${actionId} for incident ${incidentId} has been assigned to you.`,
        actor,
        'Open Corrective Action',
        correctiveActionUrl(actionId),
        `Action: ${title}`
      );

      return {
        to: recipients,
        subject: `${MAIL_SUBJECT_PREFIX} Corrective action #${actionId} assigned`,
        html,
        text,
      };
    }

    case 'corrective_action_closed': {
      const { incidentId, actionId, title, reporterEmail } = payload as WorkflowMailPayloadMap['corrective_action_closed'];
      const qiRecipients = await getQIEmails(actor.email);
      const resolvedReporter = normalizeEmail(reporterEmail) || (await getReporterEmail(incidentId));
      const recipients = dedupeEmails([...qiRecipients, resolvedReporter]);

      if (!recipients.length) {
        return null;
      }

      const { html, text } = buildMessage(
        'Corrective action closed',
        `Corrective action #${actionId} for incident ${incidentId} was marked as closed.`,
        actor,
        'Open Corrective Action',
        correctiveActionUrl(actionId),
        `Action: ${title}`
      );

      return {
        to: recipients,
        subject: `${MAIL_SUBJECT_PREFIX} Corrective action #${actionId} closed`,
        html,
        text,
      };
    }

    case 'incident_closed': {
      const { incidentId, reporterEmail } = payload as WorkflowMailPayloadMap['incident_closed'];
      const recipient = normalizeEmail(reporterEmail) || (await getReporterEmail(incidentId));

      if (!recipient) {
        return null;
      }

      const { html, text } = buildMessage(
        'Incident closed',
        `Incident ${incidentId} has been fully closed by QI.`,
        actor,
        'View Incident',
        incidentUrl(incidentId)
      );

      return {
        to: [recipient],
        subject: `${MAIL_SUBJECT_PREFIX} Incident ${incidentId} closed`,
        html,
        text,
      };
    }

    default:
      return null;
  }
}

async function sendMailWithGraph(accessToken: string, envelope: MailEnvelope): Promise<void> {
  const response = await fetch(GRAPH_SEND_MAIL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject: envelope.subject,
        body: {
          contentType: 'HTML',
          content: envelope.html,
        },
        toRecipients: envelope.to.map((address) => ({
          emailAddress: { address },
        })),
      },
      saveToSentItems: true,
    }),
  });

  if (!response.ok) {
    const raw = await response.text();
    throw new Error(`Microsoft Graph sendMail failed (${response.status}): ${raw}`);
  }
}

export async function sendWorkflowMail<T extends WorkflowMailEvent>(
  request: NextRequest,
  actor: Actor,
  event: T,
  payload: WorkflowMailPayloadMap[T]
): Promise<void> {
  if (!MAIL_ENABLED) {
    return;
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const accessToken = typeof token?.accessToken === 'string' ? token.accessToken : null;

  if (!accessToken) {
    throw new Error('No delegated access token available for workflow mail');
  }

  if (token?.tokenError) {
    throw new Error(`Delegated token unavailable: ${token.tokenError}`);
  }

  const envelope = await buildEnvelope(event, payload, actor);
  if (!envelope || !envelope.to.length) {
    return;
  }

  await sendMailWithGraph(accessToken, envelope);
}

export async function sendWorkflowMailSafely<T extends WorkflowMailEvent>(
  request: NextRequest,
  actor: Actor,
  event: T,
  payload: WorkflowMailPayloadMap[T]
): Promise<void> {
  try {
    await sendWorkflowMail(request, actor, event, payload);
  } catch (error) {
    console.error('Workflow mail dispatch failed:', {
      event,
      actorEmail: actor.email,
      payload,
      error,
    });
  }
}
