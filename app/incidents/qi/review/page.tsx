'use client';

import { AppLayout } from '@/components/AppLayout';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { formatErrorForAlert } from '@/lib/client/error-handler';
import { useIncidents } from '@/lib/hooks';
import { getStatusColor, getStatusLabel } from '@/lib/utils/status';
import { CheckCircle, Close, Visibility } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Typography
} from '@mui/material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  IncidentsHeader,
  IncidentsFilters,
  MetricsCards,
  type IncidentFilters,
} from '../../_shared';

// Category options for filtering
const CATEGORY_OPTIONS = [
  { value: 'fall', label: 'Fall' },
  { value: 'medication', label: 'Medication' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'other', label: 'Other' },
];

/**
 * QI Review Queue Page
 * 
 * Purpose: Manage submitted incidents awaiting QI review
 * Distinct from QI Dashboard - this is the action queue
 */
export default function QIReviewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [filters, setFilters] = useState<IncidentFilters>({
    search: '',
    status: '', // Always 'submitted' for this page
    category: '',
  });
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'approve' | 'reject' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Check access
  useEffect(() => {
    if (session && !ACCESS_CONTROL.ui.incidentForm.canEditQISection(session?.user.roles || [])) {
      return router.replace('/dashboard');
    }
  }, [session, router]);

  // Fetch submitted incidents only
  const { incidents, pagination, isLoading, error, mutate } = useIncidents({
    status: 'submitted',
    search: filters.search || undefined,
    category: filters.category || undefined,
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const handleOpenReviewDialog = (incidentId: string) => {
    setSelectedIncident(incidentId);
    setReviewDialogOpen(true);
  };

  const handleCloseReviewDialog = () => {
    setReviewDialogOpen(false);
    setSelectedIncident(null);
    setReviewDecision(null);
    setRejectionReason('');
  };

  const handleSubmitReview = async () => {
    if (!selectedIncident || !reviewDecision) return;
    if (reviewDecision === 'reject' && rejectionReason.trim().length < 20) {
      alert('Rejection reason must be at least 20 characters');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`/api/incidents/${selectedIncident}/qi-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: reviewDecision as 'approve' | 'reject',
          ...(reviewDecision === 'reject' && { rejectionReason: rejectionReason.trim() }),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      mutate();
      handleCloseReviewDialog();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <LinearProgress />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Alert severity="error" sx={{ mt: 4 }}>
          Failed to load incidents. {formatErrorForAlert(error)}
        </Alert>
      </AppLayout>
    );
  }

  const pendingCount = incidents?.length || 0;

  // Build metrics for cards
  const metrics = [
    { label: 'Pending Review', value: pendingCount, color: 'warning' as const },
    { label: 'Total Records', value: pagination?.total || 0, color: 'default' as const },
  ];

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Stack spacing={3}>
            <IncidentsHeader
              title="QI Review Queue"
              subtitle="Review and approve/reject submitted incidents before investigation"
            />

            <MetricsCards metrics={metrics} />

            <IncidentsFilters
              filters={filters}
              onFilterChange={setFilters}
              showCategoryFilter={true}
              categories={CATEGORY_OPTIONS}
              useDialog={false}
              searchPlaceholder="Search by reference or description..."
            />

            {/* Incidents Table - Custom for QI Review with Review action */}
            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Reference</TableCell>
                      <TableCell>Reporter</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {!incidents || incidents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                          <Typography variant="body1" color="text.secondary">
                            No incidents pending review
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      incidents.map((incident) => (
                        <TableRow key={incident.id} hover>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {incident.id}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {incident.reporter?.firstName} {incident.reporter?.lastName}
                          </TableCell>
                          <TableCell>
                            {format(new Date(incident.occurrenceDate), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {incident.occurrenceCategory?.replace(/_/g, ' ')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusLabel(incident.status)}
                              color={getStatusColor(incident.status) as any}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                component={Link}
                                href={`/incidents/view/${incident.id}`}
                                startIcon={<Visibility />}
                              >
                                View
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<CheckCircle />}
                                onClick={() => handleOpenReviewDialog(incident.id)}
                              >
                                Review
                              </Button>
                            </Stack>
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

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onClose={handleCloseReviewDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Review Incident</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Typography variant="body2">
                Select your decision for this incident:
              </Typography>

              <Stack spacing={1}>
                <Button
                  variant={reviewDecision === 'approve' ? 'contained' : 'outlined'}
                  color="success"
                  fullWidth
                  onClick={() => setReviewDecision('approve')}
                  startIcon={<CheckCircle />}
                >
                  Approve - Move to Investigation
                </Button>
                <Button
                  variant={reviewDecision === 'reject' ? 'contained' : 'outlined'}
                  color="error"
                  fullWidth
                  onClick={() => setReviewDecision('reject')}
                  startIcon={<Close />}
                >
                  Reject - Return to Reporter
                </Button>
              </Stack>

              {reviewDecision === 'reject' && (
                <TextField
                  label="Rejection Reason"
                  multiline
                  rows={4}
                  fullWidth
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this report is being rejected (min 20 characters)..."
                  helperText={`${rejectionReason.length}/20 minimum characters`}
                  error={rejectionReason.length > 0 && rejectionReason.length < 20}
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseReviewDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmitReview}
              disabled={
                !reviewDecision ||
                (reviewDecision === 'reject' && rejectionReason.trim().length < 20) ||
                submitting
              }
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
}
