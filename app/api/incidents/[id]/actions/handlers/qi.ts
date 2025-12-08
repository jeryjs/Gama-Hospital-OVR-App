/**
 * QI Department Action Handlers
 * Handles QI assignment and closure actions
 */

import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import type { OVRReport } from '@/lib/types';
import { eq } from 'drizzle-orm';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { qiAssignHODSchema, qiFeedbackSchema } from '@/lib/api/schemas';

type QIAssignHODData = z.infer<typeof qiAssignHODSchema>;
type QIFeedbackData = z.infer<typeof qiFeedbackSchema>;

/**
 * Handle QI assigning incident to Department Head
 * Transitions: 'hod_assigned' -> 'hod_assigned' (updates assignment details)
 * Note: Status is already 'hod_assigned' when incident is submitted (skips supervisor approval)
 */
export async function handleQIAssignHOD(
    incident: OVRReport,
    data: QIAssignHODData,
    session: Session
): Promise<OVRReport> {
    const userId = parseInt(session.user.id);

    const [updated] = await db
        .update(ovrReports)
        .set({
            qiReceivedBy: userId,
            qiReceivedDate: new Date(),
            qiAssignedBy: userId,
            qiAssignedDate: new Date(),
            departmentHeadId: data.departmentHeadId,
            hodAssignedAt: new Date(),
            status: 'hod_assigned',
            updatedAt: new Date(),
        })
        .where(eq(ovrReports.id, incident.id))
        .returning();

    // TODO: Send notification to assigned HOD

    return updated;
}

/**
 * Handle QI closing incident with feedback
 * Transitions: 'qi_final_review' -> 'closed'
 */
export async function handleQIClose(
    incident: OVRReport,
    data: QIFeedbackData,
    session: Session
): Promise<OVRReport> {
    const [updated] = await db
        .update(ovrReports)
        .set({
            qiFeedback: data.feedback,
            qiFormComplete: data.formComplete,
            qiProperCauseIdentified: data.causeIdentified,
            qiProperTimeframe: data.timeframe,
            qiActionCompliesStandards: data.actionComplies,
            qiEffectiveCorrectiveAction: data.effectiveAction,
            severityLevel: data.severityLevel,
            status: 'closed',
            closedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(ovrReports.id, incident.id))
        .returning();

    // TODO: Send notification to stakeholders

    return updated;
}
