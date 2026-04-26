/**
 * @fileoverview Shared Access Manager - Token-Based Access Control UI
 * 
 * Manages email invitations and token generation (Google Forms style)
 * Reusable for investigations and corrective actions
 */

'use client';

import {
  Email,
  Link as LinkIcon,
  PersonAdd,
  GroupRemove,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
  Tooltip,
  Typography,
} from '@mui/material';
import { useEffect, useState } from 'react';
import { useErrorDialog } from '@/components/ErrorDialog';
import { apiCall } from '@/lib/client/error-handler';
import type { UserSearchResult } from '@/lib/api/schemas';
import { useSharedAccess } from '@/lib/hooks';
import type { SharedAccessInvitation } from '@/lib/hooks/useSharedAccess';
import { buildSharedAccessUrl } from '@/lib/utils/shared-access';
import { PeoplePicker } from './PeoplePicker';
import { Section } from './Section';
import { useRouter, useSearchParams } from 'next/navigation';

export interface SharedAccessManagerProps {
  resourceType: 'investigation' | 'corrective_action';
  resourceId: number;
  ovrReportId: string;
  variant?: 'full' | 'compact';
  invitations: SharedAccessInvitation[];
  onUpdate?: () => void | Promise<void>;
}

type RecommendationReason =
  | 'department_head'
  | 'reporter'
  | 'involved_person'
  | 'resource_member'
  | 'resource_owner';

