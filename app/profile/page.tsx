'use client';

import { AppLayout } from '@/components/AppLayout';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { ROLE_METADATA } from '@/lib/constants';
import { useProfile } from '@/lib/hooks';
import { type NotificationPreference } from '@/lib/hooks/useProfile';
import { type WorkflowNotificationEvent } from '@/lib/utils/notifications';
import {
    BadgeOutlined,
    EmailOutlined,
    LockOutlined,
    NotificationsOutlined,
    PersonOutlined,
} from '@mui/icons-material';
import {
    Alert,
    alpha,
    Avatar,
    Box,
    Card,
    CardContent,
    Checkbox,
    Chip,
    Divider,
    Grid,
    Skeleton,
    Snackbar,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { useCallback, useRef, useState } from 'react';

// ─── Profile skeleton ─────────────────────────────────────────────────────────

function ProfileSkeleton() {
    return (
        <Stack spacing={3}>
            <Skeleton variant="rounded" height={120} sx={{ borderRadius: 3 }} />
            <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
            <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3 }} />
        </Stack>
    );
}

// ─── Locked field helper ──────────────────────────────────────────────────────

function LockedField({ label, value, helperText }: { label: string; value: string; helperText: string }) {
    return (
        <TextField
            label={label}
            value={value || '—'}
            fullWidth
            disabled
            size="small"
            helperText={helperText}
        />
    );
}

// ─── Notification preferences table ──────────────────────────────────────────

type NotificationCategory = (typeof ACCESS_CONTROL.notifications.categories)[number];

interface PreferencesTableProps {
    categories: NotificationCategory[];
    preferences: NotificationPreference[];
    onToggle: (event: WorkflowNotificationEvent, channel: 'inApp') => void;
}

