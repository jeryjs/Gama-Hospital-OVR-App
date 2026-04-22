import { db } from '@/db';
import { ovrCorrectiveActions, ovrInvestigations, ovrMailOutbox, ovrReports, users } from '@/db/schema';
import { APP_ROLES, type AppRole } from '@/lib/constants';
import { and, asc, eq, inArray, lte } from 'drizzle-orm';
import nodemailer, { type Transporter } from 'nodemailer';
import directTransport from 'nodemailer-direct-transport';
import type { Session } from 'next-auth';
import type { NextRequest } from 'next/server';

const MAIL_SUBJECT_PREFIX = process.env.MAIL_SUBJECT_PREFIX || '[OVR]';
const MAIL_ENABLED = process.env.MAIL_NOTIFICATIONS_ENABLED !== 'false';
const MAIL_OUTBOX_MAX_ATTEMPTS = Number(process.env.MAIL_OUTBOX_MAX_ATTEMPTS || 5);
const MAIL_OUTBOX_BASE_RETRY_MINUTES = Number(process.env.MAIL_OUTBOX_BASE_RETRY_MINUTES || 5);
const MAIL_OUTBOX_DEFAULT_BATCH = Number(process.env.MAIL_OUTBOX_RETRY_BATCH || 10);
const MAIL_TRANSPORT = (process.env.MAIL_TRANSPORT || 'smtp').trim().toLowerCase();
const MAIL_SMTP_HOST = (process.env.MAIL_SMTP_HOST || '').trim();
const MAIL_SMTP_PORT = Number(process.env.MAIL_SMTP_PORT || 587);
const MAIL_SMTP_SECURE = process.env.MAIL_SMTP_SECURE === 'true';
const MAIL_SMTP_USER = (process.env.MAIL_SMTP_USER || '').trim();
const MAIL_SMTP_PASS = process.env.MAIL_SMTP_PASS || '';
const MAIL_DIRECT_HOSTNAME = (process.env.MAIL_DIRECT_HOSTNAME || 'localhost').trim();
const MAIL_NO_REPLY_FROM = (
    process.env.MAIL_NO_REPLY_FROM ||
    (MAIL_SMTP_USER ? `OVR Notifications <${MAIL_SMTP_USER}>` : 'OVR Notifications <no-reply@localhost>')
).trim();
const MAIL_NO_REPLY_REPLY_TO = (process.env.MAIL_NO_REPLY_REPLY_TO || '').trim();
const MAIL_OUTBOX_PROCESS_INLINE = process.env.MAIL_OUTBOX_PROCESS_INLINE
    ? process.env.MAIL_OUTBOX_PROCESS_INLINE === 'true'
    : process.env.NODE_ENV === 'production';

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
    | 'incident_closed'
    | 'incident_commented';

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
    incident_commented: {
        incidentId: string;
        commentPreview?: string | null;
    };
}

interface MailEnvelope {
    to: string[];
    subject: string;
    html: string;
    text: string;
}

export interface MailOutboxProcessingResult {
    processed: number;
    sent: number;
    failed: number;
    pending: number;
}

class NonRetryableMailError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'NonRetryableMailError';
    }
}

let mailTransportCache: Transporter | null = null;

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

function toActorUserId(actor: Actor): number {
    const userId = Number(actor.id);
    if (!Number.isInteger(userId) || userId <= 0) {
        throw new Error(`Invalid actor user id: ${actor.id}`);
    }

    return userId;
}

function isWorkflowMailEvent(value: string): value is WorkflowMailEvent {
    return [
        'incident_submitted',
        'incident_reviewed',
        'investigation_created',
        'shared_access_invited',
        'investigation_submitted',
        'corrective_action_created',
        'corrective_action_closed',
        'incident_closed',
        'incident_commented',
    ].includes(value);
}

function computeNextRetryAt(attempts: number): Date {
    const multiplier = Math.max(1, 2 ** Math.max(0, attempts - 1));
    const delayMinutes = Math.min(24 * 60, MAIL_OUTBOX_BASE_RETRY_MINUTES * multiplier);
    return new Date(Date.now() + delayMinutes * 60_000);
}

