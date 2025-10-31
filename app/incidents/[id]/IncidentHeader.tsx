import { Box, Paper, Stack, Typography, Chip, IconButton } from '@mui/material';
import { ArrowBack, Print, Download } from '@mui/icons-material';
import { format } from 'date-fns';
import type { OVRReport } from '../_shared/types';

interface Props {
  incident: OVRReport;
  onBack: () => void;
}

const statusColors: Record<string, string> = {
  draft: '#6B7280',
  submitted: '#3B82F6',
  supervisor_approved: '#10B981',
  qi_review: '#8B5CF6',
  hod_assigned: '#F59E0B',
  qi_final_review: '#EC4899',
  closed: '#059669',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  supervisor_approved: 'Supervisor Approved',
  qi_review: 'QI Review',
  hod_assigned: 'Investigation Phase',
  qi_final_review: 'Final QI Review',
  closed: 'Closed',
};

export function IncidentHeader({ incident, onBack }: Props) {
  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <IconButton onClick={onBack}>
          <ArrowBack />
        </IconButton>
        
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={700}>
            {incident.referenceNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reported by {incident.reporter?.firstName} {incident.reporter?.lastName} on{' '}
            {format(new Date(incident.createdAt), 'MMM dd, yyyy HH:mm')}
          </Typography>
        </Box>
        
        <Chip
          label={statusLabels[incident.status] || incident.status}
          sx={{
            bgcolor: `${statusColors[incident.status]}20`,
            color: statusColors[incident.status],
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
