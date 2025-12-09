'use client';

import {
    alpha,
    Box,
    Paper,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { Timer } from '@mui/icons-material';

interface DateRange {
    start: Date;
    end: Date;
}

interface TimeToResolutionProps {
    dateRange: DateRange;
    loading?: boolean;
}

// Placeholder data - resolution times by severity
const mockData = [
    {
        severity: 'Critical',
        color: '#EF4444',
        min: 1,
        q1: 2,
        median: 3,
        q3: 5,
        max: 8,
        avg: 3.2,
        target: 4,
    },
    {
        severity: 'High',
        color: '#F97316',
        min: 2,
        q1: 4,
        median: 6,
        q3: 9,
        max: 14,
        avg: 6.5,
        target: 7,
    },
    {
        severity: 'Medium',
        color: '#F59E0B',
        min: 3,
        q1: 7,
        median: 10,
        q3: 14,
        max: 21,
        avg: 10.8,
        target: 14,
    },
    {
        severity: 'Low',
        color: '#10B981',
        min: 5,
        q1: 12,
        median: 18,
        q3: 25,
        max: 35,
        avg: 18.5,
        target: 21,
    },
];

const maxDays = 35; // Max for scale

export function TimeToResolution({ dateRange, loading = false }: TimeToResolutionProps) {
    const getPosition = (value: number) => (value / maxDays) * 100;

    if (loading) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Stack spacing={2}>
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="rectangular" height={250} />
                </Stack>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Timer color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                        Time to Resolution by Severity
                    </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                    Distribution of resolution times (in days) showing min, quartiles, and max
                </Typography>

                {/* Box Plot Visualization */}
                <Stack spacing={3}>
                    {mockData.map((item) => {
                        const meetsTarget = item.median <= item.target;

                        return (
                            <Box key={item.severity}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <Box
                                            sx={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                bgcolor: item.color,
                                            }}
                                        />
                                        <Typography variant="body2" fontWeight={600}>
                                            {item.severity}
                                        </Typography>
                                    </Stack>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: meetsTarget ? 'success.main' : 'error.main',
                                            fontWeight: 600,
                                        }}
                                    >
                                        Avg: {item.avg}d (Target: {item.target}d)
                                    </Typography>
                                </Stack>

                                {/* Box Plot */}
                                <Box
                                    sx={{
                                        position: 'relative',
                                        height: 32,
                                        bgcolor: alpha(item.color, 0.05),
                                        borderRadius: 1,
                                        border: 1,
                                        borderColor: 'divider',
                                    }}
                                >
                                    {/* Whisker line (min to max) */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: `${getPosition(item.min)}%`,
                                            width: `${getPosition(item.max) - getPosition(item.min)}%`,
                                            height: 2,
                                            bgcolor: item.color,
                                            transform: 'translateY(-50%)',
                                        }}
                                    />

                                    {/* Min whisker cap */}
                                    <Tooltip title={`Min: ${item.min} days`} arrow>
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: `${getPosition(item.min)}%`,
                                                top: '25%',
                                                width: 2,
                                                height: '50%',
                                                bgcolor: item.color,
                                                cursor: 'pointer',
                                            }}
                                        />
                                    </Tooltip>

                                    {/* Max whisker cap */}
                                    <Tooltip title={`Max: ${item.max} days`} arrow>
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: `${getPosition(item.max)}%`,
                                                top: '25%',
                                                width: 2,
                                                height: '50%',
                                                bgcolor: item.color,
                                                cursor: 'pointer',
                                            }}
                                        />
                                    </Tooltip>

                                    {/* IQR Box (Q1 to Q3) */}
                                    <Tooltip title={`Q1: ${item.q1}d, Median: ${item.median}d, Q3: ${item.q3}d`} arrow>
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: `${getPosition(item.q1)}%`,
                                                width: `${getPosition(item.q3) - getPosition(item.q1)}%`,
                                                top: '15%',
                                                height: '70%',
                                                bgcolor: alpha(item.color, 0.3),
                                                border: 2,
                                                borderColor: item.color,
                                                borderRadius: 0.5,
                                                cursor: 'pointer',
                                            }}
                                        />
                                    </Tooltip>

                                    {/* Median line */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            left: `${getPosition(item.median)}%`,
                                            top: '10%',
                                            width: 3,
                                            height: '80%',
                                            bgcolor: item.color,
                                            borderRadius: 1,
                                        }}
                                    />

                                    {/* Target marker */}
                                    <Tooltip title={`Target: ${item.target} days`} arrow>
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                left: `${getPosition(item.target)}%`,
                                                top: 0,
                                                width: 0,
                                                height: 0,
                                                borderLeft: '6px solid transparent',
                                                borderRight: '6px solid transparent',
                                                borderTop: '8px solid',
                                                borderTopColor: meetsTarget ? 'success.main' : 'error.main',
                                                transform: 'translateX(-50%)',
                                                cursor: 'pointer',
                                            }}
                                        />
                                    </Tooltip>
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>

                {/* Scale */}
                <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">0 days</Typography>
                    <Typography variant="caption" color="text.secondary">{maxDays} days</Typography>
                </Stack>

                {/* Legend */}
                <Stack direction="row" spacing={3} justifyContent="center" flexWrap="wrap">
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Box sx={{ width: 20, height: 2, bgcolor: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">Whiskers (Min-Max)</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Box sx={{ width: 16, height: 12, bgcolor: alpha('#6B7280', 0.3), border: 1, borderColor: '#6B7280' }} />
                        <Typography variant="caption" color="text.secondary">IQR (Q1-Q3)</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Box sx={{ width: 3, height: 12, bgcolor: '#6B7280', borderRadius: 1 }} />
                        <Typography variant="caption" color="text.secondary">Median</Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Box
                            sx={{
                                width: 0,
                                height: 0,
                                borderLeft: '5px solid transparent',
                                borderRight: '5px solid transparent',
                                borderTop: '6px solid #6B7280',
                            }}
                        />
                        <Typography variant="caption" color="text.secondary">Target</Typography>
                    </Stack>
                </Stack>
            </Stack>
        </Paper>
    );
}
