'use client';

import { apiCall } from '@/lib/client/error-handler';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { CheckCircle, SupervisorAccount } from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import type { OVRReportWithRelations } from '../../app/incidents/_shared/types';

interface Props {
  incident: OVRReportWithRelations;
  onUpdate: () => void;
}

export function SupervisorSection({ incident, onUpdate }: Props) {
  const { data: session } = useSession();
  const [action, setAction] = useState(incident.supervisorAction || '');
  const [submitting, setSubmitting] = useState(false);

  const canEditSection = ACCESS_CONTROL.ui.incidentForm.canEditSupervisorSection(session?.user.roles || []);
  const canApprove = canEditSection && incident.status === 'submitted';
  const isApproved = incident.status !== 'draft' && incident.status !== 'submitted';

  const handleApprove = async () => {
    if (!action.trim()) {
      alert('Please provide supervisor action notes');
      return;
    }

    setSubmitting(true);
    const { data, error } = await apiCall(`/api/incidents/${incident.id}/supervisor-approve`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });

    setSubmitting(false);
    if (error) {
      alert(error.message || 'Failed to approve');
      return;
    }

    onUpdate();
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography
        variant="h6"
        fontWeight={700}
        gutterBottom
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 2,
          borderBottom: (theme) => `2px solid ${theme.palette.divider}`,
        }}
      >
        <SupervisorAccount /> Immediate Supervisor / Manager's Action
      </Typography>

      {isApproved && incident.supervisorApprovedAt && (
        <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2 }}>
          Approved by {incident.supervisor?.firstName} {incident.supervisor?.lastName} on{' '}
          {format(new Date(incident.supervisorApprovedAt), 'MMM dd, yyyy HH:mm')}
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        {canApprove ? (
          <Stack spacing={2}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Supervisor Action *"
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Describe the immediate action taken..."
              required
            />
            <Button
              variant="contained"
              onClick={handleApprove}
              disabled={submitting || !action.trim()}
              startIcon={<CheckCircle />}
            >
              {submitting ? 'Approving...' : 'Approve & Send to QI Department'}
            </Button>
          </Stack>
        ) : (
          <Box
            sx={{
              p: 2,
              bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
              borderRadius: 1,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {incident.supervisorAction || 'Awaiting supervisor action...'}
            </Typography>
          </Box>
        )}
      </Box>

      {incident.status === 'submitted' && !canApprove && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Awaiting supervisor approval before proceeding to QI Department
        </Alert>
      )}
    </Paper>
  );
}
