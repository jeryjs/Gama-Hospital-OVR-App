'use client';

import { useMemo } from 'react';
import {
    alpha,
    Box,
    Chip,
    Paper,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { Cloud } from '@mui/icons-material';

interface DateRange {
    start: Date;
    end: Date;
}

interface NarrativeAnalysisProps {
    dateRange: DateRange;
    loading?: boolean;
}

// Placeholder word frequency data
const mockWords = [
    { word: 'fall', count: 45, category: 'incident' },
    { word: 'medication', count: 38, category: 'clinical' },
    { word: 'patient', count: 35, category: 'subject' },
    { word: 'nurse', count: 32, category: 'staff' },
    { word: 'equipment', count: 28, category: 'equipment' },
    { word: 'communication', count: 25, category: 'process' },
    { word: 'delay', count: 22, category: 'issue' },
    { word: 'procedure', count: 20, category: 'clinical' },
    { word: 'safety', count: 18, category: 'concern' },
    { word: 'transfer', count: 16, category: 'process' },
    { word: 'documentation', count: 15, category: 'admin' },
    { word: 'protocol', count: 14, category: 'process' },
    { word: 'monitoring', count: 13, category: 'clinical' },
    { word: 'response', count: 12, category: 'process' },
    { word: 'assessment', count: 11, category: 'clinical' },
    { word: 'supervision', count: 10, category: 'staff' },
    { word: 'training', count: 9, category: 'staff' },
    { word: 'alert', count: 8, category: 'system' },
    { word: 'discharge', count: 7, category: 'process' },
    { word: 'infection', count: 6, category: 'clinical' },
];

const categoryColors: Record<string, string> = {
    incident: '#EF4444',
    clinical: '#3B82F6',
    subject: '#10B981',
    staff: '#8B5CF6',
    equipment: '#F59E0B',
    process: '#06B6D4',
    issue: '#EC4899',
    concern: '#F97316',
    admin: '#6B7280',
    system: '#14B8A6',
};

export function NarrativeAnalysis({ dateRange, loading = false }: NarrativeAnalysisProps) {
    // Calculate font sizes based on frequency
    const maxCount = Math.max(...mockWords.map((w) => w.count));
    const minCount = Math.min(...mockWords.map((w) => w.count));

    const getSize = (count: number) => {
        const normalized = (count - minCount) / (maxCount - minCount);
        return 0.75 + normalized * 1; // 0.75rem to 1.75rem
    };

    // Use deterministic shuffling based on word count
    const shuffledWords = useMemo(() => {
        // Deterministic shuffle using a simple seed-based approach
        return [...mockWords].sort((a, b) => {
            const aHash = a.word.charCodeAt(0) + a.count;
            const bHash = b.word.charCodeAt(0) + b.count;
            return aHash - bHash;
        });
    }, []);

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
                    <Cloud color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                        Narrative Analysis
                    </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                    Common terms extracted from incident descriptions
                </Typography>

                {/* Word Cloud */}
                <Box
                    sx={{
                        p: 3,
                        borderRadius: 2,
                        bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                        border: 1,
                        borderColor: 'divider',
                        minHeight: 200,
                        display: 'flex',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                    }}
                >
                    {shuffledWords.map((item) => (
                        <Tooltip
                            key={item.word}
                            title={`"${item.word}" - ${item.count} occurrences (${item.category})`}
                            arrow
                        >
                            <Typography
                                sx={{
                                    fontSize: `${getSize(item.count)}rem`,
                                    fontWeight: item.count > maxCount * 0.7 ? 700 : 500,
                                    color: categoryColors[item.category] || '#6B7280',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                        transform: 'scale(1.1)',
                                        textDecoration: 'underline',
                                    },
                                }}
                            >
                                {item.word}
                            </Typography>
                        </Tooltip>
                    ))}
                </Box>

                {/* Category Legend */}
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Categories
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                        {Object.entries(categoryColors).slice(0, 6).map(([category, color]) => (
                            <Chip
                                key={category}
                                label={category}
                                size="small"
                                sx={{
                                    bgcolor: alpha(color, 0.15),
                                    color: color,
                                    fontWeight: 500,
                                    textTransform: 'capitalize',
                                }}
                            />
                        ))}
                    </Stack>
                </Box>

                {/* Top Keywords */}
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Top Keywords
                    </Typography>
                    <Stack spacing={1}>
                        {mockWords.slice(0, 5).map((item, index) => (
                            <Stack
                                key={item.word}
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    bgcolor: (theme) => alpha(categoryColors[item.category], 0.05),
                                }}
                            >
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Typography
                                        variant="body2"
                                        fontWeight={700}
                                        sx={{ color: 'text.secondary', width: 20 }}
                                    >
                                        #{index + 1}
                                    </Typography>
                                    <Typography variant="body2" fontWeight={600}>
                                        {item.word}
                                    </Typography>
                                </Stack>
                                <Chip
                                    label={`${item.count} times`}
                                    size="small"
                                    sx={{
                                        bgcolor: alpha(categoryColors[item.category], 0.15),
                                        color: categoryColors[item.category],
                                        fontWeight: 600,
                                    }}
                                />
                            </Stack>
                        ))}
                    </Stack>
                </Box>
            </Stack>
        </Paper>
    );
}
