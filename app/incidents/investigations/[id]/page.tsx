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
import { ACCESS_CONTROL } from '@/lib/access-control';
import { formatErrorForAlert } from '@/lib/client/error-handler';
import { useInvestigation } from '@/lib/hooks';
import { ArrowBack, Save } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Divider,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { RichTextEditor, type EditorValue, getCharacterCount } from '@/components/editor';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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
    const { investigation, sharedAccess, isLoading, error, update, submit } = useInvestigation(
        investigationId,
        accessToken
    );

    // Form state - using EditorValue for rich text fields
    const [findings, setFindings] = useState<EditorValue | undefined>();
    const [problemsIdentified, setProblemsIdentified] = useState<EditorValue | undefined>();
    const [causeClassification, setCauseClassification] = useState('');
    const [causeDetails, setCauseDetails] = useState<EditorValue | undefined>();
    const [submitting, setSubmitting] = useState(false);

    // Initialize form when data loads
    useState(() => {
        if (investigation) {
            // Rich text fields store JSON, parse if string
            setFindings(investigation.findings ? (typeof investigation.findings === 'string' ? JSON.parse(investigation.findings) : investigation.findings) : undefined);
            setProblemsIdentified(investigation.problemsIdentified ? (typeof investigation.problemsIdentified === 'string' ? JSON.parse(investigation.problemsIdentified) : investigation.problemsIdentified) : undefined);
            setCauseClassification(investigation.causeClassification || '');
            setCauseDetails(investigation.causeDetails ? (typeof investigation.causeDetails === 'string' ? JSON.parse(investigation.causeDetails) : investigation.causeDetails) : undefined);
        }
    });

    const isQIUser = session && ACCESS_CONTROL.ui.incidentForm.canEditQISection(session?.user.roles || []);
    const isSubmitted = Boolean(investigation?.submittedAt);
    const canEdit = !isSubmitted && (isQIUser || accessToken);

    const handleSave = async () => {
        if (!canEdit) return;

        try {
            await update({
                findings: findings ? JSON.stringify(findings) : undefined,
                problemsIdentified: problemsIdentified ? JSON.stringify(problemsIdentified) : undefined,
                causeClassification: causeClassification.trim() || undefined,
                causeDetails: causeDetails ? JSON.stringify(causeDetails) : undefined,
            });
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to save');
        }
    };

    const handleSubmit = async () => {
        if (!canEdit) return;

        const findingsCount = findings ? getCharacterCount(findings) : 0;
        const problemsCount = problemsIdentified ? getCharacterCount(problemsIdentified) : 0;

        if (findingsCount < 10 || problemsCount < 10) {
            alert('Findings and Problems Identified are required');
            return;
        }

        if (!confirm('Submit investigation? This cannot be undone.')) return;

        setSubmitting(true);

        try {
            await submit({
                findings: findings ? JSON.stringify(findings) : '',
                problemsIdentified: problemsIdentified ? JSON.stringify(problemsIdentified) : '',
                causeClassification: causeClassification.trim(),
                causeDetails: causeDetails ? JSON.stringify(causeDetails) : '',
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
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <IconButton
                            component={Link}
                            href={investigation ? `/incidents/view/${investigation.ovrReportId}` : '/incidents'}
                            size="small"
                        >
                            <ArrowBack />
                        </IconButton>
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" fontWeight={700}>
                                Investigation INV-{investigation.id}
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Incident:{' '}
                                    <Button
                                        component={Link}
                                        href={`/incidents/view/${investigation.ovrReportId}`}
                                        size="small"
                                        sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                                    >
                                        {investigation.ovrReportId}
                                    </Button>
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Created: {format(new Date(investigation.createdAt), 'MMM dd, yyyy')}
                                </Typography>
                                {investigation.submittedAt && (
                                    <Typography variant="body2" color="success.main" fontWeight={600}>
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
                                    Investigation has been submitted and is now read-only.
                                </Alert>
                            )}

                            {!isQIUser && accessToken && !isSubmitted && (
                                <Alert severity="info">
                                    You are viewing this investigation via a shared access link. Changes are auto-saved.
                                </Alert>
                            )}

                            {/* Investigation Findings */}
                            <Card>
                                <CardHeader
                                    title="Investigation Findings"
                                    sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
                                />
                                <CardContent>
                                    <Stack spacing={3}>
                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                                                Findings *
                                            </Typography>
                                            <RichTextEditor
                                                value={findings}
                                                onChange={setFindings}
                                                placeholder="Describe what was discovered during the investigation..."
                                                minHeight={150}
                                                disabled={!canEdit}
                                            />
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                {findings ? getCharacterCount(findings) : 0} characters
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                                                Problems Identified *
                                            </Typography>
                                            <RichTextEditor
                                                value={problemsIdentified}
                                                onChange={setProblemsIdentified}
                                                placeholder="List the problems that contributed to the incident..."
                                                minHeight={150}
                                                disabled={!canEdit}
                                            />
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                {problemsIdentified ? getCharacterCount(problemsIdentified) : 0} characters
                                            </Typography>
                                        </Box>

                                        <TextField
                                            label="Cause Classification"
                                            fullWidth
                                            value={causeClassification}
                                            onChange={(e) => setCauseClassification(e.target.value)}
                                            placeholder="e.g., Human Error, System Failure, Process Gap..."
                                            disabled={!canEdit}
                                        />

                                        <Box>
                                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                                                Cause Details
                                            </Typography>
                                            <RichTextEditor
                                                value={causeDetails}
                                                onChange={setCauseDetails}
                                                placeholder="Provide detailed explanation of the root cause..."
                                                minHeight={120}
                                                disabled={!canEdit}
                                            />
                                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                {causeDetails ? getCharacterCount(causeDetails) : 0} characters
                                            </Typography>
                                        </Box>

                                        {canEdit && (
                                            <Stack direction="row" spacing={2} justifyContent="flex-end">
                                                <Button
                                                    variant="outlined"
                                                    onClick={handleSave}
                                                    startIcon={<Save />}
                                                >
                                                    Save Draft
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    onClick={handleSubmit}
                                                    disabled={!(findings && getCharacterCount(findings) >= 10) || !(problemsIdentified && getCharacterCount(problemsIdentified) >= 10) || submitting}
                                                >
                                                    {submitting ? 'Submitting...' : 'Submit Investigation'}
                                                </Button>
                                            </Stack>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>

                            {/* RCA & Fishbone Placeholder */}
                            <Card>
                                <CardHeader
                                    title="Advanced Analysis"
                                    subheader="Root Cause Analysis and Fishbone Diagram tools coming soon"
                                    sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText' }}
                                />
                                <CardContent>
                                    <Alert severity="info">
                                        Future versions will include interactive tools for Root Cause Analysis (RCA) and
                                        Fishbone (Ishikawa) diagrams.
                                    </Alert>
                                </CardContent>
                            </Card>

                            {/* Collaboration Panel */}
                            <CollaborationPanel
                                resourceType="investigation"
                                resourceId={investigation.id}
                                canComment={true}
                                canAttach={false}
                            />
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
                                />
                            )}

                            {/* Investigation Metadata */}
                            <Card>
                                <CardHeader
                                    title="Investigation Info"
                                    sx={{ bgcolor: 'background.default' }}
                                />
                                <CardContent>
                                    <Stack spacing={2} divider={<Divider />}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Investigation ID
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                INV-{investigation.id}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Incident Reference
                                            </Typography>
                                            <Typography variant="body2">
                                                <Button
                                                    component={Link}
                                                    href={`/incidents/view/${investigation.ovrReportId}`}
                                                    size="small"
                                                    sx={{ p: 0, textTransform: 'none' }}
                                                >
                                                    {investigation.ovrReportId}
                                                </Button>
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Created
                                            </Typography>
                                            <Typography variant="body2">
                                                {format(new Date(investigation.createdAt), 'PPP')}
                                            </Typography>
                                        </Box>
                                        {investigation.submittedAt && (
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Submitted
                                                </Typography>
                                                <Typography variant="body2" color="success.main">
                                                    {format(new Date(investigation.submittedAt), 'PPP')}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Last Updated
                                            </Typography>
                                            <Typography variant="body2">
                                                {format(new Date(investigation.updatedAt), 'PPP')}
                                            </Typography>
                                        </Box>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
        </AppLayout>
    );
}
