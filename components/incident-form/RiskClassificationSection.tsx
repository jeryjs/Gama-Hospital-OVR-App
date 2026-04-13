import {
    RISK_IMPACT_LEVELS,
    RISK_LIKELIHOOD_LEVELS,
    RISK_MATRIX,
    getRiskLevel
} from '@/lib/constants';
import { Assessment } from '@mui/icons-material';
import { alpha, Box, Paper, Stack, Typography } from '@mui/material';
import type { OVRReport } from '../../app/incidents/_shared/types';
import { theme } from '@/lib/theme';

interface Props {
    incident: OVRReport;
}

export function RiskClassificationSection({ incident }: Props) {
    const impact = incident.riskImpact;
    const likelihood = incident.riskLikelihood;
    const score = incident.riskScore;
    const riskLevel = score ? getRiskLevel(score) : null;

    const impactLabel = RISK_IMPACT_LEVELS.find(l => l.value === impact)?.label;
    const likelihoodLabel = RISK_LIKELIHOOD_LEVELS.find(l => l.value === likelihood)?.label;

    return (
        <Paper sx={{ p: 3, mb: 3 }}>
            <Typography
                variant="h6"
                gutterBottom
                sx={{
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    pb: 2,
                    borderBottom: (theme) => `2px solid ${theme.palette.divider}`
                }}>
                <Assessment /> Risk Classification & Rating
            </Typography>
            {/* Risk Assessment Result */}
            {score && riskLevel ? (
                <>
                    {/* Risk Matrix */}
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" gutterBottom sx={{
                            fontWeight: 600
                        }}>
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
                                        {RISK_LIKELIHOOD_LEVELS.map(level => (
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
                                                {level.value}<br /><small>{level.label}</small>
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                                <Box component="tbody">
                                    {RISK_MATRIX.map((row, impactIdx) => {
                                        const impactValue = 5 - impactIdx;
                                        const impactLabelRow = RISK_IMPACT_LEVELS.find(l => l.value === impactValue)?.label;
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
                                                    const isSelected = impact === (5 - impactIdx) && likelihood === (likelihoodIdx + 1);
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

                    <Paper sx={{ p: 3, mt: 3, bgcolor: alpha(riskLevel.color, theme.palette.mode === 'dark' ? 0.18 : 0.08), border: `2px solid ${riskLevel.color}` }}>
                        <Stack
                            direction="row"
                            spacing={3}
                            sx={{
                                alignItems: "center",
                                flexWrap: "wrap"
                            }}>
                            <Box>
                                <Typography variant="caption" sx={{
                                    color: "text.secondary"
                                }}>
                                    Risk Score
                                </Typography>
                                <Typography variant="h2" color={riskLevel.color} sx={{
                                    fontWeight: 700
                                }}>
                                    {score}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h5" color={riskLevel.color} sx={{
                                    fontWeight: 600
                                }}>
                                    {riskLevel.label}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        color: "text.secondary",
                                        mt: 0.5
                                    }}>
                                    Impact: {impactLabel} ({impact}) × Likelihood: {likelihoodLabel} ({likelihood})
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </>
            ) : (
                <Typography
                    variant="body2"
                    sx={{
                        color: "text.secondary",
                        mt: 2,
                        fontStyle: 'italic'
                    }}>
                    No risk assessment recorded
                </Typography>
            )}
        </Paper>
    );
}
