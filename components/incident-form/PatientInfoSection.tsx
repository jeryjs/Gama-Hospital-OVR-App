import { Person, Badge, Group, HelpOutline } from '@mui/icons-material';
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

// Get title and icon based on person type
const getTypeConfig = (personInvolved: string) => {
  switch (personInvolved) {
    case 'patient':
      return { title: 'Patient Information', icon: <Person />, color: 'primary' as const };
    case 'staff':
      return { title: 'Staff Involved Details', icon: <Badge />, color: 'warning' as const };
    case 'public':
      return { title: 'Public Information', icon: <Group />, color: 'info' as const };
    case 'organization':
    default:
      return { title: 'Organization Information', icon: <HelpOutline />, color: 'secondary' as const };
  }
};

export function PersonInvolvedSection({ incident }: Props) {
  const { title, icon, color } = getTypeConfig(incident.personInvolved);
  const isPatient = incident.personInvolved === 'patient';
  const isStaff = incident.personInvolved === 'staff';
  const isPublic = incident.personInvolved === 'public';
  const isOrganization = incident.personInvolved === 'organization';
  const isPublicOrOrganization = isPublic || isOrganization;

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
          color: (theme) => theme.palette[color].main,
        }}
      >
        {icon} {title}
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* Name - All types */}
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoRow
            label={
              isPatient
                ? 'Patient Name'
                : isStaff
                  ? 'Staff Name'
                  : isOrganization
                    ? 'Organization Name'
                    : 'Public Person Name'
            }
            value={incident.involvedPersonName}
          />
        </Grid>

        {/* MRN - Patient only */}
        {isPatient && (
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="MR #" value={incident.involvedPersonMRN} />
          </Grid>
        )}

        {/* Employee ID & Position - Staff only */}
        {isStaff && (
          <>
            <Grid size={{ xs: 12, md: 4 }}>
              <InfoRow label="Employee ID #" value={incident.involvedPersonEmployeeId} />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <InfoRow label="Position" value={incident.involvedPersonPosition} />
            </Grid>
          </>
        )}

        {/* Relation & Contact - Public/Organization */}
        {isPublicOrOrganization && (
          <>
            <Grid size={{ xs: 12, md: 4 }}>
              <InfoRow
                label={isOrganization ? 'Person Who Affected Organization' : 'Relation to Patient'}
                value={incident.involvedPersonRelation}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <InfoRow
                label={isOrganization ? 'Relation to Organization' : 'Contact Info'}
                value={incident.involvedPersonContact}
              />
            </Grid>
          </>
        )}

        {/* Unit/Ward/Department - Patient & Staff */}
        {(isPatient || isStaff) && (
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow
              label={isPatient ? 'Unit / Ward' : 'Department / Unit'}
              value={incident.involvedPersonUnit}
            />
          </Grid>
        )}

        {/* Age & Sex - Patient/Public only */}
        {(isPatient || isPublic) && (
          <>
            <Grid size={{ xs: 12, md: 3 }}>
              <InfoRow label="Age" value={incident.involvedPersonAge?.toString()} />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <InfoRow label="Sex" value={incident.involvedPersonSex} />
            </Grid>
          </>
        )}
      </Grid>

      {isPatient && (
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
      )}
    </Paper>
  );
}

// Keep old export for backward compatibility during migration
export { PersonInvolvedSection as PatientInfoSection };
