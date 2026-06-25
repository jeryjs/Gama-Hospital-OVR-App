import { db } from '@/db';
import { userNotifications, userPushSubscriptions, users } from '@/db/schema';
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import webpush from 'web-push';

const WEB_PUSH_PUBLIC_KEY = (process.env.WEB_PUSH_PUBLIC_KEY || '').trim();
const WEB_PUSH_PRIVATE_KEY = (process.env.WEB_PUSH_PRIVATE_KEY || '').trim();
const WEB_PUSH_SUBJECT = (process.env.WEB_PUSH_SUBJECT || process.env.MAIL_NO_REPLY_REPLY_TO || 'mailto:admin@example.com').trim();
const WEB_PUSH_ENABLED = Boolean(WEB_PUSH_PUBLIC_KEY && WEB_PUSH_PRIVATE_KEY && WEB_PUSH_SUBJECT);

if (WEB_PUSH_ENABLED) {
    webpush.setVapidDetails(WEB_PUSH_SUBJECT, WEB_PUSH_PUBLIC_KEY, WEB_PUSH_PRIVATE_KEY);
}

export type WorkflowNotificationEvent =
    | 'incident_submitted'
    | 'incident_reviewed'
    | 'investigation_created'
    | 'shared_access_invited'
    | 'investigation_submitted'
    | 'corrective_action_created'
    | 'corrective_action_closed'
    | 'incident_closed'
    | 'incident_commented';

export interface WorkflowNotificationPayloadMap {
    incident_submitted: { incidentId: string };
    incident_reviewed: {
        incidentId: string;
        decision: 'approve' | 'reject';
        rejectionReason?: string | null;
        reporterEmail?: string | null;
    };
    investigation_created: { incidentId: string; investigationId: number; investigatorIds: number[] };
    shared_access_invited: {
        incidentId: string;
        resourceType: 'investigation' | 'corrective_action';
        resourceId: number;
        inviteeEmail: string;
        role: 'investigator' | 'action_handler' | 'viewer';
        accessUrl: string;
    };
    investigation_submitted: { incidentId: string; investigationId: number; reporterEmail?: string | null };
    corrective_action_created: { incidentId: string; actionId: number; title: string; assigneeIds: number[] };
    corrective_action_closed: { incidentId: string; actionId: number; title: string; reporterEmail?: string | null };
    incident_closed: { incidentId: string; reporterEmail?: string | null };
    incident_commented: { incidentId: string; commentPreview?: string | null };
}

export type NotificationEvent =
    | 'incident_submitted'
    | 'incident_reviewed'
    | 'investigation_created'
    | 'shared_access_invited'
    | 'investigation_submitted'
    | 'corrective_action_created'
    | 'corrective_action_closed'
    | 'incident_closed'
    | 'incident_commented';

export interface NotificationPayload {
    title: string;
    body: string;
    url?: string | null;
    metadata?: Record<string, unknown> | null;
}

export interface NotificationActor {
    userId: number;
    email: string;
}

export interface CreateNotificationsInput extends NotificationPayload {
    event: NotificationEvent;
    recipientUserIds: number[];
    actor?: NotificationActor;
}

function notificationTitle(event: WorkflowNotificationEvent, payload: WorkflowNotificationPayloadMap[typeof event]): string {
    switch (event) {
        case 'incident_submitted':
            return `Incident ${(payload as WorkflowNotificationPayloadMap['incident_submitted']).incidentId} submitted`;
        case 'incident_reviewed':
            return `Incident ${(payload as WorkflowNotificationPayloadMap['incident_reviewed']).incidentId} reviewed`;
        case 'investigation_created':
            return `Investigation INV-${(payload as WorkflowNotificationPayloadMap['investigation_created']).investigationId} assigned`;
        case 'shared_access_invited':
            return `Shared access invitation for incident ${(payload as WorkflowNotificationPayloadMap['shared_access_invited']).incidentId}`;
        case 'investigation_submitted':
            return `Investigation INV-${(payload as WorkflowNotificationPayloadMap['investigation_submitted']).investigationId} submitted`;
        case 'corrective_action_created':
            return `Corrective action #${(payload as WorkflowNotificationPayloadMap['corrective_action_created']).actionId} assigned`;
        case 'corrective_action_closed':
            return `Corrective action #${(payload as WorkflowNotificationPayloadMap['corrective_action_closed']).actionId} closed`;
        case 'incident_closed':
            return `Incident ${(payload as WorkflowNotificationPayloadMap['incident_closed']).incidentId} closed`;
        case 'incident_commented':
            return `New comment on incident ${(payload as WorkflowNotificationPayloadMap['incident_commented']).incidentId}`;
    }
}

