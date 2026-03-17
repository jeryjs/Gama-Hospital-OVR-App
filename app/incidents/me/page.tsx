'use client';

import { AppLayout } from '@/components/AppLayout';
import { LoadingFallback } from '@/components/LoadingFallback';
import { ErrorLayout } from '@/components/shared';
import { useIncidents } from '@/lib/hooks';
import { Add, Edit } from '@mui/icons-material';
import { Alert, Box, Button, Paper, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import {
    DraftsSection,
    IncidentsHeader,
    IncidentsFilters,
    IncidentsList,
    IncidentsPagination,
    type IncidentFilters,
} from '../_shared';

type SortColumn = 'createdAt' | 'occurrenceDate' | 'status';

export default function MyReportsPage() {
    const { data: session } = useSession();
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<IncidentFilters>({
        search: '',
        status: '',
    });
    const [sortBy, setSortBy] = useState<SortColumn>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const userId = session?.user?.id ? parseInt(session.user.id) : undefined;

    // Fetch user's submitted reports (non-draft) from API
    const { incidents, pagination, isLoading, error } = useIncidents({
        page,
        limit: 10,
        sortBy,
        sortOrder,
        status: filters.status || undefined,
        search: filters.search || undefined,
        reporterId: userId,
        fields: 'id,status,occurrenceDate,occurrenceCategory,createdAt,qiRejectionReason',
    });

    const rejectedDrafts = (incidents as Array<any>).filter((incident) => incident.status === 'draft');
    const submittedReports = incidents.filter((incident) => incident.status !== 'draft');

    const handleSort = (column: SortColumn) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('desc');
        }
    };

    const handleClearFilters = () => {
        setFilters({ search: '', status: '' });
        setSortBy('createdAt');
        setSortOrder('desc');
        setPage(1);
    };

    const hasActiveFilters = Boolean(filters.search || filters.status);

    if (error) {
        return (
            <AppLayout>
                <ErrorLayout error={error} onRetry={() => { }} />
            </AppLayout>
        );
    }

    if (isLoading && !userId) {
        return <LoadingFallback />;
    }

    return (
        <AppLayout>
            <Box>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                    <Stack spacing={3}>
                        <IncidentsHeader
                            title="My Reports"
                            subtitle="All incidents you have reported"
                            actions={
                                <Button
                                    component={Link}
                                    href="/incidents/new"
                                    variant="contained"
                                    startIcon={<Add />}
                                    sx={{ px: 3, py: 1.5 }}
                                >
                                    New Report
                                </Button>
                            }
                        />

                        {/* Drafts Section (from localStorage) */}
                        {userId && <DraftsSection userId={userId} />}

                        {/* Rejected Drafts (from backend) */}
                        {rejectedDrafts.length > 0 && (
                            <Box>
                                <Typography variant="h6" fontWeight={600} gutterBottom>
                                    Returned by QI
                                </Typography>
                                <Stack spacing={1.5}>
                                    {rejectedDrafts.map((incident) => (
                                        <Paper key={incident.id} sx={{ p: 2 }}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="subtitle2" fontWeight={700}>
                                                        {incident.id}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        Rejected draft — requires reporter update and resubmission
                                                    </Typography>

                                                    <Alert severity="warning" sx={{ mt: 1.5 }}>
                                                        <Typography variant="subtitle2" fontWeight={600}>
                                                            Rejection Reason
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {incident.qiRejectionReason || 'No rejection reason provided'}
                                                        </Typography>
                                                    </Alert>
                                                </Box>

                                                <Button
                                                    component={Link}
                                                    href={`/incidents/new?draft=${incident.id}`}
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<Edit />}
                                                >
                                                    Edit Draft
                                                </Button>
                                            </Stack>
                                        </Paper>
                                    ))}
                                </Stack>
                            </Box>
                        )}

                        <IncidentsFilters
                            filters={filters}
                            onFilterChange={setFilters}
                            excludeStatuses={['draft']}
                            useDialog={true}
                        />

                        {/* Submitted Reports Section */}
                        <Box>
                            <Typography variant="h6" fontWeight={600} gutterBottom>
                                Submitted Reports
                            </Typography>
                            <IncidentsList
                                incidents={submittedReports}
                                isLoading={isLoading}
                                showReporter={false}
                                linkPrefix="/incidents/view"
                                linkQuery="source=me"
                                emptyMessage="No submitted reports yet."
                                hasActiveFilters={hasActiveFilters}
                                onClearFilters={handleClearFilters}
                                sortable={true}
                                sortBy={sortBy}
                                sortOrder={sortOrder}
                                onSort={handleSort}
                            />
                        </Box>

                        {pagination && (
                            <IncidentsPagination
                                page={page}
                                totalPages={pagination.totalPages}
                                totalItems={pagination.total}
                                itemsPerPage={10}
                                onPageChange={setPage}
                            />
                        )}
                    </Stack>
                </motion.div>
            </Box>
        </AppLayout>
    );
}
