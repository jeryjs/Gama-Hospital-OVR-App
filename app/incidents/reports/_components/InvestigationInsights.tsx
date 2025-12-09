'use client';

import {
    alpha,
    Box,
    Chip,
    LinearProgress,
    Paper,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { Science, TrendingUp, TrendingDown } from '@mui/icons-material';

interface DateRange {
    start: Date;
    end: Date;
}

interface InvestigationInsightsProps {
    dateRange: DateRange;
    loading?: boolean;
}

// Placeholder data
const mockData = {
    avgDuration: 5.2,
    previousAvgDuration: 6.1,
    totalInvestigations: 23,
    completedOnTime: 18,

    durationDistribution: [
        { range: '0-2 days', count: 5, percentage: 22 },
        { range: '3-5 days', count: 9, percentage: 39 },
        { range: '6-10 days', count: 6, percentage: 26 },
        { range: '11+ days', count: 3, percentage: 13 },
    ],

    rootCauses: [
        { cause: 'Process Failure', count: 8, percentage: 35 },
        { cause: 'Human Error', count: 6, percentage: 26 },
        { cause: 'Equipment Malfunction', count: 4, percentage: 17 },
        { cause: 'Communication Gap', count: 3, percentage: 13 },
        { cause: 'Training Deficiency', count: 2, percentage: 9 },
    ],

    commonFindings: [
        'Inadequate supervision during procedure',
        'Outdated safety protocols',
        'Insufficient staff training',
        'Equipment maintenance delays',
    ],
};

export function InvestigationInsights({ dateRange, loading = false }: InvestigationInsightsProps) {
    const durationTrend = ((mockData.avgDuration - mockData.previousAvgDuration) / mockData.previousAvgDuration) * 100;
    const onTimeRate = Math.round((mockData.completedOnTime / mockData.totalInvestigations) * 100);

    if (loading) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Stack spacing={2}>
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="rectangular" height={200} />
                </Stack>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Science color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                        Investigation Insights
                    </Typography>
                </Stack>

                {/* Key Metrics */}
                <Stack direction="row" spacing={2}>
                    <Box
                        sx={{
                            flex: 1,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                            border: 1,
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            Avg Duration
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography variant="h5" fontWeight={700}>
                                {mockData.avgDuration}d
                            </Typography>
                            <Chip
                                size="small"
                                icon={durationTrend < 0 ? <TrendingDown fontSize="small" /> : <TrendingUp fontSize="small" />}
                                label={`${durationTrend > 0 ? '+' : ''}${durationTrend.toFixed(0)}%`}
                                sx={{
                                    bgcolor: alpha(durationTrend < 0 ? '#10B981' : '#EF4444', 0.15),
                                    color: durationTrend < 0 ? '#10B981' : '#EF4444',
                                    fontWeight: 600,
                                    height: 24,
                                }}
                            />
                        </Stack>
                    </Box>

                    <Box
                        sx={{
                            flex: 1,
                            p: 2,
                            borderRadius: 2,
                            bgcolor: (theme) => alpha(theme.palette.success.main, 0.05),
                            border: 1,
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            On-Time Rate
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="success.main">
                            {onTimeRate}%
                        </Typography>
                    </Box>
                </Stack>

                {/* Duration Distribution */}
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Duration Distribution
                    </Typography>
                    <Stack spacing={1}>
                        {mockData.durationDistribution.map((item) => (
                            <Box key={item.range}>
                                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                    <Typography variant="body2" color="text.secondary">
                                        {item.range}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {item.count} ({item.percentage}%)
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={item.percentage}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                    }}
                                />
                            </Box>
                        ))}
                    </Stack>
                </Box>

                {/* Root Causes */}
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Root Cause Analysis
                    </Typography>
                    <Stack spacing={1}>
                        {mockData.rootCauses.map((item, index) => {
                            const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
                            return (
                                <Tooltip key={item.cause} title={`${item.count} investigations`} arrow>
                                    <Box>
                                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                            <Typography variant="body2">{item.cause}</Typography>
                                            <Typography variant="body2" fontWeight={600}>
                                                {item.percentage}%
                                            </Typography>
                                        </Stack>
                                        <LinearProgress
                                            variant="determinate"
                                            value={item.percentage}
                                            sx={{
                                                height: 6,
                                                borderRadius: 3,
                                                bgcolor: alpha(colors[index], 0.1),
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor: colors[index],
                                                    borderRadius: 3,
                                                },
                                            }}
                                        />
                                    </Box>
                                </Tooltip>
                            );
                        })}
                    </Stack>
                </Box>

                {/* Common Findings */}
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Common Findings
                    </Typography>
                    <Stack spacing={0.5}>
                        {mockData.commonFindings.map((finding, index) => (
                            <Box
                                key={index}
                                sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                                    border: 1,
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography variant="body2" color="text.secondary">
                                    • {finding}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                </Box>
            </Stack>
        </Paper>
    );
}
