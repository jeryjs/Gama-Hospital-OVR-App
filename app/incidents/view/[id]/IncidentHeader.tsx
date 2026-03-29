'use client';

import { ReporterCard } from '@/components/shared';
import { ACCESS_CONTROL } from '@/lib/access-control';
import type { OVRReportWithRelations } from '@/lib/types';
import { getIncidentTurnaround } from '@/lib/utils/turnaround';
import { getStatusColor, getStatusLabel } from '@/lib/utils/status';
import { printIncident, downloadIncident } from '@/lib/utils/incident-export';
import { ArrowBack, Download, Print } from '@mui/icons-material';
import { Box, Chip, IconButton, Paper, Stack, Tooltip, Typography, Grid } from '@mui/material';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Props {
  incident: OVRReportWithRelations;
}

export function IncidentHeader({ incident }: Props) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const source = searchParams.get('source') || 'all';
  const statusColor = getStatusColor(incident);
  const turnaround = getIncidentTurnaround({
    levelOfHarm: incident.levelOfHarm,
    submittedAt: incident.submittedAt,
    createdAt: incident.createdAt,
  });

  const canViewTurnaround = ACCESS_CONTROL.api.qiReview.canReview(session?.user?.roles || []);
  const shouldShowTurnaround = canViewTurnaround && turnaround.tracked && !!turnaround.dueDate;

  const turnaroundChipColor =
    turnaround.status === 'overdue'
      ? 'error'
      : turnaround.status === 'due_soon'
        ? 'warning'
        : 'success';

  const turnaroundLabel =
    turnaround.status === 'overdue'
      ? `Overdue ${Math.abs(turnaround.remainingWorkingDays || 0)} wd`
      : turnaround.status === 'due_soon'
        ? `Due in ${turnaround.remainingWorkingDays || 0} wd`
        : `Due ${format(turnaround.dueDate || new Date(), 'MMM dd')}`;

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
          {shouldShowTurnaround && (
            <Typography
              variant="caption"
              color={turnaround.status === 'overdue' ? 'error.main' : 'text.secondary'}
            >
              Turnaround: {turnaround.zoneLabel} • Due {format(turnaround.dueDate || new Date(), 'MMM dd, yyyy')} ({turnaround.workingDays} working days)
            </Typography>
          )}
        </Box>

        <Chip
          label={getStatusLabel(incident)}
          color={statusColor}
          sx={{
            fontWeight: 600,
            fontSize: '0.875rem',
            px: 2,
          }}
        />

        {shouldShowTurnaround && (
          <Chip
            label={turnaroundLabel}
            color={turnaroundChipColor}
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        )}

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
