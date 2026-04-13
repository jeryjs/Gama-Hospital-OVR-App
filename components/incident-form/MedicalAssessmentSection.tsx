'use client';

import { INJURY_OUTCOMES, TREATMENT_TYPES } from '@/lib/constants';
import { Cancel, CheckCircle, Edit, LocalHospital, Save } from '@mui/icons-material';
import {
    alpha,
    Autocomplete,
    Box,
    Button,
    Chip,
    FormControl,
    FormControlLabel,
    Grid,
    Paper,
    Radio,
    RadioGroup,
    TextField,
    Typography,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { OVRReport } from '../../app/incidents/_shared/types';

interface Props {
    incident: OVRReport;
    onUpdate?: () => void;
}

const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <Box>
        <Typography
            variant="caption"
            sx={{
                color: 'text.secondary',
                fontWeight: 600,
            }}
        >
            {label}
        </Typography>
        <Typography variant="body2">{value || 'N/A'}</Typography>
    </Box>
);

export function MedicalAssessmentSection({ incident, onUpdate }: Props) {
    const canEditSection = incident.status !== 'closed' && Boolean(onUpdate);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [physicianNotified, setPhysicianNotified] = useState(Boolean(incident.physicianNotified));
    const [physicianSawPatient, setPhysicianSawPatient] = useState(Boolean(incident.physicianSawPatient));
    const [assessment, setAssessment] = useState(incident.assessment || '');
    const [injuryOutcome, setInjuryOutcome] = useState(incident.injuryOutcome || '');
    const [treatmentTypes, setTreatmentTypes] = useState<string[]>(incident.treatmentTypes || []);
    const [hospitalizedDetails, setHospitalizedDetails] = useState(incident.hospitalizedDetails || '');
    const [treatmentProvided, setTreatmentProvided] = useState(incident.treatmentProvided || '');

    useEffect(() => {
        setPhysicianNotified(Boolean(incident.physicianNotified));
        setPhysicianSawPatient(Boolean(incident.physicianSawPatient));
        setAssessment(incident.assessment || '');
        setInjuryOutcome(incident.injuryOutcome || '');
        setTreatmentTypes(incident.treatmentTypes || []);
        setHospitalizedDetails(incident.hospitalizedDetails || '');
        setTreatmentProvided(incident.treatmentProvided || '');
        setIsEditing(false);
        setIsSaving(false);
    }, [incident]);

    const hasMedicalData = Boolean(
        incident.physicianNotified ||
        incident.physicianSawPatient ||
        incident.assessment ||
        incident.injuryOutcome ||
        (incident.treatmentTypes?.length || 0) > 0 ||
        incident.hospitalizedDetails ||
        incident.treatmentProvided
    );

    if (!hasMedicalData && !canEditSection) {
        return null;
    }

    const injuryOutcomeLabel = INJURY_OUTCOMES.find((i) => i.value === incident.injuryOutcome)?.label;

    const treatmentLabels = useMemo(
        () =>
            incident.treatmentTypes?.map(
                (type) => TREATMENT_TYPES.find((t) => t.value === type)?.label || type
            ) || [],
        [incident.treatmentTypes]
    );

    const includeHospitalizedDetails =
        treatmentTypes.includes('hospitalized') || treatmentTypes.includes('transferred');

    const handleSave = async () => {
        setIsSaving(true);

        const normalizedSawPatient = physicianNotified ? physicianSawPatient : false;
        const normalizedTreatmentTypes = normalizedSawPatient ? treatmentTypes : [];

        try {
            const response = await fetch(`/api/incidents/${incident.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    physicianNotified,
                    physicianSawPatient: normalizedSawPatient,
                    assessment: normalizedSawPatient ? assessment.trim() : '',
                    injuryOutcome: injuryOutcome || undefined,
                    treatmentTypes: normalizedTreatmentTypes,
                    hospitalizedDetails:
                        normalizedSawPatient && includeHospitalizedDetails ? hospitalizedDetails.trim() : '',
                    treatmentProvided: normalizedSawPatient ? treatmentProvided.trim() : '',
                    editComment: 'Edited physician follow-up section from incident view.',
                }),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save medical assessment section');
            }

            setIsEditing(false);
            onUpdate?.();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to save medical assessment section');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    pb: 2,
                    borderBottom: (theme) => `2px solid ${theme.palette.divider}`,
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <LocalHospital /> Part 4: Physician Follow-up
                </Typography>

                {canEditSection && (
                    <Button
                        variant="outlined"
                        startIcon={isEditing ? <Save /> : <Edit />}
                        onClick={isEditing ? handleSave : () => setIsEditing(true)}
                        disabled={isSaving}
                    >
                        {isEditing ? (isSaving ? 'Saving...' : 'Save') : 'Edit'}
                    </Button>
                )}
            </Box>

            {isEditing ? (
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl component="fieldset">
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                Physician Notified?
                            </Typography>
                            <RadioGroup
                                row
                                value={physicianNotified ? 'yes' : 'no'}
                                onChange={(e) => {
                                    const value = e.target.value === 'yes';
                                    setPhysicianNotified(value);
                                    if (!value) {
                                        setPhysicianSawPatient(false);
                                        setAssessment('');
                                        setTreatmentTypes([]);
                                        setHospitalizedDetails('');
                                        setTreatmentProvided('');
                                    }
                                }}
                            >
                                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                                <FormControlLabel value="no" control={<Radio />} label="No" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl component="fieldset" disabled={!physicianNotified}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                Did Physician See the Patient?
                            </Typography>
                            <RadioGroup
                                row
                                value={physicianSawPatient ? 'yes' : 'no'}
                                onChange={(e) => {
                                    const value = e.target.value === 'yes';
                                    setPhysicianSawPatient(value);
                                    if (!value) {
                                        setAssessment('');
                                        setTreatmentTypes([]);
                                        setHospitalizedDetails('');
                                        setTreatmentProvided('');
                                    }
                                }}
                            >
                                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                                <FormControlLabel value="no" control={<Radio />} label="No" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            select
                            label="Injury Outcome"
                            value={injuryOutcome}
                            onChange={(e) => setInjuryOutcome(e.target.value)}
                            slotProps={{ select: { native: true } }}
                        >
                            <option value=""></option>
                            {INJURY_OUTCOMES.map((outcome) => (
                                <option key={outcome.value} value={outcome.value}>
                                    {outcome.label}
                                </option>
                            ))}
                        </TextField>
                    </Grid>

                    {physicianSawPatient && (
                        <>
                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="Assessment / Diagnosis"
                                    value={assessment}
                                    onChange={(e) => setAssessment(e.target.value)}
                                />
                            </Grid>

                            <Grid size={{ xs: 12, md: 8 }}>
                                <Autocomplete
                                    multiple
                                    options={TREATMENT_TYPES.map((item) => item.value)}
                                    getOptionLabel={(value) =>
                                        TREATMENT_TYPES.find((item) => item.value === value)?.label || value
                                    }
                                    value={treatmentTypes}
                                    onChange={(_, next) => {
                                        setTreatmentTypes(next);
                                        if (!next.includes('hospitalized') && !next.includes('transferred')) {
                                            setHospitalizedDetails('');
                                        }
                                    }}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Nature of Treatment/Exam" placeholder="Select all that apply" />
                                    )}
                                />
                            </Grid>

                            {includeHospitalizedDetails && (
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        fullWidth
                                        label="Hospitalized / Transferred To"
                                        value={hospitalizedDetails}
                                        onChange={(e) => setHospitalizedDetails(e.target.value)}
                                    />
                                </Grid>
                            )}

                            <Grid size={{ xs: 12 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label="Physician's Notes"
                                    value={treatmentProvided}
                                    onChange={(e) => setTreatmentProvided(e.target.value)}
                                />
                            </Grid>
                        </>
                    )}
                </Grid>
            ) : (
                <>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
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
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
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
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
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

                        {treatmentLabels.length > 0 && (
                            <Grid size={{ xs: 12 }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
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

                        {incident.hospitalizedDetails && (
                            <Grid size={{ xs: 12 }}>
                                <InfoRow label="Hospitalized / Transferred To" value={incident.hospitalizedDetails} />
                            </Grid>
                        )}
                    </Grid>

                    {incident.treatmentProvided && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
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
                </>
            )}
        </Paper>
    );
}
