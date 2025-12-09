'use client';

import { SupervisorAccount } from '@mui/icons-material';
import {
  alpha,
  Box,
  Paper,
  Typography,
} from '@mui/material';
import type { OVRReportWithRelations } from '../../app/incidents/_shared/types';

interface Props {
  incident: OVRReportWithRelations;
  onUpdate?: () => void;
}

/**
 * Supervisor Section - Read-Only Display
 * Supervisor actions are for information only (no approval workflow)
 */
export function SupervisorSection({ incident }: Props) {
  // Only show if supervisor action exists
  if (!incident.supervisorAction) {
    return null;
  }

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
        <SupervisorAccount /> Supervisor Action
      </Typography>

      <Box sx={{ mt: 3 }}>
        <Box
          sx={{
            p: 2,
            bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {incident.supervisorAction}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
