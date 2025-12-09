'use client';

import {
    Paper,
    Typography,
    Box,
    Skeleton,
    Chip,
    Tooltip,
    useTheme,
    alpha,
} from '@mui/material';
import {
    Warning as WarningIcon,
    CheckCircle as CheckIcon,
    AccessTime as TimeIcon,
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

interface WorkflowBottleneckAnalysisProps {
    dateRange: DateRange;
    filters: ReportFilters;
    loading?: boolean;
}

interface WorkflowStage {
    name: string;
    avgDays: number;
    threshold: number;
    pendingCount: number;
    description: string;
}

const placeholderData: WorkflowStage[] = [
    { name: 'Initial Draft', avgDays: 0.5, threshold: 1, pendingCount: 12, description: 'Time to complete initial report' },
    { name: 'Supervisor Review', avgDays: 1.2, threshold: 2, pendingCount: 8, description: 'Awaiting supervisor approval' },
    { name: 'QI Assessment', avgDays: 3.5, threshold: 2, pendingCount: 24, description: 'Quality review and categorization' },
    { name: 'Investigation', avgDays: 5.2, threshold: 7, pendingCount: 15, description: 'Root cause analysis' },
    { name: 'Action Planning', avgDays: 8.1, threshold: 5, pendingCount: 31, description: 'Corrective action development' },
    { name: 'Implementation', avgDays: 4.3, threshold: 7, pendingCount: 18, description: 'Executing corrective actions' },
    { name: 'Verification', avgDays: 2.1, threshold: 3, pendingCount: 6, description: 'Confirming effectiveness' },
];

export default function WorkflowBottleneckAnalysis({
    dateRange,
    filters,
    loading = false,
}: WorkflowBottleneckAnalysisProps) {
    const theme = useTheme();

    if (loading) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="rectangular" height={350} sx={{ mt: 2 }} />
            </Paper>
        );
    }

    const maxDays = Math.max(...placeholderData.map((s) => s.avgDays));
    const bottlenecks = placeholderData.filter((s) => s.avgDays > s.threshold);

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Workflow Bottleneck Analysis
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Average time spent at each workflow stage
                    </Typography>
                </Box>
                {bottlenecks.length > 0 && (
                    <Chip
                        icon={<WarningIcon />}
                        label={`${bottlenecks.length} bottleneck${bottlenecks.length > 1 ? 's' : ''}`}
                        color="error"
                        size="small"
                    />
                )}
            </Box>

            {/* Waterfall visualization */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {placeholderData.map((stage, index) => {
                    const isBottleneck = stage.avgDays > stage.threshold;
                    const barWidth = (stage.avgDays / maxDays) * 100;
                    const thresholdWidth = (stage.threshold / maxDays) * 100;

                    return (
                        <Tooltip
                            key={stage.name}
                            title={stage.description}
                            placement="top"
                            arrow
                        >
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    p: 1,
                                    borderRadius: 1,
                                    transition: 'background-color 0.2s',
                                    '&:hover': { bgcolor: 'action.hover' },
                                }}
                            >
                                {/* Stage name */}
                                <Box sx={{ width: 120, flexShrink: 0 }}>
                                    <Typography variant="body2" fontWeight={500} noWrap>
                                        {stage.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {stage.pendingCount} pending
                                    </Typography>
                                </Box>

                                {/* Bar container */}
                                <Box sx={{ flex: 1, position: 'relative', height: 32 }}>
                                    {/* Threshold marker */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            left: `${thresholdWidth}%`,
                                            top: 0,
                                            bottom: 0,
                                            width: 2,
                                            bgcolor: 'grey.400',
                                            zIndex: 1,
                                        }}
                                    />

                                    {/* Actual bar */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            left: 0,
                                            top: 4,
                                            bottom: 4,
                                            width: `${barWidth}%`,
                                            borderRadius: 1,
                                            bgcolor: isBottleneck
                                                ? alpha(theme.palette.error.main, 0.8)
                                                : alpha(theme.palette.success.main, 0.8),
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            pr: 1,
                                            transition: 'width 0.3s ease',
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: 'white',
                                                fontWeight: 600,
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {stage.avgDays.toFixed(1)}d
                                        </Typography>
                                    </Box>
                                </Box>

                                {/* Status icon */}
                                <Box sx={{ width: 32, display: 'flex', justifyContent: 'center' }}>
                                    {isBottleneck ? (
                                        <WarningIcon sx={{ color: 'error.main', fontSize: 20 }} />
                                    ) : (
                                        <CheckIcon sx={{ color: 'success.main', fontSize: 20 }} />
                                    )}
                                </Box>
                            </Box>
                        </Tooltip>
                    );
                })}
            </Box>

            {/* Legend */}
            <Box
                sx={{
                    mt: 3,
                    pt: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: 'success.main' }} />
                        <Typography variant="caption" color="text.secondary">
                            Within target
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: 'error.main' }} />
                        <Typography variant="caption" color="text.secondary">
                            Bottleneck
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 2, height: 12, bgcolor: 'grey.400' }} />
                        <Typography variant="caption" color="text.secondary">
                            Target threshold
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                        Total avg: {placeholderData.reduce((sum, s) => sum + s.avgDays, 0).toFixed(1)} days
                    </Typography>
                </Box>
            </Box>
        </Paper>
    );
}
