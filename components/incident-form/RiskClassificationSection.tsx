'use client';

import {
    RISK_IMPACT_LEVELS,
    RISK_LIKELIHOOD_LEVELS,
    RISK_MATRIX,
    calculateRiskScore,
    getRiskLevel,
} from '@/lib/constants';
import { Assessment } from '@mui/icons-material';
import { alpha, Box, Paper, Stack, TextField, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import type { OVRReport } from '../../app/incidents/_shared/types';
import { theme } from '@/lib/theme';
import { Section, SectionEditControls } from '@/components/shared';

interface Props {
    incident: OVRReport;
    onUpdate?: () => void;
}

export function RiskClassificationSection({ incident, onUpdate }: Props) {
    const canEditSection = incident.status !== 'closed' && Boolean(onUpdate);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [riskImpact, setRiskImpact] = useState<number>(incident.riskImpact || 0);
    const [riskLikelihood, setRiskLikelihood] = useState<number>(incident.riskLikelihood || 0);

    useEffect(() => {
        setRiskImpact(incident.riskImpact || 0);
        setRiskLikelihood(incident.riskLikelihood || 0);
        setIsEditing(false);
        setIsSaving(false);
    }, [incident]);

    const score = riskImpact > 0 && riskLikelihood > 0 ? calculateRiskScore(riskImpact, riskLikelihood) : 0;
    const riskLevel = score ? getRiskLevel(score) : null;
    const impactLabel = RISK_IMPACT_LEVELS.find((l) => l.value === riskImpact)?.label;
    const likelihoodLabel = RISK_LIKELIHOOD_LEVELS.find((l) => l.value === riskLikelihood)?.label;
    const hasChanges =
        riskImpact !== (incident.riskImpact || 0) ||
        riskLikelihood !== (incident.riskLikelihood || 0);

    const handleCancel = () => {
        setRiskImpact(incident.riskImpact || 0);
        setRiskLikelihood(incident.riskLikelihood || 0);
        setIsEditing(false);
        setIsSaving(false);
    };

    const handleSave = async () => {
        if (!riskImpact || !riskLikelihood) {
            alert('Please select both impact and likelihood before saving.');
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch(`/api/incidents/${incident.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    riskImpact,
                    riskLikelihood,
                    riskScore: score,
                    editComment: 'Edited risk classification section from incident view.',
                }),
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null);
                throw new Error(errorBody?.error || 'Failed to save risk classification section');
            }

            setIsEditing(false);
            onUpdate?.();
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Failed to save risk classification section');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Section
            title="Risk Classification & Rating"
            icon={<Assessment />}
            action={
                <SectionEditControls
                    canEdit={canEditSection}
                    isEditing={isEditing}
                    hasChanges={hasChanges}
                    isSaving={isSaving}
                    onStartEdit={() => setIsEditing(true)}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            }
        >

            {isEditing && (
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
                    <TextField
                        fullWidth
                        select
                        label="Impact"
                        value={riskImpact || ''}
                        onChange={(e) => setRiskImpact(Number(e.target.value) || 0)}
                        slotProps={{ select: { native: true } }}
                    >
                        <option value=""></option>
                        {RISK_IMPACT_LEVELS.map((level) => (
                            <option key={level.value} value={level.value}>
                                {level.value}. {level.label}
                            </option>
                        ))}
                    </TextField>

                    <TextField
                        fullWidth
                        select
                        label="Likelihood"
                        value={riskLikelihood || ''}
                        onChange={(e) => setRiskLikelihood(Number(e.target.value) || 0)}
                        slotProps={{ select: { native: true } }}
                    >
                        <option value=""></option>
                        {RISK_LIKELIHOOD_LEVELS.map((level) => (
                            <option key={level.value} value={level.value}>
                                {level.value}. {level.label}
                            </option>
                        ))}
                    </TextField>
                </Stack>
            )}

            {score && riskLevel ? (
                <>
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" gutterBottom sx={{ fontWeight: 600 }}>
                            Risk Assessment Matrix
                        </Typography>
                        <Box sx={{ overflowX: 'auto', mt: 2 }}>
                            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
                                <Box component="thead">
                                    <Box component="tr">
                                        <Box
                                            component="th"
                                            sx={(theme) => ({
                                                border: `1px solid ${theme.palette.divider}`,
                                                p: 1,
                                                minWidth: 120,
                                                textAlign: 'left',
                                                background: theme.palette.mode === 'dark'
                                                    ? alpha(theme.palette.background.paper, 0.08)
                                                    : alpha(theme.palette.grey[100], 0.9),
                                            })}
                                        >
                                            Impact / Likelihood
                                        </Box>
                                        {RISK_LIKELIHOOD_LEVELS.map((level) => (
                                            <Box
                                                key={level.value}
                                                component="th"
                                                sx={(theme) => ({
                                                    border: `1px solid ${theme.palette.divider}`,
                                                    p: 1,
                                                    minWidth: 80,
                                                    textAlign: 'center',
                                                    background: theme.palette.mode === 'dark'
                                                        ? alpha(theme.palette.background.paper, 0.08)
                                                        : alpha(theme.palette.grey[100], 0.9),
                                                })}
                                            >
                                                {level.value}
                                                <br />
                                                <small>{level.label}</small>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                                <Box component="tbody">
                                    {RISK_MATRIX.map((row, impactIdx) => {
                                        const impactValue = 5 - impactIdx;
                                        const impactLabelRow = RISK_IMPACT_LEVELS.find((l) => l.value === impactValue)?.label;

                                        return (
                                            <Box component="tr" key={impactIdx}>
                                                <Box
                                                    component="td"
                                                    sx={(theme) => ({
                                                        border: `1px solid ${theme.palette.divider}`,
                                                        p: 1,
                                                        fontWeight: 600,
                                                        fontSize: 13,
                                                        background: theme.palette.mode === 'dark'
                                                            ? alpha(theme.palette.background.paper, 0.08)
                                                            : alpha(theme.palette.grey[100], 0.9),
                                                    })}
                                                >
                                                    {impactValue}. {impactLabelRow}
                                                </Box>
                                                {row.map((cellScore, likelihoodIdx) => {
                                                    const cellLevel = getRiskLevel(cellScore);
                                                    const isSelected = riskImpact === 5 - impactIdx && riskLikelihood === likelihoodIdx + 1;

                                                    return (
                                                        <Box
                                                            component="td"
                                                            key={likelihoodIdx}
                                                            sx={(theme) => ({
                                                                border: `2px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                                                                p: 1.5,
                                                                textAlign: 'center',
                                                                background: alpha(cellLevel.color, theme.palette.mode === 'dark' ? 0.2 : 0.1),
                                                                fontWeight: isSelected ? 700 : 600,
                                                                fontSize: isSelected ? 18 : 14,
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
                    </Box>

                    <Paper
                        sx={{
                            p: 3,
                            mt: 3,
                            bgcolor: alpha(riskLevel.color, theme.palette.mode === 'dark' ? 0.18 : 0.08),
                            border: `2px solid ${riskLevel.color}`,
                        }}
                    >
                        <Stack direction="row" spacing={3} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Risk Score
                                </Typography>
                                <Typography variant="h2" color={riskLevel.color} sx={{ fontWeight: 700 }}>
                                    {score}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h5" color={riskLevel.color} sx={{ fontWeight: 600 }}>
                                    {riskLevel.label}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                    Impact: {impactLabel} ({riskImpact}) × Likelihood: {likelihoodLabel} ({riskLikelihood})
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </>
            ) : (
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 2, fontStyle: 'italic' }}>
                    No risk assessment recorded
                </Typography>
            )}
        </Section>
    );
}
