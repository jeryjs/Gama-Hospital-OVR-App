import { INJURY_OUTCOMES, TREATMENT_TYPES } from '@/lib/constants';
import { Cancel, CheckCircle, LocalHospital } from '@mui/icons-material';
import { alpha, Box, Chip, Grid, Paper, Typography } from '@mui/material';
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

export function MedicalAssessmentSection({ incident }: Props) {
  const injuryOutcomeLabel = INJURY_OUTCOMES.find(i => i.value === incident.injuryOutcome)?.label;

  // Get treatment type labels
  const treatmentLabels = incident.treatmentTypes?.map(type =>
    TREATMENT_TYPES.find(t => t.value === type)?.label || type
  );

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
        <LocalHospital /> Part 4: Physician Follow-up
      </Typography>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Physician Notified?
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              {incident.physicianNotified ? (
                <Chip icon={<CheckCircle />} label="Yes" color="success" size="small" />
              ) : (
                <Chip icon={<Cancel />} label="No" size="small" />
              )}
            </Box>
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Did Physician See the Patient?
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              {incident.physicianSawPatient ? (
                <Chip icon={<CheckCircle />} label="Yes" color="success" size="small" />
              ) : (
                <Chip icon={<Cancel />} label="No" size="small" />
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>

      {incident.assessment && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Assessment / Diagnosis
          </Typography>
          <Box
            sx={{
              mt: 1,
              p: 2,
              bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
              borderRadius: 1,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {incident.assessment}
            </Typography>
          </Box>
        </Box>
      )}

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoRow label="Injury Outcome" value={injuryOutcomeLabel} />
        </Grid>

        {/* Treatment Types */}
        {treatmentLabels && treatmentLabels.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Nature of Treatment/Exam
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {treatmentLabels.map((label, idx) => (
                  <Chip key={idx} label={label} color="primary" size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          </Grid>
        )}

        {/* Hospitalized/Transferred Details */}
        {incident.hospitalizedDetails && (
          <Grid size={{ xs: 12 }}>
            <InfoRow label="Hospitalized / Transferred To" value={incident.hospitalizedDetails} />
          </Grid>
        )}

        <Grid size={{ xs: 12, md: 6 }}>
          <InfoRow label="Physician Name" value={incident.physicianName} />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoRow label="Physician ID #" value={incident.physicianId} />
        </Grid>
      </Grid>

      {incident.treatmentProvided && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Physician's Notes
          </Typography>
          <Box
            sx={{
              mt: 1,
              p: 2,
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.05),
              borderRadius: 1,
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {incident.treatmentProvided}
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}
