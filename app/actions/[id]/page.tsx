/**
 * @fileoverview Corrective Action Detail Page
 * 
 * Full action view with:
 * - Checklist management
 * - Collaboration panel
 * - Shared access management
 * - Evidence upload (placeholder)
 */

'use client';

import { AppLayout } from '@/components/AppLayout';
import { CollaborationPanel, SharedAccessManager } from '@/components/shared';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { formatErrorForAlert } from '@/lib/client/error-handler';
import { useCorrectiveAction } from '@/lib/hooks';
import { ArrowBack, CheckCircle, Save } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Checkbox,
    Chip,
    Divider,
    FormControlLabel,
    Grid,
    IconButton,
    LinearProgress,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { format, isPast } from 'date-fns';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

/**
 * Corrective Action Detail Page
 * Supports both authenticated QI users and token-based external handlers
 */
export default function ActionDetailPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const router = useRouter();

    const actionId = Number(params.id);
    const accessToken = searchParams.get('token');

    // Fetch action (with token support)
    const { action, isLoading, error, update } = useCorrectiveAction(
        actionId,
        accessToken
    );

    // Form state
    const [actionTaken, setActionTaken] = useState('');
    const [checklist, setChecklist] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Initialize form when data loads
    useState(() => {
        if (action) {
            setActionTaken(action.actionTaken || '');
            try {
                setChecklist(action.checklist ? JSON.parse(action.checklist) : []);
            } catch {
                setChecklist([]);
            }
        }
    });

    const isQIUser = session && ACCESS_CONTROL.ui.incidentForm.canEditQISection(session?.user.roles || []);
    const isClosed = action?.status === 'closed';
    const canEdit = !isClosed && (isQIUser || accessToken);
    const isOverdue = action && action.status === 'open' && isPast(new Date(action.dueDate));
    const checklistComplete = checklist.length > 0 && checklist.every((item) => item.completed);

    const handleToggleChecklistItem = (itemId: string) => {
        if (!canEdit) return;

        const updated = checklist.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        setChecklist(updated);
    };

    const handleSave = async () => {
        if (!canEdit) return;

        try {
            await update({
                actionTaken: actionTaken.trim() || undefined,
                checklist: JSON.stringify(checklist),
            });
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to save');
        }
    };

    const handleClose = async () => {
        if (!canEdit || !isQIUser) return;

        if (!checklistComplete) {
            alert('All checklist items must be completed before closing');
            return;
        }

        if (!actionTaken.trim()) {
            alert('Action Taken description is required');
            return;
        }

        if (!confirm('Close this action? This cannot be undone.')) return;

        setSubmitting(true);

        try {
            // Update with final data then navigate
            // Note: Status update would be handled by dedicated close endpoint
            await update({
                actionTaken: actionTaken.trim(),
                checklist: JSON.stringify(checklist),
            });

            alert('Action closed successfully!');
            router.push('/actions');
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to close action');
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
                    Failed to load action. {formatErrorForAlert(error)}
                </Alert>
            </AppLayout>
        );
    }

    if (!action) {
        return (
            <AppLayout>
                <Alert severity="error" sx={{ mt: 4 }}>
                    Corrective action not found or access denied.
                </Alert>
            </AppLayout>
        );
    }

    const progress = checklist.length > 0
        ? Math.round((checklist.filter((i) => i.completed).length / checklist.length) * 100)
        : 0;

    return (
        <AppLayout>
            <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 4 }}>
                {/* Header */}
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        {isQIUser && (
                            <IconButton component={Link} href="/actions" size="small">
                                <ArrowBack />
                            </IconButton>
                        )}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" fontWeight={700}>
                                {action.title}
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Action ID: ACT-{action.id}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Incident:{' '}
                                    <Button
                                        component={Link}
                                        href={`/incidents/view/${action.ovrReportId}`}
                                        size="small"
                                        sx={{ textTransform: 'none', p: 0, minWidth: 'auto' }}
                                    >
                                        {action.ovrReportId}
                                    </Button>
                                </Typography>
                                <Chip
                                    label={isClosed ? 'Closed' : 'Open'}
                                    size="small"
                                    color={isClosed ? 'success' : 'warning'}
                                />
                                {isOverdue && (
                                    <Chip label="OVERDUE" size="small" color="error" />
                                )}
                            </Stack>
                        </Box>
                    </Stack>
                </Paper>

                <Grid container spacing={3}>
                    {/* Left Column - Action Details */}
                    <Grid size={{ xs: 12, lg: 8 }}>
                        <Stack spacing={3}>
                            {/* Status Alert */}
                            {isClosed && (
                                <Alert severity="success">
                                    Action has been closed and is now read-only.
                                </Alert>
                            )}

                            {isOverdue && !isClosed && (
                                <Alert severity="error">
                                    This action is overdue! Due date was {format(new Date(action.dueDate), 'MMM dd, yyyy')}.
                                </Alert>
                            )}

                            {!isQIUser && accessToken && !isClosed && (
                                <Alert severity="info">
                                    You are viewing this action via a shared access link. Changes are auto-saved.
                                </Alert>
                            )}

                            {/* Action Description */}
                            <Card>
                                <CardHeader
                                    title="Action Description"
                                    sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}
                                />
                                <CardContent>
                                    <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                        {action.description}
                                    </Typography>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="body2" color="text.secondary">
                                        <strong>Due Date:</strong> {format(new Date(action.dueDate), 'PPP')}
                                    </Typography>
                                </CardContent>
                            </Card>

                            {/* Checklist */}
                            <Card>
                                <CardHeader
                                    title={`Checklist (${progress}% complete)`}
                                    sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText' }}
                                />
                                <CardContent>
                                    {checklist.length === 0 ? (
                                        <Alert severity="info">No checklist items defined.</Alert>
                                    ) : (
                                        <Stack spacing={1}>
                                            <LinearProgress
                                                variant="determinate"
                                                value={progress}
                                                sx={{
                                                    height: 8,
                                                    borderRadius: 4,
                                                    mb: 2,
                                                }}
                                            />
                                            {checklist.map((item) => (
                                                <FormControlLabel
                                                    key={item.id}
                                                    control={
                                                        <Checkbox
                                                            checked={item.completed}
                                                            onChange={() => handleToggleChecklistItem(item.id)}
                                                            disabled={!canEdit}
                                                        />
                                                    }
                                                    label={item.text}
                                                    sx={{
                                                        textDecoration: item.completed ? 'line-through' : 'none',
                                                        color: item.completed ? 'text.secondary' : 'text.primary',
                                                    }}
                                                />
                                            ))}
                                        </Stack>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Action Taken */}
                            <Card>
                                <CardHeader
                                    title="Action Taken"
                                    sx={{ bgcolor: 'success.main', color: 'success.contrastText' }}
                                />
                                <CardContent>
                                    <TextField
                                        label="Describe the actions taken"
                                        multiline
                                        rows={6}
                                        fullWidth
                                        required
                                        value={actionTaken}
                                        onChange={(e) => setActionTaken(e.target.value)}
                                        placeholder="Detail what was done to complete this action..."
                                        disabled={!canEdit}
                                        helperText={`${actionTaken.length} characters`}
                                    />

                                    {/* Evidence Upload Placeholder */}
                                    <Box sx={{ mt: 2 }}>
                                        <Alert severity="info">
                                            Evidence file upload feature coming soon.
                                        </Alert>
                                    </Box>

                                    {canEdit && (
                                        <Stack direction="row" spacing={2} justifyContent="flex-end" sx={{ mt: 2 }}>
                                            <Button
                                                variant="outlined"
                                                onClick={handleSave}
                                                startIcon={<Save />}
                                            >
                                                Save Progress
                                            </Button>
                                            {isQIUser && (
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    onClick={handleClose}
                                                    disabled={!checklistComplete || !actionTaken.trim() || submitting}
                                                    startIcon={<CheckCircle />}
                                                >
                                                    {submitting ? 'Closing...' : 'Close Action'}
                                                </Button>
                                            )}
                                        </Stack>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Collaboration Panel */}
                            <CollaborationPanel
                                resourceType="corrective_action"
                                resourceId={action.id}
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
                                    resourceType="corrective_action"
                                    resourceId={action.id}
                                    ovrReportId={action.ovrReportId}
                                    invitations={[]}
                                />
                            )}

                            {/* Action Metadata */}
                            <Card>
                                <CardHeader
                                    title="Action Info"
                                    sx={{ bgcolor: 'background.default' }}
                                />
                                <CardContent>
                                    <Stack spacing={2} divider={<Divider />}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Action ID
                                            </Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                ACT-{action.id}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Incident Reference
                                            </Typography>
                                            <Typography variant="body2">
                                                <Button
                                                    component={Link}
                                                    href={`/incidents/view/${action.ovrReportId}`}
                                                    size="small"
                                                    sx={{ p: 0, textTransform: 'none' }}
                                                >
                                                    {action.ovrReportId}
                                                </Button>
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Status
                                            </Typography>
                                            <Chip
                                                label={isClosed ? 'Closed' : 'Open'}
                                                size="small"
                                                color={isClosed ? 'success' : 'warning'}
                                            />
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Due Date
                                            </Typography>
                                            <Typography variant="body2" color={isOverdue ? 'error.main' : 'text.primary'}>
                                                {format(new Date(action.dueDate), 'PPP')}
                                            </Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">
                                                Created
                                            </Typography>
                                            <Typography variant="body2">
                                                {format(new Date(action.createdAt), 'PPP')}
                                            </Typography>
                                        </Box>
                                        {action.completedAt && (
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    Completed
                                                </Typography>
                                                <Typography variant="body2" color="success.main">
                                                    {format(new Date(action.completedAt), 'PPP')}
                                                </Typography>
                                            </Box>
                                        )}
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