function notificationBody(event: WorkflowNotificationEvent, payload: WorkflowNotificationPayloadMap[typeof event]): string {
    switch (event) {
        case 'incident_submitted':
            return `Incident ${(payload as WorkflowNotificationPayloadMap['incident_submitted']).incidentId} is awaiting review.`;
        case 'incident_reviewed': {
            const reviewed = payload as WorkflowNotificationPayloadMap['incident_reviewed'];
            return reviewed.decision === 'approve'
                ? `Incident ${reviewed.incidentId} was approved.`
                : `Incident ${reviewed.incidentId} needs updates${reviewed.rejectionReason ? `: ${reviewed.rejectionReason}` : ''}.`;
        }
        case 'investigation_created':
            return `Investigation INV-${(payload as WorkflowNotificationPayloadMap['investigation_created']).investigationId} has been assigned.`;
        case 'shared_access_invited': {
            const invited = payload as WorkflowNotificationPayloadMap['shared_access_invited'];
            return `You were invited as ${invited.role.replace('_', ' ')} for incident ${invited.incidentId}.`;
        }
        case 'investigation_submitted':
            return `Investigation INV-${(payload as WorkflowNotificationPayloadMap['investigation_submitted']).investigationId} has been submitted.`;
        case 'corrective_action_created': {
            const action = payload as WorkflowNotificationPayloadMap['corrective_action_created'];
            return `Corrective action #${action.actionId} has been assigned: ${action.title}`;
        }
        case 'corrective_action_closed':
            return `Corrective action #${(payload as WorkflowNotificationPayloadMap['corrective_action_closed']).actionId} was closed.`;
        case 'incident_closed':
            return `Incident ${(payload as WorkflowNotificationPayloadMap['incident_closed']).incidentId} has been closed.`;
        case 'incident_commented': {
            const comment = payload as WorkflowNotificationPayloadMap['incident_commented'];
            return comment.commentPreview
                ? `New comment: ${comment.commentPreview}`
                : 'A new comment was added.';
        }
    }
}

function notificationUrl(event: WorkflowNotificationEvent, payload: WorkflowNotificationPayloadMap[typeof event]): string | null {
    switch (event) {
        case 'investigation_created':
        case 'investigation_submitted':
            return `/incidents/investigations/${(payload as WorkflowNotificationPayloadMap['investigation_created'] | WorkflowNotificationPayloadMap['investigation_submitted']).investigationId}`;
        case 'corrective_action_created':
        case 'corrective_action_closed':
            return `/incidents/corrective-actions/${(payload as WorkflowNotificationPayloadMap['corrective_action_created'] | WorkflowNotificationPayloadMap['corrective_action_closed']).actionId}`;
        case 'shared_access_invited':
            return (payload as WorkflowNotificationPayloadMap['shared_access_invited']).accessUrl;
        case 'incident_submitted':
        case 'incident_reviewed':
        case 'incident_closed':
        case 'incident_commented':
            return `/incidents/view/${(payload as { incidentId: string }).incidentId}`;
    }
}

export async function createWorkflowNotification<T extends WorkflowNotificationEvent>(
    event: T,
    payload: WorkflowNotificationPayloadMap[T],
    recipientUserIds: number[],
    actor?: NotificationActor
): Promise<void> {
    await createInAppNotifications({
        event,
        recipientUserIds,
        actor,
        title: notificationTitle(event, payload),
        body: notificationBody(event, payload),
        url: notificationUrl(event, payload),
        metadata: payload as Record<string, unknown>,
    });
}

function toUniqueUserIds(userIds: number[]): number[] {
    return [...new Set(userIds.filter((value) => Number.isInteger(value) && value > 0))];
}

