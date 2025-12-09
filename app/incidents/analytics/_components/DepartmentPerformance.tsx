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
import { Business, TrendingUp, TrendingDown } from '@mui/icons-material';

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

interface DepartmentPerformanceProps {
    dateRange: DateRange;
    filters?: ReportFilters;
    loading?: boolean;
}

// Placeholder data
const mockData = [
    {
        department: 'Emergency',
        qiCompletionRate: 92,
        avgInvestigationTime: 4.2,
        incidentCount: 45,
        trend: 5,
        score: 88,
    },
    {
        department: 'ICU',
        qiCompletionRate: 88,
        avgInvestigationTime: 5.1,
        incidentCount: 32,
        trend: -3,
        score: 82,
    },
    {
        department: 'Surgery',
        qiCompletionRate: 95,
        avgInvestigationTime: 3.8,
        incidentCount: 18,
        trend: 8,
        score: 91,
    },
    {
        department: 'Pediatrics',
        qiCompletionRate: 78,
        avgInvestigationTime: 6.5,
        incidentCount: 22,
        trend: -7,
        score: 72,
    },
    {
        department: 'Radiology',
        qiCompletionRate: 85,
        avgInvestigationTime: 4.8,
        incidentCount: 12,
        trend: 2,
        score: 79,
    },
];

function getScoreColor(score: number): string {
    if (score >= 90) return '#10B981';
    if (score >= 80) return '#3B82F6';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
}

export function DepartmentPerformance({ dateRange, filters, loading = false }: DepartmentPerformanceProps) {
    if (loading) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Stack spacing={2}>
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="rectangular" height={300} />
                </Stack>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Business color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                        Department Performance
                    </Typography>
                </Stack>

                {/* Header Row */}
                <Stack
                    direction="row"
                    spacing={2}
                    sx={{
                        pb: 1,
                        borderBottom: 1,
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant="caption" fontWeight={600} sx={{ flex: 2 }}>
                        Department
                    </Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ flex: 1, textAlign: 'center' }}>
                        QI Rate
                    </Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ flex: 1, textAlign: 'center' }}>
                        Avg Time
                    </Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ flex: 1, textAlign: 'center' }}>
                        Incidents
                    </Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ flex: 1, textAlign: 'center' }}>
                        Score
                    </Typography>
                </Stack>

                {/* Data Rows */}
                <Stack spacing={1.5}>
                    {mockData.map((dept) => {
                        const scoreColor = getScoreColor(dept.score);

                        return (
                            <Box
                                key={dept.department}
                                sx={{
                                    p: 1.5,
                                    borderRadius: 1,
                                    bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                                    border: 1,
                                    borderColor: 'divider',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                                        borderColor: 'primary.main',
                                    },
                                }}
                            >
                                <Stack direction="row" spacing={2} alignItems="center">
                                    {/* Department Name */}
                                    <Stack sx={{ flex: 2 }} direction="row" alignItems="center" spacing={1}>
                                        <Typography variant="body2" fontWeight={600}>
                                            {dept.department}
                                        </Typography>
                                        {dept.trend !== 0 && (
                                            <Tooltip title={`${dept.trend > 0 ? '+' : ''}${dept.trend}% vs last period`}>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    {dept.trend > 0 ? (
                                                        <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                                                    ) : (
                                                        <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                                                    )}
                                                </Box>
                                            </Tooltip>
                                        )}
                                    </Stack>

                                    {/* QI Completion Rate */}
                                    <Box sx={{ flex: 1 }}>
                                        <Stack alignItems="center" spacing={0.5}>
                                            <Typography variant="body2" fontWeight={600}>
                                                {dept.qiCompletionRate}%
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={dept.qiCompletionRate}
                                                sx={{
                                                    width: '100%',
                                                    height: 4,
                                                    borderRadius: 2,
                                                    bgcolor: alpha('#3B82F6', 0.1),
                                                }}
                                            />
                                        </Stack>
                                    </Box>

                                    {/* Avg Investigation Time */}
                                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                                        <Typography variant="body2" fontWeight={500}>
                                            {dept.avgInvestigationTime}d
                                        </Typography>
                                    </Box>

                                    {/* Incident Count */}
                                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                                        <Chip
                                            label={dept.incidentCount}
                                            size="small"
                                            sx={{
                                                fontWeight: 600,
                                                minWidth: 40,
                                            }}
                                        />
                                    </Box>

                                    {/* Performance Score */}
                                    <Box sx={{ flex: 1, textAlign: 'center' }}>
                                        <Chip
                                            label={dept.score}
                                            size="small"
                                            sx={{
                                                bgcolor: alpha(scoreColor, 0.15),
                                                color: scoreColor,
                                                fontWeight: 700,
                                                minWidth: 45,
                                            }}
                                        />
                                    </Box>
                                </Stack>
                            </Box>
                        );
                    })}
                </Stack>

                {/* Score Legend */}
                <Stack direction="row" spacing={2} justifyContent="center">
                    {[
                        { label: 'Excellent (90+)', color: '#10B981' },
                        { label: 'Good (80-89)', color: '#3B82F6' },
                        { label: 'Fair (70-79)', color: '#F59E0B' },
                        { label: 'Needs Improvement (<70)', color: '#EF4444' },
                    ].map((item) => (
                        <Stack key={item.label} direction="row" alignItems="center" spacing={0.5}>
                            <Box
                                sx={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    bgcolor: item.color,
                                }}
                            />
                            <Typography variant="caption" color="text.secondary">
                                {item.label}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
            </Stack>
        </Paper>
    );
}
