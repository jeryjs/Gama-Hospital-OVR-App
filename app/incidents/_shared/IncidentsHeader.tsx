'use client';

import { Box, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface IncidentsHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    /** Optional count to display in subtitle */
    count?: number;
    /** Apply entrance animation */
    animated?: boolean;
}

/**
 * Reusable header for incident list pages
 * Provides consistent title, subtitle, and action button placement
 */
export function IncidentsHeader({
    title,
    subtitle,
    actions,
    count,
    animated = false,
}: IncidentsHeaderProps) {
    const content = (
        <Stack
            direction="row"
            sx={{
                justifyContent: "space-between",
                alignItems: "flex-start",
                mb: 3
            }}>
            <Box>
                <Typography variant="h4" gutterBottom sx={{
                    fontWeight: 700
                }}>
                    {title}
                </Typography>
                {(subtitle || count !== undefined) && (
                    <Typography variant="body1" sx={{
                        color: "text.secondary"
                    }}>
                        {subtitle}
                        {count !== undefined && ` (${count})`}
                    </Typography>
                )}
            </Box>
            {actions && (
                <Stack direction="row" spacing={2}>
                    {actions}
                </Stack>
            )}
        </Stack>
    );

    if (animated) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {content}
            </motion.div>
        );
    }

    return <>{content}</>;
}