async function createHistoryEntries(input: CreateNotificationsInput): Promise<void> {
    const recipientUserIds = toUniqueUserIds(input.recipientUserIds);
    if (!recipientUserIds.length) return;

    await db.insert(userNotifications).values(
        recipientUserIds.map((userId) => ({
            userId,
            event: input.event,
            title: input.title,
            body: input.body,
            url: input.url || null,
            actorUserId: input.actor?.userId ?? null,
            actorEmail: input.actor?.email || null,
            metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        }))
    );
}

export async function createInAppNotifications(input: CreateNotificationsInput): Promise<void> {
    await createHistoryEntries(input);
    await sendPushNotifications(input);
}

async function sendPushNotifications(input: CreateNotificationsInput): Promise<void> {
    if (!WEB_PUSH_ENABLED) return;

    const recipientUserIds = toUniqueUserIds(input.recipientUserIds);
    if (!recipientUserIds.length) return;

    const subscriptions = await db.query.userPushSubscriptions.findMany({
        where: inArray(userPushSubscriptions.userId, recipientUserIds),
    });

    if (!subscriptions.length) return;

    const payload = JSON.stringify({
        title: input.title,
        body: input.body,
        url: input.url || '/notifications',
        event: input.event,
    });

    await Promise.allSettled(subscriptions.map(async (subscription) => {
        try {
            await webpush.sendNotification({
                endpoint: subscription.endpoint,
                keys: {
                    p256dh: subscription.p256dh,
                    auth: subscription.auth,
                },
            }, payload, { TTL: 60 * 60, urgency: 'normal' });
        } catch (error) {
            const statusCode = typeof error === 'object' && error && 'statusCode' in error
                ? Number((error as { statusCode?: number }).statusCode)
                : 0;

            if (statusCode === 404 || statusCode === 410) {
                await db.delete(userPushSubscriptions).where(eq(userPushSubscriptions.id, subscription.id));
            } else {
                console.error('Push notification failed:', error);
            }
        }
    }));
}

export function getWebPushPublicKey(): string | null {
    return WEB_PUSH_ENABLED ? WEB_PUSH_PUBLIC_KEY : null;
}

export async function getNotificationSummary(userId: number) {
    const [unreadSummary, recentNotifications] = await Promise.all([
        db
            .select({ count: count() })
            .from(userNotifications)
            .where(and(eq(userNotifications.userId, userId), eq(userNotifications.isRead, false))),
        db.query.userNotifications.findMany({
            where: eq(userNotifications.userId, userId),
            with: {
                actor: {
                    columns: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: [desc(userNotifications.createdAt)],
            limit: 50,
        }),
    ]);

    return {
        unreadCount: Number(unreadSummary[0]?.count || 0),
        notifications: recentNotifications,
    };
}

export async function markAllNotificationsRead(userId: number): Promise<void> {
    await db
        .update(userNotifications)
        .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
        .where(and(eq(userNotifications.userId, userId), eq(userNotifications.isRead, false)));
}

export async function markNotificationRead(userId: number, notificationId: number): Promise<void> {
    await db
        .update(userNotifications)
        .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
        .where(and(eq(userNotifications.id, notificationId), eq(userNotifications.userId, userId)));
}

export async function upsertPushSubscription(userId: number, subscription: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    expirationTime?: number | null;
    userAgent?: string | null;
}): Promise<void> {
    const existing = await db.query.userPushSubscriptions.findFirst({
        where: eq(userPushSubscriptions.endpoint, subscription.endpoint),
    });

    const values = {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        expirationTime: subscription.expirationTime ? new Date(subscription.expirationTime) : null,
        userAgent: subscription.userAgent || null,
        updatedAt: new Date(),
    };

    if (existing) {
        await db.update(userPushSubscriptions).set(values).where(eq(userPushSubscriptions.id, existing.id));
        return;
    }

    await db.insert(userPushSubscriptions).values({
        ...values,
        createdAt: new Date(),
    });
}

export async function listPushSubscriptions(userId: number) {
    return db.query.userPushSubscriptions.findMany({
        where: eq(userPushSubscriptions.userId, userId),
        orderBy: [desc(userPushSubscriptions.createdAt)],
    });
}

export async function listNotifications(userId: number) {
    return db.query.userNotifications.findMany({
        where: eq(userNotifications.userId, userId),
        with: {
            actor: {
                columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                },
            },
        },
        orderBy: [desc(userNotifications.createdAt)],
    });
}
