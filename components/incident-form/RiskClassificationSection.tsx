import {
    RISK_IMPACT_LEVELS,
    RISK_LIKELIHOOD_LEVELS,
    RISK_MATRIX,
    getRiskLevel
} from '@/lib/constants';
import { Assessment } from '@mui/icons-material';
import { alpha, Box, Grid, Paper, Stack, Typography } from '@mui/material';
import type { OVRReport } from '../../app/incidents/_shared/types';

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
                fontWeight={700}
                gutterBottom
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    pb: 2,
                    borderBottom: (theme) => `2px solid ${theme.palette.divider}`,
                }}
            >
                <Assessment /> Part 5: Risk Classification & Rating
            </Typography>

            {/* Risk Assessment Result */}
            {score && riskLevel ? (
                <>
                    <Paper sx={{ p: 3, mt: 2, bgcolor: riskLevel.bgColor, border: `2px solid ${riskLevel.color}` }}>
                        <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap">
                            <Box>
                                <Typography variant="caption" color="text.secondary">
                                    Risk Score
                                </Typography>
                                <Typography variant="h2" fontWeight={700} color={riskLevel.color}>
                                    {score}
                                </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="h5" fontWeight={600} color={riskLevel.color}>
                                    {riskLevel.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    Impact: {impactLabel} ({impact}) × Likelihood: {likelihoodLabel} ({likelihood})
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>

                    {/* Risk Matrix */}
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="body2" fontWeight={600} gutterBottom>
                            Risk Assessment Matrix
                        </Typography>
                        <Box sx={{ overflowX: 'auto', mt: 2 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr>
                                        <th style={{ border: '1px solid #ddd', padding: '8px', background: '#f5f5f5', minWidth: '120px' }}>
                                            Impact / Likelihood
                                        </th>
                                        {RISK_LIKELIHOOD_LEVELS.map(level => (
                                            <th key={level.value} style={{ border: '1px solid #ddd', padding: '8px', background: '#f5f5f5', textAlign: 'center', minWidth: '80px' }}>
                                                {level.value}<br /><small>{level.label}</small>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {RISK_MATRIX.map((row, impactIdx) => {
                                        const impactValue = 5 - impactIdx;
                                        const impactLabelRow = RISK_IMPACT_LEVELS.find(l => l.value === impactValue)?.label;
                                        return (
                                            <tr key={impactIdx}>
                                                <td style={{ border: '1px solid #ddd', padding: '8px', background: '#f5f5f5', fontWeight: 600, fontSize: '13px' }}>
                                                    {impactValue}. {impactLabelRow}
                                                </td>
                                                {row.map((cellScore, likelihoodIdx) => {
                                                    const cellLevel = getRiskLevel(cellScore);
                                                    const isSelected = impact === (5 - impactIdx) && likelihood === (likelihoodIdx + 1);
                                                    return (
                                                        <td
                                                            key={likelihoodIdx}
                                                            style={{
                                                                border: '3px solid ' + (isSelected ? '#1976d2' : '#ddd'),
                                                                padding: '12px',
                                                                textAlign: 'center',
                                                                background: cellLevel.bgColor,
                                                                fontWeight: isSelected ? 700 : 600,
                                                                fontSize: isSelected ? '18px' : '14px',
                                                            }}
                                                        >
                                                            {cellScore}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </Box>
                    </Box>
                </>
            ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                    No risk assessment recorded
                </Typography>
            )}
        </Paper>
    );
}
