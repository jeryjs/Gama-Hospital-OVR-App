'use client';

import { useIncidentActions } from '@/lib/hooks';
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
  const { performAction, submitting } = useIncidentActions(incident.id, onUpdate);

  const canEditSection = ACCESS_CONTROL.ui.incidentForm.canEditSupervisorSection(session?.user.roles || []);
  // REMOVED: Supervisor approval functionality - incidents go directly to QI
  // const canApprove = canEditSection && incident.status === 'submitted';
  const canApprove = false; // Disabled - no longer used
  const isApproved = incident.status !== 'draft'; // All submitted incidents are considered "approved"

  // REMOVED: This handler is no longer used
  const handleApprove = async () => {
    if (!action.trim()) {
      alert('Please provide supervisor action notes');
      return;
    }

    const result = await performAction('supervisor-approve', { action });

    if (!result.success) {
      alert(result.error || 'Failed to approve');
    }
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
        {/* REMOVED: Supervisor approval UI - no longer used */}
        {/* {canApprove ? ( ... ) : ( ... )} */}
        <Box
          sx={{
            p: 2,
            bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {incident.supervisorAction || 'No supervisor action recorded yet...'}
          </Typography>
        </Box>
      </Box>

      {/* REMOVED: Status check for submitted */}
      {/* {incident.status === 'submitted' && !canApprove && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Awaiting supervisor approval before proceeding to QI Department
        </Alert>
      )} */}
    </Paper>
  );
}
