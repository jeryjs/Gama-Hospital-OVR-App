'use client';

import { SupervisorAccount } from '@mui/icons-material';
import {
  alpha,
  Box,
  Chip,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
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
  if (!incident.supervisorNotified && !incident.supervisorId && !incident.supervisorAction) {
    return null;
  }

  const supervisorName = incident.supervisor
    ? `${incident.supervisor.firstName || ''} ${incident.supervisor.lastName || ''}`.trim()
    : null;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 2,
          borderBottom: (theme) => `2px solid ${theme.palette.divider}`
        }}>
        <SupervisorAccount /> Supervisor Action
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box>
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 600
              }}>
              Supervisor Notified?
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              {incident.supervisorNotified ? (
                <Chip icon={<CheckCircle />} label="Yes" color="success" size="small" />
              ) : (
                <Chip icon={<Cancel />} label="No" size="small" />
              )}
            </Box>
          </Box>
        </Grid>

        {(incident.supervisorId || supervisorName) && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontWeight: 600
                }}>
                Supervisor
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {supervisorName || `User #${incident.supervisorId}`}
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
      <Box sx={{ mt: 3 }}>
        <Box
          sx={{
            p: 2,
            bgcolor: (theme) => alpha(theme.palette.success.main, 0.05),
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontWeight: 600
            }}>
            Supervisor Action
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
            {incident.supervisorAction || 'No supervisor action recorded.'}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
