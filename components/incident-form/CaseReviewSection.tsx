/**
 * @fileoverview Case Review Section - Final Incident Closure
 * 
 * QI completes case review with feedback and closes incident
 * Shows when all corrective actions are closed
 */

'use client';

import {
    Alert,
    alpha,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Typography,
} from '@mui/material';
import { RichTextEditor, getCharacterCount } from '@/components/editor';
import {
    CheckCircle as CompleteIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useIncidentActions } from '@/lib/hooks';
import type { CloseIncidentInput } from '@/lib/api/schemas';
import { useErrorDialog } from '@/components/ErrorDialog';
import { useSession } from 'next-auth/react';
import { ACCESS_CONTROL } from '@/lib/access-control';

interface CaseReviewSectionProps {
    incidentId: string;
    allActionsClosed: boolean;
    onSuccess?: () => void;
}

/**
 * Case Review Section Component
 * Final step - QI reviews case and closes incident
 */
export function CaseReviewSection({
    incidentId,
    allActionsClosed,
    onSuccess,
}: CaseReviewSectionProps) {
    const { data: session } = useSession();
    const canCloseCase = ACCESS_CONTROL.ui.incidentForm.canCloseCaseWithReview(session?.user?.roles || []);

    const [caseReview, setCaseReview] = useState('');
    const [reporterFeedback, setReporterFeedback] = useState('');

    const { performAction, submitting } = useIncidentActions(incidentId, onSuccess);
    const { showError, ErrorDialogComponent } = useErrorDialog();

    const handleSubmit = async () => {
        const payload: CloseIncidentInput = {
            caseReview,
            reporterFeedback,
        };

        try {
            const result = await performAction('close-incident', payload);

            if (!result.success) {
                showError(new Error(result.error || 'Failed to close incident'));
            }
        } catch (error) {
            showError(error);
        }
    };

    // Smart validation using getCharacterCount for rich text
    const caseReviewLength = getCharacterCount(caseReview);
    const feedbackLength = getCharacterCount(reporterFeedback);
    const isCaseReviewValid = caseReviewLength >= 100;
    const isFeedbackValid = feedbackLength >= 50;
    const canSubmit = allActionsClosed && isCaseReviewValid && isFeedbackValid && !submitting;

    if (!canCloseCase) {
        return (
            <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{
                    fontWeight: 600
                }}>
                    Awaiting Final QI Review
                </Typography>
                <Typography variant="body2">
                    Final case closure is restricted to authorized QI leadership roles.
                </Typography>
            </Alert>
        );
    }

    return (
        <Card elevation={2}>
            <CardHeader
                title="Case Review & Closure"
                subheader="Final case review and incident closure"
                sx={{
                    bgcolor: (theme) => allActionsClosed ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.warning.main, 0.1),
                    color: allActionsClosed ? 'success.main' : 'warning.main',
                }}
            />
            <CardContent>
                {/* Warning if actions not closed */}
                {!allActionsClosed && (
                    <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
                        <Typography variant="body2" gutterBottom sx={{
                            fontWeight: 500
                        }}>
                            Cannot close incident yet
                        </Typography>
                        <Typography variant="body2">
                            All corrective actions must be closed before the incident can be finalized.
                        </Typography>
                    </Alert>
                )}

                {/* Success indicator */}
                {allActionsClosed && (
                    <Alert severity="success" icon={<CompleteIcon />} sx={{ mb: 3 }}>
                        <Typography variant="body2" gutterBottom sx={{
                            fontWeight: 500
                        }}>
                            Ready to close
                        </Typography>
                        <Typography variant="body2">
                            All corrective actions are closed. Complete the case review to finalize this incident.
                        </Typography>
                    </Alert>
                )}

                {/* Case Review */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Case Review *
                    </Typography>
                    <RichTextEditor
                        value={caseReview}
                        onChange={setCaseReview}
                        placeholder="Provide a comprehensive review of the case, including summary of findings, actions taken, and lessons learned (min 100 characters)..."
                        minHeight={200}
                        disabled={!allActionsClosed}
                    />
                    <Typography
                        variant="caption"
                        color={caseReviewLength > 0 && caseReviewLength < 100 ? 'error.main' : 'text.secondary'}
                        sx={{ mt: 0.5, display: 'block' }}
                    >
                        {caseReviewLength}/100 minimum characters
                    </Typography>
                </Box>

                {/* Reporter Feedback */}
                <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                        Feedback to Reporter *
                    </Typography>
                    <RichTextEditor
                        value={reporterFeedback}
                        onChange={setReporterFeedback}
                        placeholder="Provide feedback to the reporter about the incident resolution and any follow-up actions (min 50 characters)..."
                        minHeight={150}
                        disabled={!allActionsClosed}
                    />
                    <Typography
                        variant="caption"
                        color={feedbackLength > 0 && feedbackLength < 50 ? 'error.main' : 'text.secondary'}
                        sx={{ mt: 0.5, display: 'block' }}
                    >
                        {feedbackLength}/50 minimum characters
                    </Typography>
                </Box>

                {/* Close Button */}
                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                    startIcon={<CompleteIcon />}
                    color="success"
                >
                    {submitting ? 'Closing Incident...' : 'Close Incident'}
                </Button>

                {/* Help text */}
                <Typography
                    variant="caption"
                    sx={{
                        color: "text.secondary",
                        display: 'block',
                        mt: 1,
                        textAlign: 'center'
                    }}>
                    Once closed, this incident will be marked as resolved and archived.
                </Typography>
            </CardContent>
            {ErrorDialogComponent}
        </Card>
    );
}
