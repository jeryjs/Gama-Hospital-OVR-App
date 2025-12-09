import { OVRReportListItem } from '@/lib/types';
import { getStatusChipProps, getStatusColor, getStatusLabel } from '@/lib/utils/status';
import { ArrowBack, Download, Print } from '@mui/icons-material';
import { Box, Chip, IconButton, Paper, Stack, Typography } from '@mui/material';
import { format } from 'date-fns';
import Link from 'next/link';

interface Props {
  incident: OVRReportListItem;
}

export function IncidentHeader({ incident }: Props) {
  const statusColor = getStatusColor(incident.status);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <IconButton component={Link} href="/incidents" size="small" title="Back to Incidents">
          <ArrowBack />
        </IconButton>

        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            {incident.id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reported by {incident.reporter?.firstName} {incident.reporter?.lastName} on{' '}
            {format(new Date(incident.createdAt), 'MMM dd, yyyy HH:mm')}
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

        <IconButton size="small" title="Print">
          <Print />
        </IconButton>
        <IconButton size="small" title="Download PDF">
          <Download />
        </IconButton>
      </Stack>
    </Paper>
  );
}
