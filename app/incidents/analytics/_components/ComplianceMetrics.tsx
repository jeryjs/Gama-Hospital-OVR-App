'use client';

import React from 'react';
import {
    Paper,
    Box,
    Typography,
    LinearProgress,
    Skeleton,
    Chip,
    Tooltip,
} from '@mui/material';
import {
    CheckCircle,
    Warning,
    Error,
    Schedule,
    Assignment,
    Search,
    Description,
} from '@mui/icons-material';

interface ComplianceMetricsProps {
    loading?: boolean;
}

interface MetricData {
    label: string;
    value: number;
    target: number;
    icon: React.ReactNode;
    description: string;
    trend?: 'up' | 'down' | 'stable';
}

// Placeholder data
const placeholderMetrics: MetricData[] = [
    {
        label: 'Report Submission Timeliness',
        value: 92,
        target: 95,
        icon: <Schedule />,
        description: 'Reports submitted within 24 hours of incident',
        trend: 'up',
    },
    {
        label: 'Mandatory Field Completion',
        value: 98,
        target: 100,
        icon: <Description />,
        description: 'Required fields completed in all reports',
        trend: 'stable',
    },
    {
        label: 'Investigation Completion Rate',
        value: 85,
        target: 90,
        icon: <Search />,
        description: 'Investigations completed within target timeframe',
        trend: 'up',
    },
    {
        label: 'Corrective Action Implementation',
        value: 78,
        target: 85,
        icon: <Assignment />,
        description: 'Corrective actions completed by due date',
        trend: 'down',
    },
];

const getStatusColor = (value: number, target: number): 'success' | 'warning' | 'error' => {
    const percentage = (value / target) * 100;
    if (percentage >= 95) return 'success';
    if (percentage >= 80) return 'warning';
    return 'error';
};

const getStatusIcon = (value: number, target: number) => {
    const status = getStatusColor(value, target);
    switch (status) {
        case 'success':
            return <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />;
        case 'warning':
            return <Warning sx={{ color: 'warning.main', fontSize: 20 }} />;
        case 'error':
            return <Error sx={{ color: 'error.main', fontSize: 20 }} />;
    }
};

const MetricRow = ({ metric, loading }: { metric: MetricData; loading?: boolean }) => {
    const status = getStatusColor(metric.value, metric.target);
    const progressValue = Math.min((metric.value / metric.target) * 100, 100);
    const gapToTarget = metric.target - metric.value;

    if (loading) {
        return (
            <Box sx={{ mb: 3 }}>
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="rectangular" height={8} sx={{ my: 1, borderRadius: 1 }} />
                <Skeleton variant="text" width="40%" />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                p: 2,
                mb: 2,
                borderRadius: 2,
                bgcolor: 'background.default',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    bgcolor: 'action.hover',
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ color: 'primary.main' }}>
                        {metric.icon}
                    </Box>
                    <Box>
                        <Typography variant="body2" fontWeight="medium">
                            {metric.label}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {metric.description}
                        </Typography>
                    </Box>
                </Box>
                <Tooltip title={metric.value >= metric.target ? 'Target met' : `${gapToTarget}% below target`}>
                    {getStatusIcon(metric.value, metric.target)}
                </Tooltip>
            </Box>

            <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="h5" fontWeight="bold">
                        {metric.value}%
                    </Typography>
                    <Chip
                        label={`Target: ${metric.target}%`}
                        size="small"
                        variant="outlined"
                        color={status}
                    />
                </Box>
                <LinearProgress
                    variant="determinate"
                    value={progressValue}
                    color={status}
                    sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'action.hover',
                        '& .MuiLinearProgress-bar': {
                            borderRadius: 4,
                        },
                    }}
                />
                {gapToTarget > 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {gapToTarget}% to reach target
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

const OverallScore = ({ metrics }: { metrics: MetricData[] }) => {
    const overallScore = Math.round(
        metrics.reduce((sum, m) => sum + (m.value / m.target) * 100, 0) / metrics.length
    );
    const status = overallScore >= 95 ? 'success' : overallScore >= 80 ? 'warning' : 'error';
    const statusColors = {
        success: '#4caf50',
        warning: '#ff9800',
        error: '#f44336',
    };

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                p: 3,
                mb: 3,
                borderRadius: 2,
                bgcolor: `${statusColors[status]}15`,
                border: '1px solid',
                borderColor: `${statusColors[status]}40`,
            }}
        >
            <Typography variant="body2" color="text.secondary" gutterBottom>
                Overall Compliance Score
            </Typography>
            <Typography
                variant="h2"
                fontWeight="bold"
                sx={{ color: statusColors[status] }}
            >
                {overallScore}%
            </Typography>
            <Chip
                label={status === 'success' ? 'Excellent' : status === 'warning' ? 'Needs Improvement' : 'Critical'}
                size="small"
                sx={{
                    mt: 1,
                    bgcolor: `${statusColors[status]}20`,
                    color: statusColors[status],
                    fontWeight: 500,
                }}
            />
        </Box>
    );
};

export default function ComplianceMetrics({
    loading = false,
}: ComplianceMetricsProps) {
    const metrics = placeholderMetrics;

    if (loading) {
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
                <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={100} sx={{ mb: 3, borderRadius: 2 }} />
                {Array.from({ length: 4 }).map((_, i) => (
                    <Box key={i} sx={{ mb: 3 }}>
                        <Skeleton variant="text" width="70%" />
                        <Skeleton variant="rectangular" height={8} sx={{ my: 1, borderRadius: 1 }} />
                        <Skeleton variant="text" width="40%" />
                    </Box>
                ))}
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
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Compliance Metrics
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Track regulatory and procedural compliance
            </Typography>

            <OverallScore metrics={metrics} />

            {metrics.map((metric, index) => (
                <MetricRow key={index} metric={metric} loading={loading} />
            ))}
        </Paper>
    );
}
