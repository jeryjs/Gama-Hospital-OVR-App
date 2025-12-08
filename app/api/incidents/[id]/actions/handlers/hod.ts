/**
 * Department Head (HOD) Action Handler
 * Handles HOD investigation submission
 */

import { db } from '@/db';
import { ovrReports } from '@/db/schema';
import type { OVRReport } from '@/lib/types';
import { eq } from 'drizzle-orm';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { hodSubmissionSchema } from '@/lib/api/schemas';

type HODSubmissionData = z.infer<typeof hodSubmissionSchema>;

/**
 * Handle HOD submitting investigation findings
 * Transitions: 'hod_assigned' -> 'qi_final_review'
 */
export async function handleHODSubmit(
    incident: OVRReport,
    data: HODSubmissionData,
    session: Session
): Promise<OVRReport> {
    const [updated] = await db
        .update(ovrReports)
        .set({
            investigationFindings: data.investigationFindings,
            problemsIdentified: data.problemsIdentified,
            causeClassification: data.causeClassification,
            causeDetails: data.causeDetails,
            preventionRecommendation: data.preventionRecommendation,
            hodActionDate: new Date(),
            hodSubmittedAt: new Date(),
            status: 'qi_final_review',
            updatedAt: new Date(),
        })
        .where(eq(ovrReports.id, incident.id))
        .returning();

    // TODO: Send notification to QI Department

    return updated;
}
