/**
 * @fileoverview Workflow Section - Status-Based Component Orchestrator
 * 
 * Renders appropriate workflow components based on incident status
 * Handles all status transitions and conditional logic
 */

'use client';

import { Box, Divider } from '@mui/material';
import { CaseReviewSection } from '@/components/incident-form/CaseReviewSection';
import { CorrectiveActionsManagement } from '@/components/incident-form/CorrectiveActionsManagement';
import { InvestigationManagement } from '@/components/incident-form/InvestigationManagement';
import { QIFeedbackSection } from '@/components/incident-form/QIFeedbackSection';
import { QIReviewSection } from '@/components/incident-form/QIReviewSection';
import type { OVRReportWithRelations } from '@/lib/types';
import { useState } from 'react';

interface WorkflowSectionProps {
    incident: OVRReportWithRelations;
    onUpdate: () => void;
    onClosureSuccess?: () => void;
}

/**
 * Workflow Section Component
 * 
 * Smart component that renders the correct workflow UI based on incident status
 * Follows the new QI-led workflow:
 * - submitted → QI Review
 * - investigating → Investigation Management
 * - qi_final_actions → Corrective Actions + Case Review
 * - closed → Read-only view
 */
export function WorkflowSection({
    incident,
    onUpdate,
    onClosureSuccess,
}: WorkflowSectionProps) {
    // Track investigation and action IDs
    const [investigationId, setInvestigationId] = useState<number | undefined>(
        incident.investigation?.id
    );
    const [actionIds, setActionIds] = useState<number[]>(
        incident.correctiveActions?.map((a) => a.id) || []
    );

    // Calculate if all actions are closed
    const allActionsClosed = Boolean(
        actionIds.length > 0 &&
        incident.correctiveActions?.every((action) => action.status === 'closed')
    );

    /**
     * STATUS: SUBMITTED
     * QI needs to review and approve/reject
     */
    if (incident.status === 'submitted') {
        return (
            <Box sx={{ my: 3 }}>
                <Divider sx={{ my: 3 }} />
                <QIReviewSection
                    incidentId={incident.id}
                    onSuccess={onUpdate}
                />
            </Box>
        );
    }

    /**
     * STATUS: INVESTIGATING
     * QI manages investigation and invites investigators
     */
    if (incident.status === 'investigating') {
        return (
            <Box sx={{ my: 3 }}>
                <Divider sx={{ my: 3 }} />
                <InvestigationManagement
                    incidentId={incident.id}
                    investigationId={investigationId}
                    onInvestigationCreated={(id) => {
                        setInvestigationId(id);
                        onUpdate();
                    }}
                />
            </Box>
        );
    }

    /**
     * STATUS: QI_FINAL_ACTIONS
     * QI creates corrective actions and closes case when done
     */
    if (incident.status === 'qi_final_actions') {
        return (
            <Box sx={{ my: 3 }}>
                <Divider sx={{ my: 3 }} />

                {/* Investigation Summary (read-only) */}
                {incident.investigation && (
                    <Box sx={{ mb: 3 }}>
                        <InvestigationSummary investigation={incident.investigation} />
                    </Box>
                )}

                {/* Corrective Actions Management */}
                <CorrectiveActionsManagement
                    incidentId={incident.id}
                    actionIds={actionIds}
                    onActionCreated={(id) => {
                        setActionIds([...actionIds, id]);
                        onUpdate();
                    }}
                />

                {/* Case Review & Close (only after all actions closed) */}
                <Box sx={{ mt: 3 }}>
                    <CaseReviewSection
                        incidentId={incident.id}
                        allActionsClosed={allActionsClosed}
                        onSuccess={onClosureSuccess}
                    />
                </Box>
            </Box>
        );
    }

    /**
     * STATUS: CLOSED
     * Show summary, feedback, and completed actions
     */
    if (incident.status === 'closed') {
        return (
            <Box sx={{ my: 3 }}>
                <Divider sx={{ my: 3 }} />

                {/* Investigation Summary */}
                {incident.investigation && (
                    <Box sx={{ mb: 3 }}>
                        <InvestigationSummary investigation={incident.investigation} />
                    </Box>
                )}

                {/* QI Feedback (legacy section) */}
                {(incident.qiFeedback || incident.severityLevel) && (
                    <Box sx={{ mb: 3 }}>
                        <QIFeedbackSection incident={incident} onUpdate={onUpdate} />
                    </Box>
                )}

                {/* Case Review & Reporter Feedback (read-only) */}
                {(incident.caseReview || incident.reporterFeedback) && (
                    <Box sx={{ mb: 3 }}>
                        <CaseReviewSummary
                            caseReview={incident.caseReview}
                            reporterFeedback={incident.reporterFeedback}
                            closedBy={incident.closedBy}
                            closedAt={incident.closedAt}
                        />
                    </Box>
                )}
            </Box>
        );
    }

    // Draft or unknown status - no workflow section
    return null;
}

