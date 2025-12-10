'use client';

import { Box, Card, CardContent, Grid, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface MetricCardData {
    label: string;
    value: number | string;
    /** Color theme for the card */
    color?: 'default' | 'warning' | 'success' | 'error' | 'info' | 'primary';
    /** Optional icon to display */
    icon?: ReactNode;
}

interface MetricsCardsProps {
    metrics: MetricCardData[];
}

/**
 * Color mapping for metric cards
 */
const colorMap = {
    default: {
        bg: 'background.paper',
        text: 'text.primary',
        label: 'text.secondary',
    },
    warning: {
        bg: 'warning.lighter',
        text: 'warning.dark',
        label: 'warning.dark',
    },
    success: {
        bg: 'success.lighter',
        text: 'success.dark',
        label: 'success.dark',
    },
    error: {
        bg: 'error.lighter',
        text: 'error.dark',
        label: 'error.dark',
    },
    info: {
        bg: 'info.lighter',
        text: 'info.dark',
        label: 'info.dark',
    },
    primary: {
        bg: 'primary.lighter',
        text: 'primary.dark',
        label: 'primary.dark',
    },
};

/**
 * Reusable metrics cards grid for incident pages
 * Displays key statistics in a responsive grid
 */
export function MetricsCards({ metrics }: MetricsCardsProps) {
    // Dynamically calculate grid size based on number of metrics
    const getGridSize = () => {
        const count = metrics.length;
        if (count <= 2) return { xs: 12, sm: 6 };
        if (count === 3) return { xs: 12, sm: 6, md: 4 };
        return { xs: 12, sm: 6, md: 3 };
    };

    const gridSize = getGridSize();

    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            {metrics.map((metric, index) => {
                const colors = colorMap[metric.color || 'default'];
                const showConditionalColor =
                    metric.color === 'error' && metric.value === 0;

                return (
                    <Grid key={index} size={gridSize}>
                        <Card
                            sx={{
                                bgcolor: showConditionalColor ? 'background.paper' : colors.bg,
                            }}
                        >
                            <CardContent>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}
                                >
                                    <Box>
                                        <Typography
                                            variant="body2"
                                            color={
                                                showConditionalColor ? 'text.secondary' : colors.label
                                            }
                                            gutterBottom
                                        >
                                            {metric.label}
                                        </Typography>
                                        <Typography
                                            variant="h3"
                                            fontWeight={700}
                                            color={
                                                showConditionalColor ? 'text.primary' : colors.text
                                            }
                                        >
                                            {metric.value}
                                        </Typography>
                                    </Box>
                                    {metric.icon && (
                                        <Box
                                            sx={{
                                                color: showConditionalColor
                                                    ? 'text.secondary'
                                                    : colors.text,
                                            }}
                                        >
                                            {metric.icon}
                                        </Box>
                                    )}
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                );
            })}
        </Grid>
    );
}
