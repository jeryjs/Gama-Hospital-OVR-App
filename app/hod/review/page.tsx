'use client';

import { AppLayout } from '@/components/AppLayout';
import { fadeIn } from '@/lib/theme';
import {
  AssignmentInd,
  FilterList,
  Close,
  Visibility
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  IconButton,
  LinearProgress,
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
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface HODIncident {
  id: number;
  referenceNumber: string;
  reporterName: string;
  occurrenceDate: string;
  occurrenceCategory: string;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  hod_assigned: '#EC4899',
  qi_final_review: '#10B981',
  closed: '#059669',
};

const statusLabels: Record<string, string> = {
  hod_assigned: 'Investigation Assigned',
  qi_final_review: 'QI Final Review',
  closed: 'Closed',
};

export default function HODReviewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [incidents, setIncidents] = useState<HODIncident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<HODIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof HODIncident; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== 'department_head' && session?.user?.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    fetchIncidents();
  }, [session]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [incidents, searchTerm, statusFilter, sortConfig]);

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/incidents?status=hod_assigned');
      if (res.ok) {
        const data = await res.json();
        // Filter for HOD's department or admin sees all
        const filtered = data.filter((incident: any) =>
          session?.user?.role === 'admin' ||
          incident.staffDepartment === session?.user?.department
        );

        setIncidents(
          filtered.map((incident: any) => ({
            id: incident.id,
            referenceNumber: incident.referenceNumber,
            reporterName: `${incident.reporter?.firstName || 'Unknown'} ${incident.reporter?.lastName || ''}`,
            occurrenceDate: incident.occurrenceDate,
            occurrenceCategory: incident.occurrenceCategory,
            status: incident.status,
            createdAt: incident.createdAt,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...incidents];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (incident) =>
          incident.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          incident.occurrenceCategory.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((incident) => incident.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredIncidents(filtered);
  };

  const handleSort = (key: keyof HODIncident) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setSortConfig({ key: 'createdAt', direction: 'desc' });
  };

  if (loading) {
    return (
      <AppLayout>
        <LinearProgress />
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
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AssignmentInd fontSize="large" color="primary" />
                <Typography variant="h4" fontWeight={700}>
                  Investigation Review
                </Typography>
              </Stack>
              <Typography variant="body1" color="text.secondary">
                Review and manage investigations assigned to your department ({filteredIncidents.length})
              </Typography>
            </Stack>

            {/* Filters */}
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField
                placeholder="Search by reference, reporter, or category..."
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
              <DialogTitle>Filter Investigations</DialogTitle>
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
            {filteredIncidents.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {hasActiveFilters
                    ? 'No investigations match your filters.'
                    : 'No investigations assigned to your department.'}
                </Typography>
                {hasActiveFilters && (
                  <Button
                    variant="outlined"
                    startIcon={<Close />}
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </Button>
                )}
              </Paper>
            ) : (
              <Paper>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05) }}>
                        <TableCell
                          onClick={() => handleSort('referenceNumber')}
                          sx={{ cursor: 'pointer', fontWeight: 600 }}
                        >
                          Reference # {sortConfig.key === 'referenceNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('reporterName')}
                          sx={{ cursor: 'pointer', fontWeight: 600 }}
                        >
                          Reporter {sortConfig.key === 'reporterName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('occurrenceDate')}
                          sx={{ cursor: 'pointer', fontWeight: 600 }}
                        >
                          Date {sortConfig.key === 'occurrenceDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('occurrenceCategory')}
                          sx={{ cursor: 'pointer', fontWeight: 600 }}
                        >
                          Category {sortConfig.key === 'occurrenceCategory' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                        <TableCell
                          onClick={() => handleSort('createdAt')}
                          sx={{ cursor: 'pointer', fontWeight: 600 }}
                        >
                          Created {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredIncidents.map((incident) => (
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
                          component={Link}
                          href={`/incidents/view/${incident.id}`}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {incident.referenceNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {incident.reporterName}
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
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              component={Link}
                              href={`/incidents/view/${incident.id}`}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}
          </Stack>
        </motion.div>
      </Box>
    </AppLayout>
  );
}
