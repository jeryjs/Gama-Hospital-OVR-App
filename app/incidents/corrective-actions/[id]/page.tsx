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
import { CollaborationPanel, Section, SharedAccessManager } from '@/components/shared';
import { useErrorDialog } from '@/components/ErrorDialog';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { formatErrorForAlert } from '@/lib/client/error-handler';
import { useCorrectiveAction } from '@/lib/hooks';
import { ArrowBack, CheckCircle, DeleteOutlined, Edit, Save, UploadFile } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
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
import { useParams, useRouter } from 'next/navigation';
import { type ChangeEvent, useEffect, useState } from 'react';
import { RichTextEditor, RichTextPreview } from '@/components/editor';

interface EvidenceFileMeta {
    name: string;
    size: number;
    type: string;
    uploadedAt: string;
}

/**
 * Corrective Action Detail Page
 * Supports both authenticated QI users and token-based external handlers
 */
export default function CorrectiveActionDetailPage() {
    const params = useParams();
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const { data: session } = useSession();
    const router = useRouter();
    const { showError, ErrorDialogComponent } = useErrorDialog();

    const actionId = Number(params.id);
    // Read token from URL on client without using useSearchParams (avoids prerender bailouts)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        setAccessToken(params.get('token'));
    }, []);

    // Fetch action (with token support)
    const { action, sharedAccess, isLoading, error, mutate, update, close } = useCorrectiveAction(
        actionId,
        accessToken
    );

    // Form state
    const [actionTaken, setActionTaken] = useState('');
    const [checklist, setChecklist] = useState<any[]>([]);
    const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFileMeta[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [savingChecklist, setSavingChecklist] = useState(false);
    const [checklistDirty, setChecklistDirty] = useState(false);

    // Initialize form when data loads
    useEffect(() => {
        if (action) {
            setActionTaken(action.actionTaken || '');
            try {
                setChecklist(action.checklist ? JSON.parse(action.checklist) : []);
            } catch {
                setChecklist([]);
            }
            setChecklistDirty(false);

            try {
                const parsed = action.evidenceFiles ? JSON.parse(action.evidenceFiles) : [];
                const normalized = Array.isArray(parsed)
                    ? parsed
                        .map((file) => {
                            if (typeof file === 'string') {
                                return {
                                    name: file,
                                    size: 0,
                                    type: 'application/octet-stream',
                                    uploadedAt: new Date().toISOString(),
                                } as EvidenceFileMeta;
                            }

                            if (file && typeof file === 'object' && 'name' in file) {
                                return {
                                    name: String((file as any).name || 'attachment'),
                                    size: Number((file as any).size || 0),
                                    type: String((file as any).type || 'application/octet-stream'),
                                    uploadedAt: String((file as any).uploadedAt || new Date().toISOString()),
                                } as EvidenceFileMeta;
                            }

                            return null;
                        })
                        .filter((file): file is EvidenceFileMeta => file !== null)
                    : [];

                setEvidenceFiles(normalized);
            } catch {
                setEvidenceFiles([]);
            }
        }
    }, [action]);

    const isQIUser = session && ACCESS_CONTROL.ui.incidentForm.canEditQISection(session?.user.roles || []);
    const isClosed = action?.status === 'closed';
    const canEdit = !isClosed && (isQIUser || accessToken);
    const canOpenIncident = Boolean(session?.user);
    const isOverdue = action && action.status === 'open' && isPast(new Date(action.dueDate));
    const checklistComplete = checklist.length > 0 && checklist.every((item) => item.completed);
    const hasCompletionInput = Boolean(actionTaken.trim() || evidenceFiles.length > 0);

    const handleToggleChecklistItem = (itemId: string) => {
        if (!canEdit) return;

        const updated = checklist.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        setChecklist(updated);
        setChecklistDirty(true);
    };

    const handleSaveChecklist = async () => {
        if (!canEdit || !checklistDirty) return;

        setSavingChecklist(true);
        try {
            await update({
                checklist: JSON.stringify(checklist),
            });
            setChecklistDirty(false);
        } catch (error) {
            await showError(error);
        } finally {
            setSavingChecklist(false);
        }
    };

    const handleSave = async () => {
        if (!canEdit) return;

        setSubmitting(true);
        try {
            await update({
                actionTaken: actionTaken.trim() || undefined,
                evidenceFiles: evidenceFiles.length > 0 ? JSON.stringify(evidenceFiles) : undefined,
            });
            setIsEditing(false);
        } catch (error) {
            await showError(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEvidenceSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (!files.length) return;

        const appended = files.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            uploadedAt: new Date().toISOString(),
        }));

        setEvidenceFiles((prev) => [...prev, ...appended]);
        event.target.value = '';
    };

    const handleRemoveEvidence = (index: number) => {
        if (!canEdit) return;
        setEvidenceFiles((prev) => prev.filter((_, idx) => idx !== index));
    };

    const handleClose = async () => {
        if (!canEdit || !isQIUser) return;

        if (!checklistComplete) {
            await showError(new Error('All checklist items must be completed before closing'));
            return;
        }

        if (!hasCompletionInput) {
            await showError(new Error('Please provide action details or at least one attachment before closing'));
            return;
        }

        if (!confirm('Close this action? This cannot be undone.')) return;

        setSubmitting(true);
        try {
            await close({
                actionTaken: actionTaken.trim(),
                evidenceFiles: evidenceFiles.length > 0 ? JSON.stringify(evidenceFiles) : undefined,
            });
            router.push('/incidents/view/' + action?.ovrReportId + '#Corrective-Actions');
        } catch (error) {
            await showError(error);
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
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        {isQIUser && (
                            <IconButton component={Link} href={`/incidents/view/${action.ovrReportId}#Corrective-Actions`} size="small">
                                <ArrowBack />
                            </IconButton>
                        )}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                {action.title}
                            </Typography>
                            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    Action ID: ACT-{action.id}
                                </Typography>
                                {canOpenIncident && (
                                    <>
                                        <Typography variant="body2" sx={{ color: "text.secondary" }}>•</Typography>
                                        <Button
                                            component={Link}
                                            href={`/incidents/view/${action.ovrReportId}`}
                                            size="small"
                                            sx={{ p: 0, minWidth: 0, textTransform: 'none' }}
                                        >
                                            {action.ovrReportId}
                                        </Button>
                                    </>
                                )}
                                <Chip
                                    label={isClosed ? 'Closed' : 'Open'}
                                    size="small"
                                    color={isClosed ? 'success' : 'warning'}
                                />
                                {isOverdue && !isClosed && (
                                    <Chip label="Overdue" size="small" color="error" />
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
                                    You are viewing this action via a shared access link.
                                </Alert>
                            )}

                            {/* Action Description */}
                            <Section container="card" title="Action Description" tone="primary">
                                <Box sx={{ mb: 2 }}>
                                    {action.description || 'No description provided'}
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                    <strong>Due Date:</strong> {format(new Date(action.dueDate), 'PPP')}
                                </Typography>
                            </Section>

                            {/* Checklist */}
                            <Section
                                container="card"
                                title={`Checklist (${progress}% complete)`}
                                tone="secondary"
                            >
                                {checklist.length === 0 ? (
                                    <Alert severity="info">No checklist items defined.</Alert>
                                ) : (
                                    <Stack spacing={1}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={progress}
                                            sx={{ height: 8, borderRadius: 4, mb: 2 }}
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

                                        {canEdit && (
                                            <Stack direction="row" sx={{ justifyContent: "flex-end", mt: 1 }}>
                                                <Button
                                                    variant="outlined"
                                                    startIcon={<Save />}
                                                    onClick={handleSaveChecklist}
                                                    disabled={!checklistDirty || savingChecklist}
                                                >
                                                    {savingChecklist ? 'Saving...' : 'Update Checklist'}
                                                </Button>
                                            </Stack>
                                        )}
                                    </Stack>
                                )}
                            </Section>

                            {/* Action Taken */}
                            <Section
                                container="card"
                                title="Action Report"
                                tone="success"
                                action={canEdit && !isEditing && (
                                    <Button
                                        variant="outlined"
                                        onClick={() => setIsEditing(true)}
                                        startIcon={<Edit />}
                                        size="small"
                                    >
                                        Edit
                                    </Button>
                                )}
                            >
                                {!checklistComplete && (
                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                        Complete all checklist items before filling this report.
                                    </Alert>
                                )}

                                {isEditing ? (
                                    <Stack spacing={2}>
                                        <RichTextEditor
                                            label="Action Details"
                                            value={actionTaken}
                                            onChange={(value) => setActionTaken(value)}
                                            placeholder="Describe what was done to resolve this action..."
                                            helperText={`${actionTaken.replace(/<[^>]+>/g, '').length} characters`}
                                        />

                                        <Box>
                                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    Attached Documents ({evidenceFiles.length})
                                                </Typography>
                                                <Button component="label" size="small" startIcon={<UploadFile />}>
                                                    Add File
                                                    <input type="file" hidden multiple onChange={handleEvidenceSelect} />
                                                </Button>
                                            </Stack>

                                            {evidenceFiles.length === 0 ? (
                                                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                                                    No files attached
                                                </Typography>
                                            ) : (
                                                <Stack spacing={1}>
                                                    {evidenceFiles.map((file, index) => (
                                                        <Paper key={`${file.name}-${index}`} variant="outlined" sx={{ p: 1.25 }}>
                                                            <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
                                                                <Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{file.name}</Typography>
                                                                    <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                                        {file.size > 0 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : 'Size N/A'} • {file.type}
                                                                    </Typography>
                                                                </Box>
                                                                <IconButton size="small" onClick={() => handleRemoveEvidence(index)} color="error">
                                                                    <DeleteOutlined fontSize="small" />
                                                                </IconButton>
                                                            </Stack>
                                                        </Paper>
                                                    ))}
                                                </Stack>
                                            )}
                                        </Box>

                                        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
                                            <Button onClick={() => setIsEditing(false)} disabled={submitting}>
                                                Cancel
                                            </Button>
                                            <Button variant="outlined" onClick={handleSave} startIcon={<Save />} disabled={submitting}>
                                                {submitting ? 'Saving...' : 'Save'}
                                            </Button>
                                            {isQIUser && (
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    onClick={handleClose}
                                                    disabled={!checklistComplete || !hasCompletionInput || submitting}
                                                    startIcon={<CheckCircle />}
                                                >
                                                    {submitting ? 'Closing...' : 'Close Action'}
                                                </Button>
                                            )}
                                        </Stack>
                                    </Stack>
                                ) : (
                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                                                Action Details
                                            </Typography>
                                            <Paper variant="outlined" sx={{ p: 2, minHeight: 100 }}>
                                                {/* <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                                    {actionTaken || 'No action details provided yet.'}
                                                </Typography> */}
                                                <RichTextPreview value={actionTaken} emptyText="No action details provided yet." />
                                            </Paper>
                                        </Box>

                                        <Box>
                                            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
                                                Attached Documents ({evidenceFiles.length})
                                            </Typography>
                                            {evidenceFiles.length === 0 ? (
                                                <Alert severity="info">No files attached.</Alert>
                                            ) : (
                                                <Stack spacing={1}>
                                                    {evidenceFiles.map((file, index) => (
                                                        <Paper key={`${file.name}-${index}`} variant="outlined" sx={{ p: 1.25 }}>
                                                            <Box>
                                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{file.name}</Typography>
                                                                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                                    {file.size > 0 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : 'Size N/A'} • {file.type}
                                                                </Typography>
                                                            </Box>
                                                        </Paper>
                                                    ))}
                                                </Stack>
                                            )}
                                        </Box>
                                    </Stack>
                                )}
                            </Section>
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
                                    invitations={sharedAccess || []}
                                    onUpdate={async () => {
                                        await mutate();
                                    }}
                                />
                            )}

                            {/* Action Metadata */}
                            <Section container="card" title="Action Info">
                                <Stack spacing={2} divider={<Divider />}>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            Action ID
                                        </Typography>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            ACT-{action.id}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            Incident Reference
                                        </Typography>
                                        <Typography variant="body2">
                                            {canOpenIncident ? (
                                                <Button
                                                    component={Link}
                                                    href={`/incidents/view/${action.ovrReportId}`}
                                                    size="small"
                                                    sx={{ p: 0, textTransform: 'none' }}
                                                >
                                                    {action.ovrReportId}
                                                </Button>
                                            ) : (
                                                <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
                                                    {action.ovrReportId}
                                                </Typography>
                                            )}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            Status
                                        </Typography>
                                        <Chip
                                            label={isClosed ? 'Closed' : 'Open'}
                                            size="small"
                                            color={isClosed ? 'success' : 'warning'}
                                        />
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            Due Date
                                        </Typography>
                                        <Typography variant="body2" color={isOverdue ? 'error.main' : 'text.primary'}>
                                            {format(new Date(action.dueDate), 'PPP')}
                                        </Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                            Created
                                        </Typography>
                                        <Typography variant="body2">
                                            {format(new Date(action.createdAt), 'PPP')}
                                        </Typography>
                                    </Box>
                                    {action.completedAt && (
                                        <Box>
                                            <Typography variant="caption" sx={{ color: "text.secondary" }}>
                                                Completed
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: "success.main" }}>
                                                {format(new Date(action.completedAt), 'PPP')}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </Section>

                            {/* Collaboration Panel */}
                            <CollaborationPanel
                                resourceType="corrective_action"
                                resourceId={action.id}
                                ovrReportId={action.ovrReportId}
                                canComment={Boolean(session?.user)}
                                canAttach={false}
                            />
                        </Stack>
                    </Grid>
                </Grid>
            </Box>
            {ErrorDialogComponent}
        </AppLayout>
    );
}
