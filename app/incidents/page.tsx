'use client';

import { AppLayout } from '@/components/AppLayout';
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
} from '@mui/material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/dist/client/components/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Incident {
  id: number;
  referenceNumber: string;
  occurrenceDate: string;
  occurrenceCategory: string;
  status: string;
  createdAt: string;
}

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
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Incident; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [incidents, searchTerm, statusFilter, sortConfig]);

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/incidents');
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
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

  const handleSort = (key: keyof Incident) => {
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
                  View and manage your incident reports ({filteredIncidents.length})
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
                        onClick={() => handleSort('referenceNumber')}
                        sx={{ cursor: 'pointer', fontWeight: 600 }}
                      >
                        Reference # {sortConfig.key === 'referenceNumber' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
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
                    {filteredIncidents.length === 0 ? (
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
                      filteredIncidents.map((incident) => (
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
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Stack>
        </motion.div>
      </Box>
    </AppLayout>
  );
}
