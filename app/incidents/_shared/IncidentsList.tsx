'use client';

import type { OVRReportListItem } from '@/lib/api/schemas';
import { getStatusColor, getStatusLabel } from '@/lib/utils/status';
import {
    Add,
    Close,
    Description,
    Visibility,
} from '@mui/icons-material';
import {
    alpha,
    Box,
    Button,
    Paper,
    Skeleton,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Typography,
} from '@mui/material';
import { format } from 'date-fns';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type SortableColumn = 'createdAt' | 'occurrenceDate' | 'status';

interface IncidentsListProps {
    incidents: OVRReportListItem[];
    isLoading?: boolean;
    /** Show reporter column */
    showReporter?: boolean;
    /** Link prefix for view action */
    linkPrefix?: string;
    /** Query string to append to links */
    linkQuery?: string;
    /** Message when list is empty */
    emptyMessage?: string;
    /** Show call-to-action when empty */
    showEmptyCTA?: boolean;
    /** Whether filters are active (changes empty message) */
    hasActiveFilters?: boolean;
    /** Callback to clear filters */
    onClearFilters?: () => void;
    /** Enable sorting headers */
    sortable?: boolean;
    /** Current sort column */
    sortBy?: SortableColumn;
    /** Current sort order */
    sortOrder?: 'asc' | 'desc';
    /** Callback for sort change */
    onSort?: (column: SortableColumn) => void;
    /** Make rows clickable */
    clickableRows?: boolean;
}

/**
 * Reusable incidents table/list component
 * Handles loading, empty states, and consistent display
 */
export function IncidentsList({
    incidents,
    isLoading = false,
    showReporter = false,
    linkPrefix = '/incidents/view',
    linkQuery = '',
    emptyMessage = 'No incidents found.',
    showEmptyCTA = true,
    hasActiveFilters = false,
    onClearFilters,
    sortable = true,
    sortBy,
    sortOrder = 'desc',
    onSort,
    clickableRows = true,
}: IncidentsListProps) {
    const router = useRouter();

    // Loading skeleton
    if (isLoading) {
        return (
            <Paper>
                <Box sx={{ p: 2 }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            variant="rounded"
                            height={52}
                            sx={{ mb: 1 }}
                        />
                    ))}
                </Box>
            </Paper>
        );
    }

    const handleSort = (column: SortableColumn) => {
        if (sortable && onSort) {
            onSort(column);
        }
    };

    const getSortIndicator = (column: SortableColumn) => {
        if (!sortable || sortBy !== column) return '';
        return sortOrder === 'asc' ? ' ↑' : ' ↓';
    };

    const handleRowClick = (incidentId: string) => {
        if (clickableRows) {
            const query = linkQuery ? `?${linkQuery}` : '';
            router.push(`${linkPrefix}/${incidentId}${query}`);
        }
    };

    const buildLink = (incidentId: string) => {
        const query = linkQuery ? `?${linkQuery}` : '';
        return `${linkPrefix}/${incidentId}${query}`;
    };

    // Column count for empty state
    const colSpan = showReporter ? 7 : 6;

    return (
        <Paper>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow
                            sx={{
                                backgroundColor: (theme) =>
                                    alpha(theme.palette.primary.main, 0.05),
                            }}
                        >
                            <TableCell sx={{ fontWeight: 600 }}>Reference #</TableCell>
                            <TableCell
                                onClick={() => handleSort('occurrenceDate')}
                                sx={{
                                    cursor: sortable ? 'pointer' : 'default',
                                    fontWeight: 600,
                                }}
                            >
                                Date{getSortIndicator('occurrenceDate')}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                            {showReporter && (
                                <TableCell sx={{ fontWeight: 600 }}>Reporter</TableCell>
                            )}
                            <TableCell
                                onClick={() => handleSort('status')}
                                sx={{
                                    cursor: sortable ? 'pointer' : 'default',
                                    fontWeight: 600,
                                }}
                            >
                                Status{getSortIndicator('status')}
                            </TableCell>
                            <TableCell
                                onClick={() => handleSort('createdAt')}
                                sx={{
                                    cursor: sortable ? 'pointer' : 'default',
                                    fontWeight: 600,
                                }}
                            >
                                Created{getSortIndicator('createdAt')}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                                Actions
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {incidents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
                                    <Stack alignItems="center" spacing={2}>
                                        <Description
                                            sx={{ fontSize: 48, color: 'text.secondary' }}
                                        />
                                        <Typography variant="body1" color="text.secondary">
                                            {hasActiveFilters
                                                ? 'No incidents match your filters.'
                                                : emptyMessage}
                                        </Typography>
                                        {hasActiveFilters && onClearFilters ? (
                                            <Button
                                                variant="outlined"
                                                startIcon={<Close />}
                                                onClick={onClearFilters}
                                            >
                                                Clear Filters
                                            </Button>
                                        ) : showEmptyCTA ? (
                                            <Button
                                                component={Link}
                                                href="/incidents/new"
                                                variant="outlined"
                                                startIcon={<Add />}
                                            >
                                                Create Your First Report
                                            </Button>
                                        ) : null}
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ) : (
                            incidents.map((incident) => (
                                <TableRow
                                    key={incident.id}
                                    hover
                                    sx={{
                                        cursor: clickableRows ? 'pointer' : 'default',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            backgroundColor: (theme) =>
                                                alpha(theme.palette.primary.main, 0.05),
                                        },
                                    }}
                                    onClick={() => handleRowClick(incident.id)}
                                >
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>
                                            {incident.id}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(incident.occurrenceDate), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            sx={{ textTransform: 'capitalize' }}
                                        >
                                            {incident.occurrenceCategory.replace(/_/g, ' ')}
                                        </Typography>
                                    </TableCell>
                                    {showReporter && (
                                        <TableCell>
                                            <Typography variant="body2">
                                                {incident.reporter
                                                    ? `${incident.reporter.firstName} ${incident.reporter.lastName}`
                                                    : 'Unknown'}
                                            </Typography>
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <Chip
                                            label={getStatusLabel(incident.status)}
                                            color={getStatusColor(incident.status) as any}
                                            size="small"
                                            sx={{
                                                fontWeight: 600,
                                                borderRadius: 1.5,
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(incident.createdAt), 'MMM dd, yyyy')}
                                    </TableCell>
                                    <TableCell
                                        align="right"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Button
                                            size="small"
                                            component={Link}
                                            href={buildLink(incident.id)}
                                            startIcon={<Visibility fontSize="small" />}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}
