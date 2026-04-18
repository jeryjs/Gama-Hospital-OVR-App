/**
 * @fileoverview Fishbone (Ishikawa) Diagram Component
 * SVG-based interactive diagram for root cause analysis
 */

'use client';

import { Add, Delete, ZoomIn, ZoomOut } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    IconButton,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { useState } from 'react';
import type { FishboneAnalysis, FishboneCategory, FishboneCause } from './types';
import { generateCauseId } from './utils';

interface FishboneDiagramProps {
    fishbone: FishboneAnalysis;
    onChange: (fishbone: FishboneAnalysis) => void;
    disabled?: boolean;
}

export function FishboneDiagram({ fishbone, onChange, disabled }: FishboneDiagramProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [newCauseText, setNewCauseText] = useState('');
    const [zoom, setZoom] = useState(1);

    const updateProblemStatement = (value: string) => {
        onChange({ ...fishbone, problemStatement: value });
    };

    const addCause = (categoryId: string, text: string) => {
        if (!text.trim()) return;

        const newCause: FishboneCause = {
            id: generateCauseId(),
            text: text.trim(),
            votes: 0,
        };

        const updatedCategories = fishbone.categories.map(cat =>
            cat.id === categoryId
                ? { ...cat, causes: [...cat.causes, newCause] }
                : cat
        );

        onChange({
            ...fishbone,
            categories: updatedCategories,
            lastModified: new Date().toISOString(),
        });

        setNewCauseText('');
    };

    const removeCause = (categoryId: string, causeId: string) => {
        const updatedCategories = fishbone.categories.map(cat =>
            cat.id === categoryId
                ? { ...cat, causes: cat.causes.filter(c => c.id !== causeId) }
                : cat
        );

        onChange({
            ...fishbone,
            categories: updatedCategories,
            lastModified: new Date().toISOString(),
        });
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

    // SVG dimensions
    const svgWidth = 720;
    const svgHeight = 360;
    const centerY = svgHeight / 2;
    const spineStartX = 100;
    const spineEndX = svgWidth - 150;
    const headSize = 120;

    // Calculate bone positions (3 on top, 3 on bottom)
    const topCategories = fishbone.categories.slice(0, 3);
    const bottomCategories = fishbone.categories.slice(3, 6);

    const renderBone = (
        category: FishboneCategory,
        index: number,
        isTop: boolean
    ) => {
        const spacing = (spineEndX - spineStartX) / 3;
        const boneX = spineStartX + spacing * (index + 0.5);
        const boneY = isTop ? centerY - 80 : centerY + 80;
        const angle = isTop ? -45 : 45;

        return (
            <g key={category.id}>
                {/* Main bone line */}
                <line
                    x1={boneX}
                    y1={centerY}
                    x2={boneX + (isTop ? -60 : -60)}
                    y2={boneY}
                    stroke={category.color}
                    strokeWidth="3"
                    opacity="0.8"
                />

                {/* Category label */}
                <text
                    x={boneX + (isTop ? -70 : -70)}
                    y={boneY + (isTop ? -10 : 20)}
                    fill={category.color}
                    fontSize="14"
                    fontWeight="600"
                    textAnchor="middle"
                >
                    {category.label}
                </text>

                {/* Cause count badge */}
                <circle
                    cx={boneX + (isTop ? -70 : -70)}
                    cy={boneY + (isTop ? 10 : 40)}
                    r="12"
                    fill={category.color}
                    opacity="0.3"
                />
                <text
                    x={boneX + (isTop ? -70 : -70)}
                    y={boneY + (isTop ? 15 : 45)}
                    fill={category.color}
                    fontSize="11"
                    fontWeight="700"
                    textAnchor="middle"
                >
                    {category.causes.length}
                </text>
            </g>
        );
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
                    value={fishbone.problemStatement}
                    onChange={(e) => updateProblemStatement(e.target.value)}
                    placeholder="Clearly describe the problem being analyzed..."
                    slotProps={{
                        htmlInput: {
                            readOnly: disabled,
                        },
                    }}
                />
            </Box>
            {/* Diagram Controls */}
            <Stack
                direction="row"
                sx={{
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Fishbone Diagram
                </Typography>
                <Stack direction="row" spacing={1}>
                    <IconButton size="small" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                        <ZoomOut fontSize="small" />
                    </IconButton>
                    <Typography variant="caption" sx={{ alignSelf: 'center', minWidth: 40, textAlign: 'center' }}>
                        {Math.round(zoom * 100)}%
                    </Typography>
                    <IconButton size="small" onClick={handleZoomIn} disabled={zoom >= 2}>
                        <ZoomIn fontSize="small" />
                    </IconButton>
                </Stack>
            </Stack>
            {/* SVG Diagram */}
            <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    bgcolor: 'background.default',
                    overflow: 'auto',
                    maxHeight: 500,
                }}
            >
                <Box sx={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                    <svg width={svgWidth} height={svgHeight} style={{ display: 'block' }}>
                        {/* Main spine */}
                        <line
                            x1={spineStartX}
                            y1={centerY}
                            x2={spineEndX}
                            y2={centerY}
                            stroke="#666"
                            strokeWidth="4"
                        />

                        {/* Arrow head (problem) */}
                        <polygon
                            points={`${spineEndX},${centerY} ${spineEndX + 20},${centerY - 10} ${spineEndX + 20},${centerY + 10}`}
                            fill="#666"
                        />

                        {/* Problem statement box */}
                        <rect
                            x={spineEndX + 25}
                            y={centerY - 40}
                            width={headSize}
                            height={80}
                            fill="none"
                            stroke="#00E599"
                            strokeWidth="2"
                            rx="4"
                        />
                        <text
                            x={spineEndX + 25 + headSize / 2}
                            y={centerY}
                            fill="#00E599"
                            fontSize="12"
                            fontWeight="600"
                            textAnchor="middle"
                            dominantBaseline="middle"
                        >
                            {fishbone.problemStatement.slice(0, 30) || 'Problem'}
                        </text>

                        {/* Top bones */}
                        {topCategories.map((cat, idx) => renderBone(cat, idx, true))}

                        {/* Bottom bones */}
                        {bottomCategories.map((cat, idx) => renderBone(cat, idx, false))}
                    </svg>
                </Box>
            </Paper>
            {/* Category Selection & Cause Management */}
            <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Add Causes to Categories
                </Typography>
                <Stack spacing={2}>
                    {/* Category selector */}
                    <Stack direction="row" spacing={1} useFlexGap sx={{
                        flexWrap: "wrap"
                    }}>
                        {fishbone.categories.map((cat) => (
                            <Button
                                key={cat.id}
                                variant={selectedCategory === cat.id ? 'contained' : 'outlined'}
                                size="small"
                                onClick={() => setSelectedCategory(cat.id)}
                                sx={{
                                    borderColor: cat.color,
                                    color: selectedCategory === cat.id ? '#0A0A0A' : cat.color,
                                    bgcolor: selectedCategory === cat.id ? cat.color : 'transparent',
                                    '&:hover': {
                                        bgcolor: selectedCategory === cat.id ? cat.color : `${cat.color}20`,
                                        borderColor: cat.color,
                                    },
                                }}
                            >
                                {cat.label} ({cat.causes.length})
                            </Button>
                        ))}
                    </Stack>

                    {/* Selected category causes */}
                    {selectedCategory && (
                        <Paper variant="outlined" sx={{ p: 2 }}>
                            {(() => {
                                const category = fishbone.categories.find(c => c.id === selectedCategory);
                                if (!category) return null;

                                return (
                                    <Stack spacing={2}>
                                        <Typography variant="body2" color={category.color} sx={{
                                            fontWeight: 600
                                        }}>
                                            {category.label} - Contributing Causes
                                        </Typography>
                                        {/* Existing causes */}
                                        {category.causes.length > 0 ? (
                                            <Stack spacing={1}>
                                                {category.causes.map((cause) => (
                                                    <Stack
                                                        key={cause.id}
                                                        direction="row"
                                                        sx={{
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            p: 1,
                                                            bgcolor: 'background.paper',
                                                            borderRadius: 1,
                                                            borderLeft: 2,
                                                            borderColor: category.color
                                                        }}>
                                                        <Typography variant="body2">{cause.text}</Typography>
                                                        {!disabled && (
                                                            <IconButton
                                                                size="small"
                                                                onClick={() => removeCause(category.id, cause.id)}
                                                                color="error"
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        )}
                                                    </Stack>
                                                ))}
                                            </Stack>
                                        ) : (
                                            <Alert severity="info" sx={{ py: 1 }}>
                                                No causes added yet. Add your first cause below.
                                            </Alert>
                                        )}
                                        {/* Add new cause */}
                                        {!disabled && (
                                            <Stack direction="row" spacing={1}>
                                                <TextField
                                                    size="small"
                                                    fullWidth
                                                    value={newCauseText}
                                                    onChange={(e) => setNewCauseText(e.target.value)}
                                                    placeholder={`Add a cause to ${category.label}...`}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            addCause(category.id, newCauseText);
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    startIcon={<Add />}
                                                    onClick={() => addCause(category.id, newCauseText)}
                                                    disabled={!newCauseText.trim()}
                                                    sx={{
                                                        bgcolor: category.color,
                                                        color: '#0A0A0A',
                                                        '&:hover': { bgcolor: category.color, opacity: 0.9 },
                                                    }}
                                                >
                                                    Add
                                                </Button>
                                            </Stack>
                                        )}
                                    </Stack>
                                );
                            })()}
                        </Paper>
                    )}
                </Stack>
            </Box>
            {/* Validation hints */}
            {!fishbone.problemStatement.trim() && (
                <Alert severity="info">
                    Start by describing the problem statement clearly
                </Alert>
            )}
            {fishbone.problemStatement.trim() && !selectedCategory && (
                <Alert severity="info">
                    Select a category above to start adding causes
                </Alert>
            )}
        </Stack>
    );
}
