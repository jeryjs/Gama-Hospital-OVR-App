/**
 * @fileoverview Investigation Detail Page
 * 
 * Full investigation view with:
 * - Findings form
 * - Collaboration panel
 * - Shared access management
 * - Link to parent incident
 */

'use client';

import { AppLayout } from '@/components/AppLayout';
import { CollaborationPanel, SharedAccessManager } from '@/components/shared';
import { RCAFishboneSection } from '@/components/incident-form/rca-fishbone';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { getRiskLevel } from '@/lib/constants';
import { formatErrorForAlert } from '@/lib/client/error-handler';
import { useIncident, useInvestigation } from '@/lib/hooks';
import { ArrowBack, CloseRounded, EditOutlined, Save, Visibility } from '@mui/icons-material';
import {
    Alert,
    alpha,
    Box,
    Button,
    Chip,
    Divider,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { RichTextEditor, getCharacterCount } from '@/components/editor';
import { Section, SectionEditControls } from '@/components/shared';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const SectionEditButton = styled(Button)(({ theme }) => ({
    minWidth: 0,
    textTransform: 'none',
    color: theme.palette.text.secondary,
    borderColor: alpha(theme.palette.text.primary, 0.24),
    '&:hover': {
        borderColor: alpha(theme.palette.primary.main, 0.36),
        color: theme.palette.primary.main,
    },
}));

/**
 * Investigation Detail Page
 * Supports both authenticated QI users and token-based external investigators
 */
export default function InvestigationDetailPage() {
    const params = useParams();
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const { data: session } = useSession();
    const router = useRouter();

    const investigationId = Number(params.id);
    // Read token from URL on client without useSearchParams
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        setAccessToken(params.get('token'));
    }, []);

    // Fetch investigation (with token support)
    const { investigation, sharedAccess, isLoading, error, mutate, update, submit } = useInvestigation(
        investigationId,
        accessToken
    );
    const linkedIncidentId = session?.user ? investigation?.ovrReportId : null;
    const {
        incident: linkedIncident,
        isLoading: isLoadingLinkedIncident,
        error: linkedIncidentError,
    } = useIncident(linkedIncidentId);

    // Form state - markdown strings
    const [findings, setFindings] = useState('');
    const [problemsIdentified, setProblemsIdentified] = useState('');
    const [causeClassification, setCauseClassification] = useState('');
    const [causeDetails, setCauseDetails] = useState('');
    const [editorSeed, setEditorSeed] = useState(0);
    const [analysisSeed, setAnalysisSeed] = useState(0);
    const [isEditingFindings, setIsEditingFindings] = useState(false);
    const [isEditingAnalysis, setIsEditingAnalysis] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Initialize form when data loads
    useEffect(() => {
        if (investigation) {
            setFindings(investigation.findings || '');
            setProblemsIdentified(investigation.problemsIdentified || '');
            setCauseClassification(investigation.causeClassification || '');
            setCauseDetails(investigation.causeDetails || '');
            setEditorSeed((seed) => seed + 1);
            setAnalysisSeed((seed) => seed + 1);
            setIsEditingFindings(false);
            setIsEditingAnalysis(false);
        }
    }, [investigation]);

    const cancelFindingsEditing = () => {
        if (!investigation) return;

        setFindings(investigation.findings || '');
        setProblemsIdentified(investigation.problemsIdentified || '');
        setCauseClassification(investigation.causeClassification || '');
        setCauseDetails(investigation.causeDetails || '');
        setEditorSeed((seed) => seed + 1);
        setIsEditingFindings(false);
    };

    const cancelAnalysisEditing = () => {
        setIsEditingAnalysis(false);
        setAnalysisSeed((seed) => seed + 1);
    };

    const isQIUser = session && ACCESS_CONTROL.ui.incidentForm.canEditQISection(session?.user.roles || []);
    const isSubmitted = Boolean(investigation?.submittedAt);
    const canEditActiveInvestigation = !isSubmitted && Boolean(isQIUser || accessToken);
    const isIncidentClosed = linkedIncident?.status === 'closed';
    const canQIEditSubmitted = Boolean(isQIUser && isSubmitted && !isIncidentClosed);
    const canEditFindingsSection = canEditActiveInvestigation || isEditingFindings;
    const canEditAnalysisSection = canEditActiveInvestigation || isEditingAnalysis;
    const canOpenIncident = Boolean(session?.user);
    const linkedCorrectiveActions = linkedIncident?.correctiveActions || [];
    const findingsCount = getCharacterCount(findings);
    const problemsCount = getCharacterCount(problemsIdentified);
    const causeDetailsCount = getCharacterCount(causeDetails);
    const hasFindingsChanges =
        findings.trim() !== (investigation?.findings || '').trim() ||
        problemsIdentified.trim() !== (investigation?.problemsIdentified || '').trim() ||
        causeDetails.trim() !== (investigation?.causeDetails || '').trim() ||
        causeClassification.trim() !== (investigation?.causeClassification || '').trim();
    const canSubmitInvestigation =
        !isSubmitted &&
        canEditFindingsSection &&
        findingsCount >= 100 &&
        problemsCount >= 50 &&
        causeDetailsCount >= 50 &&
        causeClassification.trim().length > 0 &&
        !submitting;

    const getChecklistProgress = (checklistRaw: string | null | undefined): number => {
        if (!checklistRaw) return 0;
        try {
            const checklist = JSON.parse(checklistRaw);
            if (!Array.isArray(checklist) || checklist.length === 0) return 0;

            const completed = checklist.filter((item: any) => item?.completed).length;
            return Math.round((completed / checklist.length) * 100);
        } catch {
            return 0;
        }
    };

    const handleSave = async () => {
        if (!canEditFindingsSection) return;

        try {
            await update({
                findings: findings || undefined,
                problemsIdentified: problemsIdentified || undefined,
                causeClassification: causeClassification.trim() || undefined,
                causeDetails: causeDetails || undefined,
            });

            if (isSubmitted) {
                setIsEditingFindings(false);
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to save');
        }
    };

    const handleSubmit = async () => {
        if (!canEditFindingsSection || isSubmitted) return;

        if (!canSubmitInvestigation) {
            alert('To submit: findings must be at least 100 characters, problems at least 50, cause details at least 50, and cause classification is required.');
            return;
        }

        if (!confirm('Submit investigation? This cannot be undone.')) return;

        setSubmitting(true);

        try {
            await submit({
                findings,
                problemsIdentified,
                causeClassification: causeClassification.trim(),
                causeDetails,
            });

            alert('Investigation submitted successfully!');
            if (isQIUser) {
                router.push('/incidents/investigations');
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to submit investigation');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <LinearProgress />
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout>
                <Alert severity="error" sx={{ mt: 4 }}>
                    Failed to load investigation. {formatErrorForAlert(error)}
                </Alert>
            </AppLayout>
        );
    }

    if (!investigation) {
        return (
            <AppLayout>
                <Alert severity="error" sx={{ mt: 4 }}>
                    Investigation not found or access denied.
                </Alert>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 4 }}>
                {/* Header */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Stack direction="row" spacing={2} sx={{
                        alignItems: "center"
                    }}>
                        {canOpenIncident ? (
                            <IconButton
                                component={Link}
                                href={investigation ? `/incidents/view/${investigation.ovrReportId}` : '/incidents'}
                                size="small"
                            >
                                <ArrowBack />
                            </IconButton>
                        ) : (
                            <IconButton onClick={() => router.back()} size="small">
                                <ArrowBack />
                            </IconButton>
                        )}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" sx={{
                                fontWeight: 700
                            }}>
                                Investigation INV-{investigation.id}
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                <Typography variant="body2" sx={{
                                    color: "text.secondary"
                                }}>
                                    Incident:{' '}
                                    {canOpenIncident ? (
                                        <Button
                                            component={Link}
                                            href={`/incidents/view/${investigation.ovrReportId}`}
                                            size="small"
                                            sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                                        >
                                            {investigation.ovrReportId}
                                        </Button>
                                    ) : (
                                        <Typography component="span" variant="body2" sx={{
                                            fontWeight: 600
                                        }}>
                                            {investigation.ovrReportId}
                                        </Typography>
                                    )}
                                </Typography>
                                <Typography variant="body2" sx={{
                                    color: "text.secondary"
                                }}>
                                    Created: {format(new Date(investigation.createdAt), 'MMM dd, yyyy')}
                                </Typography>
                                {investigation.submittedAt && (
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "success.main",
                                            fontWeight: 600
                                        }}>
                                        ✓ Submitted: {format(new Date(investigation.submittedAt), 'MMM dd, yyyy')}
                                    </Typography>
                                )}
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>

                <Grid container spacing={3}>
                    {/* Left Column - Investigation Form */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Stack spacing={3}>
                            {/* Status Alert */}
                            {isSubmitted && (
                                <Alert severity="success">
                                    Investigation has been submitted and is currently read-only.
                                </Alert>
                            )}

                            {isSubmitted && canQIEditSubmitted && !isEditingFindings && (
                                <Alert severity="info">
                                    This is a read-only snapshot. Use the section-level <strong>Edit</strong> button to make a targeted update.
                                </Alert>
                            )}

                            {!isQIUser && accessToken && !isSubmitted && (
                                <Alert severity="info">
                                    You are viewing this investigation via a shared access link. Use <strong>Save Changes</strong> to save edits and <strong>Submit Investigation</strong> when complete.
                                </Alert>
                            )}

                            {/* Investigation Findings */}
                            <Section
                                container="card"
                                tone="primary"
                                title="Investigation Findings"
                                action={canQIEditSubmitted ? (
                                    <SectionEditControls
                                        canEdit={canQIEditSubmitted}
                                        isEditing={isEditingFindings}
                                        hasChanges={hasFindingsChanges}
                                        onStartEdit={() => setIsEditingFindings(true)}
                                        onSave={handleSave}
                                        onCancel={cancelFindingsEditing}
                                        saveLabel="Save Update"
                                    />
                                ) : undefined}
                            >
                                <Stack spacing={3}>
                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                                            Findings{canEditFindingsSection ? ' *' : ''}
                                        </Typography>
                                        <RichTextEditor
                                            key={`findings-editor-${editorSeed}`}
                                            value={findings}
                                            onChange={setFindings}
                                            placeholder="Describe what was discovered during the investigation..."
                                            minHeight={150}
                                            readOnly={!canEditFindingsSection}
                                        />
                                        {(canEditFindingsSection && findingsCount < 100) && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: "text.secondary",
                                                    mt: 0.5,
                                                    display: 'block',
                                                    textAlign: 'right'
                                                }}>
                                                {findingsCount} / 100 characters minimum to submit
                                            </Typography>
                                        )}
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                                            Problems Identified{canEditFindingsSection ? ' *' : ''}
                                        </Typography>
                                        <RichTextEditor
                                            key={`problems-editor-${editorSeed}`}
                                            value={problemsIdentified}
                                            onChange={setProblemsIdentified}
                                            placeholder="List the problems that contributed to the incident..."
                                            minHeight={150}
                                            readOnly={!canEditFindingsSection}
                                        />
                                        {(canEditFindingsSection && problemsCount < 50) && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: "text.secondary",
                                                    mt: 0.5,
                                                    display: 'block',
                                                    textAlign: 'right'
                                                }}>
                                                {problemsCount} / 50 characters minimum to submit
                                            </Typography>
                                        )}
                                    </Box>

                                    <Box>
                                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                                            Cause Details{canEditFindingsSection ? ' *' : ''}
                                        </Typography>
                                        <RichTextEditor
                                            key={`cause-editor-${editorSeed}`}
                                            value={causeDetails}
                                            onChange={setCauseDetails}
                                            placeholder="Provide detailed explanation of the root cause..."
                                            minHeight={120}
                                            readOnly={!canEditFindingsSection}
                                        />
                                        {(canEditFindingsSection && causeDetailsCount < 50) && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    color: "text.secondary",
                                                    mt: 0.5,
                                                    display: 'block',
                                                    textAlign: 'right'
                                                }}>
                                                {causeDetailsCount} / 50 characters minimum to submit
                                            </Typography>
                                        )}
                                    </Box>

                                    <TextField
                                        label="Cause Classification"
                                        fullWidth
                                        value={causeClassification}
                                        onChange={(e) => setCauseClassification(e.target.value)}
                                        placeholder="e.g., Human Error, System Failure, Process Gap..."
                                        slotProps={{
                                            htmlInput: {
                                                readOnly: !canEditFindingsSection,
                                            },
                                        }}
                                    />

                                    {!isSubmitted && canEditFindingsSection && (
                                        <Stack direction="row" spacing={2} sx={{
                                            justifyContent: "flex-end"
                                        }}>
                                            <Button
                                                variant="outlined"
                                                onClick={handleSave}
                                                startIcon={<Save />}
                                            >
                                                Save Changes
                                            </Button>
                                            <Tooltip
                                                title={canSubmitInvestigation
                                                    ? "Submitting will close and finalize the investigation.\nOnly do this when you are completely finished and ready to share findings with QI Department."
                                                    : "Cannot submit yet. Ensure all required fields are complete and meet character minimums."}
                                            >
                                                <Button
                                                    variant="contained"
                                                    onClick={handleSubmit}
                                                    disabled={!canSubmitInvestigation}
                                                >
                                                    {submitting ? 'Submitting...' : 'Submit Investigation'}
                                                </Button>
                                            </Tooltip>
                                        </Stack>
                                    )}
                                </Stack>
                            </Section>

                            {/* RCA & Fishbone Analysis - Only for High/Extreme Risk */}
                            {linkedIncident?.riskScore &&
                                getRiskLevel(linkedIncident.riskScore).level !== 'green' && (
                                    <Box sx={{ position: 'relative' }}>
                                        {canQIEditSubmitted && (
                                            <SectionEditButton
                                                size="small"
                                                variant={isEditingAnalysis ? 'outlined' : 'text'}
                                                startIcon={isEditingAnalysis
                                                    ? <CloseRounded fontSize="small" />
                                                    : <EditOutlined fontSize="small" />}
                                                onClick={() => {
                                                    if (isEditingAnalysis) {
                                                        cancelAnalysisEditing();
                                                        return;
                                                    }

                                                    setIsEditingAnalysis(true);
                                                }}
                                                sx={{
                                                    position: 'absolute',
                                                    top: 12,
                                                    right: 12,
                                                    zIndex: 2,
                                                }}
                                            >
                                                {isEditingAnalysis ? 'Cancel' : 'Edit'}
                                            </SectionEditButton>
                                        )}
                                        <RCAFishboneSection
                                            key={`analysis-editor-${analysisSeed}`}
                                            investigationId={investigation.id}
                                            initialRCA={investigation.rcaAnalysis}
                                            initialFishbone={investigation.fishboneAnalysis}
                                            onSave={async (rca, fishbone) => {
                                                await update({
                                                    rcaAnalysis: rca || undefined,
                                                    fishboneAnalysis: fishbone || undefined,
                                                });

                                                if (isSubmitted) {
                                                    setIsEditingAnalysis(false);
                                                }
                                            }}
                                            disabled={!canEditAnalysisSection}
                                        />
                                    </Box>
                                )}
                        </Stack>
                    </Grid>

                    {/* Right Column - Access Management */}
                    <Grid size={{ xs: 12, lg: 4 }}>
                        <Stack spacing={3}>
                            {/* Only QI users can manage access */}
                            {isQIUser && (
                                <SharedAccessManager
                                    resourceType="investigation"
                                    resourceId={investigation.id}
                                    ovrReportId={investigation.ovrReportId}
                                    invitations={sharedAccess || []}
                                    onUpdate={async () => {
                                        await mutate();
                                    }}
                                />
                            )}

                            {/* Investigation Metadata */}
                            <Section
                                container="card"
                                title="Investigation Info"
                            >
                                <Stack spacing={2} divider={<Divider />}>
                                    <Box>
                                        <Typography variant="caption" sx={{
                                            color: "text.secondary"
                                        }}>
                                            Investigation ID
                                        </Typography>
                                        <Typography variant="body2" sx={{
                                            fontWeight: 600
                                        }}>
                                            INV-{investigation.id}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{
                                            color: "text.secondary"
                                        }}>
                                            Incident Reference
                                        </Typography>
                                        <Typography variant="body2">
                                            {canOpenIncident ? (
                                                <Button
                                                    component={Link}
                                                    href={`/incidents/view/${investigation.ovrReportId}`}
                                                    size="small"
                                                    sx={{ p: 0, textTransform: 'none' }}
                                                >
                                                    {investigation.ovrReportId}
                                                </Button>
                                            ) : (
                                                <Typography component="span" variant="body2" sx={{
                                                    fontWeight: 600
                                                }}>
                                                    {investigation.ovrReportId}
                                                </Typography>
                                            )}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{
                                            color: "text.secondary"
                                        }}>
                                            Created
                                        </Typography>
                                        <Typography variant="body2">
                                            {format(new Date(investigation.createdAt), 'PPP')}
                                        </Typography>
                                    </Box>
                                    {investigation.submittedAt && (
                                        <Box>
                                            <Typography variant="caption" sx={{
                                                color: "text.secondary"
                                            }}>
                                                Submitted
                                            </Typography>
                                            <Typography variant="body2" sx={{
                                                color: "success.main"
                                            }}>
                                                {format(new Date(investigation.submittedAt), 'PPP')}
                                            </Typography>
                                        </Box>
                                    )}
                                    <Box>
                                        <Typography variant="caption" sx={{
                                            color: "text.secondary"
                                        }}>
                                            Last Updated
                                        </Typography>
                                        <Typography variant="body2">
                                            {format(new Date(investigation.updatedAt), 'PPP')}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Section>


                            {/* Linked Corrective Actions */}
                            <Section
                                container="card"
                                title="Linked Corrective Actions"
                                subtitle="Actions created for this incident"
                                tone="warning"
                            >
                                {!session?.user && accessToken ? (
                                    <Alert severity="info">
                                        Corrective action listing is available for authenticated users.
                                    </Alert>
                                ) : isLoadingLinkedIncident ? (
                                    <LinearProgress sx={{ my: 1 }} />
                                ) : linkedIncidentError ? (
                                    <Alert severity="warning">
                                        Unable to load linked corrective actions right now.
                                    </Alert>
                                ) : linkedCorrectiveActions.length === 0 ? (
                                    <Alert severity="info">
                                        No corrective actions linked to this incident yet.
                                    </Alert>
                                ) : (
                                    <Stack spacing={1.5}>
                                        {linkedCorrectiveActions.map((action) => {
                                            const checklistProgress = getChecklistProgress(action.checklist);
                                            const isOverdue =
                                                action.status !== 'closed' &&
                                                action.dueDate &&
                                                new Date(action.dueDate) < new Date();

                                            return (
                                                <Paper key={action.id} variant="outlined" sx={{ p: 1.5 }}>
                                                    <Stack
                                                        direction="row"
                                                        spacing={2}
                                                        sx={{
                                                            justifyContent: "space-between",
                                                            alignItems: "center"
                                                        }}>
                                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                                useFlexGap
                                                                sx={{
                                                                    alignItems: "center",
                                                                    flexWrap: "wrap"
                                                                }}>
                                                                <Typography variant="subtitle2" sx={{
                                                                    fontWeight: 600
                                                                }}>
                                                                    {action.title}
                                                                </Typography>
                                                                <Chip
                                                                    size="small"
                                                                    label={action.status === 'closed' ? 'Closed' : 'Open'}
                                                                    color={action.status === 'closed' ? 'success' : 'warning'}
                                                                />
                                                                {isOverdue && (
                                                                    <Chip size="small" label="Overdue" color="error" />
                                                                )}
                                                            </Stack>
                                                            <Typography variant="caption" sx={{
                                                                color: "text.secondary"
                                                            }}>
                                                                Due: {format(new Date(action.dueDate), 'MMM dd, yyyy')} • Checklist: {checklistProgress}%
                                                            </Typography>
                                                        </Box>

                                                        <Button
                                                            component={Link}
                                                            href={`/incidents/corrective-actions/${action.id}`}
                                                            size="small"
                                                            startIcon={<Visibility />}
                                                        >
                                                            View
                                                        </Button>
                                                    </Stack>
                                                </Paper>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </Section>

                            {/* Collaboration Panel */}
                            <CollaborationPanel
                                resourceType="investigation"
                                resourceId={investigation.id}
                                ovrReportId={investigation.ovrReportId}
                                canComment={Boolean(session?.user)}
                                canAttach={false}
                            />
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </AppLayout>
    );
}
