/**
 * @fileoverview Status Display - Flexible Status Visualization
 * 
 * Displays OVR status in different formats
 * Supports chip, badge, detailed views with progress
 */

'use client';

import { Box, Chip, LinearProgress, Stack, Typography } from '@mui/material';
import {
    getStatusColor,
    getStatusDescription,
    getStatusLabel,
    getWorkflowProgress,
    type OVRStatus,
} from '@/lib/utils/status';

export interface StatusDisplayProps {
    status: OVRStatus | string;
    variant?: 'chip' | 'badge' | 'detailed' | 'progress';
    size?: 'small' | 'medium' | 'large';
    showProgress?: boolean;
    showDescription?: boolean;
}

/**
 * Status Display Component
 * 
 * Flexible status visualization with multiple variants:
 * - chip: MUI chip (default)
 * - badge: Rounded badge with background
 * - detailed: With description
 * - progress: With progress bar
 * 
 * @example
 * // Simple chip
 * <StatusDisplay status="investigating" variant="chip" />
 * 
 * // With progress bar
 * <StatusDisplay status="investigating" variant="progress" />
 * 
 * // Detailed view
 * <StatusDisplay status="investigating" variant="detailed" />
 */
export function StatusDisplay({
    status,
    variant = 'chip',
    size = 'medium',
    showProgress = false,
    showDescription = false,
}: StatusDisplayProps) {
    const color = getStatusColor(status);
    const label = getStatusLabel(status);
    const description = getStatusDescription(status);
    const progress = getWorkflowProgress(status);

    // Chip variant (default)
    if (variant === 'chip') {
        return (
            <Chip
                label={label}
                color={color as any}
                size={size === 'large' ? 'medium' : 'small'}
                sx={{
                    fontWeight: 600,
                    ...(size === 'large' && {
                        fontSize: '1rem',
                        height: 36,
                        px: 2,
                    }),
                }}
            />
        );
    }

    // Badge variant
    if (variant === 'badge') {
        return (
            <Box
                sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    px: size === 'small' ? 1 : 2,
                    py: size === 'small' ? 0.5 : 1,
                    borderRadius: 2,
                    bgcolor: `${color}.lighter`,
                    color: `${color}.dark`,
                    fontWeight: 600,
                    fontSize: size === 'small' ? '0.75rem' : '0.875rem',
                }}
            >
                {label}
            </Box>
        );
    }

    // Detailed variant
    if (variant === 'detailed') {
        return (
            <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: `${color}.main`,
                        }}
                    />
                    <Typography variant="h6" fontWeight={600}>
                        {label}
                    </Typography>
                </Box>
                {(showDescription || variant === 'detailed') && (
                    <Typography variant="body2" color="text.secondary" sx={{ pl: 2.5 }}>
                        {description}
                    </Typography>
                )}
                {showProgress && (
                    <Box sx={{ pl: 2.5 }}>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{
                                height: 6,
                                borderRadius: 3,
                                bgcolor: 'action.hover',
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: `${color}.main`,
                                },
                            }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {progress}% complete
                        </Typography>
                    </Box>
                )}
            </Stack>
        );
    }

    // Progress variant
    if (variant === 'progress') {
        return (
            <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                        {label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {progress}%
                    </Typography>
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                            bgcolor: `${color}.main`,
                            borderRadius: 4,
                        },
                    }}
                />
                {showDescription && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {description}
                    </Typography>
                )}
            </Box>
        );
    }

    // Fallback to chip
    return (
        <Chip
            label={label}
            color={color as any}
            size="small"
        />
    );
}
