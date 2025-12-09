/**
 * @fileoverview QI Review Section - Approve or Reject Submitted Incidents
 * 
 * Shows when incident is in 'submitted' status
 * QI staff can approve (moves to investigating) or reject (back to draft)
 */

'use client';

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    FormControl,
    FormControlLabel,
    Radio,
    RadioGroup,
    TextField,
    Typography,
} from '@mui/material';
import {
    CheckCircle as ApproveIcon,
    Cancel as RejectIcon,
    Send as SubmitIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useIncidentActions } from '@/lib/hooks';
import type { QIReviewInput } from '@/lib/api/schemas';
import { useErrorDialog } from '@/components/ErrorDialog';

interface QIReviewSectionProps {
    incidentId: string;
    onSuccess?: () => void;
}

/**
 * QI Review Section Component
 * Handles approval/rejection workflow for submitted incidents
 */
export function QIReviewSection({ incidentId, onSuccess }: QIReviewSectionProps) {
    const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const { performAction, submitting } = useIncidentActions(incidentId, onSuccess);
    const { showError, ErrorDialogComponent } = useErrorDialog();

    const handleSubmit = async () => {
        if (!decision) {
            showError(new Error('Please select approve or reject'));
            return;
        }

        // Build payload based on decision
        const payload: QIReviewInput = {
            decision: decision as 'approve' | 'reject',
            ...(decision === 'reject' && { rejectionReason: rejectionReason.trim() }),
        };

        try {
            const result = await performAction('qi-review', payload);

            if (!result.success) {
                showError(new Error(result.error || 'Failed to submit review'));
            }
        } catch (error) {
            showError(error);
        }
    };

    // Smart validation - rejection reason required only when rejecting
    const isReasonRequired = decision === 'reject';
    const isReasonValid = !isReasonRequired || rejectionReason.trim().length >= 20;
    const canSubmit = decision !== null && isReasonValid && !submitting;

    return (
        <Card elevation={2}>
            <CardHeader
                title="QI Review"
                subheader="Approve or reject this incident report"
                sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiCardHeader-subheader': {
                        color: 'primary.contrastText',
                        opacity: 0.9,
                    },
                }}
            />

            <CardContent>
                {/* Decision Radio Group */}
                <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Decision *
                    </Typography>
                    <RadioGroup
                        value={decision || ''}
                        onChange={(e) => setDecision(e.target.value as 'approve' | 'reject')}
                    >
                        <FormControlLabel
                            value="approve"
                            control={<Radio />}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <ApproveIcon color="success" />
                                    <Box>
                                        <Typography variant="body1" fontWeight={500}>
                                            Approve
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Move to investigation phase
                                        </Typography>
                                    </Box>
                                </Box>
                            }
                        />
                        <FormControlLabel
                            value="reject"
                            control={<Radio />}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <RejectIcon color="error" />
                                    <Box>
                                        <Typography variant="body1" fontWeight={500}>
                                            Reject
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Return to reporter as draft
                                        </Typography>
                                    </Box>
                                </Box>
                            }
                        />
                    </RadioGroup>
                </FormControl>

                {/* Rejection Reason - Only visible when reject selected */}
                {decision === 'reject' && (
                    <TextField
                        label="Rejection Reason"
                        multiline
                        rows={4}
                        fullWidth
                        required
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Explain why this report is being rejected (min 20 characters)..."
                        helperText={`${rejectionReason.length}/20 minimum characters`}
                        error={rejectionReason.length > 0 && rejectionReason.length < 20}
                        sx={{ mb: 2 }}
                    />
                )}

                {/* Info Alert */}
                <Alert severity={decision === 'approve' ? 'success' : decision === 'reject' ? 'warning' : 'info'} sx={{ mb: 2 }}>
                    {decision === 'approve' && 'Approving will move this incident to the investigation phase.'}
                    {decision === 'reject' && 'Rejecting will return this incident to the reporter as a draft with your feedback.'}
                    {!decision && 'Select approve or reject to proceed with QI review.'}
                </Alert>

                {/* Submit Button */}
                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={!canSubmit}
                    onClick={handleSubmit}
                    startIcon={<SubmitIcon />}
                    color={decision === 'approve' ? 'success' : decision === 'reject' ? 'error' : 'primary'}
                >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                </Button>
            </CardContent>

            {ErrorDialogComponent}
        </Card>
    );
}
