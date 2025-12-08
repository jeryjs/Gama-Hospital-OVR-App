'use client';

import { AppLayout } from '@/components/AppLayout';
import TaxonomySelector from '@/components/incident-form/TaxonomySelector';
import { INJURY_OUTCOMES, PERSON_INVOLVED_OPTIONS } from '@/lib/constants';
import { CreateIncidentInput } from '@/lib/api/schemas';
import { useUsers } from '@/lib/hooks';
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
import { useCallback, useEffect, useState } from 'react';

// ============================================
// FORM DATA TYPE
// Alias to CreateIncidentInput for form handling with Dayjs conversions
// ============================================

type FormData = CreateIncidentInput & {
  occurrenceDate: Dayjs | undefined;
  occurrenceTime: Dayjs | undefined;
};

// ============================================
// CONSTANTS
// ============================================

const DRAFT_KEY = 'gh:draft:new';

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Initialize empty form data
 */
function getEmptyFormData(): FormData {
  // Heuristic defaults by key name. We intentionally avoid listing every key so
  // new fields added to FormData will still be initialised to a reasonable default.
  const defaultForKey = (k: string): unknown => {
    if (/Date$/i.test(k) || /Time$/i.test(k)) return dayjs();
    if (/^(is|has)/i.test(k) || /(Notified|SawPatient|SentinelEvent)$/i.test(k)) return false;
    if (/Age$/i.test(k)) return 0;
    if (/locationId$/i.test(k)) return undefined;
    if (/Id$/i.test(k)) return ''; // many "Id" fields are strings in the schema
    if (k === 'personInvolved') return 'patient';
    return '';
  };

  // Proxy to lazily create plain-object keys on first access so the initial render
  // sees all defaults without having to enumerate them manually.
  const target: Record<string, unknown> = {};
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(t, prop) {
      if (typeof prop === 'symbol') return Reflect.get(t, prop);
      const key = String(prop);
      if (!(key in t)) {
        t[key] = defaultForKey(key);
      }
      return t[key];
    },
  };

  const proxy = new Proxy(target, handler) as FormData;

  // Access a few commonly-used props to populate them eagerly (helps first render)
  (
    [
      'occurrenceDate',
      'occurrenceTime',
      'locationId',
      'personInvolved',
      'description',
    ] as const
  ).forEach((k) => void (proxy as any)[k]);

  return proxy;
}

/**
 * Parses JSON draft from localStorage with Dayjs conversion
 */
function parseDraftFromLocalStorage(draft: string): FormData {
  const parsed = JSON.parse(draft);
  return {
    ...parsed,
    occurrenceDate: parsed.occurrenceDate ? dayjs(parsed.occurrenceDate) : undefined,
    occurrenceTime: parsed.occurrenceTime ? dayjs(parsed.occurrenceTime) : undefined,
  };
}

/**
 * Parses JSON draft from server API with Dayjs conversion
 */
function parseDraftFromServer(data: Record<string, unknown>): FormData {
  return {
    ...data,
    occurrenceDate: data.occurrenceDate ? dayjs(data.occurrenceDate as string) : undefined,
    occurrenceTime: data.occurrenceTime ? dayjs(data.occurrenceTime as string, 'HH:mm:ss') : undefined,
  } as FormData;
}

/**
 * Converts FormData to API payload (Dayjs to string dates)
 */
function preparePayload(formData: FormData, isDraft: boolean) {
  return {
    ...formData,
    occurrenceDate: formData.occurrenceDate?.format('YYYY-MM-DD'),
    occurrenceTime: formData.occurrenceTime?.format('HH:mm:ss'),
    status: isDraft ? 'draft' : 'submitted',
  };
}

/**
 * Fetches locations from API
 */
async function fetchLocations(): Promise<Array<{ id: number; name: string }>> {
  try {
    const res = await fetch('/api/locations');
    if (res.ok) return await res.json();
    return [];
  } catch (error) {
    console.error('Error fetching locations:', error);
    return [];
  }
}

/**
 * Fetches draft from server
 */
async function fetchDraftFromServer(id: string): Promise<FormData | undefined> {
  try {
    const res = await fetch(`/api/incidents/${id}`);
    if (res.ok) {
      const data = await res.json();
      return parseDraftFromServer(data);
    }
    return undefined;
  } catch (error) {
    console.error('Failed to load draft from server:', error);
    return undefined;
  }
}

