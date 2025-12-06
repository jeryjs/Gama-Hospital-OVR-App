'use client';

import { AppLayout } from '@/components/AppLayout';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { fadeIn } from '@/lib/theme';
import { useIncidents } from '@/lib/hooks';
import { OVRReportListItem } from '@/lib/api/schemas';
import {
  AssignmentInd,
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
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type HODIncident = OVRReportListItem & {
  reporterName: string;
  reporterDepartment: string;
  severity?: string;
  investigatorCount?: number;
  findingsSubmitted?: boolean;
};

const statusLabels: Record<string, string> = {
  hod_assigned: 'Investigation Assigned',
  qi_final_review: 'QI Final Review',
  closed: 'Closed',
};

export default function HODReviewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof HODIncident; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Fetch incidents using the hook
  const { incidents: rawIncidents, isLoading, error } = useIncidents({
    status: 'hod_assigned',
    revalidateOnFocus: false,
  });

  // Transform raw incidents to HODIncident format
  const incidents = useMemo<HODIncident[]>(() =>
    rawIncidents.map((incident) => ({
      ...incident,
      reporterName: incident.reporter
        ? `${incident.reporter.firstName} ${incident.reporter.lastName}`
        : 'Unknown',
      reporterDepartment: 'N/A', // Not in list schema
      severity: 'standard',
      investigatorCount: 0,
      findingsSubmitted: false,
    })),
    [rawIncidents]
  );

  const [filteredIncidents, setFilteredIncidents] = useState<HODIncident[]>([]);

  useEffect(() => {
    if (session === undefined) {
      // Session is still loading, do nothing
      return;
    }
    if (session && !ACCESS_CONTROL.ui.navigation.showHODReview(session.user.roles)) {
      return router.replace('/dashboard');
    }
  }, [session, router]);

  // Apply filters and sorting whenever dependencies change
  useEffect(() => {
    let filtered = [...incidents];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (incident) =>
          (incident.refNo?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
          (incident.reporterDepartment?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
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

      if (!aValue || !bValue) return 0;

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
  }, [incidents, searchTerm, statusFilter, sortConfig]);

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

  if (isLoading) {
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
                placeholder="Search by reference, department, or issue type..."
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
                          onClick={() => handleSort('refNo')}
                          sx={{ cursor: 'pointer', fontWeight: 600 }}
                        >
                          Reference # {sortConfig.key === 'refNo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('reporterDepartment')}
                          sx={{ cursor: 'pointer', fontWeight: 600 }}
                        >
                          Department {sortConfig.key === 'reporterDepartment' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell
                          onClick={() => handleSort('occurrenceCategory')}
                          sx={{ cursor: 'pointer', fontWeight: 600 }}
                        >
                          Issue Type {sortConfig.key === 'occurrenceCategory' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
                        <TableCell
                          onClick={() => handleSort('occurrenceDate')}
                          sx={{ cursor: 'pointer', fontWeight: 600 }}
                        >
                          Incident Date {sortConfig.key === 'occurrenceDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Findings</TableCell>
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
                              {incident.refNo}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {incident.reporterDepartment || 'N/A'}
                            </Typography>
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
                              label={incident.severity || 'Standard'}
                              size="small"
                              sx={{
                                bgcolor: incident.severity === 'high' ? '#FEE2E2' :
                                  incident.severity === 'medium' ? '#FEF3C7' : '#DBEAFE',
                                color: incident.severity === 'high' ? '#991B1B' :
                                  incident.severity === 'medium' ? '#92400E' : '#1E40AF',
                                fontWeight: 600,
                                borderRadius: 1,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {format(new Date(incident.occurrenceDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={incident.findingsSubmitted ? 'Submitted' : 'Pending'}
                              size="small"
                              sx={{
                                bgcolor: incident.findingsSubmitted ? alpha('#10B981', 0.15) : alpha('#F59E0B', 0.15),
                                color: incident.findingsSubmitted ? '#10B981' : '#F59E0B',
                                fontWeight: 600,
                                borderRadius: 1,
                              }}
                            />
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
