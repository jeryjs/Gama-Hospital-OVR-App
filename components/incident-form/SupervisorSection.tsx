'use client';

import { CheckCircle, Cancel, Edit, Save, SupervisorAccount } from '@mui/icons-material';
import {
    alpha,
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
import { useEffect, useState } from 'react';
import type { OVRReportWithRelations } from '../../app/incidents/_shared/types';

interface Props {
    incident: OVRReportWithRelations;
    onUpdate?: () => void;
}

/**
 * Supervisor Section - Read-Only by default, inline-editable for QI roles
 */
export function SupervisorSection({ incident, onUpdate }: Props) {
    const canEditSection = incident.status !== 'closed' && Boolean(onUpdate);

    if (!incident.supervisorNotified && !incident.supervisorId && !incident.supervisorAction && !canEditSection) {
        return null;
    }

    const supervisorName = incident.supervisor
        ? `${incident.supervisor.firstName || ''} ${incident.supervisor.lastName || ''}`.trim()
        : null;

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [supervisorNotified, setSupervisorNotified] = useState(Boolean(incident.supervisorNotified));
    const [supervisorAction, setSupervisorAction] = useState(incident.supervisorAction || '');

    useEffect(() => {
        setSupervisorNotified(Boolean(incident.supervisorNotified));
        setSupervisorAction(incident.supervisorAction || '');
        setIsEditing(false);
        setIsSaving(false);
    }, [incident]);

    const handleSave = async () => {
        setIsSaving(true);

        try {
            const response = await fetch(`/api/incidents/${incident.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    supervisorNotified,
                    supervisorAction: supervisorNotified ? supervisorAction.trim() : '',
                    editComment: 'Edited supervisor section from incident view.',
                }),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save supervisor section');
            }

            setIsEditing(false);
            onUpdate?.();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to save supervisor section');
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
                    <SupervisorAccount /> Supervisor Action
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
                                Was Supervisor Notified?
                            </Typography>
                            <RadioGroup
                                row
                                value={supervisorNotified ? 'yes' : 'no'}
                                onChange={(e) => {
                                    const value = e.target.value === 'yes';
                                    setSupervisorNotified(value);
                                    if (!value) {
                                        setSupervisorAction('');
                                    }
                                }}
                            >
                                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                                <FormControlLabel value="no" control={<Radio />} label="No" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>

                    {(incident.supervisorId || supervisorName) && (
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    Supervisor
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {supervisorName || `User #${incident.supervisorId}`}
                                </Typography>
                            </Box>
                        </Grid>
                    )}

                    <Grid size={{ xs: 12 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                            label="Supervisor Action"
                            value={supervisorAction}
                            onChange={(e) => setSupervisorAction(e.target.value)}
                            disabled={!supervisorNotified}
                        />
                    </Grid>
                </Grid>
            ) : (
                <>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                    Supervisor Notified?
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                    {incident.supervisorNotified ? (
                                        <Chip icon={<CheckCircle />} label="Yes" color="success" size="small" />
                                    ) : (
                                        <Chip icon={<Cancel />} label="No" size="small" />
                                    )}
                                </Box>
                            </Box>
                        </Grid>

                        {(incident.supervisorId || supervisorName) && (
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Box>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                        Supervisor
                                    </Typography>
                                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                                        {supervisorName || `User #${incident.supervisorId}`}
                                    </Typography>
                                </Box>
                            </Grid>
                        )}
                    </Grid>

                    <Box sx={{ mt: 3 }}>
                        <Box
                            sx={{
                                p: 2,
                                bgcolor: (theme) => alpha(theme.palette.success.main, 0.05),
                                borderRadius: 1,
                                border: (theme) => `1px solid ${theme.palette.divider}`,
                            }}
                        >
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                                Supervisor Action
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                                {incident.supervisorAction || 'No supervisor action recorded.'}
                            </Typography>
                        </Box>
                    </Box>
                </>
            )}
        </Paper>
    );
}
