/**
 * @fileoverview Main RCA & Fishbone Section Container
 */

'use client';

import { Save } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Stack,
    Tab,
    Tabs,
    alpha,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { RCASummaryTab } from './RCASummaryTab';
import type { RCAAnalysis, FishboneAnalysis } from './types';
import {
    parseRCAAnalysis,
    parseFishboneAnalysis,
    createEmptyRCA,
    createEmptyFishbone,
    validateRCA,
} from './utils';

interface RCAFishboneSectionProps {
    investigationId: number;
    initialRCA?: string | null;
    initialFishbone?: string | null;
    onSave?: (rca: string | null, fishbone: string | null) => Promise<void>;
    disabled?: boolean;
}

export function RCAFishboneSection({
    investigationId,
    initialRCA,
    initialFishbone,
    onSave,
    disabled = false,
}: RCAFishboneSectionProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [rca, setRca] = useState<RCAAnalysis>(() =>
        parseRCAAnalysis(initialRCA) || createEmptyRCA()
    );
    const [fishbone, setFishbone] = useState<FishboneAnalysis>(() =>
        parseFishboneAnalysis(initialFishbone) || createEmptyFishbone()
    );
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Track changes
    useEffect(() => {
        const currentRCA = JSON.stringify(rca);
        const currentFishbone = JSON.stringify(fishbone);
        const initialRCAStr = initialRCA || JSON.stringify(createEmptyRCA());
        const initialFishboneStr = initialFishbone || JSON.stringify(createEmptyFishbone());

        setHasChanges(currentRCA !== initialRCAStr || currentFishbone !== initialFishboneStr);
    }, [rca, fishbone, initialRCA, initialFishbone]);

    const handleSave = async () => {
        if (!onSave) return;

        // Validate RCA
        const validation = validateRCA(rca);
        if (!validation.valid) {
            setSaveError(validation.errors.join(', '));
            return;
        }

        setSaving(true);
        setSaveError(null);

        try {
            const rcaStr = JSON.stringify(rca);
            const fishboneStr = JSON.stringify(fishbone);
            await onSave(rcaStr, fishboneStr);
            setHasChanges(false);
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : 'Failed to save analysis');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader
                title="Advanced Analysis"
                subheader="Root Cause Analysis and Fishbone Diagram"
                sx={{
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    color: 'primary.main',
                    borderBottom: 1,
                    borderColor: 'primary.main',
                }}
                action={
                    hasChanges && !disabled && (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<Save />}
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? 'Saving...' : 'Save Analysis'}
                        </Button>
                    )
                }
            />
            <CardContent>
                <Stack spacing={3}>
                    {saveError && (
                        <Alert severity="error" onClose={() => setSaveError(null)}>
                            {saveError}
                        </Alert>
                    )}

                    {/* Tab Navigation */}
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                            <Tab label="📋 RCA Summary" />
                            <Tab label="🦴 Fishbone Diagram" disabled />
                        </Tabs>
                    </Box>

                    {/* Tab Content */}
                    {activeTab === 0 && (
                        <RCASummaryTab
                            rca={rca}
                            onChange={setRca}
                            disabled={disabled}
                        />
                    )}

                    {activeTab === 1 && (
                        <Alert severity="info">
                            Fishbone diagram coming in next phase
                        </Alert>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
