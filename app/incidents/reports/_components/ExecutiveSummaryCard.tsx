'use client';

import React from 'react';
import {
    Paper,
    Box,
    Typography,
    Grid,
    Skeleton,
    Chip,
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
    TrendingFlat,
    Warning,
    CheckCircle,
    Schedule,
    Assessment,
} from '@mui/icons-material';

interface DateRange {
    start: Date;
    end: Date;
}

interface ExecutiveSummaryCardProps {
    dateRange?: DateRange;
    loading?: boolean;
}

interface KPIData {
    label: string;
    value: number | string;
    previousValue?: number;
    change?: number;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: React.ReactNode;
    format?: 'number' | 'percentage' | 'time';
}

// Placeholder data
const placeholderKPIs: KPIData[] = [
    {
        label: 'Total Incidents',
        value: 156,
        previousValue: 142,
        change: 9.9,
        changeType: 'negative',
        icon: <Assessment />,
        format: 'number',
    },
    {
        label: 'Avg Resolution Time',
        value: '4.2 days',
        previousValue: 5.1,
        change: -17.6,
        changeType: 'positive',
        icon: <Schedule />,
        format: 'time',
    },
    {
        label: 'Closure Rate',
        value: 87,
        previousValue: 82,
        change: 6.1,
        changeType: 'positive',
        icon: <CheckCircle />,
        format: 'percentage',
    },
    {
        label: 'High Severity',
        value: 12,
        previousValue: 8,
        change: 50,
        changeType: 'negative',
        icon: <Warning />,
        format: 'number',
    },
];

const TrendIcon = ({ type, change }: { type: string; change?: number }) => {
    if (change === 0 || change === undefined) {
        return <TrendingFlat sx={{ fontSize: 18, color: 'text.secondary' }} />;
    }
    if (type === 'positive') {
        return <TrendingUp sx={{ fontSize: 18, color: 'success.main' }} />;
    }
    return <TrendingDown sx={{ fontSize: 18, color: 'error.main' }} />;
};

const KPIBox = ({ kpi, loading }: { kpi: KPIData; loading?: boolean }) => {
    const changeColor = kpi.changeType === 'positive' ? 'success.main' :
        kpi.changeType === 'negative' ? 'error.main' : 'text.secondary';

    if (loading) {
        return (
            <Box sx={{ p: 2 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="40%" height={32} />
                <Skeleton variant="text" width="50%" />
            </Box>
        );
    }

    return (
        <Box
            sx={{
                p: 2,
                height: '100%',
                borderRadius: 2,
                bgcolor: 'background.default',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'translateY(-2px)',
                },
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'primary.main' }}>
                {kpi.icon}
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
                {kpi.label}
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                {kpi.format === 'percentage' ? `${kpi.value}%` : kpi.value}
            </Typography>
            {kpi.change !== undefined && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendIcon type={kpi.changeType} change={kpi.change} />
                    <Typography variant="body2" sx={{ color: changeColor, fontWeight: 500 }}>
                        {kpi.change > 0 ? '+' : ''}{kpi.change.toFixed(1)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        vs previous
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default function ExecutiveSummaryCard({
    dateRange,
    loading = false
}: ExecutiveSummaryCardProps) {
    const kpis = placeholderKPIs;

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
                <Typography variant="h6" fontWeight="bold">
                    Executive Summary
                </Typography>
                {dateRange && (
                    <Chip
                        label={`${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`}
                        size="small"
                        variant="outlined"
                    />
                )}
            </Box>
            <Grid container spacing={2}>
                {kpis.map((kpi, index) => (
                    <Grid key={index} size={{ xs: 6, sm: 3 }}>
                        <KPIBox kpi={kpi} loading={loading} />
                    </Grid>
                ))}
            </Grid>
        </Paper>
    );
}
