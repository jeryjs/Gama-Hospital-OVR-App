/**
 * @fileoverview Workflow Section - Status-Based Component Orchestrator
 * 
 * Renders appropriate workflow components based on incident status
 * Handles all status transitions and conditional logic
 */

'use client';

import { Box, Divider } from '@mui/material';
import { RichTextPreview, type EditorValue } from '@/components/editor';
import { CaseReviewSection } from '@/components/incident-form/CaseReviewSection';
import { CorrectiveActionsManagement } from '@/components/incident-form/CorrectiveActionsManagement';
import { CorrectiveActionsSummary } from '@/components/incident-form/CorrectiveActionsSummary';
import { InvestigationManagement } from '@/components/incident-form/InvestigationManagement';
import { InvestigationSummary } from '@/components/incident-form/InvestigationSummary';
import { QIFeedbackSection } from '@/components/incident-form/QIFeedbackSection';
import { QIReviewSection } from '@/components/incident-form/QIReviewSection';
import type { OVRReportWithRelations } from '@/lib/api/schemas';
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
                    <InvestigationSummary
                        investigation={incident.investigation}
                        incidentId={incident.id}
                    />
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
                    <InvestigationSummary
                        investigation={incident.investigation}
                        incidentId={incident.id}
                    />
                )}

                {/* Corrective Actions Summary */}
                {incident.correctiveActions && incident.correctiveActions.length > 0 && (
                    <CorrectiveActionsSummary actions={incident.correctiveActions} />
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
 * Helper to parse rich text value from string or EditorValue
 */
function parseRichTextValue(value: unknown): EditorValue | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') {
        // Try to parse as JSON (rich text)
        try {
            const parsed = JSON.parse(value);
            // If parsed is an array, assume it's EditorValue
            if (Array.isArray(parsed)) return parsed as EditorValue;
        } catch {
            // Not JSON, treat as markdown (legacy)
            // Convert markdown string to EditorValue format
            return [
                {
                    type: 'paragraph',
                    children: [{ text: value }],
                },
            ] as EditorValue;
        }
    }
    return value as EditorValue;
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
    const parsedCaseReview = parseRichTextValue(caseReview);
    const parsedReporterFeedback = parseRichTextValue(reporterFeedback);

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
                    <Box sx={{ pl: 2, color: 'text.primary' }}>
                        <RichTextPreview
                            value={parsedCaseReview}
                            emptyText="No case review provided"
                        />
                    </Box>
                </Box>
            )}

            {reporterFeedback && (
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ fontWeight: 500, mb: 0.5, color: 'success.dark' }}>
                        Feedback to Reporter:
                    </Box>
                    <Box sx={{ pl: 2, color: 'text.primary' }}>
                        <RichTextPreview
                            value={parsedReporterFeedback}
                            emptyText="No feedback provided"
                        />
                    </Box>
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
