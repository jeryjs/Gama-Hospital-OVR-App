'use client';

import { AppLayout } from '@/components/AppLayout';
import { LoadingFallback } from '@/components/LoadingFallback';
import { ErrorLayout } from '@/components/shared';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { useIncidents } from '@/lib/hooks';
import { Add } from '@mui/icons-material';
import { Box, Button, Stack } from '@mui/material';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  IncidentsHeader,
  IncidentsFilters,
  IncidentsList,
  IncidentsPagination,
  type IncidentFilters,
} from './_shared';

type SortColumn = 'createdAt' | 'occurrenceDate' | 'status';

export default function IncidentsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<IncidentFilters>({
    search: '',
    status: '',
  });
  const [sortBy, setSortBy] = useState<SortColumn>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const userRoles = session?.user?.roles || [];
  const canViewAllIncidents = ACCESS_CONTROL.api.incidents.canViewAll(userRoles);
  const canViewTeamIncidents = ACCESS_CONTROL.api.incidents.canViewTeam(userRoles);
  const hasElevatedAccess = canViewAllIncidents || canViewTeamIncidents;

  // Redirect employees (non-elevated roles) to /incidents/me
  useEffect(() => {
    if (sessionStatus === 'authenticated' && !hasElevatedAccess) {
      router.replace('/incidents/me');
    }
  }, [sessionStatus, hasElevatedAccess, router]);

  // Initialize filters from URL once on client
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status') || '';
    // Don't allow 'draft' status filter on this page
    if (status && status !== 'draft') {
      setFilters((prev) => ({ ...prev, status }));
    }
  }, []);

  const { incidents, pagination, isLoading, error } = useIncidents({
    page,
    limit: 10,
    sortBy,
    sortOrder,
    status: filters.status || undefined,
    search: filters.search || undefined,
  });

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

  // Show loading while checking session or redirecting
  if (
    sessionStatus === 'loading' ||
    (!hasElevatedAccess && sessionStatus === 'authenticated')
  ) {
    return <LoadingFallback />;
  }

  if (error) {
    return (
      <AppLayout>
        <ErrorLayout error={error} onRetry={() => { }} />
      </AppLayout>
    );
  }

  if (isLoading) {
    return <LoadingFallback />;
  }

  const title = canViewAllIncidents ? 'All Incidents' : 'Team Incidents';
  const subtitle = canViewAllIncidents
    ? 'View and manage all OVR reports'
    : 'View incidents from your team';

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
              title={title}
              subtitle={subtitle}
              count={pagination?.total || 0}
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

            <IncidentsFilters
              filters={filters}
              onFilterChange={setFilters}
              excludeStatuses={['draft']}
              useDialog={true}
            />

            <IncidentsList
              incidents={incidents}
              isLoading={isLoading}
              showReporter={true}
              linkPrefix="/incidents/view"
              linkQuery="source=all"
              hasActiveFilters={hasActiveFilters}
              onClearFilters={handleClearFilters}
              sortable={true}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
            />

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
