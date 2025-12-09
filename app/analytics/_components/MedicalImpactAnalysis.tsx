'use client';

import {
    alpha,
    Box,
    LinearProgress,
    Paper,
    Skeleton,
    Stack,
    Typography,
} from '@mui/material';
import { LocalHospital } from '@mui/icons-material';

interface DateRange {
    start: Date;
    end: Date;
}

interface MedicalImpactAnalysisProps {
    dateRange: DateRange;
    loading?: boolean;
}

// Placeholder data
const mockData = [
    { level: 'No Intervention', count: 45, percentage: 38, color: '#10B981' },
    { level: 'First Aid Only', count: 32, percentage: 27, color: '#3B82F6' },
    { level: 'Outpatient Treatment', count: 22, percentage: 18, color: '#F59E0B' },
    { level: 'Emergency Care', count: 12, percentage: 10, color: '#F97316' },
    { level: 'Hospitalization', count: 6, percentage: 5, color: '#EF4444' },
    { level: 'Intensive Care', count: 2, percentage: 2, color: '#DC2626' },
];

export function MedicalImpactAnalysis({ dateRange, loading = false }: MedicalImpactAnalysisProps) {
    const totalIncidents = mockData.reduce((sum, item) => sum + item.count, 0);

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
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <LocalHospital color="primary" />
                        <Typography variant="h6" fontWeight={600}>
                            Medical Impact Analysis
                        </Typography>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                        {totalIncidents} incidents
                    </Typography>
                </Stack>

                {/* Horizontal Bar Chart */}
                <Stack spacing={2}>
                    {mockData.map((item) => (
                        <Box key={item.level}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                                <Typography variant="body2" fontWeight={500}>
                                    {item.level}
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography variant="body2" fontWeight={700}>
                                        {item.count}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        ({item.percentage}%)
                                    </Typography>
                                </Stack>
                            </Stack>
                            <Box sx={{ position: 'relative' }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={item.percentage}
                                    sx={{
                                        height: 24,
                                        borderRadius: 1,
                                        bgcolor: alpha(item.color, 0.1),
                                        '& .MuiLinearProgress-bar': {
                                            bgcolor: item.color,
                                            borderRadius: 1,
                                        },
                                    }}
                                />
                                {/* Count inside bar */}
                                {item.percentage > 10 && (
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            position: 'absolute',
                                            left: 8,
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            color: 'white',
                                            fontWeight: 600,
                                        }}
                                    >
                                        {item.count}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    ))}
                </Stack>

                {/* Impact Summary */}
                <Box
                    sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
                        border: 1,
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Impact Summary
                    </Typography>
                    <Stack direction="row" spacing={3}>
                        <Box>
                            <Typography variant="h4" fontWeight={700} color="success.main">
                                {mockData[0].percentage + mockData[1].percentage}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Minimal Impact
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="h4" fontWeight={700} color="warning.main">
                                {mockData[2].percentage + mockData[3].percentage}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Moderate Impact
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="h4" fontWeight={700} color="error.main">
                                {mockData[4].percentage + mockData[5].percentage}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Severe Impact
                            </Typography>
                        </Box>
                    </Stack>
                </Box>
            </Stack>
        </Paper>
    );
}