/**
 * Submits form data to API
 */
async function submitForm(
  formData: FormData,
  isDraft: boolean,
  draftId: string | null
): Promise<{ success: boolean; id?: string }> { // ID is now string
  try {
    const payload = preparePayload(formData, isDraft);
    const url = draftId ? `/api/incidents/${draftId}` : '/api/incidents';
    const method = draftId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return res.ok ? { success: true, id: draftId || data.id } : { success: false };
  } catch (error) {
    console.error('Error submitting:', error);
    return { success: false };
  }
}

// ============================================
// FORM FIELD COMPONENTS (Modular Sections)
// ============================================

/**
 * Occurrence Details Section
 */
function OccurrenceDetailsSection({
  formData,
  locations,
  onChange,
}: {
  formData: FormData;
  locations: Array<{ id: number; name: string }>;
  onChange: (key: keyof FormData, value: unknown) => void;
}) {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Header Section */}
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
            onChange={(date) => onChange('occurrenceDate', date)}
            slotProps={{ textField: { fullWidth: true, required: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TimePicker
            label="Occurrence Time *"
            value={formData.occurrenceTime}
            onChange={(time) => onChange('occurrenceTime', time)}
            slotProps={{ textField: { fullWidth: true, required: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Autocomplete
            options={locations}
            getOptionLabel={(option) => option.name}
            value={locations.find(l => l.id === formData.locationId)}
            onChange={(_, value) => onChange('locationId', value?.id)}
            renderInput={(params) => <TextField {...params} label="Location / Dept *" required />}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <TextField
            fullWidth
            label="Specific Location"
            value={formData.specificLocation}
            onChange={(e) => onChange('specificLocation', e.target.value)}
            placeholder="e.g., Room 305, Waiting Area, Corridor 2B"
          />
        </Grid>
      </Grid>
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="caption" fontWeight={600}>
          Do not file in the Medical Record
        </Typography>
      </Alert>
    </Box>
  );
}

/**
 * Person Involved & Sentinel Event Section
 */
function PersonInvolvedSection({
  formData,
  onChange,
}: {
  formData: FormData;
  onChange: (key: keyof FormData, value: unknown) => void;
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend">Person Involved *</FormLabel>
            <RadioGroup
              value={formData.personInvolved}
              onChange={(e) => onChange('personInvolved', e.target.value)}
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
                  checked={formData.isSentinelEvent || undefined}
                  onChange={(e) => onChange('isSentinelEvent', e.target.checked)}
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
                onChange={(e) => onChange('sentinelEventDetails', e.target.value)}
                sx={{ mt: 1 }}
              />
            )}
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
}

/**
 * Dynamic Person Details Fields (renders based on personInvolved type)
 */
function PersonDetailsFields({
  formData,
  onChange,
}: {
  formData: FormData;
  onChange: (key: keyof FormData, value: unknown) => void;
}) {
  const type = formData.personInvolved;
  const isPatient = type === 'patient';
  const isStaff = type === 'staff';
  const isVisitorOrOther = type === 'visitor_watcher' || type === 'others';
  const isNotStaff = type !== 'staff';

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        gutterBottom
        sx={{
          bgcolor: (theme) => alpha(
            isStaff ? theme.palette.warning.main : theme.palette.primary.main,
            0.1
          ),
          p: 1,
          borderRadius: 1
        }}
      >
        {isPatient && 'Patient Information'}
        {isStaff && 'Staff Involved Details'}
        {type === 'visitor_watcher' && 'Visitor/Watcher Information'}
        {type === 'others' && 'Person Involved Details'}
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Name - All types */}
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            fullWidth
            label={`${type === 'patient' ? 'Patient' : isStaff ? 'Staff' : 'Person'} Name *`}
            value={formData.involvedPersonName}
            onChange={(e) => onChange('involvedPersonName', e.target.value)}
            required
          />
        </Grid>

        {/* MRN - Patient only */}
        {isPatient && (
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="MR # *"
              value={formData.involvedPersonMRN}
              onChange={(e) => onChange('involvedPersonMRN', e.target.value)}
              required
            />
          </Grid>
        )}

        {/* Employee ID & Position - Staff only */}
        {isStaff && (
          <>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Employee ID #"
                value={formData.involvedPersonEmployeeId}
                onChange={(e) => onChange('involvedPersonEmployeeId', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Position"
                value={formData.involvedPersonPosition}
                onChange={(e) => onChange('involvedPersonPosition', e.target.value)}
              />
            </Grid>
          </>
        )}

        {/* Relation & Contact - Visitor/Others only */}
        {isVisitorOrOther && (
          <>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Relation to Patient"
                value={formData.involvedPersonRelation}
                onChange={(e) => onChange('involvedPersonRelation', e.target.value)}
                placeholder={type === 'visitor_watcher' ? 'e.g., Family member, Friend' : 'e.g., Contractor, Vendor'}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Contact Information"
                value={formData.involvedPersonContact}
                onChange={(e) => onChange('involvedPersonContact', e.target.value)}
                placeholder="Phone number or email"
              />
            </Grid>
          </>
        )}

        {/* Age & Sex - All except Staff */}
        {isNotStaff && (
          <>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Age"
                type="number"
                value={formData.involvedPersonAge || ''}
                onChange={(e) => onChange('involvedPersonAge', Number(e.target.value) || 0)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Sex"
                select
                SelectProps={{ native: true }}
                value={formData.involvedPersonSex}
                onChange={(e) => onChange('involvedPersonSex', e.target.value)}
              >
                <option value=""></option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </TextField>
            </Grid>
          </>
        )}

        {/* Unit/Department - Patient and Staff only */}
        {(isPatient || isStaff) && (
          <Grid size={{ xs: 12, md: isStaff ? 6 : 4 }}>
            <TextField
              fullWidth
              label={isPatient ? 'Unit / Ward' : 'Department / Unit'}
              value={formData.involvedPersonUnit}
              onChange={(e) => onChange('involvedPersonUnit', e.target.value)}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}

/**
 * Classification & Description Section
 */
function ClassificationSection({
  formData,
  onChange,
}: {
  formData: FormData;
  onChange: (key: keyof FormData, value: unknown) => void;
}) {
  const MAX_CHARS = 999;
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        gutterBottom
        sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1), p: 1, borderRadius: 1 }}
      >
        Classification of Occurrence
      </Typography>
      <Box sx={{ mt: 2 }}>
        <TaxonomySelector
          categoryValue={formData.occurrenceCategory}
          subcategoryValue={formData.occurrenceSubcategory}
          detailValue={formData.occurrenceDetail || ''}
          onChange={useCallback((cat: string, subcat: string, det: string) => {
            onChange('occurrenceCategory', cat);
            onChange('occurrenceSubcategory', subcat);
            onChange('occurrenceDetail', det);
          }, [onChange])}
          required
        />
      </Box>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12 }}>
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Description of Occurrence / Variance *"
              value={formData.description.slice(0, MAX_CHARS) || ''}
              onChange={(e) => onChange('description', e.target.value)}
              required
              placeholder="Please provide a detailed description of what occurred..."
              helperText="Please ensure the appropriate classification of Occurrence is selected above."
            />
            <Typography
              variant="caption"
              sx={{ position: 'absolute', bottom: 8, right: 8, color: 'text.secondary', fontSize: '0.75rem' }}
            >
              {MAX_CHARS - (formData.description?.length || 0)}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

/**
 * Witness Information Section
 */
function WitnessSection({
  formData,
  onChange,
}: {
  formData: FormData;
  onChange: (key: keyof FormData, value: unknown) => void;
}) {
  const MAX_CHARS = 999;
  const witnessFields = [
    { key: 'witnessName', label: 'Witness Name' },
    { key: 'witnessDepartment', label: 'Department / Position' },
    { key: 'witnessEmployeeId', label: 'Employee ID #' },
  ] as const;

  const isAccountValid = formData.witnessAccount && formData.witnessAccount.length >= 10;

  return (
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
          <Box sx={{ position: 'relative' }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Witness Account"
              placeholder='Information from anyone else who witnessed the incident'
              value={formData.witnessAccount?.slice(0, MAX_CHARS) || ''}
              helperText={(isAccountValid || (formData.witnessAccount || '')?.length == 0) ? '' : 'Please provide at least 10 characters for the witness account.'}
              onChange={(e) => onChange('witnessAccount', e.target.value)}
            />
            <Typography
              variant="caption"
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                color: 'text.secondary',
                fontSize: '0.75rem',
              }}
            >
              {MAX_CHARS - (formData.witnessAccount?.length || 0)}
            </Typography>
          </Box>
        </Grid>
        {witnessFields.map((field) => (
          <Grid key={field.key} size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label={field.label}
              value={formData[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
              disabled={!isAccountValid}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

/**
 * Immediate Actions Section (previously Medical Assessment)
 * Includes physician notification and supervisor notification
 */
function ImmediateActionsSection({
  formData,
  onChange,
}: {
  formData: FormData;
  onChange: (key: keyof FormData, value: unknown) => void;
}) {
  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        gutterBottom
        sx={{ bgcolor: (theme) => alpha(theme.palette.success.main, 0.1), p: 1, borderRadius: 1 }}
      >
        Immediate Actions
      </Typography>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Physician Notification Subsection */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="body2" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
            Physician Notification
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.physicianNotified || undefined}
                onChange={(e) => {
                  if (!e.target.checked) {
                    if (formData.assessment !== '' && !confirm('This will clear all entered physician information. Are you sure?')) {
                      return;
                    }
                    onChange('physicianSawPatient', false);
                    onChange('assessment', '');
                    onChange('injuryOutcome', '');
                    onChange('physicianName', '');
                    onChange('treatmentProvided', '');
                    onChange('physicianId', '');
                  }
                  onChange('physicianNotified', e.target.checked);
                }}
              />
            }
            label="Physician Notified?"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} hidden={!formData.physicianNotified}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.physicianSawPatient || undefined}
                onChange={(e) => onChange('physicianSawPatient', e.target.checked)}
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
                onChange={(e) => onChange('assessment', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                select
                SelectProps={{ native: true }}
                label="Injury Outcome"
                value={formData.injuryOutcome}
                onChange={(e) => onChange('injuryOutcome', e.target.value)}
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
                onChange={(e) => onChange('physicianName', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Treatment Provided"
                value={formData.treatmentProvided}
                onChange={(e) => onChange('treatmentProvided', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Physician ID #"
                value={formData.physicianId}
                onChange={(e) => onChange('physicianId', e.target.value)}
              />
            </Grid>
          </>
        )}

        {/* Supervisor Notification Subsection */}
        <Grid size={{ xs: 12 }}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Supervisor Notification
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.supervisorNotified || undefined}
                onChange={(e) => onChange('supervisorNotified', e.target.checked)}
              />
            }
            label="Was Supervisor Notified?"
          />
        </Grid>

        {formData.supervisorNotified && (
          <>
            <Grid size={{ xs: 12, md: 6 }}>
              <SupervisorSelector
                value={formData.supervisorId || undefined}
                onChange={(value) => onChange('supervisorId', value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Supervisor Action Taken"
                placeholder="Describe what action the supervisor took..."
                value={formData.supervisorAction}
                onChange={(e) => onChange('supervisorAction', e.target.value)}
              />
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}

/**
 * Supervisor Selector Component
 * Fetches and displays list of supervisors
 */
function SupervisorSelector({
  value,
  onChange,
}: {
  value: string | number | undefined;
  onChange: (value: number) => void;
}) {
  const { users, isError } = useUsers({ role: 'supervisor' });

  if (isError) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Failed to load supervisors. Please try again.
      </Alert>
    );
  }

  return (
    <Autocomplete
      options={users}
      getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
      value={users.find((u: any) => u.id === Number(value)) || null}
      onChange={(_, newValue) => {
        if (newValue) {
          onChange(newValue.id);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Select Supervisor *"
          placeholder="Search by name or employee ID..."
        />
      )}
      isOptionEqualToValue={(option, value) => option.id === value?.id}
    />
  );
}

/**
 * Footer Section
 */
function FooterSection() {
  return (
    <Box sx={{ mt: 4, p: 2, bgcolor: (theme) => alpha(theme.palette.warning.main, 0.05), borderRadius: 1 }}>
      <Typography variant="caption" color="text.secondary">
        <strong>important Notes:</strong>
        <br />• Completing this form does not constitute an admission of liability on any kind, on any person.
        <br />• Record only known facts; Brief explanation of the occurrence without comment or conclusion.
        <br />• For Confidentiality reason, NO OTHER COPIES SHOULD BE PRODUCED EXCEPT THIS.
        <br />• This form complies with CBAHI standards and PDPL (Royal Decree No. M/19 - 2023) for patient data protection.
      </Typography>
    </Box>
  );
}

/**
 * Form Header
 */
function FormHeader({
  draftLoaded,
  onClearDraft,
}: {
  draftLoaded: boolean;
  onClearDraft: () => void;
}) {
  return (
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
            onClick={onClearDraft}
          >
            Clear Draft
          </Button>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, textAlign: 'center' }}>
            Start fresh
          </Typography>
        </Box>
      )}
    </Stack>
  );
}

/**
 * OVR Header Section (Title & Confidential Badge)
 */
function OVRHeaderSection() {
  return (
    <>
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
    </>
  );
}

/**
 * Form Actions (Submit Buttons)
 */
function FormActions({
  loading,
  onSaveDraft,
  onSubmit,
}: {
  loading: boolean;
  onSaveDraft: () => void;
  onSubmit: () => void;
}) {
  return (
    <>
      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<Save />}
          onClick={onSaveDraft}
          disabled={loading}
        >
          Save as Draft
        </Button>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={onSubmit}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </Button>
      </Stack>

      {loading && <LinearProgress sx={{ mt: 2 }} />}
    </>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function NewIncidentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draft');

  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<Array<{ id: number; name: string }>>([]);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [formData, setFormData] = useState<FormData>(getEmptyFormData());

  // Initialize draft on mount
  useEffect(() => {
    (async () => {
      if (draftId) {
        const draft = await fetchDraftFromServer(draftId);
        if (draft) setFormData(draft);
      } else {
        const draft = localStorage.getItem(DRAFT_KEY);
        if (draft) {
          try {
            setFormData(parseDraftFromLocalStorage(draft));
          } catch (e) {
            console.error('Failed to load draft:', e);
          }
        }
      }
      setDraftLoaded(true);
    })();

    (async () => {
      const locs = await fetchLocations();
      setLocations(locs);
    })();
  }, [draftId]);

  // Auto-save to localStorage with debounce
  useEffect(() => {
    if (!draftLoaded) return;

    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, draftLoaded]);

  // Handle field changes
  const handleChange = useCallback((key: keyof FormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Clear draft
  const handleClearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setFormData(getEmptyFormData());
    setDraftLoaded(false);
  }, []);

  // Submit handler
  const handleSubmit = async (isDraft: boolean) => {
    setLoading(true);
    const result = await submitForm(formData, isDraft, draftId);

    if (result.success) {
      localStorage.removeItem(DRAFT_KEY);
      router.replace(`/incidents/view/${result.id}`);
    } else {
      alert('Failed to submit report');
    }

    setLoading(false);
  };

  return (
    <AppLayout>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FormHeader draftLoaded={draftLoaded} onClearDraft={handleClearDraft} />

            <Paper
              sx={{
                p: 4,
                border: (theme) => `2px solid ${theme.palette.divider}`,
              }}
            >
              <OVRHeaderSection />

              <OccurrenceDetailsSection
                formData={formData}
                locations={locations}
                onChange={handleChange}
              />

              <PersonInvolvedSection formData={formData} onChange={handleChange} />

              <PersonDetailsFields formData={formData} onChange={handleChange} />

              <ClassificationSection formData={formData} onChange={handleChange} />

              <WitnessSection formData={formData} onChange={handleChange} />

              <ImmediateActionsSection formData={formData} onChange={handleChange} />

              <Divider sx={{ my: 3 }} />

              <FormActions
                loading={loading}
                onSaveDraft={() => handleSubmit(true)}
                onSubmit={() => handleSubmit(false)}
              />

              <Box sx={{ mb: 4 }}>
                <Alert severity="warning" sx={{ mt: 2 }}>
                  <Typography variant="caption">
                    Thank you for reporting! Upon submitting, this OVR will be sent to QI DEPARTMENT and from there, it will be sent to the concerned Department Head
                  </Typography>
                </Alert>
              </Box>

              <FooterSection />
            </Paper>
          </motion.div>
        </Box>
      </LocalizationProvider>
    </AppLayout>
  );
}