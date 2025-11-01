'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Paper,
  Typography,
  Box,
  alpha,
  TextField,
  Button,
  Stack,
  Autocomplete,
  Alert,
} from '@mui/material';
import { AssignmentInd } from '@mui/icons-material';
import type { OVRReport } from '../../app/incidents/_shared/types';

interface Props {
  incident: OVRReport;
  onUpdate: () => void;
}

export function QIAssignHODSection({ incident, onUpdate }: Props) {
  const { data: session } = useSession();
  const [hodUsers, setHodUsers] = useState<Array<{ id: number; name: string; department: string }>>([]);
  const [selectedHOD, setSelectedHOD] = useState<number | null>(incident.departmentHeadId || null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const isQI = session?.user?.role === 'quality_manager' || session?.user?.role === 'admin';
  const canAssignHOD = isQI && incident.status === 'supervisor_approved';

  const fetchHODs = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users?role=admin');
      if (res.ok) {
        const data = await res.json();
        setHodUsers(
          data.map((user: any) => ({
            id: user.id,
            name: `${user.name} (${user.department || 'N/A'})`,
            department: user.department,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching HODs:', error);
      setErrorMessage('Failed to load HOD list');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAssignHOD = async () => {
    if (!selectedHOD) {
      setErrorMessage('Please select a HOD');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/incidents/${incident.id}/qi-assign-hod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentHeadId: selectedHOD }),
      });

      if (res.ok) {
        setSuccessMessage('HOD assigned successfully');
        setErrorMessage('');
        setTimeout(() => {
          setSuccessMessage('');
          onUpdate();
        }, 2000);
      } else {
        const error = await res.json();
        setErrorMessage(error.error || 'Failed to assign HOD');
      }
    } catch (error) {
      console.error('Error assigning HOD:', error);
      setErrorMessage('An error occurred while assigning HOD');
    } finally {
      setSubmitting(false);
    }
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
          getOptionLabel={(option) => option.name}
          value={hodUsers.find((h) => h.id === selectedHOD) || null}
          onChange={(_, value) => setSelectedHOD(value?.id || null)}
          onOpen={fetchHODs}
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
