/**
 * @fileoverview Investigation Management - Create & Manage Investigations
 * 
 * QI staff creates investigations and invites investigators via email
 * Generates secure access tokens for external access
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
    ContentCopy as CopyIcon,
    Delete as DeleteIcon,
    Email as EmailIcon,
    Link as LinkIcon,
    PersonAdd as PersonAddIcon,
    OpenInNew as OpenIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { useInvestigation, useSharedAccess } from '@/lib/hooks';
import { useErrorDialog } from '@/components/ErrorDialog';
import Link from 'next/link';

interface InvestigationManagementProps {
    incidentId: string;
    investigationId?: number;
    onInvestigationCreated?: (investigationId: number) => void;
}

/**
 * Investigation Management Component
 * Handles creating investigations and managing investigator access
 */
export function InvestigationManagement({
    incidentId,
    investigationId,
    onInvestigationCreated,
}: InvestigationManagementProps) {
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    const { investigation, sharedAccess, mutate } = useInvestigation(investigationId || null);
    const { createInvitation, revokeAccess } = useSharedAccess('investigation', investigationId || null);
    const { showError, ErrorDialogComponent } = useErrorDialog();

    // Create investigation if doesn't exist
    const handleCreateInvestigation = async () => {
        try {
            const response = await fetch('/api/investigations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ovrReportId: incidentId }),
            });

            if (!response.ok) {
                throw new Error('Failed to create investigation');
            }

            const data = await response.json();
            onInvestigationCreated?.(data.investigation.id);
            mutate();
        } catch (error) {
            showError(error);
        }
    };

    // Invite investigator
    const handleInvite = async () => {
        if (!investigationId) return;

        try {
            const result = await createInvitation({
                resourceType: 'investigation',
                resourceId: investigationId,
                ovrReportId: incidentId,
                email: inviteEmail.trim(),
                role: 'investigator',
            });

            // Copy URL to clipboard
            await navigator.clipboard.writeText(result.accessUrl);
            setCopiedUrl(result.accessUrl);

            // Reset form
            setInviteEmail('');
            setInviteDialogOpen(false);
            mutate();

            // Show success
            setTimeout(() => setCopiedUrl(null), 3000);
        } catch (error) {
            showError(error);
        }
    };

    // Revoke access
    const handleRevoke = async (accessId: number) => {
        try {
            await revokeAccess(accessId);
            mutate();
        } catch (error) {
            showError(error);
        }
    };

    // Copy link to clipboard
    const handleCopyLink = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopiedUrl(url);
            setTimeout(() => setCopiedUrl(null), 2000);
        } catch (error) {
            showError(error);
        }
    };

    // Status color mapping
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'accepted':
                return 'success';
            case 'pending':
                return 'warning';
            case 'revoked':
                return 'error';
            default:
                return 'default';
        }
    };

    // If no investigation yet, show create button
    if (!investigationId) {
        return (
            <Card elevation={2}>
                <CardHeader
                    title="Investigation"
                    subheader="Create investigation to begin assigning investigators"
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
                    <Alert severity="info" sx={{ mb: 2 }}>
                        No investigation has been created for this incident yet.
                    </Alert>
                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handleCreateInvestigation}
                        startIcon={<AddIcon />}
                    >
                        Create Investigation
                    </Button>
                </CardContent>
                {ErrorDialogComponent}
            </Card>
        );
    }

    return (
        <Card elevation={2}>
            <CardHeader
                title="Investigation Management"
                subheader="Manage investigators and their access"
                action={
                    <Button
                        variant="contained"
                        size="small"
                        onClick={() => setInviteDialogOpen(true)}
                        startIcon={<PersonAddIcon />}
                    >
                        Invite Investigator
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
                {/* Investigation Info & Link */}
                <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                            Investigation ID: <strong>INV-{investigationId}</strong>
                        </Typography>
                        <Button
                            component={Link}
                            href={`/incidents/investigations/${investigationId}`}
                            size="small"
                            endIcon={<OpenIcon />}
                        >
                            Open Investigation
                        </Button>
                    </Stack>
                </Box>

                {/* Investigators List */}
                {sharedAccess.length === 0 ? (
                    <Alert severity="info">
                        No investigators invited yet. Click "Invite Investigator" to begin.
                    </Alert>
                ) : (
                    <List>
                        {sharedAccess.map((access) => (
                            <ListItem
                                key={access.id}
                                secondaryAction={
                                    <Stack direction="row" spacing={1}>
                                        {access.status !== 'revoked' && (
                                            <>
                                                <Tooltip title="Copy Access Link">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            handleCopyLink(
                                                                `${window.location.origin}/incidents/investigations/${investigationId}?token=${access.accessToken || ''}`
                                                            )
                                                        }
                                                    >
                                                        <CopyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Revoke Access">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRevoke(access.id)}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </>
                                        )}
                                    </Stack>
                                }
                            >
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Avatar sx={{ width: 28, height: 28, fontSize: 12 }}>
                                                {access.email[0].toUpperCase()}
                                            </Avatar>
                                            <Typography variant="body1">{access.email}</Typography>
                                            <Chip
                                                label={access.status}
                                                size="small"
                                                color={getStatusColor(access.status)}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <>
                                            Invited: {new Date(access.invitedAt).toLocaleString()}
                                            {access.lastAccessedAt && (
                                                <> • Last accessed: {new Date(access.lastAccessedAt).toLocaleString()}</>
                                            )}
                                        </>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}

                {/* Success message when link copied */}
                {copiedUrl && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinkIcon />
                            <Typography variant="body2">
                                Access link copied to clipboard! Share it with the investigator.
                            </Typography>
                        </Box>
                    </Alert>
                )}
            </CardContent>

            {/* Invite Dialog */}
            <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Invite Investigator</DialogTitle>
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
                        placeholder="investigator@example.com"
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
