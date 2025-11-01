'use client';

import { AppLayout } from '@/components/AppLayout';
import { INJURY_OUTCOMES, OVR_CATEGORIES, PERSON_INVOLVED_OPTIONS } from '@/lib/ovr-categories';
import { ArrowBack, Save, Send } from '@mui/icons-material';
import {
  Alert,
  alpha,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { DatePicker, LocalizationProvider, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface FormData {
  // Patient Information
  patientName: string;
  patientMRN: string;
  patientAge: number;
  patientSex: string;
  patientUnit: string;

  // Occurrence Details
  occurrenceDate: Dayjs | null;
  occurrenceTime: Dayjs | null;
  locationId: number | null;
  specificLocation: string;

  // Person Involved
  personInvolved: string;
  isSentinelEvent: boolean;
  sentinelEventDetails: string;

  // Staff Involved (if applicable)
  staffInvolvedName: string;
  staffInvolvedPosition: string;
  staffInvolvedEmployeeId: string;
  staffInvolvedDepartment: string;

  // Incident Classification
  occurrenceCategory: string;
  occurrenceSubcategory: string;

  // Description
  description: string;

  // Witness
  witnessName: string;
  witnessAccount: string;
  witnessDepartment: string;
  witnessPosition: string;
  witnessEmployeeId: string;

  // Medical Assessment
  physicianNotified: boolean;
  physicianSawPatient: boolean;
  assessment: string;
  diagnosis: string;
  injuryOutcome: string;
  treatmentProvided: string;
  physicianName: string;
  physicianId: string;

  // Supervisor
  supervisorAction: string;
}

const DRAFT_KEY = 'gh:draft:new';

export default function NewIncidentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draft');

  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    patientName: '',
    patientMRN: '',
    patientAge: 0,
    patientSex: '',
    patientUnit: '',
    occurrenceDate: null,
    occurrenceTime: null,
    locationId: null,
    specificLocation: '',
    personInvolved: 'patient',
    isSentinelEvent: false,
    sentinelEventDetails: '',
    staffInvolvedName: '',
    staffInvolvedPosition: '',
    staffInvolvedEmployeeId: '',
    staffInvolvedDepartment: '',
    occurrenceCategory: '',
    occurrenceSubcategory: '',
    description: '',
    witnessName: '',
    witnessAccount: '',
    witnessDepartment: '',
    witnessPosition: '',
    witnessEmployeeId: '',
    physicianNotified: false,
    physicianSawPatient: false,
    assessment: '',
    diagnosis: '',
    injuryOutcome: '',
    treatmentProvided: '',
    physicianName: '',
    physicianId: '',
    supervisorAction: '',
  });

  // Initialize draft on mount
  useEffect(() => {
    // If editing existing draft from URL
    if (draftId) {
      fetchDraftFromServer(draftId);
    } else {
      // Load from localStorage
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        try {
          const parsed = JSON.parse(draft);
          setFormData({
            ...parsed,
            occurrenceDate: parsed.occurrenceDate ? dayjs(parsed.occurrenceDate) : null,
            occurrenceTime: parsed.occurrenceTime ? dayjs(parsed.occurrenceTime) : null,
          });
          setDraftLoaded(true);
        } catch (e) {
          console.error('Failed to load draft:', e);
        }
      }
    }
    fetchLocations();
  }, [draftId]);

  const fetchDraftFromServer = async (id: string) => {
    try {
      const res = await fetch(`/api/incidents/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          patientName: data.patientName || '',
          patientMRN: data.patientMRN || '',
          patientAge: data.patientAge || 0,
          patientSex: data.patientSex || '',
          patientUnit: data.patientUnit || '',
          occurrenceDate: data.occurrenceDate ? dayjs(data.occurrenceDate) : null,
          occurrenceTime: data.occurrenceTime ? dayjs(data.occurrenceTime, 'HH:mm:ss') : null,
          locationId: data.locationId,
          specificLocation: data.specificLocation || '',
          personInvolved: data.personInvolved || 'patient',
          isSentinelEvent: data.isSentinelEvent || false,
          sentinelEventDetails: data.sentinelEventDetails || '',
          staffInvolvedName: data.staffInvolvedName || '',
          staffInvolvedPosition: data.staffInvolvedPosition || '',
          staffInvolvedEmployeeId: data.staffInvolvedEmployeeId || '',
          staffInvolvedDepartment: data.staffInvolvedDepartment || '',
          occurrenceCategory: data.occurrenceCategory || '',
          occurrenceSubcategory: data.occurrenceSubcategory || '',
          description: data.description || '',
          witnessName: data.witnessName || '',
          witnessAccount: data.witnessAccount || '',
          witnessDepartment: data.witnessDepartment || '',
          witnessPosition: data.witnessPosition || '',
          witnessEmployeeId: data.witnessEmployeeId || '',
          physicianNotified: data.physicianNotified || false,
          physicianSawPatient: data.physicianSawPatient || false,
          assessment: data.assessment || '',
          diagnosis: data.diagnosis || '',
          injuryOutcome: data.injuryOutcome || '',
          treatmentProvided: data.treatmentProvided || '',
          physicianName: data.physicianName || '',
          physicianId: data.physicianId || '',
          supervisorAction: data.supervisorAction || '',
        });
        setDraftLoaded(true);
      }
    } catch (error) {
      console.error('Failed to load draft from server:', error);
    }
  };

  // Auto-save to localStorage
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData]);

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

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData({
      patientName: '',
      patientMRN: '',
      patientAge: 0,
      patientSex: '',
      patientUnit: '',
      occurrenceDate: null,
      occurrenceTime: null,
      locationId: null,
      specificLocation: '',
      personInvolved: 'patient',
      isSentinelEvent: false,
      sentinelEventDetails: '',
      staffInvolvedName: '',
      staffInvolvedPosition: '',
      staffInvolvedEmployeeId: '',
      staffInvolvedDepartment: '',
      occurrenceCategory: '',
      occurrenceSubcategory: '',
      description: '',
      witnessName: '',
      witnessAccount: '',
      witnessDepartment: '',
      witnessPosition: '',
      witnessEmployeeId: '',
      physicianNotified: false,
      physicianSawPatient: false,
      assessment: '',
      diagnosis: '',
      injuryOutcome: 'no_injury',
      treatmentProvided: '',
      physicianName: '',
      physicianId: '',
      supervisorAction: '',
    });
    setDraftLoaded(false);
  };

  const handleSubmit = async (isDraft: boolean) => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        occurrenceDate: formData.occurrenceDate?.format('YYYY-MM-DD'),
        occurrenceTime: formData.occurrenceTime?.format('HH:mm:ss'),
        status: isDraft ? 'draft' : 'submitted',
      };

      const url = draftId ? `/api/incidents/${draftId}` : '/api/incidents';
      const method = draftId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        localStorage.removeItem(DRAFT_KEY);
        router.replace(`/incidents/view/${draftId || data.id}`);
      } else {
        alert('Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = OVR_CATEGORIES.find(cat => cat.id === formData.occurrenceCategory);

  return (
    <AppLayout>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
              <Button
                component={Link}
                href="/incidents"
                startIcon={<ArrowBack />}
                variant="outlined"
              >
                Back
              </Button>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" fontWeight={700}>
                  New Report
                </Typography>
                {draftLoaded && (
                  <Typography variant="caption" color="text.secondary">
                    Loaded from draft
                  </Typography>
                )}
              </Box>
              {draftLoaded && (
                <Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleClearDraft}
                  >
                    Clear Draft
                  </Button>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, textAlign: 'center' }}>
                    Start fresh
                  </Typography>
                </Box>
              )}
            </Stack>

            {/* Main Form */}
            <Paper
              sx={{
                p: 4,
                border: (theme) => `2px solid ${theme.palette.divider}`,
              }}
            >
              {/* Header Section */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="h6" fontWeight={700}>
                    Gama Hospital
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    مستشفى جاما
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight={700}>
                    OCCURRENCE VARIANCE REPORT (OVR)
                  </Typography>
                  <Typography variant="caption">GH 012 A</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Paper
                    variant="outlined"
                    sx={{ p: 1, textAlign: 'center', bgcolor: (theme) => alpha(theme.palette.error.main, 0.1) }}
                  >
                    <Typography variant="subtitle2" fontWeight={700}>
                      CONFIDENTIAL
                    </Typography>
                    <Typography variant="caption">
                      Reference No: (for QIPS use only)
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Patient Information */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  gutterBottom
                  sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), p: 1, borderRadius: 1 }}
                >
                  Patient Information
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="Patient Name *"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      label="MR # *"
                      value={formData.patientMRN}
                      onChange={(e) => setFormData({ ...formData, patientMRN: e.target.value })}
                      required
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Age"
                      type="number"
                      value={formData.patientAge}
                      onChange={(e) => setFormData({ ...formData, patientAge: Number(e.target.value) })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Sex"
                      select
                      SelectProps={{ native: true }}
                      value={formData.patientSex}
                      onChange={(e) => setFormData({ ...formData, patientSex: e.target.value })}
                    >
                      <option value=""></option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Unit / Ward"
                      value={formData.patientUnit}
                      onChange={(e) => setFormData({ ...formData, patientUnit: e.target.value })}
                    />
                  </Grid>
                </Grid>
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="caption" fontWeight={600}>
                    Do not file in the Medical Record
                  </Typography>
                </Alert>
              </Box>

              {/* Occurrence Details */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  gutterBottom
                  sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), p: 1, borderRadius: 1 }}
                >
                  Occurrence Details
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <DatePicker
                      label="Occurrence Date *"
                      value={formData.occurrenceDate}
                      onChange={(date) => setFormData({ ...formData, occurrenceDate: date })}
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TimePicker
                      label="Occurrence Time *"
                      value={formData.occurrenceTime}
                      onChange={(time) => setFormData({ ...formData, occurrenceTime: time })}
                      slotProps={{ textField: { fullWidth: true, required: true } }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Autocomplete
                      options={locations}
                      getOptionLabel={(option) => option.name}
                      value={locations.find(l => l.id === formData.locationId) || null}
                      onChange={(_, value) => setFormData({ ...formData, locationId: value?.id || null })}
                      renderInput={(params) => <TextField {...params} label="Location / Dept *" required />}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      label="Specific Location"
                      value={formData.specificLocation}
                      onChange={(e) => setFormData({ ...formData, specificLocation: e.target.value })}
                      placeholder="e.g., Room 305, Waiting Area, Corridor 2B"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Person Involved & Sentinel Event */}
              <Box sx={{ mb: 4 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl component="fieldset">
                      <FormLabel component="legend">Person Involved *</FormLabel>
                      <RadioGroup
                        value={formData.personInvolved}
                        onChange={(e) => setFormData({ ...formData, personInvolved: e.target.value })}
                      >
                        {PERSON_INVOLVED_OPTIONS.map(option => (
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
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControl component="fieldset">
                      <FormLabel component="legend">SENTINEL EVENT</FormLabel>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.isSentinelEvent}
                            onChange={(e) => setFormData({ ...formData, isSentinelEvent: e.target.checked })}
                          />
                        }
                        label="Yes, this is a sentinel event"
                      />
                      {formData.isSentinelEvent && (
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Please specify"
                          value={formData.sentinelEventDetails}
                          onChange={(e) => setFormData({ ...formData, sentinelEventDetails: e.target.value })}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </FormControl>
                  </Grid>
                </Grid>
              </Box>

              {/* Staff Involved (conditional) */}
              {formData.personInvolved === 'staff' && (
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="subtitle1"
                    fontWeight={700}
                    gutterBottom
                    sx={{ bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1), p: 1, borderRadius: 1 }}
                  >
                    Staff Involved Details
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Name of Staff Involved"
                        value={formData.staffInvolvedName}
                        onChange={(e) => setFormData({ ...formData, staffInvolvedName: e.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Position"
                        value={formData.staffInvolvedPosition}
                        onChange={(e) => setFormData({ ...formData, staffInvolvedPosition: e.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="ID #"
                        value={formData.staffInvolvedEmployeeId}
                        onChange={(e) => setFormData({ ...formData, staffInvolvedEmployeeId: e.target.value })}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField
                        fullWidth
                        label="Dept / Unit"
                        value={formData.staffInvolvedDepartment}
                        onChange={(e) => setFormData({ ...formData, staffInvolvedDepartment: e.target.value })}
                      />
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Classification & Description */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  gutterBottom
                  sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), p: 1, borderRadius: 1 }}
                >
                  Classification of Occurrence
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      select
                      SelectProps={{ native: true }}
                      label="Category *"
                      value={formData.occurrenceCategory}
                      onChange={(e) => setFormData({ ...formData, occurrenceCategory: e.target.value, occurrenceSubcategory: '' })}
                      required
                    >
                      <option value=""></option>
                      {OVR_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TextField
                      fullWidth
                      select
                      SelectProps={{ native: true }}
                      label="Subcategory *"
                      value={formData.occurrenceSubcategory}
                      onChange={(e) => setFormData({ ...formData, occurrenceSubcategory: e.target.value })}
                      required
                      disabled={!formData.occurrenceCategory}
                    >
                      <option value=""></option>
                      {selectedCategory?.subcategories.map(sub => (
                        <option key={sub.id} value={sub.id}>{sub.label}</option>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      label="Description of Occurrence / Variance *"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      placeholder="Please provide a detailed description of what occurred..."
                      helperText="Please select the appropriate classification of Occurrence at the reverse side"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Witness Information */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  gutterBottom
                  sx={{ bgcolor: (theme) => alpha(theme.palette.info.main, 0.1), p: 1, borderRadius: 1 }}
                >
                  Witness Information (Optional)
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Witness Account"
                      value={formData.witnessAccount}
                      onChange={(e) => setFormData({ ...formData, witnessAccount: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Witness Name"
                      value={formData.witnessName}
                      onChange={(e) => setFormData({ ...formData, witnessName: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Department / Position"
                      value={formData.witnessDepartment}
                      onChange={(e) => setFormData({ ...formData, witnessDepartment: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <TextField
                      fullWidth
                      label="Employee ID #"
                      value={formData.witnessEmployeeId}
                      onChange={(e) => setFormData({ ...formData, witnessEmployeeId: e.target.value })}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Medical Assessment */}
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  gutterBottom
                  sx={{ bgcolor: (theme) => alpha(theme.palette.success.main, 0.1), p: 1, borderRadius: 1 }}
                >
                  Medical Assessment
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.physicianNotified}
                          onChange={(e) => setFormData({ ...formData, physicianNotified: e.target.checked })}
                        />
                      }
                      label="Physician Notified?"
                    />
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.physicianSawPatient}
                          onChange={(e) => setFormData({ ...formData, physicianSawPatient: e.target.checked })}
                        />
                      }
                      label="Did Physician See the Patient?"
                    />
                  </Grid>

                  {formData.physicianSawPatient && (
                    <>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Assessment / Diagnosis"
                          value={formData.assessment}
                          onChange={(e) => setFormData({ ...formData, assessment: e.target.value })}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          select
                          SelectProps={{ native: true }}
                          label="Injury Outcome"
                          value={formData.injuryOutcome}
                          onChange={(e) => setFormData({ ...formData, injuryOutcome: e.target.value })}
                        >
                          <option value=""></option>
                          {INJURY_OUTCOMES.map(outcome => (
                            <option key={outcome.value} value={outcome.value}>{outcome.label}</option>
                          ))}
                        </TextField>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Physician Name"
                          value={formData.physicianName}
                          onChange={(e) => setFormData({ ...formData, physicianName: e.target.value })}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Treatment Provided"
                          value={formData.treatmentProvided}
                          onChange={(e) => setFormData({ ...formData, treatmentProvided: e.target.value })}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          fullWidth
                          label="Physician ID #"
                          value={formData.physicianId}
                          onChange={(e) => setFormData({ ...formData, physicianId: e.target.value })}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </Box>

              {/* Supervisor Action */}
              <Box sx={{ mb: 4 }}>
                {/* <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  gutterBottom
                  sx={{ bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1), p: 1, borderRadius: 1 }}
                >
                  Immediate Supervisor / Manager's Action
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Supervisor Action"
                      value={formData.supervisorAction}
                      onChange={(e) => setFormData({ ...formData, supervisorAction: e.target.value })}
                      placeholder="Immediate action taken by supervisor..."
                    />
                  </Grid>
                </Grid> */}
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    Thank you for reporting! Kindly send this OVR to QI DEPARTMENT and from there, it will be sent to the concerned Department Head
                  </Typography>
                </Alert>
              </Box>

              {/* Form Actions */}
              <Divider sx={{ my: 3 }} />
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  startIcon={<Save />}
                  onClick={() => handleSubmit(true)}
                  disabled={loading}
                >
                  Save as Draft
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Send />}
                  onClick={() => handleSubmit(false)}
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Button>
              </Stack>

              {/* Footer Note */}
              <Box sx={{ mt: 4, p: 2, bgcolor: (theme) => alpha(theme.palette.warning.main, 0.05), borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  <strong>important Notes:</strong>
                  <br />• Completing this form does not constitute an admission of liability on any kind, on any person.
                  <br />• Record only known facts; Brief explanation of the occurrence without comment or conclusion.
                  <br />• For Confidentiality reason, NO OTHER COPIES SHOULD BE PRODUCED EXCEPT THIS.
                  <br />• This form complies with CBAHI standards and PDPL (Royal Decree No. M/19 - 2023) for patient data protection.
                </Typography>
              </Box>
            </Paper>

            {loading && <LinearProgress sx={{ mt: 2 }} />}
          </motion.div>
        </Box>
      </LocalizationProvider>
    </AppLayout>
  );
}
