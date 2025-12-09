/**
 * @fileoverview EmptyState Component
 * 
 * Displays a placeholder when no content is available.
 * Supports default and compact variants for different contexts.
 */

'use client';

import { Box, Typography } from '@mui/material';
import { InboxOutlined } from '@mui/icons-material';
import type { ReactNode } from 'react';

export interface EmptyStateProps {
    /** Custom icon to display */
    icon?: ReactNode;
    /** Main title text */
    title: string;
    /** Optional description text */
    description?: string;
    /** Optional action button/element */
    action?: ReactNode;
    /** Display variant */
    variant?: 'default' | 'compact';
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    variant = 'default',
}: EmptyStateProps) {
    const isCompact = variant === 'compact';

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                py: isCompact ? 4 : 8,
                px: 3,
            }}
        >
            <Box
                sx={{
                    color: 'text.disabled',
                    mb: isCompact ? 1.5 : 2,
                    '& > svg': {
                        fontSize: isCompact ? 48 : 64,
                    },
                }}
            >
                {icon || <InboxOutlined sx={{ fontSize: isCompact ? 48 : 64 }} />}
            </Box>

            <Typography
                variant={isCompact ? 'subtitle1' : 'h6'}
                color="text.secondary"
                fontWeight={500}
                gutterBottom={!!description}
            >
                {title}
            </Typography>

            {description && (
                <Typography
                    variant="body2"
                    color="text.disabled"
                    sx={{
                        maxWidth: 320,
                        mb: action ? 3 : 0,
                    }}
                >
                    {description}
                </Typography>
            )}

            {action && <Box sx={{ mt: isCompact ? 2 : 3 }}>{action}</Box>}
        </Box>
    );
}
