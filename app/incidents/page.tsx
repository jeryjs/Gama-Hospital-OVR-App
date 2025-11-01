'use client';

import { AppLayout } from '@/components/AppLayout';
import { fadeIn } from '@/lib/theme';
import {
  Add,
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
  Typography,
  alpha,
} from '@mui/material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  supervisor_review: '#F59E0B',
  qi_review: '#8B5CF6',
  hod_review: '#EC4899',
  resolved: '#10B981',
  closed: '#059669',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  supervisor_review: 'Supervisor Review',
  qi_review: 'QI Review',
  hod_review: 'HOD Review',
  resolved: 'Resolved',
  closed: 'Closed',
};

export default function IncidentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, []);

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

  if (loading) {
    return (
      <AppLayout>
        <LinearProgress />
      </AppLayout>
    );
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
                  My OVR Reports
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  View and manage your incident reports
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => router.push('/incidents/new')}
                sx={{ px: 3, py: 1.5 }}
              >
                New Report
              </Button>
            </Stack>

            {/* Table */}
            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Reference #</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {incidents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                          <Typography variant="body1" color="text.secondary">
                            No incidents found. Create your first report!
                          </Typography>
                          <Button
                            variant="outlined"
                            startIcon={<Add />}
                            onClick={() => router.push('/incidents/new')}
                            sx={{ mt: 2 }}
                          >
                            New Report
                          </Button>
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
                          onClick={() => router.push(`/incidents/${incident.id}`)}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/incidents/${incident.id}`);
                              }}
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
