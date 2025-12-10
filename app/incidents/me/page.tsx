'use client';

import { AppLayout } from '@/components/AppLayout';
import { LoadingFallback } from '@/components/LoadingFallback';
import { formatErrorForAlert } from '@/lib/client/error-handler';
import { useIncidents, useDrafts } from '@/lib/hooks';
import { fadeIn } from '@/lib/theme';
import { getStatusColor, getStatusLabel } from '@/lib/utils/status';
import {
    Add,
    Close,
    Description,
    Edit,
    FilterList,
    Visibility
} from '@mui/icons-material';
import {
    Alert,
    alpha,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    Pagination,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function MyReportsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [sortBy, setSortBy] = useState<'createdAt' | 'occurrenceDate' | 'status'>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filterDialogOpen, setFilterDialogOpen] = useState(false);

    // Status labels mapping (including draft for this page)
    const statusLabels = {
        draft: 'Draft',
        submitted: 'Submitted',
        qi_review: 'QI Review',
        investigating: 'Investigating',
        qi_final_actions: 'Final Actions',
        closed: 'Closed',
    };

    const userId = session?.user?.id ? parseInt(session.user.id) : undefined;

    // Fetch user's drafts separately (shown at top)
    const {
        drafts,
        hasDrafts,
        totalDrafts,
        isLoading: draftsLoading
    } = useDrafts({
        limit: 5,
        sortBy: 'updatedAt',
    });

    // Fetch user's submitted reports (non-draft)
    const { incidents, pagination, isLoading, error } = useIncidents({
        page,
        limit: 10,
        sortBy,
        sortOrder,
        status: statusFilter || undefined,
        search: searchTerm || undefined,
        reporterId: userId, // Filter to current user's reports only
    });

    // Filter out drafts from incidents (they're shown separately)
    const submittedIncidents = incidents.filter(i => i.status !== 'draft');

    const handleSort = (key: typeof sortBy) => {
        if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortOrder('desc');
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setSortBy('createdAt');
        setSortOrder('desc');
        setPage(1);
    };

    const hasActiveFilters = searchTerm || statusFilter;

    if (!!error) {
        return (
            <AppLayout>
                <Alert severity="error" sx={{ mt: 4 }}>
                    Failed to load reports. {formatErrorForAlert(error)}
                </Alert>
            </AppLayout>
        );
    }

    if (isLoading && draftsLoading) {
        return <LoadingFallback />;
    }

    return (
        <AppLayout>
            <Box>
                <motion.div {...{ ...fadeIn, transition: { ...fadeIn.transition, ease: ['easeInOut'] } }}>
                    <Stack spacing={3}>
                        {/* Header */}
                        <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                        >
                            <Box>
                                <Typography variant="h4" gutterBottom fontWeight={700}>
                                    My Reports
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    All incidents you have reported
                                </Typography>
                            </Box>
                            <Button
                                component={Link}
                                href="/incidents/new"
                                variant="contained"
                                startIcon={<Add />}
                                sx={{ px: 3, py: 1.5 }}
                            >
                                New Report
                            </Button>
                        </Stack>

                        {/* Drafts Section */}
                        {hasDrafts && (
                            <Card
                                variant="outlined"
                                sx={{
                                    borderColor: 'warning.main',
                                    backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.05),
                                }}
                            >
                                <CardContent>
                                    <Stack spacing={2}>
                                        <Stack direction="row" alignItems="center" spacing={1}>
                                            <Edit color="warning" />
                                            <Typography variant="h6" fontWeight={600}>
                                                My Drafts
                                            </Typography>
                                            <Chip
                                                label={totalDrafts}
                                                size="small"
                                                color="warning"
                                                sx={{ ml: 1 }}
                                            />
                                        </Stack>
                                        <Typography variant="body2" color="text.secondary">
                                            Continue working on your unsubmitted reports
                                        </Typography>
                                        <Divider />
                                        <Grid container spacing={2}>
                                            {drafts.map((draft) => (
                                                <Grid key={draft.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                                    <Card
                                                        variant="outlined"
                                                        sx={{
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            '&:hover': {
                                                                borderColor: 'primary.main',
                                                                boxShadow: 2,
                                                            },
                                                        }}
                                                        onClick={() => router.push(`/incidents/view/${draft.id}`)}
                                                    >
                                                        <CardContent sx={{ py: 1.5 }}>
                                                            <Stack spacing={1}>
                                                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                                                    <Typography variant="subtitle2" fontWeight={600}>
                                                                        {draft.id}
                                                                    </Typography>
                                                                    <Chip
                                                                        label="Draft"
                                                                        size="small"
                                                                        color="warning"
                                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                                    />
                                                                </Stack>
                                                                <Typography variant="body2" color="text.secondary" noWrap>
                                                                    {draft.occurrenceCategory?.replace(/_/g, ' ') || 'No category'}
                                                                </Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    Last updated: {format(new Date(draft.createdAt), 'MMM dd, yyyy')}
                                                                </Typography>
                                                            </Stack>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            ))}
                                        </Grid>
                                        {totalDrafts > 5 && (
                                            <Button
                                                size="small"
                                                onClick={() => setStatusFilter('draft')}
                                            >
                                                View all {totalDrafts} drafts
                                            </Button>
                                        )}
                                    </Stack>
                                </CardContent>
                            </Card>
                        )}

                        {/* Filters */}
                        <Stack direction="row" spacing={2} alignItems="center">
                            <TextField
                                placeholder="Search by reference or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                size="small"
                                sx={{ flex: 1 }}
                            />
                            <Button
                                startIcon={<FilterList />}
                                onClick={() => setFilterDialogOpen(true)}
                                variant={hasActiveFilters ? 'contained' : 'outlined'}
                                size="small"
                            >
                                Filter
                            </Button>
                            {hasActiveFilters && (
                                <Button
                                    size="small"
                                    startIcon={<Close />}
                                    onClick={handleClearFilters}
                                    variant="outlined"
                                >
                                    Clear
                                </Button>
                            )}
                        </Stack>

                        {/* Filter Dialog */}
                        <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)}>
                            <DialogTitle>Filter My Reports</DialogTitle>
                            <DialogContent sx={{ minWidth: 300, pt: 2 }}>
                                <TextField
                                    fullWidth
                                    select
                                    label="Status"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    SelectProps={{ native: true }}
                                >
                                    <option value="">All Statuses</option>
                                    {Object.entries(statusLabels).map(([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ))}
                                </TextField>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setFilterDialogOpen(false)}>Close</Button>
                            </DialogActions>
                        </Dialog>

                        {/* Submitted Reports Section */}
                        <Box>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Submitted Reports
                            </Typography>
                            <Paper>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05) }}>
                                                <TableCell sx={{ fontWeight: 600 }}>
                                                    Reference #
                                                </TableCell>
                                                <TableCell
                                                    onClick={() => handleSort('occurrenceDate')}
                                                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                                                >
                                                    Date {sortBy === 'occurrenceDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>
                                                    Category
                                                </TableCell>
                                                <TableCell
                                                    onClick={() => handleSort('status')}
                                                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                                                >
                                                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                                                </TableCell>
                                                <TableCell
                                                    onClick={() => handleSort('createdAt')}
                                                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                                                >
                                                    Created {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {submittedIncidents.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                                        <Stack alignItems="center" spacing={2}>
                                                            <Description sx={{ fontSize: 48, color: 'text.secondary' }} />
                                                            <Typography variant="body1" color="text.secondary">
                                                                {hasActiveFilters
                                                                    ? 'No reports match your filters.'
                                                                    : 'No submitted reports yet.'}
                                                            </Typography>
                                                            {hasActiveFilters ? (
                                                                <Button
                                                                    variant="outlined"
                                                                    startIcon={<Close />}
                                                                    onClick={handleClearFilters}
                                                                >
                                                                    Clear Filters
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    component={Link}
                                                                    href="/incidents/new"
                                                                    variant="outlined"
                                                                    startIcon={<Add />}
                                                                >
                                                                    Create Your First Report
                                                                </Button>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                submittedIncidents.map((incident) => (
                                                    <TableRow
                                                        key={incident.id}
                                                        hover
                                                        sx={{
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            '&:hover': {
                                                                backgroundColor: (theme) =>
                                                                    alpha(theme.palette.primary.main, 0.05),
                                                            },
                                                        }}
                                                        onClick={() => router.push(`/incidents/view/${incident.id}`)}
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
                                                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                                            <Button
                                                                size="small"
                                                                component={Link}
                                                                href={`/incidents/view/${incident.id}`}
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
                        </Box>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <Box display="flex" justifyContent="center">
                                <Pagination
                                    count={pagination.totalPages}
                                    page={page}
                                    onChange={(_, value) => setPage(value)}
                                    color="primary"
                                    size="large"
                                />
                            </Box>
                        )}
                    </Stack>
                </motion.div>
            </Box>
        </AppLayout>
    );
}
