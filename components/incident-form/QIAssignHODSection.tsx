'use client';

import { apiCall } from '@/lib/client/error-handler';
import { useUsers } from '@/lib/hooks';
import { AssignmentInd } from '@mui/icons-material';
import {
  Alert,
  alpha,
  Autocomplete,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import type { OVRReport } from '../../app/incidents/_shared/types';

interface Props {
  incident: OVRReport;
  onUpdate: () => void;
}

export function QIAssignHODSection({ incident, onUpdate }: Props) {
  const { data: session } = useSession();
  const [selectedHOD, setSelectedHOD] = useState<number | null>(incident.departmentHeadId || null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch HODs with SWR
  const { users: hodUsers, isLoading: loadingUsers } = useUsers({ role: 'admin' });

  const isQI = session?.user?.role === 'quality_manager' || session?.user?.role === 'admin';
  const canAssignHOD = isQI && incident.status === 'supervisor_approved';

  const handleAssignHOD = async () => {
    if (!selectedHOD) {
      setErrorMessage('Please select a HOD');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const { data, error } = await apiCall(`/api/incidents/${incident.id}/qi-assign-hod`, {
      method: 'POST',
      body: JSON.stringify({ departmentHeadId: selectedHOD }),
    });

    if (error) {
      setErrorMessage(error.message || 'Failed to assign HOD');
      setSubmitting(false);
      return;
    }

    setSuccessMessage('HOD assigned successfully');
    setSubmitting(false);
    setTimeout(() => {
      setSuccessMessage('');
      onUpdate();
    }, 2000);
  };

  if (!canAssignHOD) {
    return null;
  }

  return (
    <Paper sx={{ p: 3, mb: 3, bgcolor: alpha('#8B5CF6', 0.05), borderLeft: '4px solid #8B5CF6' }}>
      <Stack spacing={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentInd sx={{ color: '#8B5CF6', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={700}>
            Assign Department Head
          </Typography>
        </Box>

        {successMessage && <Alert severity="success">{successMessage}</Alert>}
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        <Autocomplete
          options={hodUsers}
          getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
          value={hodUsers.find((h) => h.id === selectedHOD) || null}
          onChange={(_, value) => setSelectedHOD(value?.id || null)}
          loading={loadingUsers}
          disabled={submitting}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Department Head"
              placeholder="Choose HOD to investigate..."
              size="small"
            />
          )}
        />

        <Typography variant="body2" color="text.secondary">
          The selected Department Head will be responsible for conducting the investigation and submitting findings.
        </Typography>

        <Button
          variant="contained"
          onClick={handleAssignHOD}
          disabled={!selectedHOD || submitting}
          sx={{ alignSelf: 'flex-start' }}
        >
          {submitting ? 'Assigning...' : 'Assign HOD'}
        </Button>
      </Stack>
    </Paper>
  );
}
