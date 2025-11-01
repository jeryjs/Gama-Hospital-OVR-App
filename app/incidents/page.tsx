'use client';

import { AppLayout } from '@/components/AppLayout';
import { useIncidents } from '@/lib/hooks';
import { fadeIn } from '@/lib/theme';
import {
  Add,
  Close,
  FilterList,
  Visibility
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
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
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import router from 'next/router';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  draft: '#6B7280',
  submitted: '#3B82F6',
  supervisor_approved: '#10B981',
  qi_review: '#8B5CF6',
  hod_assigned: '#EC4899',
  qi_final_review: '#10B981',
  closed: '#059669',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  supervisor_approved: 'Supervisor Approved',
  qi_review: 'QI Review',
  hod_assigned: 'Investigation',
  qi_final_review: 'QI Final Review',
  closed: 'Closed',
};

export default function IncidentsPage() {
  const searchParams = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [sortBy, setSortBy] = useState<'createdAt' | 'occurrenceDate' | 'refNo' | 'status'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Fetch incidents with SWR - automatic caching and revalidation
  const { incidents, pagination, isLoading, error } = useIncidents({
    page,
    limit: 10,
    sortBy,
    sortOrder,
    status: statusFilter || undefined,
    search: searchTerm || undefined,
  });

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

  if (isLoading && !incidents.length) {
    return (
      <AppLayout>
        <LinearProgress />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Typography color="error">Error loading incidents. Please try again.</Typography>
      </AppLayout>
    );
  }

  const hasActiveFilters = searchTerm || statusFilter;

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
                  My OVR Reports
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  View and manage incidents reported by you ({pagination?.total || 0})
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

            {/* Filters */}
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                placeholder="Search by reference or category..."
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
              <DialogTitle>Filter Reports</DialogTitle>
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

            {/* Table */}
            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell
                        onClick={() => handleSort('refNo')}
                        sx={{ cursor: 'pointer', fontWeight: 600 }}
                      >
                        Reference # {sortBy === 'refNo' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                    {incidents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                          <Typography variant="body1" color="text.secondary">
                            {hasActiveFilters
                              ? 'No incidents match your filters.'
                              : 'No incidents found. Create your first report!'}
                          </Typography>
                          {hasActiveFilters ? (
                            <Button
                              variant="outlined"
                              startIcon={<Close />}
                              onClick={handleClearFilters}
                              sx={{ mt: 2 }}
                            >
                              Clear Filters
                            </Button>
                          ) : (
                            <Button
                              component={Link}
                              href="/incidents/new"
                              variant="outlined"
                              startIcon={<Add />}
                              sx={{ mt: 2 }}
                            >
                              New Report
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      incidents.map((incident) => (
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
                              {incident.refNo}
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
                              label={statusLabels[incident.status] || incident.status}
                              size="small"
                              sx={{
                                bgcolor: alpha(
                                  statusColors[incident.status] || '#6B7280',
                                  0.15
                                ),
                                color: statusColors[incident.status] || '#6B7280',
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
