/**
 * @fileoverview RCA Summary Tab - 5 Whys Builder
 */

'use client';

import { Add, Remove } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Chip,
    IconButton,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import type { RCAAnalysis, WhyItem, ContributingFactor } from './types';
import { MAX_WHYS, MIN_WHYS } from './types';
import { addWhyLevel, removeWhyLevel, generateCauseId } from './utils';

interface RCASummaryTabProps {
    rca: RCAAnalysis;
    onChange: (rca: RCAAnalysis) => void;
    disabled?: boolean;
}

// Common contributing factors for quick selection
const COMMON_FACTORS = [
    'Training Gap',
    'Equipment Malfunction',
    'Communication Breakdown',
    'Staffing Shortage',
    'Process Deviation',
    'Environmental Issue',
    'Documentation Error',
    'Time Pressure',
];

export function RCASummaryTab({ rca, onChange, disabled }: RCASummaryTabProps) {
    const [newFactorText, setNewFactorText] = useState('');

    const updateProblemStatement = (value: string) => {
        onChange({ ...rca, problemStatement: value });
    };

    const updateWhy = (level: number, field: 'question' | 'answer', value: string) => {
        const updated = rca.fiveWhys.map(w =>
            w.level === level ? { ...w, [field]: value } : w
        );
        onChange({ ...rca, fiveWhys: updated });
    };

    const handleAddWhy = () => {
        if (rca.fiveWhys.length >= MAX_WHYS) return;
        onChange({ ...rca, fiveWhys: addWhyLevel(rca.fiveWhys) });
    };

    const handleRemoveWhy = () => {
        if (rca.fiveWhys.length <= MIN_WHYS) return;
        onChange({ ...rca, fiveWhys: removeWhyLevel(rca.fiveWhys) });
    };

    const updateRootCause = (value: string) => {
        onChange({ ...rca, rootCause: value });
    };

    const addFactor = (label: string) => {
        if (!label.trim()) return;

        // Check if already exists
        if (rca.contributingFactors.some(f => f.label === label)) return;

        const newFactor: ContributingFactor = {
            id: generateCauseId(),
            label: label.trim(),
            votes: 0,
        };

        onChange({
            ...rca,
            contributingFactors: [...rca.contributingFactors, newFactor],
        });

        setNewFactorText('');
    };

    const removeFactor = (id: string) => {
        onChange({
            ...rca,
            contributingFactors: rca.contributingFactors.filter(f => f.id !== id),
        });
    };

    return (
        <Stack spacing={3}>
            {/* Problem Statement */}
            <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Problem Statement{disabled ? '' : ' *'}
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={rca.problemStatement}
                    onChange={(e) => updateProblemStatement(e.target.value)}
                    placeholder="Clearly describe the incident or problem being analyzed..."
                    slotProps={{
                        htmlInput: {
                            readOnly: disabled,
                        },
                    }}
                />
            </Box>
            {/* 5 Whys Chain */}
            <Box>
                <Stack
                    direction="row"
                    sx={{
                        alignItems: "center",
                        justifyContent: "space-between",
                        mb: 1
                    }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        The 5 Whys Analysis *
                    </Typography>
                    {!disabled && (
                        <Stack direction="row" spacing={1}>
                            <IconButton
                                size="small"
                                onClick={handleRemoveWhy}
                                disabled={rca.fiveWhys.length <= MIN_WHYS}
                                title="Remove last Why"
                            >
                                <Remove fontSize="small" />
                            </IconButton>
                            <IconButton
                                size="small"
                                onClick={handleAddWhy}
                                disabled={rca.fiveWhys.length >= MAX_WHYS}
                                title="Add another Why"
                                color="primary"
                            >
                                <Add fontSize="small" />
                            </IconButton>
                        </Stack>
                    )}
                </Stack>

                <Stack spacing={2}>
                    {rca.fiveWhys.map((why, index) => (
                        <Box
                            key={why.level}
                            sx={{
                                p: 2,
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                borderLeft: 3,
                                borderColor: 'primary.main',
                            }}
                        >
                            <Stack spacing={1.5}>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label={`Why #${why.level}`}
                                    value={why.question}
                                    onChange={(e) => updateWhy(why.level, 'question', e.target.value)}
                                    placeholder="What question are you asking?"
                                    slotProps={{
                                        htmlInput: {
                                            readOnly: disabled,
                                        },
                                    }}
                                />
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    label="Answer"
                                    value={why.answer}
                                    onChange={(e) => updateWhy(why.level, 'answer', e.target.value)}
                                    placeholder="Provide the answer to this why..."
                                    slotProps={{
                                        htmlInput: {
                                            readOnly: disabled,
                                        },
                                    }}
                                />
                            </Stack>
                            {index < rca.fiveWhys.length - 1 && (
                                <Box sx={{ textAlign: 'center', mt: 1 }}>
                                    <Typography variant="caption" sx={{
                                        color: "text.secondary"
                                    }}>
                                        ↓
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    ))}
                </Stack>
            </Box>
            {/* Root Cause */}
            <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Root Cause Statement
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={rca.rootCause}
                    onChange={(e) => updateRootCause(e.target.value)}
                    placeholder="Based on the analysis above, what is the fundamental root cause?"
                    slotProps={{
                        htmlInput: {
                            readOnly: disabled,
                        },
                    }}
                />
                <Typography
                    variant="caption"
                    sx={{
                        color: "text.secondary",
                        mt: 0.5,
                        display: 'block'
                    }}>
                    This should be the deepest underlying cause identified through the 5 Whys process
                </Typography>
            </Box>
            {/* Contributing Factors */}
            <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Contributing Factors
                </Typography>
                <Typography
                    variant="caption"
                    sx={{
                        color: "text.secondary",
                        mb: 1.5,
                        display: 'block'
                    }}>
                    Tag additional factors that contributed to this incident
                </Typography>

                {/* Quick select common factors */}
                {!disabled && (
                    <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        sx={{
                            flexWrap: "wrap",
                            mb: 2
                        }}>
                        {COMMON_FACTORS.map((factor) => (
                            <Chip
                                key={factor}
                                label={factor}
                                size="small"
                                onClick={() => addFactor(factor)}
                                disabled={rca.contributingFactors.some(f => f.label === factor)}
                                sx={{ cursor: 'pointer' }}
                            />
                        ))}
                    </Stack>
                )}

                {/* Selected factors */}
                {rca.contributingFactors.length > 0 && (
                    <Stack
                        direction="row"
                        spacing={1}
                        useFlexGap
                        sx={{
                            flexWrap: "wrap",
                            mb: 2
                        }}>
                        {rca.contributingFactors.map((factor) => (
                            <Chip
                                key={factor.id}
                                label={factor.label}
                                onDelete={disabled ? undefined : () => removeFactor(factor.id)}
                                color="primary"
                                variant="outlined"
                            />
                        ))}
                    </Stack>
                )}

                {/* Custom factor input */}
                {!disabled && (
                    <Stack direction="row" spacing={1}>
                        <TextField
                            size="small"
                            fullWidth
                            value={newFactorText}
                            onChange={(e) => setNewFactorText(e.target.value)}
                            placeholder="Add custom factor..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addFactor(newFactorText);
                                }
                            }}
                        />
                        <Button
                            variant="outlined"
                            onClick={() => addFactor(newFactorText)}
                            disabled={!newFactorText.trim()}
                        >
                            Add
                        </Button>
                    </Stack>
                )}
            </Box>
            {/* Validation hints */}
            {!rca.problemStatement.trim() && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Start by describing the problem statement clearly
                </Alert>
            )}
        </Stack>
    );
}