function isRetryableMailError(error: unknown): boolean {
    if (error instanceof NonRetryableMailError) {
        return false;
    }

    if (!(error instanceof Error)) {
        return true;
    }

    const nestedError = Array.isArray((error as { errors?: unknown[] }).errors)
        ? (error as { errors?: unknown[] }).errors?.[0]
        : null;

    const codeSource = nestedError && typeof nestedError === 'object'
        ? (nestedError as { code?: unknown })
        : (error as { code?: unknown });

    const code = typeof codeSource.code === 'string'
        ? codeSource.code
        : null;

    if (code === 'EAUTH' || code === 'EENVELOPE') {
        return false;
    }

    const responseCodeSource = nestedError && typeof nestedError === 'object'
        ? (nestedError as { responseCode?: unknown })
        : (error as { responseCode?: unknown });

    const rawResponseCode = responseCodeSource.responseCode;
    const responseCode: number | null = typeof rawResponseCode === 'number'
        ? rawResponseCode
        : null;

    if (responseCode !== null && responseCode >= 500 && responseCode < 600) {
        return false;
    }

    if (responseCode !== null && responseCode >= 400 && responseCode < 500) {
        return true;
    }

    return true;
}

function getConfiguredTransport(): Transporter {
    if (mailTransportCache) {
        return mailTransportCache;
    }

    if (MAIL_TRANSPORT === 'smtp') {
        if (!MAIL_SMTP_HOST || !MAIL_SMTP_USER || !MAIL_SMTP_PASS) {
            throw new NonRetryableMailError('Missing SMTP mail configuration (MAIL_SMTP_HOST, MAIL_SMTP_USER, MAIL_SMTP_PASS)');
        }

        if (!Number.isFinite(MAIL_SMTP_PORT) || MAIL_SMTP_PORT <= 0) {
            throw new NonRetryableMailError('MAIL_SMTP_PORT must be a positive number');
        }

        mailTransportCache = nodemailer.createTransport({
            host: MAIL_SMTP_HOST,
            port: MAIL_SMTP_PORT,
            secure: MAIL_SMTP_SECURE,
            auth: {
                user: MAIL_SMTP_USER,
                pass: MAIL_SMTP_PASS,
            },
        });

        return mailTransportCache;
    }

    if (MAIL_TRANSPORT === 'direct') {
        mailTransportCache = nodemailer.createTransport(directTransport({
            name: MAIL_DIRECT_HOSTNAME,
        }));

        return mailTransportCache;
    }

    throw new NonRetryableMailError('Invalid MAIL_TRANSPORT value. Use "smtp" or "direct".');
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

async function getIncidentParticipantEmails(incidentId: string, excludeEmail?: string): Promise<string[]> {
    const [report, investigations, actions, qiEmails] = await Promise.all([
        db
            .select({ reporterId: ovrReports.reporterId })
            .from(ovrReports)
            .where(eq(ovrReports.id, incidentId))
            .limit(1)
            .then((rows) => rows[0]),
        db
            .select({ investigators: ovrInvestigations.investigators })
            .from(ovrInvestigations)
            .where(eq(ovrInvestigations.ovrReportId, incidentId)),
        db
            .select({ assignees: ovrCorrectiveActions.assignedTo })
            .from(ovrCorrectiveActions)
            .where(eq(ovrCorrectiveActions.ovrReportId, incidentId)),
        getQIEmails(excludeEmail),
    ]);

    const participantIds = new Set<number>();

    if (report?.reporterId) {
        participantIds.add(report.reporterId);
    }

    for (const investigation of investigations) {
        for (const investigatorId of investigation.investigators || []) {
            if (Number.isInteger(investigatorId) && investigatorId > 0) {
                participantIds.add(investigatorId);
            }
        }
    }

    for (const action of actions) {
        for (const assigneeId of action.assignees || []) {
            if (Number.isInteger(assigneeId) && assigneeId > 0) {
                participantIds.add(assigneeId);
            }
        }
    }

    const participantEmails = participantIds.size
        ? await db
            .select({ email: users.email, isActive: users.isActive })
            .from(users)
            .where(inArray(users.id, [...participantIds]))
        : [];

    const excluded = normalizeEmail(excludeEmail);

    return dedupeEmails([
        ...qiEmails,
        ...participantEmails
            .filter((user) => user.isActive)
            .map((user) => user.email),
    ]).filter((email) => email !== excluded);
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

function getCommentPreview(commentPreview: string | null | undefined): string | null {
    if (!commentPreview) {
        return null;
    }

    const normalized = commentPreview.trim();
    if (!normalized) {
        return null;
    }

    if (normalized.length <= 240) {
        return normalized;
    }

    return `${normalized.slice(0, 237)}...`;
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

        case 'incident_commented': {
            const { incidentId, commentPreview } = payload as WorkflowMailPayloadMap['incident_commented'];
            const recipients = await getIncidentParticipantEmails(incidentId, actor.email);

            if (!recipients.length) {
                return null;
            }

            const preview = getCommentPreview(commentPreview);

            const { html, text } = buildMessage(
                'New incident comment',
                `A new comment was added on incident ${incidentId}.`,
                actor,
                'Open Incident',
                incidentUrl(incidentId),
                preview ? `Comment: ${preview}` : undefined
            );

            return {
                to: recipients,
                subject: `${MAIL_SUBJECT_PREFIX} New comment on incident ${incidentId}`,
                html,
                text,
            };
        }

        default:
            return null;
    }
}

async function dispatchEnvelope(actor: Actor, envelope: MailEnvelope): Promise<void> {
    const actorEmail = normalizeEmail(actor.email);
    const replyTo = MAIL_NO_REPLY_REPLY_TO || undefined;

    if (!actorEmail) {
        throw new NonRetryableMailError('Actor email is required to send mail');
    }

    // Prevent sending emails to fake test users
    if (actorEmail.startsWith('test.')) return console.warn(`Skipping email dispatch for test user: ${actorEmail}`);
    // Filter out test recipients
    const filteredRecipients = envelope.to.filter(email => !email.startsWith('test.'));
    if (!filteredRecipients.length) return console.warn('All recipients are test users, skipping email dispatch');

    const transport = getConfiguredTransport();

    await transport.sendMail({
        from: MAIL_NO_REPLY_FROM,
        replyTo,
        to: filteredRecipients,
        subject: envelope.subject,
        html: envelope.html,
        text: envelope.text,
        headers: actorEmail
            ? {
                'X-OVR-Actor': actorEmail,
            }
            : undefined,
    });
}

function withActorEmail(actor: Actor, actorEmail: string): Actor {
    return {
        ...actor,
        email: actorEmail,
    };
}

async function enqueueMailOutbox<T extends WorkflowMailEvent>(
    actor: Actor,
    event: T,
    payload: WorkflowMailPayloadMap[T],
    error: unknown
): Promise<void> {
    const actorEmail = normalizeEmail(actor.email);
    if (!actorEmail) {
        return;
    }

    const actorUserId = toActorUserId(actor);
    const now = new Date();

    await db.insert(ovrMailOutbox).values({
        event,
        payload: JSON.stringify(payload),
        actorUserId,
        actorEmail,
        status: 'pending',
        attempts: 1,
        lastError: error instanceof Error ? error.message : String(error),
        lastAttemptAt: now,
        nextRetryAt: computeNextRetryAt(1),
        createdAt: now,
        updatedAt: now,
    });
}

async function processOutboxBatchForActor(
    actor: Actor,
    limit = MAIL_OUTBOX_DEFAULT_BATCH
): Promise<MailOutboxProcessingResult> {
    const actorUserId = toActorUserId(actor);
    const now = new Date();

    const pendingRows = await db
        .select()
        .from(ovrMailOutbox)
        .where(
            and(
                eq(ovrMailOutbox.actorUserId, actorUserId),
                eq(ovrMailOutbox.status, 'pending'),
                lte(ovrMailOutbox.nextRetryAt, now)
            )
        )
        .orderBy(asc(ovrMailOutbox.createdAt))
        .limit(Math.max(1, limit));

    const result: MailOutboxProcessingResult = {
        processed: 0,
        sent: 0,
        failed: 0,
        pending: 0,
    };

    for (const row of pendingRows) {
        result.processed += 1;
        const attempts = row.attempts + 1;
        const attemptTime = new Date();

        try {
            if (!isWorkflowMailEvent(row.event)) {
                throw new NonRetryableMailError(`Unsupported outbox event: ${row.event}`);
            }

            const parsedPayload = JSON.parse(row.payload || '{}') as WorkflowMailPayloadMap[typeof row.event];
            const envelope = await buildEnvelope(row.event, parsedPayload, actor);

            if (!envelope || !envelope.to.length) {
                await db
                    .update(ovrMailOutbox)
                    .set({
                        status: 'sent',
                        attempts,
                        lastAttemptAt: attemptTime,
                        sentAt: attemptTime,
                        lastError: null,
                        updatedAt: attemptTime,
                    })
                    .where(eq(ovrMailOutbox.id, row.id));

                result.sent += 1;
                continue;
            }

            await dispatchEnvelope(withActorEmail(actor, row.actorEmail), envelope);

            await db
                .update(ovrMailOutbox)
                .set({
                    status: 'sent',
                    attempts,
                    lastAttemptAt: attemptTime,
                    sentAt: attemptTime,
                    lastError: null,
                    updatedAt: attemptTime,
                })
                .where(eq(ovrMailOutbox.id, row.id));

            result.sent += 1;
        } catch (error) {
            const retryable = isRetryableMailError(error);
            const reachedMaxAttempts = !retryable || attempts >= MAIL_OUTBOX_MAX_ATTEMPTS;

            await db
                .update(ovrMailOutbox)
                .set({
                    status: reachedMaxAttempts ? 'failed' : 'pending',
                    attempts,
                    lastAttemptAt: attemptTime,
                    lastError: error instanceof Error ? error.message : String(error),
                    nextRetryAt: reachedMaxAttempts ? attemptTime : computeNextRetryAt(attempts),
                    updatedAt: attemptTime,
                })
                .where(eq(ovrMailOutbox.id, row.id));

            if (reachedMaxAttempts) {
                result.failed += 1;
            } else {
                result.pending += 1;
            }
        }
    }

    return result;
}

export async function sendWorkflowMail<T extends WorkflowMailEvent>(
    request: NextRequest,
    actor: Actor,
    event: T,
    payload: WorkflowMailPayloadMap[T]
): Promise<void> {
    void request;

    if (!MAIL_ENABLED) {
        return;
    }

    if (MAIL_OUTBOX_PROCESS_INLINE) {
        await processOutboxBatchForActor(actor, MAIL_OUTBOX_DEFAULT_BATCH);
    }

    const envelope = await buildEnvelope(event, payload, actor);
    if (!envelope || !envelope.to.length) {
        return;
    }

    await dispatchEnvelope(actor, envelope);
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
        const retryable = isRetryableMailError(error);

        if (retryable) {
            try {
                await enqueueMailOutbox(actor, event, payload, error);
            } catch (queueError) {
                console.error('Workflow mail enqueue failed:', {
                    event,
                    actorEmail: actor.email,
                    payload,
                    queueError,
                });
            }
        }

        console.error('Workflow mail dispatch failed:', {
            event,
            actorEmail: actor.email,
            payload,
            error,
            retryable,
        });
    }
}

export async function processMailOutboxForActor(
    request: NextRequest,
    actor: Actor,
    limit = MAIL_OUTBOX_DEFAULT_BATCH
): Promise<MailOutboxProcessingResult> {
    void request;

    if (!MAIL_ENABLED) {
        return {
            processed: 0,
            sent: 0,
            failed: 0,
            pending: 0,
        };
    }

    return processOutboxBatchForActor(actor, limit);
}
