/**
 * @fileoverview Shared Access Manager - Token-Based Access Control UI
 * 
 * Manages email invitations and token generation (Google Forms style)
 * Reusable for investigations and corrective actions
 */

'use client';

import {
    Add,
    ContentCopy,
    Delete,
    Email,
    Link as LinkIcon,
    PersonAdd,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
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
import { useState } from 'react';
import { useErrorDialog } from '@/components/ErrorDialog';
import { useSharedAccess } from '@/lib/hooks';
import type { SharedAccessInvitation } from '@/lib/hooks/useSharedAccess';
import { buildSharedAccessUrl } from '@/lib/utils/shared-access';
import { Section } from './Section';

export interface SharedAccessManagerProps {
    resourceType: 'investigation' | 'corrective_action';
    resourceId: number;
    ovrReportId: string;
    variant?: 'full' | 'compact';
    invitations: SharedAccessInvitation[];
    onUpdate?: () => void | Promise<void>;
}

/**
 * Shared Access Manager Component
 * 
 * Features:
 * - Invite users via email
 * - Generate secure access tokens
 * - Copy shareable URLs
 * - Revoke access
 * - Status tracking (pending/accepted/revoked)
 * 
 * @example
 * <SharedAccessManager
 *   resourceType="investigation"
 *   resourceId={123}
 *   ovrReportId="OVR-2025-01-001"
 *   invitations={[...]}
 *   variant="full"
 * />
 */
export function SharedAccessManager({
    resourceType,
    resourceId,
    ovrReportId,
    variant = 'full',
    invitations,
    onUpdate,
}: SharedAccessManagerProps) {
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const { showError, ErrorDialogComponent } = useErrorDialog();

    const { createInvitation, revokeAccess } = useSharedAccess(resourceType, resourceId);

    // Determine role based on resource type
    const role = resourceType === 'investigation' ? 'investigator' : 'action_handler';
    const roleLabel = resourceType === 'investigation' ? 'Investigator' : 'Action Handler';

    const handleInvite = async () => {
        if (!inviteEmail.trim() || !isValidEmail(inviteEmail)) {
            return;
        }

        setSubmitting(true);

        try {
            const result = await createInvitation({
                resourceType,
                resourceId,
                ovrReportId,
                email: inviteEmail.trim(),
                role,
            });

            // Copy URL to clipboard
            await navigator.clipboard.writeText(result.accessUrl);
            setCopiedUrl(result.accessUrl);

            // Reset form
            setInviteEmail('');
            setInviteDialogOpen(false);
            if (onUpdate) {
                await onUpdate();
            }

            // Clear success message
            setTimeout(() => setCopiedUrl(null), 3000);
        } catch (error) {
            console.error('Failed to create invitation:', error);
            await showError(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevoke = async (accessId: number) => {
        if (!confirm('Revoke access for this user?')) return;

        try {
            await revokeAccess(accessId);
            if (onUpdate) {
                await onUpdate();
            }
        } catch (error) {
            console.error('Failed to revoke access:', error);
            await showError(error);
        }
    };

    const handleCopyLink = async (accessToken: string) => {
        const url = buildSharedAccessUrl(
            resourceType,
            resourceId,
            accessToken,
            window.location.origin
        );

        try {
            await navigator.clipboard.writeText(url);
            setCopiedUrl(url);
            setTimeout(() => setCopiedUrl(null), 2000);
        } catch (error) {
            console.error('Failed to copy link:', error);
        }
    };

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

    const isCompact = variant === 'compact';

    return (
        <>
            <Section
                container="card"
                elevation={isCompact ? 1 : 2}
                title={`${roleLabel} Access`}
                subtitle={`Manage ${roleLabel.toLowerCase()} invitations`}
                tone="secondary"
                action={
                    <Tooltip title={`Invite ${roleLabel}`} arrow={true}>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={() => setInviteDialogOpen(true)}
                            startIcon={<PersonAdd />}
                        >
                            Invite
                        </Button>
                    </Tooltip>
                }
            >
                {/* Success message */}
                {copiedUrl && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinkIcon />
                            <Typography variant="body2">
                                Invitation email sent automatically. Access link was also copied to clipboard as backup.
                            </Typography>
                        </Box>
                    </Alert>
                )}

                {/* Invitations List */}
                {invitations.length === 0 ? (
                    <Alert severity="info">
                        No {roleLabel.toLowerCase()}s invited yet. Click "Invite {roleLabel}" to begin.
                    </Alert>
                ) : (
                    <List sx={{ p: 0 }}>
                        {invitations.map((invitation) => (
                            <ListItem
                                key={invitation.id}
                                sx={{
                                    px: 0,
                                    py: 1.5,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider',
                                    '&:last-child': {
                                        borderBottom: 'none',
                                    },
                                }}
                                secondaryAction={
                                    <Stack direction="row" spacing={1}>
                                        {invitation.status !== 'revoked' && invitation.accessToken && (
                                            <>
                                                <Tooltip title="Copy Access Link">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleCopyLink(invitation.accessToken)}
                                                    >
                                                        <ContentCopy fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Revoke Access">
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleRevoke(invitation.id)}
                                                    >
                                                        <Delete fontSize="small" />
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
                                            <Email fontSize="small" color="action" />
                                            <Typography variant="body1">{invitation.email}</Typography>
                                            <Chip
                                                label={invitation.status}
                                                size="small"
                                                color={getStatusColor(invitation.status) as any}
                                            />
                                        </Box>
                                    }
                                    secondary={
                                        <Box component="span" sx={{ fontSize: '0.75rem' }}>
                                            Invited: {new Date(invitation.invitedAt).toLocaleString()}
                                            {invitation.lastAccessedAt && (
                                                <><br />Last accessed: {new Date(invitation.lastAccessedAt).toLocaleString()}</>
                                            )}
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Section>

            {/* Invite Dialog */}
            <Dialog
                open={inviteDialogOpen}
                onClose={() => setInviteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Invite {roleLabel}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            autoFocus
                            label="Email Address"
                            type="email"
                            fullWidth
                            required
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder={`${roleLabel.toLowerCase()}@example.com`}
                            error={inviteEmail.length > 0 && !isValidEmail(inviteEmail)}
                            helperText={
                                inviteEmail.length > 0 && !isValidEmail(inviteEmail)
                                    ? 'Please enter a valid email address'
                                    : 'A secure invitation email is sent automatically; link is copied as backup'
                            }
                        />

                        <Alert severity="info">
                            <Typography variant="body2">
                                The {roleLabel.toLowerCase()} will receive a unique email invitation to access this {resourceType}.
                                No extra mail app steps required.
                            </Typography>
                        </Alert>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
                    <Button
                        onClick={handleInvite}
                        variant="contained"
                        disabled={!inviteEmail.trim() || !isValidEmail(inviteEmail) || submitting}
                        startIcon={<Email />}
                    >
                        {submitting ? 'Sending...' : 'Send Invitation'}
                    </Button>
                </DialogActions>
            </Dialog>
            {ErrorDialogComponent}
        </>
    );
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
