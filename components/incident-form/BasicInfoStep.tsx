'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Stack,
  Paper,
  Typography,
  Select,
  MenuItem,
  Switch,
  Grid,
  alpha,
  InputLabel,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ArrowForward } from '@mui/icons-material';
import { PERSON_INVOLVED_OPTIONS } from '@/lib/ovr-categories';
import dayjs from 'dayjs';

interface BasicInfoStepProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
}

export function BasicInfoStep({ formData, setFormData, onNext }: BasicInfoStepProps) {
  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/locations');
      if (res.ok) {
        const data = await res.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const isValid = () => {
    return (
      formData.occurrenceDate &&
      formData.occurrenceTime &&
      formData.personInvolved &&
      formData.description
    );
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h6" fontWeight={600}>
          Basic Information
        </Typography>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={3}>
            {/* Date & Time */}
            <Grid size={{ xs: 12, md: 6 }}>
              <DatePicker
                label="Occurrence Date *"
                value={formData.occurrenceDate ? dayjs(formData.occurrenceDate) : null}
                onChange={(date) => handleChange('occurrenceDate', date?.format('YYYY-MM-DD'))}
                format="DD-MM-YYYY"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TimePicker
                label="Occurrence Time *"
                value={formData.occurrenceTime ? dayjs(`2000-01-01 ${formData.occurrenceTime}`) : null}
                onChange={(time) => handleChange('occurrenceTime', time?.format('HH:mm:ss'))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  },
                }}
              />
            </Grid>

            {/* Location */}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="location-label">Occurrence Location / Department</InputLabel>
                <Select
                  labelId="location-label"
                  label="Occurrence Location / Department"
                  value={formData.locationId || ''}
                  onChange={(e) => handleChange('locationId', e.target.value)}
                >
                  <MenuItem value=""><em>Select Location</em></MenuItem>
                  {locations.map((loc) => (
                    <MenuItem key={loc.id} value={loc.id}>
                      {loc.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Specific Location"
                placeholder="e.g., Room 305, Waiting Area"
                value={formData.specificLocation}
                onChange={(e) => handleChange('specificLocation', e.target.value)}
              />
            </Grid>

            {/* Person Involved */}
            <Grid size={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                  Person Involved *
                </FormLabel>
                <RadioGroup
                  row
                  value={formData.personInvolved}
                  onChange={(e) => handleChange('personInvolved', e.target.value)}
                >
                  {PERSON_INVOLVED_OPTIONS.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio />}
                      label={option.label}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Sentinel Event */}
            <Grid size={12}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: formData.isSentinelEvent
                    ? (theme) => alpha(theme.palette.error.main, 0.1)
                    : (theme) => alpha(theme.palette.divider, 0.5),
                  border: (theme) =>
                    `1px solid ${formData.isSentinelEvent
                      ? theme.palette.error.main
                      : theme.palette.divider
                    }`,
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isSentinelEvent}
                      onChange={(e) => handleChange('isSentinelEvent', e.target.checked)}
                      color="error"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" fontWeight={600}>
                        Is this a Sentinel Event?
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        A sentinel event is an unexpected occurrence involving death or serious
                        physical or psychological injury
                      </Typography>
                    </Box>
                  }
                />
                {formData.isSentinelEvent && (
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Sentinel Event Details"
                    value={formData.sentinelEventDetails}
                    onChange={(e) => handleChange('sentinelEventDetails', e.target.value)}
                    sx={{ mt: 2 }}
                  />
                )}
              </Box>
            </Grid>

            {/* Patient Information (shown if patient is involved) */}
            {formData.personInvolved === 'patient' && (
              <>
                <Grid size={12}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                    Patient Information
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Patient Name"
                    value={formData.patientName}
                    onChange={(e) => handleChange('patientName', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="MR #"
                    value={formData.patientMRN}
                    onChange={(e) => handleChange('patientMRN', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Age"
                    value={formData.patientAge}
                    onChange={(e) => handleChange('patientAge', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <FormControl fullWidth>
                    <InputLabel id="patient-sex-label">Sex</InputLabel>
                    <Select
                      labelId="patient-sex-label"
                      value={formData.patientSex}
                      onChange={(e) => handleChange('patientSex', e.target.value)}
                    >
                      <MenuItem value="">Select</MenuItem>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Unit / Ward"
                    value={formData.patientUnit}
                    onChange={(e) => handleChange('patientUnit', e.target.value)}
                  />
                </Grid>
              </>
            )}

            {/* Staff Involved (shown if staff is involved) */}
            {formData.personInvolved === 'staff' && (
              <>
                <Grid size={12}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ mt: 2 }}>
                    Staff Information
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Staff Name"
                    value={formData.staffInvolvedName}
                    onChange={(e) => handleChange('staffInvolvedName', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Position"
                    value={formData.staffPosition}
                    onChange={(e) => handleChange('staffPosition', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Employee ID #"
                    value={formData.staffEmployeeId}
                    onChange={(e) => handleChange('staffEmployeeId', e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <TextField
                    fullWidth
                    label="Department / Unit"
                    value={formData.staffDepartment}
                    onChange={(e) => handleChange('staffDepartment', e.target.value)}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </LocalizationProvider>

        {/* Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={onNext}
            disabled={!isValid()}
            size="large"
          >
            Next: Occurrence Details
          </Button>
        </Box>
      </Stack>
    </Paper>
  );
}
