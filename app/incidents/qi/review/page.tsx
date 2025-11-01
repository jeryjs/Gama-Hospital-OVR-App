'use client';

import { AppLayout } from '@/components/AppLayout';
import { AssignmentInd, Visibility } from '@mui/icons-material';
import {
  alpha,
  Autocomplete,
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
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface QIIncident {
  id: number;
  referenceNumber: string;
  occurrenceDate: string;
  occurrenceCategory: string;
  status: string;
  createdAt: string;
  reporter: {
    firstName: string;
    lastName: string;
  };
}

interface User {
  id: number;
  name: string;
  department: string | null;
}

export default function QIReviewPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [incidents, setIncidents] = useState<QIIncident[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<number | null>(null);
  const [selectedHOD, setSelectedHOD] = useState<number | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (session?.user?.role !== 'quality_manager' && session?.user?.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }
    fetchIncidents();
  }, [session]);

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/incidents?status=supervisor_approved');
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

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users?role=admin'); // HODs should have appropriate role
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleOpenAssignDialog = (incidentId: number) => {
    setSelectedIncident(incidentId);
    setAssignDialogOpen(true);
    fetchUsers();
  };

  const handleCloseAssignDialog = () => {
    setAssignDialogOpen(false);
    setSelectedIncident(null);
    setSelectedHOD(null);
  };

  const handleAssignToHOD = async () => {
    if (!selectedIncident || !selectedHOD) return;

    setAssigning(true);
    try {
      const res = await fetch(`/api/incidents/${selectedIncident}/qi-assign-hod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentHeadId: selectedHOD }),
      });

      if (res.ok) {
        fetchIncidents();
        handleCloseAssignDialog();
      } else {
        alert('Failed to assign to HOD');
      }
    } catch (error) {
      console.error('Error assigning to HOD:', error);
    } finally {
      setAssigning(false);
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
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                QI Department - Pending Review
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Review supervisor-approved incidents and assign to Department Heads for investigation
              </Typography>
            </Box>

            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Reference #</TableCell>
                      <TableCell>Reporter</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {incidents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                          <Typography variant="body1" color="text.secondary">
                            No incidents pending QI review
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      incidents.map((incident) => (
                        <TableRow
                          key={incident.id}
                          hover
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              backgroundColor: (theme) =>
                                alpha(theme.palette.primary.main, 0.05),
                            },
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {incident.referenceNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {incident.reporter.firstName} {incident.reporter.lastName}
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
                              label="Supervisor Approved"
                              size="small"
                              sx={{
                                bgcolor: alpha('#10B981', 0.15),
                                color: '#10B981',
                                fontWeight: 600,
                              }}
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
                                startIcon={<AssignmentInd />}
                                onClick={() => handleOpenAssignDialog(incident.id)}
                              >
                                Assign HOD
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

        {/* Assign HOD Dialog */}
        <Dialog
          open={assignDialogOpen}
          onClose={handleCloseAssignDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Assign to Department Head</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Autocomplete
                options={users}
                getOptionLabel={(option) => `${option.name} ${option.department ? `(${option.department})` : ''}`}
                onChange={(_, value) => setSelectedHOD(value?.id || null)}
                renderInput={(params) => (
                  <TextField {...params} label="Select Department Head" required />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAssignDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleAssignToHOD}
              disabled={!selectedHOD || assigning}
            >
              {assigning ? 'Assigning...' : 'Assign'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AppLayout>
  );
}
