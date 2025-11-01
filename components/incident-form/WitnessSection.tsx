import { Visibility } from '@mui/icons-material';
import { Box, Grid, Paper, Typography, alpha } from '@mui/material';
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

export function WitnessSection({ incident }: Props) {
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
        <Visibility /> Witness Information
      </Typography>

      {incident.witnessAccount && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Witness Account
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
            {incident.witnessAccount}
          </Typography>
        </Box>
      )}

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoRow label="Witness Name" value={incident.witnessName} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoRow label="Department / Position" value={incident.witnessDepartment} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoRow label="Employee ID #" value={incident.witnessEmployeeId} />
        </Grid>
      </Grid>
    </Paper>
  );
}