function PreferencesTable({ categories, preferences, onToggle }: PreferencesTableProps) {
    const prefMap = new Map(preferences.map((p) => [p.event, p]));

    const getInApp = (event: WorkflowNotificationEvent) => prefMap.get(event)?.inApp ?? true; // default opted-in

    return (
        <Box>
            {/* Header row */}
            <Grid container sx={{ px: 1.5, pb: 1, alignItems: 'center' }}>
                <Grid size={{ xs: 12, sm: 7 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Notification Category
                    </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 2.5 }} sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        In-App
                    </Typography>
                </Grid>
                <Grid size={{ xs: 6, sm: 2.5 }} sx={{ textAlign: 'center' }}>
                    <Tooltip title="Email notifications are temporarily disabled by the developer" placement="top">
                        <Typography
                            variant="caption"
                            sx={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.disabled', cursor: 'help', textDecorationLine: 'underline', textDecorationStyle: 'dashed' }}
                        >
                            Email
                        </Typography>
                    </Tooltip>
                </Grid>
            </Grid>

            <Divider />

            <Stack divider={<Divider />}>
                {categories.map((cat) => {
                    const inApp = getInApp(cat.event);
                    return (
                        <Grid key={cat.event} container sx={{ px: 1.5, py: 1.25, alignItems: 'center' }}>
                            <Grid size={{ xs: 12, sm: 7 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {cat.label}
                                </Typography>
                                {cat.description && (
                                    <Typography variant="caption" color="text.secondary">
                                        {cat.description}
                                    </Typography>
                                )}
                            </Grid>
                            <Grid size={{ xs: 6, sm: 2.5 }} sx={{ textAlign: 'center' }}>
                                <Checkbox
                                    checked={inApp}
                                    onChange={() => onToggle(cat.event, 'inApp')}
                                    size="small"
                                    color="primary"
                                />
                            </Grid>
                            <Grid size={{ xs: 6, sm: 2.5 }} sx={{ textAlign: 'center' }}>
                                <Tooltip title="Email notifications are temporarily disabled" placement="top">
                                    <span>
                                        <Checkbox checked={false} disabled size="small" />
                                    </span>
                                </Tooltip>
                            </Grid>
                        </Grid>
                    );
                })}
            </Stack>
        </Box>
    );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage() {
    const { data: session } = useSession();
    const { user, notificationPreferences, isLoading, error, updatePreferences } = useProfile();
    const [saveError, setSaveError] = useState(false);

    const roles = session?.user?.roles ?? [];
    const visibleCategories = ACCESS_CONTROL.notifications.visibleCategories(roles);

    // Stable debounce: timer lives in a ref so it never causes re-renders or
    // stale-closure issues from useCallback dependency churn.
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pendingPrefs = useRef<NotificationPreference[]>([]);

    const handleToggle = useCallback(
        (event: WorkflowNotificationEvent, _channel: 'inApp') => {
            const current = notificationPreferences.find((p) => p.event === event);
            const updated: NotificationPreference = {
                event,
                inApp: !(current?.inApp ?? true),
                mail: current?.mail ?? false,
            };

            // Merge into pending batch so rapid toggles accumulate
            const idx = pendingPrefs.current.findIndex((p) => p.event === event);
            if (idx >= 0) pendingPrefs.current[idx] = updated;
            else pendingPrefs.current.push(updated);

            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            debounceTimer.current = setTimeout(() => {
                const toSave = [...pendingPrefs.current];
                pendingPrefs.current = [];
                updatePreferences(toSave).catch(() => setSaveError(true));
            }, 300);
        },
        [notificationPreferences, updatePreferences]
    );

    if (isLoading) return <AppLayout><ProfileSkeleton /></AppLayout>;

    if (error || !user) {
        return (
            <AppLayout>
                <Alert severity="error">Failed to load profile. Please refresh the page.</Alert>
            </AppLayout>
        );
    }

    const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
    const initials = [user.firstName[0], user.lastName[0]].filter(Boolean).join('').toUpperCase() || '?';

    return (
        <AppLayout>
            <Stack spacing={3}>

                {/* ── Identity banner ── */}
                <Box
                    sx={{
                        p: 3,
                        borderRadius: 3,
                        background: (theme) =>
                            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
                        border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    }}
                >
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} sx={{ alignItems: { xs: 'flex-start', sm: 'center' } }}>
                        <Avatar
                            src={`/api/me/avatar`}
                            alt={displayName}
                            sx={{ width: 72, height: 72, fontSize: '1.6rem', fontWeight: 800, bgcolor: 'primary.main', color: 'primary.contrastText', flexShrink: 0 }}
                        >
                            {initials}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="h5" sx={{ fontWeight: 800 }}>{displayName}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                                {user.email}
                                {user.employeeId && <> &mdash; Staff ID: <strong>{user.employeeId}</strong></>}
                            </Typography>
                            <Stack direction="row" spacing={1} sx={{ mt: 1, gap: 0.75, flexWrap: 'wrap' }}>
                                {roles.map((role) => {
                                    const meta = ROLE_METADATA[role];
                                    return (
                                        <Chip
                                            key={role}
                                            label={meta?.label ?? role}
                                            size="small"
                                            sx={{ bgcolor: alpha(meta?.color ?? '#888', 0.18), color: meta?.color ?? 'text.primary', fontWeight: 700, fontSize: '0.7rem' }}
                                        />
                                    );
                                })}
                            </Stack>
                        </Box>
                        {!user.emailVerifiedAt && (
                            <Chip label="Email unverified" color="warning" variant="outlined" size="small" sx={{ flexShrink: 0 }} />
                        )}
                    </Stack>
                </Box>

                {/* ── Personal details (read-only) ── */}
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent>
                        <Stack spacing={2.5}>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                <PersonOutlined color="primary" />
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Personal Details</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Your profile is managed by the Quality Department. Contact them for any changes.
                                    </Typography>
                                </Box>
                            </Stack>

                            <Grid container spacing={1.5}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <LockedField label="First name" value={user.firstName} helperText="Managed by Quality Dept" />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <LockedField label="Last name" value={user.lastName} helperText="Managed by Quality Dept" />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <LockedField label="Department" value={user.department?.name ?? ''} helperText="Assigned by Quality Dept" />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <LockedField label="Unit" value={user.unit?.name ?? ''} helperText="Assigned by Quality Dept" />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <LockedField label="Position / Job title" value={user.position ?? ''} helperText="Managed by Quality Dept" />
                                </Grid>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        label="Staff ID"
                                        value={user.employeeId || '—'}
                                        fullWidth
                                        disabled
                                        size="small"
                                        helperText="Your unique staff identifier"
                                        slotProps={{ input: { startAdornment: <BadgeOutlined sx={{ mr: 1, fontSize: 18, color: 'text.disabled' }} /> } }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        label="Email address"
                                        value={user.email}
                                        fullWidth
                                        disabled
                                        size="small"
                                        helperText={user.emailVerifiedAt ? `Verified on ${new Date(user.emailVerifiedAt).toLocaleDateString()}` : 'Not yet verified'}
                                        slotProps={{ input: { startAdornment: <EmailOutlined sx={{ mr: 1, fontSize: 18, color: 'text.disabled' }} /> } }}
                                    />
                                </Grid>
                            </Grid>

                            {/* Security note */}
                            <Stack direction="row" spacing={1} sx={{ p: 1.5, borderRadius: 2, alignItems: 'center', bgcolor: (theme) => alpha(theme.palette.warning.main, 0.07), border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.2)}` }}>
                                <LockOutlined sx={{ fontSize: 16, color: 'warning.main', flexShrink: 0 }} />
                                <Typography variant="caption" color="text.secondary">
                                    To change your password, sign out and use the Staff ID login flow, or contact an administrator.
                                </Typography>
                            </Stack>
                        </Stack>
                    </CardContent>
                </Card>

                {/* ── Notification preferences ── */}
                <Card variant="outlined" sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ pb: '16px !important' }}>
                        <Stack spacing={2.5}>
                            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                                <NotificationsOutlined color="primary" />
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Notification Preferences</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Choose which events you want to be notified about. Changes save instantly.
                                    </Typography>
                                </Box>
                            </Stack>

                            {visibleCategories.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                    No notification categories available for your role.
                                </Typography>
                            ) : (
                                <PreferencesTable
                                    categories={visibleCategories}
                                    preferences={notificationPreferences}
                                    onToggle={handleToggle}
                                />
                            )}
                        </Stack>
                    </CardContent>
                </Card>

            </Stack>

            <Snackbar
                open={saveError}
                autoHideDuration={4000}
                onClose={() => setSaveError(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setSaveError(false)} sx={{ width: '100%' }}>
                    Failed to save preference. Your change has been reverted.
                </Alert>
            </Snackbar>

        </AppLayout>
    );
}
