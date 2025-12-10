'use client';

import { AppLayout } from '@/components/AppLayout';
import TaxonomySelector from '@/components/incident-form/TaxonomySelector';
import { PeoplePicker } from '@/components/shared';
import type { UserSearchResult, DepartmentWithLocations } from '@/lib/api/schemas';
import { useDepartmentsWithLocations } from '@/lib/hooks';
import {
  INJURY_OUTCOMES,
  PERSON_INVOLVED_OPTIONS,
  TREATMENT_TYPES,
  MEDICATION_HARM_LEVELS,
  GENERAL_HARM_LEVELS,
  getHarmLevelsForCategory,
  RISK_IMPACT_LEVELS,
  RISK_LIKELIHOOD_LEVELS,
  RISK_MATRIX,
  RISK_LEVELS,
  calculateRiskScore,
  getRiskLevel,
  SENTINEL_EVENTS,
} from '@/lib/constants';
import { CreateIncidentInput } from '@/lib/api/schemas';
import { ArrowBack, Save, Send, Person } from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import {
  Alert,
  alpha,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
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
import { useRouter } from 'next/navigation';
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
 * Location option type for Autocomplete with department grouping
 */
interface LocationOption {
  id: number;
  name: string;
  departmentId: number;
  departmentName: string;
}

/**
 * Converts departments with locations to flat location options
 */
function flattenLocations(departments: DepartmentWithLocations[]): LocationOption[] {
  return departments.flatMap(dept =>
    (dept.locations || []).map(loc => ({
      id: loc.id,
      name: loc.name,
      departmentId: dept.id,
      departmentName: dept.name,
    }))
  );
}

/**
 * Occurrence Details Section
 */
function OccurrenceDetailsSection({
  formData,
  departments,
  onChange,
}: {
  formData: FormData;
  departments: DepartmentWithLocations[];
  onChange: (key: keyof FormData, value: unknown) => void;
}) {
  const locations = flattenLocations(departments);
  const selectedLocation = locations.find(l => l.id === formData.locationId) || null;

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
            groupBy={(option) => option.departmentName}
            getOptionLabel={(option) => option.name}
            value={selectedLocation}
            onChange={(_, value) => onChange('locationId', value?.id)}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            renderInput={(params) => <TextField {...params} label="Location / Dept *" required />}
            renderGroup={(params) => (
              <li key={params.key}>
                <Typography
                  component="div"
                  sx={{
                    position: 'sticky',
                    top: -8,
                    px: 2,
                    py: 1,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  {params.group}
                </Typography>
                <ul style={{ padding: 0 }}>{params.children}</ul>
              </li>
            )}
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
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <FormLabel component="legend">SENTINEL EVENT</FormLabel>
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!formData.isSentinelEvent}
                  onChange={(e) => onChange('isSentinelEvent', e.target.checked)}
                />
              }
              label="Yes, this is a sentinel event"
            />
            {formData.isSentinelEvent && (
              <Autocomplete
                options={
                  SENTINEL_EVENTS.flatMap(group =>
                    group.events.map(event => ({
                      value: event.value,
                      label: `${group.category} → ${event.label}`,
                    }))
                  )
                }
                getOptionLabel={option => option.label}
                value={
                  SENTINEL_EVENTS
                    .flatMap(group => group.events)
                    .find(event => event.value === formData.sentinelEventDetails)
                    ? {
                      value: formData.sentinelEventDetails,
                      label:
                        SENTINEL_EVENTS.flatMap(group =>
                          group.events.map(event => ({
                            value: event.value,
                            label: `${group.category} → ${event.label}`,
                          }))
                        ).find(e => e.value === formData.sentinelEventDetails)?.label || '',
                    }
                    : null
                }
                onChange={(_, value) => onChange('sentinelEventDetails', value?.value || '')}
                renderInput={params => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Specify Sentinel Event"
                    sx={{ mt: 1 }}
                  />
                )}
                isOptionEqualToValue={(option, value) => option.value === value?.value}
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
          <Box sx={{ display: 'flex', gap: 2, flex: '1' }}>
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={formData.involvedPersonAge || ''}
              onChange={(e) => onChange('involvedPersonAge', Number(e.target.value) || 0)}
            />
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
          </Box>
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

        {/* Level of Harm - Conditional based on category */}
        <Grid size={{ xs: 12 }}>
          <Autocomplete
            fullWidth
            options={[...getHarmLevelsForCategory(formData.occurrenceCategory)]}
            getOptionLabel={(option) => option.label}
            value={
              getHarmLevelsForCategory(formData.occurrenceCategory).find(
                (level) => level.value === formData.levelOfHarm
              ) || null
            }
            onChange={(_, value) => onChange('levelOfHarm', value?.value || '')}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Level of Harm *"
                required
                helperText={
                  formData.occurrenceCategory === 'CAT019'
                    ? 'Select medication error severity level (NCC MERP Index)'
                    : 'Select the level of harm to the patient or person involved'
                }
              />
            )}
            isOptionEqualToValue={(option, value) => option.value === value?.value}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

/**
 * Immediate Actions Section
 * Layout matches PDF - all fields visible (not hidden behind checkboxes)
 */
function ImmediateActionsSection({
  formData,
  onChange,
}: {
  formData: FormData;
  onChange: (key: keyof FormData, value: unknown) => void;
}) {
  // Wrap onChange to handle confirm logic for clearing fields
  const handleChange = (key: keyof FormData, value: unknown) => {
    // Confirm before clearing physician details
    if (
      key === 'physicianNotified' &&
      value === false &&
      (formData.physicianName || formData.physicianId)
    ) {
      if (!window.confirm('Changing this will clear entered physician details. Continue?')) return;
      onChange('physicianName', '');
      onChange('physicianId', '');
    }
    // Confirm before clearing assessment/treatment details
    if (
      key === 'physicianSawPatient' &&
      value === false &&
      (formData.assessment ||
        formData.treatmentProvided ||
        formData.hospitalizedDetails ||
        (formData.treatmentTypes && (formData.treatmentTypes as string[]).length))
    ) {
      if (!window.confirm('Changing this will clear entered assessment/treatment details. Continue?')) return;
      onChange('assessment', '');
      onChange('treatmentProvided', '');
      onChange('hospitalizedDetails', '');
      onChange('treatmentTypes', []);
    }
    // Always update the field
    onChange(key, value);
    // Reset dependent fields if toggling off
    if (key === 'physicianNotified' && value === false) {
      onChange('physicianSawPatient', false);
    }
    if (key === 'physicianSawPatient' && value === false) {
      // Already cleared above
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        gutterBottom
        sx={{ bgcolor: (theme) => alpha(theme.palette.success.main, 0.1), p: 1, borderRadius: 1 }}
      >
        Immediate Actions Taken
      </Typography>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Physician Informed, Seen & Injury Outcome - Side by side */}
        <Grid size={{ xs: 12, md: 3 }}>
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              Physician Informed:
            </FormLabel>
            <RadioGroup
              row
              value={formData.physicianNotified ? 'yes' : 'no'}
              onChange={(e) => handleChange('physicianNotified', e.target.value === 'yes')}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, md: 3 }}>
          <FormControl component="fieldset" disabled={!formData.physicianNotified}>
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              Seen by Physician:
            </FormLabel>
            <RadioGroup
              row
              value={formData.physicianSawPatient ? 'yes' : 'no'}
              onChange={(e) => handleChange('physicianSawPatient', e.target.value === 'yes')}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        </Grid>

        {/* Injury Outcome */}
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              Injury Outcome:
            </FormLabel>
            <RadioGroup row value={formData.injuryOutcome || ''} onChange={(e) => handleChange('injuryOutcome', e.target.value)}>
              {INJURY_OUTCOMES.map(outcome => (
                <FormControlLabel value={outcome.value} control={<Radio />} label={outcome.label} key={outcome.value} />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>

        {/* Physician Details - Name, ID, Signature & Date */}
        {formData.physicianNotified && (
          <>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Physician's Name"
                required={!!formData.physicianSawPatient}
                value={formData.physicianName || ''}
                onChange={(e) => handleChange('physicianName', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                label="Physician ID #"
                required={!!formData.physicianSawPatient}
                value={formData.physicianId || ''}
                onChange={(e) => handleChange('physicianId', e.target.value)}
              />
            </Grid>
          </>
        )}

        {formData.physicianSawPatient && (
          <>
            {/* Assessment / Diagnosis */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Assessment / Diagnosis"
                placeholder="Describe the medical assessment and diagnosis..."
                value={formData.assessment || ''}
                onChange={(e) => handleChange('assessment', e.target.value)}
              />
            </Grid>

            {/* Hospitalized / Transferred To */}
            {((formData.treatmentTypes as string[])?.includes('hospitalized') ||
              (formData.treatmentTypes as string[])?.includes('transferred')) && (
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Hospitalized / Transferred To"
                    placeholder="Specify facility or department..."
                    value={formData.hospitalizedDetails || ''}
                    onChange={(e) => handleChange('hospitalizedDetails', e.target.value)}
                  />
                </Grid>
              )}

            {/* Physician's Notes */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                required={!!(formData.physicianSawPatient)}
                label="Physician's Response"
                placeholder="Additional treatment notes or observations..."
                value={formData.treatmentProvided || ''}
                onChange={(e) => handleChange('treatmentProvided', e.target.value)}
              />
            </Grid>

            {/* Nature of Treatment/Exam */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Autocomplete
                multiple
                options={TREATMENT_TYPES.map(t => t.value)}
                getOptionLabel={(option) => TREATMENT_TYPES.find(t => t.value === option)?.label || option}
                value={(formData.treatmentTypes as string[]) || []}
                onChange={(_, newValue) => {
                  handleChange('treatmentTypes', newValue);
                  // Clear hospitalized details if not selected
                  if (!newValue.includes('hospitalized') && !newValue.includes('transferred')) {
                    handleChange('hospitalizedDetails', '');
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Nature of Treatment/Exam"
                    placeholder="Select all that apply..."
                  />
                )}
                renderValue={(selected) =>
                  selected.map((option, index) => (
                    <Chip
                      label={TREATMENT_TYPES.find(t => t.value === option)?.label}
                      size="small"
                      sx={{ mr: 0.5 }}
                      {...(typeof option === 'string' ? { key: option } : {})}
                    />
                  ))
                }
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
          <FormControl component="fieldset">
            <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1 }}>
              Was Supervisor Notified?
            </FormLabel>
            <RadioGroup
              row
              value={formData.supervisorNotified ? 'yes' : 'no'}
              onChange={(e) => handleChange('supervisorNotified', e.target.value === 'yes')}
            >
              <FormControlLabel value="yes" control={<Radio />} label="Yes" />
              <FormControlLabel value="no" control={<Radio />} label="No" />
            </RadioGroup>
          </FormControl>
        </Grid>

        {formData.supervisorNotified && (
          <>
            <Grid size={{ xs: 12, md: 6 }}>
              <SupervisorSelector
                value={formData.supervisorId || undefined}
                onChange={(value) => handleChange('supervisorId', value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Supervisor Action Taken"
                placeholder="Describe what action the supervisor took..."
                value={formData.supervisorAction || ''}
                onChange={(e) => handleChange('supervisorAction', e.target.value)}
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
 * Uses PeoplePicker for enhanced user search
 */
function SupervisorSelector({
  value,
  onChange,
}: {
  value: string | number | undefined;
  onChange: (value: number) => void;
}) {
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);

  // Handle selection change
  const handleChange = useCallback((newValue: UserSearchResult | UserSearchResult[] | null) => {
    const user = Array.isArray(newValue) ? newValue[0] : newValue;
    setSelectedUser(user);
    if (user) {
      onChange(user.id);
    }
  }, [onChange]);

  return (
    <PeoplePicker
      value={selectedUser}
      onChange={handleChange}
      filterByRoles={['supervisor', 'team_lead', 'quality_manager', 'quality_analyst', 'admin', 'super_admin']}
      label="Select Supervisor *"
      placeholder="Search by name or employee ID..."
      required
    />
  );
}

/**
 * Risk Classification Section
 * Interactive risk matrix for reporter assessment
 */
function RiskIdentificationSection({
  formData,
  onChange,
}: {
  formData: FormData;
  onChange: (key: keyof FormData, value: unknown) => void;
}) {
  const impact = (formData.riskImpact as number) || 0;
  const likelihood = (formData.riskLikelihood as number) || 0;
  const score = impact && likelihood ? calculateRiskScore(impact, likelihood) : 0;
  const riskLevel = score ? getRiskLevel(score) : null;

  useEffect(() => {
    if (impact && likelihood) {
      const newScore = calculateRiskScore(impact, likelihood);
      onChange('riskScore', newScore);
      // onChange('riskLevel', newLevel.level);
    }
  }, [impact, likelihood, onChange]);

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="subtitle1"
        fontWeight={700}
        gutterBottom
        sx={{ bgcolor: (theme) => alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.12 : 0.08), p: 1, borderRadius: 1 }}
      >
        Incident Risk Classification
      </Typography>

      <Alert severity="info" sx={{ mt: 2, mb: 3 }}>
        Please assess the risk level of this incident by selecting the impact and likelihood below.
      </Alert>

      <Grid container spacing={3}>
        {/* Risk Matrix Reference */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={(theme) => ({ p: 2, bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.6 : 1) })}>
            <Typography variant="body2" fontWeight={600} gutterBottom>
              Risk Assessment Matrix (Reference)
            </Typography>

            <Box sx={{ overflowX: 'auto', mt: 2 }}>
              <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                <Box component="thead">
                  <Box component="tr">
                    <Box
                      component="th"
                      sx={(theme) => ({
                        border: `1px solid ${theme.palette.divider}`,
                        padding: 1,
                        background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.06) : '#f5f5f5',
                        textAlign: 'left',
                      })}
                    >
                      Impact / Likelihood
                    </Box>
                    {RISK_LIKELIHOOD_LEVELS.map(level => (
                      <Box
                        key={level.value}
                        component="th"
                        sx={(theme) => ({
                          border: `1px solid ${theme.palette.divider}`,
                          padding: 1,
                          background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.06) : '#f5f5f5',
                          textAlign: 'center',
                        })}
                      >
                        {level.value}<br />{level.label}
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Box component="tbody">
                  {RISK_MATRIX.map((row, impactIdx) => {
                    const impactValue = 5 - impactIdx;
                    const impactLabel = RISK_IMPACT_LEVELS.find(l => l.value === impactValue)?.label;
                    return (
                      <Box key={impactIdx} component="tr">
                        <Box
                          component="td"
                          sx={(theme) => ({
                            border: `1px solid ${theme.palette.divider}`,
                            padding: 1,
                            background: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.06) : '#f5f5f5',
                            fontWeight: 600,
                            verticalAlign: 'middle',
                            width: 220,
                          })}
                        >
                          {impactValue}. {impactLabel}
                        </Box>
                        {row.map((cellScore, likelihoodIdx) => {
                          const cellLevel = getRiskLevel(cellScore);
                          const isSelected = impact === (5 - impactIdx) && likelihood === (likelihoodIdx + 1);
                          return (
                            <Box
                              key={likelihoodIdx}
                              component="td"
                              sx={(theme) => ({
                                border: `2px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                                padding: 2,
                                textAlign: 'center',
                                background: alpha(cellLevel.color, theme.palette.mode === 'dark' ? 0.18 : 0.06),
                                fontWeight: isSelected ? 700 : 600,
                                fontSize: isSelected ? '18px' : '14px',
                                color: theme.palette.text.secondary,
                              })}
                            >
                              {cellScore}
                            </Box>
                          );
                        })}
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            </Box>

            {/* Risk Level Legend */}
            <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {RISK_LEVELS.map(level => (
                <Box key={level.level} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={(theme) => ({
                      width: 40,
                      height: 20,
                      bgcolor: alpha(level.color, theme.palette.mode === 'dark' ? 0.22 : 0.90),
                      border: `1px solid ${theme.palette.divider}`,
                    })}
                  />
                  <Typography variant="caption">
                    {level.range[0]}-{level.range[1]}: {level.label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Impact Selection */}
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth>
            <FormLabel sx={{ fontWeight: 600, mb: 1 }}>
              Impact Score (Severity of Consequences)
            </FormLabel>
            <RadioGroup
              value={impact || ''}
              onChange={(e) => onChange('riskImpact', Number(e.target.value))}
            >
              {RISK_IMPACT_LEVELS.map((level) => (
                <FormControlLabel
                  key={level.value}
                  value={level.value}
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={(theme) => ({
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: alpha(level.color, theme.palette.mode === 'dark' ? 0.25 : 0.8),
                          border: `1px solid ${alpha(level.color, theme.palette.mode === 'dark' ? 0.6 : 0.9)}`,
                        })}
                      />
                      <Typography variant="body2">
                        {level.value}. {level.label}
                      </Typography>
                    </Box>
                  }
                  sx={(theme) => ({
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    mb: 1,
                    px: 2,
                    mx: 0,
                    bgcolor: impact === level.value ? alpha(level.color, theme.palette.mode === 'dark' ? 0.20 : 0.08) : 'transparent',
                  })}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>

        {/* Likelihood Selection */}
        <Grid size={{ xs: 12, md: 6 }}>
          <FormControl fullWidth>
            <FormLabel sx={{ fontWeight: 600, mb: 1 }}>
              Likelihood Score (Probability of Occurrence)
            </FormLabel>
            <RadioGroup
              value={likelihood || ''}
              onChange={(e) => onChange('riskLikelihood', Number(e.target.value))}
            >
              {RISK_LIKELIHOOD_LEVELS.map((level) => (
                <FormControlLabel
                  key={level.value}
                  value={level.value}
                  control={<Radio />}
                  label={
                    <Typography variant="body2">
                      {level.value}. {level.label}
                    </Typography>
                  }
                  sx={(theme) => ({
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    mb: 1,
                    px: 2,
                    mx: 0,
                    bgcolor: likelihood === level.value ? alpha('#2196F3', theme.palette.mode === 'dark' ? 0.18 : 0.08) : 'transparent',
                  })}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>

        {/* Calculated Risk Result */}
        {score > 0 && riskLevel && (
          <Grid size={{ xs: 12 }}>
            <Paper
              sx={(theme) => ({
                p: 3,
                bgcolor: alpha(riskLevel.color, theme.palette.mode === 'dark' ? 0.18 : 0.08),
                border: `2px solid ${riskLevel.color}`,
              })}
            >
              <Stack direction="row" spacing={3} alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Risk Score
                  </Typography>
                  <Typography variant="h3" fontWeight={700} sx={{ color: riskLevel.color }}>
                    {score}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ color: riskLevel.color }}>
                    {riskLevel.label}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Impact: {RISK_IMPACT_LEVELS.find(l => l.value === impact)?.label} ×
                    Likelihood: {RISK_LIKELIHOOD_LEVELS.find(l => l.value === likelihood)?.label}
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
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
  const [draftId, setDraftId] = useState<string | null>(null);
  const { data: session } = useSession();
  const { departments, isLoading: isLoadingDepartments } = useDepartmentsWithLocations();

  const [loading, setLoading] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [formData, setFormData] = useState<FormData>(getEmptyFormData());

  // Read draft id from URL once on client (avoid useSearchParams)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const draft = params.get('draft');
    if (draft) setDraftId(draft);
  }, []);

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
                departments={departments}
                onChange={handleChange}
              />

              <PersonInvolvedSection formData={formData} onChange={handleChange} />

              <PersonDetailsFields formData={formData} onChange={handleChange} />

              <ClassificationSection formData={formData} onChange={handleChange} />

              <ImmediateActionsSection formData={formData} onChange={handleChange} />

              <RiskIdentificationSection formData={formData} onChange={handleChange} />

              <Divider sx={{ my: 3 }} />

              {/* Reporter Information Display */}
              {session?.user && (
                <Paper sx={{ p: 2, mb: 3, bgcolor: (theme) => alpha(theme.palette.info.main, 0.05), border: (theme) => `1px solid ${theme.palette.info.main}` }}>
                  <Stack
                    direction={{ sm: 'column', md: 'row' }}
                    spacing={2}
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Person color="info" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Report will be filed as:
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {session.user.name} ({formData.reporterPosition || 'Position not specified'})
                          {formData.reporterDepartment && `, ${formData.reporterDepartment}`}
                        </Typography>
                      </Box>
                    </Box>

                    <FormActions
                      loading={loading}
                      onSaveDraft={() => handleSubmit(true)}
                      onSubmit={() => handleSubmit(false)}
                    />
                  </Stack>
                </Paper>
              )}

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