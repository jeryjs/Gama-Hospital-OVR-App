'use client';

import { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    Skeleton,
    LinearProgress,
    IconButton,
    Tooltip,
    Chip,
    useTheme,
} from '@mui/material';
import {
    SortByAlpha as SortAlphaIcon,
    Sort as SortIcon,
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

interface LocationComparisonBarProps {
    dateRange: DateRange;
    filters: ReportFilters;
    loading?: boolean;
}

interface LocationData {
    id: number;
    name: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
}

const placeholderData: LocationData[] = [
    { id: 1, name: 'Main Hospital - Floor 1', count: 47, trend: 'up' },
    { id: 2, name: 'Emergency Department', count: 38, trend: 'stable' },
    { id: 3, name: 'ICU Wing A', count: 31, trend: 'down' },
    { id: 4, name: 'Surgical Center', count: 28, trend: 'up' },
    { id: 5, name: 'Outpatient Clinic', count: 22, trend: 'stable' },
    { id: 6, name: 'Pediatrics Ward', count: 18, trend: 'down' },
    { id: 7, name: 'Radiology Dept', count: 14, trend: 'stable' },
    { id: 8, name: 'Laboratory', count: 9, trend: 'down' },
];

export default function LocationComparisonBar({
    dateRange,
    filters,
    loading = false,
}: LocationComparisonBarProps) {
    const theme = useTheme();
    const [sortBy, setSortBy] = useState<'count' | 'name'>('count');

    const sortedData = [...placeholderData].sort((a, b) =>
        sortBy === 'count' ? b.count - a.count : a.name.localeCompare(b.name)
    );

    const maxCount = Math.max(...placeholderData.map((d) => d.count));

    if (loading) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Skeleton variant="text" width="60%" height={32} />
                {Array.from({ length: 6 }).map((_, i) => (
                    <Box key={i} sx={{ mb: 2 }}>
                        <Skeleton variant="text" width="40%" />
                        <Skeleton variant="rectangular" height={24} />
                    </Box>
                ))}
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Incidents by Location
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Comparative view across all facilities
                    </Typography>
                </Box>
                <Box>
                    <Tooltip title="Sort by name">
                        <IconButton
                            size="small"
                            onClick={() => setSortBy('name')}
                            color={sortBy === 'name' ? 'primary' : 'default'}
                        >
                            <SortAlphaIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Sort by count">
                        <IconButton
                            size="small"
                            onClick={() => setSortBy('count')}
                            color={sortBy === 'count' ? 'primary' : 'default'}
                        >
                            <SortIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {sortedData.map((location, index) => {
                    const percentage = (location.count / maxCount) * 100;
                    const barColor =
                        percentage > 75
                            ? theme.palette.error.main
                            : percentage > 50
                                ? theme.palette.warning.main
                                : theme.palette.primary.main;

                    return (
                        <Box
                            key={location.id}
                            sx={{
                                p: 1.5,
                                borderRadius: 1,
                                transition: 'background-color 0.2s',
                                '&:hover': { bgcolor: 'action.hover' },
                            }}
                        >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: '60%' }}>
                                    {location.name}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip
                                        label={location.count}
                                        size="small"
                                        sx={{
                                            fontWeight: 600,
                                            bgcolor: barColor,
                                            color: 'white',
                                            minWidth: 40,
                                        }}
                                    />
                                </Box>
                            </Box>
                            <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{
                                    height: 8,
                                    borderRadius: 4,
                                    bgcolor: 'grey.200',
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 4,
                                        bgcolor: barColor,
                                    },
                                }}
                            />
                        </Box>
                    );
                })}
            </Box>

            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                    Total incidents: {placeholderData.reduce((sum, d) => sum + d.count, 0)}
                </Typography>
            </Box>
        </Paper>
    );
}
