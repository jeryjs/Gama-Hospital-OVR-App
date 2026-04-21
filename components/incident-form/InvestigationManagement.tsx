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
    Avatar,
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
import { useSession } from 'next-auth/react';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { Section } from '@/components/shared';
import { secureFetch } from '@/lib/client/csrf';
import { InvestigationWithUsers } from '@/lib/types';
import { RichTextPreview } from '../editor';

interface InvestigationManagementProps {
    incidentId: string;
    investigationId?: number;
    onInvestigationCreated?: (investigationId: number) => void;
}

/**
 * Display an investigation item
 */
function InvestigationItem({ investigation }: { investigation: InvestigationWithUsers }) {
    if (!investigation) return null;

    const isSubmitted = Boolean(investigation.submittedAt);
    const investigators = investigation.investigatorUsers || [];

    return (
        <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            {/* Investigators */}
            <Typography variant="subtitle2" gutterBottom sx={{
                color: "text.secondary"
            }}>
                Investigators
            </Typography>
            <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{
                    flexWrap: "wrap",
                    mb: 2
                }}>
                {investigators.length > 0 ? (
                    investigators.map((investigator) => (
                        <Chip
                            key={investigator.id}
                            avatar={
                                <Avatar
                                    src={investigator.profilePicture || undefined}
                                    sx={{ width: 24, height: 24 }}
                                >
                                    {investigator.firstName?.[0] || '?'}
                                </Avatar>
                            }
                            label={`${investigator.firstName || ''} ${investigator.lastName || ''}`.trim() || investigator.email}
                            size="small"
                            variant="outlined"
                        />
                    ))
                ) : (
                    <Typography variant="body2" sx={{
                        color: "text.secondary"
                    }}>
                        No investigators assigned
                    </Typography>
                )}
            </Stack>

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

            {/* Link to full investigation */}
            {/* <Button
                component={Link}
                href={`/incidents/investigations/${investigation.id}`}
                size="small"
                endIcon={<OpenIcon />}
                sx={{ mt: 1 }}
            >
                View Full Investigation
            </Button> */}
        </Box>
    );
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
    const { data: session } = useSession();
    const canManage = ACCESS_CONTROL.ui.incidentForm.canManageInvestigations(session?.user?.roles || []);

    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

    const { investigation, sharedAccess, mutate } = useInvestigation(investigationId || null);
    const { createInvitation, revokeAccess } = useSharedAccess('investigation', investigationId || null);
    const { showError, ErrorDialogComponent } = useErrorDialog();

    // Create investigation if doesn't exist
    const handleCreateInvestigation = async () => {
        try {
            const response = await secureFetch('/api/investigations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ovrReportId: incidentId }),
            });

            if (!response.ok) throw response;

            const data = await response.json();
            onInvestigationCreated?.(data.investigation.id);
            await mutate();
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
            await mutate();

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
            await mutate();
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

    // if (!canManage) {
    //     return (
    //         <Alert severity="info" sx={{ mt: 1 }}>
    //             <Typography variant="subtitle2" fontWeight={600}>
    //                 Investigation In Progress
    //             </Typography>
    //             <Typography variant="body2">
    //                 Investigation management is restricted to authorized QI roles.
    //             </Typography>
    //         </Alert>
    //     );
    // }

    if (!investigationId && !canManage) {
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

    // If no investigation yet, show create button
    if (!investigationId && canManage) {
        return (
            <>
                <Section
                    container="card"
                    title="Investigation"
                    subtitle="Create investigation to begin assigning investigators"
                    tone="primary"
                >
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
                </Section>
                {ErrorDialogComponent}
            </>
        );
    }

    return (
        <>
            <Section
                container="card"
                title="Investigation Management"
                subtitle="Manage investigators and their access"
                tone="primary"
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
            >
                {/* Investigation Info & Link */}
                <Box sx={{ mb: 2, p: 2, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08), borderRadius: 1 }}>
                    <Stack
                        direction="row"
                        sx={{
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                        <Typography variant="body2" sx={{
                            color: "text.secondary"
                        }}>
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

                    {investigation && <InvestigationItem investigation={investigation} />}
                </Box>

                {/* Investigators List — Disabled as its rendered within investigation page. */}
                {/* {sharedAccess.length === 0 ? (
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
                )} */}

                {/* Success message when link copied */}
                {copiedUrl && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinkIcon />
                            <Typography variant="body2">
                                Invitation email sent automatically. Access link was also copied to clipboard as backup.
                            </Typography>
                        </Box>
                    </Alert>
                )}
            </Section>
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
                        helperText="A secure invitation email is sent automatically; the link is also copied as backup"
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
        </>
    );
}
