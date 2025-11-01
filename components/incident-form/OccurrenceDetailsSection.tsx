import { Paper, Typography, Grid, Box, Chip, alpha } from '@mui/material';
import { Place, Warning, Person } from '@mui/icons-material';
import { format } from 'date-fns';
import { OVR_CATEGORIES, PERSON_INVOLVED_OPTIONS } from '@/lib/ovr-categories';
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

export function OccurrenceDetailsSection({ incident }: Props) {
  const category = OVR_CATEGORIES.find(c => c.id === incident.occurrenceCategory);
  const subcategory = category?.subcategories.find(s => s.id === incident.occurrenceSubcategory);
  const personInvolvedLabel = PERSON_INVOLVED_OPTIONS.find(p => p.value === incident.personInvolved)?.label;

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
        <Place /> Occurrence Details
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoRow
            label="Date"
            value={format(new Date(incident.occurrenceDate), 'MMMM dd, yyyy')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoRow
            label="Time"
            value={format(new Date(`2000-01-01T${incident.occurrenceTime}`), 'HH:mm')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoRow
            label="Location"
            value={incident.location?.name}
          />
        </Grid>
        {incident.specificLocation && (
          <Grid size={{ xs: 12 }}>
            <InfoRow label="Specific Location" value={incident.specificLocation} />
          </Grid>
        )}
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Person Involved
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Chip
            icon={<Person />}
            label={personInvolvedLabel}
            sx={{ mr: 1 }}
          />
          {incident.isSentinelEvent && (
            <Chip
              icon={<Warning />}
              label="Sentinel Event"
              color="error"
              variant="outlined"
            />
          )}
        </Box>
        {incident.isSentinelEvent && incident.sentinelEventDetails && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
              borderRadius: 1,
              borderLeft: (theme) => `4px solid ${theme.palette.error.main}`,
            }}
          >
            <Typography variant="caption" fontWeight={600} color="error.main">
              Sentinel Event Details:
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {incident.sentinelEventDetails}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Staff Involved */}
      {incident.personInvolved === 'staff' && incident.staffInvolvedName && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
            borderRadius: 1,
          }}
        >
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Staff Involved
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <InfoRow label="Name" value={incident.staffInvolvedName} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <InfoRow label="Position" value={incident.staffPosition} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <InfoRow label="Employee ID" value={incident.staffEmployeeId} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <InfoRow label="Department" value={incident.staffDepartment} />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Classification */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Classification
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <InfoRow label="Category" value={category?.label} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <InfoRow label="Subcategory" value={subcategory?.label} />
          </Grid>
        </Grid>
      </Box>

      {/* Description */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Description of Occurrence / Variance
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
            {incident.description}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
