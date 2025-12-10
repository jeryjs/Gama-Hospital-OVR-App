'use client';

import type { OVRReportWithRelations } from '@/lib/types';
import { getStatusColor, getStatusLabel } from '@/lib/utils/status';
import { printIncident, downloadIncident } from '@/lib/utils/incident-export';
import { ReporterCard } from '@/components/shared';
import { ArrowBack, Download, Print } from '@mui/icons-material';
import { Box, Chip, IconButton, Paper, Stack, Tooltip, Typography, Grid } from '@mui/material';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Props {
  incident: OVRReportWithRelations;
}

export function IncidentHeader({ incident }: Props) {
  const searchParams = useSearchParams();
  const source = searchParams.get('source') || 'all';
  const statusColor = getStatusColor(incident.status);

  // Determine back link based on source
  const backHref = source === 'me' ? '/incidents/me' : '/incidents';

  const handlePrint = () => {
    printIncident(incident);
  };

  const handleDownload = () => {
    downloadIncident(incident);
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: incident.reporter ? 2 : 0 }}>
        <Tooltip title={source === 'me' ? 'Back to My Reports' : 'Back to Incidents'}>
          <IconButton component={Link} href={backHref} size="small">
            <ArrowBack />
          </IconButton>
        </Tooltip>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            {incident.id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {incident.submittedAt
              ? `Submitted on ${format(new Date(incident.submittedAt), 'MMM dd, yyyy HH:mm')}`
              : `Created on ${format(new Date(incident.createdAt), 'MMM dd, yyyy HH:mm')}`
            }
          </Typography>
        </Box>

        <Chip
          label={getStatusLabel(incident.status)}
          color={statusColor as any}
          sx={{
            fontWeight: 600,
            fontSize: '0.875rem',
            px: 2,
          }}
        />

        <Tooltip title="Print Report">
          <IconButton size="small" onClick={handlePrint}>
            <Print />
          </IconButton>
        </Tooltip>
        <Tooltip title="Download Report">
          <IconButton size="small" onClick={handleDownload}>
            <Download />
          </IconButton>
        </Tooltip>
      </Stack>

      {incident.reporter && (
        <Grid container>
          <Grid size={{ xs: 12, md: 6 }}>
            <ReporterCard
              reporter={incident.reporter}
              variant="inline"
              label="Reported by"
            />
          </Grid>
        </Grid>
      )}
    </Paper>
  );
}