type RecommendedUser = UserSearchResult & {
  recommendationReason: RecommendationReason;
};

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
  const router = useRouter();
  const inviteParam = useSearchParams().get('invite');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [recommendedUsers, setRecommendedUsers] = useState<RecommendedUser[]>([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { showError, ErrorDialogComponent } = useErrorDialog();
  const { createInvitation, revokeAccess } = useSharedAccess(resourceType, resourceId);

  // Determine role based on resource type
  const role = resourceType === 'investigation' ? 'investigator' : 'action_handler';
  const roleLabel = resourceType === 'investigation' ? 'Investigator' : 'Action Handler';

  // Consume 'invite' param to auto show invite dialog
  useEffect(() => {
    if (inviteParam) {
      setInviteDialogOpen(inviteParam === 'true');
      // Clean up URL to prevent repeated dialog on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      router.replace(url.href);
    }
  }, [inviteParam, router]);

  useEffect(() => {
    if (!inviteDialogOpen) {
      return;
    }

    let active = true;

    const loadRecommended = async () => {
      setIsLoadingRecommended(true);

      try {
        const params = new URLSearchParams();
        params.set('ovrReportId', ovrReportId);
        params.set('resourceType', resourceType);
        params.set('resourceId', String(resourceId));

        const { data, error } = await apiCall<RecommendedUser[]>(
          `/api/users/recommended?${params.toString()}`
        );

        if (error || !active) {
          if (error) {
            throw error;
          }
          return;
        }

        const invitedEmails = new Set(
          invitations.map((invitation) => invitation.email.trim().toLowerCase())
        );

        setRecommendedUsers(
          (data || []).filter(
            (user) => !invitedEmails.has(user.email.trim().toLowerCase())
          )
        );
      } catch (error) {
        console.error('Failed to load recommended people:', error);
      } finally {
        if (active) {
          setIsLoadingRecommended(false);
        }
      }
    };

    loadRecommended();

    return () => {
      active = false;
    };
  }, [inviteDialogOpen, invitations, ovrReportId, resourceId, resourceType]);

  const getRecommendedReasonLabel = (reason: RecommendationReason) => {
    switch (reason) {
      case 'department_head': return 'Dept Head';
      case 'reporter': return 'Reporter';
      case 'involved_person': return 'Involved Staff';
      case 'resource_member': return resourceType === 'investigation' ? 'Investigator' : 'Assignee';
      case 'resource_owner': return 'Created This';
      default: return 'Suggested';
    }
  };

  const getUserName = (user: UserSearchResult) =>
    `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

  const getUserDescriptor = (user: UserSearchResult) =>
    [user.position, user.department].filter(Boolean).join(' • ');

  const handleInvite = async () => {
    if (!selectedUser?.email) {
      await showError(new Error(`Please select a ${roleLabel.toLowerCase()} first`));
      return;
    }

    setSubmitting(true);

    try {
      const result = await createInvitation({
        resourceType,
        resourceId,
        ovrReportId,
        email: selectedUser.email.trim(),
        role,
      });

      // Copy URL to clipboard
      await navigator.clipboard.writeText(result.accessUrl);
      setCopiedUrl(result.accessUrl);

      // Reset form
      setSelectedUser(null);
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
                  '.MuiListItem-secondaryAction': {
                    right: 0,
                  },
                }}
                secondaryAction={
                  invitation.status !== 'revoked' && invitation.accessToken ? (
                    <Box
                      sx={{
                        position: 'relative',
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                    >
                      <Tooltip arrow title={
                        <Button
                          fullWidth
                          size="small"
                          variant="text"
                          color="error"
                          startIcon={<GroupRemove fontSize="small" />}
                          onClick={() => handleRevoke(invitation.id)}
                        >
                          Revoke access
                        </Button>
                      }
                      >
                        <IconButton size="small" aria-label={`Actions for ${invitation.email}`}>
                          <Typography component="span" sx={{ fontSize: '1.25rem', lineHeight: 0 }}>
                            ⋮
                          </Typography>
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : null
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email fontSize="small" color="action" />
                      <Typography variant="body1">{invitation.email}</Typography>
                    </Box>
                  }
                  slotProps={{ secondary: { component: 'span' } }}
                  secondary={
                    <Box component="span" sx={{ fontSize: '0.75rem' }}>
                      Invited: {new Date(invitation.invitedAt).toLocaleDateString()}
                      {invitation.lastAccessedAt && (
                        <>
                          <br />
                          Last accessed: {new Date(invitation.lastAccessedAt).toLocaleDateString()}
                        </>
                      )}
                      <Chip
                        label={invitation.status}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1, scale: 0.9 }}
                        color={getStatusColor(invitation.status) as any}
                      />
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
        onClose={() => {
          setInviteDialogOpen(false);
          setSelectedUser(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite {roleLabel}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <PeoplePicker
              autoFocus
              label={`Select ${roleLabel}`}
              placeholder={`Search by name, position, or department`}
              value={selectedUser}
              onChange={(value) => {
                if (!value || Array.isArray(value)) {
                  setSelectedUser(null);
                  return;
                }
                setSelectedUser(value);
              }}
              variant="ms-modern"
              required
              fullWidth
              helperText="Select the exact person by name, position, and department"
            />

            {isLoadingRecommended && (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <CircularProgress size={16} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  Loading suggestions...
                </Typography>
              </Stack>
            )}

            {!isLoadingRecommended && recommendedUsers.length > 0 && (
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                  Suggested people
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                  {recommendedUsers
                    .filter((user) => !selectedUser || user.id !== selectedUser.id)
                    .map((user) => {
                      const descriptor = getUserDescriptor(user);
                      const reason = getRecommendedReasonLabel(user.recommendationReason);
                      const label = descriptor
                        ? `${getUserName(user)} • ${descriptor}`
                        : getUserName(user);

                      return (
                        <Tooltip key={user.id} title={`${reason} • ${user.email}`} arrow>
                          <Chip
                            clickable
                            onClick={() => setSelectedUser(user)}
                            label={label}
                            variant="outlined"
                            size="small"
                          />
                        </Tooltip>
                      );
                    })}
                </Stack>
              </Box>
            )}

            <Alert severity="info">
              <Typography variant="body2">
                The selected person will receive a unique email invitation to access this {resourceType}.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setInviteDialogOpen(false);
              setSelectedUser(null);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            variant="contained"
            disabled={!selectedUser || submitting}
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
