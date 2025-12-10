/**
 * @fileoverview Corrective Actions Management
 * 
 * QI creates action items with checklists and invites handlers
 * Similar pattern to InvestigationManagement but for actions
 */

'use client';

import {
    Alert,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    LinearProgress,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { RichTextEditor, RichTextPreview, type EditorValue, getCharacterCount } from '@/components/editor';
import {
    Add as AddIcon,
    CheckCircle as CloseIcon,
    ContentCopy as CopyIcon,
    Delete as DeleteIcon,
    Email as EmailIcon,
    Link as LinkIcon,
    PersonAdd as PersonAddIcon,
    Schedule as ScheduleIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useCorrectiveAction, useSharedAccess } from '@/lib/hooks';
import { useErrorDialog } from '@/components/ErrorDialog';
import type { CreateCorrectiveActionInput } from '@/lib/api/schemas';
import { format, isPast, isToday } from 'date-fns';

interface CorrectiveActionsManagementProps {
    incidentId: string;
    actionIds?: number[];
    onActionCreated?: (actionId: number) => void;
}

/**
 * Corrective Actions Management Component
 */
export function CorrectiveActionsManagement({
    incidentId,
    actionIds = [],
    onActionCreated,
}: CorrectiveActionsManagementProps) {
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [selectedActionId, setSelectedActionId] = useState<number | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    // Form state for creating action
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState<EditorValue | undefined>();
    const [dueDate, setDueDate] = useState('');
    const [checklistItems, setChecklistItems] = useState<string[]>(['']);

    const { showError, ErrorDialogComponent } = useErrorDialog();
    const { createInvitation } = useSharedAccess('corrective_action', selectedActionId);

    // Create action
    const handleCreateAction = async () => {
        try {
            // Build checklist JSON
            const checklist = checklistItems
                .filter((item) => item.trim().length > 0)
                .map((text, index) => ({
                    id: `item-${index + 1}`,
                    text: text.trim(),
                    completed: false,
                }));

            const payload: CreateCorrectiveActionInput = {
                ovrReportId: incidentId,
                title: title.trim(),
                description: description ? JSON.stringify(description) : '',
                dueDate: new Date(dueDate).toISOString(),
                checklist: JSON.stringify(checklist),
            };

            const response = await fetch('/api/corrective-actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Failed to create corrective action');
            }

            const data = await response.json();
            onActionCreated?.(data.action.id);

            // Reset form
            setTitle('');
            setDescription(undefined);
            setDueDate('');
            setChecklistItems(['']);
            setCreateDialogOpen(false);
        } catch (error) {
            showError(error);
        }
    };

    // Send invitation
    const handleInvite = async () => {
        if (!selectedActionId) return;

        try {
            const result = await createInvitation({
                resourceType: 'corrective_action',
                resourceId: selectedActionId,
                ovrReportId: incidentId,
                email: inviteEmail.trim(),
                role: 'action_handler',
            });

            // Copy URL to clipboard
            await navigator.clipboard.writeText(result.accessUrl);
            setCopiedUrl(result.accessUrl);

            // Reset form
            setInviteEmail('');
            setInviteDialogOpen(false);

            // Show success
            setTimeout(() => setCopiedUrl(null), 3000);
        } catch (error) {
            showError(error);
        }
    };

    // Add checklist item
    const addChecklistItem = () => {
        setChecklistItems([...checklistItems, '']);
    };

    // Update checklist item
    const updateChecklistItem = (index: number, value: string) => {
        const updated = [...checklistItems];
        updated[index] = value;
        setChecklistItems(updated);
    };

    // Remove checklist item
    const removeChecklistItem = (index: number) => {
        setChecklistItems(checklistItems.filter((_, i) => i !== index));
    };

    // Validation using getCharacterCount for rich text
    const descriptionLength = description ? getCharacterCount(description) : 0;
    const isFormValid =
        title.trim().length >= 5 &&
        descriptionLength >= 20 &&
        dueDate &&
        checklistItems.some((item) => item.trim().length > 0);

    return (
        <Card elevation={2}>
            <CardHeader
                title="Corrective Actions"
                subheader="Create and manage action items"
                action={
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => setCreateDialogOpen(true)}
                        startIcon={<AddIcon />}
                    >
                        Create Action
                    </Button>
                }
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
                {actionIds.length === 0 ? (
                    <Alert severity="info">
                        No corrective actions created yet. Click "Create Action" to begin.
                    </Alert>
                ) : (
                    <Stack spacing={2}>
                        {actionIds.map((actionId) => (
                            <ActionItem
                                key={actionId}
                                actionId={actionId}
                                onInvite={() => {
                                    setSelectedActionId(actionId);
                                    setInviteDialogOpen(true);
                                }}
                            />
                        ))}
                    </Stack>
                )}

                {/* Success message */}
                {copiedUrl && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        Access link copied to clipboard! Share it with the action handler.
                    </Alert>
                )}
            </CardContent>

            {/* Create Action Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Create Corrective Action</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            helperText={`${title.length}/5 minimum characters`}
                            error={title.length > 0 && title.length < 5}
                        />

                        <Box>
                            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                                Description *
                            </Typography>
                            <RichTextEditor
                                value={description}
                                onChange={setDescription}
                                placeholder="Describe the corrective action in detail..."
                                minHeight={120}
                            />
                            <Typography
                                variant="caption"
                                color={descriptionLength > 0 && descriptionLength < 20 ? 'error.main' : 'text.secondary'}
                                sx={{ mt: 0.5, display: 'block' }}
                            >
                                {descriptionLength}/20 minimum characters
                            </Typography>
                        </Box>

                        <TextField
                            label="Due Date"
                            type="date"
                            fullWidth
                            required
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            slotProps={{
                                inputLabel: { shrink: true },
                                htmlInput: { min: new Date().toISOString().split('T')[0] },
                            }}
                        />

                        {/* Checklist Items */}
                        <Box>
                            <Typography variant="subtitle2" gutterBottom>
                                Checklist Items *
                            </Typography>
                            <Stack spacing={1}>
                                {checklistItems.map((item, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder={`Item ${index + 1}`}
                                            value={item}
                                            onChange={(e) => updateChecklistItem(index, e.target.value)}
                                        />
                                        {checklistItems.length > 1 && (
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => removeChecklistItem(index)}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </Box>
                                ))}
                                <Button size="small" onClick={addChecklistItem} startIcon={<AddIcon />}>
                                    Add Item
                                </Button>
                            </Stack>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateAction} variant="contained" disabled={!isFormValid}>
                        Create Action
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Invite Handler Dialog */}
            <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Invite Action Handler</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Email Address"
                        type="email"
                        fullWidth
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="handler@example.com"
                        helperText="A secure access link will be generated and copied to your clipboard"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleInvite}
                        variant="contained"
                        disabled={!inviteEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail)}
                        startIcon={<EmailIcon />}
                    >
                        Send Invitation
                    </Button>
                </DialogActions>
            </Dialog>

            {ErrorDialogComponent}
        </Card>
    );
}

