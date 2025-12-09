/**
 * @fileoverview Corrective Actions Management
 * 
 * QI creates action items with checklists and invites handlers
 * Similar pattern to InvestigationManagement but for actions
 */

'use client';

import {
    Alert,
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
    IconButton,
    List,
    ListItem,
    ListItemText,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Add as AddIcon,
    CheckCircle as CloseIcon,
    ContentCopy as CopyIcon,
    Delete as DeleteIcon,
    Email as EmailIcon,
    Link as LinkIcon,
    PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useCorrectiveAction, useSharedAccess } from '@/lib/hooks';
import { useErrorDialog } from '@/components/ErrorDialog';
import type { CreateCorrectiveActionInput } from '@/lib/api/schemas';

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
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [checklistItems, setChecklistItems] = useState<string[]>(['']);

    const { showError, ErrorDialogComponent } = useErrorDialog();

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
                description: description.trim(),
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
            setDescription('');
            setDueDate('');
            setChecklistItems(['']);
            setCreateDialogOpen(false);
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

    // Validation
    const isFormValid =
        title.trim().length >= 5 &&
        description.trim().length >= 20 &&
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
                    <List>
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
                    </List>
                )}

                {/* Success message */}
                {copiedUrl && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        Access link copied to clipboard!
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

                        <TextField
                            label="Description"
                            fullWidth
                            required
                            multiline
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            helperText={`${description.length}/20 minimum characters`}
                            error={description.length > 0 && description.length < 20}
                        />

                        <TextField
                            label="Due Date"
                            type="date"
                            fullWidth
                            required
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{
                                min: new Date().toISOString().split('T')[0],
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

            {ErrorDialogComponent}
        </Card>
    );
}

/**
 * Individual Action Item Component
 */
function ActionItem({ actionId, onInvite }: { actionId: number; onInvite: () => void }) {
    const { action, close } = useCorrectiveAction(actionId);

    const handleClose = async () => {
        try {
            await close();
        } catch (error) {
            console.error('Failed to close action:', error);
        }
    };

    if (!action) return null;

    return (
        <ListItem
            secondaryAction={
                <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={onInvite} startIcon={<PersonAddIcon />}>
                        Invite Handler
                    </Button>
                    {action.status === 'open' && (
                        <Button size="small" color="success" onClick={handleClose} startIcon={<CloseIcon />}>
                            Close
                        </Button>
                    )}
                </Stack>
            }
        >
            <ListItemText
                primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={500}>
                            {action.title}
                        </Typography>
                        <Chip label={action.status} size="small" color={action.status === 'closed' ? 'success' : 'warning'} />
                    </Box>
                }
                secondary={
                    <>
                        Due: {new Date(action.dueDate).toLocaleDateString()}
                        {action.completedAt && <> • Completed: {new Date(action.completedAt).toLocaleDateString()}</>}
                    </>
                }
            />
        </ListItem>
    );
}
