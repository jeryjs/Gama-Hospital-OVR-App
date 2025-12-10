'use client';

import type { UserMinimal } from '@/lib/api/schemas';
import { Avatar, Box, Stack, Typography, Paper, alpha } from '@mui/material';
import { Email as EmailIcon, Business as DeptIcon } from '@mui/icons-material';

interface ReporterCardProps {
    reporter: UserMinimal & { email?: string; department?: string | null };
    variant?: 'full' | 'compact' | 'inline';
    label?: string;
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';
}

export function ReporterCard({ reporter, variant = 'full', label = 'Reported by' }: ReporterCardProps) {
    const fullName = `${reporter.firstName || ''} ${reporter.lastName || ''}`.trim();

    // Compact - just avatar and name inline
    if (variant === 'compact') {
        return (
            <Stack direction="row" spacing={1} alignItems="center">
                <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: 'primary.main' }}>
                    {getInitials(reporter.firstName, reporter.lastName)}
                </Avatar>
                <Typography variant="body2" fontWeight={500}>
                    {fullName}
                </Typography>
            </Stack>
        );
    }

    // Inline - single line with all info
    if (variant === 'inline') {
        return (
            <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: 'primary.main' }}>
                    {getInitials(reporter.firstName, reporter.lastName)}
                </Avatar>
                <Box>
                    <Typography variant="body2" fontWeight={600}>
                        {fullName}
                    </Typography>
                    {reporter.department && (
                        <Typography variant="caption" color="text.secondary">
                            {reporter.department}
                        </Typography>
                    )}
                </Box>
            </Stack>
        );
    }

    // Full - card with all details
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ mb: 1.5, display: 'block' }}>
                {label}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                    sx={{
                        width: 48,
                        height: 48,
                        bgcolor: 'primary.main',
                        fontSize: 18,
                        fontWeight: 600,
                    }}
                >
                    {getInitials(reporter.firstName, reporter.lastName)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        {fullName}
                    </Typography>
                    <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                        {reporter.email && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                    {reporter.email}
                                </Typography>
                            </Stack>
                        )}
                        {reporter.department && (
                            <Stack direction="row" spacing={0.5} alignItems="center">
                                <DeptIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                    {reporter.department}
                                </Typography>
                            </Stack>
                        )}
                    </Stack>
                </Box>
            </Stack>
        </Paper>
    );
}