/**
 * Individual Action Item Component
 */
function ActionItem({ actionId, onInvite }: { actionId: number; onInvite: () => void }) {
    const { action, sharedAccess, close } = useCorrectiveAction(actionId);

    const handleClose = async () => {
        try {
            await close();
        } catch (error) {
            console.error('Failed to close action:', error);
        }
    };

    if (!action) return null;

    // Parse checklist for progress
    let checklistProgress = 0;
    try {
        const checklist = JSON.parse(action.checklist || '[]');
        if (Array.isArray(checklist) && checklist.length > 0) {
            const completed = checklist.filter((item: any) => item.completed).length;
            checklistProgress = (completed / checklist.length) * 100;
        }
    } catch {
        // Ignore parse errors
    }

    // Check if overdue
    const isOverdue = action.status !== 'closed' && action.dueDate && isPast(new Date(action.dueDate)) && !isToday(new Date(action.dueDate));

    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: isOverdue ? 'error.main' : 'divider',
                bgcolor: isOverdue ? 'error.lighter' : 'background.paper',
            }}
        >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Typography variant="subtitle1" fontWeight={600}>
                            {action.title}
                        </Typography>
                        <Chip
                            label={action.status === 'closed' ? 'Closed' : 'Open'}
                            size="small"
                            color={action.status === 'closed' ? 'success' : 'warning'}
                        />
                        {isOverdue && (
                            <Chip
                                icon={<WarningIcon sx={{ fontSize: 14 }} />}
                                label="Overdue"
                                size="small"
                                color="error"
                            />
                        )}
                    </Stack>

                    {/* Description */}
                    <Box
                        sx={{
                            mt: 0.5,
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
                            value={action.description ? (typeof action.description === 'string' ? (() => { try { return JSON.parse(action.description); } catch { return action.description; } })() : action.description) : undefined}
                            emptyText="No description"
                        />
                    </Box>

                    {/* Due date and handlers */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                        <Chip
                            icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                            label={`Due: ${format(new Date(action.dueDate), 'MMM d, yyyy')}`}
                            size="small"
                            variant="outlined"
                            color={isOverdue ? 'error' : 'default'}
                        />
                        {sharedAccess.length > 0 && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                {sharedAccess.slice(0, 3).map((access) => (
                                    <Tooltip key={access.id} title={access.email}>
                                        <Avatar sx={{ width: 24, height: 24, fontSize: 11 }}>
                                            {access.email[0].toUpperCase()}
                                        </Avatar>
                                    </Tooltip>
                                ))}
                                {sharedAccess.length > 3 && (
                                    <Typography variant="caption" color="text.secondary">
                                        +{sharedAccess.length - 3}
                                    </Typography>
                                )}
                            </Stack>
                        )}
                    </Stack>

                    {/* Progress bar */}
                    {checklistProgress > 0 && (
                        <Box sx={{ mt: 1.5 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                    Checklist Progress
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {Math.round(checklistProgress)}%
                                </Typography>
                            </Stack>
                            <LinearProgress
                                variant="determinate"
                                value={checklistProgress}
                                sx={{ height: 4, borderRadius: 1 }}
                            />
                        </Box>
                    )}
                </Box>

                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                    <Button size="small" onClick={onInvite} startIcon={<PersonAddIcon />}>
                        Invite
                    </Button>
                    {action.status !== 'closed' && (
                        <Button size="small" color="success" onClick={handleClose} startIcon={<CloseIcon />}>
                            Close
                        </Button>
                    )}
                </Stack>
            </Stack>
        </Box>
    );
}
