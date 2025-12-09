'use client';

import {
    Paper,
    Typography,
    Box,
    Skeleton,
    Chip,
    useTheme,
    alpha,
} from '@mui/material';
import {
    ArrowDownward as ArrowIcon,
    Timer as TimerIcon,
    CheckCircle as CheckIcon,
} from '@mui/icons-material';

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

interface ResponseTimeAnalyticsProps {
    dateRange: DateRange;
    filters: ReportFilters;
    loading?: boolean;
}

interface TransitionStage {
    from: string;
    to: string;
    avgHours: number;
    target: number;
    count: number;
}

const placeholderData: TransitionStage[] = [
    { from: 'Draft', to: 'Submitted', avgHours: 2.4, target: 4, count: 156 },
    { from: 'Submitted', to: 'QI Review', avgHours: 8.2, target: 8, count: 142 },
    { from: 'QI Review', to: 'Investigation', avgHours: 24.5, target: 24, count: 98 },
    { from: 'Investigation', to: 'Action Required', avgHours: 72.3, target: 48, count: 67 },
    { from: 'Action Required', to: 'Closed', avgHours: 96.1, target: 72, count: 45 },
];

const formatDuration = (hours: number): string => {
    if (hours < 1) return `${Math.round(hours * 60)}m`;
    if (hours < 24) return `${hours.toFixed(1)}h`;
    return `${(hours / 24).toFixed(1)}d`;
};

export default function ResponseTimeAnalytics({
    dateRange,
    filters,
    loading = false,
}: ResponseTimeAnalyticsProps) {
    const theme = useTheme();

    if (loading) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
            </Paper>
        );
    }

    const totalAvgTime = placeholderData.reduce((sum, s) => sum + s.avgHours, 0);

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Response Time Funnel
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Average time between status transitions
                    </Typography>
                </Box>
                <Chip
                    icon={<TimerIcon />}
                    label={`Total: ${formatDuration(totalAvgTime)}`}
                    color="primary"
                    variant="outlined"
                />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                {placeholderData.map((stage, index) => {
                    const isOverTarget = stage.avgHours > stage.target;
                    const widthPercent = 100 - index * 12;
                    const statusColor = isOverTarget
                        ? theme.palette.error.main
                        : theme.palette.success.main;

                    return (
                        <Box key={index} sx={{ width: '100%' }}>
                            {/* Stage bar */}
                            <Box
                                sx={{
                                    width: `${widthPercent}%`,
                                    mx: 'auto',
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: alpha(theme.palette.primary.main, 0.1 + index * 0.05),
                                    border: 1,
                                    borderColor: alpha(theme.palette.primary.main, 0.2),
                                    transition: 'all 0.2s',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.15 + index * 0.05),
                                        transform: 'scale(1.02)',
                                    },
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>
                                            {stage.from} → {stage.to}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {stage.count} transitions
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Typography
                                            variant="h6"
                                            fontWeight={700}
                                            sx={{ color: statusColor }}
                                        >
                                            {formatDuration(stage.avgHours)}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Target: {formatDuration(stage.target)}
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Progress indicator */}
                                <Box
                                    sx={{
                                        mt: 1,
                                        height: 4,
                                        borderRadius: 2,
                                        bgcolor: alpha(statusColor, 0.2),
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: `${Math.min((stage.avgHours / stage.target) * 100, 100)}%`,
                                            height: '100%',
                                            bgcolor: statusColor,
                                            borderRadius: 2,
                                        }}
                                    />
                                </Box>
                            </Box>

                            {/* Arrow connector */}
                            {index < placeholderData.length - 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
                                    <ArrowIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                                </Box>
                            )}
                        </Box>
                    );
                })}

                {/* Final state */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mt: 1,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.1),
                    }}
                >
                    <CheckIcon sx={{ color: 'success.main' }} />
                    <Typography variant="body2" fontWeight={600} color="success.main">
                        Case Closed
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
}
