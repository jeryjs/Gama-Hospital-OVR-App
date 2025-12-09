/**
 * @fileoverview StatCard Component
 * 
 * Displays a statistic card with animation, trend indicator, and hover effects.
 * Used across dashboards for KPI display.
 */

'use client';

import { Box, Paper, Skeleton, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface StatCardProps {
    /** Card title */
    title: string;
    /** Main value to display */
    value: string | number;
    /** Icon component to display */
    icon: ReactNode;
    /** MUI theme color */
    color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
    /** Trend percentage (e.g., '+12%' or '-8%') */
    trend?: string;
    /** Additional subtitle text */
    subtitle?: string;
    /** Click handler */
    onClick?: () => void;
    /** Highlight as urgent */
    urgent?: boolean;
    /** Show loading skeleton */
    loading?: boolean;
}

const MotionPaper = motion.create(Paper);

export function StatCard({
    title,
    value,
    icon,
    color,
    trend,
    subtitle,
    onClick,
    urgent = false,
    loading = false,
}: StatCardProps) {
    const theme = useTheme();
    const paletteColor = theme.palette[color];

    // Determine trend direction
    const trendValue = trend ? parseFloat(trend.replace(/[^0-9.-]/g, '')) : null;
    const isPositiveTrend = trendValue !== null && trendValue >= 0;

    if (loading) {
        return (
            <Paper
                sx={{
                    p: 3,
                    height: '100%',
                    borderRadius: 2,
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Skeleton variant="circular" width={48} height={48} />
                    <Skeleton variant="text" width={60} />
                </Box>
                <Skeleton variant="text" width="60%" height={40} />
                <Skeleton variant="text" width="40%" />
            </Paper>
        );
    }

    return (
        <MotionPaper
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            whileHover={{
                y: -4,
                boxShadow: theme.shadows[6],
            }}
            onClick={onClick}
            sx={{
                p: 3,
                height: '100%',
                borderRadius: 2,
                cursor: onClick ? 'pointer' : 'default',
                border: urgent ? `2px solid ${theme.palette.error.main}` : 'none',
                bgcolor: urgent ? alpha(theme.palette.error.main, 0.04) : 'background.paper',
                transition: 'box-shadow 0.2s ease-in-out',
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box
                    sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(paletteColor.main, 0.12),
                        color: paletteColor.main,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {icon}
                </Box>

                {trend && (
                    <Box
                        sx={{
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            bgcolor: alpha(
                                isPositiveTrend ? theme.palette.success.main : theme.palette.error.main,
                                0.12
                            ),
                            color: isPositiveTrend ? 'success.main' : 'error.main',
                        }}
                    >
                        <Typography variant="caption" fontWeight={600}>
                            {trend}
                        </Typography>
                    </Box>
                )}
            </Box>

            <Typography
                variant="h4"
                fontWeight={700}
                sx={{
                    color: urgent ? 'error.main' : 'text.primary',
                    mb: 0.5,
                }}
            >
                {value}
            </Typography>

            <Typography variant="body2" color="text.secondary">
                {title}
            </Typography>

            {subtitle && (
                <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
                    {subtitle}
                </Typography>
            )}
        </MotionPaper>
    );
}
