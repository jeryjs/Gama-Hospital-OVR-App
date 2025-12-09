'use client';

import { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    Skeleton,
    Collapse,
    IconButton,
    Chip,
    useTheme,
    alpha,
} from '@mui/material';
import {
    ExpandMore as ExpandIcon,
    ChevronRight as CollapseIcon,
    Category as CategoryIcon,
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

interface TaxonomyBreakdownProps {
    dateRange: DateRange;
    filters: ReportFilters;
    loading?: boolean;
}

interface TaxonomyCategory {
    name: string;
    count: number;
    children?: TaxonomyCategory[];
}

const placeholderData: TaxonomyCategory[] = [
    {
        name: 'Medication Events',
        count: 89,
        children: [
            { name: 'Wrong Dose', count: 32 },
            { name: 'Wrong Patient', count: 18 },
            { name: 'Wrong Time', count: 24 },
            { name: 'Omission', count: 15 },
        ],
    },
    {
        name: 'Falls',
        count: 56,
        children: [
            { name: 'Unassisted Fall', count: 28 },
            { name: 'Assisted Fall', count: 18 },
            { name: 'Found on Floor', count: 10 },
        ],
    },
    {
        name: 'Equipment/Device',
        count: 34,
        children: [
            { name: 'Malfunction', count: 14 },
            { name: 'User Error', count: 12 },
            { name: 'Unavailable', count: 8 },
        ],
    },
    {
        name: 'Communication',
        count: 28,
        children: [
            { name: 'Handoff Issues', count: 15 },
            { name: 'Documentation', count: 13 },
        ],
    },
    {
        name: 'Surgical/Procedure',
        count: 21,
        children: [
            { name: 'Wrong Site', count: 3 },
            { name: 'Retained Object', count: 5 },
            { name: 'Complication', count: 13 },
        ],
    },
];

interface CategoryItemProps {
    category: TaxonomyCategory;
    depth: number;
    maxCount: number;
}

function CategoryItem({ category, depth, maxCount }: CategoryItemProps) {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(depth === 0);
    const hasChildren = category.children && category.children.length > 0;
    const barWidth = (category.count / maxCount) * 100;

    const colors = [
        theme.palette.primary.main,
        theme.palette.secondary.main,
        theme.palette.info.main,
        theme.palette.warning.main,
        theme.palette.success.main,
    ];
    const color = colors[depth % colors.length];

    return (
        <Box>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    py: 1,
                    px: 1,
                    ml: depth * 2,
                    borderRadius: 1,
                    cursor: hasChildren ? 'pointer' : 'default',
                    transition: 'background-color 0.2s',
                    '&:hover': { bgcolor: 'action.hover' },
                }}
                onClick={() => hasChildren && setExpanded(!expanded)}
            >
                {hasChildren ? (
                    <IconButton size="small" sx={{ p: 0 }}>
                        {expanded ? (
                            <ExpandIcon fontSize="small" />
                        ) : (
                            <CollapseIcon fontSize="small" />
                        )}
                    </IconButton>
                ) : (
                    <Box sx={{ width: 24 }} />
                )}

                <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Typography
                            variant="body2"
                            fontWeight={depth === 0 ? 600 : 400}
                            sx={{ color: depth === 0 ? 'text.primary' : 'text.secondary' }}
                        >
                            {category.name}
                        </Typography>
                        <Chip
                            label={category.count}
                            size="small"
                            sx={{
                                fontWeight: 600,
                                bgcolor: alpha(color, 0.1),
                                color: color,
                                minWidth: 40,
                            }}
                        />
                    </Box>

                    {/* Treemap-style bar */}
                    <Box
                        sx={{
                            height: depth === 0 ? 8 : 4,
                            borderRadius: 1,
                            bgcolor: alpha(color, 0.1),
                            overflow: 'hidden',
                        }}
                    >
                        <Box
                            sx={{
                                width: `${barWidth}%`,
                                height: '100%',
                                bgcolor: alpha(color, depth === 0 ? 0.8 : 0.5),
                                borderRadius: 1,
                                transition: 'width 0.3s ease',
                            }}
                        />
                    </Box>
                </Box>
            </Box>

            {hasChildren && (
                <Collapse in={expanded}>
                    {category.children!.map((child) => (
                        <CategoryItem
                            key={child.name}
                            category={child}
                            depth={depth + 1}
                            maxCount={maxCount}
                        />
                    ))}
                </Collapse>
            )}
        </Box>
    );
}

export default function TaxonomyBreakdown({
    dateRange,
    filters,
    loading = false,
}: TaxonomyBreakdownProps) {
    if (loading) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Skeleton variant="text" width="60%" height={32} />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Box key={i} sx={{ mb: 2 }}>
                        <Skeleton variant="text" width="80%" />
                        <Skeleton variant="rectangular" height={8} />
                    </Box>
                ))}
            </Paper>
        );
    }

    const totalCount = placeholderData.reduce((sum, c) => sum + c.count, 0);
    const maxCount = Math.max(...placeholderData.map((c) => c.count));

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                    <Typography variant="h6" fontWeight={600}>
                        Incident Taxonomy Breakdown
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Hierarchical category distribution
                    </Typography>
                </Box>
                <Chip
                    icon={<CategoryIcon />}
                    label={`${totalCount} total`}
                    variant="outlined"
                    size="small"
                />
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {placeholderData.map((category) => (
                    <CategoryItem
                        key={category.name}
                        category={category}
                        depth={0}
                        maxCount={maxCount}
                    />
                ))}
            </Box>
        </Paper>
    );
}
