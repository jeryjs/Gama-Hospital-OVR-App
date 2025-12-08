/**
 * Investigator Action Handlers
 * Handles investigator assignment and findings submission
 */

import { db } from '@/db';
import { ovrInvestigators } from '@/db/schema';
import type { OVRReport } from '@/lib/types';
import { and, eq } from 'drizzle-orm';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { assignInvestigatorSchema, submitFindingsSchema } from '@/lib/api/schemas';
import { ValidationError } from '@/lib/api/middleware';

type AssignInvestigatorData = z.infer<typeof assignInvestigatorSchema>;
type SubmitFindingsData = z.infer<typeof submitFindingsSchema>;

/**
 * Handle assigning an investigator to incident
 * Creates new investigator assignment record
 */
export async function handleAssignInvestigator(
    incident: OVRReport,
    data: AssignInvestigatorData,
    session: Session
): Promise<typeof ovrInvestigators.$inferSelect> {
    const userId = parseInt(session.user.id);

    // Check if investigator is already assigned
    const existing = await db.query.ovrInvestigators.findFirst({
        where: and(
            eq(ovrInvestigators.ovrReportId, incident.id),
            eq(ovrInvestigators.investigatorId, data.investigatorId)
        ),
    });

    if (existing) {
        throw new ValidationError('This investigator is already assigned to this incident');
    }

    const [newInvestigator] = await db
        .insert(ovrInvestigators)
        .values({
            ovrReportId: incident.id,
            investigatorId: data.investigatorId,
            assignedBy: userId,
            status: 'pending',
        })
        .returning();

    // TODO: Send notification to assigned investigator

    return newInvestigator;
}

/**
 * Handle investigator submitting findings
 * Updates investigator record with findings
 */
export async function handleSubmitFindings(
    incident: OVRReport,
    data: SubmitFindingsData,
    session: Session
): Promise<typeof ovrInvestigators.$inferSelect> {
    const userId = parseInt(session.user.id);

    // Find investigator record for this user
    const investigatorRecord = await db.query.ovrInvestigators.findFirst({
        where: and(
            eq(ovrInvestigators.ovrReportId, incident.id),
            eq(ovrInvestigators.investigatorId, userId)
        ),
    });

    if (!investigatorRecord) {
        throw new ValidationError('You are not assigned as an investigator for this incident');
    }

    if (investigatorRecord.status === 'submitted') {
        throw new ValidationError('Findings have already been submitted');
    }

    const [updated] = await db
        .update(ovrInvestigators)
        .set({
            findings: data.findings,
            status: 'submitted',
            submittedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(ovrInvestigators.id, investigatorRecord.id))
        .returning();

    // TODO: Notify HOD that findings have been submitted

    return updated;
}
