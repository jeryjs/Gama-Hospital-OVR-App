import { Person } from '@mui/icons-material';
import { alpha, Box, Grid, Paper, Typography } from '@mui/material';
import type { OVRReport } from '../../app/incidents/_shared/types';

interface Props {
  incident: OVRReport;
}

const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" fontWeight={600}>
      {label}
    </Typography>
    <Typography variant="body2">{value || 'N/A'}</Typography>
  </Box>
);

export function PatientInfoSection({ incident }: Props) {
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
        <Person /> Patient Information
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoRow label="Patient Name" value={incident.patientName} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoRow label="MR #" value={incident.patientMRN} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoRow label="Unit / Ward" value={incident.patientUnit} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <InfoRow label="Age" value={incident.patientAge?.toString()} />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <InfoRow label="Sex" value={incident.patientSex} />
        </Grid>
      </Grid>

      <Box
        sx={{
          mt: 2,
          p: 1.5,
          bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
          borderRadius: 1,
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" fontWeight={600} color="info.main">
          ⚠️ CONFIDENTIAL - Do not file in the Medical Record
        </Typography>
      </Box>
    </Paper>
  );
}
