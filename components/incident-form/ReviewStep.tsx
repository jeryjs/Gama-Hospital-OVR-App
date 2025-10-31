'use client';

import {
  Box,
  Button,
  Stack,
  Paper,
  Typography,
  Grid,
  Divider,
  Chip,
  alpha,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Send, SaveAlt } from '@mui/icons-material';
import { format } from 'date-fns';
import { OVR_CATEGORIES, INJURY_OUTCOMES, PERSON_INVOLVED_OPTIONS } from '@/lib/ovr-categories';

interface ReviewStepProps {
  formData: any;
  onBack: () => void;
  onSubmit: (isDraft: boolean) => Promise<void>;
  loading: boolean;
}

export function ReviewStep({ formData, onBack, onSubmit, loading }: ReviewStepProps) {
  const categoryData = OVR_CATEGORIES.find((cat) => cat.id === formData.occurrenceCategory);
  const subcategoryData = categoryData?.subcategories.find(
    (sub) => sub.id === formData.occurrenceSubcategory
  );

  const InfoSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Box>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom color="primary">
        {title}
      </Typography>
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: (theme) => alpha(theme.palette.divider, 0.3),
        }}
      >
        {children}
      </Box>
    </Box>
  );

  const InfoRow = ({ label, value }: { label: string; value: any }) => {
    if (!value) return null;
    return (
      <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 150 }}>
          {label}:
        </Typography>
        <Typography variant="body2" fontWeight={500}>
          {value}
        </Typography>
      </Stack>
    );
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Review & Submit
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Please review all information before submitting
          </Typography>
        </Box>

        {/* Basic Information */}
        <InfoSection title="Basic Information">
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow
                label="Occurrence Date"
                value={
                  formData.occurrenceDate
                    ? format(new Date(formData.occurrenceDate), 'MMM dd, yyyy')
                    : ''
                }
              />
              <InfoRow label="Occurrence Time" value={formData.occurrenceTime} />
              <InfoRow label="Specific Location" value={formData.specificLocation} />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <InfoRow
                label="Person Involved"
                value={
                  PERSON_INVOLVED_OPTIONS.find((p) => p.value === formData.personInvolved)?.label
                }
              />
              <InfoRow
                label="Sentinel Event"
                value={formData.isSentinelEvent ? 'Yes' : 'No'}
              />
              {formData.isSentinelEvent && (
                <InfoRow label="Details" value={formData.sentinelEventDetails} />
              )}
            </Grid>
          </Grid>
        </InfoSection>

        {/* Patient/Staff Info */}
        {formData.personInvolved === 'patient' && formData.patientName && (
          <InfoSection title="Patient Information">
            <InfoRow label="Name" value={formData.patientName} />
            <InfoRow label="MR #" value={formData.patientMRN} />
            <InfoRow label="Age" value={formData.patientAge} />
            <InfoRow label="Sex" value={formData.patientSex} />
            <InfoRow label="Unit/Ward" value={formData.patientUnit} />
          </InfoSection>
        )}

        {formData.personInvolved === 'staff' && formData.staffInvolvedName && (
          <InfoSection title="Staff Information">
            <InfoRow label="Name" value={formData.staffInvolvedName} />
            <InfoRow label="Position" value={formData.staffPosition} />
            <InfoRow label="Employee ID" value={formData.staffEmployeeId} />
            <InfoRow label="Department" value={formData.staffDepartment} />
          </InfoSection>
        )}

        {/* Occurrence Details */}
        <InfoSection title="Occurrence Details">
          <Stack spacing={2}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Category
              </Typography>
              <Chip
                label={categoryData?.label}
                color="primary"
                sx={{ mt: 0.5 }}
              />
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Specific Type
              </Typography>
              <Chip
                label={subcategoryData?.label}
                variant="outlined"
                color="primary"
                sx={{ mt: 0.5 }}
              />
            </Box>
            {formData.occurrenceOtherDetails && (
              <InfoRow label="Additional Details" value={formData.occurrenceOtherDetails} />
            )}
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Description
              </Typography>
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                {formData.description}
              </Typography>
            </Box>
          </Stack>
        </InfoSection>

        {/* Witness Information */}
        {formData.witnessName && (
          <InfoSection title="Witness Information">
            <InfoRow label="Name" value={formData.witnessName} />
            <InfoRow label="Department" value={formData.witnessDepartment} />
            <InfoRow label="Position" value={formData.witnessPosition} />
            <InfoRow label="Employee ID" value={formData.witnessEmployeeId} />
            {formData.witnessAccount && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary" gutterBottom>
                  Witness Account
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                  {formData.witnessAccount}
                </Typography>
              </Box>
            )}
          </InfoSection>
        )}

        {/* Medical Assessment */}
        {formData.physicianNotified && (
          <InfoSection title="Medical Assessment">
            <InfoRow
              label="Physician Notified"
              value={formData.physicianNotified ? 'Yes' : 'No'}
            />
            <InfoRow
              label="Physician Saw Patient"
              value={formData.physicianSawPatient ? 'Yes' : 'No'}
            />
            <InfoRow label="Physician Name" value={formData.physicianName} />
            <InfoRow label="Physician ID" value={formData.physicianId} />
            {formData.assessment && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Assessment/Diagnosis
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {formData.assessment}
                </Typography>
              </Box>
            )}
            {formData.treatmentProvided && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Treatment Provided
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {formData.treatmentProvided}
                </Typography>
              </Box>
            )}
            {formData.injuryOutcome && (
              <InfoRow
                label="Injury Outcome"
                value={
                  INJURY_OUTCOMES.find((i) => i.value === formData.injuryOutcome)?.label
                }
              />
            )}
          </InfoSection>
        )}

        <Divider />

        {/* Actions */}
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onBack}
            size="large"
            disabled={loading}
          >
            Back
          </Button>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={loading ? <CircularProgress size={20} /> : <SaveAlt />}
              onClick={() => onSubmit(true)}
              disabled={loading}
              size="large"
            >
              Save as Draft
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Send />}
              onClick={() => onSubmit(false)}
              disabled={loading}
              size="large"
            >
              Submit Report
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