/**
 * Investigation Summary Component (Read-Only)
 * Displays completed investigation details
 */
function InvestigationSummary({ investigation }: { investigation: any }) {
    return (
        <Box
            sx={{
                bgcolor: 'background.paper',
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                    }}
                />
                <Box sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                    Investigation Summary
                </Box>
            </Box>

            {investigation.findings && (
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ fontWeight: 500, mb: 0.5, color: 'text.secondary' }}>
                        Findings:
                    </Box>
                    <Box sx={{ pl: 2 }}>{investigation.findings}</Box>
                </Box>
            )}

            {investigation.problemsIdentified && (
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ fontWeight: 500, mb: 0.5, color: 'text.secondary' }}>
                        Problems Identified:
                    </Box>
                    <Box sx={{ pl: 2 }}>{investigation.problemsIdentified}</Box>
                </Box>
            )}

            {investigation.causeClassification && (
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ fontWeight: 500, mb: 0.5, color: 'text.secondary' }}>
                        Cause Classification:
                    </Box>
                    <Box sx={{ pl: 2 }}>{investigation.causeClassification}</Box>
                </Box>
            )}

            {investigation.causeDetails && (
                <Box>
                    <Box sx={{ fontWeight: 500, mb: 0.5, color: 'text.secondary' }}>
                        Cause Details:
                    </Box>
                    <Box sx={{ pl: 2 }}>{investigation.causeDetails}</Box>
                </Box>
            )}
        </Box>
    );
}

/**
 * Case Review Summary Component (Read-Only)
 * Displays final case review and feedback
 */
function CaseReviewSummary({
    caseReview,
    reporterFeedback,
    closedBy,
    closedAt,
}: {
    caseReview: string | null;
    reporterFeedback: string | null;
    closedBy: number | null;
    closedAt: Date | null;
}) {
    return (
        <Box
            sx={{
                bgcolor: 'success.lighter',
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'success.main',
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'success.main',
                    }}
                />
                <Box sx={{ fontWeight: 600, fontSize: '1.1rem', color: 'success.dark' }}>
                    Case Closed
                </Box>
            </Box>

            {caseReview && (
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ fontWeight: 500, mb: 0.5, color: 'success.dark' }}>
                        Case Review:
                    </Box>
                    <Box sx={{ pl: 2, color: 'text.primary' }}>{caseReview}</Box>
                </Box>
            )}

            {reporterFeedback && (
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ fontWeight: 500, mb: 0.5, color: 'success.dark' }}>
                        Feedback to Reporter:
                    </Box>
                    <Box sx={{ pl: 2, color: 'text.primary' }}>{reporterFeedback}</Box>
                </Box>
            )}

            {closedAt && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'success.main' }}>
                    <Box sx={{ fontSize: '0.875rem', color: 'success.dark' }}>
                        Closed on {new Date(closedAt).toLocaleString()}
                    </Box>
                </Box>
            )}
        </Box>
    );
}
