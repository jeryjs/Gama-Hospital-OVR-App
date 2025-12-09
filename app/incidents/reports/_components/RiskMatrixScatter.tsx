'use client';

import React from 'react';
import {
    Paper,
    Box,
    Typography,
    Skeleton,
    Tooltip,
} from '@mui/material';

interface RiskMatrixScatterProps {
    loading?: boolean;
    onCellClick?: (likelihood: number, impact: number) => void;
}

// 5x5 matrix: [likelihood][impact] = count
// likelihood: 1 (Rare) to 5 (Almost Certain)
// impact: 1 (Negligible) to 5 (Catastrophic)
const placeholderData: number[][] = [
    [12, 8, 5, 2, 0],   // Rare
    [15, 11, 7, 3, 1],  // Unlikely
    [10, 14, 9, 4, 2],  // Possible
    [6, 8, 6, 5, 1],    // Likely
    [3, 4, 3, 2, 1],    // Almost Certain
];

const likelihoodLabels = ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'];
const impactLabels = ['Negligible', 'Minor', 'Moderate', 'Major', 'Catastrophic'];

// Risk level based on position (likelihood + impact)
const getRiskColor = (likelihood: number, impact: number): string => {
    const riskScore = likelihood + impact;

    if (riskScore <= 3) return '#4caf50'; // Low - Green
    if (riskScore <= 5) return '#8bc34a'; // Low-Medium - Light Green
    if (riskScore <= 6) return '#ffeb3b'; // Medium - Yellow
    if (riskScore <= 7) return '#ff9800'; // Medium-High - Orange
    if (riskScore <= 8) return '#ff5722'; // High - Deep Orange
    return '#f44336'; // Critical - Red
};

const getRiskLevel = (likelihood: number, impact: number): string => {
    const riskScore = likelihood + impact;

    if (riskScore <= 3) return 'Low';
    if (riskScore <= 5) return 'Low-Medium';
    if (riskScore <= 6) return 'Medium';
    if (riskScore <= 7) return 'Medium-High';
    if (riskScore <= 8) return 'High';
    return 'Critical';
};

const MatrixCell = ({
    count,
    likelihood,
    impact,
    onClick,
}: {
    count: number;
    likelihood: number;
    impact: number;
    onClick?: () => void;
}) => {
    const color = getRiskColor(likelihood + 1, impact + 1);
    const riskLevel = getRiskLevel(likelihood + 1, impact + 1);
    const hasIncidents = count > 0;

    return (
        <Tooltip
            title={
                <Box>
                    <Typography variant="body2" fontWeight="bold">
                        {riskLevel} Risk
                    </Typography>
                    <Typography variant="caption">
                        Likelihood: {likelihoodLabels[likelihood]}
                    </Typography>
                    <br />
                    <Typography variant="caption">
                        Impact: {impactLabels[impact]}
                    </Typography>
                    <br />
                    <Typography variant="caption">
                        Incidents: {count}
                    </Typography>
                </Box>
            }
            arrow
        >
            <Box
                onClick={onClick}
                sx={{
                    width: '100%',
                    aspectRatio: '1',
                    bgcolor: color,
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: onClick ? 'pointer' : 'default',
                    transition: 'all 0.2s ease-in-out',
                    opacity: hasIncidents ? 1 : 0.3,
                    border: '1px solid',
                    borderColor: 'rgba(0,0,0,0.1)',
                    '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: 2,
                        zIndex: 1,
                    },
                }}
            >
                {hasIncidents && (
                    <Typography
                        variant="body2"
                        fontWeight="bold"
                        sx={{
                            color: likelihood + impact >= 6 ? 'white' : 'rgba(0,0,0,0.8)',
                            textShadow: likelihood + impact >= 6 ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
                        }}
                    >
                        {count}
                    </Typography>
                )}
            </Box>
        </Tooltip>
    );
};

export default function RiskMatrixScatter({
    loading = false,
    onCellClick,
}: RiskMatrixScatterProps) {
    const data = placeholderData;
    const totalIncidents = data.flat().reduce((sum, n) => sum + n, 0);

    if (loading) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
            </Paper>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight="bold">
                    Risk Assessment Matrix
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {totalIncidents} incidents mapped by likelihood and impact
                </Typography>
            </Box>

            <Box sx={{ display: 'flex' }}>
                {/* Y-axis label */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        mr: 1,
                    }}
                >
                    <Typography
                        variant="caption"
                        fontWeight="bold"
                        color="text.secondary"
                        sx={{
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)',
                        }}
                    >
                        LIKELIHOOD →
                    </Typography>
                </Box>

                <Box sx={{ flex: 1 }}>
                    {/* Y-axis labels and grid */}
                    <Box sx={{ display: 'flex' }}>
                        {/* Y-axis tick labels */}
                        <Box sx={{ display: 'flex', flexDirection: 'column-reverse', width: 80, mr: 1 }}>
                            {likelihoodLabels.map((label, i) => (
                                <Box
                                    key={i}
                                    sx={{
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                        pr: 1,
                                    }}
                                >
                                    <Typography variant="caption" color="text.secondary" noWrap>
                                        {label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Matrix grid */}
                        <Box sx={{ flex: 1 }}>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(5, 1fr)',
                                    gridTemplateRows: 'repeat(5, 1fr)',
                                    gap: 0.5,
                                    aspectRatio: '1',
                                }}
                            >
                                {/* Render from top (high likelihood) to bottom (low likelihood) */}
                                {[...data].reverse().map((row, rowIndex) => (
                                    row.map((count, colIndex) => (
                                        <MatrixCell
                                            key={`${rowIndex}-${colIndex}`}
                                            count={count}
                                            likelihood={4 - rowIndex}
                                            impact={colIndex}
                                            onClick={onCellClick ? () => onCellClick(4 - rowIndex + 1, colIndex + 1) : undefined}
                                        />
                                    ))
                                ))}
                            </Box>
                        </Box>
                    </Box>

                    {/* X-axis labels */}
                    <Box sx={{ display: 'flex', mt: 1, ml: '88px' }}>
                        {impactLabels.map((label, i) => (
                            <Box
                                key={i}
                                sx={{
                                    flex: 1,
                                    textAlign: 'center',
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    {label}
                                </Typography>
                            </Box>
                        ))}
                    </Box>

                    {/* X-axis title */}
                    <Typography
                        variant="caption"
                        fontWeight="bold"
                        color="text.secondary"
                        sx={{ display: 'block', textAlign: 'center', mt: 1, ml: '88px' }}
                    >
                        IMPACT →
                    </Typography>
                </Box>
            </Box>

            {/* Legend */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                {[
                    { label: 'Low', color: '#4caf50' },
                    { label: 'Medium', color: '#ffeb3b' },
                    { label: 'High', color: '#ff9800' },
                    { label: 'Critical', color: '#f44336' },
                ].map((item) => (
                    <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, bgcolor: item.color, borderRadius: 0.5 }} />
                        <Typography variant="caption" color="text.secondary">
                            {item.label}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    );
}
