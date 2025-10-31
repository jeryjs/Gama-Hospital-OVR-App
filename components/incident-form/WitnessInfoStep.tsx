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
  Switch,
  FormControlLabel,
} from '@mui/material';
import { ArrowForward, ArrowBack } from '@mui/icons-material';

interface WitnessInfoStepProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function WitnessInfoStep({
  formData,
  setFormData,
  onNext,
  onBack,
}: WitnessInfoStepProps) {
  const [hasWitness, setHasWitness] = useState(!!formData.witnessName);

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h6" fontWeight={600}>
          Witness Information
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={hasWitness}
              onChange={(e) => {
                setHasWitness(e.target.checked);
                if (!e.target.checked) {
                  // Clear witness fields
                  handleChange('witnessName', '');
                  handleChange('witnessAccount', '');
                  handleChange('witnessDepartment', '');
                  handleChange('witnessPosition', '');
                  handleChange('witnessEmployeeId', '');
                }
              }}
            />
          }
          label="Were there any witnesses to this occurrence?"
        />

        {hasWitness && (
          <Grid container spacing={3}>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Witness Name"
                value={formData.witnessName}
                onChange={(e) => handleChange('witnessName', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Department"
                value={formData.witnessDepartment}
                onChange={(e) => handleChange('witnessDepartment', e.target.value)}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Position"
                value={formData.witnessPosition}
                onChange={(e) => handleChange('witnessPosition', e.target.value)}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                label="Employee ID #"
                value={formData.witnessEmployeeId}
                onChange={(e) => handleChange('witnessEmployeeId', e.target.value)}
              />
            </Grid>

            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                Witness Account
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="Witness description of what happened..."
                value={formData.witnessAccount}
                onChange={(e) => handleChange('witnessAccount', e.target.value)}
              />
            </Grid>
          </Grid>
        )}

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
            Next: Medical Assessment
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
