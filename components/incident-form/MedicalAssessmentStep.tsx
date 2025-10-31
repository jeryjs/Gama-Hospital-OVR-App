'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Stack,
  Paper,
  Typography,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
} from '@mui/material';
import { ArrowForward, ArrowBack } from '@mui/icons-material';
import { INJURY_OUTCOMES } from '@/lib/ovr-categories';

interface MedicalAssessmentStepProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function MedicalAssessmentStep({
  formData,
  setFormData,
  onNext,
  onBack,
}: MedicalAssessmentStepProps) {
  const [physicianInvolved, setPhysicianInvolved] = useState(
    formData.physicianNotified || false
  );

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h6" fontWeight={600}>
          Medical Assessment
        </Typography>

        {/* Physician Notification */}
        <Grid container spacing={3}>
          <Grid size={12}>
            <FormControlLabel
              control={
                <Switch
                  checked={physicianInvolved}
                  onChange={(e) => {
                    setPhysicianInvolved(e.target.checked);
                    handleChange('physicianNotified', e.target.checked);
                    if (!e.target.checked) {
                      handleChange('physicianSawPatient', false);
                      handleChange('assessment', '');
                      handleChange('diagnosis', '');
                      handleChange('treatmentProvided', '');
                      handleChange('physicianName', '');
                      handleChange('physicianId', '');
                    }
                  }}
                />
              }
              label="Was a physician notified?"
            />
          </Grid>

          {physicianInvolved && (
            <>
              <Grid size={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.physicianSawPatient}
                      onChange={(e) =>
                        handleChange('physicianSawPatient', e.target.checked)
                      }
                    />
                  }
                  label="Did the physician see the patient?"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Physician's Name"
                  value={formData.physicianName}
                  onChange={(e) => handleChange('physicianName', e.target.value)}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Physician ID #"
                  value={formData.physicianId}
                  onChange={(e) => handleChange('physicianId', e.target.value)}
                />
              </Grid>

              <Grid size={12}>
                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                  Assessment / Diagnosis
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Medical assessment and diagnosis..."
                  value={formData.assessment}
                  onChange={(e) => handleChange('assessment', e.target.value)}
                />
              </Grid>

              <Grid size={12}>
                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                  Treatment Provided
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  placeholder="Describe treatment or interventions..."
                  value={formData.treatmentProvided}
                  onChange={(e) => handleChange('treatmentProvided', e.target.value)}
                />
              </Grid>
            </>
          )}

          {/* Injury Outcome */}
          <Grid size={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                Injury Outcome
              </FormLabel>
              <RadioGroup
                row
                value={formData.injuryOutcome}
                onChange={(e) => handleChange('injuryOutcome', e.target.value)}
              >
                {INJURY_OUTCOMES.map((outcome) => (
                  <FormControlLabel
                    key={outcome.value}
                    value={outcome.value}
                    control={<Radio />}
                    label={outcome.label}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>

        {/* Navigation */}
        <Stack direction="row" spacing={2} justifyContent="space-between" sx={{ pt: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onBack}
            size="large"
          >
            Back
          </Button>
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={onNext}
            size="large"
          >
            Next: Review & Submit
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
