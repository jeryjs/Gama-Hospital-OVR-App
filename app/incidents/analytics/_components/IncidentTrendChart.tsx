'use client';

import React from 'react';
import {
    Paper,
    Box,
    Typography,
    Skeleton,
    Tooltip,
} from '@mui/material';
import { TrendingUp, TrendingDown } from '@mui/icons-material';

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

interface IncidentTrendChartProps {
    dateRange?: DateRange;
    filters?: ReportFilters;
    compact?: boolean;
    loading?: boolean;
}

interface TrendDataPoint {
    label: string;
    value: number;
    date: Date;
}

// Placeholder data - last 12 periods
const placeholderData: TrendDataPoint[] = [
    { label: 'Jan', value: 45, date: new Date(2025, 0, 1) },
    { label: 'Feb', value: 52, date: new Date(2025, 1, 1) },
    { label: 'Mar', value: 48, date: new Date(2025, 2, 1) },
    { label: 'Apr', value: 61, date: new Date(2025, 3, 1) },
    { label: 'May', value: 55, date: new Date(2025, 4, 1) },
    { label: 'Jun', value: 67, date: new Date(2025, 5, 1) },
    { label: 'Jul', value: 72, date: new Date(2025, 6, 1) },
    { label: 'Aug', value: 58, date: new Date(2025, 7, 1) },
    { label: 'Sep', value: 63, date: new Date(2025, 8, 1) },
    { label: 'Oct', value: 70, date: new Date(2025, 9, 1) },
    { label: 'Nov', value: 65, date: new Date(2025, 10, 1) },
    { label: 'Dec', value: 78, date: new Date(2025, 11, 1) },
];

const SparkLine = ({ data }: { data: TrendDataPoint[] }) => {
    const maxVal = Math.max(...data.map(d => d.value));
    const minVal = Math.min(...data.map(d => d.value));
    const range = maxVal - minVal || 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.value - minVal) / range) * 80 - 10;
        return `${x},${y}`;
    }).join(' ');

    const trend = data[data.length - 1].value >= data[0].value;

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <svg width="80" height="30" viewBox="0 0 100 100" preserveAspectRatio="none">
                <polyline
                    fill="none"
                    stroke={trend ? '#4caf50' : '#f44336'}
                    strokeWidth="3"
                    points={points}
                />
            </svg>
            {trend ? (
                <TrendingUp sx={{ color: 'success.main', fontSize: 18 }} />
            ) : (
                <TrendingDown sx={{ color: 'error.main', fontSize: 18 }} />
            )}
        </Box>
    );
};

const BarChart = ({ data, loading }: { data: TrendDataPoint[]; loading?: boolean }) => {
    const maxVal = Math.max(...data.map(d => d.value));

    if (loading) {
        const heights = [100, 150, 80, 120, 90, 140, 110, 130, 70, 160, 95, 125];
        return (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 200 }}>
                {heights.map((height, i) => (
                    <Skeleton key={i} variant="rectangular" width="100%" height={height} />
                ))}
            </Box>
        );
    }

    return (
        <Box>
            {/* Y-axis labels */}
            <Box sx={{ display: 'flex', mb: 1 }}>
                <Box sx={{ width: 40, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 200 }}>
                    <Typography variant="caption" color="text.secondary">{maxVal}</Typography>
                    <Typography variant="caption" color="text.secondary">{Math.round(maxVal / 2)}</Typography>
                    <Typography variant="caption" color="text.secondary">0</Typography>
                </Box>

                {/* Bars */}
                <Box sx={{ flex: 1, display: 'flex', gap: 0.5, alignItems: 'flex-end', height: 200 }}>
                    {data.map((point, index) => {
                        const height = (point.value / maxVal) * 100;
                        return (
                            <Tooltip
                                key={index}
                                title={`${point.label}: ${point.value} incidents`}
                                arrow
                            >
                                <Box
                                    sx={{
                                        flex: 1,
                                        height: `${height}%`,
                                        bgcolor: 'primary.main',
                                        borderRadius: '4px 4px 0 0',
                                        transition: 'all 0.2s ease-in-out',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: 'primary.dark',
                                            transform: 'scaleY(1.02)',
                                        },
                                    }}
                                />
                            </Tooltip>
                        );
                    })}
                </Box>
            </Box>

            {/* X-axis labels */}
            <Box sx={{ display: 'flex', pl: 5 }}>
                <Box sx={{ flex: 1, display: 'flex', gap: 0.5 }}>
                    {data.map((point, index) => (
                        <Typography
                            key={index}
                            variant="caption"
                            color="text.secondary"
                            sx={{ flex: 1, textAlign: 'center' }}
                        >
                            {point.label}
                        </Typography>
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default function IncidentTrendChart({
    dateRange,
    filters,
    compact = false,
    loading = false,
}: IncidentTrendChartProps) {
    const data = placeholderData;
    const totalIncidents = data.reduce((sum, d) => sum + d.value, 0);

    if (compact) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 2,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Incident Trend
                        </Typography>
                        <Typography variant="h6" fontWeight="bold">
                            {data[data.length - 1].value}
                        </Typography>
                    </Box>
                    {loading ? (
                        <Skeleton variant="rectangular" width={80} height={30} />
                    ) : (
                        <SparkLine data={data} />
                    )}
                </Box>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight="bold">
                        Incident Trends
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {totalIncidents} total incidents in period
                    </Typography>
                </Box>
                <SparkLine data={data} />
            </Box>
            <BarChart data={data} loading={loading} />
        </Paper>
    );
}
