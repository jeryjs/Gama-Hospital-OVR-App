/**
 * Supervisor Approval Action Handler
 */

import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import type { OVRReport } from '@/lib/types';
import { eq } from 'drizzle-orm';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { supervisorApprovalSchema } from '@/lib/api/schemas';

type SupervisorApprovalData = z.infer<typeof supervisorApprovalSchema>;

/**
 * Handle supervisor approval action
 * Transitions incident from 'submitted' -> 'supervisor_approved'
 */
export async function handleSupervisorApprove(
    incident: OVRReport,
    data: SupervisorApprovalData,
    session: Session
): Promise<OVRReport> {
    const userId = parseInt(session.user.id);

    const [updated] = await db
        .update(ovrReports)
        .set({
            supervisorId: userId,
            supervisorAction: data.action,
            supervisorActionDate: new Date(),
            supervisorApprovedAt: new Date(),
            status: 'supervisor_approved',
            updatedAt: new Date(),
        })
        .where(eq(ovrReports.id, incident.id))
        .returning();

    // TODO: Send notification to QI Department

    return updated;
}
