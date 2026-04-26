/**
 * @fileoverview Investigation Management - Create & Manage Investigations
 * 
 * QI staff creates investigations and invites investigators via email
 * Generates secure access tokens for external access
 */

'use client';

import {
    Alert,
    alpha,
    Box,
    Button,
    Paper,
    Chip,
    LinearProgress,
    Stack,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    OpenInNew as OpenIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useInvestigations, type InvestigationListItem } from '@/lib/hooks';
import { useErrorDialog } from '@/components/ErrorDialog';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { Section } from '@/components/shared';
import { secureFetch } from '@/lib/client/csrf';
import { RichTextPreview } from '../editor';
import { useRouter } from 'next/navigation';

interface InvestigationManagementProps {
    incidentId: string;
    incidentStatus?: string;
    onInvestigationCreated?: (investigationId: number) => void;
}

/**
 * Display an investigation item
 */
function InvestigationItem({ investigation }: { investigation: InvestigationListItem }) {
    if (!investigation) return null;

    const isSubmitted = Boolean(investigation.submittedAt);

    return (
        <Paper key={investigation.id} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        INV-{investigation.id}
                    </Typography>
                    <Chip
                        label={isSubmitted ? 'Completed' : 'Pending'}
                        size="small"
                        color={isSubmitted ? 'success' : 'warning'}
                    />
                </Stack>
                <Button
                    component={Link}
                    href={`/incidents/investigations/${investigation.id}`}
                    size="small"
                    endIcon={<OpenIcon />}
                >
                    Open Investigation
                </Button>
            </Stack>

            {/* Investigators */}
            <Typography variant="subtitle2" gutterBottom sx={{
                color: "text.secondary"
            }}>
                Investigators
            </Typography>
            <Chip
                label={`${investigation.investigatorCount || investigation.investigators?.length || 0} assigned`}
                size="small"
                variant="outlined"
                sx={{ mb: 2 }}
            />

            {/* Findings snippet (if submitted) */}
            {isSubmitted && investigation.findings && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{
                        color: "text.secondary"
                    }}>
                        Findings
                    </Typography>
                    <Box
                        sx={{
                            overflow: 'hidden',
                            '& > div': {
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }
                        }}
                    >
                        <RichTextPreview
                            value={investigation.findings}
                            emptyText="No findings"
                        />
                    </Box>
                </Box>
            )}

            {/* Problems Identified snippet (if submitted) */}
            {isSubmitted && investigation.problemsIdentified && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{
                        color: "text.secondary"
                    }}>
                        Problems Identified
                    </Typography>
                    <Box
                        sx={{
                            overflow: 'hidden',
                            '& > div': {
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }
                        }}
                    >
                        <RichTextPreview
                            value={investigation.problemsIdentified}
                            emptyText="No problems identified"
                        />
                    </Box>
                </Box>
            )}

            {/* Cause Classification (if available) */}
            {investigation.causeClassification && (
                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{
                        color: "text.secondary"
                    }}>
                        Cause Classification
                    </Typography>
                    <Chip
                        label={investigation.causeClassification}
                        size="small"
                        color="primary"
                        variant="outlined"
                    />
                </Box>
            )}

        </Paper>

    );
}


/**
 * Investigation Management Component
 * Handles creating investigations and managing investigator access
 */
export function InvestigationManagement({
    incidentId,
    incidentStatus,
    onInvestigationCreated,
}: InvestigationManagementProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const canManage = ACCESS_CONTROL.ui.incidentForm.canManageInvestigations(session?.user?.roles || []);
    const canCreateInvestigation = canManage && ['qi_review', 'investigating', 'qi_final_actions'].includes(incidentStatus || '');

    const [creating, setCreating] = useState(false);
    const { investigations, isLoading, error, mutate } = useInvestigations({
        ovrReportId: incidentId,
        status: 'all',
        limit: 100,
    });
    const { showError, ErrorDialogComponent } = useErrorDialog();

    const investigationCount = investigations?.length || 0;

    // Create investigation
    const handleCreateInvestigation = async () => {
        try {
            setCreating(true);
            const response = await secureFetch('/api/investigations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ovrReportId: incidentId }),
            });

            if (!response.ok) throw response;

            const data = await response.json();
            onInvestigationCreated?.(data.investigation.id);
            await mutate();
            router.push(`/incidents/investigations/${data.investigation.id}?invite=` + ACCESS_CONTROL.ui.incidentForm.canManageInvestigations(session?.user?.roles || []));
        } catch (error) {
            showError(error);
        } finally {
            setCreating(false);
        }
    };

    if (!canManage && investigationCount === 0) {
        return (
            <Alert severity="info" sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{
                    fontWeight: 600
                }}>
                    Awaiting Investigation
                </Typography>
                <Typography variant="body2">
                    An investigation has not been created for this incident yet. The QI team will create an investigation once the incident is reviewed.
                </Typography>
            </Alert>
        );
    }

    return (
        <>
            <Section
                container="card"
                title="Investigation Management"
                subtitle="Create and review investigations for this incident"
                tone="primary"
                action={
                    canCreateInvestigation ? (
                        <Button
                            variant="contained"
                            size="small"
                            onClick={handleCreateInvestigation}
                            startIcon={<AddIcon />}
                            disabled={creating}
                        >
                            {creating ? 'Creating...' : 'Create Investigation'}
                        </Button>
                    ) : undefined
                }
            >
                {isLoading ? (
                    <LinearProgress sx={{ mb: 1 }} />
                ) : null}

                {error ? (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Could not load investigations right now.
                    </Alert>
                ) : null}

                {!isLoading && investigationCount === 0 ? (
                    <Alert severity="info" sx={{ mb: 0 }}>
                        No investigation has been created for this incident yet.
                    </Alert>
                ) : (
                    <Stack spacing={2}>
                        {(investigations || []).map((investigation) => (
                            <InvestigationItem investigation={investigation} />
                        ))}
                    </Stack>
                )}
            </Section>
            {ErrorDialogComponent}
        </>
    );
}
