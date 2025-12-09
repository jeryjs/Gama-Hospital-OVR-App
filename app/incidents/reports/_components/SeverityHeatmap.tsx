'use client';

import { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    Skeleton,
    Tooltip,
    useTheme,
    alpha,
} from '@mui/material';

interface DateRange {
    start: Date;
    end: Date;
}

interface ReportFilters {
    locations: number[];
    departments: number[];
    statuses: string[];
    categories: string[];
}

interface SeverityHeatmapProps {
    dateRange: DateRange;
    filters: ReportFilters;
    loading?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Placeholder data: 7 days x 24 hours
const generateHeatmapData = (): number[][] => {
    return DAYS.map(() =>
        HOURS.map(() => Math.floor(Math.random() * 15))
    );
};

const getColorIntensity = (value: number, max: number, theme: any): string => {
    if (value === 0) return alpha(theme.palette.grey[300], 0.3);
    const intensity = value / max;
    if (intensity < 0.25) return alpha(theme.palette.warning.light, 0.4);
    if (intensity < 0.5) return alpha(theme.palette.warning.main, 0.6);
    if (intensity < 0.75) return alpha(theme.palette.error.light, 0.7);
    return alpha(theme.palette.error.main, 0.9);
};

export default function SeverityHeatmap({
    dateRange,
    filters,
    loading = false,
}: SeverityHeatmapProps) {
    const theme = useTheme();
    const [data] = useState<number[][]>(generateHeatmapData);

    const maxValue = Math.max(...data.flat());

    if (loading) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="rectangular" height={280} sx={{ mt: 2 }} />
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
                Incident Frequency Heatmap
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                When incidents occur most frequently (Day × Hour)
            </Typography>

            <Box sx={{ overflowX: 'auto' }}>
                {/* Hour labels */}
                <Box sx={{ display: 'flex', ml: 5, mb: 0.5 }}>
                    {HOURS.filter((_, i) => i % 3 === 0).map((hour) => (
                        <Typography
                            key={hour}
                            variant="caption"
                            sx={{ width: 36, textAlign: 'center', color: 'text.secondary' }}
                        >
                            {hour.toString().padStart(2, '0')}
                        </Typography>
                    ))}
                </Box>

                {/* Grid rows */}
                {DAYS.map((day, dayIndex) => (
                    <Box key={day} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Typography
                            variant="caption"
                            sx={{ width: 40, fontWeight: 500, color: 'text.secondary' }}
                        >
                            {day}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.25 }}>
                            {HOURS.map((hour) => {
                                const value = data[dayIndex][hour];
                                return (
                                    <Tooltip
                                        key={hour}
                                        title={`${day} ${hour}:00 - ${value} incidents`}
                                        arrow
                                    >
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 16,
                                                borderRadius: 0.5,
                                                bgcolor: getColorIntensity(value, maxValue, theme),
                                                cursor: 'pointer',
                                                transition: 'transform 0.15s, box-shadow 0.15s',
                                                '&:hover': {
                                                    transform: 'scale(1.3)',
                                                    boxShadow: 2,
                                                    zIndex: 1,
                                                },
                                            }}
                                        />
                                    </Tooltip>
                                );
                            })}
                        </Box>
                    </Box>
                ))}
            </Box>

            {/* Legend */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    Less
                </Typography>
                {[0, 0.25, 0.5, 0.75, 1].map((intensity, i) => (
                    <Box
                        key={i}
                        sx={{
                            width: 16,
                            height: 16,
                            borderRadius: 0.5,
                            bgcolor: getColorIntensity(intensity * maxValue, maxValue, theme),
                        }}
                    />
                ))}
                <Typography variant="caption" color="text.secondary">
                    More
                </Typography>
            </Box>
        </Paper>
    );
}
